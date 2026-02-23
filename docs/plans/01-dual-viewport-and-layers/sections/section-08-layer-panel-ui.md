Neither exists yet. They will be created by prior sections (02 for types, 07 for wiring). Now I have all the context needed to write the section.

# Section 08 -- Layer Panel UI

## Overview

This section builds the user-facing layer controls: `LayerPanel.tsx` and `LayerRow.tsx` components for the desktop sidebar, and a `MobileLayerPanel.tsx` overlay for mobile. It also updates the sidebar to include "Layers" as a 4th tab and updates the `SidebarTab` / `ActivePanel` types.

This section is purely UI -- it reads layer state from the store and calls store actions to modify it. All store actions (`setLayerVisible`, `setLayerOpacity`, `setLayerLocked`, `toggleLayerVisible`, `toggleLayerLocked`, `resetLayers`) and types (`LayerId`, `LayerState`) are created in prior sections (section-02 for types/store, section-07 for wiring layer state to scene components).

## Dependencies

- **section-02-types-and-store**: Provides `LayerId`, `LayerState` types in `src/types/viewport.ts`, and all layer store actions (`setLayerVisible`, `setLayerOpacity`, `setLayerLocked`, `toggleLayerVisible`, `toggleLayerLocked`, `resetLayers`) in `src/store/store.ts`. Also provides the `layers: Record<LayerId, LayerState>` field on `UIState`.
- **section-07-layer-state**: Wires layer state to renderable components (PlacedHoles, FlowPath, etc.). The LayerPanel UI toggles produced here only have visible effect once section-07 is complete.

## Tests

The TDD plan states: **"LayerPanel / LayerRow UI -- No unit tests. UI component testing via Playwright visual tests. Store interactions tested via store tests above."**

This means there are no new test files to create for this section. The store actions are already tested by `tests/store/viewportLayers.test.ts` (created in section-02). Visual validation of the layer panel UI will be done in section-12 via Playwright visual regression tests (`tests/visual/dualViewport.spec.ts`).

However, a quick smoke test can optionally be added as a lightweight integration sanity check.

### Optional Smoke Test

**File:** `golf-planner/tests/components/layerPanel.test.ts`

```ts
/**
 * Optional smoke test for LayerPanel.
 * Verifies the layer definitions array matches the 5 expected layers.
 * Store interactions are tested in tests/store/viewportLayers.test.ts.
 * Visual appearance tested via Playwright in tests/visual/dualViewport.spec.ts.
 */

// Test: LAYER_DEFINITIONS contains exactly 5 entries
// Test: LAYER_DEFINITIONS includes entries for "holes", "flowPath", "grid", "walls", "sunIndicator"
// Test: each definition has an id, label, and icon property
```

These are trivially simple and exist mainly as documentation that the constant was reviewed.

## Implementation Details

### 1. Update SidebarTab and ActivePanel Types

**File:** `golf-planner/src/types/ui.ts`

Add `"layers"` to both `SidebarTab` and `ActivePanel` union types:

```ts
export type SidebarTab = "holes" | "detail" | "budget" | "layers";
export type ActivePanel = "holes" | "detail" | "budget" | "sun" | "layers" | null;
```

This is a type-only change. The `setSidebarTab` and `setActivePanel` store actions already accept these types generically (they use `UIState["sidebarTab"]` and `UIState["activePanel"]` as parameter types), so no store changes are needed for this step.

### 2. Layer Definitions Constant

**File:** `golf-planner/src/constants/layers.ts`

Define the ordered list of layers with display metadata. This constant drives both `LayerPanel` and `MobileLayerPanel`.

```ts
import type { LayerId } from "../types/viewport";

export type LayerDefinition = {
	id: LayerId;
	label: string;
	icon: string; // Unicode character used as icon (project does not use lucide-react)
};

/**
 * Ordered list of layer definitions for the Layer Panel UI.
 * Order matches the visual stacking order (top-most layer first).
 */
export const LAYER_DEFINITIONS: LayerDefinition[] = [
	{ id: "holes", label: "Holes", icon: "\u26F3" },         // flag in hole
	{ id: "flowPath", label: "Flow Path", icon: "\u2192" },   // right arrow
	{ id: "grid", label: "Grid", icon: "\u2317" },            // viewfinder/grid
	{ id: "walls", label: "Walls", icon: "\u25A1" },          // white square
	{ id: "sunIndicator", label: "Sun", icon: "\u2600" },     // sun
];
```

