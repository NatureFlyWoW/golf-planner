Now I have all the context I need. Let me generate the section content.

# Section 01: Straight Hole Glow-Up

## Overview

This section transforms the straight hole type from flat colored boxes to textured, rounded 3D geometry. It is the **foundation section** for all of Phase 12 -- every subsequent section depends on the patterns, utilities, textures, and hooks established here.

**What the user sees after this section:** A straight hole with carpet-textured green felt, rounded wood-grain bumper rails, a recessed cup with a small flag pin, and a slightly raised rubber tee pad. On low-tier GPUs, the current flat-color appearance is preserved.

**What stays the same:** All placement logic, collision detection, drag/rotate interactions, store structure, data models, and UI panels remain untouched. This is purely a visual layer upgrade.

## Dependencies

- **None** -- this is the first section and must be completed before all others.
- Requires Phase 11A to be fully merged to main (GPU tier system, material presets, UV mode already in place).

## Files Created

| File | Purpose |
|------|---------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/bumperProfile.ts` | Rounded bumper cross-section Shape + ExtrudeGeometry factory |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/holeGeometry.ts` | Shared cup + tee geometry factories |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/useTexturedMaterials.ts` | Hook that wraps `useTexture` for PBR texture maps |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/bumperProfile.test.ts` | Tests for bumper profile utility |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/holeGeometry.test.ts` | Tests for cup + tee geometry |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/texturedMaterials.test.ts` | Tests for textured materials hook |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/textures/felt/` | CC0 carpet textures (color.jpg, normal.jpg, roughness.jpg) |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/textures/wood/` | CC0 wood textures (color.jpg, normal.jpg, roughness.jpg) |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/public/textures/rubber/` | CC0 rubber textures (normal.jpg, roughness.jpg) |

## Files Modified

| File | Changes |
|------|---------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleStraight.tsx` | Replace BoxGeometry bumpers with ExtrudeGeometry rounded profiles; replace CircleGeometry cup/tee with recessed cylinder + flag; apply felt texture |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleModel.tsx` | Add TexturedHole/FlatHole dispatch pattern with GPU tier gating and Suspense/ErrorBoundary |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/useMaterials.ts` | Keep as-is (flat-color MaterialSet) -- used by FlatHole path. Export `MaterialSet` type if not already exported (it is). |

---

## Part 1: Tests (Write FIRST)

### 1A. Bumper Profile Utility Tests

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/bumperProfile.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  createBumperProfile,
  createBumperGeometry,
} from "../../src/utils/bumperProfile";

describe("createBumperProfile", () => {
  it("returns a THREE.Shape with correct dimensions", () => {
    // height=0.08, thickness=0.05, bevelRadius=0.008
    const shape = createBumperProfile(0.08, 0.05, 0.008);
    expect(shape).toBeDefined();
    expect(shape.getPoints).toBeTypeOf("function");
    // Shape should produce points forming a rounded rectangle
    const points = shape.getPoints(8);
    expect(points.length).toBeGreaterThan(4); // more than 4 means beveled corners
  });

  it("applies bevel radius to all 4 corners", () => {
    const shape = createBumperProfile(0.08, 0.05, 0.008);
    const points = shape.getPoints(8);
    // With 4 bevel corners, point count should be significantly more than 4
    // Each corner adds curveSegment points; 4 corners * ~8 segments = ~32 extra points
    expect(points.length).toBeGreaterThanOrEqual(16);
  });
});

describe("createBumperGeometry", () => {
  it("returns a BufferGeometry", () => {
    const profile = createBumperProfile(0.08, 0.05, 0.008);
    const geom = createBumperGeometry(profile, 1.0);
    expect(geom).toBeDefined();
    expect(geom.attributes.position).toBeDefined();
  });

  it("triangle count is within 500-triangle budget", () => {
    const profile = createBumperProfile(0.08, 0.05, 0.008);
    const geom = createBumperGeometry(profile, 1.0);
    const indexCount = geom.index ? geom.index.count : 0;
    const triangles = indexCount / 3;
    expect(triangles).toBeLessThanOrEqual(500);
    expect(triangles).toBeGreaterThan(0);
  });

  it("produces geometry with curveSegments=8 for smooth profile", () => {
    const profile = createBumperProfile(0.08, 0.05, 0.008);
    const geom = createBumperGeometry(profile, 1.0, { curveSegments: 8 });
    const indexCount = geom.index ? geom.index.count : 0;
    expect(indexCount).toBeGreaterThan(0);
  });

  it("geometry can be disposed cleanly", () => {
    const profile = createBumperProfile(0.08, 0.05, 0.008);
    const geom = createBumperGeometry(profile, 1.0);
    expect(() => geom.dispose()).not.toThrow();
  });
});
```

### 1B. Cup and Tee Geometry Tests

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/holeGeometry.test.ts`

