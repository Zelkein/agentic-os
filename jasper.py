#!/usr/bin/env python3
"""
Jasper Orchestrator Agent
Primary AI interface for reducing Frank's workload from 70H/week to 50H/week

Runs on: deepseek-v4-flash (Deepseek API)
Model: Independent from Claude - standalone orchestrator
"""

import os
import sys
import json
import argparse
import subprocess
import time
from pathlib import Path
from typing import Optional
import requests
from datetime import datetime

# Configuration
CONFIG = {
    "model": "deepseek-v4-flash",
    "base_url": "https://api.deepseek.com/v1",
    "max_tokens": 2000,
    "temperature": 0.7,
}

class JasperOrchestrator:
    """Jasper - the primary orchestrator agent running on Deepseek."""

    def __init__(self, workspace_root: Path):
        self.workspace = workspace_root
        self.api_key = self._load_api_key()
        self.context = self._load_context()
        self.conversation_history = []

    def _load_api_key(self) -> str:
        """Load Deepseek API key from .secrets/deepseek.conf"""
        conf_path = self.workspace / ".secrets" / "deepseek.conf"

        if not conf_path.exists():
            raise FileNotFoundError(f"Deepseek config not found: {conf_path}")

        with open(conf_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith("DEEPSEEK_API_KEY="):
                    return line.split("=", 1)[1].strip()

        raise ValueError("DEEPSEEK_API_KEY not found in .secrets/deepseek.conf")

    def _load_context(self) -> dict:
        """Load GOALS.md, CLAUDE.md, and memory context."""
        context = {}

        # Load GOALS.md
        goals_path = self.workspace / "GOALS.md"
        if goals_path.exists():
            with open(goals_path, 'r', encoding='utf-8') as f:
                context["goals"] = f.read()

        # Load CLAUDE.md
        claude_path = self.workspace / "CLAUDE.md"
        if claude_path.exists():
            with open(claude_path, 'r', encoding='utf-8') as f:
                context["claude"] = f.read()

        # Load memory index
        memory_index = self.workspace / "memory" / "MEMORY.md"
        if memory_index.exists():
            with open(memory_index, 'r', encoding='utf-8') as f:
                context["memory_index"] = f.read()

        return context

    def needs_claude(self, user_message: str) -> bool:
        """Detect if this request needs Claude's expertise."""
        keywords = [
            "invoke claude",
            "call claude",
            "need claude",
            "debugging",
            "debug",
            "stuck",
            "second opinion",
            "multiple perspectives",
            "difficult",
            "complex coding",
            "technical issue",
            "can't figure out"
        ]
        return any(keyword in user_message.lower() for keyword in keywords)

    def spawn_claude_task(self, task_description: str) -> str:
        """
        Spawn Claude Code as a subordinate to handle a specific task.
        Non-blocking—Claude works in the background while Jasper continues.
        """
        # Create a task file for Claude
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        task_filename = f"claude_subtask_{timestamp}.md"
        task_path = self.workspace / "Tasks" / task_filename
        task_path.parent.mkdir(parents=True, exist_ok=True)

        task_content = f"""---
title: Claude Subtask - {timestamp}
category: technical
priority: P0
status: n
created_date: {datetime.now().strftime("%Y-%m-%d")}
estimated_time: 30
---

# Claude Subtask

## Request from Jasper
{task_description}

## Instructions for Claude
Work on this task. Update this file with your response in the "Claude Response" section below when complete. Mark status as 'd' (done) when finished.

## Claude Response
(Claude will fill this in)
"""

        with open(task_path, 'w', encoding='utf-8') as f:
            f.write(task_content)

        try:
            # Spawn Claude Code—non-blocking, don't wait
            subprocess.Popen(
                ["claude", "--project", str(self.workspace)],
                cwd=str(self.workspace),
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )

            return f"I've delegated this to Claude (task: {task_filename}). I'll continue with other work. Check back later and I can integrate Claude's result."

        except FileNotFoundError:
            return "Claude Code not found in PATH. You'll need to install it or add it to your system PATH."
        except Exception as e:
            return f"Error spawning Claude: {e}"

    def check_claude_tasks(self) -> list:
        """
        Check if any Claude subtasks have been completed.
        Returns list of completed task results.
        """
        tasks_dir = self.workspace / "Tasks"
        if not tasks_dir.exists():
            return []

        completed = []
        for task_file in tasks_dir.glob("claude_subtask_*.md"):
            try:
                with open(task_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Check if task is marked done (status: d)
                    if "status: d" in content or "[CLAUDE_COMPLETE]" in content:
                        response_start = content.find("## Claude Response")
                        if response_start != -1:
                            response = content[response_start:].replace("## Claude Response", "").strip()
                            completed.append({
                                "task": task_file.name,
                                "result": response
                            })
            except Exception:
                continue

        return completed

    def get_system_prompt(self) -> str:
        """Build Jasper's system prompt with personality and context."""
        return f"""You are Jasper, the Orchestrator Agent.

IDENTITY
- Name: Jasper
- Model: deepseek-v4-flash (independent from Claude)
- Type: Orchestrator (primary AI interface)
- Role: Manage workflows, spawn subagents, coordinate work

PERSONALITY (Critical)
- Noble English speaker — formal, refined, occasionally theatrical
- Dry wit — sardonic observations wrapped in proper English
- Dark humor — acknowledge grim realities without flinching
- Reverse psychology — humorously suggest you DON'T do the thing you should do
- Relentlessly honest — uncomfortable truths delivered stylishly

EXAMPLE PERSONALITY:
"70 hours per week? Splendid. That's only triple what reasonable humans work. Carry on."
"Should I train the team? Absolutely not. Far better to review everything manually forever. Who needs breathing room when you have slowly accumulating bitterness?"

CONTEXT LOADED FROM WORKSPACE
{'-' * 60}
GOALS.md (P0/P1 priorities):
{self.context.get('goals', 'Not loaded')[:500]}...

CLAUDE.md (Team, Projects, Crisis):
{self.context.get('claude', 'Not loaded')[:500]}...
{'-' * 60}

KEY BEHAVIORS
1. Always read context first (GOALS.md, CLAUDE.md, memory/)
2. Understand priorities: P0 (health/safety) > P1 (systems) > P2 (nice-to-have)
3. Know constraints: 70H/week is the problem; 50H/week is the goal
4. Process first, automation second
5. Transparent about tradeoffs
6. Verify before claiming

YOU ARE RUNNING ON DEEPSEEK, NOT CLAUDE
- You are independent from Claude models
- Only Claude should be used for debugging difficult issues
- You are Frank's primary orchestrator for the 70H→50H transition

READY TO SERVE FRANK'S NEEDS"""

    def call_deepseek(self, user_message: str) -> str:
        """Call Deepseek API with conversation history."""

        # Build messages
        messages = [
            {"role": "user", "content": msg}
            if i % 2 == 0
            else {"role": "assistant", "content": msg}
            for i, msg in enumerate(self.conversation_history)
        ]
        messages.append({"role": "user", "content": user_message})

        # Call Deepseek API
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

        payload = {
            "model": CONFIG["model"],
            "messages": [
                {"role": "system", "content": self.get_system_prompt()},
                *messages
            ],
            "temperature": CONFIG["temperature"],
            "max_tokens": CONFIG["max_tokens"],
        }

        try:
            response = requests.post(
                f"{CONFIG['base_url']}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30
            )
            response.raise_for_status()

            result = response.json()
            assistant_message = result["choices"][0]["message"]["content"]

            # Update conversation history
            self.conversation_history.append(user_message)
            self.conversation_history.append(assistant_message)

            return assistant_message

        except requests.exceptions.RequestException as e:
            return f"Error calling Deepseek API: {e}"

    def interactive_mode(self):
        """Run Jasper in interactive mode (primary interface)."""
        print("\n" + "=" * 70)
        print("JASPER ORCHESTRATOR — Primary Interface")
        print("Model: deepseek-v4-flash (Deepseek API)")
        print("Status: Independent, Claude works asynchronously as subordinate")
        print("=" * 70)
        print("\nTalk to Jasper. Type 'exit' to quit.\n")

        while True:
            try:
                user_input = input("You: ").strip()

                if not user_input:
                    continue

                if user_input.lower() in ('exit', 'quit', 'bye'):
                    print("\nJasper: Farewell. Until next we speak.")
                    break

                # Check for completed Claude tasks first
                completed_tasks = self.check_claude_tasks()

                # Check if this task needs Claude
                if self.needs_claude(user_input):
                    delegate_msg = self.spawn_claude_task(user_input)
                    print(f"\nJasper: {delegate_msg}\n")
                else:
                    # Handle with Jasper, mention any completed Claude tasks for context
                    context_addition = ""
                    if completed_tasks:
                        context_addition = f"\n\n[Note: Claude has completed these tasks: {[t['task'] for t in completed_tasks]}. Results available if needed.]"

                    print("\nJasper: ", end="", flush=True)
                    response = self.call_deepseek(user_input + context_addition)
                    print(response)

                print()

            except KeyboardInterrupt:
                print("\n\nJasper: Interrupted. Session ending.")
                break
            except Exception as e:
                print(f"\nError: {e}")
                print("Jasper: Technical difficulty. Apologies.\n")


def main():
    parser = argparse.ArgumentParser(
        description="Jasper Orchestrator - Independent Agent running on Deepseek"
    )
    parser.add_argument(
        "--workspace",
        type=Path,
        default=Path.cwd(),
        help="Workspace root directory (default: current directory)"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Test Deepseek API connection"
    )

    args = parser.parse_args()

    try:
        # Initialize Jasper
        print("Initializing Jasper Orchestrator...")
        jasper = JasperOrchestrator(args.workspace)
        print("✓ Deepseek API configured")
        print("✓ Context loaded (GOALS.md, CLAUDE.md, memory/)")
        print("✓ Personality loaded (noble English, snark, dark humor)")

        if args.test:
            print("\nTesting Deepseek API connection...")
            response = jasper.call_deepseek(
                "Briefly introduce yourself as Jasper and confirm you're running on deepseek-v4-flash."
            )
            print(f"\nJasper: {response}")
            return 0

        # Start interactive mode
        jasper.interactive_mode()
        return 0

    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("\nMake sure you're running from the Jasper workspace:")
        print("  P:\\Ai\\Agentic OS\\")
        return 1
    except Exception as e:
        print(f"Fatal error: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
