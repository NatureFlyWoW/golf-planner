---
trigger: "when writing or editing source files"
confidence: 0.9
domain: "code-style"
created: "2026-02-22T00:00:00Z"
source: "MEMORY.md"
last_validated: "2026-02-22T00:00:00Z"
---

# Biome Uses Tabs for Indentation

## Action
Always use tabs (not spaces) for indentation in all source files. Biome will reject spaces and the pre-commit hook will fail.

## Evidence
- Documented in MEMORY.md: "Biome uses tabs for indentation"
- Biome also auto-sorts imports alphabetically — don't fight import order
