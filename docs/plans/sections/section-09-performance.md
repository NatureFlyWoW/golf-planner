# Section 09: Performance + GPU Tier Gating

## Overview

This section adds performance optimizations across the 3D hole rendering pipeline. It covers three areas:

1. **GPU tier texture gating** -- a utility that determines which texture maps to load based on GPU tier (`high`: color + normal + roughness; `mid`: color + normal only; `low`: flat-color materials with no textures).
2. **Top-down view optimization** -- when the camera is in top-down mode, skip normal/roughness maps (flat shading looks identical from above), hide flag pin meshes, and use simplified box bumper outlines instead of rounded profiles.
3. **Geometry optimization** -- apply `mergeVertices()` to all `ExtrudeGeometry` output, verify triangle counts per hole type are within budget, and ensure geometry disposal on all components.

**What the user sees after this section:** No visible changes in default 3D view -- this section makes the existing rendering more efficient. In top-down view, the rendering is faster with simplified geometry. Low-tier GPU devices get flat-color materials (same as before, but now with explicit gating infrastructure).

## Dependencies

- **ALL sections 01-08 must be complete** before this section executes. This section touches optimization across multiple files modified by earlier sections.
- **Existing GPU tier system** (`src/hooks/useGpuTier.ts`) provides `GpuTier` type and store integration.
- **Existing environment gating** (`src/utils/environmentGating.ts`) provides patterns for pure gating functions.
- **Store view mode** (`src/types/ui.ts`) provides `ViewMode = "top" | "3d"`.

## Files to Create or Modify

| File | Action |
|------|--------|
| `tests/hooks/gpuTierTextures.test.ts` | **Create** -- GPU tier texture gating tests |
| `tests/components/holes/topDownView.test.ts` | **Create** -- top-down view optimization tests |
| `tests/utils/geometryOptimization.test.ts` | **Create** -- mergeVertices and triangle budget tests |
| `src/utils/textureGating.ts` | **Create** -- pure functions for GPU tier texture decisions |
| `src/utils/topDownGating.ts` | **Create** -- pure functions for top-down view simplification |
| `src/components/three/holes/FlagPin.tsx` | **Create** -- flag pin component with top-down visibility |
| `src/components/three/holes/useMaterials.ts` | **Modify** -- integrate texture gating metadata |
| `src/components/three/holes/HoleRamp.tsx` | **Modify** -- add mergeVertices to ExtrudeGeometry |
| `src/utils/segmentGeometry.ts` | **Modify** -- add mergeVertices to all geometry output |

All paths relative to `/mnt/c/Users/Caus/Golf_Plan/golf-planner/`.

## Existing Code Context

### GPU Tier System (already exists)
`useGpuTier()` hook detects GPU and stores result as `"low" | "mid" | "high"` in `useStore(s => s.ui.gpuTier)`. Already used for gating postprocessing effects.

### View Mode (already exists)
Store `ui.view` is `"top" | "3d"`. Multiple components already read this.

### ExtrudeGeometry Usage
`HoleRamp.tsx` uses `ExtrudeGeometry` for ramp slopes. `segmentGeometry.ts` uses various geometry types. `mergeVertices()` is beneficial on all types.

---

## Tests (Write First)

### Test File 1: `tests/hooks/gpuTierTextures.test.ts`

```
Tests to implement:

1. "GPU tier 'low' returns no texture maps"
   - Call getTextureMapSet("low")
   - Assert color, normal, roughness are all false

2. "GPU tier 'mid' returns color + normal only (no roughness)"
   - Call getTextureMapSet("mid")
   - Assert color true, normal true, roughness false

3. "GPU tier 'high' returns all texture maps"
   - Call getTextureMapSet("high")
   - Assert color true, normal true, roughness true

4. "top-down view disables normal map even on 'high' tier"
   - Call getTextureMapSet("high", true)
   - Assert color true, normal false, roughness false

5. "top-down view disables normal map on 'mid' tier"
   - Call getTextureMapSet("mid", true)
   - Assert color true, normal false, roughness false

6. "top-down view on 'low' tier still returns no maps"
   - Call getTextureMapSet("low", true)
   - Assert all false
```

