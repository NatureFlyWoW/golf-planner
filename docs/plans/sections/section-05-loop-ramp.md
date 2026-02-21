I now have all the context I need. Let me produce the section content.

# Section 05: Loop + Ramp Overhaul

## Overview

This section upgrades the two physics-oriented obstacle types -- the loop and the ramp -- from basic geometric primitives to polished, detailed 3D models. The loop's half-torus becomes a smooth TubeGeometry with tapered support pillars and a cross-brace. The ramp's triangular ExtrudeGeometry becomes a smooth bezier-curved slope with continuous felt texture.

**What changes:**
- `HoleLoop.tsx`: Replace `TorusGeometry` loop arch with `TubeGeometry` along a semicircular path; replace cylindrical pillars with tapered supports plus a cross-brace between them; apply metallic material with brushed metal normal map
- `HoleRamp.tsx`: Replace triangular `ExtrudeGeometry` slopes with curved bezier profile shapes (horizontal tangent at entry and exit); apply the same felt material/texture as the base playing surface to the ramp slopes

**What stays the same:**
- All placement logic, collision detection, hole dimensions, and store structure remain untouched
- The bumper rails (already upgraded to shared `<BumperRail>` components in Section 02), cups, and tee pads are not modified here
- UV mode behavior is preserved (neon cyan loop glow, neon magenta ramp felt glow)

## Dependencies

- **Section 01 (Straight Hole Glow-Up):** Provides `bumperProfile.ts` utility, `useTexturedMaterials()` hook, `TexturedHole`/`FlatHole` pattern, and texture assets in `public/textures/`
- **Section 02 (Shared Geometry Library):** Provides `<BumperRail>`, `<Cup>`, `<TeePad>` shared components that the loop and ramp hole components already use. This section modifies only the obstacle-specific geometry (the loop arch/pillars and the ramp slopes), not the shared elements

## Current State of Files

### `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleLoop.tsx`

Current implementation uses:
- `TorusGeometry` with `args={[LOOP_RADIUS, TUBE_RADIUS, 12, 24, Math.PI]}` for the semicircular arch
- Two identical `CylinderGeometry` pillars (same radius top and bottom: `PILLAR_RADIUS`)
- No cross-brace between pillars
- Constants: `LOOP_RADIUS = 0.3`, `TUBE_RADIUS = 0.04`, `PILLAR_RADIUS = 0.04`, `PILLAR_HEIGHT = 0.15`, `LANE_WIDTH = 0.5`
- `loopMaterial` created via `useMemo` with `roughness: 0.4, metalness: 0.2`; UV mode uses `color: "#001A1A"`, `emissive: "#00FFFF"`

### `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleRamp.tsx`

Current implementation uses:
- Triangular `THREE.Shape` extruded via `ExtrudeGeometry` for ramp-up and ramp-down slopes
- Ramp-up shape: `moveTo(0,0) -> lineTo(RAMP_SLOPE_LENGTH,0) -> lineTo(0,RAMP_HEIGHT) -> closePath()`
- Ramp-down shape: `moveTo(0,RAMP_HEIGHT) -> lineTo(0,0) -> lineTo(RAMP_SLOPE_LENGTH,0) -> closePath()`
- Constants: `RAMP_HEIGHT = 0.15`, `RAMP_SLOPE_LENGTH = 0.5`, `PLATEAU_LENGTH = 0.4`, `SIDE_BUMPER_HEIGHT = BUMPER_HEIGHT + RAMP_HEIGHT`
- `rampMaterial` is a separate `MeshStandardMaterial` that duplicates felt properties; UV mode uses `color: "#1A001A"`, `emissive: "#FF00FF"`

### Key Shared Constants (from `shared.ts`)

```
BUMPER_HEIGHT = 0.08
BUMPER_THICKNESS = 0.05
SURFACE_THICKNESS = 0.02
TEE_RADIUS = 0.03
CUP_RADIUS = 0.054
```

## Tests -- Write FIRST

All tests use Vitest. Tests validate THREE.js geometry and material properties directly -- no R3F canvas rendering. The project pattern is to import real THREE.js (not mocked) and assert on geometry attributes.

### File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/holes/loop.test.ts`

