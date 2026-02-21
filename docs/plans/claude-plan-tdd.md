# Phase 12: Beautiful 3D Golf Course Models — TDD Plan

## Testing Context

**Framework:** Vitest (already configured)
**Run command:** `npm run test`
**Test locations:** `tests/` directory (mirrors src structure) + `src/utils/__tests__/`
**Patterns:** Real THREE.js imports (not mocked), vi.stubGlobal for browser APIs, mock localStorage
**R3F testing:** No R3F canvas rendering tests exist — tests validate geometry/material properties directly on THREE.js objects, not DOM output
**Mocking strategy for Phase 12:** Mock drei's `useTexture` to return dummy `MeshStandardMaterial`. Mock `useGLTF` to return dummy scene/nodes. No WebGL context in jsdom.

## Section 1: Straight Hole Glow-Up

### Tests to write BEFORE implementation:

```
# Bumper profile utility (tests/utils/bumperProfile.test.ts)
# Test: createBumperProfile returns THREE.Shape with correct dimensions
# Test: createBumperProfile applies bevel radius to all 4 corners
# Test: createBumperGeometry returns BufferGeometry
# Test: createBumperGeometry triangle count ≤ 500 (budget assertion)
# Test: createBumperGeometry with curveSegments=8 produces smooth profile
# Test: createBumperGeometry disposes cleanly (no GPU leak)

# Textured materials (tests/hooks/texturedMaterials.test.ts)
# Test: useTexturedMaterials returns MaterialSet interface ({felt, bumper, tee, cup})
# Test: textured felt material has map, normalMap, roughnessMap properties
# Test: textured bumper material has map and normalMap
# Test: UV mode returns emissive materials (unchanged behavior)
# Test: GPU tier low returns flat-color materials (no textures)
# Test: GPU tier mid returns materials with normalMap but no roughnessMap
# Test: GPU tier high returns materials with all texture maps

# Cup geometry (tests/utils/holeGeometry.test.ts)
# Test: createCupGeometry returns recessed CylinderGeometry (inverted)
# Test: cup geometry has correct radius (CUP_RADIUS = 0.054)
# Test: cup has visible depth (height > 0)
# Test: flag pin geometry is a thin cylinder

# Tee geometry
# Test: createTeeGeometry returns raised CylinderGeometry
# Test: tee geometry has correct radius (TEE_RADIUS = 0.03)
# Test: tee has visible height (2-3mm)
```

## Section 2: Shared Geometry Library + All Legacy Types

### Tests to write BEFORE implementation:

```
# Shared components (tests/components/holes/sharedComponents.test.ts)
# Test: BumperRail creates ExtrudeGeometry with rounded profile
# Test: BumperRail accepts variable length
# Test: BumperRail accepts variable position and rotation
# Test: BumperRail height matches BUMPER_HEIGHT (0.08)
# Test: BumperRail thickness matches BUMPER_THICKNESS (0.05)
# Test: Cup component renders recessed cylinder at given position
# Test: TeePad component renders raised cylinder at given position
# Test: geometry disposed on component unmount

# Legacy hole refactoring (tests/components/holes/legacyTypes.test.ts)
# Test: HoleStraight uses shared BumperRail (4 rails)
# Test: HoleLShape uses shared BumperRail (6 rails, LANE_WIDTH=0.5)
# Test: HoleDogleg uses shared BumperRail (LANE_WIDTH=0.6)
# Test: HoleRamp uses taller bumper variant (SIDE_BUMPER_HEIGHT)
# Test: HoleLoop uses shared bumpers + separate obstacle geometry
# Test: HoleTunnel uses shared bumpers for entry/exit zones
# Test: HoleWindmill uses shared bumpers + separate obstacle geometry
# Test: all 7 types include Cup and TeePad sub-components
```

## Section 3: Windmill Obstacle Overhaul

### Tests to write BEFORE implementation:

```
# Windmill model (tests/components/holes/windmill.test.ts)
# Test: WindmillObstacle renders (procedural path)
# Test: WindmillObstacle has tapered tower body (wider at base)
# Test: WindmillObstacle has cone-shaped roof
# Test: blade geometry uses ExtrudeGeometry (not BoxGeometry)
# Test: fixed size ~0.8m × 0.8m × 1.2m regardless of hole dimensions
# Test: UV mode applies dark base + neon emissive to blades
# Test: blade rotation speed ~0.5 rad/sec
# Test: Suspense fallback renders current cylinder+box geometry

# GLTF path (if applicable)
# Test: useGLTF loads windmill model without error
# Test: GLTF model positioned as accent within lane bounds
# Test: GLTF model maintains fixed size
```

