---
name: code-investigation
trigger: "auto — when searching, debugging, or building understanding of code before editing"
evolved_from:
  - conservative-search
  - grep-over-find-large-search
  - batch-reads-for-context
  - error-recovery-pattern
  - grep-for-known-patterns
domain: debugging
created: "2026-02-23T12:00:00Z"
---

# Code Investigation

How to search, read, and understand code efficiently. Apply automatically — these patterns prevent wasted time.

## Search Strategy

**Know what you're looking for?** Use Grep with the exact identifier (function name, constant, type).

**Exploring unfamiliar territory?** Use Read on 2-3 related files in sequence to build context before searching further.

**Searching the filesystem?** Bound it:
- Use `-maxdepth` to limit recursion
- Narrow to specific directories (`src/`, `tests/`, `docs/plans/`)
- Include `-type f` to skip directories
- Pipe through `| head -N` for early termination

Current ratio to maintain: ~30% Reads (discovery), ~8% Greps (targeted lookup). If you're grepping more than reading, you're not building enough context.

## Context Building (Before Editing)

Always read in this order before touching code:
1. The component/file you're about to change
2. Its types/interfaces (inline or from `src/types/`)
3. Related store slices or hooks it depends on

This 3-file read pattern appears in 12% of all tool sequences. Skipping it leads to rework.

## Error Recovery

When a command fails, **do NOT retry the same command**. Switch tools:

| Failed tool | Recovery action |
|-------------|----------------|
| Bash (build/test) | Read source → Edit fix |
| Grep (no results) | Read broader context → refine search |
| Edit (wrong match) | Read file first → try again with more context |

The pattern: investigate → understand → fix. Never thrash.
