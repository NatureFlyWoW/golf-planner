---
name: project-navigation
trigger: "auto — when navigating, exploring, or organizing files in the Golf Planner codebase"
evolved_from:
  - absolute-paths-only
  - codebase-find-search
  - exploration-workflow
  - split-plans-into-files
  - component-first-workflow
  - plan-docs-pattern
domain: file-organization
created: "2026-02-23T12:00:00Z"
---

# Project Navigation

How to move through and organize this codebase. Apply automatically.

## Absolute Paths Always

Every file operation uses the full path. No exceptions.

```
/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/...
```

WSL2 resets working directory between Bash calls. Relative paths will break. 100% compliance across 42 sessions — don't be the one that breaks it.

## Where Things Live

| What | Where | Read frequency |
|------|-------|---------------|
| Components (primary) | `src/components/three/`, `src/components/ui/` | 34% of all reads, 48% of edits |
| Planning docs | `docs/plans/` | 24% of reads, 29% of writes |
| Types | `src/types/` | As needed alongside components |
| Utils | `src/utils/` | As needed alongside components |
| Store | `src/store/` | After components |
| Tests | `tests/` | After understanding code |

**Components are the primary unit of work.** Start there.

## Exploration Workflow

When entering a new feature area:

1. **Read the plan** — `docs/plans/` for the relevant phase/split
2. **Find source files** — Grep for key identifiers, or find by path pattern
3. **Read key components** — the 3 most relevant `.tsx` files
4. **Find tests** — `tests/` matching the component names
5. **Read tests** — understand the contracts before changing anything

## Plan Organization

When writing plans or design docs:
- Destination: `docs/plans/` (29% of all writes go here)
- Format: split into separate `.md` files with an index
- Purpose: subagents can access individual sections without loading everything
- Plans are stored artifacts for session continuity — treat them as durable

## File Discovery

```bash
find /mnt/c/Users/Caus/Golf_Plan/golf-planner -maxdepth [N] -type f -name "[pattern]" | sort
```

Always bounded. Always filtered. Always sorted.
