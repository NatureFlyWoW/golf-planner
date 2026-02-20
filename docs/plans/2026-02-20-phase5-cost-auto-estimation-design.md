# Phase 5: Cost Auto-Estimation — Design Document

**Date:** 2026-02-20
**Status:** Approved (after DA → Blue Team → DA Round 2)

## Goal

Tie the layout canvas directly to the budget so that placing holes is simultaneously a financial planning act. The "Mini golf course" budget category auto-calculates from placed holes using per-type costs. Other categories show static reference hints from the feasibility study.

## Core Decisions

1. **Auto-calculate course category only** — not UV/Electrical/Sound
2. **Per-hole-type costs** — each of the 7 hole types has its own cost
3. **Grouped-by-type summary** — not a per-hole table
4. **Settings modal** for editing per-type costs (not inline)
5. **"Lock" icon** on course card to pin a manual estimate
6. **Static dashboard hints** on UV/Electrical/Sound categories (feasibility study ranges, not computed)
7. **Computed on render** — course estimate is a derived selector, not stored state

## Data Model

### BudgetConfig (revised)

```typescript
// constants/budget.ts
export const COURSE_CATEGORY_ID = "mini-golf-course";
export const DEFAULT_HOLE_COST = 2700;

// types/budget.ts
type BudgetConfig = {
  costPerType: Record<string, number>; // HoleType key → euro cost
};
```

The legacy `costPerHole` field is removed. Migration from v2: use `costPerHole` to populate `costPerType` uniformly, then discard it. `costPerType` is keyed by `string` (not `HoleType`) to handle future hole types without type changes.

### BudgetCategory (revised)

```typescript
type BudgetCategory = {
  id: string;
  name: string;
  estimated: number;
  actual: number;
  notes: string;
  manualOverride?: boolean; // only meaningful for course category
};
```

No `autoLink` field — the course category is identified by `COURSE_CATEGORY_ID` constant. YAGNI: only one category is auto-linked, so a discriminated union type adds no value.

### Per-Type Cost Defaults

| Type     | Cost    | Rationale                            |
|----------|---------|--------------------------------------|
| Straight | €2,000  | Simplest, prefab lane                |
| L-Shape  | €2,500  | One bend, moderate complexity        |
| Dogleg   | €2,800  | Larger footprint, two direction changes |
| Ramp     | €3,000  | Elevation change, structural         |
| Loop     | €3,200  | Curved track, more material          |
| Windmill | €3,500  | Moving parts, mechanism              |
| Tunnel   | €2,800  | Enclosed section, moderate           |

These are planning estimates, not sourced per-type from the feasibility study. Labeled as such in the UI.

## Course Cost Selector

```typescript
const selectCourseCost = (state) => {
  const cat = state.budget[COURSE_CATEGORY_ID];
  if (cat?.manualOverride) return cat.estimated;
  return state.holeOrder.reduce(
    (sum, id) =>
      sum + (state.budgetConfig.costPerType[state.holes[id].type] ?? DEFAULT_HOLE_COST),
    0,
  );
};
```

- Computed on render, not stored in state
- Falls back to `DEFAULT_HOLE_COST` (€2,700) for unknown hole types
- When `manualOverride` is true, returns the stored `estimated` value
- Undo/redo of hole add/remove automatically recalculates

## UI Changes

### Course Cost Breakdown (collapsible section in Budget panel)

Appears at the top of the Budget panel, before category cards. Hidden when no holes are placed (show placeholder: "Place holes to see course cost estimate").

```
▼ Course Cost Breakdown                              ⚙
  3× Straight    @ €2,000 = €6,000
  2× Windmill    @ €3,500 = €7,000
  1× L-Shape     @ €2,500 = €2,500
  ─────────────────────────────────
  Course total: €15,500 (6 holes)

  ℹ Planning estimates — replace with real quotes when available
```

- Grouped by type, sorted by count descending
- Gear icon (⚙) opens per-type cost settings modal
- Info note at bottom clarifying these are estimates

### Course Category Card

- Shows computed estimate when unlocked, stored estimate when locked
- Lock/unlock icon (🔒/🔓) to toggle `manualOverride`
- When locked: "Pinned estimate" label, estimated field is editable
- When unlocked: "Auto-calculated" label, estimated field is read-only (shows computed value)

### Dashboard Hints on Other Categories

Three categories get static hint text (not computed):

