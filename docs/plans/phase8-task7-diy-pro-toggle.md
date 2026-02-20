# Task 7: DIY/Professional Toggle

**Goal:** Make `selectCourseCost` use the appropriate cost map based on `buildMode` from financial settings: DIY costs (€800-1800), professional costs (€2000-3500), or mixed (user-editable). Update `CostSettingsModal` to show the active cost basis and allow editing in mixed mode.

**Files:**
- Modify: `src/store/selectors.ts` (update `selectCourseCost` to be build-mode-aware)
- Modify: `src/components/ui/CostSettingsModal.tsx` (show active cost basis, dual columns)
- Modify: `src/components/ui/CourseBreakdown.tsx` (show which cost basis is active)

**Depends on:** Task 2 (store has `financialSettings.buildMode` + `budgetConfig.costPerTypeDiy`), Task 4 (settings modal exists)

---

## Step 1: Update selectCourseCost for build mode

In `src/store/selectors.ts`, modify `selectCourseCost` to read `financialSettings.buildMode`:

```typescript
import {
	COURSE_CATEGORY_ID,
	DEFAULT_COST_PER_TYPE,
	DEFAULT_COST_PER_TYPE_DIY,
	DEFAULT_HOLE_COST,
} from "../constants/budget";
import { HOLE_TYPE_MAP } from "../constants/holeTypes";
import type { Store } from "./store";

export function selectCourseCost(state: Store): number {
	const cat = state.budget[COURSE_CATEGORY_ID];
	if (cat?.manualOverride) return cat.estimatedNet;

	const { buildMode } = state.financialSettings;
	const costMap =
		buildMode === "diy"
			? state.budgetConfig.costPerTypeDiy
			: buildMode === "professional"
				? DEFAULT_COST_PER_TYPE
				: state.budgetConfig.costPerType; // mixed = user-editable

	return state.holeOrder.reduce(
		(sum, id) =>
			sum + (costMap[state.holes[id]?.type] ?? DEFAULT_HOLE_COST),
		0,
	);
}
```

**Note:** In `diy` mode, use `costPerTypeDiy` from the store (editable). In `professional` mode, use the default `DEFAULT_COST_PER_TYPE` (pro costs). In `mixed` mode, use the existing user-editable `costPerType`.

Also update `selectCourseBreakdown` to be build-mode-aware:

```typescript
export function selectCourseBreakdown(state: Store): CourseBreakdownItem[] {
	const { buildMode } = state.financialSettings;
	const costMap =
		buildMode === "diy"
			? state.budgetConfig.costPerTypeDiy
			: buildMode === "professional"
				? DEFAULT_COST_PER_TYPE
				: state.budgetConfig.costPerType;

	const counts: Record<string, number> = {};
	for (const id of state.holeOrder) {
		const hole = state.holes[id];
		if (hole) {
			counts[hole.type] = (counts[hole.type] ?? 0) + 1;
		}
	}

	return Object.entries(counts)
		.map(([type, count]) => {
			const unitCost = costMap[type] ?? DEFAULT_HOLE_COST;
			return {
				type,
				label: HOLE_TYPE_MAP[type]?.label ?? type,
				count,
				unitCost,
				subtotal: count * unitCost,
			};
		})
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
```

## Step 2: Update CostSettingsModal for build mode

In `src/components/ui/CostSettingsModal.tsx`, update to show the current build mode's costs:

