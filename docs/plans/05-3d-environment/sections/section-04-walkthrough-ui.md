Now I have all the context I need. Let me generate the section content.

# Section 04: Walkthrough UI & Keyboard Integration

## Overview

This section wires the walkthrough feature to user-facing controls: the F key, Escape key, a toolbar "Walk" button, and an on-screen overlay with exit button and controls hint. It also ensures that WASD and camera-preset keys (1-6) do not fire `useKeyboardControls` during walkthrough mode.

**Dependencies (must be completed first):**
- **Section 01** — `walkthroughMode`, `enterWalkthrough()`, `exitWalkthrough()` must exist in the store.
- **Section 02** — `WalkthroughController` must be mounted so WASD movement works when the overlay is shown.
- **Section 03** — Collision detection must be integrated into `WalkthroughController`.

This section does **not** implement PointerLock — that is explicitly deferred.

---

## Tests First

### Test file: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/walkthroughKeyboard.test.ts`

Create a new test file. The tests cover the exported helpers from `useKeyboardControls.ts` that govern walkthrough-aware key dispatch.

```typescript
import { beforeEach, describe, expect, it, vi } from "vitest";

// Tests for walkthrough-aware keyboard routing.
// The hook itself can't be rendered in Vitest (no DOM/React),
// but the pure helper functions it exports can be tested directly.

describe("shouldHandleKey — existing behavior", () => {
  // This suite already exists in tests/hooks/keyboardControls.test.ts.
  // Do NOT duplicate those tests here.
});

describe("walkthrough keyboard gating", () => {
  // These tests validate the logic that guards key handlers when
  // walkthroughMode is active. They test the extracted pure function
  // `shouldSuppressForWalkthrough(key, walkthroughMode)`.

  it("suppresses camera preset key '1' when walkthroughMode is true", () => {
    // expect(shouldSuppressForWalkthrough("1", true)).toBe(true)
  });

  it("suppresses camera preset key '6' when walkthroughMode is true", () => {
    // expect(shouldSuppressForWalkthrough("6", true)).toBe(true)
  });

  it("does NOT suppress '1' when walkthroughMode is false", () => {
    // expect(shouldSuppressForWalkthrough("1", false)).toBe(false)
  });

  it("suppresses 'r' (reset camera) when walkthroughMode is true", () => {
    // expect(shouldSuppressForWalkthrough("r", true)).toBe(true)
  });

  it("suppresses 'f' (fit holes) in 3D viewport when walkthroughMode is true", () => {
    // expect(shouldSuppressForWalkthrough("f", true)).toBe(true)
  });

  it("does NOT suppress 'z' (undo) during walkthrough — undo always active", () => {
    // expect(shouldSuppressForWalkthrough("z", true)).toBe(false)
  });

  it("does NOT suppress 'g' (snap toggle) during walkthrough — always active", () => {
    // expect(shouldSuppressForWalkthrough("g", true)).toBe(false)
  });
});

describe("F key walkthrough toggle", () => {
  // Tests that simulate the F key handler logic (not the hook subscription,
  // but the decision function it calls).

  it("F key calls enterWalkthrough when not in walkthrough and viewport is 3d", () => {
    // Mock store: walkthroughMode=false, viewport=3d
    // Simulate handleKeyDown({ key: "f" })
    // Assert enterWalkthrough was called
  });

  it("F key calls exitWalkthrough when already in walkthrough", () => {
    // Mock store: walkthroughMode=true
    // Assert exitWalkthrough was called
  });

  it("F key in 2D viewport does NOT trigger walkthrough (still does fit-all)", () => {
    // Mock store: activeViewport=2d, walkthroughMode=false
    // F key should go to the 2D "fit holes" branch, not enterWalkthrough
  });
});

describe("Escape key exits walkthrough", () => {
  it("Escape calls exitWalkthrough when walkthroughMode is true", () => {
    // Mock store: walkthroughMode=true
    // Simulate Escape key
    // Assert exitWalkthrough was called
  });

  it("Escape does nothing when walkthroughMode is false", () => {
    // Mock store: walkthroughMode=false
    // Assert exitWalkthrough NOT called
  });
});
```

### Test file: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/ui/walkthroughOverlay.test.ts` (optional, lightweight)

These are structural/integration checks that can be light, since React component rendering tests are not the project pattern.

