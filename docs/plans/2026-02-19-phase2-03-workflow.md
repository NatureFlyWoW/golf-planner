# Phase 2 — Group C: Workflow (Tasks 13–17)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.
>
> **Environment:** Every Bash call needs `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"` before commands. Working dir: `golf-planner/`. Biome uses tabs.
>
> **Depends on:** Groups A + B complete

---

### Task 13: Install zundo + add temporal middleware to store

**Files:**
- Install: `zundo` package
- Modify: `src/store/store.ts` — wrap with `temporal` middleware
- Modify: `tests/utils/store.test.ts` — verify existing tests still pass with temporal

**Context:** `zundo` provides `temporal` middleware for Zustand that adds undo/redo capability. The middleware order is `temporal(persist(create(...)))` — temporal outermost. Temporal should only track `holes`, `holeOrder`, `selectedId` (not UI state or budget).

**Step 1: Install zundo**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
npm install zundo
```

**Step 2: Update store with temporal middleware**

In `src/store/store.ts`, add import at top:

```typescript
import { temporal } from "zundo";
```

Change the store creation from:

```typescript
export const useStore = create<Store>()(
	persist(
		(set, get) => ({
			// ... store body
		}),
		{
			name: "golf-planner-state",
			partialize: (state) => ({
				holes: state.holes,
				holeOrder: state.holeOrder,
				budget: state.budget,
			}),
		},
	),
);
```

To:

```typescript
export const useStore = create<Store>()(
	temporal(
		persist(
			(set, get) => ({
				// ... all existing store body unchanged
			}),
			{
				name: "golf-planner-state",
				partialize: (state) => ({
					holes: state.holes,
					holeOrder: state.holeOrder,
					budget: state.budget,
				}),
			},
		),
		{
			partialize: (state) => ({
				holes: state.holes,
				holeOrder: state.holeOrder,
				selectedId: state.selectedId,
			}),
			limit: 50,
		},
	),
);
```

**Important:** The store body (all actions) stays exactly the same. Only the wrapping changes.

**Step 3: Run existing tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx vitest run`
Expected: All existing tests pass — `temporal` is transparent to the store API

If tests fail due to temporal state not being reset, update the `beforeEach` in `tests/utils/store.test.ts` to also clear temporal history:

```typescript
beforeEach(() => {
	useStore.setState({
		holes: {},
		holeOrder: [],
		selectedId: null,
		ui: {
			tool: "select",
			placingType: null,
			view: "top",
			sidebarTab: "holes",
			snapEnabled: false,
			showFlowPath: true,
		},
	});
	useStore.temporal?.getState()?.clear();
});
```

**Step 4: Run build check**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc -b && npm run check`
Expected: Clean

**Step 5: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add package.json package-lock.json src/store/store.ts tests/utils/store.test.ts
git commit -m "feat: add zundo temporal middleware for undo/redo history"
```

---

### Task 14: Add undo/redo toolbar buttons + keyboard shortcuts

**Files:**
- Modify: `src/components/ui/Toolbar.tsx` — add undo/redo buttons
- Modify: `src/hooks/useKeyboardControls.ts` — add Ctrl+Z and Ctrl+Shift+Z

**Step 1: Add undo/redo buttons to Toolbar**

In `src/components/ui/Toolbar.tsx`, add import:

```typescript
import { useStore } from "../../store";
```

(Already imported — just need to access temporal store.)

Add these lines inside the component, after existing selectors:

```typescript
const undo = () => useStore.temporal?.getState()?.undo();
const redo = () => useStore.temporal?.getState()?.redo();
const pastStates = useStore.temporal?.getState()?.pastStates;
const futureStates = useStore.temporal?.getState()?.futureStates;
```

**Note on reactivity:** `useStore.temporal` is a vanilla store — to make the buttons react to undo/redo state, use the temporal store's hook. However for simplicity, the buttons can call undo/redo directly and we won't disable them reactively (just call — if empty, nothing happens). This avoids adding a temporal store subscription.

Add undo/redo buttons after the view toggle button and before the `ml-auto` div:

```tsx
<div className="mx-2 h-6 w-px bg-gray-200" />

<button
	type="button"
	onClick={() => useStore.temporal?.getState()?.undo()}
	className="rounded bg-gray-100 px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
	title="Undo (Ctrl+Z)"
>
	&#x21A9;
</button>

<button
	type="button"
	onClick={() => useStore.temporal?.getState()?.redo()}
	className="rounded bg-gray-100 px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
	title="Redo (Ctrl+Shift+Z)"
>
	&#x21AA;
</button>
```

