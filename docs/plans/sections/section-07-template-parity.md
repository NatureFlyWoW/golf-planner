# Section 7: Template Hole Visual Parity

## Implementation Status: COMPLETE

**Files modified:**
- `src/utils/segmentGeometry.ts` — Replaced BoxGeometry bumpers with ExtrudeGeometry (rounded profiles) for straight and chicane segments. Curve segments keep RingGeometry (pragmatic approach). Added import of `createBumperProfile`/`createBumperGeometry` from `bumperProfile.ts`, added `BEVEL_RADIUS = 0.008`.
- `src/components/three/holes/TemplateHoleModel.tsx` — Migrated from singleton material imports (`shared.ts`) to `useMaterials()` hook. Replaced inline cup/tee with shared `<Cup>` and `<TeePad>` components. Added geometry disposal `useEffect`. Removed `uvMode` store selector (handled internally by `useMaterials`).
- `tests/utils/segmentGeometry.test.ts` — Added 4 new tests: ExtrudeGeometry vertex count for straight/chicane, all 11 types > 24 vertices, triangle budget.
- `tests/components/holes/templateHole.test.ts` — Created with 6 source-level migration verification tests.

**Deviations from plan:**
- Curve segment bumpers kept as RingGeometry per plan's pragmatic recommendation (not upgraded to arc-following ExtrudeGeometry)
- No separate `useMaterials` behavioral tests added (already covered by existing `texturedMaterials.test.ts`)

**Test count:** 461 tests across 42 files (up from 451)

---

## Overview

This section upgrades custom-built holes from the Hole Builder so they achieve visual parity with the upgraded legacy hole types. Template holes are rendered by `TemplateHoleModel.tsx` using geometry produced by `segmentGeometry.ts`. Currently, both files use flat `BoxGeometry` bumpers and singleton materials imported directly from `shared.ts`, bypassing the `useMaterials()` hook entirely. This means template holes do not respond to the `materialProfile` budget setting and look visually inferior to legacy holes after Sections 1-2 upgrade those.

This section has two major goals:

