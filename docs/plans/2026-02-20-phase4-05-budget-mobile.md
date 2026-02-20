# Phase 4 — Tasks 11–12: Budget Panel (Mobile)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the MobileBudgetPanel fullscreen overlay, add Budget button to the overflow popover, and wire everything into App.tsx.

**Prereqs:** Task 10 (desktop budget panel) committed.

**Environment:** In every Bash call: `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"`

---

### Task 11: Build MobileBudgetPanel overlay

**Files:**
- Create: `src/components/ui/MobileBudgetPanel.tsx`

**Step 1: Create the component**

The mobile overlay is a thin wrapper around BudgetPanel. It adds the fullscreen overlay chrome (header + close button) and delegates the content to the shared BudgetPanel.

Create `src/components/ui/MobileBudgetPanel.tsx`:

```tsx
import { useStore } from "../../store";
import { BudgetPanel } from "./BudgetPanel";

export function MobileBudgetPanel() {
	const activePanel = useStore((s) => s.ui.activePanel);
	const setActivePanel = useStore((s) => s.setActivePanel);

	if (activePanel !== "budget") return null;

	function handleClose() {
		setActivePanel(null);
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
				<span className="text-base font-semibold">Budget</span>
				<button
					type="button"
					onClick={handleClose}
					className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
				>
					<span className="text-xl">&#x2715;</span>
				</button>
			</div>

			{/* Budget content — reuse shared component */}
			<div className="flex min-h-0 flex-1 flex-col">
				<BudgetPanel />
			</div>
		</div>
	);
}
```

Note: BudgetPanel already handles its own layout (summary header, scrollable card list, sticky footer). The mobile wrapper just adds the overlay chrome and close button.

**Step 2: Verify lint**

Run:
```bash
npm run check
```
Expected: Lint clean.

**Step 3: Commit**

```bash
git add src/components/ui/MobileBudgetPanel.tsx && git commit -m "feat: add MobileBudgetPanel fullscreen overlay"
```

---

### Task 12: Wire Budget button + MobileBudgetPanel to App

**Files:**
- Modify: `src/components/ui/BottomToolbar.tsx`
- Modify: `src/App.tsx`

**Step 1: Add Budget button to OverflowPopover**

In `src/components/ui/BottomToolbar.tsx`, in the OverflowPopover component, add a Budget button. Place it after the Export button in the popover grid:

```tsx
<button
	type="button"
	onClick={() => {
		setActivePanel("budget");
		onClose();
	}}
	className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
>
	Budget
</button>
```

Note: `setActivePanel` was already added to OverflowPopover in Task 5 (Sun button wiring). If not, add `const setActivePanel = useStore((s) => s.setActivePanel);` to the component.

The popover currently has a 2-column grid (`grid grid-cols-2`). With the Budget button, there will be 7 items (Snap, Flow, 3D, Sun, Save, Export, Budget). That's 4 rows in a 2-col grid with one cell empty. Alternatively, adjust to 3 columns if it looks better — but 2 columns is likely fine. The implementer should check visually and adjust if needed.

**Step 2: Add MobileBudgetPanel to App.tsx**

In `src/App.tsx`, add the import:

```tsx
import { MobileBudgetPanel } from "./components/ui/MobileBudgetPanel";
```

Add the component after `<MobileSunControls />`:

```tsx
<MobileBudgetPanel />
```

**Step 3: Verify everything**

Run:
```bash
npm run check && npm run test && npm run build
```
Expected: Lint clean, all tests pass, production build succeeds.

Test manually on desktop:
- Budget sidebar tab shows 14 categories with estimates
- Click a card to expand, edit estimated/actual/notes
- Course card shows auto-calc hint
- Summary header shows totals
- Add/remove holes on canvas → course auto-calc hint updates

Test manually on mobile viewport:
- Tap More → Budget → fullscreen overlay opens
- Same 14 categories, editable
- Close button works
- Tap More → Sun → sun controls work
- Export includes budget data

**Step 4: Commit**

```bash
git add src/components/ui/BottomToolbar.tsx src/App.tsx && git commit -m "feat: wire MobileBudgetPanel and budget button to overflow popover"
```

**Step 5: Final verification commit**

If all checks pass, this is the Phase 4 definition of done:

- [x] Budget tab on desktop with 14 categories
- [x] Editable estimated/actual/notes
- [x] Course auto-calc hint
- [x] Progress bars with color thresholds
- [x] Contingency + grand total
- [x] Mobile budget overlay from overflow menu
- [x] Polish fixes (favicon, par clamp, backdrop a11y, sun controls)
- [x] Lint clean, tests pass, build succeeds
