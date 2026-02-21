# Golf Planner — Visual Experience Concept
## "BLACKLIGHT ARCADE" Design Vision

**Date:** 2026-02-21
**Author:** UI Design Analysis
**Status:** Concept Document — Creative Brief for Future Phases
**Scope:** Visual identity overhaul, 3D scene presentation, wow-factor UI elements, presentation mode, social features, Google Earth integration

---

## Executive Summary

The current app is a solid functional tool that hides its most compelling identity behind a neutral planning-tool aesthetic. The breakthrough insight: **the UV/blacklight mode IS the product's soul, not a preview toggle**. Every design decision below radiates outward from this core — the app should feel like you are standing inside a blacklight arcade at all times, even when doing mundane tasks like editing hole dimensions or reviewing the budget.

The north star experience: open the app on your phone, hand it to a friend, and before they even do anything, they say "whoa, what is this?".

---

## 1. Visual Identity and Theme

### 1.1 The Core Metaphor: "Architect of the Glow"

The app is not a CAD tool. It is a venue creation simulator. The user is not a planner — they are a venue designer bringing a dream to life. Every visual decision should reinforce this feeling of creative power over a glowing, living space.

### 1.2 Primary Color Palette

**The Blacklight 6** — a strict palette used across the entire app UI, not just the 3D canvas.

| Name | Hex | Role | Current equivalent |
|------|-----|------|--------------------|
| Void | `#07071A` | Primary background, deepest dark | `bg-gray-900` |
| Deep Space | `#0F0F2E` | Secondary background, panel surfaces | `bg-gray-800` |
| Plasma | `#1A1A4A` | Elevated surfaces, cards, sidebar | `bg-gray-700` |
| Neon Violet | `#9D00FF` | Primary accent, CTA buttons, active states | `bg-purple-600` |
| Neon Cyan | `#00F5FF` | Secondary accent, data highlights, flow path | (unused currently) |
| Neon Green | `#00FF88` | Success states, valid placement, snap confirmation | (green variants) |
| Neon Amber | `#FFB700` | Warning states, budget alerts, par numbers | `bg-amber-500` |
| Neon Pink | `#FF0090` | Destructive actions, delete, error states | `bg-red-500` |
| Felt White | `#E8E8FF` | Body text on dark backgrounds | `text-gray-100` |
| Grid Ghost | `#2A2A5E` | Subtle grid lines, dividers, panel borders | `border-indigo-900` |

**Design rule:** No white backgrounds exist anywhere in the app. The sidebar, toolbar, modals, and budget tables are all dark-themed by default. The "planning mode" distinction is eliminated — there is only one app, and it is beautiful.

**What this means for the codebase:**
- `bg-white` → `bg-[#0F0F2E]`
- `bg-gray-100` → `bg-[#1A1A4A]`
- `border-gray-200` → `border-[#2A2A5E]`
- `text-gray-700` → `text-[#E8E8FF]`
- `text-gray-500` → `text-[#7070AA]`
- Active blue (`bg-blue-600`) → Neon Violet (`bg-[#9D00FF]`)

### 1.3 Typography

**Display / Logo:** "Orbitron" (Google Fonts, free) — geometric, futuristic, uppercase-friendly. Used for the app name, hole numbers in the 3D scene, mode labels (UV, 3D, FLOW).

**Body / UI:** "Inter" (already common in Tailwind projects) — clean, legible at small sizes on dark backgrounds. All sidebar text, labels, budget figures.

**Monospace / Data:** "JetBrains Mono" — for coordinate displays, cost figures in budget panel, location bar data. Numbers feel technical and precise.

**Type scale for the UI:**
- App name: Orbitron 18px, letter-spacing 0.15em, color `#9D00FF`
- Section headers: Orbitron 10px uppercase, letter-spacing 0.2em, color `#7070AA`
- Button labels: Inter 13px medium, uppercase, letter-spacing 0.05em
- Body / card text: Inter 13px regular
- Data / coordinates: JetBrains Mono 12px, color `#00F5FF`
- Price / cost figures: JetBrains Mono 14px, color `#FFB700`

### 1.4 Icon System

Replace all current Unicode character icons (`↗`, `+`, `×`) with a coherent icon set.

**Recommended library:** Lucide React (tree-shakeable, consistent stroke weight, excellent dark-mode rendering). Already popular in the React ecosystem.

**Icon treatment for the app:**
- Stroke width: 1.5px (thinner than default 2px — more elegant on dark backgrounds)
- Color: `#7070AA` for inactive, `#9D00FF` for active, `#00F5FF` for hover
- Size: 16px in toolbar, 14px in sidebar, 20px in bottom mobile toolbar

**Key icon assignments:**
- Select tool: `MousePointer2` (Lucide)
- Place tool: `PlusCircle` (Lucide)
- Delete tool: `Trash2` (Lucide)
- Snap: `Magnet` (Lucide)
- Flow path: `Route` (Lucide)
- 3D toggle: `Box` / `Square` (Lucide)
- UV mode: `Zap` (Lucide) — lightning bolt for UV/electric feeling
- Undo: `Undo2` (Lucide)
- Redo: `Redo2` (Lucide)
- Screenshot: `Camera` (Lucide)
- SVG export: `FileImage` (Lucide)
- Budget: `Wallet` (Lucide)
- Save: `Save` (Lucide)
- Builder: `Wrench` (Lucide)

### 1.5 Brand Expression: The App Name Treatment

Currently no visible app name/logo. Add to toolbar left:

```
GOLF ∙ FORGE
```

"FORGE" because you are forging/crafting a venue. Orbitron font. The dot separator in Neon Cyan `#00F5FF`. Full brand mark is 28px tall, sits left of the toolbar divider.

On mobile, abbreviated to `GF` with a small neon violet glyph mark (a stylized golf flag with a glow effect via CSS `filter: drop-shadow(0 0 4px #9D00FF)`).

