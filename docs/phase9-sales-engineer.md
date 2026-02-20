# Phase 9 Analysis: Decision-Quality Cost Estimation and 3D Visualization

**Author**: Sales Engineer (Technical Analysis)
**Date**: 2026-02-20
**Context**: Personal planning tool for a 200m² BORGA blacklight mini golf hall in Gramastetten, Austria
**Purpose**: Identify the highest-leverage improvements to make the tool produce decision-quality outputs

---

## Executive Summary

The tool currently spans Phases 1-8 and is functionally complete as a layout planner and budget tracker. The fundamental gap is that the cost data operates at the wrong level of granularity for procurement decisions. The 18-category budget and 7 flat per-type hole costs are useful for ballpark project sizing — they tell you "this is a ~€250k project" — but they do not tell you what to actually order, from whom, or how to phase your spending. A builder making real purchasing decisions needs to answer different questions: What timber do I buy? How many metres of steel angle? Which felt supplier in Austria can quote me this week?

The analysis below addresses seven specific areas with direct actionability ratings and rough implementation effort estimates. Everything described can be implemented client-side with no backend, consistent with the existing architecture.

---

## 1. Bill of Materials Approach

### Current State

The cost model has two levels:
- **Category level**: 18 budget categories (hall, foundation, course, UV lighting, etc.) with net estimates, VAT profiles, and confidence tiers.
- **Hole-type level**: 7 flat per-type costs in two maps (DIY: €800-1,800; Professional: €2,000-3,500), selectable by buildMode.

The hole-type costs are black boxes. "A windmill hole costs €1,800 DIY" carries no information about what that €1,800 comprises. The user cannot validate it, cannot break out the felt cost separately, and cannot substitute one material choice for another.

### The Problem with Flat Per-Type Costs

Real construction estimators do not price a "windmill hole." They price:
- N metres of 15mm fibre-cement board at €X/m²
- N linear metres of 30x30mm galvanised steel angle at €Y/m
- N m² of synthetic felt (e.g., Regupol or Melos) at €Z/m²
- 1 windmill mechanism (imported from Czech or German manufacturer) at €W each
- Labour hours at local trade rates

The flat per-type cost is essentially what a professional installer quotes when all that is bundled. For a DIY builder — which is the `buildMode: "diy"` scenario — the flat cost is the wrong model entirely. DIY cost is a material cost plus the builder's own time, not a supplier's turnkey rate.

### Recommended BOM Structure

The right granularity for a DIY mini golf BOM is the **component category per hole**, not per individual component. Going to full per-piece detail (every bolt, every pot of paint) overshoots the tool's purpose and creates maintenance burden. The practical level is:

```
Per hole:
  - Playing surface (felt area in m²)
  - Bumper/border material (linear metres, material choice)
  - Structural substrate (MDF, plywood, or fibre cement — area in m²)
  - Tee and cup hardware (unit count)
  - Obstacle-specific materials (per type, see below)
  - Adhesives, fixings, paint (lump sum per hole)

Per obstacle type (additional):
  Windmill: mechanism unit cost + blade material (MDF or aluminium)
  Tunnel:   arch framing (curved MDF or steel conduit) + lining material
  Loop:     structural steel ring or bent conduit + support base
  Ramp:     ramp substrate (MDF or steel sheet) + anti-slip surface
  Loop/Dogleg/L-Shape: no special components beyond baseline
```

This structure enables:
1. Separate felt supplier quote from obstacle supplier quote
2. Toggle between MDF and fibre-cement substrate and see cost impact
3. Aggregate all felt across all holes into one purchase order quantity
4. Per-phase procurement: buy all felt at once for a bulk discount

### Aggregation Model

The most valuable output is not per-hole BOM but **aggregated per-material-type** across all placed holes. This directly answers the question "what do I order?"

```
Felt (synthetic turf, 4m roll width):
  Total area: 18.4 m²
  + 15% waste factor: 21.2 m²
  Supplier: Melos GmbH (DE) or local equivalent
  Estimated: €8-14/m² = €170-300 total

Steel angle (30x30x3mm hot-dip galvanised):
  Total linear metres: 94m
  Supplier: Voestalpine, local steel merchant
  Estimated: €3.50-5.00/m = €330-470 total

15mm MDF (substrate):
  Total area: 22.6 m²
  In 2440x1220mm sheets: 8 sheets
  Estimated: €28-45/sheet = €224-360 total
```

