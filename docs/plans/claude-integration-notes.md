# Phase 12 Plan — Integration Notes

## Opus Review Feedback Integration

### Integrating (with modifications)

1. **Phase 11A prerequisite** — YES. Add explicit note. Phase 11A must be merged to main first. The reflector material on HallFloor needs to be accounted for in Section 8.

2. **Texture asset acquisition section** — YES. Add concrete details: download as part of Section 1 implementation (Claude can use curl/wget in bash), specify exact resolution (1K-JPG), total budget (<10MB), add fallback plan (procedural textures via Canvas2D).

3. **Conditional texture loading architecture** — YES. The hooks problem is real. Solution: create a `<TexturedHole>` wrapper component that wraps the Suspense boundary. GPU tier check happens OUTSIDE the Suspense boundary (parent component reads tier, conditionally renders `<TexturedHole>` or `<FlatHole>`). This avoids hook ordering issues. Add to Section 1.

4. **Triangle budget in Section 1** — YES. Add gating check: max 500 triangles per bumper rail, validate before proceeding. If over budget, reduce curveSegments.

5. **Simplify Section 6** — YES. Replace full curve rework with corner fillet meshes. Much simpler, still looks good. The curved collision bounds issue is real — filleting the visual corner while keeping AABB collision separate is the right approach.

6. **Remove texture atlas from Section 9** — YES. Premature optimization for 4 materials. Remove it.

7. **Geometry disposal in Section 2** — YES. Add useEffect cleanup pattern for ExtrudeGeometry. Already established pattern from useMaterials.ts.

8. **Top-down view criteria** — YES. Add per-section: "In top-down: bumpers use simple box outline, no normal maps, flags hidden." Conditional on camera mode.

9. **TemplateHoleModel material divergence** — YES. Call this out explicitly. Section 7 switches TemplateHoleModel from singleton materials to useMaterials() hook. This is a behavioral change (starts respecting materialProfile) — document as intentional improvement.

10. **Test mocking strategy** — YES. Add note: mock drei's useTexture to return dummy MeshStandardMaterial in tests. Mock useGLTF similarly. No WebGL context needed.

### NOT Integrating

1. **Shared component API definitions** — The plan is a blueprint, not code. The implementer (deep-implement) will design component APIs during implementation. Adding detailed interfaces to the plan would violate the "no code in plans" principle.

2. **Build size impact section** — Textures are in public/ (not bundled). GLTF loader is already in drei (tree-shaken). The chunk size concern is pre-existing and unrelated to Phase 12. Not adding this.

3. **Inconsistent LANE_WIDTH** — This is pre-existing behavior, not a Phase 12 concern. Shared components will accept width as a prop. No plan change needed.

4. **Loop geometry swap concern** — Keeping TubeGeometry for loop. The reviewer says TorusGeometry is sufficient, but TubeGeometry gives better control over cross-section shape and the track surface appearance. The visual improvement is meaningful for Stylized Realism.

5. **Visual regression tests** — Phase 11A's visual test suite exists but is specific to UV mode/theme. Phase 12 visual regression would need screenshot comparison, which is problematic in headless R3F. Not adding — manual verification is sufficient for a personal tool.

6. **Kenney kit format verification** — Will verify during implementation. If FBX/OBJ only, convert to GLB or fall back to procedural. The plan already has the procedural fallback path.

7. **Windmill animation forcing continuous rendering** — The plan already says "frameloop-aware, respects invalidate()". Animation only runs in 3D view (not top-down). This is the same pattern as UV mode's "always" frameloop. Not a new concern.

8. **Flag instancing** — 18 flags is trivial mesh count. Not worth InstancedMesh complexity.
