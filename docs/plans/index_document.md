# Golf Planner - Design Document Index

**Date:** 2026-02-19
**Project:** Indoor mini golf hall layout planning tool
**Context:** Personal planning tool for a 200m² BORGA steel hall blacklight mini golf venue in Gramastetten, Austria.

## Documents

| File | Purpose | Read when... |
|---|---|---|
| [01-environment-setup.md](./01-environment-setup.md) | WSL2, Node.js, tooling installation | Setting up the dev environment |
| [02-tech-stack.md](./02-tech-stack.md) | Dependencies, package choices, rationale | Choosing or questioning a library |
| [03-architecture.md](./03-architecture.md) | App layout, state management, component tree, data flow | Building features or understanding structure |
| [04-data-models.md](./04-data-models.md) | TypeScript types for Hole, Budget, Store | Implementing store, types, or components that consume data |
| [05-visual-spec.md](./05-visual-spec.md) | What each 3D/UI element looks like, exact rendering rules | Building 3D components or UI |
| [06-phases.md](./06-phases.md) | Implementation phases with strict scope boundaries | Planning work or deciding what to build next |
| [07-project-config.md](./07-project-config.md) | CLAUDE.md content, directory structure, git workflow, conventions | Setting up the project or onboarding |

## Key Decisions (quick reference)

- **Personal tool**, not a product — hardcode BORGA specs, optimize for this group's workflow
- **Phased delivery** — Phase 1 is top-down desktop-only MVP, mobile comes in Phase 3
- **R3F + Zustand** — stress-tested across 3 rounds, held up against alternatives
- **Single store with partialize** — persist only layout data, exclude transient UI state
- **No CSG** — walls built as segments, doors/windows as colored planes on walls
- **PWA** — added in Phase 3 for mobile installability
- **Biome over ESLint+Prettier** — single tool, faster, less config
