Now I have all the context I need. Let me produce the section content.

# Section 05: Status Bar

## Overview

This section enhances the existing `LocationBar` component into a full `StatusBar` that adds live cursor world coordinates, zoom/scale display, and active layer indication. It also introduces a lightweight micro-store (`mouseStatusStore`) for high-frequency mouse and zoom updates, and a pure utility (`zoomScale.ts`) for computing architectural scale from camera zoom.

**User-visible outcome:** The bottom bar of the app now shows real-time `X` and `Z` coordinates (in meters) as the mouse moves over the 2D pane, plus the current scale (e.g., "1:50") and which layer is active.

**Dependencies:** None (this section can be implemented independently). The status bar is a standalone HTML component outside the R3F canvas. Section 10 (Integration) will verify final wiring.

---

## Files Created

| File | Purpose |
|------|---------|
| `src/stores/mouseStatusStore.ts` | Lightweight Zustand store for mouse position and zoom |
| `src/utils/zoomScale.ts` | Pure function: camera zoom to architectural scale string |
| `src/components/ui/StatusBar.tsx` | Enhanced bar replacing LocationBar |
| `src/components/three/ViewportStatusTracker.tsx` | R3F component for mouse/zoom tracking inside 2D View |
| `tests/utils/zoomScale.test.ts` | Unit tests for scale computation (5 tests) |
| `tests/stores/mouseStatusStore.test.ts` | Unit tests for the micro-store (4 tests) |

## Files Modified

| File | Change |
|------|--------|
| `src/App.tsx` | Replaced `<LocationBar>` import and usage with `<StatusBar>` |
| `src/components/layout/DualViewport.tsx` | Mounted `<ViewportStatusTracker>` inside 2D View; added `onPointerLeave` to `pane2DRef` div |

## Files Deleted

| File | Reason |
|------|--------|
| `src/components/ui/LocationBar.tsx` | Replaced by StatusBar; no other imports referenced it |

---

## Tests First

### Test File: `tests/utils/zoomScale.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { computeScale } from "../../src/utils/zoomScale";

describe("computeScale", () => {
	it("returns approximately '1:50' at zoom=20", () => {
		/** With a 10m hall, zoom=20, typical viewport width,
		 *  the scale should be in the 1:50 ballpark. */
		const result = computeScale(20, 800, 10);
		expect(result).toBe("1:50");
	});

	it("rounds to nearest standard scale", () => {
		/** Standard scales: 1:10, 1:20, 1:25, 1:50, 1:100, 1:200 */
		const result = computeScale(35, 800, 10);
		expect(["1:10", "1:20", "1:25", "1:50", "1:100", "1:200"]).toContain(result);
	});

	it("returns '1:10' at very high zoom", () => {
		const result = computeScale(120, 800, 10);
		expect(result).toBe("1:10");
	});

	it("returns '1:200' at very low zoom", () => {
		const result = computeScale(5, 800, 10);
		expect(result).toBe("1:200");
	});
});
```

The test file uses the standard project pattern: `describe`/`it` blocks, `vitest` imports, relative path from `tests/` to `src/`. The exact zoom-to-scale mapping depends on the formula (see Implementation Details below), so the implementer should adjust expected values if the formula yields different results -- the important thing is that the function returns one of the standard scale strings and follows the rounding behavior.

### Test File: `tests/stores/mouseStatusStore.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { useMouseStatusStore } from "../../src/stores/mouseStatusStore";

