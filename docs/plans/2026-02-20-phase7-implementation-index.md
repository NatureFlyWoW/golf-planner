# Phase 7: UV/Blacklight Theme — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a toggle between Planning mode (bright) and UV Preview mode (dark canvas + toolbar with neon emissive materials).

**Architecture:** Add `uvMode: boolean` to Zustand UI state. Create parallel UV material singletons in `shared.ts` and a `useMaterials()` hook. Each 3D component reads the hook or `uvMode` directly to swap colors. Toolbar gets conditional Tailwind dark classes.

**Tech Stack:** React 19, TypeScript, @react-three/fiber, Zustand, Tailwind CSS, Biome (tabs)

**Design doc:** `docs/plans/2026-02-20-phase7-uv-theme-design.md`

---

## Task Overview

| # | Task | File(s) | Depends on |
|---|------|---------|------------|
| 1 | [State + store](./phase7-task-1.md) | `types/ui.ts`, `store/store.ts` | — |
| 2 | [UV materials + useMaterials hook](./phase7-task-2.md) | `holes/shared.ts`, `holes/useMaterials.ts` | Task 1 |
| 3 | [Hole components — shared material users](./phase7-task-3.md) | `HoleStraight`, `HoleLShape`, `HoleDogleg` | Task 2 |
| 4 | [Hole components — accent material users](./phase7-task-4.md) | `HoleRamp`, `HoleLoop`, `HoleWindmill`, `HoleTunnel` | Task 2 |
| 5 | [Hall + canvas elements](./phase7-task-5.md) | `HallFloor`, `HallWalls`, `HallOpenings`, `FloorGrid`, `FlowPath`, `GhostHole`, `SunIndicator` | Task 1 |
| 6 | [Lighting](./phase7-task-6.md) | `App.tsx` | Task 1 |
| 7 | [Toolbar UI](./phase7-task-7.md) | `Toolbar.tsx`, `BottomToolbar.tsx` | Task 1 |
| 8 | [Lint, test, build, visual review](./phase7-task-8.md) | — | Tasks 3-7 |

## Parallelization

```
Task 1 (state) → Task 2 (materials)
                         ↓
            ┌────────────┼────────────┐
            ↓            ↓            ↓
         Task 3       Task 4       Task 5 ← also depends on Task 1 only
       (shared-mat)  (accent-mat)  (hall+canvas)
            ↓            ↓            ↓
            └────────────┼────────────┘
                         ↓
              Task 6 (lighting) ← depends on Task 1 only
              Task 7 (toolbar)  ← depends on Task 1 only
              (Tasks 5, 6, 7 can all run parallel with 3+4)
                         ↓
                    Task 8 (review)
```

**Maximum parallelism after Task 2:** Tasks 3, 4, 5, 6, 7 all run concurrently.
