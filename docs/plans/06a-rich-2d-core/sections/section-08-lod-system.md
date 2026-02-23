Good, no existing LOD system exists. Now I have all the context needed to write the section.

# Section 8: Scale-Dependent Detail (LOD System)

## Overview

This section implements a lightweight zoom-level-based Level of Detail (LOD) system for the 2D architectural floor plan. The core deliverable is a `useZoomLOD()` hook that returns a detail level (`"overview"`, `"standard"`, or `"detail"`) based on the current orthographic camera zoom. Architectural components from other sections consume this hook to conditionally show or hide detail elements at different zoom levels.

The hook is designed to be zero-cost from a React re-render perspective: it stores the LOD level in a ref, not in React state, so reading it does not trigger component re-renders. Components access the current LOD level during their own `useFrame` callbacks or render cycles.

**No new npm dependencies are required.**

---

## Dependencies

- **Section 2 (Viewport-Aware SharedScene):** The `useViewportId()` hook (from `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useViewportId.ts`) is used by consumer components to gate LOD behavior to the 2D viewport. However, the `useZoomLOD` hook itself is viewport-agnostic -- it simply reads camera zoom. Consumers decide where to use it.
- **No other section dependencies.** This section is independently implementable.

---

## LOD Thresholds

The LOD system defines three detail levels based on `camera.zoom` from the orthographic camera:

| Level | Zoom Range | Use Case |
|-------|-----------|----------|
| `"overview"` | zoom < 15 | Far out, seeing entire hall. Minimal detail. |
| `"standard"` | 15 <= zoom < 40 | Normal working zoom. Standard architectural detail. |
| `"detail"` | zoom >= 40 | Zoomed in close. Full detail including textures. |

Boundary behavior: exactly 15 maps to `"standard"`, exactly 40 maps to `"detail"`.

---

## What Changes Per LOD Level

This table summarizes how other sections' components should use the LOD value. These components are NOT implemented in this section -- only the hook and its pure logic function are delivered here.

| Feature | Overview (< 15) | Standard (15-40) | Detail (>= 40) |
|---------|-----------------|-------------------|---------------|
| Walls (Section 3) | Outline only, no fill | Solid fill + outline | Same as standard |
| Door arcs (Section 4) | Hidden | Visible | Visible |
| Window symbols (Section 4) | Hidden | Visible | Visible |
| Hole texture (Section 7) | Solid color | Solid color | Felt shader |
| Grid (Section 6) | Major every 5m | Major 1m + minor 0.5m | Major 1m + minor 0.25m |
| Grid labels (Section 6) | Every 5m | Every 1m | Every 1m |

---

## Tests First

### Test File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/useZoomLOD.test.ts`

The LOD hook uses `useFrame` and a ref internally, which makes it hard to unit-test in isolation without an R3F Canvas. Instead, extract the pure threshold logic into a standalone function `computeLODLevel(zoom: number): LODLevel` that can be tested trivially. The hook itself is a thin wrapper that calls this function inside `useFrame`.

```typescript
import { describe, expect, it } from "vitest";
import { computeLODLevel } from "../../src/hooks/useZoomLOD";

describe("computeLODLevel", () => {
	it("returns 'overview' when zoom < 15", () => {
		expect(computeLODLevel(5)).toBe("overview");
		expect(computeLODLevel(10)).toBe("overview");
		expect(computeLODLevel(14.9)).toBe("overview");
	});

	it("returns 'standard' when zoom is between 15 and 40", () => {
		expect(computeLODLevel(20)).toBe("standard");
		expect(computeLODLevel(30)).toBe("standard");
		expect(computeLODLevel(39.9)).toBe("standard");
	});

	it("returns 'detail' when zoom >= 40", () => {
		expect(computeLODLevel(40)).toBe("detail");
		expect(computeLODLevel(50)).toBe("detail");
		expect(computeLODLevel(100)).toBe("detail");
	});

	it("boundary at exactly 15 returns 'standard'", () => {
		expect(computeLODLevel(15)).toBe("standard");
	});

	it("boundary at exactly 40 returns 'detail'", () => {
		expect(computeLODLevel(40)).toBe("detail");
	});

	it("returns 'overview' for zoom of 0", () => {
		expect(computeLODLevel(0)).toBe("overview");
	});

	it("returns 'overview' for negative zoom (edge case)", () => {
		expect(computeLODLevel(-1)).toBe("overview");
	});
});
```

These tests validate the pure logic. The hook wrapper (`useZoomLOD`) is integration-tested via visual tests in Section 10 where components change appearance at different zoom levels.

---

## Implementation Details

### File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useZoomLOD.ts`

This file exports two things:

1. **`computeLODLevel(zoom: number): LODLevel`** -- A pure function containing the threshold logic. Exported for direct use by components that already have access to the camera zoom value, and for unit testing.

