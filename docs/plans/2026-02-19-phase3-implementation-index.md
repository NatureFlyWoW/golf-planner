# Phase 3: Mobile + PWA — Implementation Plan Index

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the golf planner fully usable on mobile phones with touch interaction, and installable as a PWA.

**Architecture:** Responsive breakpoint at `md: 768px`. Below = mobile layout with bottom toolbar and overlay panels. Above = current desktop layout unchanged. Single codebase, `isMobile` hint for performance tuning only. PWA via vite-plugin-pwa.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (responsive utilities), R3F, Zustand, vite-plugin-pwa

**Design Doc:** `docs/plans/2026-02-19-phase3-mobile-pwa-design.md`

---

## Task Groups (16 tasks)

| File | Tasks | Description |
|------|-------|-------------|
| [`phase3-tasks-01-foundation.md`](./2026-02-19-phase3-tasks-01-foundation.md) | 1–3 | UIState type + store, isMobile utility, CSS/HTML meta fixes |
| [`phase3-tasks-02-layout-toolbar.md`](./2026-02-19-phase3-tasks-02-layout-toolbar.md) | 4–6 | Responsive visibility classes, BottomToolbar component, overflow popover |
| [`phase3-tasks-03-panels.md`](./2026-02-19-phase3-tasks-03-panels.md) | 7–9 | HoleDrawer (bottom drawer), MobileDetailPanel (overlay), panel wiring + info chip |
| [`phase3-tasks-04-touch.md`](./2026-02-19-phase3-tasks-04-touch.md) | 10–13 | OrbitControls TOUCH.PAN, drag deadzone, mobile ghost preview, RotationHandle enlargement |
| [`phase3-tasks-05-performance-pwa.md`](./2026-02-19-phase3-tasks-05-performance-pwa.md) | 14–16 | Performance tuning, PWA setup, final verification |

## Dependencies

```
Tasks 1-3 (foundation) → no dependencies, do first
Tasks 4-6 (layout) → depends on Task 1 (activePanel type)
Tasks 7-9 (panels) → depends on Tasks 4-6 (BottomToolbar, responsive shell)
Tasks 10-13 (touch) → depends on Task 2 (isMobile utility)
Tasks 14-16 (PWA) → depends on Task 2 (isMobile utility)
```

Tasks 10-13 and 14-16 can run in parallel after foundation is done.

## Key Files Modified

| File | Tasks |
|------|-------|
| `src/types/ui.ts` | 1 |
| `src/store/store.ts` | 1 |
| `src/App.tsx` | 4, 9, 14 |
| `src/index.css` | 3 |
| `index.html` | 3 |
| `vite.config.ts` | 15 |
| `src/components/ui/Sidebar.tsx` | 4 |
| `src/components/ui/Toolbar.tsx` | 4 |
| `src/components/three/CameraControls.tsx` | 10 |
| `src/components/three/MiniGolfHole.tsx` | 11 |
| `src/components/three/PlacementHandler.tsx` | 12 |
| `src/components/three/RotationHandle.tsx` | 13, 14 |

## New Files Created

| File | Task |
|------|------|
| `src/utils/isMobile.ts` | 2 |
| `src/components/ui/BottomToolbar.tsx` | 5, 6 |
| `src/components/ui/HoleDrawer.tsx` | 7 |
| `src/components/ui/MobileDetailPanel.tsx` | 8 |
| `tests/utils/isMobile.test.ts` | 2 |
| `tests/store/activePanel.test.ts` | 1 |
| `public/icon-192.png` | 15 |
| `public/icon-512.png` | 15 |

## Environment

```bash
# Every shell needs this first
export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"

# Key commands
npm run dev          # start dev server
npm run build        # tsc + vite build
npm run check        # biome lint + format check
npm run format       # biome format --write
npm run test         # vitest
```

## Test Convention

Tests live in `tests/` (not `src/`). Pattern: `tests/{category}/{name}.test.ts`. Import from `../../src/...`. Use vitest (`describe`, `it`, `expect`, `beforeEach`). Store tests reset state in `beforeEach`.
