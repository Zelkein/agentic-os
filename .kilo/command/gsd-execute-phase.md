---
description: Execute a GSD phase — auto-runs all plans in the active phase
agent: jasper
model: deepseek/deepseek-v4-flash
subtask: true
---
Execute the current GSD phase ($1 if specified, otherwise the active phase).

Steps:
1. Read the phase plan from projects/briefs/ and .planning/
2. Execute all planned tasks in order
3. Report progress after each task
4. Flag any blockers immediately
5. Create ClickUp tasks for deliverables
