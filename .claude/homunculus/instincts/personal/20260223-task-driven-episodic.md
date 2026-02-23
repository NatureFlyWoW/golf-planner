---
trigger: "when managing complex multi-task work"
confidence: 0.65
domain: "communication"
created: "2026-02-23T11:00:17Z"
source: "observation"
last_validated: "2026-02-23T11:00:17Z"
---

# Task-Driven Episodic Workflow

## Action
Task/TaskUpdate/TaskList operations comprise 14.5% of observations (729 out of 5024). Use TaskUpdate for status checkpoints between major sections (e.g., after 5-10 tool operations). Use Task tool to spawn subagents for parallelizable work. Never let task management dominate — tools should be 85%+, tasks should be ~15%.

## Evidence
- 620 TaskUpdate observations — frequent status reporting
- 79 Task observations — moderate subagent spawning
- 30 TaskList observations — planning/tracking
- Ratio suggests episodic work: short bursts of tool use (reads, edits, tests) punctuated by status updates
- Supports subagent-driven development preference documented in CLAUDE.md
