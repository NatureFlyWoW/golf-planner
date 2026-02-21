# Hole Type Component Builder — Design Document

**Date:** 2026-02-21
**Status:** Approved
**Phases:** 10A (segments + builder), 10B (obstacles + starter templates + cost)

## Goal

Replace the 7 hardcoded hole types with a mobile-first fullscreen hole builder where users compose custom holes by snapping together pre-defined track segments, placing prefab obstacles, and saving reusable templates. The 7 existing presets become starter templates in the builder. Custom holes integrate with the existing planner (placement, collision, cost estimation, UV mode, SVG export).

## Architecture

Full 3D builder using the existing R3F renderer with a top-down orthographic camera. Segments are 3D meshes that auto-chain at connection points. The builder is a dedicated fullscreen mode, lazy-loaded via `React.lazy()`. Separate undo stack from the planner. Templates store only spec IDs and positions — geometry is always generated at render time.

## Approach

**Segment palette** — drag pre-made segments from a categorized palette and snap them end-to-end. Like a track builder (Scalextric, train sets). Linear chains only in v1 (no branching).

**Prefab obstacles** — place pre-configured obstacle types (windmill, ramp, tunnel, loop, bumper post, wall bank) onto the hole surface. Custom box/cylinder primitives deferred to a future phase.

**Presets as starter templates** — the 7 existing hole types appear as read-only templates in the builder. Users duplicate one to customize. Old saves with legacy `type` field continue working via the existing rendering path.

---

## 1. Data Model

### HoleTemplate

```typescript
type HoleTemplate = {
  id: string;                    // UUID
  version: 1;                    // Schema version for future migration
  name: string;                  // "My Custom Loop"
  feltWidth: number;             // Uniform width, default 0.6m (range 0.4-1.0m)
  segments: Segment[];           // Linear chain, tee=first, cup=last
  obstacles: Obstacle[];         // Placed on the hole
  defaultPar: number;            // User sets (1-6)
  color: string;                 // Accent color for library/flow path
  createdAt: string;             // ISO date
};
```

Bounding box is computed on-the-fly from segments via `computeTemplateBounds()`, not stored.

### Segment

```typescript
type Segment = {
  id: string;
  specId: SegmentSpecId;         // Key into SEGMENT_SPECS
  position: { x: number; z: number };  // Auto-computed from chain
  rotation: number;              // Auto-computed from previous segment exit
  connections: {
    entry: { segmentId: string | null };
    exit: { segmentId: string | null };
  };
};
```

Position and rotation are auto-computed when segments snap together. The user doesn't manually position them.

### SegmentSpec

```typescript
type SegmentSpec = {
  id: SegmentSpecId;
  label: string;
  category: "straight" | "curve" | "complex";
  entryPoint: { x: number; z: number; angle: number };
  exitPoint: { x: number; z: number; angle: number };
  arcCenter?: { x: number; z: number };
  arcRadius?: number;
  arcSweep?: number;             // Degrees
  length: number;                // Approximate centerline length (for cost/display)
  generateGeometry: (feltWidth: number) => BufferGeometry;
};
```

### 11 Segment Types

| Type | Category | Description |
|------|----------|-------------|
| `straight_1m` | straight | 1m straight |
| `straight_2m` | straight | 2m straight |
| `straight_3m` | straight | 3m straight |
| `curve_90_left` | curve | 90 deg left turn |
| `curve_90_right` | curve | 90 deg right turn |
| `curve_45_left` | curve | 45 deg gentle left |
| `curve_45_right` | curve | 45 deg gentle right |
| `curve_30_wide` | curve | 30 deg wide sweep |
| `s_curve` | complex | S-shaped double bend |
| `u_turn` | complex | 180 deg reversal |
| `chicane` | complex | Quick left-right-left wiggle |

### Obstacle (Prefab Only in v1)

```typescript
type PrefabObstacle = {
  id: string;
  prefabId: "windmill" | "ramp" | "tunnel" | "loop" | "bumper_post" | "wall_bank";
  position: { x: number; z: number };  // Relative to hole origin, XZ plane at felt height
  rotation: number;                      // 90 deg snaps
};

type Obstacle = PrefabObstacle;
// CustomObstacle (box/cylinder primitives) deferred to future phase
```

### Integration with Existing Hole Type

