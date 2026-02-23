# Section 06 -- Event Isolation & Interaction

**Status: IMPLEMENTED** (commit TBD)

## Overview

This section implements pointer event isolation between the 2D and 3D viewport panes and migrates drag interactions away from `setPointerCapture`. In a dual-View setup, both Views share a single Canvas DOM element, so pointer events fire in both Views simultaneously. Without isolation, clicking a hole in the 2D pane would also trigger selection logic in the 3D pane (and vice versa). Additionally, the existing `setPointerCapture` pattern on the shared Canvas element would hijack ALL pointer events to one View, breaking camera controls in the other.

This section creates `ViewportContext`, adds position-based viewport detection to event handlers, migrates `MiniGolfHole.tsx` and `RotationHandle.tsx` away from `setPointerCapture`, and gates `PlacementHandler` with viewport awareness.

## Dependencies

- **section-04-dual-canvas-views**: Canvas + View + View.Port pattern must be in place. `SharedScene.tsx` and `ThreeDOnlyContent.tsx` must be extracted. The container ref and View divs must exist so that pane boundaries can be measured.
- **section-05-camera-system**: Per-pane cameras and controls must be configured. `useKeyboardControls` refactoring (viewport-aware dispatch) is completed in this section since it depends on `activeViewport` routing.
- **section-02-types-and-store**: `activeViewport` field and `setActiveViewport` action must exist in the store.

## Files to Create

- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/contexts/ViewportContext.ts` -- React context providing the viewport identity ("2d" or "3d") to scene components

## Files to Modify

- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/MiniGolfHole.tsx` -- Remove `setPointerCapture`, add viewport gating
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/RotationHandle.tsx` -- Remove `setPointerCapture`, add viewport gating
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacementHandler.tsx` -- Add `activeViewport` gating
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/PlacedHoles.tsx` -- Consume ViewportContext for lock/gating propagation
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/SharedScene.tsx` -- Wrap content in `ViewportContext.Provider`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx` -- Pass viewport identity to each View's SharedScene, set `activeViewport` on pointer/click events
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useKeyboardControls.ts` -- Refactor for viewport-aware keyboard dispatch

---

## Tests First

### No Formal Unit Tests for Pointer Event Isolation

The TDD plan notes: "No unit tests -- this is runtime behavior in R3F event handlers. Validated via manual testing during implementation and visual regression." The same applies to `setPointerCapture` migration: "No unit tests -- drag behavior validated via manual interaction testing."

### Keyboard Controls Migration Tests

These tests may need to be integration-style depending on how coupled the hook is to R3F refs. If the hook can be tested in isolation (by mocking refs), place tests in `tests/hooks/useKeyboardControls.test.ts`. Otherwise validate via manual testing.

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/useKeyboardControls.test.ts`

```ts
// Test: keyboard shortcut dispatches to 2D controls when activeViewport is "2d"
// Test: keyboard shortcut dispatches to 3D controls when activeViewport is "3d"
// Test: camera preset keys (1-6) only work when activeViewport is "3d"
// Test: keyboard shortcuts do nothing when activeViewport is null
```

The existing `shouldHandleKey` export is already tested independently. The new tests verify that the viewport-aware routing logic correctly reads `activeViewport` from the store and dispatches to the correct controls ref.

**Approach for testability:** Refactor `useKeyboardControls` to accept both a `controlsRef2D` and a `controlsRef3D` parameter. The hook reads `activeViewport` from the store and picks the correct ref. Tests can create mock control refs and set `activeViewport` in the store before simulating keydown events.

### Manual Validation Checklist

After implementation, manually verify:

1. Click a hole in the 2D pane -- only selects in 2D, does NOT fire a click in the 3D pane
2. Click a hole in the 3D pane -- only selects in 3D, does NOT fire in 2D
3. Drag a hole in the 2D pane -- drag stays in 2D pane, 3D pane camera is unaffected
4. Drag a hole in the 3D pane -- drag stays in 3D, 2D pane camera is unaffected
5. Rotation handle drag works in both panes independently
6. Moving mouse rapidly across the divider mid-drag does NOT cause phantom events in the other pane
7. PlacementHandler ghost hole only appears in the pane being hovered
8. Keyboard shortcuts (R, F, +, -, arrows) dispatch to whichever pane was last clicked
9. Camera preset keys (1-6) only work when the 3D pane is active

---

## Implementation Details

### 1. ViewportContext

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/contexts/ViewportContext.ts`