describe("mouseStatusStore", () => {
	it("initial state has null mouseWorldPos", () => {
		const state = useMouseStatusStore.getState();
		expect(state.mouseWorldPos).toBeNull();
	});

	it("setMouseWorldPos updates store correctly", () => {
		useMouseStatusStore.getState().setMouseWorldPos({ x: 5.23, z: 12.47 });
		const state = useMouseStatusStore.getState();
		expect(state.mouseWorldPos).toEqual({ x: 5.23, z: 12.47 });
	});

	it("setCurrentZoom updates store correctly", () => {
		useMouseStatusStore.getState().setCurrentZoom(42);
		expect(useMouseStatusStore.getState().currentZoom).toBe(42);
	});

	it("setMouseWorldPos(null) clears position", () => {
		useMouseStatusStore.getState().setMouseWorldPos({ x: 1, z: 2 });
		useMouseStatusStore.getState().setMouseWorldPos(null);
		expect(useMouseStatusStore.getState().mouseWorldPos).toBeNull();
	});
});
```

Note: Reset store state between tests if needed (e.g., in a `beforeEach`). The store is a standalone Zustand store separate from the main app store, so state isolation is straightforward with `useMouseStatusStore.setState(initialState)`.

---

## Implementation Details

### 1. Mouse Status Micro-Store (`src/stores/mouseStatusStore.ts`)

**Why a separate store:** The main Zustand store (`useStore`) drives many components. Writing mouse position at 60Hz into it would cause widespread re-renders. A dedicated micro-store ensures only the `StatusBar` subscribes and re-renders on mouse move.

**Shape:**

```ts
type MouseStatusState = {
	mouseWorldPos: { x: number; z: number } | null;
	currentZoom: number;
	setMouseWorldPos: (pos: { x: number; z: number } | null) => void;
	setCurrentZoom: (zoom: number) => void;
};
```

Create with `zustand/vanilla` (or standard `create`) -- no persistence, no middleware. Initial values: `mouseWorldPos: null`, `currentZoom: 40` (matches `DEFAULT_ORTHO_ZOOM` from `src/utils/cameraPresets.ts`).

### 2. Zoom-to-Scale Utility (`src/utils/zoomScale.ts`)

**Exported function signature (simplified during code review):**

```ts
export function computeScale(cameraZoom: number): string;
```

The original plan included `viewportWidthPx` and `hallWidthM` params, but the final formula only depends on `cameraZoom`. These were removed during code review to keep the API honest.

**Algorithm:**

1. Compute `scaleDenominator = 1 / (cameraZoom * 0.0005)`. This constant was tuned so zoom=40 yields denominator=50 (i.e., 1:50).

2. Round to the nearest standard scale from the set `[10, 20, 25, 50, 100, 200]`. Return as a string like `"1:50"`.

**Standard scales array:** `[10, 20, 25, 50, 100, 200]`. Find the one whose denominator is closest to the raw computed denominator.

### 3. StatusBar Component (`src/components/ui/StatusBar.tsx`)

**Replaces `LocationBar`.** The new component keeps all existing `LocationBar` functionality and adds a right-aligned section.

**Props:** Same as `LocationBar` -- `{ sunData?: SunData }`.

**Layout:**

The existing `LocationBar` is a single horizontal bar with a `<button>` that toggles an expanded details section. The `StatusBar` wraps this:

- **Left section** (existing): Address, elevation, coordinates, sun data, expand toggle.
- **Right section** (new): Mouse coordinates, scale, active layer. Rendered as inline `<span>` elements with monospace font.

The right section reads from `useMouseStatusStore`:
- `mouseWorldPos` -- display as `X: 5.23m  Z: 12.47m` or `X: --  Z: --` when null.
- `currentZoom` -- pass through `computeScale()` to display e.g. `Scale: 1:50`.

The active layer is read from the main store: `useStore(s => s.ui.layers)`. "Active layer" means the first non-locked, visible layer, or simply the currently selected sidebar tab if it maps to a layer. Alternatively, display the name of the layer currently being edited. A pragmatic approach: show the layer that matches the current sidebar tab (when tab is "layers", show "All"; otherwise map tool context). Keep this simple -- if unclear, just show the currently visible+unlocked layer count or omit until section 10 wiring.

**Styling details:**
- Right section uses `font-mono text-xs` for coordinates.
- Separator between left and right: use `ml-auto` on the right section to push it right.
- Coordinates update smoothly as mouse moves (no visible flicker thanks to the micro-store).
- When the 2D pane is collapsed (`viewportLayout === "3d-only"`), show `X: --  Z: --` and `Scale: --`.

### 4. DualViewport Modifications

**`onPointerMove` on `pane2DRef` div:**

Add an `onPointerMove` handler to the 2D pane container `<div>`. This handler:
1. Converts the screen-space pointer position to world coordinates using the orthographic camera.
2. Calls `useMouseStatusStore.getState().setMouseWorldPos({ x, z })`.

The world-coordinate conversion uses Three.js raycasting or direct unprojection. Since the 2D pane uses an orthographic camera looking straight down (Y-axis), the conversion is:
- Get the pointer's normalized device coordinates (NDC) relative to the 2D pane.
- Unproject through the orthographic camera to get world X and Z.

However, the camera object lives inside the R3F `<View>`, not accessible directly from the HTML div's pointer event. Two approaches:

**Approach A (recommended): Use a small R3F component inside the 2D View** that listens to pointer events via `useFrame` + `useThree`. Create a `MouseTracker2D` component mounted inside the 2D `<View>` that uses `onPointerMove` on a transparent plane (or `useFrame` with `raycaster`) to track mouse world position and write to the micro-store.

**Approach B: Store a camera ref** and use it from the HTML event handler. This requires bridging the R3F camera ref out to the DualViewport component.

Approach A is cleaner because it stays within R3F's event system. The `MouseTracker2D` component:
- Renders an invisible plane at Y=0 covering the hall area (or larger).
- Has `onPointerMove` that reads `event.point` (world coordinates) and calls `setMouseWorldPos`.
- Has `onPointerLeave` that calls `setMouseWorldPos(null)`.
- Sets `raycast` to use the default (it needs raycasting to work), but ensures it does not block other interactions by rendering at a lower Y or using event propagation (`event.stopPropagation()` should NOT be called).

Alternatively, the `onPointerMove` can be attached to the `pane2DRef` HTML div, and a `useFrame`-based approach inside the View reads the pointer from the store. But the R3F approach is more direct.

**`onPointerLeave` on `pane2DRef` div:**

Add `onPointerLeave={() => useMouseStatusStore.getState().setMouseWorldPos(null)}` to the 2D pane `<div>`. This clears the coordinates when the cursor exits the 2D pane, causing the StatusBar to show `X: --  Z: --`.

**Zoom tracking:**

Create a small `ZoomTracker2D` component inside the 2D `<View>` that reads `camera.zoom` in a `useFrame` callback and writes to `useMouseStatusStore.getState().setCurrentZoom(zoom)`. Throttle updates: only write when zoom changes by more than 0.5 from the last written value (use a ref to track last written zoom).

Both `MouseTracker2D` and `ZoomTracker2D` can be combined into a single `ViewportStatusTracker` component for simplicity.

### 5. App.tsx Modification

Replace:
```tsx
import { LocationBar } from "./components/ui/LocationBar";
// ...
<LocationBar sunData={sunData} />
```

With:
```tsx
import { StatusBar } from "./components/ui/StatusBar";
// ...
<StatusBar sunData={sunData} />
```

The `LocationBar.tsx` file can be kept (renamed or re-exported from `StatusBar.tsx`) or deleted. If other mobile components reference `LocationBar`, keep the file and have `StatusBar` import from it or be a superset.

---

## Existing Code Context

### LocationBar (current implementation at `src/components/ui/LocationBar.tsx`)

The current `LocationBar` is a collapsible bar with:
- A `<button>` row showing address, elevation, coordinates, sun bearing.
- An expandable grid with full details and map links.
- Hidden on mobile (`hidden md:block`).
- Styled with `border-t border-subtle bg-surface text-text-secondary`.

The `StatusBar` keeps this entire structure and appends a right-aligned section before the expand chevron (`▾`/`▸`).

### DualViewport (`src/components/layout/DualViewport.tsx`)

Key refs: `pane2DRef` (div wrapping the 2D View), `pane3DRef` (div wrapping the 3D View). The 2D View contains `<ViewportContext.Provider value={viewport2DInfo}>` wrapping `<SharedScene>` and `<PlacementHandler>`.

New children to add inside the 2D `<View>` (after `<PlacementHandler>`):
- `<ViewportStatusTracker />` -- the combined mouse/zoom tracker component.

New prop on the `pane2DRef` div:
- `onPointerLeave` handler to clear mouse position.

### Camera Constants (`src/utils/cameraPresets.ts`)

- `DEFAULT_ORTHO_ZOOM = 40`
- `MIN_ORTHO_ZOOM = 15`
- `MAX_ORTHO_ZOOM = 120`

These are used for the zoom tracker's initial value and for sanity checking scale computation.

### Layer System (`src/types/viewport.ts`)

Layer IDs: `holes`, `flowPath`, `grid`, `walls`, `sunIndicator`. Each has `visible`, `opacity`, `locked` state in `useStore(s => s.ui.layers)`.

---

## Edge Cases

1. **2D pane collapsed:** When `viewportLayout` is `"3d-only"`, the 2D pane does not render. The `ViewportStatusTracker` does not exist, so no mouse/zoom updates occur. The StatusBar should check `mouseWorldPos === null` and show dashes.

2. **Mobile layout:** Mobile does not render `StatusBar` (the existing `LocationBar` has `hidden md:block`). No changes needed for mobile.

3. **Pointer leaving canvas but staying in pane div:** The `onPointerLeave` on the `pane2DRef` div handles this. If the pointer moves to an overlay (MiniMap, etc.) within the pane, the leave event fires on the pane div and coordinates clear. This is acceptable behavior.

4. **Rapid zoom changes:** The zoom tracker uses a threshold (delta > 0.5) to avoid writing to the store on every frame. At 60fps during a zoom gesture, this means ~1-2 store updates per gesture rather than ~60.

---

## Implementation Order (TODO List)

1. Write tests for `zoomScale.ts` (`tests/utils/zoomScale.test.ts`)
2. Write tests for `mouseStatusStore` (`tests/stores/mouseStatusStore.test.ts`)
3. Implement `src/utils/zoomScale.ts` -- make tests pass
4. Implement `src/stores/mouseStatusStore.ts` -- make tests pass
5. Create `src/components/ui/StatusBar.tsx` -- copy `LocationBar` content, add right section reading from micro-store
6. Create `ViewportStatusTracker` component (can be in `src/components/three/ViewportStatusTracker.tsx` or inline in DualViewport) -- mouse tracking + zoom tracking writing to micro-store
7. Modify `DualViewport.tsx` -- mount `ViewportStatusTracker` inside 2D View, add `onPointerLeave` to pane2DRef
8. Modify `App.tsx` -- swap `LocationBar` for `StatusBar`
9. Run `npx tsc --noEmit` and fix any type errors
10. Run `npm test` and verify all tests pass
11. Manual verification: hover over 2D pane, confirm coordinates update in status bar; zoom in/out, confirm scale updates; move cursor out of 2D pane, confirm dashes appear