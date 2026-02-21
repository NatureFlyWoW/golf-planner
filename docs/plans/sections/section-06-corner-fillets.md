Good. The collision system uses the hole's `w` (width) and `l` (length) dimensions from the store, not from the 3D geometry itself. So adding visual fillet meshes will not affect collision at all.

Now I have all the information needed to write the section. Let me compose it.

# Section 06: Dogleg + L-Shape Corner Fillets

## Overview

This section adds decorative fillet meshes at the angular transition points on the Dogleg and L-Shape hole types. Currently, these holes have sharp right-angle or offset-angle joints between lane segments that look visually harsh. Small curved patch geometries (quarter-cylinder fillets) are placed at these corners to create smooth visual transitions while preserving all existing collision and placement behavior.

**Simplified approach:** A full curve rework of the lane geometry was considered and rejected as overengineered. It would conflict with the AABB collision system. Instead, this section adds fillet overlays -- small curved meshes that sit at corners purely for visual smoothness. The underlying straight bumper geometry and felt surfaces remain unchanged.

## Dependencies

- **Section 01 (Straight Hole Glow-Up):** Provides the `bumperProfile.ts` utility, `useTexturedMaterials()` hook, and the `TexturedHole`/`FlatHole` rendering pattern.
- **Section 02 (Shared Geometry Library):** Provides the `<BumperRail>`, `<Cup>`, and `<TeePad>` shared sub-components. By the time this section executes, `HoleDogleg.tsx` and `HoleLShape.tsx` will already have been refactored to use these shared components instead of inline `boxGeometry` meshes.

This section modifies `HoleDogleg.tsx` and `HoleLShape.tsx` only. No overlap with any other parallel sections (03, 04, 05, 07, 08).

## Key Constraint: Collision System is Unaffected

The collision detection system (`/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/collision.ts`) uses OBB (oriented bounding box) checks based on the hole's `w` (width) and `l` (length) properties stored in Zustand. It does not inspect the 3D mesh geometry at all. Therefore, adding visual fillet meshes has zero effect on collision bounds. The hole's footprint dimensions (`width` x `length`) remain exactly the same.

## Files to Create or Modify

| File | Action |
|------|--------|
| `tests/components/holes/cornerFillets.test.ts` | **Create** -- tests for fillet geometry |
| `src/utils/filletGeometry.ts` | **Create** -- fillet mesh geometry factory functions |
| `src/components/three/holes/CornerFillet.tsx` | **Create** -- reusable fillet R3F component |
| `src/components/three/holes/HoleDogleg.tsx` | **Modify** -- add fillets at bend transitions |
| `src/components/three/holes/HoleLShape.tsx` | **Modify** -- add fillet at right-angle junction |

All paths are relative to `/mnt/c/Users/Caus/Golf_Plan/golf-planner/`.

## Current Geometry Layout (Context for Implementer)

### HoleDogleg Layout

The Dogleg hole has three lane segments offset in X, connected by thin transition felt patches:

- **Entry segment** (offset right at `+OFFSET` in X, bottom third of Z)
- **Middle segment** (centered at X=0, middle third of Z)
- **Exit segment** (offset left at `-OFFSET` in X, top third of Z)
- **Transition patches** at `zBend1` and `zBend2` (thin slabs bridging the X offset)

Key constants:
- `LANE_WIDTH = 0.6`
- `OFFSET = 0.15` (X shift between adjacent segments)
- `BUMPER_THICKNESS = 0.05`
- `BUMPER_HEIGHT = 0.08`
- `SURFACE_THICKNESS = 0.02`

The two bend locations are at Z coordinates `zBend1` (entry-to-middle) and `zBend2` (middle-to-exit). There are existing inner guide bumpers at these bends. The fillets go in the inner corners where the lane direction shifts.

### HoleLShape Layout

The L-Shape hole has two perpendicular lanes forming an L:

- **Entry lane** runs vertically along the right side (full bounding-box height in Z)
- **Exit lane** runs horizontally along the top (in +Z direction, left portion only)
- The **inner corner** is at coordinate `(innerEdgeX, innerEdgeZ)` where:
  - `innerEdgeX = halfW - LANE_WIDTH` (left edge of entry lane)
  - `innerEdgeZ = halfL - LANE_WIDTH` (bottom edge of exit lane)

Key constants:
- `LANE_WIDTH = 0.5`
- Inner corner bumpers meet at a right angle at `(innerEdgeX, innerEdgeZ)`

The fillet goes at this inner corner junction where the two inner bumper walls meet at 90 degrees.

## Tests (Write First)

Create test file at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/holes/cornerFillets.test.ts`.

```
File: tests/components/holes/cornerFillets.test.ts