Create a React context that provides the viewport identity to all descendant components inside a View.

```ts
import { createContext, useContext } from "react";

/** Identifies which viewport pane a component is rendering inside */
export type ViewportId = "2d" | "3d";

export const ViewportContext = createContext<ViewportId | null>(null);

/** Hook to read the current viewport identity. Returns null if not inside a View. */
export function useViewportId(): ViewportId | null {
	return useContext(ViewportContext);
}
```

### 2. Wrapping Views with ViewportContext.Provider

In the `DualViewport.tsx` component (created in section-04), each View already renders a `SharedScene`. Wrap each View's scene content in a `ViewportContext.Provider`:

```tsx
// Inside the 2D View:
<View ref={view2DRef} ...>
  <ViewportContext.Provider value="2d">
    <SharedScene />
    {/* 2D-specific camera, controls */}
  </ViewportContext.Provider>
</View>

// Inside the 3D View:
<View ref={view3DRef} ...>
  <ViewportContext.Provider value="3d">
    <SharedScene />
    <ThreeDOnlyContent />
    {/* 3D-specific camera, controls */}
  </ViewportContext.Provider>
</View>
```

This means every component rendered inside a View can call `useViewportId()` to know which pane it belongs to.

### 3. Position-Based Viewport Detection for Pointer Events

**Why position-based, not state-based:** The store's `activeViewport` is set on `onPointerEnter` of each pane div (or on click). But during fast mouse movements across the divider, `onPointerEnter` can fire late or in unexpected order, leaving `activeViewport` stale. Position-based detection compares the pointer's screen X coordinate against the divider position and is always accurate.

**Implementation pattern:** Create a utility function that determines which viewport a pointer event belongs to. This requires knowing the divider's X position on screen, which can be obtained from the 2D pane div's bounding rect.

```ts
/**
 * Determine which viewport a pointer event originated from by comparing
 * the event's clientX against the pane boundary.
 *
 * @param clientX - The pointer event's clientX
 * @param paneBoundaryX - The X coordinate of the divider (right edge of 2D pane)
 * @returns "2d" if pointer is in the left pane, "3d" if in the right pane
 */
function getPointerViewport(clientX: number, paneBoundaryX: number): "2d" | "3d" {
	return clientX < paneBoundaryX ? "2d" : "3d";
}
```

However, individual scene components inside Views do NOT have direct access to the divider position. The simpler approach is to use `ViewportContext`:

**Recommended approach:** Each R3F pointer event handler checks `useViewportId()` against the store's determination of which pane the pointer is in. But since both Views instantiate the same components and both receive the same pointer events from the shared Canvas, the key insight is:

- R3F's event system fires events independently per View. Each View does its own raycasting against its own scene graph. When a pointer event hits a mesh in View A, only View A's event handler fires for that mesh instance. View B independently raycasts and may or may not hit a mesh at the same screen position.
- **However**, because both Views render the same scene content (SharedScene), a click at a screen position where a hole mesh exists in BOTH Views will trigger the click handler on BOTH mesh instances (one in each View).

**Therefore, the gating logic is:**

1. Each event handler reads `viewportId` from `ViewportContext` (tells it which View instance it belongs to)
2. It also determines which pane the pointer event actually came from, using position-based detection
3. If `viewportId !== pointerPaneId`, the handler returns early

**Passing the pane boundary:** The pane boundary X coordinate must be accessible to components inside the R3F scene. Options:
- Store it in a ref accessible via context (from DualViewport)
- Store it in Zustand (as `paneBoundaryX`)
- Pass it through ViewportContext as additional data

The simplest approach is to expand `ViewportContext` to include the boundary:

```ts
export type ViewportInfo = {
	id: ViewportId;
	/** The clientX of the right edge of the 2D pane (divider position). 
	 *  null when in single-pane mode. */
	paneBoundaryX: number | null;
};

export const ViewportContext = createContext<ViewportInfo | null>(null);

export function useViewportInfo(): ViewportInfo | null {
	return useContext(ViewportContext);
}
```

Then the gating check in event handlers becomes:

