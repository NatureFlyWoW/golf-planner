Now I have all the context I need. Let me produce the section content.

# Section 07 -- Layer State Integration

## Overview

This section wires the layer state from the Zustand store (created in section-02) to all renderable scene components so that visibility, opacity, and lock controls actually affect the 3D scene. It also migrates the standalone `showFlowPath` toggle to route through the layer system.

**Dependencies:**
- **section-02-types-and-store** must be complete (provides `LayerId`, `LayerState`, layer actions in the store, and `ui.layers` state)
- **section-06-event-isolation** must be complete (provides `ViewportContext` and position-based pointer event gating, which layer lock checks build upon)

**What this section does NOT include:**
- The Layer Panel UI (sidebar tab, sliders, toggles) -- that is section-08
- The store definitions and actions themselves -- those are in section-02
- Pointer event isolation between viewports -- that is section-06

---

## Tests First

### File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/layerIntegration.test.ts`

These tests verify that scene components correctly read and respond to layer state from the store. Since R3F components cannot be easily unit-tested without a full Canvas harness, these tests focus on the store-side integration logic and exported helper functions. Where the component is too tightly coupled to R3F to unit-test, a note indicates that verification happens via visual regression (section-12).

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "../../src/store/store";

/**
 * Reset store to clean state before each test.
 * Assumes section-02 has already added ui.layers to the store with DEFAULT_LAYERS.
 */
beforeEach(() => {
	useStore.getState().resetLayers();
});

describe("Layer visibility integration", () => {
	it("holes layer defaults to visible", () => {
		const state = useStore.getState();
		expect(state.ui.layers.holes.visible).toBe(true);
	});

	it("setting holes layer to invisible updates store", () => {
		useStore.getState().setLayerVisible("holes", false);
		expect(useStore.getState().ui.layers.holes.visible).toBe(false);
	});

	it("flowPath layer defaults to visible", () => {
		expect(useStore.getState().ui.layers.flowPath.visible).toBe(true);
	});

	it("grid layer defaults to visible", () => {
		expect(useStore.getState().ui.layers.grid.visible).toBe(true);
	});

	it("walls layer defaults to visible", () => {
		expect(useStore.getState().ui.layers.walls.visible).toBe(true);
	});

	it("sunIndicator layer defaults to visible", () => {
		expect(useStore.getState().ui.layers.sunIndicator.visible).toBe(true);
	});
});

describe("Layer opacity integration", () => {
	it("holes layer defaults to opacity 1", () => {
		expect(useStore.getState().ui.layers.holes.opacity).toBe(1);
	});

	it("setting opacity to 0.5 updates store", () => {
		useStore.getState().setLayerOpacity("holes", 0.5);
		expect(useStore.getState().ui.layers.holes.opacity).toBe(0.5);
	});
});

describe("Layer lock integration", () => {
	it("holes layer defaults to unlocked", () => {
		expect(useStore.getState().ui.layers.holes.locked).toBe(false);
	});

	it("locking holes layer updates store", () => {
		useStore.getState().setLayerLocked("holes", true);
		expect(useStore.getState().ui.layers.holes.locked).toBe(true);
	});
});

describe("FlowPath toggle migration", () => {
	it("toggleLayerVisible('flowPath') controls flowPath visibility", () => {
		expect(useStore.getState().ui.layers.flowPath.visible).toBe(true);
		useStore.getState().toggleLayerVisible("flowPath");
		expect(useStore.getState().ui.layers.flowPath.visible).toBe(false);
		useStore.getState().toggleLayerVisible("flowPath");
		expect(useStore.getState().ui.layers.flowPath.visible).toBe(true);
	});
});
```

The tests above validate that the store layer state is properly set up and accessible -- the prerequisite for wiring it into components. The actual component-level behavior (returning `null` when hidden, passing opacity to materials, skipping pointer events when locked) is tested via:

1. **Manual verification** during implementation (render the app, toggle layers, observe behavior)
2. **Visual regression tests** in section-12 (Playwright screenshots with layers hidden)
3. **Type safety** -- the compiler enforces that components read from `ui.layers[layerId]`

---

## Implementation Details

### Pattern: Layer-Aware Component

Every renderable component that belongs to a layer follows this three-part pattern:

```ts
// 1. Read layer state via Zustand selector
const layer = useStore((s) => s.ui.layers["<layerId>"]);

