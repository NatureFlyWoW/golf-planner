# Interview Transcript — Split 05: 3D Environment

**Note:** User authorized fully autonomous operation. Answers synthesized from MEMORY.md, CLAUDE.md, postmortem-phase11a, spec, project manifest, and session history.

## Q1: Walkthrough camera — PointerLock (immersive FPS) or click-drag (cursor visible)?

**Answer (from context):** Default to click-drag look (cursor stays visible). This is a planning tool, not a game. Pointer lock steals the cursor and can confuse users. BUT offer an optional toggle for users who want full immersion. The user wants "immersive" but also values the planning-tool nature of the app.

**Decision:** Click-drag look by default. Optional PointerLock toggle in walkthrough toolbar overlay.

## Q2: Should WASD keys work differently in walkthrough vs normal 3D view?

**Answer (from codebase):** Currently WASD is used for 2D panning (`useKeyboardControls.ts`). In 3D view, only camera presets (1-6), R (reset), F (fit) are mapped. In walkthrough mode, WASD should switch to movement controls. Since walkthrough forces 3D-only layout, there's no conflict with 2D pan.

**Decision:** WASD = movement in walkthrough mode. Previous keyboard mapping suspended during walkthrough.

## Q3: What's the walkthrough spawn point?

**Answer (from hall geometry):** The south wall has the entrance doors — sectional door at offset 3.25m (3.5m wide) and PVC door at offset 8.1m (0.9m wide). The PVC door is the human entrance. Spawn at PVC door position: x=8.1, y=1.7 (eye level), z=19.5 (just inside south wall), looking north into the hall.

**Decision:** Spawn inside hall near PVC door, facing north.

## Q4: Should walkthrough respect UV mode?

**Answer (from context):** Absolutely. Walking through the blacklight venue in UV mode would be the most impressive experience — seeing the neon glow, the UV lamps, the emissive materials from eye level. UV mode should work in walkthrough without changes (same materials, same lighting).

**Decision:** Walkthrough inherits current UV/normal mode. No special handling needed.

## Q5: Ground plane texture — grass, asphalt, or gravel?

**Answer (from context):** The BORGA hall sits on a Gewerbegrund (commercial ground) in Gramastetten. Commercial/industrial sites in Austria typically have asphalt or gravel surfaces. The spec says "asphalt/gravel." Given it's leased commercial land, asphalt parking + gravel border is realistic.

**Decision:** Asphalt texture for ground plane. Simple, realistic for commercial site.

## Q6: How far should the ground extend?

**Answer (from devil's advocate review):** 15m extension beyond hall in all directions (not 30m — overkill for 10×20m hall). Total ground: ~40×50m. Fog fades the edges.

**Decision:** 15m extension, faded with fog.

## Q7: Roof geometry — how detailed?

**Answer (from BORGA specs):** 7° pitch, ridge along 20m length. With 10m width (5m half-span): ridge height = wallHeight + tan(7°) × 5 = 4.3 + 0.613 = 4.913m. This nearly matches `firstHeight: 4.9m` from hall constants. Very subtle — nearly flat. Two inclined planes meeting at ridge. No gutters, no overhangs, no trim.

**Decision:** Two simple inclined plane meshes. Steel texture matching walls.

## Q8: Should environment elements be in a new "environment" layer?

**Answer (from project patterns):** Yes. The layer system already supports toggling visibility. Adding an "environment" layer lets users hide ground/exterior/sky if it's distracting during layout planning. Default: visible.

**Decision:** New "environment" layer controlling ground, exterior, sky visibility.

## Q9: Performance considerations — any concerns?

**Answer (from codebase):** Current scene is lightweight. Adding ground (1 draw call), exterior walls (DoubleSide = 0 extra draws, same meshes), roof (2 draw calls), sky (1 draw call) is negligible. Total: <10 extra draw calls. Walkthrough is zero extra cost (same scene, different camera). GPU tier gating: low tier gets flat-color ground + no exterior + basic sky; mid+ gets textures.

**Decision:** Follow existing GPU tier gating pattern. Walkthrough available on all tiers.

## Q10: What about the existing postprocessing pipeline during walkthrough?

**Answer (from codebase):** PostProcessing only renders in `3d-only` viewport layout. Walkthrough forces 3d-only, so postprocessing WILL be active during walkthrough. This is good — bloom, AO, etc. enhance the walkthrough experience.

**Decision:** No changes needed. Walkthrough benefits from existing postprocessing.

## Q11: Door openings in walkthrough — can you walk through doors?

**Answer (from hall geometry):** Doors are defined in hall.ts but HallWalls.tsx renders solid box walls with no cutouts. For walkthrough realism, doors should have openings (or at least the entrance door). This is a technical challenge — need to subtract door geometry from wall mesh.

**Decision:** For MVP, treat doors as passable zones — collision detection allows passage through door areas (x/z ranges matching door positions on south wall). Visual cutouts are nice-to-have but not blocking.

## Q12: What will the user SEE differently? (Mandatory validation per CLAUDE.md)

**After this split ships, opening the app:**
1. **3D orbit view**: Hall sits on an asphalt ground plane, has a visible steel roof, gradient sky instead of dark void. Looks like a building in a commercial lot.
2. **Walkthrough**: Press F or click button → camera drops to eye level inside the hall. Walk among the golf holes with WASD, look around by dragging. See felt surfaces, wooden bumpers, windmill obstacles from player perspective. Exit with Escape.
3. **UV walkthrough**: Toggle UV mode during walkthrough → the venue transforms into a blacklight experience at eye level. Neon glow, purple atmosphere, emissive materials.

**What stays the same:** All hole models, 2D floor plan, sidebar, toolbar, budget, mobile layout.

This is content-first (walkthrough = experiencing the content) with environment as context (ground, exterior, sky = supporting infrastructure). Aligned with Build Order Principle and postmortem lessons.
