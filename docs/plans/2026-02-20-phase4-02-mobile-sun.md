# Phase 4 — Tasks 3–5: Mobile Sun Controls

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give mobile users access to sun date/time controls. Lift sunDate state to Zustand, build a MobileSunControls overlay, and wire the existing Sun button in OverflowPopover.

**Prereqs:** Task 2 (polish fixes) committed.

**Environment:** In every Bash call: `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"`

**Reference:** Read `src/components/ui/SunControls.tsx` for the desktop implementation pattern.

---

### Task 3: Lift sunDate from App.tsx useState to Zustand

Currently `sunDate` lives as local React state in App.tsx (line 25). The mobile overlay needs to read/write it, so lift it to the Zustand store.

**Files:**
- Modify: `src/types/ui.ts`
- Modify: `src/store/store.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/ui/SunControls.tsx`

**Step 1: Add sunDate to UIState type**

In `src/types/ui.ts`, add `sunDate` to UIState:

```ts
export type UIState = {
	tool: Tool;
	placingType: HoleType | null;
	view: ViewMode;
	sidebarTab: SidebarTab;
	snapEnabled: boolean;
	showFlowPath: boolean;
	activePanel: ActivePanel;
	sunDate: Date | undefined;
};
```

**Step 2: Add sunDate to store default + action**

In `src/store/store.ts`:

Add to `StoreActions`:
```ts
setSunDate: (date: Date | undefined) => void;
```

Add to `DEFAULT_UI`:
```ts
sunDate: undefined,
```

Add action implementation (after `setActivePanel`):
```ts
setSunDate: (date) => {
	set((state) => ({ ui: { ...state.ui, sunDate: date } }));
},
```

Note: `sunDate` is UI state — NOT persisted (partialize excludes `ui`) and NOT tracked by undo/redo (temporal partialize excludes `ui`). This is correct — sun date is ephemeral.

**Step 3: Update App.tsx to use store instead of useState**

In `src/App.tsx`:

Remove the local state:
```tsx
// DELETE these lines:
const [sunDate, setSunDate] = useState<Date | undefined>(undefined);
```

Remove the `useState` import if no longer used (check if anything else uses it).

Replace with store selectors:
```tsx
const sunDate = useStore((s) => s.ui.sunDate);
const setSunDate = useStore((s) => s.setSunDate);
```

The `useSunPosition(sunDate)` call and all prop passing to `<Hall>`, `<SunIndicator>`, `<SunControls>`, `<LocationBar>` stays the same — the variable names haven't changed.

**Step 4: Update SunControls to use store**

In `src/components/ui/SunControls.tsx`:

Remove the props interface and change to use the store directly:

```tsx
import { useState } from "react";
import { useStore } from "../../store";

const PRESETS = [
	{ label: "Now", date: undefined },
	{ label: "Summer noon", date: new Date(2026, 5, 21, 12, 0) },
	{ label: "Winter noon", date: new Date(2026, 11, 21, 12, 0) },
] as const;

export function SunControls() {
	const selectedDate = useStore((s) => s.ui.sunDate);
	const onDateChange = useStore((s) => s.setSunDate);
	const [showCustom, setShowCustom] = useState(false);
	// ... rest unchanged
```

Update App.tsx to remove the props from `<SunControls>`:
```tsx
// Change from:
<SunControls selectedDate={sunDate} onDateChange={setSunDate} />
// To:
<SunControls />
```

**Step 5: Verify**

Run:
```bash
npm run check && npm run test
```
Expected: Lint clean, all tests pass. Dev server should still work — sun controls desktop behavior unchanged.

**Step 6: Commit**

```bash
git add src/types/ui.ts src/store/store.ts src/App.tsx src/components/ui/SunControls.tsx && git commit -m "refactor: lift sunDate to Zustand store for mobile access"
```

---

### Task 4: Build MobileSunControls overlay

**Files:**
- Create: `src/components/ui/MobileSunControls.tsx`

**Step 1: Create the component**

Create `src/components/ui/MobileSunControls.tsx`:

