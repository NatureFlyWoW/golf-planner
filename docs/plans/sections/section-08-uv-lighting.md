Now I have all the context needed to write the section. Let me produce it.

# Section 08: Enhanced UV Lighting

## Overview

This section adds 4 UV RectAreaLights positioned at the hall ceiling to simulate UV tube strip lighting, along with visible lamp fixture geometry for the 3D perspective view. It also updates the HDR emissive intensity constant from 0.8 to 2.0 across all UV materials, enabling selective bloom (coordinated with Section 06's bloom threshold change).

**Key principle**: The lamp fixtures created here are clean, self-contained geometry. They have NO GodRays-specific properties (no `transparent`, no `depthWrite`). GodRays source meshes are handled entirely in Section 09 (`GodRaysSource` component), ensuring a clean cut boundary.

## Dependencies

- **Section 01 (GPU Tier Classifier)**: Must be complete. The `gpuTier` field must exist in Zustand UIState. The UV lamps themselves are not tier-gated (RectAreaLights are cheap), but the fixture visibility depends on `view` mode which is already in the store.
- **Section 05 (Environment)**: Must be complete. The environment, fog, and frameloop strategy should be in place before adding UV lighting. The RectAreaLights interact with the drei `<Environment>` cubemap reflections.

## Files to Create

- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/UVLamps.tsx` -- New component: 4x RectAreaLight + visible lamp fixture geometry

## Files to Modify

- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/materialPresets.ts` -- Update `UV_EMISSIVE_INTENSITY` from 0.8 to 2.0
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/shared.ts` -- Update all `uvXxxMaterial` singletons to use `emissiveIntensity: 2.0`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeCanvas.tsx` -- Import and render `<UVLamps />` when `uvMode` is true

## Tests (Vitest)

Create test file at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/uvLamps.test.ts`.

All tests are pure logic/data tests -- no R3F rendering. They test the exported constants and configuration values that drive the component.

```
File: tests/uvLamps.test.ts

# Test: UV lamp positions array has 4 entries
  - Import UV_LAMP_POSITIONS from UVLamps module
  - Assert length is 4

# Test: UV lamp positions match expected coordinates [(2.5,4.3,5), (7.5,4.3,5), (2.5,4.3,15), (7.5,4.3,15)]
  - Import UV_LAMP_POSITIONS
  - Assert each position matches the expected [x, y, z] tuple
  - These positions distribute evenly across the hall (10m x 20m), at ceiling height (4.3m)
  - x: quarter-points (2.5, 7.5) across 10m width
  - z: quarter-points (5, 15) across 20m length

# Test: UV lamp color is #8800FF
  - Import UV_LAMP_COLOR constant
  - Assert equals "#8800FF"

# Test: UV lamp intensity is 0.8
  - Import UV_LAMP_INTENSITY constant
  - Assert equals 0.8

# Test: UV lamp dimensions -- width 0.3, height 2
  - Import UV_LAMP_WIDTH and UV_LAMP_HEIGHT constants
  - Assert width equals 0.3
  - Assert height equals 2

# Test: lamp fixture has NO transparent/depthWrite props (those belong to GodRaysSource)
  - This is a code review test: grep/search the UVLamps.tsx file for "transparent" and "depthWrite"
  - Assert neither string appears in the file content
  - Ensures clean separation from Section 09's GodRays concerns
```

Additionally, update the existing material tests or add to a new test section.

```
File: tests/materialPresets.test.ts (new or appended)

# Test: UV_EMISSIVE_INTENSITY constant is 2.0 (not 0.8)
  - Import UV_EMISSIVE_INTENSITY from materialPresets
  - Assert equals 2.0
```

### Test for lamp fixture visibility gating

Since visibility gating (`visible={view === "3d"}`) is a React/R3F prop and cannot be unit-tested in jsdom, it is verified by code inspection and covered by Playwright visual tests in Section 12. However, the gating logic itself can be tested as a pure function if extracted:

```
# Test: lamp fixture visibility -- visible when view="3d"
  - Given view = "3d", assert shouldShowFixtures(view) returns true

# Test: lamp fixture visibility -- hidden when view="top-down"
  - Given view = "top", assert shouldShowFixtures(view) returns false
```

The `shouldShowFixtures` helper is a trivial one-liner (`view === "3d"`) but extracting it enables unit testing of the gating logic.

## Implementation Details

### 1. UV Lamp Constants

Export the following constants from the `UVLamps.tsx` module (or a separate constants file) so they can be imported in tests and reused by Section 09 (GodRaysSource needs the same positions):

```typescript
// Positions: 4 UV tube strips at ceiling height, distributed evenly
export const UV_LAMP_POSITIONS: [number, number, number][] = [
  [2.5, 4.3, 5],
  [7.5, 4.3, 5],
  [2.5, 4.3, 15],
  [7.5, 4.3, 15],
];

export const UV_LAMP_COLOR = "#8800FF";
export const UV_LAMP_INTENSITY = 0.8;
export const UV_LAMP_WIDTH = 0.3;   // meters (tube width)
export const UV_LAMP_HEIGHT = 2;    // meters (tube length)
```

**Position rationale**: The hall is 10m wide (x-axis) and 20m long (z-axis), with a wall height of 4.3m (y-axis). The four lamps are placed at the quarter-points of the floor plan (2.5m and 7.5m on x, 5m and 15m on z) at ceiling height, providing even UV coverage across the entire playing area.

### 2. RectAreaLight Setup

Each lamp position gets a `<rectAreaLight>` with the following R3F props:

- `position`: from `UV_LAMP_POSITIONS[i]`
- `color`: `UV_LAMP_COLOR` (#8800FF)
- `intensity`: `UV_LAMP_INTENSITY` (0.8)
- `width`: `UV_LAMP_WIDTH` (0.3)
- `height`: `UV_LAMP_HEIGHT` (2)
- `rotation`: `[-Math.PI / 2, 0, 0]` -- rotated to face downward (default RectAreaLight faces +Z, we want it facing -Y toward the floor)

**RectAreaLightUniformsLib check**: In Three.js 0.183.0 (the version pinned by Section 01), `RectAreaLight` works without calling `RectAreaLightUniformsLib.init()`. This initialization was integrated into the renderer pipeline in Three.js r155+. Verify at implementation time by rendering a RectAreaLight without the init call. If it works (expected), skip the import entirely. If it does not render correctly, add:

```typescript
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib';
// Call once at module level:
RectAreaLightUniformsLib.init();
```

**Important**: RectAreaLight does NOT cast shadows. The existing directional light in ThreeCanvas handles shadow casting. RectAreaLights are additive illumination only.

### 3. UV Lamp Fixture Geometry

Each lamp also gets a visible mesh representing the physical UV tube fixture. This is purely cosmetic -- it gives users a visual reference for where the UV lights are in 3D view.

**Geometry**: A simple `<mesh>` with a `BoxGeometry` or `CylinderGeometry` approximating a fluorescent tube housing:

- Box approach: `[UV_LAMP_WIDTH, 0.05, UV_LAMP_HEIGHT]` -- thin rectangular strip at each position
- The mesh sits at the same position as the RectAreaLight, slightly above or flush with the ceiling

**Material**: A `MeshStandardMaterial` with:
- `color`: UV_LAMP_COLOR (#8800FF)
- `emissive`: UV_LAMP_COLOR (#8800FF) 
- `emissiveIntensity`: 2.0 (matches the updated UV_EMISSIVE_INTENSITY -- these fixtures should bloom)
- NO `transparent` prop
- NO `depthWrite` prop
- These props are explicitly excluded to maintain clean separation from Section 09's GodRaysSource

**Visibility gating**: Wrap all fixture meshes in a `<group>` with `visible={view === "3d"}`. In top-down orthographic view, the ceiling fixtures would appear as clutter directly on top of the playing surface. They are only meaningful in 3D perspective view.

Read `view` from Zustand: `const view = useStore((s) => s.ui.view);`

### 4. UVLamps Component Structure

```typescript
// src/components/three/UVLamps.tsx

export function UVLamps() {
  // Read view mode from store for fixture visibility
  // Map over UV_LAMP_POSITIONS to render:
  //   1. A <rectAreaLight> at each position (always rendered when component is mounted)
  //   2. A fixture <mesh> at each position (visible only in 3D view)
  // Return a <group> containing all lights and fixtures
}
```

The `UVLamps` component is conditionally rendered by its parent (`ThreeCanvas`) only when `uvMode` is true. The component itself does not check `uvMode` -- that gating is handled at the call site.

### 5. Integration into ThreeCanvas

In `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeCanvas.tsx`, add the `UVLamps` import and render it conditionally:

```typescript
import { UVLamps } from "./UVLamps";

// Inside the JSX, alongside existing UV-mode content:
{uvMode && <UVLamps />}
```

Place it near the existing lighting elements (after the directional light block).

### 6. HDR Emissive Intensity Update

This change is critical for Section 06's selective bloom strategy. Currently, all UV materials use `emissiveIntensity: 0.8`, and bloom uses a low threshold of 0.2 -- causing everything to glow. By raising emissive intensity to 2.0 and raising the bloom threshold to 0.8 (done in Section 06), only surfaces with high emissive values will bloom.

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/materialPresets.ts`**

Change line 21:
```typescript
// Before:
export const UV_EMISSIVE_INTENSITY = 0.8;

// After:
export const UV_EMISSIVE_INTENSITY = 2.0;
```

**File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/shared.ts`**

Update all four UV material singletons (lines 55-87) to use `emissiveIntensity: 2.0`:

- `uvFeltMaterial`: change `emissiveIntensity: 0.8` to `emissiveIntensity: 2.0`
- `uvBumperMaterial`: change `emissiveIntensity: 0.8` to `emissiveIntensity: 2.0`
- `uvTeeMaterial`: change `emissiveIntensity: 0.8` to `emissiveIntensity: 2.0`
- `uvCupMaterial`: change `emissiveIntensity: 0.8` to `emissiveIntensity: 2.0`

**Note**: The `useMaterials.ts` hook references these singletons by import -- no changes needed there. The updated values propagate automatically.

### 7. Interaction with Other Sections

- **Section 06 (PostProcessing)**: The emissive intensity update (0.8 -> 2.0) is coordinated with Section 06's bloom `luminanceThreshold` change (0.2 -> 0.8). Both changes must land for selective bloom to work correctly. If only the intensity is raised without the threshold change, everything will bloom even more aggressively. If only the threshold is raised without the intensity change, nothing will bloom. The two changes are safe to implement in either order as long as both ship together.

- **Section 09 (GodRays)**: The `UV_LAMP_POSITIONS` array exported from this section is reused by the `GodRaysSource` component in Section 09. GodRaysSource creates separate emissive sphere meshes co-located at these same positions. This is intentional -- the GodRays source meshes are distinct objects with different material properties (`transparent: true`, `depthWrite: false`), completely decoupled from the lamp fixtures here.

- **Section 05 (Environment)**: The `<Lightformer>` elements added by Section 05 simulate UV tube reflections in the environment cubemap. The RectAreaLights added here provide actual real-time illumination. Both contribute to the UV atmosphere but are independent systems.

## Checklist

1. [x] Create `UVLamps.tsx` — component with 4 RectAreaLights + fixture meshes, `shouldShowFixtures` pure function
2. [x] RectAreaLight works without `RectAreaLightUniformsLib.init()` in Three.js 0.183 (confirmed by default)
3. [x] Fixture geometry with module-level material singleton (emissive, NO transparent/depthWrite)
4. [x] Fixture visibility gated to 3D view via `shouldShowFixtures(view)`
5. [x] `<UVLamps />` integrated into ThreeCanvas (conditional on uvMode), after directional light block
6. [x] `UV_EMISSIVE_INTENSITY` already 2.0 in materialPresets.ts (pre-existing)
7. [x] All four UV material singletons already at 2.0 in shared.ts (pre-existing)
8. [x] 9 tests pass: uvLamps.test.ts (8) + materialPresets.test.ts (1). 336 total.
9. [ ] Visual verification pending
10. [ ] Visual verification pending
11. [ ] Visual verification pending

## Deviations from Plan

- **Constants**: Imported from pre-existing `src/constants/uvLamps.ts` rather than defining in component (better — Section 09 needs same positions)
- **Fixture material**: Extracted as module-level `THREE.MeshStandardMaterial` singleton per code review (matches project pattern in `shared.ts`)
- **Array constants**: Extracted `LAMP_ROTATION` and `FIXTURE_ARGS` as typed tuples at module level per code review