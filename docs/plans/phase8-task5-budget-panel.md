# Task 5: BudgetPanel Enhancements

**Goal:** Replace the flat 10% contingency with risk-weighted buffer, show net/gross amounts based on financial settings, add confidence tier dropdowns, mandatory lock icons, and budget health warnings.

**Files:**
- Modify: `src/components/ui/BudgetPanel.tsx` (261 lines — significant rework of header, cards, footer)

**Depends on:** Task 2 (store v4), Task 3 (selectors), Task 4 (FinancialSettingsModal)

---

## Step 1: Update imports and store hooks

At the top of `src/components/ui/BudgetPanel.tsx`, update imports:

```typescript
import { useRef, useState } from "react";
import { BUDGET_HINTS, COURSE_CATEGORY_ID } from "../../constants/budget";
import { useStore } from "../../store";
import { selectCourseCost } from "../../store/selectors";
import {
	computeRiskBuffer,
	computeSubtotalNet,
	computeTotalReclaimableVat,
} from "../../store/selectors";
import type { ConfidenceTier } from "../../types/budget";
import { effectiveCost, formatEur as formatEurUtil } from "../../utils/financial";
import { CostSettingsModal } from "./CostSettingsModal";
import { CourseBreakdown } from "./CourseBreakdown";
import { FinancialSettingsModal } from "./FinancialSettingsModal";
```

**Note:** The existing inline `formatEur` helper (lines 9-11) is replaced by the imported `formatEurUtil` from `utils/financial`. However, the existing one uses `€${n.toLocaleString(...)}` while the utility uses `toLocaleString("de-AT", { style: "currency", ... })`. Keep the inline one for now to avoid display changes, but rename it to avoid conflict:

```typescript
/** Format number as €X,XXX for display */
function displayEur(n: number): string {
	return `€${n.toLocaleString("de-AT", { maximumFractionDigits: 0 })}`;
}
```

Then use `displayEur` throughout the component (search-replace `formatEur(` with `displayEur(`).

## Step 2: Update store hooks in the component

Replace the existing hooks and computed values (lines 21-39):

```typescript
export function BudgetPanel() {
	const budget = useStore((s) => s.budget);
	const updateBudget = useStore((s) => s.updateBudget);
	const courseCost = useStore(selectCourseCost);
	const toggleCourseOverride = useStore((s) => s.toggleCourseOverride);
	const updateCategoryTier = useStore((s) => s.updateCategoryTier);
	const financialSettings = useStore((s) => s.financialSettings);

	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [showSettings, setShowSettings] = useState(false);
	const [showFinancialSettings, setShowFinancialSettings] = useState(false);
	const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

	const categories = Object.values(budget);

	// Net-basis totals
	const subtotalNet = computeSubtotalNet(budget, courseCost, COURSE_CATEGORY_ID);
	const riskBuffer = computeRiskBuffer(
		budget,
		courseCost,
		COURSE_CATEGORY_ID,
		financialSettings.riskTolerance,
	);
	const riskPercent = subtotalNet > 0 ? Math.round((riskBuffer / subtotalNet) * 100) : 0;
	const budgetTargetNet = subtotalNet + riskBuffer;

	// VAT display
	const reclaimableVat = computeTotalReclaimableVat(
		budget,
		financialSettings.vatRegistered,
	);

	// Risk tolerance label
	const toleranceLabel =
		financialSettings.riskTolerance.charAt(0).toUpperCase() +
		financialSettings.riskTolerance.slice(1);
```

## Step 3: Update the header section

Replace the summary header (lines 58-80) with enhanced version showing net/gross and gear icon:

