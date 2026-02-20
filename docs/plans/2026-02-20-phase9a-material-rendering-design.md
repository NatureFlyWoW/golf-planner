# Phase 9A: Material-Aware Rendering & Cost Precision — Design Document

**Date:** 2026-02-20
**Status:** Approved
**Scope:** Material profiles with cost impact, 3D visual overhaul (shadows/bloom/fog), financial quick wins, export capabilities, code-splitting

## Background

Phases 1-8 built a complete layout planner with budget tracking, UV theme, and Austrian financial modeling. An expert council (market researcher, sales engineer, fintech engineer, UX/3D developer) analyzed the codebase and identified high-leverage improvements. After 4 rounds of adversarial review (2x Red Team, 2x Blue Team), this design emerged.

Phase 9 was split into 9A (this document) and a future 9B. Phase 9A focuses on visual credibility + material-aware costing + exports. Phase 9B will focus on deep financial modeling (Monte Carlo, BOM aggregation, cash flow).

## Key Findings from Expert Council

1. **Material choice is the dominant DIY cost variable** — surface (felt vs hardboard vs concrete), bumpers (steel vs timber vs MDF), and substrate (fibre-cement vs plywood vs MDF) account for ~75% of per-hole cost variance
2. **Bloom postprocessing transforms UV mode** — emissive materials without bloom are just brighter colors; with bloom, they bleed light halos like a real blacklight venue
3. **Shadow maps are the single biggest depth improvement** — the current scene has no shadows, making all models look flat
4. **Inflation factor is stored but not wired** — `inflationFactor` exists in `FinancialSettings` but doesn't affect displayed costs
5. **BORGA quote has 30-day validity on €90k** — no mechanism to track quote expiry
6. **The tool has no human-readable output** — JSON export is machine-readable but you can't email it to an architect

## Architecture

### Task 1 — Material Profile Selector (Cost Side)

**Problem:** The current cost model has flat per-type costs (DIY: €800-1,800; Pro: €2,000-3,500) with no way to express material quality choices. A DIY builder choosing steel bumpers pays ~1.8x more than one choosing timber bumpers.

**Design:**

Add a `materialProfile` field to `BudgetConfigV2`:

```typescript
type MaterialProfile = "budget_diy" | "standard_diy" | "semi_pro";

// Extend existing BudgetConfigV2
type BudgetConfigV2 = {
  // ... existing fields
  materialProfile: MaterialProfile;
};
```

Three presets with cost multipliers applied to the course category:

| Profile | Surface | Bumpers | Substrate | Cost Multiplier |
|---------|---------|---------|-----------|-----------------|
| Budget DIY | Painted hardboard | Timber | MDF | 0.65x |
| Standard DIY | Synthetic felt | Timber | Marine plywood | 1.0x (baseline) |
| Semi-Pro | Melos minigolf felt | Galvanized steel | Fibre-cement | 1.8x |

**Cost multiplier application:**

```typescript
// In selectors.ts — modify selectCourseCost
const MATERIAL_PROFILE_MULTIPLIERS: Record<MaterialProfile, number> = {
  budget_diy: 0.65,
  standard_diy: 1.0,
  semi_pro: 1.8,
};

// Applied to DIY cost map values:
// effectiveCost = baseDiyCost * materialMultiplier
```

The multiplier applies only in `buildMode: "diy"` and `buildMode: "mixed"`. Professional costs already include materials at the installer's chosen quality.

**UI:** Add a dropdown in `CostSettingsModal` alongside the existing Build Mode selector:

```
Build Mode:    [DIY ▾]  [Professional ▾]  [Mixed ▾]
Material Tier: [Budget DIY ▾]  [Standard DIY ▾]  [Semi-Pro ▾]
```

Material Tier is disabled/hidden when Build Mode is "professional" (the installer chooses materials).

**Store v5 migration:** Add `materialProfile: "standard_diy"` as default. Backward-compatible — field is optional with fallback.

### Task 2 — 3D Visual Overhaul

**Problem:** The current scene uses `MeshStandardMaterial` with solid colors, no shadows, no postprocessing. Models look flat. UV mode has emissive materials but without bloom, the glow doesn't bleed — it's just brighter colors.

**Design — 4 sub-features:**

#### 2a. Shadow Maps (Sun-Driven)

