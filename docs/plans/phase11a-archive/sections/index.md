<!-- PROJECT_CONFIG
runtime: typescript-npm
test_command: npm test
END_PROJECT_CONFIG -->

<!-- SECTION_MANIFEST
section-01-gpu-tier
section-02-theme-tokens
section-03-dark-theme
section-04-data-panels
section-05-environment
section-06-postprocessing
section-07-reflections
section-08-uv-lighting
section-09-godrays
section-10-uv-transition
section-11-perf-fixes
section-12-visual-tests
END_MANIFEST -->

# Phase 11A Implementation Sections Index

## Dependency Graph

| Section | Depends On | Blocks | Parallelizable With |
|---------|------------|--------|---------------------|
| section-01-gpu-tier | - | 05, 06, 07, 08, 09, 10, 11 | 02 |
| section-02-theme-tokens | - | 03, 04 | 01 |
| section-03-dark-theme | 02 | 04 | - |
| section-04-data-panels | 03 | 12 | - |
| section-05-environment | 01 | 06, 07, 08 | - |
| section-06-postprocessing | 05 | 09, 12 | 07, 08 |
| section-07-reflections | 05 | 12 | 06, 08 |
| section-08-uv-lighting | 05 | 09, 10 | 06, 07 |
| section-09-godrays | 06, 08 | 12 | 10 |
| section-10-uv-transition | 08 | 12 | 09 |
| section-11-perf-fixes | 01 | 12 | 03, 04, 05+ |
| section-12-visual-tests | ALL (01-11) | - | - |

## Execution Order (Batches)

1. **Batch 1** (parallel): section-01-gpu-tier, section-02-theme-tokens
2. **Batch 2** (after 02): section-03-dark-theme
3. **Batch 3** (parallel, after 01+03): section-04-data-panels, section-05-environment, section-11-perf-fixes
4. **Batch 4** (parallel, after 05): section-06-postprocessing, section-07-reflections, section-08-uv-lighting
5. **Batch 5** (parallel, after 06+08): section-09-godrays, section-10-uv-transition
6. **Batch 6** (after ALL): section-12-visual-tests

## Section Summaries

### section-01-gpu-tier
GPU tier detection with `@pmndrs/detect-gpu`, three-tier classification (low/mid/high), localStorage caching, Zustand state integration (`gpuTier` ephemeral + `gpuTierOverride` persisted), store v7 migration, PerformanceMonitor integration, version pinning for Three.js ecosystem, first-load "default to low" fallback.

**Plan task**: T1 | **TDD section**: T1

### section-02-theme-tokens
Tailwind v4 `@theme` block with 11-token blacklight palette (additive, preserving defaults), semantic color mappings, contrast-safe `accent-text` token (#B94FFF), font tokens, self-hosted WOFF2 fonts in `public/fonts/`, `@font-face` declarations, PWA manifest update (theme_color, background_color, name, short_name).

**Plan task**: T2 | **TDD section**: T2

### section-03-dark-theme
Big-bang Tailwind class replacement across all UI components (bg-white → bg-surface, etc.), `uvMode ?` ternary removal in UI components (keep 3D material ternaries), GOLF FORGE brand mark in toolbar (Orbitron Bold, accent-text with neon-violet glow), Lucide icon audit.

**Plan task**: T3 | **TDD section**: T3

### section-04-data-panels
High-contrast amber-on-dark styling for BudgetPanel, CostPanel, expense tables. JetBrains Mono for financial figures. WCAG AAA contrast verification (9.2:1 on void, 7.7:1 on deep-space).

**Plan task**: T4 | **TDD section**: T4

### section-05-environment
drei `<Environment>` with night preset, custom `<Lightformer>` elements for UV tube reflections, `<SoftShadows>` (tier-gated), `<fogExp2>` (gated to UV mode + 3D perspective only), Canvas `powerPreference: "high-performance"`, frameloop strategy implementation (`needsAlwaysFrameloop` derived state), dev-only `<Stats />` FPS counter.

**Plan task**: T5 | **TDD section**: T5

### section-06-postprocessing
New `PostProcessing` component replacing `UVPostProcessing`, single `EffectComposer` with tier-aware effect stack (N8AO → GodRays → Bloom → ChromaticAberration → Vignette → ToneMapping), `multisampling={0}`, selective bloom (emissiveIntensity 2.0, threshold 0.8), `<Sparkles>` constrained to hall bounds, renderer `toneMapping = NoToneMapping`, max effects per tier policy.

**Plan task**: T6 | **TDD section**: T6

### section-07-reflections
Conditional `MeshReflectorMaterial` in HallFloor (gated: uvMode + 3D view + mid/high tier), tier-variable resolution (256 mid, 512 high), PerformanceMonitor degradation (disable at <0.5), fallback to standard MeshStandardMaterial.

**Plan task**: T7 | **TDD section**: T7

### section-08-uv-lighting
4x `RectAreaLight` at ceiling positions, verify RectAreaLightUniformsLib.init() necessity in Three.js 0.183, clean UV lamp fixture geometry (visible in 3D only, no GodRays-specific props), HDR emissive intensity update to 2.0.

**Plan task**: T8 | **TDD section**: T8

### section-09-godrays
Separate `GodRaysSource` component (decoupled from UV lamp fixtures), emissive sphere meshes at lamp positions, GodRays effect in single EffectComposer (high tier only), Zustand ref wiring (`godRaysLampRef`). Cut contingency: delete component + effect if integration fails.

**Plan task**: T9 | **TDD section**: T9

### section-10-uv-transition
`UVTransition` overlay component with 4-phase CSS animation (flicker → darkness → neon awakening → complete), `useRef` + `requestAnimationFrame` timing (not setTimeout), `performance.now()` elapsed time checks, Canvas `pointer-events: none` during transition, double-click guard, UV button pulse animation, settings toggle for animation disable.

**Plan task**: T10 | **TDD section**: T10

### section-11-perf-fixes
HallWalls module-level singleton materials (planning + UV, immutable), mobile shadow optimization (`shadows={true}` instead of `"soft"`).

**Plan task**: T11 | **TDD section**: T11

### section-12-visual-tests
Playwright screenshot comparison test suite for all key visual states (planning top-down, planning 3D, UV top-down, UV 3D with reflections, dark theme UI, data panels, branding). 0.1% pixel diff tolerance. Separate from Vitest.

**Plan task**: T12 | **TDD section**: T12
