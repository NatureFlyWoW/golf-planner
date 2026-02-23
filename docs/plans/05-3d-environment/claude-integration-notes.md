# Integration Notes — Opus Review Feedback

## Integrating (Must Fix)

### 1. Fog only in 3d-only mode ✅
Correct — fog is scene-level, bleeds into 2D pane. Plan updated: fog only renders when `viewportLayout === "3d-only"` (which includes walkthrough). In dual mode, ground simply stops at geometry edge. This is acceptable — users can collapse to 3D-only for the full immersive experience.

### 2. `deriveFrameloop()` — add walkthroughMode parameter ✅
Adding `walkthroughMode: boolean` as 5th parameter. Must update call site in DualViewport.tsx. When `walkthroughMode === true`, always return "always". Section 1 updated to specify parameter change + call sites.

### 3. Pointer events on pane div ✅
WalkthroughController attaches pointer events to the 3D pane div (accessed via ref from DualViewport context), not the canvas. In 3d-only mode, use the container div. Section 2 updated.

### 4. Door exception — compute from hall constants ✅
Remove hardcoded coordinates. Function computes door zones from `hall.doors` array. Section 3 updated.

### 5. Mobile walkthrough — explicitly disabled ✅
Walkthrough button hidden on mobile. `enterWalkthrough()` early-returns if `isMobile()`. Touch-based walkthrough deferred to future enhancement. Section 9 updated.

## Integrating (Should Fix)

### 6. Remove PointerLock from this split ✅
Agreed — Escape key conflict is a real state machine issue. Click-drag look is sufficient for MVP. PointerLock deferred. Section 4 simplified.

### 7. Environment layer type added in Section 5 (not 8) ✅
The type/constant additions move to Section 5 (first environment component). Section 8 focuses on camera enhancements and layer wiring polish.

### 8. Separate exterior meshes (BackSide) instead of DoubleSide ✅
Accepted — thin walls (0.1m) with DoubleSide risk z-fighting. Add separate exterior mesh group with `side: BackSide`. Slightly more draw calls but visually correct. Section 6 updated.

### 9. Use hall.firstHeight for ridge height ✅
Use `hall.firstHeight` (4.9m) directly instead of computing from pitch angle. Section 6 updated.

### 10. Deferred camera restoration ✅
`exitWalkthrough()` is two-phase: first restore camera (deferred via rAF), then restore layout. Avoids race condition with CameraControls remounting. Section 2 updated.

## NOT Integrating

### 11. Shadow camera — separate light for environment
Too complex for this split. The existing shadow frustum covers the hall; ground shadows will be approximate but good enough. If shadow quality is insufficient, we address in a polish pass.

### 12. Ground tiling artifacts at walkthrough distance
Valid concern but premature optimization. 2m tiles at 1.7m height may be visible. We'll evaluate during implementation and add detail noise in polish if needed.

### 13. Layer opacity binary threshold
The environment layer opacity slider will simply control material opacity. If it looks bad at partial values, we can clamp to binary in a future iteration. Default is 1.0 (fully opaque).
