Now I have all the context I need. Let me generate the section content.

# Section 03: Split-Pane Layout — IMPLEMENTED

## Overview

This section builds the HTML/CSS split-pane layout infrastructure: `DualViewport.tsx`, `SplitDivider.tsx`, and the `useSplitPane` hook. At this stage, **no Canvas or R3F content is wired in** -- the goal is a working resizable two-pane container with a draggable divider, double-click collapse/expand, and proper clamping. The Canvas integration happens in Section 04.

## Implementation Notes

**Actual files created/modified:**
- `src/hooks/useSplitPane.ts` — Hook + exported pure functions (`computeSplitRatio`, `getDoubleClickAction`)
- `src/components/layout/SplitDivider.tsx` — Divider with ARIA, hover/drag states, chevrons
- `src/components/layout/DualViewport.tsx` — Split-pane container with overlays (SunControls, KeyboardHelp, MiniMap), tool cursor, pointer events gating, touchAction
- `src/App.tsx` — Replaced Canvas block with `<DualViewport />`; removed Canvas/ThreeCanvas imports (re-added in Section 04)
- `tests/hooks/useSplitPane.test.ts` — 17 tests (pure functions + store integration)

**Deviations from plan:**
- Tests use pure function testing instead of `renderHook` since `@testing-library/react` is not installed. Hook logic is extracted into `computeSplitRatio` and `getDoubleClickAction` exported functions.
- Mouse and touch event handlers merged into single `useEffect` with shared `handleEnd` callback (review fix).
- Zero-width container guard added to `computeSplitRatio` (returns 0.5) and event handlers (review fix).
- `getDoubleClickAction` uses `ViewportLayout` type instead of `string` (review fix).
- Overlay components (SunControls, KeyboardHelp, MiniMap) moved inside DualViewport (review fix — plan said to keep them visible).
- Tool cursor, pointer events gating, touchAction added to DualViewport container (review fix — plan noted these should be applied).
- 17 tests total (vs 8 planned): 7 computeSplitRatio, 5 getDoubleClickAction, 2 store drag integration, 3 store double-click integration.
- Total: 48 files, 548 tests passing.

## Dependencies

- **Section 02 (Types & Store)** must be completed first. This section reads `viewportLayout`, `splitRatio`, and `activeViewport` from the store, and calls `setSplitRatio`, `collapseTo`, `expandDual`, and `setActiveViewport` actions.

## Files to Create

| File | Purpose |
|------|---------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx` | Main split-pane container replacing the canvas area in App.tsx |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/SplitDivider.tsx` | Thin draggable divider with collapse chevrons |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useSplitPane.ts` | Custom hook managing resize drag interaction |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/useSplitPane.test.ts` | Unit tests for the hook |

## Files to Modify

| File | Change |
|------|--------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx` | Replace the `<div className="relative flex-1">` + `<Canvas>` block with `<DualViewport>` |

---

## Tests First

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/useSplitPane.test.ts`

The `useSplitPane` hook manages drag state and delegates ratio updates to the Zustand store. Tests use `@testing-library/react`'s `renderHook` to exercise the hook in isolation. Since the hook interacts with DOM events (mousedown/mousemove/mouseup on document) and reads container width, some tests require mocking `getBoundingClientRect`.

