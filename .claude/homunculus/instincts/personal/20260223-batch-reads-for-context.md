---
trigger: "when understanding a new feature area or refactoring scope"
confidence: 0.65
domain: "debugging"
created: "2026-02-23T11:00:17Z"
source: "observation"
last_validated: "2026-02-23T11:00:17Z"
---

# Batch Reads to Build Context

## Action
Read 2-3 related files in sequence (Read → Read → Read pattern) to build context before making edits. This pattern appears 599 times (strong signal). Helps avoid partial understanding and reduces rework. Always read the component, its types/interfaces, and store/hook dependencies before editing.

## Evidence
- Read → Read → Read appears 599 times (11.9% of all 3-observation sequences)
- Followed by either more Reads or Edits
- Read-before-Edit compliance: 97.5% of edits have prior read of same file
- Read → Read → Grep sequence: 96 times — pattern of reading then searching for refinement
- Indicates deliberate context-building before implementation