Tests to implement:

1. "createCornerFilletGeometry returns a BufferGeometry"
   - Call createCornerFilletGeometry with a radius and height
   - Assert the return value is an instance of THREE.BufferGeometry
   - Assert it has a position attribute with vertices > 0

2. "corner fillet geometry has correct radius"
   - Create fillet with radius = 0.15
   - Get the position attribute, iterate vertices
   - Assert all XZ vertex positions lie within the specified radius (plus small epsilon)

3. "corner fillet geometry has correct height"
   - Create fillet with height = BUMPER_HEIGHT (0.08)
   - Check Y range of vertices spans from 0 to approximately the given height

4. "fillet material matches felt surface material"
   - The fillet uses the same felt material from useMaterials()
   - This is a behavioral assertion: the CornerFillet component receives its material via props
     and should accept and apply the felt material

5. "Dogleg fillet positions are at bend coordinates"
   - Given a Dogleg with known width and length, compute expected zBend1 and zBend2
   - Assert that the fillet meshes are positioned at the correct X/Z coordinates
     corresponding to the inner corners of the bends

6. "L-Shape fillet position is at inner corner"
   - Given an L-Shape with known width and length, compute expected innerEdgeX and innerEdgeZ
   - Assert the fillet mesh is positioned at (innerEdgeX, innerEdgeZ)

7. "hole footprint (width x length) unchanged after fillet addition"
   - The fillet geometry is contained within the existing bounding box
   - Assert that fillet vertices do not extend beyond the hole's width/2 or length/2 bounds

8. "collision AABB not affected by fillet geometry"
   - Verify that the collision system uses hole.w and hole.l from the store
   - Adding fillet meshes to the R3F group does not change these store values
   - This can be tested by checking that collides() returns the same result
     for identical hole positions regardless of whether fillets are present
```

Each test should import THREE directly (real Three.js, not mocked -- consistent with project patterns). The geometry factory function tests do not need an R3F canvas since they operate on raw Three.js objects.

## Implementation Details

### 1. Fillet Geometry Factory (`src/utils/filletGeometry.ts`)

Create a utility that generates quarter-cylinder geometry for corner fillets.

```typescript
// src/utils/filletGeometry.ts

/**
 * Creates a quarter-cylinder BufferGeometry for visually smoothing
 * a 90-degree corner joint between two lane segments.
 *
 * The geometry spans a 90-degree arc in the XZ plane, extruded up
 * to the given height in Y. It is positioned at the origin and
 * should be translated/rotated by the consuming component.
 *
 * @param radius - The fillet radius (typically LANE_WIDTH/2 or OFFSET)
 * @param height - The height of the fillet (typically SURFACE_THICKNESS)
 * @param segments - Number of arc segments for smoothness (default 8)
 * @returns THREE.BufferGeometry
 */
export function createCornerFilletGeometry(
  radius: number,
  height: number,
  segments?: number,
): THREE.BufferGeometry
```

Implementation approach:
- Use `THREE.CylinderGeometry` with `thetaStart` and `thetaLength` parameters to create a quarter-cylinder wedge (90-degree arc, `thetaLength = Math.PI / 2`)
- The cylinder's axis is Y (vertical), with `radiusTop = radiusBottom = radius` and `height = height`
- `radialSegments = segments` (default 8) for smooth curvature
- The result is a quarter-pie shape when viewed from above
- Call `mergeVertices()` on the result for optimization
- The consuming component rotates the fillet to face the correct corner direction

Alternative approach (if CylinderGeometry quarter-arc proves tricky to orient):
- Build the geometry manually using `THREE.ExtrudeGeometry` with a quarter-circle `THREE.Shape` extruded to the given height
- The Shape traces: `moveTo(0, 0)`, `lineTo(radius, 0)`, `arc(...)` to sweep 90 degrees back, `lineTo(0, 0)`

Either approach works. The implementer should choose whichever produces cleaner, easier-to-position geometry. The key requirement is that the result is a smooth curved surface filling a 90-degree corner.

### 2. Reusable Fillet Component (`src/components/three/holes/CornerFillet.tsx`)

```typescript
// src/components/three/holes/CornerFillet.tsx

/**
 * A decorative quarter-cylinder mesh that visually smooths a corner
 * joint between two lane segments. Purely cosmetic -- does not affect
 * collision bounds.
 *
 * Props:
 *   position: [x, y, z] -- world-space position of the corner point
 *   rotation: [rx, ry, rz] -- Euler rotation to orient the fillet into the correct quadrant
 *   radius: number -- fillet arc radius
 *   height: number -- extrusion height (typically SURFACE_THICKNESS)
 *   material: THREE.MeshStandardMaterial -- should be the felt material for visual continuity
 */