### Test File 2: `tests/components/holes/topDownView.test.ts`

```
Tests to implement:

1. "shouldShowFlagPin returns true in 3D mode"

2. "shouldShowFlagPin returns false in top-down mode"

3. "shouldUseSimpleBumpers returns false in 3D mode"

4. "shouldUseSimpleBumpers returns true in top-down mode"

5. "shouldSkipNormalMaps returns false in 3D mode"

6. "shouldSkipNormalMaps returns true in top-down mode"
```

### Test File 3: `tests/utils/geometryOptimization.test.ts`

```
Tests to implement:

1. "mergeVertices reduces vertex count on ExtrudeGeometry"
   - Create ExtrudeGeometry with triangle cross-section
   - Apply mergeVertices
   - Assert vertex count reduced or equal

2. "mergeVertices on BoxGeometry is a no-op or reduces slightly"
   - Create BoxGeometry, apply mergeVertices
   - Assert vertex count does not increase

3. "straight segment total triangles < 500"
   - Call createSegmentGeometries("straight_1m", 0.6)
   - Sum triangle counts across felt + bumperLeft + bumperRight
   - Assert total < 500

4. "curve segment total triangles < 2000"
   - Call createSegmentGeometries("curve_90_left", 0.6)
   - Assert total < 2000

5. "complex segment (s_curve) total triangles < 4000"
   - Assert total < 4000

6. "18-hole course total triangles stays under 50K"
   - Worst case: 18 × s_curve segment triangle count
   - Assert total < 50,000

7. "bumper rail triangle count <= 500 per segment"
   - For each segment spec: straight, curve, s_curve, u_turn, chicane
   - Assert bumperLeft and bumperRight each <= 500
```

Helper function for triangle counting:
```typescript
function getTriangleCount(geom: THREE.BufferGeometry): number {
  if (geom.index) return geom.index.count / 3;
  const posAttr = geom.getAttribute("position");
  return posAttr ? posAttr.count / 3 : 0;
}
```

---

## Implementation Details

### 1. Texture Gating Utility (`src/utils/textureGating.ts`)

Pure function determining which texture maps to load.

```typescript
import type { GpuTier } from "../types/ui";

export type TextureMapSet = {
  color: boolean;
  normal: boolean;
  roughness: boolean;
};

/**
 * Determines which texture maps to load based on GPU tier.
 * When isTopDown is true, normal and roughness maps are skipped.
 *
 * - high: color + normal + roughness
 * - mid: color + normal (no roughness)
 * - low: no textures
 */
export function getTextureMapSet(gpuTier: GpuTier, isTopDown = false): TextureMapSet {
  if (gpuTier === "low") {
    return { color: false, normal: false, roughness: false };
  }
  if (isTopDown) {
    return { color: true, normal: false, roughness: false };
  }
  if (gpuTier === "mid") {
    return { color: true, normal: true, roughness: false };
  }
  return { color: true, normal: true, roughness: true };
}
```

### 2. Top-Down Gating Utility (`src/utils/topDownGating.ts`)

Pure functions for top-down view simplification.

```typescript
import type { ViewMode } from "../types/ui";

/** Flag pins invisible from directly above. Hide in top-down. */
export function shouldShowFlagPin(view: ViewMode): boolean {
  return view === "3d";
}

/** Rounded bumper profiles look identical to boxes from above. Use cheaper geometry. */
export function shouldUseSimpleBumpers(view: ViewMode): boolean {
  return view === "top";
}

/** Normal maps add no visible detail from orthographic top-down. Skip them. */
export function shouldSkipNormalMaps(view: ViewMode): boolean {
  return view === "top";
}
```

### 3. useMaterials Integration

Modify `src/components/three/holes/useMaterials.ts` to expose texture gating metadata:

