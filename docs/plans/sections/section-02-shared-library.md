These files do not exist yet -- they are created in Section 1. Good, this confirms the dependency. Now I have everything needed to write the section content.

# Section 02: Shared Geometry Library + All Legacy Types

## Overview

This section extracts reusable sub-components (`<BumperRail>`, `<Cup>`, `<TeePad>`) from the upgraded straight hole built in Section 1 and refactors all 7 legacy hole types to use them. Only the **shared elements** (bumpers, felt surface, cup, tee) are upgraded. Obstacle-specific geometry (windmill tower/blades, tunnel arch, loop torus, ramp slope) remains unchanged and will be overhauled in later sections (3-6).

After this section, every legacy hole type renders with rounded bumper profiles, textured felt, recessed cups with flag pins, and rubber tee pads -- consistent visual quality across the board.

## Dependencies

- **Section 01 (Straight Hole Glow-Up) MUST be complete.** It provides:
  - `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/bumperProfile.ts` -- `createBumperProfile()` and `createBumperGeometry()` functions
  - `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/holeGeometry.ts` -- `createCupGeometry()`, `createTeeGeometry()`, flag pin helpers
  - `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/useTexturedMaterials.ts` -- texture-based material hook
  - The `<TexturedHole>` / `<FlatHole>` rendering pattern in `HoleModel.tsx`
  - CC0 texture assets in `public/textures/` (felt, wood, rubber)

## Files to Create

| File | Purpose |
|------|---------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/BumperRail.tsx` | Reusable bumper rail R3F component |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/Cup.tsx` | Reusable recessed cup + flag pin R3F component |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/TeePad.tsx` | Reusable rubber tee pad R3F component |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/holes/sharedComponents.test.ts` | Tests for shared sub-components |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/holes/legacyTypes.test.ts` | Tests verifying all 7 legacy types use shared components |

## Files to Modify

| File | Changes |
|------|---------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleStraight.tsx` | Refactor to use `<BumperRail>`, `<Cup>`, `<TeePad>` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleLShape.tsx` | Replace 6 BoxGeometry bumpers with `<BumperRail>`, add `<Cup>`, `<TeePad>` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleDogleg.tsx` | Replace outer + guide bumpers with `<BumperRail>`, add `<Cup>`, `<TeePad>` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleRamp.tsx` | Replace 4 bumpers with `<BumperRail>` (side bumpers use taller `SIDE_BUMPER_HEIGHT`), add `<Cup>`, `<TeePad>` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleLoop.tsx` | Replace 4 bumpers with `<BumperRail>` (LANE_WIDTH=0.5), add `<Cup>`, `<TeePad>` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleTunnel.tsx` | Replace entry/exit zone bumpers with `<BumperRail>`, add `<Cup>`, `<TeePad>` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleWindmill.tsx` | Replace 4 bumpers with `<BumperRail>`, add `<Cup>`, `<TeePad>` |

## Existing Code Context

### Current Shared Constants (from `shared.ts`)

All hole types import from `shared.ts`:

```ts
export const BUMPER_HEIGHT = 0.08;
export const BUMPER_THICKNESS = 0.05;
export const SURFACE_THICKNESS = 0.02;
export const TEE_RADIUS = 0.03;
export const CUP_RADIUS = 0.054;
```

### Current Material System (from `useMaterials.ts`)

The `useMaterials()` hook returns a `MaterialSet`:

```ts
export type MaterialSet = {
  felt: THREE.MeshStandardMaterial;
  bumper: THREE.MeshStandardMaterial;
  tee: THREE.MeshStandardMaterial;
  cup: THREE.MeshStandardMaterial;
};
```

It respects `uvMode` (returns neon emissive materials) and `materialProfile` (budget_diy / standard_diy / semi_pro PBR presets). All 7 legacy hole types already call `useMaterials()` and destructure `{ felt, bumper, tee, cup }`.

### Per-Type Lane Width Differences

Different hole types use different lane widths. The shared `<BumperRail>` must accept width/dimensions as props rather than hardcoding:

