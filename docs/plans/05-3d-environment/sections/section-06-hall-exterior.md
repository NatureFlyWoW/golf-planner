Now I have a comprehensive understanding of the codebase. I can generate the section content.

# Section 6: Hall Exterior (Walls + Roof + Foundation)

## Overview

This section makes the BORGA hall visible from the outside when viewing the 3D environment. It adds three components: exterior wall faces using `BackSide` material rendering, a pitched roof matching the BORGA specification, and a concrete foundation strip around the hall perimeter. All components are gated by the environment layer (added in section 5) and only mount in the 3D viewport.

## Dependencies

This section has no hard dependencies. It can be implemented in parallel with section-01, section-05, and section-08 (Batch 1 in the execution order).

Soft dependency: The environment layer (`LayerId = "environment"`) is added in **section-05**. If section-05 is not yet merged, implement the environment layer gating stub here and let section-05 take ownership of the canonical type/constant additions. The gating logic is identical — both sections need the same layer check.

Section-09 (performance polish) depends on this section being complete.

## Background

The BORGA hall specs (canonical source: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/constants/hall.ts`):
- Width: 10.0m, Length: 20.0m
- `wallHeight`: 4.3m (eave height)
- `firstHeight`: 4.9m (ridge height — this is the canonical BORGA value for roof peak)
- `wallThickness`: 0.1m
- Roof pitch: 7 degrees

The existing `HallWalls.tsx` renders only interior-facing wall surfaces (inside the hall). These have `side: THREE.FrontSide` (default). When the camera moves outside during walkthrough mode, no wall faces are visible from outside. This section adds separate exterior-facing meshes using `THREE.BackSide` — this is preferred over `DoubleSide` because `DoubleSide` causes z-fighting on the thin 0.1m walls.

The existing steel textures are already in `public/textures/steel/` (color, normal, roughness, metalness). Reuse them for the roof and exterior walls.

## Files to Create

### `src/components/three/environment/HallRoof.tsx`

A pitched roof matching the BORGA hall geometry. The roof has:
- Two inclined plane meshes meeting at the ridge (along Z-axis, the 20m dimension)
- Two triangular gable end meshes (north and south ends)
- Optional 0.2m eave overhang beyond the walls
- Material: reuses steel texture with a slightly darker tint (`#909090` vs walls `#B0B0B0`)
- Mount point: `ThreeDOnlyContent.tsx`

Key geometry values:
- Ridge runs along Z-axis at `x = width/2` (5.0m), `y = firstHeight` (4.9m)
- West eave: `x = 0`, `y = wallHeight` (4.3m) — with optional overhang at `x = -0.2`
- East eave: `x = width` (10.0m), `y = wallHeight` (4.3m) — with optional overhang at `x = 10.2`
- Slopes span full hall length `z ∈ [0, length]` (20m)

For the gable triangles (north at `z=0`, south at `z=length`):
- West corner: `(0, wallHeight, z)` (or `-0.2` if overhang)
- East corner: `(width, wallHeight, z)` (or `10.2` if overhang)
- Ridge point: `(width/2, firstHeight, z)`

Geometry approach: Use `THREE.BufferGeometry` built manually for the triangular gables (three vertices). For the two slope planes, `PlaneGeometry` rotated to match the slope angle works cleanly.

Slope angle (west slope, tilted inward toward ridge):
- Rise: `firstHeight - wallHeight` = 0.6m
- Run: `width / 2` = 5.0m
- Angle from horizontal: `Math.atan2(0.6, 5.0)` ≈ 6.84° ≈ matches the 7° pitch

GPU tier gating: low → flat material (`meshBasicMaterial`); mid/high → textured material (reuse steel textures). Wrap in `<Suspense fallback={<FlatHallRoof />}>` pattern matching `HallWalls.tsx`.

```tsx
// src/components/three/environment/HallRoof.tsx

// Pure helper exported for tests
export function getRoofGeometryParams(hall: {
  width: number;
  length: number;
  wallHeight: number;
  firstHeight: number;
}): {
  ridgeX: number;
  ridgeY: number;
  eaveY: number;
  slopeAngle: number;
  slopeHalfWidth: number;
  slopeLength: number;
} { /* ... */ }

export function HallRoof() { /* ... */ }
```

### `src/components/three/environment/HallFoundation.tsx`

A dark concrete strip around the hall perimeter at ground level. Four box geometries, one per wall side.

Dimensions:
- Width (perpendicular to wall): 0.3m
- Height: 0.15m
- Y position: `-0.075` (half below ground, half above — sits at grade)

Placement for each side:
- North (z=0): centered at `(width/2, -0.075, 0)`, size `(width + 0.6, 0.15, 0.3)` — the +0.6 overlap wraps corners
- South (z=length): centered at `(width/2, -0.075, length)`, same size
- West (x=0): centered at `(0, -0.075, length/2)`, size `(0.3, 0.15, length)`
- East (x=width): centered at `(width, -0.075, length/2)`, same size

Material: `meshStandardMaterial`, color `#444444`, roughness 0.95, metalness 0. No textures (low detail element).

```tsx
// src/components/three/environment/HallFoundation.tsx

export function getFoundationStrips(hall: {
  width: number;
  length: number;
}): Array<{ position: [number, number, number]; size: [number, number, number] }> { /* ... */ }

export function HallFoundation() { /* ... */ }
```

### `src/components/three/environment/HallWallsExterior.tsx`

Exterior-facing copies of the 4 hall wall meshes. Use `THREE.BackSide` on the material so faces that point outward are rendered when camera is outside the hall.

- Same box geometry dimensions as the interior walls in `HallWalls.tsx`
- Same position as interior walls
- Material: steel texture (reuse same texture paths) with `side: THREE.BackSide`
- Slightly darker roughness than interior (0.7 vs 0.6) to suggest weathering

GPU tier gating: low → flat `BackSide` material; mid/high → textured `BackSide` material (same Suspense pattern as `HallWalls.tsx`).

```tsx
// src/components/three/environment/HallWallsExterior.tsx

/** Returns true if exterior wall meshes should use textures */
export function shouldLoadExteriorTextures(gpuTier: GpuTier): boolean { /* ... */ }

export function HallWallsExterior() { /* ... */ }
```

## Files to Modify

### `src/components/three/ThreeDOnlyContent.tsx`

Mount all three new environment components. Gate each by:
1. Environment layer visible: `useStore((s) => s.ui.layers.environment?.visible ?? true)`
2. Not in 2D viewport (they should only render in 3D views — ThreeDOnlyContent already handles this since it's only mounted inside the 3D View)

Add imports and mount site:

```tsx
// In ThreeDOnlyContent.tsx
import { HallFoundation } from "./environment/HallFoundation";
import { HallRoof } from "./environment/HallRoof";
import { HallWallsExterior } from "./environment/HallWallsExterior";

// Inside ThreeDOnlyContent:
const envLayerVisible = useStore((s) => s.ui.layers.environment?.visible ?? true);

// Inside the JSX return:
{envLayerVisible && (
  <>
    <HallRoof />
    <HallFoundation />
    <HallWallsExterior />
  </>
)}
```

Note: If section-05 (ground plane + environment layer type) has not merged yet, the `layers.environment` key will not exist in the store yet. The `?? true` fallback handles this gracefully — environment components remain visible by default until the layer system is wired up.

## Tests

**Test file**: `tests/components/three/hallExterior.test.ts` (new file)

This test file covers pure geometry computation functions exported from the three new components. No R3F component rendering — only pure function unit tests (project pattern).

```ts
// tests/components/three/hallExterior.test.ts

import { describe, expect, it } from "vitest";
import { HALL } from "../../../src/constants/hall";
import { getFoundationStrips } from "../../../src/components/three/environment/HallFoundation";
import { getRoofGeometryParams } from "../../../src/components/three/environment/HallRoof";
import { shouldLoadExteriorTextures } from "../../../src/components/three/environment/HallWallsExterior";

describe("getRoofGeometryParams", () => {
  it("ridge height equals hall.firstHeight (4.9m)", () => {
    const params = getRoofGeometryParams(HALL);
    expect(params.ridgeY).toBe(HALL.firstHeight); // 4.9
  });

  it("ridge X is at hall centerline (width / 2)", () => {
    const params = getRoofGeometryParams(HALL);
    expect(params.ridgeX).toBe(HALL.width / 2); // 5.0
  });

  it("eave Y equals wall height (4.3m)", () => {
    const params = getRoofGeometryParams(HALL);
    expect(params.eaveY).toBe(HALL.wallHeight); // 4.3
  });

  it("slope half-width is hall.width / 2 (5.0m)", () => {
    const params = getRoofGeometryParams(HALL);
    expect(params.slopeHalfWidth).toBe(HALL.width / 2);
  });

  it("slope length equals hall.length (20.0m)", () => {
    const params = getRoofGeometryParams(HALL);
    expect(params.slopeLength).toBe(HALL.length);
  });

  it("slope angle is approximately 6.84 degrees (atan2(0.6, 5.0))", () => {
    const params = getRoofGeometryParams(HALL);
    const expectedAngle = Math.atan2(
      HALL.firstHeight - HALL.wallHeight,
      HALL.width / 2
    );
    expect(params.slopeAngle).toBeCloseTo(expectedAngle, 5);
  });
});

describe("getFoundationStrips", () => {
  it("returns 4 strips (one per wall side)", () => {
    const strips = getFoundationStrips(HALL);
    expect(strips).toHaveLength(4);
  });

  it("all strips have height 0.15m", () => {
    const strips = getFoundationStrips(HALL);
    for (const strip of strips) {
      expect(strip.size[1]).toBe(0.15);
    }
  });

  it("all strips have Y position -0.075 (half above, half below ground)", () => {
    const strips = getFoundationStrips(HALL);
    for (const strip of strips) {
      expect(strip.position[1]).toBe(-0.075);
    }
  });

  it("long wall strips (east/west) have 0.3m perpendicular width", () => {
    const strips = getFoundationStrips(HALL);
    // West strip: position x=0, size[0]=0.3
    const westStrip = strips.find((s) => s.position[0] === 0);
    expect(westStrip?.size[0]).toBe(0.3);
  });

  it("long wall strips span hall.length in Z", () => {
    const strips = getFoundationStrips(HALL);
    const westStrip = strips.find((s) => s.position[0] === 0);
    expect(westStrip?.size[2]).toBe(HALL.length);
  });

  it("short wall strips span hall.width + corner overlap in X", () => {
    const strips = getFoundationStrips(HALL);
    // North/south strips have z position 0 or HALL.length
    const northStrip = strips.find((s) => s.position[2] === 0);
    expect(northStrip?.size[0]).toBe(HALL.width + 0.6);
  });
});

describe("shouldLoadExteriorTextures", () => {
  it("returns false for low GPU tier", () => {
    expect(shouldLoadExteriorTextures("low")).toBe(false);
  });

  it("returns true for mid GPU tier", () => {
    expect(shouldLoadExteriorTextures("mid")).toBe(true);
  });

  it("returns true for high GPU tier", () => {
    expect(shouldLoadExteriorTextures("high")).toBe(true);
  });
});
```

Additionally, add a test to `tests/components/three/hallEnvironment.test.ts` (existing file) asserting that `BackSide` is the correct value to use for exterior meshes (import `THREE.BackSide` and verify it equals the expected enum value — this is a compile-time sanity check that the import path is correct):

```ts
// Append to tests/components/three/hallEnvironment.test.ts
import * as THREE from "three";

describe("Exterior wall material side", () => {
  it("THREE.BackSide has expected numeric value (1)", () => {
    // Sanity check: exterior walls must use BackSide (not FrontSide or DoubleSide)
    expect(THREE.BackSide).toBe(1);
    expect(THREE.FrontSide).toBe(0);
    expect(THREE.DoubleSide).toBe(2);
  });
});
```

## Implementation Notes

### Roof geometry approach

There are two sub-components to the roof visually:

1. **Two slope planes** — Use `PlaneGeometry` for each slope. Each plane is `slopeHalfWidth * something_wider_for_the_hypotenuse × length`. Rotate around the Z-axis by `±slopeAngle` and position at the midpoint of each slope. The slope hypotenuse length (width of the plane) is `Math.sqrt(slopeHalfWidth^2 + rise^2)`.

2. **Two gable triangles** (north and south ends) — Use `THREE.BufferGeometry` with 3 vertices. The triangle for the north gable (at z=0):
   - Vertex A: `(0, wallHeight, 0)` (west eave corner)
   - Vertex B: `(width, wallHeight, 0)` (east eave corner)
   - Vertex C: `(width/2, firstHeight, 0)` (ridge point)

   ```ts
   const gableGeo = new THREE.BufferGeometry();
   const vertices = new Float32Array([
     0,           wallHeight,  0,  // west eave
     width,       wallHeight,  0,  // east eave
     width / 2,   firstHeight, 0,  // ridge
   ]);
   gableGeo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
   gableGeo.computeVertexNormals();
   ```

   Repeat with `z = length` for the south gable.

### BackSide walls: avoiding DoubleSide

The reason for `BackSide` meshes rather than setting `DoubleSide` on the existing interior walls:
- With `DoubleSide`, both interior and exterior faces are rendered for the same 0.1m-thick wall. Since the faces are essentially coplanar (separated by only 0.1m), z-fighting occurs at any distance.
- With separate `BackSide` meshes at the same position, Three.js renders exterior faces of the exterior mesh and interior faces of the interior mesh. No z-fighting because they are genuinely separate draw calls with different render order.
- The exterior mesh is an exact duplicate of the interior mesh geometry. Same position, same size, different material (`side: THREE.BackSide`).

### Layer gating pattern

Both this section and section-05 add components gated by the environment layer. The access pattern:

```tsx
const envLayerVisible = useStore((s) => s.ui.layers.environment?.visible ?? true);
```

The optional chaining `?.` with `?? true` fallback is important:
- Before section-05 merges: `layers.environment` is `undefined`, so `envLayerVisible` defaults to `true` (always show).
- After section-05 merges: `layers.environment` is `{ visible: true, opacity: 1, locked: false }` initially, user can toggle it.

### Component placement

All three components live in a new `src/components/three/environment/` subdirectory. Create this directory. The existing `ThreeDOnlyContent.tsx` already lives at `src/components/three/ThreeDOnlyContent.tsx` and is the mount point.

Do NOT add environment components to the 2D viewport path — `ThreeDOnlyContent.tsx` is only mounted inside the 3D View, so the gating is already implicit.

### Texture asset note

Roof and exterior wall textures reuse the existing steel texture set already in `public/textures/steel/`. No new texture downloads are needed for this section. (New textures — asphalt — are section-05's responsibility.)

## Acceptance Criteria

- `tests/components/three/hallExterior.test.ts` passes (all roof geometry, foundation, and gating tests)
- Existing `tests/components/three/hallEnvironment.test.ts` still passes (no regression)
- `npx tsc --noEmit` shows no type errors after changes to `ThreeDOnlyContent.tsx` and the new environment components
- In 3D viewport with environment layer enabled: roof is visible above hall walls when camera is elevated/exterior; foundation strip visible at base of walls; exterior wall faces visible from outside
- Toggle environment layer off in Layer Panel: roof, foundation, and exterior walls disappear simultaneously