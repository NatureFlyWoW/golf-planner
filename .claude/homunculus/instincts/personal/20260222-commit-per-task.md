---
trigger: "when completing an implementation task"
confidence: 0.95
domain: "git"
created: "2026-02-22T00:00:00Z"
source: "CLAUDE.md"
last_validated: "2026-02-23T11:00:17Z"
---

# Commit Per Task

## Action
Commit immediately after each task passes tests. Never batch multiple tasks into one commit. Use conventional commits: feat:, fix:, refactor:, docs:. Never skip the pre-commit test hook — if tests fail, fix before committing.

## Evidence
- CLAUDE.md: "Commit-per-task discipline: commit immediately after each task passes tests — never batch multiple tasks into one commit"
- "Never skip the pre-commit test hook"
- 321 git-related bash operations across 952 total bash commands (32% of work is git-related)
- Git operations distributed throughout sessions, not clustered at end — indicates checkpoint discipline
- **Validation 2026-02-23**: Confirmed pattern of frequent git checkpoints in 5024 observations (321 git commands)
