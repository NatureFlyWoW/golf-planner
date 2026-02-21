# Phase 11A TDD Plan: GOLF FORGE Visual Identity & Rendering

## Testing Context

- **Framework**: Vitest 4.0.18 with jsdom environment
- **Current**: 229 tests across 20 files, all passing
- **Patterns**: Pure logic/utility tests only — no 3D component rendering tests, no @testing-library/react
- **Conventions**: Test files in `tests/` directory, `*.test.ts` naming, standard Vitest `describe/it/expect`
- **Visual testing**: Playwright (new for Phase 11A) — screenshot comparison for visual regressions

**Testing philosophy for Phase 11A**: Most tasks involve 3D rendering (R3F), CSS theming (Tailwind), and visual effects — none of which are testable with jsdom. Tests focus on:
1. **Logic**: tier detection, state management, migration, gating conditions
2. **State**: Zustand store changes, persistence, computed values
3. **Visual**: Playwright screenshot comparisons for the final result (T12)

---

## T1: GPU Tier Classifier

### Unit Tests (Vitest)

```
# Test: mapDetectGpuToAppTier maps tier 0 → "low"
# Test: mapDetectGpuToAppTier maps tier 1 → "low"
# Test: mapDetectGpuToAppTier maps tier 2 → "mid"
# Test: mapDetectGpuToAppTier maps tier 3 → "high"
# Test: mapDetectGpuToAppTier handles undefined/null input → "low"

# Test: gpuTierOverride "auto" uses detected tier
# Test: gpuTierOverride "low" overrides detected "high" → "low"
# Test: gpuTierOverride "high" overrides detected "low" → "high"

# Test: localStorage caching — writes tier after first detection
# Test: localStorage caching — reads cached tier on subsequent loads
# Test: localStorage caching — ignores cache when override is set

# Test: v7 migration adds gpuTierOverride: "auto" to existing v6 state
# Test: v7 migration try/catch — corrupted state falls back to defaults
# Test: v7 migration preserves all existing v6 fields unchanged

# Test: needsAlwaysFrameloop — false when uvMode=false
# Test: needsAlwaysFrameloop — false when uvMode=true + gpuTier="low"
# Test: needsAlwaysFrameloop — true when uvMode=true + gpuTier="mid"
# Test: needsAlwaysFrameloop — true when transitioning=true (any tier)
```

---

## T2: Tailwind Semantic Tokens + Fonts + PWA Manifest

### Unit Tests (Vitest)

```
# Test: palette defines all 11 base tokens (void through felt-white including accent-text)
# Test: accent-text token value is #B94FFF (contrast-safe)
# Test: semantic mappings — surface maps to void, surface-raised maps to deep-space, etc.

# Test: font-display token maps to "Orbitron"
# Test: font-body token maps to "Inter"
# Test: font-mono token maps to "JetBrains Mono"
```

### Manual Verification (not automated)
```
# Verify: WOFF2 font files present in public/fonts/ for all weights
# Verify: @font-face declarations have font-display: swap
# Verify: PWA manifest theme_color is #07071A
# Verify: PWA manifest background_color is #07071A
# Verify: PWA manifest name is "GOLF FORGE"
# Verify: PWA manifest short_name is "FORGE"
# Verify: Tailwind default colors (bg-red-500, bg-amber-500, etc.) still work after @theme additions
```

---

## T3: Dark Theme Conversion + Branding

### Unit Tests (Vitest)

```
# Test: no remaining bg-white classes in src/ (grep verification)
# Test: no remaining bg-gray-50/100/200 classes in src/ (light-only classes)
# Test: no remaining text-gray-900/800/700 classes in src/ (light-only text)
# Test: no remaining uvMode ternaries in UI components (Toolbar, BottomToolbar, SidebarPanel, etc.)
# Test: 3D component files still allowed to have uvMode ternaries (HallFloor, HallWalls, etc.)
```

### Visual Tests (Playwright — T12)
```
# Screenshot: dark theme sidebar (Holes tab)
# Screenshot: dark theme toolbar with GOLF FORGE branding
# Screenshot: dark theme mobile bottom toolbar
# Screenshot: dark theme settings modal
```

---

## T4: High-Contrast Data Panels

### Unit Tests (Vitest)

```
# Test: BudgetPanel renders with neon-amber text class for financial figures
# Test: CostPanel renders with neon-amber text class for cost data
# Test: data panel containers use deep-space background class
```

### Visual Tests (Playwright — T12)
```
# Screenshot: BudgetPanel with amber-on-dark styling
# Screenshot: CostPanel with financial data display
# Screenshot: expense table in JetBrains Mono
```

---

## T5: Environment + SoftShadows + Fog + Canvas GL

### Unit Tests (Vitest)

```
# Test: fog gating — enabled when uvMode=true AND view="3d"
# Test: fog gating — disabled when uvMode=true AND view="top-down"
# Test: fog gating — disabled when uvMode=false (any view)

# Test: frameloop derived state — "demand" when uvMode=false
# Test: frameloop derived state — "demand" when uvMode=true + gpuTier="low"
# Test: frameloop derived state — "always" when uvMode=true + gpuTier="mid"
# Test: frameloop derived state — "always" when uvMode=true + gpuTier="high"
# Test: frameloop derived state — "always" when transitioning=true (any tier)

# Test: SoftShadows gating — enabled for mid tier
# Test: SoftShadows gating — enabled for high tier
# Test: SoftShadows gating — disabled for low tier
```

