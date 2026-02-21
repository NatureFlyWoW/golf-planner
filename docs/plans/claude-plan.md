# Phase 12: Beautiful 3D Golf Course Models — Implementation Plan

## Overview

This plan upgrades all 3D mini golf hole models in the golf-planner app from flat geometric primitives (BoxGeometry, CircleGeometry) to textured, rounded, detailed 3D models that look like real mini golf course elements. The art direction is **Stylized Realism** — polished PBR materials, rounded geometry, textured surfaces.

**What changes:** Every hole's visual representation transforms. Bumpers become rounded wood rails. Felt becomes textured carpet. Cups become recessed holes with flags. Obstacles (windmill, tunnel, loop, ramp) become detailed 3D models. The hall itself gets concrete floors and steel walls.

**What stays the same:** All placement logic, collision detection, drag/rotate interactions, store structure, data models, and UI panels remain untouched. This is purely a visual layer upgrade.

## Prerequisites

- **Phase 11A must be fully merged to main** before Phase 12 begins. Phase 11A sections 06-12 modify HallFloor.tsx (MeshReflectorMaterial), lighting, and the material system. Phase 12 builds on top of the completed Phase 11A state.
- Section 8 (Hall Environment) must account for the reflector material path on HallFloor.

## Architecture

### Project Structure

The golf-planner is a React 19 + TypeScript + Vite app using:
- `@react-three/fiber` (R3F) for 3D rendering
- `@react-three/drei` for utilities (useTexture, useGLTF, etc.)
- `three` (Three.js) for geometry and materials
- Zustand for state management
- Existing GPU tier system (low/mid/high) for performance gating

### Key Directories

```
src/components/three/holes/
  HoleModel.tsx          # Dispatcher — routes to type-specific component
  HoleStraight.tsx       # 7 legacy hole components
  HoleLShape.tsx
  HoleDogleg.tsx
  HoleRamp.tsx
  HoleLoop.tsx
  HoleTunnel.tsx
  HoleWindmill.tsx
  TemplateHoleModel.tsx  # Segment-based custom holes
  useMaterials.ts        # Material factory hook
  shared.ts              # Constants + singleton UV materials
  materialPresets.ts     # PBR property configs per profile

src/utils/
  segmentGeometry.ts     # Geometry generators for template segments
  bumperProfile.ts       # NEW — rounded bumper cross-section utilities
  holeGeometry.ts        # NEW — shared geometry helpers (cup, tee, etc.)

public/textures/         # NEW — CC0 PBR texture assets
  felt/                  # color.jpg, normal.jpg, roughness.jpg
  wood/                  # color.jpg, normal.jpg, roughness.jpg
  brick/                 # color.jpg, normal.jpg
  concrete/              # color.jpg, normal.jpg, roughness.jpg
  steel/                 # color.jpg, normal.jpg, roughness.jpg, metalness.jpg
  rubber/                # normal.jpg, roughness.jpg

public/models/           # NEW — GLTF obstacle models (if used)
  windmill.glb           # Kenney kit or custom
```

### Texture Asset Acquisition

**Sources:** All CC0 licensed, no attribution required.
| Surface | Source | Texture ID | Resolution | Format |
|---------|--------|-----------|------------|--------|
| Felt/carpet | ambientCG | Carpet012 or Fabric026 | 1K | JPG |
| Wood rail | Poly Haven | wood_planks | 1K | JPG |
| Brick (tunnel) | ambientCG | Bricks085 | 1K | JPG |
| Concrete (floor) | Poly Haven | concrete_floor | 1K | JPG |
| Steel (walls) | Poly Haven | corrugated_iron | 1K | JPG |
| Rubber (tee) | ambientCG | Rubber004 | 1K | JPG |

**Download mechanism:** During Section 1 implementation, download texture JPGs via curl/wget from source CDNs. Each texture set is 3-4 files (color, normal, roughness, optionally metalness) at 1K resolution.

**Total budget:** <10MB for all texture assets combined. Each 1K JPG is ~100-300KB. 6 surfaces × 3-4 maps × ~200KB avg = ~5MB.

**Fallback plan:** If CC0 texture cannot be sourced for a surface, generate a procedural texture using Canvas2D (create an offscreen canvas, draw pattern, use as texture). This is viable for felt (green noise pattern), rubber (dark stipple), and concrete (gray noise).

