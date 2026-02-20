# Task 5: BudgetPanel Enhancements - Result

**Status:** COMPLETE
**Date:** 2026-02-20

## Changes Made

**File modified:** `src/components/ui/BudgetPanel.tsx` (273 lines -> 467 lines)

### Enhancements Applied

1. **Risk-weighted buffer replaces flat 10% contingency**
   - Header now shows "Subtotal (net)", "Risk buffer (Tolerance, X%)", and "Budget Target" instead of flat "Contingency (10%)" + "Grand Total"
   - Footer mirrors the same risk buffer + budget target display
   - Uses `computeSubtotalNet()`, `computeRiskBuffer()` selectors from `store/selectors.ts`
   - Risk buffer varies per category's confidence tier and the global risk tolerance setting

2. **Net/gross display based on financial settings**
   - Category cards show "Net" label instead of "Est"
   - When `displayMode !== "net"` and category has `standard_20` VAT profile, shows gross amount alongside net
   - Header shows net-basis subtotal and budget target

3. **Confidence tier badges on category cards**
   - Color-coded badge (green/blue/yellow/orange/red) for each tier
   - Displayed inline in card header between name and course override button

4. **Confidence tier dropdown in expanded card**
   - Select dropdown with 5 options: Fixed (+-2%), Low (+-10-15%), Medium (+-20-30%), High (+-40-60%), Very High (+-50-100%)
   - Uses `updateCategoryTier` store action

5. **Mandatory lock icons**
   - Lock emoji shown before category name for mandatory categories
   - Title tooltip "Mandatory"

6. **Budget health warnings**
   - Critical (red): mandatory category with zero estimate
   - Warning (amber): subtotal below 150k or above 350k feasibility study bounds
   - Info (blue): VAT registration hint showing potential Vorsteuer savings
   - Displayed as colored banners in the header area

7. **Financial settings integration**
   - Gear icon in header opens FinancialSettingsModal (already wired)
   - VAT reclaimable Vorsteuer shown in header and footer when vatRegistered && reclaimableVat > 0
   - Risk tolerance label derived from financialSettings

8. **Renamed `formatEur` to `displayEur`**
   - Avoids conflict with `formatEur` import from `utils/financial.ts`
   - Same formatting logic (de-AT locale, no decimals, EUR symbol prefix)

### New store hooks used
- `updateCategoryTier` (existing action)
- `financialSettings` (existing state)
- `computeRiskBuffer` (existing selector)
- `computeSubtotalNet` (existing selector)
- `computeTotalReclaimableVat` (existing selector)

### Preserved from Task 6
- `ExpenseList` component rendering in expanded cards
- `computeCategoryActual()` for per-category "Spent" display
- `computeActualTotal()` for header "Actual (spent)" display
- `estimatedNet` field usage throughout

## Verification

- `npx tsc --noEmit` -- PASS (zero errors)
- `npm test -- --run` -- PASS (101/101 tests)
- `npx biome check src/components/ui/BudgetPanel.tsx` -- PASS (zero issues)
- Pre-existing lint warnings in other files unchanged (not in scope)
