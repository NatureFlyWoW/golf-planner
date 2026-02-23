Now I have enough context to generate the complete section content. Let me compose it:

# Section 01: Walkthrough State & Store Integration

## Overview

This section adds walkthrough mode to the Zustand store: two new state fields (`walkthroughMode`, `previousViewportLayout`), two new actions (`enterWalkthrough`, `exitWalkthrough`), and an update to `deriveFrameloop()` in `environmentGating.ts` to force `"always"` frameloop during walkthrough.

This section is the **foundation** for the entire walkthrough feature. Sections 02, 03, and 04 all depend on it being complete.

---

## Background & Context

### What Walkthrough Mode Is

Walkthrough mode drops the camera to eye level (1.7m) inside the BORGA hall and enables FPS-style navigation (WASD + click-drag look). To enter it, the user presses F or clicks a toolbar button. The 3D pane must be fullscreen while in walkthrough mode.

### Ephemeral State Pattern

Walkthrough state is **ephemeral**: it is not persisted to localStorage and is not undo-tracked. This is the same pattern used by `uvMode` and `viewportLayout`. The `partialize` function in `store.ts` only includes specific top-level keys (holes, budget, etc.) — since `walkthroughMode` and `previousViewportLayout` live inside the `ui` slice, they are automatically excluded from persistence as long as the `ui` object itself is not added to `partialize`.

### Mobile Gating

`enterWalkthrough()` must no-op on mobile. The `isMobile` utility (`src/utils/isMobile.ts`) is a boolean exported from a module that reads `window.matchMedia`. In tests, mock `isMobile` by mocking the module (see test patterns below).

---

## Files to Create / Modify

### 1. `src/types/ui.ts` — Add walkthrough fields to `UIState`

Add two optional fields to the `UIState` type:

```typescript
walkthroughMode: boolean;
previousViewportLayout: ViewportLayout | null;
```

Both fields must be present in `UIState` (not optional `?:`), so all code that spreads `UIState` includes them.

### 2. `src/store/store.ts` — Store state + actions

**In `DEFAULT_UI`**, add:
```typescript
walkthroughMode: false,
previousViewportLayout: null,
```

**In `StoreActions`**, add two new action signatures:
```typescript
enterWalkthrough: () => void;
exitWalkthrough: () => void;
```

**Implement `enterWalkthrough()`**:
- Import `isMobile` from `../utils/isMobile`
- Early-return if `isMobile` is true
- Save current `ui.viewportLayout` to `ui.previousViewportLayout`
- Set `ui.walkthroughMode: true`
- Set `ui.viewportLayout: "3d-only"`
- All three state updates must happen atomically in a single `set()` call

```typescript
enterWalkthrough: () => {
  if (isMobile) return;
  set((state) => ({
    ui: {
      ...state.ui,
      walkthroughMode: true,
      previousViewportLayout: state.ui.viewportLayout,
      viewportLayout: "3d-only",
    },
  }));
},
```

**Implement `exitWalkthrough()`**:
- Sets `walkthroughMode: false`
- Restores `viewportLayout` from `previousViewportLayout` (fall back to `"dual"` if `previousViewportLayout` is null — defensive guard)
- Clears `previousViewportLayout` to null
- Use `requestAnimationFrame` to defer the layout restoration by one frame. This avoids a race condition with `CameraControls` remounting when the viewport layout changes. Pattern:

```typescript
exitWalkthrough: () => {
  const { previousViewportLayout } = get().ui;
  // Clear walkthrough mode immediately
  set((state) => ({
    ui: { ...state.ui, walkthroughMode: false },
  }));
  // Defer layout restoration by one frame to avoid CameraControls race condition
  requestAnimationFrame(() => {
    set((state) => ({
      ui: {
        ...state.ui,
        viewportLayout: previousViewportLayout ?? "dual",
        previousViewportLayout: null,
      },
    }));
  });
},
```

Note: The `requestAnimationFrame` deferral means tests that call `exitWalkthrough()` must use fake timers or check state asynchronously. See the test section below for the recommended approach — use `vi.useFakeTimers()` + `vi.runAllTimers()` to flush the rAF.

**Verify `partialize`** — the `partialize` function must NOT include `walkthroughMode` or `previousViewportLayout`. Since both live inside `ui` (which is not in `partialize`), no change is needed, but the test should verify this.

### 3. `src/utils/environmentGating.ts` — `deriveFrameloop()` update

Add `walkthroughMode: boolean` as the **5th parameter** to `deriveFrameloop()`. When `walkthroughMode === true`, return `"always"` immediately (before all other checks).

Updated signature:
```typescript
export function deriveFrameloop(
  uvMode: boolean,
  gpuTier: GpuTier,
  transitioning: boolean,
  viewportLayout: ViewportLayout,
  walkthroughMode: boolean,
): "always" | "demand"
```

New first check inside the function body:
```typescript
// Walkthrough always needs continuous rendering (FPS camera)
if (walkthroughMode) return "always";
```

The rest of the function body is unchanged.

**Update all call sites of `deriveFrameloop()`**: Search for all usages and add `walkthroughMode` as the 5th argument. The primary call site is in `src/components/layout/DualViewport.tsx`. Pass `useStore((s) => s.ui.walkthroughMode)` from the store.

---

## Tests to Write

### Test File: `tests/store/walkthrough.test.ts` (new file)

This is a Vitest unit test file. Pattern: use `useStore.setState()` to set up initial state and `useStore.getState()` to call actions and read state. Use `beforeEach` to reset state. For `requestAnimationFrame` deferral in `exitWalkthrough`, use `vi.useFakeTimers()` + `vi.runAllTimers()`.

