---
name: handoff
description: Use when ending a work session, when context window is growing too large, or when a major milestone is complete and state needs to be preserved for the next session
---

# Session Handoff — Automated State Capture

## Overview

This skill automates session handoff when ending a work session or when context is growing too large. It captures the full project state so the next session can pick up seamlessly without any lost context.

## When This Skill Activates

**Manually** when the user says: `/handoff`, "session handoff", "end session", "save state", or "hand off".

**Proactively suggest** (but do not auto-activate) when:
- Context window appears to be growing large (60%+ capacity)
- A major phase or milestone has been completed
- Multiple tasks have been done without a handoff

## Environment Setup

Every Bash command in this skill MUST be prefixed with the fnm environment setup:

```bash
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
```

The git repository and npm project live in `golf-planner/` subdirectory. All git and npm commands must run from there.

## Step-by-Step Procedure

### Step 1 — Gather Git State

Run the following commands from `golf-planner/`:

```bash
git log --oneline -15
git status
git branch -v
git stash list
```

Capture all output for use in the handoff document.

### Step 2 — Summarize Completed Work

From the git log, identify commits made during this session. Use timestamps and context from the conversation to determine which commits belong to the current session.

For each commit, note:
- Short hash
- Commit message
- What it accomplished (brief, one line)

If no commits were made this session, note that and describe any uncommitted work in progress.

### Step 3 — Capture Current State

Run the test suite and build check from `golf-planner/`:

```bash
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npm run test -- --run 2>&1 | tail -20
```

```bash
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npm run build 2>&1 | tail -10
```

```bash
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc --noEmit 2>&1 | tail -20
```

Record:
- Number of tests passing/failing
- Build status (passing/failing, any warnings)
- TypeScript type-check status

### Step 4 — Identify Remaining Work

Read the current implementation plan. Check these locations in order:
1. `docs/plans/` — look for the most recent implementation index file
2. `golf-planner/docs/plans/` — inner copies
3. Any plan file referenced in `CLAUDE.md` or `MEMORY.md`

List remaining tasks that have not been completed, referencing the plan file by name.

### Step 5 — Note Blockers and Issues

Document any of the following observed during the session:
- Failed tests (with brief description)
- Build warnings or errors
- Environment issues (WSL, fnm, permissions)
- Known bugs introduced or discovered
- Technical debt identified
- Anything the next session should be aware of

If there are no issues, explicitly state "No known issues or blockers."

### Step 6 — Write the Handoff File

Write the gathered information to `docs/session-handoff.md` (at the project root, NOT inside golf-planner/). Use the exact template below, filling in all sections.

**File: `/mnt/c/Users/Caus/Golf_Plan/docs/session-handoff.md`**

```markdown
# Session Handoff — YYYY-MM-DD

## Completed This Session
- `abc1234` feat: description of what was done
- `def5678` fix: description of what was fixed
- (or "No commits this session. Work in progress: [description]")

## Current State
- **Branch**: [branch name]
- **Working tree**: clean / dirty ([list changed files if dirty])
- **Stash**: empty / [number] entries ([brief description])
- **Tests**: X passing, Y failing ([list failures if any])
- **Build**: passing / failing ([details if failing])
- **Type check**: passing / failing ([details if failing])
- **Remote sync**: up to date / [N] commits ahead of origin

## Remaining Work
- **Plan file**: [path to current implementation plan]
- **Current phase**: [phase name/number]
- [ ] Task N: description (NEXT UP)
- [ ] Task N+1: description
- [ ] ...
- (or "All planned phases complete. See [plan file] for future ideas.")

## Known Issues / Blockers
- [issue description and any context]
- (or "No known issues or blockers.")

## Environment Notes
- [Any env-specific notes the next session needs]
- fnm must be sourced: `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"`
- Git configured in golf-planner/ (user: Golf Planner Dev)
- [Any other session-specific env notes]

## Conversation Context
- [Brief summary of what was discussed/decided this session beyond code changes]
- [Any user preferences or decisions that should carry forward]
```

### Step 7 — Commit the Handoff

Commit the handoff file from `golf-planner/` (the git root):

```bash
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && git add ../docs/session-handoff.md && git commit -m "docs: session handoff for [brief description of current work]"
```

Replace `[brief description of current work]` with a short summary (e.g., "phase 4 polish", "budget tracker", "mobile PWA").

If there are other uncommitted changes that should be committed first, ask the user before proceeding.

## Behavioral Rules

1. **Be thorough but concise.** Every section must be filled in, but keep descriptions to one line each. The handoff should be scannable in 30 seconds.

2. **Never fabricate state.** Every piece of information must come from actual command output. If a command fails, note the failure rather than guessing.

3. **Preserve history.** If a previous `session-handoff.md` exists, the new one replaces it entirely. The git history preserves old handoffs.

4. **Ask before committing dirty work.** If the working tree has uncommitted changes beyond the handoff file itself, ask the user whether to commit, stash, or leave them before creating the handoff commit.

5. **Include the commit in the handoff.** After committing, note the handoff commit hash at the very top of the "Completed This Session" section by amending or noting it in the output.

6. **Update MEMORY.md if needed.** If implementation status has changed (new phase complete, new issues discovered), suggest updating the relevant sections of `MEMORY.md` but do not modify it without user confirmation.

## User Commands

- **`/handoff`** — Run the full handoff procedure
- **`/handoff quick`** — Skip test/build checks, just git state + summary
- **`/handoff --no-commit`** — Write the file but do not commit it
