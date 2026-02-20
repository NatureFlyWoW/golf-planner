# Phase 8: Enhanced Cost Estimation System — Design Document

**Date:** 2026-02-20
**Status:** Approved
**Scope:** Austrian financial literacy + probabilistic risk modeling for the budget tracker

## Background

The current budget system has 14 categories with point estimates, a flat 10% contingency, and no VAT handling. An expert council (market researcher, sales engineer, fintech engineer, quant analyst) analyzed the system and identified critical gaps. After 4 rounds of adversarial review (2x Red Team, 2x Blue Team), the following design emerged.

## Key Findings from Expert Council

1. **Foundation costs (€20-30k) are completely missing** — BORGA offer explicitly excludes foundations, anchor rods, and lightning protection
2. **VAT toggle is the #1 financial lever** — a single boolean reveals ~€40-47k in recoverable Vorsteuer for VAT-registered businesses
3. **Flat 10% contingency provides only ~73% confidence** — wall art (42%), course (25%), and finishing (15%) drive 82% of total project variance
4. **DIY per-hole cost (€800-1200) differs fundamentally from installed cost (€2000-3500)** — current estimates bake in an undefined assumption
5. **Austrian trade law requires licensed professionals** for electrical, gas/water, F-gas refrigerant, and fire alarm certification — affects DIY feasibility

## Architecture

### Layer 1 — Austrian Financial Foundations

Eight features, each independently valuable, implemented as one phase.

#### 1. VAT Toggle and Net/Gross Display

**Problem:** The current system stores EUR amounts with no net/gross distinction. The BORGA hall is stored as €108,000 (gross), but other estimates have no VAT basis. A VAT-registered business can recover ~€40-47k in Vorsteuer.

**Design:**
- New `FinancialSettings` in Zustand store:
  ```typescript
  type FinancialSettings = {
    vatRegistered: boolean;
    displayMode: "net" | "gross" | "both";
    inflationFactor: number; // default 1.0
    riskTolerance: "optimistic" | "balanced" | "conservative";
    buildMode: "diy" | "professional" | "mixed";
  };
  ```
- One-time migration wizard on v4 first load: "Are your existing estimates net (excluding MwSt) or gross (including 20% MwSt)?" with per-category defaults
- All amounts display as configured; both perspectives available via toggle in budget panel header
- When `vatRegistered=true`, show total reclaimable Vorsteuer prominently
- Per-category VAT profile: `"standard_20"` (most categories) or `"exempt"` (insurance, government permit fees)

**VAT rates (Austrian):**
- Standard: 20% (all construction, materials, services)
- Exempt: insurance premiums, government administrative fees

**Utility functions:**
```typescript
function netToGross(net: number, profile: "standard_20" | "exempt"): number {
  return profile === "standard_20" ? roundEur(net * 1.20) : net;
}
function effectiveCost(net: number, profile: VatProfile, vatRegistered: boolean): number {
  return vatRegistered ? net : netToGross(net, profile);
}
function roundEur(n: number): number {
  return Math.round(n * 100) / 100;
}
```

#### 2. Missing Budget Categories

**Problem:** Four cost categories explicitly excluded from the BORGA offer are not budgeted.

**New categories:**

| ID | Name | Default (net) | VAT Profile | Phase | Mandatory | Notes |
|----|------|--------------|-------------|-------|-----------|-------|
| `foundation` | Foundation & earthworks | €20,000 | standard_20 | construction | true | Strip foundations + Bodenplatte. Consult BORGA for specs. |
| `lightning-protection` | Lightning protection (Blitzschutz) | €3,500 | standard_20 | construction | true | Explicitly excluded from BORGA offer. Required for commercial. |
| `grid-connection` | Electrical grid connection (Stromanschluss) | €2,500 | standard_20 | pre-construction | true | Netz OO connection fee. Varies by distance from supply. |
| `water-connection` | Water & sewer connection (Wasseranschluss) | €1,500 | standard_20 | pre-construction | true | Municipal water/Kanal. Varies by Gemeinde. |

Total from new categories: ~€27,500 net
New 18-category subtotal: ~€218,000 net (~€261,600 gross)

#### 3. Mandatory Category Locking

**Problem:** Users can currently zero out critical categories, creating an unrealistic budget.