```typescript
{/* Summary header */}
<div className="border-b border-gray-200 px-3 py-2">
	<div className="flex items-center justify-between">
		<span className="text-xs font-semibold text-gray-700">Budget</span>
		<button
			type="button"
			onClick={() => setShowFinancialSettings(true)}
			className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
			title="Financial Settings"
		>
			<span className="text-sm">⚙</span>
		</button>
	</div>

	{/* Budget warnings */}
	{warnings.length > 0 && (
		<div className="mt-1 flex flex-col gap-1">
			{warnings.map((w) => (
				<div
					key={w.id}
					className={`rounded px-2 py-1 text-[10px] ${
						w.severity === "critical"
							? "bg-red-50 text-red-700"
							: w.severity === "warning"
								? "bg-amber-50 text-amber-700"
								: "bg-blue-50 text-blue-700"
					}`}
				>
					{w.title}
				</div>
			))}
		</div>
	)}

	<div className="mt-1 flex items-baseline justify-between">
		<span className="text-xs text-gray-500">Subtotal (net)</span>
		<span className="text-sm font-semibold">{displayEur(subtotalNet)}</span>
	</div>
	<div className="flex items-baseline justify-between">
		<span className="text-xs text-gray-500">
			Risk buffer ({toleranceLabel}, {riskPercent}%)
		</span>
		<span className="text-xs text-gray-600">{displayEur(riskBuffer)}</span>
	</div>
	<div className="mt-0.5 flex items-baseline justify-between">
		<span className="text-xs font-semibold text-gray-700">Budget Target</span>
		<span className="text-sm font-bold">{displayEur(budgetTargetNet)}</span>
	</div>
	{financialSettings.vatRegistered && reclaimableVat > 0 && (
		<div className="mt-0.5 flex items-baseline justify-between">
			<span className="text-[10px] text-green-600">Reclaimable Vorsteuer</span>
			<span className="text-xs font-medium text-green-600">
				{displayEur(reclaimableVat)}
			</span>
		</div>
	)}
</div>
```

## Step 4: Add warnings computation

Add a warnings computation before the return statement (after the existing hooks/state):

```typescript
// Budget health warnings
type BudgetWarning = {
	id: string;
	severity: "critical" | "warning" | "info";
	title: string;
};

const warnings: BudgetWarning[] = [];

// Check mandatory categories with zero estimate
for (const cat of categories) {
	if (cat.mandatory && cat.estimatedNet === 0 && cat.id !== COURSE_CATEGORY_ID) {
		warnings.push({
			id: `zero-${cat.id}`,
			severity: "critical",
			title: `${cat.name}: estimate is €0`,
		});
	}
}

// Check total bounds (feasibility study)
if (subtotalNet > 0 && subtotalNet < 150000) {
	warnings.push({
		id: "total-low",
		severity: "warning",
		title: "Total below €150k feasibility study minimum",
	});
}
if (subtotalNet > 350000) {
	warnings.push({
		id: "total-high",
		severity: "warning",
		title: "Total exceeds €350k feasibility study maximum",
	});
}

// VAT not configured hint
if (!financialSettings.vatRegistered) {
	warnings.push({
		id: "vat-hint",
		severity: "info",
		title: `VAT registered? Could save ~${displayEur(computeTotalReclaimableVat(budget, true))} Vorsteuer`,
	});
}
```

## Step 5: Update category cards with confidence tier and lock icon

In the category card header area (line 101-125), add mandatory lock icon and confidence tier:

Replace the card header with:

```typescript
{/* Card header */}
<div className="flex items-center gap-1 px-2.5 pt-2">
	{cat.mandatory && (
		<span className="text-[10px] text-gray-400" title="Mandatory">
			🔒
		</span>
	)}
	<button
		type="button"
		onClick={() => handleExpand(cat.id)}
		className="flex-1 text-left text-xs font-medium text-gray-700"
	>
		{cat.name}
	</button>
	{/* Confidence tier badge */}
	<span
		className={`rounded px-1 py-0.5 text-[9px] font-medium ${
			cat.confidenceTier === "fixed"
				? "bg-green-100 text-green-700"
				: cat.confidenceTier === "low"
					? "bg-blue-100 text-blue-700"
					: cat.confidenceTier === "medium"
						? "bg-yellow-100 text-yellow-700"
						: cat.confidenceTier === "high"
							? "bg-orange-100 text-orange-700"
							: "bg-red-100 text-red-700"
		}`}
	>
		{cat.confidenceTier === "very_high" ? "V.High" : cat.confidenceTier.charAt(0).toUpperCase() + cat.confidenceTier.slice(1)}
	</span>
	{isCourse && (
		<button
			type="button"
			onClick={() => toggleCourseOverride()}
			className="rounded p-0.5 text-gray-400 hover:text-gray-600"
			title={
				cat.manualOverride
					? "Unlock auto-calculation"
					: "Pin estimate"
			}
		>
			<span className="text-xs">
				{cat.manualOverride ? "🔒" : "🔓"}
			</span>
		</button>
	)}
</div>
```

## Step 6: Update displayed estimate values

In the card body, update the estimate display to use `estimatedNet` instead of `estimated`, and show net/gross:

```typescript
const isCourse = cat.id === COURSE_CATEGORY_ID;
const displayNet = isCourse ? courseCost : cat.estimatedNet;
const ratio = displayNet > 0 ? cat.actual / displayNet : 0;
```

