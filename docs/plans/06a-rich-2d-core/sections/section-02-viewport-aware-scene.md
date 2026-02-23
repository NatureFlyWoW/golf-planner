Now I have all the information I need. Let me generate the section content.

# Section 2: Viewport-Aware SharedScene

## Overview

This section makes `SharedScene` and its children viewport-aware so that 2D-specific architectural components can render only in the 2D pane, while the 3D pane continues rendering the existing 3D box-geometry walls and colored opening planes unchanged.

The core deliverable is a `useViewportId()` hook that reads the existing `ViewportContext` and returns just the viewport id string (`"2d"`, `"3d"`, or `null`). Consumers use this hook to branch their rendering logic. This section also modifies `Hall`, `FloorGrid`, and `SharedScene` to become viewport-aware, and stubs out the `ArchitecturalFloorPlan` wrapper component that later sections will populate.

**User-Visible Outcome:** After this section, the 2D pane no longer shows the 3D box-geometry walls, 3D colored door/window planes, or the drei `<Grid>`. Those elements continue to appear in the 3D pane. The 2D pane shows only the floor plane (and any placed holes/flow path). The architectural replacements (thick walls, door arcs, labeled grid) are added by subsequent sections (03, 04, 06).

---

## Dependencies

- **Section 01 (Rendering Spike):** Must be complete first. The spike validated that drei `<Line>` and `<Text>` work correctly in the orthographic View.
- **ViewportContext already exists** at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/contexts/ViewportContext.ts`. It provides `{ id: "2d" | "3d", paneBoundaryX }` and has a `useViewportInfo()` hook. This section adds a simpler `useViewportId()` convenience wrapper.

---

## Tests First

### File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/useViewportId.test.ts`

These unit tests validate the `useViewportId()` hook. Since it is a thin wrapper around React context, the tests render the hook inside a provider and assert the returned value.

```typescript
import { describe, expect, it } from "vitest";
// Test the pure logic of useViewportId:
// - Returns "2d" when ViewportContext provides { id: "2d" }
// - Returns "3d" when ViewportContext provides { id: "3d" }
// - Returns null when no ViewportContext is provided (mobile fallback)

describe("useViewportId", () => {
	it("returns '2d' when ViewportContext provides id='2d'", () => {
		// Render useViewportId inside a ViewportContext.Provider with { id: "2d", paneBoundaryX: 500 }
		// Assert the hook returns "2d"
	});

	it("returns '3d' when ViewportContext provides id='3d'", () => {
		// Render useViewportId inside a ViewportContext.Provider with { id: "3d", paneBoundaryX: 500 }
		// Assert the hook returns "3d"
	});

	it("returns null when no ViewportContext is provided (mobile fallback)", () => {
		// Render useViewportId without any ViewportContext.Provider wrapping it
		// Assert the hook returns null
	});
});
```

**Testing approach:** Since `useViewportId` is a React hook, use `@testing-library/react`'s `renderHook` with a custom `wrapper` that provides `ViewportContext.Provider`. For the `null` case, render without any provider.

If `@testing-library/react` is not available in the project, the tests can alternatively extract the logic into a plain function `getViewportId(info: ViewportInfo | null): ViewportId | null` that is trivially testable, with the hook being a one-liner wrapper. This is the preferred approach since the project currently tests pure functions rather than hooks that require React rendering infrastructure.

---

## Implementation Details

### New File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useViewportId.ts`

A convenience hook that reads `ViewportContext` and returns only the viewport id string.

```typescript
import { useContext } from "react";
import { ViewportContext } from "../contexts/ViewportContext";
import type { ViewportId } from "../contexts/ViewportContext";

/**
 * Returns the current viewport id ("2d" or "3d"), or null if not inside
 * a ViewportContext.Provider (e.g., mobile single-pane mode).
 */
export function useViewportId(): ViewportId | null {
	const info = useContext(ViewportContext);
	return info?.id ?? null;
}
```

This is intentionally thin. The existing `useViewportInfo()` returns the full `ViewportInfo` object (with `paneBoundaryX`), which is needed by event-gating logic. `useViewportId()` is for the simpler viewport-branching use case.

---

### Modified File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/Hall.tsx`

