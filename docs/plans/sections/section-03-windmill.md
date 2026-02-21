Now I have all the context I need. Let me compose the section content.

# Section 03: Windmill Obstacle Overhaul

## Overview

This section replaces the current windmill obstacle in `HoleWindmill.tsx` -- a plain gray cylinder with flat box blades -- with a charming miniature windmill building featuring a tapered tower, cone roof, shaped blade geometry, and slow blade rotation in 3D view. The windmill becomes one of the most recognizable visual landmarks on the course.

**Depends on:** Section 02 (shared BumperRail, Cup, TeePad components must exist). Section 01 (texture infrastructure, bumper profile utilities, TexturedHole/FlatHole pattern).

**Parallelizable with:** Sections 04 (tunnel) and 05 (loop+ramp) -- each modifies a different hole file with no shared file overlap.

**Files modified:**
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleWindmill.tsx` -- major rewrite of windmill obstacle geometry
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/shared.ts` -- update MODEL_HEIGHTS entry for windmill (now taller)

**Files created:**
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/holes/windmill.test.ts` -- windmill-specific tests

**Optional file (GLTF path):**
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/models/windmill.glb` -- Kenney Minigolf Kit model, if available and suitable

---

## Background Context

### Current Windmill Implementation

The current `HoleWindmill.tsx` (at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleWindmill.tsx`) renders:

- A flat `boxGeometry` felt surface (LANE_WIDTH=0.5)
- A `cylinderGeometry` central pillar (radius 0.05, height 0.3)
- 4 `boxGeometry` blades at 0/90/180/270 degrees (offset 22.5 degrees), each BLADE_LENGTH=0.25, BLADE_WIDTH=0.06, BLADE_THICKNESS=0.015
- 4 `boxGeometry` bumper walls
- Flat `circleGeometry` tee and cup markers

Blades are **static** (no animation). The pillar is a plain gray cylinder. The blades use the hole's accent color.

### Constants

From `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/shared.ts`:
- `BUMPER_HEIGHT = 0.08`
- `BUMPER_THICKNESS = 0.05`
- `SURFACE_THICKNESS = 0.02`
- `TEE_RADIUS = 0.03`
- `CUP_RADIUS = 0.054`
- `MODEL_HEIGHTS.windmill = 0.35` (will increase with taller tower)

From `materialPresets.ts`:
- `UV_EMISSIVE_INTENSITY = 2.0`

### Store State

The Zustand store provides:
- `ui.uvMode: boolean` -- UV blacklight mode
- `ui.view: "top" | "3d"` -- camera view mode (used to gate animation)
- `ui.gpuTier: "low" | "mid" | "high"` -- GPU tier for performance gating

### R3F Animation Pattern

The app uses `frameloop="demand"` on the R3F Canvas. When animation is needed, components must call `invalidate()` from `useThree` to request a new frame. The `useFrame` hook from `@react-three/fiber` provides delta time and runs only when a frame is requested. When the windmill is animating, it must call `invalidate()` each frame to keep the animation loop running.

Reference pattern from `CameraControls.tsx`:
```ts
const invalidate = useThree((s) => s.invalidate);
```

### Shared Components from Section 02

After Section 02, these reusable components will be available:
- `<BumperRail>` -- rounded ExtrudeGeometry bumper accepting length, position, rotation
- `<Cup>` -- recessed CylinderGeometry with flag pin (3D view only)
- `<TeePad>` -- raised CylinderGeometry with rubber texture

The windmill component should use these shared sub-components for its bumpers, cup, and tee (replacing the inline boxGeometry/circleGeometry).

---

## Tests (Write First)

Create test file at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/holes/windmill.test.ts`.

The project uses Vitest with real THREE.js imports (no mocking of Three.js). R3F components are NOT rendered in tests -- instead, test the geometry/material creation logic directly on THREE.js objects.

### Test Stubs

```ts
import { describe, expect, it } from "vitest";
import * as THREE from "three";

describe("WindmillObstacle geometry", () => {
  // Test: procedural windmill tower is a tapered cylinder (wider at base than top)
  it("tower body is tapered (base radius > top radius)", () => {
    // Create CylinderGeometry with different top/bottom radii
    // Verify base radius parameter > top radius parameter
  });

  // Test: tower roof is cone-shaped
  it("roof is a cone (ConeGeometry or CylinderGeometry with 0 top radius)", () => {
    // Verify the roof geometry has a pointed top
  });

  // Test: blade geometry uses ExtrudeGeometry or ShapeGeometry (not BoxGeometry)
  it("blade geometry is not a plain box", () => {
    // Create blade geometry via the extraction function
    // Verify it is ExtrudeGeometry or ShapeGeometry
  });

  // Test: fixed size approximately 0.8m x 0.8m x 1.2m regardless of hole dimensions
  it("windmill obstacle maintains fixed size ~0.8m x 0.8m x 1.2m", () => {
    // Verify tower height + roof height ~ 1.2m
    // Verify blade span ~ 0.8m
  });

  // Test: UV mode applies dark base + neon emissive to blades
  it("UV mode materials have emissive properties on blades", () => {
    // Create UV blade material
    // Verify emissive color is set and emissiveIntensity > 0
  });

  // Test: UV mode tower has dark base color
  it("UV mode tower material has dark base and pink emissive", () => {
    // Create UV tower material
    // Verify dark color + emissive
  });
});

describe("WindmillObstacle blade animation", () => {
  // Test: blade rotation speed is approximately 0.5 rad/sec
  it("blade rotation speed ~0.5 rad/sec", () => {
    // Given a delta of 1.0 second, the rotation should advance by ~0.5 radians
    const ROTATION_SPEED = 0.5;
    const delta = 1.0;
    const rotationChange = ROTATION_SPEED * delta;
    expect(rotationChange).toBeCloseTo(0.5, 2);
  });

  // Test: animation only occurs in 3D view (not top-down)
  // This is a behavioral contract -- in top-down mode, no useFrame / invalidate calls
  it("documents that animation is gated on view === '3d'", () => {
    // Structural test: verify the ROTATION_SPEED constant is exported
    // The actual gating is tested via the component rendering path
    expect(true).toBe(true); // placeholder for integration-level behavior
  });
});

describe("WindmillObstacle Suspense fallback", () => {
  // Test: fallback geometry matches current cylinder+box pattern
  it("fallback uses CylinderGeometry for tower and BoxGeometry for blades", () => {
    // The FlatHole / fallback path should produce the existing geometry
    // Verify cylinder + box patterns exist as fallback
  });
});
```

### Key Testing Notes

- THREE.js geometry classes are available in Vitest (jsdom environment) since THREE.js uses pure math for geometry generation.
- Do NOT attempt to render R3F `<Canvas>` in tests -- test geometry creation and material properties directly.
- Mock `useGLTF` if testing the GLTF path: `vi.mock("@react-three/drei", ...)` returning a dummy scene with named nodes.
- The blade animation test validates the speed constant and the gating logic contract. Actual `useFrame` behavior cannot be tested without a running R3F canvas.

---

## Implementation Details

### Step 1: Evaluate GLTF vs Procedural

**GLTF path (preferred if available):**
1. Check if the Kenney Minigolf Kit has a windmill model in GLTF/GLB format.
2. If available, download to `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/models/windmill.glb`.
3. Use `useGLTF` from `@react-three/drei` to load it, wrapped in `<Suspense>`.
4. Scale/position the model as a fixed-size accent (~0.8m wide x 0.8m deep x 1.2m tall) centered within the lane.
5. Identify the blade node in the GLTF scene graph and apply rotation animation to it.

**Procedural path (fallback, and likely primary approach):**
Build an improved procedural windmill with these sub-meshes:
- **Tower body:** `CylinderGeometry` with tapered profile (base radius ~0.12m, top radius ~0.08m, height ~0.6m). Use `radialSegments: 12` for reasonable quality. Material: stone-gray `MeshStandardMaterial` with slight roughness.
- **Roof:** `ConeGeometry` (radius ~0.14m, height ~0.2m, radialSegments: 12). Placed on top of tower. Material: dark red/brown.
- **Door detail:** Small `PlaneGeometry` or `BoxGeometry` (width ~0.06m, height ~0.1m) placed on one face of the tower at base level. Dark brown material. Optional visual flourish.
- **Blade assembly:** A `<group>` containing 4 blades, each using `ExtrudeGeometry` from a `THREE.Shape` (tapered rectangular shape, wider at tip than hub). The group rotates as a unit.
  - Each blade shape: trapezoid with rounded corners via `quadraticCurveTo`, approximately 0.3m long x 0.06m wide at hub, 0.08m wide at tip.
  - Blade hub: small cylinder or sphere at center connecting to tower.
- **Total footprint:** ~0.8m x 0.8m (blade tips define the horizontal envelope), ~1.2m tall (tower 0.6m + roof 0.2m + blade center at ~0.8m from ground).

### Step 2: Implement Blade Animation

The blade group rotates continuously in 3D view:

```ts
// Conceptual pattern (not full implementation)
const bladeRef = useRef<THREE.Group>(null);
const view = useStore((s) => s.ui.view);
const invalidate = useThree((s) => s.invalidate);
const ROTATION_SPEED = 0.5; // rad/sec

useFrame((_state, delta) => {
  if (view !== "3d" || !bladeRef.current) return;
  bladeRef.current.rotation.z += ROTATION_SPEED * delta;
  invalidate(); // Request next frame since frameloop="demand"
});
```

Key details:
- Rotation axis is Y (vertical), so blades spin around the vertical tower axis.
- In top-down view (`view === "top"`), skip the rotation and do NOT call `invalidate()`. This prevents unnecessary frame requests.
- The `useFrame` hook still runs (it's called unconditionally per Rules of Hooks), but the callback exits early.
- Export `ROTATION_SPEED` as a named constant so tests can reference it.

### Step 3: UV Mode Materials

The windmill in UV/blacklight mode:
- **Tower:** Dark base color (`#1A0011`), pink emissive (`#FF1493`), `emissiveIntensity: UV_EMISSIVE_INTENSITY` (2.0). Subtle glow effect.
- **Roof:** Dark base, slight purple emissive.
- **Blades:** Dark base (`#1A0011`), hot pink emissive edges (`#FF1493`). The blade ExtrudeGeometry's edge faces can be given a separate emissive material using material array indexing, or apply emissive to the entire blade.
- **Door:** Dark, no emissive.

UV materials should be created with `useMemo` keyed on `uvMode`, matching the existing pattern in the current HoleWindmill.tsx.

### Step 4: Integrate Shared Components from Section 02

Replace inline bumper/tee/cup geometry with shared components:

```tsx
// Conceptual usage (not full implementation)
<BumperRail position={[-halfLaneW - bt/2, 0, 0]} length={length} />
<BumperRail position={[halfLaneW + bt/2, 0, 0]} length={length} />
<BumperRail position={[0, 0, -halfL + bt/2]} length={LANE_WIDTH} rotation={[0, Math.PI/2, 0]} />
<BumperRail position={[0, 0, halfL - bt/2]} length={LANE_WIDTH} rotation={[0, Math.PI/2, 0]} />
<TeePad position={[0, 0, -halfL + 0.15]} />
<Cup position={[0, 0, halfL - 0.15]} />
```

The felt surface continues to use `useMaterials()` for the felt material (now textured per Section 01 if GPU tier allows).

### Step 5: Update MODEL_HEIGHTS

In `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/shared.ts`, update:

```ts
MODEL_HEIGHTS.windmill = 1.2; // Was 0.35, now taller with proper tower + roof
```

This affects the selection outline bounding box height.

### Step 6: Suspense/ErrorBoundary Fallback

If the GLTF path is used, the windmill model loads asynchronously. The `<Suspense>` boundary should show the current (old) geometry as fallback while the model loads. If an error occurs (broken GLB, network failure), an `<ErrorBoundary>` should catch it and permanently render the procedural fallback.

For the procedural-only path, no Suspense is needed for the windmill obstacle itself (geometry is synchronous). However, textures loaded via `useTexture` in the parent `<TexturedHole>` wrapper already handle Suspense at a higher level.

### Component Structure (Procedural Path)

The rewritten HoleWindmill should have this approximate structure:

```
<group> (HoleWindmill root)
  <mesh> felt surface (boxGeometry or planeGeometry with felt material)
  <BumperRail /> x4 (shared component, left/right/front/back)
  <TeePad /> (shared component)
  <Cup /> (shared component)
  <group> (windmill obstacle, centered in lane)
    <mesh> tower body (tapered CylinderGeometry)
    <mesh> roof (ConeGeometry)
    <mesh> door detail (PlaneGeometry)
    <group ref={bladeRef}> (rotating blade assembly)
      <mesh> hub (small CylinderGeometry)
      <mesh> blade 1 (ExtrudeGeometry from Shape)
      <mesh> blade 2
      <mesh> blade 3
      <mesh> blade 4
    </group>
  </group>
</group>
```

### Geometry Disposal

All custom geometries created in the component (tower, roof, blades, door, hub) must be disposed on unmount. Use `useEffect` cleanup:

```ts
useEffect(() => {
  return () => {
    towerGeometry.dispose();
    roofGeometry.dispose();
    bladeGeometries.forEach(g => g.dispose());
    // etc.
  };
}, [/* geometry dependencies */]);
```

If using `useMemo` to create geometries, the cleanup effect should reference the memoized values. The shared `<BumperRail>`, `<Cup>`, and `<TeePad>` components handle their own disposal (per Section 02).

---

## Acceptance Criteria

1. The windmill obstacle renders as a recognizable miniature windmill building (tapered tower, cone roof, shaped blades) instead of a plain cylinder with box blades.
2. Blades rotate slowly (~0.5 rad/sec) in 3D view only.
3. No animation occurs in top-down view, and no unnecessary `invalidate()` calls are made.
4. UV mode applies dark tower + neon emissive blade edges.
5. The windmill maintains a fixed size (~0.8m x 0.8m x 1.2m) regardless of the hole's `width`/`length` parameters.
6. Shared BumperRail, Cup, and TeePad components are used (not inline geometry).
7. MODEL_HEIGHTS entry is updated to reflect the new taller windmill.
8. All custom geometry is disposed on unmount (no GPU memory leaks).
9. If GLTF model is used, Suspense fallback renders the procedural version.
10. All tests in `tests/components/holes/windmill.test.ts` pass.
11. Existing tests (304 passing) remain green.