**Important note on icons:** The existing codebase uses unicode characters for all toolbar icons (e.g., `\u2196` for Select, `+` for Place, `\u2715` for Delete). This section follows that same pattern. Do NOT add lucide-react as a dependency.

### 3. LayerRow Component

**File:** `golf-planner/src/components/ui/LayerRow.tsx`

A single row in the layer panel controlling one layer. Layout:

```
[Eye icon] [Layer label] [------- Opacity slider -------] [Lock icon]
```

**Props:**
- `layerId: LayerId` -- which layer this row controls
- `label: string` -- display label
- `icon: string` -- unicode icon character
- `visible: boolean` -- current visibility state
- `opacity: number` -- current opacity (0-1)
- `locked: boolean` -- current lock state
- `onToggleVisible: () => void` -- callback to toggle visibility
- `onOpacityChange: (value: number) => void` -- callback for opacity change
- `onToggleLocked: () => void` -- callback to toggle lock

**Component structure (pseudocode):**

```tsx
export function LayerRow({
	label,
	icon,
	visible,
	opacity,
	locked,
	onToggleVisible,
	onOpacityChange,
	onToggleLocked,
}: LayerRowProps) {
	// Render a horizontal row with:
	// 1. Eye toggle button: shows open-eye unicode when visible, closed-eye when not
	//    Unicode: visible ? "\uD83D\uDC41" (eye) : use a simpler approach with text
	//    Simpler: visible ? "\u25C9" (fisheye/circle) : "\u25CE" (bullseye/empty)
	//    Or just text: "👁" vs "—"
	// 2. Icon + Label span
	// 3. Range input (opacity slider) 0-100, maps to 0-1
	//    Disabled/dimmed when !visible
	// 4. Lock toggle button: locked ? "\uD83D\uDD12" : "\uD83D\uDD13"
	//    Simpler: locked ? "🔒" : "🔓" or unicode padlock characters
}
```

**Styling notes:**
- Use existing Tailwind classes from the project: `bg-plasma`, `text-text-secondary`, `hover:bg-grid-ghost`, etc.
- When the layer is hidden (`visible=false`), dim the entire row with `opacity-50`
- The opacity slider uses a native `<input type="range">` with `min="0" max="100" step="1"`. The slider value is `Math.round(opacity * 100)`. On change, call `onOpacityChange(Number(e.target.value) / 100)`.
- Keep the component stateless -- all state flows from props (which come from the Zustand store via `LayerPanel`).

**Accessibility:**
- Eye toggle: `aria-label="Toggle {label} visibility"`
- Opacity slider: `aria-label="{label} opacity"`
- Lock toggle: `aria-label="Toggle {label} lock"`

### 4. LayerPanel Component

**File:** `golf-planner/src/components/ui/LayerPanel.tsx`

Sidebar tab content that renders a `LayerRow` for each layer definition.

**Structure:**
- Map over `LAYER_DEFINITIONS` to render `LayerRow` components
- Read each layer's state from the store: `useStore(s => s.ui.layers[layerId])`
- Wire callbacks to store actions: `toggleLayerVisible(id)`, `setLayerOpacity(id, value)`, `toggleLayerLocked(id)`
- Render a "Reset All Layers" button at the bottom that calls `resetLayers()`

**Zustand selector pattern:**