- **HoleStraight**: `laneW = width - BUMPER_THICKNESS * 2` (varies with hole width)
- **HoleLShape**: `LANE_WIDTH = 0.5` (hardcoded constant)
- **HoleDogleg**: `LANE_WIDTH = 0.6` (hardcoded constant)
- **HoleRamp**: `laneW = width - BUMPER_THICKNESS * 2` (varies)
- **HoleLoop**: `LANE_WIDTH = 0.5` (hardcoded)
- **HoleTunnel**: `laneW = width - bt * 2` (varies)
- **HoleWindmill**: `LANE_WIDTH = 0.5` (hardcoded)

### Current Bumper Patterns

Every hole type follows one of these bumper patterns:

1. **Side bumpers** -- run the full length of the hole along Z, positioned at +/-X edges
2. **End bumpers** -- short bumpers at -Z (tee end) and +Z (cup end), run along X
3. **Partial bumpers** -- only cover entry/exit zones (tunnel), or inner guide rails at bends (dogleg)
4. **Taller bumpers** -- ramp side bumpers use `SIDE_BUMPER_HEIGHT = BUMPER_HEIGHT + RAMP_HEIGHT`

All currently use `<boxGeometry>`. After Section 1, `createBumperGeometry()` from `bumperProfile.ts` provides `ExtrudeGeometry` with rounded rectangular cross-sections.

### Current Cup/Tee Patterns

Every hole type has:
- **Tee**: `<circleGeometry args={[TEE_RADIUS, 16]} />` at -Z end, rotated flat, positioned at `y = SURFACE_THICKNESS + 0.001`
- **Cup**: `<circleGeometry args={[CUP_RADIUS, 16]} />` at +Z end, rotated flat, same Y offset

After Section 1, the cup becomes a recessed `CylinderGeometry` with a flag pin, and the tee becomes a slightly raised `CylinderGeometry` with rubber texture.

## Tests -- Write FIRST

### Test File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/holes/sharedComponents.test.ts`

```ts
import { describe, expect, it } from "vitest";

// Tests validate geometry/material properties directly on THREE.js objects.
// No R3F canvas rendering -- consistent with project test patterns.

describe("BumperRail shared component", () => {
  // Test: BumperRail creates ExtrudeGeometry with rounded profile
  // Instantiate the geometry helper from bumperProfile.ts with given length,
  // verify the returned geometry is a BufferGeometry with vertices.

  // Test: BumperRail accepts variable length
  // Create rails of length 1.0 and 2.0, verify bounding box Z dimension differs.

  // Test: BumperRail accepts variable position and rotation
  // Verify component props interface includes position (Vector3 tuple) and
  // rotation (Euler tuple), and that the geometry is correctly offset.

  // Test: BumperRail height matches BUMPER_HEIGHT (0.08)
  // Compute bounding box of generated geometry, verify Y extent = BUMPER_HEIGHT.

  // Test: BumperRail thickness matches BUMPER_THICKNESS (0.05)
  // Compute bounding box of generated geometry, verify X extent = BUMPER_THICKNESS.

  // Test: BumperRail supports custom height (for ramp taller bumpers)
  // Pass height override, verify bounding box Y extent matches the override.

  // Test: geometry disposed on component unmount
  // Verify the useEffect cleanup pattern disposes ExtrudeGeometry.
});

describe("Cup shared component", () => {
  // Test: Cup component creates recessed cylinder geometry
  // Verify geometry is CylinderGeometry with correct radius = CUP_RADIUS (0.054).

  // Test: Cup has visible depth (height > 0)
  // The cylinder should have non-zero height for the recess effect.

  // Test: Cup includes flag pin mesh (thin cylinder + small flag)
  // Verify the flag pin sub-mesh exists with appropriate thin diameter.

  // Test: Cup renders at given position
  // Props include position tuple; verify it is applied to the group.
});

describe("TeePad shared component", () => {
  // Test: TeePad creates raised cylinder geometry
  // Verify geometry radius = TEE_RADIUS (0.03), height ~2-3mm.

  // Test: TeePad renders at given position
  // Props include position tuple; verify it is applied to the group.
});
```

### Test File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/holes/legacyTypes.test.ts`

