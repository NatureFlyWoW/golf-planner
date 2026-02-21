# Phase 12 Research Findings

## Codebase Analysis

### Current 3D Hole Rendering System

**7 Legacy Hole Types** (all in `src/components/three/holes/`):

| Type | Key Geometry | Notable Traits |
|------|-------------|----------------|
| **Straight** | BoxGeometry for felt + 4 box bumpers + CircleGeometry tee/cup | Simplest, all boxes |
| **L-Shape** | 3 BoxGeometry felts (non-overlapping corner) + 6 box bumpers | LANE_WIDTH=0.5 hardcoded |
| **Dogleg** | 3 offset BoxGeometry segments + transition patches + guide bumpers | LANE_WIDTH=0.6, OFFSET=0.15 |
| **Ramp** | ExtrudeGeometry triangle cross-section + BoxGeometry plateau + base felt | RAMP_HEIGHT=0.15, custom material with UV mode |
| **Loop** | TorusGeometry half-torus (R=0.3, tube=0.04) + 2 CylinderGeometry pillars | Metallic material (roughness 0.4, metalness 0.2) |
| **Tunnel** | CylinderGeometry half-cylinder (thetaLength=PI) | archRadius = laneW/2 |
| **Windmill** | CylinderGeometry pillar (R=0.05, H=0.3) + 4 BoxGeometry blades | Blades at 22.5° offsets, no animation |

### Material System

**useMaterials hook** returns `{felt, bumper, tee, cup}` MaterialSet:
- Normal mode: creates materials from PBR presets (materialPresets.ts)
- UV mode: returns singleton UV materials from shared.ts
- UV materials: emissiveIntensity=2.0 across all types
- Materials disposed on unmount (except UV singletons)

**3 Material Profiles** (materialPresets.ts):
- `budget_diy`: tan bumpers (roughness 0.65), dull green felt
- `standard_diy` (default): light gray bumpers (roughness 0.3, metalness 0.1), bright green felt
- `semi_pro`: steel bumpers (roughness 0.25, metalness 0.75), dark green felt

**Shared Constants** (shared.ts):
- BUMPER_HEIGHT=0.08, BUMPER_THICKNESS=0.05, SURFACE_THICKNESS=0.02
- TEE_RADIUS=0.03, CUP_RADIUS=0.054
- polygonOffset on felt (factor=-1) to prevent z-fighting

### Template/Segment System

**TemplateHoleModel.tsx**: Renders custom holes from segment chains
- Uses `computeChainPositions()` for segment layout
- Each segment: SegmentMesh component with felt + left/right bumpers
- First segment gets tee cylinder, last gets cup cylinder

**11 Segment Types** (segmentSpecs.ts):
- Straight: 1m, 2m, 3m
- Curves: 90° left/right (R=0.8), 45° left/right (R=1.2), 30° wide (R=2.0)
- Complex: u_turn (180°), s_curve (90° + 90°), chicane (diagonal)

**Geometry Generation** (segmentGeometry.ts):
- Straight: BoxGeometry per segment
- Curves: RingGeometry for arc cross-sections (inner=felt, outer=bumper)
- Complex: merged geometries for compound shapes
- Returns `{felt, bumperLeft, bumperRight}` BufferGeometry set

### GPU Tier System
- 3 tiers: low/mid/high (from @pmndrs/detect-gpu)
- Low: no shadows, no postprocessing, demand frameloop
- Mid: soft shadows, chromatic aberration, always frameloop in UV
- High: full SSAO (N8AO), god rays, bloom, all effects

### Canvas Configuration
- dpr: [1,1] low / [1,1.5] mobile / [1,2] high
- frameloop: "demand" default, "always" in UV mode (non-low tier)
- shadows: true or "soft" (PCSS on mid+)
- antialias: disabled on mobile

### Post-Processing Pipeline
- Bloom (always), Vignette (always), ToneMapping ACES_FILMIC
- ChromaticAberration (mid+), N8AO (high only), GodRays (high only)
- UV mode: 12 Lightformer tube lights for UV lamp simulation

### drei Utilities Already Imported
Environment, Lightformer, SoftShadows, Sparkles, Grid, Line, Text, Billboard, MeshReflectorMaterial, Html, MapControls, CameraControls, PerformanceMonitor, Stats

**NOT yet imported:** useTexture, useGLTF (these are new for Phase 12)

### Testing
- Vitest, run with `npm run test`
- Unit tests only (no R3F rendering tests)
- Test patterns: mock localStorage, vi.stubGlobal, real THREE.js imports
- 304 tests across 25 files
- Key test files: gpuTier.test.ts, materialPresets.test.ts, segmentSpecs.test.ts

---

## CC0 PBR Texture Availability

