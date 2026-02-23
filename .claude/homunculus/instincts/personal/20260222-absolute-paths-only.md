---
trigger: "when specifying file or directory paths in commands"
confidence: 0.95
domain: "file-organization"
created: "2026-02-22T00:00:00Z"
source: "observation"
last_validated: "2026-02-23T11:00:17Z"
---

# Absolute Paths Only

## Action
Always use absolute paths when invoking Bash commands and file tools. Never rely on relative paths or cd operations. Primary pattern: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/`

## Evidence
- 99+ observations of absolute paths to golf-planner files
- Zero observations of cd followed by relative path usage
- 1453 Read + 472 Edit operations using absolute paths consistently
- Only 8 cd operations observed in 952 bash commands (0.8%) — unusual, intentional
- WSL2 environment with multiple working directory resets between bash calls
- Agent instructions explicitly mandate absolute paths
- **Validation 2026-02-23**: Confirmed across entire observation set with 100% compliance
