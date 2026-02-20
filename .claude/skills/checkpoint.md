---
name: checkpoint
description: Use when context window is growing large mid-session, after completing 3+ tasks in a batch, or before starting a risky operation that could fail
---

# Checkpoint — Mid-Session State Snapshot

## Purpose

Create a lightweight checkpoint file that captures the current state of work in progress. Unlike `/handoff` (which is for session end), `/checkpoint` is for mid-session state preservation — use it proactively when context is growing large, after completing a batch of tasks, or every 3 completed tasks as noted in project conventions.

## When to Use

- After completing 3+ tasks in a batch
- When context window is growing large (~40-60% capacity)
- Before starting a risky or complex operation
- When the user asks for a checkpoint
- Periodically during long subagent orchestration sessions

## Execution Steps

### 1. Set Up Environment

Source fnm in every Bash call:

```bash
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
```

### 2. Determine Timestamp

Get the current date and time for the checkpoint filename. Use this format:

```bash
date '+%Y-%m-%d-%H%M'
```

This produces filenames like `checkpoint-2026-02-20-1430.md`.

### 3. Gather Git State

Run these commands from the `golf-planner/` directory:

```bash
git log --oneline -10        # Recent commits
git branch --show-current    # Current branch
git status --short           # Working tree status
```

If a previous checkpoint exists in `docs/checkpoints/`, identify commits since that checkpoint by comparing timestamps or commit hashes. Otherwise, show the last 10 commits.

### 4. Run Tests

```bash
cd golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npm test -- --run 2>&1 | tail -5
```

Extract the pass/fail count from the output.

### 5. Check Types

```bash
cd golf-planner && export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)" && npx tsc --noEmit 2>&1 | tail -5
```

Report "clean" if no errors, or the error count if there are issues.

### 6. Capture Task Progress

Check the current implementation plan (look in `docs/plans/` for the active plan index). Identify which tasks are done, in progress, and remaining based on:

- Recent commits and their messages
- Any task files in `docs/plans/`
- The current working context

### 7. Ensure Output Directory Exists

```bash
mkdir -p docs/checkpoints
```

This directory is at the project root (`/mnt/c/Users/Caus/Golf_Plan/docs/checkpoints/`), NOT inside `golf-planner/`.

### 8. Write the Checkpoint File

Save to `docs/checkpoints/checkpoint-{YYYY-MM-DD-HHMM}.md` using the template below.

### 9. Do NOT Commit

Checkpoints are lightweight snapshots. Do not create a git commit for them. They will be included in the next meaningful commit or ignored.

## Checkpoint File Template

```markdown
# Checkpoint — {YYYY-MM-DD} {HH:MM}

## Since Last Checkpoint
- [{short hash}] {commit message}
- [{short hash}] {commit message}
- ...

## Task Progress
- [x] Task 1: {description}
- [x] Task 2: {description}
- [ ] Task 3: {description} (in progress -- current)
- [ ] Task 4: {description} (pending)

## Test Status
- **Passing**: {N} tests
- **Failing**: {N} tests ({details if any})
- **Type check**: {clean / N errors}

## Current Context
- **Branch**: {branch name}
- **Plan file**: {path to active plan index}
- **Working on**: Task {N} -- {brief description}

## Blockers / Notes
- {any issues, decisions needed, or observations}
- {context that would be useful if session is interrupted}
```

## Rules

1. **Be fast.** This should complete in under 30 seconds. Do not do deep code analysis or exploration.
2. **Be accurate.** Report actual test counts and commit hashes, not estimates.
3. **Be useful.** The checkpoint should contain enough context for a new session to pick up exactly where this one left off.
4. **No commit.** Never commit the checkpoint file automatically.
5. **No push.** Never push after creating a checkpoint.
6. **Indentation.** Use spaces, not tabs, in the checkpoint file.
7. **Previous checkpoints.** Check `docs/checkpoints/` for the most recent checkpoint to determine "since last checkpoint" commits. If none exists, use the last 10 commits.
8. **Parallel execution.** Run git log, tests, and tsc in parallel where possible to minimize wall-clock time.
