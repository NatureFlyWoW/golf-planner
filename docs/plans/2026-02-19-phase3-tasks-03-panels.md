# Phase 3 — Tasks 7–9: Mobile Panels

> Part of [Phase 3 Implementation Plan](./2026-02-19-phase3-implementation-index.md)
> Design: [Phase 3 Mobile + PWA Design](./2026-02-19-phase3-mobile-pwa-design.md) §3
> Depends on: Tasks 4–6 (BottomToolbar, responsive shell)

---

## Task 7: HoleDrawer (Bottom Drawer)

**Files:**
- Create: `src/components/ui/HoleDrawer.tsx`

### Step 1: Create HoleDrawer component

The design specifies a **bottom drawer at 40% height** showing the hole library. It opens when the user taps "Place" in the bottom toolbar (which sets `activePanel: 'holes'`). Tapping a hole type selects it and closes the drawer.

Create `src/components/ui/HoleDrawer.tsx`:

```tsx
import { HOLE_TYPES } from "../../constants";
import { useStore } from "../../store";
import type { HoleType } from "../../types";

export function HoleDrawer() {
	const activePanel = useStore((s) => s.ui.activePanel);
	const setActivePanel = useStore((s) => s.setActivePanel);
	const setPlacingType = useStore((s) => s.setPlacingType);
	const placingType = useStore((s) => s.ui.placingType);

	if (activePanel !== "holes") return null;

	function handleSelect(type: HoleType) {
		setPlacingType(type);
		setActivePanel(null);
	}

	function handleClose() {
		setActivePanel(null);
	}

	return (
		<>
			{/* Backdrop — tapping outside closes drawer */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: mobile drawer backdrop */}
			<div
				className="fixed inset-0 z-30 bg-black/20 md:hidden"
				onClick={handleClose}
			/>
			{/* Drawer */}
			<div className="fixed inset-x-0 bottom-0 z-40 flex max-h-[40vh] flex-col rounded-t-2xl bg-white shadow-2xl md:hidden">
				{/* Handle bar */}
				<div className="flex justify-center py-2">
					<div className="h-1 w-10 rounded-full bg-gray-300" />
				</div>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-gray-100 px-4 pb-2">
					<span className="text-sm font-semibold">Choose Hole Type</span>
					<button
						type="button"
						onClick={handleClose}
						className="text-gray-400 hover:text-gray-600"
					>
						&#x2715;
					</button>
				</div>
				{/* Hole type list */}
				<div className="flex-1 overflow-y-auto p-3">
					<div className="flex flex-col gap-2">
						{HOLE_TYPES.map((ht) => (
							<button
								key={ht.type}
								type="button"
								onClick={() => handleSelect(ht.type)}
								className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
									placingType === ht.type
										? "border-blue-500 bg-blue-50"
										: "border-gray-200 active:bg-gray-50"
								}`}
							>
								<div
									className="h-10 w-10 rounded"
									style={{ backgroundColor: ht.color }}
								/>
								<div>
									<p className="text-sm font-medium">{ht.label}</p>
									<p className="text-xs text-gray-400">
										{ht.dimensions.width}m &times; {ht.dimensions.length}m
										&middot; Par {ht.defaultPar}
									</p>
								</div>
							</button>
						))}
					</div>
				</div>
			</div>
		</>
	);
}
```

Key design decisions:
- `max-h-[40vh]` — drawer takes 40% of viewport, leaving canvas visible above
- `md:hidden` — never shows on desktop (desktop uses Sidebar)
- Backdrop dismisses the drawer
- Selecting a type calls `setPlacingType` and closes the drawer
- Touch-friendly: larger tap targets (p-3, h-10 w-10 color swatches)

### Step 2: Verify build

```bash
npm run check && npm run build
```

Expected: Clean build.

### Step 3: Commit

```bash
git add src/components/ui/HoleDrawer.tsx
git commit -m "feat: add HoleDrawer bottom sheet for mobile hole selection"
```

---

## Task 8: MobileDetailPanel (Full-Screen Overlay)

**Files:**
- Create: `src/components/ui/MobileDetailPanel.tsx`

### Step 1: Create MobileDetailPanel component

The design specifies a **full-screen overlay** triggered by tapping the info chip in the BottomToolbar. NOT auto-opened on selection. Same content as desktop HoleDetail but with larger touch targets.

Create `src/components/ui/MobileDetailPanel.tsx`:

```tsx
import { HOLE_TYPE_MAP } from "../../constants";
import { useStore } from "../../store";

