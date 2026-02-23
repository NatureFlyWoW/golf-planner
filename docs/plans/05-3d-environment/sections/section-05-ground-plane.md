Now I have all the context I need. Let me generate the section content.

# Section 05: Ground Plane + Environment Layer Type

## Overview

This section adds the `"environment"` layer type to the type system and layer constants, then implements a textured asphalt ground plane component that extends beyond the hall perimeter. It is **independently implementable** — no dependency on sections 01-04 (walkthrough).

The ground plane is the first visible environment element: it replaces the empty void below the hall with a realistic asphalt surface and provides the visual base for the roof and sky added later in sections 06-07.

---

## Dependencies

- **Section 01** (Walkthrough State): No dependency — this section is parallelizable with section 01.
- **Section 07** (Sky & Fog): Depends on this section's environment layer setup.
- The `environment` layer type added here will also be used by sections 06 and 07.

---

## Tests First

### Test file: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/constants/layers.test.ts`

Create this new test file:

```typescript
import { describe, expect, it } from "vitest";
import { LAYER_DEFINITIONS } from "../../src/constants/layers";
import { DEFAULT_LAYERS } from "../../src/store/store";

describe("Environment layer — LAYER_DEFINITIONS", () => {
  it('includes "environment" layer definition', () => {
    const ids = LAYER_DEFINITIONS.map((l) => l.id);
    expect(ids).toContain("environment");
  });

  it('"environment" layer has label "Environment"', () => {
    const def = LAYER_DEFINITIONS.find((l) => l.id === "environment");
    expect(def?.label).toBe("Environment");
  });

  it('"environment" layer has non-emoji icon string', () => {
    const def = LAYER_DEFINITIONS.find((l) => l.id === "environment");
    // Per project convention: no emoji. The icon should be a plain character.
    expect(def?.icon).toBeTruthy();
    expect(typeof def?.icon).toBe("string");
  });
});

describe("Environment layer — DEFAULT_LAYERS", () => {
  it('has "environment" entry in DEFAULT_LAYERS', () => {
    expect(DEFAULT_LAYERS).toHaveProperty("environment");
  });

  it('"environment" defaults to visible=true', () => {
    expect(DEFAULT_LAYERS.environment.visible).toBe(true);
  });

  it('"environment" defaults to opacity=1', () => {
    expect(DEFAULT_LAYERS.environment.opacity).toBe(1);
  });

  it('"environment" defaults to locked=false', () => {
    expect(DEFAULT_LAYERS.environment.locked).toBe(false);
  });

  it("now has 6 total layers (was 5, added environment)", () => {
    expect(Object.keys(DEFAULT_LAYERS)).toHaveLength(6);
  });
});
```

### Test file: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/three/groundPlane.test.ts`

Create this new test file. Tests target pure utility functions exported from `GroundPlane.tsx`:

```typescript
import { describe, expect, it } from "vitest";
import {
  getGroundPlaneDimensions,
  getGroundPlanePosition,
  getGroundTextureRepeat,
} from "../../../src/components/three/environment/GroundPlane";
import { shouldShowGroundTexture } from "../../../src/utils/environmentGating";
import { HALL } from "../../../src/constants/hall";

describe("getGroundPlaneDimensions", () => {
  it("extends 30m beyond hall in both dimensions", () => {
    const { width, length } = getGroundPlaneDimensions(HALL.width, HALL.length);
    expect(width).toBe(HALL.width + 30);
    expect(length).toBe(HALL.length + 30);
  });

  it("uses extension constant of 30m", () => {
    const { width, length } = getGroundPlaneDimensions(10, 20);
    expect(width).toBe(40);
    expect(length).toBe(50);
  });
});

describe("getGroundPlanePosition", () => {
  it("Y position is -0.01 (below floor to avoid z-fighting)", () => {
    const { y } = getGroundPlanePosition();
    expect(y).toBe(-0.01);
  });

  it("is centered on hall center X (width/2)", () => {
    const { x } = getGroundPlanePosition(HALL.width, HALL.length);
    expect(x).toBe(HALL.width / 2);
  });

  it("is centered on hall center Z (length/2)", () => {
    const { z } = getGroundPlanePosition(HALL.width, HALL.length);
    expect(z).toBe(HALL.length / 2);
  });
});

describe("getGroundTextureRepeat", () => {
  it("divides total width by tile size (2m)", () => {
    // (10 + 30) / 2 = 20 repeats on X
    const { repeatX } = getGroundTextureRepeat(40, 50);
    expect(repeatX).toBe(20);
  });

  it("divides total length by tile size (2m)", () => {
    // (20 + 30) / 2 = 25 repeats on Z
    const { repeatZ } = getGroundTextureRepeat(40, 50);
    expect(repeatZ).toBe(25);
  });

  it("uses 2m tile size by default", () => {
    const { repeatX } = getGroundTextureRepeat(10, 10);
    expect(repeatX).toBe(5);
  });
});

describe("shouldShowGroundTexture (environmentGating)", () => {
  it('returns false for "low" GPU tier', () => {
    expect(shouldShowGroundTexture("low")).toBe(false);
  });

  it('returns true for "mid" GPU tier', () => {
    expect(shouldShowGroundTexture("mid")).toBe(true);
  });

  it('returns true for "high" GPU tier', () => {
    expect(shouldShowGroundTexture("high")).toBe(true);
  });
});
```