Enable shadow casting on the directional light, driven by the existing sun position calculation:

```typescript
// Convert suncalc azimuth/altitude to DirectionalLight position
const distance = 30;
const lx = -Math.sin(azimuth) * Math.cos(altitude) * distance + hallWidth / 2;
const ly = Math.sin(altitude) * distance;
const lz = Math.cos(azimuth) * Math.cos(altitude) * distance + hallLength / 2;
```

Configuration:
- Shadow map: 1024×1024 (512×512 on mobile via `isMobile`)
- Shadow camera bounds: sized to hall (left=-12, right=12, top=25, bottom=-15)
- Shadow bias: -0.001 (prevent shadow acne on flat surfaces)
- `castShadow` on obstacle geometry only (not felt surfaces which are flat)
- `receiveShadow` on hall floor

Canvas requires `shadows` prop:
```tsx
<Canvas shadows="soft" ...>
```

Only active in planning mode (not UV mode — UV is dark with minimal directional light).

#### 2b. UV Fog

Two lines of JSX, zero bundle impact:

```tsx
{uvMode && <fog attach="fog" args={["#0A0A1A", 8, 25]} />}
```

Simulates the hazy atmosphere of a blacklight venue. Dissipates toward camera distance.

#### 2c. Bloom Postprocessing (UV Mode Only)

New dependency: `@react-three/postprocessing` (~150KB, lazy loaded).

**Component:** `src/components/three/UVPostProcessing.tsx`

```typescript
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { KernelSize } from "postprocessing";

export function UVPostProcessing() {
  return (
    <EffectComposer>
      <Bloom
        intensity={isMobile ? 0.7 : 1.2}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.4}
        kernelSize={isMobile ? KernelSize.SMALL : KernelSize.LARGE}
        mipmapBlur
      />
      <Vignette offset={0.3} darkness={0.8} />
    </EffectComposer>
  );
}
```

**Lazy loading wrapper:** `src/components/three/UVEffects.tsx`

```typescript
const UVPostProcessing = lazy(() => import("./UVPostProcessing"));

export function UVEffects() {
  const uvMode = useStore((s) => s.ui.uvMode);
  if (!uvMode) return null;
  return (
    <Suspense fallback={null}>
      <UVPostProcessing />
    </Suspense>
  );
}
```

**Emissive calibration:** Bump UV material `emissiveIntensity` from 0.5 to 0.8 so bloom threshold (0.2) activates properly. Define constants:

```typescript
export const UV_EMISSIVE_INTENSITY = 0.8; // with bloom
```

**Key decision:** UV mode IS presentation mode. No separate toggle. Bloom + fog + vignette always activate with UV mode.

**`frameloop` interaction:** `EffectComposer` works with `frameloop="demand"`. The bloom pass renders on the same demand frame — no change needed. `invalidate()` must be called on `uvMode` toggle (already handled by store subscriptions).

#### 2d. Material Profile PBR Properties

When the material profile changes, update bumper and felt `MeshStandardMaterial` properties:

```typescript
// In shared.ts or a new materialPresets.ts
export const BUMPER_PBR: Record<MaterialProfile, MeshStandardMaterialParameters> = {
  budget_diy:   { color: "#C8B99A", roughness: 0.65, metalness: 0.0 },  // MDF painted
  standard_diy: { color: "#8B6914", roughness: 0.80, metalness: 0.0 },  // Timber
  semi_pro:     { color: "#A0A8A0", roughness: 0.25, metalness: 0.75 }, // Galvanized steel
};

export const FELT_PBR: Record<MaterialProfile, MeshStandardMaterialParameters> = {
  budget_diy:   { color: "#3D8B37", roughness: 0.50, metalness: 0.0 },  // Painted hardboard
  standard_diy: { color: "#2E7D32", roughness: 0.95, metalness: 0.0 },  // Synthetic felt
  semi_pro:     { color: "#1B5E20", roughness: 0.95, metalness: 0.0 },  // Melos minigolf felt
};
```

The existing `useMaterials` hook reads from shared material singletons. Extend it to consume `materialProfile` from the store and select the appropriate PBR properties. This only affects planning mode — UV mode overrides all materials with emissive neon colors regardless of profile.

### Task 3 — Financial Quick Wins