```ts
import { describe, expect, it } from "vitest";

// These tests verify the refactored hole components use the shared
// sub-components. Since we cannot render R3F in jsdom, these tests
// validate at the geometry/utility level -- ensuring that:
// 1. The correct number of bumper geometries are created per type
// 2. Dimensions match the type's lane width
// 3. Cup/tee positions are correct

describe("HoleStraight refactoring", () => {
  // Test: uses 4 BumperRail instances (left, right, back, front)
  // Verify the component's structure includes 4 bumper rail configurations.

  // Test: includes Cup and TeePad sub-components
  // Verify cup at +Z end and tee at -Z end are present.
});

describe("HoleLShape refactoring", () => {
  // Test: uses 6 BumperRail instances for wall segments (LANE_WIDTH=0.5)
  // Right wall (full length), bottom wall, top wall, left wall,
  // inner bottom exit, inner right entry.

  // Test: includes Cup at exit lane and TeePad at entry lane
});

describe("HoleDogleg refactoring", () => {
  // Test: uses BumperRail for outer walls (LANE_WIDTH=0.6)
  // Left outer, right outer, back end, front end bumpers.

  // Test: guide bumpers at bends use BumperRail with reduced height
  // guideBumperH = BUMPER_HEIGHT * 0.6

  // Test: includes Cup and TeePad sub-components
});

describe("HoleRamp refactoring", () => {
  // Test: uses taller BumperRail variant for side rails
  // SIDE_BUMPER_HEIGHT = BUMPER_HEIGHT + RAMP_HEIGHT = 0.08 + 0.15 = 0.23

  // Test: end bumpers (back, front) use standard BUMPER_HEIGHT
  // Test: includes Cup and TeePad sub-components
  // Test: obstacle geometry (ramp slope, plateau) unchanged
});

describe("HoleLoop refactoring", () => {
  // Test: uses BumperRail for 4 walls (LANE_WIDTH=0.5)
  // Test: includes Cup and TeePad sub-components
  // Test: obstacle geometry (torus, pillars) unchanged
});

describe("HoleTunnel refactoring", () => {
  // Test: uses BumperRail for entry/exit zone side bumpers (4 partial rails)
  // Test: uses BumperRail for back and front end bumpers
  // Test: includes Cup and TeePad sub-components
  // Test: obstacle geometry (tunnel arch cylinder) unchanged
});

describe("HoleWindmill refactoring", () => {
  // Test: uses BumperRail for 4 walls (LANE_WIDTH=0.5)
  // Test: includes Cup and TeePad sub-components
  // Test: obstacle geometry (pillar, blades) unchanged
});

describe("All 7 types include shared sub-components", () => {
  // Test: all 7 types include Cup and TeePad sub-components
  // Iterate through type configurations and verify the shared
  // geometry helpers are called with correct positions.
});
```

## Implementation Details

### Step 1: Create `<BumperRail>` Component

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/BumperRail.tsx`

This component wraps the `createBumperGeometry()` utility from Section 1 into a self-contained R3F component.

**Props interface:**

```ts
type BumperRailProps = {
  /** Length of the rail along its local Z axis */
  length: number;
  /** Position in parent group space */
  position: [number, number, number];
  /** Euler rotation (default: no rotation) */
  rotation?: [number, number, number];
  /** Override height (default: BUMPER_HEIGHT = 0.08) */
  height?: number;
  /** Override thickness (default: BUMPER_THICKNESS = 0.05) */
  thickness?: number;
  /** Material to apply */
  material: THREE.MeshStandardMaterial;
};
```

**Behavior:**
- Calls `createBumperGeometry(createBumperProfile(height, thickness, bevelRadius), length)` inside a `useMemo`, keyed on `[length, height, thickness]`
- Renders a `<mesh castShadow>` with the generated ExtrudeGeometry
- Disposes the geometry in a `useEffect` cleanup return function
- The ExtrudeGeometry is oriented so that the rail runs along the local Z axis with the rounded profile visible from the side (XY plane cross-section)

**Orientation notes:** The `createBumperGeometry` from Section 1 produces geometry extruded along a depth axis. The component must apply appropriate rotation so the rail's length direction aligns with the intended axis. Since hole types place bumpers along both X and Z axes, the `rotation` prop handles this. The component internally orients the extrusion so that with no rotation, the rail runs along Z.

### Step 2: Create `<Cup>` Component

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/Cup.tsx`

