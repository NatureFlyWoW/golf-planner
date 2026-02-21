# Phase 11A Spec: GOLF FORGE Visual Identity & Rendering

## Overview

Transform Golf Planner into **GOLF FORGE** — an immersive blacklight mini golf venue creation tool. The app becomes permanently dark-themed with a UV/blacklight aesthetic as its core visual identity. The UV toggle controls 3D scene lighting and post-processing effects, with a theatrical "Lights Out" transition between planning and UV modes.

## Current State

- React 19 + TypeScript + Vite + R3F 9.5.0 + Three.js 0.183.0
- @react-three/drei 10.7.7, @react-three/postprocessing 3.0.4
- Tailwind CSS 4.2.0 (Vite plugin, no custom theme config)
- Zustand 5.0.11 with temporal undo/redo
- 229 tests passing (Vitest + jsdom), no visual tests
- Canvas: `frameloop="demand"`, shadows soft (planning) / off (UV)
- Post-processing: Bloom + Vignette (UV mode only, lazy-loaded)
- Materials: MeshStandardMaterial with PBR presets (planning) / emissive singletons (UV)
- Lighting: ambient + single directional (sun-tracked in planning, static purple in UV)
- No Environment, no reflections, no GPU tier detection, no semantic theme tokens

## Requirements

### R1: GPU Tier Classifier
- Use `@pmndrs/detect-gpu` for benchmark-based tier classification
- 3 tiers: low (tier 0-1), mid (tier 2), high (tier 3)
- Cache result in localStorage, re-use on subsequent loads
- User-overridable in settings panel
- Store tier in Zustand UIState (ephemeral)
- Gates ALL visual effects — every 3D enhancement checks tier before rendering
- Supplement with drei `PerformanceMonitor` for runtime DPR adaptation

### R2: Tailwind Semantic Tokens (Blacklight Palette)
- Define via `@theme` directive in CSS (Tailwind v4 pattern)
- Use `--color-*: initial` to drop all default Tailwind colors
- OKLCH color space for perceptual uniformity
- Three-layer architecture: base tokens → semantic tokens → utilities
- Use `@theme inline` for variable references

**Blacklight palette (10 tokens):**
| Token | Hex | OKLCH (approx) | Role |
|-------|-----|----------------|------|
| void | #07071A | oklch(0.08 0.02 270) | Primary bg, canvas |
| deep-space | #0F0F2E | oklch(0.14 0.03 270) | Panels, sidebar, toolbar |
| plasma | #1A1A4A | oklch(0.20 0.04 270) | Cards, elevated surfaces |
| grid-ghost | #2A2A5E | oklch(0.28 0.05 270) | Borders, dividers |
| neon-violet | #9D00FF | oklch(0.55 0.30 295) | Primary accent, CTAs |
| neon-cyan | #00F5FF | oklch(0.85 0.15 200) | Data, flow path |
| neon-green | #00FF88 | oklch(0.85 0.20 155) | Success, valid placement |
| neon-amber | #FFB700 | oklch(0.82 0.18 85) | Warning, costs, par |
| neon-pink | #FF0090 | oklch(0.60 0.28 350) | Destructive, errors |
| felt-white | #E8E8FF | oklch(0.93 0.02 270) | Body text |

**Font tokens:**
- `--font-display`: "Orbitron", sans-serif (headings, GOLF FORGE brand)
- `--font-body`: "Inter", sans-serif (UI labels, body text)
- `--font-mono`: "JetBrains Mono", monospace (budget figures, data)
- All via Google Fonts with `font-display: swap`