```
# Loop obstacle tests

# Test: LoopObstacle uses TubeGeometry (not TorusGeometry)
#   - Create loop arch geometry using the new utility function
#   - Assert the geometry is a BufferGeometry (TubeGeometry extends BufferGeometry)
#   - Assert it has a 'position' attribute with vertex count greater than TorusGeometry(0.3, 0.04, 12, 24, PI) baseline
#   - Verify the geometry was created via TubeGeometry constructor (check constructor.name or use instanceof)

# Test: tube path traces 180-degree semicircle
#   - Create the curve path used for TubeGeometry
#   - Sample points along the curve at t=0, t=0.5, t=1.0
#   - Assert t=0 and t=1.0 are at the base (Y near 0 relative to arch center)
#   - Assert t=0.5 is at the apex (Y near LOOP_RADIUS above center)
#   - Assert the Z coordinates at t=0 and t=1 are +/- LOOP_RADIUS

# Test: tube segment count >= 48
#   - Create TubeGeometry with the project's segment parameter
#   - Assert tubularSegments parameter is >= 48

# Test: support pillars are tapered (wider at base)
#   - Create the pillar CylinderGeometry with tapered parameters
#   - Assert radiusTop < radiusBottom (tapered: wider at base)
#   - Assert radiusBottom > PILLAR_RADIUS (old constant was uniform)

# Test: cross-brace connects pillars
#   - Verify cross-brace geometry exists (BoxGeometry or CylinderGeometry)
#   - Assert its position is between the two pillar positions
#   - Assert its length spans approximately 2 * LOOP_RADIUS (distance between pillar centers)

# Test: metallic material properties (roughness < 0.5, metalness > 0.2)
#   - Create the loop metallic material
#   - Assert roughness < 0.5
#   - Assert metalness > 0.2

# Test: UV mode applies neon cyan emissive
#   - Create loop material in UV mode
#   - Assert emissive color is cyan (#00FFFF or equivalent)
#   - Assert emissiveIntensity matches UV_EMISSIVE_INTENSITY (2.0)
```

### File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/holes/ramp.test.ts`

```
# Ramp obstacle tests

# Test: RampObstacle uses curved bezier profile (not triangular)
#   - Create the ramp shape using the new bezier approach
#   - Extract the path points from the shape
#   - Assert at least one point has a Y value between 0 and RAMP_HEIGHT (intermediate curve point)
#   - A triangular shape would only have vertices at (0,0), (RAMP_SLOPE_LENGTH,0), and (0,RAMP_HEIGHT)

# Test: ramp profile has horizontal tangent at entry (smooth transition)
#   - Create the ramp-up shape
#   - Compute the tangent direction at t=0 (entry point)
#   - Assert the tangent is approximately horizontal (Y component near 0)

# Test: ramp profile has horizontal tangent at top (smooth plateau transition)
#   - Create the ramp-up shape
#   - Compute the tangent direction at t=1 (top point)
#   - Assert the tangent is approximately horizontal (Y component near 0)

# Test: ramp surface uses same felt material as base
#   - After Section 02, the felt material comes from useMaterials() or useTexturedMaterials()
#   - Assert the ramp slope material reference is the same felt material as the base surface
#   - (No more separate rampMaterial -- reuse the felt material from the hook)

# Test: side bumpers height equals SIDE_BUMPER_HEIGHT
#   - Verify SIDE_BUMPER_HEIGHT = BUMPER_HEIGHT + RAMP_HEIGHT = 0.08 + 0.15 = 0.23
#   - This is a constant check to prevent regression

# Test: UV mode matches felt UV materials
#   - Create ramp in UV mode
#   - Assert the ramp slope uses the same UV felt material (emissive magenta/pink)
#   - No separate rampMaterial in UV mode either
```

### Test Implementation Pattern

Following the existing project convention (see `tests/utils/segmentGeometry.test.ts` and `tests/hooks/gpuTier.test.ts`):

```typescript
import { describe, expect, it } from "vitest";
import * as THREE from "three";

describe("LoopObstacle geometry", () => {
  it("uses TubeGeometry with semicircular path", () => {
    // Create the curve and geometry, assert on properties
  });

  it("tube path traces 180-degree semicircle", () => {
    // Sample curve points, verify semicircle shape
  });

  // ... etc
});
```

Tests should import and call the geometry creation functions directly rather than rendering R3F components. If the obstacle geometry is created inline in the component (as it currently is via `useMemo`), extract the geometry creation into a utility function that can be tested in isolation.

## Implementation Details

### Part A: Loop Obstacle Overhaul

#### 1. Extract loop geometry utilities

Create a utility function (can be in-file or in a new utility) that generates the loop arch geometry. This makes it testable outside of R3F.

**Loop arch -- TubeGeometry replacement:**