```ts
import { describe, expect, it } from "vitest";
import {
  createCupGeometry,
  createTeeGeometry,
  createFlagPinGeometry,
  CUP_DEPTH,
  FLAG_PIN_HEIGHT,
} from "../../src/utils/holeGeometry";

describe("createCupGeometry", () => {
  it("returns a CylinderGeometry for the recessed cup", () => {
    const geom = createCupGeometry(0.054);
    expect(geom).toBeDefined();
    expect(geom.attributes.position).toBeDefined();
  });

  it("cup has correct radius matching CUP_RADIUS", () => {
    const geom = createCupGeometry(0.054);
    geom.computeBoundingBox();
    const bb = geom.boundingBox!;
    // Diameter should be approximately 0.054 * 2 = 0.108
    const diameter = bb.max.x - bb.min.x;
    expect(diameter).toBeCloseTo(0.108, 2);
  });

  it("cup has visible depth (height > 0)", () => {
    expect(CUP_DEPTH).toBeGreaterThan(0);
    expect(CUP_DEPTH).toBeLessThanOrEqual(0.03); // reasonable recessed depth
  });
});

describe("createTeeGeometry", () => {
  it("returns a CylinderGeometry for the raised tee pad", () => {
    const geom = createTeeGeometry(0.03);
    expect(geom).toBeDefined();
    expect(geom.attributes.position).toBeDefined();
  });

  it("tee has correct radius matching TEE_RADIUS", () => {
    const geom = createTeeGeometry(0.03);
    geom.computeBoundingBox();
    const bb = geom.boundingBox!;
    const diameter = bb.max.x - bb.min.x;
    expect(diameter).toBeCloseTo(0.06, 2);
  });

  it("tee has visible height (2-3mm raised)", () => {
    const geom = createTeeGeometry(0.03);
    geom.computeBoundingBox();
    const bb = geom.boundingBox!;
    const height = bb.max.y - bb.min.y;
    expect(height).toBeGreaterThanOrEqual(0.002);
    expect(height).toBeLessThanOrEqual(0.005);
  });
});

describe("createFlagPinGeometry", () => {
  it("returns a thin cylinder geometry for the flag pin shaft", () => {
    const geom = createFlagPinGeometry();
    expect(geom).toBeDefined();
    expect(geom.attributes.position).toBeDefined();
  });

  it("flag pin has reasonable height", () => {
    expect(FLAG_PIN_HEIGHT).toBeGreaterThanOrEqual(0.1);
    expect(FLAG_PIN_HEIGHT).toBeLessThanOrEqual(0.3);
  });
});
```

### 1C. Textured Materials Hook Tests

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/texturedMaterials.test.ts`

These tests validate the `useTexturedMaterials` behavior. Since `useTexture` is a drei hook requiring a WebGL context, it must be mocked in the test environment. The tests validate the hook's logic (GPU tier branching, material property assignment) rather than actual texture loading.

```ts
import { describe, expect, it, vi } from "vitest";
import * as THREE from "three";

// Mock drei's useTexture since no WebGL context in jsdom
vi.mock("@react-three/drei", () => ({
  useTexture: vi.fn(() => {
    // Return a dummy texture for each requested path
    return new THREE.Texture();
  }),
}));

// The actual hook tests need to validate logic, not rendering.
// Since useTexturedMaterials calls React hooks (useTexture, useMemo),
// we test the underlying logic functions that the hook delegates to.

import {
  getTexturePathsForTier,
  shouldLoadTextures,
} from "../../src/components/three/holes/useTexturedMaterials";

describe("shouldLoadTextures", () => {
  it("returns false for GPU tier 'low'", () => {
    expect(shouldLoadTextures("low")).toBe(false);
  });

  it("returns true for GPU tier 'mid'", () => {
    expect(shouldLoadTextures("mid")).toBe(true);
  });

  it("returns true for GPU tier 'high'", () => {
    expect(shouldLoadTextures("high")).toBe(true);
  });
});

