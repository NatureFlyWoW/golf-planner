# Opus Review

**Model:** claude-opus-4-6
**Generated:** 2026-02-23T03:30:00Z

---

## Overall Assessment

Well-structured plan that correctly prioritizes walkthrough as the killer feature. Aligns with Phase 11A postmortem lessons. Not a repeat of the 11A mistake — delivers genuine user-visible content.

## Critical Issues

1. **Fog in Dual Mode — Architectural Contradiction**: Fog is scene-level and bleeds into 2D pane. Plan proposes fog in dual mode which contradicts existing constraint. Fog should only be in 3d-only mode.

2. **`deriveFrameloop()` Signature Mismatch**: Function has no `walkthroughMode` parameter. Need to specify exact signature change and update call sites. Non-UV walkthrough on low GPU would get "demand" frameloop (wrong).

3. **Pointer Events and Canvas eventSource Conflict**: Canvas has `pointerEvents: "none"`, events go through `eventSource={containerRef}`. WalkthroughController must attach events to pane div, not canvas.

4. **DoubleSide on Thin Walls — Z-Fighting Risk**: 0.1m thick walls with DoubleSide will have competing front/back faces. Safer: separate exterior meshes with `BackSide`.

## Significant Issues

5. **Door Exception Coordinates Wrong**: Sectional door range [2.8, 6.3] is wrong. Should be [1.5, 5.0] (offset=3.25, width=3.5). Compute dynamically from hall constants.

6. **Camera Restoration Race Condition**: exitWalkthrough changes layout simultaneously with restoring camera. CameraControls may not exist during transition. Need deferred restoration.

7. **WalkthroughController Key Event Isolation**: WASD doesn't conflict with current shortcuts (it's not currently mapped in 3D). Real conflict is F key. Both systems listen on window — need event ordering.

8. **Spawn Point Euler Values**: "Facing north" means -Z direction in Three.js. Should explicitly state initial euler values.

9. **PointerLock Scope Creep**: Escape key conflict (browser exits PointerLock vs app exits walkthrough), mobile issues. Recommend removing from this split entirely.

## Moderate Issues

10. **Roof Math**: Use `hall.firstHeight` (4.9m) instead of computing.
11. **Ground Tiling at Walkthrough Distance**: 2m tiles look obviously tiled at 1.7m eye height. Use larger tiles or detail texture blend.
12. **Shadow Camera Frustum Too Small → Too Large**: Increasing frustum reduces shadow resolution. Consider separate shadow light for environment.
13. **Layer Opacity on Ground**: Semi-transparent ground looks bad. Use binary visibility threshold.
14. **No Store Migration Needed**: Confirm layers are ephemeral (not persisted). ✓
15. **Mobile Walkthrough Ambiguity**: Sections contradict — one says mobile walkthrough works, risk table says it's out of scope.

## Minor Issues

16. **Environment Layer in Wrong Section**: Added in Section 8 but needed by Sections 5-7. Move to Section 5.
17. **HallRoof/Foundation Mount Point**: Not specified where in component tree. Should go in ThreeDOnlyContent.
18. **Missing Texture Acquisition Step**: No step to download CC0 textures.
19. **Hole Dimension Resolution for Collision**: Should use same OBBInput format as existing collision.ts.

## Verdict

Plan delivers genuine user-visible improvements. Walkthrough is the right priority. 5 must-fix issues, 4 should-fix issues before implementation proceeds.
