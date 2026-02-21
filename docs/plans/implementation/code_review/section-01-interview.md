# Code Review Interview: Section 01 - GPU Tier

## Auto-fixes Applied

### 1. Fix DOM nesting in FinancialSettingsModal.tsx (HIGH)
GPU Quality section was outside the flex-col wrapper. Moved inside, removed extra `</div>`.

### 2. Add .catch() to getGPUTier() promise (HIGH)
Prevents unhandled rejection on devices without WebGL.

### 3. Simplify redundant resolveGpuTier call in modal (LOW)
Replaced `setGpuTier(resolveGpuTier(opt.value, gpuTier))` with `setGpuTier(opt.value)` since resolveGpuTier is identity when override !== "auto".

## User Decisions

### Auto re-resolve on switching to "Auto"
**Decision:** Accept lag. useEffect fires shortly after — practically invisible.

## Let Go

- Cache TTL: over-engineering for personal tool
- Shadow tier-gating: deferred to section-05-environment
- PerformanceMonitor callbacks: scaffolding for later sections
- mapDetectGpuToAppTier edge cases: library only returns 0-3
- Missing tests for invalid cache / corrupted null state: defensive but low value