```ts
function isEventForThisViewport(e: ThreeEvent<PointerEvent>, viewport: ViewportInfo): boolean {
	if (viewport.paneBoundaryX === null) return true; // single-pane mode, no gating needed
	const pointerPane = e.nativeEvent.clientX < viewport.paneBoundaryX ? "2d" : "3d";
	return pointerPane === viewport.id;
}
```

**DualViewport updates the boundary:** DualViewport measures the 2D pane div's right edge using `getBoundingClientRect()` on resize/split-ratio changes, and passes it through the provider. A `useRef` with a `ResizeObserver` keeps it updated.

### 4. setPointerCapture Migration in MiniGolfHole.tsx

**Current code (lines 60-64):**
```ts
e.nativeEvent.target &&
	"setPointerCapture" in (e.nativeEvent.target as Element) &&
	(e.nativeEvent.target as Element).setPointerCapture(
		e.nativeEvent.pointerId,
	);
```

**Problem:** The `target` is the shared Canvas DOM element. Capturing the pointer on it means ALL subsequent pointer events (including those for the other View's camera controls) route exclusively to this Canvas element. In a single-Canvas setup this was fine, but with dual Views sharing one Canvas, it breaks the other View.

**Solution:** Remove the `setPointerCapture` call entirely. The existing drag logic already works without it because:

1. `handlePointerDown` sets `dragStart.current` and `pointerStartScreen.current`
2. `handlePointerMove` checks `if (!dragStart.current || !pointerStartScreen.current) return` -- only processes moves when a drag is active
3. `handlePointerMove` uses floor-plane raycasting (`raycaster.ray.intersectPlane(floorPlane, intersection)`) to determine position -- this works regardless of whether the pointer is captured
4. `handlePointerUp` resets the drag state

The reason `setPointerCapture` was originally used was to ensure `onPointerMove` events continue even if the pointer moves off the mesh during drag. In R3F, this is handled differently -- the raycaster in `handlePointerMove` operates on the mesh's `onPointerMove` handler, which only fires when the pointer is over that mesh. Without pointer capture, the drag would stop receiving events when the mouse leaves the mesh bounding box.

**Mitigation:** Use PlacementHandler's approach -- add a full-pane invisible mesh that receives pointer move events during drag. Alternatively, attach a window-level `pointermove` listener during drag:

```ts
// In handlePointerDown, instead of setPointerCapture:
const onWindowPointerMove = (e: PointerEvent) => {
	// Convert screen coords to world coords via raycaster
	// Update hole position
};
const onWindowPointerUp = (e: PointerEvent) => {
	window.removeEventListener("pointermove", onWindowPointerMove);
	window.removeEventListener("pointerup", onWindowPointerUp);
	// Reset drag state
};
window.addEventListener("pointermove", onWindowPointerMove);
window.addEventListener("pointerup", onWindowPointerUp);
```

However, this bypasses R3F's event system and requires manual raycasting. The cleaner approach:

**Preferred approach -- invisible drag plane mesh:** When a drag starts on a hole, render an invisible plane mesh (similar to PlacementHandler's pattern) that covers the entire pane. Attach `onPointerMove` and `onPointerUp` to this plane. This ensures move events continue even when the pointer leaves the hole mesh. The plane is removed when the drag ends.

Concretely, in `MiniGolfHole.tsx`:

- Add a `isDragging` state (already exists)
- When `isDragging` is true, render an invisible plane mesh at floor level covering the hall
- Attach `handlePointerMove` and `handlePointerUp` to this plane mesh
- Remove the `setPointerCapture` call from `handlePointerDown`

Alternatively, since `PlacementHandler` already has a full-hall invisible plane, refactor so that drag events are handled by a shared interaction layer. But this is a larger refactor. The per-hole invisible plane approach is simpler and self-contained.

**Implementation sketch for MiniGolfHole.tsx:**

```tsx
function MiniGolfHole({ hole, isSelected, onClick }: Props) {
	const viewportInfo = useViewportInfo();
	// ... existing state and refs ...

	function handlePointerDown(e: ThreeEvent<PointerEvent>) {
		if (tool !== "select" || !isSelected) return;
		// Viewport gating
		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
		e.stopPropagation();
		// NO setPointerCapture -- removed
		dragStart.current = { x: hole.position.x, z: hole.position.z };
		pointerStartScreen.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
	}

	// handlePointerMove and handlePointerUp remain largely the same,
	// but add viewport gating at the top of each

	return (
		<group ...>
			{/* Existing interaction mesh */}
			<mesh ... onPointerDown={handlePointerDown} ... />

			{/* Drag plane -- only when actively dragging */}
			{isDragging && (
				<mesh
					rotation={[-Math.PI / 2, 0, 0]}
					position={[hall.width / 2, 0.01, hall.length / 2]}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					visible={false}
				>
					<planeGeometry args={[hall.width * 2, hall.length * 2]} />
					<meshBasicMaterial transparent opacity={0} />
				</mesh>
			)}
			{/* ... rest of component */}
		</group>
	);
}
```

The drag plane is large enough (2x hall size) to catch pointer moves even when the cursor goes slightly outside the hall bounds.

### 5. setPointerCapture Migration in RotationHandle.tsx

**Current code (line 38-40):**
```ts
(e.nativeEvent.target as Element)?.setPointerCapture?.(
	e.nativeEvent.pointerId,
);
```

Same problem as MiniGolfHole. The rotation handle is a small sphere -- without pointer capture, `onPointerMove` stops firing when the pointer leaves the sphere during drag.

**Solution:** Same pattern as MiniGolfHole. When `isDragging` is true, render an invisible plane mesh at floor level that captures move and up events:

```tsx
function RotationHandle({ holeId, holeX, holeZ, rotation }: RotationHandleProps) {
	const viewportInfo = useViewportInfo();
	// ... existing state ...

	function handlePointerDown(e: ThreeEvent<PointerEvent>) {
		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
		e.stopPropagation();
		setIsDragging(true);
		// NO setPointerCapture
		// ...
	}

	return (
		<group position={[holeX, 0.01, holeZ]}>
			{/* Ring outline */}
			<mesh ...> ... </mesh>
			{/* Drag handle sphere */}
			<mesh ... onPointerDown={handlePointerDown} ...> ... </mesh>
			{/* Drag plane for rotation -- floor-level plane to catch moves */}
			{isDragging && (
				<mesh
					rotation={[-Math.PI / 2, 0, 0]}
					position={[0, 0, 0]}
					onPointerMove={handlePointerMove}
					onPointerUp={handlePointerUp}
					visible={false}
				>
					<planeGeometry args={[20, 20]} />
					<meshBasicMaterial transparent opacity={0} />
				</mesh>
			)}
		</group>
	);
}
```

Note: The `RotationHandle` uses `e.point.x` and `e.point.z` for angle calculation. When the event comes from the drag plane mesh (at y=0.01), the intersection point is on the floor plane, which is exactly what we need for angle calculation. The math works identically.

### 6. PlacementHandler Viewport Gating

`PlacementHandler` renders an invisible floor-plane mesh and handles placement clicks and ghost hole positioning. In dual-View mode, both Views have their own `PlacementHandler` instance (since it is part of `SharedScene`).

**Gating approach:** The `PlacementHandler` should only respond to events in the pane the user is interacting with. Add viewport gating to all event handlers:

```tsx
function PlacementHandler() {
	const viewportInfo = useViewportInfo();
	// ... existing logic ...

	function handlePointerMove(e: ThreeEvent<PointerEvent>) {
		if (!isPlacing) return;
		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
		// ... existing logic ...
	}

	function handleClick(e: ThreeEvent<MouseEvent>) {
		if (viewportInfo && !isEventForThisViewport(e as unknown as ThreeEvent<PointerEvent>, viewportInfo)) return;
		e.stopPropagation();
		// ... existing logic ...
	}

	// Same for handlePointerDown and handlePointerUp
}
```

The ghost hole should only appear in the pane being hovered. Since each View has its own `PlacementHandler` instance with its own React state (`ghostPos`), this works naturally -- only the instance that receives (non-gated) pointer events will update its ghost position.

### 7. Viewport Gating in Click/Select Handlers

The `MiniGolfHole` `onClick` handler (line 179-186) selects or deletes holes. Add viewport gating:

```tsx
onClick={(e) => {
	if (viewportInfo && !isEventForThisViewport(e as unknown as ThreeEvent<PointerEvent>, viewportInfo)) return;
	e.stopPropagation();
	if (tool === "delete") {
		removeHole(hole.id);
	} else {
		onClick();
	}
}}
```

### 8. Setting activeViewport on Interaction

The `DualViewport` component should set `activeViewport` in the store when the user interacts with a pane. This is used for **keyboard routing** (not pointer gating, which uses position-based detection).

```tsx
// In DualViewport.tsx
function handlePaneInteraction(pane: "2d" | "3d") {
	const setActiveViewport = useStore.getState().setActiveViewport;
	setActiveViewport(pane);
}

// On each pane div:
<div
	ref={view2DRef}
	onClick={() => handlePaneInteraction("2d")}
	onPointerDown={() => handlePaneInteraction("2d")}
	style={{ width: `${splitRatio * 100}%` }}
>
```

### 9. Keyboard Controls Refactoring

**Current state:** `useKeyboardControls` takes a single `controlsRef` and camera parameters. It is called once from `ThreeCanvas.tsx` (or its successor).

**New approach:** The hook accepts refs to both the 2D and 3D controls and reads `activeViewport` from the store to decide which controls to dispatch to.

**New signature:**

```ts
type KeyboardControlsOptions = {
	controls2DRef: React.RefObject<OrbitControlsImpl | null>;
	controls3DRef: React.RefObject<CameraControlsImpl | null>;
	defaultZoom2D: number;
	defaultTarget: [number, number, number];
	hallWidth: number;
	hallLength: number;
};

export function useKeyboardControls(options: KeyboardControlsOptions): void;
```

**Key behavioral changes:**

- Read `activeViewport` from `useStore.getState().ui.activeViewport` inside the keydown handler
- If `activeViewport === "2d"`: dispatch R, F, +, -, 0, arrow keys to `controls2DRef`
- If `activeViewport === "3d"`: dispatch R, F, arrow keys to `controls3DRef`. Camera preset keys (1-6) call `controls3DRef.current.setLookAt(...)` with positions from `getCameraPresets()`
- If `activeViewport === null`: only handle global shortcuts (undo/redo via Ctrl+Z, snap toggle via G)
- Camera preset keys (1-6) are **3D-only** and have no effect in 2D mode

**CameraControls (drei) vs OrbitControls differences:**
- OrbitControls: manipulate `controls.target`, `camera.position`, `camera.zoom`, then call `controls.update()`
- CameraControls (camera-controls library): call `controls.setLookAt(posX, posY, posZ, targetX, targetY, targetZ, enableTransition)` for smooth animated transitions

The refactored hook must handle both control types. The 2D control logic remains the same as the current implementation. The 3D control logic uses `CameraControls` API methods.

### 10. Utility Function: isEventForThisViewport

Create a small utility (can live in `ViewportContext.ts` or a separate `src/utils/viewportEvent.ts`):

```ts
import type { ThreeEvent } from "@react-three/fiber";
import type { ViewportInfo } from "../contexts/ViewportContext";

/**
 * Checks whether a pointer event originated from the same pane
 * as the component calling this function.
 *
 * Uses position-based detection: compares the event's clientX
 * against the divider position (paneBoundaryX).
 *
 * Returns true in single-pane mode (no gating needed).
 */
export function isEventForThisViewport(
	e: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>,
	viewport: ViewportInfo,
): boolean {
	if (viewport.paneBoundaryX === null) return true;
	const pointerPane = e.nativeEvent.clientX < viewport.paneBoundaryX ? "2d" : "3d";
	return pointerPane === viewport.id;
}
```

---

## Edge Cases and Considerations

### Fast Mouse Movement Across Divider

When the user moves the mouse rapidly from one pane to another mid-drag, the position-based detection ensures events are correctly attributed. Even if `onPointerEnter` hasn't fired yet for the new pane, the `clientX` check is always accurate.

### Drag in Progress When Crossing Divider

If a user starts dragging a hole in the 2D pane and moves the mouse into the 3D pane:
- The drag plane mesh is in the 2D View's scene graph
- The 2D View's raycaster will still hit the drag plane at the pointer's screen position (the View does NOT clip raycasting to its scissor rect -- it raycasts based on screen position)
- However, the viewport gating check will reject events where `clientX` is past the boundary
- This means the drag effectively "pauses" when the mouse crosses into the other pane
- When the mouse returns to the original pane, the drag resumes
- This is acceptable behavior -- similar to how other split-pane editors work

### Single-Pane (Collapsed) Mode

When `viewportLayout` is `"2d-only"` or `"3d-only"`, only one View exists. The `paneBoundaryX` is set to `null`, and `isEventForThisViewport` returns `true` unconditionally. No gating logic runs.

### Mobile Mode

On mobile (<768px), the existing single-Canvas pattern is used (no View components). `ViewportContext` is either not provided (returns `null` from `useViewportInfo()`) or is set with `paneBoundaryX: null`. All event handlers work exactly as they do today.

### Pointer Events on Hover/Enter/Leave

Hover effects (`onPointerEnter`, `onPointerLeave` on `MiniGolfHole`) set visual state (`isHovered`). These should also be gated to prevent phantom hover states in the non-active pane. Add the viewport check to these handlers as well:

```tsx
onPointerEnter={(e) => {
	if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
	setIsHovered(true);
}}
onPointerLeave={(e) => {
	if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
	setIsHovered(false);
}}
```

---

## Summary of Changes

| File | Change | Reason |
|------|--------|--------|
| `src/contexts/ViewportContext.ts` | **New file** -- React context with `ViewportId`, `ViewportInfo`, `useViewportInfo()`, and `isEventForThisViewport()` utility | Central viewport identification mechanism |
| `src/components/three/MiniGolfHole.tsx` | Remove `setPointerCapture`, add drag plane mesh, add viewport gating to all pointer handlers | Event isolation + drag continuity without pointer capture |
| `src/components/three/RotationHandle.tsx` | Remove `setPointerCapture`, add drag plane mesh, add viewport gating | Same |
| `src/components/three/PlacementHandler.tsx` | Add viewport gating to all event handlers | Ghost hole and placement only in active pane |
| `src/components/three/PlacedHoles.tsx` | **Not modified** -- children consume ViewportContext directly | No changes needed; context flows through React tree |
| `src/components/layout/DualViewport.tsx` | Wrap each View's content in `ViewportContext.Provider`, track `paneBoundaryX` via ResizeObserver, set `activeViewport` on pane click | Provide viewport identity and boundary to scene components |
| `src/hooks/useKeyboardControls.ts` | **Not modified in this section** -- already refactored in section-05 | Keyboard routing was completed in section-05 |

---

## Implementation Notes (Post-Implementation)

### Deviations from Plan

1. **PlacedHoles.tsx not modified**: Plan suggested passing viewport info down. In practice, children (MiniGolfHole, RotationHandle) consume `ViewportContext` directly via `useViewportInfo()` hook — no prop drilling needed.

2. **SharedScene.tsx not wrapped**: Plan suggested wrapping SharedScene content. Instead, `ViewportContext.Provider` wraps at the `DualViewport` level around each View's entire content tree, which is cleaner and covers all children.

3. **useKeyboardControls.ts not modified**: The plan included keyboard routing refactoring, but this was already completed in section-05 as part of the camera system work.

4. **Drag plane positioning in MiniGolfHole**: The drag plane is positioned relative to the hole's group (offset to hall center), not at absolute hall center. This accounts for the group's position transform.

### Code Review Fixes Applied

- **Critical**: Added `isEventForThisViewport` checks to `RotationHandle.handlePointerMove` and `handlePointerUp` (were missing in initial implementation)
- **Critical**: Added `isEventForThisViewport` check to `MiniGolfHole.handlePointerUp` (was missing)
- **Warning**: Fixed Biome import ordering — moved ViewportContext imports before utils imports
- **Warning**: Removed redundant `splitRatio` useEffect for boundary tracking — ResizeObserver already handles CSS calc changes

### Files Actually Created/Modified

| File | Action |
|------|--------|
| `src/contexts/ViewportContext.ts` | **Created** — ViewportInfo type, useViewportInfo hook, isEventForThisViewport utility |
| `src/components/layout/DualViewport.tsx` | **Modified** — ViewportContext.Provider wrapping, paneBoundaryX via ResizeObserver |
| `src/components/three/MiniGolfHole.tsx` | **Modified** — Removed setPointerCapture, added drag plane, viewport gating on all 6 handlers |
| `src/components/three/RotationHandle.tsx` | **Modified** — Removed setPointerCapture, added drag plane, viewport gating on all 3 handlers |
| `src/components/three/PlacementHandler.tsx` | **Modified** — Viewport gating on handlePointerMove, handlePointerDown, handlePointerUp, handleClick |

### Test Results

- All 560 existing tests pass (no new unit tests — pointer event isolation is runtime R3F behavior validated via manual testing)
- TypeScript clean (`npx tsc --noEmit` passes)