| Category | Hint text |
|----------|-----------|
| UV lighting system | "Industry mid-range: €5,500–€9,000 for 12–18 holes" |
| Electrical installation | "Industry mid-range: €10,000–€15,000 for 12–18 holes" |
| Sound, POS, furniture | "Industry mid-range: €10,000–€15,000 for indoor mini golf" |

Hints sourced from feasibility study ranges. Displayed as small italic text below the category name. Static — no per-hole computation.

### Per-Type Cost Settings Modal

Opened via gear icon in breakdown section header. Also accessible on mobile.

```
┌─ Per-Type Hole Costs ──────────────────────┐
│                                             │
│  Straight     [€ 2,000]                     │
│  L-Shape      [€ 2,500]                     │
│  Dogleg       [€ 2,800]                     │
│  Ramp         [€ 3,000]                     │
│  Loop         [€ 3,200]                     │
│  Windmill     [€ 3,500]                     │
│  Tunnel       [€ 2,800]                     │
│                                             │
│  ℹ Course estimate is pinned.               │
│    Changes apply when you unlock it.        │
│                                             │
│               [Reset Defaults]    [Close]   │
└─────────────────────────────────────────────┘
```

- 7 inline-editable cost fields
- "Reset Defaults" button restores original per-type costs
- Conditional note when course is locked (manualOverride=true)
- On mobile: same modal, full-width

### Mobile

- Breakdown section appears in MobileBudgetPanel overlay (same as desktop)
- Gear icon opens settings modal as fullscreen overlay
- Lock icon on course card same behavior

## Reactivity

- Course estimate: **computed on render** via `selectCourseCost` selector
- `costPerType` changes: **not undo-tracked** (configuration, not layout)
- `manualOverride` toggle: **not undo-tracked** (configuration)
- Hole add/remove: **undo-tracked** (already in place) → course auto-recalculates on undo
- Budget `actual` and `notes` edits: **not undo-tracked** (same as Phase 4)

## Persistence & Export

### localStorage

- `budgetConfig` already persisted — now contains `costPerType` instead of `costPerHole`
- `manualOverride` persisted as part of each `BudgetCategory` in the `budget` record

### Export JSON (v3)

```json
{
  "version": 3,
  "hall": { ... },
  "holes": { ... },
  "holeOrder": [ ... ],
  "budget": {
    "mini-golf-course": {
      "id": "mini-golf-course",
      "name": "Mini golf course",
      "estimated": 15500,
      "actual": 0,
      "notes": "",
      "manualOverride": false
    },
    ...
  },
  "budgetConfig": {
    "costPerType": {
      "straight": 2000,
      "l-shape": 2500,
      "dogleg": 2800,
      "ramp": 3000,
      "loop": 3200,
      "windmill": 3500,
      "tunnel": 2800
    }
  }
}
```

- Course `estimated` in export stores the **computed** value (meaningful to any reader)
- On import: if `manualOverride` is false, re-compute from holes; if true, use stored value

### Migration

- **v2 → v3:** Add default `costPerType` (derived from old `costPerHole` if present, otherwise use defaults). Set course category `manualOverride = true` to preserve existing manually-entered estimates. Remove `costPerHole` from budgetConfig.
- **v3 → v2 (downgrade):** Not supported. Older app versions ignore unknown fields; stored `estimated` values remain usable.

## Testing Strategy

- **Unit:** `selectCourseCost` selector — various hole combinations, empty layout, single type, mixed types
- **Unit:** Fallback to `DEFAULT_HOLE_COST` for unknown hole type
- **Unit:** `manualOverride` returns stored value instead of computed
- **Unit:** v2 → v3 migration logic
- **Integration:** BudgetPanel renders grouped-by-type summary correctly
- **Integration:** Lock/unlock toggle switches between computed and stored
- **Integration:** Settings modal updates `costPerType` and course recalculates
- **Integration:** Dashboard hints render on correct categories
- **Integration:** Empty state (no holes) hides breakdown section

## What This Doesn't Include

- Auto-linking UV/Electrical/Sound categories (replaced with static hints)
- Per-hole breakdown table (replaced with grouped-by-type summary)
- Formula editing UI for non-course categories
- `AutoLinkFormula` type or `autoLinkedCategories` map
- `costPerHole` field (migrated away)

These can be added in future phases if the simpler version proves insufficient.