// 2. Visibility: return null if not visible
if (!layer.visible) return null;

// 3. Opacity: pass to materials when < 1
// 4. Lock: skip pointer event handlers when locked
```

The pattern is applied to five components, each associated with one `LayerId`.

---

### Component 1: PlacedHoles (`holes` layer)

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacedHoles.tsx`

**Changes:**

1. Add a Zustand selector for the holes layer:
   ```ts
   const holesLayer = useStore((s) => s.ui.layers.holes);
   ```

2. Early return `null` if `!holesLayer.visible`:
   ```ts
   if (!holesLayer.visible) return null;
   ```

3. Pass `layerOpacity` and `layerLocked` as new props to `MiniGolfHole`:
   ```ts
   <MiniGolfHole
     key={id}
     hole={hole}
     isSelected={selectedId === id}
     onClick={() => selectHole(id)}
     layerOpacity={holesLayer.opacity}
     layerLocked={holesLayer.locked}
   />
   ```

4. Also pass `layerLocked` to `RotationHandle` so rotation is blocked when locked.

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/MiniGolfHole.tsx`

**Changes:**

1. Add `layerOpacity?: number` and `layerLocked?: boolean` to the `Props` type (default `1` and `false`).

2. **Lock handling:** At the top of `handlePointerDown`, `handlePointerMove`, `handlePointerUp`, and the `onClick` handler on the interaction mesh, add an early return if `layerLocked` is true:
   ```ts
   if (layerLocked) return;
   ```
   Do NOT call `e.stopPropagation()` before returning -- let the event fall through to camera controls.

3. **Hover suppression:** When locked, the `onPointerEnter`/`onPointerLeave` handlers should also be no-ops (no hover highlight on locked holes):
   ```ts
   onPointerEnter={() => { if (!layerLocked) setIsHovered(true); }}
   onPointerLeave={() => { if (!layerLocked) setIsHovered(false); }}
   ```

4. **Opacity handling:** Pass `layerOpacity` down to `HoleModel` as a new prop. The interaction mesh overlay opacity is independent (it is UI feedback, not scene content). Apply `layerOpacity` to the `HoleModel` component.

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleModel.tsx`

**Changes:**

1. Add `layerOpacity?: number` to `HoleModelProps` (default `1`).

2. Pass `layerOpacity` through to `HoleSwitch`, `TexturedHoleSwitch`, and `TemplateHoleModel`.

3. Each individual hole model component (`HoleStraight`, `HoleLShape`, etc.) already creates `meshStandardMaterial` elements. Add a wrapper or modify each to accept an `opacity` prop. When `opacity < 1`, set `transparent={true}` and `opacity={layerOpacity}` on each material. This is a straightforward prop-drilling change.

4. For `TemplateHoleModel`, the segment renderers create materials internally. Pass `layerOpacity` down and apply similarly.

**Important note on opacity complexity:** The hole models use complex PBR materials from `TexturedMaterialsProvider` context. The simplest approach is to apply opacity at the `<group>` level by iterating over child meshes. However, Three.js does not support group-level opacity natively. The practical approach is:
- For each `<meshStandardMaterial>` in hole models, accept an optional `opacity` prop
- When `layerOpacity < 1`, set `transparent={true}` and `opacity={layerOpacity}`
- The `TexturedMaterialsProvider` can expose opacity as part of its context, or each hole component can accept it as a prop

The exact prop-drilling depth depends on how many hole model files need modification (7 legacy types + `TemplateHoleModel`). This is repetitive but straightforward -- each file adds at most 2-3 lines.

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/RotationHandle.tsx`

**Changes:**

1. Add `layerLocked?: boolean` to `RotationHandleProps`.
2. Early return in `handlePointerDown` if `layerLocked` is true.

---

### Component 2: FlowPath (`flowPath` layer)

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/FlowPath.tsx`