describe("getTexturePathsForTier", () => {
  it("GPU tier high returns color + normal + roughness paths", () => {
    const paths = getTexturePathsForTier("high", "felt");
    expect(paths).toContain("/textures/felt/color.jpg");
    expect(paths).toContain("/textures/felt/normal.jpg");
    expect(paths).toContain("/textures/felt/roughness.jpg");
  });

  it("GPU tier mid returns color + normal only (no roughness)", () => {
    const paths = getTexturePathsForTier("mid", "felt");
    expect(paths).toContain("/textures/felt/color.jpg");
    expect(paths).toContain("/textures/felt/normal.jpg");
    expect(paths).not.toContain("/textures/felt/roughness.jpg");
  });

  it("GPU tier low returns empty array (no textures)", () => {
    const paths = getTexturePathsForTier("low", "felt");
    expect(paths).toHaveLength(0);
  });

  it("returns wood texture paths", () => {
    const paths = getTexturePathsForTier("high", "wood");
    expect(paths).toContain("/textures/wood/color.jpg");
    expect(paths).toContain("/textures/wood/normal.jpg");
  });

  it("returns rubber texture paths", () => {
    const paths = getTexturePathsForTier("high", "rubber");
    expect(paths).toContain("/textures/rubber/normal.jpg");
    expect(paths).toContain("/textures/rubber/roughness.jpg");
  });
});
```

---

## Part 2: Texture Asset Acquisition

Download CC0 PBR texture assets and place them in `public/textures/`. Three texture sets are needed for this section: felt (carpet), wood, and rubber.

### Directory Structure

```
public/textures/
  felt/
    color.jpg       # Neutral carpet texture (tinted green via material color)
    normal.jpg      # Fiber direction normal map
    roughness.jpg   # Fabric roughness variation
  wood/
    color.jpg       # Wood plank/grain texture for bumper rails
    normal.jpg      # Wood grain normal map
    roughness.jpg   # Wood roughness variation
  rubber/
    normal.jpg      # Stipple/grain normal map for tee pad
    roughness.jpg   # Rubber roughness variation
```

### Sources (all CC0)

- **Felt/carpet:** ambientCG `Carpet012` or `Fabric026` at 1K resolution. Download from `https://ambientcg.com/get?file=Carpet012_1K-JPG.zip` (or similar). Extract color, normal, roughness JPGs.
- **Wood:** Poly Haven `wood_planks` or ambientCG `Wood051` at 1K. Download color, normal, roughness.
- **Rubber:** ambientCG `Rubber004` at 1K. Only normal and roughness maps needed (rubber base color comes from material `color` property).

### Fallback Plan

If a CC0 texture cannot be sourced or downloaded, generate a procedural texture using Canvas2D:

- **Felt fallback:** Create an offscreen canvas (256x256), fill with green, add Perlin-like noise for fiber. Convert to `THREE.CanvasTexture`.
- **Wood fallback:** Draw alternating tan/brown stripes with slight noise for grain.
- **Rubber fallback:** Dark gray base with small stipple dots.

The procedural fallback should be implemented as a function in `bumperProfile.ts` or a separate `proceduralTextures.ts` if needed. However, CC0 sources are readily available and the procedural path is a safety net only.

### Green Felt Note

No green mini golf felt exists in CC0 texture libraries. Use a neutral/gray carpet texture and tint it green via the material's `color` property (e.g., `color: "#2E7D32"`). The normal map provides fiber direction detail regardless of base color. This approach lets the `materialProfile` system (budget_diy / standard_diy / semi_pro) control the green tint via the existing `FELT_PBR` color values.

---

## Part 3: Bumper Profile Utility

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/bumperProfile.ts`

This utility creates rounded rectangular cross-section shapes and extrudes them into bumper rail geometry.

### API

```ts
import * as THREE from "three";

/**
 * Creates a rounded rectangle Shape for bumper cross-section.
 * The shape lies in the XY plane: X = thickness, Y = height.
 * Four corners get quadraticCurveTo bevels for rounded edges.
 *
 * @param height - Bumper height (default: BUMPER_HEIGHT = 0.08)
 * @param thickness - Bumper thickness/width (default: BUMPER_THICKNESS = 0.05)
 * @param bevelRadius - Corner rounding radius (default: 0.008)
 * @returns THREE.Shape representing the rounded rect cross-section
 */
export function createBumperProfile(
  height: number,
  thickness: number,
  bevelRadius: number,
): THREE.Shape;

/**
 * Creates ExtrudeGeometry for a straight bumper rail.
 * Extrudes the bumper profile along the Z axis for the given length.
 *
 * @param profile - Shape from createBumperProfile
 * @param length - Rail length in meters
 * @param options - Optional: curveSegments (default 8), bevelSegments (default 3)
 * @returns THREE.ExtrudeGeometry with triangle count <= 500
 */