### Extend: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/environment.test.ts`

Add new test cases to the existing `environmentGating` tests (these go inside the existing file, adding new `describe` blocks):

```typescript
// Add to the existing environment.test.ts file:

describe("shouldShowGroundTexture", () => {
  it('returns false for "low" GPU tier', () => {
    expect(shouldShowGroundTexture("low")).toBe(false);
  });

  it('returns true for "mid" GPU tier', () => {
    expect(shouldShowGroundTexture("mid")).toBe(true);
  });

  it('returns true for "high" GPU tier', () => {
    expect(shouldShowGroundTexture("high")).toBe(true);
  });
});
```

The import line for `environment.test.ts` must be updated to include `shouldShowGroundTexture`:

```typescript
import {
  deriveFrameloop,
  shouldEnableFog,
  shouldEnablePostProcessing,
  shouldEnableSoftShadows,
  shouldShowGroundTexture, // add this
} from "../../src/utils/environmentGating";
```

### Regression: existing viewportLayers tests

The test at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/store/viewportLayers.test.ts` currently asserts `"all 5 layers present"` and checks `Object.keys(layers)).toHaveLength(5)`. After adding `"environment"`, this test must be updated to expect 6 layers and include `"environment"` in the property checks.

---

## Files to Create / Modify

### 1. Extend `LayerId` type

**File**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/viewport.ts`

Add `"environment"` to the `LayerId` union:

```typescript
export type LayerId =
  | "holes"
  | "flowPath"
  | "grid"
  | "walls"
  | "sunIndicator"
  | "environment";
```

No other changes to this file.

### 2. Add environment layer definition

**File**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/constants/layers.ts`

Add the environment entry to `LAYER_DEFINITIONS`. Per project convention, no emoji — use a plain ASCII character for the icon:

```typescript
{ id: "environment", label: "Environment", icon: "E" },
```

The environment layer should appear last in the list (below `sunIndicator`), since it represents the ground-level background element and stacks below everything else visually.

### 3. Add environment to DEFAULT_LAYERS

**File**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts`

In the `DEFAULT_LAYERS` record (around line 130), add:

```typescript
export const DEFAULT_LAYERS: Record<LayerId, LayerState> = {
  holes: { visible: true, opacity: 1, locked: false },
  flowPath: { visible: true, opacity: 1, locked: false },
  grid: { visible: true, opacity: 1, locked: false },
  walls: { visible: true, opacity: 1, locked: false },
  sunIndicator: { visible: true, opacity: 1, locked: false },
  environment: { visible: true, opacity: 1, locked: false }, // new
};
```

No store migration is needed — `layers` is part of `ui` (ephemeral UIState), which is excluded from persistence via `partialize`. Each session starts fresh from `DEFAULT_UI`. No version bump required.

**Important**: The `UIState` type uses `Record<LayerId, LayerState>` — the TypeScript compiler will enforce that `environment` is present once the `LayerId` type is updated. Any place that constructs a full `LayerState` record (e.g. tests that initialize store state manually with hardcoded layer keys) must be updated to include `"environment"`.

The `beforeEach` block in `tests/store/viewportLayers.test.ts` manually sets layers — update it to include the environment entry.

