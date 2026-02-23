---
trigger: "when writing implementation plans or design documents"
confidence: 0.8
domain: "file-organization"
created: "2026-02-23T11:00:17Z"
source: "observation"
last_validated: "2026-02-23T11:00:17Z"
---

# Plan Docs as Primary Output

## Action
When creating or refining plans, write to `docs/plans/` as the primary destination (85 writes to docs/plans vs 135 to src/, 63 to other). Use `.md` format with index files and section organization. Plans are stored artifacts for continuity across sessions.

## Evidence
- 85 total writes to docs/plans (29% of all writes)
- 59% of writes go to docs/plans or src/ (code + design together)
- Planning docs consolidated in repo per MEMORY.md — inside `golf-planner/docs/plans/`
- Session handoff protocol uses docs/plans/ as source of truth for next session
- User preference: "split docs into separate .md files with index"