This aggregation approach delivers a shopping list rather than a budget line. It is the difference between "course costs €14,000" and "buy these six things."

### Implementation Approach

New data structure alongside `BudgetCategoryV2`, not replacing it:

```typescript
// Proposed addition to types/budget.ts

type BomMaterialId =
  | "felt"
  | "mdf_substrate"
  | "fibre_cement_substrate"
  | "steel_angle"
  | "steel_tube"
  | "tee_cup_hardware"
  | "windmill_mechanism"
  | "tunnel_arch_material"
  | "loop_ring"
  | "adhesives_fixings"
  | "uv_paint";

type BomComponent = {
  materialId: BomMaterialId;
  quantity: number;   // m², linear metres, or units depending on material
  unit: "m2" | "lm" | "unit" | "lump";
};

// Per hole type, what components does it consume?
// These are proportional to the hole's actual dimensions.
type HoleTypeBomTemplate = {
  holeType: string;
  components: BomComponent[];  // quantities are per-m² of footprint or absolute
};
```

The key insight is that hole dimensions are already stored (`HOLE_TYPES` in `holeTypes.ts` has real widths and lengths in metres). Felt area is simply `width * length * feltCoverage` (roughly 0.85 coverage ratio accounting for bumper overlap). Bumper perimeter is calculable from dimensions. This makes the BOM computation a pure function of the placed holes.

**Effort estimate**: 3-4 days of implementation. No store schema changes required beyond adding a read-only selector. The BOM is a derived output, not stored state.

---

## 2. Modular Course Design: Material Selection Parameters

### What Parameters Matter for Cost

For a DIY/semi-DIY blacklight mini golf build, the three material decisions that dominate hole cost are:

**1. Playing surface material** (~30% of hole cost)
- Synthetic felt (e.g., Melos Minigolf, Regupol MG30): ~€8-14/m², durable, easy to UV-paint
- Real carpet/velvet: cheaper upfront (~€5-8/m²), wears faster
- Hardboard + paint: cheapest (~€2-4/m²), not regulation quality

**2. Bumper/border material** (~25% of hole cost)
- Galvanised steel angle (30x30 or 40x40mm): most durable, professional look, heavier
- Solid timber (50x50mm pine): easy to work DIY, natural look, UV-paintable
- MDF painted: cheapest, not moisture resistant, limited lifespan in a venue

**3. Substrate/base** (~20% of hole cost)
- 15mm fibre-cement board (Eternit or equivalent): moisture-resistant, heavy, professional
- 18mm marine plywood: lighter, good rigidity, moisture risk if not sealed
- 18mm MDF: cheapest, heaviest, moisture-sensitive

Obstacle-specific materials (windmill mechanisms, tunnel arches) matter for specific hole types but not globally.

### Recommended UI Design

Add a **Material Profile** selector at the hole-library or settings level (not per-hole, which would be overwhelming). Three presets plus custom:

```
Material Profile:
  [Budget DIY]     [Standard DIY]   [Semi-Pro]       [Custom...]

  Budget DIY:
    Surface: Painted hardboard
    Borders: Timber
    Base: MDF
    Typical cost multiplier: 0.65x vs Standard DIY

  Standard DIY:
    Surface: Synthetic felt
    Borders: Timber
    Base: Marine plywood
    Typical cost multiplier: 1.0x (baseline)

  Semi-Pro:
    Surface: Melos minigolf felt
    Borders: Galvanised steel angle
    Base: Fibre-cement board
    Typical cost multiplier: 1.8x vs Standard DIY
```

When the user changes the material profile, the DIY cost-per-type map recalculates, the BOM updates, and the 3D rendering changes to reflect the material (see Section 3).

This is much simpler to build than per-hole material selection while still capturing the dominant cost variable.

**Effort estimate**: 2 days. Extend `BudgetConfigV2` with a `materialProfile` field, define multipliers per profile, adjust `selectCourseCost` to apply the multiplier.

---

## 3. Material Selection Impact on 3D Rendering

### Current 3D State

The current 3D models use `MeshStandardMaterial` with solid colours and no textures. Bumpers are white (`#F5F5F5`), felt is dark green (`#2E7D32`), obstacles use type-specific accent colours. The UV mode adds emissive properties for the blacklight preview. No PBR textures, no environment maps, no shadows.

