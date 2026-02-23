Now I have comprehensive context. Let me generate the section content.

# Section 10: Integration, Polish, and Testing

## Overview

This is the final section of Split 06a. It wires all previously-built components together, removes the temporary rendering spike, verifies correctness across all modes (planning, UV, mobile), and adds comprehensive visual regression tests.

**User-Visible Outcome:** After this section, the 2D pane displays a complete, professional architectural floor plan with thick walls, door swing arcs, window symbols, a labeled grid, textured hole overlays, a title block, and a live status bar. All elements respond correctly to layer toggles, UV mode, and viewport collapse. Existing functionality (hole placement, 3D view, mobile layout) is unaffected.

**Dependencies:** ALL previous sections (01-09) must be complete before this section begins:

- Section 01 (Rendering Spike) -- the temporary spike component to remove
- Section 02 (Viewport-Aware SharedScene) -- `useViewportId()` hook, viewport-gated rendering
- Section 03 (Architectural Walls) -- `ArchitecturalWalls2D`, `wallGeometry.ts`
- Section 04 (Door/Window Symbols) -- `ArchitecturalOpenings2D`, `arcPoints.ts`
- Section 05 (Status Bar) -- `StatusBar`, `mouseStatusStore.ts`, `zoomScale.ts`
- Section 06 (Grid Refinement) -- `ArchitecturalGrid2D`
- Section 07 (Textured Holes) -- `HoleFelt2D`
- Section 08 (LOD System) -- `useZoomLOD()`
- Section 09 (Title Block) -- `TitleBlock2D`

---

## Tests First

This section has two categories of tests: integration visual tests (Playwright) and a final manual verification checklist.

### Integration Visual Tests (Playwright)

Add tests to `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/visual/golf-forge.spec.ts`. These extend the existing visual regression test file.

```ts
// Append to existing tests/visual/golf-forge.spec.ts

test.describe("Architectural Floor Plan (Split 06a)", () => {
	test("full 2D architectural floor plan at default zoom", async ({ page }) => {
		/**
		 * Comprehensive baseline of the complete architectural floor plan.
		 * Captures the full app at default state — dual viewport with 2D pane
		 * showing thick walls, grid labels, and the status bar at the bottom.
		 */
		await page.goto("/");
		await waitForCanvasRender(page);
		await expect(page).toHaveScreenshot("architectural-2d-default.png");
	});

	test("2D pane with collapsed 3D shows full-width floor plan", async ({ page }) => {
		/**
		 * Collapse the 3D pane so the 2D pane fills the entire viewport.
		 * Verifies that architectural elements scale correctly to full width.
		 */
		await page.goto("/");
		await waitForCanvasRender(page);
		// Collapse to 2D-only via store
		await page.evaluate(() => {
			const store = (window as Record<string, any>).__STORE__;
			if (store) store.getState().collapseTo("2d");
		});
		await page.waitForTimeout(1000);
		await expect(page).toHaveScreenshot("architectural-2d-fullwidth.png");
	});

	test("UV mode shows appropriate dark-theme colors for all architectural elements", async ({ page }) => {
		/**
		 * Toggle UV mode and verify that walls, grid, door arcs, window symbols,
		 * and the title block all switch to their UV color scheme.
		 */
		await page.goto("/");
		await waitForCanvasRender(page);
		await page.locator("[data-testid='uv-toggle']").click();
		await page.waitForTimeout(3000); // UV transition animation
		await expect(page).toHaveScreenshot("architectural-2d-uv-mode.png");
	});

	test("existing visual tests still pass (no regressions)", async ({ page }) => {
		/**
		 * This is a meta-test: run the app at default state and verify
		 * the planning-top-down baseline has not drifted beyond tolerance.
		 * The existing "planning-top-down.png" baseline from earlier tests
		 * will need to be regenerated since the 2D pane now shows
		 * architectural elements. This test documents that expectation.
		 */
		await page.goto("/");
		await waitForCanvasRender(page);
		// The existing planning-top-down baseline must be updated
		// to reflect the new architectural floor plan appearance.
		await expect(page).toHaveScreenshot("planning-top-down.png");
	});
});
```

