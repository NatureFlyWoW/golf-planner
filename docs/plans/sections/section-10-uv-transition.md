Now I have all the context I need. Let me produce the section content.

# Section 10: UV "Lights Out" Transition

## Overview

This section implements the theatrical UV "Lights Out" transition -- the signature interaction for GOLF FORGE. When the user toggles UV mode, instead of an instant material swap, a cinematic 4-phase CSS overlay animation plays: flickering fluorescent tubes, darkness, material swap behind the dark overlay, then a neon awakening reveal.

The `UVTransition` component is a pure DOM overlay that sits on top of the R3F Canvas. It uses `useRef` + `requestAnimationFrame` for timing (not `setTimeout` chains), with only `uvMode` and `transitioning` going through Zustand state. A settings toggle allows users to disable the animation for instant UV toggling.

## Dependencies

- **section-01-gpu-tier**: Provides `transitioning` boolean in Zustand UIState and the `gpuTier` field. The frameloop strategy (`needsAlwaysFrameloop`) already accounts for `transitioning === true` triggering `frameloop="always"`.
- **section-08-uv-lighting**: Provides the UV lamp fixtures and lighting that the transition reveals. The transition masks the material/lighting swap that happens when `uvMode` flips.

## Files to Create

- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/UVTransition.tsx` -- The theatrical transition overlay component

## Files to Modify

- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/store/store.ts` -- Modify `toggleUvMode` to integrate transition logic, add `uvTransitionEnabled` to persisted settings, add `setTransitioning` action
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/types/ui.ts` -- Add `uvTransitionEnabled` to persisted settings type (if not already present from earlier sections)
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/App.tsx` -- Mount the `UVTransition` overlay, add `pointer-events: none` to Canvas during transition
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/Toolbar.tsx` -- Add double-click guard on UV button, add pulse animation when UV is active
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/BottomToolbar.tsx` -- Add double-click guard on UV button in mobile overflow popover
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/index.css` -- Add CSS keyframe animations for overlay flicker, pulse glow
- `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/FinancialSettingsModal.tsx` (or appropriate settings UI) -- Add "UV transition animation" toggle

## Tests (Write First)

Create test file: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/uvTransition.test.ts`

All tests are pure logic/state tests (no DOM or R3F rendering). They test the transition state machine, timing constants, double-click guard, and settings integration.

### Test Stubs

```typescript
import { describe, expect, it } from "vitest";

describe("UV Transition", () => {
  describe("transitioning state", () => {
    it("starts false", () => {
      // Verify Zustand store initial transitioning state is false
    });

    it("set to true when UV toggle fires with animation enabled", () => {
      // Toggle UV mode with uvTransitionEnabled=true
      // Verify transitioning becomes true
    });

    it("set back to false after transition completes", () => {
      // Simulate transition complete callback
      // Verify transitioning returns to false
    });
  });

  describe("double-click guard", () => {
    it("UV toggle ignored when transitioning is true", () => {
      // Set transitioning=true
      // Call toggleUvMode
      // Verify uvMode did NOT change
    });

    it("UV toggle accepted when transitioning is false", () => {
      // Set transitioning=false
      // Call toggleUvMode
      // Verify uvMode changed (or transition started)
    });
  });

  describe("transition phases", () => {
    it("defines 4 phases with correct timing boundaries", () => {
      // Verify TRANSITION_PHASES constant:
      // Phase 1: 0-800ms (flicker)
      // Phase 2: 800-1400ms (darkness, material swap at 800ms)
      // Phase 3: 1400-2400ms (reveal)
      // Phase 4: 2400ms+ (complete, cleanup)
    });

    it("uvMode flip does NOT happen at t=0", () => {
      // Verify the material swap timing is at 800ms, not immediately
    });
  });

  describe("animation disable setting", () => {
    it("when off, uvMode flips instantly with no transition", () => {
      // Set uvTransitionEnabled=false
      // Toggle UV mode
      // Verify uvMode flips immediately
      // Verify transitioning is never set to true
    });

    it("transitioning is never set to true when animation disabled", () => {
      // Set uvTransitionEnabled=false
      // Toggle UV mode
      // Verify transitioning stayed false throughout
    });
  });

  describe("Canvas pointer-events", () => {
    it("pointer-events should be 'none' during transition", () => {
      // This tests the gating logic: when transitioning=true,
      // the derived value for Canvas pointer-events is "none"
    });

    it("pointer-events restored to 'auto' after transition completes", () => {
      // When transitioning=false, pointer-events is "auto"
    });
  });
});
```

