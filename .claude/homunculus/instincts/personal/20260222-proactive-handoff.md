---
trigger: "when context window is growing large (60%+ capacity)"
confidence: 0.9
domain: "communication"
created: "2026-02-22T00:00:00Z"
source: "MEMORY.md + CLAUDE.md"
last_validated: "2026-02-22T00:00:00Z"
---

# Proactive Context Compaction

## Action
At ~60% context capacity, suggest handoff. At 80-85%, do /handoff before auto-compact hits. Write checkpoint every 3 completed tasks. Write handoff note to docs/session-handoff.md with: completed tasks, current branch, next steps, known issues.

## Evidence
- MEMORY.md: "Proactive compaction at 80-85% — do /handoff before auto-compact hits"
- CLAUDE.md: "After every 3 completed tasks, write a checkpoint"
- CLAUDE.md: "When context exceeds ~60% capacity, run /handoff"