### Manual Verification
```
# Verify: Canvas gl prop includes powerPreference: "high-performance"
# Verify: Environment component renders with background={false}
# Verify: Stats component only visible in dev mode (import.meta.env.DEV)
```

---

## T6: PostProcessing + Sparkles + Effects

### Unit Tests (Vitest)

```
# Test: effect stack includes Bloom at all tiers
# Test: effect stack includes Vignette at all tiers
# Test: effect stack includes ToneMapping at all tiers
# Test: effect stack includes ChromaticAberration at mid+ only
# Test: effect stack includes N8AO at high only
# Test: effect stack includes GodRays at high only (when lampRef available)
# Test: effect stack excludes GodRays when godRaysLampRef is null

# Test: Sparkles gating — enabled for mid tier + uvMode
# Test: Sparkles gating — enabled for high tier + uvMode
# Test: Sparkles gating — disabled for low tier
# Test: Sparkles gating — disabled when uvMode=false

# Test: bloom luminanceThreshold is 0.8 (not 0.2)
# Test: UV_EMISSIVE_INTENSITY constant is 2.0 (not 0.8)
# Test: EffectComposer multisampling is 0
```

---

## T7: MeshReflectorMaterial

### Unit Tests (Vitest)

```
# Test: reflector gating — enabled when uvMode=true + view="3d" + gpuTier="mid"
# Test: reflector gating — enabled when uvMode=true + view="3d" + gpuTier="high"
# Test: reflector gating — disabled when view="top-down" (any tier)
# Test: reflector gating — disabled when uvMode=false (any view)
# Test: reflector gating — disabled when gpuTier="low" (any state)

# Test: reflector resolution — 256 for mid tier
# Test: reflector resolution — 512 for high tier

# Test: PerformanceMonitor degradation — disabled when performance.current < 0.5
```

---

## T8: Enhanced UV Lighting

### Unit Tests (Vitest)

```
# Test: UV lamp positions array has 4 entries
# Test: UV lamp positions match expected coordinates [(2.5,4.3,5), (7.5,4.3,5), (2.5,4.3,15), (7.5,4.3,15)]
# Test: UV lamp color is #8800FF
# Test: UV lamp intensity is 0.8
# Test: UV lamp dimensions — width 0.3, height 2

# Test: lamp fixture visibility — visible when view="3d"
# Test: lamp fixture visibility — hidden when view="top-down"
# Test: lamp fixture has NO transparent/depthWrite props (those belong to GodRaysSource)
```

---

## T9: GodRays

### Unit Tests (Vitest)

```
# Test: GodRaysSource renders only when gpuTier="high" AND uvMode=true
# Test: GodRaysSource not rendered when gpuTier="mid" (even if uvMode=true)
# Test: GodRaysSource not rendered when uvMode=false (even if gpuTier="high")

# Test: GodRaysSource meshes have transparent=true
# Test: GodRaysSource meshes have depthWrite=false
# Test: GodRaysSource positions co-locate with UV lamp positions

# Test: godRaysLampRef in Zustand store — null when GodRaysSource not mounted
# Test: godRaysLampRef in Zustand store — set to mesh ref when GodRaysSource mounted

# Test: PostProcessing skips GodRays effect when godRaysLampRef is null
```

---

## T10: UV "Lights Out" Transition

### Unit Tests (Vitest)

```
# Test: transitioning state — starts false
# Test: transitioning state — set to true when UV toggle fires
# Test: transitioning state — set back to false after transition completes

# Test: double-click guard — UV toggle ignored when transitioning=true
# Test: double-click guard — UV toggle accepted when transitioning=false

# Test: uvMode flip — does NOT happen at t=0 (happens at t=800ms behind overlay)
# Test: transition phases — 4 phases with correct timing boundaries (0, 800, 1400, 2400ms)

# Test: animation disable setting — when off, uvMode flips instantly (no transition)
# Test: animation disable setting — transitioning is never set to true when animation disabled

# Test: Canvas pointer-events — "none" during transition
# Test: Canvas pointer-events — restored to "auto" after transition completes
```

---

## T11: Performance Fixes

### Unit Tests (Vitest)

```
# Test: HallWalls planning material is a module-level singleton (same reference across calls)
# Test: HallWalls UV material is a module-level singleton (same reference across calls)
# Test: HallWalls planning material !== UV material (different instances)
# Test: HallWalls material selection — planning material when uvMode=false
# Test: HallWalls material selection — UV material when uvMode=true

# Test: mobile shadow type — shadows={true} (not "soft") on mobile viewport
# Test: desktop shadow type — shadows="soft" on desktop viewport
```

---

## T12: Visual Regression Test Suite

### Playwright Tests (new test runner, separate from Vitest)

```
# Screenshot test: planning mode, top-down orthographic view
# Screenshot test: planning mode, 3D perspective view
# Screenshot test: UV mode, top-down view (fog should NOT be visible)
# Screenshot test: UV mode, 3D perspective view (fog, reflections, sparkles visible)

# Screenshot test: dark theme sidebar — Holes tab
# Screenshot test: dark theme sidebar — Budget tab with amber financial data
# Screenshot test: dark theme sidebar — Cost tab with amber cost data
# Screenshot test: dark theme toolbar with GOLF FORGE branding

# Screenshot test: settings modal (GPU tier dropdown visible)
# Screenshot test: mobile bottom toolbar (dark theme)

# Threshold: 0.1% pixel diff tolerance
# Run command: npx playwright test (separate from vitest)
```

### Setup Tests (self-validating)
```
# Test: Playwright config exists and is valid
# Test: screenshot baseline directory exists
# Test: all test states accessible (app loads, navigation works)
```