**Baseline management note:** The existing `planning-top-down.png` baseline will break because the 2D pane now renders architectural walls instead of the previous 3D box-geometry walls. Run `npx playwright test --update-snapshots` after all integration work is complete to regenerate all affected baselines. The `uv-top-down.png` baseline will also need regeneration.

### Manual Verification Checklist

These checks cannot be automated with Vitest or Playwright screenshots and require interactive testing:

1. **Hole placement still works** -- click to place holes in the 2D pane; raycasts must not be blocked by architectural meshes (all have `raycast={() => {}}`)
2. **Layer toggles** -- toggle `walls` layer off/on in the layer panel; all architectural walls, door arcs, and window symbols should hide/show. Toggle `grid` layer off/on; the architectural grid and labels should hide/show
3. **Mobile top-down view** -- resize browser to 375x667; the mobile layout should show simplified architectural walls (outline only, no fill) in top-down mode
4. **Status bar coordinates** -- hover the cursor over the 2D pane and verify the status bar shows live X/Z coordinates; move cursor off the 2D pane and verify coordinates show `--`
5. **Collapsed viewport status** -- collapse the 2D pane (switch to 3D-only); the status bar should show `--` for mouse position since no 2D pane is active

---

## Background and Architecture

### File Inventory

All files created by Sections 01-09 that this section needs to verify and integrate:

| File | Section | Role |
|------|---------|------|
| `src/components/three/architectural/RenderingSpike.tsx` | 01 | Temporary spike (TO REMOVE) |
| `src/components/three/architectural/ArchitecturalFloorPlan.tsx` | 02 | 2D pane wrapper (viewport-gated) |
| `src/components/three/architectural/ArchitecturalWalls2D.tsx` | 03 | Thick wall rectangles + outlines |
| `src/components/three/architectural/ArchitecturalOpenings2D.tsx` | 04 | Door arcs + window symbols |
| `src/components/three/architectural/DoorSymbol2D.tsx` | 04 | Single door swing arc |
| `src/components/three/architectural/WindowSymbol2D.tsx` | 04 | Single window break lines |
| `src/components/three/architectural/ArchitecturalGrid2D.tsx` | 06 | Custom grid with labels |
| `src/components/three/architectural/HoleFelt2D.tsx` | 07 | Felt-textured hole overlays |
| `src/components/ui/StatusBar.tsx` | 05 | Enhanced LocationBar with cursor/zoom display |
| `src/components/ui/TitleBlock2D.tsx` | 09 | HTML title block overlay |
| `src/utils/wallGeometry.ts` | 03 | Wall segment computation |
| `src/utils/arcPoints.ts` | 04 | Door arc point generation |
| `src/utils/zoomScale.ts` | 05 | Zoom-to-scale conversion |
| `src/hooks/useZoomLOD.ts` | 08 | LOD level from camera zoom |
| `src/hooks/useViewportId.ts` | 02 | Read viewport context for id |
| `src/stores/mouseStatusStore.ts` | 05 | Lightweight store for mouse pos + zoom |

Modified files from Sections 02-09:

| File | Section | Changes |
|------|---------|---------|
| `src/components/three/SharedScene.tsx` | 01, 02 | Added `ArchitecturalFloorPlan` + temporary spike import |
| `src/components/three/Hall.tsx` | 02 | Viewport-aware wall/opening rendering |
| `src/components/three/FloorGrid.tsx` | 02 | Skips drei Grid in 2D viewport |
| `src/components/layout/DualViewport.tsx` | 05, 09 | `onPointerLeave`, `TitleBlock2D` mount |
| `src/App.tsx` | 05 | `LocationBar` replaced by `StatusBar` |

### Existing Test Infrastructure

**Vitest:** Tests in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/`. Run via `npm test`. Currently 582+ tests across 52+ files.

**Playwright:** Config at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/playwright.config.ts`. Visual tests at `tests/visual/golf-forge.spec.ts`. Uses Chromium at 1280x720 viewport, 0.1% pixel diff tolerance. Run via `npm run test:visual`.

