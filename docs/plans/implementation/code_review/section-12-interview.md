# Section 12 Code Review Interview

## Triage Summary

| # | Issue | Severity | Decision |
|---|-------|----------|----------|
| 1 | Missing Cost tab test | HIGH | Let go — Sidebar has no Cost tab (Holes/Detail/Budget only). Plan was incorrect. |
| 2 | Missing settings modal test | HIGH | Let go — Settings opened from BudgetPanel, not Toolbar. No toolbar settings button. |
| 3 | Missing settings data-testid | HIGH | Let go — follows from #2, no element to annotate |
| 4 | Vitest exclude clobbers defaults | MEDIUM | Auto-fix — used defaultExclude spread |
| 5 | UV test names simplified | MEDIUM | Let go — shorter names are clearer for this project |
| 6 | Baseline count mismatch | MEDIUM | Let go — plan estimate was "roughly 10-12", 8 matches actual |
| 7 | No blob-report in gitignore | LOW | Let go |
| 8 | Type import style | LOW | Auto-fix — used top-level Page import |
| 9 | Mobile project config | LOW | Let go |
| 10 | README missing Vitest note | LOW | Let go |

## Auto-fixes Applied

1. Used `defaultExclude` from `vitest/config` spread in vite.config.ts test.exclude
2. Replaced inline type import with top-level `type Page` import in spec file

## User Interview

User away — no items required input. Plan inaccuracies (#1-3) documented but not fixable (sidebar structure differs from plan).
