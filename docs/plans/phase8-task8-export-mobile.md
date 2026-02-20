# Task 8: Export v4 and Mobile Compatibility

**Goal:** Update the JSON export format to v4 (include `financialSettings`, `expenses`, v2 budget categories), and verify mobile budget panel works with all Phase 8 enhancements.

**Files:**
- Modify: `src/utils/exportLayout.ts` (update ExportData type + buildExportData)
- Modify: `src/components/ui/MobileBudgetPanel.tsx` (if any mobile-specific adjustments needed)

**Depends on:** Task 2 (store v4), Task 5 (BudgetPanel enhancements), Task 6 (expenses)

---

## Step 1: Update ExportData type and builder

Modify `src/utils/exportLayout.ts`:

```typescript
import type {
	BudgetCategoryV2,
	BudgetConfigV2,
	ExpenseEntry,
	FinancialSettings,
	Hall,
	Hole,
} from "../types";

export type ExportData = {
	version: number;
	exportedAt: string;
	hall: { width: number; length: number };
	holes: Hole[];
	budget: BudgetCategoryV2[];
	budgetConfig: BudgetConfigV2;
	financialSettings: FinancialSettings;
	expenses: ExpenseEntry[];
};

export function buildExportData(
	holes: Record<string, Hole>,
	holeOrder: string[],
	budget: Record<string, BudgetCategoryV2>,
	hall: Hall,
	budgetConfig: BudgetConfigV2,
	financialSettings: FinancialSettings,
	expenses: ExpenseEntry[],
): ExportData {
	return {
		version: 4,
		exportedAt: new Date().toISOString(),
		hall: { width: hall.width, length: hall.length },
		holes: holeOrder.map((id) => holes[id]).filter(Boolean),
		budget: Object.values(budget),
		budgetConfig,
		financialSettings,
		expenses,
	};
}

export function downloadJson(data: ExportData) {
	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `golf-layout-${new Date().toISOString().split("T")[0]}.json`;
	a.click();
	URL.revokeObjectURL(url);
}
```

## Step 2: Update all callers of buildExportData

Search for all callers of `buildExportData` and update them to pass the new parameters. The main caller is likely in a toolbar export button.

Find the caller with:

```bash
cd golf-planner && grep -rn "buildExportData" src/
```

Update each caller to include `financialSettings` and `expenses` from the store:

```typescript
const financialSettings = useStore((s) => s.financialSettings);
const expenses = useStore((s) => s.expenses);

// In the export handler:
const data = buildExportData(
	holes,
	holeOrder,
	budget,
	hall,
	budgetConfig,
	financialSettings,
	expenses,
);
```

## Step 3: Update the types barrel export

If `BudgetCategoryV2`, `BudgetConfigV2`, `FinancialSettings`, and `ExpenseEntry` are not re-exported from `src/types/index.ts`, add the re-exports:

```typescript
export type {
	BudgetCategoryV2,
	BudgetConfigV2,
	ExpenseEntry,
	FinancialSettings,
} from "./budget";
```

## Step 4: Verify MobileBudgetPanel

The `MobileBudgetPanel` wraps `BudgetPanel` and should work automatically since `BudgetPanel` was updated in Task 5. Verify by:

1. Run the app and open on mobile viewport
2. Open the budget panel
3. Confirm: gear icon visible, risk buffer shown, confidence tier badges visible, expense list works

If the mobile panel needs layout adjustments (e.g., the FinancialSettingsModal should scroll on small screens), the modal already has `max-h-[90vh] overflow-y-auto` from Task 4.

The `MobileBudgetPanel` itself likely needs no changes since it simply renders `<BudgetPanel />` inside a fullscreen overlay.

## Step 5: Run type check and full test suite

```bash
cd golf-planner && npx tsc --noEmit && npm run test -- --run
```

Expected: All tests pass. Build succeeds.

## Step 6: Run production build

```bash
cd golf-planner && npm run build
```

Expected: Build succeeds. Check for any new chunk size warnings.

## Step 7: Commit

```bash
git add src/utils/exportLayout.ts src/types/index.ts src/components/ui/MobileBudgetPanel.tsx
# Also add any other files modified (export callers)
git commit -m "feat(phase8): update export to v4 with financial settings and expenses"
```

## Step 8: Final verification

```bash
cd golf-planner && npm run check && npm run test -- --run && npm run build
```

Expected: Lint clean, all tests pass, build succeeds.
