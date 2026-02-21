Now I have all the context needed to write the section. Let me produce the complete section content.

# Section 4: Tunnel Obstacle Overhaul

## Overview

This section replaces the current half-cylinder tunnel geometry (`CylinderGeometry` with `thetaLength=PI`) in `HoleTunnel.tsx` with a stone archway built from `ExtrudeGeometry`. The archway has a semicircular cross-section with wall thickness, extruded along the tunnel length. Brick texture is applied to the exterior, a dark material to the interior, and UV mode gets neon purple arch edge glow.

**What changes visually:** The tunnel transforms from a smooth gray half-pipe into a textured stone archway you want to putt through. It has visible wall thickness, brick-textured exterior faces, a dark interior, and slightly wider entrance/exit openings for framing.

**What stays the same:** All placement logic, collision detection, bumper positions, felt surface, cup/tee markers, and store data remain untouched. The tunnel's `TUNNEL_LENGTH` constant (1.6m) is preserved. Entry/exit zone bumper geometry is assumed to already use the shared `BumperRail` component from Section 2.

## Dependencies

- **Section 1 (Straight Hole Glow-Up):** Provides the `useTexturedMaterials()` hook, the `TexturedHole`/`FlatHole` conditional rendering pattern in `HoleModel.tsx`, and the texture loading infrastructure (Suspense, ErrorBoundary, GPU tier gating). The brick texture download also follows the pattern established in Section 1.
- **Section 2 (Shared Geometry Library):** Provides the shared `<BumperRail>`, `<Cup>`, and `<TeePad>` components that `HoleTunnel.tsx` should already be using by the time this section executes. This section only modifies the **tunnel arch obstacle geometry** -- not bumpers, felt, cup, or tee.

## File Inventory

| File | Action | Purpose |
|------|--------|---------|
| `public/textures/brick/color.jpg` | CREATE | CC0 brick color texture (ambientCG Bricks085 or similar) |
| `public/textures/brick/normal.jpg` | CREATE | CC0 brick normal map |
| `src/utils/tunnelGeometry.ts` | CREATE | Arch profile shape + extrusion utilities |
| `src/components/three/holes/HoleTunnel.tsx` | MODIFY | Replace CylinderGeometry arch with ExtrudeGeometry archway |
| `tests/components/holes/tunnel.test.ts` | CREATE | TDD tests for tunnel arch geometry |

## Tests (Write First)

Create the test file at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/holes/tunnel.test.ts`.

These tests validate the tunnel arch geometry utilities and material behavior. They import THREE.js directly (no R3F canvas needed) and test geometry properties on the raw objects.

```
File: tests/components/holes/tunnel.test.ts

Tests to implement:

# Tunnel arch profile (tunnelGeometry.ts utilities)
# Test: createArchProfile returns THREE.Shape (instanceof check)
# Test: arch profile has semicircular outer edge (points trace arc above baseline)
# Test: arch profile has wall thickness of ~0.05m (inner radius < outer radius by wallThickness)
# Test: arch profile base extends down to ground level (y=0 at base points)

# Tunnel arch geometry
# Test: createTunnelArchGeometry returns BufferGeometry (instanceof check)
# Test: arch extrusion depth matches TUNNEL_LENGTH constant (1.6m)
# Test: arch width equals laneW / 2 (the archRadius relationship)
# Test: geometry has position attribute with vertices (not empty)

# Tunnel materials
# Test: tunnel exterior material has brick texture maps (map, normalMap properties set) when textured
# Test: tunnel interior material is dark-colored (no texture needed, just dark MeshStandardMaterial)
# Test: UV mode material has emissive property set to purple (#9933FF or similar)
# Test: UV mode material has emissiveIntensity matching UV_EMISSIVE_INTENSITY (2.0)