**Green felt:** No green mini golf felt exists in CC0 libraries. Use a neutral carpet texture and tint it green via the material's `color` property. The normal map provides fiber direction regardless of base color.

### Material System Architecture

**Current:** `useMaterials()` returns `{felt, bumper, tee, cup}` as flat-color `MeshStandardMaterial` instances. UV mode returns hardcoded singleton emissive materials.

**Upgraded:** The material system uses a **two-component pattern** to handle conditional texture loading without breaking React hooks:

1. **`<TexturedHole>`** — wraps textured hole components in Suspense. Only rendered when GPU tier is mid or high.
2. **`<FlatHole>`** — renders with current flat-color materials. Used on low GPU tier or as Suspense/ErrorBoundary fallback.

The parent component (in HoleModel.tsx dispatcher) reads GPU tier and conditionally renders one or the other. This avoids calling `useTexture` conditionally inside a single component, which would violate the Rules of Hooks.

`useMaterials()` hook interface (`MaterialSet`) stays the same. A new `useTexturedMaterials()` hook extends it with texture maps. Only called inside `<TexturedHole>` where Suspense is guaranteed.

**Texture loading strategy:**
1. Textures loaded via drei's `useTexture` inside `<TexturedHole>` (wrapped in Suspense)
2. ErrorBoundary wraps textured components — on failure, falls back to `<FlatHole>`
3. Critical textures (felt, wood) preloaded at module level via `useTexture.preload()`
4. Each texture cloned when different repeat/wrap settings needed across hole types

**GPU tier gating for textures:**
- **High:** Full 1K textures with normal + roughness maps
- **Mid:** 1K textures, normal maps only (no roughness maps)
- **Low:** No textures — `<FlatHole>` rendered (current behavior preserved)

### Geometry Upgrade Strategy

**Bumper rails:** Replace all BoxGeometry bumpers with ExtrudeGeometry using a rounded rectangular cross-section shape. The cross-section is created via `THREE.Shape` with `quadraticCurveTo` corners. For straight rails: extrude with `depth` + bevel (`bevelSegments: 3`). For curved segment rails: use `extrudePath` with path following the arc.

**Triangle budget:** Max 500 triangles per bumper rail segment. Validate in Section 1 before proceeding. If over budget, reduce `curveSegments` (8 minimum for visual quality). With `curveSegments: 8`, a rounded rect has ~32 perimeter points × bevelSegments 3 = ~200 triangles per straight rail. Well within budget.

**Geometry disposal:** All ExtrudeGeometry created in components must be disposed on unmount via `useEffect` cleanup. Same pattern as `useMaterials.ts` material disposal.

**Cups:** Replace flat CircleGeometry with recessed CylinderGeometry (small cylinder subtracted below surface level). Add a thin flag pin mesh using a CylinderGeometry shaft + small cone/plane flag. Flag rendered in 3D view only — conditionally hidden when camera is in top-down/orthographic mode.

**Tees:** Replace flat CircleGeometry with slightly raised CylinderGeometry (2-3mm height) with rubber texture normal map.

**Top-down view:** In orthographic/top-down camera mode, use simplified rendering: no normal maps (irrelevant from directly above), no flag pins (invisible), simple box bumper outlines instead of rounded profiles. This is both a performance optimization and a visual clarity improvement.

**Obstacles:** Each obstacle type gets unique geometry treatment (detailed per section below).

## Section 1: Straight Hole Glow-Up

**Goal:** Transform the simplest hole type completely — the user sees a visible change immediately.

**What changes:**
- Download and add CC0 texture assets to `public/textures/` (felt, wood, rubber) via curl from CDN
- Create `bumperProfile.ts` utility:
  - `createBumperProfile(height, thickness, bevelRadius)` → returns `THREE.Shape` with rounded rect
  - `createBumperGeometry(profile, length)` → returns `ExtrudeGeometry` for straight bumper rails
  - Triangle budget validation: assert <500 triangles per rail
