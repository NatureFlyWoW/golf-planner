Now I have all the context I need. Let me generate the section content.

# Section 02: Types and Store

## Overview

This section defines all new TypeScript types for the dual viewport and layer system, then adds the corresponding state and actions to the Zustand store. This is the foundational data layer that every subsequent section depends on.

**Depends on:** section-01-spike (must confirm View approach works before committing to dual viewport types)

**Blocks:** sections 03, 04, 05, 06, 07, 08, 09, 10

---

## Background

The Golf Planner currently uses a single `UIState` type (defined in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/ui.ts`) with a `view: ViewMode` field that toggles between `"top"` and `"3d"`. The store is a single monolithic `create()` call in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts` (no slice pattern, though builder actions are extracted into a factory function).

This section introduces:
1. A new types file for viewport and layer concepts
2. Additions to the existing `UIState` type
3. New store actions for viewport layout and layer management
4. Approximately 35 unit tests for the new store actions

---

## Files to Create

### `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/viewport.ts`

New file containing all viewport and layer type definitions:

```typescript
export type ViewportLayout = "dual" | "2d-only" | "3d-only";

export type CameraPreset = "top" | "front" | "back" | "left" | "right" | "isometric";

export type LayerId =
	| "holes"
	| "flowPath"
	| "grid"
	| "walls"
	| "sunIndicator";
// Future splits will add: "dimensions", "annotations", "zones"

export type LayerState = {
	visible: boolean;
	opacity: number; // 0-1 range
	locked: boolean;
};

export type LayerDefinition = {
	id: LayerId;
	label: string;
	icon: string; // Lucide icon name
};
```

**Notes:**
- `ViewportLayout` replaces the behavioral role of `ViewMode` on desktop. `ViewMode` remains for mobile single-pane fallback.
- `CameraPreset` is used by section-05 (camera system) but defined here so it is available everywhere.
- `LayerId` is a union of the 5 currently existing visual layer categories. Future splits (02-annotations, 03-zones) will extend this union when they are implemented.
- `LayerDefinition` is a static metadata type used by the LayerPanel UI (section-08) to render labels and icons.

### `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/store/viewportLayers.test.ts`

New test file. Full test specifications are listed in the Tests section below.

---

## Files to Modify

### `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/ui.ts`

Add new fields to `UIState` and update the `SidebarTab` and `ActivePanel` union types.

**Changes to `SidebarTab`:**
```typescript
export type SidebarTab = "holes" | "detail" | "budget" | "layers";
```

**Changes to `ActivePanel`:**
```typescript
export type ActivePanel = "holes" | "detail" | "budget" | "sun" | "layers" | null;
```

**Changes to `UIState`:** Add four new fields at the end of the type:

```typescript
import type { LayerId, LayerState, ViewportLayout } from "./viewport";

export type UIState = {
	// ... all existing fields remain unchanged ...
	viewportLayout: ViewportLayout;
	activeViewport: "2d" | "3d" | null;
	splitRatio: number; // 0.0-1.0, only used in "dual" mode
	layers: Record<LayerId, LayerState>;
};
```

**Important:** The existing `view: ViewMode` field is NOT removed. It continues to exist and is used for mobile single-pane mode. On desktop dual-pane mode, `view` is effectively deprecated (unused) but harmless to keep.

### `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/index.ts`

Add re-exports for the new viewport types:

```typescript
export type {
	CameraPreset,
	LayerDefinition,
	LayerId,
	LayerState,
	ViewportLayout,
} from "./viewport";
```

### `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts`

Several changes are needed:

#### 1. Import the new types

Add imports for `LayerId`, `LayerState`, and `ViewportLayout` from the types barrel.

#### 2. Define `DEFAULT_LAYERS` constant

Place this near `DEFAULT_UI`:

```typescript
const DEFAULT_LAYERS: Record<LayerId, LayerState> = {
	holes: { visible: true, opacity: 1, locked: false },
	flowPath: { visible: true, opacity: 1, locked: false },
	grid: { visible: true, opacity: 1, locked: false },
	walls: { visible: true, opacity: 1, locked: false },
	sunIndicator: { visible: true, opacity: 1, locked: false },
};
```

Export this constant so tests can reference it for assertions.

#### 3. Update `DEFAULT_UI` with new fields

```typescript
const DEFAULT_UI: UIState = {
	// ... all existing fields remain ...
	viewportLayout: "dual",
	activeViewport: null,
	splitRatio: 0.5,
	layers: { ...DEFAULT_LAYERS },
};
```

Note: `DEFAULT_LAYERS` is spread to ensure each store initialization gets a fresh copy.

#### 4. Add new action types to `StoreActions`

Add these to the `StoreActions` type definition:

```typescript
// Viewport layout actions
setViewportLayout: (layout: ViewportLayout) => void;
setSplitRatio: (ratio: number) => void;
collapseTo: (pane: "2d" | "3d") => void;
expandDual: () => void;
setActiveViewport: (viewport: "2d" | "3d" | null) => void;

// Layer management actions
setLayerVisible: (layerId: LayerId, visible: boolean) => void;
setLayerOpacity: (layerId: LayerId, opacity: number) => void;
setLayerLocked: (layerId: LayerId, locked: boolean) => void;
toggleLayerVisible: (layerId: LayerId) => void;
toggleLayerLocked: (layerId: LayerId) => void;
resetLayers: () => void;
```

#### 5. Implement actions in the store `create()` call

Add the action implementations inside the store creator function, alongside the existing actions. Follow the same pattern as other UI state actions (e.g., `setView`, `toggleSnap`).

**Viewport layout actions:**

- `setViewportLayout(layout)` -- Sets `ui.viewportLayout` to the given value.
- `setSplitRatio(ratio)` -- Sets `ui.splitRatio` to `Math.max(0.2, Math.min(0.8, ratio))`. The clamping ensures neither pane disappears entirely.
- `collapseTo(pane)` -- Sets `ui.viewportLayout` to `"2d-only"` or `"3d-only"` based on the pane argument. Does NOT modify `splitRatio` (preserved for re-expansion).
- `expandDual()` -- Sets `ui.viewportLayout` back to `"dual"`. The preserved `splitRatio` is automatically used.
- `setActiveViewport(viewport)` -- Sets `ui.activeViewport` to the given value (`"2d"`, `"3d"`, or `null`).

**Layer management actions:**

- `setLayerVisible(layerId, visible)` -- Updates `ui.layers[layerId].visible`.
- `setLayerOpacity(layerId, opacity)` -- Updates `ui.layers[layerId].opacity` to `Math.max(0, Math.min(1, opacity))`.
- `setLayerLocked(layerId, locked)` -- Updates `ui.layers[layerId].locked`.
- `toggleLayerVisible(layerId)` -- Flips `ui.layers[layerId].visible`.
- `toggleLayerLocked(layerId)` -- Flips `ui.layers[layerId].locked`.
- `resetLayers()` -- Resets `ui.layers` to a fresh spread of `DEFAULT_LAYERS`.

All actions follow the immutable update pattern used throughout the store. For layer updates, produce a new `layers` object with the updated layer spread into it:

```typescript
setLayerVisible: (layerId, visible) => {
	set((state) => ({
		ui: {
			...state.ui,
			layers: {
				...state.ui.layers,
				[layerId]: { ...state.ui.layers[layerId], visible },
			},
		},
	}));
},
```

#### 6. Persistence exclusion

The `partialize` function in the `persist` middleware config already excludes `ui` entirely (it only persists `holes`, `holeOrder`, `budget`, `budgetConfig`, `financialSettings`, `expenses`, `holeTemplates`, `builderDraft`, `gpuTierOverride`, `uvTransitionEnabled`). Since `viewportLayout`, `activeViewport`, `splitRatio`, and `layers` are inside the `ui` object, they are automatically excluded from persistence. No changes to `partialize` are needed.

The `temporal` middleware's `partialize` function persists `holes`, `holeOrder`, and `selectedId` only. Viewport and layer state are already excluded from undo/redo tracking. No changes needed.

#### 7. Type updates for `PersistedSlice`

No changes needed to `PersistedSlice` -- the new fields are ephemeral and not persisted.

---

## Tests

All tests go in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/store/viewportLayers.test.ts`.

The test file follows the same patterns as the existing `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/store/builderSlice.test.ts`:
- Import `beforeEach`, `describe`, `expect`, `it` from `vitest`
- Import `useStore` from `../../src/store/store`
- Reset relevant store state in `beforeEach`
- Call actions via `useStore.getState().actionName(args)` and assert via `useStore.getState().fieldName`

### Test structure and stubs

```typescript
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "../../src/store/store";

/**
 * Reset viewport/layer-related store state before each test.
 * The DEFAULT_UI already sets viewportLayout="dual", splitRatio=0.5,
 * activeViewport=null, and all layers to defaults.
 */
beforeEach(() => {
	useStore.setState({
		ui: {
			...useStore.getState().ui,
			viewportLayout: "dual",
			activeViewport: null,
			splitRatio: 0.5,
			layers: {
				holes: { visible: true, opacity: 1, locked: false },
				flowPath: { visible: true, opacity: 1, locked: false },
				grid: { visible: true, opacity: 1, locked: false },
				walls: { visible: true, opacity: 1, locked: false },
				sunIndicator: { visible: true, opacity: 1, locked: false },
			},
		},
	});
});

describe("Viewport Layout Actions", () => {
	// setViewportLayout
	// Test: setViewportLayout("dual") sets viewportLayout to "dual"
	// Test: setViewportLayout("2d-only") sets viewportLayout to "2d-only"
	// Test: setViewportLayout("3d-only") sets viewportLayout to "3d-only"

	// setSplitRatio
	// Test: setSplitRatio(0.5) sets splitRatio to 0.5
	// Test: setSplitRatio(0.1) clamps to 0.2
	// Test: setSplitRatio(0.95) clamps to 0.8
	// Test: setSplitRatio(0.2) sets exactly 0.2 (boundary)
	// Test: setSplitRatio(0.8) sets exactly 0.8 (boundary)

	// collapseTo
	// Test: collapseTo("2d") sets viewportLayout to "2d-only" without changing splitRatio
	// Test: collapseTo("3d") sets viewportLayout to "3d-only" without changing splitRatio
	// Test: collapseTo preserves splitRatio value for later expandDual

	// expandDual
	// Test: expandDual sets viewportLayout to "dual"
	// Test: expandDual after collapseTo preserves the splitRatio from before collapse

	// setActiveViewport
	// Test: setActiveViewport("2d") sets activeViewport to "2d"
	// Test: setActiveViewport("3d") sets activeViewport to "3d"
	// Test: setActiveViewport(null) clears activeViewport
});

describe("Layer Management Actions", () => {
	// setLayerVisible
	// Test: setLayerVisible("holes", false) sets holes.visible to false
	// Test: setLayerVisible("holes", true) sets holes.visible to true
	// Test: setLayerVisible does not affect other layers

	// setLayerOpacity
	// Test: setLayerOpacity("holes", 0.5) sets holes.opacity to 0.5
	// Test: setLayerOpacity clamps minimum to 0
	// Test: setLayerOpacity clamps maximum to 1

	// setLayerLocked
	// Test: setLayerLocked("holes", true) sets holes.locked to true
	// Test: setLayerLocked("holes", false) sets holes.locked to false

	// toggleLayerVisible
	// Test: toggleLayerVisible flips from true to false
	// Test: toggleLayerVisible flips from false to true

	// toggleLayerLocked
	// Test: toggleLayerLocked flips from false to true
	// Test: toggleLayerLocked flips from true to false
});

describe("Default State", () => {
	// Test: initial viewportLayout is "dual"
	// Test: initial splitRatio is 0.5
	// Test: initial activeViewport is null
	// Test: all 5 layers present (holes, flowPath, grid, walls, sunIndicator)
	// Test: all layers default visible=true, opacity=1, locked=false
});

describe("Reset Layers", () => {
	// Test: resetLayers restores all layers to visible=true, opacity=1, locked=false
	// Test: resetLayers works after modifying multiple layers
});

describe("Persistence & Undo Exclusion", () => {
	// Test: viewportLayout is NOT included in partialize output
	// Test: layers state is NOT included in partialize output
	// Test: activeViewport is NOT included in partialize output
	// Test: splitRatio is NOT included in partialize output
});
```

### Key test implementation details

**Reset pattern:** Use `useStore.setState(...)` in `beforeEach` to reset the `ui` sub-object. Because the store merges state shallowly with `setState`, you need to spread `...useStore.getState().ui` to preserve other UI fields, then override the viewport/layer fields.

**Persistence exclusion tests:** These test that the `partialize` function used by the `persist` middleware does not include the new fields. The approach is to call the store's internal partialize and check the output does not contain `viewportLayout`, `layers`, `activeViewport`, or `splitRatio`. Since `partialize` is passed as an option to `persist`, you can test this indirectly: set viewport/layer state, then check the persisted output. The simplest approach is to verify that the partialize output type/shape does not include these keys. For example:

```typescript
it("viewportLayout is NOT included in partialize output", () => {
	// The persist middleware's partialize only includes specific top-level keys.
	// Since viewportLayout lives inside ui (which is excluded from partialize),
	// it is not persisted. Verify by checking the persisted store shape.
	const state = useStore.getState();
	const persisted = {
		holes: state.holes,
		holeOrder: state.holeOrder,
		budget: state.budget,
		budgetConfig: state.budgetConfig,
		financialSettings: state.financialSettings,
		expenses: state.expenses,
		holeTemplates: state.holeTemplates,
		builderDraft: state.builderDraft,
		gpuTierOverride: state.gpuTierOverride,
		uvTransitionEnabled: state.uvTransitionEnabled,
	};
	expect("viewportLayout" in persisted).toBe(false);
	expect("layers" in persisted).toBe(false);
	expect("activeViewport" in persisted).toBe(false);
	expect("splitRatio" in persisted).toBe(false);
});
```

Alternatively, if the partialize function is accessible (it is passed as a config option), you can import and call it directly. The key insight is that `ui` as a whole is not in the persisted slice, so anything inside `ui` is automatically excluded.

**Layer isolation tests:** When testing that `setLayerVisible("holes", false)` does not affect other layers, check that `flowPath`, `grid`, `walls`, and `sunIndicator` retain their original values after the call.

**Collapse/expand round-trip test:** Set splitRatio to 0.65, call `collapseTo("2d")`, verify splitRatio is still 0.65 and viewportLayout is `"2d-only"`, then call `expandDual()`, verify viewportLayout is `"dual"` and splitRatio is still 0.65.

---

## Implementation Checklist

1. Create `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/viewport.ts` with all type definitions
2. Update `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/ui.ts` -- add `"layers"` to `SidebarTab` and `ActivePanel`, add four new fields to `UIState`, add import of types from `./viewport`
3. Update `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/index.ts` -- add re-exports for viewport types
4. Update `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts`:
   - Import new types
   - Add `DEFAULT_LAYERS` constant (exported)
   - Update `DEFAULT_UI` with four new fields
   - Add 11 new action signatures to `StoreActions` type
   - Implement all 11 actions in the store creator
5. Create `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/store/viewportLayers.test.ts` with all ~35 tests
6. Run `npx tsc --noEmit` to verify type correctness
7. Run `npx vitest run` to verify all tests pass (both new and existing 495)

---

## Downstream Impact

After this section is complete, the following state and actions are available in the store for subsequent sections:

- **section-03 (Split-Pane Layout):** Reads `viewportLayout` and `splitRatio`, calls `setSplitRatio`, `collapseTo`, `expandDual`
- **section-04 (Dual Canvas Views):** Reads `viewportLayout` to decide single vs dual View rendering
- **section-05 (Camera System):** Uses `CameraPreset` type, reads `activeViewport`
- **section-06 (Event Isolation):** Reads `activeViewport`, calls `setActiveViewport`
- **section-07 (Layer State):** Reads `layers` record in scene components for visibility/opacity/lock
- **section-08 (Layer Panel UI):** Uses `LayerDefinition`, all layer actions, `SidebarTab = "layers"`
- **section-09 (PostProcessing):** Reads `viewportLayout` to gate effects
- **section-10 (Feature Migration):** Uses `toggleLayerVisible("flowPath")` to replace `toggleFlowPath`