export function CornerFillet(props: CornerFilletProps): JSX.Element
```

Implementation notes:
- Create the geometry in a `useMemo` and dispose it in a `useEffect` cleanup (same pattern as all other geometry in the project)
- Render a single `<mesh>` with the generated geometry and the provided material
- No `castShadow` needed (fillets are flush with the felt surface, not bumper-height elements)

### 3. HoleDogleg Modifications (`src/components/three/holes/HoleDogleg.tsx`)

After Section 02 has refactored HoleDogleg to use shared `<BumperRail>`, `<Cup>`, and `<TeePad>` components, this section adds `<CornerFillet>` meshes at the two bend locations.

**Bend 1 (entry-to-middle, at zBend1):**
- The entry lane is at `X = +OFFSET`, the middle lane is at `X = 0`
- The inner corner of the bend is where the entry lane's left edge meets the middle lane's right edge
- Fillet position: approximately `[OFFSET/2, SURFACE_THICKNESS/2, zBend1]`
- Fillet radius: `OFFSET` (0.15m -- the lateral distance being bridged)
- Rotation: orient so the curved surface faces into the inner corner quadrant

**Bend 2 (middle-to-exit, at zBend2):**
- The middle lane is at `X = 0`, the exit lane is at `X = -OFFSET`
- Mirror of bend 1
- Fillet position: approximately `[-OFFSET/2, SURFACE_THICKNESS/2, zBend2]`
- Fillet radius: `OFFSET` (same)
- Rotation: mirror rotation from bend 1

The fillets use the `felt` material from `useMaterials()` so they blend seamlessly with the playing surface.

The existing transition felt patches (thin `boxGeometry` slabs at bends) remain in place. The fillets supplement them by smoothing the visual corners where straight bumper walls meet.

### 4. HoleLShape Modifications (`src/components/three/holes/HoleLShape.tsx`)

After Section 02 refactoring, add a single `<CornerFillet>` at the inner corner junction.

**Inner corner fillet:**
- Position: `[innerEdgeX, SURFACE_THICKNESS/2, innerEdgeZ]` where `innerEdgeX = halfW - LANE_WIDTH` and `innerEdgeZ = halfL - LANE_WIDTH`
- Radius: approximately `LANE_WIDTH * 0.3` to `LANE_WIDTH * 0.5` (0.15m to 0.25m) -- should look natural without protruding beyond the lane boundaries
- Rotation: orient so the curved face points into the void quadrant (lower-left when looking top-down), smoothing the sharp inner corner where the two inner bumper walls meet at 90 degrees
- Material: `felt` from `useMaterials()`

The fillet visually softens what is currently a hard right-angle joint between the "inner right of entry lane" bumper and the "inner bottom of exit lane" bumper.

### 5. Geometry Disposal

Both `HoleDogleg.tsx` and `HoleLShape.tsx` already have material disposal via `useMaterials()`. The `CornerFillet` component handles its own geometry disposal via `useEffect` cleanup, following the same pattern used throughout the codebase.

### 6. UV Mode Compatibility

The fillet meshes receive their material via props (the `felt` material). In UV mode, `useMaterials()` returns the UV emissive materials. The fillets will automatically glow with the same neon green as the rest of the felt surface. No special UV handling is needed in this section.

## Implementation Checklist

1. Write all tests in `tests/components/holes/cornerFillets.test.ts` (tests should fail initially)
2. Create `src/utils/filletGeometry.ts` with `createCornerFilletGeometry()` function
3. Create `src/components/three/holes/CornerFillet.tsx` reusable component
4. Modify `src/components/three/holes/HoleDogleg.tsx` to add two `<CornerFillet>` meshes at bend points
5. Modify `src/components/three/holes/HoleLShape.tsx` to add one `<CornerFillet>` mesh at inner corner
6. Run `npx tsc --noEmit` to verify type safety
7. Run `npm test` to verify all tests pass
8. Visually verify in the browser that fillets look correct and blend with felt surfaces

## Notes for Implementer

- The exact fillet radius values may need visual tuning. Start with the suggested values and adjust if they look too large or too small relative to the lane width.
- The rotation of the fillet geometry depends on which approach is used (CylinderGeometry vs ExtrudeGeometry). The key is that the curved face points into the corner being softened.
- If Section 02 has not yet been completed when this section starts, the modifications to HoleDogleg and HoleLShape should be written against the post-Section-02 code structure (using shared components). The fillet additions are additive -- they insert new `<CornerFillet>` JSX elements into the existing `<group>` without changing any existing children.
- The fillet height should match `SURFACE_THICKNESS` (0.02m) since it is a playing-surface-level element, not a bumper-height element. It fills the corner at felt level.