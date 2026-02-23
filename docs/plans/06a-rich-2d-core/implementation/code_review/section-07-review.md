# Section 07 Code Review: Textured 2D Holes

## Critical Issues

### 1. LOD zoom detection is broken (HIGH)
`useThree((s) => s.camera)` returns a stable object reference — zoom changes won't trigger re-renders. LOD switching will never happen at runtime. Must use `useFrame` band-tracking pattern like `ArchitecturalGrid2D.tsx`.

### 2. Playwright test wrong `addHole` signature (HIGH)
Store's `addHole` takes positional args `(type, position, templateId?)`, not a single object. Tests will produce no holes, validating empty canvases.

### 3. No material disposal — memory leak (MEDIUM)
When `fill` color changes (UV mode toggle), old `ShaderMaterial` and `MeshBasicMaterial` are not disposed. Need `useEffect` cleanup.

### 4. `useGroupOpacity` won't work with ShaderMaterial (MEDIUM)
Felt shader hardcodes `gl_FragColor = vec4(feltColor, 1.0)`. The `useGroupOpacity` hook sets `mat.opacity` which has no effect on custom ShaderMaterial. Need a `uOpacity` uniform.

### 5. R3F internal `__r$` property in test is fragile (MEDIUM)
Undocumented R3F internal for setting zoom. No other test uses this pattern.

## Low Severity
- Geometry not shared across same-type holes (minor optimization)
- Test file naming is camelCase (consistent with existing tests, plan said kebab-case)

## Summary
Core architecture is correct. Two critical bugs (LOD reactivity, test signature) must be fixed.