**Store access for E2E:** The store is exposed as `window.__STORE__` in dev mode (see `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/index.ts`). Playwright tests use `page.evaluate()` to call store methods like `collapseTo("2d")`.

### Key Architecture Patterns

**ViewportContext gating:** Components inside `SharedScene` read `ViewportContext` (provided by `DualViewport`) via the `useViewportId()` hook (created in Section 02). Returns `"2d"`, `"3d"`, or `null` (mobile fallback). All 2D-only architectural components are wrapped in `ArchitecturalFloorPlan` which gates on `useViewportId() === "2d"`.

**Raycast passthrough:** Every non-interactive mesh in the architectural system must set `raycast={() => {}}`. This prevents the architectural geometry from intercepting raycasts meant for hole placement/selection on the floor plane. This is critical -- if any mesh lacks this no-op, hole placement breaks.

**Layer visibility:** Architectural walls and opening symbols respect `layers.walls.visible`. The architectural grid respects `layers.grid.visible`. The `useStore((s) => s.ui.layers.walls)` selector pattern is used throughout.

**LOD system:** `useZoomLOD()` (Section 08) returns `"overview"`, `"standard"`, or `"detail"` based on camera zoom thresholds (15, 40). Components conditionally render features based on this level. At overview zoom, walls show outline only (no fill), door/window symbols are hidden, holes use solid color, and the grid shows only major lines.

**UV mode:** All architectural components check `useStore((s) => s.ui.uvMode)` and switch between planning colors and UV colors.

---

## Implementation Details

### Task 1: Remove the Rendering Spike

**File to modify:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/SharedScene.tsx`

Remove the temporary `RenderingSpike` import and its conditional rendering added in Section 01. The spike component validated that drei `<Line>` and `<Text>` work correctly in the orthographic View; it has served its purpose.

**File to delete:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/RenderingSpike.tsx`

After removal, `SharedScene.tsx` should look like this (the `ArchitecturalFloorPlan` added in Section 02 remains):

```tsx
// SharedScene.tsx after spike removal — sketch, not verbatim
export function SharedScene({ sunData }: SharedSceneProps) {
	const uvMode = useStore((s) => s.ui.uvMode);

	return (
		<>
			{/* lighting setup unchanged */}
			<Hall sunData={sunData} />
			<PlacedHoles />
			<FlowPath />
			<FloorGrid />
			<SunIndicator sunData={sunData} />
			<ArchitecturalFloorPlan />
		</>
	);
}
```

Verify that `ArchitecturalFloorPlan` does NOT import or reference `RenderingSpike`. The spike file should be fully deleted from disk.

### Task 2: Verify Viewport Gating

Confirm that ALL architectural components render ONLY in the 2D viewport. The verification approach:

1. Open the app in dual-viewport mode
2. Inspect the 3D pane visually -- it should show the original 3D box-geometry walls, 3D door/window colored planes, and the drei `<Grid>`. No architectural lines, labels, or title block should appear.
3. Inspect the 2D pane -- it should show thick filled walls with outlines, door arcs, window symbols, labeled grid, and the title block overlay.

**How it works internally:** `ArchitecturalFloorPlan.tsx` (created in Section 02) wraps all 2D-only content and gates rendering on `useViewportId() === "2d"`. `Hall.tsx` (modified in Section 02) skips `<HallWalls>` and `<HallOpenings>` in the 2D viewport. `FloorGrid.tsx` (modified in Section 02) skips the drei `<Grid>` in the 2D viewport.

If any 2D architectural elements leak into the 3D pane, check that:
- `ArchitecturalFloorPlan` correctly reads `useViewportId()` and returns `null` when not `"2d"`
- `Hall.tsx` branches correctly on viewport id
- `FloorGrid.tsx` branches correctly on viewport id

### Task 3: Verify Raycast Passthrough

Every `<mesh>` in the architectural system must have `raycast={() => {}}`. Verify by searching all files in `src/components/three/architectural/` for `<mesh` and confirming each has the `raycast` no-op.

Files to audit:
- `ArchitecturalWalls2D.tsx` -- wall fill meshes
- `HoleFelt2D.tsx` -- felt overlay meshes
- Any other files that create `<mesh>` elements