```tsx
import { useState } from "react";
import { useStore } from "../../store";

const PRESETS = [
	{ label: "Now", date: undefined },
	{ label: "Summer noon", date: new Date(2026, 5, 21, 12, 0) },
	{ label: "Winter noon", date: new Date(2026, 11, 21, 12, 0) },
] as const;

export function MobileSunControls() {
	const activePanel = useStore((s) => s.ui.activePanel);
	const setActivePanel = useStore((s) => s.setActivePanel);
	const selectedDate = useStore((s) => s.ui.sunDate);
	const setSunDate = useStore((s) => s.setSunDate);
	const [showCustom, setShowCustom] = useState(false);

	if (activePanel !== "sun") return null;

	const activePreset =
		selectedDate === undefined
			? "Now"
			: (PRESETS.find(
					(p) => p.date && p.date.getTime() === selectedDate.getTime(),
				)?.label ?? "Custom");

	function handleClose() {
		setActivePanel(null);
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
				<span className="text-base font-semibold">Sun Position</span>
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
				<div className="flex flex-col gap-4">
					{/* Presets */}
					<div className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-gray-500">
							Presets
						</span>
						<div className="flex gap-2">
							{PRESETS.map(({ label, date }) => (
								<button
									key={label}
									type="button"
									onClick={() => {
										setSunDate(date);
										setShowCustom(false);
									}}
									className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
										activePreset === label
											? "bg-amber-500 text-white"
											: "bg-gray-100 text-gray-700 active:bg-gray-200"
									}`}
								>
									{label}
								</button>
							))}
						</div>
					</div>

					{/* Custom toggle */}
					<button
						type="button"
						onClick={() => setShowCustom(!showCustom)}
						className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
							activePreset === "Custom"
								? "bg-amber-500 text-white"
								: "bg-gray-100 text-gray-700 active:bg-gray-200"
						}`}
					>
						Custom Date & Time
					</button>

					{/* Custom date/time inputs */}
					{showCustom && (
						<div className="flex flex-col gap-3">
							<label className="flex flex-col gap-1.5">
								<span className="text-sm font-medium text-gray-500">
									Date
								</span>
								<input
									type="date"
									defaultValue="2026-06-21"
									onChange={(e) => {
										const val = e.target.value;
										if (!val) return;
										const [y, m, d] = val.split("-").map(Number);
										const time = selectedDate ?? new Date();
										setSunDate(
											new Date(
												y,
												m - 1,
												d,
												time.getHours(),
												time.getMinutes(),
											),
										);
									}}
									className="rounded-lg border border-gray-200 px-3 py-2.5 text-base"
								/>
							</label>
							<label className="flex flex-col gap-1.5">
								<span className="text-sm font-medium text-gray-500">
									Time
								</span>
								<input
									type="time"
									defaultValue="12:00"
									onChange={(e) => {
										const val = e.target.value;
										if (!val) return;
										const [h, min] = val.split(":").map(Number);
										const base =
											selectedDate ?? new Date(2026, 5, 21);
										setSunDate(
											new Date(
												base.getFullYear(),
												base.getMonth(),
												base.getDate(),
												h,
												min,
											),
										);
									}}
									className="rounded-lg border border-gray-200 px-3 py-2.5 text-base"
								/>
							</label>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
```

Note: This uses `activePanel === "sun"` which requires updating `ActivePanel` type. See Step 2.

**Step 2: Add "sun" to ActivePanel type**

In `src/types/ui.ts`, update:

```ts
export type ActivePanel = "holes" | "detail" | "budget" | "sun" | null;
```

**Step 3: Verify**

Run:
```bash
npm run check
```
Expected: Lint clean. Component not yet wired to App.

**Step 4: Commit**

```bash
git add src/components/ui/MobileSunControls.tsx src/types/ui.ts && git commit -m "feat: add MobileSunControls fullscreen overlay"
```

---

### Task 5: Wire Sun button + add MobileSunControls to App

**Files:**
- Modify: `src/components/ui/BottomToolbar.tsx:192-198`
- Modify: `src/App.tsx`

**Step 1: Wire Sun button in OverflowPopover**

In `src/components/ui/BottomToolbar.tsx`, change the Sun ToggleBtn (lines 192-198) from:

```tsx
<ToggleBtn
	label="Sun"
	active={false}
	onTap={() => {
		/* TODO: open sun controls overlay in future iteration */
	}}
/>
```

to:

```tsx
<ToggleBtn
	label="Sun"
	active={false}
	onTap={() => {
		setActivePanel("sun");
		onClose();
	}}
/>
```

This requires `setActivePanel` in the OverflowPopover. It's not currently accessible there. Add it:

At the top of the `OverflowPopover` function, add:
```tsx
const setActivePanel = useStore((s) => s.setActivePanel);
```

**Step 2: Add MobileSunControls to App.tsx**

In `src/App.tsx`, add the import:
```tsx
import { MobileSunControls } from "./components/ui/MobileSunControls";
```

Add the component after `<MobileDetailPanel />` (before the closing `</div>`):
```tsx
<MobileSunControls />
```

**Step 3: Verify**

Run:
```bash
npm run check && npm run test
```
Expected: Lint clean, all tests pass.

Test manually: Open dev server on mobile viewport. Tap More → Sun → should open fullscreen overlay with presets and custom date/time. Selecting a preset should update the sun indicator on the canvas.

**Step 4: Commit**

```bash
git add src/components/ui/BottomToolbar.tsx src/App.tsx && git commit -m "feat: wire mobile sun controls overlay to overflow popover"
```
