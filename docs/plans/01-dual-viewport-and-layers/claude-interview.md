# Interview Transcript — 01 Dual Viewport & Layer System

## Q1: Collapse-to-single-pane camera behavior
**Q:** When you collapse to single-pane mode (e.g. expand 2D to fullscreen), should it remember the 3D camera position when you re-expand? Or reset to default isometric?

**A:** Remember camera state. Re-expanding restores exactly where you left off in the collapsed pane.

## Q2: Layer panel location
**Q:** For the layer panel UI, where should it live? The sidebar already has 3 tabs (Holes, Detail, Budget).

**A:** New sidebar tab. 4th tab "Layers" in the existing sidebar — consistent with current pattern.

## Q3: Layer persistence
**Q:** Should layer preferences (which layers are visible, their opacity) persist across page refreshes, or reset to defaults each time?

**A:** Up to you — whatever makes more sense architecturally.

**Claude's decision:** Ephemeral (reset on refresh) to match the existing pattern where UI toggles (showFlowPath, snapEnabled, uvMode) all reset. This is simpler and avoids needing a save format migration. Power users will be able to quickly toggle layers on startup.

## Q4: Camera presets UI
**Q:** The spec mentions camera presets (Top, Front, Back, Left, Right, Isometric). Should these appear as buttons in the 3D pane header, or in the toolbar, or accessible via keyboard shortcuts?

**A:** 3D pane corner buttons. Small preset buttons overlaid on the 3D viewport corner — like a 3D modeling app.

## Q5: 3D pane editability
**Q:** When dragging a hole in the 2D pane, should it also be possible to drag holes in the 3D pane?

**A:** Both panes editable. Allow selecting and moving holes in 3D too.

## Q6: Default split ratio
**Q:** For the default split ratio, what feels right? And should there be a min-width so neither pane becomes unusably narrow?

**A:** 50/50 default, min 20% each pane before snapping to collapse.

## Q7: PostProcessing effects scope
**Q:** With dual viewports, should PostProcessing effects apply to both panes or only the 3D pane?

**A:** 3D pane only. 2D pane stays clean/crisp for precision editing. Effects only in 3D for visual fidelity.

## Q8: 3D pane click/drag conflict resolution
**Q:** Since both panes are editable and 3D orbit uses left-click drag, how should we handle the click conflict in 3D?

**A:** Smart context: Click = select, Drag on hole = move, Drag on empty space = orbit. Like Blender's approach — context-aware interaction.

## Summary of Key Decisions

| Decision | Choice |
|----------|--------|
| Collapse behavior | Remember camera state on re-expand |
| Layer panel | New sidebar tab (4th tab "Layers") |
| Layer persistence | Ephemeral (reset on refresh) |
| Camera presets | 3D pane corner overlay buttons |
| 3D editability | Both panes editable |
| Split ratio | 50/50 default, 20% minimum, snap-to-collapse |
| PostProcessing | 3D pane only |
| 3D interaction | Context-aware: click/drag-hole = select/move, drag-empty = orbit |