**Design:**
- Categories tagged `mandatory: true` show a lock icon next to the name
- The estimated field shows a warning when set below a threshold (50% of default)
- Mandatory categories: hall, foundation, emergency-lighting, electrical, plumbing, fire-safety, permits, insurance, lightning-protection, grid-connection, water-connection
- Non-mandatory: course (auto-calc), uv-lighting, wall-art, finishing, equipment, ventilation, heat-pumps

#### 4. Confidence Tiers and Risk-Weighted Contingency

**Problem:** Flat 10% contingency allocates €9,000 buffer to a contractually-fixed hall and €350 to fire safety.

**Design:**
- Each category gets a `confidenceTier` dropdown:

| Tier | Label | CV | Min multiplier | Max multiplier | Use case |
|------|-------|----|----------------|----------------|----------|
| `fixed` | Fixed price | 2% | 0.98 | 1.02 | Signed contracts (BORGA hall) |
| `low` | Low uncertainty | 10% | 0.90 | 1.15 | Professional quotes received |
| `medium` | Medium uncertainty | 20% | 0.80 | 1.30 | Researched estimates |
| `high` | High uncertainty | 40% | 0.60 | 1.60 | Rough estimates, DIY |
| `very_high` | Very high uncertainty | asymmetric | 0.50 | 2.00 | Artistic/custom work |

- Tier auto-populates `uncertainty: { min, mode, max }` from the mode:
  - `min = mode * minMultiplier`
  - `max = mode * maxMultiplier`
- Advanced users can override min/mode/max directly
- Risk-weighted contingency calculation:
  ```
  riskBuffer(category) = mode * (riskMultiplier - 1.0)
  where riskMultiplier = { fixed: 1.02, low: 1.10, medium: 1.15, high: 1.25, very_high: 1.40 }
  totalRiskBuffer = sum of riskBuffer per category
  ```
- User picks risk tolerance:
  - Optimistic: use risk multipliers as-is (≈P60)
  - Balanced: multiply all risk buffers by 1.3 (≈P80) — **default**
  - Conservative: multiply all risk buffers by 2.0 (≈P95)
- Display: "Risk buffer (Balanced): €X (Y%)" replacing "Contingency (10%): €X"

**Default tier assignments:**
- `fixed`: hall, insurance
- `low`: emergency-lighting, fire-safety, ventilation
- `medium`: electrical, plumbing, heat-pumps, uv-lighting, permits, grid-connection, water-connection, lightning-protection
- `high`: course, finishing, equipment, foundation
- `very_high`: wall-art

#### 5. DIY vs. Professional Toggle

**Problem:** Per-hole costs of €2,000-€3,500 conflate material costs and installation labor.

**Design:**
- Global toggle in financial settings: `buildMode: "diy" | "professional" | "mixed"`
- Two cost-per-type maps:
  ```typescript
  const COST_PER_TYPE_DIY: Record<string, number> = {
    straight: 800, "l-shape": 1000, dogleg: 1100,
    ramp: 1200, loop: 1500, windmill: 1800, tunnel: 1100,
  };
  const COST_PER_TYPE_PRO: Record<string, number> = {
    straight: 2000, "l-shape": 2500, dogleg: 2800,
    ramp: 3000, loop: 3200, windmill: 3500, tunnel: 2800,
  };
  ```
- `selectCourseCost` uses the appropriate map based on `buildMode`
- `"mixed"` mode: uses `budgetConfig.costPerType` (user-editable, initialized from DIY defaults)
- Course breakdown shows which cost basis is active
- Other categories show hints: "DIY: consider €X-€Y for materials only" vs. "Professional: expect €X-€Y installed"

#### 6. Simple Expense Tracking

**Problem:** The single `actual: number` field has no provenance, date, or vendor information.

**Design:**
```typescript
type ExpenseEntry = {
  id: string;        // nanoid or uuid
  categoryId: string;
  date: string;      // ISO date "2026-03-15"
  amount: number;    // EUR (net or gross depending on user's displayMode)
  vendor: string;
  note: string;
};
```
- `expenses: ExpenseEntry[]` array in persisted store state
- `actual` per category becomes a derived value: `sum of expenses where categoryId matches`
- UI: expandable expense list in each category card
  - "Add expense" button opens inline form: date, amount, vendor, note
  - Each expense is deletable
  - Total shown at bottom of list
- Migration: existing `actual > 0` becomes a single entry with vendor="Migrated from v3" and date=migration date

#### 7. Budget Health Warnings