**Note:** The `cat.actual` field no longer exists in v2 — it's computed from expenses. For this task, display the estimatedNet. Actual display will come from Task 6 (expense tracking).

Update the amounts row:

```typescript
<div className="mt-1 flex gap-2">
	<div className="flex items-center gap-1">
		<span className="text-[10px] text-gray-400">Net</span>
		<span className="text-xs font-medium">
			{displayEur(displayNet)}
		</span>
	</div>
	{financialSettings.displayMode !== "net" && cat.vatProfile === "standard_20" && (
		<div className="flex items-center gap-1">
			<span className="text-[10px] text-gray-400">Gross</span>
			<span className="text-xs text-gray-500">
				{displayEur(Math.round(displayNet * 1.2))}
			</span>
		</div>
	)}
</div>
```

## Step 7: Add confidence tier selector in expanded card

In the expanded section (lines 162-232), add a confidence tier dropdown after the existing fields:

```typescript
{/* Confidence tier selector */}
<label className="flex flex-col gap-0.5">
	<span className="text-[10px] text-gray-400">Confidence Tier</span>
	<select
		value={cat.confidenceTier}
		onChange={(e) =>
			updateCategoryTier(cat.id, e.target.value as ConfidenceTier)
		}
		className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
	>
		<option value="fixed">Fixed price (±2%)</option>
		<option value="low">Low uncertainty (±10-15%)</option>
		<option value="medium">Medium uncertainty (±20-30%)</option>
		<option value="high">High uncertainty (±40-60%)</option>
		<option value="very_high">Very high (±50-100%)</option>
	</select>
</label>
```

## Step 8: Update the expanded card's estimate field

Replace `cat.estimated` references in the expanded section with `cat.estimatedNet`:

```typescript
{isCourse && !cat.manualOverride ? (
	<div className="flex flex-col gap-0.5">
		<span className="text-[10px] text-gray-400">
			Estimated (auto)
		</span>
		<span className="text-xs font-medium">
			{displayEur(courseCost)}
		</span>
	</div>
) : (
	<label className="flex flex-col gap-0.5">
		<span className="text-[10px] text-gray-400">
			Estimated (net){isCourse ? " — pinned" : ""}
		</span>
		<div className="flex items-center gap-1">
			<span className="text-xs text-gray-400">€</span>
			<input
				type="number"
				value={cat.estimatedNet}
				min={0}
				onChange={(e) =>
					updateBudget(cat.id, {
						estimatedNet: Math.max(
							0,
							Number(e.target.value),
						),
					})
				}
				className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
			/>
		</div>
	</label>
)}
```

## Step 9: Remove old "Actual" input from expanded card

Remove the "Actual" input field from the expanded card. In Phase 8, actuals are derived from expenses (Task 6). For now, just remove the field — the expense list will replace it.

## Step 10: Update the footer

Replace the footer (lines 240-253) with risk buffer display:

```typescript
{/* Footer: risk buffer + budget target */}
<div className="border-t border-gray-200 px-3 py-2">
	<div className="flex items-baseline justify-between">
		<span className="text-[10px] text-gray-400">
			Risk buffer ({toleranceLabel}, {riskPercent}%)
		</span>
		<span className="text-xs text-gray-600">
			{displayEur(riskBuffer)}
		</span>
	</div>
	<div className="mt-0.5 flex items-baseline justify-between">
		<span className="text-xs font-semibold text-gray-700">
			Budget Target
		</span>
		<span className="text-sm font-bold">{displayEur(budgetTargetNet)}</span>
	</div>
	{financialSettings.vatRegistered && reclaimableVat > 0 && (
		<div className="mt-0.5 flex items-baseline justify-between">
			<span className="text-[10px] text-green-600">
				Reclaimable Vorsteuer
			</span>
			<span className="text-xs font-medium text-green-600">
				{displayEur(reclaimableVat)}
			</span>
		</div>
	)}
</div>
```

## Step 11: Add FinancialSettingsModal render

After the existing `CostSettingsModal` render, add:

```typescript
{showFinancialSettings && (
	<FinancialSettingsModal onClose={() => setShowFinancialSettings(false)} />
)}
```

## Step 12: Run type check and tests

```bash
cd golf-planner && npx tsc --noEmit && npm run test -- --run
```

Expected: All tests pass. Type check clean. Some existing tests may need updates if they reference `estimated` or `actual` fields — update them to use `estimatedNet`.

## Step 13: Commit

```bash
git add src/components/ui/BudgetPanel.tsx
git commit -m "feat(phase8): enhance BudgetPanel with risk buffer, net/gross, confidence tiers, warnings"
```