**Step 2: Add keyboard shortcuts**

In `src/hooks/useKeyboardControls.ts`, add this at the **top** of the `handleKeyDown` function, before the `switch` statement (after the `shouldHandleKey` check):

```typescript
// Undo/redo shortcuts
if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
	e.preventDefault();
	if (e.shiftKey) {
		useStore.temporal?.getState()?.redo();
	} else {
		useStore.temporal?.getState()?.undo();
	}
	return;
}
```

**Step 3: Run build + tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc -b && npm run check && npx vitest run`
Expected: Clean

**Step 4: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/components/ui/Toolbar.tsx src/hooks/useKeyboardControls.ts
git commit -m "feat: add undo/redo toolbar buttons and Ctrl+Z/Ctrl+Shift+Z shortcuts"
```

---

### Task 15: Add drag coalescing (temporal pause/resume)

**Files:**
- Modify: `src/components/three/MiniGolfHole.tsx` — pause temporal on drag start, resume on drag end
- Modify: `src/components/three/RotationHandle.tsx` — same for rotation drag

**Context:** Without coalescing, every intermediate drag position creates a separate undo step. By calling `temporal.pause()` on pointer-down and `temporal.resume()` on pointer-up, only the final position is recorded.

**Step 1: Update MiniGolfHole**

In `src/components/three/MiniGolfHole.tsx`, add to `handlePointerDown` (after `setIsDragging(true);`):

```typescript
useStore.temporal?.getState()?.pause();
```

Add to `handlePointerUp` (after `setIsDragging(false);`):

```typescript
useStore.temporal?.getState()?.resume();
```

**Step 2: Update RotationHandle**

In `src/components/three/RotationHandle.tsx`, add to `handlePointerDown` (after `setIsDragging(true);`):

```typescript
useStore.temporal?.getState()?.pause();
```

Add to `handlePointerUp` (after `setIsDragging(false);`):

```typescript
useStore.temporal?.getState()?.resume();
```

**Step 3: Run build + tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc -b && npm run check && npx vitest run`
Expected: Clean

**Step 4: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/components/three/MiniGolfHole.tsx src/components/three/RotationHandle.tsx
git commit -m "feat: coalesce drag operations into single undo steps"
```

---

### Task 16: Create save manager utility + tests

**Files:**
- Create: `src/utils/saveManager.ts`
- Create: `tests/utils/saveManager.test.ts`

**Context:** Named saves are stored in `localStorage` under key `golf-planner-saves` as a JSON string containing `Record<string, SaveSlot>`. Max 10 slots. Each slot has `name`, `holes`, `holeOrder`, `savedAt` (ISO string).

**Step 1: Write the test file**

```typescript
// tests/utils/saveManager.test.ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	deleteSave,
	getSaves,
	loadSave,
	renameSave,
	saveLayout,
} from "../../src/utils/saveManager";

const STORAGE_KEY = "golf-planner-saves";

const mockHoles = {
	"h1": { id: "h1", type: "straight" as const, position: { x: 5, z: 10 }, rotation: 0, name: "Hole 1", par: 2 },
};
const mockOrder = ["h1"];

describe("saveManager", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("saves a layout and retrieves it", () => {
		saveLayout("Test Layout", mockHoles, mockOrder);
		const saves = getSaves();
		const keys = Object.keys(saves);
		expect(keys).toHaveLength(1);
		expect(saves[keys[0]].name).toBe("Test Layout");
		expect(saves[keys[0]].holes).toEqual(mockHoles);
		expect(saves[keys[0]].holeOrder).toEqual(mockOrder);
		expect(saves[keys[0]].savedAt).toBeDefined();
	});

	it("loads a saved layout", () => {
		saveLayout("My Save", mockHoles, mockOrder);
		const saves = getSaves();
		const id = Object.keys(saves)[0];
		const loaded = loadSave(id);
		expect(loaded).not.toBeNull();
		expect(loaded?.holes).toEqual(mockHoles);
		expect(loaded?.holeOrder).toEqual(mockOrder);
	});

	it("returns null when loading non-existent save", () => {
		expect(loadSave("nonexistent")).toBeNull();
	});

	it("renames a save", () => {
		saveLayout("Old Name", mockHoles, mockOrder);
		const id = Object.keys(getSaves())[0];
		renameSave(id, "New Name");
		expect(getSaves()[id].name).toBe("New Name");
	});

	it("deletes a save", () => {
		saveLayout("To Delete", mockHoles, mockOrder);
		const id = Object.keys(getSaves())[0];
		deleteSave(id);
		expect(Object.keys(getSaves())).toHaveLength(0);
	});

	it("enforces max 10 saves", () => {
		for (let i = 0; i < 10; i++) {
			saveLayout(`Save ${i}`, mockHoles, mockOrder);
		}
		expect(Object.keys(getSaves())).toHaveLength(10);
		expect(() => saveLayout("Save 11", mockHoles, mockOrder)).toThrow(
			"Maximum 10 saves reached",
		);
	});

	it("returns empty object when no saves exist", () => {
		expect(getSaves()).toEqual({});
	});
});
```

