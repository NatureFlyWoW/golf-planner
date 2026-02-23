# Section 01 Code Review Interview

## Auto-fixes Applied

### 1. enterWalkthrough idempotency guard (from review finding #1)
- Added `if (get().ui.walkthroughMode) return;` to prevent double-enter from overwriting previousViewportLayout
- Added test: "no-ops when already in walkthrough mode (preserves original previousViewportLayout)"

### 2. exitWalkthrough spurious call guard (from review finding #2)
- Added `if (!get().ui.walkthroughMode) return;` to prevent exit when not in walkthrough
- Added test: "no-ops when not in walkthrough mode (does not clobber viewportLayout)"

### 3. Mobile guard afterEach cleanup (from review finding #4)
- Moved `mockMobile.value = false` to an `afterEach` block for robustness

## Let Go

### Persistence exclusion tests (review finding #3)
- Tests match existing project pattern in `viewportLayers.test.ts`
- Pre-existing weakness, not introduced by this section

### rAF stubbing deviation (review finding #5)
- Justified: `vi.stubGlobal` targets only rAF vs `vi.useFakeTimers` intercepting all timers
