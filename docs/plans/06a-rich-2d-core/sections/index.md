<!-- PROJECT_CONFIG
runtime: typescript-npm
test_command: npm test
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-rendering-spike
section-02-viewport-aware-scene
section-03-architectural-walls
section-04-door-window-symbols
section-05-status-bar
section-06-grid-refinement
section-07-textured-holes
section-08-lod-system
section-09-title-block
section-10-integration-polish
END_MANIFEST -->

# Implementation Sections Index — Split 06a

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable |
|---------|------------|--------|----------------|
| section-01-rendering-spike | - | 02 | Yes |
| section-02-viewport-aware-scene | 01 | 03, 04, 06, 07 | No |
| section-03-architectural-walls | 02 | 10 | Yes |
| section-04-door-window-symbols | 02 | 10 | Yes |
| section-05-status-bar | - | 10 | Yes |
| section-06-grid-refinement | 02 | 10 | Yes |
| section-07-textured-holes | 02 | 10 | Yes |
| section-08-lod-system | - | 10 | Yes |
| section-09-title-block | - | 10 | Yes |
| section-10-integration-polish | 03, 04, 05, 06, 07, 08, 09 | - | No |

## Execution Order

1. section-01-rendering-spike (no dependencies, validates feasibility)
2. section-02-viewport-aware-scene (after 01, enables 2D-only rendering)
3. section-03-architectural-walls, section-04-door-window-symbols, section-05-status-bar, section-06-grid-refinement, section-07-textured-holes, section-08-lod-system, section-09-title-block (parallel after 02, except 05/08/09 which have no deps)
4. section-10-integration-polish (final, after all others)

## Batch Strategy

- **Batch 1:** section-01 (spike, sequential)
- **Batch 2:** section-02 (viewport awareness, sequential)
- **Batch 3:** section-03, section-04, section-05, section-06 (parallel)
- **Batch 4:** section-07, section-08, section-09 (parallel)
- **Batch 5:** section-10 (integration, sequential)

## Section Summaries

### section-01-rendering-spike
Proof of concept: drei Line, Text, and mesh fill in R3F orthographic View. Validates line crispness, text readability, and rendering quality. Temporary component removed in section-10.

### section-02-viewport-aware-scene
Make SharedScene viewport-aware using ViewportContext. Hall conditionally skips HallWalls/HallOpenings in 2D. FloorGrid skips drei Grid in 2D. Creates useViewportId hook. Handles mobile fallback.

### section-03-architectural-walls
Thick wall rectangles with solid fill and crisp outlines. Wall segment computation (gaps for doors/windows). Batched Line rendering. UV mode colors. Layer integration.

### section-04-door-window-symbols
Door swing arcs (quarter-circle Line polylines). Window break lines. Arc point computation utility. Planning and UV mode colors.

### section-05-status-bar
Enhance LocationBar into StatusBar. Mouse world position tracking (lightweight store). Zoom/scale display. Active layer indicator. Pointer leave handling.

### section-06-grid-refinement
Custom ArchitecturalGrid2D replacing drei Grid in 2D pane. Adaptive spacing by zoom level. Labeled coordinates along edges. Batched line rendering.

### section-07-textured-holes
Felt-textured overlays for placed holes in 2D. Procedural ShaderMaterial with noise. Scale-dependent (overview = solid color, close = texture). UV mode colors.

### section-08-lod-system
useZoomLOD hook returning overview/standard/detail levels. Ref-based (no state, no re-renders). Consumers conditionally render based on LOD level.

### section-09-title-block
HTML overlay in bottom-right of 2D pane. Project name, scale indicator, date. Planning and UV mode styling.

### section-10-integration-polish
Wire everything together. Remove spike. Verify raycast passthrough. Mobile handling. UV mode verification. Layer toggles. Visual regression tests. Comprehensive testing.
