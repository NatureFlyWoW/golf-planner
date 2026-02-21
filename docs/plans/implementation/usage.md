# Phase 11A — GOLF FORGE Visual Rendering Overhaul: Usage Guide

## Quick Start

```bash
cd golf-planner
npm run dev        # Start dev server at http://localhost:5173
npm test           # Run 377 unit tests (Vitest)
npm run test:visual # Run 10 visual regression tests (Playwright)
```

## What Was Built

Phase 11A transformed the GOLF FORGE planner from a plain wireframe tool into an immersive, themed 3D experience. All 12 sections are implemented across 12 commits.

### Key Features

**GPU Tier System** (Section 01)
- Auto-detects GPU capability (low/mid/high) on first load
- Controls which effects are enabled (fog, bloom, soft shadows, reflections, god rays)
- Manual override in settings: `Budget tab → Settings → GPU Tier`
- Persisted in localStorage (store v8)

**Dark Theme** (Sections 02-04)
- Full dark theme with `--void` (#07071A) background
- Self-hosted Rajdhani + Orbitron fonts for GOLF FORGE branding
- High-contrast amber-on-dark data panels for financial figures
- Monospace financial figures with amber accent color

**3D Environment** (Section 05)
- HDR environment lighting (apartment preset)
- Fog in UV+3D mode only (exponential, gated by view mode)
- Frameloop optimization: `"demand"` when idle, `"always"` during UV/transitions
- DPR scaling based on GPU tier and mobile detection

**PostProcessing Effects** (Section 06)
- N8AO ambient occlusion (mid+ GPU)
- Bloom (UV mode only, neon-violet theme)
- Sparkles particle system (UV mode, high GPU)
- All effects gated by GPU tier

**Reflections** (Section 07)
- MeshReflectorMaterial on hall floor in UV+3D mode
- Mirror/blur/roughness parameters gated by GPU tier

**UV Lighting** (Section 08)
- 6 RectAreaLight UV lamps at ceiling positions
- Visible lamp fixture geometry (housing + lens)
- Neon-violet (#9D00FF) emission

**God Rays** (Section 09)
- Screen-space radial blur from UV lamp positions
- High GPU tier only, UV mode only
- GodRays postprocessing effect from @react-three/postprocessing

**UV Transition** (Section 10)
- 4-phase theatrical animation (flicker → darkness → reveal → complete)
- 2.4 second duration, rAF-driven DOM overlay
- Material swap hidden behind dark overlay at 800ms
- Can be disabled in settings for instant toggle
- Double-click guard prevents re-triggering during animation

**Performance** (Section 11)
- Module-level singleton MeshStandardMaterial in HallWalls
- Shadow type gated on GPU tier + mobile detection

**Visual Tests** (Section 12)
- 10 Playwright screenshot comparison tests
- Covers planning mode, UV mode, dark theme UI, mobile layout
- 8 baseline screenshots committed
- Run: `npm run test:visual`

## Store Changes

Store format bumped from v7 to v8:
- **v7→v8**: Adds `uvTransitionEnabled: true` (persisted)
- Existing v7 data auto-migrates on load

New persisted fields: `gpuTierOverride`, `uvTransitionEnabled`
New ephemeral state: `gpuTier`, `transitioning`, `godRaysLampRef`

## New Actions

| Action | Description |
|--------|-------------|
| `flipUvMode()` | Direct UV mode flip (used by transition overlay) |
| `setGpuTier(tier)` | Set detected GPU tier |
| `setGpuTierOverride(val)` | Set manual GPU tier override |
| `setTransitioning(bool)` | Set transition state |
| `setGodRaysLampRef(ref)` | Wire GodRays emissive mesh ref |
| `setUvTransitionEnabled(bool)` | Toggle transition animation |

## File Structure (New)

```
src/
  components/three/
    GodRaysSource.tsx        # Emissive spheres for GodRays effect
    UVLamps.tsx              # RectAreaLight fixtures
    UVTransition.tsx         # DOM overlay transition
    PostProcessing.tsx       # (modified) N8AO + GodRays + Bloom
  constants/
    uvLamps.ts               # Lamp position constants
  hooks/
    useGpuTier.ts            # GPU detection hook
  theme/
    tokens.ts                # CSS custom property tokens
    fonts.css                # @font-face declarations
  utils/
    environmentGating.ts     # (modified) fog, frameloop, shadows, shadow type
    godraysConfig.ts         # GodRays configuration constants
    materialPresets.ts       # PBR material presets
    reflectionConfig.ts      # Reflection parameters
    uvTransitionConfig.ts    # Transition timing constants
tests/
  visual/
    golf-forge.spec.ts       # Playwright visual regression tests
    golf-forge.spec.ts-snapshots/  # Baseline screenshots
playwright.config.ts         # Playwright configuration
```

## Updating Visual Baselines

After making visual changes:
```bash
npx playwright test --update-snapshots
git add tests/visual/golf-forge.spec.ts-snapshots/
```
