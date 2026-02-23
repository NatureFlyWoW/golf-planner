---
trigger: "when running build/test/dev server commands"
confidence: 0.6
domain: "tooling"
created: "2026-02-23T11:00:17Z"
source: "observation"
last_validated: "2026-02-23T11:00:17Z"
---

# NPM Commands Used Sparingly

## Action
NPM commands are infrequent (51 out of 952 bash operations, ~5%). This is intentional: dev server runs continuously in background, tests run via PostToolUse hook, builds done only at end. Use npm deliberately for specific tasks, not as a continuous loop.

## Evidence
- Only 51 npm-related bash commands across entire observation set
- Contrasted with 321 git commands (6.4x more frequent)
- 246 ls/find operations for file discovery (not npm-dependent)
- Indicates efficient, focused npm usage rather than constant rebuild/test cycles
- Aligns with PostToolUse hook that auto-runs `npx tsc --noEmit` after edits
