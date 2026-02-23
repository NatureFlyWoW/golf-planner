Now I have all the context needed. Let me generate the section content.

# Section 11 -- Mobile & Responsive

## Overview

This section implements mobile-friendly behavior for the dual viewport system. On screens narrower than 768px, the `DualViewport` component falls back to a single-pane layout using the existing `Canvas` pattern. The `ui.view` toggle ("top" / "3d") continues to work for mobile users exactly as before. A new `MobileLayerPanel` overlay provides mobile access to the layer system. Tablet-sized screens (768px--1024px) use the full dual-pane layout.

**Dependencies:** This section depends on:
- **Section 08 (Layer Panel UI):** `LayerPanel.tsx` and `LayerRow.tsx` must exist, as `MobileLayerPanel` wraps the same `LayerPanel` component.
- **Section 10 (Feature Migration):** Toolbar cleanup, flow path toggle migration, and overlay repositioning must be complete so that the mobile toggle for flow path uses `toggleLayerVisible("flowPath")`.

**Blocks:** Section 12 (Polish & Testing) depends on this section.

---

## Tests

There are no unit tests for this section. Validation is performed via Playwright visual regression and manual testing.

### Playwright Visual Regression

These tests belong in the visual regression test file created during section 12, but the test scenarios specific to this section are:

```ts
// File: golf-planner/tests/visual/dualViewport.spec.ts (added during section-12)

// Visual: mobile single-pane fallback (375x667)
//   - Set viewport to 375x667
//   - Verify only one pane is visible (no split divider)
//   - Verify BottomToolbar is visible
//   - Verify the view toggle (2D/3D) works in the overflow menu

// Visual: tablet dual-pane at 768x1024
//   - Set viewport to 768x1024
//   - Verify dual-pane layout renders with divider visible

// Visual: mobile layer panel overlay
//   - Set viewport to 375x667
//   - Open the layer panel via BottomToolbar overflow menu
//   - Verify MobileLayerPanel renders as fullscreen overlay
//   - Verify layer rows with eye/lock toggles and opacity sliders are visible
```

### Manual Testing Checklist

- At 375x667: DualViewport renders single-pane, existing canvas pattern works, `ui.view` toggle switches between top-down and 3D
- At 768x1024: DualViewport renders dual-pane with draggable divider
- At 1280x720: Full desktop dual-pane experience
- Resizing the browser window across the 768px boundary correctly transitions between single-pane and dual-pane
- MobileLayerPanel opens as a fullscreen overlay on mobile, can toggle visibility/opacity/lock per layer, and closes cleanly
- The "Layers" button in the BottomToolbar overflow menu opens the MobileLayerPanel

---

## Background: Existing Mobile Patterns

The project already has a well-established mobile pattern. Understanding this pattern is essential for implementing `MobileLayerPanel` consistently.

### Mobile Detection

The current approach uses `isMobile` from `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/isMobile.ts`:

```ts
export const isMobile =
	typeof window !== "undefined"
		? window.matchMedia("(pointer: coarse)").matches
		: false;
```

This is a static check (evaluated once at module load). It detects touch-primary devices but does NOT respond to window resizing. For the dual viewport mobile detection, a responsive width-based approach is needed instead.

### CSS Breakpoint Pattern

The project uses Tailwind's `md:` prefix (768px) as the desktop breakpoint:
- `Sidebar.tsx` uses `md:flex` and `hidden` to show on desktop, hide on mobile
- `BottomToolbar.tsx` uses `md:hidden` to show only on mobile
- Mobile overlay panels use `md:hidden` on the outer container

### Mobile Overlay Panel Pattern

All existing mobile panels (`MobileBudgetPanel`, `MobileSunControls`, `MobileDetailPanel`) follow this exact structure:

```tsx
export function MobileXxxPanel() {
	const activePanel = useStore((s) => s.ui.activePanel);
	const setActivePanel = useStore((s) => s.setActivePanel);

	if (activePanel !== "xxx") return null;

	function handleClose() {
		setActivePanel(null);
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-subtle px-4 py-3">
				<span className="text-base font-semibold">Panel Title</span>
				<button
					type="button"
					onClick={handleClose}
					className="rounded-lg p-2 text-text-muted hover:bg-plasma hover:text-text-secondary"
				>
					<span className="text-xl">&#x2715;</span>
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-4">
				{/* Panel-specific content */}
			</div>
		</div>
	);
}
```