**Step 2: Run test to verify it fails**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx vitest run tests/utils/saveManager.test.ts`
Expected: FAIL — module not found

**Step 3: Write the implementation**

```typescript
// src/utils/saveManager.ts
import type { Hole } from "../types";

const STORAGE_KEY = "golf-planner-saves";
const MAX_SAVES = 10;

export type SaveSlot = {
	name: string;
	holes: Record<string, Hole>;
	holeOrder: string[];
	savedAt: string;
};

function readStorage(): Record<string, SaveSlot> {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		return JSON.parse(raw) as Record<string, SaveSlot>;
	} catch {
		return {};
	}
}

function writeStorage(saves: Record<string, SaveSlot>) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
}

export function getSaves(): Record<string, SaveSlot> {
	return readStorage();
}

export function saveLayout(
	name: string,
	holes: Record<string, Hole>,
	holeOrder: string[],
): string {
	const saves = readStorage();
	if (Object.keys(saves).length >= MAX_SAVES) {
		throw new Error("Maximum 10 saves reached");
	}
	const id = crypto.randomUUID();
	saves[id] = {
		name,
		holes,
		holeOrder,
		savedAt: new Date().toISOString(),
	};
	writeStorage(saves);
	return id;
}

export function loadSave(id: string): SaveSlot | null {
	const saves = readStorage();
	return saves[id] ?? null;
}

export function renameSave(id: string, name: string) {
	const saves = readStorage();
	if (!saves[id]) return;
	saves[id].name = name;
	writeStorage(saves);
}

export function deleteSave(id: string) {
	const saves = readStorage();
	delete saves[id];
	writeStorage(saves);
}
```

**Step 4: Run test to verify it passes**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx vitest run tests/utils/saveManager.test.ts`
Expected: PASS (all 7 tests)

**Step 5: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/utils/saveManager.ts tests/utils/saveManager.test.ts
git commit -m "feat: add save manager utility with localStorage persistence and tests"
```

---

### Task 17: Create SaveManager UI component

**Files:**
- Create: `src/components/ui/SaveManager.tsx`
- Modify: `src/components/ui/Toolbar.tsx` — add save button that opens SaveManager

**Context:** A dropdown/modal accessible from the toolbar. Shows a list of saved layouts with Load/Rename/Delete actions. Has a "Save As" input to create new saves. Warns on load if there are unsaved changes (dirty state).

**Step 1: Create the SaveManager component**

```tsx
// src/components/ui/SaveManager.tsx
import { useEffect, useRef, useState } from "react";
import { useStore } from "../../store";
import {
	deleteSave,
	getSaves,
	loadSave,
	renameSave,
	saveLayout,
	type SaveSlot,
} from "../../utils/saveManager";

