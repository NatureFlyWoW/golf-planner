# Phase 12: Beautiful 3D Models — Usage Guide

## Quick Start

```bash
cd golf-planner
npm run dev    # Start dev server at http://localhost:5173
npm test       # Run 495 unit tests (Vitest)
```

## What Was Built

Phase 12 transformed flat-colored mini golf holes into textured, rounded 3D geometry with PBR materials. The hall environment received concrete floor and corrugated steel wall textures. GPU-tier-aware performance optimization ensures smooth rendering across devices.

### 9 Sections Implemented

1. **Straight Hole Glow-Up** — Beveled bumper rails, PBR felt/bumper/tee/cup materials, TexturedHole/FlatHole dispatch with Suspense
2. **Shared Component Library** — BumperRail, Cup, TeePad extracted and reused across all 7 hole types
3. **Windmill Overhaul** — Tapered octagonal tower, cone roof, shaped blades with hub, brick base
4. **Tunnel Overhaul** — ExtrudeGeometry stone archway with entrance frames
5. **Loop/Ramp Overhaul** — TubeGeometry arch for loop, bezier curve ramp slopes
6. **Corner Fillets** — Quarter-cylinder fillets for dogleg and L-shape inner corners
7. **Template Hole Parity** — Rounded bumpers + material migration for segment-based custom holes
8. **Hall Environment** — Concrete floor + corrugated steel wall textures with GPU tier gating
9. **Performance** — GPU tier texture gating, top-down view optimization, mergeVertices on all geometry

## Key Components

### Shared Sub-Components (`src/components/three/holes/`)
| Component | Purpose |
|-----------|---------|
| BumperRail.tsx | Reusable rounded bumper (ExtrudeGeometry + quadratic bevel) |
| Cup.tsx | Recessed cup with flag pin (hidden in top-down) |
| TeePad.tsx | Raised tee pad with marker dot |
| FlagPin.tsx | Flag pin with top-down visibility gating |
| useMaterials.ts | `useMaterials()` hook → MaterialSet + textureMapSet + isTopDown |
| materialPresets.ts | PBR property tables per MaterialProfile |

### Geometry Utilities (`src/utils/`)
| Utility | Purpose |
|---------|---------|
| bumperProfile.ts | `createBumperProfile()` → THREE.Shape, `createBumperGeometry()` → ExtrudeGeometry |
| segmentGeometry.ts | `createSegmentGeometries()` → felt + bumperLeft + bumperRight with mergeVertices |
| filletGeometry.ts | Quarter-cylinder fillet geometry for corners |

### Performance Gating (`src/utils/`)
| Utility | Purpose |
|---------|---------|
| textureGating.ts | `getTextureMapSet(gpuTier, isTopDown)` → which texture maps to load |
| topDownGating.ts | `shouldShowFlagPin()`, `shouldUseSimpleBumpers()`, `shouldSkipNormalMaps()` |

### Hall Environment (`src/components/three/`)
| Component | Purpose |
|-----------|---------|
| HallFloor.tsx | Concrete texture + reflector integration, Suspense fallback |
| HallWalls.tsx | Corrugated steel texture, per-wall UV repeat, material disposal |

## GPU Tier Behavior

| Tier | Textures | Normal Maps | Roughness Maps |
|------|----------|-------------|----------------|
| low  | None (flat color) | None | None |
| mid  | Color + Normal | Yes | No |
| high | All PBR maps | Yes | Yes |

Top-down view: only color maps loaded (normal/roughness invisible from above).

## Triangle Budgets

| Geometry | Budget |
|----------|--------|
| Straight segment | < 500 |
| Curve segment | < 2,000 |
| S-curve segment | < 4,000 |
| 18-hole course | < 50,000 |

## Procedural Textures

All textures are procedurally generated (512px JPG) due to WSL2 environment limitations:
- `public/textures/concrete/` — color, normal, roughness
- `public/textures/steel/` — color, normal, roughness, metalness
- `public/textures/felt/` — color, normal, roughness (per material profile)
- `public/textures/wood/` — color, normal, roughness
- `public/textures/rubber/` — color, normal, roughness
- `public/textures/brick/` — color, normal, roughness

## Test Suite

495 tests across 46 files. New test files:
- `tests/utils/bumperProfile.test.ts` — Bumper shape + geometry
- `tests/utils/segmentGeometry.test.ts` — Segment geometry + triangle budgets
- `tests/hooks/texturedMaterials.test.ts` — Material hook + texture loading
- `tests/hooks/gpuTierTextures.test.ts` — GPU tier texture gating
- `tests/components/holes/topDownView.test.ts` — Top-down optimization
- `tests/utils/geometryOptimization.test.ts` — mergeVertices + budgets
- `tests/components/three/hallEnvironment.test.ts` — Hall texture gating
- `tests/components/holes/templateHole.test.ts` — Template hole migration