```typescript
// Existing Hole gets one optional new field:
type Hole = {
  // ...existing fields unchanged...
  type: HoleType;              // Legacy, still works for old holes
  templateId?: string;         // Points to HoleTemplate if custom-built
};
```

No new `"custom"` variant added to `HoleType` union. Rendering branches on `templateId` presence:
- `if (hole.templateId)` -> render from template
- `else` -> legacy type-based rendering (unchanged)

---

## 2. Builder UI & Interaction (Mobile-First)

### Entering the Builder

- "Build Hole" button at bottom of Holes sidebar/drawer
- Opens fullscreen mode replacing the main planner
- "Edit" button on each custom hole in the library re-opens it in the builder

### Layout

**Mobile:**
- Canvas fills the screen
- Top bar: hole name (editable), felt width (0.4-1.0m), par (1-6), undo/redo buttons, Save/Cancel
- Bottom: unified tabbed panel (Build | Obstacles | Chain)

**Desktop:**
- Top bar: same as mobile
- Left panel: segment palette (collapsible categories) + chain list + obstacle palette (tabbed)
- Center: R3F canvas
- No right panel — selected items show inline floating popover

### Segment Palette

**Mobile:** Three category buttons at the bottom: Straight | Curve | Complex. Tap a category to expand upward showing 2-4 segment types with icons. Tap a type to select, palette collapses.

**Desktop:** Same categories as collapsible sections in the left sidebar.

### Segment Placement Workflow

1. Tap/click segment type in palette
2. Ghost preview appears at the active open end (pulsing green dot)
3. Rotation:
   - Desktop: R key cycles valid orientations
   - Mobile: floating action button near the build point, tap to cycle 90 deg
4. Tap/click to confirm — segment snaps, chain extends
5. Camera auto-pans to keep the new open end visible

### Building Direction

Two open ends: tee (entry of first segment) and cup (exit of last). Tap/click either pulsing green dot to set it as the active build point. Most users build tee to cup, but building backward is equally supported.

### Editing the Chain

- **Replace-in-place:** tap/click any segment (on canvas or in chain list), then tap a new type in the palette. Segment swaps, chain recomputes from that point forward. On mobile, palette switches to replace mode with a banner: "Tap a type to replace."
- **Delete from end:** select the last (or first) segment, tap Delete button (mobile bottom sheet) or Delete key (desktop).
- **Undo/Redo:** Ctrl+Z / Ctrl+Shift+Z on desktop. Buttons in top bar on mobile. One segment operation per undo step.
- No insert-in-middle or drag-to-reorder in v1.

### Segment Chain List

- **Desktop:** numbered list in left panel. Click to select/highlight on canvas.
- **Mobile:** "Chain" tab in bottom panel. Tap to select. Shows total hole length.

### Obstacle Placement

- Switch to Obstacles tab (Build | **Obstacles** | Chain)
- 6 prefab types: windmill, ramp, tunnel, loop, bumper post, wall bank
- Tap/click prefab to select, tap/click on hole surface to place
- Constrained to XZ plane at felt height
- Select placed obstacle: rotation (90 deg snaps via button/R key), Delete
- Mobile: bottom sheet with actions. Desktop: floating popover.

### Ball Path Preview

Static dashed centerline always visible from tee to cup. Animated dot deferred to future phase.

### Saving

- Validates: connected chain, at least 2 segments, tee and cup present
- Stores to `holeTemplates` in Zustand (persisted to localStorage)
- Returns to main planner. New hole appears in "My Holes" section of Holes sidebar.
- Editing existing template: collision check warns if placed instances would overlap or go out of bounds.
- Delete template: confirmation dialog showing count of affected placed holes. Undoable.

### Additional Mobile Features

- "Fit to hole" button in top bar — zooms to show entire hole
- Auto-save draft on every segment change (survives accidental page close)
- "Discard changes?" confirmation on Cancel/back
- Fat-finger tolerance: generous tap hit areas on segments
- Landscape recommended with one-time prompt. Portrait fully supported.

### Touch Interaction Summary

| Action | Mobile | Desktop |
|--------|--------|---------|
| Place segment | Tap at open end | Click |
| Rotate ghost | Floating rotate button | R key |
| Select segment | Tap on canvas or Chain tab | Click |
| Delete segment | Bottom sheet Delete | Delete key |
| Zoom | Pinch | Scroll wheel |
| Pan | One-finger drag on empty area | Middle-click drag |
| Replace segment | Tap segment, tap new type | Click segment, click new type |
| Undo/Redo | Top bar buttons | Ctrl+Z / Ctrl+Shift+Z |