- Create a `CatmullRomCurve3` (or `QuadraticBezierCurve3`) that traces a 180-degree semicircular arc
- The curve should define points that form a half-circle in the YZ plane:
  - Start point: `(0, 0, -LOOP_RADIUS)` (back foot)
  - Apex: `(0, LOOP_RADIUS, 0)` (top of arch)
  - End point: `(0, 0, +LOOP_RADIUS)` (front foot)
- For `CatmullRomCurve3`, use enough intermediate points (5-7 points) along the semicircle to get a smooth curve
- Alternatively, sample a parametric semicircle: `y = LOOP_RADIUS * sin(t)`, `z = -LOOP_RADIUS * cos(t)` for `t` in `[0, PI]`
- Create `TubeGeometry(curve, tubularSegments, tubeRadius, radialSegments, closed)` with:
  - `tubularSegments: 48` (smooth curve, up from TorusGeometry's 24)
  - `tubeRadius: TUBE_RADIUS` (0.04m, same as before)
  - `radialSegments: 12` (cross-section smoothness)
  - `closed: false` (open-ended tube)

**Why TubeGeometry over TorusGeometry:** TubeGeometry allows a custom path (not limited to a perfect torus). This is better for potential future adjustments (asymmetric arches, non-circular paths) and gives more control over segment density. The visual result is smoother with 48 tubular segments vs the current 24.

#### 2. Tapered support pillars

Replace the two identical `CylinderGeometry(PILLAR_RADIUS, PILLAR_RADIUS, PILLAR_HEIGHT, 8)` with tapered cylinders:

- `CylinderGeometry(radiusTop, radiusBottom, PILLAR_HEIGHT, 8)` where `radiusTop = PILLAR_RADIUS * 0.7` and `radiusBottom = PILLAR_RADIUS * 1.3`
- This creates a visually stable look (wider at base, narrower at top where it meets the tube)
- Positions remain the same: `(0, st + PILLAR_HEIGHT/2, +/-LOOP_RADIUS)`

#### 3. Cross-brace between pillars

Add a small horizontal connecting element between the two pillars at mid-height:

- `BoxGeometry(braceWidth, braceHeight, braceLength)` or `CylinderGeometry` rotated 90 degrees
- Position: `(0, st + PILLAR_HEIGHT * 0.5, 0)` (centered between pillars, at ~50% pillar height)
- Length: `2 * LOOP_RADIUS` (spans from back pillar to front pillar along Z)
- Width/height: small (e.g., `0.02 x 0.02`)
- Uses the same `loopMaterial`

#### 4. Metallic material with normal map

The existing `loopMaterial` already has `roughness: 0.4, metalness: 0.2`. Enhance it:

- If textured path (mid/high GPU tier): apply a metal normal map for brushed metal look (reuse steel or wood normal map from `public/textures/` if a metal texture is available, or skip normal map and rely on material properties alone)
- Increase metalness slightly: `metalness: 0.6` for a more convincing metallic appearance
- Decrease roughness: `roughness: 0.3` for subtle reflections

#### 5. UV mode

Preserve existing UV mode behavior:
- Dark base: `color: "#001A1A"`
- Neon cyan emissive: `emissive: "#00FFFF"`, `emissiveIntensity: UV_EMISSIVE_INTENSITY`
- Applied to all loop obstacle meshes (tube, pillars, cross-brace)

#### 6. Geometry disposal

The TubeGeometry is created via `useMemo`. Add `useEffect` cleanup to dispose it on unmount, following the same pattern as the existing ramp geometry disposal (which currently does NOT dispose -- this should be added):

```typescript
useEffect(() => {
  return () => {
    loopTubeGeo.dispose();
  };
}, [loopTubeGeo]);
```

### Part B: Ramp Obstacle Overhaul

#### 1. Replace triangular shape with bezier curve profile

The current ramp-up shape is a triangle:
```
moveTo(0, 0) -> lineTo(RAMP_SLOPE_LENGTH, 0) -> lineTo(0, RAMP_HEIGHT) -> closePath()
```

Replace with a smooth bezier curve shape:

**Ramp-up shape:**
```typescript
const shape = new THREE.Shape();
shape.moveTo(0, 0);
// Bottom edge (flat base)
shape.lineTo(RAMP_SLOPE_LENGTH, 0);
// Right edge going up with quadratic bezier (smooth curve from base to top)
shape.quadraticCurveTo(RAMP_SLOPE_LENGTH, RAMP_HEIGHT, 0, RAMP_HEIGHT);
// Close back to origin
shape.closePath();
```

The key insight: `quadraticCurveTo(cpX, cpY, endX, endY)` with the control point at `(RAMP_SLOPE_LENGTH, RAMP_HEIGHT)` creates:
- Horizontal tangent at the end point `(0, RAMP_HEIGHT)` -- smooth transition to plateau
- Horizontal tangent at the start of the curve `(RAMP_SLOPE_LENGTH, 0)` -- smooth entry from flat surface

**Ramp-down shape (mirror):**
```typescript
const shape = new THREE.Shape();
shape.moveTo(0, RAMP_HEIGHT);
// Top edge (coming from plateau)
shape.quadraticCurveTo(0, 0, RAMP_SLOPE_LENGTH, 0);
// Bottom edge back
shape.lineTo(0, 0);
// Close (left edge going up)
shape.closePath();
```

Wait -- rethink this. The shape needs to be a closed profile that can be extruded. The cross-section should be:
- Bottom: horizontal line from `(0, 0)` to `(RAMP_SLOPE_LENGTH, 0)` -- the ground-level base
- Right side: vertical or near-vertical rise
- Top: bezier curve from the top-right back to top-left
- Left side: connects back to origin

Actually, the simpler approach that matches the existing pattern: the shape IS the cross-section of the ramp slope (viewed from the side), and it gets extruded along the lane width. The triangle was: base on the X-axis, height on the Y-axis. Replace the hypotenuse (straight line from `(RAMP_SLOPE_LENGTH, 0)` to `(0, RAMP_HEIGHT)`) with a quadratic bezier curve:

**Ramp-up shape (corrected):**
```typescript
const shape = new THREE.Shape();
shape.moveTo(0, 0);                                     // bottom-left (ground at entry)
shape.lineTo(RAMP_SLOPE_LENGTH, 0);                     // bottom-right (ground at top)
shape.lineTo(RAMP_SLOPE_LENGTH, RAMP_HEIGHT);           // top-right (plateau height)
// Smooth curve back to origin height -- horizontal tangent at both ends
shape.quadraticCurveTo(
  0, RAMP_HEIGHT,                                        // control point: directly above origin
  0, 0                                                   // end point: back to origin
);
shape.closePath();
```

No, this is getting tangled. Let me define the desired profile cleanly:

The ramp cross-section (XY plane, extruded along Z which maps to lane width after rotation) should be:
1. Bottom edge: horizontal line at Y=0 from X=0 to X=RAMP_SLOPE_LENGTH
2. Right edge: vertical line at X=RAMP_SLOPE_LENGTH from Y=0 to Y=RAMP_HEIGHT (this is where it meets the plateau)
3. Top surface: smooth S-curve from `(RAMP_SLOPE_LENGTH, RAMP_HEIGHT)` back to `(0, 0)` -- this is the playing surface the ball rolls on

The top surface curve should have:
- Horizontal tangent at `(0, 0)` -- smooth entry from flat ground
- Horizontal tangent at `(RAMP_SLOPE_LENGTH, RAMP_HEIGHT)` -- smooth meeting with plateau

A single `quadraticCurveTo` cannot achieve horizontal tangents at BOTH endpoints. Use a **cubic bezier** instead:

```typescript
const shape = new THREE.Shape();
shape.moveTo(0, 0);                                        // entry at ground level
shape.bezierCurveTo(
  RAMP_SLOPE_LENGTH * 0.5, 0,                             // cp1: pulls tangent horizontal at entry
  RAMP_SLOPE_LENGTH * 0.5, RAMP_HEIGHT,                   // cp2: pulls tangent horizontal at top
  RAMP_SLOPE_LENGTH, RAMP_HEIGHT                           // end: top of ramp at plateau height
);
shape.lineTo(RAMP_SLOPE_LENGTH, 0);                        // down to ground level
shape.closePath();
```

This creates an S-curve style ramp surface: flat entry, smooth rise, flat top. The shape's interior (between the curve and the bottom line) forms the solid cross-section.

The `curveSegments` option in `ExtrudeGeometry` controls bezier tessellation (default 12, keep at 12+ for smoothness).

#### 2. Use felt material for ramp surface

Currently the ramp has its own `rampMaterial` created inline. After Section 02, the `felt` material from `useMaterials()` should be used directly for the ramp slope surfaces. This means:
- Remove the `rampMaterial` useMemo block
- Use `felt` from the materials hook for ramp-up, plateau, and ramp-down meshes
- In UV mode, this automatically gets the UV felt material (neon magenta/green)

This simplifies the code and ensures visual consistency: ramp felt looks identical to the base lane felt.

#### 3. Geometry disposal

Add `useEffect` cleanup for the ramp geometries (currently missing):

```typescript
useEffect(() => {
  return () => {
    rampUpGeo.dispose();
    rampDownGeo.dispose();
  };
}, [rampUpGeo, rampDownGeo]);
```

#### 4. Extrude settings

Update the `ExtrudeGeometry` options for the bezier shapes:

```typescript
new THREE.ExtrudeGeometry(shape, {
  depth: laneW,
  bevelEnabled: false,
  curveSegments: 16,  // smooth bezier curve tessellation
});
```

The `curveSegments` parameter controls how many line segments approximate each bezier curve in the shape. 16 gives a visibly smooth slope. This replaces the current `bevelEnabled: false` only config.

### Files Modified

| File | Change |
|------|--------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleLoop.tsx` | Replace TorusGeometry with TubeGeometry, taper pillars, add cross-brace, enhance metallic material |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleRamp.tsx` | Replace triangular ExtrudeGeometry with bezier profile, remove rampMaterial in favor of felt, add geometry disposal |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/holes/loop.test.ts` | NEW -- loop obstacle geometry + material tests |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/holes/ramp.test.ts` | NEW -- ramp obstacle geometry + material tests |

### Files NOT Modified

- `HoleModel.tsx` -- dispatcher remains unchanged
- `shared.ts` -- constants unchanged
- `useMaterials.ts` -- hook unchanged
- Bumper rails, cups, tee pads -- handled by Section 02 shared components

## Implementation Checklist

1. Write loop tests in `tests/components/holes/loop.test.ts`
2. Write ramp tests in `tests/components/holes/ramp.test.ts`
3. Run tests -- confirm they fail (red phase)
4. Extract loop arch geometry creation into a testable function (can be a module-level function in HoleLoop.tsx or a small utility)
5. Implement TubeGeometry loop arch with CatmullRomCurve3 semicircular path (48 tubular segments)
6. Implement tapered pillar CylinderGeometry (radiusTop < radiusBottom)
7. Add cross-brace mesh between pillars
8. Enhance metallic material properties (higher metalness, lower roughness)
9. Add geometry disposal useEffect for loop TubeGeometry
10. Replace triangular ramp shapes with cubic bezier profile shapes in HoleRamp.tsx
11. Update ExtrudeGeometry options with `curveSegments: 16`
12. Remove `rampMaterial` useMemo block -- use `felt` from materials hook instead
13. Add geometry disposal useEffect for ramp ExtrudeGeometry instances
14. Run tests -- confirm they pass (green phase)
15. Run `npx tsc --noEmit` -- confirm no type errors
16. Run `npm run check` -- confirm Biome lint + format passes
17. Visual verification: open app, place a loop hole and a ramp hole, verify 3D view looks correct

## Key Constants Reference

```typescript
// Loop (existing, preserved)
const LOOP_RADIUS = 0.3;
const TUBE_RADIUS = 0.04;
const PILLAR_RADIUS = 0.04;
const PILLAR_HEIGHT = 0.15;
const LANE_WIDTH = 0.5;

// Loop (new)
const PILLAR_RADIUS_TOP = PILLAR_RADIUS * 0.7;   // 0.028
const PILLAR_RADIUS_BOTTOM = PILLAR_RADIUS * 1.3; // 0.052
const BRACE_SIZE = 0.02;
const TUBE_SEGMENTS = 48;
const TUBE_RADIAL_SEGMENTS = 12;

// Ramp (existing, preserved)
const RAMP_HEIGHT = 0.15;
const RAMP_SLOPE_LENGTH = 0.5;
const PLATEAU_LENGTH = 0.4;
const SIDE_BUMPER_HEIGHT = BUMPER_HEIGHT + RAMP_HEIGHT; // 0.23

// Ramp (new)
const RAMP_CURVE_SEGMENTS = 16;
```

## UV Mode Behavior Summary

| Component | Normal Mode | UV Mode |
|-----------|-------------|---------|
| Loop tube | Metallic gray, roughness 0.3, metalness 0.6 | Dark `#001A1A` + cyan emissive `#00FFFF` |
| Loop pillars | Same metallic material | Same dark + cyan emissive |
| Loop cross-brace | Same metallic material | Same dark + cyan emissive |
| Ramp slopes | Felt material (green carpet) | UV felt material (dark + neon green emissive) |
| Ramp plateau | Felt material | UV felt material |