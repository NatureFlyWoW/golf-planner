# Phase 11A Implementation Plan: GOLF FORGE Visual Identity & Rendering

## Context

Golf Planner is a React 19 + TypeScript indoor blacklight mini golf hall layout tool. It uses React Three Fiber (R3F) 9.5.0, Three.js 0.183.0, @react-three/drei 10.7.7, and @react-three/postprocessing 3.0.4 for 3D rendering, with Zustand 5.0.11 for state management and Tailwind CSS 4.2.0 for UI styling. The app runs as a static PWA with localStorage persistence.

Currently the app has a light gray UI theme with basic UV mode (emissive materials + bloom + vignette). Phase 11A transforms it into **GOLF FORGE** — a permanently dark-themed, blacklight-aesthetic venue creation experience with GPU-adaptive 3D effects and a theatrical UV transition.

**Version pinning**: For the duration of Phase 11A, pin exact versions (no `^` ranges) for `three`, `@react-three/fiber`, `@react-three/drei`, and `@react-three/postprocessing` in package.json. Three.js has a history of breaking changes between minor versions — lock the ecosystem to avoid mid-implementation breakage.

## Architecture

### GPU Tier System (Foundation)

All visual effects are gated by a three-tier GPU classification system. This is the foundational piece — nothing else can ship without it.

**Tier Detection**: Use `@pmndrs/detect-gpu` (async, benchmark-based). The library classifies GPUs into tiers 0-3 based on normalized FPS benchmarks. Map to three app tiers:

| App Tier | detect-gpu Tiers | Effects Budget |
|----------|-----------------|----------------|
| low | 0, 1 | Bloom + Vignette + ToneMapping, no shadows, DPR 1.0 |
| mid | 2 | + ChromaticAberration + SoftShadows + Sparkles, PCF shadows 512, DPR 1.5 |
| high | 3 | + N8AO + GodRays + Reflections, PCSS 2048, DPR 2.0 |

*Note: Vignette and ToneMapping are always-on baseline effects at all tiers. The max effects per tier policy (see Post-Processing section) counts optional effects only: low=0 optional, mid=3 optional (ChromaticAberration, Sparkles, SoftShadows†), high=6 optional (add N8AO, GodRays, Reflections). †SoftShadows is a drei scene feature, not a postprocessing effect — counted separately from the EffectComposer stack.*

**Caching**: Store detected tier in localStorage on first run. On subsequent loads, read from cache. Expose a user override in the settings panel (dropdown: Auto / Low / Mid / High).

**First-load fallback**: `@pmndrs/detect-gpu` is async (benchmark-based). While detection is in progress, default to `"low"` tier — this is safe on any GPU (Bloom only, no shadows, DPR 1.0). When detection completes (typically <500ms), upgrade if warranted. "Start low, upgrade" prevents a jarring first-load performance cliff on weak GPUs.

**State**: Three-field design:
- `gpuTier: "low" | "mid" | "high"` in Zustand UIState (ephemeral, runtime-computed)
- `transitioning: boolean` in Zustand UIState (ephemeral, NOT persisted — guards UV toggle and drives frameloop)
- `gpuTierOverride: "auto" | "low" | "mid" | "high"` in a new persisted settings field
- On app init: `gpuTier = gpuTierOverride === "auto" ? detectedTier : gpuTierOverride`
- Requires store version bump to v7 with migration (add `gpuTierOverride: "auto"` default)
- **Migration safety**: Wrap v7 migration in try/catch. On failure, fall back to field-level defaults (`gpuTierOverride: "auto"`) rather than corrupting the store. No full-store backup (localStorage bloat risk with 5MB limit). The migration only adds one field — corruption risk is near-zero.
- Update `partialize` to include `gpuTierOverride`

**Runtime adaptation**: Layer drei's `PerformanceMonitor` on top of static tier. Use `performance.regress()` during camera interaction. Use `performance.current` (0-1 factor) to conditionally disable expensive effects when FPS drops.

**Builder singleton**: The Hole Builder has its own R3F Canvas. The `useGpuTier` hook reads from Zustand (shared state), not re-detecting per Canvas. GPU detection runs once at app init.

### Frameloop Strategy

