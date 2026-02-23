Now I have all the context I need. Let me generate the section content.

# Section 10: Feature Migration

## Overview

This section handles migrating existing features to work with the new dual-viewport and layer architecture. There are four main tasks:

1. **Remove the view toggle button** from the desktop `Toolbar.tsx` (replaced by dual-pane layout)
2. **Migrate flow path toggle** in both `Toolbar.tsx` and `BottomToolbar.tsx` to use `toggleLayerVisible("flowPath")` instead of the standalone `showFlowPath` / `toggleFlowPath` store fields
3. **Remove the standalone `showFlowPath` / `toggleFlowPath`** from the store and `UIState`
4. **Reposition overlays**: MiniMap to 2D pane, SunControls and KeyboardHelp to the DualViewport container

This section does NOT cover the ScreenshotCapture refactor (covered in section-09-postprocessing) or mobile-specific changes (covered in section-11-mobile-responsive).

## Dependencies

- **section-04-dual-canvas-views**: The `DualViewport` component must exist so overlays can be repositioned into it
- **section-06-event-isolation**: Pointer event isolation must be in place so interaction works correctly after migration
- **section-07-layer-state**: Layer state (`toggleLayerVisible`, `layers.flowPath.visible`) must be wired in the store and connected to renderable components (especially `FlowPath.tsx`)

## Background: Current State

### Toolbar (Desktop)

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/Toolbar.tsx`

The desktop toolbar currently has:
- Tool buttons (Select, Place, Delete)
- Snap toggle
- Flow path toggle -- reads `ui.showFlowPath` and calls `toggleFlowPath()`
- **View toggle button** -- toggles between "top" and "3d" via `setView()`, with `data-testid="view-toggle"`
- UV toggle
- Undo / Redo
- Screenshot, SVG export, Save, Export buttons

The flow path button styling uses `showFlowPath` from the store:

```typescript
const showFlowPath = useStore((s) => s.ui.showFlowPath);
const toggleFlowPath = useStore((s) => s.toggleFlowPath);

const flowBtnClass = `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
    showFlowPath
        ? "bg-accent-text text-white"
        : "bg-plasma text-text-secondary hover:bg-grid-ghost"
}`;
```

The view toggle button:

```tsx
<button
    type="button"
    onClick={() => setView(view === "top" ? "3d" : "top")}
    className={neutralBtnClass}
    title="Toggle 2D/3D view"
    data-testid="view-toggle"
>
    {view === "top" ? "3D" : "2D"}
</button>
```

### BottomToolbar (Mobile)

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/BottomToolbar.tsx`

The mobile bottom toolbar has an `OverflowPopover` that includes:
- Snap toggle
- Flow path toggle -- reads `ui.showFlowPath` and calls `toggleFlowPath()`
- View toggle (2D/3D) -- calls `setView()`
- UV toggle
- Sun, Save, Export, Budget buttons

Both the parent `BottomToolbar` component and the `OverflowPopover` sub-component read `showFlowPath`:

```typescript
// In BottomToolbar:
const showFlowPath = useStore((s) => s.ui.showFlowPath);
const hasActiveToggles = snapEnabled || showFlowPath;

// In OverflowPopover:
const showFlowPath = useStore((s) => s.ui.showFlowPath);
const toggleFlowPath = useStore((s) => s.toggleFlowPath);
```

### Store Fields Being Removed

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts`

The `showFlowPath` field in `UIState` (defined in `src/types/ui.ts`) and the `toggleFlowPath` action in the store are being superseded by the layer system's `layers.flowPath.visible` and `toggleLayerVisible("flowPath")`.

Current store action:

```typescript
toggleFlowPath: () => {
    set((state) => ({
        ui: {
            ...state.ui,
            showFlowPath: !state.ui.showFlowPath,
        },
    }));
},
```

### FlowPath Component

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/FlowPath.tsx`

Currently reads `ui.showFlowPath` to decide whether to render. After section-07-layer-state is complete, this will already read from `layers.flowPath.visible` instead. This section ensures the toolbar buttons also use the new layer system.

### Overlay Components

Currently positioned inside the `<div className="relative flex-1">` block in `App.tsx`:

```tsx
<div className="relative flex-1" style={{...}}>
    <Canvas ...>
        <Suspense fallback={null}>
            <ThreeCanvas sunData={sunData} />
        </Suspense>
    </Canvas>
    <SunControls />     {/* absolute bottom-10 left-2 z-10 */}
    <KeyboardHelp />    {/* absolute bottom-2 left-2 z-10 */}
    <MiniMap />         {/* absolute right-2 bottom-2 z-10 */}
</div>
```

After migration, `DualViewport` replaces this entire block. The overlays must be repositioned:

