# Interview Transcript — Split 06a: Rich 2D Floor Plan Core + Status Bar

**Note:** User was away during this step and gave full autonomy: "I will be away for a while, you are the master of the universe please proceed always as you see fit." This is a self-interview based on extensive project context from MEMORY.md, reference images, prior sessions, and the spec.

---

## Q1: What's the priority ordering within this split — if we run out of time, what ships first?

**Answer (from project context):** The spec mandates a rendering spike first to validate feasibility. After that, the priority order based on the reference image analysis and user's "Visual First" directive is:
1. **Wall thickness rendering** — transforms the look most dramatically (thin lines → solid walls)
2. **Door/window architectural symbols** — completes the architectural appearance
3. **Status bar** — quick win, high visibility, referenced explicitly in gap analysis
4. **Grid refinement** — labeled coordinates make it feel professional
5. **Textured 2D holes** — felt pattern replaces flat rectangles
6. **Scale-dependent detail** — polish for zoom behavior
7. **Title block** — nice-to-have, low risk

---

## Q2: How should wall thickness rendering work — modify existing HallWalls geometry or add a separate 2D overlay?

**Answer (from codebase knowledge):** The existing `HallWalls.tsx` renders walls as simple geometry for both 2D and 3D views. For the 2D view, we should:
- Create a **new component** `ArchitecturalWalls2D.tsx` that renders thick wall rectangles (meshes) with proper fill
- Keep the existing `HallWalls.tsx` for the 3D view (it already has proper 3D wall geometry)
- Use the layer system to show `ArchitecturalWalls2D` only in the 2D pane
- Wall thickness: ~0.2m for exterior walls (BORGA steel), ~0.12m for interior partitions
- Wall data comes from `src/constants/hall.ts` which already has wall positions

---

## Q3: What should the wall fill look like — solid color, or hatched?

**Answer (from reference images):** Plan7Architekt reference images show walls as solid dark fill (not hatched) for structural walls, with hatching reserved for section cuts. For our floor plan:
- **Exterior walls**: Solid fill (dark gray/black) with outline
- **Hatching**: Reserve for potential future zone fills (Split 03), not walls in 06a
- This simplifies the initial implementation — hatch shaders can be added in 03 for zones

---

## Q4: Door symbols — should they show opening direction with arc, or simplified?

**Answer (from reference images):** Reference images show standard floor plan convention: quarter-circle arc showing the door swing path, with a line showing the door panel. This is the Plan7Architekt standard.
- **Arc**: Quarter-circle (90°) drawn with drei `<Line>`, computed as a polyline of ~20 points
- **Door panel**: Line from hinge to door edge
- **Opening direction**: Determined by door data in `hall.ts`
- The BORGA hall has main entry door and emergency exit — both get swing arcs

---

## Q5: Window symbols — what convention?

**Answer (from reference images):** Standard architectural plan symbols: parallel lines across the wall opening with a gap, sometimes with a slight curve. For the BORGA hall windows:
- Two parallel lines across the opening (representing glass)
- Short perpendicular ticks at each end (wall break)
- Window positions from `hall.ts`

---

## Q6: Status bar content — what exactly should it show?

**Answer (from spec + gap analysis):** The status bar was identified as a gap vs Plan7Architekt. Contents:
- **Mouse coordinates**: X, Z in meters (updates in real-time as mouse moves over 2D pane)
- **Zoom/scale indicator**: Current zoom level (e.g., "1:50" or "Zoom: 4.2x")
- **Active layer name**: From the layer system
- **Future extensibility**: Will grow as tools are added (measurement mode, selection count, etc.)
- **Placement**: Fixed bar at bottom of the application, full width
- **Style**: Minimal, dark background, monospace coordinates — matches reference images

---

## Q7: Should the status bar be inside or outside the R3F Canvas?

**Answer (from technical analysis):** **Outside the Canvas** — a regular React DOM element. Reasons:
- Status bar content is text-heavy, needs CSS styling
- It's a fixed UI element, not part of the 3D scene
- React state updates for mouse position are trivial
- Mouse coordinates can be captured from R3F's pointer events and passed to Zustand
- This matches the reference images where the status bar is clearly a separate UI element

---

## Q8: Scale-dependent detail — what thresholds and what changes?

**Answer (from spec + architectural convention):**
- **Overview zoom** (camera.zoom < ~15): Simplified — wall outlines only, no fill patterns, larger text labels, no door arcs, simplified grid
- **Medium zoom** (15 ≤ zoom < 40): Standard — solid wall fill, door arcs, window symbols, grid labels
- **Close zoom** (zoom ≥ 40): Full detail — textured holes (felt pattern), fine grid, all symbols at full detail
- Transitions should use `camera.zoom` thresholds checked in `useFrame` or component-level conditional rendering

---

## Q9: Grid refinement — how should labeled coordinates work?

**Answer (from reference images + spec):**
- Grid lines should be lighter (reduced opacity compared to current)
- **Major gridlines**: Every 1m, slightly more visible
- **Minor gridlines**: Every 0.25m at close zoom, hidden at overview zoom
- **Labels**: Numbers along top and left edges (0, 1, 2... in meters)
- Labels use drei `<Text>` with inverse-zoom scaling for constant screen size
- Grid spacing adapts to zoom: at very far zoom, show only 2m or 5m gridlines

---

## Q10: Title block — position and content?

**Answer (from spec):**
- **Position**: Bottom-right corner of the 2D pane, HUD-style (doesn't scroll with content)
- **Content**: Project name ("Golf Forge"), scale indicator (e.g., "1:50"), date
- **Implementation**: drei `<Hud>` component or HTML overlay positioned absolutely
- **Style**: Small, unobtrusive, standard architectural drawing convention

---

## Q11: Hole felt texture — procedural shader or image texture?

**Answer (from research + rendering vision):**
- Use a **procedural shader** for the felt surface — a subtle noise pattern that gives texture without being a full PBR material in 2D
- The 3D view already has PBR felt textures on holes; the 2D view needs just a visual indicator that this is a playing surface, not a flat rectangle
- Green/colored tint matching the hole type + subtle noise for felt appearance
- Bordered with a visible outline (darker stroke)

---

## Q12: Performance concerns — how many objects are we adding to the 2D scene?

**Answer (from codebase knowledge):**
- Hall has 4 walls, 2 doors, ~4 windows → ~10-15 architectural symbol objects
- Grid: already exists, refining labels adds ~40 text instances at most
- Holes: typically 9-18 on the floor plan → 9-18 textured meshes
- Status bar: DOM element, zero GPU impact
- Title block: 1 Hud element or DOM
- **Total new 3D objects**: ~70-80 at most. Well within performance budget.
- All new objects are 2D-pane only, no impact on 3D viewport rendering cost

---

## Q13: Testing strategy for this split?

**Answer (from project patterns):**
- **Unit tests (Vitest)**: Wall geometry calculation, grid spacing logic, zoom threshold logic
- **Visual regression (Playwright)**: 2D pane appearance at different zoom levels
- **Integration**: Status bar updates when mouse moves, layer visibility affects architectural elements
- Follow existing test patterns: store-based state manipulation via `window.__STORE__`
