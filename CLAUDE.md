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
- Persist only holes + holeOrder + budget + budgetConfig (partialize excludes ui state)
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

## Context Window Management
This project uses heavy subagent orchestration. Keep the parent conversation lean:
- Minimize verbose TaskUpdate messages; prefer brief status summaries
- When orchestrating 5+ subagent tasks, batch status updates rather than reporting each individually
- If context is growing large, proactively suggest compaction or session handoff before hitting limits

## Git Operations
- Always use SSH remotes (git@github.com:...) not HTTPS — HTTPS auth is not configured in this environment
- Before merging branches, run `git stash` or commit working changes first
- After subagent work, verify we're on the correct branch and no commits were lost before proceeding
- When merging long-lived feature branches, expect conflicts and resolve them inline

## Subagent / Task Agent Guidelines
- When dispatching domain-expert subagents, use Explore agent type to avoid MCP tool name conflicts
- Never check out a different branch from within a subagent — work on the current branch or create a new one
- Confirm the exact number of agents/tasks with the user before spawning them
- Keep subagent scopes small enough to complete within usage 

## Screenshots & Artifacts
When capturing screenshots or generating any file artifacts, always save them to a persistent project directory (e.g., `./docs/screenshots/` or `./artifacts/`). Never rely on transient/ephemeral storage. Confirm the file exists on disk after saving.

## Session Handoff Protocol
This project uses multi-session development. At the end of every session:
1. Commit and push all work (via SSH remote)
2. Write a brief handoff note to `docs/session-handoff.md` with: completed tasks, current branch, next steps, known issues
3. Reference the relevant implementation plan document and which tasks/phases remain