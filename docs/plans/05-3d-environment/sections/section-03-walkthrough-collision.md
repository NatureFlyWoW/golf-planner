Now I have all the context I need to write the section content for `section-03-walkthrough-collision`.

# Section 03: Walkthrough Collision Detection

## Overview

This section implements the physics boundary system that prevents the first-person camera from walking through hall walls and placed golf holes. It depends on Section 01 (Walkthrough State & Store Integration) being complete, and runs in parallel with Section 02 (Walkthrough Camera Controller). The collision results are consumed by Section 02's movement system.

**Depends on**: section-01-walkthrough-state (store with `walkthroughMode`)
**Blocks**: section-04-walkthrough-ui

---

## Background

The walkthrough camera moves freely in the XZ plane at eye level (Y=1.7m). Without collision, the camera passes through the 0.1m-thick steel hall walls and through any placed golf holes. This section adds two layers of protection:

1. **Wall collision** — AABB boundary clamping keeps the camera inside the hall, with exceptions for doorways so the player can walk outside through them.
2. **Hole collision** — OBB-based detection per placed hole using the existing SAT collision system already in `src/utils/collision.ts`, extended with a push-out resolution step.

The combined resolution runs wall clamping first, then hole push-out. This ordering prevents a hole near a wall from ejecting the camera through the wall.

---

## Hall Geometry Reference

From `src/constants/hall.ts` (BORGA HALL constant):

- `width`: 10.0m (X-axis, east-west)
- `length`: 20.0m (Z-axis, north-south, with Z=0 at north wall and Z=20 at south wall)
- South wall (`z = hall.length`): contains both doors
  - `door-sectional`: `offset=3.25`, `width=3.5` → passable zone x ∈ [1.5, 5.0]
  - `door-pvc`: `offset=8.1`, `width=0.9` → passable zone x ∈ [7.65, 8.55]
- Camera effective radius: **0.4m** (minimum clearance from wall interior face)
- The `margin` value used in clamping equals the camera radius (0.4m)

Three.js coordinate mapping: X = east direction, Z = south direction (Z=0 north wall, Z=20 south wall).

---

## Files to Create

### `src/utils/walkthroughCollision.ts`

New file. Contains all collision and spawn-point utilities. No imports from React or R3F — pure TypeScript functions over plain data types.

**Imports needed**:
- `Hall`, `DoorSpec` from `../types` (via `src/types/hall.ts`)
- `Hole` from `../types` (via `src/types/hole.ts`)
- `HoleTypeDefinition` from `../types`
- `checkOBBCollision`, `OBBInput` from `./collision`

**Types to define in this file**:

```typescript
export type DoorZone = {
  wall: "north" | "south" | "east" | "west";
  xMin: number;
  xMax: number;
};

export type Vec2D = { x: number; z: number };
```

**Functions to implement**:

```typescript
/** Camera collision radius in metres */
export const CAMERA_RADIUS = 0.4;

/** Eye level height in metres */
export const EYE_LEVEL = 1.7;

/**
 * Compute passable door zones from the hall's doors array.
 * Each zone describes an x-range on a given wall where the camera may pass through.
 *
 * For south/north walls: zone range is computed as (door.offset - door.width/2, door.offset + door.width/2).
 * For east/west walls: same formula but the "x" represents the z-axis offset along the wall.
 */
export function getDoorZones(hall: Hall): DoorZone[];

/**
 * Compute spawn point for walkthrough entry — near the PVC entrance door on the south wall.
 * Returns position just inside the south wall at the PVC door's x-offset.
 * Y = EYE_LEVEL (1.7m), z = hall.length - 1.0 (1m from south wall interior).
 */
export function getWalkthroughSpawnPoint(hall: Hall): { x: number; y: number; z: number };

/**
 * Check if a camera XZ position passes through a door zone on the south wall.
 * Returns true if the x-coordinate falls within any south-wall door zone.
 */
function isInDoorZone(x: number, doorZones: DoorZone[], wall: "north" | "south" | "east" | "west"): boolean;

/**
 * Apply AABB wall clamping to a desired camera XZ position.
 * Clamps x ∈ [CAMERA_RADIUS, hall.width - CAMERA_RADIUS]
 * Clamps z ∈ [CAMERA_RADIUS, hall.length - CAMERA_RADIUS]
 *
 * Door exceptions:
 * - When camera x is within a south-wall door zone, allow z > hall.length - CAMERA_RADIUS.
 * - When camera is already outside the hall by more than CAMERA_RADIUS (z > hall.length + CAMERA_RADIUS
 *   or z < -CAMERA_RADIUS), apply no wall clamping — camera is on open ground.
 *
 * Returns collision-resolved XZ position.
 */
function clampToWalls(desired: Vec2D, hall: Hall, doorZones: DoorZone[]): Vec2D;

/**
 * Resolve collision between the camera and a single placed hole.
 * Camera is represented as a square OBB with side 2×CAMERA_RADIUS.
 * Returns resolved position: if overlapping, pushes camera along the shortest escape axis.
 */
function resolveHoleCollision(cameraPos: Vec2D, hole: OBBInput): Vec2D;

/**
 * Combined collision resolver for walkthrough camera.
 * Step 1: Apply wall clamping (with door zone exceptions).
 * Step 2: For each placed hole, resolve OBB overlap.
 *
 * @param currentPos - Current camera XZ position (before movement)
 * @param desiredPos - Desired camera XZ position (after applying movement delta)
 * @param holeOBBs   - Array of OBBInput for all placed holes
 * @param hall       - Hall constants (dimensions + doors)
 * @returns Collision-resolved XZ position
 */
export function checkWalkthroughCollision(
  currentPos: Vec2D,
  desiredPos: Vec2D,
  holeOBBs: OBBInput[],
  hall: Hall,
): Vec2D;
```