**Changes:**

1. Replace the `showFlowPath` selector with the layer selector:
   ```ts
   // BEFORE
   const showFlowPath = useStore((s) => s.ui.showFlowPath);
   if (!showFlowPath || holeOrder.length < 2) return null;

   // AFTER
   const flowPathLayer = useStore((s) => s.ui.layers.flowPath);
   if (!flowPathLayer.visible || holeOrder.length < 2) return null;
   ```

2. **Opacity:** Apply `flowPathLayer.opacity` to the `Line` component's `opacity` prop. The current `opacity={0.5}` becomes `opacity={0.5 * flowPathLayer.opacity}` (multiplicative with the existing base opacity). Apply the same multiplication to the `Text` component -- the text does not have a native opacity prop, but its color can be made transparent via `fillOpacity` or by wrapping in a group. Alternatively, use a simpler approach: if `flowPathLayer.opacity < 1`, multiply it into the existing Line opacity.

3. **Lock:** FlowPath is view-only (no pointer events), so lock has no effect. No changes needed for lock.

**Migration detail:** The standalone `showFlowPath` boolean in `UIState` and the `toggleFlowPath` action in the store are deprecated by this change. However, removing them from the store is handled in section-10 (Feature Migration) to avoid breaking `Toolbar.tsx` and `BottomToolbar.tsx` simultaneously. In this section, `FlowPath.tsx` reads from layers; the toolbar migration happens later.

---

### Component 3: FloorGrid (`grid` layer)

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/FloorGrid.tsx`

**Changes:**

1. Add a layer selector:
   ```ts
   const gridLayer = useStore((s) => s.ui.layers.grid);
   ```

2. Early return `null` if `!gridLayer.visible`:
   ```ts
   if (!gridLayer.visible) return null;
   ```

3. **Opacity:** The drei `<Grid>` component manages its own materials internally and does not expose a straightforward opacity prop. The visibility toggle (show/hide) works fully. The opacity slider will be present in the Layer Panel UI (section-08) but may have limited or no visible effect on the grid. Document this as a known limitation. If needed, a custom grid rendering approach can be added later to support opacity properly.

4. **Lock:** Grid is view-only (no pointer events), so lock has no effect.

---

### Component 4: Hall / HallWalls (`walls` layer)

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/Hall.tsx`

**Changes:**

1. Add a layer selector in `Hall`:
   ```ts
   const wallsLayer = useStore((s) => s.ui.layers.walls);
   ```

2. Conditionally render walls and openings based on visibility. The floor is NOT part of the walls layer (it should always be visible as the ground plane):
   ```ts
   return (
     <Suspense fallback={null}>
       <group>
         <HallFloor />
         {wallsLayer.visible && <HallWalls />}
         {wallsLayer.visible && <HallOpenings sunData={sunData} />}
       </group>
     </Suspense>
   );
   ```

3. **Opacity:** Pass `wallsLayer.opacity` to `HallWalls` and `HallOpenings` as a prop. In `HallWalls.tsx`, when `layerOpacity < 1`, set `transparent: true` and `opacity: layerOpacity` on the wall materials.

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/HallWalls.tsx`

**Changes:**

1. Accept `layerOpacity?: number` prop (default `1`).

2. For `FlatHallWalls`: When `layerOpacity < 1`, create cloned materials with `transparent: true` and `opacity: layerOpacity` instead of using the module-level singletons. Or better: use inline `<meshStandardMaterial>` elements with the opacity prop rather than the singleton material approach.

3. For `TexturedHallWalls`: Set `transparent: layerOpacity < 1` and `opacity: layerOpacity` on the `longMat` and `shortMat` materials in the `useMemo` block.

4. **Lock:** Hall walls currently have no pointer events, so lock has no effect.

---

### Component 5: SunIndicator (`sunIndicator` layer)

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/SunIndicator.tsx`

**Changes:**

1. Add a layer selector:
   ```ts
   const sunLayer = useStore((s) => s.ui.layers.sunIndicator);
   ```