Make `Hall` viewport-aware. In the 2D viewport, skip `<HallWalls>` and `<HallOpenings>` (they will be replaced by architectural components from sections 03 and 04). In the 3D viewport (or when viewport is `null`, i.e. mobile), render everything as before.

**Key changes:**

1. Import `useViewportId` from `../../hooks/useViewportId`.
2. Call `const viewportId = useViewportId()` at the top of the component.
3. Define `const is2D = viewportId === "2d"`.
4. Conditionally render `<HallWalls>` and `<HallOpenings>` only when `!is2D`.
5. `<HallFloor>` continues to render in both viewports (the floor plane is needed as a base in 2D).

**Modified component structure:**

```typescript
export function Hall({ sunData }: HallProps) {
	const wallsLayer = useStore((s) => s.ui.layers.walls);
	const viewportId = useViewportId();
	const is2D = viewportId === "2d";

	return (
		<Suspense fallback={null}>
			<group>
				<HallFloor />
				{/* 3D box-geometry walls: only in 3D viewport (or mobile/null) */}
				{!is2D && wallsLayer.visible && (
					<HallWalls layerOpacity={wallsLayer.opacity} />
				)}
				{!is2D && wallsLayer.visible && <HallOpenings sunData={sunData} />}
			</group>
		</Suspense>
	);
}
```

**Mobile handling:** When `viewportId` is `null` (mobile single-pane mode without `<View>` components), `is2D` is `false`, so the existing 3D walls and openings render as they always have. This preserves backward compatibility. When mobile top-down mode gets simplified architectural walls (outline only), that will be handled separately -- for now, mobile continues to use the 3D geometry.

---

### Modified File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/FloorGrid.tsx`

Make `FloorGrid` viewport-aware. In the 2D viewport, skip the drei `<Grid>` entirely (it will be replaced by `ArchitecturalGrid2D` from section 06). In the 3D viewport, render the drei `<Grid>` as before.

**Key changes:**

1. Import `useViewportId`.
2. Call `const viewportId = useViewportId()` at the top.
3. Return `null` when `viewportId === "2d"` (early return before the existing `<Grid>` render).

```typescript
export function FloorGrid() {
	const { width, length } = useStore((s) => s.hall);
	const uvMode = useStore((s) => s.ui.uvMode);
	const gridLayer = useStore((s) => s.ui.layers.grid);
	const viewportId = useViewportId();

	if (!gridLayer.visible) return null;

	// In 2D viewport, skip drei Grid (replaced by ArchitecturalGrid2D)
	if (viewportId === "2d") return null;

	return (
		<Grid
			position={[width / 2, 0.01, length / 2]}
			args={[width, length]}
			cellSize={1}
			cellThickness={uvMode ? 0.3 : 0.5}
			cellColor={uvMode ? "#2A2A5E" : "#cccccc"}
			sectionSize={5}
			sectionThickness={uvMode ? 0.5 : 1}
			sectionColor={uvMode ? "#2A2A5E" : "#999999"}
			fadeDistance={50}
			infiniteGrid={false}
		/>
	);
}
```

**Mobile handling:** When `viewportId` is `null` (mobile), the drei `<Grid>` still renders as before (no change in behavior).

---

### New File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/ArchitecturalFloorPlan.tsx`

A wrapper component that renders 2D-only architectural content. It checks the viewport and renders nothing in the 3D pane. This is the mount point for all subsequent architectural components (walls, openings, grid, hole overlays) added in sections 03-07.

For this section, it renders an empty group as a placeholder. Subsequent sections fill it in.

```typescript
import { useViewportId } from "../../../hooks/useViewportId";

/**
 * Container for all 2D architectural floor plan elements.
 * Only renders in the 2D viewport. Children added in sections 03-07.
 */
export function ArchitecturalFloorPlan() {
	const viewportId = useViewportId();

	// Only render in 2D viewport
	if (viewportId !== "2d") return null;

	return (
		<group name="architectural-floor-plan">
			{/* Section 03: ArchitecturalWalls2D */}
			{/* Section 04: ArchitecturalOpenings2D */}
			{/* Section 06: ArchitecturalGrid2D */}
			{/* Section 07: HoleFelt2D overlays */}
		</group>
	);
}
```