Key characteristics:
- Gated by `activePanel` state (returns null if not active)
- `fixed inset-0 z-50` for fullscreen overlay
- `md:hidden` so it never renders on desktop
- `bg-surface` background
- Header with title and close button (X icon)
- Scrollable content area

### BottomToolbar Overflow Menu

The `BottomToolbar` at `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/BottomToolbar.tsx` has an overflow popover (`OverflowPopover`) accessed via a "More" button. This popover already includes buttons for toggling features (Snap, Flow, 2D/3D, UV, Sun) and actions (Save, Export, Budget). The layer panel button will be added here.

### ActivePanel Type

At `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/ui.ts`, the `ActivePanel` type defines which mobile panel is shown:

```ts
export type ActivePanel = "holes" | "detail" | "budget" | "sun" | null;
```

This must be extended to include `"layers"`.

---

## Implementation Details

### 1. Mobile Detection in DualViewport

**File to modify:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx`

The `DualViewport` component (created in section 03 and extended in section 04) must detect whether the viewport width is below 768px and render accordingly.

**Approach:** Use a `useIsMobileViewport` hook (or inline logic) based on a `matchMedia` listener for `(min-width: 768px)`. Unlike the static `isMobile` utility, this must be reactive -- it should respond to window resize events so that resizing the browser across the 768px threshold transitions between single-pane and dual-pane in real time.

**Hook signature:**

```ts
// Inline in DualViewport or extracted to src/hooks/useIsMobileViewport.ts
function useIsMobileViewport(): boolean;
```

**Implementation approach:**
- Use `window.matchMedia("(min-width: 768px)")` and listen for `change` events
- Return `true` when viewport width is below 768px
- Clean up the listener on unmount
- SSR-safe: default to `false` (desktop) when `window` is not available

**Rendering logic in DualViewport:**

```
if (isMobileViewport) {
  // Render single-pane: just the existing Canvas with current ThreeCanvas,
  // no split divider, no View components
  // The ui.view toggle controls which camera is active (orthographic top-down vs perspective)
} else {
  // Render dual-pane: split divider + two View panes + Canvas with View.Port
}
```

On mobile, `DualViewport` essentially delegates to the same rendering that `App.tsx` currently does for the canvas area -- a single `<Canvas>` wrapping `<ThreeCanvas>`. This means the mobile path does NOT use the `<View>` component at all. It renders the existing single-canvas pattern, preserving all current mobile behavior (including `BottomToolbar` view toggle, touch interactions, camera controls).

### 2. Preserving ui.view for Mobile

**No changes needed.** The `ui.view` field (`ViewMode = "top" | "3d"`) already exists and drives camera selection in the current `ThreeCanvas`. On mobile, this field continues to control which camera is active. The `BottomToolbar` overflow menu's "2D"/"3D" toggle button already calls `setView()`.

On desktop (dual-pane mode), `ui.view` is unused -- each pane has its own fixed camera type. The `viewportLayout` state controls pane visibility instead.

### 3. MobileLayerPanel Component

**File to create:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/MobileLayerPanel.tsx`

This component follows the exact same pattern as `MobileBudgetPanel`, `MobileSunControls`, and `MobileDetailPanel`.

**Structure:**

```tsx
// File: /mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/MobileLayerPanel.tsx

import { useStore } from "../../store";
import { LayerPanel } from "./LayerPanel";

export function MobileLayerPanel() {
	const activePanel = useStore((s) => s.ui.activePanel);
	const setActivePanel = useStore((s) => s.setActivePanel);

	if (activePanel !== "layers") return null;

	function handleClose() {
		setActivePanel(null);
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden">
			{/* Header with title and close button */}
			{/* Content: reuse LayerPanel component */}
		</div>
	);
}
```

The content area reuses the `LayerPanel` component (created in section 08) which contains the `LayerRow` entries. This avoids duplicating layer UI logic -- the same component renders in the sidebar on desktop and in the mobile overlay on mobile.

### 4. Update ActivePanel Type

**File to modify:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/ui.ts`

Add `"layers"` to the `ActivePanel` union type:

```ts
export type ActivePanel = "holes" | "detail" | "budget" | "sun" | "layers" | null;
```

### 5. Register MobileLayerPanel in App.tsx

**File to modify:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx`