2. Add a visibility check alongside the existing checks:
   ```ts
   if (uvMode) return null;
   if (!visible) return null;
   if (!sunLayer.visible) return null;
   ```

3. **Opacity:** Apply `sunLayer.opacity` to the arrow body and arrow head materials:
   ```ts
   <meshStandardMaterial
     color="#FFA726"
     transparent={sunLayer.opacity < 1}
     opacity={sunLayer.opacity}
   />
   ```
   Also adjust the HTML label's CSS opacity: `opacity: sunLayer.opacity`.

4. **Lock:** SunIndicator has no pointer events, so lock has no effect.

---

### useLayerVisible Helper Hook (Optional)

To reduce boilerplate across components, consider creating a small helper hook:

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useLayerState.ts`

```ts
import { useStore } from "../store";
import type { LayerId, LayerState } from "../types/viewport";

/**
 * Returns the LayerState for a given layer ID.
 * Components use this to check visibility, opacity, and lock status.
 */
export function useLayerState(layerId: LayerId): LayerState {
	return useStore((s) => s.ui.layers[layerId]);
}
```

This is a trivial convenience wrapper -- not required, but keeps selectors consistent and avoids typos in the selector path. Each component can use either this hook or the direct selector.

---

## FlowPath Toggle Migration (Partial)

This section handles the **FlowPath.tsx side** of the migration. The component switches from reading `ui.showFlowPath` to reading `ui.layers.flowPath.visible`.

The **store side** (removing `showFlowPath` field and `toggleFlowPath` action) and the **toolbar side** (updating `Toolbar.tsx` and `BottomToolbar.tsx` to call `toggleLayerVisible("flowPath")`) are handled in section-10 (Feature Migration) to avoid a half-broken intermediate state where the toolbar calls an action that no longer exists.

**Interim compatibility:** During the transition between section-07 and section-10, both `showFlowPath` and `layers.flowPath.visible` exist in the store. `FlowPath.tsx` reads from `layers.flowPath.visible`. The toolbar still calls `toggleFlowPath()` which toggles the old `showFlowPath` field. This means the toolbar toggle temporarily does not affect `FlowPath` rendering until section-10 migrates the toolbar. This is acceptable for development ordering -- the feature is fully restored once section-10 completes.

If a fully functional intermediate state is required, an alternative is to have section-07 also update `Toolbar.tsx` and `BottomToolbar.tsx` to call `toggleLayerVisible("flowPath")`. However, this bleeds into section-10's scope and may create merge friction.

---

## File Summary

### Files Modified

| File | Change |
|------|--------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacedHoles.tsx` | Add holes layer visibility check, pass opacity/locked to children |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/MiniGolfHole.tsx` | Accept `layerOpacity`/`layerLocked` props, gate pointer events, pass opacity to HoleModel |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/RotationHandle.tsx` | Accept `layerLocked` prop, gate pointer events |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleModel.tsx` | Accept and forward `layerOpacity` prop |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/FlowPath.tsx` | Replace `showFlowPath` with `layers.flowPath` selector, apply opacity |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/FloorGrid.tsx` | Add grid layer visibility check |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/Hall.tsx` | Add walls layer visibility check, conditionally render walls/openings |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/HallWalls.tsx` | Accept `layerOpacity` prop, apply to wall materials |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/SunIndicator.tsx` | Add sunIndicator layer visibility/opacity check |

### Files Created

| File | Purpose |
|------|---------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/layerIntegration.test.ts` | Integration tests for layer state wiring |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useLayerState.ts` | Optional convenience hook for reading layer state |

### Individual Hole Model Files (Opacity Pass-Through)

Each of these files needs to accept and apply an optional `layerOpacity` prop to their `<meshStandardMaterial>` elements:

- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleStraight.tsx`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleLShape.tsx`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleDogleg.tsx`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleRamp.tsx`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleLoop.tsx`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleWindmill.tsx`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleTunnel.tsx`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/TemplateHoleModel.tsx`

The change per file is minimal: add `layerOpacity?: number` to props, and on each `<meshStandardMaterial>`, add `transparent={layerOpacity != null && layerOpacity < 1}` and `opacity={layerOpacity ?? 1}`.