### Transition Constants Test

```typescript
describe("transition timing constants", () => {
  it("FLICKER_END is 800ms", () => {
    // Verify the constant
  });

  it("DARKNESS_END is 1400ms", () => {
    // Verify the constant
  });

  it("TRANSITION_DURATION is 2400ms", () => {
    // Verify the constant
  });

  it("MATERIAL_SWAP_TIME equals FLICKER_END", () => {
    // The material swap happens exactly when flicker ends and overlay is dark
  });
});
```

## Implementation Details

### 1. Transition Timing Constants

Create exported constants (for testability) in the `UVTransition.tsx` file or a separate constants file:

```typescript
/** Phase 1 end: flicker simulation (0-800ms) */
export const FLICKER_END = 800;
/** Phase 2 end: darkness period (800-1400ms) */
export const DARKNESS_END = 1400;
/** Total transition duration (0-2400ms) */
export const TRANSITION_DURATION = 2400;
/** Material swap happens at this time (behind dark overlay) */
export const MATERIAL_SWAP_TIME = FLICKER_END;
```

### 2. Zustand Store Changes

The store needs the following changes (some may already exist from section-01):

**UIState additions** (in `src/types/ui.ts`):
- `transitioning: boolean` -- ephemeral, NOT persisted (section-01 should have added this)

**Persisted settings additions**:
- `uvTransitionEnabled: boolean` -- persisted, default `true`. Add to the persisted slice and `partialize`.

**New action**: `setTransitioning: (value: boolean) => void`

**Modified action**: `toggleUvMode` must be updated to check `transitioning` (double-click guard). When `transitioning` is true, `toggleUvMode` is a no-op. When `uvTransitionEnabled` is false, it flips `uvMode` instantly (current behavior). When `uvTransitionEnabled` is true, it sets `transitioning = true` but does NOT flip `uvMode` -- the `UVTransition` component handles the delayed flip via rAF.

Updated `toggleUvMode` logic:

```typescript
toggleUvMode: () => {
  const state = get();
  // Double-click guard
  if (state.ui.transitioning) return;

  if (!state.uvTransitionEnabled) {
    // Instant toggle (animation disabled)
    set((s) => ({ ui: { ...s.ui, uvMode: !s.ui.uvMode } }));
  } else {
    // Start transition -- UVTransition component will flip uvMode at MATERIAL_SWAP_TIME
    set((s) => ({ ui: { ...s.ui, transitioning: true } }));
  }
},
```

A new action is needed to actually flip `uvMode` (called by the UVTransition component at the right time):

```typescript
flipUvMode: () => {
  set((s) => ({ ui: { ...s.ui, uvMode: !s.ui.uvMode } }));
},
```

### 3. UVTransition Component