Add `MobileLayerPanel` alongside the other mobile overlay panels:

```tsx
import { MobileLayerPanel } from "./components/ui/MobileLayerPanel";

// In the JSX, after the other mobile panels:
<MobileDetailPanel />
<MobileSunControls />
<MobileBudgetPanel />
<MobileLayerPanel />  // NEW
```

### 6. Add Layers Button to BottomToolbar Overflow

**File to modify:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/BottomToolbar.tsx`

In the `OverflowPopover` component, add a "Layers" button that opens the mobile layer panel:

```tsx
// Inside OverflowPopover, add alongside the existing "Budget" and "Sun" buttons:
<button
	type="button"
	onClick={() => {
		setActivePanel("layers");
		onClose();
	}}
	className="rounded-lg bg-plasma px-4 py-2 text-sm font-medium text-text-secondary"
>
	Layers
</button>
```

This follows the exact same pattern as the existing "Budget" and "Sun" buttons in the overflow popover.

### 7. Tablet Behavior (768px--1024px)

No special handling is needed for tablets. Since the mobile breakpoint is 768px, tablets at or above this width automatically get the full dual-pane layout. The default 50/50 split ratio works well on tablet screens, and users can adjust it via the divider.

The `useSplitPane` hook (from section 03) already supports touch events for drag interaction, so tablet users can resize panes by dragging the divider with their finger.

### 8. Camera Presets on Mobile

On mobile (single-pane mode), the `CameraPresets` overlay (created in section 05) should NOT render -- there is no dedicated 3D pane corner to position it in. When in 3D mode on mobile (`ui.view === "3d"`), camera preset functionality could be accessed via keyboard shortcuts (if a keyboard is attached) but no overlay buttons are shown.

**Implementation:** `CameraPresets` should check the viewport layout. If `viewportLayout` is not `"dual"` and the device is mobile, the component returns `null`. On desktop in `"3d-only"` collapsed mode, camera presets can still render in the top-right corner.

---

## Files Summary

### Files to Create

| File | Description |
|------|-------------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/MobileLayerPanel.tsx` | Mobile overlay for layer controls, following existing mobile panel pattern |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useIsMobileViewport.ts` (optional) | Reactive hook for width-based mobile detection; can be inlined in DualViewport |

### Files to Modify

| File | Change |
|------|--------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/ui.ts` | Add `"layers"` to `ActivePanel` type |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx` | Add mobile detection, render single-pane fallback on <768px |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx` | Import and render `MobileLayerPanel` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/BottomToolbar.tsx` | Add "Layers" button to `OverflowPopover` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraPresets.tsx` | Hide on mobile viewports |

---

## Implementation Checklist

1. [x] Create `useIsMobileViewport` hook using `matchMedia("(min-width: 768px)")` with reactive listener + cleanup
2. [x] Update `DualViewport.tsx` with mobile early-return: single Canvas, no View components, camera based on `ui.view`
3. [x] `ui.view` toggle works on mobile — conditional rendering switches between OrthographicCamera/OrbitControls and PerspectiveCamera/CameraControls
4. [x] `ActivePanel` type already includes `"layers"` (added in section-02)
5. [x] `MobileLayerPanel.tsx` created, reuses `LayerPanel`, follows exact mobile panel pattern
6. [x] `MobileLayerPanel` registered in `App.tsx` after `MobileBudgetPanel`
7. [x] "Layers" button added to `OverflowPopover` in `BottomToolbar.tsx`
8. [x] `CameraPresets` gated with `if (isMobile) return null` — component is also structurally excluded from mobile render path
9. [x] Tablet (768px+) gets dual-pane automatically — no special handling needed

## Implementation Notes

- **MiniMap omitted on mobile**: Intentional — too much screen real estate on small viewports
- **Camera state not preserved on view toggle**: Mobile path re-creates camera subtree when switching 2D/3D, matching pre-DualViewport behavior
- **No ViewportContext on mobile**: Single-pane has no event isolation needs; all consumers handle null context
- **No unit tests**: Validation via Playwright visual regression (section-12) and manual testing
10. Manually test all scenarios: mobile single-pane, tablet dual-pane, desktop dual-pane, window resize across breakpoints