- Create `useTexturedMaterials()` hook that wraps `useTexture` for PBR texture maps
- Create `<TexturedHole>` / `<FlatHole>` pattern in HoleModel.tsx dispatcher
- Replace HoleStraight's 4 BoxGeometry bumpers with ExtrudeGeometry rounded profiles
- Apply felt texture (color + normal + roughness maps) to playing surface
- Replace CircleGeometry cup with recessed CylinderGeometry + flag pin mesh (3D view only)
- Replace CircleGeometry tee with raised CylinderGeometry + rubber texture
- Add geometry disposal via useEffect cleanup
- GPU tier gating: low tier renders `<FlatHole>` (existing behavior)

**Tests:**
- Bumper profile generator returns valid Shape with expected point count
- Bumper geometry generator returns BufferGeometry with ≤500 triangles
- Triangle budget assertion prevents regression
- useTexturedMaterials returns MaterialSet with texture maps
- Fallback to flat-color materials when textures unavailable
- GPU tier gating: low tier gets no textures
- Geometry disposal on unmount (no memory leaks)

## Section 2: Shared Geometry Library + All Legacy Types

**Goal:** All 7 legacy hole types get rounded bumpers, textured felt, recessed cups, rubber tees.

**What changes:**
- Extract shared components: `<BumperRail>`, `<Cup>`, `<TeePad>` as reusable R3F components
- Each component accepts position, rotation, dimensions and renders the upgraded geometry
- Each component handles its own geometry disposal via useEffect cleanup
- Refactor all 7 legacy hole components to use shared sub-components instead of inline geometry
- HoleLShape: shared bumpers for 6 wall segments (LANE_WIDTH=0.5)
- HoleDogleg: shared bumpers for main + guide rails (LANE_WIDTH=0.6)
- HoleRamp: shared bumpers for side rails (taller SIDE_BUMPER_HEIGHT variant)
- HoleLoop: shared bumpers (LANE_WIDTH=0.5), obstacle geometry separate
- HoleTunnel: shared bumpers (entry/exit zones), tunnel arch separate
- HoleWindmill: shared bumpers, windmill obstacle separate

**Design decision:** Obstacle-specific geometry (the ramp slope, loop arch, tunnel arch, windmill tower) is NOT replaced in this section. Only the shared elements (bumpers, felt, cup, tee) are upgraded. Obstacle overhauls happen in sections 3-6.

**Note:** Different hole types have different LANE_WIDTH values (0.5 vs 0.6). Shared components accept width as a parameter.

**Tests:**
- Each shared component renders without errors
- All 7 hole types render with new shared components
- Bumper dimensions match existing BUMPER_HEIGHT/BUMPER_THICKNESS
- Cup/tee positions match existing offsets
- Geometry disposed on component unmount

## Section 3: Windmill Obstacle Overhaul

**Goal:** The windmill becomes a charming miniature building instead of a gray cylinder + box blades.

**What changes:**
- Download Kenney Minigolf Kit GLTF assets (CC0) and evaluate windmill model
  - If GLTF format available: import windmill.glb via `useGLTF`, place as fixed-size accent (~0.8m × 0.8m × 1.2m) within lane
  - If FBX/OBJ only: convert to GLB or fall back to procedural
  - If no suitable model: build improved procedural windmill (tapered cylinder tower, cone roof, door detail, shaped blade ExtrudeGeometry)
- Add slow rotation animation to blades (3D view only, not top-down):
  - Use `useFrame` with delta for smooth rotation
  - Respect frameloop="demand" by calling `invalidate()` when animating
  - Animation speed: ~0.5 rad/sec (gentle)
  - Top-down: static blade pose (no animation, no invalidate calls)
- UV mode: dark tower + neon emissive blade edges
- GLTF loading via `useGLTF` with Suspense, fallback to current cylinder+box geometry

**Tests:**
- Windmill component renders (both GLTF and procedural paths)
- Blade rotation occurs in animation frame (3D view)
- No animation in top-down view
- Fixed size maintained regardless of hole dimensions
- UV mode materials applied correctly
- Suspense fallback renders current geometry

## Section 4: Tunnel Obstacle Overhaul

**Goal:** Tunnel becomes a stone archway you want to putt through.

**What changes:**
- Download brick texture (ambientCG Bricks085 or similar brick texture) for tunnel exterior
- Create arch profile shape using THREE.Shape:
  - Outer arch: semicircle with wall thickness (~0.05m)
  - Base: extends down to ground level
  - Profile creates a cross-section that looks like a stone archway when extruded