---

## 2. 3D Scene Presentation

### 2.1 The Hall Environment: Skybox and Context

**Current state:** Canvas background is the default Three.js gray.

**Proposed: Three sky context layers**

#### Layer 1 — The Venue Interior (UV Mode)
When in UV mode (now the default aesthetic), the sky around the hall becomes the "venue exterior" — opaque dark walls extending beyond the canvas bounds. The hall sits inside a larger dark space. The fog already does this partially; enhance it with:

- Canvas background color: `#07071A` (Void black — the room beyond the venue)
- Distant ambient particles: 400 tiny point sprites at random positions 15-40m from hall center, y position 0.5-4m. Color: random selection from the neon palette at 10% opacity. They drift slowly upward using a `useFrame` animation at 0.02m/s, resetting to bottom when they exit view. This creates the "floating dust in blacklight" effect.
- Floor reflection plane: a second transparent plane at y=-0.01 with `MeshStandardMaterial({ color: '#0A0A1A', metalness: 0.8, roughness: 0.2, opacity: 0.6 })` — subtle floor reflections.

#### Layer 2 — Gramastetten Aerial Context (Planning Mode / New Context Panel)
A static aerial image of the actual site at Gewerbepark 17, 4201 Gramastetten projected as a ground plane texture surrounding the hall:

- Source: Capture a 400×400px aerial PNG from OpenStreetMap or Mapbox static tiles centered on `48.3715°N, 14.2140°E` at zoom 18. Scale: ~2m/pixel at zoom 18.
- In the 3D scene, place a `PlaneGeometry(100, 100)` at y=-0.02 with this texture, centered on the hall origin. The 10×20m hall sits precisely over the actual building footprint.
- Texture blending: `MeshStandardMaterial({ map: aerialTexture, roughness: 1, metalness: 0 })` with a falloff at the edges using a radial gradient texture in the `alphaMap` channel — the aerial image fades to the floor color at ~30m from center.
- This only renders in planning mode (not UV mode — UV mode has its own dark ambiance).

This gives users the visceral "our hall is RIGHT HERE" moment when they see the actual road, neighboring buildings, and terrain.

#### Layer 3 — Upper Austria Sky Dome
In planning mode (3D isometric view), add a sky gradient:
- CSS canvas background: radial gradient from `#B8D4E8` (Austrian sky blue, muted) at center to `#7BA3C4` at edges.
- For a Three.js-native approach: `<Sky>` from drei, with turbidity/rayleigh tuned for overcast Upper Austrian weather (turbidity: 8, rayleigh: 0.5, mieCoefficient: 0.005, mieDirectionalG: 0.7, elevation: set from sunData.altitude).
- The `<Sky>` component already uses the sun position — wiring it to `sunData` gives a live sky that changes with the time slider. Sunrise orange, midday blue, overcast gray all render automatically.

### 2.2 Lighting Design

**Current state:** Single ambient + single directional, no drama.

**Proposed: Three-zone cinematic lighting**

#### UV Mode Lighting (the headliner)

The goal is to replicate what a real blacklight venue looks like. Real UV venues have:
1. UV fluorescent tubes along the ceiling (diffuse, purplish)
2. Spotlights from above on specific holes (bright pools of light)
3. Strong emissive materials (the holes and obstacles glow)

Implementation:
```
Ambient: color #220044, intensity 0.15 (very low — deep shadow fill)

UV Tube Simulation (new): 4× RectAreaLight
  Position: [2.5, 4, 5], [7.5, 4, 5], [2.5, 4, 15], [7.5, 4, 15]
  Color: #8800FF
  Width: 1.0, Height: 10
  Intensity: 0.8
  (These cast the diffuse purple wash that makes white objects glow)

Spot Simulation (new): 3× SpotLight cycling through hole positions
  Position: [hole.x, 4.3, hole.z] for first 3 holes
  Color: #6600CC
  Intensity: 2.0
  Angle: Math.PI / 8
  Penumbra: 0.3
  castShadow: true, shadow map 512×512
```

The `RectAreaLight` requires `RectAreaLightUniformsLib.init()` — add this to the canvas setup. It is included in Three.js core.

#### Planning Mode Lighting (elevated from current)

```
Ambient: white @ 0.6 (slightly reduced from 0.8 to allow shadows to read)

Sun DirectionalLight: (existing, keep)
  castShadow: true
  shadow-mapSize: 2048×2048 on desktop (upgrade from 1024)

Fill Light (new): HemisphereLight
  skyColor: #E8F4FD (light sky blue)
  groundColor: #B8860B (warm ground bounce)
  Intensity: 0.3
  (Wraps models in realistic sky/ground color fill)

Accent Rim Light (new): DirectionalLight
  position: opposite to sun on azimuth
  color: #CCE4FF (cool blue sky fill)
  Intensity: 0.15
  (Catches back edges of hole walls — prevents black silhouettes)
```

### 2.3 Material Upgrade Path

The current `MeshStandardMaterial` approach is correct. The upgrade is in texture maps and surface detail.

**Felt surface — synthetic carpet texture:**
- Use a 256×256 procedural noise texture generated at startup with `THREE.DataTexture`
- Pattern: green base with slight fiber direction variation. Loop/tile at 0.25m scale.
- `roughnessMap`: fiber-direction roughness variation (0.85-0.95)
- `normalMap`: subtle fiber bump, amplitude 0.3
- No external file dependency — generated in JavaScript from noise algorithms
- Result: the holes look carpeted, not plastic-painted

**Bumpers — galvanized steel (semi-pro profile):**
- `metalness: 0.85, roughness: 0.15`
- Subtle environment map via `<Environment preset="warehouse">` from drei
- Color `#C8D8C8` (galvanized tone) with slight green tint from felt reflection
- Result: bumpers look like real galvanized steel tube