**Problem:** No automated feedback when the budget is unrealistic or incomplete.

**Design:**
- Warning banners above the category list in BudgetPanel
- Warning rules:
  - `critical`: Actual > 120% of estimate for any category
  - `critical`: Missing mandatory category with estimate = 0
  - `warning`: VAT status not configured (show potential Vorsteuer savings)
  - `warning`: Total net below €150,000 or above €350,000 (feasibility study bounds)
  - `info`: Category has no expenses but project is in construction phase
- Warnings are dismissable (stored in UI state, not persisted)
- Each warning shows: title, message, suggested action

```typescript
type BudgetWarning = {
  id: string;
  severity: "critical" | "warning" | "info";
  title: string;
  message: string;
  action?: string;
};
```

#### 8. Inflation Adjustment

**Problem:** Estimates from 2026 may be stale by 2027 when construction starts.

**Design:**
- `inflationFactor: number` in FinancialSettings (default 1.0)
- Applied to all non-`fixed` tier categories when computing displayed estimates:
  `displayedEstimate = estimatedNet * inflationFactor`
- UI: small input in budget settings: "Construction cost inflation: X%"
- When factor != 1.0, show note: "Estimates adjusted for X% inflation"
- Does NOT modify stored `estimatedNet` — purely a display-time multiplier

### Layer 2 — Probabilistic Risk Model (optional second phase)

#### 9. Monte Carlo Engine

- PERT distributions parametrized from Layer 1's `uncertainty: { min, mode, max }`
- 10,000 samples using Iman-Conover method (independent sampling, no correlation matrix for v1)
- Seeded PRNG (mulberry32) for deterministic results
- ~15ms runtime on mobile, zero external dependencies, ~3-4KB gzipped
- Results: P50, P80, P95 quantiles replace the analytical approximation from Layer 1
- Memoized via `useMemo` — recomputed only when uncertainty params change

#### 10. Visualization

- Small histogram (200px × 100px) in budget panel header showing total cost distribution
- Vertical markers for: base estimate (dashed), budget target (solid)
- Shaded region for selected confidence level
- Tornado chart (collapsed section): top 5 risk drivers sorted by variance contribution
- Rendered as inline SVG or CSS, not a charting library (bundle size constraint)

#### 11. CSV Export

- Budget summary: one row per category (de-AT format: semicolons, comma decimals, UTF-8 BOM)
- Expense ledger: one row per expense entry
- Columns: Kategorie, Phase, Geschatzt (netto), Geschatzt (brutto), USt-Satz, Vorsteuer, Bezahlt, Offen, Notizen
- For Steuerberater handoff

### Explicitly Descoped (Layer 3 — Not This Phase)

- Depreciation / AfA schedules
- Cash flow projections / burn-down charts
- Scenario comparison engine
- Payment milestones (committed/invoiced/paid pipeline)
- Correlation matrix for Monte Carlo
- Annual operating cost modeling
- PDF generation
- Spreadsheet export template
- Kleinunternehmerregelung modeling
- Grunderwerbsteuer (land purchase tax)

## Data Model

### Enhanced Budget Category (v4)

```typescript
type VatProfile = "standard_20" | "exempt";
type ConfidenceTier = "fixed" | "low" | "medium" | "high" | "very_high";
type ConstructionPhase = "pre-construction" | "construction" | "fit-out" | "commissioning" | "ongoing";

type BudgetCategoryV2 = {
  id: string;
  name: string;
  estimatedNet: number;
  notes: string;
  manualOverride?: boolean;
  vatProfile: VatProfile;
  confidenceTier: ConfidenceTier;
  uncertainty: { min: number; mode: number; max: number };
  mandatory: boolean;
  phase: ConstructionPhase;
};
```

### Store Version: v3 → v4 Migration

- `budget: Record<string, BudgetCategory>` → `budget: Record<string, BudgetCategoryV2>`
- `budgetConfig: BudgetConfig` → `budgetConfig: BudgetConfig` (preserved, extended with `costPerTypeDiy`)
- New: `financialSettings: FinancialSettings`
- New: `expenses: ExpenseEntry[]`
- Existing `estimated` values treated as gross by default (user confirms via one-time wizard)
- Existing `actual` values migrated to single ExpenseEntry per category
- 4 new categories seeded with defaults
- `confidenceTier` assigned per category from defaults above

### Persistence