#### 3a. Wire Inflation Factor

**Problem:** `inflationFactor` exists in `FinancialSettings` (default 1.0) but is not applied to displayed amounts.

**Design:** Apply inflation to non-fixed categories in the display layer:

```typescript
function inflatedEstimate(estimatedNet: number, tier: ConfidenceTier, factor: number): number {
  if (tier === "fixed") return estimatedNet; // Fixed-price contracts unaffected
  return roundEur(estimatedNet * factor);
}
```

Apply in `computeSubtotalNet` and display the inflated amount alongside the base amount:
- Show "Base: €216,533 | Inflated (2.5%): €221,946" in budget panel header
- Per-category, show the inflated value in parentheses when `inflationFactor > 1.0`

The `inflationFactor` slider in FinancialSettingsModal already exists — it just needs to affect the display.

#### 3b. Quote Expiry Tracking

**Problem:** The BORGA hall offer is valid 30 days (€90k item). No mechanism to track this.

**Design:** Add optional `QuoteInfo` to budget categories:

```typescript
type QuoteInfo = {
  vendor: string;        // "BORGA Stahlhallen"
  quoteDate: string;     // ISO date, e.g. "2026-02-15"
  validUntil: string;    // ISO date, e.g. "2026-03-17"
  quoteRef: string;      // "015-659208"
  isBinding: boolean;    // verbindlich vs. unverbindlich
};

// Extend BudgetCategoryV2 (optional field, backward-compatible)
type BudgetCategoryV2 = {
  // ... existing fields
  quote?: QuoteInfo;
};
```

**UI in BudgetPanel:** Badge per category row:
- Green: "Quoted" (valid quote on file, > 14 days remaining)
- Yellow: "Expires in X days" (< 14 days remaining)
- Red: "Expired X days ago" (past validUntil)
- No badge: no quote on file (uses reference estimate)

**Quote entry:** Small inline form in the category detail (expanded row) with vendor, date, valid-until, reference fields. Pre-seed the BORGA hall category with known quote data from the offer document.

**Store v5 migration:** `quote` field is optional, no migration needed beyond the version bump.

### Task 4 — SVG Floor Plan Export

**Problem:** The tool has no output format a non-technical person can use. JSON export is machine-readable. An architect needs a floor plan.

**Design:** Generate an SVG document from hall + holes data:

```typescript
// src/utils/floorPlanExport.ts
export function generateFloorPlanSVG(
  hall: { width: number; length: number },
  holes: Record<string, Hole>,
  holeOrder: string[],
): string {
  // Returns a complete SVG string
}
```

SVG contents:
- Hall boundary rectangle with dimensions annotated (10.0m × 20.0m)
- Door and window positions on walls (from `HALL_OPENINGS`)
- Each hole as a colored rectangle with:
  - Hole number (from holeOrder index + 1)
  - Type label (e.g., "Windmill")
  - Width × length dimensions in metres
  - Correct rotation applied via SVG `transform="rotate(...)"`
- Flow path as dashed polyline connecting hole centers in order
- Scale bar (e.g., "1m" reference length)

Scale: 50px per metre. Total SVG size: ~540px × 1040px.

**Download:** Toolbar button "Export Floor Plan" creates a Blob from the SVG string and triggers download as `floor-plan-{date}.svg`.

The SVG is viewable in any browser and printable to PDF via the browser's print dialog.

### Task 5 — Code-Splitting

**Problem:** 1,346 KB single JS bundle. Three.js core is ~600KB. Budget/financial code is ~80KB. Both can be lazy-loaded.

**Design:**

**Vite `manualChunks`:**
```typescript
// vite.config.ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        "vendor-three": ["three", "@react-three/fiber", "@react-three/drei"],
        "vendor-react": ["react", "react-dom"],
        "vendor-state": ["zustand", "zundo"],
      }
    }
  }
}
```

**Lazy Canvas:** Extract 3D canvas content from `App.tsx` into `ThreeCanvas.tsx`, lazy-import it:

```typescript
const ThreeCanvas = lazy(() => import("./components/three/ThreeCanvas"));

// In App.tsx:
<Suspense fallback={<CanvasSkeleton />}>
  <ThreeCanvas sunData={sunData} />
</Suspense>
```