```typescript
import { describe, expect, it } from "vitest";

// WalkthroughOverlay is an HTML overlay React component.
// Project convention: test pure logic only; no R3F rendering.
// The overlay's visibility is governed by walkthroughMode from the store.
// These tests validate the logic that controls render gating.

describe("WalkthroughOverlay visibility logic", () => {
  it("overlay should render when walkthroughMode is true", () => {
    // Verify: component rendered with walkthroughMode=true → DOM present
    // This is an integration test; stub or skip if React test setup not configured
  });

  it("overlay should NOT render when walkthroughMode is false", () => {
    // Verify: component rendered with walkthroughMode=false → null returned
  });
});

describe("Controls hint fade timer", () => {
  it("hint is visible immediately on mount", () => {
    // opacity-100 class initially
  });

  it("hint fades after 3 seconds", () => {
    // After setTimeout 3000ms, opacity-0 class applied
  });
});
```

---

## Implementation

### 1. Modify `useKeyboardControls.ts`

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useKeyboardControls.ts`

**Changes required:**

**a) Export a new pure helper** for testing and internal use:

```typescript
/**
 * Returns true if a key event should be suppressed because walkthrough
 * mode is active and the key belongs to camera/viewport controls.
 * Undo (z) and snap toggle (g) remain active at all times.
 */
export function shouldSuppressForWalkthrough(
  key: string,
  walkthroughMode: boolean,
): boolean {
  if (!walkthroughMode) return false;
  // Always-active shortcuts that bypass suppression
  const alwaysActive = new Set(["z", "Z", "g", "G"]);
  if (alwaysActive.has(key)) return false;
  return true;
}
```

**b) Add Escape key handler** at the top of `handleKeyDown` (after the undo/redo block, before other handlers):

```typescript
// Escape key exits walkthrough
if (e.key === "Escape") {
  const { walkthroughMode } = useStore.getState().ui;
  if (walkthroughMode) {
    useStore.getState().exitWalkthrough();
    return;
  }
  // Escape with no walkthrough: fall through (no existing use)
  return;
}
```

**c) Add F key handler in 3D viewport for walkthrough toggle.** The existing 3D F key case currently does "fit holes". Change it to:

```typescript
case "f":
case "F": {
  const { walkthroughMode } = useStore.getState().ui;
  if (walkthroughMode) {
    useStore.getState().exitWalkthrough();
  } else {
    useStore.getState().enterWalkthrough();
  }
  break;
}
```

Note: the 2D viewport F key ("fit all holes" zoom) is in the `viewport === "2d"` branch and is **unchanged**.

**d) Add early-return guard** right after the `resolveViewport()` call and undo/snap shortcuts:

```typescript
// During walkthrough, suppress all camera/viewport shortcuts.
// WalkthroughController handles its own WASD via window.addEventListener.
const { walkthroughMode } = useStore.getState().ui;
if (walkthroughMode && shouldSuppressForWalkthrough(e.key, walkthroughMode)) {
  e.stopPropagation();
  return;
}
```

Place this block after the snap toggle check but before the camera preset key checks.

**Full updated flow within `handleKeyDown`:**

1. Check `shouldHandleKey` — early return if focused on input
2. Handle undo/redo (Ctrl+Z) — always active
3. Handle snap toggle (g/G) — always active
4. **NEW:** Handle Escape — exits walkthrough if active, else no-op
5. Resolve viewport
6. **NEW:** Early return if `shouldSuppressForWalkthrough(key, walkthroughMode)` — prevents camera preset and reset keys from firing during walkthrough
7. Camera preset keys (1-6) in 3D viewport — unchanged logic
8. 2D viewport keys — unchanged logic
9. 3D viewport keys — F key now toggles walkthrough instead of fit-holes

---

### 2. Create `WalkthroughOverlay.tsx`

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/environment/WalkthroughOverlay.tsx`

Create the directory `src/components/three/environment/` if it does not exist.

This is an **HTML overlay** component, not a Three.js component. It is mounted as a sibling div to the canvas inside the 3D pane in `DualViewport.tsx`.