## Section 4: Tunnel Obstacle Overhaul

### Tests to write BEFORE implementation:

```
# Tunnel arch (tests/components/holes/tunnel.test.ts)
# Test: TunnelArch creates ExtrudeGeometry (not CylinderGeometry)
# Test: arch profile has semicircle + wall thickness (~0.05m)
# Test: arch extrusion length matches TUNNEL_LENGTH (1.6m)
# Test: arch width = laneW / 2
# Test: brick texture applied to exterior faces
# Test: dark interior material (no texture)
# Test: UV mode applies neon purple emissive
# Test: geometry disposal on unmount
```

## Section 5: Loop + Ramp Overhaul

### Tests to write BEFORE implementation:

```
# Loop (tests/components/holes/loop.test.ts)
# Test: LoopObstacle uses TubeGeometry (not TorusGeometry)
# Test: tube path traces 180° semicircle
# Test: tube segment count ≥ 48
# Test: support pillars are tapered (wider at base)
# Test: cross-brace connects pillars
# Test: metallic material (roughness < 0.5, metalness > 0.2)
# Test: UV mode applies neon cyan emissive

# Ramp (tests/components/holes/ramp.test.ts)
# Test: RampObstacle uses curved bezier profile (not triangular)
# Test: ramp profile has horizontal tangent at entry (smooth transition)
# Test: ramp profile has horizontal tangent at top (smooth plateau)
# Test: ramp surface uses same felt material as base
# Test: side bumpers height = SIDE_BUMPER_HEIGHT
# Test: UV mode matches felt UV materials
```

## Section 6: Dogleg + L-Shape Corner Fillets

### Tests to write BEFORE implementation:

```
# Corner fillets (tests/components/holes/cornerFillets.test.ts)
# Test: Dogleg transition points have fillet mesh geometry
# Test: L-Shape junction has corner fillet mesh
# Test: fillet material matches felt surface material
# Test: fillet position at correct corner coordinates
# Test: hole footprint (width × length) unchanged after fillet addition
# Test: collision AABB not affected by fillet geometry
```

## Section 7: Template Hole Visual Parity

### Tests to write BEFORE implementation:

```
# Segment geometry upgrade (tests/utils/segmentGeometry.test.ts)
# Test: straight segment bumpers use ExtrudeGeometry (not BoxGeometry)
# Test: curve segment bumpers follow arc path
# Test: complex segment (u_turn) bumpers render correctly
# Test: complex segment (s_curve) bumpers render correctly
# Test: complex segment (chicane) bumpers render correctly
# Test: all 11 segment types produce valid {felt, bumperLeft, bumperRight}

# Template material migration (tests/components/holes/templateHole.test.ts)
# Test: TemplateHoleModel uses useMaterials() hook (not shared.ts singletons)
# Test: TemplateHoleModel respects materialProfile setting
# Test: TemplateHoleModel cup is recessed CylinderGeometry
# Test: TemplateHoleModel tee is raised CylinderGeometry with texture
```

## Section 8: Hall Environment Polish

### Tests to write BEFORE implementation:

```
# Hall textures (tests/components/three/hallEnvironment.test.ts)
# Test: HallFloor material has concrete texture maps
# Test: HallFloor UV repeat matches hall dimensions (5×10 for 2m tiles)
# Test: HallFloor reflector material still functional with concrete base
# Test: HallWalls material has steel panel texture maps
# Test: HallWalls UV repeat appropriate for panel scale
# Test: UV mode: floor dark with emissive treatment
# Test: UV mode: walls dark with emissive treatment
# Test: GPU tier low: flat-color materials (no hall textures)
```

## Section 9: Performance + GPU Tier Gating

### Tests to write BEFORE implementation:

```
# GPU tier gating (tests/hooks/gpuTierTextures.test.ts)
# Test: GPU tier low → no texture loading attempted
# Test: GPU tier mid → color + normal maps only (no roughness)
# Test: GPU tier high → all maps loaded (color + normal + roughness)

# Top-down optimization (tests/components/holes/topDownView.test.ts)
# Test: top-down mode → no normal maps applied
# Test: top-down mode → flag pins hidden
# Test: top-down mode → simple box bumper outlines (not rounded)
# Test: 3D mode → full rounded bumpers with textures

# Geometry optimization (tests/utils/geometryOptimization.test.ts)
# Test: mergeVertices reduces vertex count on ExtrudeGeometry
# Test: total triangle count per hole type < 50K
# Test: bumper rail triangle count ≤ 500 per segment (Section 1 budget)
```
