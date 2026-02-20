# Phase 5: Cost Auto-Estimation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Auto-calculate the course budget category from per-hole-type costs, with grouped-by-type breakdown, manual override lock, dashboard hints, and per-type cost settings modal.

**Architecture:** Extend `BudgetConfig` with `costPerType` map. Add `manualOverride` to `BudgetCategory`. Compute course estimate via derived selector (not stored state). UI additions: collapsible breakdown section, lock icon on course card, static hints on 3 categories, per-type cost settings modal. Mobile reuses the same BudgetPanel component.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS, Vitest

**Design Doc:** `docs/plans/2026-02-20-phase5-cost-auto-estimation-design.md`

---

## Task Files

| File | Tasks | Dependencies | Summary |
|------|-------|-------------|---------|
| [01-data-model.md](2026-02-20-phase5-01-data-model.md) | 1–2 | None | Types, constants, store migration |
| [02-selectors-store.md](2026-02-20-phase5-02-selectors-store.md) | 3–4 | Task 2 | Course cost selector + store actions |
| [03-budget-panel-ui.md](2026-02-20-phase5-03-budget-panel-ui.md) | 5–7 | Task 4 | Breakdown section, lock icon, dashboard hints |
| [04-settings-modal.md](2026-02-20-phase5-04-settings-modal.md) | 8 | Task 7 | Per-type cost settings modal |
| [05-export-migration.md](2026-02-20-phase5-05-export-migration.md) | 9–10 | Task 4 | Export v3, localStorage migration |

## Parallelization

```
Task 1 (types/constants) ──→ Task 2 (store) ──→ Task 3-4 (selectors) ──→ Task 5-7 (UI) ──→ Task 8 (modal)
                                                       └──→ Task 9-10 (export)
```

Tasks 1–2 are sequential (foundation). Tasks 3–4 are sequential. After Task 4, Tasks 5–7 and Tasks 9–10 can run in parallel. Task 8 depends on Task 7.

## Important Notes

- Existing course category ID is `"course"` (not `"mini-golf-course"` as in early design drafts). The constant `COURSE_CATEGORY_ID` must equal `"course"` to match existing localStorage data.
- Biome uses **tabs** for indentation.
- Biome auto-sorts imports alphabetically.
- `fnm env` must be sourced in every Bash call: `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"`
- Run tests: `npm test -- --run`
- Run lint: `npx biome check src/`
