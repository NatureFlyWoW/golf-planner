# Phase 4 Implementation Plan — Index

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 5 polish items from Phase 3 verification, then build a budget tracker with 14 pre-populated categories, auto-calc course cost hint, progress bars, and responsive desktop/mobile UI.

**Architecture:** Budget panel is a new sidebar tab (desktop) and fullscreen overlay (mobile) powered by existing Zustand budget slice + new `budgetConfig`. BudgetPanel is a shared component used by both layouts. Polish fixes are isolated one-liner changes except the mobile SunControls overlay which lifts sunDate to Zustand.

**Tech Stack:** React 19, TypeScript, Zustand, Tailwind CSS, Biome, Vitest

**Design doc:** `docs/plans/2026-02-20-phase4-polish-budget-design.md`

---

## Plan Files

Read these in order. Each file is self-contained — an agent only needs to read the file for the tasks it's working on.

| File | Tasks | What it builds |
|---|---|---|
| [phase4-01-polish-fixes.md](./2026-02-20-phase4-01-polish-fixes.md) | 1–2 | Favicon, par clamp, backdrop a11y, backdrop styling |
| [phase4-02-mobile-sun.md](./2026-02-20-phase4-02-mobile-sun.md) | 3–5 | Lift sunDate to store, MobileSunControls overlay, wire to BottomToolbar |
| [phase4-03-budget-store.md](./2026-02-20-phase4-03-budget-store.md) | 6–8 | BudgetConfig type, store actions, export update, auto-init |
| [phase4-04-budget-desktop.md](./2026-02-20-phase4-04-budget-desktop.md) | 9–10 | BudgetPanel component, sidebar integration |
| [phase4-05-budget-mobile.md](./2026-02-20-phase4-05-budget-mobile.md) | 11–12 | MobileBudgetPanel overlay, overflow popover wiring |

## Task Summary

1. Fix favicon, par input clamp, backdrop a11y, backdrop styling
2. Commit polish fixes
3. Lift sunDate from App.tsx useState to Zustand UI state
4. Build MobileSunControls fullscreen overlay component
5. Wire Sun button in OverflowPopover + add MobileSunControls to App
6. Add BudgetConfig type + DEFAULT_BUDGET_CATEGORIES constant
7. Extend store with budgetConfig, initBudget, setBudgetConfig + update persist
8. Update ExportData + buildExportData + add auto-init useEffect
9. Build BudgetPanel component (summary header, card list, footer)
10. Wire BudgetPanel into Sidebar replacing placeholder
11. Build MobileBudgetPanel fullscreen overlay
12. Add Budget button to OverflowPopover + add MobileBudgetPanel to App

## Definition of Done

Open the app on desktop: Budget tab shows 14 pre-populated categories with estimated values from the feasibility study. Edit estimated/actual/notes. Course category shows auto-calc hint updating with hole count. Progress bars show spending ratio. Contingency and grand total auto-calculate. Open on mobile: Budget available from overflow popover as fullscreen overlay with same functionality. Export JSON includes budget data. All existing tests pass, lint clean, build passes.