Persisted (via Zustand persist):
- `budget`, `budgetConfig`, `financialSettings`, `expenses`
- `holes`, `holeOrder` (unchanged)

Not persisted:
- Budget warnings (computed on render)
- Monte Carlo results (computed via useMemo, ~15ms)
- Display amounts (derived from net + VAT + inflation)

## UI Changes

### Budget Panel (Desktop Sidebar)

**Header enhancement:**
- Current: "Budget" title + subtotal/actual/variance
- New: Toggle for net/gross display. Show "Effective cost" (considers VAT status).
- Risk tolerance selector: Optimistic / Balanced / Conservative
- Warning banner area (if any warnings active)

**Category cards (enhanced):**
- Lock icon for mandatory categories
- Confidence tier dropdown (small, right-aligned)
- Expandable expense list with "Add expense" button
- Progress bar unchanged (blue/amber/red thresholds)

**Footer enhancement:**
- Current: "Contingency (10%): €X" + "Grand Total: €X"
- New: "Risk buffer (Balanced): €X (Y%)" + "Budget target: €X"
- When vatRegistered: "+ Reclaimable Vorsteuer: €X"

### Financial Settings (New)

Accessible via gear icon in budget panel header. Modal or collapsed section:
- VAT registered toggle
- Display mode: Net / Gross / Both
- Build mode: DIY / Professional / Mixed
- Inflation adjustment: percentage input
- Risk tolerance: three clickable cards

### Mobile Budget Panel

Same enhancements, adapted to fullscreen overlay layout. Confidence tier and expense list work in mobile expanded card view.

## Default Category Configuration (v4, all 18 categories)

| ID | Name | Net (€) | VAT | Tier | Phase | Mandatory |
|----|------|---------|-----|------|-------|-----------|
| hall | BORGA Hall | 90,000 | standard_20 | fixed | construction | true |
| foundation | Foundation & earthworks | 20,000 | standard_20 | high | construction | true |
| course | Mini golf course | (auto) | standard_20 | high | fit-out | true |
| uv-lighting | UV lighting system | 4,583 | standard_20 | medium | fit-out | false |
| emergency-lighting | Emergency lighting | 1,667 | standard_20 | low | fit-out | true |
| heat-pumps | Heat pumps | 8,333 | standard_20 | medium | construction | false |
| ventilation | Ventilation w/ heat recovery | 3,750 | standard_20 | low | construction | false |
| electrical | Electrical installation | 10,417 | standard_20 | medium | construction | true |
| plumbing | Plumbing & WC | 12,500 | standard_20 | medium | construction | true |
| wall-art | UV graffiti / wall art | 12,500 | standard_20 | very_high | commissioning | false |
| finishing | Interior finishing & flooring | 8,333 | standard_20 | high | fit-out | false |
| equipment | Sound, POS, furniture | 8,333 | standard_20 | high | commissioning | false |
| fire-safety | Fire safety & emergency | 2,917 | standard_20 | low | fit-out | true |
| permits | Permits, architect, fees | 9,500 | exempt | medium | pre-construction | true |
| insurance | Insurance (annual) | 2,200 | exempt | fixed | ongoing | true |
| lightning-protection | Lightning protection | 3,500 | standard_20 | medium | construction | true |
| grid-connection | Grid connection (Stromanschluss) | 2,500 | standard_20 | medium | pre-construction | true |
| water-connection | Water/sewer connection | 1,500 | standard_20 | medium | pre-construction | true |

**Subtotal (net):** ~€202,533 (excluding auto-calculated course)
**With 14-hole DIY course (~€14,000 net):** ~€216,533 net
**Gross (at 20%, except exempt):** ~€257,440
**With Balanced risk buffer (~15%):** ~€296,056 gross

## Expert Council Sources

This design was informed by analysis from:
- **Market Researcher**: Austrian construction pricing 2025-2026, DACH mini golf supplier landscape, regulatory costs, HVAC market, tax implications
- **Sales Engineer**: Bill of materials decomposition for all 14 original categories, technical specification gaps, DIY vs. professional assessment per Austrian trade law
- **Fintech Engineer**: Financial data model with VAT compliance, expense tracking, risk-weighted contingency, phased rollout strategy
- **Quant Analyst**: PERT distributions, Monte Carlo simulation design (Iman-Conover method), sensitivity analysis, 14x14 correlation matrix analysis

Design validated through 4 adversarial review rounds (2x Devils Advocate, 2x Blue Team).