```tsx
export function LayerPanel() {
	const layers = useStore((s) => s.ui.layers);
	const toggleLayerVisible = useStore((s) => s.toggleLayerVisible);
	const setLayerOpacity = useStore((s) => s.setLayerOpacity);
	const toggleLayerLocked = useStore((s) => s.toggleLayerLocked);
	const resetLayers = useStore((s) => s.resetLayers);

	return (
		<div className="flex flex-col gap-1">
			{/* Optional header/description */}
			<p className="mb-2 text-xs text-text-muted">
				Control layer visibility, opacity, and interaction locks.
			</p>

			{LAYER_DEFINITIONS.map((def) => {
				const state = layers[def.id];
				return (
					<LayerRow
						key={def.id}
						layerId={def.id}
						label={def.label}
						icon={def.icon}
						visible={state.visible}
						opacity={state.opacity}
						locked={state.locked}
						onToggleVisible={() => toggleLayerVisible(def.id)}
						onOpacityChange={(v) => setLayerOpacity(def.id, v)}
						onToggleLocked={() => toggleLayerLocked(def.id)}
					/>
				);
			})}

			{/* Reset button */}
			<button
				type="button"
				onClick={resetLayers}
				className="mt-3 rounded bg-plasma px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-grid-ghost"
			>
				Reset All Layers
			</button>
		</div>
	);
}
```

### 5. Update Sidebar Component

**File:** `golf-planner/src/components/ui/Sidebar.tsx`

Add "Layers" as the 4th tab. Update the `tabs` array and add the conditional render for `LayerPanel`.

Changes:
1. Import `LayerPanel` from `./LayerPanel`
2. Add `{ tab: "layers", label: "Layers" }` to the `tabs` array
3. Add `{activeTab === "layers" && <LayerPanel />}` in the content area

The existing tab button styling already handles any number of tabs via `flex-1`, so no layout changes are needed. With 4 tabs, each button gets 25% width, which still works fine at the 256px (`w-64`) sidebar width.

**Updated tabs array:**

```ts
const tabs: { tab: SidebarTab; label: string }[] = [
	{ tab: "holes", label: "Holes" },
	{ tab: "detail", label: "Detail" },
	{ tab: "budget", label: "Budget" },
	{ tab: "layers", label: "Layers" },
];
```

**Updated content rendering (add to the conditional block):**

```tsx
{activeTab === "layers" && <LayerPanel />}
```

The Layers tab content area should use the same padding as Holes/Detail (`overflow-y-auto p-3`). The existing conditional `activeTab === "budget" ? "" : "overflow-y-auto p-3"` already handles this correctly since `"layers" !== "budget"`.

### 6. MobileLayerPanel Component (Skeleton)

**File:** `golf-planner/src/components/ui/MobileLayerPanel.tsx`

A mobile overlay following the exact same pattern as `MobileBudgetPanel.tsx` and `MobileSunControls.tsx`. This section creates the skeleton; full mobile integration happens in section-11 (mobile-responsive).

**Pattern to follow (from MobileBudgetPanel):**
- Check `activePanel !== "layers"` -- if so, return null
- Render a `fixed inset-0 z-50` overlay with `md:hidden`
- Header with title "Layers" and close button (unicode `\u2715`)
- Content area containing the shared `LayerPanel` component

```tsx
export function MobileLayerPanel() {
	const activePanel = useStore((s) => s.ui.activePanel);
	const setActivePanel = useStore((s) => s.setActivePanel);

	if (activePanel !== "layers") return null;

	function handleClose() {
		setActivePanel(null);
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-subtle px-4 py-3">
				<span className="text-base font-semibold">Layers</span>
				<button
					type="button"
					onClick={handleClose}
					className="rounded-lg p-2 text-text-muted hover:bg-plasma hover:text-text-secondary"
				>
					<span className="text-xl">&#x2715;</span>
				</button>
			</div>

			{/* Reuse LayerPanel content */}
			<div className="flex-1 overflow-y-auto p-4">
				<LayerPanel />
			</div>
		</div>
	);
}
```

**Note:** `MobileLayerPanel` must be rendered in `App.tsx` alongside the other mobile panels (`MobileBudgetPanel`, `MobileSunControls`, `MobileDetailPanel`). This wiring happens in section-11 (mobile-responsive). For now, just create the component file.

## Files Summary

### New Files

| File | Purpose |
|------|---------|
| `golf-planner/src/constants/layers.ts` | `LAYER_DEFINITIONS` constant (5 layers with id, label, icon) |
| `golf-planner/src/components/ui/LayerPanel.tsx` | Sidebar tab content -- maps over layers, renders `LayerRow` per layer + reset button |
| `golf-planner/src/components/ui/LayerRow.tsx` | Single layer control row (eye toggle, label, opacity slider, lock toggle) |
| `golf-planner/src/components/ui/MobileLayerPanel.tsx` | Mobile overlay skeleton (same pattern as `MobileBudgetPanel`) |