# Geometry lifecycle
# Test: arch geometry can be disposed without errors (geometry.dispose() call succeeds)
```

**Testing pattern notes:**
- Import `THREE` directly and call the geometry utility functions.
- For texture tests, mock `useTexture` from `@react-three/drei` to return a dummy `THREE.Texture` since there is no WebGL context in Vitest/jsdom.
- For material property tests, construct the materials directly and inspect their properties.
- For the UV mode test, pass `uvMode: true` to the material factory and check the `emissive` and `emissiveIntensity` fields on the returned material.

## Implementation Details

### 1. Brick Texture Assets

Download CC0 brick textures to `public/textures/brick/`. Source: ambientCG `Bricks085` (or similar brick/stone texture). Two files needed:

- `color.jpg` -- base color map (~200KB, 1K resolution)
- `normal.jpg` -- normal map for surface relief (~200KB, 1K resolution)

No roughness map needed for brick (mid/high GPU tiers use the normal map; the material `roughness` scalar value is sufficient for stone). Download via `curl` from the ambientCG CDN during implementation.

**Fallback:** If the specific texture cannot be sourced, generate a procedural brick pattern using Canvas2D: draw alternating rows of offset rectangles in shades of brown/red on an offscreen canvas, export as data URL texture.

### 2. Tunnel Geometry Utility

Create `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/tunnelGeometry.ts` with two exported functions:

**`createArchProfile(archRadius: number, wallThickness: number): THREE.Shape`**

Builds a 2D cross-section shape for the tunnel archway. The profile is a semicircular annulus (half-donut cross-section) sitting on a ground-level baseline:

- Outer arc: semicircle of radius `archRadius` from angle 0 to PI (left base to right base, curving over the top)
- Inner arc: semicircle of radius `archRadius - wallThickness` traced in reverse (PI back to 0)
- Two straight segments connecting the arcs at the base (left wall and right wall extending to ground)
- The shape's coordinate system: X is horizontal (width of arch), Y is vertical (height of arch)
- `wallThickness` default: `0.05` (5cm stone walls)

Use `THREE.Shape` with `moveTo`, `absarc` (for the outer semicircle), `lineTo` (close right wall to inner arc start), `absarc` (inner semicircle, reversed), and `lineTo` (close left wall back to start).

**`createTunnelArchGeometry(archRadius: number, tunnelLength: number, wallThickness?: number): THREE.ExtrudeGeometry`**

Extrudes the arch profile along the tunnel length:

- Calls `createArchProfile(archRadius, wallThickness)` to get the cross-section
- Creates `ExtrudeGeometry` with `depth: tunnelLength`, `bevelEnabled: false`
- The extrusion runs along the Z axis (Three.js ExtrudeGeometry extrudes along +Z by default)
- Returns the geometry ready for use in a `<mesh>`

The caller (HoleTunnel component) positions and rotates the mesh so the extrusion aligns with the hole's Z axis.

### 3. HoleTunnel.tsx Modifications

Modify `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/holes/HoleTunnel.tsx`.

**Replace the tunnel arch mesh.** The current code uses:
```tsx
<cylinderGeometry args={[archRadius, archRadius, TUNNEL_LENGTH, TUNNEL_SEGMENTS, 1, true, 0, Math.PI]} />
```

Replace with an `ExtrudeGeometry` created by `createTunnelArchGeometry()`:

- Call `createTunnelArchGeometry(archRadius, TUNNEL_LENGTH)` in a `useMemo` (depends on `archRadius` which derives from `width`)
- Apply the geometry to a `<mesh>` with appropriate position and rotation
- Position: centered on the tunnel section (same Z center as current cylinder, Y at surface thickness level)
- Rotation: the ExtrudeGeometry extrudes along +Z by default; rotate as needed so the arch opening faces the entry/exit directions

**Exterior material with brick texture.** Create a textured material for the arch exterior:

- In the textured rendering path (mid/high GPU tier), use `useTexture` to load `'/textures/brick/color.jpg'` and `'/textures/brick/normal.jpg'`
- Set `wrapS` and `wrapT` to `RepeatWrapping` on both textures
- Set `repeat` appropriate for the arch surface area (e.g., `repeat.set(2, 1)` for the ~1.6m tunnel length)
- Construct a `MeshStandardMaterial` with `map`, `normalMap`, `roughness: 0.85`, `metalness: 0.05`
- In the flat rendering path (low GPU tier), use a plain `MeshStandardMaterial` with `color: '#8B7355'` (stone brown), `roughness: 0.85`

**Dark interior material.** A simple `MeshStandardMaterial` with `color: '#1A1A1A'` (very dark), `roughness: 0.95`, no textures. The interior of the arch does not need brick detail since it is mostly in shadow.

Since `ExtrudeGeometry` produces a single mesh with front/back/side faces, and we want different materials for exterior vs interior, there are two approaches:
- **Option A (simpler):** Use a single brick material for the whole arch. The interior darkness comes naturally from lack of light reaching inside. This avoids material group complexity.
- **Option B (multi-material):** Assign material groups to the ExtrudeGeometry. The extrusion shape faces get one material index, the depth faces get another. Use `mesh.material` as an array `[exteriorMat, interiorMat]` and set `geometry.groups` accordingly.

Recommend **Option A** for simplicity. The arch interior is naturally dark because light does not reach inside the tunnel. If visual inspection shows the interior is too bright, add a thin dark plane inside as a shadow catcher.

**UV mode material.** When `uvMode` is true, replace the brick material with:
- `color: '#0D001A'` (very dark purple-black base)
- `emissive: '#9933FF'` (neon purple glow)
- `emissiveIntensity: UV_EMISSIVE_INTENSITY` (2.0)
- `roughness: 0.6`, `metalness: 0.1`

This is the same UV treatment currently used in the `tunnelMaterial` useMemo block. The UV material creation logic stays largely the same, just the geometry it applies to changes.

**Entrance framing detail.** To create a slightly wider arch at entrance and exit openings:

- Add a thin ring/frame mesh at each end of the tunnel (Z = tunnelStart and Z = tunnelEnd)
- Each frame is a scaled-up version of the arch profile extruded ~0.03m (3cm thick stone frame)
- Scale factor: 1.05x on archRadius (adds ~2.5cm visual overhang on each side)
- Use the same brick/UV material as the main arch body
- This is a visual accent only -- it does not affect collision or gameplay

**Geometry disposal.** Add `useEffect` cleanup to dispose the ExtrudeGeometry on unmount:

```tsx
useEffect(() => {
  return () => {
    archGeometry.dispose();
    // dispose frame geometries if created
  };
}, [archGeometry]);
```

### 4. Texture Preloading

At module level in `HoleTunnel.tsx` (or in a shared preload file), add:

```tsx
import { useTexture } from '@react-three/drei';
useTexture.preload('/textures/brick/color.jpg');
useTexture.preload('/textures/brick/normal.jpg');
```

This ensures brick textures begin loading as soon as the module is imported, rather than waiting for the first tunnel hole to render.

### 5. Integration with TexturedHole/FlatHole Pattern

After Section 1 establishes the `TexturedHole`/`FlatHole` conditional rendering pattern in `HoleModel.tsx`, the tunnel case in the dispatcher should route through it:

- **Low GPU tier:** Renders `<FlatHole>` which uses `HoleTunnel` with flat-color materials (no texture loading, no `useTexture` calls). The arch geometry upgrade (ExtrudeGeometry instead of CylinderGeometry) still applies even in flat mode -- it is the shape that changes, not just textures.
- **Mid/High GPU tier:** Renders `<TexturedHole>` wrapped in `<Suspense>`, which loads brick textures and applies them.

The tunnel-specific arch geometry (`createTunnelArchGeometry`) is used in both paths. Only the material differs.

## Constants Reference

These constants are used from `shared.ts` and within `HoleTunnel.tsx`:

| Constant | Value | Source |
|----------|-------|--------|
| `TUNNEL_LENGTH` | `1.6` (meters) | `HoleTunnel.tsx` local constant |
| `BUMPER_HEIGHT` | `0.08` (meters) | `shared.ts` |
| `BUMPER_THICKNESS` | `0.05` (meters) | `shared.ts` |
| `SURFACE_THICKNESS` | `0.02` (meters) | `shared.ts` |
| `CUP_RADIUS` | `0.054` (meters) | `shared.ts` |
| `TEE_RADIUS` | `0.03` (meters) | `shared.ts` |
| `UV_EMISSIVE_INTENSITY` | `2.0` | `materialPresets.ts` |
| `archRadius` | `laneW / 2` (derived) | Computed from `width - BUMPER_THICKNESS * 2` |

## Arch Geometry Diagram

Cross-section of the tunnel archway (looking from entry end):

```
          ___-------___
        /    EXTERIOR    \        <- outer semicircle (radius = archRadius)
       /   ___-------___   \
      |  /    INTERIOR    \  |    <- inner semicircle (radius = archRadius - wallThickness)
      | |                  | |
      | |    (ball path)   | |
  ----+-+------------------+-+----  <- ground level (y=0)
      wall                wall
      (0.05m)            (0.05m)
```

The `THREE.Shape` traces: start at bottom-left wall base, arc over the top (outer), come down to bottom-right wall base, go inward by `wallThickness`, arc back over the top (inner, reversed), return to start.

## Acceptance Criteria

1. All tests in `tests/components/holes/tunnel.test.ts` pass
2. `createArchProfile` returns a valid `THREE.Shape` with semicircular cross-section and wall thickness
3. `createTunnelArchGeometry` returns an `ExtrudeGeometry` with depth matching `TUNNEL_LENGTH`
4. The tunnel visually renders as a stone archway with brick texture (mid/high GPU tier)
5. Low GPU tier renders the same arch shape with flat stone-brown color (no texture loading)
6. UV mode renders dark base with neon purple emissive glow on the arch
7. Entrance/exit frames provide visual framing at tunnel openings
8. All geometry is disposed on component unmount (no memory leaks)
9. `npx tsc --noEmit` passes with no type errors
10. Existing tests continue to pass (`npm test`)