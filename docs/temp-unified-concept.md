# Phase 11: "GOLF FORGE" — Immersive Rendering & Geo Visualization

**Synthesized Concept from 6 Specialist Analyses**
**Date:** 2026-02-21 | **Status:** Draft for adversarial review

---

## Vision Statement

Transform Golf Planner from a functional planning tool into an immersive venue creation experience. The UV/blacklight aesthetic becomes the app's core identity — not a preview toggle. Friends opening the app should say "whoa" before they even place a hole. The actual Gramastetten property grounds the experience in reality, and every interaction reinforces the feeling of designing a real glowing venue.

---

## A. VISUAL OVERHAUL — "Architect of the Glow"

### A1. Dark Theme by Default (Tier 1, ~1 day)

Eliminate ALL white backgrounds. The "planning mode" / "UV mode" distinction softens — the app is always dark-themed with the UV toggle controlling 3D scene lighting and post-processing.

**The Blacklight Palette:**
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

**Typography:** Orbitron (display/headings), Inter (body), JetBrains Mono (data/prices). Brand mark: `GOLF · FORGE` in Orbitron.

**Icons:** Lucide React (tree-shakeable), stroke 1.5px, consistent dark-mode treatment.

### A2. 3D Rendering Quick Wins (Tier 1, ~2 days)

Seven changes that each take 15 minutes to 2 hours and dramatically improve visuals:

1. **`<Environment preset="warehouse" />`** — instant PBR reflections on all materials
2. **`<SoftShadows size={25} samples={10} />`** — PCSS soft shadow edges
3. **`<MeshReflectorMaterial>`** on hall floor — reflective epoxy surface in UV mode
4. **Replace `<fog>` with `<fogExp2 density={0.04}>`** — smoother atmospheric haze
5. **`<Sparkles count={400} color="#9D00FF" size={2} />`** — floating UV dust particles
6. **`<ChromaticAberration offset={[0.0015, 0.0015]} />`** — photographic lens authenticity
7. **`<ToneMapping mode={ACES_FILMIC} />`** as final postprocessing effect — cinematic contrast

### A3. Enhanced UV Lighting (Tier 2, ~2 days)

Replace the single ambient + directional with physically-motivated UV tube lighting:

- **4× RectAreaLight** at ceiling positions simulating UV fluorescent tubes (color `#8800FF`, 0.8 intensity)
- **Custom Environment with Lightformers** modeling the UV tube layout — baked into cubemap, zero per-frame cost
- **HDR emissive strategy:** base color `#000000` + `emissiveIntensity: 2.0` + bloom `luminanceThreshold: 0.8` — only neon surfaces bloom, not the whole scene
- **GodRays** from 2-3 ceiling lamp positions — volumetric UV shaft effects

**Full UV EffectComposer stack (correct order):**
SSAO → GodRays → Bloom → ChromaticAberration → Vignette → Noise → ToneMapping

### A4. PBR Material Upgrade (Tier 2, ~2 days)

Replace solid-color materials with textured PBR:

| Surface | Texture Source | Key Maps |
|---------|---------------|----------|
| Felt | Procedural noise (256×256 DataTexture) | normalMap (fiber bump), roughnessMap (0.85-0.95) |
| Bumpers | ambientCG galvanized steel | metalness: 0.85, roughness: 0.15 |
| Floor (planning) | ambientCG concrete | roughness: 0.7, warm gray |
| Floor (UV) | MeshReflectorMaterial | metalness: 0.4, roughness: 0.3, dark reflective |
| Walls | ambientCG painted metal | matte, PBR profile per material preset |

Free CC0 sources: **AmbientCG**, **Poly Haven**. Compress with KTX2/Basis Universal for web delivery. Host on Cloudflare R2 (free, zero egress).

### A5. Camera Choreography (Tier 2, ~3 days)

- **Smooth transitions:** Lerp camera position/zoom in `useFrame` with 0.08 easing factor
- **Auto-orbit screensaver:** After 5 min idle, camera orbits at 8m height, 120s per revolution
- **First-person walkthrough:** PointerLockControls + WASD at 0.9m height, auto-tour along flow path
- **Theatre.js** for scripted flythrough sequences (keyframe camera paths per hole)

### A6. The UV "Lights Out" Transition (Tier 1, ~0.5 day)

A 2.4-second theater lighting sequence when toggling UV mode:
1. **Phase 1 (0-800ms):** Flicker — canvas opacity pulses irregularly (like fluorescent tubes warming up)
2. **Phase 2 (800-1400ms):** Darkness — canvas fades to near-black, UI dims to 20%
3. **Phase 3 (1400-2400ms):** Neon awakening — UV materials fade in, bloom ramps 0.1→1.2, particles start
4. **Phase 4:** Full UV mode. UV button pulses with neon glow animation.