- **MiniMap**: Moves into the 2D pane div (absolute positioned in the 2D pane's corner, `right-2 bottom-2`)
- **SunControls**: Stays as overlay on the DualViewport container (same positioning, works across both panes)
- **KeyboardHelp**: Stays as overlay on the DualViewport container (same positioning)

---

## Tests

Tests for this section are lightweight because the changes are mostly UI wiring. The primary validations are:

### Test File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/featureMigration.test.ts`

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { useStore } from "../../src/store";

describe("Feature Migration", () => {
    beforeEach(() => {
        // Reset store to initial state before each test
        useStore.getState().reset?.();
        // Or use useStore.setState with initial values
    });

    describe("Toolbar view toggle removal", () => {
        it("Toolbar no longer renders view toggle button (or it is hidden on desktop)", () => {
            // Verify that the view toggle button (data-testid="view-toggle") is
            // removed from Toolbar.tsx. This is a code-level verification:
            // the button JSX with data-testid="view-toggle" should not exist
            // in the desktop Toolbar component.
            //
            // Note: The view toggle REMAINS in BottomToolbar's OverflowPopover
            // for mobile single-pane mode (handled in section-11).
            //
            // Implementation approach: grep/read Toolbar.tsx to confirm removal,
            // or render-test if a lightweight React test harness is available.
            expect(true).toBe(true); // Placeholder — verified by code review
        });
    });

    describe("Flow path toggle migration", () => {
        it("Toolbar flow path button uses toggleLayerVisible('flowPath')", () => {
            // Verify that the Toolbar's Flow button calls
            // toggleLayerVisible("flowPath") instead of toggleFlowPath().
            //
            // The button's active state should read from
            // useStore(s => s.ui.layers.flowPath.visible) instead of
            // useStore(s => s.ui.showFlowPath).
            //
            // Store-level verification:
            const store = useStore.getState();
            expect(store.ui.layers.flowPath.visible).toBe(true);
            store.toggleLayerVisible("flowPath");
            expect(useStore.getState().ui.layers.flowPath.visible).toBe(false);
        });

        it("BottomToolbar flow path button uses toggleLayerVisible('flowPath')", () => {
            // Verify that the BottomToolbar's OverflowPopover Flow button calls
            // toggleLayerVisible("flowPath") instead of toggleFlowPath().
            //
            // The hasActiveToggles indicator in BottomToolbar should read from
            // useStore(s => s.ui.layers.flowPath.visible) instead of
            // useStore(s => s.ui.showFlowPath).
            //
            // Store-level verification (same as above, confirms the action exists):
            const store = useStore.getState();
            store.toggleLayerVisible("flowPath");
            const afterToggle = useStore.getState().ui.layers.flowPath.visible;
            store.toggleLayerVisible("flowPath");
            const afterDoubleToggle = useStore.getState().ui.layers.flowPath.visible;
            expect(afterToggle).not.toBe(afterDoubleToggle);
        });
    });

    describe("showFlowPath removal", () => {
        it("store no longer has showFlowPath field in UIState", () => {
            // After migration, the UIState type should not contain showFlowPath.
            // The store's ui object should not have a showFlowPath property.
            const ui = useStore.getState().ui;
            expect("showFlowPath" in ui).toBe(false);
        });

        it("store no longer has toggleFlowPath action", () => {
            // The toggleFlowPath action should be removed from the store.
            const store = useStore.getState();
            expect("toggleFlowPath" in store).toBe(false);
        });
    });
});
```

Note: Some of these tests may need adjustment based on how the store is structured after section-02 and section-07 have been implemented. The key assertions are:
- `ui.showFlowPath` no longer exists
- `toggleFlowPath` action no longer exists
- `ui.layers.flowPath.visible` and `toggleLayerVisible("flowPath")` work correctly (already tested in section-07's layer tests, but the store-level verification here confirms the wiring holds after the old fields are removed)

---

## Implementation Details

### Task 1: Remove View Toggle from Desktop Toolbar

**File to modify:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/Toolbar.tsx`

Remove the following:
1. The `view` selector: `const view = useStore((s) => s.ui.view);`
2. The `setView` selector: `const setView = useStore((s) => s.setView);`
3. The entire view toggle button JSX block (the `<button>` with `data-testid="view-toggle"`)

The `ui.view` field and `setView` action remain in the store for mobile usage, but the desktop toolbar no longer exposes them. The dual-pane layout replaces the need for a toggle.

**Do NOT** remove `setView` from the store itself -- it is still used by `BottomToolbar.tsx` for mobile single-pane mode (section-11 handles mobile).

### Task 2: Migrate Flow Path Toggle in Toolbar

**File to modify:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/Toolbar.tsx`

Replace:
```typescript
const showFlowPath = useStore((s) => s.ui.showFlowPath);
const toggleFlowPath = useStore((s) => s.toggleFlowPath);
```

With:
```typescript
const flowPathVisible = useStore((s) => s.ui.layers.flowPath.visible);
const toggleLayerVisible = useStore((s) => s.toggleLayerVisible);
```

Update the button styling to use `flowPathVisible` instead of `showFlowPath`:
```typescript
const flowBtnClass = `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
    flowPathVisible
        ? "bg-accent-text text-white"
        : "bg-plasma text-text-secondary hover:bg-grid-ghost"
}`;
```

Update the button's `onClick` handler:
```tsx
<button
    type="button"
    onClick={() => toggleLayerVisible("flowPath")}
    className={flowBtnClass}
    title="Toggle player flow path"
>
    Flow
</button>
```

### Task 3: Migrate Flow Path Toggle in BottomToolbar

**File to modify:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/BottomToolbar.tsx`

Two locations need updating:

**In the `BottomToolbar` component:**

Replace:
```typescript
const showFlowPath = useStore((s) => s.ui.showFlowPath);
const hasActiveToggles = snapEnabled || showFlowPath;
```

With:
```typescript
const flowPathVisible = useStore((s) => s.ui.layers.flowPath.visible);
const hasActiveToggles = snapEnabled || flowPathVisible;
```

**In the `OverflowPopover` component:**

Replace:
```typescript
const showFlowPath = useStore((s) => s.ui.showFlowPath);
const toggleFlowPath = useStore((s) => s.toggleFlowPath);
```

With:
```typescript
const flowPathVisible = useStore((s) => s.ui.layers.flowPath.visible);
const toggleLayerVisible = useStore((s) => s.toggleLayerVisible);
```

Update the Flow `ToggleBtn`:
```tsx
<ToggleBtn label="Flow" active={flowPathVisible} onTap={() => toggleLayerVisible("flowPath")} />
```

**Note on the mobile view toggle:** The `OverflowPopover` also has a view toggle button (2D/3D) that calls `setView()`. This toggle **stays** for mobile, since mobile uses single-pane mode with `ui.view`. Section-11 (mobile-responsive) handles any further adjustments to mobile behavior.

### Task 4: Remove `showFlowPath` and `toggleFlowPath` from Store

**Files to modify:**

1. `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/ui.ts` -- Remove `showFlowPath: boolean;` from `UIState`
2. `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts` -- Remove `showFlowPath: true` from `DEFAULT_UI`, remove `toggleFlowPath` from the `StoreActions` type, and remove the `toggleFlowPath` action implementation

After removal, verify that no other files reference `showFlowPath` or `toggleFlowPath`. The `FlowPath.tsx` component should already have been migrated to use `layers.flowPath.visible` by section-07-layer-state.

Run a project-wide search for `showFlowPath` and `toggleFlowPath` to confirm no remaining references:

```bash
cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && grep -r "showFlowPath\|toggleFlowPath" src/
```

This should return zero matches after all migrations are complete.

### Task 5: Reposition Overlays into DualViewport

**Files to modify:**

1. `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx` -- Remove `<SunControls />`, `<KeyboardHelp />`, and `<MiniMap />` from the current canvas container div (which is being replaced by `DualViewport`)
2. `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx` -- Add overlays in the correct positions

**MiniMap** moves into the 2D pane div, positioned in the bottom-right corner. It only makes sense in the 2D (floor plan) view where the spatial context is relevant:

```tsx
{/* Inside DualViewport, within or adjacent to the 2D pane div */}
<div ref={pane2dRef} style={{ width: `${splitRatio * 100}%` }} className="relative h-full">
    {/* View component for 2D */}
    <MiniMap />  {/* absolute right-2 bottom-2 z-10 — existing CSS handles positioning */}
</div>
```

The `MiniMap` component's existing CSS classes (`hidden md:block absolute right-2 bottom-2 z-10`) already handle positioning and desktop-only visibility, so no changes to `MiniMap.tsx` itself are needed. The `absolute` positioning works correctly because the pane div has `relative` on it.

**SunControls** and **KeyboardHelp** stay as overlays on the DualViewport container. They are not specific to either pane:

```tsx
{/* Inside DualViewport, at the container level */}
<div ref={containerRef} className="relative flex h-full flex-1">
    {/* 2D pane with MiniMap */}
    {/* SplitDivider */}
    {/* 3D pane with CameraPresets */}
    {/* Canvas with View.Port */}
    <SunControls />     {/* absolute bottom-10 left-2 z-10 — existing CSS */}
    <KeyboardHelp />    {/* absolute bottom-2 left-2 z-10 — existing CSS */}
</div>
```

The existing CSS positioning on `SunControls` and `KeyboardHelp` uses `absolute` with `left-2 bottom-*` which will position them relative to the DualViewport container. No changes to these component files are needed.

**Important:** When `viewportLayout` is `"2d-only"`, the MiniMap should still be visible (it is in the 2D pane which is fullscreen). When `viewportLayout` is `"3d-only"`, the 2D pane is hidden so the MiniMap naturally disappears. No conditional logic is needed.

### Task 6: Update App.tsx

**File to modify:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx`

The current block:

```tsx
<div
    className="relative flex-1"
    style={{
        cursor: tool === "delete" ? "crosshair" : "default",
        touchAction: "none",
        pointerEvents: canvasPointerEvents(transitioning),
    }}
>
    <Canvas dpr={dpr} frameloop={frameloop} shadows={shadows} gl={{...}}>
        <Suspense fallback={null}>
            <ThreeCanvas sunData={sunData} />
        </Suspense>
    </Canvas>
    <SunControls />
    <KeyboardHelp />
    <MiniMap />
</div>
```

Is replaced by:

```tsx
<DualViewport sunData={sunData} />
```

The `DualViewport` component (created in section-04) handles the Canvas, Views, overlays, and all viewport-related rendering. The `tool`, `transitioning`, `dpr`, `frameloop`, `shadows`, and `gl` configuration are managed internally by `DualViewport` or passed as props as needed.

Remove the now-unused imports from App.tsx:
- `SunControls` (moved into DualViewport)
- `KeyboardHelp` (moved into DualViewport)
- `MiniMap` (moved into DualViewport)
- `Canvas` from `@react-three/fiber` (now inside DualViewport)
- `NoToneMapping` from `three` (now inside DualViewport)
- `canvasPointerEvents` (now inside DualViewport)
- Any other imports that are only used by the replaced block

Note: Some of these imports may already have been moved during section-04 (dual canvas views). This task ensures the final cleanup is complete and no stale imports or JSX remain.

---

## What Was Actually Built

### Files Modified
- `src/types/ui.ts` — Removed `showFlowPath: boolean` from UIState
- `src/store/store.ts` — Removed `toggleFlowPath` from StoreActions type, DEFAULT_UI, and action implementation
- `src/components/ui/Toolbar.tsx` — Removed view toggle button (data-testid="view-toggle"), removed view/setView selectors, migrated flow path to `layers.flowPath.visible`/`toggleLayerVisible("flowPath")`
- `src/components/ui/BottomToolbar.tsx` — Migrated flow path in both BottomToolbar (hasActiveToggles) and OverflowPopover to layer system
- `src/components/layout/DualViewport.tsx` — Moved MiniMap from container-level overlay into 2D pane div (inside `{show2D && ...}` conditional)
- `tests/utils/store.test.ts` — Removed `showFlowPath: true` from test fixture
- `tests/utils/activePanel.test.ts` — Removed `showFlowPath: true` from test fixture

### Files Created
- `tests/components/featureMigration.test.ts` — 4 tests: showFlowPath removal, toggleFlowPath removal, layers.flowPath.visible default, toggleLayerVisible round-trip

### Deviations from Plan
- **Task 5 (overlay repositioning)**: SunControls and KeyboardHelp were already at DualViewport container level from section-04. Only MiniMap was actually moved (into the 2D pane div).
- **Task 6 (App.tsx cleanup)**: Already completed in section-04. App.tsx already renders just `<DualViewport sunData={sunData} />` with no stale overlay imports.
- **Tests**: 4 tests instead of plan's 6. The toolbar render test was a documented placeholder. The BottomToolbar double-toggle test duplicated existing layer test coverage.
- **Verification**: TypeScript clean, 582 tests pass (52 files), zero `showFlowPath`/`toggleFlowPath` references in src/.

---

## Verification Checklist

After implementing all tasks:

1. **Type check passes**: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx tsc --noEmit`
2. **No references to removed fields**: `grep -r "showFlowPath\|toggleFlowPath" src/` returns nothing
3. **Tests pass**: `cd /mnt/c/Users/Caus/Golf_Plan/golf-planner && npx vitest run`
4. **Desktop toolbar**: No view toggle button visible; Flow button works via layer system
5. **Mobile toolbar**: Flow button in OverflowPopover works via layer system; View toggle still present for mobile single-pane mode
6. **Overlays**: MiniMap appears in 2D pane corner; SunControls and KeyboardHelp appear on DualViewport container
7. **FlowPath rendering**: Flow path shows/hides correctly when toggling via toolbar button (which now calls `toggleLayerVisible("flowPath")`) and via the LayerPanel's flowPath row (implemented in section-08)