The `<Line>` components from drei do not need raycast overrides because `Line2` does not participate in raycasting by default.

Test this manually: with architectural elements visible, click on the hall floor to place a hole. The hole should appear at the clicked position. If placement fails (click is intercepted), search for meshes missing `raycast={() => {}}`.

### Task 4: Mobile Top-Down Mode

The mobile layout (viewport width < 768px) uses a single Canvas without `<View>` components and without `ViewportContext`. When `view === "top"`, the mobile layout renders `SharedScene` with an orthographic camera.

In this mode, `useViewportId()` returns `null` (no ViewportContext provider). The `ArchitecturalFloorPlan` component (Section 02) should detect this `null` and treat it as a "mobile-2d" mode, rendering **simplified** architectural walls.

**Simplified mobile rendering:**
- Walls: outline only (no solid fill) to reduce visual weight on small screens
- Door arcs: hidden (too small to be useful on mobile)
- Window symbols: hidden
- Grid: basic labeled grid (major lines only)
- Hole overlays: solid color only (no felt shader)
- Title block: hidden (too small)

The mobile code path in `DualViewport.tsx` is the `if (isMobileViewport)` branch (line ~212 in the existing file). `SharedScene` is rendered directly without a `ViewportContext.Provider`, so `useViewportId()` returns `null`.

Verify by:
1. Setting the browser viewport to 375x667
2. Confirming the app shows the mobile layout (bottom toolbar, no sidebar)
3. Checking that simplified architectural walls appear in top-down view
4. Switching to the 3D view on mobile and confirming no architectural elements appear

### Task 5: UV Mode Color Verification

All architectural components have planning-mode and UV-mode color variants. Verify that toggling UV mode (via the UV toggle button with `data-testid='uv-toggle'`) switches all elements to their UV colors.

**Expected UV colors:**

| Element | Planning Color | UV Color |
|---------|---------------|----------|
| Wall fill | `#3a3a3a` | `#1A1A2E` |
| Wall outline | `#222222` | `#2A2A5E` |
| Door arc line | `#555555` | `#3A3A6E` |
| Window lines | `#6699CC` | `#3300AA` |
| Grid major lines | `#cccccc` | `#2A2A5E` |
| Grid minor lines | `#eeeeee` | `#1A1A4E` |
| Grid labels | `#999999` | `#4A4A8E` |
| Title block | dark text on light bg | light text on dark bg |
| Status bar | inherits theme tokens | inherits theme tokens |

All components read `uvMode` from `useStore((s) => s.ui.uvMode)`.

### Task 6: Layer Toggle Verification

Verify that layer toggles correctly hide/show architectural elements:

1. **walls layer** (`layers.walls`): Controls `ArchitecturalWalls2D`, `ArchitecturalOpenings2D` (door arcs, window symbols). When `walls.visible === false`, all wall segments, door arcs, and window symbols should disappear. The `HallWalls` and `HallOpenings` in the 3D pane also hide (existing behavior).

2. **grid layer** (`layers.grid`): Controls `ArchitecturalGrid2D` (labeled grid) in 2D and the drei `<Grid>` in 3D. When `grid.visible === false`, both should hide.

3. **holes layer** (`layers.holes`): Controls `PlacedHoles` (including `HoleFelt2D` overlays). When `holes.visible === false`, both 3D hole models and 2D felt overlays should hide.

Layer opacity should also work: setting `walls.opacity` to 0.5 should make architectural wall fills semi-transparent. The `useGroupOpacity` hook (or equivalent) from the layer system handles this.

### Task 7: Collapsed Viewport Handling

When the 2D pane is collapsed (via `collapseTo("3d")`), the status bar should show `--` for mouse position and zoom/scale since there is no 2D pane to track.

When the 3D pane is collapsed (via `collapseTo("2d")`), the 2D pane fills the full width. All architectural elements should render correctly at full width. The title block overlay should remain in the bottom-right corner of the expanded 2D pane.

Verify:
1. Start in dual mode
2. Collapse to 3D-only: status bar shows `X: --  Z: --` and `Scale: --`
3. Expand back to dual: status bar resumes showing live coordinates
4. Collapse to 2D-only: full-width 2D pane with all architectural elements, title block in bottom-right