export function MobileDetailPanel() {
	const activePanel = useStore((s) => s.ui.activePanel);
	const setActivePanel = useStore((s) => s.setActivePanel);
	const selectedId = useStore((s) => s.selectedId);
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);
	const updateHole = useStore((s) => s.updateHole);
	const removeHole = useStore((s) => s.removeHole);

	if (activePanel !== "detail" || !selectedId) return null;

	const hole = holes[selectedId];
	if (!hole) return null;

	const definition = HOLE_TYPE_MAP[hole.type];
	const orderIndex = holeOrder.indexOf(selectedId);

	function handleClose() {
		setActivePanel(null);
	}

	function handleDelete() {
		if (window.confirm(`Delete ${hole.name}?`)) {
			removeHole(selectedId);
			setActivePanel(null);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
				<div className="flex items-center gap-2">
					<div
						className="h-6 w-6 rounded"
						style={{ backgroundColor: definition?.color ?? "#999" }}
					/>
					<span className="text-base font-semibold">
						#{orderIndex + 1} &middot; {definition?.label}
					</span>
				</div>
				<button
					type="button"
					onClick={handleClose}
					className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
				>
					<span className="text-xl">&#x2715;</span>
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-4">
				<div className="flex flex-col gap-5">
					{/* Name */}
					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-gray-500">Name</span>
						<input
							type="text"
							value={hole.name}
							onChange={(e) =>
								updateHole(selectedId, { name: e.target.value })
							}
							className="rounded-lg border border-gray-200 px-3 py-2.5 text-base"
						/>
					</label>

					{/* Par */}
					<label className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-gray-500">Par</span>
						<input
							type="number"
							value={hole.par}
							min={1}
							max={6}
							onChange={(e) =>
								updateHole(selectedId, { par: Number(e.target.value) })
							}
							className="w-24 rounded-lg border border-gray-200 px-3 py-2.5 text-base"
						/>
					</label>

					{/* Rotation — large preset buttons as primary */}
					<div className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-gray-500">Rotation</span>
						<div className="flex gap-2">
							{[0, 90, 180, 270].map((r) => (
								<button
									key={r}
									type="button"
									onClick={() =>
										updateHole(selectedId, { rotation: r })
									}
									className={`h-11 flex-1 rounded-lg text-sm font-medium ${
										hole.rotation === r
											? "bg-blue-600 text-white"
											: "bg-gray-100 text-gray-600 active:bg-gray-200"
									}`}
								>
									{r}&deg;
								</button>
							))}
						</div>
						<input
							type="number"
							value={hole.rotation}
							min={0}
							max={359}
							step={15}
							onChange={(e) =>
								updateHole(selectedId, {
									rotation: ((Number(e.target.value) % 360) + 360) % 360,
								})
							}
							className="mt-1 w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
						/>
					</div>

					{/* Position (read-only) */}
					<div className="text-sm text-gray-400">
						Position: ({hole.position.x.toFixed(1)},{" "}
						{hole.position.z.toFixed(1)})
					</div>

					{/* Delete */}
					<button
						type="button"
						onClick={handleDelete}
						className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-base font-medium text-red-600 active:bg-red-100"
					>
						Delete Hole
					</button>
				</div>
			</div>
		</div>
	);
}
```

Key design decisions:
- `h-11` (44px) rotation preset buttons — meets 44px min touch target
- Confirmation dialog before delete (`window.confirm`)
- `active:` states instead of `hover:` — touch feedback
- Full-screen overlay with close button top-right
- `md:hidden` — never shows on desktop

### Step 2: Verify build

```bash
npm run check && npm run build
```

Expected: Clean build.

### Step 3: Commit

```bash
git add src/components/ui/MobileDetailPanel.tsx
git commit -m "feat: add MobileDetailPanel full-screen overlay"
```

---

## Task 9: Wire Panels into App.tsx

**Files:**
- Modify: `src/App.tsx`

### Step 1: Import and render mobile panels

Add imports at top of `src/App.tsx`:
```tsx
import { HoleDrawer } from "./components/ui/HoleDrawer";
import { MobileDetailPanel } from "./components/ui/MobileDetailPanel";
```

Add the panels inside the outer `div`, after `<BottomToolbar />`:
```tsx
<BottomToolbar />
<HoleDrawer />
<MobileDetailPanel />
```

Both components self-gate on `activePanel` state and `md:hidden`, so they'll only render on mobile when the appropriate panel is open.

### Step 2: Verify the full mobile flow

Start dev server and test at <768px width:
1. Canvas fills screen
2. Bottom toolbar visible with 6 buttons
3. Tap "Place" → HoleDrawer opens (40% height)
4. Tap a hole type → drawer closes, type chip shows in toolbar
5. Tap canvas → hole placed
6. Tap hole to select → info chip shows in toolbar
7. Tap info chip → MobileDetailPanel opens full-screen
8. Edit name/rotation, close → back to canvas
9. "More" → overflow popover with toggles

### Step 3: Verify build

```bash
npm run check && npm run build
```

Expected: Clean build.

### Step 4: Commit

```bash
git add src/App.tsx
git commit -m "feat: wire HoleDrawer and MobileDetailPanel into App"
```
