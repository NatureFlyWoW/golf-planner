# Phase 4: Polish Fixes + Budget Tracker — Design Document

**Date:** 2026-02-20
**Status:** Approved after 3-round dialectical review (Blue Team → Devil's Advocate → Blue Team)
**Depends on:** Phases 1-3 complete (all shipped and verified)

## Scope

Two parts in one session:

1. **Polish fixes** — 6 small items from Phase 3 verification
2. **Budget tracker** — Phase 4 feature: pre-populated budget with auto-calc course cost

---

## Part 1: Polish Fixes

Six items identified during Playwright visual verification of Phase 3.

### Fix 1: Favicon 404

**Problem:** Browsers request `/favicon.ico` on load, get 404. PWA has icon.svg + PNGs but no favicon link in HTML.

**Fix:** Add `<link rel="icon" type="image/svg+xml" href="/icon.svg">` to `index.html`. The SVG already exists in `public/icon.svg`. No asset generation needed. VitePWA config has no `includeAssets` — no conflict.

**Files:** `index.html`

### Fix 2: Sun Button No-Op (Mobile SunControls Overlay)

**Problem:** The Sun button in OverflowPopover has a TODO handler. Mobile users cannot access SunControls at all — the desktop `<SunControls>` component uses `hidden md:flex`.

**Fix:** Build a `MobileSunControls` fullscreen overlay component. NOT a visibility toggle — the arrow indicator doesn't need toggling (it's unobtrusive and only shows during daytime). Mobile users need the date/time picker.

**Component:** `MobileSunControls.tsx` — follows MobileDetailPanel pattern:
- Fullscreen overlay (`fixed inset-0 z-50 bg-white md:hidden`)
- Header: "Sun Position" + close button
- 3 preset buttons: Now, Summer noon, Winter noon
- Custom date/time picker (same as desktop SunControls)
- Triggered from OverflowPopover Sun button

**State change:** Lift `sunDate` from App.tsx `useState` to Zustand UI state so the mobile overlay can read/write it without prop drilling. Add `sunDate: Date | undefined` to UIState and `setSunDate` action.

**Files:** New `MobileSunControls.tsx`, modify `BottomToolbar.tsx` (Sun button handler), modify `store.ts` (sunDate state), modify `App.tsx` (remove local state, use store), modify `types/ui.ts` (add sunDate)

### Fix 3: Par Input Allows Invalid Values

**Problem:** Par `<input type="number" min={1} max={6}>` doesn't enforce limits programmatically. Typing "0" or "99" stores invalid values.

**Fix:** Add dual clamp in onChange: `Math.min(6, Math.max(1, Number(e.target.value)))`.

**Files:** `HoleDetail.tsx` (line 52), `MobileDetailPanel.tsx` (line 76) — both have the same bug.

### Fix 4: Backdrop Accessibility

**Problem:** Backdrop divs in OverflowPopover and HoleDrawer lack `role="presentation"`. Biome ignore comments are in place but screen readers see meaningless interactive elements.