**Hall floor — polished concrete:**
- `color: #E4E0DC` (warm concrete)
- `roughness: 0.7, metalness: 0.0`
- Procedural noise at 2m scale adds subtle concrete variation
- In UV mode: replace with `color: #0A0A1A, roughness: 0.3, metalness: 0.4` — the floor becomes a dark reflective surface that catches emissive glow

**UV neon paint simulation:**
- In UV mode, all emissive materials get a `bloom luminanceThreshold` lowered from 0.2 to 0.05 — more surfaces participate in bloom
- Add a thin 0.005m "paint layer" mesh on top of felt surface with pure emissive color at `emissiveIntensity: 1.2` and `transparent: true, opacity: 0.6`
- The underlying felt at `emissiveIntensity: 0.8` shows through — creates depth and realism

### 2.4 Camera Choreography

**Current state:** Static orthographic, user manually pans/zooms.

**Proposed additions:**

#### Smooth Animated Transitions
All camera state changes (top→3D, zoom, fit-to-content) currently snap instantly. Animate them:
- Use a `useRef` holding a target camera state `{ position, target, zoom }`
- In `useFrame`, lerp current state toward target: `current = lerp(current, target, 0.08)` per frame
- This creates silky smooth camera transitions with ~12 frame easing

Implementation in `CameraControls.tsx`:
```typescript
const cameraTarget = useRef({ position: [0, 30, 0], zoom: 40 });

useFrame(({ camera }) => {
  camera.position.lerp(new THREE.Vector3(...cameraTarget.current.position), 0.08);
  camera.zoom = THREE.MathUtils.lerp(camera.zoom, cameraTarget.current.zoom, 0.08);
  camera.updateProjectionMatrix();
});
```

#### Auto-Orbit Preview (Cinematic Flythrough)
New `view` option: `"orbit"` — the camera slowly orbits the hall at a fixed elevation, rotating 360° over 120 seconds. Triggered by a new toolbar button (camera icon with play symbol) or automatically after 5 minutes of inactivity.

In orbit mode:
- `frameloop` switches from `"demand"` to `"always"` while active
- Camera position: `[sin(t) * 20, 8, cos(t) * 20]` where t increments 0.00087 radians per frame (at 60fps, one full revolution in 120s)
- Camera always looks at hall center `[5, 0, 10]`
- Any user input (click, scroll, touch) immediately exits orbit mode
- A subtle vignette overlay fades in during orbit mode (CSS `box-shadow: inset 0 0 80px rgba(0,0,0,0.5)`)
- UI panels auto-hide in orbit mode (toolbar and sidebar slide out via CSS transition)

#### First-Person Walkthrough Camera (Presentation Mode)
A fully immersive camera mode at player height (0.9m above floor):
- Camera starts at the tee of hole 1, looking toward hole 1's cup
- Arrow keys / WASD / on-screen joystick move forward/back and strafe
- Mouse drag / touch drag rotates view
- Automatic "tour mode": camera follows the flow path from tee to cup of each hole in sequence, pausing 3 seconds at each cup before moving to the next tee
- In tour mode, hole numbers appear as floating 3D text labels that pulse when the camera approaches them
- Exit: Escape key / tap anywhere (mobile)

This is the biggest "wow" feature for showing friends. Walk through your own designed venue.

---

## 3. "Wow" UI Elements

### 3.1 The UV Mode Transition — "Lights Out"

**Current state:** UV toggle is a button. Materials switch. Done.

**Proposed: A 3-second theater lighting sequence**

When the user taps the UV button:

**Phase 1 (0-800ms): Flicker**
- CSS animation on the entire canvas wrapper: `opacity` pulses 1.0 → 0.3 → 1.0 → 0.2 → 1.0 with irregular timing (like fluorescent tubes warming up)
- Audio cue (if sound enabled): low-frequency electrical hum begins, rises in pitch
- The UV button itself glows: add CSS `box-shadow: 0 0 12px #9D00FF, 0 0 24px #9D00FF`

**Phase 2 (800ms-1400ms): Darkness**
- Canvas fades to near-black (opacity 0.05) — the "lights off" moment
- UI panels simultaneously dim: sidebar and toolbar `opacity: 0.2`
- Audio cue: sharp click + hum sustain

**Phase 3 (1400ms-2400ms): Neon awakening**
- Fade up with the UV materials already set: canvas opacity animates 0.05 → 1.0 over 800ms
- Bloom postprocessing fades in (start with low intensity 0.1, animate to 1.2 over 600ms via a ref)
- Particle dust system starts its drift
- UI panels re-brighten to their dark-mode versions
- Audio cue: satisfying UV tube buzz + sparkle sound

**Phase 4 (2400ms): Hold**
- Full UV mode. Screen glows.
- The UV button now has a subtle pulsing glow animation (CSS keyframes, 2s period, glow intensity oscillates between 60% and 100%)

**Reverse transition (UV off):**
- Same flicker sequence but reversed — a 1-second warmup sequence as "planning lights" come on
- Sky dome fades in as the venue "lights" convert back to planning daylight

**Implementation:** Pure CSS transitions + a `useRef`-based animation state machine in a new `UVTransition.tsx` component that wraps the canvas. The Three.js materials still switch instantly under the hood — the CSS animation masks the transition.

### 3.2 Particle Effects

**Dust Motes in Blacklight (UV mode):**
- 400 points using `THREE.Points` with custom `ShaderMaterial`
- Each point: random position in the hall volume (0-10m x, 0.2-4m y, 0-20m z)
- Drift: y position increments by `0.01 * Math.random()` per frame, resets to 0 when y > 4.5
- Color: cycling through neon palette colors per particle (static per particle — not changing per frame)
- Size: 0.02-0.06m world space, rendered as soft circles via custom shader
- Fragment shader: radial gradient from white center to transparent edge — creates soft glow orb look
- `frameloop="always"` only while UV mode is active and particles are visible

