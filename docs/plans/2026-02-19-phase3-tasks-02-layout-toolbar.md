# Phase 3 — Tasks 4–6: Responsive Layout + Bottom Toolbar

> Part of [Phase 3 Implementation Plan](./2026-02-19-phase3-implementation-index.md)
> Design: [Phase 3 Mobile + PWA Design](./2026-02-19-phase3-mobile-pwa-design.md) §1, §2
> Depends on: Tasks 1–3 (foundation)

---

## Task 4: Responsive Visibility Classes

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/ui/Toolbar.tsx`
- Modify: `src/components/ui/Sidebar.tsx`
- Modify: `src/components/ui/LocationBar.tsx`
- Modify: `src/components/ui/MiniMap.tsx`
- Modify: `src/components/ui/KeyboardHelp.tsx`

Tailwind is mobile-first: base classes apply to all, `md:` applies at >=768px.

### Step 1: Make Toolbar desktop-only

In `src/components/ui/Toolbar.tsx`, the root div (line 23):

Current:
```tsx
<div className="flex items-center gap-1 border-b border-gray-200 bg-white px-3 py-2">
```

Replace with:
```tsx
<div className="hidden items-center gap-1 border-b border-gray-200 bg-white px-3 py-2 md:flex">
```

`hidden` by default (mobile), `md:flex` at desktop.

### Step 2: Make Sidebar desktop-only

In `src/components/ui/Sidebar.tsx`, the root div (line 17):

Current:
```tsx
<div className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
```

Replace with:
```tsx
<div className="hidden h-full w-64 flex-col border-r border-gray-200 bg-white md:flex">
```

### Step 3: Make LocationBar desktop-only

In `src/components/ui/LocationBar.tsx`, find the root element and add `hidden md:block` (or `hidden md:flex` depending on its layout). The component's outermost div needs:

```tsx
className="hidden md:block ..."
```

(Preserve existing classes, just prepend `hidden md:block`.)

### Step 4: Make MiniMap desktop-only

In `src/components/ui/MiniMap.tsx`, the root element needs `hidden md:block`:

```tsx
className="hidden md:block ..."
```

### Step 5: Make KeyboardHelp desktop-only

In `src/components/ui/KeyboardHelp.tsx`, the root element needs `hidden md:block`:

```tsx
className="hidden md:block ..."
```

### Step 6: Add `touchAction: 'none'` to canvas container

In `src/App.tsx`, the canvas wrapper div (line 29):

Current:
```tsx
<div
	className="relative flex-1"
	style={{ cursor: tool === "delete" ? "crosshair" : "default" }}
>
```

Replace with:
```tsx
<div
	className="relative flex-1"
	style={{
		cursor: tool === "delete" ? "crosshair" : "default",
		touchAction: "none",
	}}
>
```

### Step 7: Verify build + visual check

```bash
npm run build
```

Expected: Build succeeds. On desktop (>=768px), layout unchanged. Below 768px, only the canvas is visible (no toolbar, no sidebar, no footer overlays).

### Step 8: Commit

```bash
git add src/App.tsx src/components/ui/Toolbar.tsx src/components/ui/Sidebar.tsx src/components/ui/LocationBar.tsx src/components/ui/MiniMap.tsx src/components/ui/KeyboardHelp.tsx
git commit -m "feat: add responsive visibility classes for mobile layout"
```

---

## Task 5: BottomToolbar Component

**Files:**
- Create: `src/components/ui/BottomToolbar.tsx`
- Modify: `src/App.tsx` (wire in)

### Step 1: Create BottomToolbar

Create `src/components/ui/BottomToolbar.tsx`:

```tsx
import { useState } from "react";
import { useStore } from "../../store";
import type { HoleType, Tool } from "../../types";

const tools: { tool: Tool; label: string; icon: string }[] = [
	{ tool: "select", label: "Sel", icon: "\u2196" },
	{ tool: "place", label: "Place", icon: "+" },
	{ tool: "delete", label: "Del", icon: "\u2715" },
];