The app currently uses `frameloop="demand"` for battery/performance efficiency. Several Phase 11A features require continuous rendering:
- Sparkles animation (`speed={0.3}`)
- SoftShadows (PCSS requires continuous updates)
- MeshReflectorMaterial (reflection FBO updates)
- UV transition animation
- GodRays (temporal accumulation)

**Strategy**: Derive frameloop mode from state:
```
needsAlwaysFrameloop = transitioning || (uvMode && gpuTier !== "low")
frameloop = needsAlwaysFrameloop ? "always" : "demand"
```

When UV mode is active with mid/high tier effects, the frameloop stays `"always"`. When UV mode is off (planning mode), it returns to `"demand"`. Low-tier GPUs always use `"demand"` (they only get static Bloom + Vignette).

**Note**: This means UV mode on battery-powered devices will draw more power. This is acceptable for a venue planning tool (typically used plugged in).

### Tailwind v4 Theme System

**Token architecture** (three layers):

1. **Base tokens** — Hex color values in `@theme` block
2. **Semantic tokens** — Purpose-driven mappings (surface, text, accent, border) via `@theme inline`
3. **Utilities** — Auto-generated `bg-surface`, `text-accent`, `border-subtle` etc.

**Setup**: In `src/index.css`, add `@theme` block with the 11-token blacklight palette. **Do NOT use `--color-*: initial`** — this would break all existing Tailwind color utilities (bg-red-500, bg-amber-500, bg-blue-500, etc.) which are used in 71 places across 20 files (BudgetPanel progress bars, status indicators, etc.). Instead, define custom tokens additively alongside Tailwind defaults.

Add `--font-display`, `--font-body`, `--font-mono` for typography.