**Snap Confirmation Burst:**
When a hole snaps to the grid during placement, a burst of 8 particles radiates from the snap point:
- Duration: 400ms
- Particles travel outward at random angles, fade from neon green to transparent
- Implemented as a CSS/DOM animation (not Three.js) — a temporary absolute-positioned `<canvas>` element drawn over the 3D viewport at the cursor position
- Distance: 20px radius over 400ms
- Uses `requestAnimationFrame` for the burst, removes DOM element when complete

**Flow Path Pulse:**
When flow path is visible in UV mode, the path is not a static line — it pulses:
- The flow path `TubeGeometry` uses a `ShaderMaterial` with a `time` uniform
- Fragment shader: UV coordinate along the tube maps to a traveling bright spot
- Effect: a bright neon cyan band travels along the path from hole to hole, taking ~2s per hole, looping
- This visually communicates "ball travels this way"

### 3.3 Sound Design Concept

A lightweight, opt-in sound layer. All sounds are disabled by default, enabled via a speaker icon in the toolbar.

Sound events and their audio characteristics:

| Event | Sound | Duration | Notes |
|-------|-------|----------|-------|
| Hole placement (valid snap) | Satisfying "thwack" + high bell ping | 300ms | Like a game piece snapping into a board |
| Hole placement (invalid) | Short low "bonk" | 200ms | Immediate feedback |
| UV mode on | Fluorescent tube flicker + buzz | 2400ms | Matches the visual sequence |
| UV mode off | Brief buzz-off + click | 800ms | |
| Delete hole | Soft "poof" (reverse of placement) | 250ms | |
| Snap toggle on | Light "click" + mag resonance | 200ms | Like a magnet activating |
| Camera to 3D | Whoosh with slight depth reverb | 500ms | Camera moving through space |
| Budget warning | Subtle bell with trailing resonance | 400ms | Friendly, not alarming |
| Builder save | Ascending tones (C-E-G) | 600ms | Satisfying completion |

**Implementation approach:**
- All sounds are 5-15KB OGG/MP3 files hosted as public assets
- Single `AudioManager` class handles loading (`AudioContext`) and playback
- Never block the main thread — load on first user interaction (Chrome policy)
- The UV mode sequence is the only multi-stage sound — use `AudioContext.schedule()` to choreograph
- Total audio asset budget: under 100KB compressed

### 3.4 Micro-Interactions

**Hole card hover in sidebar:**
When hovering a hole type card in the library:
- The color swatch on the card expands from 8×8px to fill the entire card background at 15% opacity (CSS transition 200ms)
- The card border color transitions to the hole's color
- A tiny 3D preview SVG (top-down silhouette of the hole shape) fades in on the right

**Hole placement ghost trail:**
As the cursor/finger drags across the canvas, the ghost hole leaves a faint trail:
- Store the last 8 positions of the ghost hole
- Render 8 copies of the ghost at 5%, 10%, 15%... 50% opacity (each older position more transparent)
- `requestAnimationFrame` updates positions — does not use Three.js re-render for the trail
- Creates a motion blur / drag trail effect that shows the direction of movement

