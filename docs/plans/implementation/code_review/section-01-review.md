# Code Review: Section 01 - GPU Tier Classifier

## Verdict
Implementation is substantially correct but contains one DOM structure bug, one missing error handler, and one behavioral gap.

---

## HIGH SEVERITY

### 1. Broken DOM nesting in FinancialSettingsModal.tsx (Layout Bug)
Lines 196-232: The GPU Quality section was inserted OUTSIDE the `flex flex-col gap-4` form wrapper (which closes at line 196), and the extra `</div>` at line 232 prematurely closes the modal content container. The Footer renders outside the white modal box.

**Fix:** Move GPU Quality block inside the form wrapper, remove extra `</div>`.

### 2. No .catch() on getGPUTier() promise (Unhandled Rejection)
`useGpuTier.ts` line 83: If `getGPUTier()` throws (no WebGL), produces unhandled promise rejection.

**Fix:** Add `.catch(() => { /* stays at 'low' default */ })`.

---

## MEDIUM SEVERITY

### 3. Selecting 'Auto' does not immediately re-resolve tier
When switching from manual override back to "Auto", gpuTier is not immediately updated. The hook's useEffect will eventually fire but there's a visible lag.

### 4. Stale cached tier never expires
localStorage cache has no TTL — stale forever if user upgrades GPU.

### 5. Shadow configuration is not tier-aware
`shadows={!uvMode ? "soft" : undefined}` is not gated by tier. Plan says low=no shadows, mid=PCF 512, high=PCSS 2048. May be deferred to section-05.

---

## LOW SEVERITY

### 6. No test for readCachedTier rejecting invalid values
Garbage value in localStorage (e.g., "potato") returns null correctly but isn't tested.

### 7. Missing corrupted-state migration test from plan
Plan specified `migratePersistedState(null, 6)` test — absent.

### 8. PerformanceMonitor has no callbacks
No onDecline/onIncline — pure overhead until later sections add callbacks.

### 9. resolveGpuTier call in modal is redundant
When opt.value !== "auto", resolveGpuTier just returns opt.value unchanged.

---

## COMPLETENESS: 16/16 plan items implemented, 2 bugs found