### R3: Dark Theme Conversion
- **Big-bang approach**: define tokens, then find-and-replace ALL Tailwind color classes
- Single dark theme — no light mode, no toggle
- Every component converted: sidebar, toolbar, panels, modals, hole drawer, builder
- Data panels: amber (#FFB700) on deep-space (#0F0F2E) at 14px JetBrains Mono (9.2:1 WCAG AAA)
- Lucide React icons (stroke 1.5px) replace any Unicode characters

### R4: GOLF FORGE Branding
- Orbitron font for "GOLF FORGE" brand mark in toolbar/header
- Neon Violet (#9D00FF) primary accent for the brand
- Official app name throughout all UI text

### R5: 3D Environment + Atmosphere
- `<Environment preset="night">` with low `environmentIntensity` (~0.1-0.2) as base
- Custom `<Lightformer>` children modeling UV tube layout baked into cubemap
- `<SoftShadows size={25} samples={10} />` — PCSS soft shadow edges (mid+high tier only)
- `fogExp2` replacing linear fog: density ~0.04
- `powerPreference: "high-performance"` on Canvas gl prop

### R6: Enhanced Post-Processing
- **Effect stack order**: N8AO → Bloom → ChromaticAberration → Vignette → ToneMapping (ACES Filmic)
- GodRays added for high tier (separate from main stack due to mesh ref requirement)
- **Selective bloom**: emissiveIntensity 2.0 + luminanceThreshold 0.8 (only neon surfaces glow)
- Bloom: mipmapBlur, intensity ~0.6-1.0 based on tier
- ChromaticAberration: offset [0.0015, 0.0015] (mid+high tier)
- ToneMapping: ACES_FILMIC (always last, disable renderer.toneMapping to avoid double)
- `<Sparkles count={400} color="#9D00FF" size={2} />` — floating UV dust (mid+high tier)
- N8AO: quality "medium", halfRes (high tier only)
- Conditional rendering based on GPU tier + PerformanceMonitor factor

### R7: MeshReflectorMaterial
- Hall floor in UV mode gets reflective surface
- View-gated: only in 3D perspective view (`view === "3d"`)
- Tier-gated: mid+ tier only
- resolution: 256 (mid) / 512 (high)
- blur: [200, 100], mirror: 0, color: dark
- Falls back to standard MeshStandardMaterial on low tier / top-down view

### R8: Enhanced UV Lighting
- 4× RectAreaLight at ceiling positions (color #8800FF, intensity 0.8)
- Requires `RectAreaLightUniformsLib.init()`
- UV lamp fixture geometry visible only in 3D perspective view (hidden in top-down)
- Simple tube/strip models for visual realism
- HDR emissive strategy: base #000000 + emissiveIntensity 2.0 + bloom threshold 0.8

### R9: GodRays
- 2-3 ceiling lamp positions as light sources (mesh refs for GodRays effect)
- High tier only
- Samples: ~30-60, blur enabled
- Light source meshes: transparent, no depth write
- Uses same UV lamp fixtures as R8

### R10: UV "Lights Out" Transition
- **High priority** — the theatrical transition IS the experience
- 2.4-second sequence:
  1. Phase 1 (0-800ms): Flicker — canvas opacity pulses (UV tubes warming up)
  2. Phase 2 (800-1400ms): Darkness — fade to near-black, UI dims to 20%
  3. Phase 3 (1400-2400ms): Neon awakening — UV materials fade in, bloom ramps 0→1.2
  4. Phase 4: Full UV mode
- Pure CSS transitions masking instant material swap
- `frameloop` switches to "always" during animation, back to "demand" after
- UV button pulses with neon glow after transition
- User setting to disable animation (instant toggle fallback)

### R11: Performance Fixes
- `powerPreference: "high-performance"` on Canvas gl prop
- Fix HallWalls.tsx: create materials once (module-level singletons), not every render
- Mobile shadow type: `true` instead of `"soft"` — 40% cheaper
- `multisampling={0}` on EffectComposer (MSAA redundant with postprocessing AA)

### R12: Visual Regression Testing
- Playwright-based screenshot comparison tests
- Test key visual states: planning mode, UV mode, UV transition, 3D view reflections
- Add to CI pipeline alongside existing Vitest tests

## Architecture Decisions

1. **Single dark theme** — no light mode, no dual maintenance
2. **GPU tier classifier as foundation** — gates ALL effects
3. **detect-gpu + localStorage cache** — detect once, override in settings
4. **View-gated MeshReflectorMaterial** — 3D perspective only (zero cost in top-down)
5. **HDR emissive + selective bloom** — emissiveIntensity 2.0 + threshold 0.8
6. **RectAreaLight for UV tubes** — does NOT cast shadows, keep directional for shadows
7. **UV transition on frameloop toggle** — "always" during 2.4s animation, "demand" after
8. **Big-bang dark theme conversion** — tokens first, then global find-and-replace
9. **UV lamp fixtures visible in 3D only** — hidden in top-down to avoid ceiling clutter
10. **N8AO over SSAO** — better quality at lower cost with halfRes

## Dependencies (No New Packages Except)
- `detect-gpu` — GPU benchmark classification (~5KB + 200KB CDN data, cached)
- Google Fonts (Orbitron, Inter, JetBrains Mono) — loaded via `<link>` or @font-face
- All other features use existing R3F/drei/postprocessing packages

## Task Dependency Graph
```
T1 (GPU Tier) ─────┬──── T6 (Environment) ──── T7 (Sparkles/CA/ToneMap)
                    │                      ├──── T8 (Reflective Floor)
                    │                      └──── T9 (UV Lighting) ──── T10 (GodRays)
                    │                                              └──── T11 (Lights Out)
                    └──── T12 (Perf Fixes)
T2 (Tokens) ────────┬──── T3 (Dark Theme) ──── T5 (Data Panels)
                    └──── T4 (Fonts/Brand)
T12 (Visual Regression Tests) — can start after T3
```