---

## 3. 3D Rendering & Geometry

### Segment Geometry Generation

Each segment spec defines a `generateGeometry(feltWidth)` function producing 3D meshes.

**Vertical layer stack (all segments):**
1. Felt surface — 0.02m thick, green material (or UV neon)
2. Bumpers — 0.08m tall, 0.05m thick, along both edges
3. Tee marker — yellow circle, only on first segment
4. Cup marker — black circle, only on last segment

**Straight segments:** box geometry. Width = feltWidth, length = spec length. Bumpers are two long boxes on each side.

**Curve segments:** ring sector (annular wedge). Inner radius = arcRadius - feltWidth/2, outer radius = arcRadius + feltWidth/2, sweep = arcSweep degrees. Bumpers follow inner and outer arcs. Minimum arc radius enforced: `arcRadius >= feltWidth`.

**Complex segments** (S-curve, U-turn, chicane): composed of 2-3 sub-arcs/straights internally, exposed as a single segment to the user.

### Connection Point Math

For each segment type, entry and exit points are pre-computed in local space:
- Straight: entry at (0, 0) direction 180 deg. Exit at (0, length) direction 0 deg.
- Curve 90 left: entry at (0, 0) direction 180 deg. Exit computed from arc center, radius, and sweep angle.
- Each spec defines these analytically.

### Chain Position Computation

Single forward pass from segment 0. No incremental accumulation — full recompute every time to avoid floating-point drift:

```
segment[0].position = (0, 0), rotation = 0 deg
for i in 1..n:
  prevExit = rotate(prev.spec.exitPoint, prev.rotation) + prev.position
  prevExitDir = prev.spec.exitPoint.angle + prev.rotation
  currEntryDir = segment[i].spec.entryPoint.angle + 180 deg
  segment[i].rotation = prevExitDir - currEntryDir
  currEntryLocal = rotate(segment[i].spec.entryPoint, segment[i].rotation)
  segment[i].position = prevExit - currEntryLocal
```

### Material System

Full reuse of existing materials:
- Planning mode: feltMaterial, bumperMaterial, teeMaterial, cupMaterial from `shared.ts`
- UV mode: emissive materials with `UV_EMISSIVE_INTENSITY` constant
- Material profile (budget/standard/semi-pro): PBR presets from `useMaterials.ts`
- No new materials needed

### Prefab Obstacle 3D Models

Obstacle geometry duplicated from existing hole components into standalone components in `ObstaclePrefabs.tsx`:
- Windmill: rotating blades + pillar (from HoleWindmill.tsx geometry)
- Ramp: wedge shape (from HoleRamp.tsx geometry)
- Tunnel: arch (from HoleTunnel.tsx geometry)
- Loop: curved ramp (from HoleLoop.tsx geometry)
- Bumper post: simple cylinder (0.05m radius, 0.1m height)
- Wall bank: angled wedge (0.3m x 0.1m x 0.08m)

Legacy hole components are NOT refactored — obstacle geometry is duplicated for v1. Tech debt note: deduplicate into shared utilities in a future phase.

### Rendering Contexts

| Context | Rendering | Interaction |
|---------|-----------|-------------|
| Builder | Individual segment meshes, selectable, connection dots visible | Full edit |
| Planner (top-down) | Segments rendered from template data, colored with number label | Drag, rotate, delete |
| Planner (3D) | Same segment rendering with full geometry | Visual only |

No mesh merging. Custom holes render from segment data directly, same as in the builder.

---

## 4. Store & Persistence

### New Store State

```typescript
// Template library (persisted)
holeTemplates: Record<string, HoleTemplate>;

// Builder state (ephemeral)
builderDraft: HoleTemplate | null;
builderMode: boolean;
editingTemplateId: string | null;
builderUndoStack: HoleTemplate[];
builderRedoStack: HoleTemplate[];
```

### New Store Actions

