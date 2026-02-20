# Phase 7 — Task 1: State + Store

**Depends on:** Nothing

## Step 1: Add `uvMode` to UIState type

**File:** `src/types/ui.ts`

Current content (lines 8-17):
```typescript
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

**Add** `uvMode: boolean;` after `sunDate`:
```typescript
export type UIState = {
	tool: Tool;
	placingType: HoleType | null;
	view: ViewMode;
	sidebarTab: SidebarTab;
	snapEnabled: boolean;
	showFlowPath: boolean;
	activePanel: ActivePanel;
	sunDate: Date | undefined;
	uvMode: boolean;
};
```

## Step 2: Add default + action to store

**File:** `src/store/store.ts`

### 2a: Add `toggleUvMode` to StoreActions

Current `StoreActions` type (lines 34-52). Add after `toggleCourseOverride`:
```typescript
toggleUvMode: () => void;
```

### 2b: Add `uvMode: false` to DEFAULT_UI

Current `DEFAULT_UI` (lines 64-73). Add after `sunDate: undefined,`:
```typescript
uvMode: false,
```

### 2c: Implement `toggleUvMode` action

Add after `toggleCourseOverride` implementation (after line 234):
```typescript
toggleUvMode: () => {
	set((state) => ({
		ui: { ...state.ui, uvMode: !state.ui.uvMode },
	}));
},
```

**Note:** `uvMode` is NOT persisted — the existing `partialize` on lines 239-244 only includes `holes`, `holeOrder`, `budget`, `budgetConfig`. No changes needed there.

**Note:** `uvMode` is NOT undo-tracked — the temporal `partialize` on lines 262-266 only includes `holes`, `holeOrder`, `selectedId`. No changes needed there.

## Step 3: Run lint + type check

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
npm run check && npx tsc --noEmit
```

Expected: Clean pass.

## Step 4: Commit

```bash
git add src/types/ui.ts src/store/store.ts
git commit -m "feat(phase7): add uvMode state and toggleUvMode action"
```
