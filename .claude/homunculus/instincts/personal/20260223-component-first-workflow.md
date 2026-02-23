---
trigger: "when starting a new feature or refactoring task"
confidence: 0.75
domain: "file-organization"
created: "2026-02-23T11:00:17Z"
source: "observation"
last_validated: "2026-02-23T11:00:17Z"
---

# Component-First Workflow

## Action
Start by reading/analyzing `src/components/` (or its three/ or ui/ subdirs) before reading other parts of the system. Components are the primary unit of work — 45% of reads and 48% of edits target components. After understanding the component, move to related types/utils/store slices.

## Evidence
- Components directory: 499 reads (34% of all reads), 226 edits (48% of all edits)
- Consistent pattern: when implementing a feature, reading components always precedes reads of types, utils, or store
- Second-most common pattern is documentation reads (358 reads, 24%) — typically after understanding components
- This reflects the React-first, three-first architecture where components are the composable unit
