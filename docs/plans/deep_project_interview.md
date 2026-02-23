# Deep Project Interview — Golf Forge Next Evolution

## Interview Method
This interview was conducted by synthesizing context from:
- User's verbal description and metaphor ("calculator that can do calculus")
- 3 reference images of professional German architecture software (Plan7Architekt-style)
- 42 screenshots across 12 completed project phases
- Session handoff document from Phase 12
- Full codebase exploration (UI components, store architecture, 3D rendering pipeline)
- MEMORY.md with 12 phases of project history and user preferences

The user explicitly requested autonomous operation ("skip questions unless critical, I'll be away"), trusting Claude to steer the project direction based on the rich reference material provided.

---

## Topic 1: Natural Boundaries

### What the user said
> "The overall app and project is functionally very nice and has GREAT potential. I want it to pop out and be way, way more useful."
> "Not necessarily from an UI or design standpoint, that is solid, I am talking functionality, display, rendering."
> "Easy to use but in the hands of a master an absolute beast."

### Reference image analysis
The 3 reference images show a professional home planning tool with these clearly separable functional domains:
1. **Viewport system** — simultaneous 2D+3D split-pane with synchronized selection
2. **Dimensioning & measurement** — rulers, dimension lines, area displays, scale bars
3. **Layered information architecture** — toggleable layers for different element categories
4. **Annotation & markup** — text labels, callouts, drawing tools overlaid on the plan
5. **Zone/room definition** — functional areas with area calculations and hatching
6. **Precision tools** — numeric input, alignment guides, smart snapping, coordinate display
7. **3D environment** — orbit camera, ground plane, building exterior, lighting
8. **Professional output** — print-ready plans, PDF export, construction documents

### Current codebase structure
The existing app has clear architectural separation:
- `src/components/three/` — R3F canvas, hole models, hall, postprocessing (3D viewport)
- `src/components/ui/` — sidebar, toolbar, budget panels, location bar (UI shell)
- `src/store/` — Zustand slices for holes, budget, UI state, builder (data layer)
- `src/utils/` — placement math, collision detection, chain computation (logic)
- `src/types/` — TypeScript types for all domain objects

The store has clean slice boundaries: holes/holeOrder, budget/budgetConfig/financialSettings/expenses, ui (ephemeral), holeTemplates/builderDraft. Adding new feature domains (measurements, layers, zones, annotations) would naturally create new slices.

### Natural split boundaries identified
The features cluster into these distinct systems:

**A. Viewport Infrastructure** (Split-pane, camera, coordinate system)
- Dual R3F canvas management
- Synchronized selection/hover across panes
- Orbit controls in 3D pane
- Camera preset system
- This is FOUNDATIONAL — almost everything else depends on it

**B. Measurement & Dimensioning** (Rulers, distance, areas)
- Click-to-measure tool
- Persistent dimension lines (new data model)
- Area calculation overlay
- Scale bar widget
- Live coordinate display / distance readouts while dragging
- This is a NEW data domain (dimensions store slice)

**C. Layer System** (Visibility toggling)
- Layer definitions and toggle state
- Per-layer opacity control
- Layer lock (prevent edits)
- Layer panel UI
- Integration with all renderable elements
- Relatively self-contained, touches rendering of all elements

**D. Annotations & Markup** (Text, arrows, callouts)
- Annotation data model (new store slice)
- Text placement tool
- Arrow/line drawing tool
- Callout boxes with leader lines
- Annotations need to render in both 2D and 3D views
- Depends on the viewport system (A)

**E. Zone System** (Functional areas within the hall)
- Zone data model (polygons with type classification)
- Zone drawing tool
- Area calculation per zone
- Zone rendering (hatching in 2D, floor coloring in 3D)
- Zone budget linking
- Depends on viewport (A) and integrates with budget