```typescript
import { useEffect, useState } from "react";
import { useStore } from "../../../store";

/**
 * HTML overlay shown when walkthrough mode is active.
 * Positioned absolutely over the 3D viewport.
 * Contains: exit button (top-right), controls hint (bottom-center, fades after 3s).
 */
export function WalkthroughOverlay() {
  const walkthroughMode = useStore((s) => s.ui.walkthroughMode);
  const exitWalkthrough = useStore((s) => s.exitWalkthrough);
  const [hintVisible, setHintVisible] = useState(true);

  // Fade hint out after 3 seconds whenever walkthrough mode activates
  useEffect(() => {
    if (!walkthroughMode) {
      setHintVisible(true); // reset for next entry
      return;
    }
    setHintVisible(true);
    const timer = setTimeout(() => setHintVisible(false), 3000);
    return () => clearTimeout(timer);
  }, [walkthroughMode]);

  if (!walkthroughMode) return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      data-testid="walkthrough-overlay"
    >
      {/* Exit button — top right */}
      <button
        type="button"
        className="pointer-events-auto absolute right-3 top-3 rounded bg-black/60 px-3 py-1.5 text-sm text-white/90 hover:bg-black/80 transition-colors"
        onClick={exitWalkthrough}
        data-testid="walkthrough-exit-btn"
      >
        Exit Walkthrough
      </button>

      {/* Controls hint — bottom center, fades after 3s */}
      <div
        className={`absolute bottom-6 left-1/2 -translate-x-1/2 rounded bg-black/50 px-4 py-2 text-xs text-white/80 transition-opacity duration-700 ${
          hintVisible ? "opacity-100" : "opacity-0"
        }`}
        data-testid="walkthrough-hint"
      >
        WASD to move | Drag to look | Shift to run | Esc to exit
      </div>

      {/* Crosshair — center */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative h-4 w-4 opacity-60">
          <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white" />
          <div className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2 bg-white" />
        </div>
      </div>
    </div>
  );
}
```

**Styling notes:**
- `pointer-events-none` on the wrapper prevents the overlay from blocking 3D pane pointer events (drag-to-look)
- `pointer-events-auto` restored on the exit button only
- Tailwind `transition-opacity duration-700` provides the fade
- No emoji used per project convention

---

### 3. Add Walk Button to `CameraPresets.tsx`

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraPresets.tsx`

Add a "Walk" button below the existing preset buttons. The button toggles walkthrough mode. It is hidden on mobile (walkthrough is mobile-disabled).

```typescript
// Add to imports:
import { useStore } from "../../store";
// (already imported — no change needed if it's already there)

// Add inside the component, before the return:
const walkthroughMode = useStore((s) => s.ui.walkthroughMode);
const enterWalkthrough = useStore((s) => s.enterWalkthrough);
const exitWalkthrough = useStore((s) => s.exitWalkthrough);
```

In the returned JSX, append a separator and Walk button after the existing preset buttons:

```tsx
{/* Walkthrough toggle — desktop only */}
<hr className="border-white/20 my-1" />
<button
  type="button"
  onClick={walkthroughMode ? exitWalkthrough : enterWalkthrough}
  className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
    walkthroughMode
      ? "bg-indigo-600/80 text-white hover:bg-indigo-600"
      : "bg-black/60 text-white/80 hover:bg-black/80 hover:text-white"
  }`}
  title="Walkthrough mode (F)"
  data-testid="walkthrough-btn"
>
  <span className="w-3 text-white/50">F</span>
  <span>{walkthroughMode ? "Exit Walk" : "Walk"}</span>
</button>
```

The `isMobile` guard at the top of `CameraPresets` (`if (isMobile) return null`) already hides the entire component on mobile — the Walk button is automatically excluded.

---

### 4. Mount `WalkthroughOverlay` in `DualViewport.tsx`

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx`

**a) Import the overlay:**

```typescript
import { WalkthroughOverlay } from "../three/environment/WalkthroughOverlay";
```

**b) Read `walkthroughMode` from store** (add to existing store selectors block):

```typescript
const walkthroughMode = useStore((s) => s.ui.walkthroughMode);
```

**c) Pass `walkthroughMode` to `deriveFrameloop`:**

The existing call is:
```typescript
const frameloop = deriveFrameloop(uvMode, gpuTier, transitioning, viewportLayout);
```

After Section 01 adds the 5th parameter, update to:
```typescript
const frameloop = deriveFrameloop(uvMode, gpuTier, transitioning, viewportLayout, walkthroughMode);
```

**d) Disable CameraControls during walkthrough.** In the 3D pane's `<View>` block, the `CameraControls` element needs `enabled` prop:

```tsx
<CameraControls ref={controls3DRef} makeDefault enabled={!walkthroughMode} />
```

This prevents CameraControls from interfering with the walkthrough camera.

**e) Mount the overlay inside the 3D pane div**, after `<CameraPresets .../>`:

```tsx
{/* Camera presets overlay (HTML, outside Canvas) */}
<CameraPresets cameraControlsRef={controls3DRef} />
{/* Walkthrough overlay (HTML, outside Canvas) */}
<WalkthroughOverlay />
```

Also mount in the **mobile code path** (the `if (isMobileViewport)` branch) — even though walkthrough is disabled on mobile, the overlay will safely render `null` since `walkthroughMode` will always be false on mobile (enforced by `enterWalkthrough()` no-op).

**f) Pass `pane3DRef` to `WalkthroughController`** (Section 02's component). When `WalkthroughController` is mounted in the 3D View, it needs a ref to the pane div for pointer event attachment. The `pane3DRef` already exists in `DualViewport`. Pass it as a prop or via context. Recommended: pass as prop since the component renders inside the View.

The cleanest approach is to expose `pane3DRef` to `WalkthroughController` via a React context or as a prop threaded through `ThreeDOnlyContent`. Since `ThreeDOnlyContent` doesn't currently take props, the simplest non-invasive approach is to add a new context:

```typescript
// New file: src/contexts/WalkthroughContext.ts
import { createContext, useContext } from "react";