2. **`useZoomLOD(): React.RefObject<LODLevel>`** -- A React hook that reads `camera.zoom` via `useFrame` each frame, computes the LOD level, and stores it in a `useRef`. Returns the ref so consumers can read `.current` without triggering re-renders.

### Type Definition

Define the LOD level type inline in the hook file (used in only this file and its consumers, but since it will be used across multiple architectural components, place it in the types directory if preferred):

```typescript
/** Level of detail for the 2D architectural view */
export type LODLevel = "overview" | "standard" | "detail";
```

### Pure Function Signature

```typescript
/**
 * Computes the LOD level from a camera zoom value.
 *
 * Thresholds:
 * - zoom < 15  -> "overview"  (far out, minimal detail)
 * - 15 <= zoom < 40 -> "standard" (working zoom, standard detail)
 * - zoom >= 40 -> "detail"   (close up, full detail)
 */
export function computeLODLevel(zoom: number): LODLevel {
	// Implementation: simple if/else chain
}
```

### Hook Signature

```typescript
/**
 * Returns a ref containing the current LOD level based on camera zoom.
 *
 * Uses useFrame to read camera.zoom each frame. Stores result in a ref
 * to avoid React state updates and re-renders. Consumers read
 * `lodRef.current` during their own useFrame or render.
 *
 * Must be called inside an R3F Canvas context.
 */
export function useZoomLOD(): React.RefObject<LODLevel> {
	// Implementation:
	// 1. const lodRef = useRef<LODLevel>("standard")
	// 2. useFrame(({ camera }) => { lodRef.current = computeLODLevel(camera.zoom) })
	// 3. return lodRef
}
```

### Key Design Decisions

**Why a ref, not React state?** The camera zoom changes continuously during pinch/scroll. Writing to React state at 60fps would cause 60 re-renders per second across every component that reads the LOD level. A ref avoids this entirely. Components that need to react to LOD changes either:
- Read `lodRef.current` inside their own `useFrame` callback (for Three.js objects like showing/hiding meshes)
- Read `lodRef.current` during render (for conditional JSX), which picks up the value from the previous frame -- acceptable since LOD transitions are not frame-critical

**Why a separate pure function?** Extracting `computeLODLevel` makes the threshold logic unit-testable without needing an R3F Canvas, a mock camera, or a `useFrame` mock. The hook is just a thin integration layer.

**Hysteresis consideration:** The current design uses simple threshold comparison with no hysteresis (deadband). If the camera zoom oscillates exactly at a threshold boundary (e.g., 14.9 to 15.1 repeatedly), components would toggle rapidly between LOD levels. In practice this is unlikely to be noticeable since:
- LOD transitions are visual (show/hide elements), not animated
- Camera zoom changes are typically smooth continuous motions, not oscillating
- If this becomes a problem in Section 10 integration testing, add a small hysteresis band (e.g., transitions up at 15 but back down at 13)

---

## Consumer Usage Pattern

Other sections' components will use the hook like this (for reference -- NOT implemented in this section):

```typescript
// Inside an architectural component (e.g., ArchitecturalWalls2D)
const lodRef = useZoomLOD();

// Option A: In useFrame (for Three.js object visibility)
useFrame(() => {
	const lod = lodRef.current;
	if (fillMeshRef.current) {
		fillMeshRef.current.visible = lod !== "overview";
	}
});

// Option B: In render (for conditional JSX, one frame behind)
const lod = lodRef.current;
return (
	<group>
		{/* Outline always visible */}
		<Line points={outlinePoints} />
		{/* Fill only at standard+ */}
		{lod !== "overview" && <mesh><planeGeometry /><meshBasicMaterial /></mesh>}
	</group>
);
```

---

## File Summary

| Action | File Path |
|--------|-----------|
| **Create** | `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useZoomLOD.ts` |
| **Create** | `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/useZoomLOD.test.ts` |

No files are modified. No store changes. No new dependencies.

---

## Checklist

1. Write the test file `tests/hooks/useZoomLOD.test.ts` with all threshold and boundary tests
2. Create `src/hooks/useZoomLOD.ts` with the `LODLevel` type, `computeLODLevel` pure function, and `useZoomLOD` hook
3. Run `npm test -- tests/hooks/useZoomLOD.test.ts` and confirm all tests pass
4. Run `npx tsc --noEmit` and confirm no type errors
5. Run `npm run check` (Biome) and confirm no lint/format issues

---

## Implementation Notes (Post-Build)

Implementation matches plan exactly. No deviations.

### Files Created
- `src/hooks/useZoomLOD.ts` — `LODLevel` type, `computeLODLevel` pure function, `useZoomLOD` ref-based hook
- `tests/hooks/useZoomLOD.test.ts` — 7 tests covering all thresholds and boundary cases

### Test Results
- 7 new tests, 639 total passing (0 regressions)