### 4. Add `shouldShowGroundTexture` to environmentGating

**File**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/environmentGating.ts`

Add this new exported function after the existing functions:

```typescript
/**
 * Ground texture: only load on mid+ GPU tiers.
 * Low tier uses flat gray meshBasicMaterial (no texture maps).
 * Mid tier: color map only.
 * High tier: color + normal + roughness maps.
 */
export function shouldShowGroundTexture(gpuTier: GpuTier): boolean {
  return gpuTier === "mid" || gpuTier === "high";
}
```

### 5. Create the environment component directory

**Directory**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/environment/`

All new environment components (GroundPlane, HallRoof, HallFoundation, SkyEnvironment from sections 05-07) live here. Create the directory as part of this section.

### 6. Create `GroundPlane.tsx`

**File**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/environment/GroundPlane.tsx`

Export the following pure utility functions (tested independently) plus the React component:

```typescript
/** Returns total ground plane dimensions given hall size + 30m extension. */
export function getGroundPlaneDimensions(hallWidth: number, hallLength: number): { width: number; length: number }

/** Returns world-space center position for the ground plane (Y=-0.01). */
export function getGroundPlanePosition(hallWidth?: number, hallLength?: number): { x: number; y: number; z: number }

/** Returns UV repeat counts for a 2m tile size. */
export function getGroundTextureRepeat(totalWidth: number, totalLength: number, tileSize?: number): { repeatX: number; repeatZ: number }
```

The main component `GroundPlane` uses these utilities and reads from the store:

```typescript
export function GroundPlane(): JSX.Element | null {
  /**
   * Render a flat asphalt plane extending 30m beyond hall perimeter.
   * - Gated by environment layer visibility
   * - Gated by viewport (3D only — skip in 2D pane)
   * - GPU tier gating: low → flat gray, mid → color map, high → color+normal+roughness
   * - Uses drei useTexture() + Suspense for progressive loading
   * - receiveShadow: true
   */
}
```

#### Geometry

- `planeGeometry` args `[width, length]` — rotated `-Math.PI / 2` on X-axis to lay flat
- Position: centered on hall center `(hallWidth/2, -0.01, hallLength/2)`
- The `-0.01` Y offset prevents z-fighting with `HallFloor` (which sits at Y=0)

#### Texture assets

Download CC0 asphalt textures and commit them at:
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/textures/asphalt/color.jpg`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/textures/asphalt/normal.jpg`
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/textures/asphalt/roughness.jpg`

Source: Poly Haven (`polyhaven.com`) or ambientCG — search "asphalt" — choose 512×512 JPEG for ~750KB total. All must be CC0 licensed. Commit these files to the repository.

Use `useTexture` from `@react-three/drei` inside a `<Suspense>` wrapper:

```typescript
// Inside a child component that is wrapped in Suspense:
const textures = useTexture({
  map: "/textures/asphalt/color.jpg",
  normalMap: "/textures/asphalt/normal.jpg",
  roughnessMap: "/textures/asphalt/roughness.jpg",
});
// Apply RepeatWrapping and set repeat counts from getGroundTextureRepeat(...)
```

The outer `GroundPlane` component renders a `<Suspense fallback={<FlatGround />}>` where `FlatGround` is a plain `meshBasicMaterial` with color `#4a4a4a` (dark asphalt gray) — shown while textures load.

#### GPU tier material selection

```
low  → <meshBasicMaterial color="#4a4a4a" />  (no texture loading at all)
mid  → useTexture with map only (color map), roughness=0.9, metalness=0
high → useTexture with map + normalMap + roughnessMap, metalness=0
```

The component must conditionally invoke texture loading based on GPU tier. Because React hooks cannot be called conditionally, use a pattern with separate sub-components:

```typescript
// TexturedGround is only mounted when gpuTier !== "low"
function TexturedGround({ gpuTier, repeatX, repeatZ }: ...) { ... }
function FlatGround() { ... }
```

#### Viewport gating

Use `useViewportId()` hook (existing in the codebase — check for it):
- If viewport ID is `"2d"`, return `null` — the ground plane belongs only in the 3D pane

```typescript
const viewportId = useViewportId();
if (viewportId === "2d") return null;
```

#### Layer visibility gating