**Mobile handling note:** When `viewportId` is `null` (mobile top-down), this component returns `null`. A future enhancement could detect mobile top-down mode (`viewportId === null` and `useStore(s => s.ui.view) === "top"`) and render simplified architectural walls. That decision is deferred to section 10 (integration/polish).

---

### Modified File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/SharedScene.tsx`

Add `<ArchitecturalFloorPlan />` alongside existing children. The wrapper internally checks viewport and renders 2D content only in the 2D pane.

**Key changes:**

1. Import `ArchitecturalFloorPlan` from `./architectural/ArchitecturalFloorPlan`.
2. Add `<ArchitecturalFloorPlan />` after the existing `<FloorGrid />` element.

```typescript
import { ArchitecturalFloorPlan } from "./architectural/ArchitecturalFloorPlan";

export function SharedScene({ sunData }: SharedSceneProps) {
	const uvMode = useStore((s) => s.ui.uvMode);

	return (
		<>
			<ambientLight
				color={uvMode ? "#220044" : "#ffffff"}
				intensity={uvMode ? 0.3 : 0.8}
			/>
			{/* ... existing directional light logic unchanged ... */}
			<Hall sunData={sunData} />
			<PlacedHoles />
			<FlowPath />
			<FloorGrid />
			<ArchitecturalFloorPlan />
			<SunIndicator sunData={sunData} />
		</>
	);
}
```

No other changes to `SharedScene`. The `ArchitecturalFloorPlan` component handles its own viewport gating.

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useViewportId.ts` | **Create** | Convenience hook returning viewport id or null |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/ArchitecturalFloorPlan.tsx` | **Create** | 2D-only wrapper for architectural elements |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/Hall.tsx` | **Modify** | Skip HallWalls/HallOpenings in 2D viewport |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/FloorGrid.tsx` | **Modify** | Skip drei Grid in 2D viewport |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/SharedScene.tsx` | **Modify** | Mount ArchitecturalFloorPlan |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/useViewportId.test.ts` | **Create** | Unit tests for useViewportId hook |

---

## Integration Verification Checklist

After implementing this section, verify:

1. **3D pane unchanged:** The 3D viewport still shows box-geometry walls, colored door/window planes, and the drei Grid exactly as before.
2. **2D pane shows floor only:** The 2D viewport no longer shows 3D walls, door/window planes, or the drei Grid. The floor plane is still visible. Placed holes and flow path still render.
3. **Mobile unchanged:** Mobile single-pane mode (both top-down and 3D) renders identically to before -- the `useViewportId` hook returns `null`, so all `is2D` checks are `false`.
4. **Hole placement still works:** Since `PlacementHandler` uses `useViewportInfo()` (not the new `useViewportId`), and raycasts target the floor plane, hole placement in the 2D pane must still function.
5. **Layer toggles still work:** Toggling the walls layer off hides walls in the 3D pane. The 2D pane already has no walls to hide (they are skipped by viewport gating). When architectural walls arrive in section 03, they will respect the same layer toggle.
6. **TypeScript passes:** `npx tsc --noEmit` must succeed with no errors.
7. **Existing tests pass:** `npm run test` must show no regressions.

---

## Technical Notes

### Why a new hook instead of using `useViewportInfo`?

The existing `useViewportInfo()` hook returns the full `ViewportInfo` object with `paneBoundaryX`, which is needed for position-based event gating. The new `useViewportId()` hook returns only the string id, which is all that's needed for viewport-conditional rendering. This keeps consuming components simpler and avoids unnecessary coupling to the `paneBoundaryX` field.

### Why not use a separate React tree for 2D vs 3D?

Both Views share the same `SharedScene` component tree. This is by design -- it ensures shared state (placed holes, flow path, sun indicator) is always in sync across viewports. The viewport-aware pattern (check context, branch rendering) is lightweight and keeps the single-tree architecture intact.

### ArchitecturalFloorPlan renders an empty group for now

This is intentional. The component serves as a mount point. Sections 03, 04, 06, and 07 will each add their children into this group. The empty group has zero rendering cost.

## Implementation Notes

- Implementation matched plan exactly, no deviations
- Used pure function extraction (`getViewportId`) for testability since `@testing-library/react` is not available
- Code review: clean pass, no issues found
- 585 tests pass (582 existing + 3 new useViewportId tests)
- TypeScript compiles clean