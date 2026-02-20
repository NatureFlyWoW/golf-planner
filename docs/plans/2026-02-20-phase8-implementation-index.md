# Phase 8: Enhanced Cost Estimation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Austrian financial literacy and probabilistic risk modeling to the budget tracker — VAT handling, missing categories, risk-weighted contingency, expense tracking, and optional Monte Carlo simulation.

**Architecture:** Extend the existing Zustand budget slice with new types (BudgetCategoryV2, FinancialSettings, ExpenseEntry), bump persist version to v4 with migration, add VAT/risk utility functions, and enhance the BudgetPanel UI with net/gross display, confidence tiers, warnings, and expense lists. Layer 2 adds an optional Monte Carlo engine.

**Tech Stack:** React 19, TypeScript, Zustand (persist v4), Tailwind CSS, Vitest

**Design Doc:** `docs/plans/2026-02-20-phase8-cost-estimation-design.md`

---

## Task Index

| # | Task | File | Dependencies |
|---|------|------|-------------|
| 1 | [Types, constants, and VAT utilities](./phase8-task1-types-constants-vat.md) | New types + constants + utility fns + tests | None |
| 2 | [Store v4 migration and new actions](./phase8-task2-store-migration.md) | Store slice + persist migration | Task 1 |
| 3 | [Risk-weighted contingency selectors](./phase8-task3-risk-selectors.md) | Selectors + tests | Task 1, 2 |
| 4 | [Financial Settings modal](./phase8-task4-financial-settings.md) | New UI component | Task 2 |
| 5 | [BudgetPanel enhancements](./phase8-task5-budget-panel.md) | Net/gross, warnings, confidence tiers | Task 2, 3, 4 |
| 6 | [Simple expense tracking](./phase8-task6-expense-tracking.md) | ExpenseEntry CRUD in category cards | Task 2 |
| 7 | [DIY/Professional toggle](./phase8-task7-diy-pro-toggle.md) | Dual cost maps + CostSettings update | Task 2, 4 |
| 8 | [Export v4 and mobile compat](./phase8-task8-export-mobile.md) | Export format + mobile panel updates | Task 2, 5, 6 |

## Layer 2 Tasks (Optional Second Phase)

| # | Task | File | Dependencies |
|---|------|------|-------------|
| 9 | Monte Carlo engine | (plan separately) | Task 1-3 |
| 10 | Histogram + tornado visualization | (plan separately) | Task 9 |
| 11 | CSV export | (plan separately) | Task 2, 6 |

---

## Conventions

- **Biome**: tabs for indentation, auto-sorts imports alphabetically
- **Types**: shared types in `src/types/`, component-local types inline
- **Testing**: Vitest, test placement in `src/utils/__tests__/` for utilities
- **Git**: conventional commits, commit-per-task, never skip pre-commit hook
- **PostToolUse hook**: `npx tsc --noEmit` runs automatically after edits
- **fnm**: source in every shell: `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"`