export function BottomToolbar() {
	const activeTool = useStore((s) => s.ui.tool);
	const setTool = useStore((s) => s.setTool);
	const placingType = useStore((s) => s.ui.placingType);
	const setPlacingType = useStore((s) => s.setPlacingType);
	const selectedId = useStore((s) => s.selectedId);
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);
	const activePanel = useStore((s) => s.ui.activePanel);
	const setActivePanel = useStore((s) => s.setActivePanel);
	const [showOverflow, setShowOverflow] = useState(false);

	const selectedHole = selectedId ? holes[selectedId] : null;
	const selectedIndex = selectedId ? holeOrder.indexOf(selectedId) : -1;

	function handleToolTap(tool: Tool) {
		if (tool === "place") {
			// Toggle the hole drawer
			if (activePanel === "holes") {
				setActivePanel(null);
			} else {
				setActivePanel("holes");
			}
		} else {
			setTool(tool);
			setActivePanel(null);
		}
	}

	function handleInfoChipTap() {
		if (activePanel === "detail") {
			setActivePanel(null);
		} else {
			setActivePanel("detail");
		}
	}

	return (
		<div
			className="flex flex-col border-t border-gray-200 bg-white md:hidden"
			style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
		>
			{/* Info chip row — only when hole selected */}
			{selectedHole && (
				<button
					type="button"
					onClick={handleInfoChipTap}
					className="flex items-center gap-2 border-b border-gray-100 px-3 py-1.5"
				>
					<span className="text-xs font-medium text-gray-700">
						Hole {selectedIndex + 1} &middot; {selectedHole.type}
					</span>
					<span className="text-[10px] text-gray-400">tap for details</span>
				</button>
			)}

			{/* Placing type chip */}
			{placingType && (
				<div className="flex items-center gap-2 border-b border-gray-100 px-3 py-1">
					<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
						{placingType}
					</span>
					<button
						type="button"
						onClick={() => {
							setPlacingType(null);
							setTool("select");
						}}
						className="text-xs text-gray-400 hover:text-gray-600"
					>
						&#x2715;
					</button>
				</div>
			)}

			{/* Primary toolbar rail */}
			<div className="flex h-14 items-center justify-around px-2">
				{tools.map(({ tool, label, icon }) => (
					<button
						type="button"
						key={tool}
						onClick={() => handleToolTap(tool)}
						className={`flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 ${
							activeTool === tool
								? "bg-blue-600 text-white"
								: "text-gray-600"
						}`}
					>
						<span className="text-lg">{icon}</span>
						<span className="text-[10px]">{label}</span>
					</button>
				))}

				<div className="h-8 w-px bg-gray-200" />

				{/* Undo */}
				<button
					type="button"
					onClick={() => useStore.temporal?.getState()?.undo()}
					className="flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 text-gray-600"
				>
					<span className="text-lg">&#x21A9;</span>
					<span className="text-[10px]">Undo</span>
				</button>

				{/* Redo */}
				<button
					type="button"
					onClick={() => useStore.temporal?.getState()?.redo()}
					className="flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 text-gray-600"
				>
					<span className="text-lg">&#x21AA;</span>
					<span className="text-[10px]">Redo</span>
				</button>

				<div className="h-8 w-px bg-gray-200" />

				{/* More (overflow) */}
				<button
					type="button"
					onClick={() => setShowOverflow((v) => !v)}
					className={`relative flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 ${
						showOverflow ? "bg-gray-200 text-gray-800" : "text-gray-600"
					}`}
				>
					<span className="text-lg">&middot;&middot;&middot;</span>
					<span className="text-[10px]">More</span>
				</button>
			</div>

			{/* Overflow popover rendered in Task 6 */}
			{showOverflow && (
				<OverflowPopover onClose={() => setShowOverflow(false)} />
			)}
		</div>
	);
}