```typescript
import {
	COURSE_CATEGORY_ID,
	DEFAULT_COST_PER_TYPE,
	DEFAULT_COST_PER_TYPE_DIY,
} from "../../constants/budget";
import { HOLE_TYPES } from "../../constants/holeTypes";
import { useStore } from "../../store";

type Props = {
	onClose: () => void;
};

export function CostSettingsModal({ onClose }: Props) {
	const budgetConfig = useStore((s) => s.budgetConfig);
	const setBudgetConfig = useStore((s) => s.setBudgetConfig);
	const buildMode = useStore((s) => s.financialSettings.buildMode);
	const manualOverride = useStore(
		(s) => s.budget[COURSE_CATEGORY_ID]?.manualOverride ?? false,
	);

	const isEditable = buildMode === "mixed" || buildMode === "diy";
	const costMap =
		buildMode === "diy"
			? budgetConfig.costPerTypeDiy
			: buildMode === "professional"
				? DEFAULT_COST_PER_TYPE
				: budgetConfig.costPerType;

	function handleCostChange(type: string, value: number) {
		if (buildMode === "diy") {
			setBudgetConfig({
				costPerTypeDiy: {
					...budgetConfig.costPerTypeDiy,
					[type]: Math.max(0, value),
				},
			});
		} else {
			setBudgetConfig({
				costPerType: {
					...budgetConfig.costPerType,
					[type]: Math.max(0, value),
				},
			});
		}
	}

	function handleReset() {
		if (buildMode === "diy") {
			setBudgetConfig({
				costPerTypeDiy: { ...DEFAULT_COST_PER_TYPE_DIY },
			});
		} else {
			setBudgetConfig({
				costPerType: { ...DEFAULT_COST_PER_TYPE },
			});
		}
	}

	const modeLabel =
		buildMode === "diy"
			? "DIY (materials only)"
			: buildMode === "professional"
				? "Professional (installed)"
				: "Mixed (custom)";

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
			role="presentation"
			onClick={onClose}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: modal content */}
			<div
				className="mx-4 w-full max-w-sm rounded-xl bg-white shadow-xl"
				role="presentation"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
					<div className="flex flex-col">
						<span className="text-sm font-semibold">Per-Type Hole Costs</span>
						<span className="text-[10px] text-gray-400">{modeLabel}</span>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					>
						<span className="text-lg">✕</span>
					</button>
				</div>

				{/* Cost fields */}
				<div className="flex flex-col gap-2 px-4 py-3">
					{HOLE_TYPES.map((ht) => (
						<label key={ht.type} className="flex items-center justify-between">
							<span className="text-xs text-gray-700">{ht.label}</span>
							<div className="flex items-center gap-1">
								<span className="text-xs text-gray-400">€</span>
								{isEditable ? (
									<input
										type="number"
										value={costMap[ht.type] ?? 0}
										min={0}
										onChange={(e) =>
											handleCostChange(ht.type, Number(e.target.value))
										}
										className="w-24 rounded border border-gray-200 px-1.5 py-1 text-right text-xs"
									/>
								) : (
									<span className="w-24 text-right text-xs text-gray-600">
										{(costMap[ht.type] ?? 0).toLocaleString("de-AT")}
									</span>
								)}
							</div>
						</label>
					))}
				</div>

				{/* Build mode info */}
				{buildMode === "professional" && (
					<div className="px-4 pb-2 text-[10px] text-gray-400 italic">
						Professional costs are fixed. Switch to DIY or Mixed in Financial Settings to edit.
					</div>
				)}

				{/* Override warning */}
				{manualOverride && (
					<div className="px-4 pb-2 text-[10px] text-amber-600 italic">
						Course estimate is pinned. Changes here apply when you unlock it.
					</div>
				)}

				{/* Footer */}
				<div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
					{isEditable && (
						<button
							type="button"
							onClick={handleReset}
							className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
						>
							Reset Defaults
						</button>
					)}
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600"
					>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
```

## Step 3: Update CourseBreakdown to show cost basis

In `src/components/ui/CourseBreakdown.tsx`, add a small label showing which cost basis is active. Add the store hook and label:

```typescript
const buildMode = useStore((s) => s.financialSettings.buildMode);
```

In the component header area, add:

```typescript
<span className="text-[10px] text-gray-400">
	({buildMode === "diy" ? "DIY" : buildMode === "professional" ? "Pro" : "Mixed"} costs)
</span>
```

## Step 4: Run type check and tests

```bash
cd golf-planner && npx tsc --noEmit && npm run test -- --run
```

Expected: All tests pass. The selectCourseCost tests may need updating if they don't mock `financialSettings` — add `financialSettings: { buildMode: "mixed" }` to test state if needed.

## Step 5: Commit

```bash
git add src/store/selectors.ts src/components/ui/CostSettingsModal.tsx src/components/ui/CourseBreakdown.tsx
git commit -m "feat(phase8): add DIY/professional toggle for course cost estimation"
```