**Palette** (11 base tokens):
- void (#07071A) — primary bg
- deep-space (#0F0F2E) — panels
- plasma (#1A1A4A) — cards
- grid-ghost (#2A2A5E) — borders
- neon-violet (#9D00FF) — primary accent (decorative: borders, glows, icons ONLY)
- accent-text (#B94FFF) — contrast-safe accent for readable text (~5.2:1 on void)
- neon-cyan (#00F5FF) — data
- neon-green (#00FF88) — success
- neon-amber (#FFB700) — warning/costs
- neon-pink (#FF0090) — errors
- felt-white (#E8E8FF) — body text

**Contrast safety rule**: neon-violet (#9D00FF) is 3.1:1 on void — **fails WCAG AA for text**. NEVER use `text-accent` for readable body text. Use `text-accent-text` (#B94FFF, ~5.2:1) instead. neon-violet is restricted to decorative use: borders, box-shadows, glows, icon fills, and background accents where text is not overlaid.

**Verified contrast pairs** (on void #07071A):
- felt-white (#E8E8FF): 13.8:1 (AAA) — body text
- neon-amber (#FFB700): 9.2:1 (AAA) — financial data
- neon-green (#00FF88): 10.1:1 (AAA) — success
- neon-cyan (#00F5FF): 11.4:1 (AAA) — data
- accent-text (#B94FFF): ~5.2:1 (AA) — accented text
- neon-pink (#FF0090): 4.4:1 (AA large text only) — errors, use with felt-white text + pink bg/border instead
- grid-ghost (#2A2A5E): ~1.8:1 — borders only, never text

**Contrast on deep-space (#0F0F2E)** — used for panels (sidebar, data panels):
- felt-white (#E8E8FF): ~11.5:1 (AAA) — panel body text
- neon-amber (#FFB700): ~7.7:1 (AAA) — financial figures in data panels
- accent-text (#B94FFF): ~4.3:1 (AA large text / AA with bold) — accented labels in panels
- neon-cyan (#00F5FF): ~9.5:1 (AAA) — data values in panels

**Semantic mappings**: surface → void, surface-raised → deep-space, surface-elevated → plasma, border-subtle → grid-ghost, text-primary → felt-white, accent → neon-violet (decorative), accent-text → accent-text (#B94FFF), etc.

**PWA Manifest Update**: Update `vite.config.ts` PWA manifest: `theme_color` → `#07071A` (void), `background_color` → `#07071A`, `name` → "GOLF FORGE", `short_name` → "FORGE".

### Fonts and Branding

**Self-host fonts** (not Google Fonts CDN — this is a PWA that must work offline):
1. Download WOFF2 files for Orbitron (700 only — 400 is unused), Inter (400, 500, 600, 700), JetBrains Mono (400, 500)
2. Place in `public/fonts/`
3. Define `@font-face` declarations in `src/index.css` with `font-display: swap`

This ensures offline functionality and eliminates FOUT/FOIT issues from network font loading.

Replace Lucide React icons for any remaining Unicode characters (current codebase likely already uses Lucide — verify).

Brand mark: "GOLF FORGE" in Orbitron Bold in the toolbar header area. Use `accent-text` (#B94FFF) for text color, with an optional neon-violet (#9D00FF) `text-shadow` or `filter: drop-shadow()` glow for decorative effect. Do NOT use raw neon-violet as the text `color` — it fails AA contrast on void.

### Dark Theme Conversion

**Strategy**: Big-bang find-and-replace after tokens are defined.

1. Audit all components for Tailwind color classes (bg-white, bg-gray-*, text-gray-*, border-gray-*)
2. **Audit and remove `uvMode ?` ternaries**: 11 files currently have `uvMode ? darkClass : lightClass` conditional styling (Toolbar.tsx, BottomToolbar.tsx, HallFloor.tsx, HallWalls.tsx, ThreeCanvas.tsx, FlowPath.tsx, FloorGrid.tsx, GhostHole.tsx, HallOpenings.tsx, TemplateHoleModel.tsx, useMaterials.ts). Since the theme is now permanently dark, these ternaries are replaced with the dark semantic tokens unconditionally. (Note: 3D material ternaries in Three components may still be needed for UV vs planning lighting differences — only UI ternaries are removed.)
3. Map each light class to its semantic equivalent (bg-white → bg-surface, bg-gray-100 → bg-surface, bg-gray-800 → bg-surface-raised, text-gray-600 → text-secondary, etc.)
4. Replace all instances across all UI components in a single pass
5. Special treatment for data-heavy panels: amber text on deep-space bg, JetBrains Mono font

**Components to convert**: Sidebar (SidebarPanel.tsx), Toolbar (Toolbar.tsx, BottomToolbar.tsx), all tab panels (HolesTab, DetailPanel, BudgetPanel, CostPanel), modals (SettingsModal, HoleBuilder), detail panels (HoleDetail), mobile drawer, and any remaining UI.

### High-Contrast Data Panels

Budget/cost panels get special treatment for readability:
- Background: deep-space (#0F0F2E)
- Text: neon-amber (#FFB700) for financial figures
- Font: JetBrains Mono 14px
- Contrast ratio: 9.2:1 (WCAG AAA compliant)
- Apply to: BudgetPanel, CostPanel, expense tables, any numeric data display

### 3D Environment + Atmosphere

**Environment**: Use drei's `<Environment>` with either the `night` preset or a custom dark HDR. Set `environmentIntensity={0.15}` to keep it subtle — the RectAreaLights and directional light are the primary illumination. Set `background={false}` (the hall walls define the space, not a skybox).

**Custom Lightformers**: Inside the `<Environment>` component, add `<Lightformer>` elements positioned to simulate UV tube strips on the ceiling. These bake into the cubemap for subtle PBR reflections on metallic surfaces.

**SoftShadows**: Add `<SoftShadows size={25} samples={10} />` from drei (mid+high tier only). Active when `frameloop="always"` (UV mode on mid/high tier). Falls back to regular shadows in demand mode.

**Fog**: Replace current linear fog with exponential: `<fogExp2 args={["#07071A", 0.04]} />`. Applies in UV mode **AND 3D perspective view only** — exponential fog in orthographic (top-down) view creates uniform darkening across the scene (all fragments at similar camera distance), producing a muddy result with no atmospheric value. Gate with: `uvMode && view === "3d"`. (Note: R3F uses `args` prop pattern for Three.js constructors, not named props.)

**Canvas gl props**: Add `powerPreference: "high-performance"` to hint GPU to use discrete graphics.

### Enhanced Post-Processing Stack

The full effect stack runs through a **single** `EffectComposer` with `multisampling={0}` (MSAA is redundant with postprocessing):

```
Effect Stack Order (single EffectComposer):
  [high only] N8AO (quality="medium", halfRes)
  [high only] GodRays (sun={lampRef}, samples=30, density=0.96, decay=0.9, weight=0.4, blur)
  [mid+]      Bloom (mipmapBlur, luminanceThreshold=0.8, intensity=0.6-1.0)
  [mid+]      ChromaticAberration (offset=[0.0015, 0.0015])
  [all]       Vignette (offset=0.3, darkness=0.8)
  [all]       ToneMapping (mode=ACES_FILMIC)
```

**GodRays in single composer**: GodRays is integrated into the single EffectComposer, positioned after N8AO but before Bloom. If this causes ordering/rendering issues during implementation, GodRays will be cut — it is the lowest-value, highest-risk effect in the stack.

**Selective bloom**: Update all UV emissive materials to `emissiveIntensity: 2.0` (from current 0.8). Set bloom `luminanceThreshold: 0.8` (from 0.2). Only surfaces with high emissive values will bloom — no more "everything glows".

**Renderer tone mapping**: Set `renderer.toneMapping = THREE.NoToneMapping` on the Canvas `gl` prop to avoid double tone mapping (the ToneMapping effect handles it).

**Sparkles**: Add `<Sparkles count={400} color="#9D00FF" size={2} speed={0.3} scale={[10, 4.3, 20]} position={[5, 2.15, 10]} />` from drei, constrained to the hall volume. Mid+high tier only. Represents floating UV-reactive dust particles.

**Max effects per tier policy**: To prevent feature creep, cap the total active *postprocessing* effects per tier: low=2 (Bloom + Vignette), mid=4 (add ChromaticAberration + ToneMapping), high=6 (add N8AO + GodRays). Scene-level features (SoftShadows, Sparkles, MeshReflectorMaterial, Fog) are budgeted separately by tier — they are drei components or Three.js features, not EffectComposer effects. Any new postprocessing effect added post-Phase 11A must replace an existing one at its tier level, not stack on top.

### MeshReflectorMaterial (Reflective Floor)

Replace `HallFloor`'s simple MeshStandardMaterial with `MeshReflectorMaterial` from drei when conditions are met:

**Conditions**: `uvMode === true && view === "3d" && gpuTier !== "low"`

**Configuration**:
- resolution: 256 (mid) / 512 (high)
- blur: [200, 100]
- mixStrength: 0.8 (tune at implementation time — may reduce to 0.4)
- mirror: 0
- color: "#07071A" (void)
- roughness: 0.3, metalness: 0.8

When conditions are NOT met, render the standard MeshStandardMaterial (current behavior). This means zero render cost in top-down view and on low-tier GPUs. Should respect `PerformanceMonitor` — disable when `performance.current` drops below 0.5.

### Enhanced UV Lighting

Add 4x `RectAreaLight` positioned along the ceiling to simulate UV tube strip lighting:

**Positions**: Distribute evenly along the hall length at ceiling height (y=4.3m), oriented downward. Exact positions: [(2.5, 4.3, 5), (7.5, 4.3, 5), (2.5, 4.3, 15), (7.5, 4.3, 15)].

**Properties**: color #8800FF, intensity 0.8, width 0.3m, height 2m (tube shape).

**RectAreaLightUniformsLib**: In Three.js 0.183.0, RectAreaLight may not require `RectAreaLightUniformsLib.init()` (it was integrated into the renderer pipeline in r155+). Verify at implementation time — if `RectAreaLight` works without the init call, skip it. If it still requires initialization, import from `three/examples/jsm/lights/RectAreaLightUniformsLib`.

**UV lamp fixture geometry**: Simple tube/strip meshes visible only in 3D perspective view. In top-down orthographic view, hide them (they'd be ceiling clutter). Use a group with `visible={view === "3d"}`.

Keep existing directional light for shadow casting (RectAreaLight does NOT cast shadows).

### GodRays Light Sources

**Decoupled from UV Lamp fixtures**: GodRays source meshes are created as a separate `GodRaysSource` component (in T9), NOT built into the UV Lamp fixture geometry (T8). This ensures a clean cut boundary — if GodRays are cut, T8's lamp fixtures are unaffected with no dead code.

GodRays source layer (high-tier GPUs only):
- Separate small emissive sphere meshes (radius ~0.1m) co-located at lamp center positions
- `transparent={true}`, `depthWrite={false}` (required by GodRays)
- **Ref wiring**: `GodRaysSource` component exposes its mesh ref via a Zustand store field (`godRaysLampRef` in UIState, ephemeral). The `PostProcessing` component reads this ref for the GodRays `sun` prop. When GodRays are cut, the ref is simply null and the GodRays effect is not rendered — no prop drilling or context needed.
- Rendered conditionally: `gpuTier === "high" && uvMode`
- **Cut contingency**: If GodRays integration in a single EffectComposer causes rendering issues, delete the `GodRaysSource` component and the GodRays effect — zero impact on T8's lamp fixtures

### UV "Lights Out" Transition

**High priority** — this is the signature interaction.

**Approach**: Pure CSS transitions overlaying the Canvas, masking an instant material/lighting swap underneath.

**Implementation**:
1. Create a `UVTransition` component that renders an overlay `<div>` covering the entire viewport
2. When UV mode toggles ON:
   - Phase 1 (0-800ms): CSS opacity animation pulses the overlay (simulating tube flicker)
   - Phase 2 (800-1400ms): Overlay fades to near-black (darkness). UI elements dim to 20% opacity via CSS class
   - At 800ms: Actually swap materials, lighting, and effects (hidden behind dark overlay)
   - Phase 3 (1400-2400ms): Overlay fades out, revealing the UV scene. Bloom intensity animates from 0 to target value
   - Phase 4: Transition complete. Remove overlay.
3. When UV mode toggles OFF: Reverse sequence (instant swap behind overlay, fade back to planning view)

**Timing coordination**: Use `useRef` for transition phase tracking combined with `requestAnimationFrame` for timing — NOT `setTimeout` chains. setTimeout is unreliable under load (guarantees *at least* N ms, not exactly N ms) and throttled to 1000ms intervals when the tab is backgrounded. The rAF loop checks elapsed time via `performance.now()` and advances phases when thresholds are crossed. Only `uvMode` (the actual mode flip) and `transitioning` (the boolean guard) go through Zustand — phase tracking stays entirely in refs, causing zero React re-renders during the 2.4s animation. The `uvMode` state flip fires ONLY when the rAF loop confirms the overlay is fully dark — guaranteed by elapsed time check, not setTimeout hope.

**Canvas isolation during transition**: Set `pointer-events: none` on the Canvas element while `transitioning` is true. This prevents user clicks during the animation from triggering hole selection, state changes, or re-renders that could interfere with the overlay.

**Double-click guard**: Ignore UV toggle clicks while `transitioning` state is true. Prevent race conditions from rapid toggling.

**Frameloop**: The frameloop strategy (see above) handles this — `transitioning` state triggers `"always"` mode.

**User preference**: Add a toggle in settings: "UV transition animation" (default on). When off, instant toggle (current behavior).

**UV button**: After transition completes, the UV toggle button gets a CSS `animation: pulse` with neon-violet glow (#9D00FF box-shadow).

### Performance Fixes

1. **HallWalls singleton materials**: Currently creates new MeshStandardMaterial on every render. Move to module-level singletons (same pattern as hole materials in shared.ts). Create two singletons (planning + UV) and select based on uvMode. Do not mutate singletons — if transition animation needs material property changes, clone temporarily.
2. **Mobile shadow optimization**: Use `shadows={true}` instead of `shadows="soft"` on mobile (40% cheaper, minimal visual difference on small screens)

(Note: `powerPreference` and `multisampling=0` are handled in T5/T6 respectively, not here.)

### Visual Regression Testing

**Framework**: Playwright screenshot comparison tests alongside existing Vitest suite.

**Test states to capture**:
- Planning mode (top-down, orthographic)
- Planning mode (3D perspective)
- UV mode (top-down)
- UV mode (3D perspective with reflections)
- Dark theme UI (sidebar, toolbar, panels)
- Data panels (budget/cost with amber text)
- GOLF FORGE branding

**Setup**: Add `@playwright/test` to devDependencies. Create `tests/visual/` directory. Screenshot comparison with configurable threshold (0.1% pixel diff tolerance). Run separately from Vitest (different test runner).

**CI note**: Playwright visual tests require consistent rendering environment. Use Docker or specific browser versions for reproducibility.

## File Changes Summary

### New Files
```
src/hooks/useGpuTier.ts            # GPU detection, caching, store integration
src/components/three/UVLamps.tsx    # RectAreaLights + fixture geometry (clean, no GodRays props)
src/components/three/GodRaysSource.tsx  # Emissive sphere meshes for GodRays (decoupled from UVLamps)
src/components/three/UVTransition.tsx  # Theatrical transition overlay (useRef + rAF timing)
src/components/three/PostProcessing.tsx  # Tier-aware full effect stack (replaces UVPostProcessing)
public/fonts/                       # Self-hosted WOFF2 font files
tests/visual/                       # Playwright visual regression tests
```

### Modified Files
```
src/index.css                       # @theme block with blacklight palette + @font-face declarations
src/types/ui.ts                     # Add gpuTier, transitioning to UIState; gpuTierOverride to persisted
src/store/store.ts                  # GPU tier state + actions, transition state, version bump to v7
src/App.tsx                         # Canvas gl props, frameloop control, PerformanceMonitor
src/components/three/ThreeCanvas.tsx # Environment, SoftShadows, Sparkles, fog, lighting
src/components/three/HallFloor.tsx  # Conditional MeshReflectorMaterial
src/components/three/HallWalls.tsx  # Singleton materials
src/components/three/UVEffects.tsx  # Updated to use new PostProcessing component
src/components/three/holes/shared.ts        # emissiveIntensity 2.0
src/components/three/holes/useMaterials.ts  # Updated emissive values
src/components/three/holes/materialPresets.ts  # UV_EMISSIVE_INTENSITY constant update
vite.config.ts                      # PWA manifest: theme_color, background_color, name, short_name
(all UI components)                 # Tailwind class replacements for dark theme + uvMode ternary removal
```

### Removed Files
```
src/components/three/UVPostProcessing.tsx  # Replaced by PostProcessing.tsx
```

## Task Breakdown

### T1: GPU Tier Classifier (0.5 day)
- Install @pmndrs/detect-gpu
- Create useGpuTier hook with localStorage caching
- **First-load fallback**: default to "low" while async detection runs, upgrade when result arrives
- Add gpuTier to UIState (ephemeral)
- Add gpuTierOverride to persisted settings (store version v7, migration with try/catch + field-level fallback)
- Add GPU tier override dropdown to settings panel
- Add PerformanceMonitor to Canvas
- Ensure singleton pattern (shared via Zustand, not re-detected per Canvas)
- Pin exact versions for three, @react-three/fiber, @react-three/drei, @react-three/postprocessing
- Tests: tier detection, caching, override logic, migration, first-load fallback behavior

### T2: Tailwind Semantic Tokens + Fonts + PWA Manifest (1 day)
- Define @theme block in index.css with 11-token blacklight palette (additive, DO NOT clear defaults)
- Include `accent-text` (#B94FFF) as contrast-safe text variant of neon-violet
- Define semantic token mappings (accent → neon-violet decorative, accent-text → #B94FFF for text)
- Verify all text-on-background contrast pairs (see Contrast safety rule in Architecture)
- Add font tokens (display, body, mono)
- Download and self-host WOFF2 font files in public/fonts/ — Orbitron (700 only), Inter (400, 500, 600, 700), JetBrains Mono (400, 500)
- Add @font-face declarations in index.css with font-display: swap
- Update PWA manifest in vite.config.ts (theme_color, background_color, name, short_name)
- Tests: token resolution, font loading, manifest values, contrast verification

### T3: Dark Theme Conversion + Branding (2 days)
- Audit all components for light-theme color classes (bg-white, bg-gray-*, text-gray-*, border-gray-*)
- Audit and remove `uvMode ?` ternaries in UI components (Toolbar, BottomToolbar, etc.)
- Note: 3D material uvMode ternaries in Three components stay (different materials for UV vs planning lighting)
- Create mapping from light → dark tokens
- Big-bang replace across all UI components
- Add GOLF FORGE brand mark to toolbar (Orbitron Bold, accent-text #B94FFF with neon-violet glow — NOT raw neon-violet as text color)
- Lucide icon audit
- Tests: visual regression screenshots (planning + UV mode UI)

### T4: High-Contrast Data Panels (0.5 day)
- Apply amber-on-dark styling to BudgetPanel, CostPanel
- JetBrains Mono for numeric data
- Verify WCAG AAA contrast
- Tests: visual regression for data panels

### T5: Environment + SoftShadows + Fog + Canvas GL (1 day)
- Add Environment with night preset / custom dark HDR
- Add Lightformers for UV tube reflections
- Add SoftShadows (tier-gated, active in UV mode with always frameloop)
- Replace linear fog with fogExp2 (using args pattern), **gated to 3D perspective view only** (`uvMode && view === "3d"`)
- Add powerPreference: "high-performance" to Canvas gl props
- Implement frameloop strategy (needsAlwaysFrameloop derived state)
- Add drei `<Stats />` behind a dev-only environment flag (`import.meta.env.DEV`) for FPS verification during development — remove or keep gated before shipping
- Tests: fog rendering, fog view-gating (no fog in orthographic), environment loading, frameloop switching

### T6: PostProcessing + Sparkles + Effects (1 day)
- Create new PostProcessing component (replaces UVPostProcessing)
- Implement full tier-aware effect stack in single EffectComposer
- Set multisampling={0} on EffectComposer
- Selective bloom (update emissive intensity to 2.0 + threshold to 0.8)
- Add Sparkles component (constrained to hall bounds with scale/position)
- Set renderer.toneMapping = NoToneMapping
- Tests: effect stack ordering, tier gating

### T7: MeshReflectorMaterial (0.5 day)
- Conditional rendering in HallFloor based on view + tier + uvMode
- Configure reflection properties (resolution varies by tier)
- Fallback to standard material
- Respect PerformanceMonitor degradation
- Tests: view-gating logic, visual regression

### T8: Enhanced UV Lighting (1.5 days)
- Add 4x RectAreaLight at ceiling positions
- Verify if RectAreaLightUniformsLib.init() is needed in Three.js 0.183 (skip if not)
- UV lamp fixture geometry (visible in 3D only) — **clean lamp geometry only, no GodRays-specific props** (transparent/depthWrite are T9's concern)
- Update HDR emissive strategy (intensity 2.0)
- Tests: light positioning, fixture visibility gating

### T9: GodRays (1 day)
- Create separate `GodRaysSource` component with emissive sphere meshes co-located at lamp positions (transparent, no depth write) — **decoupled from T8's lamp fixtures**
- Integrate GodRays effect into single EffectComposer (high tier only)
- Configure samples, density, blur
- **Cut contingency**: If integration causes rendering issues, delete `GodRaysSource` component + GodRays effect — zero impact on T8
- Tests: tier gating, visual regression

### T10: UV "Lights Out" Transition (1.5 days)
- UVTransition overlay component with CSS animation phases
- **useRef + requestAnimationFrame timing** (not setTimeout chains) — phase tracking in refs, only uvMode + transitioning go through Zustand
- rAF loop checks `performance.now()` elapsed time to advance phases, guaranteeing overlay is dark before material swap
- Canvas `pointer-events: none` during transition to prevent interaction interference
- Material swap timing at 800ms behind dark overlay (confirmed by rAF elapsed check, not setTimeout)
- Double-click guard (ignore toggle while transitioning)
- UV button pulse animation
- Settings toggle for animation disable
- Tests: transition timing, frameloop state, settings toggle, double-click prevention, canvas isolation

### T11: Performance Fixes (0.5 day)
- HallWalls singleton materials (planning + UV, do not mutate)
- Mobile shadow optimization
- Tests: material singleton verification, perf baseline

### T12: Visual Regression Test Suite (1 day)
- Install and configure Playwright
- Create screenshot comparison tests for ALL key visual states (planning, UV, 3D, data panels, branding)
- Document test running instructions
- Tests: self-validating (the tests ARE the deliverable)

## Parallelism Strategy

**Wave 1** (parallel): T1 (GPU Tier) + T2 (Tokens + Fonts + Manifest)
**Wave 2** (after T2): T3 (Dark Theme + Branding), then T4 (Data Panels) — T4 runs after T3, NOT parallel, because both edit BudgetPanel/CostPanel
**Wave 3** (after T1): T5 (Environment + Fog + Canvas GL + Frameloop)
**Wave 4** (parallel after T5): T6 (Effects + Sparkles) + T7 (Reflections) + T8 (UV Lighting)
**Wave 5** (after T8): T9 (GodRays) + T10 (Transition)
**Wave 6** (after T1): T11 (Perf Fixes) — can run parallel with Wave 3+
**Wave 7** (after ALL other tasks): T12 (Visual Tests) — captures final state

Total estimated effort: 12-14 days sequential, ~7-8 days with parallelism.