### Poly Haven (polyhaven.com) — All CC0
All textures include: Diffuse, Normal (GL+DX), Roughness, Displacement, AO, ARM. Available 1K-8K.

| Need | Texture | Notes |
|------|---------|-------|
| Carpet/Felt | `dirty_carpet` | Olive-brown, not green — needs shader tint |
| Wood | `wood_planks`, `oak_wood_planks` | Excellent quality, multiple variants |
| Brick/Stone | `castle_brick_02_red`, `brick_wall_001` | Multiple variants |
| Concrete | `concrete_floor` | Weathered gray, realistic |
| Corrugated Steel | `corrugated_iron`, `box_profile_metal_sheet` | Up to 16K, perfect for BORGA walls |
| Rubber | None available | — |

### ambientCG (ambientcg.com) — All CC0
All textures include: Color, Normal, Roughness, Displacement, AO. Available 1K-8K.

| Need | Texture ID | Notes |
|------|-----------|-------|
| Carpet/Felt | `Carpet012`, `Fabric026` | Tint green in shader |
| Wood | `WoodFloor040`, `Planks010` | Many variants |
| Brick | `Bricks085` (factory red) | 90+ variants |
| Concrete | `Concrete012`, `Concrete040` | Various finishes |
| Metal | Multiple in Metal category | — |
| Rubber | `Rubber004` | Black gym floor rubber, 68k downloads |

### Recommendation
- **Use 1K-JPG resolution** for web (2K max for hero surfaces)
- **Felt:** Tint a neutral carpet/fabric texture green in shader — no green felt exists CC0
- **Wood rails:** Poly Haven `wood_planks`
- **Walls:** Poly Haven `corrugated_iron` or `box_profile_metal_sheet`
- **Floor:** Poly Haven `concrete_floor`
- **Brick:** ambientCG `Bricks085`
- **Rubber:** ambientCG `Rubber004`

---

## Three.js ExtrudeGeometry for Rounded Bumper Profiles

### Rounded Cross-Section Shape
```typescript
function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2, y = -height / 2;
  shape.moveTo(x, y + radius);
  shape.lineTo(x, y + height - radius);
  shape.quadraticCurveTo(x, y + height, x + radius, y + height);
  shape.lineTo(x + width - radius, y + height);
  shape.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
  shape.lineTo(x + width, y + radius);
  shape.quadraticCurveTo(x + width, y, x + width - radius, y);
  shape.lineTo(x + radius, y);
  shape.quadraticCurveTo(x, y, x, y + radius);
  return shape;
}
```

### Extrusion Settings
- **Straight rails:** `depth` + bevel (`bevelSegments: 3`, `bevelSize: 0.005`)
- **Curved rails:** `extrudePath` with CatmullRomCurve3 (no bevel supported with extrudePath — put rounding in the shape)
- **Segments:** `curveSegments: 8-12` for shape, `steps: 1` straight / `steps: 32-64` curved
- **Optimization:** Always call `mergeVertices()` after extrusion

### Performance
- Rounded rect with curveSegments=12, 4 corners = ~48 perimeter points
- With steps=64 along curved path = ~6,144 triangles per rail
- 4-8 rail segments per hole = 25k-50k triangles — acceptable but warrants merging for full course

---

## R3F Texture Loading Patterns

### useTexture + Suspense
```tsx
const textures = useTexture({
  map: '/textures/felt/color.jpg',
  normalMap: '/textures/felt/normal.jpg',
  roughnessMap: '/textures/felt/roughness.jpg',
});
```

### Key Patterns
- **Preload:** `useTexture.preload('/path')` at module level for critical textures
- **Parallel loading:** Single `useTexture([...])` call avoids waterfall
- **Clone pitfall:** Always `.clone()` textures when using different repeat/wrap settings
- **Fallback:** ErrorBoundary + Suspense with flat-color material fallback
- **Progressive:** `useDeferredValue` keeps old texture visible while new loads
- **Caching:** Automatic by URL — same path = same texture object

---

## GLTF Loading

### useGLTF Pattern
- Draco enabled by default (CDN), zero config
- Always `scene.clone()` for multiple instances
- Scale-to-fit via bounding box calculation
- `gltfjsx` CLI generates typed React components
- Prefetch Draco WASM in index.html for faster first load

### CC0 Windmill Models

**Best option: Kenney Minigolf Kit**
- URL: https://www.kenney.nl/assets/minigolf-kit
- License: CC0 1.0 Universal
- 125+ models including obstacles, GLTF format
- 3MB total zip, individual models ~50KB
- Purpose-built for mini golf, low-poly optimized

**Fallback: Improved Procedural**
- Tapered cylinder tower + cone roof + shaped ExtrudeGeometry blades
- Full control over dimensions and style
- Zero licensing concern, zero bundle size
