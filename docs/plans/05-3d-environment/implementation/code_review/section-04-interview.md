# Section 04 Code Review Interview

## Triage Summary

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| 1 | Set allocated on every keypress | MEDIUM | Auto-fix: hoisted to module-level `WALKTHROUGH_ALWAYS_ACTIVE` |
| 2 | Escape swallows all Escape presses | MEDIUM | Auto-fix: only `return` when `walkthroughMode` is true |
| 3 | F key can't exit walkthrough (suppression guard blocks it) | HIGH | Auto-fix: added F key exit check before suppression guard |
| 4 | Missing F/Escape decision tests | MEDIUM | Let go: requires React hook rendering, not pure-function testable |
| 5 | WalkthroughOverlay not in mobile path | LOW | Let go: no-op (walkthroughMode always false on mobile) |
| 6 | CameraControls not disabled in mobile 3D | LOW | Let go: walkthrough is no-op on mobile |
| 7 | ThreeDOnlyContent deviation from plan | LOW | Let go: section 02 already mounted WalkthroughController in DualViewport |
| 8 | Capture vs bubble phase interaction | INFO | Let go: correct behavior documented |

## Auto-Fixes Applied

### 1. Hoisted Set to module scope
Replaced inline `new Set(...)` in `shouldSuppressForWalkthrough` with module-level `WALKTHROUGH_ALWAYS_ACTIVE` constant.

### 2. Escape only consumes when walkthrough active
Changed Escape handler to only `return` when `walkthroughMode` is true. Otherwise falls through for future Escape handlers.

### 3. F key exit before suppression guard
Added `if ((e.key === "f" || e.key === "F") && walkthroughMode)` check BEFORE the `shouldSuppressForWalkthrough` guard, so F can always exit walkthrough. The guard then prevents F from reaching the 3D switch case during walkthrough (which is fine since exit already happened). When not in walkthrough, F falls through to the 3D switch case which calls `enterWalkthrough()`.
