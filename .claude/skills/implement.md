---
name: implement
description: Use when you have a written implementation plan and need to execute its tasks, especially multi-task plans requiring subagent orchestration and automated verification
---

# Implement — Subagent-Driven Plan Execution

## Overview

This skill orchestrates the execution of a written implementation plan. It reads the plan, dispatches subagents for each task, verifies with tests, commits per task, and handles failures with retries and fallbacks. It is the heaviest orchestration skill in this project.

## When This Skill Activates

- User says `/implement`, "implement this plan", "execute the plan", or "run the implementation"
- User provides a path to an implementation index file
- User says "start phase N" or "continue implementation"

## Environment

- **Vite project root:** `golf-planner/` (all npm/npx commands run here)
- **fnm must be sourced in every Bash call:**
  ```bash
  export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
  ```
- **Biome uses tabs** for indentation in source files
- **Implementation plans live in:** `docs/plans/` (both outer and `golf-planner/docs/plans/`)

---

## Phase 1: Setup

Before touching any code, establish the baseline.

### 1.1 Identify the Plan

- If the user provides a plan file path, use it directly.
- Otherwise, scan `docs/plans/` for the latest `*-implementation-index.md` file (sort by date prefix).
- Read the index file to understand: phase name, number of tasks, task file paths, and definition of done.

### 1.2 Load Prior Progress

- Read `golf-planner/docs/session-handoff.md` if it exists.
- Read the latest checkpoint in `golf-planner/docs/checkpoints/` if that directory exists.
- Cross-reference completed tasks from handoff/checkpoint against the plan's task list.
- Mark already-completed tasks so they are skipped.

### 1.3 Verify Baseline

Run these commands in `golf-planner/`:

```bash
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
cd golf-planner && git status
```

```bash
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
cd golf-planner && npx tsc --noEmit && npm test
```

- Confirm current branch (should be `master` unless user specifies otherwise).
- Confirm all existing tests pass. If they do not, **stop and report** -- do not begin implementation on a broken baseline.

### 1.4 Present Summary and Confirm

Present to the user:

```
Phase: [phase name]
Tasks: [total] ([done] already complete, [remaining] to execute)
Plan file: [path]
Branch: [current branch]
Baseline tests: [PASS/FAIL]

Tasks to execute:
  [ ] Task N: [title]
  [ ] Task N+1: [title]
  ...

Proceed? (y/n)
```

**Wait for user confirmation before beginning execution.** Do not start automatically.

---

## Phase 2: Execution Loop

For each incomplete task, in order:

### 2.1 Read the Task

- Read the specific task file referenced in the plan index.
- Extract the task text, acceptance criteria, and any file paths mentioned.

### 2.2 Dispatch Subagent

- Dispatch an implementer subagent using the Task tool.
- Provide the subagent with:
  - Full task text from the plan file
  - Relevant context: file paths to modify, types involved, conventions from CLAUDE.md
  - The fnm sourcing command
  - Instruction to commit when done using conventional commit format

**Agent type selection:**
- Default: Use **Explore** agent type to avoid MCP tool name conflicts.
- If MCP tools are not needed for the task, a general-purpose agent is acceptable.
- If the default agent type fails (tool conflict, capacity issue), fall back per Phase 3 rules.

### 2.3 Verify After Subagent Completes

After the subagent reports completion, run verification in the parent agent:

```bash
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
cd golf-planner && npx tsc --noEmit
```

```bash
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
cd golf-planner && npm test
```

- **TypeScript must compile cleanly** (`npx tsc --noEmit` exits 0).
- **All tests must pass** (`npm test` exits 0).
- **The subagent must have committed** (check `git log -1 --oneline` for a new commit).

### 2.4 Handle Verification Failure

If verification fails, enter the self-healing loop (see Phase 3). Do NOT move to the next task until the current task either passes or is explicitly skipped.

### 2.5 Update Progress

After a task passes verification:

- Log the result: task name, tests added, test count, commit hash.
- Increment the completed-task counter.
- After every 3 completed tasks, write a checkpoint:
  - Use `/checkpoint` skill if available, otherwise write manually to `golf-planner/docs/checkpoints/`.
- If context is growing large (more than ~8 tasks completed in this session), suggest a session split using `/handoff`.

---

## Phase 3: Self-Healing Rules

### 3.1 Test Failure Recovery (up to 3 attempts)

When `tsc --noEmit` or `npm test` fails after a subagent commit:

1. **Attempt 1:** Read the error output. Dispatch a fix-it subagent with the error text and the files that were modified. The fix-it subagent should:
   - Analyze the error
   - Apply a targeted fix
   - Run `npx tsc --noEmit && npm test` to confirm
   - Amend the previous commit (`git commit --amend`) or create a `fix:` commit

