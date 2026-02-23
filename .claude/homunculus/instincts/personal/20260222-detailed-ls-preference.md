---
trigger: "when listing directory contents"
confidence: 0.6
domain: "tooling"
created: "2026-02-22T00:00:00Z"
source: "observation"
last_validated: "2026-02-22T00:00:00Z"
---

# Detailed LS Preference

## Action
Prefer `ls -la` over plain `ls` when exploring directories. Detailed output (permissions, timestamps, sizes) is more useful than simple listings.

## Evidence
- 5 observations of `ls -la` usage
- Consistent with cautious exploration approach
- Shows desire for full metadata when validating directory state
