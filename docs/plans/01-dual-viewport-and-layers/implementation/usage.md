# Dual Viewport & Layer System — Usage Guide

## Quick Start

```bash
cd golf-planner && npm run dev
```

Open `http://localhost:5173` in a browser. The app loads in **dual-pane mode** by default on desktop (1280px+).

## Viewport Layouts

### Dual Mode (default)
- Left pane: 2D top-down orthographic view (pan + zoom)
- Right pane: 3D perspective view (orbit, zoom, pan)
- Drag the divider to resize panes (20%-80% range)
- Double-click divider to collapse to the active pane

### Collapsed Modes
- **2D-only**: Double-click divider when 2D pane is active (or is default)
- **3D-only**: Hover/click 3D pane first, then double-click divider
- Double-click again to expand back to dual mode

### Mobile (<768px)
- Falls back to single-pane mode automatically
- Use the bottom toolbar's view toggle to switch between 2D/3D

## Layer System

Open the **Layers** tab in the sidebar to control layer visibility:

| Layer | Controls |
|-------|----------|
| Holes | Visibility toggle, opacity slider, lock |
| Flow Path | Visibility toggle, opacity slider, lock |
| Grid | Visibility toggle, opacity slider, lock |
| Walls | Visibility toggle, opacity slider, lock |
| Sun Indicator | Visibility toggle, opacity slider, lock |

- **Eye icon**: Toggle visibility on/off
- **Slider**: Adjust opacity (0-100%)
- **Lock icon**: Lock layer to prevent editing

## Camera Controls

### 2D Pane
- **Middle/Right mouse drag**: Pan
- **Scroll**: Zoom
- **Double-tap** (touch): Reset camera

### 3D Pane
- **Left drag**: Orbit
- **Right drag**: Pan
- **Scroll**: Zoom
- **Keys 1-6**: Camera presets (isometric, front, back, etc.)
- **R**: Reset camera to isometric
- **Double-tap** (touch): Reset camera

## PostProcessing

PostProcessing effects (N8AO, bloom, sparkles, GodRays) are:
- **Enabled**: In 3D-only mode + UV mode active
- **Disabled**: In dual mode (performance optimization)

## Keyboard Shortcuts

Keyboard shortcuts are viewport-aware:
- Camera presets (1-6, R) only apply to the 3D pane
- Shortcuts fire based on which pane was last hovered/clicked

## Testing

```bash
# Unit/integration tests (582 tests)
npx vitest run

# Visual regression tests (Playwright)
npx playwright test

# Regenerate baselines after layout changes
npx playwright test --update-snapshots

# Type checking
npx tsc --noEmit
```

## Key Files

| File | Purpose |
|------|---------|
| `src/components/layout/DualViewport.tsx` | Main dual viewport container with Canvas + Views |
| `src/components/layout/SplitDivider.tsx` | Resizable pane divider |
| `src/hooks/useSplitPane.ts` | Drag + collapse logic |
| `src/components/ui/LayerPanel.tsx` | Layer control panel |
| `src/components/ui/LayerRow.tsx` | Individual layer row UI |
| `src/types/viewport.ts` | Viewport and layer type definitions |
| `src/contexts/ViewportContext.tsx` | Per-viewport context for event isolation |
| `src/utils/cameraPresets.ts` | Camera preset positions |
| `src/utils/environmentGating.ts` | GPU-tier-based feature gating |
| `tests/visual/dualViewport.spec.ts` | Playwright visual tests for dual viewport |
| `tests/visual/golf-forge.spec.ts` | Existing visual tests (updated for dual mode) |
