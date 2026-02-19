# 07 - Project Configuration

## CLAUDE.md (place in project root)

```markdown
# Golf Planner - Indoor Mini Golf Hall Layout Tool

## Project Overview
Personal planning tool for a 200m² BORGA steel hall blacklight mini golf
venue in Gramastetten, Austria. 3D configurator for hole layout planning,
player flow visualization, and budget tracking.

## Tech Stack
- React 19 + TypeScript + Vite (WSL2 polling enabled)
- @react-three/fiber + @react-three/drei (3D viewport)
- Zustand (single store with slices, partialize for persistence)
- Tailwind CSS (UI panels/toolbar)
- Biome (lint + format, default rules)
- Vitest (unit tests for placement math only)

## Deployment
Static PWA on Vercel (Phase 3+). No server/API — everything client-side + localStorage.
Responsive: mobile-first considered, desktop sidebar at ≥768px.

## BORGA Hall Specs (summary — canonical source: src/constants/hall.ts)
10.00m × 20.00m, wall height 4.30m, first 4.90m, roof pitch 7°.
See docs/reference/ for full offer and feasibility study.

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npm run check` — biome lint + format check
- `npm run format` — biome format --write
- `npm run test` — vitest

## Architecture
- Single Zustand store: hall, holes, holeOrder, budget, ui slices
- Persist only holes + holeOrder + budget (partialize excludes ui state)
- 3D: top-down default view, isometric toggle (Phase 2)
- Placement: pointer events + raycasting + grid snap + AABB collision
- Player flow: numbered path connecting holes in sequence
- UI: single left sidebar (Holes/Detail/Budget tabs) + top toolbar
- Mobile: fullscreen canvas + bottom toolbar + overlay panels

## Conventions
- Functional components, named exports
- Types used in 1 file: inline. Shared across 2+ files: src/types/
- Zustand selectors: useStore(s => s.field) to minimize re-renders
- Relative imports (no path aliases)
- 3D components: src/components/three/
- UI components: src/components/ui/
- Placement math utilities: src/utils/ (with unit tests)

## Git
- Main branch only, no feature branches
- Conventional commits: feat:, fix:, refactor:, docs:
- Commit after each completed feature

## Design Docs
- docs/plans/index_document.md — design doc index
- docs/reference/ — BORGA offer + feasibility study
```

## Directory Structure

```
golf-planner/
├── CLAUDE.md
├── .claude/
│   └── skills/
│       └── devils-advocate.md      ← user's custom skill
├── docs/
│   ├── plans/                      ← design documents (this folder)
│   │   ├── index_document.md
│   │   ├── 01-environment-setup.md
│   │   ├── 02-tech-stack.md
│   │   ├── 03-architecture.md
│   │   ├── 04-data-models.md
│   │   ├── 05-visual-spec.md
│   │   ├── 06-phases.md
│   │   └── 07-project-config.md
│   └── reference/
│       ├── offer.md                ← BORGA hall offer
│       └── feasibility.md          ← project feasibility study
├── src/
│   ├── components/
│   │   ├── three/                  ← Hall, Holes, Grid, FlowPath, GhostHole, Camera
│   │   └── ui/                     ← Sidebar, Toolbar, HoleLibrary, Inspector, BudgetTable
│   ├── store/                      ← Zustand store definition + slices
│   ├── constants/                  ← hall.ts, holeTypes.ts
│   ├── types/                      ← shared TypeScript types (Hole, Budget, Store)
│   ├── utils/                      ← snapToGrid, isColliding, isInsideHall
│   └── App.tsx                     ← root layout (responsive)
├── tests/
│   └── utils/                      ← unit tests for placement math
├── public/
├── biome.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
└── package.json
```

## Key Config Files

### vite.config.ts
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
})
```

### biome.json
Use defaults (`npx @biomejs/biome init`). No custom overrides needed.

### package.json scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "check": "biome check .",
    "format": "biome format --write .",
    "test": "vitest"
  }
}
```

## Git Configuration

### .gitignore
Standard Vite template `.gitignore` plus:
```
# Local env
.env.local
.env.*.local

# Editor
.vscode/
!.vscode/extensions.json
```

### Initial commit structure
1. `feat: scaffold project with Vite + React + TypeScript`
2. `feat: add R3F, Zustand, Tailwind, Biome dependencies`
3. `docs: add design documents and reference files`
