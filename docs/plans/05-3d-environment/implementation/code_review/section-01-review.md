# Section 01 Code Review: Walkthrough State & Store Integration

## Overall Assessment

The implementation is a faithful, near-verbatim translation of the section plan. All 10 checklist items are covered. Types, store actions, environmentGating changes, and tests are all present and structurally correct.

## Issues

### 1. MEDIUM: Double-enter overwrites previousViewportLayout with "3d-only"

Calling `enterWalkthrough()` while already in walkthrough mode overwrites `previousViewportLayout` with `"3d-only"`. A double-enter followed by exit will restore to `"3d-only"` instead of the original layout. No test covers this edge case. Section 04 keyboard handler must debounce or guard against this.

### 2. LOW: exitWalkthrough does not guard against spurious calls

If `exitWalkthrough()` is called when `walkthroughMode` is already `false`, it will schedule a rAF that silently changes `viewportLayout` to `"dual"` (the null fallback). Adding `if (!get().ui.walkthroughMode) return;` would prevent this.

### 3. LOW: Persistence exclusion tests are tautological

The tests manually reconstruct the partialize output by hand-copying keys. They don't actually call the `partialize` function. Same pattern as existing `viewportLayers.test.ts`.

### 4. TRIVIAL: Mobile guard cleanup uses manual reset

`mockMobile.value = false` at the end of the test is fragile if the test throws. An `afterEach` would be more robust.

### 5. DEVIATION (justified): rAF stubbing approach

Plan recommended `vi.useFakeTimers()` but implementation uses `vi.stubGlobal("requestAnimationFrame")` with manual callback queue. This is arguably better since `vi.useFakeTimers()` intercepts all timers globally.

## What Looks Good

- Type additions are non-optional as required
- Atomic `set()` in `enterWalkthrough`
- Two-phase exit pattern (immediate + deferred rAF)
- `deriveFrameloop` walkthroughMode check placed first
- All existing tests updated with 5th argument
- Test coverage matches plan specification
