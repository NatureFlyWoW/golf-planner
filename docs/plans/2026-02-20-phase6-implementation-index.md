# Phase 6: Realistic 3D Hole Models — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace plain colored boxes with detailed procedural mini golf obstacle models for all 7 hole types.

**Architecture:** One shared module (`shared.ts`) exports constants, materials, and reusable sub-components (Bumper, Tee, Cup). A dispatcher (`HoleModel.tsx`) maps hole type to the correct model component. Each hole type has its own component file. `MiniGolfHole.tsx` keeps its interaction mesh (invisible) and selection outline, and renders `HoleModel` as a visual child. No data model, store, or persistence changes.

**Tech Stack:** React 19, @react-three/fiber, Three.js (BoxGeometry, CylinderGeometry, TorusGeometry, ExtrudeGeometry), TypeScript

**Design doc:** `docs/plans/2026-02-20-phase6-3d-models-design.md`

**Review amendments incorporated:**
- Single overlay mesh pattern (invisible interaction box + visible-on-state-change tinting)
- No base pad mesh (hall floor serves as base)
- Felt material uses `polygonOffset` to avoid Z-fighting
- Tunnel fully opaque (no transparency sorting issues)
- `modelHeight` constant per type for selection outline sizing

---

## Task Dependency Graph

```
Task 1 (shared.ts) ──────────┐
                              ├──→ Task 3 (HoleStraight)  ─┐
Task 2 (HoleModel +          ├──→ Task 4 (HoleRamp)       │
        MiniGolfHole          ├──→ Task 5 (HoleTunnel)     │
        integration)  ────────┤                             ├──→ Task 10 (Visual review
                              ├──→ Task 6 (HoleLShape)     │     + final commit)
                              ├──→ Task 7 (HoleDogleg)     │
                              ├──→ Task 8 (HoleLoop)       │
                              └──→ Task 9 (HoleWindmill)  ─┘
```

- **Tasks 1-2**: Sequential foundation
- **Tasks 3-9**: All 7 hole types — fully parallelizable after Task 2
- **Task 10**: Final visual review and cleanup

## Task Files

| Task | File | Description |
|------|------|-------------|
| 1-2 | [phase6-tasks-1-2.md](phase6-tasks-1-2.md) | Shared module + dispatcher + MiniGolfHole integration |
| 3-5 | [phase6-tasks-3-5.md](phase6-tasks-3-5.md) | Straight, Ramp, Tunnel (simple axis-aligned types) |
| 6-7 | [phase6-tasks-6-7.md](phase6-tasks-6-7.md) | L-Shape, Dogleg (angled geometry types) |
| 8-9 | [phase6-tasks-8-9.md](phase6-tasks-8-9.md) | Loop, Windmill (complex obstacle features) |
| 10 | [phase6-task-10.md](phase6-task-10.md) | Visual review, lint, test, final commit |
