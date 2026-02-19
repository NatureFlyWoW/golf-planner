# Phase 1 Implementation Plan — Index

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a desktop-only top-down mini golf hall layout planner where users can place, move, rotate, and delete hole blocks in the BORGA 10×20m hall, with auto-save and JSON export.

**Architecture:** Single-page React app with a left sidebar and R3F canvas. Zustand single store manages all state. Pointer events + raycasting handle hole placement on a floor plane. localStorage persistence via zustand/persist with partialize.

**Tech Stack:** React 19, TypeScript, Vite, @react-three/fiber, @react-three/drei, three, Zustand, Tailwind CSS, Biome, Vitest

---

## Plan Files

Read these in order. Each file is self-contained — an agent only needs to read the file for the tasks it's working on.

| File | Tasks | What it builds |
|---|---|---|
| [implementation-01-setup.md](./2026-02-19-phase1-01-setup.md) | 1–3 | Environment, scaffold, config, CLAUDE.md, reference docs, skill |
| [implementation-02-foundation.md](./2026-02-19-phase1-02-foundation.md) | 4–7 | Types, hall constants, hole type definitions, Zustand store |
| [implementation-03-3d-scene.md](./2026-02-19-phase1-03-3d-scene.md) | 8–11 | App layout shell, hall floor/walls/doors/windows, grid, camera |
| [implementation-04-interaction.md](./2026-02-19-phase1-04-interaction.md) | 12–17 | Hole library, placement, selection, drag, rotate, delete |
| [implementation-05-persistence.md](./2026-02-19-phase1-05-persistence.md) | 18–19 | Auto-save to localStorage, JSON export/import |

## Task Summary

1. Install fnm + Node 22 in WSL2
2. Scaffold Vite project + install dependencies
3. Configure Vite, Biome, Tailwind, tsconfig, CLAUDE.md, reference docs, skill file
4. Define shared TypeScript types
5. Create hall constants from BORGA specs
6. Create hole type definitions
7. Build Zustand store with all slices and actions
8. Build App layout shell (sidebar + canvas)
9. Render hall floor, walls, doors, and windows in 3D
10. Add grid overlay
11. Set up orthographic top-down camera with pan/zoom
12. Build hole library panel in sidebar
13. Implement click-to-place hole mechanics
14. Implement hole selection
15. Implement drag-to-reposition
16. Implement hole rotation
17. Implement hole deletion
18. Add auto-save with zustand/persist + partialize
19. Add JSON export button

## Definition of Done

Open the app in a browser, see the BORGA hall from top-down, place holes from the library, move and rotate them, delete unwanted ones. Close the tab, reopen — layout is preserved. Click export — download a JSON file of the layout.