**Selection pulse:**
When a hole is selected, instead of a static yellow outline, it pulses:
- CSS `@keyframes` on a DOM overlay (thin border element positioned to match the 3D hole's screen-space bounds)
- Glow oscillates between Neon Violet `#9D00FF` at 60% and 100% intensity over 1.5s
- The 3D mesh gets a neon outline using `<Edges>` from drei with animated `color` prop

**Button press ripple:**
All toolbar and sidebar buttons get a neon ripple on click:
- Standard material-design ripple pattern
- Ripple color matches the button's active state color (violet, cyan, green)
- Radius expands from 0 to full button width in 400ms, opacity 0.4 → 0

---

## 4. Presentation Mode

### 4.1 Full Venue Tour

A dedicated fullscreen "Tour Mode" accessed via a new button: a play icon labeled "Tour" in the toolbar.

**On activation:**
- All UI panels slide out (toolbar slides up off screen, sidebar slides left, bottom bar slides down)
- Canvas fills the full viewport
- A thin control strip appears at the bottom: `[Pause] [Restart] [Exit]` — semi-transparent dark strip, height 44px
- Auto-tour begins: first-person camera at 0.9m height follows the flow path

**Tour sequence per hole:**
1. Approach shot: camera at tee position, looking toward the cup along the fairway (2s)
2. Fly-over: camera rises to 2m and arcs over the obstacle (1.5s smooth spline)
3. Cup view: camera arrives at the cup, looking back toward the tee (1s)
4. Transition: camera rises to 3m, fades to the next hole's tee approach (1s crossfade)

**Visual treatment during tour:**
- Hole number appears as a large Orbitron numeral in the corner: `HOLE 3` fading in/out between transitions
- Flow path glow pulse is active
- UV mode is automatically enabled during tour (the venue at its best)
- Bloom intensity bumped from 1.2 to 1.8 for cinematic quality

**Auto-loop:** After the last hole, camera pulls back to a dramatic overhead view of the entire venue at 6m height, rotates 360° over 8 seconds, then restarts

### 4.2 Split-Screen: Floor Plan + 3D

A `view: "split"` mode that divides the canvas horizontally:
- Left 50%: top-down 2D view (orthographic, same as current top view)
- Right 50%: 3D isometric view (same as current 3D view)
- Both views share the same hole state — selecting a hole highlights it in both panels simultaneously
- A vertical divider between the panels is draggable to resize proportions (stored in local state)
- Toolbar stays active, all tools work in either panel

**Layout sketch:**
```
┌─────────────────────────────────────────────────────────┐
│ GOLF FORGE [toolbar buttons...]              Split | Tour│
├───────────────────────┬─────────────────────────────────┤
│ [Sidebar]             │  2D TOP VIEW  ║  3D ISO VIEW     │
│                       │               ║                  │
│                       │   [hall top]  ║  [hall 3D]       │
│                       │               ║                  │
│                       │               ║                  │
└───────────────────────┴───────────────╨──────────────────┘
│ [Location bar]                                           │
└─────────────────────────────────────────────────────────┘
```

Implementation: Two separate `<Canvas>` instances side by side, both reading from the same Zustand store. Avoid — this doubles Three.js context overhead. Instead: single `<Canvas>` with the viewport divided using `gl.setViewport()` calls, rendering the scene twice per frame with different camera parameters.

### 4.3 Before/After: Empty vs. Designed

A dramatic before/after slider mode:
- Single canvas
- A vertical CSS `clip-path` divider can be dragged left/right
- Left of divider: the hall is rendered empty (no holes visible)
- Right of divider: the hall is rendered with all placed holes
- The divider is a bright neon line (2px, color `#00F5FF`)
- Dragging the divider is driven by `pointer-move` events

Technical implementation:
- No actual Three.js split — use CSS `clip-path: inset(0 50% 0 0)` on a hidden second canvas that renders without holes
- First canvas (with holes) renders normally beneath
- The second "empty hall" canvas is positioned absolutely on top, clipped by a CSS property driven by drag position
- Smooth drag because it is pure CSS repainting, not Three.js

---

## 5. Social and Fun Features

### 5.1 Shareable "Showcase" Link

A "Share" button in the toolbar opens a modal:

**Share Modal layout:**
```
┌────────────────────────────────────┐
│ SHARE YOUR VENUE                   │
│                                    │
│ [Screenshot preview 280×200px]     │
│                                    │
│ Link:  [https://golf-forge.app/...] [Copy]
│                                    │
│ Share to: [WhatsApp] [Signal] [Telegram]
│                                    │
│ ○ View only  ● Full edit access    │
│                                    │
│              [Generate Link]       │
└────────────────────────────────────┘
```

**Technical approach (client-side, no server):**
- Export the current Zustand state as JSON (using existing `buildExportData()`)
- Compress with LZ-string (JavaScript library, ~7KB) → ~60% size reduction
- Base64 encode → embed in URL hash: `golf-forge.app/#plan=<b64_data>`
- On app load: detect `#plan=` in URL, decode, deserialize, load into store
- Typical plan JSON: ~8-15KB raw, ~3-6KB compressed, ~4-8KB base64 → fits in a URL
- No server, no database, no expiry, no login required

**WhatsApp/Signal/Telegram deep links:**
- WhatsApp: `https://wa.me/?text=Check+out+my+mini+golf+plan!+<url>`
- These are standard web share links that open the respective app with the pre-filled message

**Screenshot auto-capture:**
- When the Share modal opens, automatically trigger a screenshot capture
- Display the captured PNG as the preview thumbnail in the modal
- User can retake (opens the UV mode transition then captures at peak bloom)

### 5.2 Friend Reaction System

In the embedded "view-only" share mode (when someone opens a shared link without edit intent):

A floating reaction bar at the bottom of the canvas:
```
[🔥 3] [❤️ 1] [😮 2] [Add reaction]
```

Reactions are stored in `localStorage` under the plan's hash key. Not persistent across devices (no server). The reaction bar is shown in view-only mode only — planners don't see their own reactions overlaid on the design.

**Annotation system:**
- In view-only mode, tap anywhere on the canvas → a comment dot appears with a text input
- Comments are stored as `{ x, z, text, author }` in the URL hash alongside the plan data
- The annotated URL can be re-shared with the comments embedded
- Comments appear as floating label bubbles on the floor plan (styled like sticky notes — Neon Amber `#FFB700` background, dark text)
- In edit mode, annotations are visible but not interactive — a banner: "3 comments from collaborators" with a toggle to show/hide them

### 5.3 Progress Celebration

**Milestone events with confetti:**

| Milestone | Trigger | Celebration |
|-----------|---------|-------------|
| First hole placed | `holeOrder.length === 1` | Small burst, "HOLE 1 PLACED" toast |
| Hole 9 placed | `holeOrder.length === 9` | Bigger burst, "HALFWAY THERE! 9 holes" |
| Hole 18 placed | `holeOrder.length === 18` | Full confetti rain, "YOUR COURSE IS COMPLETE!" |
| Budget under 80% | First time actual < 80% of estimated | Money bag animation, "ON BUDGET!" |
| First custom hole saved | Builder save | Stars burst, "CUSTOM HOLE CREATED!" |

**Confetti implementation:**
- Use `canvas-confetti` library (3KB gzip) — it renders on a temporary `<canvas>` element overlaid on the app
- Neon palette colors for confetti particles (not standard rainbow)
- For UV mode celebrations: particles are glowing neon dots instead of paper shapes
- Toast notifications: Tailwind-styled dark-mode toasts in the top-right corner, slide in from right, auto-dismiss after 4s

**The "complete course" moment:**
When hole 18 is placed, a 3-second full-screen celebration sequence:
1. Confetti rain from top
2. The hall briefly pulses with rapid UV flicker (UV transition effect)
3. Auto-activates UV mode if not already on
4. Auto-triggers the Tour mode (optional — user can dismiss with "Show Tour" or "Continue Planning")
5. Toast: "Your venue is ready. Take a tour?" [Start Tour] [Keep Planning]

### 5.4 Mood Board / Inspiration Gallery

A new sidebar section or modal: "Inspire Me" — a curated gallery of reference images for blacklight mini golf venues.

**Gallery content (static, bundled):**
- 12 reference photos of real blacklight mini golf venues (licensed from Unsplash or own stock)
- Categories: "Dark Industrial", "Neon Pop", "Space Theme", "Jungle/Nature UV", "Retro Arcade"
- Each card: 180×120px image, venue name, location, link to source

**Implementation:**
- Static JSON file + images in `public/inspiration/`
- A lazy-loaded `InspirationGallery.tsx` component
- Accessed via a "Inspire" button in the hole library sidebar header
- Modal overlay with horizontal scroll of cards
- Clicking any card opens the full-size image in a lightbox

**"Copy look" feature:**
Each inspiration card has a "Apply Palette" button that extracts the dominant colors from the image (using `<canvas>` color sampling) and suggests matching UV emissive colors for the user's holes — mapping the hole types to the extracted palette. A preview appears showing how the current layout would look in those colors.

---

## 6. Google Earth Integration UI

### 6.1 Aerial Context in the 3D Scene

As described in section 2.1 (Layer 2), the aerial tile approach grounds the venue in its actual location. Extended concept:

**Neighboring structures visible:**
At Gewerbepark 17, the building is in an industrial park. The aerial view would show:
- Adjacent warehouse/factory buildings (appear as gray rectangles in the aerial)
- The access road (Gewerbepark street)
- Parking areas
- Surrounding fields

**Building footprint overlay:**
The 10×20m hall footprint is precisely positioned on the aerial based on the actual GPS footprint of the BORGA steel building. A subtle magenta border `#FF0090` at 0.02 opacity outlines the hall footprint on the aerial — users can see "this is exactly where it sits on the real property".

**Scale reference:**
The aerial at 100m × 100m with the 10×20m hall shows the surrounding context. The parking area visible in the aerial gives scale intuition — users realize "the hall is actually not that big compared to the whole property."

### 6.2 Street-Level Context Panel

A new tab in the sidebar: "Context" (between Budget and the Location Bar).

**Context tab layout:**
```
LOCATION CONTEXT
─────────────────
[Static Street View thumbnail 220×120px]
 Gewerbepark 17, Gramastetten
 Click to open Google Maps

SURROUNDINGS
• Industrial/commercial zone
• Parking: onsite (unpaved gravel)
• Access: B126 Feldkirchner Strasse
• Nearest town: Gramastetten (0.8km)
• Rail: no direct rail access

SUN PATH
● Summer solstice noon: 18.5° elev.
● Winter solstice noon: 18.5° elev.
● East windows: morning glare risk
● South windows: ★ low winter sun
```

Implementation: Static data for the surroundings text (it won't change). The Street View thumbnail is a static image saved in `public/site-context/streetview.jpg` — captured once from Google Maps and bundled.

### 6.3 Sun Path Visualization on the Actual Terrain

An overlay visualization on the minimap showing the sun arc:

**Minimap enhancement:**
- The existing 150×150px OpenStreetMap minimap tile gets an SVG overlay
- SVG draws an arc representing the sun's path across the sky projected as a compass rose
- The arc traces from sunrise azimuth to sunset azimuth (from `suncalc.getTimes()`)
- The current sun position is shown as a dot on the arc
- The hall building is shown as a white rectangle on the minimap (instead of just a red dot)
- Cardinal directions (N/E/S/W) labeled at minimap edges

**Sun path arc math:**
```
For each hour of the day:
  sunPos = SunCalc.getPosition(hour, LOCATION.lat, LOCATION.lng)
  if sunPos.altitude > 0:
    // Convert azimuth to minimap compass coordinates
    x = mapCenterX + sin(sunPos.azimuth) * 50px
    y = mapCenterY - cos(sunPos.azimuth) * 50px  // y inverted (north = up)
    draw arc point at (x, y)
```

Color gradient on the arc: sunrise `#FF6B35` → midday `#FFD700` → sunset `#FF6B35`

### 6.4 Neighborhood Context: Parking and Access

An overlay in the 3D scene (visible in planning mode only):

**Parking zone indicator:**
A semi-transparent cyan rectangle `#00F5FF` at 20% opacity, positioned north of the hall (offset by ~15m on z axis), size 15×8m. A `<Text>` label from drei: "PARKING (GRAVEL)".

**Access road indicator:**
A gray rectangle `#808080` at 30% opacity extending from the hall entrance (south end) at an angle, representing the Gewerbepark access road. A directional arrow shows the approach direction from the main road.

**These overlays are toggled via a new "Context" toolbar button** (map pin icon) — off by default. When enabled, they appear as a faint AR-style overlay on the planning floor, giving spatial context.

---

## 7. Implementation Priority Stack

The concepts above are ordered by estimated implementation effort vs. wow factor. For actual phasing:

### Tier 1 — Maximum Wow, Feasible in One Phase (~3-4 days)

1. **Dark UI by default** — eliminate all `bg-white` and `bg-gray-100`. Single Tailwind config change + find-replace pass. Transforms the entire feel instantly.
2. **Lucide icons** — replace Unicode characters. Visual refinement, 1 day.
3. **UV transition animation** — CSS keyframe sequence on canvas wrapper. Pure frontend, no Three.js changes. 0.5 days.
4. **Snap burst particle** — DOM canvas animation at cursor position. 0.5 days.
5. **URL-encoded shareable link** — `lz-string` + URL hash. No server needed. 1 day.
6. **Milestone confetti** — `canvas-confetti` library, milestone detection in store selectors. 0.5 days.

### Tier 2 — High Impact, Moderate Effort (~5-7 days)

7. **Dust mote particles** — Three.js `Points` with custom shader. Needs `frameloop="always"` guard. 1.5 days.
8. **UV flow path pulse** — `ShaderMaterial` on tube geometry. 1 day.
9. **Camera smooth transitions** — lerp in `useFrame`. 1 day.
10. **Aerial context texture** — fetch + apply OpenStreetMap tile as ground plane. 1 day.
11. **Auto-orbit "screensaver"** — `useFrame` orbit loop, inactivity timer. 1 day.
12. **Orbitron typography + brand mark** — Google Fonts addition to `index.html`. 0.5 days.

### Tier 3 — Premium Features, Significant Effort (~2-3 weeks)

13. **First-person walkthrough camera** — OrbitControls replacement with FPS controls, auto-tour spline. 4-5 days.
14. **Split-screen 2D+3D** — dual viewport rendering. 2-3 days.
15. **Before/after slider** — CSS clip-path dual canvas. 2 days.
16. **Sound system** — audio loading, playback manager, sound assets. 2-3 days.
17. **Inspiration gallery** — gallery UI, image assets, color extraction. 2 days.
18. **Sun path arc on minimap** — SVG overlay math. 1.5 days.
19. **Annotation system** — URL-embedded comments. 2 days.

---

## 8. Design Token Reference

A complete set of design tokens for implementation. These would become CSS custom properties in `src/index.css` and Tailwind config extensions.

### Colors
```css
:root {
  /* Brand palette */
  --color-void: #07071A;
  --color-deep-space: #0F0F2E;
  --color-plasma: #1A1A4A;
  --color-grid-ghost: #2A2A5E;

  /* Neon accents */
  --color-neon-violet: #9D00FF;
  --color-neon-violet-glow: rgba(157, 0, 255, 0.3);
  --color-neon-cyan: #00F5FF;
  --color-neon-cyan-glow: rgba(0, 245, 255, 0.3);
  --color-neon-green: #00FF88;
  --color-neon-green-glow: rgba(0, 255, 136, 0.3);
  --color-neon-amber: #FFB700;
  --color-neon-pink: #FF0090;

  /* Text */
  --color-text-primary: #E8E8FF;
  --color-text-secondary: #7070AA;
  --color-text-data: #00F5FF;
  --color-text-price: #FFB700;

  /* Shadows / Glows */
  --glow-violet: 0 0 8px rgba(157, 0, 255, 0.6), 0 0 20px rgba(157, 0, 255, 0.3);
  --glow-cyan: 0 0 8px rgba(0, 245, 255, 0.6), 0 0 20px rgba(0, 245, 255, 0.3);
  --glow-green: 0 0 8px rgba(0, 255, 136, 0.6), 0 0 20px rgba(0, 255, 136, 0.3);
}
```

### Tailwind Config Extension
```javascript
// tailwind.config.js additions
extend: {
  colors: {
    void: '#07071A',
    'deep-space': '#0F0F2E',
    plasma: '#1A1A4A',
    ghost: '#2A2A5E',
    neon: {
      violet: '#9D00FF',
      cyan: '#00F5FF',
      green: '#00FF88',
      amber: '#FFB700',
      pink: '#FF0090',
    }
  },
  fontFamily: {
    display: ['Orbitron', 'sans-serif'],
    body: ['Inter', 'sans-serif'],
    mono: ['JetBrains Mono', 'monospace'],
  },
  keyframes: {
    'uv-flicker': {
      '0%, 100%': { opacity: '1' },
      '20%': { opacity: '0.3' },
      '40%': { opacity: '0.9' },
      '60%': { opacity: '0.1' },
      '80%': { opacity: '0.8' },
    },
    'neon-pulse': {
      '0%, 100%': { boxShadow: '0 0 8px rgba(157,0,255,0.6)' },
      '50%': { boxShadow: '0 0 20px rgba(157,0,255,1), 0 0 40px rgba(157,0,255,0.4)' },
    },
    'snap-burst': {
      '0%': { transform: 'scale(0)', opacity: '1' },
      '100%': { transform: 'scale(3)', opacity: '0' },
    }
  },
  animation: {
    'uv-flicker': 'uv-flicker 0.8s ease-in-out',
    'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
    'snap-burst': 'snap-burst 0.4s ease-out forwards',
  }
}
```

### Three.js Scene Constants (additions to src/constants)
```typescript
// src/constants/visualTheme.ts
export const VOID_COLOR = '#07071A';
export const DEEP_SPACE_COLOR = '#0F0F2E';

export const UV_SCENE = {
  ambientColor: '#220044',
  ambientIntensity: 0.15,
  fogColor: '#0A0A1A',
  fogNear: 8,
  fogFar: 25,
  floorColor: '#0A0A1A',
  floorMetalness: 0.4,
  floorRoughness: 0.3,
  rectLightColor: '#8800FF',
  rectLightIntensity: 0.8,
  dustParticleCount: 400,
  dustParticleSpeed: 0.01,
} as const;

export const PLANNING_SCENE = {
  ambientColor: '#FFFFFF',
  ambientIntensity: 0.6,
  hemisphereSkyColar: '#E8F4FD',
  hemisphereGroundColor: '#B8860B',
  hemisphereIntensity: 0.3,
  shadowMapSize: 2048, // desktop, 512 mobile
} as const;

export const BLOOM_CONFIG = {
  intensity: 1.2,
  intensityCinematic: 1.8, // for tour mode
  luminanceThreshold: 0.05,
  luminanceSmoothing: 0.4,
} as const;
```

---

## 9. UI Layout Sketches

### 9.1 Desktop: Full Dark Theme
```
┌─────────────────────────────────────────────────────────────────────┐
│ [GOLF FORGE]  [↖Select] [+Place] [⊗Delete] | [⌛Snap] [→Flow] [□3D]│
│ #07071A bg   [⚡UV] | [↩] [↪] | [🔊] [Share]      [Snap] [SVG] [≡]│
├──────────────────┬──────────────────────────────────────────────────┤
│ [#1A1A4A bg]     │  [Canvas: #07071A]                              │
│                  │                                                   │
│ HOLE TYPES       │  ┌────────────────────────────────────┐          │
│ ─────────────    │  │  10m × 20m BORGA Hall              │          │
│ [#2A2A5E border] │  │  [Holes glowing in neon UV mode]   │          │
│ [●] Straight     │  │  [Flow path pulsing cyan]          │          │
│ [●] L-Shape      │  │  [Dust particles drifting up]      │          │
│ [●] Dogleg       │  └────────────────────────────────────┘          │
│ ...              │                                                   │
│                  │                                      [MiniMap]   │
│ MY HOLES         │                                      [SunCtrls]  │
│ ─────────────    │                                                   │
│ [+Build Custom]  │                                                   │
├──────────────────┴──────────────────────────────────────────────────┤
│ Gewerbepark 17 · 48.3715°N 14.2140°E · 526m · ☀ 34° elev · [>]    │
└─────────────────────────────────────────────────────────────────────┘
```

### 9.2 Mobile: Immersive Dark Canvas
```
┌──────────────────────────────┐
│  Canvas fills entire screen  │
│  #07071A background          │
│                              │
│  ┌────────────────────────┐  │
│  │  Hall (10×20m)         │  │
│  │  UV glow holes         │  │
│  │  [1] [2] [3]...        │  │
│  │  Flow path pulsing     │  │
│  └────────────────────────┘  │
│                   [MiniMap]  │
├──────────────────────────────┤
│ [↖] [+] [⊗] | [⚡] [□] [→] │
│ Bottom toolbar #0F0F2E       │
└──────────────────────────────┘
  ^^ Swipe up for Holes Drawer
```

### 9.3 UV Transition: Mid-Flicker Frame
```
┌─────────────────────────────────────────────────────────────────────┐
│ [GOLF FORGE] [⚡UV ← GLOWING VIOLET BOX-SHADOW]                    │
├──────────────────┬──────────────────────────────────────────────────┤
│ [sidebar dim 20%]│  [Canvas: opacity 0.1 → BLACK → neon awakening] │
│                  │                                                   │
│  [all text faded]│  [flickering in darkness]                       │
│                  │                                                   │
└──────────────────┴──────────────────────────────────────────────────┘
```

### 9.4 Share Modal
```
┌──────────────────────────────────────────┐
│  SHARE YOUR VENUE             ×          │
│  ──────────────────────────────          │
│  [Screenshot: 280×200px neon preview]   │
│                                          │
│  [🔄 Retake in UV mode]                 │
│                                          │
│  Plan Link:                              │
│  ┌──────────────────────────────────┐   │
│  │ golf-forge.app/#plan=abc123...   │ [Copy] │
│  └──────────────────────────────────┘   │
│                                          │
│  [WhatsApp] [Signal] [Telegram] [More]  │
│                                          │
│  ○ View only  ● Edit access             │
│                                          │
│  [Generate Shareable Link]              │
└──────────────────────────────────────────┘
```

---

## 10. Self-Review: What Is Achievable vs. Aspirational

### Achievable immediately (existing tech stack, no new infra)
- Dark theme (Tier 1): the single highest-impact change. Eliminates all white backgrounds. Pure Tailwind class replacement. Estimated 1 day.
- Lucide icons: 1 day, pure refactor
- UV transition animation: 0.5 days, pure CSS
- Shareable URL hash: 1 day, `lz-string` + URL detection
- Confetti celebrations: 0.5 days, `canvas-confetti`
- Orbitron font: 1 hour
- Snap burst animation: 0.5 days, DOM canvas

**6-7 days of work creates 80% of the "wow" improvement.**

### Technically feasible but requires care
- Dust particles: needs `frameloop` mode switching guard to avoid battery drain
- Flow path shader: needs custom `ShaderMaterial` — intermediate Three.js
- Aerial context texture: public tile server ToS check (OSM allows lightweight use)
- Camera lerp: works, but requires careful handling of OrbitControls camera sync

### Genuinely complex / deferred
- First-person walkthrough: full FPS camera system, spline math for tour path
- Sound system: browser audio policy headaches, user consent flow
- Annotation/collaboration: comment state in URL blows up URL length over 3 comments
- Split-screen dual viewport: double render cost, OrbitControls sync complexity

### Risk items
- `lz-string` URL approach: a layout with 18 custom template holes could exceed URL limits (~2000 chars practical). Mitigation: fall back to `localStorage` key sharing for large plans.
- Audio in mobile Safari: requires user gesture before any audio plays. Every sound event must originate from a user action, not a timer.
- `frameloop="always"` for particles: significant battery drain on mobile. Must use visibility detection (`document.hidden`) to pause animation when tab is not visible.

---

## Appendix: Current App → Future App Mapping

| Current | Future |
|---------|--------|
| `bg-white` toolbar | `bg-[#0F0F2E]` with subtle `border-b border-[#2A2A5E]` |
| `bg-gray-100` buttons | `bg-[#1A1A4A]` with `hover:bg-[#2A2A5E]` |
| `bg-blue-600` active | `bg-[#9D00FF]` with `box-shadow: var(--glow-violet)` |
| Unicode "↗" icons | Lucide `MousePointer2` SVG |
| "UV" text button | `<Zap>` icon + "UV" label with neon-pulse animation when active |
| Static flow path | Pulsing `ShaderMaterial` tube with traveling bright band |
| Gray canvas background | `#07071A` Void black with dust particles |
| Instant UV toggle | 2.4s flicker-to-dark-to-neon theater sequence |
| No sharing | URL-hash shareable link |
| No celebrations | `canvas-confetti` milestone bursts |
| 2D top or 3D iso | 2D top, 3D iso, split, tour, first-person |
| Static minimap | Sun arc overlay on minimap |
| No context | Aerial texture ground plane |
| No brand | "GOLF FORGE" in Orbitron, left of toolbar |