```typescript
// Builder lifecycle
enterBuilder(templateId?: string): void;
exitBuilder(): void;

// Template CRUD
saveTemplate(template: HoleTemplate): void;
deleteTemplate(id: string): void;
duplicateTemplate(id: string): void;

// Builder draft operations (auto-save draft, push to undo stack)
appendSegment(specId: SegmentSpecId, end: "tee" | "cup"): void;
replaceSegment(segmentId: string, newSpecId: SegmentSpecId): void;
removeLastSegment(end: "tee" | "cup"): void;
addObstacle(obstacle: Obstacle): void;
updateObstacle(id: string, updates: Partial<Obstacle>): void;
removeObstacle(id: string): void;
setDraftName(name: string): void;
setDraftPar(par: number): void;
setDraftFeltWidth(width: number): void;
setDraftColor(color: string): void;

// Builder undo
builderUndo(): void;
builderRedo(): void;
```

### Persistence

- `holeTemplates` added to the existing `partialize` for localStorage
- `builderDraft` persisted separately (survives accidental page close)
- `builderMode`, `editingTemplateId`, undo/redo stacks are ephemeral — not persisted
- Save format bumps to **v6** (v5 + holeTemplates)
- Builder has its own undo stack (simple `HoleTemplate[]` snapshot array), completely independent of the planner's zundo temporal store

### Migration (v5 -> v6)

- Add `holeTemplates: {}` (empty)
- No conversion of existing holes
- Existing holes keep `type` field, no `templateId`
- Zero risk to existing saves

### Template -> Hole Integration

```typescript
// When placing a custom hole on the hall floor:
addHole(templateId: string, position): void;
// Creates Hole with { templateId, type: "straight" (placeholder),
//   ...dimensions from computeTemplateBounds(template) }

// Bounding box for collision/placement:
computeTemplateBounds(template: HoleTemplate): { width: number; length: number };
```

### Cost Integration

- Custom hole cost = (segment count x base segment cost) + (obstacle costs per prefab type)
- New fields in CostSettingsModal: "Custom hole base cost per segment" (default EUR 100)
- Prefab obstacle costs: windmill EUR 300, ramp EUR 150, tunnel EUR 200, loop EUR 250, bumper post EUR 20, wall bank EUR 50
- Material tier multiplier applies on top, same as preset holes

---

## 5. Starter Templates

The 7 existing hole types become read-only starter templates generated at runtime from `HOLE_TYPES` constants. Not stored in `holeTemplates`.

### Approximate Conversions

| Preset | Segments | Obstacles |
|--------|----------|-----------|
| Straight | straight_3m | (none) |
| L-Shape | straight_1m, curve_90_left, straight_1m | (none) |
| Dogleg | straight_1.5m, curve_45_right, straight_1.5m | (none) |
| Ramp | straight_1m, straight_1m, straight_1m | 1x ramp at center |
| Loop | straight_1m, curve_90_left, curve_90_left, straight_1m | 1x loop at curve apex |
| Windmill | straight_1m, straight_1m, straight_1m | 1x windmill at center |
| Tunnel | straight_1m, straight_2m, straight_1m | 1x tunnel at center |

Dimensions are approximate starting points for customization, not exact replicas of preset bounding boxes.

### Builder UX

- "Start From Template" section in the builder shows 7 presets as cards with mini preview
- Tapping one loads it into the draft — fully editable
- Auto-named "Custom [PresetName]" (user can rename)
- Not directly placeable — user must save as a custom template first

### Backward Compatibility

- Existing saves with `type: "straight"` etc. continue working via legacy rendering
- No migration runs on old saves
- Both paths (legacy type + templateId) coexist indefinitely

---

## 6. File Structure

### New Files (~13)

```
src/types/template.ts                — HoleTemplate, Segment, Obstacle, SegmentSpec types
src/constants/segmentSpecs.ts        — SEGMENT_SPECS (11 types with geometry + connection points)
src/store/builderSlice.ts            — Builder state, actions, undo stack
src/utils/chainCompute.ts            — computeChainPositions(), computeTemplateBounds()
src/utils/segmentGeometry.ts         — generateSegmentGeometry() per spec type

src/components/builder/Builder.tsx          — Fullscreen root + mobile/desktop layout
src/components/builder/BuilderCanvas.tsx    — R3F canvas + ghost + connection dots + rotate button
src/components/builder/BuilderUI.tsx        — Top bar + bottom panel (mobile) combined
src/components/builder/SegmentPalette.tsx   — Categorized palette (3 categories)
src/components/builder/ObstaclePalette.tsx  — Prefab obstacle placement
src/components/builder/ChainList.tsx        — Segment chain overview

src/components/three/holes/TemplateHoleModel.tsx  — Renders custom hole in planner
src/components/three/holes/ObstaclePrefabs.tsx    — Standalone prefab obstacle meshes
```

