<!-- PROJECT_CONFIG
runtime: typescript-npm
test_command: npm test
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-straight-glowup
section-02-shared-library
section-03-windmill
section-04-tunnel
section-05-loop-ramp
section-06-corner-fillets
section-07-template-parity
section-08-hall-environment
section-09-performance
END_MANIFEST -->

# Phase 12: Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable With |
|---------|------------|--------|---------------------|
| section-01-straight-glowup | - | 02, 03, 04, 05, 06, 07, 08, 09 | - |
| section-02-shared-library | 01 | 03, 04, 05, 06, 07 | - |
| section-03-windmill | 02 | 09 | 04, 05 |
| section-04-tunnel | 02 | 09 | 03, 05 |
| section-05-loop-ramp | 02 | 09 | 03, 04 |
| section-06-corner-fillets | 02 | 09 | 08 |
| section-07-template-parity | 02 | 09 | 08 |
| section-08-hall-environment | 01 | 09 | 06, 07 |
| section-09-performance | 03, 04, 05, 06, 07, 08 | - | - |

## Execution Order (with parallelization)

1. **Batch 1:** section-01-straight-glowup (foundation — must be first)
2. **Batch 2:** section-02-shared-library (depends on 01)
3. **Batch 3:** section-03-windmill, section-04-tunnel, section-05-loop-ramp (parallel — each modifies a different file)
4. **Batch 4:** section-06-corner-fillets, section-07-template-parity, section-08-hall-environment (parallel — no file overlap)
5. **Batch 5:** section-09-performance (last — touches all files)

## Section Summaries

### section-01-straight-glowup
Transform the straight hole type from flat boxes to textured, rounded geometry. Downloads CC0 textures, creates bumper profile utility, useTexturedMaterials hook, TexturedHole/FlatHole pattern, recessed cup with flag, rubber tee pad. **This section establishes all shared infrastructure.**

### section-02-shared-library
Extract reusable BumperRail, Cup, TeePad components. Refactor all 7 legacy hole types to use shared components. Only upgrades shared elements (bumpers, felt, cup, tee) — obstacle-specific geometry stays unchanged.

### section-03-windmill
Replace cylinder+box windmill with charming miniature building. GLTF from Kenney kit or improved procedural geometry. Rotating blades (3D view only). Fixed-size accent within parametric lane.

### section-04-tunnel
Replace half-cylinder tunnel with stone archway. ExtrudeGeometry arch profile with brick texture. Dark interior, entrance framing detail.

### section-05-loop-ramp
Loop: TubeGeometry with metallic material, tapered support pillars, cross-brace. Ramp: curved bezier slope profile (not triangular), continuous felt texture.

### section-06-corner-fillets
Add visual fillet meshes at dogleg transition points and L-shape junction corners. Decorative only — collision AABB unchanged. Simpler approach than full curve rework.

### section-07-template-parity
Upgrade segmentGeometry.ts with rounded bumper profiles. Migrate TemplateHoleModel from singleton materials to useMaterials() hook. Ensure all 11 segment types match legacy hole visual quality.

### section-08-hall-environment
Concrete floor texture, steel panel wall texture. Account for existing MeshReflectorMaterial from Phase 11A. Minor lighting adjustments for PBR response.

### section-09-performance
GPU tier texture gating verification. Top-down view optimization (no normal maps, no flags, simple bumpers). mergeVertices on all ExtrudeGeometry. Triangle budget enforcement. Test mocking strategy documentation.