### Modified Files

| File | Change |
|------|--------|
| `golf-planner/src/types/ui.ts` | Add `"layers"` to `SidebarTab` and `ActivePanel` union types |
| `golf-planner/src/components/ui/Sidebar.tsx` | Add 4th "Layers" tab to `tabs` array, import and conditionally render `LayerPanel` |

### No Changes Needed

| File | Reason |
|------|--------|
| `golf-planner/src/store/store.ts` | Layer store actions already created by section-02. `setSidebarTab` already accepts `SidebarTab` type generically. |
| `golf-planner/src/types/viewport.ts` | `LayerId`, `LayerState` types already created by section-02 |
| `golf-planner/src/types/index.ts` | May need to re-export new types if not already done by section-02 |

## Implementation Checklist

1. Update `SidebarTab` and `ActivePanel` in `golf-planner/src/types/ui.ts` to include `"layers"`
2. Create `golf-planner/src/constants/layers.ts` with `LAYER_DEFINITIONS`
3. Create `golf-planner/src/components/ui/LayerRow.tsx` component
4. Create `golf-planner/src/components/ui/LayerPanel.tsx` component
5. Update `golf-planner/src/components/ui/Sidebar.tsx` -- add 4th tab, import and render `LayerPanel`
6. Create `golf-planner/src/components/ui/MobileLayerPanel.tsx` skeleton
7. Run `npx tsc --noEmit` to verify no type errors
8. Run `npx vitest run` to verify all existing tests still pass (no regressions)

## Design Decisions

**Unicode icons instead of lucide-react:** The project has no icon library dependency. All existing icons use unicode characters. This section follows that pattern with contextual unicode glyphs for each layer and for the eye/lock toggles.

**Stateless LayerRow:** The `LayerRow` component receives all state via props and dispatches changes via callbacks. This makes it easy to test (if needed) and reusable in both desktop sidebar and mobile overlay contexts.

**Shared LayerPanel in mobile:** Rather than duplicating the layer list UI, `MobileLayerPanel` wraps the same `LayerPanel` component. This ensures consistent behavior and reduces maintenance burden.

**Opacity slider range 0-100 mapped to 0-1:** The slider uses integer percentages (0-100) for better UX (users see "75%" not "0.75"), mapped to the 0-1 float that the store expects. The store's `setLayerOpacity` action handles clamping.

---

## What Was Actually Built

### Deviations from Plan

1. **SidebarTab/ActivePanel types already included `"layers"`** — done in section-02, no changes needed to `src/types/ui.ts`.
2. **LayerDefinition type reused from viewport.ts** — code review caught duplicate type in constants/layers.ts. Removed local type, imported from `types/viewport`. Also fixed stale "Lucide icon name" comment in viewport.ts.
3. **LayerRow gets `data-testid`** — code review found `layerId` prop was accepted but unused. Added `data-testid={layer-row-${layerId}}` for future testability.
4. **MobileLayerPanel close button gets `aria-label`** — code review caught missing accessibility label.
5. **Smoke test added** — 3 tests for LAYER_DEFINITIONS constant (count, IDs, properties).

### Files Actually Created
| File | Purpose |
|------|---------|
| `src/constants/layers.ts` | LAYER_DEFINITIONS constant (imports LayerDefinition from types) |
| `src/components/ui/LayerRow.tsx` | Single layer row: eye toggle, label, opacity slider, lock toggle |
| `src/components/ui/LayerPanel.tsx` | Sidebar content: maps LAYER_DEFINITIONS to LayerRows + reset button |
| `src/components/ui/MobileLayerPanel.tsx` | Mobile overlay skeleton (wiring in section-11) |
| `tests/components/layerPanel.test.ts` | 3 smoke tests for LAYER_DEFINITIONS |

### Files Actually Modified
| File | Change |
|------|--------|
| `src/components/ui/Sidebar.tsx` | 4th "Layers" tab + LayerPanel conditional render |
| `src/types/viewport.ts` | Fixed stale comment on LayerDefinition.icon |

### Test Results
- 3 new tests (all pass)
- 574 total tests pass
- TypeScript clean