1. **Upgrade `segmentGeometry.ts`** to produce rounded `ExtrudeGeometry` bumpers (matching Section 1's bumper profile) instead of flat `BoxGeometry` for all 11 segment types.
2. **Migrate `TemplateHoleModel.tsx`** from singleton material imports (`shared.ts`) to the `useMaterials()` hook, so template holes respect the `materialProfile` setting and participate in the textured/flat rendering tier system.

## Dependencies

- **Section 1 (Straight Hole Glow-Up):** Provides `src/utils/bumperProfile.ts` with `createBumperProfile()` and `createBumperGeometry()`. Also provides `useTexturedMaterials()` hook and the `TexturedHole`/`FlatHole` rendering pattern.
- **Section 2 (Shared Geometry Library):** Provides shared `<Cup>` and `<TeePad>` R3F components, and `<BumperRail>` component. Also provides `useMaterials()` hook refinements.

These must be completed before this section begins.

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/utils/segmentGeometry.ts` | **Modify** | Replace BoxGeometry bumpers with ExtrudeGeometry using rounded profiles |
| `src/components/three/holes/TemplateHoleModel.tsx` | **Modify** | Migrate from singleton materials to `useMaterials()` hook; upgrade cup/tee to shared components |
| `tests/utils/segmentGeometry.test.ts` | **Modify** | Add new tests for rounded bumper profiles |
| `tests/components/holes/templateHole.test.ts` | **Create** | New test file for TemplateHoleModel material migration |

## Tests (Write First)

### File: `tests/utils/segmentGeometry.test.ts`

Add the following tests to the existing test file. These validate that bumpers now use `ExtrudeGeometry` instead of `BoxGeometry`, while preserving all existing dimension and positioning tests.

```
# New tests to ADD to the existing describe block:

# Test: straight segment bumpers use ExtrudeGeometry (not BoxGeometry)
#   Call createSegmentGeometries("straight_1m", 0.6)
#   Verify that the bumperLeft geometry has a non-trivial vertex count
#   (ExtrudeGeometry with rounded profile produces more vertices than BoxGeometry's 24)
#   Assert bumperLeft position attribute count > 24
#   Assert bumperRight position attribute count > 24

# Test: curve segment bumpers follow arc path
#   Call createSegmentGeometries("curve_90_left", 0.6)
#   Verify bumperLeft and bumperRight have vertices
#   Verify bounding box of inner bumper is narrower than outer bumper
#   (This validates the arc-following extrude path, not flat ring geometry)

# Test: complex segment (u_turn) bumpers render correctly with rounded profiles
#   Call createSegmentGeometries("u_turn", 0.6)
#   Verify bumperLeft and bumperRight have vertices
#   Verify bumper vertex count > 24 (not BoxGeometry)

# Test: complex segment (s_curve) bumpers render correctly with rounded profiles
#   Call createSegmentGeometries("s_curve", 0.6)
#   Verify bumperLeft and bumperRight have vertices
#   Verify bumper vertex count > 24

# Test: complex segment (chicane) bumpers render correctly with rounded profiles
#   Call createSegmentGeometries("chicane", 0.6)
#   Verify bumperLeft and bumperRight have vertices
#   Verify bumper vertex count > 24

# Test: all 11 segment types produce valid {felt, bumperLeft, bumperRight} with rounded profiles
#   Loop through all 11 SegmentSpecIds
#   For each: call createSegmentGeometries(specId, 0.6)
#   Assert all three geometry keys exist
#   Assert bumperLeft and bumperRight vertex counts > 24

# Test: bumper triangle count stays within budget (<=500 per rail)
#   Call createSegmentGeometries("straight_1m", 0.6)
#   Compute triangle count from index buffer or position attribute
#   Assert bumperLeft triangles <= 500
#   Assert bumperRight triangles <= 500
```

### File: `tests/components/holes/templateHole.test.ts`

Create this new test file to validate the material migration and component upgrades.

```
# Template material migration tests

# Test: TemplateHoleModel uses useMaterials() hook (not shared.ts singletons)
#   This is a structural test. After migration, TemplateHoleModel.tsx should:
#   - Import useMaterials from "./useMaterials" (or "../useMaterials")
#   - NOT import feltMaterial, bumperMaterial, teeMaterial, cupMaterial from "./shared"
#   Approach: Use grep/read on the source file to verify import statements
#   OR: mock useMaterials and verify it was called during render

# Test: TemplateHoleModel respects materialProfile setting
#   This validates the behavioral change. When materialProfile changes in the store,
#   TemplateHoleModel should re-render with different material properties.
#   Approach: Create a minimal Zustand store with materialProfile set to "budget_diy",
#   verify the useMaterials hook returns budget_diy PBR properties.
#   Then update to "semi_pro" and verify properties change.
#   (Since R3F rendering is not testable in jsdom, test the useMaterials hook directly
#   with different materialProfile values)

# Test: TemplateHoleModel cup is recessed CylinderGeometry
#   After migration, the cup on the last segment should use the shared <Cup> component
#   from Section 2 (which renders a recessed cylinder, not a flat one).
#   Validate by checking that the TemplateHoleModel source code references the
#   Cup component import, or that it no longer inline-renders <cylinderGeometry>.

# Test: TemplateHoleModel tee is raised CylinderGeometry with texture
#   After migration, the tee on the first segment should use the shared <TeePad> component.
#   Validate similarly to the cup test above.
```

## Implementation Details

### 1. Update `segmentGeometry.ts` Bumper Generation

The core change is replacing all `BoxGeometry` bumper creation with `ExtrudeGeometry` using the rounded bumper profile from `bumperProfile.ts` (created in Section 1).

**Straight segments (`createStraightGeometries`):**

Currently creates bumpers as:
```typescript
const bumperLeft = new THREE.BoxGeometry(BUMPER_THICKNESS, BUMPER_HEIGHT, length);
```

Replace with:
```typescript
import { createBumperProfile, createBumperGeometry } from "./bumperProfile";

// Create the rounded cross-section profile once
const profile = createBumperProfile(BUMPER_HEIGHT, BUMPER_THICKNESS, bevelRadius);
// Extrude along the bumper length
const bumperLeft = createBumperGeometry(profile, length);
```

The `createBumperGeometry(profile, length)` function from Section 1's `bumperProfile.ts` returns an `ExtrudeGeometry` that extrudes the rounded rectangular cross-section along a straight path of the given length. The resulting geometry needs the same `translate()` calls as the current `BoxGeometry` to position it correctly:
- Left bumper: translate to `-(hw + BUMPER_THICKNESS/2), BUMPER_HEIGHT/2, length/2`
- Right bumper: translate to `+(hw + BUMPER_THICKNESS/2), BUMPER_HEIGHT/2, length/2`

Note: The exact translation offsets may need adjustment depending on how `createBumperGeometry` centers its output. Check whether the geometry is centered at origin or starts at z=0. Adjust accordingly to match the existing bumper positions (which the existing tests verify).

**Curve segments (`createCurveGeometries`):**

Currently creates bumpers as flat `RingGeometry` sectors via `buildRingSegment()`. These are 2D ring sectors rotated onto the XZ plane -- they have no height profile, just a flat strip at `BUMPER_HEIGHT/2`.

Replace with ExtrudeGeometry that extrudes the rounded bumper profile along a curved path following the arc. The approach:

1. Create a `THREE.CurvePath` or `THREE.CatmullRomCurve3` that traces the arc at the bumper's radial position (inner or outer edge of the felt).
2. Use `createBumperProfile()` to get the cross-section `THREE.Shape`.
3. Create `ExtrudeGeometry` with `extrudePath` set to the arc curve.

Alternatively, if the arc-following extrude is too complex or produces degenerate geometry for tight curves, keep the current `RingGeometry` approach but add height by:
- Creating a `RingGeometry` for the top face
- Creating side walls via additional geometry
- Merging them into a single BufferGeometry

The simpler approach (and recommended one) is: keep using `buildRingSegment()` for curve bumpers but scale the Y dimension to `BUMPER_HEIGHT` instead of using a flat strip. The visual improvement from rounded profiles matters most for straight segments where bumpers are viewed from the side. For curved segments viewed from above, the height is the critical missing piece. This is a pragmatic trade-off that avoids complex arc-following extrusion while still achieving visual parity.

If a full rounded-profile arc extrusion is desired, use this pattern:

```typescript
function createArcBumperPath(radius: number, sweepRad: number, segments: number): THREE.CatmullRomCurve3 {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = (i / segments) * sweepRad;
    points.push(new THREE.Vector3(radius * Math.cos(t), 0, radius * Math.sin(t)));
  }
  return new THREE.CatmullRomCurve3(points);
}
```

Then pass this path as the `extrudePath` option to `ExtrudeGeometry`.

**Complex segments:**

- **`u_turn`**: Delegates to `createCurveGeometries` with 180-degree sweep. Same treatment as curve segments.
- **`s_curve`**: Two 90-degree arcs merged. Each arc's bumpers get the same treatment as single curve bumpers. The merge via `mergeGeometries()` stays the same.
- **`chicane`**: Two diagonal straight sections. Each section currently uses `BoxGeometry`. Replace with `createBumperGeometry(profile, sectionLen)` and apply the same `rotateY(rotY)` and `translate()` calls as the current code.

**Key constraint preserved:** The return type `SegmentGeometries = { felt, bumperLeft, bumperRight }` (all `BufferGeometry`) does not change. Only the internal geometry construction changes.

**Felt geometry stays unchanged.** The felt surfaces are flat planes/rings and do not need rounded profiles. Their visual upgrade comes from the texture applied by `TemplateHoleModel` via the material system.

### 2. Migrate `TemplateHoleModel.tsx` to `useMaterials()` Hook

**Current state:** `TemplateHoleModel.tsx` imports singleton materials directly from `shared.ts`:

```typescript
import {
  bumperMaterial, cupMaterial, feltMaterial, teeMaterial,
  uvBumperMaterial, uvCupMaterial, uvFeltMaterial, uvTeeMaterial,
} from "./shared";
```

It then selects UV vs normal materials based on `uvMode`:
```typescript
const felt = uvMode ? uvFeltMaterial : feltMaterial;
```

This completely bypasses the `useMaterials()` hook, which means:
- Template holes ignore the `materialProfile` budget setting (budget_diy, standard_diy, semi_pro)
- Template holes cannot participate in the textured/flat rendering tier system from Sections 1-2
- Template holes always look the same regardless of settings

**Migration steps:**

1. Remove all singleton material imports from `shared.ts` (keep only dimension constants: `CUP_RADIUS`, `TEE_RADIUS`, `SURFACE_THICKNESS`).

2. Import and call `useMaterials()` in the `TemplateHoleModel` component (not in `SegmentMesh`, to avoid calling it per-segment):

```typescript
import { useMaterials } from "./useMaterials";

