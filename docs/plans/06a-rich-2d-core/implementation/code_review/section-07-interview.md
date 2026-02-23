# Section 07 Code Review Interview

## Triage Decision
All 5 review findings were clear auto-fixes with no tradeoffs. No user interview needed.

## Auto-fixes Applied

### 1. LOD zoom reactivity (CRITICAL — auto-fixed)
**Issue:** `useThree((s) => s.camera)` returns stable ref; zoom changes don't trigger re-render.
**Fix:** Replaced with `useZoomLodFallback()` hook using `useFrame` band-tracking pattern from `ArchitecturalGrid2D.tsx`. Tracks `LodLevel` state and only re-renders on threshold crossings.

### 2. Playwright test `addHole` signature (CRITICAL — auto-fixed)
**Issue:** `addHole` takes positional args `(type, position, templateId?)`, not an object.
**Fix:** Changed to `state.addHole("straight", { x: 5, z: 10 })`.

### 3. Material disposal (MEDIUM — auto-fixed)
**Issue:** Old materials not disposed when `fill` color changes (UV mode toggle).
**Fix:** Added `useEffect` cleanup that calls `feltMaterial.dispose()` and `solidMaterial.dispose()`.

### 4. ShaderMaterial opacity (MEDIUM — auto-fixed)
**Issue:** Felt shader hardcoded alpha=1.0; `useGroupOpacity` has no effect.
**Fix:** Added `uOpacity` uniform to shader, set `transparent: true` on material, output `gl_FragColor = vec4(feltColor, uOpacity)`.

### 5. Fragile R3F internal `__r$` in test (MEDIUM — auto-fixed)
**Issue:** Undocumented R3F internal for zoom setting.
**Fix:** Replaced with mousewheel `dispatchEvent` on the 2D pane element for zoom control.

## Let Go
- Geometry sharing across same-type holes: minor optimization, not worth complexity
- File naming: camelCase matches existing test file convention