### Task 8: Run Full Test Suite

After all integration work, run the complete test suite to catch regressions:

```bash
# Unit tests (Vitest)
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
npm test

# Type checking
npx tsc --noEmit

# Lint + format check
npm run check

# Visual regression tests (Playwright)
npm run test:visual
```

**Expected baseline updates:** The following Playwright baselines will need regeneration because the 2D pane now shows architectural elements instead of the previous schematic view:

- `planning-top-down.png` -- now shows thick walls, labels, etc.
- `uv-top-down.png` -- now shows UV-colored architectural elements

Run `npx playwright test --update-snapshots` to regenerate these baselines, then review the new screenshots visually to confirm they look correct.

New baselines created by this section:
- `architectural-2d-default.png`
- `architectural-2d-fullwidth.png`
- `architectural-2d-uv-mode.png`

### Task 9: Final Code Cleanup

1. **Remove any TODO/FIXME comments** added during development of Sections 01-09 that are now resolved
2. **Remove any debug logging** (`console.log`, `console.debug`) added during development
3. **Verify imports are sorted** -- Biome auto-sorts imports alphabetically; run `npm run format` to ensure consistency
4. **Check for unused imports** -- the spike removal may leave orphaned imports in `SharedScene.tsx`
5. **Verify TypeScript compiles cleanly** -- `npx tsc --noEmit` should produce zero errors

---

## Files Summary

| Action | File Path |
|--------|-----------|
| **Delete** | `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/architectural/RenderingSpike.tsx` |
| **Modify** | `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/SharedScene.tsx` (remove spike import) |
| **Modify** | `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/visual/golf-forge.spec.ts` (add integration visual tests) |
| **Audit** | All files in `src/components/three/architectural/` (raycast, viewport gating, UV colors) |
| **Audit** | `src/components/ui/StatusBar.tsx` (collapsed viewport handling) |
| **Audit** | `src/components/ui/TitleBlock2D.tsx` (position in collapsed/expanded modes) |
| **Regenerate** | `tests/visual/golf-forge.spec.ts-snapshots/planning-top-down*.png` |
| **Regenerate** | `tests/visual/golf-forge.spec.ts-snapshots/uv-top-down*.png` |

---

## Completion Checklist (Actual)

- [x] `RenderingSpike.tsx` deleted from `src/components/three/architectural/`
- [x] `SharedScene.tsx` no longer imports or renders `RenderingSpike`
- [x] All architectural components render only in the 2D viewport (verified via useViewportId gating)
- [x] All `<mesh>` elements in architectural components have `raycast={() => {}}` (4 instances verified)
- [ ] Hole placement works correctly with architectural elements present (manual test pending)
- [ ] Mobile top-down view shows simplified architectural walls (manual test pending)
- [ ] Mobile 3D view shows no architectural elements (manual test pending)
- [ ] UV mode colors correct for all architectural elements (manual test pending)
- [ ] Layer toggles work (manual test pending)
- [ ] Status bar shows `--` when 2D pane is collapsed (manual test pending)
- [x] Title block stays in bottom-LEFT when 2D pane is full-width (moved from right to avoid MiniMap)
- [x] All Vitest unit tests pass (639 tests, 59 files)
- [x] TypeScript compiles cleanly (`npx tsc --noEmit`)
- [x] Biome formatting applied across ~59 files
- [x] Playwright visual tests added (3 new tests — 4th omitted as redundant with existing test)
- [ ] Existing Playwright baselines need regeneration (run `npx playwright test --update-snapshots`)
- [x] No TODO/FIXME comments or debug logging remain in architectural/
- [x] Imports sorted and no unused imports remain

## Deviations from Plan

1. **3 Playwright tests instead of 4** — 4th test ("existing visual tests still pass") was redundant with existing `planning-top-down.png` baseline test.
2. **Baselines not regenerated in commit** — Playwright runs on Windows side; regeneration is a separate step.
3. **Manual verification items deferred** — Tasks 2-7 (viewport gating, raycast, mobile, UV, layers, collapsed) need interactive testing after commit.