export function TemplateHoleModel({ templateId }: Props) {
  const template = useStore((s) => s.holeTemplates[templateId]);
  const materials = useMaterials();
  // ...pass materials down to SegmentMesh
}
```

3. Update `SegmentMesh` to receive the `MaterialSet` as a prop instead of selecting materials internally:

```typescript
type SegmentMeshProps = {
  specId: SegmentSpecId;
  feltWidth: number;
  position: { x: number; z: number };
  rotation: number;
  isFirst: boolean;
  isLast: boolean;
  materials: MaterialSet;  // replaces uvMode: boolean
};
```

4. Inside `SegmentMesh`, use `materials.felt`, `materials.bumper`, `materials.tee`, `materials.cup` directly instead of the UV-switching logic.

5. Replace inline cup/tee rendering with shared `<Cup>` and `<TeePad>` components from Section 2:

**Before (inline):**
```tsx
{isFirst && (
  <mesh position={[0, SURFACE_THICKNESS + 0.01, 0]} material={tee}>
    <cylinderGeometry args={[TEE_RADIUS, TEE_RADIUS, 0.01, 16]} />
  </mesh>
)}
{isLast && (
  <mesh position={[exitX, SURFACE_THICKNESS + 0.01, exitZ]} material={cup}>
    <cylinderGeometry args={[CUP_RADIUS, CUP_RADIUS, 0.01, 16]} />
  </mesh>
)}
```

**After (shared components):**
```tsx
{isFirst && <TeePad position={[0, 0, 0]} material={materials.tee} />}
{isLast && <Cup position={[exitX, 0, exitZ]} material={materials.cup} />}
```

The shared `<Cup>` component from Section 2 renders a recessed `CylinderGeometry` (pushed below the surface) with an optional flag pin. The shared `<TeePad>` renders a slightly raised cylinder with rubber texture normal map. Both handle their own geometry creation and disposal.

**This is an intentional behavioral change.** After this migration, template holes will:
- Respond to `materialProfile` changes (budget_diy shows different colors/roughness than semi_pro)
- Participate in GPU-tier-based textured rendering (if TexturedHole/FlatHole pattern is applied)
- Have recessed cups with flag pins (3D view only)
- Have raised rubber tee pads

Document this as a feature improvement: "Template holes now respect material profile settings."

### 3. UV Mode Handling After Migration

The `useMaterials()` hook already handles UV mode internally -- it reads `uvMode` from the store and returns UV materials when active. So after migration, `TemplateHoleModel` no longer needs to read `uvMode` from the store directly or pass it to `SegmentMesh`. The hook handles it transparently.

Remove the `uvMode` store selector from `TemplateHoleModel`:
```typescript
// BEFORE:
const uvMode = useStore((s) => s.ui.uvMode);