**Props interface:**

```ts
type CupProps = {
  /** Position in parent group space */
  position: [number, number, number];
  /** Material for the cup recess */
  material: THREE.MeshStandardMaterial;
  /** Whether to show the flag pin (hidden in top-down view) */
  showFlag?: boolean;
};
```

**Behavior:**
- Uses `createCupGeometry()` from `holeGeometry.ts` (Section 1) to generate the recessed cylinder
- Renders the recess mesh at the given position
- Conditionally renders a flag pin group (thin CylinderGeometry shaft + small plane/cone flag) when `showFlag` is true
- Disposes geometry on unmount via `useEffect` cleanup
- The `showFlag` prop defaults to `true` and can be set to `false` in top-down/orthographic view (optimization for Section 9)

### Step 3: Create `<TeePad>` Component

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/TeePad.tsx`

**Props interface:**

```ts
type TeePadProps = {
  /** Position in parent group space */
  position: [number, number, number];
  /** Material for the tee pad */
  material: THREE.MeshStandardMaterial;
};
```

**Behavior:**
- Uses `createTeeGeometry()` from `holeGeometry.ts` (Section 1) to generate the slightly raised cylinder
- Renders a `<mesh>` at the given position
- Disposes geometry on unmount via `useEffect` cleanup

### Step 4: Refactor HoleStraight

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleStraight.tsx`

Replace the 4 inline `<mesh><boxGeometry/></mesh>` bumpers with 4 `<BumperRail>` instances. Replace the CircleGeometry cup with `<Cup>`. Replace the CircleGeometry tee with `<TeePad>`.

The felt surface mesh remains unchanged (BoxGeometry with felt material is fine -- texture application happened in Section 1 via the material system).

**Bumper mapping (existing -> shared component):**

| Bumper | Position | Rotation | Length |
|--------|----------|----------|--------|
| Left | `[-halfW + BT/2, ST + BH/2, 0]` | `[0, 0, 0]` | `length` |
| Right | `[halfW - BT/2, ST + BH/2, 0]` | `[0, 0, 0]` | `length` |
| Back (-Z) | `[0, ST + BH/2, -halfL + BT/2]` | `[0, Math.PI/2, 0]` | `laneW` |
| Front (+Z) | `[0, ST + BH/2, halfL - BT/2]` | `[0, Math.PI/2, 0]` | `laneW` |

End bumpers (back/front) run along X, so they need a 90-degree Y rotation to orient the rail cross-section correctly.

### Step 5: Refactor HoleLShape

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleLShape.tsx`

Replace 6 BoxGeometry bumpers with `<BumperRail>` components. This is the most complex refactoring because bumpers have varying lengths and positions based on the L-shape geometry:

1. **Right wall** -- full `length`, along Z, at `halfW - BT/2`
2. **Bottom wall** -- closes entry lane at -Z, width `LANE_WIDTH`, along X
3. **Top wall** -- full `width`, along X, at `halfL - BT/2`
4. **Left wall** -- only exit lane section, `LANE_WIDTH` long, along Z
5. **Inner bottom of exit lane** -- horizontal, length `exitFeltW`, along X
6. **Inner right of entry lane** -- vertical, length `innerEdgeZ - (-halfL)`, along Z

Replace the CircleGeometry cup/tee markers with `<Cup>` and `<TeePad>`.

### Step 6: Refactor HoleDogleg

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleDogleg.tsx`

Replace outer bumpers (left, right -- full length) and end bumpers (back, front) with `<BumperRail>`. Replace guide bumpers at bends with `<BumperRail>` instances using custom height (`BUMPER_HEIGHT * 0.6`).

The guide bumpers are small: `guideBumperLen = BUMPER_THICKNESS * 1.5`. They use the `height` override prop.

Replace CircleGeometry cup/tee with shared components.

