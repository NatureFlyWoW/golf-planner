# Phase 5 — Task File 03: Budget Panel UI

## Task 5: Add Course Cost Breakdown section to BudgetPanel

**Files:**
- Create: `src/components/ui/CourseBreakdown.tsx`
- Modify: `src/components/ui/BudgetPanel.tsx`

**Step 1: Create CourseBreakdown component**

Create `src/components/ui/CourseBreakdown.tsx`:

```typescript
import { useState } from "react";
import { COURSE_CATEGORY_ID } from "../../constants/budget";
import { useStore } from "../../store";
import {
	selectCourseBreakdown,
	selectCourseCost,
} from "../../store/selectors";

function formatEur(n: number): string {
	return `€${n.toLocaleString("de-AT", { maximumFractionDigits: 0 })}`;
}

type Props = {
	onOpenSettings: () => void;
};

export function CourseBreakdown({ onOpenSettings }: Props) {
	const [expanded, setExpanded] = useState(true);
	const breakdown = useStore(selectCourseBreakdown);
	const courseCost = useStore(selectCourseCost);
	const holeCount = useStore((s) => s.holeOrder.length);
	const manualOverride = useStore(
		(s) => s.budget[COURSE_CATEGORY_ID]?.manualOverride ?? false,
	);

	if (holeCount === 0) {
		return (
			<div className="px-3 py-2 text-center text-xs text-gray-400 italic">
				Place holes to see course cost estimate
			</div>
		);
	}

	return (
		<div className="border-b border-gray-200">
			{/* Header */}
			<div className="flex items-center justify-between px-3 py-2">
				<button
					type="button"
					onClick={() => setExpanded(!expanded)}
					className="flex items-center gap-1 text-xs font-medium text-gray-700"
				>
					<span>{expanded ? "▼" : "▶"}</span>
					<span>Course Cost Breakdown</span>
				</button>
				<button
					type="button"
					onClick={onOpenSettings}
					className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					title="Edit per-type costs"
				>
					<span className="text-sm">⚙</span>
				</button>
			</div>

			{/* Breakdown table */}
			{expanded && (
				<div className="px-3 pb-2">
					<div className="flex flex-col gap-0.5">
						{breakdown.map((item) => (
							<div
								key={item.type}
								className="flex items-baseline justify-between text-xs"
							>
								<span className="text-gray-600">
									{item.count}× {item.label}
								</span>
								<span className="text-gray-500">
									@ {formatEur(item.unitCost)} ={" "}
									<span className="font-medium text-gray-700">
										{formatEur(item.subtotal)}
									</span>
								</span>
							</div>
						))}
					</div>

					{/* Divider + total */}
					<div className="my-1 border-t border-gray-100" />
					<div className="flex items-baseline justify-between text-xs">
						<span className="font-medium text-gray-700">
							Course total ({holeCount} holes)
						</span>
						<span className="font-semibold">
							{formatEur(courseCost)}
						</span>
					</div>

					{/* Manual override indicator */}
					{manualOverride && (
						<div className="mt-1 text-[10px] text-amber-600 italic">
							Pinned estimate — unlock to auto-calculate
						</div>
					)}

					{/* Planning estimate note */}
					{!manualOverride && (
						<div className="mt-1 text-[10px] text-gray-400 italic">
							Planning estimates — replace with real quotes when available
						</div>
					)}
				</div>
			)}
		</div>
	);
}
```

**Step 2: Wire CourseBreakdown into BudgetPanel**

In `src/components/ui/BudgetPanel.tsx`:

1. Import `CourseBreakdown` from `"./CourseBreakdown"`
2. Add a `const [showSettings, setShowSettings] = useState(false)` state
3. Insert `<CourseBreakdown onOpenSettings={() => setShowSettings(true)} />` at the top of the scrollable area (just above the category cards `<div>`)
4. Remove the old `courseAutoCalc` variable and its usage on the course card (lines 32, 114-119)
5. Remove the `budgetConfig` and `setBudgetConfig` store subscriptions (lines 19-20) — they'll move to the settings modal

**Step 3: Update the course card's estimated display**

For the course card specifically, show the computed cost instead of the stored estimated:

1. Import `selectCourseCost` from `"../../store/selectors"`
2. Add `const courseCost = useStore(selectCourseCost)`
3. In the category card, when `isCourse` is true, display `courseCost` instead of `cat.estimated` for the "Est" field