**Fix:** Add `role="presentation"` to backdrop divs. Biome ignore comments remain (role="presentation" doesn't satisfy `useKeyWithClickEvents` rule).

**Files:** `BottomToolbar.tsx` (line 182), `HoleDrawer.tsx` (line 28)

### Fix 5: THREE.Clock Deprecation Warning

**Problem:** Console warning from R3F internals about THREE.Clock.

**Fix:** No action. Upstream issue, harmless, can't fix without patching R3F.

### Fix 6: Backdrop Styling Inconsistency

**Problem:** OverflowPopover backdrop is fully transparent (invisible click target). HoleDrawer backdrop has `bg-black/20` scrim. Inconsistent visual cue.

**Fix:** Add `bg-black/10` to OverflowPopover backdrop div for subtle but consistent dismiss affordance.

**Files:** `BottomToolbar.tsx` (line 182)

---

## Part 2: Budget Tracker (Phase 4)

### Overview

Budget sidebar tab (desktop) and fullscreen overlay (mobile) with 14 pre-populated categories from the feasibility study. Editable estimated/actual/notes per category. Course category shows auto-calculated hint based on placed hole count. Progress bars and totals with contingency.

### Data Model

**BudgetCategory** — existing type, unchanged:
```ts
type BudgetCategory = {
  id: string;
  name: string;
  estimated: number;
  actual: number;
  notes: string;
};
```

**BudgetConfig** — new:
```ts
type BudgetConfig = {
  costPerHole: number; // default: 2700
};
```

No `isAutoCalc` boolean. No `status` field. These were evaluated during review and rejected as YAGNI for a personal planning tool.

### Pre-Populated Categories (14)

| # | ID | Name | Default Estimated | Notes |
|---|-----|------|------------------|-------|
| 1 | hall | BORGA Hall | 108000 | |
| 2 | course | Mini golf course | 37800 (14 × €2,700) | Auto-calc hint shown |
| 3 | uv-lighting | UV lighting system | 5500 | |
| 4 | emergency-lighting | Emergency lighting | 2000 | |
| 5 | heat-pumps | Heat pumps (heating/cooling) | 10000 | |
| 6 | ventilation | Ventilation with heat recovery | 4500 | |
| 7 | electrical | Electrical installation | 12500 | |
| 8 | plumbing | Plumbing & WC facilities | 15000 | |
| 9 | wall-art | UV graffiti / wall art | 15000 | |
| 10 | finishing | Interior finishing & flooring | 10000 | |
| 11 | equipment | Sound, POS, furniture | 10000 | |
| 12 | fire-safety | Fire safety & emergency systems | 3500 | |
| 13 | permits | Permits, architect, fees | 9500 | |
| 14 | insurance | Insurance (annual) | 2200 | "Annual Betriebshaftpflicht — multiply by operating years for total" |

**Contingency:** 10% of subtotal, computed in component, not stored.

Mid-range estimates derived from feasibility study (docs/reference/feasibility.md).

### Auto-Calc: Course Category

The course category estimated field is a **normal editable input** (same as all 13 other categories). Below the input, helper text displays the auto-calculated suggestion:

> *Auto: 14 × €2,700 = €37,800*

- Updates live as holes are added/removed from the canvas
- User can type any value — the hint is informational, never coercive
- `costPerHole` from `budgetConfig` is editable (shown near the helper text)
- No mode switching, no `isAutoCalc` boolean, no "reset to auto" button

### Desktop UI: Sidebar Budget Tab

The existing sidebar placeholder ("Budget tracker — Phase 4") is replaced with a `BudgetPanel` component.

**Layout (256px wide sidebar):**

```
┌─────────────────────────┐
│ Holes │ Detail │ Budget  │  ← Tab bar (existing)
├─────────────────────────┤
│ Est €254,300            │  ← Sticky summary header
│ Act €0        ▼ €254k  │     Variance badge (green/red)
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ BORGA Hall          │ │  ← Vertical card (collapsed)
│ │ Est €108,000  Act €0│ │     Name line + inline inputs
│ │ ████████░░░░░░░░░░░ │ │     Thin progress bar
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ Mini golf course    │ │  ← Course card
│ │ Est €37,800   Act €0│ │
│ │ Auto: 14×€2,700     │ │     Helper text
│ │ ████████░░░░░░░░░░░ │ │
│ └─────────────────────┘ │
│ ┌─────────────────────┐ │
│ │ UV lighting system  │ │  ← More cards (scroll)
│ │ Est €5,500    Act €0│ │
│ │ ░░░░░░░░░░░░░░░░░░░ │ │
│ └─────────────────────┘ │
│         ...             │
├─────────────────────────┤
│ Contingency (10%) €25k  │  ← Sticky footer
│ Total         €279,300  │
└─────────────────────────┘
```

**Card behavior:**
- Collapsed: category name, est/act inputs (€ prefix outside input), thin progress bar
- Tap to expand: notes textarea appears below progress bar
- Expanded card scrolls into view if near bottom of list

**Progress bar colors:**
- Blue: 0-80% (actual/estimated)
- Amber: 80-100%
- Red: >100%

**Input styling:** € displayed as visual prefix label outside `<input>`. Plain number inputs, no currency formatting inside the input value. Summary/totals use `toLocaleString('de-AT')` for display.

### Mobile UI: Fullscreen Overlay

Triggered from overflow popover "Budget" button (new button in OverflowPopover).

```
┌────────────────────────────────┐
│ Budget                      ✕  │  ← Header + close
├────────────────────────────────┤
│                                │
│   Est €254,300                 │  ← Summary section
│   Act €0                       │     Large numbers
│   ▼ €254,300 under budget     │     Variance badge
│                                │
├────────────────────────────────┤
│ ┌────────────────────────────┐ │
│ │ BORGA Hall                 │ │  ← Card (wider on mobile)
│ │ Est € [108000]  Act € [0] │ │
│ │ ██████████░░░░░░░░░░░░░░░ │ │
│ └────────────────────────────┘ │
│ ┌────────────────────────────┐ │
│ │ Mini golf course           │ │
│ │ Est € [37800]   Act € [0] │ │
│ │ Auto: 14 × €2,700         │ │
│ │ ██████████░░░░░░░░░░░░░░░ │ │
│ └────────────────────────────┘ │
│         ...                    │
├────────────────────────────────┤
│ Contingency (10%)    €25,430   │  ← Sticky footer
│ Grand Total          €279,730  │
└────────────────────────────────┘
```

Same interaction as desktop: tap card to expand for notes editing.

### Store Changes

**New state:**
```ts
budgetConfig: BudgetConfig; // { costPerHole: 2700 }
```

**New actions:**
```ts
initBudget: () => void;          // Write 14 full BudgetCategory objects via set()
setBudgetConfig: (updates: Partial<BudgetConfig>) => void;
```

**Critical implementation note:** `initBudget()` must write complete `BudgetCategory` objects directly via `set()`, NOT via `updateBudget()`. The existing `updateBudget` spreads `state.budget[id]` which is `undefined` for new IDs, producing incomplete objects.

**Persistence:** Add `budgetConfig` to persist middleware `partialize`:
```ts
partialize: (state) => ({
  holes: state.holes,
  holeOrder: state.holeOrder,
  budget: state.budget,        // existing
  budgetConfig: state.budgetConfig, // new
}),
```

**Temporal (undo/redo):** Already excludes budget — temporal `partialize` only tracks `holes`, `holeOrder`, `selectedId`. No change needed.

**Auto-initialization:** On app mount, if `Object.keys(budget).length === 0`, call `initBudget()`. Users with existing budget data skip this.

### JSON Export

Add `budgetConfig` to `ExportData`:
```ts
type ExportData = {
  version: number;        // bump to 2
  exportedAt: string;
  hall: { width: number; length: number };
  holes: Hole[];
  budget: BudgetCategory[];   // existing
  budgetConfig: BudgetConfig; // new
};
```

### Computed Values (in components, not stored)

```ts
const subtotal = Object.values(budget).reduce((sum, c) => sum + c.estimated, 0);
const actualTotal = Object.values(budget).reduce((sum, c) => sum + c.actual, 0);
const contingency = subtotal * 0.10;
const grandTotal = subtotal + contingency;
const variance = grandTotal - actualTotal;
const courseAutoCalc = holeOrder.length * budgetConfig.costPerHole;
```

### Component Structure

**New components:**
- `src/components/ui/BudgetPanel.tsx` — shared card list + summary, used by both desktop and mobile
- `src/components/ui/MobileBudgetPanel.tsx` — fullscreen overlay wrapper
- `src/components/ui/MobileSunControls.tsx` — fullscreen sun controls overlay (Fix #2)

**Modified components:**
- `Sidebar.tsx` — replace budget placeholder with `<BudgetPanel />`
- `BottomToolbar.tsx` — add Budget button to OverflowPopover, wire Sun button
- `App.tsx` — remove sunDate local state, add MobileBudgetPanel + MobileSunControls

---

## Review History

1. **Blue Team Round 1 (polish):** Found par bug exists in desktop too, sun toggle needs new state, SVG favicon is simpler than ICO generation.
2. **Devil's Advocate (polish):** Identified sun toggle is solving wrong problem — mobile needs SunControls overlay, not visibility toggle. Par needs max clamp too. Favicon needs PWA conflict check.
3. **Blue Team Round 2 (polish):** Confirmed PWA no conflict, converged on corrected fix set.
4. **Blue Team Round 1 (budget):** Proposed status field, section dividers, LocationBar summary, complex auto-calc override. Identified sidebar width constraint.
5. **Devil's Advocate (budget):** Pruned all Blue Team additions as YAGNI. Simplified auto-calc to helper text. Found initBudget creation bug. Flagged insurance naming.
6. **Blue Team Round 2 (budget):** Confirmed convergence. No remaining issues. Design ready.

## Decisions Log

| Decision | Chosen | Rejected | Rationale |
|----------|--------|----------|-----------|
| Budget approach | Approach B (table + visual summary) | A (minimal), C (full dashboard) | Good balance of utility vs. complexity |
| Categories | 14 split categories | 9 original from feasibility | User requested finer granularity (HVAC, lighting, theming splits + insurance) |
| Auto-calc UX | Helper text hint | isAutoCalc boolean + mode switch + reset button | Simpler, no mode confusion, always-editable |
| Sun button fix | Mobile SunControls overlay | Visibility toggle | The actual gap: mobile can't access date/time picker |
| Status tracking | Notes field (freeform) | Dedicated status enum | YAGNI for single-user tool |
| Section dividers | None | 4 visual groups | Clutter at 14 items |
| LocationBar summary | None | Compact budget badge | Budget tab is sufficient |
| sunDate state | Lift to Zustand | Prop drilling | Cleaner mobile overlay access |
| Favicon format | SVG link tag | Generate .ico file | SVG exists, modern browsers support it, no IE requirement |
