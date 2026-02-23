I now have all the information needed to write the section. Let me compose the complete section content.

# Section 09 -- Title Block

## Overview

This section adds a small architectural title block overlay to the bottom-right corner of the 2D pane. It is a purely HTML/CSS component (not an R3F element) that displays the project name ("Golf Forge"), the current drawing scale (derived from the camera zoom), and today's date.

The title block has no dependencies on other sections and can be implemented in parallel. It does depend on one utility function (`computeScale` from `src/utils/zoomScale.ts`, delivered by Section 05) and on the `mouseStatusStore` (also from Section 05) for reading the current zoom level. If those are not yet available, stub values can be used temporarily.

Section 10 (Integration & Polish) depends on this section being complete.

---

## Background and Context

### Where the Title Block Lives

The 2D pane is rendered inside `DualViewport.tsx` as a `<div ref={pane2DRef}>` with `data-testid="pane-2d"`. This div already contains the drei `<View>` (R3F scene) and the `<MiniMap />` overlay. The title block will be another absolutely-positioned HTML `<div>` added as a sibling inside this same container.

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx`

The relevant JSX structure (desktop layout, around line 310-356):

```tsx
{show2D && (
  <div
    ref={pane2DRef}
    data-testid="pane-2d"
    className="relative h-full overflow-hidden"
    style={{ width: showDivider ? `calc(${splitRatio * 100}% - 6px)` : "100%" }}
    onPointerEnter={() => setActiveViewport("2d")}
  >
    <View style={{ width: "100%", height: "100%" }}>
      {/* ... R3F content ... */}
    </View>
    <MiniMap />
    {/* Title block goes here */}
  </div>
)}
```

### UV Mode

The app has two visual modes toggled via `useStore((s) => s.ui.uvMode)`:

- **Planning mode** (`uvMode = false`): Uses the blacklight dark palette. The title block should use light text on a semi-transparent dark background.
- **UV mode** (`uvMode = true`): Deeper purple/neon color scheme. The title block should use neon-tinted text on a darker semi-transparent background.

The project's CSS theme is already dark-themed (blacklight palette). Semantic tokens: `bg-surface` maps to `#07071A`, `text-primary` maps to `#E8E8FF`, `border-subtle` maps to `#2A2A5E`, `text-secondary` maps to `#B0B0D8`. For UV mode, the component conditionally applies different classes.

### Scale Indicator Dependency

Section 05 creates `src/utils/zoomScale.ts` with a `computeScale()` function and `src/stores/mouseStatusStore.ts` for high-frequency mouse/zoom data. The title block reads the current zoom from `mouseStatusStore` and passes it through `computeScale()` to display a scale string like "1:50".

If Section 05 is not yet implemented, the title block should still be buildable with a hardcoded fallback (e.g., `"1:50"` or reading zoom directly from an R3F hook).

---

## Tests

The TDD plan specifies no unit tests for this section -- the title block is purely visual and tested via Playwright visual regression tests.

### Visual Tests (Playwright)

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/e2e/titleBlock.spec.ts`

Two Playwright tests:

1. **Title block is visible in bottom-right of 2D pane** -- Navigate to the app, wait for the canvas to render, and verify that an element with `data-testid="title-block-2d"` is visible within the 2D pane area. Confirm it is positioned in the bottom-right quadrant of the 2D pane.

2. **Title block shows "Golf Forge" text** -- Locate the title block element and verify that its text content includes "Golf Forge".

```typescript
// tests/e2e/titleBlock.spec.ts
import { expect, test } from "@playwright/test";

test.describe("Title Block 2D", () => {
	test("title block is visible in bottom-right of 2D pane", async ({ page }) => {
		await page.goto("/");
		// Wait for app to render
		await page.waitForSelector('[data-testid="pane-2d"]');
		const titleBlock = page.getByTestId("title-block-2d");
		await expect(titleBlock).toBeVisible();
		// Verify position is in bottom-right of 2D pane
		const pane = await page.getByTestId("pane-2d").boundingBox();
		const block = await titleBlock.boundingBox();
		expect(block).toBeTruthy();
		expect(pane).toBeTruthy();
		if (pane && block) {
			// Block right edge should be near pane right edge
			expect(block.x + block.width).toBeGreaterThan(pane.x + pane.width * 0.7);
			// Block bottom edge should be near pane bottom edge
			expect(block.y + block.height).toBeGreaterThan(pane.y + pane.height * 0.7);
		}
	});

	test('title block shows "Golf Forge" text', async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector('[data-testid="pane-2d"]');
		const titleBlock = page.getByTestId("title-block-2d");
		await expect(titleBlock).toContainText("Golf Forge");
	});
});
```

---

## Implementation Details

### New File: `TitleBlock2D.tsx`

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/TitleBlock2D.tsx`

This is a simple React component that renders an absolutely-positioned HTML overlay.

**Props:** None. All data is read from hooks/stores.

**Content displayed:**
- **Project name:** "Golf Forge" in bold
- **Scale indicator:** e.g., "1:50" -- read from `mouseStatusStore.currentZoom` and passed through `computeScale()`. If Section 05's `mouseStatusStore`/`computeScale` are not yet available, use a temporary fallback.
- **Date:** Current date formatted as YYYY-MM-DD using `new Date().toISOString().slice(0, 10)`

