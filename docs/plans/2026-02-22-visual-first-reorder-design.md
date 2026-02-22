# Visual First Reorder — Updated Project Manifest

**Date:** 2026-02-22
**Status:** Approved
**Context:** Gap analysis of reference images (Plan7Architekt / Ashampoo Home Design) against project manifest splits 02-07. User felt Split 01 delivered infrastructure but not enough visible change. Reference images showed professional 2D floor plans with thick walls, door arcs, furniture icons, dimension lines, status bar, and rich 3D environments.

## Decision

Reorder splits to deliver **visual transformation first**, tool features second. Split the overloaded original Split 06 into two sub-splits (06a core rendering, 06b furniture library). Drop material/texture palette (insufficient use case for single-material steel hall).

## Reference Image Analysis

Three annotated screenshots from Plan7Architekt / Ashampoo Home Design:
- **Green boxes**: 3D viewport with textured exterior, ground plane, landscaping, shadows
- **Violet markers**: 2D floor plan detail — wall thickness, door swing arcs, dimension lines, furniture icons, room labels with area (m²), status bar (coords, scale, units), ribbon toolbar, layer dropdown

### Gaps Identified

| Feature | Current Plan Coverage | Gap |
|---------|----------------------|-----|
| Status bar (coords, scale, selection, units) | None | Added to 06a |
| Furniture/fixture library (11 types) | None | New split 06b |
| Material/texture palette | None | Dropped (insufficient use case) |
| Ribbon toolbar priority | Split 07 (last) | Stays last (acceptable) |
| Dimension lines in floor plan | Split 02 | Moved up to position 2 |

### Devil's Advocate Findings (Incorporated)

1. **Original Split 06 was overloaded** — 3 features (rich 2D + status bar + furniture) made it 10-13 sections. Split into 06a + 06b.
2. **Furniture library is a scope trap** — essentially a second object placement system. Isolated into its own split.
3. **Dimensions are visually essential** — floor plan without dimensions doesn't match reference. Moved Split 02 to position 2.
4. **Status bar built incrementally** — start with coords + zoom + scale in 06a, extend in later splits.
5. **R3F 2D rendering risk** — achieving architectural drawing quality in WebGL orthographic view needs a spike. Added to 06a.
6. **Material palette dropped** — in a single-material BORGA hall, there's nothing to customize. Zone colors belong in Split 03.

## Revised Execution Order

```
01 (DONE) ─── FOUNDATION
    │
    ├──→ 06a Rich 2D Core + Status Bar       ← NEXT
    │     │
    │     └──→ 02 Measurement & Dimensions
    │           │
    │           └──→ 06b Furniture Library
    │
    ├──→ 05 3D Environment (independent)
    │
    ├──→ 03 Annotations & Zones
    │
    ├──→ 04 Precision & Smart Tools
    │
    └──→ 07 Export + Ribbon + Cmd Palette     ← needs 02, 03, 06
```

### Split Details

#### 06a — Rich 2D Floor Plan Core + Status Bar (NEXT)

**User-visible outcome:** 2D pane transforms from schematic rectangles into a professional architectural floor plan.

**Scope:**
- Rendering spike: thick walls + door arcs + hatch patterns in R3F orthographic View (proof of viability)
- Wall thickness rendering (not just lines)
- Door/window architectural symbols (swing arcs, break lines)
- Textured 2D hole representations (felt surface pattern)
- Scale-dependent detail (more at high zoom, simplified at overview)
- Grid refinement with labeled coordinates
- Title block (project name, scale, date)
- Status bar: mouse coordinates (X, Z in meters), zoom/scale indicator, active layer name

**Estimated sections:** 6-8
**Sessions:** 1-2

#### 02 — Measurement & Dimensions

**User-visible outcome:** Professional dimension lines appear on the floor plan, completing the architectural look.

**Scope:** (unchanged from original manifest)
- Click-to-measure tool
- Persistent dimension lines
- Auto-dimension wall lengths
- Hole spacing display
- Scale bar widget
- Live coordinate display (enhances status bar from 06a)
- Area overlay preparation (for zones in 03)
- Dimension Zustand slice

**Estimated sections:** 5-7
**Sessions:** 1-2

#### 06b — Furniture/Fixture Library

**User-visible outcome:** Venue planning objects appear on the floor plan — reception counter, benches, UV lamps, etc.

**Scope:**
- Furniture data model (new Zustand slice, persisted, undo-tracked)
- Save format migration (v9)
- 11 fixture types as 2D plan icons:
  - Reception counter, POS terminal, waiting bench
  - Storage shelf, emergency exit sign, UV lamp stand
  - Shoe rack, coat hooks, trash bin
  - Fire extinguisher, first aid station
- Furniture library panel in sidebar (new tab or section within existing)
- Drag-from-library placement with grid snap
- Basic rotate + delete for placed furniture
- Layer integration (furniture on its own layer)
- Collision behavior TBD: visual-only markers vs. physical collision with holes

**Estimated sections:** 5-7
**Sessions:** 1-2

#### 05 — 3D Environment

**User-visible outcome:** 3D pane gets ground, sky, building exterior, and walkthrough.

**Scope:** (unchanged from original manifest, material palette dropped)
- Ground plane (grass/gravel texture)
- Hall exterior model (corrugated steel walls, roof)
- Sky dome or environment map
- Shadow improvements
- First-person walkthrough (WASD + collision)
- Performance: GPU tier gating

**Estimated sections:** 5-7
**Sessions:** 1-2

#### 03 — Annotations & Zones (unchanged)
#### 04 — Precision & Smart Tools (unchanged)
#### 07 — Export + Command Palette + Ribbon Toolbar (unchanged, capstone)

## Updated Dependency Map

| Split | Depends On | Dependency Type |
|-------|-----------|-----------------|
| 06a | 01 (done) | Uses dual viewport, layers, orthographic View |
| 02 | 06a | Dimension lines render on the rich 2D floor plan |
| 06b | 06a | Furniture renders on the rich 2D floor plan |
| 05 | 01 (done) | Builds on 3D pane |
| 03 | 01 (done) | Renders in both panes, uses layers |
| 04 | 01 (done) | Precision tools work within viewport interaction |
| 07 | 02, 03, 06a, 06b | Export needs dimensions, annotations, furniture |

**Parallelizable after 06a:** 02, 05, 03, 04 (all independent of each other)
**Sequential:** 06b waits for 06a. 07 waits for 02 + 03 + 06.

## Risks

1. **R3F architectural rendering quality**: Crisp lines, hatch patterns, and zoom-independent text in WebGL. Mitigated by rendering spike at start of 06a.
2. **Furniture placement scope creep**: Could expand into full interaction system. Mitigated by isolating into 06b with explicit scope boundaries.
3. **Status bar retrofit**: Will need updates as each tool split adds modes. Accepted — incremental extension is manageable.
