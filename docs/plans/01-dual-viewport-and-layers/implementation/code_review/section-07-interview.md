# Section 07 Code Review Interview — Auto-Resolved

User is away; all items triaged and resolved by Claude autonomously.

## Critical Issues

### C1: Shared singleton material mutation in HallWalls FlatHallWalls path
- **Decision:** AUTO-FIX
- **Rationale:** FlatHallWalls uses module-level singleton materials (`planningWallMaterial`, `uvWallMaterial`). The `useEffect` in `HallWalls` that traverses and mutates `opacity`/`transparent` on all child meshes will permanently corrupt these singletons. Fix: extract `useGroupOpacity` as a shared hook, and in HallWalls make it clone-or-skip singleton materials. Simpler approach: just use the extracted shared hook on the outer `<group ref>` which already wraps both Flat and Textured paths — but the singleton materials are shared across ALL FlatHallWalls instances. Best fix: stop using the traverse approach for FlatHallWalls, instead pass opacity as a prop and use per-instance materials. Actually, simplest correct fix: extract useGroupOpacity to a shared module and add original-value restore on cleanup. The traverse already works on the group ref wrapping HallWalls — since singletons are module-level, we need to restore them on unmount or opacity change.

### C2: Duplicated useGroupOpacity logic (HoleModel.tsx and HallWalls.tsx)
- **Decision:** AUTO-FIX
- **Rationale:** Extract `useGroupOpacity` to a shared utility hook `src/hooks/useGroupOpacity.ts`. Both HoleModel and HallWalls import from there. Add cleanup/restore logic (addresses Warning #5 too).

### C3: Missing lock guards on handlePointerMove and handlePointerUp
- **Decision:** AUTO-FIX
- **Rationale:** If the layer becomes locked mid-drag, `handlePointerMove` should stop processing and `handlePointerUp` should clean up state. Add `if (layerLocked) return;` at the top of both handlers, plus ensure handlePointerUp still resets drag state even when locked.

## Warnings

### W4: HallOpenings doesn't receive opacity prop
- **Decision:** LET GO
- **Rationale:** Low visual impact — openings are just holes in walls. When walls are hidden, openings hide too (conditional render in Hall.tsx). Opacity on openings is a nice-to-have for a future pass.

### W5: useGroupOpacity lacks cleanup/restore logic
- **Decision:** AUTO-FIX (folded into C2)
- **Rationale:** When opacity goes back to 1 or component unmounts, original material state should be restored. Will store original values in a WeakMap and restore on cleanup.

### W6: Redundant double-guard on RotationHandle lock
- **Decision:** LET GO
- **Rationale:** PlacedHoles already conditionally renders RotationHandle when `!holesLayer.locked`, AND RotationHandle has its own `layerLocked` guard. The double-guard is harmless defense-in-depth. Not worth removing.

### W7: FlowPath Text labels don't fade with opacity
- **Decision:** AUTO-FIX
- **Rationale:** The Line fades but the numbered labels stay fully opaque — looks odd. Add `fillOpacity` to Text component.

### W8: No useLayerState helper hook created
- **Decision:** LET GO
- **Rationale:** The plan mentions this as optional. Each component already selects its layer directly. A helper hook would add indirection for minimal benefit.

### W9: No needsUpdate flag on materials after mutation
- **Decision:** AUTO-FIX (folded into C2)
- **Rationale:** Setting `mat.needsUpdate = true` after mutating material properties ensures Three.js picks up the change on the next render.

## Nitpicks

### N10: groupRef in useGroupOpacity deps is unnecessary (refs are stable)
- **Decision:** AUTO-FIX (folded into C2 — will remove from deps in shared hook)

### N11-12: Minor style items
- **Decision:** LET GO

## Summary of Actions
1. Extract `useGroupOpacity` to `src/hooks/useGroupOpacity.ts` with cleanup/restore logic and needsUpdate (C2, W5, W9, N10)
2. Update HoleModel.tsx and HallWalls.tsx to use shared hook (C1, C2)
3. Add lock guards to handlePointerMove and handlePointerUp in MiniGolfHole.tsx (C3)
4. Add fillOpacity to FlowPath Text labels (W7)
