# Phase 12: Beautiful 3D Golf Course Models

**Date:** 2026-02-21
**Status:** Reviewed (Devil's Advocate + Blue Team) — ready for /deep-plan
**Goal:** Replace the flat geometric primitives with beautiful, realistic-looking 3D mini golf holes that make people go "wow" when they see the app.
**Art Style:** Stylized Realism — polished, high-end look with real materials (felt, wood, metal, stone) but slightly idealized proportions and colors. Think "beautiful indie game," not photorealistic CAD.

## User-Visible Outcomes (per section)

What changes visually after each section ships:

| Section | What the user SEES when it's done |
|---------|----------------------------------|
| 1. Straight hole glow-up | One hole type (straight) goes from flat boxes to textured felt + rounded bumpers + recessed cup + rubber tee. Immediate "wow" moment. |
| 2. Shared geometry library | All 7 hole types now have rounded bumper rails and textured felt (same quality as straight). Cups recessed, tees textured. |
| 3. Windmill overhaul | Windmill obstacle transforms from gray cylinder + flat blades to a charming miniature building with rotating blades, door detail, and stone/wood finish. |
| 4. Tunnel overhaul | Tunnel goes from flat half-cylinder to stone/brick archway with proper entrance framing and depth. |
| 5. Loop + Ramp overhaul | Loop becomes smooth track tube with support structure. Ramp gets curved slope with continuous felt. |
| 6. Dogleg + L-Shape curves | Angular box joins become smooth curved transitions with continuous felt through turns. |
| 7. Template hole parity | Custom-built holes from the Hole Builder look just as good as legacy types — same bumpers, felt, materials. |
| 8. Hall environment | Floor becomes concrete, walls become steel panels. The hall itself looks like a real BORGA hall. |
| 9. Performance + polish | No visual change — everything runs smoothly on mobile and top-down view stays fast. |

## Problem Statement

The current 3D hole models are functional but ugly. Every surface is a `BoxGeometry` with flat MeshStandardMaterial colors. Bumpers are sharp-edged white rectangles. Felt is a thin green slab. Obstacles (windmill, tunnel, loop, ramp) use minimal procedural geometry. The result looks like a late-90s planning tool, not the immersive experience the user envisioned.

**User's vision:** Beautiful, wow-ing, 3D rendered graphics and models for the golf course and its elements.

## What "Beautiful" Means Concretely

### Playing Surfaces (Felt/Carpet)
- **Now:** Flat green box, 0.02m thick, single color
- **Target:** Textured carpet surface with visible fiber direction. Subtle color variation. Looks like real mini golf felt when you zoom in.
- **Technique:** Normal map for fiber direction + roughness map for wear variation. NO displacement (causes z-fighting with bumper bases and costs performance for negligible visual gain at typical zoom levels).

### Bumpers/Rails
- **Now:** Sharp-edged white boxes, 0.05m thick, 0.08m tall
- **Target:** Rounded rail profiles with beveled top edges. Wood grain finish (standard_diy profile). Catch light properly with specular highlights.
- **Technique:** ExtrudeGeometry with rounded cross-section profile (not boxes) + wood normal maps

### Cup (Hole)
- **Now:** Flat black circle on the surface
- **Target:** Recessed cylindrical hole with a lip, visible depth, and a small flag/pin marker
- **Technique:** CylinderGeometry (inverted/recessed) with dark interior + flag mesh. Flag uses `<Billboard>` in 3D view; hidden in top-down to avoid clutter.

### Tee Pad
- **Now:** Flat yellow circle
- **Target:** Textured rubber tee mat with slight thickness, visible surface texture
- **Technique:** Slightly raised cylinder with rubber texture normal map

### Obstacles

#### Windmill
- **Now:** Gray cylinder pillar + 4 flat box blades
- **Target:** Charming miniature windmill building with a proper tower, rotating blades with 3D depth, a little door/window detail, pitched roof
- **Technique:** GLTF model (~0.8m × 0.8m × 1.2m fixed size) placed as accent piece within parametric lane. Sourced from CC0 library or modeled in Blender. Includes baked AO.

#### Tunnel
- **Now:** Half-cylinder arch, solid gray
- **Target:** Stone/brick archway tunnel with visible masonry texture, proper arch profile, entrance/exit openings that look inviting
- **Technique:** Procedural ExtrudeGeometry with arch profile + brick normal map texture. Tunnel width matches lane width parametrically.

#### Loop
- **Now:** Half-torus standing up + two cylinder pillars
- **Target:** Smooth track loop with proper rail thickness, support structure that looks engineered, visible track surface continuing through the loop
- **Technique:** TubeGeometry along a circular path with proper cross-section + metal/track materials. Support pillars with metallic finish.

#### Ramp
- **Now:** ExtrudeGeometry triangular cross-section, flat color
- **Target:** Smooth curved ramp with gentle slope transition, carpet texture continuing up the surface, proper edge treatment
- **Technique:** ExtrudeGeometry with curved profile (not triangular) + shared felt material

#### Dogleg / L-Shape
- **Now:** Multiple box sections joined at angles
- **Target:** Smooth curved transitions between lane segments, proper corner profiles, continuous felt surface through turns
- **Technique:** Curved ExtrudeGeometry paths with smooth interpolation at joints

## Technical Approach: Hybrid (Option C) — Chosen

- **Procedural** for all parametric surfaces: felt lanes, bumper rails, cups, tees, ramps, tunnel arches, loop tracks. These must scale to varying hole dimensions.
- **GLTF** for complex accent obstacles: windmill building. These are **fixed-size decorative pieces** positioned within parametric lanes — they do NOT scale with hole dimensions.

**GLTF Scaling Strategy (Critical):** GLTF obstacles are always a fixed physical size (e.g., windmill is ~0.8m × 0.8m × 1.2m). The parametric lane (felt + bumpers) wraps around the obstacle position. The obstacle is placed at a designated point within the lane, not scaled to fit. This completely avoids the non-uniform scaling problem.

**GLTF Asset Pipeline:**
1. Source CC0 models from Poly Haven / Sketchfab (CC0 filter) / kenney.nl
2. Optimize in Blender: reduce polycount, bake AO, ensure clean UV maps
3. Export as `.glb` with Draco compression (target: <200KB per model)
4. Load with drei's `useGLTF` + `<Suspense>` fallback showing current flat geometry
5. Store in `public/models/` directory
6. If suitable CC0 model not found: fall back to improved procedural geometry (tapered cylinder tower, cone roof, shaped blades)

## Material System Upgrade

### Texture Assets Needed
| Surface | Maps | Size | Source |
|---------|------|------|--------|
| Felt/carpet | albedo + normal + roughness | 512x512 | CC0 (Poly Haven / ambientCG) |
| Wood rail | albedo + normal + roughness | 512x512 | CC0 (wood grain) |
| Brick/stone | albedo + normal | 512x512 | CC0 (for tunnel) |
| Rubber (tee) | normal + roughness | 256x256 | CC0 (rubber mat) |
| Concrete (floor) | albedo + normal + roughness | 512x512 | CC0 (polished concrete) |
| Steel panel (walls) | albedo + normal + roughness + metalness | 512x512 | CC0 (corrugated metal) |

### Material Profile Scope
Phase 12 ships **one visual quality tier: standard_diy** (painted wood bumpers, billiard felt, detailed obstacles — clean/modern look). The existing `MaterialProfile` system continues to drive cost calculations and color parameters, but per-tier PBR textures (plywood for budget, aluminum for semi_pro) are deferred to a future phase. This prevents tripling texture workload.

### UV Mode Materials
The existing emissive UV material system continues to work. UV mode swaps albedo for dark base + neon emissive. New PBR textures need UV-compatible variants:
- **Felt:** Dark base color + neon green emissive edges (fiber direction via emissive map)
- **Bumpers:** Dark wood + neon edge glow (emissive along bevel highlights)
- **Obstacles:** Dark base + neon accent outlines
- **Strategy:** Each material gets an `emissiveMap` texture variant. In UV mode, albedo map is replaced with dark solid, emissive map activates. Normal + roughness maps stay the same.

### Texture Loading Strategy
**Progressive enhancement, not loading screen:**
1. App starts instantly with current flat-color materials (existing behavior)
2. Textures load asynchronously via drei `useTexture` inside `<Suspense>`
3. When loaded, materials swap from flat to textured (subtle transition)
4. If textures fail to load, flat-color materials remain as permanent fallback
5. GLTF models load similarly — flat procedural geometry shown until model ready

## Implementation Sections (for /deep-plan)

### Section 1: Straight Hole Glow-Up (Content-First)
**Delivers visible change immediately — one complete hole transformation.**
- Source CC0 felt + wood textures (Poly Haven / ambientCG)
- Create texture loading utility using drei's `useTexture` with Suspense
- Replace BoxGeometry bumpers on HoleStraight with ExtrudeGeometry rounded profiles
- Apply felt texture with normal map to playing surface
- Add recessed cup (CylinderGeometry) with lip + flag pin
- Add rubber tee pad with texture
- Integrate with `useMaterials` hook (standard_diy profile)
- Tests: HoleStraight renders with textures, geometry validation, fallback to flat materials

### Section 2: Shared Geometry Library + Apply to All Types
**All 7 hole types get rounded bumpers, textured felt, proper cups and tees.**
- Extract bumper profile generator: `createBumperProfile(height, thickness, bevelRadius)`
- Extract shared felt material with texture maps
- Extract cup + tee components as reusable sub-components
- Apply shared library to all 7 legacy hole types (L-shape, dogleg, windmill, tunnel, loop, ramp)
- Update segment geometry for curved bumper profiles
- Tests: all hole types render with new materials, profile generator unit tests

### Section 3: Windmill Obstacle Overhaul
**Hero obstacle — the windmill becomes a charming miniature building.**
- Source or model GLTF windmill (~0.8m × 0.8m × 1.2m fixed size)
- If CC0 model available: import with `useGLTF` + Draco, place as accent within lane
- If no model: detailed procedural geometry (tapered cylinder tower, cone roof, door detail, shaped blade ExtrudeGeometry)
- Slow rotation animation (frameloop-aware, respects `invalidate()`)
- Fallback: current geometry shown while GLTF loads
- Tests: component renders, GLTF loading with Suspense, animation frame behavior

### Section 4: Tunnel Obstacle Overhaul
**Tunnel becomes a stone archway you want to putt through.**
- Proper arch profile with thickness using ExtrudeGeometry (not half-cylinder)
- Brick/stone texture on exterior (CC0 normal + albedo maps)
- Dark interior with subtle ambient shading
- Entrance/exit framing detail (slightly wider arch at openings)
- Lane-width-aware: arch width matches parametric lane width
- Tests: geometry validation, texture loading, arch profile correctness

### Section 5: Loop + Ramp Overhaul
**Loop and ramp get smooth, engineered-looking geometry.**
- Loop: TubeGeometry with proper cross-section along circular path, metallic support structure, visible track surface through loop
- Ramp: curved slope profile (smooth bezier, not triangular), continuous felt texture up surface, proper edge bumpers
- Higher segment counts (32-64) for smooth curves
- Tests: geometry smoothness validation, material continuity, segment count assertions

### Section 6: Dogleg + L-Shape Smooth Curves
**Angular joins become flowing curves.**
- Replace box-section joins with curved ExtrudeGeometry paths
- Smooth interpolation at direction changes (bezier or catmull-rom)
- Continuous felt UV mapping through curves (no seams at joins)
- Bumper profiles follow curve path smoothly
- Tests: curve geometry validation, UV continuity, bumper path following

### Section 7: Template Hole Visual Parity
**Custom-built holes from the Hole Builder look just as good as legacy types.**
- Apply shared bumper profiles to segment-based template holes
- Apply shared felt + cup + tee materials to TemplateHoleModel
- Update `segmentGeometry.ts` with new profile generators
- Ensure all 11 segment types render with Phase 12 quality
- Tests: template rendering matches legacy quality, segment joining smoothness

### Section 8: Hall Environment Polish
**The hall itself becomes a believable BORGA steel building.**
- Floor: concrete texture (CC0) instead of flat gray — polished concrete look
- Walls: corrugated steel panel texture — looks like actual BORGA hall panels
- Adjust lighting to respond well to PBR materials (environment map or improved directional light)
- Tests: environment renders, material response to light changes

### Section 9: Performance + GPU Tier Gating
**Everything runs smoothly everywhere.**
- Texture atlas: combine felt + wood + rubber into single atlas to reduce draw calls
- GPU tier gating: high-res textures on mid+, 256x256 fallbacks on low, no textures on minimal
- Top-down view: simplified materials (no normal maps, lower texture res) for performance
- Lazy texture loading: textures for off-screen holes load on demand
- Tests: render performance assertions, GPU tier detection, texture fallback behavior

## Definition of Done

Someone opens the app, sees the mini golf course in 3D view, and says "that looks really nice." The holes look like miniature golf course obstacles, not colored blocks. The felt looks like carpet. The bumpers look like painted wood rails. The windmill looks like a windmill. The whole thing feels cohesive and polished.

**Specific checklist:**
- [ ] All 7 legacy hole types have textured felt, rounded bumpers, recessed cups, rubber tees
- [ ] Windmill has detailed 3D model (GLTF or rich procedural)
- [ ] Tunnel has brick archway appearance
- [ ] Loop has smooth track tube + support structure
- [ ] Ramp has curved slope with continuous felt
- [ ] Template holes from builder match legacy hole visual quality
- [ ] Hall floor looks like concrete, walls look like steel panels
- [ ] UV mode still works with all new materials (dark + neon emissive)
- [ ] Mobile devices maintain >30fps with textured holes
- [ ] No visible loading screen — progressive texture enhancement

## Dependencies

- Phase 11A (dark theme + post-processing) is complete — provides the rendering environment
- Existing hole placement/interaction logic unchanged — only visual representation changes
- Material profile system (budget_diy/standard_diy/semi_pro) already exists for cost; visual tier is standard_diy only

## Risks

1. **Texture bundle size:** Mitigate with compression (basis/ktx2), lazy loading, and reasonable resolution (512x512 max). Total target: <5MB all textures.
2. **Mobile performance:** Mitigate with GPU tier gating — low tier gets 256x256 textures or flat colors.
3. **CC0 model availability:** Windmill GLTF may not exist at right scale/style. Fallback: improved procedural geometry.
4. **UV mode compatibility:** Each new PBR material needs an emissive map variant. Plan UV maps per-material, not as afterthought.
5. **Template vs legacy parity:** Section 7 must explicitly verify visual parity. Risk of template holes looking second-class.

## Decisions Made (from reviews)

1. **Approach:** Hybrid (C) — procedural surfaces + GLTF accent obstacles
2. **Art style:** Stylized Realism
3. **Textures:** CC0 from Poly Haven / ambientCG
4. **Scope:** All 7 legacy types + templates
5. **Material tier:** Ship standard_diy only; per-tier textures deferred
6. **GLTF scaling:** Fixed-size accent pieces, NOT scaled to hole dimensions
7. **Displacement:** Removed from felt (z-fighting risk, negligible visual gain)
8. **Loading:** Progressive enhancement, no loading screen
9. **Section ordering:** Content-first (Section 1 produces visible change)
10. **Hall polish:** Kept as Section 8 (real value — BORGA hall identity)