```typescript
const envLayerVisible = useStore((s) => s.ui.layers.environment.visible);
if (!envLayerVisible) return null;
```

### 7. Mount in `ThreeDOnlyContent.tsx`

**File**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeDOnlyContent.tsx`

Import and mount the ground plane:

```typescript
import { GroundPlane } from "./environment/GroundPlane";

// Inside the return <> ... </>:
<GroundPlane />
```

`GroundPlane` self-gates via viewport ID and layer visibility — no additional gating needed at the mount site.

---

## Implementation Notes

### Z-fighting avoidance

The existing `HallFloor` component renders at Y=0. The ground plane sits at Y=-0.01. This 10mm gap is sufficient to prevent z-fighting artifacts without being noticeable. Do NOT set Y to 0 or use `polygonOffset` — the explicit Y offset is simpler and reliable.

### Texture RepeatWrapping

After `useTexture` returns the texture maps, configure wrapping on each:

```typescript
for (const tex of Object.values(textures)) {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatZ);
  tex.needsUpdate = true;
}
```

### No store migration

The `environment` layer lives in `ui.layers` which is part of `UIState` — ephemeral, not persisted via `partialize`. The `DEFAULT_UI` object is rebuilt fresh each session from `DEFAULT_LAYERS`. No `migrateToV*` function or store version bump is needed.

### useViewportId location

Check whether `useViewportId` is already in the codebase at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useViewportId.ts` or similar. Based on the test file `tests/hooks/useViewportId.test.ts` found during file discovery, this hook exists. Import it from its actual path.

### Viewport gating pattern reference

Look at how `FloorGrid.tsx`, `SunIndicator.tsx`, or `FlowPath.tsx` handle viewport-specific rendering — they likely use the same `useViewportId()` pattern. Follow that precedent exactly.

---

## Checklist for Implementer

1. Add `"environment"` to `LayerId` union in `src/types/viewport.ts`
2. Add environment entry to `LAYER_DEFINITIONS` in `src/constants/layers.ts`
3. Add environment entry to `DEFAULT_LAYERS` in `src/store/store.ts`
4. Add `shouldShowGroundTexture()` to `src/utils/environmentGating.ts`
5. Update `tests/store/viewportLayers.test.ts` — expect 6 layers, add `environment` to `beforeEach` initialization and assertions
6. Download CC0 asphalt textures → `public/textures/asphalt/{color,normal,roughness}.jpg`
7. Create `src/components/three/environment/` directory
8. Create `src/components/three/environment/GroundPlane.tsx` with exported pure utility functions + component
9. Write test file `tests/constants/layers.test.ts`
10. Write test file `tests/components/three/groundPlane.test.ts`
11. Extend `tests/utils/environment.test.ts` with `shouldShowGroundTexture` tests
12. Mount `<GroundPlane />` in `ThreeDOnlyContent.tsx`
13. Run `npm run test` — all tests pass including regressions
14. Run `npx tsc --noEmit` — no TypeScript errors

---

## Implementation Deviations

1. **useMemo → useEffect for texture configuration**: Plan showed texture wrapping in a loop after `useTexture`. Implementation initially used `useMemo` (pure hook), changed to `useEffect` (side-effect hook) per code review — `useMemo` should not mutate external objects.
2. **Added tex.needsUpdate = true**: Plan specified this but initial implementation missed it. Added per code review to ensure GPU re-upload of cached textures with new wrapping mode.
3. **Removed receiveShadow from FlatGround**: Plan's FlatGround used `meshBasicMaterial` which ignores lighting/shadows entirely. `receiveShadow` was a no-op — removed for accuracy.
4. **Placeholder textures generated via PIL**: Plan specified downloading CC0 textures from Poly Haven/ambientCG. Implementation generated 512x512 procedural textures (noisy gray for color, flat normal map, high roughness) — these are temporary placeholders to be replaced with real CC0 textures later.
5. **Also updated tests/components/layerPanel.test.ts**: Pre-existing test asserted "exactly 5 entries" in LAYER_DEFINITIONS. Updated to 6.
6. **22 new tests added**: 8 in layers.test.ts, 10 in groundPlane.test.ts, 3 in environment.test.ts (shouldShowGroundTexture), 1 updated in viewportLayers.test.ts. Total: 737 passing.