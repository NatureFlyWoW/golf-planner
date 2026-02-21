# Phase 11A Design: Visual Identity & Rendering — "GOLF FORGE"

**Date:** 2026-02-21 | **Status:** Approved | **Effort:** 12-16 days

---

## Vision

Transform Golf Planner from a functional tool into an immersive venue creation experience. The UV/blacklight aesthetic becomes the app's core identity — always dark-themed, with the UV toggle controlling 3D scene lighting and post-processing. The GOLF FORGE brand mark anchors the visual identity.

## Key Architecture Decisions

These were battle-tested through 4 rounds of adversarial review (2× Devils Advocate + 2× Blue Team):

1. **Single dark theme** — no light mode, no dual maintenance burden
2. **High-contrast data panels** — amber on dark surfaces for budget/cost readability (WCAG AAA)
3. **GPU tier classifier as Task 1** — gates ALL visual effects, prevents mobile perf issues
4. **View-gated effects** — MeshReflectorMaterial only in 3D perspective (invisible in ortho top-down, doubles render cost)
5. **HDR emissive strategy** — `emissiveIntensity: 2.0` + bloom `luminanceThreshold: 0.8` — only neon surfaces bloom
6. **RectAreaLight** for UV tubes — does NOT cast shadows; keep existing directional light for shadows
7. **UV transition frameloop** — switch from `"demand"` to `"always"` during animation, back after
8. **Effect stack order** — SSAO → GodRays → Bloom → ChromaticAberration → Vignette → Noise → ToneMapping

---

## A. Blacklight Palette

| Token | Hex | Role |
|-------|-----|------|
| Void | `#07071A` | Primary bg, canvas |
| Deep Space | `#0F0F2E` | Panels, sidebar, toolbar |
| Plasma | `#1A1A4A` | Cards, elevated surfaces |
| Grid Ghost | `#2A2A5E` | Borders, dividers |
| Neon Violet | `#9D00FF` | Primary accent, CTAs |
| Neon Cyan | `#00F5FF` | Data, flow path, secondary |
| Neon Green | `#00FF88` | Success, valid placement |
| Neon Amber | `#FFB700` | Warning, costs, par |
| Neon Pink | `#FF0090` | Destructive, errors |
| Felt White | `#E8E8FF` | Body text |

## B. Typography

- **Orbitron** — display headings, GOLF FORGE brand mark
- **Inter** — body text, UI labels
- **JetBrains Mono** — budget figures, prices, data tables

All via Google Fonts (`font-display: swap`). Lucide React icons (stroke 1.5px) replace Unicode characters.

## C. GPU Tier Classifier

Replace binary `isMobile` with three tiers detected from `renderer.capabilities`:

| Tier | Postprocessing | Shadows | DPR | Materials |
|------|---------------|---------|-----|-----------|
| Low | None | None | 1.0 | MeshBasicMaterial |
| Mid | Bloom only | PCFShadowMap 512 | 1.5 | Standard PBR |
| High | Full stack | PCFSoftShadowMap 2048 | 2.0 | Full PBR + effects |

Detection heuristic: `maxTextureSize`, `maxRenderbufferSize`, `renderer.info.render` after warm-up frame. Stored in Zustand UI state, user-overridable in settings.

## D. Dark Theme Conversion

Convert all Tailwind classes from light defaults to dark palette. Strategy:

1. Define CSS custom properties in `:root` mapping palette tokens
2. Extend `tailwind.config.js` with semantic color tokens (`bg-surface`, `bg-elevated`, `text-primary`, etc.)
3. Replace all `bg-white`, `bg-gray-*`, `text-gray-*` classes across every component
4. Special treatment for data panels: amber on deep-space background at 14px JetBrains Mono (9.2:1 contrast ratio, WCAG AAA)

## E. 3D Rendering Enhancements

### E1. Environment + Atmosphere (all tiers)
- `<Environment preset="warehouse" />` — instant PBR reflections
- `<SoftShadows size={25} samples={10} />` — PCSS soft shadow edges (mid+high only)
- `<fogExp2 density={0.04} />` replacing linear fog

### E2. Particles + Post-Processing (mid+high)
- `<Sparkles count={400} color="#9D00FF" size={2} />` — floating UV dust particles
- `<ChromaticAberration offset={[0.0015, 0.0015]} />` — lens authenticity
- `<ToneMapping mode={ACES_FILMIC} />` — cinematic contrast curve