**Styling:**
- Container: `position: absolute; bottom: 8px; right: 8px;` (or Tailwind `absolute bottom-2 right-2`)
- Size: compact -- roughly 120-160px wide, auto height
- Background: semi-transparent dark surface (`bg-surface/80` or `bg-void/80`)
- Border: thin, subtle (`border border-subtle`)
- Border radius: small (`rounded`)
- Text: very small (`text-[10px]`), monospace for scale/date (`font-mono`)
- Padding: tight (`px-2 py-1.5`)
- `pointer-events: none` -- the title block must not intercept clicks/drags on the 2D pane underneath

**UV mode styling:**
- Planning mode: `bg-surface/80 border-subtle text-text-secondary` with project name in `text-primary`
- UV mode: `bg-deep-space/90 border-grid-ghost text-neon-violet` with project name in `text-accent-text`

Read `uvMode` from the store: `const uvMode = useStore((s) => s.ui.uvMode);`

**Component signature:**

```typescript
// src/components/ui/TitleBlock2D.tsx
/**
 * Small architectural title block overlay for the 2D pane.
 * Positioned in the bottom-right corner.
 * Shows project name, drawing scale, and current date.
 * pointer-events: none so it doesn't block canvas interaction.
 */
export function TitleBlock2D(): JSX.Element;
```

The component should be straightforward -- approximately 30-50 lines of JSX with conditional class names for UV mode.

### Scale Reading Strategy

The title block needs the current zoom level to compute the scale string.

**Option A (preferred, if Section 05 is done):** Import `useMouseStatusStore` from `src/stores/mouseStatusStore.ts` and read `currentZoom`. Import `computeScale` from `src/utils/zoomScale.ts`. Display `computeScale(currentZoom, ...)`.

**Option B (fallback, if Section 05 is not yet done):** Display a static scale string `"1:50"` as a placeholder, with a `// TODO: wire to mouseStatusStore` comment. Alternatively, create a minimal inline hook that reads `camera.zoom` via R3F's `useThree` -- but since TitleBlock2D is an HTML component (not inside R3F), this is not directly possible. The mouseStatusStore bridge is the correct pattern.

**Option C (self-contained):** Create a minimal `useTitleBlockScale` hook inside the component file that subscribes to `mouseStatusStore` (or accepts zoom as a prop from DualViewport). This avoids depending on Section 05's full implementation.

The recommended approach: accept `currentZoom` as an optional prop with a default, and compute scale inline using the simple formula from the plan. This makes the component fully self-contained.

### Mounting the Component

Modify `DualViewport.tsx` to render `<TitleBlock2D />` inside the 2D pane container div, as a sibling of `<View>` and `<MiniMap />`.

File to modify: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx`

Add the import at the top:
```typescript
import { TitleBlock2D } from "../ui/TitleBlock2D";
```

Add the component inside the `pane2DRef` div, after `<MiniMap />`:
```tsx
<MiniMap />
<TitleBlock2D />
```

This is the only change needed in DualViewport. The title block positions itself absolutely within the `relative` container div.

### Mobile Handling

On mobile, the app uses a single-canvas layout (no `<View>` components, no `pane2DRef` div). The title block is a 2D-pane-specific overlay and should NOT render on mobile. Since it is mounted inside the `show2D` conditional block within the desktop layout branch of `DualViewport`, it will naturally not appear in the mobile layout (which is the early-return branch at the top of the component). No extra work is needed for mobile exclusion.

---

## File Summary (Actual)

| File | Action | Description |
|------|--------|-------------|
| `src/components/ui/TitleBlock2D.tsx` | **Create** | Title block overlay component |
| `src/components/layout/DualViewport.tsx` | **Modify** | Mount `<TitleBlock2D />` in 2D pane div |
| `tests/visual/titleBlock.spec.ts` | **Create** | Playwright visual tests (moved from `tests/e2e/` to match Playwright testDir) |

## Deviations from Plan

1. **Position: bottom-left instead of bottom-right** — MiniMap occupies `bottom-2 right-2 z-10`, so title block moved to `bottom-2 left-2` to avoid occlusion.
2. **No UV mode styling** — Project convention (`darkTheme.test.ts`) prohibits `uvMode ?` ternaries in UI components. Uses semantic dark theme tokens only.
3. **Local date instead of UTC** — `toLocaleDateString("sv-SE")` for correct local YYYY-MM-DD in Austria timezone.
4. **Added `aria-hidden="true"`** — Decorative overlay.
5. **Test location** — Moved to `tests/visual/` to match `playwright.config.ts` testDir setting.

---

## Dependencies

- **Section 05 (Status Bar):** Provides `mouseStatusStore` (current zoom) and `computeScale()` utility. If not yet available, the title block can use a hardcoded scale or accept zoom as a prop.
- **Section 10 (Integration & Polish):** Depends on this section being complete. Will verify the title block renders correctly alongside all other architectural elements.

No new npm dependencies are required.

---

## Acceptance Criteria

1. A small title block overlay appears in the bottom-right corner of the 2D pane
2. It displays "Golf Forge", a scale indicator (e.g., "1:50"), and the current date
3. It does not intercept pointer events (clicks/drags pass through to the canvas)
4. It uses appropriate styling for both planning mode and UV mode
5. It does not appear on mobile layout
6. Playwright tests pass: title block is visible and contains "Golf Forge"