### Step 7: Refactor HoleRamp

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleRamp.tsx`

Replace 4 bumpers:
- Side bumpers use the `height` override: `SIDE_BUMPER_HEIGHT = BUMPER_HEIGHT + RAMP_HEIGHT = 0.08 + 0.15 = 0.23`
- End bumpers (back, front) use standard `BUMPER_HEIGHT`

**Critical:** The obstacle-specific geometry (ramp up slope, plateau box, ramp down slope with their `ExtrudeGeometry` and `rampMaterial`) stays **exactly as-is**. Only bumpers, tee, and cup change.

Replace CircleGeometry cup/tee with shared components.

### Step 8: Refactor HoleLoop

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleLoop.tsx`

Replace 4 bumpers with `<BumperRail>`:
- Left/right side bumpers: full `length`, standard height
- Back/front end bumpers: `LANE_WIDTH` wide (0.5), standard height

**Critical:** The loop obstacle (half-torus, pillars, `loopMaterial`) stays unchanged.

Replace CircleGeometry cup/tee with shared components.

### Step 9: Refactor HoleTunnel

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleTunnel.tsx`

Replace 6 bumpers with `<BumperRail>`:
- 4 partial side bumpers (entry zone left/right, exit zone left/right) each with `openLength`
- 2 end bumpers (back/front) with `laneW` width

**Critical:** The tunnel arch (CylinderGeometry with `tunnelMaterial`) stays unchanged.

Replace CircleGeometry cup/tee with shared components.

### Step 10: Refactor HoleWindmill

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleWindmill.tsx`

Replace 4 bumpers with `<BumperRail>`:
- Left/right side bumpers: positioned at `halfLaneW + bt/2`, full `length`
- Back/front end bumpers: `LANE_WIDTH` wide (0.5)

**Critical:** The windmill obstacle (pillar cylinder, 4 blade boxes, `pillarMaterial`, `bladeMaterial`) stays unchanged.

Replace CircleGeometry cup/tee with shared components.

## Implementation Checklist

1. Write tests in `tests/components/holes/sharedComponents.test.ts` -- run, confirm they fail
2. Write tests in `tests/components/holes/legacyTypes.test.ts` -- run, confirm they fail
3. Create `BumperRail.tsx` -- parametric bumper rail using `createBumperGeometry` from Section 1
4. Create `Cup.tsx` -- recessed cylinder + flag pin using `createCupGeometry` from Section 1
5. Create `TeePad.tsx` -- raised cylinder using `createTeeGeometry` from Section 1
6. Verify shared component tests pass
7. Refactor `HoleStraight.tsx` to use shared components
8. Refactor `HoleLShape.tsx` to use shared components
9. Refactor `HoleDogleg.tsx` to use shared components
10. Refactor `HoleRamp.tsx` to use shared components (with `height` override for side bumpers)
11. Refactor `HoleLoop.tsx` to use shared components
12. Refactor `HoleTunnel.tsx` to use shared components
13. Refactor `HoleWindmill.tsx` to use shared components
14. Verify all legacy type tests pass
15. Run full test suite: `npm run test` -- all must pass
16. Run type check: `npx tsc --noEmit` -- no errors
17. Visual verification: open the app and confirm all 7 hole types render correctly with rounded bumpers, recessed cups, and raised tees

## Design Decisions

**Why separate components instead of a helper function?** R3F renders via JSX. Shared `<BumperRail>`, `<Cup>`, `<TeePad>` components encapsulate geometry creation, lifecycle disposal, and material application in one place. If we used plain geometry helper functions, each hole component would still need its own `useMemo` + `useEffect` cleanup boilerplate.

**Why not change obstacle geometry here?** Each obstacle type (windmill, tunnel, loop, ramp slope) has unique visual character and its own overhaul section (3-6). Keeping obstacles unchanged in Section 2 means this section has a clear scope boundary and can be validated independently.

**Why accept `material` as a prop rather than calling `useMaterials()` inside the shared component?** The parent hole component already calls `useMaterials()` and passes the appropriate material. This avoids duplicate hook calls and keeps the material source-of-truth in one place per hole type.

**Geometry disposal pattern:** Each shared component creates geometry in `useMemo` and disposes it in `useEffect` cleanup. This matches the existing pattern in `useMaterials.ts` where materials created in `useMemo` are disposed in a cleanup effect. This prevents GPU memory leaks when hole components unmount (e.g., when holes are deleted from the layout).