### What PBR Properties Actually Matter Per Material

For this specific application, the meaningful visual difference between material choices maps to these PBR properties:

**Synthetic felt vs hardboard:**
- Roughness: felt = 0.95 (almost fully rough), hardboard painted = 0.4-0.6 (shinier)
- Color: felt is deeper green with visible texture, hardboard is flatter
- Normal map: felt has a woven microstructure that reads as texture under directional light

**Galvanised steel vs timber bumpers:**
- Metalness: steel = 0.7-0.9, timber = 0 (fully dielectric)
- Roughness: steel = 0.3 (semi-glossy), timber = 0.8 (rough)
- Colour: steel is silvery-grey (#A0A8A0), timber is warm brown (#8B6914)

**Fibre-cement vs MDF substrate:**
- Both are non-metallic, primarily differ in colour and surface texture
- Fibre-cement: neutral grey (#9E9E9E), high roughness 0.85
- MDF (painted): can be any colour, medium roughness 0.5

### Practical Rendering Changes

Rather than full PBR texture maps (which require loading assets and significantly increase bundle size), the right approach for this tool is **procedural material variation** using Three.js `MeshStandardMaterial` properties only. This keeps the app fully offline and avoids asset management.

For the most impactful visual change with minimal effort:

**High impact, low effort (1-2 days each):**

1. **Directional shadow casting**: Enable `castShadow` and `receiveShadow` on hole models and hall floor. Add a directional light with `shadow-mapSize={[1024, 1024]}`. This single change dramatically improves perceived depth and realism. The current scene has no shadows, which is why models look flat. Cost: ~50 extra draw calls, negligible for 18 holes.

2. **Material-variant colour system**: When material profile changes, update bumper `roughness`, `metalness`, and `color` to match the selected material. Steel bumpers look different from timber bumpers with just these three properties — no textures needed.

3. **Environment map (HDR)**: Add a simple equirectangular HDR environment map loaded via `@react-three/drei`'s `Environment` preset (e.g., `preset="apartment"` or `preset="warehouse"`). This gives all metallic/glossy surfaces realistic reflections. The `@react-three/drei` library already ships these presets at small sizes. Cost: +~200KB gzipped for an HDR preset.

**Medium impact, medium effort (3-5 days each):**

4. **Procedural felt texture**: Use `THREE.CanvasTexture` to draw a simple woven pattern programmatically (no external image file). Apply as `roughnessMap` and `normalMap` on the felt surface. This gives felt a distinctly textile look vs. hardboard's flatter appearance.

5. **Ambient occlusion (SSAO)**: Add `@react-three/postprocessing` SSAO effect to add contact shadows where hole elements meet the floor. The most realistic-feeling improvement for layout views. Cost: +~150KB bundle increase, ~5ms/frame on desktop.

6. **Animated windmill**: A `useFrame` hook rotating the windmill blades at a configurable RPM. Simple to implement but blocked by Phase 6 design decision to leave blades static. Would make the UV preview mode significantly more compelling.

**High effort, limited incremental value (not recommended this phase):**

7. **GLB texture assets**: Loading actual PBR texture maps (albedo, normal, roughness). Would require a build pipeline for texture compression and significantly complicate the offline/PWA architecture. The procedural approaches above achieve 80% of the visual benefit at 10% of the complexity.

### Connecting Material Profile to Rendering

When the user selects "Steel bumpers" in the material profile, the bumper `MeshStandardMaterial` properties should update:

```typescript
// In shared.ts — add material property sets per profile
export const BUMPER_MATERIALS: Record<string, THREE.MeshStandardMaterialParameters> = {
  timber: { color: "#8B6914", roughness: 0.8, metalness: 0.0 },
  steel:  { color: "#A0A8A0", roughness: 0.25, metalness: 0.75 },
  mdf:    { color: "#C8B99A", roughness: 0.65, metalness: 0.0 },
};

export const FELT_MATERIALS: Record<string, THREE.MeshStandardMaterialParameters> = {
  synthetic:  { color: "#2E7D32", roughness: 0.95, metalness: 0.0 },
  painted:    { color: "#3D8B37", roughness: 0.5,  metalness: 0.0 },
  carpet:     { color: "#1A6B1E", roughness: 0.85, metalness: 0.0 },
};
```

The `useMaterials` hook already exists and handles UV/planning mode switching — it can be extended to also handle material profile switching, making this a clean addition to the existing architecture.

---

## 4. Supplier Integration Strategy

### Why Client-Side-Only Pricing is Fine (for Now)

The project is a personal planning tool, not a commercial product. Adding a backend for live supplier pricing introduces operational burden (hosting, API keys, data refresh pipelines) that is not justified. The relevant Austrian and DACH suppliers (Voestalpine for steel, local timber merchants, Melos/Regupol for felt, specialist UV lamp suppliers) do not have public APIs anyway.

The right strategy is **embedded reference price tables** updated periodically by the user, with a mechanism to record actual quotes.

### Embedded Price Table Approach

Add a `materialPrices` structure to the store (persisted, user-editable):

```typescript
type MaterialPriceEntry = {
  materialId: BomMaterialId;
  unit: "m2" | "lm" | "unit";
  priceNet: number;        // EUR net
  priceGross: number;      // EUR gross (auto-computed)
  supplier: string;        // "Bauhaus Linz", "Melos GmbH", etc.
  quotedDate: string;      // ISO date — user records when they got this price
  isQuote: boolean;        // true = real quote, false = reference estimate
  notes: string;
};

type MaterialPrices = {
  entries: Record<BomMaterialId, MaterialPriceEntry>;
  lastUpdated: string;
};
```

**Default values**: Seed with reference prices from the feasibility study and general Austrian market knowledge (2026 prices). Label these clearly as "reference estimates" not supplier quotes.

**Quote entry**: When the user gets a real supplier quote, they mark it as `isQuote: true` and enter the supplier name and date. The BOM total then shows two columns: "Reference estimate" vs "Quoted price."

**Freshness warnings**: If a quote is older than 90 days, show a warning badge. Construction material prices in Austria move approximately 3-8% annually and can spike during supply disruptions.

### CSV Export as Supplier RFQ

A key output should be a **Request for Quotation (RFQ) CSV** that the user can email directly to suppliers. Format:

```
Materialbezeichnung, Menge, Einheit, Spezifikation, Referenzpreis (netto)
Synthetikfilz (Minigolf), 22.4, m², Melos MG30 oder gleichwertig, €10.00
Stahlwinkel 30x30x3mm verzinkt, 94, lm, EN 10346 feuerverzinkt, €4.20
...
```

The user can print or email this to a Baustoffhändler or online supplier. This turns the planning tool into a procurement tool, which is where the real decision-making value lies.

**Effort estimate**: 3-4 days for the price table UI + BOM selector integration. The CSV export skeleton already exists conceptually from Phase 8's CSV design (which was descoped).

---

## 5. Presentation and Export for Decision-Making

### Current Export State

The export is currently `golf-layout-{date}.json` containing hole positions, budget categories, financial settings, and expenses (v4 format). This is a machine-readable save file, not a human-readable decision document.

### What a Builder/Investor Actually Needs

Three distinct output types serve different audiences and decision contexts:

**Output 1: Project Budget Summary (for bank/investor conversations)**

A single-page PDF or printable HTML showing:
- Total investment range (net and gross) at optimistic/balanced/conservative risk tolerance
- Breakdown by construction phase (pre-construction / construction / fit-out / commissioning)
- VAT status and reclaimable Vorsteuer
- Key assumptions (build mode, material profile, hole count)
- Generated from: the existing budget data, formatted for presentation

This answers "how much money do I need to commit?" It is what you show a bank manager or a business partner.

**Output 2: Procurement Shopping List (for supplier conversations)**

The aggregated BOM described in Section 1, formatted as:
- Grouped by supplier type (steel merchant, timber yard, felt supplier, specialist UV supplier)
- Quantities with waste factors applied
- Reference price ranges and actual quotes where entered
- Phase annotation (what to buy when)

This answers "what do I buy and from whom?"

**Output 3: Layout Floor Plan (for architect/builder conversations)**

Already partially possible — the orthographic top-down view with hole positions and dimensions printed to PDF. This could be enhanced with:
- Actual dimension annotations on holes (width x length in metres)
- Hall boundary annotations (10m x 20m with door/window positions)
- Hole numbering matching the flow path
- Total area utilisation percentage

This answers "where does everything go?"

### Implementation Priority

Output 3 (floor plan) is closest to implementable with the existing R3F infrastructure — orthographic render to canvas, canvas.toBlob(), jsPDF to wrap it. The groundwork was mentioned in the feasibility study as a planned output.

Output 1 (budget summary) can be implemented as a printable HTML page rendered from the Zustand store state, avoiding any PDF library dependency.

Output 2 (shopping list) depends on the BOM feature (Section 1) being built first.

**Recommended Phase 9 export targets**: Output 3 first (floor plan export, 2-3 days), Output 1 second (budget summary print view, 2 days), Output 2 third (shopping list CSV, after BOM feature).

---

## 6. 3D Rendering: Wow Factor Improvements

### Current Rendering Limitations

The scene uses:
- `MeshStandardMaterial` with solid colours and PBR properties (roughness/metalness) but no textures
- `ambientLight` and `directionalLight` — no shadow maps
- No environment maps — metallic/glossy surfaces reflect nothing realistic
- No post-processing
- UV mode with emissive materials, which creates the neon blacklight feel

### Impact/Effort Ranking

The following table ranks improvements by visual impact vs. implementation effort for this specific scene (10x20m hall, ~18 holes, top-down + isometric views).

| Improvement | Visual Impact | Implementation Effort | Bundle Impact | Recommended? |
|---|---|---|---|---|
| Shadow maps (directional light) | Very High | Low (1 day) | Negligible | Yes — highest priority |
| Environment map (HDR preset) | High | Very Low (2 hours) | +200KB | Yes — second priority |
| Animated windmill blades | High (in UV mode) | Low (1 day) | None | Yes — third priority |
| Material profile visual variation | Medium-High | Low (1 day) | None | Yes — ties to Section 3 |
| Bloom post-processing (UV mode only) | Very High | Medium (2 days) | +150KB | Yes — most compelling |
| SSAO ambient occlusion | Medium | Medium (2 days) | +150KB | Optional |
| Procedural felt texture | Medium | Medium (3 days) | None | Optional |
| Fog in UV mode | Medium | Very Low (2 hours) | None | Yes — very easy |
| GLB texture assets | Low incremental | Very High | +500KB+ | No |

### Bloom Post-Processing for UV Mode

The single highest-impact improvement for the UV preview is bloom post-processing. Currently, the UV mode uses emissive materials to create glow, but emissive in Three.js without bloom is just a brighter colour — it does not actually bleed light onto surrounding geometry. Real blacklight venues look like this: neon surfaces radiate halos of light into the surrounding darkness.

`@react-three/postprocessing` provides a `Bloom` effect that creates this halo. Applied only in UV mode (the `uvMode` boolean already exists in the store), it would make the UV preview genuinely evocative of what the hall will look like.

```tsx
// In App.tsx, conditional on uvMode:
import { EffectComposer, Bloom } from "@react-three/postprocessing";

{uvMode && (
  <EffectComposer>
    <Bloom
      intensity={1.5}
      luminanceThreshold={0.3}
      luminanceSmoothing={0.9}
      radius={0.7}
    />
  </EffectComposer>
)}
```

The `luminanceThreshold` ensures bloom only activates on the high-emissive neon materials, not on the dark hall geometry. The result would be visible light halos around all the UV-reactive hole surfaces.

Bundle impact: `@react-three/postprocessing` adds approximately 150-200KB gzipped. The existing bundle is 1,346KB, so this is a ~13% increase. Acceptable given the visual payoff.

### Fog in UV Mode

Add atmospheric fog to the UV mode scene to simulate the hazy, smoke-machine atmosphere common in blacklight venues:

```tsx
// In App.tsx scene:
{uvMode && <fogExp2 attach="fog" color="#0A0A1A" density={0.08} />}
```

This is a two-line change, adds zero bundle overhead, and creates the impression of depth and mystery that blacklight venues rely on. The fog dissipates toward the camera in isometric view, gradually darkening the far end of the hall.

### Shadow Maps

Enable shadow casting on the directional light and receiving on the floor and hole models:

```tsx
// Directional light:
<directionalLight
  castShadow
  shadow-mapSize={[1024, 1024]}
  shadow-camera-near={0.1}
  shadow-camera-far={50}
  shadow-camera-left={-12}
  shadow-camera-right={12}
  shadow-camera-top={12}
  shadow-camera-bottom={-12}
/>

// Hall floor:
<mesh receiveShadow ... />

// In each hole model, add castShadow to obstacle geometry only
// (not felt surfaces, which are flat and contribute no shadow shape)
```

Shadows give windmill blades, loop arches, and tunnel structures depth they currently completely lack. This is the single most visually impactful change for the planning mode and costs approximately one day of work.

---

## 7. Geo Data Utilization

### Current Geo Usage

The tool uses the exact location (48.3715°N, 14.214°E, 526m elevation) for:
- Sun position calculation via `suncalc` (azimuth and altitude by date/time)
- Window sun exposure colour in the 3D view
- OSM minimap tile
- Location bar display

The coordinates are precise and meaningful. The following analyses what additional value can be extracted from them without a backend.

### Climate Data for HVAC Sizing

The feasibility study estimates HVAC load at 15-18kW based on generic Austrian climate assumptions. The actual location data enables a more precise estimate.

Gramastetten at 526m elevation in Upper Austria has:
- Design winter temperature: approximately -13°C to -16°C (colder than Vienna due to elevation)
- Design summer temperature: approximately 28-32°C with high humidity in the Danube valley
- Heating degree days: approximately 3,800-4,200 (vs. Vienna's ~3,300)
- Annual snowfall: significant, consistent with the BORGA offer's 1.9 kN/m² snow load

This information can be embedded as static lookup data keyed to the Austrian climate zone. The location at 48.37°N, 14.21°E falls in the Upper Austrian climate zone (Klimazone 4 per OIB guidelines), which has specific minimum insulation requirements and heating system sizing requirements.

**Actionable feature**: Add a "HVAC Sizing Guidance" section to the budget panel for the `heat-pumps` and `ventilation` categories that shows:
- Estimated design heat load (kW) based on hall geometry (already known: 200m², U-values from BORGA spec) and the embedded climate zone data
- Recommended minimum capacity (with 20% safety margin)
- Approximate annual heating cost estimate (using Austrian average electricity tariff, also embeddable as a static constant)

The formula is straightforward: `Q = U_avg * A * ΔT` where U_avg is weighted average U-value of envelope elements (floor excluded, walls at 0.22 W/m²K, roof at 0.22, windows at 1.1, doors at 1.8), A is envelope area, and ΔT is design temperature difference. All inputs are already known from the BORGA offer and the location.

This feature requires no external API calls. The climate zone parameter is a static lookup from OIB tables. **Effort: 1 day.**

### Heating Degree Days and Inflation-Adjusted Operating Cost

The location's heating degree days can be used to estimate annual operating costs — not just capital costs. Currently the budget covers installation only. An investor evaluating this project needs to know annual operating expenses too.

Embeddable annual operating cost model:
```
Annual electricity (HVAC): 15kW average load * 2,000 operating hours * 0.22 €/kWh = ~€6,600
Annual electricity (UV lighting): 18 lamps * 36W * 2,000 hours = 1,296 kWh * 0.22 = ~€285
Annual electricity (ventilation): 900 m³/h unit * 1.5 kW * 2,000 hours = ~€660
Insurance: €2,200 (already in budget)
Maintenance (annual allowance): ~€2,000-5,000
```

These numbers are calculable from data already in the tool (hall dimensions, lighting count from feasibility study). Embedding them as a "Year 1 operating costs" section in the budget panel — separate from capital costs — gives the investor picture that is currently completely missing.

### Delivery Cost Estimation Using Distance

The location at 48.37°N, 14.21°E is approximately:
- 17km from Linz city centre (major construction material suppliers)
- 30km from the nearest major steel merchant
- 180km from Vienna (BORGA's head office)

Freight costs for construction materials in Austria are typically €0.80-1.50/km/ton for small deliveries. With the supplier location embedded (or user-entered), the tool could compute an approximate delivery surcharge per BOM line item based on great-circle distance.

This is admittedly a minor feature with moderate complexity. The more practical version: add a "Delivery region" dropdown (e.g., "Local <30km", "Regional 30-100km", "National 100-300km") that applies a percentage surcharge to applicable BOM categories. No coordinate math needed.

**Effort: 0.5 days for the dropdown version.**

### Seasonal Construction Window

At 526m in Upper Austria, outdoor ground work (foundations, earthworks) is seasonally constrained. Frozen ground typically prevents foundation work from November through February/March. The tool knows the location and has a date picker for the sun position. It could display:

- Recommended construction window for foundation work (April-October at this elevation)
- First frost risk date (typically October at 526m)
- Warning if the user's planned construction schedule (derivable from phase dates, not yet modelled) falls in the frozen-ground window

This is more of a calendar feature than a geo feature. It requires adding target dates to construction phases — currently the phase field on budget categories has no date attached. That data model gap is worth addressing independently.

**Effort: 2 days, but depends on adding phase date fields first.**

---

## Prioritised Feature Recommendations

The following list ranks all recommended features by implementation value for immediate decision-making, calibrated to this specific project context (personal tool, single-user, already well-built).

### Tier 1: High Value, Low Effort (Phase 9 candidates)

1. **Bloom post-processing for UV mode** — transforms the UV preview from "coloured boxes with emissive" to "genuinely evocative blacklight scene." 2 days, +150KB bundle. Existing `uvMode` boolean wires directly to the `EffectComposer` wrapper.

2. **Shadow maps** — adds real depth to the planning mode. Windmill blades, tunnel arches, and loop structures cast shadows. 1 day, negligible bundle impact.

3. **Animated windmill blades** — the windmill is the most kinetic obstacle type and the only one that should move. A `useFrame` hook with configurable RPM costs 1 day and has zero bundle impact. The Phase 6 design decision to leave blades static can be revisited.

4. **UV mode fog** — `fogExp2` is two lines of JSX, zero bundle impact, and immediately communicates the atmospheric effect of a blacklight venue. 2 hours.

5. **Floor plan export (PNG/PDF)** — the R3F canvas can render to a PNG via `gl.domElement.toBlob()`. A high-resolution top-down render with hole numbers and dimension annotations is the single most useful document for discussions with an architect or builder. 2-3 days.

6. **HVAC sizing guidance** — a static calculation from known inputs (hall envelope, climate zone, design temperatures). Adds credibility to the heat-pumps and ventilation budget estimates. 1 day.

### Tier 2: Medium Value, Medium Effort (Phase 10 candidates)

7. **BOM aggregation by material** — the most structurally significant improvement to the cost estimation. Transforms per-hole costs into a purchasable shopping list. 3-4 days of implementation.

8. **Material profile selector** — three preset material profiles (Budget DIY / Standard DIY / Semi-Pro) that adjust hole costs AND rendering simultaneously. 2-3 days.

9. **Environment map (HDR preset)** — via `drei`'s `Environment` component, adds realistic reflections to metallic/glossy surfaces. 2 hours to add, validates immediately in UV mode (the UV materials have higher metalness in their base colors).

10. **Budget summary printable view** — a formatted HTML print stylesheet applied to the budget panel, showing phase-by-phase breakdown, risk buffer, and VAT analysis. No PDF library needed. 2 days.

11. **Annual operating cost model** — embed HVAC/electricity/maintenance cost estimates as a "Year 1 operating expenses" section. Separate from capital costs. 1-2 days.

### Tier 3: Lower Priority or Dependent Features

12. **RFQ CSV export** — depends on BOM feature (Tier 2, item 7). 1 additional day once BOM is built.

13. **Material-aware rendering** — bumper colour/roughness/metalness varies by material profile selection. Depends on material profile selector (Tier 2, item 8). 1 additional day.

14. **Supplier quote entry** — adds quote date/vendor fields to each BOM line item. Modest complexity but limited value until BOM is built. 2 days.

15. **Phase date fields on budget categories** — prerequisite for seasonal construction window guidance. Moderate complexity (date picker UI per phase, date validation). 2-3 days.

16. **Monte Carlo simulation** — already designed in Phase 8 (deferred). High analytical value for quantifying total cost uncertainty. The PERT distribution parameters already exist in `uncertainty: { min, mode, max }` on every `BudgetCategoryV2`. Implementation is primarily a computation problem (mulberry32 PRNG + PERT sampling), not a data model problem. 2-3 days.

---

## Technical Implementation Notes

### Staying Consistent with Existing Architecture

All recommendations above preserve the existing architecture constraints:
- Client-side only, no backend, no external API dependencies
- Computed values as derived selectors, not stored state
- Persisted via Zustand `persist` middleware — new fields slot into existing `partialize` configuration
- TypeScript-strict — all new types extend existing type patterns
- Biome formatting (tabs) and import sorting applies to new files

### Extension Points in the Existing Codebase

The following existing code structures are the natural extension points for Phase 9:

```
src/store/selectors.ts        — add selectBomAggregates(), selectHvacSizing()
src/utils/financial.ts        — add annualOperatingCost(), hvacHeatLoad()
src/constants/budget.ts       — add MATERIAL_PROFILES, DEFAULT_MATERIAL_PRICES
src/components/three/holes/shared.ts  — add BUMPER_MATERIALS, FELT_MATERIALS records
src/components/three/holes/useMaterials.ts  — extend to include materialProfile
src/App.tsx                   — add EffectComposer conditional on uvMode
src/utils/exportLayout.ts     — add buildBomExport(), buildFloorPlanExport()
```

### What Requires New Files

New functionality that warrants new files rather than extensions:

```
src/utils/bom.ts              — BOM computation logic (pure functions)
src/utils/hvac.ts             — HVAC load calculation (pure functions)
src/components/ui/BomPanel.tsx        — BOM display UI
src/components/ui/PrintBudget.tsx     — Printable budget summary
src/constants/materialPrices.ts       — Default reference prices per material
src/constants/climateZone.ts          — Austrian climate zone data for location
```

### Bundle Size Considerations

Current bundle: 1,346 KB. Key additions:
- `@react-three/postprocessing` (for bloom): +~200KB gzipped
- HDR environment map preset: +~200KB
- All other recommendations: negligible

With these additions, expect approximately 1,750 KB total — still within reasonable bounds for a PWA targeting desktop users with a planning workflow. Code-splitting (already noted as deferred work) would be worth revisiting at this point: dynamically importing the postprocessing library only when UV mode is first activated would keep the initial load fast.

---

## Summary Table

| Feature | Category | Effort | Priority | Depends On |
|---|---|---|---|---|
| UV mode fog | 3D rendering | 2 hours | Tier 1 | Nothing |
| Environment map | 3D rendering | 2 hours | Tier 1 | Nothing |
| Shadow maps | 3D rendering | 1 day | Tier 1 | Nothing |
| Animated windmill | 3D rendering | 1 day | Tier 1 | Nothing |
| HVAC sizing guidance | Geo/cost | 1 day | Tier 1 | Nothing |
| Bloom (UV mode) | 3D rendering | 2 days | Tier 1 | Nothing |
| Floor plan PNG export | Export | 2-3 days | Tier 1 | Nothing |
| Annual operating cost model | Cost | 1-2 days | Tier 2 | Nothing |
| Environment map | 3D rendering | 2 hours | Tier 2 | Nothing |
| Budget summary print view | Export | 2 days | Tier 2 | Nothing |
| Material profile selector | Cost/3D | 2-3 days | Tier 2 | Nothing |
| Material-aware rendering | 3D rendering | 1 day | Tier 2 | Material profile |
| BOM aggregation | Cost | 3-4 days | Tier 2 | Nothing |
| Monte Carlo simulation | Cost | 2-3 days | Tier 2 | Nothing (params exist) |
| RFQ CSV export | Export | 1 day | Tier 3 | BOM aggregation |
| Supplier quote entry | Cost | 2 days | Tier 3 | BOM aggregation |
| Phase date fields | Cost | 2-3 days | Tier 3 | Nothing |
| Seasonal construction window | Geo | 1 day | Tier 3 | Phase date fields |

---

## Conclusion

The tool is already at a high level of sophistication for a personal planning tool. The 8 completed phases have covered layout, 3D visualization, budget tracking, VAT/risk modeling, and UV preview. The highest-leverage next investments are:

1. **Rendering quality** (bloom, shadows, fog, animated windmill) — these close the gap between "functional diagram" and "convincing visualization" without architectural changes.

2. **Floor plan export** — the single most useful document for architect/builder conversations, and it is technically straightforward given the existing R3F scene.

3. **BOM aggregation** — the structural shift that transforms the tool from a budget tracker into a procurement tool. This is the largest single feature recommendation but also the one that most directly enables real purchasing decisions.

4. **Material profile selection** — a lightweight way to model the most significant DIY cost variable (choice of materials) without building a full per-hole configuration UI.

The geo data and HVAC sizing features are solid additions that would require minimal effort and add credibility to the HVAC budget estimates, which are currently the weakest category (medium confidence tier, manually estimated).