export function SaveManager() {
	const [isOpen, setIsOpen] = useState(false);
	const [saves, setSaves] = useState<Record<string, SaveSlot>>({});
	const [saveName, setSaveName] = useState("");
	const [error, setError] = useState("");
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const panelRef = useRef<HTMLDivElement>(null);

	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);

	function refreshSaves() {
		setSaves(getSaves());
	}

	useEffect(() => {
		if (isOpen) refreshSaves();
	}, [isOpen]);

	// Close on outside click
	useEffect(() => {
		if (!isOpen) return;
		function handleClick(e: MouseEvent) {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				setIsOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [isOpen]);

	function handleSave() {
		const name = saveName.trim();
		if (!name) return;
		try {
			saveLayout(name, holes, holeOrder);
			setSaveName("");
			setError("");
			refreshSaves();
		} catch (e) {
			setError((e as Error).message);
		}
	}

	function handleLoad(id: string) {
		const slot = loadSave(id);
		if (!slot) return;

		const hasHoles = Object.keys(holes).length > 0;
		if (hasHoles && !window.confirm("Load will replace your current layout. Continue?")) {
			return;
		}

		useStore.setState({
			holes: slot.holes,
			holeOrder: slot.holeOrder,
			selectedId: null,
		});
		setIsOpen(false);
	}

	function handleDelete(id: string) {
		if (!window.confirm("Delete this save?")) return;
		deleteSave(id);
		refreshSaves();
	}

	function handleRename(id: string) {
		const name = editName.trim();
		if (!name) return;
		renameSave(id, name);
		setEditingId(null);
		setEditName("");
		refreshSaves();
	}

	const sortedSaves = Object.entries(saves).sort(
		([, a], [, b]) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
	);

	return (
		<div className="relative" ref={panelRef}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
			>
				Saves
			</button>

			{isOpen && (
				<div className="absolute right-0 top-full z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
					<div className="mb-3 flex gap-1">
						<input
							type="text"
							value={saveName}
							onChange={(e) => setSaveName(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSave()}
							placeholder="Save name..."
							className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm"
						/>
						<button
							type="button"
							onClick={handleSave}
							className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700"
						>
							Save
						</button>
					</div>
					{error && <p className="mb-2 text-xs text-red-500">{error}</p>}

					{sortedSaves.length === 0 ? (
						<p className="text-xs text-gray-400">No saves yet</p>
					) : (
						<ul className="flex max-h-60 flex-col gap-1 overflow-y-auto">
							{sortedSaves.map(([id, slot]) => (
								<li
									key={id}
									className="flex items-center gap-1 rounded bg-gray-50 px-2 py-1.5"
								>
									{editingId === id ? (
										<>
											<input
												type="text"
												value={editName}
												onChange={(e) => setEditName(e.target.value)}
												onKeyDown={(e) => e.key === "Enter" && handleRename(id)}
												className="flex-1 rounded border border-gray-200 px-1 py-0.5 text-xs"
												autoFocus
											/>
											<button
												type="button"
												onClick={() => handleRename(id)}
												className="text-xs text-blue-600 hover:underline"
											>
												OK
											</button>
											<button
												type="button"
												onClick={() => setEditingId(null)}
												className="text-xs text-gray-400 hover:underline"
											>
												Cancel
											</button>
										</>
									) : (
										<>
											<div className="flex-1 overflow-hidden">
												<div className="truncate text-xs font-medium">{slot.name}</div>
												<div className="text-[10px] text-gray-400">
													{new Date(slot.savedAt).toLocaleString()}
													{" · "}
													{slot.holeOrder.length} holes
												</div>
											</div>
											<button
												type="button"
												onClick={() => handleLoad(id)}
												className="text-xs text-blue-600 hover:underline"
											>
												Load
											</button>
											<button
												type="button"
												onClick={() => {
													setEditingId(id);
													setEditName(slot.name);
												}}
												className="text-xs text-gray-500 hover:underline"
											>
												Rename
											</button>
											<button
												type="button"
												onClick={() => handleDelete(id)}
												className="text-xs text-red-500 hover:underline"
											>
												Delete
											</button>
										</>
									)}
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}
```

**Step 2: Wire SaveManager into Toolbar**

In `src/components/ui/Toolbar.tsx`, add import:

```typescript
import { SaveManager } from "./SaveManager";
```

In the `ml-auto` div, add `<SaveManager />` next to `<ExportButton />`:

```tsx
<div className="ml-auto flex items-center gap-1">
	<SaveManager />
	<ExportButton />
</div>
```

**Step 3: Run build + all tests**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc -b && npm run check && npx vitest run`
Expected: All tests pass, clean build

**Step 4: Final verification**

Run: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npm run build`
Expected: Successful production build

**Step 5: Commit**

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
git add src/components/ui/SaveManager.tsx src/components/ui/Toolbar.tsx
git commit -m "feat: add SaveManager UI with save/load/rename/delete"
```
