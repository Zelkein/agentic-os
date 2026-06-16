#!/usr/bin/env python3
"""
Jasper as Claude Code Primary Agent
Runs Jasper as the active agent interface within Claude Code
"""

import os
import sys
from pathlib import Path
from jasper import JasperOrchestrator

def main():
    """Launch Jasper as primary agent in Claude Code"""

    workspace = Path.cwd()

    try:
        print("\n" + "=" * 70)
        print("JASPER ORCHESTRATOR — Active Agent")
        print("Model: deepseek-v4-flash (Independent)")
        print("=" * 70 + "\n")

        jasper = JasperOrchestrator(workspace)
        jasper.interactive_mode()

    except KeyboardInterrupt:
        print("\n\nJasper: Session terminated.")
        sys.exit(0)
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)

if __name__ == "__main__":
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    main()