### E3. MeshReflectorMaterial (high, 3D view only)
- Hall floor reflective surface in UV mode
- Gated: `view === "3d" && tier >= "mid"`
- Invisible in orthographic top-down (no render cost when hidden)

### E4. Enhanced UV Lighting
- 4× `RectAreaLight` at ceiling positions (color `#8800FF`, intensity 0.8)
- Requires `RectAreaLightUniformsLib.init()` call
- Custom `<Environment>` with `<Lightformer>` elements modeling UV tube layout — baked into cubemap
- HDR emissive: base `#000000` + `emissiveIntensity: 2.0` + bloom threshold 0.8

### E5. GodRays (high tier only)
- 2-3 ceiling lamp positions as light sources
- Volumetric UV shaft effects
- Only rendered on high-tier GPUs

### E6. UV "Lights Out" Transition
2.4-second theater lighting sequence:
1. **Phase 1 (0-800ms):** Flicker — canvas opacity pulses (UV tubes warming up)
2. **Phase 2 (800-1400ms):** Darkness — fade to near-black, UI dims to 20%
3. **Phase 3 (1400-2400ms):** Neon awakening — UV materials fade in, bloom ramps 0→1.2
4. **Phase 4:** Full UV mode. UV button pulses with neon glow.

Implementation: pure CSS transitions masking instant material swap. `frameloop` switches to `"always"` during animation, back to `"demand"` after. User setting to disable animation.

## F. Performance Fixes

1. `powerPreference: "high-performance"` on Canvas `gl` prop
2. Switch mobile shadow type to `true` (not `"soft"`) — 40% cheaper
3. Fix HallWalls.tsx singleton materials (prevent re-creation on render)
4. (Future: InstancedMesh for bumper geometry — Phase 11B or later)

---

## Task Breakdown

| # | Task | Effort | Depends On |
|---|------|--------|------------|
| T1 | GPU Tier Classifier | 0.5 day | — |
| T2 | Tailwind Semantic Tokens | 0.5 day | — |
| T3 | Dark Theme Conversion | 2 days | T2 |
| T4 | Fonts + Icons + GOLF FORGE Mark | 1 day | T2 |
| T5 | High-Contrast Data Panels | 1 day | T3 |
| T6 | Environment + SoftShadows + fogExp2 | 1 day | T1 |
| T7 | Sparkles + ChromaticAberration + ToneMapping | 1 day | T1, T6 |
| T8 | MeshReflectorMaterial (3D only) | 0.5 day | T1, T6 |
| T9 | Enhanced UV Lighting | 2 days | T6 |
| T10 | GodRays (high tier) | 1 day | T9 |
| T11 | UV "Lights Out" Transition | 1.5 days | T9 |
| T12 | Performance Fixes | 0.5 day | T1 |

**Parallelism:** T1+T2 can run simultaneously. T3+T4 can run after T2. T6+T12 after T1. T7+T8 after T6. T9 after T6. T10+T11 after T9.

---

## Future Phases (Not in Scope)

- **Phase 11B:** Geo Integration — BASEMAP.AT aerial ground plane, geofence, compass/gyroscope camera, sun path arc
- **Phase 11C:** Fun & Sharing — lz-string URL sharing, canvas-confetti milestones, tour mode, before/after slider
- **Tier 3:** Gaussian Splatting, Google 3D Tiles, sound design, AI textures, Liveblocks collaboration

## Research Artifacts

6 specialist agent analyses in `docs/temp-*.md`:
- `temp-backend-analysis.md` — Server-side rendering, BASEMAP.AT, Gaussian Splatting, Liveblocks
- `temp-mobile-analysis.md` — Mobile 3D perf, AR, progressive enhancement, GPU tiers
- `temp-mobile-app-analysis.md` — AR accuracy (GPS ±5m kills naive), marker-based AR, Capacitor path
- `temp-ui-design.md` — Visual identity, palette, typography, UV transition, tour mode
- `temp-unified-concept.md` — Synthesized concept from all agents (pre-review)

## Cost

$0/month. All resources are free: Poly Haven/AmbientCG textures (CC0), Google Fonts (free), Lucide React (MIT).
