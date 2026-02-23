---
trigger: "when managing project state or committing work"
confidence: 0.7
domain: "git"
created: "2026-02-23T11:00:17Z"
source: "observation"
last_validated: "2026-02-23T11:00:17Z"
---

# Git Commands as Workflow Checkpoint

## Action
Git commands appear in ~321 bash operations (32% of bash work). This is expected high frequency and indicates good checkpoint discipline. Keep using `git status`, `git log`, `git add/commit` as workflow milestones — after major sections, after passing tests, before context windows grow large.

## Evidence
- 321 git-related bash operations (out of 952 total bash commands)
- Distributed throughout sessions, not clustered at start/end
- Pattern: git status checks frequently between reads/edits
- Supports commit-per-task discipline documented in CLAUDE.md
- No force-push or destructive operations observed — good safety
