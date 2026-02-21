# Phase 12: Beautiful 3D Golf Course Models — Complete Specification

## Goal
Replace flat geometric primitives with beautiful, realistic-looking 3D mini golf holes. Stylized Realism art direction — polished materials, rounded geometry, textured surfaces. One visual quality tier (standard_diy).

## Current State (Baseline)

All 7 legacy hole types use BoxGeometry with flat MeshStandardMaterial colors. No textures, no bevels, no surface detail. Template holes (segment-based builder) use BoxGeometry (straight) and RingGeometry (curves) with the same flat materials.

**Existing material system:** `useMaterials()` hook returns `{felt, bumper, tee, cup}` MaterialSet. Normal mode uses PBR properties from materialPresets.ts. UV mode uses singleton emissive materials from shared.ts. Three material profiles exist (budget_diy, standard_diy, semi_pro) but only affect color/roughness/metalness values.

**Existing GPU tier gating:** 3 tiers (low/mid/high) gate shadows, post-processing, frameloop, DPR.

**Existing post-processing:** Bloom, Vignette, ToneMapping always on. ChromaticAberration mid+. N8AO, GodRays high only.

## Target State

### Playing Surfaces (Felt)
- Textured carpet with visible fiber direction via normal map
- Green-tinted neutral CC0 carpet texture (Carpet012 or Fabric026 from ambientCG)
- Roughness map for subtle wear variation
- NO displacement (z-fighting risk, negligible visual gain)
- Proper UV mapping on all felt geometries

### Bumper Rails
- Rounded cross-section profile using ExtrudeGeometry with `createRoundedRectShape()`
- Wood grain texture (Poly Haven `wood_planks`) with normal map
- Catch light with proper specular highlights
- Dimensions: same BUMPER_HEIGHT (0.08) and BUMPER_THICKNESS (0.05) with rounded edges

### Cup (Hole)
- Recessed CylinderGeometry with lip, visible depth, dark interior
- Small flag/pin marker using Billboard in 3D view, hidden in top-down
- CUP_RADIUS stays 0.054

### Tee Pad
- Slightly raised cylinder with rubber texture normal map (ambientCG Rubber004)
- Visible thickness and surface detail
- TEE_RADIUS stays 0.03

### Obstacles

**Windmill:** GLTF accent model (~0.8m × 0.8m × 1.2m fixed size) from Kenney Minigolf Kit or improved procedural fallback. Slow rotation animation (frameloop-aware). Placed within parametric lane.

**Tunnel:** Procedural ExtrudeGeometry arch profile with thickness + brick texture (ambientCG Bricks085). Lane-width-aware arch.

**Loop:** TubeGeometry along circular path with proper cross-section + metallic support pillars. Higher segment count (32-64).

**Ramp:** Curved slope profile (bezier, not triangular) + continuous felt texture up surface.

**Dogleg/L-Shape:** Smooth curved transitions at direction changes using bezier/catmull-rom interpolation.

### Hall Environment
- Floor: concrete texture (Poly Haven `concrete_floor`)
- Walls: corrugated steel texture (Poly Haven `corrugated_iron` or `box_profile_metal_sheet`)
- Lighting adjustments for PBR material response

### Template Hole Parity
- Template holes from Hole Builder get same visual quality as legacy types
- Shared bumper profiles, felt textures, cup/tee components
- Update segmentGeometry.ts with new profile generators

## Technical Decisions

1. **Approach:** Hybrid — procedural for parametric surfaces, GLTF for windmill accent
2. **Art style:** Stylized Realism
3. **Textures:** CC0 from Poly Haven + ambientCG, 1K-JPG resolution for web
4. **Material tier:** standard_diy only; per-tier textures deferred
5. **GLTF scaling:** Fixed-size accent pieces, NOT scaled to hole dimensions
6. **Loading:** Progressive enhancement via Suspense + ErrorBoundary, flat-color fallback
7. **Felt color:** Tint neutral carpet texture green in shader
8. **Section ordering:** Content-first (Section 1 produces visible change)

## Texture Assets (CC0)

| Surface | Source | Texture ID | Maps | Resolution |
|---------|--------|-----------|------|------------|
| Felt/carpet | ambientCG | Carpet012 or Fabric026 | color + normal + roughness | 1K |
| Wood rail | Poly Haven | wood_planks | color + normal + roughness | 1K |
| Brick (tunnel) | ambientCG | Bricks085 | color + normal | 1K |
| Concrete (floor) | Poly Haven | concrete_floor | color + normal + roughness | 1K |
| Steel (walls) | Poly Haven | corrugated_iron | color + normal + roughness + metalness | 1K |
| Rubber (tee) | ambientCG | Rubber004 | normal + roughness | 1K |

## Key R3F Patterns

- **useTexture:** drei hook with object notation + Suspense. Preload critical textures at module level. Clone for different repeat/wrap.
- **useGLTF:** drei hook, Draco enabled by default (CDN). scene.clone() for multiple instances.
- **Bumper profiles:** THREE.Shape with quadraticCurveTo for rounded rect. ExtrudeGeometry for straight rails (depth + bevel), extrudePath for curved rails.
- **Progressive loading:** ErrorBoundary + Suspense wrapping textured components, flat-color material as fallback.

## Testing Strategy

- Unit tests for geometry utilities (bumper profile, curved geometry)
- Material assignment tests (texture loading, UV mode switching)
- GPU tier gating tests (texture quality per tier)
- Integration: verify all 7 legacy types + template holes render without errors
- No visual regression tests (no headless R3F rendering available)

## Performance Targets

- Total texture payload: <5MB
- Mobile: >30fps with textured holes (GPU tier gating for low devices)
- Top-down view: simplified materials (no normal maps) for performance
- Geometry: mergeVertices() on all ExtrudeGeometry output

## Scope Boundaries

**In scope:** All 7 legacy hole types, template holes, hall environment, performance gating
**Out of scope:** Per-tier material textures, animated obstacles beyond windmill rotation, new hole types, GLTF models for non-windmill obstacles