### Files to Modify

```
src/types/hole.ts                    — Add optional templateId to Hole
src/store/store.ts                   — Integrate builderSlice, add holeTemplates to persistence, v6
src/components/ui/HoleLibrary.tsx    — "My Holes" section + "Build Hole" button
src/components/ui/DetailPanel.tsx    — Show template info for custom holes
src/components/three/holes/HoleModel.tsx  — Branch on templateId
src/components/ui/CostSettingsModal.tsx   — Custom hole cost settings
src/store/selectors.ts              — Cost selectors for template holes
src/App.tsx                         — Render Builder when builderMode is true
src/utils/floorPlanExport.ts        — Handle template holes in SVG export
src/utils/collision.ts              — Use computeTemplateBounds() for custom holes
```

### Untouched

- All 7 existing Hole*.tsx components (legacy rendering, no changes)
- Budget panel, financial settings, expense tracking
- Mobile layout components (builder has its own)
- UV effects, camera controls, flow path (work automatically)

### Lazy Loading

```typescript
const Builder = lazy(() => import("./components/builder/Builder"));
```

---

## 7. Implementation Phasing

### Phase 10A: Segment Builder Core (~8-10 tasks)

- Types + segment specs + chain computation
- Builder store slice with undo stack
- Segment geometry generation (prototype curves early to derisk)
- Builder UI: fullscreen layout, palette, chain list, top bar, bottom panel
- Builder canvas: segment rendering, ghost, connection dots, rotation
- Save/load templates
- Planner integration: place template holes, collision, rendering
- Save format v6 migration

### Phase 10B: Obstacles + Templates + Cost (~4-6 tasks)

- Prefab obstacle meshes (duplicated from legacy components)
- Obstacle palette + placement + editing
- Starter templates (7 presets as builder cards)
- Cost integration (per-segment + per-obstacle costs in budget)
- SVG export for template holes
- Integration test: full flow from build to place to render

---

## 8. Explicitly Out of Scope (v1)

- Branching topologies (split/merge/T-junction/crossover)
- Custom obstacles (box/cylinder primitives with numeric dimensions)
- Resize gizmos, alignment guides
- Animated ball path preview (dot traveling tee to cup)
- Insert-in-middle, drag-to-reorder segments
- Mesh merging optimization
- Template sharing/import/export
- Refactoring legacy hole components for shared geometry layer
- Converting existing placed preset holes to templates

---

## 9. Key Technical Risks

1. **Curve geometry** — ring sector generation in Three.js may have lighting/faceting artifacts. Prototype early. Fallback: ExtrudeGeometry with Shape path.
2. **Snap UX on mobile** — generous hit areas, visual indicators, and the chain list as alternative selection are critical. Budget significant time here.
3. **Floating-point drift** — mitigated by full chain recomputation (no incremental accumulation).
4. **Scope creep** — the builder is a second app inside the app. Resist adding gizmos, animation, or advanced editing in v1.

---

## 10. Review History

- Red Team Round 1 (Data Model): Found linear array can't represent branching, connection math underspecified. Fixed: deferred branching to v2, specified SEGMENT_SPECS with full geometry.
- Blue Team Round 1: Added ball path preview, replace-in-place, freeform mode consideration. Strengthened snap UX requirements.
- Red Team Round 2 (UI): Found bottom toolbar overcrowded, two-finger rotate conflict, no mobile affordance for replace. Fixed: categorized palette, floating rotate button, replace mode banner, unified bottom panel.
- Blue Team Round 2: Added fat-finger tolerance, fit-to-hole, auto-save drafts, landscape prompt.
- Red Team Round 3 (Rendering/Store/Templates): Found mesh merging premature, builder undo mixing with planner undo, 22 files over-scoped. Fixed: dropped mesh merging, separate undo stack, consolidated to ~13 files, deferred custom obstacles, sub-phased implementation.
- Blue Team Round 3: Validated sub-phasing, recommended prototype curves early, added integration test requirement.
