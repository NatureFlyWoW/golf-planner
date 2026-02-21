# Phase 11A Research: Visual Identity & Rendering

## Codebase Analysis

### R3F Canvas Configuration
- **Canvas props**: `dpr={isMobile ? [1, 1.5] : [1, 2]}`, `frameloop="demand"`, `shadows={!uvMode ? "soft" : undefined}`, `gl={{ antialias: !isMobile, preserveDrawingBuffer: true }}`
- Lazy-loaded: `ThreeCanvas = lazy(() => import("./components/three/ThreeCanvas"))`
- Single Canvas instance with conditional scene graph

### Current Post-Processing (UVPostProcessing.tsx)
- **Bloom**: intensity 0.7 (mobile) / 1.2 (desktop), luminanceThreshold 0.2, mipmapBlur, SMALL/LARGE kernel
- **Vignette**: offset 0.3, darkness 0.8
- Only active when `uvMode === true`, lazy-loaded via UVEffects.tsx
- Uses `@react-three/postprocessing` EffectComposer

### Material System
- **Planning mode**: MeshStandardMaterial with PBR props per materialProfile (budget_diy/standard_diy/semi_pro)
- **UV mode**: Module-level singletons with emissive colors (green felt #00FF66, cyan bumpers #00CCFF, yellow tees #FFFF00, orange cups #FF6600), all at emissiveIntensity 0.8
- `useMaterials()` hook returns MaterialSet based on mode + profile
- Planning materials created in useMemo, disposed on unmount; UV materials are persistent singletons

### Lighting
- **Ambient**: white 0.8 (planning) / purple #220044 0.3 (UV)
- **Directional**: Sun-tracked via suncalc (planning) / static purple #6600CC 0.4 (UV)
- Shadow maps: 1024×1024 desktop, 512×512 mobile, ortho camera covers 24×40 units
- Shadows disabled entirely in UV mode
- No point lights, area lights, or environment lighting

### Hall Rendering
- **Floor**: PlaneGeometry 10×20m, MeshStandardMaterial, #E0E0E0 (planning) / #0A0A1A (UV), receiveShadow
- **Walls**: 4 BoxGeometry meshes, MeshStandardMaterial, #B0B0B0 (planning) / #1A1A2E (UV), no shadows
- New materials created every render in HallWalls (performance issue noted in design)

### Tailwind CSS v4 Configuration
- **Version**: 4.2.0 with @tailwindcss/vite 4.2.0
- **No tailwind.config** — uses Vite plugin with defaults
- **No custom theme extensions** — all standard utility classes
- CSS: `@import "tailwindcss"` + `overscroll-behavior: none`

### Zustand State
- `uvMode: boolean` in UIState (ephemeral, not persisted)
- `toggleUvMode()` action flips the boolean
- `view: ViewMode` controls camera (top-down / 3D)
- `isMobile` computed at import time via utility (not in store)

### Dependencies
- @react-three/fiber 9.5.0, three 0.183.0, @react-three/drei 10.7.7
- @react-three/postprocessing 3.0.4, postprocessing (transitive)
- React 19.2.0, Zustand 5.0.11, Tailwind 4.2.0

### Testing
- Vitest 4.0.18 with jsdom, 229 tests passing across 20 files
- Tests cover: placement math, collision, snap, store migrations, segment specs, keyboard, sun position
- **No 3D component tests** — only utility/logic tests
- No @testing-library/react in dependencies

### 3D Component Structure (18 files)
ThreeCanvas.tsx → CameraControls, FloorGrid, Hall (Floor+Walls+Openings), PlacedHoles (MiniGolfHole→HoleModel), FlowPath, SunIndicator, UVEffects, ScreenshotCapture

---

## Web Research: Best Practices

### 1. GPU Tier Detection

**Recommended: `@pmndrs/detect-gpu`**
- Classifies GPUs into tiers 0-3 based on benchmark FPS scores (not just feature detection)
- Async: `const gpuTier = await getGPUTier()` → `{ tier: 2, isMobile: false, fps: 45, gpu: "..." }`
- Tier 0: <15fps (no WebGL), Tier 1: ≥15fps, Tier 2: ≥30fps, Tier 3: ≥60fps
- ~200KB benchmark data from CDN
- Same ecosystem as R3F/drei

**Supplementary: WebGL capabilities**
- `renderer.capabilities`: maxTextures, maxTextureSize, precision
- WEBGL_debug_renderer_info for GPU name (blocked by Firefox privacy settings)
- Three.js exposes via `useThree(s => s.gl.capabilities)`

**Runtime adaptation: `PerformanceMonitor` from drei**
- `onIncline`/`onDecline` callbacks for dynamic DPR adjustment
- `performance.regress()` for movement regression (reduce quality during interaction)
- `performance.current` (0-1 factor) for conditional effect rendering

**Recommended mapping:**
| Tier | DPR | Postprocessing | Shadows | Reflections |
|------|-----|---------------|---------|-------------|
| 0 | 1.0 | None | Off | Off |
| 1 | 1.0 | Bloom only | Basic PCF | Off |
| 2 | 1.5 | Bloom + Vignette + CA | PCF Soft 512 | Low-res 256 |
| 3 | 2.0 | Full stack | PCF Soft 2048 | Full 512 |

### 2. Postprocessing Effect Stack

**Canonical ordering (by attribute priority):**
1. SMAA (anti-aliasing)
2. SSR (screen-space reflections)
3. SSAO / N8AO (ambient occlusion — requires depth)
4. Depth of Field
5. Chromatic Aberration (UV transform)
6. Bloom (luminance-based convolution)
7. God Rays (light scattering)
8. Vignette (simple color)
9. Tone Mapping (MUST be last — HDR→display)
10. Noise / Film Grain (final overlay)

**Effect merging**: Library merges compatible effects into single shader pass (Color+Color ✓, UV+Color ✓, Convolution+Convolution ✗)

**Bloom best practices:**
- Use `mipmapBlur={true}` — faster than Kawase, smoother halos
- `luminanceThreshold={0.8-1.0}` — only emissive surfaces bloom
- Selective bloom: `emissiveIntensity: 2.0` + `toneMapped={false}` makes objects glow
- Set `renderer.toneMapping = NoToneMapping` when using ToneMapping effect (avoid double)

**GodRays:**
- Requires mesh ref as light source: `<GodRays sun={meshRef} samples={30} blur />`
- Source mesh must not write depth, be flagged transparent
- Disappears when source off-screen — consider `three-good-godrays` for screen-space alternative

**N8AO preferred over SSAO**: Quality presets (performance/low/medium/high/ultra), `halfRes` option, better visual results at lower cost

**Performance costs**: Vignette/Noise (very low) < ChromaticAberration (low) < ToneMapping (low) < Bloom (medium) < GodRays (medium-high) < SSAO (high)

### 3. MeshReflectorMaterial + Environment

**MeshReflectorMaterial:**
- Extends MeshStandardMaterial, renders scene to off-screen buffer
- `resolution` is primary perf knob: 256 (fast), 512 (balanced), 1024 (quality)
- Each frame renders scene twice (double render cost)
- `blur={[300, 100]}` adds reflection blur; `[0, 0]` skips blur pass
- Disable on tier 0-1; use movement regression on tier 2

**Environment presets:**
- `warehouse` — industrial, even lighting (good for indoor venue)
- `night` — dark, subtle (good base for UV mode)
- Presets download from CDN; for production, serve HDR locally via `files` prop
- All PBR materials automatically receive env map when Environment present
- `environmentIntensity` < 1.0 prevents IBL from washing out directional lights

**For blacklight venue:**
- Use `night` preset with very low `environmentIntensity` (~0.1-0.2)
- Or create custom dark Environment with Lightformer children
- Add RectAreaLight for UV tubes (doesn't cast shadows)

### 4. Tailwind v4 Dark Theme + Semantic Tokens

**@theme directive replaces tailwind.config.js:**
```css
@theme {
  --color-*: initial;  /* Remove ALL default colors */
  --color-surface: oklch(0.12 0.01 270);
  --color-accent: oklch(0.65 0.28 295);
}
```
- Generates CSS custom properties AND utility classes simultaneously
- `bg-surface`, `text-accent` etc. auto-generated from `--color-*` namespace

**Dark-only app strategy:**
- Define dark palette directly in @theme — no `dark:` variants needed
- Use `--color-*: initial` to drop entire default Tailwind palette
- Use OKLCH for perceptually uniform color steps

**Three-layer token architecture:**
1. Base tokens (raw OKLCH values)
2. Semantic tokens (purpose: surface, text, accent, border)
3. Component tokens (variant-specific)

**Use `@theme inline`** when semantic tokens reference other variables (ensures resolution)

**Font namespaces:**
```css
@theme {
  --font-display: "Orbitron", sans-serif;
  --font-body: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```
→ `font-display`, `font-body`, `font-mono` utilities
