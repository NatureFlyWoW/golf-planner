---
trigger: "when editing any file"
confidence: 0.95
domain: "code-style"
created: "2026-02-22T00:00:00Z"
source: "observation"
last_validated: "2026-02-23T11:00:17Z"
---

# Read Before Edit

## Action
Always read the entire file with Read tool before calling Edit tool. Never edit without first understanding the current state.

## Evidence
- 460 out of 472 edits (97.5%) preceded by Read of the same file
- 1453 Read observations vs 472 Edit observations (3.1:1 ratio)
- Read-before-Edit compliance: 97.5% across 5024 total observations
- Files modified are always from golf-planner project (specific paths)
- Ensures context accuracy before making changes
- **Validation 2026-02-23**: Confirmed with large observation set (460/472 compliance)
