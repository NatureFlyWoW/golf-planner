## Section 08: Code Review Interview

### Triage

| Finding | Action | Rationale |
|---------|--------|-----------|
| Inline material allocation | Auto-fix | Extract as module singleton per project pattern |
| Array re-allocations | Auto-fix | Extract rotation + args as constants |
| Key fragility | Let go | Harmless with fixed constants |

### Auto-Fixes Applied

1. **Material singleton**: Extracted `fixtureMaterial` as `new THREE.MeshStandardMaterial(...)` at module level, passed via `material={fixtureMaterial}` prop
2. **Constants**: Extracted `LAMP_ROTATION` and `FIXTURE_ARGS` as typed tuples at module level