---

## Implementation Checklist

1. Write tests in `tests/components/layerIntegration.test.ts` (tests will initially fail or partially pass since they only test store state)
2. Create `src/hooks/useLayerState.ts` helper hook (optional)
3. Modify `PlacedHoles.tsx` -- add layer visibility check, forward opacity/locked props
4. Modify `MiniGolfHole.tsx` -- accept and use `layerOpacity`/`layerLocked` props
5. Modify `RotationHandle.tsx` -- accept and use `layerLocked` prop
6. Modify `HoleModel.tsx` -- accept and forward `layerOpacity`
7. Modify individual hole model files (7 legacy + TemplateHoleModel) -- apply opacity to materials
8. Modify `FlowPath.tsx` -- replace `showFlowPath` with layer selector, apply opacity
9. Modify `FloorGrid.tsx` -- add grid layer visibility check
10. Modify `Hall.tsx` -- add walls layer conditional rendering
11. Modify `HallWalls.tsx` -- accept and apply `layerOpacity`
12. Modify `SunIndicator.tsx` -- add layer visibility/opacity checks
13. Run `npx tsc --noEmit` to verify no type errors
14. Run `npx vitest run` to verify all tests pass (existing + new)
15. Manual verification: toggle layers in the store via dev tools, confirm components hide/show

---

## What Was Actually Built

### Deviations from Plan

1. **useGroupOpacity hook instead of per-file prop drilling:** Rather than modifying all 8 individual hole model files (7 legacy + TemplateHoleModel) to accept opacity props, implemented a shared `useGroupOpacity` hook that imperatively traverses a Three.js group's children and sets material opacity. This avoids touching 8 files and works generically with any nested mesh hierarchy.

2. **Shared hook extracted to `src/hooks/useGroupOpacity.ts`:** During code review, the duplicated traverse logic in HoleModel.tsx and HallWalls.tsx was identified. Extracted to a shared hook with proper cleanup/restore logic using a WeakMap to store original material values.

3. **useLayerState helper hook NOT created:** Deemed unnecessary — each component directly selects its layer via `useStore((s) => s.ui.layers.xxx)`, which is clear and explicit.

4. **HallOpenings does NOT receive opacity prop:** Deferred — low visual impact since openings hide entirely with walls via conditional render in Hall.tsx.

5. **FlowPath Text labels now fade:** Added `fillOpacity` and `outlineOpacity` props to drei Text component, multiplicative with `flowPathLayer.opacity`.

6. **Lock guards added to handlePointerMove and handlePointerUp:** Code review caught missing guards. handlePointerMove gets early return when locked. handlePointerUp still cleans up drag state (isDragging, refs) before returning when locked.

### Files Actually Created
| File | Purpose |
|------|---------|
| `src/hooks/useGroupOpacity.ts` | Shared hook: traverse group children, apply/restore material opacity with WeakMap cleanup |
| `tests/components/layerIntegration.test.ts` | 11 integration tests for layer store state |

### Files Actually Modified
| File | Change |
|------|--------|
| `src/components/three/PlacedHoles.tsx` | holes layer visibility, opacity/locked forwarding |
| `src/components/three/MiniGolfHole.tsx` | layerOpacity/layerLocked props, lock guards on all 5 handlers |
| `src/components/three/RotationHandle.tsx` | layerLocked prop, lock guard |
| `src/components/three/holes/HoleModel.tsx` | layerOpacity prop, uses shared useGroupOpacity hook |
| `src/components/three/FlowPath.tsx` | layers.flowPath selector, line+text opacity |
| `src/components/three/FloorGrid.tsx` | grid layer visibility |
| `src/components/three/Hall.tsx` | walls layer conditional render |
| `src/components/three/HallWalls.tsx` | layerOpacity via shared useGroupOpacity hook |
| `src/components/three/SunIndicator.tsx` | sunIndicator layer visibility/opacity |

### Test Results
- 11 new tests (all pass)
- 571 total tests pass
- TypeScript clean