```typescript
import { getTextureMapSet, type TextureMapSet } from "../../../utils/textureGating";

// Inside the hook, add:
const view = useStore((s) => s.ui.view);
const gpuTier = useStore((s) => s.ui.gpuTier);
const isTopDown = view === "top";
const textureMapSet = useMemo(() => getTextureMapSet(gpuTier, isTopDown), [gpuTier, isTopDown]);

// Extend MaterialSet:
export type MaterialSet = {
  felt: THREE.MeshStandardMaterial;
  bumper: THREE.MeshStandardMaterial;
  tee: THREE.MeshStandardMaterial;
  cup: THREE.MeshStandardMaterial;
  textureMapSet: TextureMapSet;
  isTopDown: boolean;
};
```

This does not change existing material behavior. It adds metadata for future texture-loading code.

### 4. FlagPin Component (`src/components/three/holes/FlagPin.tsx`)

Minimal flag pin with top-down visibility gating:

```typescript
import { useStore } from "../../../store";
import { shouldShowFlagPin } from "../../../utils/topDownGating";

type FlagPinProps = { position: [number, number, number] };

export function FlagPin({ position }: FlagPinProps) {
  const view = useStore((s) => s.ui.view);
  if (!shouldShowFlagPin(view)) return null;

  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.003, 0.003, 0.1, 6]} />
        <meshStandardMaterial color="#CCCCCC" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0.015, 0.09, 0]}>
        <planeGeometry args={[0.03, 0.02]} />
        <meshStandardMaterial color="#FF0000" side={2} />
      </mesh>
    </group>
  );
}
```

### 5. HoleRamp mergeVertices

Modify `src/components/three/holes/HoleRamp.tsx`:

```typescript
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// In rampUpGeo and rampDownGeo useMemo, wrap the return:
const rampUpGeo = useMemo(() => {
  // ... existing shape + ExtrudeGeometry creation ...
  return mergeVertices(geom);
}, [laneW]);
```

### 6. Segment Geometry mergeVertices

Modify `src/utils/segmentGeometry.ts` -- at the end of `createSegmentGeometries()`, apply `mergeVertices` to all returned geometry:

```typescript
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// At end of createSegmentGeometries:
return {
  felt: mergeVertices(result.felt),
  bumperLeft: mergeVertices(result.bumperLeft),
  bumperRight: mergeVertices(result.bumperRight),
};
```

Note: `segmentGeometry.ts` already imports from `BufferGeometryUtils.js` -- just add `mergeVertices` to the existing import.

## Implementation Checklist

1. Write tests in `tests/hooks/gpuTierTextures.test.ts` (fail initially)
2. Write tests in `tests/components/holes/topDownView.test.ts` (fail initially)
3. Write tests in `tests/utils/geometryOptimization.test.ts` (fail initially)
4. Create `src/utils/textureGating.ts` with `getTextureMapSet()`
5. Create `src/utils/topDownGating.ts` with `shouldShowFlagPin()`, `shouldUseSimpleBumpers()`, `shouldSkipNormalMaps()`
6. Create `src/components/three/holes/FlagPin.tsx` with top-down visibility gating
7. Modify `src/components/three/holes/useMaterials.ts` to expose `textureMapSet` and `isTopDown`
8. Modify `src/components/three/holes/HoleRamp.tsx` to apply `mergeVertices()` on ExtrudeGeometry
9. Modify `src/utils/segmentGeometry.ts` to apply `mergeVertices()` on all returned geometry
10. Run `npx tsc --noEmit` -- no type errors
11. Run `npm test` -- all tests pass (existing + new)
12. Verify triangle count budgets pass

## Notes for Implementer

- **`mergeVertices` import**: `segmentGeometry.ts` already imports `mergeGeometries` from `three/examples/jsm/utils/BufferGeometryUtils.js`. Add `mergeVertices` to the same destructured import.
- **No breaking changes**: All modifications are additive. Existing material behavior unchanged.
- **Top-down view state**: The store uses `"top"` (not `"top-down"`) for orthographic mode. Type is `ViewMode = "top" | "3d"`.
- **Biome formatting**: Use tabs for indentation.
- **Geometry disposal**: `mergeVertices()` returns a new geometry. Inside `useMemo`, the original goes out of scope for GC. For `segmentGeometry.ts`, the caller disposes the returned geometry.
- **Triangle budget context**: Current geometry uses `BoxGeometry` (~12 tris per box) and `RingGeometry`. The 50K budget for 18 holes is conservative.
