# Phase 5 — Task File 04: Per-Type Cost Settings Modal

## Task 8: Create CostSettingsModal component

**Files:**
- Create: `src/components/ui/CostSettingsModal.tsx`
- Modify: `src/components/ui/BudgetPanel.tsx`

**Step 1: Create the CostSettingsModal component**

Create `src/components/ui/CostSettingsModal.tsx`:

```typescript
import { COURSE_CATEGORY_ID, DEFAULT_COST_PER_TYPE } from "../../constants/budget";
import { HOLE_TYPES } from "../../constants/holeTypes";
import { useStore } from "../../store";

type Props = {
	onClose: () => void;
};

export function CostSettingsModal({ onClose }: Props) {
	const budgetConfig = useStore((s) => s.budgetConfig);
	const setBudgetConfig = useStore((s) => s.setBudgetConfig);
	const manualOverride = useStore(
		(s) => s.budget[COURSE_CATEGORY_ID]?.manualOverride ?? false,
	);

	function handleCostChange(type: string, value: number) {
		setBudgetConfig({
			costPerType: {
				...budgetConfig.costPerType,
				[type]: Math.max(0, value),
			},
		});
	}

	function handleReset() {
		setBudgetConfig({
			costPerType: { ...DEFAULT_COST_PER_TYPE },
		});
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
			role="presentation"
			// biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss
			onClick={onClose}
		>
			<div
				className="mx-4 w-full max-w-sm rounded-xl bg-white shadow-xl"
				onClick={(e) => e.stopPropagation()}
				// biome-ignore lint/a11y/noStaticElementInteractions: modal content
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
					<span className="text-sm font-semibold">Per-Type Hole Costs</span>
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
								<input
									type="number"
									value={budgetConfig.costPerType[ht.type] ?? 0}
									min={0}
									onChange={(e) =>
										handleCostChange(ht.type, Number(e.target.value))
									}
									className="w-24 rounded border border-gray-200 px-1.5 py-1 text-right text-xs"
								/>
							</div>
						</label>
					))}
				</div>

				{/* Override warning */}
				{manualOverride && (
					<div className="px-4 pb-2 text-[10px] text-amber-600 italic">
						Course estimate is pinned. Changes here apply when you unlock it.
					</div>
				)}

				{/* Footer */}
				<div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
					<button
						type="button"
						onClick={handleReset}
						className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
					>
						Reset Defaults
					</button>
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

**Step 2: Wire the modal into BudgetPanel**

In `src/components/ui/BudgetPanel.tsx`:

1. Import `CostSettingsModal` from `"./CostSettingsModal"`
2. The `showSettings` state was added in Task 5. Use it to render the modal:

```tsx
{showSettings && (
	<CostSettingsModal onClose={() => setShowSettings(false)} />
)}
```

Place this at the end of the BudgetPanel return, just before the closing `</div>`.

**Step 3: Verify visually**

Run: `npm run dev`
Verify:
- Clicking gear icon in breakdown section opens the modal
- All 7 hole types shown with current costs
- Editing a cost updates the breakdown immediately
- "Reset Defaults" restores original values
- Backdrop click or Close button dismisses modal
- Override warning shows when course is locked
- On mobile (resize browser): modal displays full-width

**Step 4: Run lint**

Run: `npx biome check src/components/ui/CostSettingsModal.tsx src/components/ui/BudgetPanel.tsx`
Expected: Clean

**Step 5: Commit**

```bash
git add src/components/ui/CostSettingsModal.tsx src/components/ui/BudgetPanel.tsx
git commit -m "feat: add per-type cost settings modal"
```