function OverflowPopover({ onClose }: { onClose: () => void }) {
	// Placeholder — implemented in Task 6
	return null;
}
```

### Step 2: Wire BottomToolbar into App.tsx

In `src/App.tsx`, add import:
```tsx
import { BottomToolbar } from "./components/ui/BottomToolbar";
```

Add `<BottomToolbar />` after the `LocationBar` in the JSX — it will be the last child inside the outer `div`:

```tsx
<LocationBar sunData={sunData} />
<BottomToolbar />
```

The `md:hidden` class on BottomToolbar ensures it only shows on mobile.

### Step 3: Verify build

```bash
npm run check && npm run build
```

Expected: Clean build. BottomToolbar hidden on desktop, visible below 768px.

### Step 4: Commit

```bash
git add src/components/ui/BottomToolbar.tsx src/App.tsx
git commit -m "feat: add BottomToolbar component for mobile"
```

---

## Task 6: Overflow Popover

**Files:**
- Modify: `src/components/ui/BottomToolbar.tsx` (replace `OverflowPopover` placeholder)

### Step 1: Implement OverflowPopover

Replace the placeholder `OverflowPopover` function in `src/components/ui/BottomToolbar.tsx` with:

```tsx
function OverflowPopover({ onClose }: { onClose: () => void }) {
	const snapEnabled = useStore((s) => s.ui.snapEnabled);
	const toggleSnap = useStore((s) => s.toggleSnap);
	const showFlowPath = useStore((s) => s.ui.showFlowPath);
	const toggleFlowPath = useStore((s) => s.toggleFlowPath);
	const view = useStore((s) => s.ui.view);
	const setView = useStore((s) => s.setView);

	function handleToggle(fn: () => void) {
		fn();
		// Don't close — let user toggle multiple things
	}

	return (
		<>
			{/* Backdrop */}
			{/* biome-ignore lint/a11y/useKeyWithClickEvents: mobile backdrop */}
			<div
				className="fixed inset-0 z-40"
				onClick={onClose}
			/>
			{/* Popover */}
			<div className="absolute bottom-16 right-2 z-50 grid grid-cols-2 gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
				<ToggleBtn
					label="Snap"
					active={snapEnabled}
					onTap={() => handleToggle(toggleSnap)}
				/>
				<ToggleBtn
					label="Flow"
					active={showFlowPath}
					onTap={() => handleToggle(toggleFlowPath)}
				/>
				<ToggleBtn
					label={view === "top" ? "3D" : "2D"}
					active={false}
					onTap={() => setView(view === "top" ? "3d" : "top")}
				/>
				<ToggleBtn label="Sun" active={false} onTap={() => {/* Sun controls — wired in a later phase if needed */}} />
				<button
					type="button"
					onClick={() => {
						// Trigger save — reuse SaveManager logic or dispatch
						onClose();
					}}
					className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
				>
					Save
				</button>
				<button
					type="button"
					onClick={() => {
						// Trigger export — reuse ExportButton logic
						onClose();
					}}
					className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700"
				>
					Export
				</button>
			</div>
		</>
	);
}

function ToggleBtn({
	label,
	active,
	onTap,
}: {
	label: string;
	active: boolean;
	onTap: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onTap}
			className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
				active
					? "bg-blue-600 text-white"
					: "bg-gray-100 text-gray-700"
			}`}
		>
			{label}
		</button>
	);
}
```

### Step 2: Add badge indicator on More button

In the main `BottomToolbar` component, compute whether any toggles are active to show a badge on the More button. Add before the return:

```tsx
const snapEnabled = useStore((s) => s.ui.snapEnabled);
const showFlowPath = useStore((s) => s.ui.showFlowPath);
const hasActiveToggles = snapEnabled || showFlowPath;
```

Then add a badge dot to the More button (inside the button, after the icon):

```tsx
{hasActiveToggles && (
	<span className="absolute right-1 top-0 h-2 w-2 rounded-full bg-blue-500" />
)}
```

### Step 3: Verify build

```bash
npm run check && npm run build
```

Expected: Clean build. Overflow popover opens above More button on mobile.

### Step 4: Commit

```bash
git add src/components/ui/BottomToolbar.tsx
git commit -m "feat: add overflow popover to BottomToolbar"
```