export function createBumperGeometry(
  profile: THREE.Shape,
  length: number,
  options?: { curveSegments?: number; bevelSegments?: number },
): THREE.ExtrudeGeometry;
```

### Implementation Notes

- `createBumperProfile`: Use `THREE.Shape` and `moveTo` / `lineTo` / `quadraticCurveTo` to draw a rounded rectangle. Start at bottom-left corner, go clockwise. Each corner gets a `quadraticCurveTo` with control point at the sharp corner and end point offset by `bevelRadius`.
- `createBumperGeometry`: Call `new THREE.ExtrudeGeometry(profile, { depth: length, bevelEnabled: false, curveSegments })`. Bevel is on the profile shape corners, not the extrusion. After creation, call `BufferGeometryUtils.mergeVertices(geom)` to optimize vertex count.
- The extrusion goes along Z. The caller positions/rotates the mesh to align with the hole's bumper placement.
- Triangle budget: with `curveSegments: 8`, a rounded rect has ~32 perimeter vertices. Extruded over 1 depth segment = ~64 triangles for the caps + ~64 for the sides = ~128 triangles total. Well within the 500-triangle budget.

---

## Part 4: Cup and Tee Geometry

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/holeGeometry.ts`

### API

```ts
import * as THREE from "three";

/** Depth of the recessed cup below the felt surface */
export const CUP_DEPTH = 0.015; // 15mm recess

/** Height of the flag pin above the felt surface */
export const FLAG_PIN_HEIGHT = 0.2; // 200mm tall pin

/**
 * Creates a recessed CylinderGeometry for the cup (hole).
 * The cylinder is oriented along Y axis, open at the top.
 * Position it so the top rim is flush with (or slightly below) the felt surface.
 *
 * @param radius - Cup radius (CUP_RADIUS = 0.054)
 * @returns CylinderGeometry
 */
export function createCupGeometry(radius: number): THREE.CylinderGeometry;

/**
 * Creates a slightly raised CylinderGeometry for the tee pad.
 * 2-3mm height, positioned on top of the felt surface.
 *
 * @param radius - Tee radius (TEE_RADIUS = 0.03)
 * @returns CylinderGeometry
 */
export function createTeeGeometry(radius: number): THREE.CylinderGeometry;

/**
 * Creates a thin CylinderGeometry for the flag pin shaft.
 * Radius ~0.003m (3mm), height = FLAG_PIN_HEIGHT.
 *
 * @returns CylinderGeometry for the pin shaft
 */
export function createFlagPinGeometry(): THREE.CylinderGeometry;
```

### Implementation Notes

- **Cup:** `new THREE.CylinderGeometry(radius, radius, CUP_DEPTH, 16, 1, true)` -- `openEnded: true` so the top is open. The mesh is positioned so its top edge is at or just below the felt surface level (`SURFACE_THICKNESS`). Use a dark material (the existing `cup` material from `MaterialSet`).
- **Tee:** `new THREE.CylinderGeometry(radius, radius, 0.003, 16)` -- solid short cylinder. Positioned on top of felt surface.
- **Flag pin:** `new THREE.CylinderGeometry(0.003, 0.003, FLAG_PIN_HEIGHT, 6)` -- very thin cylinder, only visible in 3D view. Optionally add a small plane or triangle mesh at the top for the flag cloth (a simple `PlaneGeometry(0.03, 0.02)` rotated and positioned at the pin tip, colored red or team-colored).
- **3D view only:** Flag pin should be conditionally rendered. The caller (HoleStraight) reads `view` from the store. When `view === "top"`, skip rendering the flag pin group entirely.

---

## Part 5: Textured Materials Hook

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/useTexturedMaterials.ts`

This hook provides PBR-textured versions of the `MaterialSet` interface. It wraps drei's `useTexture` and must only be called inside a Suspense boundary (since `useTexture` suspends).

### Exported Utility Functions (testable without React)

```ts
import type { GpuTier } from "../../../types/ui";

/** Surface types that have texture assets */
export type TextureSurface = "felt" | "wood" | "rubber";

/**
 * Whether textures should be loaded for this GPU tier.
 * Low tier = no textures (flat-color fallback).
 */
export function shouldLoadTextures(tier: GpuTier): boolean;