- Extrude arch profile along tunnel length (TUNNEL_LENGTH=1.6m) using ExtrudeGeometry
- Apply brick texture to exterior surfaces with proper UV mapping
- Dark interior using dark-colored material (no texture needed inside)
- Slightly wider arch at entrance/exit openings (entrance framing)
- Arch width = laneW / 2 (maintains current archRadius relationship)
- UV mode: dark stone + neon purple arch edge glow

**Tests:**
- Arch geometry has correct profile (semicircle + walls)
- Tunnel length matches TUNNEL_LENGTH constant
- Brick texture loads and applies
- UV mode emissive materials work
- Geometry disposal on unmount

## Section 5: Loop + Ramp Overhaul

**Goal:** Loop becomes smooth engineering, ramp gets a proper curved slope.

**Loop changes:**
- Replace half-torus with TubeGeometry along semicircular path
  - Path: CatmullRomCurve3 or custom curve tracing 180° arc
  - Cross-section: circular tube with proper diameter for ball passage
  - Segment count: 48+ for smooth curve
- Replace cylinder pillars with tapered CylinderGeometry (wider at base)
- Add cross-brace between pillars (small box or cylinder connecting them)
- Metallic material with normal map for brushed metal look
- UV mode: dark metal + neon cyan tube glow

**Ramp changes:**
- Replace triangular ExtrudeGeometry with curved bezier profile:
  - Create THREE.Shape with QuadraticBezierCurve for smooth slope transition
  - Bottom tangent: horizontal (smooth entry)
  - Top tangent: horizontal (smooth plateau transition)
- Felt texture continues up ramp surface (same material as playing surface)
- Side bumpers follow ramp slope (taller variant from existing SIDE_BUMPER_HEIGHT)
- UV mode: same as felt UV with emissive ramp edges

**Tests:**
- Loop TubeGeometry has correct radius and sweep
- Loop support structure renders
- Ramp profile is smooth curve (not triangular)
- Ramp felt material matches base felt
- Higher segment counts verified
- Geometry disposal on unmount

## Section 6: Dogleg + L-Shape Corner Fillets

**Goal:** Angular box joins get smooth visual treatment at corners.

**Simplified approach** (from review feedback — full curve rework was overengineered and would conflict with collision AABB):

**Dogleg changes:**
- Add fillet meshes at transition points between offset segments
  - Small curved patch geometry (quarter-cylinder or bezier surface) that visually smooths the corner
  - Felt material applied to fillet surface for visual continuity
  - Existing straight segment geometry stays the same (preserves collision alignment)
- Guide bumpers at bends: rounded profile (same as shared bumpers)

**L-Shape changes:**
- Add corner fillet mesh at the right-angle junction:
  - Quarter-cylinder fillet in the inner corner with felt texture
  - Smooths the visual transition between entry and exit lanes
  - Straight bumper walls maintained (collision system unaffected)
- Overall footprint unchanged

**Key constraint:** Collision detection uses AABB based on hole footprint. The visual fillets are decorative overlays that do NOT change the collision bounds. The straight-line bumper walls remain as the collision-representative geometry underneath.

**Tests:**
- Corner fillet geometry renders at correct position
- Fillet material matches felt surface
- Hole footprint (width × length) unchanged
- Collision AABB not affected by visual fillets

## Section 7: Template Hole Visual Parity

**Goal:** Custom-built holes from the Hole Builder look just as good as legacy types.

**What changes:**
- Update `segmentGeometry.ts` to generate rounded bumper profiles:
  - Straight segments: ExtrudeGeometry bumpers (same profile as Section 1)
  - Curve segments: ExtrudeGeometry with extrudePath following arc (RingGeometry bumpers replaced)
  - Complex segments: merged ExtrudeGeometry paths
- Apply shared felt texture to all segment felt surfaces
- Add cup and tee sub-components to TemplateHoleModel:
  - Tee on first segment (already exists as cylinder — upgrade to textured)
  - Cup on last segment (already exists — upgrade to recessed)
- **Migrate TemplateHoleModel from singleton materials to `useMaterials()` hook.** Currently TemplateHoleModel bypasses the hook and uses raw imports from shared.ts. This migration is an intentional behavioral change: template holes will now respect the materialProfile setting. Document this as a feature improvement, not a bug.

**Key constraint:** `createSegmentGeometries(specId, feltWidth)` return type stays `{felt, bumperLeft, bumperRight}` BufferGeometry set. Internal geometry changes.

