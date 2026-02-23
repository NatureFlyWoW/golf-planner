---
trigger: "when searching for patterns across multiple files"
confidence: 0.65
domain: "debugging"
created: "2026-02-22T00:00:00Z"
source: "observation"
last_validated: "2026-02-22T00:00:00Z"
---

# Grep Over Find for Large Search

## Action
When searching for code patterns or specific strings across files, use Grep tool instead of find + read loops. Grep is more efficient for content search.

## Evidence
- 7 Grep observations in tool usage
- Appears in later workflow observations (suggesting learned improvement)
- Efficient for finding usage patterns in codebase
- Preferred over iterative find + read when searching by content
