# 06 - Implementation Phases

## Rationale

Strict phasing prevents scope creep. Each phase delivers a usable tool — not a half-built future vision. Phase 1 must be usable for layout planning within days.

## Phase 1: Core (Desktop MVP)

**Goal:** "Can we plan a layout?"

**Scope:**
- Project scaffolding (Vite + React + TS + R3F + Zustand + Tailwind + Biome)
- BORGA hall constants in `src/constants/hall.ts`
- Zustand store with holes, holeOrder, selectedId, ui slices
- Top-down orthographic view of the hall floor plan
- Hall rendering: floor plane, wall borders, door/window rectangles
- Grid overlay (1m major lines)
- Hole library panel (4 types: straight, l-shape, dogleg, ramp)
- Click-to-place holes on the floor
- Select and drag holes to reposition
- Rotate selected hole (0/90/180/270)
- Delete selected hole
- Auto-save to localStorage (zustand persist with partialize)
- JSON export button (download current layout)
- Desktop layout only (sidebar + canvas)

**Not in Phase 1:**
- 3D camera toggle
- Collision detection
- Player flow path
- Grid snap
- Mobile layout
- Budget tracking
- Undo/redo
- PWA

**Definition of done:** You and your friends can open the app in a browser, place holes in the hall, move them around, and export the layout as JSON.

## Phase 2: Polish

**Goal:** "Does the layout actually work?"

**Scope:**
- 3D isometric camera toggle (top ↔ 3D view)
- AABB collision detection (prevent overlapping holes)
- Player flow path visualization (numbered route lines)
- Grid snap toggle (0.25m minor grid)
- Ghost hole preview (green/red placement feedback)
- Named saves (save/load multiple layout configurations)
- Undo/redo (zundo middleware)
- Hole rotation via drag handle (not just buttons)
- More hole types (loop, windmill, tunnel) if obstacle choices are known

**Definition of done:** Layout planning has guard rails (can't overlap holes), player flow is visible, and you can compare multiple layout ideas.

## Phase 3: Mobile + PWA

**Goal:** "Friends can use it on their phones"

**Scope:**
- Responsive layout (<768px: fullscreen canvas + bottom toolbar + overlay panels)
- Touch interaction model (tap-to-place, one-finger drag, gesture disambiguation)
- Bottom toolbar with icon buttons
- Full-screen overlay panels (not bottom sheets)
- PWA setup (vite-plugin-pwa, service worker, manifest, icons)
- Performance tuning (dpr cap, frameloop=demand, throttled touch events)

**Definition of done:** App is installable on phones, layout planning works via touch, friends can access via URL.

## Phase 4: Budget

**Goal:** "What will this cost?"

**Scope:**
- Budget sidebar tab (desktop) / overlay panel (mobile)
- Pre-populated categories from feasibility study (mid-range estimates)
- Editable estimated/actual/notes per category
- Total calculation with variance (estimated vs actual)
- Budget data persisted to localStorage
- Card layout on mobile, table on desktop

**Definition of done:** Budget tracking works alongside layout planning in the same app.

## Future (no phase assigned)

These are ideas, not commitments:
- PDF floor plan export (jsPDF)
- Share layout via URL (encode state in URL hash or use a simple backend)
- Realistic 3D obstacle models (replace colored blocks with actual shapes)
- UV/blacklight theme toggle (dark mode with glowing elements)
- Walking simulation (first-person perspective through the course)
- Cost auto-estimation (adding holes updates course budget automatically)