```ts
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
// Assumes useSplitPane is exported from src/hooks/useSplitPane.ts

describe("useSplitPane", () => {
	// Test: initial isDragging is false
	// The hook exposes an isDragging boolean (or ref.current) that starts false.

	// Test: starting a drag sets isDragging to true
	// Simulate calling the onMouseDown handler returned by the hook.
	// Verify isDragging becomes true.

	// Test: ending a drag sets isDragging to false
	// After starting a drag, simulate mouseup on document.
	// Verify isDragging returns to false.

	// Test: mouse move during drag updates splitRatio via store
	// Start a drag, simulate mousemove with a clientX that translates to 0.6
	// of the container width. Verify the store's setSplitRatio was called
	// with approximately 0.6.

	// Test: ratio is clamped to 0.2 minimum during drag
	// Simulate mousemove with clientX near the left edge (e.g., 10% of container).
	// Verify setSplitRatio receives 0.2 (the minimum).

	// Test: ratio is clamped to 0.8 maximum during drag
	// Simulate mousemove with clientX near the right edge (e.g., 95% of container).
	// Verify setSplitRatio receives 0.8 (the maximum).

	// Test: double-click calls collapseTo when in dual mode
	// When viewportLayout is "dual", a double-click on the divider should call
	// collapseTo. The collapse direction should be based on activeViewport
	// or default to "2d".

	// Test: double-click calls expandDual when in collapsed mode
	// When viewportLayout is "2d-only" or "3d-only", a double-click on the
	// divider should call expandDual to restore dual-pane mode.
});
```

### Test Implementation Notes

- The hook needs a container ref to measure width. In tests, create a mock element with a stubbed `getBoundingClientRect` returning a known width (e.g., 1000px).
- Mouse events during drag are on the `document`, not the divider element itself -- this is standard drag-to-resize behavior.
- The hook reads `viewportLayout` from the Zustand store. Before each test, reset the store to its default state using the store's `setState` or a reset utility.
- Touch event tests mirror mouse tests but use `touchstart`/`touchmove`/`touchend`. These can be added as supplementary tests but the 8 core tests above are the priority.

---

## Implementation Details

### useSplitPane Hook

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useSplitPane.ts`

This hook encapsulates all drag-to-resize logic. Approximately 80-100 lines of code.

**Signature:**

```ts
function useSplitPane(containerRef: React.RefObject<HTMLDivElement | null>): {
	isDragging: boolean;
	onDividerMouseDown: (e: React.MouseEvent) => void;
	onDividerTouchStart: (e: React.TouchEvent) => void;
	onDividerDoubleClick: () => void;
};
```

**Internal state and refs:**

- `isDragging` -- a `useState` boolean (exposed for CSS cursor changes and pointer-events gating)
- No local ratio state -- the ratio lives in the Zustand store (`splitRatio`). The hook calls `setSplitRatio` on every mouse move during drag.

**Mouse drag flow:**

1. `onDividerMouseDown`: Set `isDragging = true`. Attach `mousemove` and `mouseup` listeners on `document`. Set `document.body.style.cursor = "col-resize"` and `document.body.style.userSelect = "none"`.
2. `mousemove` handler: Read `containerRef.current.getBoundingClientRect()` to get left edge and width. Compute `ratio = (clientX - rect.left) / rect.width`. Clamp to `[0.2, 0.8]`. Call `setSplitRatio(clampedRatio)`.
3. `mouseup` handler: Set `isDragging = false`. Remove document listeners. Reset `document.body.style.cursor` and `document.body.style.userSelect`.

**Touch drag flow:**

Same as mouse but uses `e.touches[0].clientX` and `touchmove`/`touchend` events.

**Double-click behavior:**

`onDividerDoubleClick`:
- If `viewportLayout === "dual"`, call `collapseTo("2d")` (or based on which pane the mouse was last in, using `activeViewport` from the store -- defaulting to `"2d"` if null).
- If `viewportLayout === "2d-only"` or `"3d-only"`, call `expandDual()`.

**Cleanup:** The hook uses `useEffect` cleanup to remove any dangling document listeners if the component unmounts during a drag.

---

### SplitDivider Component

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/SplitDivider.tsx`

A presentational component for the divider bar between the two panes.

**Props:**

```ts
type SplitDividerProps = {
	isDragging: boolean;
	onMouseDown: (e: React.MouseEvent) => void;
	onTouchStart: (e: React.TouchEvent) => void;
	onDoubleClick: () => void;
};
```

**Visual design:**