```typescript
// tests/store/walkthrough.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useStore } from "../../src/store/store";

// Mock isMobile so tests can control mobile/desktop mode
vi.mock("../../src/utils/isMobile", () => ({ isMobile: false }));

beforeEach(() => {
  useStore.setState((state) => ({
    ui: {
      ...state.ui,
      walkthroughMode: false,
      previousViewportLayout: null,
      viewportLayout: "dual",
    },
  }));
});
```

Tests to include:

**`enterWalkthrough` basic behavior:**
- `enterWalkthrough()` sets `walkthroughMode` to true
- `enterWalkthrough()` sets `viewportLayout` to `"3d-only"`
- `enterWalkthrough()` saves previous `viewportLayout` (e.g., `"dual"`) to `previousViewportLayout`
- `enterWalkthrough()` from `"dual"` layout saves `"dual"` as `previousViewportLayout`
- `enterWalkthrough()` from `"2d-only"` layout saves `"2d-only"` as `previousViewportLayout`

**`enterWalkthrough` mobile guard:**
- `enterWalkthrough()` no-ops when `isMobile` is true — re-mock the module to return `isMobile: true` for this test case; verify `walkthroughMode` stays false

**`exitWalkthrough` behavior (requires fake timers):**
- `exitWalkthrough()` sets `walkthroughMode` to false
- After `vi.runAllTimers()`, `exitWalkthrough()` restores `viewportLayout` from `previousViewportLayout`
- After `vi.runAllTimers()`, `exitWalkthrough()` clears `previousViewportLayout` to null
- Full round-trip: enter from `"dual"` → exit → restores `"dual"`
- Full round-trip: enter from `"2d-only"` → exit → restores `"2d-only"`

**Persistence exclusion:**
- `walkthroughMode` is NOT included in the persisted partition (verify by inspecting `partialize` output using the same pattern as `tests/store/viewportLayers.test.ts` — construct the persisted object from `useStore.getState()` and check it does not contain `walkthroughMode`)
- `previousViewportLayout` is NOT included in the persisted partition

### Test File: `tests/utils/environment.test.ts` (extend existing)

Add a new `describe` block to the existing file. The existing tests call `deriveFrameloop` with 4 arguments. After this section those calls will need a 5th argument (`false` for `walkthroughMode`) — **update all existing calls** to add `walkthroughMode: false` as the 5th argument, confirming backward-compatible behavior is preserved.

New tests to add:

```
describe("deriveFrameloop with walkthroughMode", () => {
  it('returns "always" when walkthroughMode=true, regardless of all other params')
  it('walkthroughMode=true + uvMode=false + gpuTier="low" + viewportLayout="3d-only" → "always"')
  it('walkthroughMode=true + uvMode=true + gpuTier="high" + viewportLayout="3d-only" → "always"')
  it('walkthroughMode=true + transitioning=false + viewportLayout="2d-only" → "always"')
  it('walkthroughMode=false + existing behavior preserved: dual → "always"')
  it('walkthroughMode=false + existing behavior preserved: 3d-only + low GPU → "demand"')
})
```

---

## Dependency Notes

- **No dependencies on other sections** — this section has no upstream dependencies and can be implemented in Batch 1 in parallel with sections 05, 06, and 08.
- **Sections 02, 03, 04** all depend on this section. Specifically:
  - Section 02 (Camera Controller) reads `walkthroughMode` from the store and calls `enterWalkthrough`/`exitWalkthrough` on mount/unmount lifecycle.
  - Section 03 (Collision) reads `holes` and `hall` from the store — no walkthrough state dependency, but needs Section 01 complete to integrate into the controller.
  - Section 04 (UI/Keyboard) wires the F key to `enterWalkthrough()`/`exitWalkthrough()` and reads `walkthroughMode` for the overlay.
- **Section 09** (Performance/Polish) has an integration test: `deriveFrameloop` must return `"demand"` after `exitWalkthrough()` (no leaked `"always"`). The deferred `requestAnimationFrame` in `exitWalkthrough` means the layout restore happens asynchronously, but `walkthroughMode: false` is set immediately — so `deriveFrameloop` correctly returns `"demand"` in the frame after exit.

---

## Implementation Checklist

1. Add `walkthroughMode: boolean` and `previousViewportLayout: ViewportLayout | null` to `UIState` in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/ui.ts`
2. Add both fields to `DEFAULT_UI` in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts`
3. Add `enterWalkthrough` and `exitWalkthrough` to `StoreActions` type in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts`
4. Implement both actions inside the `create()` call in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts`
5. Update `deriveFrameloop()` in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/utils/environmentGating.ts` to add 5th parameter and early-return
6. Find all `deriveFrameloop()` call sites (search for `deriveFrameloop(`) and update to pass `walkthroughMode` as 5th argument
7. Create `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/store/walkthrough.test.ts`
8. Extend `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/utils/environment.test.ts` with walkthrough tests and update existing `deriveFrameloop` calls to pass 5th argument
9. Run `npm run test` — all existing tests must pass, new tests must pass
10. Run `npx tsc --noEmit` — zero type errors

---

## Edge Cases to Handle

- `exitWalkthrough()` called when `previousViewportLayout` is null (store was mutated externally): fall back to `"dual"`
- `enterWalkthrough()` called when already in walkthrough mode: the action is idempotent (it will overwrite `previousViewportLayout` with `"3d-only"` and keep `walkthroughMode: true`) — this is acceptable; no early-return needed for already-active walkthrough
- TypeScript: `requestAnimationFrame` is available in browser environments but not in Node test environments. In Vitest with jsdom environment (`@vitest-environment jsdom`), `requestAnimationFrame` is polyfilled. Use `vi.useFakeTimers()` at the test level to control when rAF callbacks fire.