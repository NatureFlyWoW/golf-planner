# Phase 12 Interview Transcript

Interview conducted during design doc review session (pre-deep-plan). User answered open questions from the Phase 12 design doc, plus additional decisions made during Devil's Advocate and Blue Team reviews.

## Q1: Technical Approach — Procedural (A), GLTF (B), or Hybrid (C)?

**Answer:** Option C — Hybrid. Procedural for parametric surfaces (felt lanes, bumper rails, cups, tees) that must scale to varying hole dimensions. GLTF for complex accent obstacles (windmill) that can be fixed-size decorative pieces.

## Q2: Art Style?

**Answer:** Stylized Realism — polished, high-end look with real materials (felt, wood, metal, stone) but slightly idealized proportions and colors. Think "beautiful indie game," not photorealistic CAD.

## Q3: Texture Sourcing?

**Answer:** CC0 assets from Poly Haven and ambientCG. No Blender modeling by the user.

## Q4: Priority Holes — which types first?

**Answer:** All 7 legacy types at once. The user wants comprehensive visual upgrade across the board, not a phased rollout of individual types.

## Q5: Material Profile Visual Tiers (from Devil's Advocate review)

**Decision:** Ship one visual quality tier (standard_diy) in Phase 12. Per-tier textures (plywood for budget, aluminum for semi_pro) deferred to future phase. This prevents tripling texture workload.

## Q6: GLTF Obstacle Scaling Strategy (from Devil's Advocate review)

**Decision:** GLTF obstacles are fixed-size accent pieces (e.g., windmill ~0.8m × 0.8m × 1.2m). The parametric lane wraps around the obstacle position. Obstacles do NOT scale with hole dimensions.

## Q7: Felt Displacement (from Devil's Advocate review)

**Decision:** No displacement on felt surfaces. Causes z-fighting with bumper bases and costs performance for negligible visual gain at typical zoom levels. Use normal maps only for surface detail.

## Q8: Section Ordering (from Blue Team review)

**Decision:** Content-first. Section 1 must produce a visible change (one complete hole transformation). Infrastructure built as needed within content sections, not as separate upfront sections.

## Q9: Loading Strategy (from Blue Team review)

**Decision:** Progressive enhancement. App starts instantly with current flat-color materials. Textures load asynchronously. Materials swap from flat to textured when loaded. No loading screen.

## Q10: Hall Environment (from Blue Team review)

**Decision:** Keep hall environment polish (concrete floor, steel walls) as a section. The BORGA hall identity matters — it should look like a real steel building, not a generic gray box.

## Q11: Kenney Minigolf Kit (from research)

**Research finding:** Kenney's CC0 Minigolf Kit (125+ models, GLTF, 3MB total) is purpose-built for mini golf. Low-poly style aligns with Stylized Realism art direction.

**Decision (Claude recommendation, user did not explicitly choose):** Download and evaluate the Kenney kit first for windmill and other obstacles. Fall back to improved procedural geometry if the kit's style doesn't match or lacks needed models.

## Q12: Green Felt Texture (from research)

**Research finding:** No green mini golf felt texture exists in CC0 libraries. Closest are neutral carpet/fabric textures.

**Decision (Claude recommendation):** Use a neutral carpet texture (ambientCG Carpet012 or Fabric026) and tint it green in the shader via the material's color property. The normal map provides fiber direction regardless of base color.