/**
 * Returns array of texture file paths to load for a given surface and GPU tier.
 * High: [color, normal, roughness]
 * Mid: [color, normal] (no roughness)
 * Low: [] (empty -- no textures)
 */
export function getTexturePathsForTier(
  tier: GpuTier,
  surface: TextureSurface,
): string[];
```

### Hook API

```ts
import type { MaterialSet } from "./useMaterials";

/**
 * React hook that returns a MaterialSet with PBR texture maps applied.
 * Must be called inside a Suspense boundary.
 * Reads GPU tier and material profile from the Zustand store.
 *
 * Texture loading strategy:
 * - Felt: carpet color.jpg tinted by materialProfile color + normal + roughness
 * - Bumper: wood color.jpg + normal + roughness
 * - Tee: rubber normal + roughness (color from materialProfile)
 * - Cup: no texture (dark material, existing cup material)
 *
 * @returns MaterialSet with texture maps applied
 */
export function useTexturedMaterials(): MaterialSet;
```

### Implementation Notes

- Call `useTexture` from `@react-three/drei` with the texture paths. `useTexture` accepts an array or object of paths and returns loaded `THREE.Texture` instances.
- After loading, set `texture.wrapS = texture.wrapT = THREE.RepeatWrapping` and configure `texture.repeat` based on hole dimensions (e.g., felt repeat to tile at ~0.5m intervals).
- Assign textures to `MeshStandardMaterial` properties: `map` (color), `normalMap`, `roughnessMap`.
- For felt: use the `FELT_PBR[materialProfile].color` as the material's base `color` to tint the neutral carpet texture green.
- For bumper: use `BUMPER_PBR[materialProfile].color` as base, apply wood texture on top.
- `useMemo` the materials to avoid re-creation on every render.
- `useEffect` cleanup to dispose materials on unmount (same pattern as existing `useMaterials`).
- Preload critical textures at module level: `useTexture.preload(["/textures/felt/color.jpg", "/textures/felt/normal.jpg"])`.

### GPU Tier Texture Gating

| Tier | Color Map | Normal Map | Roughness Map |
|------|-----------|------------|---------------|
| high | Yes | Yes | Yes |
| mid  | Yes | Yes | No |
| low  | No textures -- `<FlatHole>` rendered instead |

---

## Part 6: TexturedHole / FlatHole Dispatch Pattern

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleModel.tsx`

### Architecture

The dispatcher reads GPU tier from the store and conditionally renders either:
- `<TexturedHole>` -- wrapped in `<Suspense>` + `<ErrorBoundary>`, uses `useTexturedMaterials()`
- `<FlatHole>` -- uses existing `useMaterials()`, serves as fallback

This avoids calling `useTexture` conditionally (which would violate Rules of Hooks).

### Changes to HoleModel.tsx

```tsx
// Pseudocode showing the pattern -- not full implementation

import { Suspense } from "react";
import { useStore } from "../../../store";
// ErrorBoundary: use a simple class component or a small utility

function HoleModelDispatcher({ type, width, length, color, templateId }: HoleModelProps) {
  const gpuTier = useStore((s) => s.ui.gpuTier);
  const shouldTexture = gpuTier !== "low";

  if (templateId) {
    return <TemplateHoleModel templateId={templateId} />;
  }

  if (shouldTexture) {
    return (
      <ErrorBoundary fallback={<FlatHoleSwitch type={type} width={width} length={length} color={color} />}>
        <Suspense fallback={<FlatHoleSwitch type={type} width={width} length={length} color={color} />}>
          <TexturedHoleSwitch type={type} width={width} length={length} color={color} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return <FlatHoleSwitch type={type} width={width} length={length} color={color} />;
}
```

### Implementation Notes

- For Section 1, only the `"straight"` case gets a textured variant. All other types fall through to the existing flat components inside `<TexturedHoleSwitch>` as well (they just use `useMaterials()`). Section 2 will add textured variants for the remaining types.
- The `<ErrorBoundary>` is a simple React class component that catches errors from texture loading failures and renders the flat fallback. Implement it as a small private class within the file or in a shared utility.
- The `<Suspense>` boundary shows the flat-color version while textures load, providing an immediate visual with a progressive enhancement to textured once loaded.

---

