# Section 05 Code Review Interview

## Triage Summary

| # | Finding | Severity | Action |
|---|---------|----------|--------|
| 1 | useMemo used for side effects (texture wrapping) | MEDIUM | Auto-fix: changed to useEffect |
| 2 | Missing tex.needsUpdate = true | MEDIUM | Auto-fix: added needsUpdate = true |
| 3 | receiveShadow on FlatGround with meshBasicMaterial | LOW | Auto-fix: removed receiveShadow from FlatGround |
| 4 | Position tuple recreated every render | LOW | Let go: values from constants, R3F handles fine |
| 5 | gpuTier type assertion | LOW | Let go: safe due to gating logic |
| 6 | Docstring incomplete for shouldShowGroundTexture | INFO | Auto-fix: extended JSDoc comment |

## Auto-Fixes Applied

### 1. useMemo → useEffect for texture configuration
Changed `useMemo` (pure computation) to `useEffect` (side effect) for mutating texture wrapping properties. `useMemo` semantically should not have side effects; React 19's compiler may skip or double-invoke memos.

### 2. Added tex.needsUpdate = true
After setting `wrapS`, `wrapT`, and `repeat` on textures, added `tex.needsUpdate = true` to force GPU re-upload. Without this, cached textures already uploaded with `ClampToEdge` may not pick up the `RepeatWrapping` change.

### 3. Removed receiveShadow from FlatGround
`meshBasicMaterial` does not participate in the lighting/shadow pipeline. `receiveShadow` on the mesh was a no-op. Removed to avoid misleading code.

### 4. Extended shouldShowGroundTexture JSDoc
Added mid/high tier distinction to the docstring per the plan specification.