2. **Attempt 2:** If attempt 1 fails, read the error again. This time also read the original task text to check for misunderstanding. Dispatch a new subagent with both the task context and the accumulated errors.

3. **Attempt 3:** If attempt 2 fails, the parent agent (you) should fix the issue directly rather than delegating. Read the failing files, apply the fix, verify, and commit.

4. **After 3 failures:** Mark the task as BLOCKED with the error details. Move to the next independent task. Report the blocker to the user at the end.

### 3.2 Agent Type Fallback

If a subagent fails due to infrastructure issues (MCP tool conflict, agent type unavailable, timeout):

- First retry: Switch from the current agent type to **Explore** type.
- Second retry: Use a general-purpose agent with no MCP tools.
- Third retry: Execute the task directly in the parent agent (you) without delegating.

### 3.3 Context Management

- After every 3 completed tasks, write a checkpoint to `golf-planner/docs/checkpoints/`.
- If the conversation has processed 8+ tasks in a single session, proactively suggest:
  ```
  Context is growing large. Recommend running /handoff and continuing in a new session.
  Completed: [N] tasks. Remaining: [M] tasks.
  ```
- Have subagents write results to files rather than returning large payloads in conversation.
- Keep status updates brief -- one line per task, not verbose summaries.

### 3.4 Blocked Task Handling

If a task is blocked (dependency not met, unclear requirement, persistent failure):

- Skip the task.
- Record the blocker: task number, error or reason, files involved.
- Check if subsequent tasks depend on the blocked task. If they do, skip them too and note the dependency chain.
- Continue with the next independent task.
- Report all blocked tasks to the user during Phase 4 completion.

### 3.5 Escalation

Only escalate to the user (ask a question and wait) when:

- All 3 retry attempts for a task have been exhausted.
- A task's requirements are ambiguous and no reasonable interpretation exists.
- The baseline tests were already failing before implementation began.
- The plan file is missing or unreadable.

For everything else, apply the self-healing rules and keep going.

---

## Phase 4: Completion

After all tasks are attempted (completed or blocked):

### 4.1 Final Verification

Run the full suite one last time:

```bash
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
cd golf-planner && npx tsc --noEmit && npm test && npm run check && npm run build
```

All four must pass: type check, tests, lint, and build.

### 4.2 Summary Table

Present results in a table:

```
| # | Task | Tests Added | Total Tests | Commit | Status |
|---|------|-------------|-------------|--------|--------|
| 1 | [name] | +2 | 52 | abc1234 | DONE |
| 2 | [name] | +0 | 52 | def5678 | DONE |
| 3 | [name] | -- | -- | -- | BLOCKED: [reason] |
```

Include:
- Total tasks completed vs. total planned
- Total new tests added
- Final test count
- Any blocked tasks with their blockers

### 4.3 Session Handoff

Run `/handoff` to save session state for the next session. This writes:
- Completed tasks and commit hashes
- Current branch state
- Any blocked tasks and known issues
- Pointer to the plan file and which tasks remain

### 4.4 Push Reminder

Remind the user:
```
All tasks complete. Remember to push when ready:
  cd golf-planner && git push origin master
```

Do NOT push automatically -- let the user decide when to push.

---

## Commit Discipline

- **One commit per task.** Never batch multiple tasks into one commit.
- **Conventional commit format:** `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- **Never skip the pre-commit hook.** If tests fail in the hook, fix before committing.
- **Commit message references the task:** e.g., `feat: add budget panel component (Phase 4, Task 9)`
- **Fix commits are acceptable:** If a fix-it pass is needed after the initial commit, use `fix: resolve type error in BudgetPanel` rather than amending.

## Parallelization Rules

- Tasks within the same plan file CAN be parallelized if they modify different files and have no shared dependencies.
- Tasks across different plan files should generally be executed sequentially unless the index explicitly marks them as independent.
- When parallelizing, dispatch at most 3 subagents simultaneously to avoid context overload.
- After parallel tasks complete, run a single verification pass covering all changes.

## User Override Commands

- **"Skip task N"** -- Mark task N as skipped and move on.
- **"Retry task N"** -- Re-attempt a blocked or failed task.
- **"Pause after task N"** -- Stop execution after task N completes for review.
- **"Sequential only"** -- Disable parallelization, run all tasks one by one.
- **"Skip verification"** -- Trust subagent commits without running tsc/test (use sparingly).
- **"Stop"** -- Halt execution, write checkpoint, present partial summary.
