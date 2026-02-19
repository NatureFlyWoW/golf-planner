# 02 - Tech Stack

## Core Dependencies

| Package | Version | Purpose | Rationale |
|---|---|---|---|
| `react` + `react-dom` | 19.x | UI framework | Industry standard, R3F requires it |
| `typescript` | 5.x | Type safety | Catches errors at dev time, better DX |
| `vite` | 6.x | Dev server + bundler | Fast HMR, zero-config for React+TS, static build for Vercel |
| `@react-three/fiber` | 9.x | React renderer for Three.js | Declarative 3D in React components. App is 60% UI / 40% viewport — React owns the UI story. Vanilla Three.js would force manual DOM↔canvas bridging. |
| `@react-three/drei` | 9.x | R3F utilities | OrthographicCamera, OrbitControls, Grid, Html overlays. NOT using DragControls (custom pointer events instead). |
| `three` | 0.170+ | 3D engine | Underlying WebGL renderer |
| `zustand` | 5.x | State management | 1KB, less boilerplate than Context+useReducer, works outside React (Three.js callbacks), undo/redo via zundo later |
| `tailwindcss` | 4.x | CSS utility classes | Fast UI prototyping for panels, toolbar, budget table |

## Dev Dependencies

| Package | Purpose | Rationale |
|---|---|---|
| `@types/three` | Three.js type definitions | TypeScript support for Three.js |
| `@biomejs/biome` | Lint + format | Replaces ESLint+Prettier. Single tool, 100x faster, default rules. |
| `vitest` | Unit testing | Zero-config with Vite. For placement math only (collision, snap, bounds). |

## Deferred Dependencies (add when needed)

| Package | When | Purpose |
|---|---|---|
| `zundo` | Phase 2 (undo/redo) | Zustand undo middleware, <700 bytes |
| `three-bvh-csg` | If visual fidelity demands it | Boolean wall cutouts for doors/windows |
| `vite-plugin-pwa` | Phase 3 (mobile) | PWA installability + offline support |
| `jspdf` | If PDF export needed | Floor plan PDF generation |

## Decisions Stress-Tested

### R3F vs Vanilla Three.js
**Challenged:** "Just use Three.js, less abstraction." **Verdict:** App is UI-heavy (sidebar, toolbar, budget, hole library). R3F integrates DOM and canvas naturally. Vanilla would require manual bridging — that's where complexity lives.

### Zustand vs React Context
**Challenged:** "Don't need a library for this." **Verdict:** Zustand has less boilerplate than Context+useReducer, works in Three.js callbacks (outside React tree), and zundo gives free undo/redo later.

### drei DragControls vs Custom Pointer Events
**Challenged during design.** DragControls does free-form 3D dragging — wrong for grid-snapped 2D floor placement. Custom pointer events + raycasting + snap math is simpler and more controllable.

### Tailwind vs CSS Modules
**Challenged:** "Most of the screen is canvas." **Verdict:** Enough UI to justify Tailwind (toolbar, sidebar tabs, budget table, hole library). Faster for rapid prototyping.

### Biome vs ESLint + Prettier
**Not challenged — clear win.** Single binary, 100x faster, sensible defaults, less config.

### Path Aliases (@/ → src/)
**Removed.** Deepest import is ~2 levels. Aliases add Vite+TS config overhead for no benefit at this scale.