**Location**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/three/UVTransition.tsx`

This is a **DOM component** (not a R3F component), despite being in the `three/` directory. It renders a full-viewport overlay `<div>` that sits on top of the Canvas.

**Key architectural decisions**:

- **useRef for phase tracking**: The component tracks the current animation phase and start time entirely in refs (`phaseRef`, `startTimeRef`). This avoids React re-renders during the 2.4-second animation. Only `uvMode` and `transitioning` go through Zustand.

- **requestAnimationFrame loop**: A rAF loop starts when `transitioning` becomes true. On each frame, it reads `performance.now()`, calculates elapsed time since transition start, and advances through the phases:
  - **Phase 1 (0 to 800ms)**: Overlay opacity pulses between 0.0 and 0.7 using a sine wave to simulate fluorescent tube flickering. CSS class `uv-transition-flicker` applied.
  - **Phase 2 (800 to 1400ms)**: Overlay opacity ramps to 0.95 (near-black darkness). At exactly 800ms elapsed (confirmed by the rAF time check), call `flipUvMode()` to swap materials/lighting. The user cannot see the swap because the overlay is opaque. UI elements get a CSS class that dims them to 20% opacity.
  - **Phase 3 (1400 to 2400ms)**: Overlay opacity fades from 0.95 to 0.0, revealing the UV scene. Bloom intensity could animate from 0 to target (if section-06 exposes a bloom intensity setter).
  - **Phase 4 (2400ms+)**: Call `setTransitioning(false)`. Remove overlay. Animation complete.

- **Reverse transition** (UV off): Same 4-phase sequence but in reverse. The overlay rises, hides the scene, `flipUvMode()` swaps back to planning materials at 800ms, then the overlay fades away.

- **Cleanup**: If the component unmounts mid-transition, cancel the rAF via `cancelAnimationFrame` in a `useEffect` cleanup.

**Component signature**:

```typescript
export function UVTransition(): JSX.Element | null {
  /** Renders a full-viewport overlay div.
   *  Subscribes to store.ui.transitioning.
   *  When transitioning is true, starts rAF loop.
   *  Manages overlay opacity via direct DOM manipulation (ref.current.style.opacity).
   *  Calls flipUvMode() at MATERIAL_SWAP_TIME.
   *  Calls setTransitioning(false) at TRANSITION_DURATION.
   */
}
```

**Overlay DOM structure**: A single `<div>` with:
- `position: fixed; inset: 0; z-index: 9999` (above everything including sidebar)
- `pointer-events: none` (overlay should not capture clicks)
- `background: #07071A` (void color)
- Opacity controlled via `ref.current.style.opacity` (direct DOM manipulation, no React state)
- `will-change: opacity` CSS hint for GPU compositing

### 4. Canvas Pointer Events During Transition

In `App.tsx`, the Canvas wrapper `<div>` should conditionally set `pointer-events: none` when `transitioning` is true:

```typescript
const transitioning = useStore((s) => s.ui.transitioning);

// In JSX:
<div
  className="relative flex-1"
  style={{
    cursor: tool === "delete" ? "crosshair" : "default",
    touchAction: "none",
    pointerEvents: transitioning ? "none" : "auto",
  }}
>
  <Canvas ... />
  ...
</div>
```

This prevents any clicks during the animation from accidentally selecting holes, triggering state changes, or causing re-renders that would interfere with the overlay.

### 5. UV Button Pulse Animation

After the UV transition completes, the UV toggle button gets a pulsing neon-violet glow. Add a CSS animation to `src/index.css`:

```css
@keyframes uv-pulse {
  0%, 100% {
    box-shadow: 0 0 4px var(--color-neon-violet), 0 0 8px var(--color-neon-violet);
  }
  50% {
    box-shadow: 0 0 8px var(--color-neon-violet), 0 0 16px var(--color-neon-violet), 0 0 24px var(--color-neon-violet);
  }
}

.uv-button-pulse {
  animation: uv-pulse 2s ease-in-out infinite;
}
```

In `Toolbar.tsx` and `BottomToolbar.tsx`, conditionally apply the `uv-button-pulse` class to the UV button when `uvMode` is true and `transitioning` is false:

```typescript
const uvBtnClass = uvMode && !transitioning ? "uv-button-pulse" : "";
```

### 6. Double-Click Guard in UI Components

Both `Toolbar.tsx` and `BottomToolbar.tsx` call `toggleUvMode()` on their UV buttons. The double-click guard is primarily in the store action itself (returning early if `transitioning` is true), so the UI components do not need separate guards. However, the UV button should be visually disabled during transition:

```typescript
const transitioning = useStore((s) => s.ui.transitioning);

// UV button:
<button
  disabled={transitioning}
  onClick={toggleUvMode}
  ...
/>
```

### 7. Settings Toggle for Animation Disable

