---
trigger: "when beginning codebase analysis or plan consultation"
confidence: 0.75
domain: "file-organization"
created: "2026-02-22T00:00:00Z"
source: "observation"
last_validated: "2026-02-22T00:00:00Z"
---

# Exploration Workflow

## Action
Follow this sequence for codebase understanding:
1. Read plan/design doc (e.g., claude-plan.md or phase implementation plan)
2. Find related source files (grep for patterns or find by path)
3. Read key files (store, types, components)
4. Find tests for those files
5. Read test files to understand contracts

## Evidence
- 37 reads of claude-plan.md in isolation
- Pattern of find → read → find → read in last 500 observations
- Plan docs are consulted before diving into implementation
- Tests read frequently after code exploration (contract validation)
- Heavy reliance on docs/plans/ directory for context