// AFTER: (removed -- useMaterials() handles this internally)
```

### 4. Geometry Disposal

`segmentGeometry.ts` creates geometry objects that are consumed by `SegmentMesh` via `useMemo`. The existing code does not dispose these geometries on unmount. After switching to `ExtrudeGeometry` (which is heavier than `BoxGeometry`), add a `useEffect` cleanup in `SegmentMesh` to dispose all three geometries when the component unmounts or when the memoized geometries change:

```typescript
// In SegmentMesh:
const geometries = useMemo(
  () => createSegmentGeometries(specId, feltWidth),
  [specId, feltWidth],
);

useEffect(() => {
  return () => {
    geometries.felt.dispose();
    geometries.bumperLeft.dispose();
    geometries.bumperRight.dispose();
  };
}, [geometries]);
```

This follows the same disposal pattern used in `useMaterials.ts` for material cleanup.

## Verification Checklist

After implementation, verify:

1. All 11 segment types render without errors in the Hole Builder preview canvas
2. Template holes placed on the hall floor look visually equivalent to legacy straight/curve holes
3. Bumper rails on straight segments appear rounded (visible in 3D/isometric view)
4. Changing `materialProfile` in budget settings affects template hole appearance
5. UV mode still works correctly for template holes (neon glow effect)
6. No console errors or geometry disposal warnings
7. All existing `segmentGeometry.test.ts` tests still pass (bumper positioning, dimensions)
8. New tests for rounded profiles and material migration pass
9. Segment joining remains smooth -- no visible gaps between connected segments
10. Complex segments (u_turn, s_curve, chicane) render correctly with new bumper profiles

## Background: The 11 Segment Types

For reference, the full set of segment spec IDs that must all work after this upgrade:

| ID | Category | Description |
|----|----------|-------------|
| `straight_1m` | straight | 1-meter straight lane |
| `straight_2m` | straight | 2-meter straight lane |
| `straight_3m` | straight | 3-meter straight lane |
| `curve_90_left` | curve | 90-degree left arc (R=0.8m) |
| `curve_90_right` | curve | 90-degree right arc (R=0.8m) |
| `curve_45_left` | curve | 45-degree left arc (R=1.2m) |
| `curve_45_right` | curve | 45-degree right arc (R=1.2m) |
| `curve_30_wide` | curve | 30-degree gentle left arc (R=2.0m) |
| `s_curve` | complex | Two 90-degree arcs (left then right) |
| `u_turn` | complex | 180-degree left arc (R=0.8m) |
| `chicane` | complex | Two diagonal straight sections |

All segment types return `{ felt, bumperLeft, bumperRight }` as `BufferGeometry`. The felt geometry is unchanged by this section. Only the bumper geometry changes from `BoxGeometry`/`RingGeometry` to `ExtrudeGeometry` with rounded profiles.

## Constants Reference

These constants are defined in `src/components/three/holes/shared.ts` and mirrored in `src/utils/segmentGeometry.ts`:

| Constant | Value | Used For |
|----------|-------|----------|
| `SURFACE_THICKNESS` | 0.02 | Felt slab height |
| `BUMPER_HEIGHT` | 0.08 | Bumper rail height |
| `BUMPER_THICKNESS` | 0.05 | Bumper rail width |
| `TEE_RADIUS` | 0.03 | Tee pad circle radius |
| `CUP_RADIUS` | 0.054 | Cup hole radius |

The `bevelRadius` parameter for `createBumperProfile` is established in Section 1. A reasonable default is `0.01` (1cm bevel radius on the bumper corners).