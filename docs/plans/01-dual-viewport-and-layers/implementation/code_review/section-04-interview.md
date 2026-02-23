# Section 04 Code Review Interview — Dual Canvas Views

## Review Summary

The code review identified 5 issues after extracting ThreeCanvas.tsx into SharedScene + ThreeDOnlyContent and setting up the dual-View architecture.

## Findings & Decisions

### 1. SoftShadows Dynamic Mount/Unmount (Critical — Auto-fix)

**Issue:** SoftShadows was inside ThreeDOnlyContent, which renders inside a View that gets conditionally mounted/unmounted on layout changes. SoftShadows patches `THREE.ShaderChunk` globally — dynamic mount/unmount causes shader corruption.

**Fix:** Moved SoftShadows to Canvas level in DualViewport.tsx (always mounted, controlled by `shouldEnableSoftShadows(gpuTier)` which doesn't toggle at runtime). Removed from ThreeDOnlyContent entirely.

**Status:** Applied

### 2. Fog Leaks to 2D View (High — Auto-fix)

**Issue:** `fogExp2` attaches to `scene.fog` which is scene-level — shared between all Views. In dual mode, fog would darken the 2D orthographic view.

**Fix:** Added `viewportLayout` selector to ThreeDOnlyContent. Fog only enables when `viewportLayout === "3d-only"` AND the existing fog conditions are met.

**Status:** Applied

### 3. PlacementHandler Mounted Twice (High — Auto-fix)

**Issue:** PlacementHandler was in SharedScene, which renders in both 2D and 3D Views. In dual mode, click events would fire placement handlers twice.

**Fix:** Removed PlacementHandler from SharedScene. Added it to the 2D View in DualViewport (always). Added it to the 3D View only when `!show2D` (3d-only mode), ensuring it's always available but never duplicated.

**Status:** Applied

### 4. ThreeCanvas.tsx Not Deleted (Medium — Auto-fix)

**Issue:** After extraction to SharedScene + ThreeDOnlyContent, ThreeCanvas.tsx was dead code with no imports.

**Fix:** Deleted the file.

**Status:** Applied

### 5. No Suspense Inside Views (Low — Let go)

**Issue:** Individual Views don't have Suspense boundaries. The existing `<Suspense fallback={null}>` wrapping `<View.Port />` in the Canvas already handles this at the compositor level.

**Decision:** Let go. The Canvas-level Suspense is sufficient. Per-View Suspense would add complexity without benefit since Views share the same render context.

**Status:** Not needed

## Verification

- TypeScript: clean (`npx tsc --noEmit`)
- Tests: 548 passing (48 files)
- No regressions