- The divider is a `div` with a narrow visual bar (4px wide) inside a wider touch hitzone (12px wide).
- The outer div is `w-3` (12px) with `cursor-col-resize` and `flex-shrink-0`.
- The inner visual bar is `w-1` (4px), centered with `mx-auto`, `h-full`.
- **Default state:** The inner bar uses `bg-border-subtle` (or equivalent neutral Tailwind class from the project's dark theme).
- **Hover state:** The bar brightens to an accent color. Two small chevron icons (`ChevronLeft` and `ChevronRight` from `lucide-react`) appear vertically centered, indicating collapse direction. These only render on hover via a group-hover pattern.
- **Dragging state:** The bar uses the accent color at full opacity. Chevrons hidden.

**Event wiring:** The outer div receives `onMouseDown`, `onTouchStart`, and `onDoubleClick` from props.

**Accessibility:** The divider has `role="separator"`, `aria-orientation="vertical"`, and `aria-valuenow` set to the current split ratio percentage (read from store). `tabIndex={0}` allows keyboard focus; keyboard arrow keys can adjust the ratio (optional enhancement -- not required for this section).

---

### DualViewport Component

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx`

This is the main container that replaces the current canvas area in `App.tsx`. In this section, it sets up the HTML layout only. Canvas and R3F content are wired in Section 04.

**Responsibilities:**

1. Render two pane divs side by side with the `SplitDivider` between them.
2. Size the panes according to `splitRatio` from the store.
3. Handle collapsed states: when `viewportLayout` is `"2d-only"`, only the left pane renders at 100% width (divider hidden). When `"3d-only"`, only the right pane renders at 100% width.
4. Set `activeViewport` in the store on `onPointerEnter` of each pane div.
5. Provide a container ref for the `useSplitPane` hook and (later in Section 04) for `eventSource` on the Canvas.

**Structure (pseudocode):**

```tsx
function DualViewport() {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewportLayout = useStore(s => s.ui.viewportLayout);
	const splitRatio = useStore(s => s.ui.splitRatio);
	const setActiveViewport = useStore(s => s.setActiveViewport);
	const { isDragging, onDividerMouseDown, onDividerTouchStart, onDividerDoubleClick } =
		useSplitPane(containerRef);

	const show2D = viewportLayout !== "3d-only";
	const show3D = viewportLayout !== "2d-only";
	const showDivider = viewportLayout === "dual";

	return (
		<div ref={containerRef} className="relative flex flex-1 overflow-hidden">
			{show2D && (
				<div
					className="relative h-full overflow-hidden"
					style={{ width: showDivider ? `${splitRatio * 100}%` : "100%" }}
					onPointerEnter={() => setActiveViewport("2d")}
				>
					{/* 2D pane content — placeholder div with label for now */}
					{/* Canvas View will be wired in Section 04 */}
				</div>
			)}
			{showDivider && (
				<SplitDivider
					isDragging={isDragging}
					onMouseDown={onDividerMouseDown}
					onTouchStart={onDividerTouchStart}
					onDoubleClick={onDividerDoubleClick}
				/>
			)}
			{show3D && (
				<div
					className="relative h-full overflow-hidden"
					style={{ width: showDivider ? `${(1 - splitRatio) * 100}%` : "100%" }}
					onPointerEnter={() => setActiveViewport("3d")}
				>
					{/* 3D pane content — placeholder div with label for now */}
					{/* Canvas View will be wired in Section 04 */}
				</div>
			)}
			{/* Canvas element will be added in Section 04 as:
			    <Canvas eventSource={containerRef} style={{position: "absolute", inset: 0}}>
			      <View.Port />
			    </Canvas>
			*/}
		</div>
	);
}
```

**Pane width calculation:** When in `"dual"` mode, the 2D pane gets `splitRatio * 100%` width and the 3D pane gets the remainder. The divider itself is `12px` (flex-shrink-0), so the panes use `calc()` or flexbox to account for it. The simplest approach is to make the container a flex row, give the divider a fixed width, and let the panes use `flex: none` with percentage widths of the remaining space. Alternatively, use `calc(${splitRatio * 100}% - 6px)` on each pane to split the divider's width evenly.

**Cursor gating during drag:** When `isDragging` is true, the container div adds `cursor-col-resize` and `select-none` classes to prevent content selection and show the resize cursor even when the mouse moves over pane content.

**Pane labels (temporary):** For this section only (before Section 04 adds Canvas), each pane can render a centered label like "2D Viewport" / "3D Viewport" with a subtle background, so the implementer can visually verify the layout. These are removed when the Canvas is wired in.

---

### App.tsx Modification

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx`

Replace the current canvas area block:

```tsx
// REMOVE this block (lines ~60-87 in current App.tsx):
<div
	className="relative flex-1"
	style={{
		cursor: tool === "delete" ? "crosshair" : "default",
		touchAction: "none",
		pointerEvents: canvasPointerEvents(transitioning),
	}}
>
	<Canvas ...>
		<Suspense fallback={null}>
			<ThreeCanvas sunData={sunData} />
		</Suspense>
	</Canvas>
	<SunControls />
	<KeyboardHelp />
	<MiniMap />
</div>
```

Replace with:

```tsx
// ADD:
<DualViewport />
```

The `SunControls`, `KeyboardHelp`, and `MiniMap` overlays move **inside** `DualViewport` (they are positioned absolutely within the viewport container). However, for this section, they can remain temporarily in their original positions or be moved as part of this change. The clean approach is to pass them as children or render them inside DualViewport from the start, but the exact overlay positioning is finalized in Section 10 (Feature Migration). For now, keep them rendered inside DualViewport's container div so they remain visible.

The Canvas, ThreeCanvas, and all R3F-related props (`dpr`, `frameloop`, `shadows`, `gl` config) move into DualViewport in Section 04. For this section, DualViewport renders placeholder content in each pane.

**Important:** The `tool === "delete"` cursor style should be applied to the DualViewport container (or each pane div) since that is where pointer events will occur. Pass `tool` as a prop or read it from the store inside DualViewport.

---

## Key Design Decisions

1. **Ratio lives in Zustand, not local state.** The `splitRatio` is stored in the Zustand store (added in Section 02) so that `collapseTo` / `expandDual` can preserve and restore it. The `useSplitPane` hook reads and writes through the store.

2. **The divider hitzone is wider than the visual bar.** The 12px hitzone makes it easy to grab on both desktop and touch devices, while the 4px visual bar keeps the UI clean.

3. **No Canvas in this section.** The split-pane is built as pure HTML/CSS first, validated with placeholder content. This isolates layout concerns from R3F integration and makes the layout independently testable.

4. **Clamping at 0.2-0.8.** Users cannot drag the divider past 20%/80% of the container width. This prevents either pane from becoming too small to be useful. Full collapse (0% / 100%) is only available via double-click or `collapseTo`.

5. **Collapse via viewportLayout, not ratio.** Collapsing does not set the ratio to 0 or 1. Instead, it sets `viewportLayout` to `"2d-only"` or `"3d-only"`, which changes which panes are rendered. The `splitRatio` is preserved so that re-expanding to `"dual"` restores the previous split position.

6. **Flex layout approach.** The container is `display: flex; flex-direction: row`. The divider has `flex-shrink: 0`. The panes use percentage widths. This naturally handles the layout math without manual calculations.

---

## Acceptance Criteria

- Two panes render side by side with a visible divider between them.
- Dragging the divider resizes both panes in real time.
- The split ratio is clamped between 20% and 80% during drag.
- Double-clicking the divider collapses to a single pane; double-clicking again restores dual mode.
- In collapsed mode (`"2d-only"` or `"3d-only"`), only one pane is visible at full width, divider is hidden.
- Hovering over a pane updates `activeViewport` in the store.
- The divider shows hover feedback (accent color, chevrons).
- All 8 `useSplitPane` tests pass.
- Existing tests (495) continue to pass unchanged.
- `tsc --noEmit` reports no type errors.