# Phase 4 — Tasks 9–10: Budget Panel (Desktop)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the BudgetPanel component with summary header, category card list, and totals footer. Wire it into the desktop sidebar.

**Prereqs:** Task 8 (budget store + auto-init) committed. Budget data is populated on load.

**Environment:** In every Bash call: `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"`

**Reference:** See `docs/plans/2026-02-20-phase4-polish-budget-design.md` for the ASCII mockup and detailed specs.

---

### Task 9: Build BudgetPanel component

**Files:**
- Create: `src/components/ui/BudgetPanel.tsx`

**Step 1: Create the component**

Create `src/components/ui/BudgetPanel.tsx`. This is the shared component used by both desktop sidebar and mobile overlay.

```tsx
import { useRef, useState } from "react";
import { useStore } from "../../store";

/** Format number as €X,XXX for display */
function formatEur(n: number): string {
	return `€${n.toLocaleString("de-AT", { maximumFractionDigits: 0 })}`;
}

/** Progress bar color based on actual/estimated ratio */
function progressColor(ratio: number): string {
	if (ratio > 1) return "bg-red-500";
	if (ratio > 0.8) return "bg-amber-500";
	return "bg-blue-500";
}

export function BudgetPanel() {
	const budget = useStore((s) => s.budget);
	const updateBudget = useStore((s) => s.updateBudget);
	const budgetConfig = useStore((s) => s.budgetConfig);
	const setBudgetConfig = useStore((s) => s.setBudgetConfig);
	const holeCount = useStore((s) => s.holeOrder.length);

	const [expandedId, setExpandedId] = useState<string | null>(null);
	const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

	const categories = Object.values(budget);
	const subtotal = categories.reduce((sum, c) => sum + c.estimated, 0);
	const actualTotal = categories.reduce((sum, c) => sum + c.actual, 0);
	const contingency = subtotal * 0.1;
	const grandTotal = subtotal + contingency;
	const variance = grandTotal - actualTotal;
	const courseAutoCalc = holeCount * budgetConfig.costPerHole;

	function handleExpand(id: string) {
		const nextId = expandedId === id ? null : id;
		setExpandedId(nextId);
		if (nextId) {
			// Scroll expanded card into view after render
			requestAnimationFrame(() => {
				cardRefs.current[nextId]?.scrollIntoView({
					behavior: "smooth",
					block: "nearest",
				});
			});
		}
	}

	return (
		<div className="flex h-full flex-col">
			{/* Summary header */}
			<div className="border-b border-gray-200 px-3 py-2">
				<div className="flex items-baseline justify-between">
					<span className="text-xs text-gray-500">Estimated</span>
					<span className="text-sm font-semibold">
						{formatEur(grandTotal)}
					</span>
				</div>
				<div className="flex items-baseline justify-between">
					<span className="text-xs text-gray-500">Actual</span>
					<span className="text-sm font-semibold">
						{formatEur(actualTotal)}
					</span>
				</div>
				<div className="mt-1 flex items-baseline justify-between">
					<span className="text-xs text-gray-500">Variance</span>
					<span
						className={`text-xs font-medium ${
							variance >= 0 ? "text-green-600" : "text-red-600"
						}`}
					>
						{variance >= 0 ? "▼" : "▲"} {formatEur(Math.abs(variance))}
						{variance >= 0 ? " under" : " over"}
					</span>
				</div>
			</div>

			{/* Category cards — scrollable */}
			<div className="flex-1 overflow-y-auto p-2">
				<div className="flex flex-col gap-2">
					{categories.map((cat) => {
						const ratio =
							cat.estimated > 0 ? cat.actual / cat.estimated : 0;
						const isExpanded = expandedId === cat.id;
						const isCourse = cat.id === "course";

						return (
							<div
								key={cat.id}
								ref={(el) => {
									cardRefs.current[cat.id] = el;
								}}
								className="rounded-lg border border-gray-200 bg-white"
							>
								{/* Card header — clickable to expand */}
								<button
									type="button"
									onClick={() => handleExpand(cat.id)}
									className="w-full px-2.5 py-2 text-left"
								>
									<div className="text-xs font-medium text-gray-700">
										{cat.name}
									</div>
									<div className="mt-1 flex gap-2">
										<div className="flex items-center gap-1">
											<span className="text-[10px] text-gray-400">
												Est
											</span>
											<span className="text-xs font-medium">
												{formatEur(cat.estimated)}
											</span>
										</div>
										<div className="flex items-center gap-1">
											<span className="text-[10px] text-gray-400">
												Act
											</span>
											<span className="text-xs font-medium">
												{formatEur(cat.actual)}
											</span>
										</div>
									</div>
									{/* Auto-calc hint for course */}
									{isCourse && (
										<div className="mt-0.5 text-[10px] text-amber-600">
											Auto: {holeCount} × {formatEur(budgetConfig.costPerHole)} ={" "}
											{formatEur(courseAutoCalc)}
										</div>
									)}
									{/* Progress bar */}
									<div className="mt-1.5 h-1 w-full rounded-full bg-gray-100">
										<div
											className={`h-1 rounded-full transition-all ${progressColor(ratio)}`}
											style={{
												width: `${Math.min(100, ratio * 100)}%`,
											}}
										/>
									</div>
								</button>

								{/* Expanded: edit fields */}
								{isExpanded && (
									<div className="border-t border-gray-100 px-2.5 py-2">
										<div className="flex flex-col gap-2">
											<label className="flex flex-col gap-0.5">
												<span className="text-[10px] text-gray-400">
													Estimated
												</span>
												<div className="flex items-center gap-1">
													<span className="text-xs text-gray-400">
														€
													</span>
													<input
														type="number"
														value={cat.estimated}
														min={0}
														onChange={(e) =>
															updateBudget(cat.id, {
																estimated: Math.max(
																	0,
																	Number(e.target.value),
																),
															})
														}
														className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
													/>
												</div>
											</label>
											{/* Cost per hole config (course only) */}
											{isCourse && (
												<label className="flex flex-col gap-0.5">
													<span className="text-[10px] text-gray-400">
														Cost per hole
													</span>
													<div className="flex items-center gap-1">
														<span className="text-xs text-gray-400">
															€
														</span>
														<input
															type="number"
															value={budgetConfig.costPerHole}
															min={0}
															onChange={(e) =>
																setBudgetConfig({
																	costPerHole: Math.max(
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
											<label className="flex flex-col gap-0.5">
												<span className="text-[10px] text-gray-400">
													Actual
												</span>
												<div className="flex items-center gap-1">
													<span className="text-xs text-gray-400">
														€
													</span>
													<input
														type="number"
														value={cat.actual}
														min={0}
														onChange={(e) =>
															updateBudget(cat.id, {
																actual: Math.max(
																	0,
																	Number(e.target.value),
																),
															})
														}
														className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
													/>
												</div>
											</label>
											<label className="flex flex-col gap-0.5">
												<span className="text-[10px] text-gray-400">
													Notes
												</span>
												<textarea
													value={cat.notes}
													onChange={(e) =>
														updateBudget(cat.id, {
															notes: e.target.value,
														})
													}
													rows={2}
													className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
												/>
											</label>
										</div>
									</div>
								)}
							</div>
						);
					})}
				</div>
			</div>

			{/* Footer: contingency + total */}
			<div className="border-t border-gray-200 px-3 py-2">
				<div className="flex items-baseline justify-between">
					<span className="text-[10px] text-gray-400">
						Contingency (10%)
					</span>
					<span className="text-xs text-gray-600">
						{formatEur(contingency)}
					</span>
				</div>
				<div className="mt-0.5 flex items-baseline justify-between">
					<span className="text-xs font-semibold text-gray-700">
						Grand Total
					</span>
					<span className="text-sm font-bold">{formatEur(grandTotal)}</span>
				</div>
			</div>
		</div>
	);
}
```