**Tests:**
- All 11 segment types render with rounded bumper profiles
- Template holes visually match legacy hole quality
- TemplateHoleModel respects materialProfile setting
- Segment joining remains smooth (no gaps at connections)
- Complex segments (u_turn, s_curve, chicane) render correctly with new profiles

## Section 8: Hall Environment Polish

**Goal:** The hall looks like a real BORGA steel building.

**What changes:**
- Download concrete floor texture (Poly Haven `concrete_floor`) and steel panel texture (`corrugated_iron`)
- Apply concrete texture to hall floor plane (HallFloor component)
  - Account for existing MeshReflectorMaterial path (from Phase 11A): concrete texture applied as base, reflector effect layered on top
  - Proper UV repeat for 10m × 20m floor (repeat: 5×10 for 2m tile size)
  - Normal map for surface detail
  - Roughness map for realistic light response
- Apply steel panel texture to wall geometry (HallWalls component)
  - Proper UV repeat for wall panel scale
  - Normal + roughness + metalness maps
  - Slightly lighter in normal mode, darker in UV mode
- Adjust environment lighting for better PBR response (minor intensity tweaks)
- Suspense + ErrorBoundary wrapping with flat-color fallback
- GPU tier gating: low tier skips hall textures

**Tests:**
- Floor renders with concrete texture
- Reflector material still works with concrete base
- Walls render with steel texture
- UV mode still applies dark + emissive treatment
- Lighting changes don't break existing visual tests

## Section 9: Performance + GPU Tier Gating

**Goal:** Everything runs smoothly on all devices.

**What changes:**
- GPU tier texture gating (if not already fully implemented in Section 1):
  - Verify high/mid/low paths all work correctly
  - High: full 1K textures (color + normal + roughness)
  - Mid: 1K textures (color + normal only)
  - Low: no textures (flat-color materials)
- Top-down view optimization:
  - Detect orthographic camera / top-down mode via store state
  - Skip normal maps in top-down (flat shading sufficient from above)
  - Hide flag pins in top-down
  - Use simple box bumper outlines in top-down (skip rounded profiles)
- Geometry optimization:
  - Call `mergeVertices()` on all ExtrudeGeometry output in bumperProfile.ts
  - Verify triangle counts per hole type are within budget
  - Ensure geometry disposal on all components
- Test mocking strategy: mock drei's `useTexture` to return dummy `MeshStandardMaterial` in Vitest tests (no WebGL context in jsdom). Mock `useGLTF` similarly.

**Tests:**
- GPU tier low: no textures loaded, flat materials only
- GPU tier mid: textures without roughness maps
- GPU tier high: all texture maps loaded
- Top-down view: simplified material path active, no flag pins
- Triangle count per hole type within budget (<50K total)
- mergeVertices reduces vertex count on ExtrudeGeometry

## Parallelization Opportunities

Sections that can be worked on concurrently (no shared file dependencies):

- **Batch 1:** Section 1 (must be first — establishes shared patterns + texture infrastructure)
- **Batch 2:** Section 2 (depends on Section 1 shared components)
- **Batch 3:** Sections 3, 4, 5 in parallel (independent obstacle overhauls — each modifies a different hole file: HoleWindmill.tsx, HoleTunnel.tsx, HoleLoop.tsx + HoleRamp.tsx)
- **Batch 4:** Section 6 + Section 8 in parallel (dogleg/L-shape modifies HoleDogleg.tsx + HoleLShape.tsx; hall environment modifies HallFloor.tsx + HallWalls.tsx — no overlap)
- **Batch 5:** Section 7 (template holes — depends on bumper profile from Sections 1-2, should see obstacle patterns from Sections 3-5)
- **Batch 6:** Section 9 (performance — touches all files, must be last)

Sections 3+4+5 are the strongest parallelization candidates. Sections 6+8 can also run in parallel.

## Definition of Done

Someone opens the app in 3D view and the mini golf course looks beautiful — felt looks like carpet, bumpers look like wood rails, windmill looks like a windmill, tunnel looks like a stone archway. The whole thing is cohesive and polished. Template holes from the builder look just as good as the legacy types. Mobile devices maintain >30fps. UV mode still works with neon emissive effects over the new textures. Top-down view remains clean and functional for layout planning.
