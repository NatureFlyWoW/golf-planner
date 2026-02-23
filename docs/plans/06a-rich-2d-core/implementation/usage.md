# Split 06a: Rich 2D Core — Usage Guide

## What Was Built

Split 06a transforms the 2D pane from a basic schematic view into a professional architectural floor plan. The 2D pane now renders:

- **Thick architectural walls** with filled rectangles and outlines (ArchitecturalWalls2D)
- **Door swing arcs** showing opening direction (DoorSymbol2D)
- **Window break-line symbols** (WindowSymbol2D)
- **Adaptive labeled grid** with coordinate markers (ArchitecturalGrid2D)
- **Felt-textured hole overlays** showing hole positions in 2D (HoleFelt2D)
- **Status bar** with live cursor coordinates, zoom scale, and location info (StatusBar)
- **Title block** overlay showing "Golf Forge", scale, and date (TitleBlock2D)
- **LOD system** that adapts detail level based on zoom (useZoomLOD)

## Architecture

All 2D architectural components live in `src/components/three/architectural/` and are rendered inside `ArchitecturalFloorPlan`, which gates rendering to the 2D viewport only via `useViewportId()`.

### Key Files Created

| File | Purpose |
|------|---------|
| `src/components/three/architectural/ArchitecturalFloorPlan.tsx` | 2D-only wrapper (viewport gated) |
| `src/components/three/architectural/ArchitecturalWalls2D.tsx` | Wall fill + outline geometry |
| `src/components/three/architectural/ArchitecturalOpenings2D.tsx` | Door/window symbol orchestrator |
| `src/components/three/architectural/DoorSymbol2D.tsx` | Single door swing arc |
| `src/components/three/architectural/WindowSymbol2D.tsx` | Single window break lines |
| `src/components/three/architectural/ArchitecturalGrid2D.tsx` | Labeled grid with LOD |
| `src/components/three/architectural/HoleFelt2D.tsx` | Felt-textured hole overlays |
| `src/components/ui/TitleBlock2D.tsx` | HTML title block overlay |
| `src/components/ui/StatusBar.tsx` | Enhanced status bar with coordinates |
| `src/hooks/useZoomLOD.ts` | LOD level from camera zoom |
| `src/hooks/useViewportId.ts` | Viewport context reader |
| `src/stores/mouseStatusStore.ts` | High-frequency mouse/zoom store |
| `src/utils/wallGeometry.ts` | Wall segment computation |
| `src/utils/arcPoints.ts` | Door arc point generation |
| `src/utils/zoomScale.ts` | Zoom-to-scale conversion |

### LOD Thresholds

| Zoom Level | LOD | Detail |
|-----------|-----|--------|
| < 15 | overview | Outline walls only, major grid lines, solid hole colors |
| 15-40 | standard | Filled walls, door/window symbols, full grid |
| > 40 | detail | All features at full detail |

### Layer Integration

- `layers.walls` → controls walls, door arcs, window symbols
- `layers.grid` → controls architectural grid + labels
- `layers.holes` → controls hole felt overlays

### UV Mode

All architectural components respond to `uvMode` toggle with appropriate color variants.

## Testing

- **639 Vitest unit tests** passing (59 files)
- **5 Playwright visual tests** added (2 for title block, 3 for integration)
- Existing baselines need regeneration (`npx playwright test --update-snapshots`)

## Next Steps

1. Run Playwright tests and regenerate baselines
2. Manual verification: hole placement, layer toggles, mobile layout, UV colors
3. Merge feature branch to master when satisfied
4. Continue with next split in the Visual First reorder (05 → 02 → 03 → ...)
