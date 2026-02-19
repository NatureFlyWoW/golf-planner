# Phase 2: Polish — Implementation Plan Index

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add placement precision (grid snap, collision detection, ghost preview, free rotation), visualization (player flow path, 3D camera toggle), and workflow tools (undo/redo, named saves, new hole types) to the golf planner.

**Architecture:** Three implementation groups that build on each other. Group A adds placement utils and wires them into existing components. Group B adds visual feedback components. Group C adds temporal middleware for undo/redo and a save manager.

**Tech Stack:** React 19, TypeScript, Vite, @react-three/fiber, @react-three/drei, three, Zustand, zundo (new), Tailwind CSS, Biome, Vitest

**Design doc:** `docs/plans/2026-02-19-phase2-polish-design.md`

---

## Plan Files

Read these in order. Each file is self-contained — an agent only needs to read the file for the tasks it's working on.

| File | Tasks | What it builds |
|---|---|---|
| [phase2-01-placement-precision.md](./2026-02-19-phase2-01-placement-precision.md) | 1–9 | Snap util, OBB collision, rotation type, new holes, ghost preview, rotation handle, toolbar toggles |
| [phase2-02-visualization.md](./2026-02-19-phase2-02-visualization.md) | 10–12 | Player flow path, 3D camera toggle, scene wiring |
| [phase2-03-workflow.md](./2026-02-19-phase2-03-workflow.md) | 13–17 | Undo/redo (zundo), named saves, integration |

## Task Summary

**Group A: Placement Precision**
1. Create `snapToGrid` utility + tests
2. Create SAT-based OBB collision utility + tests
3. Change rotation type to free-angle `number`
4. Add 3 new hole types (loop, windmill, tunnel)
5. Create GhostHole preview component
6. Wire PlacementHandler with ghost + snap + collision
7. Wire MiniGolfHole drag with snap + collision
8. Create RotationHandle drag component
9. Add toolbar toggles (snap, flow path, view) + `G` keyboard shortcut

**Group B: Visualization**
10. Create FlowPath component (dashed lines + numbered labels)
11. Implement dual camera system (3D toggle + perspective orbit)
12. Wire new components into scene (FlowPath, RotationHandle, canvas config)

**Group C: Workflow**
13. Install zundo + add temporal middleware to store
14. Add undo/redo toolbar buttons + keyboard shortcuts
15. Add drag coalescing (temporal pause/resume)
16. Create save manager utility + tests
17. Create SaveManager UI component

## Environment Setup

Every Bash command needs fnm sourced:
```bash
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"
```

Working directory: `golf-planner/` (the Vite project root with git repo)

Biome uses **tabs** for indentation. Run `npm run format` after editing if unsure.

## Definition of Done

Open the app, place holes with green/red ghost preview. Toggle grid snap (`G` key) and see 0.25m minor grid. Holes can't overlap (red ghost, drag blocked). Drag rotation handle for free-angle rotation with 15-degree snap. Toggle flow path to see numbered dashed lines. Switch to 3D view and orbit around the hall. `Ctrl+Z`/`Ctrl+Shift+Z` undo/redo. Save/load named layouts. 3 new hole types in the sidebar library.
