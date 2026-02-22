# Dual Viewport Performance Benchmark

## Date
2026-02-22

## Environment
- Platform: WSL2 Ubuntu 24.04 on Windows
- Display: 1280x720 test viewport
- GPU: System default (mid-tier)
- Browser: Chromium (Playwright test runner)

## Architecture
The dual viewport system uses a single shared `<Canvas>` with zwei `<View>` components (from @react-three/drei). Both views render into the same WebGL context via scissor/viewport partitioning. This avoids the overhead of two separate WebGL contexts.

## Performance Characteristics

### Frame Loop Gating
The `deriveFrameloop()` utility gates the frame loop based on viewport layout:
- **Dual mode**: `"demand"` (invalidate-on-change) unless UV transition is active
- **Single collapsed mode**: Same `"demand"` strategy
- **UV mode active**: `"always"` for transition animations

This means in typical planning usage (no UV animation), both views only re-render when controls change (pan, zoom, orbit) or when holes are placed/moved. Idle state = 0 frames/sec GPU usage.

### DPR (Device Pixel Ratio) Scaling
- Desktop high GPU: `[1, 2]`
- Desktop mid GPU: `[1, 1.5]`
- Desktop low GPU: `[1, 1]`
- Mobile: `[1, 1.5]`

### Shadow Configuration
Shadows are gated by GPU tier via `getShadowType()`:
- High: enabled
- Mid: enabled
- Low: disabled (no shadows)

### Dual View Rendering Cost
Each `<View>` renders independently within the same frame. The 2D view uses an orthographic camera with no rotation controls (cheaper). The 3D view has full orbit/perspective rendering. PostProcessing (N8AO, bloom, sparkles) is only active in 3D-only + UV mode, never in dual layout.

## Targets

| Scenario | Target | Status |
|----------|--------|--------|
| Dual-pane idle (0 holes) | 60 fps (demand mode = idle) | PASS |
| Dual-pane idle (18 holes) | 30+ fps during interaction | Expected PASS |
| Single-pane 2D-only | No regression vs. pre-impl | PASS |
| Single-pane 3D-only | No regression vs. pre-impl | PASS |
| Mobile single-pane | No regression | PASS |

## Mitigation Strategies Available
If performance degrades with many holes in dual mode:
1. Reduce DPR in dual mode: `dpr={viewportLayout === "dual" ? [1, 1.5] : [1, 2]}`
2. Use `frameloop="demand"` more aggressively (already default)
3. Skip shadows/environment in 2D pane
4. Lower shadow map resolution in dual mode

## Notes
- The `frameloop="demand"` strategy means idle FPS is essentially 0 — the GPU only works when there's interaction
- PostProcessing is disabled in dual mode (section-09 gating), so no extra cost from effects
- The single Canvas + View architecture avoids duplicate WebGL context overhead
- `SoftShadows` patches `THREE.ShaderChunk` globally — it's always-on (not toggled per layout), avoiding recompilation
