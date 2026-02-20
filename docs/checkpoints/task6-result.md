# Phase 8 Task 6: Expense Tracking — Result

## Summary
Added per-category expense tracking within budget category cards. Users can add, view, and delete expense entries (date, amount, vendor, note) inline within each category's expanded detail view. The single `actual` field has been replaced with expense-derived totals using `computeCategoryActual` from selectors.

## Files Created
- `src/components/ui/ExpenseList.tsx` — New sub-component for inline expense list with add/delete form

## Files Modified
- `src/components/ui/BudgetPanel.tsx` — Integrated ExpenseList into expanded cards; replaced `cat.estimated`/`cat.actual` with `cat.estimatedNet`/expense-derived actual; label changed from "Act" to "Spent"; progress bar uses expense-derived ratio
- `src/store/selectors.ts` — Fixed `selectCourseCost` to use `cat.estimatedNet` instead of `cat.estimated`
- `src/store/store.ts` — Fixed migration type casts to use `as unknown as` for v1-to-v2 budget type conversions
- `src/utils/exportLayout.ts` — Updated to use `BudgetCategoryV2`, `BudgetConfigV2`, `ExpenseEntry[]`; bumped export version from 3 to 4; added `expenses` to export data
- `src/components/ui/ExportButton.tsx` — Updated to pass `expenses` to `buildExportData`
- `src/components/ui/BottomToolbar.tsx` — Updated to pass `expenses` to `buildExportData`
- `tests/utils/exportLayout.test.ts` — Updated to use V2 types and version 4 export format
- `tests/utils/budgetSelectors.test.ts` — Updated `selectCourseCost` tests to use `BudgetCategoryV2` shape (`estimatedNet` instead of `estimated`, full V2 fields)

## Verification Status
- **TypeScript (`npx tsc --noEmit -p tsconfig.app.json`):** PASS (0 errors)
- **Tests (`npm test -- --run`):** PASS (101 tests, 13 test files, 0 failures)
- **Lint (`npm run check`):** PASS (exit code 0, 6 pre-existing warnings in `migrateBudgetConfig.test.ts` only)

## Key Design Decisions
- Actual totals for categories are now fully derived from `expenses[]` via `computeCategoryActual()` — no more manual "Actual" input field
- The old "Actual" input was removed and replaced with the `<ExpenseList>` component showing per-category expenses
- Export format bumped to version 4 to include expenses array
- Pre-existing type mismatches between `BudgetCategory` (v1) and `BudgetCategoryV2` in selectors, export, and store migration were fixed as part of this task