Add a toggle in the settings UI (either `FinancialSettingsModal.tsx` or a new general settings section). The toggle controls `uvTransitionEnabled` in the persisted store.

Label: "UV transition animation"
Description: "Play theatrical lighting transition when toggling UV mode"
Default: `true`

When this is off, `toggleUvMode` flips `uvMode` instantly (current behavior). No overlay, no animation, no `transitioning` state.

### 8. CSS Keyframes for Flicker Effect

Add to `src/index.css`:

```css
@keyframes uv-flicker {
  0% { opacity: 0; }
  10% { opacity: 0.3; }
  15% { opacity: 0.1; }
  25% { opacity: 0.5; }
  30% { opacity: 0.2; }
  40% { opacity: 0.6; }
  45% { opacity: 0.3; }
  55% { opacity: 0.7; }
  60% { opacity: 0.4; }
  70% { opacity: 0.6; }
  80% { opacity: 0.7; }
  90% { opacity: 0.8; }
  100% { opacity: 0.95; }
}
```

Note: The flicker animation is not directly used via CSS `animation` property -- instead the rAF loop drives opacity programmatically using a sine-based flicker formula. The keyframe above is provided as a reference/fallback, but the primary implementation uses direct DOM manipulation for precise timing control.

### 9. Mounting the UVTransition Component

In `App.tsx`, mount the `UVTransition` component outside the Canvas, at the root level of the app layout:

```tsx
import { UVTransition } from "./components/three/UVTransition";

// In the return JSX, after all other content:
<UVTransition />
```

The component is rendered unconditionally -- it shows nothing when `transitioning` is false (returns a hidden/zero-opacity overlay or `null`).

### 10. Store Migration

If `uvTransitionEnabled` is a new persisted field, the store version must be bumped (from v7 to v8, or added to the v7 migration if section-01 has not been committed yet). The migration adds `uvTransitionEnabled: true` as the default:

```typescript
if (version < nextVersion && p) {
  if (!("uvTransitionEnabled" in (p as Record<string, unknown>))) {
    (p as Record<string, unknown>).uvTransitionEnabled = true;
  }
}
```

Update `partialize` to include `uvTransitionEnabled`.

## Files Summary (Actual)

| File | Action | Description |
|------|--------|-------------|
| `src/utils/uvTransitionConfig.ts` | Created | Timing constants + `canvasPointerEvents` helper |
| `src/components/three/UVTransition.tsx` | Created | rAF-driven DOM overlay, 4-phase animation |
| `src/store/store.ts` | Modified | `uvTransitionEnabled`, `flipUvMode`, `setUvTransitionEnabled`, updated `toggleUvMode` with guard, store v8 migration |
| `src/App.tsx` | Modified | Mount `UVTransition`, canvas `pointer-events` gating |
| `src/index.css` | Modified | `uv-pulse` keyframe + `.uv-button-pulse` class |
| `src/components/ui/Toolbar.tsx` | Modified | UV button disabled + pulse class |
| `src/components/ui/BottomToolbar.tsx` | Modified | UV ToggleBtn disabled + pulse + className prop |
| `src/components/ui/FinancialSettingsModal.tsx` | Modified | UV transition animation toggle |
| `tests/uvTransition.test.ts` | Created | 13 tests for gating, phases, settings |
| `tests/store/migration.test.ts` | Modified | v7->v8 migration tests + v8 passthrough |

## Implementation Notes

### Deviations from Plan
- `uv-flicker` CSS keyframe omitted (plan notes rAF is primary; CSS was reference/fallback only)
- Phase 2 UI dimming not implemented (cosmetic, deferred)
- `MATERIAL_SWAP_TIME` not used at runtime in UVTransition — phase branching uses FLICKER_END/DARKNESS_END directly
- Added unmount cleanup (not in plan) to prevent transitioning getting stuck if component unmounts mid-animation

### Verification Results
- 369 total tests pass (13 new uvTransition + 4 migration)
- `tsc --noEmit` clean
- Store version bumped to 8 with uvTransitionEnabled migration