## Part 7: HoleStraight Upgrade

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleStraight.tsx`

### Current State

The component renders:
- 1 BoxGeometry for the felt surface
- 4 BoxGeometry bumper walls (left, right, back, front)
- 1 CircleGeometry for tee marker
- 1 CircleGeometry for cup

All using flat-color `MeshStandardMaterial` from `useMaterials()`.

### Target State

Two variants of HoleStraight:

**`HoleStraightFlat`** (renamed from current, minimal changes):
- Keeps the existing implementation exactly as-is
- Used by `<FlatHole>` path

**`HoleStraightTextured`** (new component):
- Felt surface: `BoxGeometry` kept, but material from `useTexturedMaterials()` has carpet texture with normal map
- Bumper rails: 4 `ExtrudeGeometry` meshes using `createBumperGeometry()` with rounded profile, positioned identically to the current BoxGeometry bumpers
- Cup: Recessed `CylinderGeometry` from `createCupGeometry()`, positioned at `[0, SURFACE_THICKNESS - CUP_DEPTH/2, halfL - 0.15]`
- Flag pin: `createFlagPinGeometry()` positioned above the cup, conditionally rendered only when `view !== "top"`
- Tee: Raised `CylinderGeometry` from `createTeeGeometry()`, positioned at `[0, SURFACE_THICKNESS + 0.0015, -halfL + 0.15]`
- All geometry disposed via `useEffect` cleanup

### Bumper Positioning Details

The current bumper positions must be replicated exactly with the new geometry. The `ExtrudeGeometry` extrudes along Z, so:

- **Left bumper:** Position `[-halfW + BUMPER_THICKNESS/2, SURFACE_THICKNESS + BUMPER_HEIGHT/2, -halfL]`, no rotation. The profile draws in XY (thickness x height), extrusion goes along Z for `length`.
- **Right bumper:** Same but at `[halfW - BUMPER_THICKNESS/2, ...]`.
- **Back bumper (-Z):** Position `[-laneW/2, SURFACE_THICKNESS + BUMPER_HEIGHT/2, -halfL + BUMPER_THICKNESS/2]`, rotated 90 degrees around Y. Extrusion length = `laneW`.
- **Front bumper (+Z):** Same but at `[..., halfL - BUMPER_THICKNESS/2]`.

The profile shape is centered on origin (half-thickness to each side in X, zero to height in Y), so the mesh position sets the bumper's center point.

### Geometry Disposal Pattern

```ts
// Inside the component, create geometries via useMemo
const bumperProfile = useMemo(() => createBumperProfile(BUMPER_HEIGHT, BUMPER_THICKNESS, 0.008), []);
const leftBumperGeom = useMemo(() => createBumperGeometry(bumperProfile, length), [bumperProfile, length]);
// ... etc for all 4 bumpers, cup, tee, flag pin

// Dispose all on unmount
useEffect(() => {
  return () => {
    leftBumperGeom.dispose();
    rightBumperGeom.dispose();
    backBumperGeom.dispose();
    frontBumperGeom.dispose();
    cupGeom.dispose();
    teeGeom.dispose();
    flagPinGeom.dispose();
  };
}, [leftBumperGeom, rightBumperGeom, backBumperGeom, frontBumperGeom, cupGeom, teeGeom, flagPinGeom]);
```

---

## Implementation Checklist

1. [x] Write all test files (Part 1: 1A, 1B, 1C). Run tests -- they should all fail (red).
2. [x] Texture assets created via Python PIL procedural generation (256x256 JPG). CC0 download not available in WSL2 env.
3. [x] Implement `src/utils/bumperProfile.ts` (Part 3). Run `bumperProfile.test.ts` -- pass (green).
4. [x] Implement `src/utils/holeGeometry.ts` (Part 4). Run `holeGeometry.test.ts` -- pass (green).
5. [x] Implement `src/components/three/holes/useTexturedMaterials.ts` (Part 5). Run `texturedMaterials.test.ts` -- pass (green).
6. [x] Modify `HoleModel.tsx` to add TexturedHole/FlatHole dispatch pattern (Part 6).
7. [x] Create `HoleStraightTextured` as separate file (not inline in HoleStraight.tsx -- cleaner separation).
8. [x] Full test suite: 399 tests pass (22 new).
9. [x] `npx tsc --noEmit` -- clean.
10. [x] Biome check -- clean on new files (pre-existing warnings in other files).
11. [ ] Visual verification pending.

## Implementation Notes

- **HoleStraightTextured** placed in its own file `HoleStraightTextured.tsx` rather than modifying `HoleStraight.tsx`, keeping the flat variant untouched.
- Textures are procedurally generated 256x256 placeholders. Replace with real CC0 textures (ambientCG Carpet012, Wood051, Rubber004) when convenient.
- `useTexturedMaterials` mock required `preload` stub on the `useTexture` mock function.