**Step 4: Run the dev server and verify visually**

Run: `npm run dev`
Verify:
- Breakdown section appears above category cards
- Shows grouped-by-type summary when holes are placed
- Shows empty state message when no holes
- Gear icon is visible and clickable (opens nothing yet — Task 8)
- Course card shows computed cost

**Step 5: Run lint**

Run: `npx biome check src/components/ui/CourseBreakdown.tsx src/components/ui/BudgetPanel.tsx`
Expected: Clean

**Step 6: Commit**

```bash
git add src/components/ui/CourseBreakdown.tsx src/components/ui/BudgetPanel.tsx
git commit -m "feat: add CourseBreakdown grouped-by-type summary to BudgetPanel"
```

---

## Task 6: Add lock/unlock toggle to course category card

**Files:**
- Modify: `src/components/ui/BudgetPanel.tsx`

**Step 1: Wire the lock toggle**

In `BudgetPanel.tsx`:

1. Import `COURSE_CATEGORY_ID` from `"../../constants/budget"`
2. Add `const toggleCourseOverride = useStore((s) => s.toggleCourseOverride)`
3. On the course category card header, add a lock icon button:

```tsx
{isCourse && (
	<button
		type="button"
		onClick={(e) => {
			e.stopPropagation();
			toggleCourseOverride();
		}}
		className="ml-auto rounded p-0.5 text-gray-400 hover:text-gray-600"
		title={cat.manualOverride ? "Unlock auto-calculation" : "Pin estimate"}
	>
		<span className="text-xs">{cat.manualOverride ? "🔒" : "🔓"}</span>
	</button>
)}
```

4. When the course card is expanded and `manualOverride` is false, make the estimated input read-only and show the computed value:

```tsx
{isCourse && !cat.manualOverride ? (
	<div className="flex flex-col gap-0.5">
		<span className="text-[10px] text-gray-400">Estimated (auto)</span>
		<span className="text-xs font-medium">{formatEur(courseCost)}</span>
	</div>
) : (
	<label className="flex flex-col gap-0.5">
		<span className="text-[10px] text-gray-400">
			Estimated{isCourse ? " (pinned)" : ""}
		</span>
		{/* existing input */}
	</label>
)}
```

5. Remove the old "Cost per hole" input that was specific to the course card (lines 155-179 of the original BudgetPanel) — this config moved to the settings modal.

**Step 2: Verify visually**

Run: `npm run dev`
Verify:
- Lock icon appears on course card
- Clicking it toggles between locked/unlocked
- When unlocked: estimated field is read-only, shows auto-calculated value
- When locked: estimated field is editable, shows stored value

**Step 3: Run lint**

Run: `npx biome check src/components/ui/BudgetPanel.tsx`
Expected: Clean

**Step 4: Commit**

```bash
git add src/components/ui/BudgetPanel.tsx
git commit -m "feat: add lock/unlock toggle for course auto-calculation"
```

---

## Task 7: Add static dashboard hints to budget category cards

**Files:**
- Modify: `src/components/ui/BudgetPanel.tsx`

**Step 1: Import BUDGET_HINTS and add hints to cards**

In `BudgetPanel.tsx`:

1. Import `BUDGET_HINTS` from `"../../constants/budget"`
2. In the category card rendering, after the category name, add:

```tsx
{BUDGET_HINTS[cat.id] && (
	<div className="text-[10px] text-gray-400 italic">
		{BUDGET_HINTS[cat.id]}
	</div>
)}
```

This goes inside the card header button, right after the `<div>` that shows `cat.name`.

**Step 2: Verify visually**

Run: `npm run dev`
Verify:
- UV lighting card shows: "Industry mid-range: €5,500–€9,000 for 12–18 holes"
- Electrical card shows: "Industry mid-range: €10,000–€15,000 for 12–18 holes"
- Sound/POS card shows: "Industry mid-range: €10,000–€15,000 for indoor mini golf"
- Other cards show no hint

**Step 3: Run lint**

Run: `npx biome check src/components/ui/BudgetPanel.tsx`
Expected: Clean

**Step 4: Commit**

```bash
git add src/components/ui/BudgetPanel.tsx
git commit -m "feat: add static dashboard hints to UV/electrical/sound budget cards"
```