**F. Precision & Alignment Tools** (Numeric input, smart guides)
- Numeric position input panel
- Alignment guides (snap to other objects' edges/centers)
- Distribution tools (evenly space holes)
- Grid size control
- Transform gizmo with rotation handle upgrade
- Enhances the existing placement system

**G. Enhanced 3D Environment** (Orbit, ground, exterior, walkthrough)
- Orbit camera controls
- Ground plane with texture
- Hall exterior model (walls, roof from outside)
- Environment lighting upgrade
- First-person walkthrough camera
- Camera preset buttons with smooth transitions

**H. Rich 2D Floor Plan** (Textured surfaces, architectural symbols, print quality)
- Textured 2D representations of holes (not flat rectangles)
- Wall thickness rendering
- Door/window architectural symbols
- Zone hatching patterns
- Scale-dependent detail levels

**I. Professional Export** (PDF, presentation renders, material schedule)
- Dimensioned floor plan PDF generation
- Cost summary report generation
- Material schedule auto-generation
- High-quality 3D renders
- This is OUTPUT — depends on most other features being in place

**J. Enhanced Toolbar & Command Palette** (Deep tool organization)
- Categorized toolbar with dropdowns/submenus
- Command palette (Ctrl+K) with fuzzy search
- Keyboard shortcuts panel
- Contextual right-click menus
- Enhances discoverability of all other features

---

## Topic 2: Ordering Intuition

### Foundational systems (must come first)
1. **Viewport Infrastructure (A)** is the prerequisite for everything. The dual-pane layout, synchronized camera, and orbit controls are the foundation that all other features render into.
2. **Layer System (C)** should come very early because new features (dimensions, annotations, zones) need layer integration from the start. Retrofitting layers is harder than building with them.
3. **Enhanced Toolbar (J)** should evolve alongside features — each new tool category needs toolbar integration.

### Dependencies
```
A (Viewport) ───→ everything else
C (Layers) ──────→ B, D, E, H (all renderables need layer support)
A + C ───────────→ B (Measurement), D (Annotations), E (Zones)
B (Measurement) ─→ I (Export needs dimensions)
E (Zones) ───────→ I (Export needs zone data)
F (Precision) ───→ independent, enhances existing placement
G (3D Env) ──────→ independent, enhances existing 3D
H (Rich 2D) ─────→ semi-independent, enhances existing 2D
I (Export) ───────→ depends on B, E, H being done first
J (Toolbar) ──────→ evolves alongside all others
```

### Parallel opportunities
- **Group 1**: After A+C, both B (Measurement) and D (Annotations) can run in parallel
- **Group 2**: F (Precision) and G (3D Environment) are largely independent of each other and of Group 1
- **Group 3**: H (Rich 2D) can start after A is done, doesn't need B/D/E
- **Capstone**: I (Export) and J (Toolbar polish) come last

---

## Topic 3: Uncertainty Mapping

### Clear (high confidence)
- **Split-pane dual view**: Well-understood pattern (resizable split with two R3F canvases). Technical risk: two R3F canvases sharing a scene graph may need careful state sync. R3F's `View` component or `createPortal` could help.
- **Layer system**: Straightforward visibility toggles on renderable groups. Main question: where does layer state live (new store slice vs. UI state)?
- **Dimension lines**: Data model is simple (two endpoints + distance label). Rendering in both 2D and 3D is the work.
- **Zone polygons**: Similar to annotation system but with area calculation and type classification.

### Somewhat uncertain
- **Dual R3F canvas performance**: Running two WebGL contexts simultaneously may strain mid-tier GPUs. May need to share a single WebGL context with viewport splitting, or render one pane at reduced frame rate.
- **Rich 2D textures**: Current 2D view is orthographic 3D. Making it look like a traditional 2D floor plan (clean lines, architectural symbols, hatching) while still being R3F requires careful shader/material work or a hybrid canvas approach.
- **First-person walkthrough**: Navigation controls, collision with walls, eye-level camera — this is a mini game-like feature. Complexity depends on fidelity expectations.
- **PDF generation**: Client-side PDF with dimensioned floor plans. Libraries like jsPDF + svg2pdf or html2canvas exist but complex layouts are tricky.

### Highly uncertain
- **Two R3F canvases vs. viewport splitting**: The fundamental technical approach for split-pane needs prototyping. R3F `View` components with a single `Canvas` may be more performant than two separate `Canvas` instances.
- **Hybrid 2D rendering**: Should the 2D pane remain R3F (orthographic camera looking down) or switch to a true 2D canvas (SVG/Canvas2D) for cleaner architectural output? R3F keeps consistency but SVG gives sharper print output.

---

## Topic 4: Existing Context

### Technology constraints
- **React 19 + TypeScript + Vite** — must stay
- **@react-three/fiber + @react-three/drei** — primary 3D framework, not switching
- **Zustand with temporal (zundo)** — state management, undo/redo
- **Tailwind CSS** — UI styling
- **Biome** — linting/formatting (tabs, alphabetical imports)
- **Client-side only PWA** — no server, localStorage persistence
- **Save format v8** — must maintain migration path

### Performance constraints
- GPU tier gating system already in place (low/mid/high)
- Vendor-three chunk at 1,330 KB — already large
- Must maintain 30+ fps on mid-tier hardware
- Two R3F canvases will roughly double GPU memory usage

### Testing baseline
- 495 Vitest tests (46 files) — must not regress
- Playwright visual tests — screenshot baselines may need updating
- Pre-commit hook runs tests

### User preferences (from MEMORY.md)
- Wants autonomous operation, skip unnecessary questions
- Wants adversarial review (devils-advocate + blue-team) at meaningful checkpoints
- Wants subagent-driven development (parallelized)
- Content quality (how things LOOK) is primary concern
- Build Order Principle: user-visible improvements first, infrastructure second

---

## Summary of Key Decisions

1. **The reference images define the target**: professional split-pane CAD tool aesthetic and functionality
2. **The "calculator" metaphor defines the UX philosophy**: everything works simply by default, power features discoverable but not in the way
3. **Content/rendering quality remains paramount**: new features must look professional, not just functional
4. **Incremental delivery**: each split should be independently deployable and testable
5. **Performance is a real constraint**: dual-view rendering needs careful technical planning
6. **Existing features are kept**: dark theme, budget tracker, hole builder, UV mode — all stay and integrate with new systems