Pure CSS transitions masking instant material swap underneath.

---

## B. GEO INTEGRATION — "Our Hall is RIGHT HERE"

### B1. Austrian Aerial Ground Plane (Tier 2, ~1 day)

Use **BASEMAP.AT orthophotos** (Austria's official aerial imagery, 30cm/pixel, CC BY 4.0, no API key) as a ground plane texture surrounding the hall.

- 100m × 100m PlaneGeometry at y=-0.02 with aerial texture centered on 48.3715°N, 14.2140°E
- The 10×20m hall sits precisely over the actual building footprint
- Radial alpha gradient fades aerial to floor color at ~30m from center
- **Planning mode only** — UV mode retains dark ambiance
- Delivers the visceral "our hall is RIGHT HERE" moment

### B2. Google Photorealistic 3D Tiles (Tier 3, ~2 weeks)

Via `3d-tiles-renderer` (NASA-AMMOS, MIT license):
- Photorealistic 3D terrain/buildings of Gramastetten neighborhood
- 100,000 tile calls/month free tier — sufficient for personal use
- Lazy-loaded "Site View" tab alongside planning canvas
- Shows actual hillside, neighboring buildings, access roads

### B3. On-Site Mode (Tier 1, ~100 LOC, pure PWA)

- **Geofence hook:** 50m radius around property coordinates, triggers automatically
- "You're on site!" indicator, auto-enables live sun position
- Unlocks site-specific features (compass, gyroscope, AR trigger)

### B4. Compass + Gyroscope Camera (Tier 1, ~250 LOC)

- **Compass alignment:** `DeviceOrientationEvent.alpha` drives camera azimuth — physically rotate to look around
- **Gyroscope tilt:** Beta/gamma map to camera polar angle in 3D mode — tilt phone to examine the model
- Both are toggles in the overflow menu, disabled by default

### B5. Sun Path Arc on Minimap (Tier 2, ~1.5 days)

SVG overlay on existing minimap showing sunrise-to-sunset arc at current date, current position as dot, cardinal directions labeled. Color gradient: sunrise orange → midday gold → sunset orange.

---

## C. FUN & SHARING — "Show This to Everyone"

### C1. URL-Encoded Shareable Links (Tier 1, ~1 day)

- Compress Zustand state with **lz-string** → embed in URL hash
- Zero server required, works offline, no login
- Typical layout: ~8KB JSON → ~4KB compressed → fits in URL
- Web Share API integration: one-tap share with auto-screenshot preview

### C2. Milestone Celebrations (Tier 1, ~0.5 day)

**canvas-confetti** (3KB) with neon palette colors:
- Hole 1 placed: small burst + toast
- Hole 9: bigger burst + "HALFWAY THERE!"
- Hole 18: full confetti rain + auto-UV mode + "YOUR COURSE IS COMPLETE!" + offer tour

### C3. Sound Design (Tier 3, opt-in, ~2-3 days)

9 audio events: placement thwack, invalid bonk, UV flicker-buzz, delete poof, snap click, camera whoosh, budget bell, builder save chord. Under 100KB total. Disabled by default.

### C4. Tour Mode (Tier 2, ~4-5 days)

Full-screen first-person camera tour following the flow path:
- Camera at 0.9m height, visits each hole in sequence
- Per-hole: approach shot → fly-over → cup view → transition
- Hole numbers as floating Orbitron labels
- UV mode auto-enabled, bloom bumped to 1.8
- Auto-orbit after last hole, then loop

### C5. Before/After Slider (Tier 2, ~2 days)

CSS `clip-path` divider: left = empty hall, right = designed hall. Neon cyan divider line. Drag to compare.

---

## D. BACKEND & AI — "Cloud Power, Zero Cost"

### D1. Gaussian Splatting from Property Photos (Tier 2, ~$0)

50 iPhone photos of the field → COLMAP + nerfstudio on free Google Colab T4 → `.splat` file → drei `<Splat>` component loads it directly in R3F. Result: photorealistic 3D property as backdrop.

### D2. AI UV Texture Generation (Tier 3, ~$1 total)

Replicate.com + FLUX 1.1 Pro ($0.04/image): generate UV-themed textures from prompts → apply to hole surfaces via a Vercel serverless function.

### D3. Server-Side 4K Renders (Tier 3, ~$0.002/frame)

**Quick win:** Puppeteer Lambda loads the actual PWA → calls existing `captureScreenshot()` → returns identical-to-screen 4K PNG including bloom. Free on Vercel.

**Advanced:** Headless Three.js + `headless-gl` on GPU spot instance for scripted video renders.

### D4. Collaboration via Liveblocks (Tier 3, free tier)

Liveblocks has a first-class Zustand plugin — wrap existing `create()` in `liveblocks()`, get live collaboration. Free tier: 2 rooms, 100 MAU. Sufficient forever for friends.

---

## E. MOBILE PERFORMANCE — "Flagship Wow, Budget Baseline"

### E1. Three-Tier GPU Classifier

Replace binary `isMobile` with `low/mid/high` tiers detected from `renderer.capabilities`:
- **Low:** No postprocessing, MeshBasicMaterial, DPR 1.0, no shadows
- **Mid:** Bloom only, PCFShadowMap 512, DPR 1.5
- **High:** Full effect stack, PCFSoftShadowMap 2048, DPR 2.0

### E2. Immediate Performance Fixes

1. `powerPreference: "high-performance"` on Canvas gl prop
2. Switch mobile shadow type to `true` (not `"soft"`) — 40% cheaper
3. InstancedMesh for bumper geometry — collapse ~120 draw calls to ~30
4. Fix HallWalls.tsx singleton materials (prevent re-creation on render)

### E3. AR Path (Staged)

- **Stage 1 (PWA):** Geofence + compass + gyroscope + share (780 LOC, ~2 days)
- **Stage 2 (Capacitor):** iOS haptics, if group wants it
- **Stage 3 (Custom AR plugin):** Marker-based ARKit hall placement — printed QR at site corner, full-scale hall appears. Existing Three.js geometry is directly reusable.

---

## F. IMPLEMENTATION TIERS

### Tier 1: Maximum Wow, 1 Phase (~6-8 days)
1. Dark theme conversion (Tailwind class replacement)
2. Lucide icons
3. 7 rendering quick wins (Environment, SoftShadows, Reflector, fogExp2, Sparkles, ChromaticAberration, ToneMapping)
4. UV "Lights Out" transition animation
5. URL-encoded shareable links + Web Share API
6. Milestone confetti celebrations
7. Geofence on-site mode + compass camera
8. Performance fixes (powerPreference, shadow type, HallWalls fix)
9. Orbitron typography + GOLF FORGE brand mark

### Tier 2: High Impact (~8-10 days)
10. Enhanced UV lighting (RectAreaLight, Lightformers, GodRays)
11. PBR textures (felt, bumpers, floor, walls)
12. Aerial ground plane (BASEMAP.AT)
13. Camera choreography (smooth transitions, auto-orbit)
14. Tour mode (first-person walkthrough)
15. Before/after slider
16. Sun path arc on minimap
17. Three-tier GPU classifier
18. InstancedMesh optimization

### Tier 3: Premium (~2-4 weeks)
19. Gaussian Splatting from property photos
20. Theatre.js camera sequences
21. Sound design system
22. Google 3D Tiles site view
23. AI UV texture generation
24. Server-side 4K renders
25. Liveblocks collaboration
26. Capacitor + AR (if pursued)

---

## G. WHAT TO SKIP

Based on all 6 specialist analyses, these are explicitly NOT worth doing:
- LiDAR terrain scanning (minimal value at a prepared commercial site)
- Ambient light sensor (no usable browser API)
- React Native port (60-80 hours for ~5 users, absurd ROI)
- Monocular depth estimation (±75-150cm accuracy, worse than terrain variation)
- Full WebGPU migration now (@react-three/postprocessing not WebGPU-ready)
- iMessage rich previews (requires server infra for low-value social signal)
- Real-time collaboration as Phase 11 priority (async URL sharing sufficient)

---

## H. COST ANALYSIS

| Component | Monthly Cost |
|-----------|-------------|
| BASEMAP.AT aerial tiles | $0 (CC BY 4.0) |
| Poly Haven / AmbientCG textures | $0 (CC0) |
| Cloudflare R2 texture hosting | $0 (10GB free) |
| Google 3D Tiles (if used) | $0 (100K free tier) |
| Gaussian Splat generation | $0 (Google Colab) |
| AI textures via Replicate | ~$1 lifetime |
| Liveblocks collaboration | $0 (free tier) |
| Server-side renders (Vercel) | $0 (Puppeteer on free tier) |
| **Total** | **~$0/month** |

---

## Sources & Agent Credits

- **Market Researcher:** 50+ sources across venue visualization, DACH mini golf market, Austrian real estate
- **Mobile Developer:** GPU performance analysis, AR feasibility, progressive enhancement strategy
- **Backend Developer:** Server-side rendering pipeline, BASEMAP.AT discovery, Gaussian Splatting workflow
- **UI Designer:** Visual identity concept, "Blacklight 6" palette, UV transition choreography, tour mode
- **Mobile App Developer:** AR accuracy analysis (GPS ±5m kills naive placement), marker-based solution, Capacitor path
- **Research Analyst:** 234 sources, 47 actionable R3F/drei/postprocessing findings, full effect catalog
