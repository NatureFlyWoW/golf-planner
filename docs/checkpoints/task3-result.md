# Phase 8 Task 3: Risk-Weighted Contingency Selectors - Result

## Status: COMPLETE

## Files Modified
- `src/store/selectors.ts` — Added 5 new exported selector functions and imports for `BudgetCategoryV2`, `RiskTolerance`, `reclaimableVat`, `riskBuffer`, `roundEur`

## Files Created
- `src/utils/__tests__/selectors.test.ts` — 16 new tests across 5 describe blocks

## New Selectors Added
1. **`computeSubtotalNet(budget, courseCost, courseId)`** — Sums `estimatedNet` across all categories, substituting `courseCost` for the course category
2. **`computeRiskBuffer(budget, courseCost, courseId, tolerance)`** — Risk-weighted contingency buffer using per-category confidence tiers and tolerance scaling
3. **`computeTotalReclaimableVat(budget, vatRegistered)`** — Total reclaimable Vorsteuer (VAT) across all categories
4. **`computeActualTotal(expenses)`** — Sum of all expense amounts
5. **`computeCategoryActual(expenses, categoryId)`** — Sum of expenses for a specific category

## New Tests (16 total)
- `computeSubtotalNet`: 3 tests (sum all, use courseCost, empty budget)
- `computeRiskBuffer`: 5 tests (fixed tier, very_high tier, tolerance scaling, courseCost override, empty budget)
- `computeTotalReclaimableVat`: 3 tests (registered standard, not registered, empty budget)
- `computeActualTotal`: 2 tests (sum all, empty)
- `computeCategoryActual`: 3 tests (filter by category, no expenses for category, empty)

## Verification
- `npx tsc --noEmit`: PASS (0 errors)
- `npx vitest run`: PASS (101 tests total: 85 existing + 16 new, 13 test files)
- `npm run check`: PASS (0 errors, 6 pre-existing warnings in migrateBudgetConfig.test.ts)