export const WalkthroughPaneContext = createContext<React.RefObject<HTMLDivElement | null> | null>(null);

export function useWalkthroughPane() {
  return useContext(WalkthroughPaneContext);
}
```

In `DualViewport.tsx`, wrap the 3D pane's `<View>` contents with this context:

```tsx
<WalkthroughPaneContext.Provider value={pane3DRef}>
  <ViewportContext.Provider value={viewport3DInfo}>
    ...
    <ThreeDOnlyContent />
    ...
  </ViewportContext.Provider>
</WalkthroughPaneContext.Provider>
```

`WalkthroughController` (Section 02) calls `useWalkthroughPane()` to get the pane element for pointer events.

---

### 5. Mount `WalkthroughController` in `ThreeDOnlyContent.tsx`

**File:** `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeDOnlyContent.tsx`

Add the import and conditional mount:

```typescript
import { WalkthroughController } from "./environment/WalkthroughController";
// (WalkthroughController is Section 02's component)
```

Inside the returned JSX:
```tsx
{walkthroughMode && <WalkthroughController />}
```

The `walkthroughMode` selector is already needed here; add:
```typescript
const walkthroughMode = useStore((s) => s.ui.walkthroughMode);
```

---

## File Summary

| Action | File |
|--------|------|
| Modify | `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/hooks/useKeyboardControls.ts` |
| Create | `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/environment/WalkthroughOverlay.tsx` |
| Create | `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/contexts/WalkthroughContext.ts` |
| Modify | `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/CameraPresets.tsx` |
| Modify | `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/layout/DualViewport.tsx` |
| Modify | `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/ThreeDOnlyContent.tsx` |
| Create (test) | `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/hooks/walkthroughKeyboard.test.ts` |
| Create (test) | `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/components/ui/walkthroughOverlay.test.ts` |

---

## Key Decisions & Constraints

**No PointerLock**: Explicitly deferred. PointerLock's Escape key handling conflicts with the overlay's Escape-to-exit. Click-drag look (Section 02) is the only look mechanism.

**`pointer-events-none` on overlay wrapper**: The 3D pane handles click-drag look via pointer events attached to `pane3DRef` (inside `WalkthroughController`). The overlay must not intercept those events — only the exit button needs `pointer-events-auto`.

**WalkthroughController key events use `window.addEventListener` directly** (Section 02). The WASD keys are handled there, not in `useKeyboardControls`. The `shouldSuppressForWalkthrough` guard in `useKeyboardControls` prevents the 2D pan controls from also responding to WASD during walkthrough.

**Mobile**: `isMobile` check in `CameraPresets` returns null for the whole component, including the Walk button. `enterWalkthrough()` in the store is a no-op when `isMobile()` returns true (enforced in Section 01). The overlay renders null when `walkthroughMode` is false. No mobile-specific code needed here.

**Existing F key behavior in 3D (fit holes)**: This behavior is replaced by walkthrough toggle. The "fit holes" function remains available via the 2D viewport F key, which is untouched.

**CameraControls `enabled={!walkthroughMode}`**: When walkthrough is active, CameraControls must be disabled to prevent orbit/pan interference. The `controls3DRef` is still passed to `CameraPresets` and `useKeyboardControls`, but `enabled=false` means the user cannot orbit while walking.

**Exit via deferred rAF in store (Section 01)**: `exitWalkthrough()` uses `requestAnimationFrame` to restore the previous layout after CameraControls re-enables. The overlay calling `exitWalkthrough()` does not need to know about this — it just calls the action.

---

## Acceptance Criteria

1. Pressing F while hovering over the 3D viewport enters walkthrough mode (calls `enterWalkthrough()`).
2. Pressing F again, or pressing Escape, exits walkthrough.
3. While in walkthrough, number keys (1-6) and R do not switch camera presets.
4. The walkthrough overlay appears immediately on entry with exit button and controls hint.
5. Controls hint fades to invisible after 3 seconds.
6. Clicking "Exit Walkthrough" button calls `exitWalkthrough()`.
7. The Walk button in `CameraPresets` toggles walkthrough and shows active state styling.
8. The Walk button is not visible on mobile.
9. The 2D viewport F key still zooms to fit all holes (unchanged).
10. All 639+ existing tests continue to pass.