`CanvasSkeleton`: a lightweight CSS-only placeholder showing the hall outline and a loading spinner. No Three.js dependency.

**Lazy postprocessing:** Already handled in Task 2 via `UVEffects` lazy wrapper.

**Expected result:** Initial load ~400KB (React + Zustand + Tailwind + UI shell). Three.js chunk ~700KB loaded on first paint. Postprocessing ~150KB loaded on first UV activation.

### Task 6 — Screenshot Export

**Problem:** No way to capture and share the 3D view. UV mode with bloom would make a compelling screenshot for sharing with contractors or on social media.

**Design:**

**Capture mechanism:** Register a callback from inside Canvas to outside via Zustand:

```typescript
// Store additions:
captureScreenshot: (() => void) | null;
registerScreenshotCapture: (fn: () => void) => void;
```

**Inside Canvas:** A null-rendering component that registers the capture function:

```typescript
function ScreenshotCapture() {
  const { gl, scene, camera } = useThree();
  const register = useStore((s) => s.registerScreenshotCapture);

  useEffect(() => {
    register(() => {
      const dpr = gl.getPixelRatio();
      gl.setPixelRatio(Math.min(window.devicePixelRatio * 2, 4));
      gl.render(scene, camera);
      gl.domElement.toBlob((blob) => {
        if (!blob) {
          // iOS fallback
          const dataUrl = gl.domElement.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `golf-plan-${Date.now()}.png`;
          a.click();
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `golf-plan-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        gl.setPixelRatio(dpr);
      }, "image/png");
    });
  }, [gl, scene, camera, register]);

  return null;
}
```

**Toolbar button:** Camera icon in toolbar. On click, calls `captureScreenshot()` from store.

**UV mode screenshots:** `toBlob()` captures the composited output including bloom effects — the screenshot shows exactly what's on screen.

## Data Model Summary

### New Types

```typescript
type MaterialProfile = "budget_diy" | "standard_diy" | "semi_pro";

type QuoteInfo = {
  vendor: string;
  quoteDate: string;
  validUntil: string;
  quoteRef: string;
  isBinding: boolean;
};
```

### Extended Types

```typescript
// BudgetConfigV2 adds:
materialProfile: MaterialProfile; // default: "standard_diy"

// BudgetCategoryV2 adds:
quote?: QuoteInfo; // optional, no migration needed
```

### Store v5 Migration

- Read v4 data, add `budgetConfig.materialProfile = "standard_diy"` if missing
- `quote` field is optional — no migration for individual categories
- Export format bumped to v5 (includes `materialProfile`)

## New Dependencies

| Package | Purpose | Size | Loading |
|---------|---------|------|---------|
| `@react-three/postprocessing` | Bloom, vignette in UV mode | ~150KB | Lazy (UV mode only) |

No other new dependencies. Shadow maps, fog, SVG generation, screenshot capture, and code-splitting use existing packages.

## Bundle Impact

| Before | After (initial) | After (all lazy loaded) |
|--------|----------------|------------------------|
| 1,346 KB single chunk | ~400 KB initial | ~1,550 KB total (all chunks) |

## Decisions Locked by Adversarial Review

1. **UV mode = presentation mode** — no separate "presentation" toggle
2. **Material profiles are global** — not per-hole (per-hole deferred to future phase)
3. **`frameloop` stays `"demand"`** — no continuous animations
4. **Bloom is always part of UV mode** — not optional within UV
5. **SVG export, not PDF** — browser print dialog handles PDF conversion
6. **Store migration is minimal** — one field added with default value

## Phase 9B (Deferred — Pre-Validated)

The following features were validated by the expert council and adversarial review as valuable but not Phase 9A scope:

- Monte Carlo simulation engine + histogram + tornado chart
- BOM aggregation by material type (shopping list)
- Cash flow projection chart
- Budget summary print view
- Animated windmill blades (requires `frameloop="always"`)
- Break-even/ROI calculator
- Financing scenario modeler
- Entity comparison (Privatperson/Verein/GmbH)

Expert analysis documents for 9B reference:
- `docs/phase9-sales-engineer.md` (BOM structure, supplier strategy)
- `docs/phase9-fintech-analysis.md` (Monte Carlo engine, Austrian compliance)
- `docs/phase9-ux-3d-analysis.md` (camera modes, mobile gestures, GLB export)