**Step 2: Verify lint**

Run:
```bash
npm run check
```
Expected: Lint clean.

**Step 3: Commit**

```bash
git add src/components/ui/BudgetPanel.tsx && git commit -m "feat: add BudgetPanel component with summary, cards, and progress bars"
```

---

### Task 10: Wire BudgetPanel into Sidebar

**Files:**
- Modify: `src/components/ui/Sidebar.tsx`

**Step 1: Import BudgetPanel**

In `src/components/ui/Sidebar.tsx`, add the import:

```tsx
import { BudgetPanel } from "./BudgetPanel";
```

**Step 2: Replace placeholder**

Change the budget tab content (lines 37-39) from:

```tsx
{activeTab === "budget" && (
	<p className="text-xs text-gray-400">Budget tracker — Phase 4</p>
)}
```

to:

```tsx
{activeTab === "budget" && <BudgetPanel />}
```

**Important:** The BudgetPanel needs to fill the full height of the sidebar content area. The current wrapper `<div className="flex-1 overflow-y-auto p-3">` handles scrolling. But BudgetPanel has its own internal scroll area, so the sidebar content div's `overflow-y-auto` and `p-3` may conflict.

Update the sidebar to conditionally remove padding for the budget tab (BudgetPanel manages its own padding):

```tsx
<div
	className={`flex-1 overflow-y-auto ${activeTab === "budget" ? "" : "p-3"}`}
>
	{activeTab === "holes" && <HoleLibrary />}
	{activeTab === "detail" && <HoleDetail />}
	{activeTab === "budget" && <BudgetPanel />}
</div>
```

Actually, simpler approach: give BudgetPanel `overflow-hidden` on the parent and let BudgetPanel manage its own layout with `h-full`. The current Sidebar content div should change to:

```tsx
<div className={`flex min-h-0 flex-1 flex-col ${activeTab === "budget" ? "" : "overflow-y-auto p-3"}`}>
	{activeTab === "holes" && <HoleLibrary />}
	{activeTab === "detail" && <HoleDetail />}
	{activeTab === "budget" && <BudgetPanel />}
</div>
```

The `min-h-0` + `flex-1` + `flex-col` ensures BudgetPanel can use `h-full` and have its own internal scroll.

**Step 3: Verify**

Run:
```bash
npm run check && npm run test
```
Expected: Lint clean, all tests pass.

Test manually: Open dev server, click Budget tab in sidebar. Should see 14 categories with estimated values, summary header with ~€254k estimated, progress bars, and contingency footer. Click a card to expand and edit values.

**Step 4: Commit**

```bash
git add src/components/ui/Sidebar.tsx && git commit -m "feat: wire BudgetPanel into sidebar budget tab"
```