**Helper note for `resolveHoleCollision`**: When `checkOBBCollision(cameraOBB, holeOBB)` returns true, compute penetration depth along each of the 4 SAT axes and push camera along the axis with minimum penetration. This is the standard "minimum translation vector" (MTV) approach. The camera OBB has `rot: 0` (axis-aligned), so the two axes are simply X and Z.

**Note on `holeOBBs` parameter**: The caller (`WalkthroughController`) is responsible for converting placed `Hole` objects into `OBBInput[]` using the hole type dimensions from `HOLE_TYPE_MAP`. This conversion logic lives in the component, not in this utility. The utility only works with pre-computed OBBs for testability.

---

## Files to Modify

### `src/utils/walkthroughCollision.ts`

This is a new file — no modifications to existing files in this section.

---

## Test File to Create

### `tests/utils/walkthroughCollision.test.ts`

Test file location: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/walkthroughCollision.test.ts`

Use `describe` blocks to group related tests. Import from `../../src/utils/walkthroughCollision` and `../../src/constants/hall` (for the `HALL` constant).

**Test structure**:

```typescript
import { describe, expect, it } from "vitest";
import { HALL } from "../../src/constants/hall";
import {
  CAMERA_RADIUS,
  EYE_LEVEL,
  checkWalkthroughCollision,
  getDoorZones,
  getWalkthroughSpawnPoint,
} from "../../src/utils/walkthroughCollision";
```

### Door Zone Computation

```typescript
describe("getDoorZones", () => {
  it("returns zone for PVC door: x=[7.65, 8.55] on south wall", ...)
  it("returns zone for sectional door: x=[1.5, 5.0] on south wall", ...)
  it("both zones are on south wall", ...)
  it("zone xMin = door.offset - door.width/2", ...)
  it("zone xMax = door.offset + door.width/2", ...)
});
```

PVC door: offset=8.1, width=0.9 → xMin=8.1-0.45=7.65, xMax=8.1+0.45=8.55
Sectional door: offset=3.25, width=3.5 → xMin=3.25-1.75=1.5, xMax=3.25+1.75=5.0

### Spawn Point

```typescript
describe("getWalkthroughSpawnPoint", () => {
  it("returns y = EYE_LEVEL (1.7m)", ...)
  it("x is near PVC door offset (8.1)", ...)
  it("z is inside hall (z < hall.length)", ...)
  it("z is near south wall (z > hall.length - 2)", ...)
});
```

### Wall Clamping

```typescript
describe("wall collision clamping", () => {
  // Use single hole array: [] (no holes for wall tests)
  it("position inside hall (5, 10) returns unchanged", ...)
  it("position at north wall edge clamps z to CAMERA_RADIUS", ...)
  it("position at south wall edge clamps z to hall.length - CAMERA_RADIUS", ...)
  it("position at west wall edge clamps x to CAMERA_RADIUS", ...)
  it("position at east wall edge clamps x to hall.width - CAMERA_RADIUS", ...)
  it("position through PVC door zone (x=8.1, z=20.5) is NOT z-clamped", ...)
  it("position outside hall not in door zone (x=5.5, z=20.5) IS z-clamped", ...)
  it("position far outside hall through PVC door (x=8.1, z=25) is unconstrained", ...)
  it("corner position clamps both x and z axes", ...)
});
```

### Hole Collision

```typescript
describe("hole collision detection and resolution", () => {
  // Create a test hole OBB: { pos: {x:5, z:10}, rot:0, w:1.0, l:2.0 }
  it("camera position not overlapping any hole returns unchanged", ...)
  it("camera position overlapping a hole pushes out along shortest axis", ...)
  it("camera near hole edge but not overlapping returns unchanged", ...)
  it("rotated hole (45°) collision works correctly", ...)
  it("multiple holes — only colliding hole causes push-out", ...)
});
```

### Combined Resolver

```typescript
describe("checkWalkthroughCollision combined", () => {
  it("applies wall clamping when no holes present", ...)
  it("applies hole push-out when inside hall", ...)
  it("wall clamping runs before hole push-out", ...)
  it("camera at hall corner (near two walls) is clamped on both axes", ...)
  it("position through door zone with adjacent hole: door allowed, hole still collides", ...)
});
```

---

## Implementation Notes

### Minimum Translation Vector for Hole Push-Out

Since the camera OBB always has `rot: 0`, only two axes need checking for the camera's own axes (X and Z). The hole's axes depend on `hole.rot`. For an axis-aligned camera box, the shortest push-out vector is almost always along an axis-aligned direction.

Approach:
1. Check overlap using `checkOBBCollision(cameraOBB, holeOBB)` — early return unchanged position if false
2. Compute penetration depths along X and Z by comparing the AABB overlap extents
3. Push camera along the axis with smaller penetration (minimum translation)

For a fully general implementation (handling rotated holes), compute penetration along all 4 SAT axes (2 from camera, 2 from hole), pick minimum. This is more robust for rotated holes but adds complexity. The simplified axis-aligned approach is acceptable since the camera box is always axis-aligned.

### Door Exception Logic

The door exception is intentionally conservative — it only allows passage through the south wall when the camera's X coordinate falls within a door zone. This means:

- Camera can exit through the PVC door (x ≈ 7.65–8.55)
- Camera can exit through the sectional door (x ≈ 1.5–5.0)
- Camera cannot slip through the wall at any other x position
- Once outside (z > hall.length + CAMERA_RADIUS), no wall collision applies — camera roams freely on the ground plane

The `isInDoorZone` helper is internal (unexported) because it's only used by `clampToWalls`.

### Camera OBB Dimensions

When checking hole collision, the camera OBB is:
```typescript
const cameraOBB: OBBInput = {
  pos: { x: desired.x, z: desired.z },
  rot: 0,
  w: CAMERA_RADIUS * 2, // 0.8m
  l: CAMERA_RADIUS * 2, // 0.8m
};
```

This gives the player a 0.4m clearance radius from hole geometry in all directions.

### OBBInput Format

The existing `OBBInput` type from `src/utils/collision.ts`:

```typescript
export type OBBInput = {
  pos: { x: number; z: number };
  rot: number;   // degrees (not radians)
  w: number;     // full width
  l: number;     // full length
};
```

All rotation values in `OBBInput` are **degrees**, consistent with the existing `checkOBBCollision` implementation.

---

## Verification Checklist

After implementation, confirm:

- [ ] `getDoorZones(HALL)` returns exactly 2 zones matching PVC and sectional door specs
- [ ] `getWalkthroughSpawnPoint(HALL)` returns `{ x: 8.1, y: 1.7, z: ~19.0 }`
- [ ] Camera at (5, 10) with no holes: `checkWalkthroughCollision` returns `{x:5, z:10}` unchanged
- [ ] Camera at (0.1, 10): returns `{x:0.4, z:10}` (clamped to CAMERA_RADIUS)
- [ ] Camera at (8.1, 20.5): NOT clamped (PVC door zone)
- [ ] Camera at (5.0, 20.5): clamped to `{x:5.0, z:19.6}` (no door at x=5.0)
- [ ] All test cases in `tests/utils/walkthroughCollision.test.ts` pass via `npm run test`
- [ ] `npx tsc --noEmit` passes with no errors