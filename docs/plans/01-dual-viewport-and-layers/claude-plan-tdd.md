# TDD Plan — 01 Dual Viewport & Layer System

Testing framework: **Vitest v4.0.18** (unit/integration), **Playwright v1.58.2** (visual regression). Existing: 46 test files, 495 tests. No R3F-specific test utilities — tests focus on store logic, placement math, and utilities.

---

## 1b. Architecture Validation Spike

No formal tests. This is a manual proof-of-concept to validate View + EffectComposer compatibility. **Acceptance criteria** documented in a short spike report (works / doesn't work / Plan B triggered).

---

## 2. Architecture Overview

No tests for this section — it's structural/organizational. Testing is covered by the sections below.

---

## 3. Type Definitions

No runtime tests needed — TypeScript compiler validates types at build time. Verify by running `tsc --noEmit` (already done automatically via PostToolUse hook).

---

## 4. Store Architecture — Viewport & Layer State

**File:** `tests/store/viewportLayers.test.ts`

### Viewport Layout Actions

```ts
// Test: setViewportLayout("dual") sets viewportLayout to "dual"
// Test: setViewportLayout("2d-only") sets viewportLayout to "2d-only"
// Test: setViewportLayout("3d-only") sets viewportLayout to "3d-only"

// Test: setSplitRatio(0.5) sets splitRatio to 0.5
// Test: setSplitRatio(0.1) clamps to 0.2
// Test: setSplitRatio(0.95) clamps to 0.8
// Test: setSplitRatio(0.2) sets exactly 0.2 (boundary)
// Test: setSplitRatio(0.8) sets exactly 0.8 (boundary)

// Test: collapseTo("2d") sets viewportLayout to "2d-only" without changing splitRatio
// Test: collapseTo("3d") sets viewportLayout to "3d-only" without changing splitRatio
// Test: collapseTo preserves splitRatio value for later expandDual

// Test: expandDual sets viewportLayout to "dual"
// Test: expandDual after collapseTo preserves the splitRatio from before collapse

// Test: setActiveViewport("2d") sets activeViewport to "2d"
// Test: setActiveViewport("3d") sets activeViewport to "3d"
// Test: setActiveViewport(null) clears activeViewport
```

### Layer Management Actions

```ts
// Test: setLayerVisible("holes", false) sets holes.visible to false
// Test: setLayerVisible("holes", true) sets holes.visible to true
// Test: setLayerVisible does not affect other layers

// Test: setLayerOpacity("holes", 0.5) sets holes.opacity to 0.5
// Test: setLayerOpacity clamps minimum to 0
// Test: setLayerOpacity clamps maximum to 1

// Test: setLayerLocked("holes", true) sets holes.locked to true
// Test: setLayerLocked("holes", false) sets holes.locked to false

// Test: toggleLayerVisible flips from true to false
// Test: toggleLayerVisible flips from false to true

// Test: toggleLayerLocked flips from false to true
// Test: toggleLayerLocked flips from true to false
```

### Default State

```ts
// Test: initial viewportLayout is "dual"
// Test: initial splitRatio is 0.5
// Test: initial activeViewport is null
// Test: all 5 layers present (holes, flowPath, grid, walls, sunIndicator)
// Test: all layers default visible=true, opacity=1, locked=false
```

### Reset

```ts
// Test: resetLayers restores all layers to visible=true, opacity=1, locked=false
// Test: resetLayers works after modifying multiple layers
```

### Persistence & Undo Exclusion

```ts
// Test: viewportLayout is NOT included in partialize output
// Test: layers state is NOT included in partialize output
// Test: activeViewport is NOT included in partialize output
// Test: splitRatio is NOT included in partialize output
```

---

## 5. Split-Pane Layout

### useSplitPane Hook

**File:** `tests/hooks/useSplitPane.test.ts`

```ts
// Test: initial isDragging is false
// Test: starting a drag sets isDragging to true
// Test: ending a drag sets isDragging to false
// Test: mouse move during drag updates splitRatio via store
// Test: ratio is clamped to 0.2 minimum during drag
// Test: ratio is clamped to 0.8 maximum during drag
// Test: double-click calls collapseTo when in dual mode
// Test: double-click calls expandDual when in collapsed mode
```

### SplitDivider Component

No unit tests — UI interaction tested via visual regression (Playwright).

### DualViewport Component

No unit tests — R3F Canvas/View integration tested via visual regression. Store integration tested via store tests.

---

## 6. Viewport Panes & Camera Setup

### Camera Presets Utility

**File:** `tests/utils/cameraPresets.test.ts`

```ts
// Test: getCameraPresets returns all 6 presets (top, front, back, left, right, isometric)
// Test: each preset has a position array of length 3
// Test: each preset has a target array of length 3
// Test: "top" preset position is above hall center (Y > 30)
// Test: "top" preset target is at hall center (X=hallWidth/2, Z=hallLength/2)
// Test: "front" preset is at negative Z, low Y, looking at center
// Test: "back" preset is at positive Z, low Y, looking at center
// Test: "left" preset is at negative X
// Test: "right" preset is at positive X
// Test: "isometric" preset has non-zero X, Y, Z
// Test: all presets have targets at approximately hall center
// Test: different hall dimensions produce different positions
```

### Pointer Event Isolation

No unit tests — this is runtime behavior in R3F event handlers. Validated via manual testing during implementation and visual regression.

### setPointerCapture Migration

No unit tests — drag behavior validated via manual interaction testing. Existing drag logic tests (if any) remain valid since the interface stays the same.

### Keyboard Controls Migration

```ts
// Test: keyboard shortcut dispatches to 2D controls when activeViewport is "2d"
// Test: keyboard shortcut dispatches to 3D controls when activeViewport is "3d"
// Test: camera preset keys (1-6) only work when activeViewport is "3d"
// Test: keyboard shortcuts do nothing when activeViewport is null
```

Note: These may be tested as integration tests if the hook is tightly coupled to R3F refs. If testable in isolation, add to `tests/hooks/useKeyboardControls.test.ts`.

---

## 7. Layer System Implementation

### Layer Integration (Component-Level)

**File:** `tests/components/layerIntegration.test.ts` (or individual component test files)

```ts
// Test: PlacedHoles returns null when layers.holes.visible is false
// Test: PlacedHoles renders when layers.holes.visible is true
// Test: PlacedHoles passes opacity to materials when layers.holes.opacity < 1
// Test: PlacedHoles skips pointer events when layers.holes.locked is true

// Test: FlowPath returns null when layers.flowPath.visible is false
// Test: FlowPath renders when layers.flowPath.visible is true

// Test: FloorGrid returns null when layers.grid.visible is false

// Test: Hall walls return null when layers.walls.visible is false

// Test: SunIndicator returns null when layers.sunIndicator.visible is false
```

Note: R3F component rendering tests may require minimal test harness wrapping. If not feasible, verify via visual regression.

### FlowPath Toggle Migration

```ts
// Test: store no longer has showFlowPath field (or it's removed)
// Test: toggleLayerVisible("flowPath") controls FlowPath visibility
// Test: Toolbar flow path button calls toggleLayerVisible("flowPath")
```

### LayerPanel / LayerRow UI

No unit tests — UI component testing via Playwright visual tests. Store interactions tested via store tests above.

---

## 8. PostProcessing Strategy

### PostProcessing Gating

```ts
// Test: PostProcessing-related components check viewportLayout
// Test: PostProcessing returns null when viewportLayout is "dual"
// Test: PostProcessing renders when viewportLayout is "3d-only"
// Test: UVEffects returns null when viewportLayout is "dual"
```

Note: If PostProcessing components are tightly coupled to R3F, these may be validated via manual testing + architecture review rather than unit tests.

### Environment Gating Migration

**File:** `tests/utils/environmentGating.test.ts`

```ts
// Test: shouldEnableFog returns false when viewportLayout is "2d-only"
// Test: shouldEnableFog returns expected value for "3d-only" with various uvMode states
// Test: shouldEnableFog works correctly in "dual" mode (fog in 3D pane only)

// Test: deriveFrameloop accepts viewportLayout parameter
// Test: deriveFrameloop returns "always" when 3D animations are active in dual mode
// Test: deriveFrameloop returns "demand" when no animations in dual mode

// Test: postprocessing gating returns false for "dual" layout
// Test: postprocessing gating returns true for "3d-only" layout
```

---

## 9. Performance Strategy

No unit tests. Performance validation is manual benchmarking:
- FPS measurement in dual-pane mode with 18 holes
- FPS during drag/orbit interactions
- Comparison to current single-pane baseline
- **Target: 30+ fps dual mode, no regression in collapsed**

Document results in implementation notes.

---

## 10. Existing Feature Migration

### Toolbar/BottomToolbar Migration

```ts
// Test: Toolbar no longer renders view toggle button (or it's hidden on desktop)
// Test: Toolbar flow path button uses toggleLayerVisible("flowPath")
// Test: BottomToolbar flow path button uses toggleLayerVisible("flowPath")
```

### ScreenshotCapture Refactor

```ts
// Test: ScreenshotCapture renders to WebGLRenderTarget (architecture test — may be manual)
// Test: screenshot in 3d-only mode captures only the 3D view
```

Note: Screenshot tests are inherently visual. Playwright visual regression is the primary validation.

---

## 11. Mobile & Responsive

No unit tests. Visual regression via Playwright:
- Verify single-pane mode at mobile viewport (375x667)
- Verify dual-pane mode at desktop viewport (1280x720)
- Verify layer panel as mobile overlay

---

## 12. Testing Strategy (Meta)

### Visual Regression Tests (Playwright)

**File:** `tests/visual/dualViewport.spec.ts` (or similar)

```ts
// Visual: dual-pane layout at 1280x720 (50/50 split)
// Visual: collapsed-to-2D mode (2d-only)
// Visual: collapsed-to-3D mode (3d-only)
// Visual: layer panel visible in sidebar
// Visual: layer with visibility off (holes hidden)
// Visual: mobile single-pane fallback (375x667)
```

### Existing Test Preservation

```ts
// Verify: all 495 existing tests pass unchanged
// Run: npx vitest run — should report 0 failures
```

---

## 13. File Structure

No tests. This is a documentation/reference section.

---

## 14. Implementation Order

No tests. This is sequencing guidance.

---

## Test Execution Commands

```bash
# Unit/integration tests
cd golf-planner && npx vitest run

# Visual regression tests
cd golf-planner && npx playwright test

# Type checking
cd golf-planner && npx tsc --noEmit
```

## Summary

| Section | Test File | Test Count (approx) |
|---------|-----------|-------------------|
| 4. Store | `viewportLayers.test.ts` | ~35 |
| 5. useSplitPane | `useSplitPane.test.ts` | ~8 |
| 6. Camera Presets | `cameraPresets.test.ts` | ~12 |
| 6. Keyboard Controls | `useKeyboardControls.test.ts` | ~4 |
| 7. Layer Integration | `layerIntegration.test.ts` | ~10 |
| 7. FlowPath Migration | (in store tests) | ~3 |
| 8. Environment Gating | `environmentGating.test.ts` | ~8 |
| 10. Feature Migration | (in store/component tests) | ~3 |
| 12. Visual Regression | `dualViewport.spec.ts` | ~6 |
| **Total new tests** | | **~89** |
