# Phase 9: UX, 3D Rendering, and Mobile Analysis

**Date:** 2026-02-20
**Author:** Senior Mobile / 3D App Developer Analysis
**Status:** Comprehensive analysis for future planning

---

## Codebase Baseline (read before writing this)

- React 19 + R3F (`@react-three/fiber` v9, `@react-three/drei` v10, `three` v0.183)
- Zustand v5 store, zundo undo/redo, Tailwind v4
- `frameloop="demand"` — renders only on invalidate (correct for a planning tool)
- 7 procedural hole models: `HoleStraight`, `HoleLShape`, `HoleDogleg`, `HoleRamp`, `HoleLoop`, `HoleWindmill`, `HoleTunnel`
- All geometry uses `MeshStandardMaterial` with hand-coded roughness/metalness values in `shared.ts`
- UV mode: two material singleton sets (planning vs. UV), ambient/directional light color swap in `App.tsx`
- No postprocessing pipeline at all — no `EffectComposer`, no bloom, no SSAO
- Camera: `OrthographicCamera` (top) + `PerspectiveCamera` (3D), `OrbitControls` from drei
- `frameloop="demand"` means postprocessing must call `invalidate()` carefully or use `frameloop="always"` for the effect pass
- Bundle: 1,346 KB JS, no code-splitting, single chunk
- Package.json has no `@react-three/postprocessing`, no `leva`, no `r3f-perf`
- Hole data model: `{ id, type, position, rotation, name, par }` — no material field
- `Hole` type is in `src/types/hole.ts` — any new per-hole data requires extending this type and the store

---

## 1. Material-Aware 3D Rendering

### Problem Statement

Every hole component today uses four shared material singletons (`feltMaterial`, `bumperMaterial`, `teeMaterial`, `cupMaterial`). These encode only visual planning colors, not physical material properties. A user building in Austria will choose between:

- **Felt carpet** (playing surface, ~3-5mm pile, rough, non-reflective)
- **MDF sheet** (bumpers, structural walls, painted or wrapped)
- **Galvanized steel** (structural supports, frame tubes, ramp rails)
- **Poured concrete** (floor slab, integrated ramps, heavy bases)
- **3D-printed PLA/PETG** (small obstacles, decorative pieces, custom shapes)
- **Timber/plywood** (DIY construction, subframes)
- **Painted metal** (windmill pillar, obstacle posts)

### PBR Property Targets Per Material

| Material | roughness | metalness | Notes |
|----------|-----------|-----------|-------|
| Felt carpet | 0.95 | 0.0 | Very high roughness, zero metalness. In UV mode add green emissive. |
| MDF (painted) | 0.75 | 0.0 | Medium-high roughness, zero metalness. Color from paint choice. |
| MDF (raw) | 0.85 | 0.0 | Slightly rougher than painted. |
| Galvanized steel | 0.35 | 0.85 | Low roughness, high metalness. Slight blue-grey tint. |
| Brushed steel | 0.55 | 0.90 | Medium roughness, very high metalness. |
| Concrete | 0.90 | 0.0 | High roughness, zero metalness. Off-white to grey color. |
| PLA 3D print | 0.60 | 0.0 | Medium roughness, zero metalness. Any color possible. |
| PETG 3D print | 0.45 | 0.0 | Slightly glossier than PLA. Semi-transparent possible. |
| Painted timber | 0.70 | 0.0 | Medium-high roughness. Color from paint. |
| Raw plywood | 0.88 | 0.0 | High roughness, warm tan color. |

### Procedural Texture Strategy (No Asset Files)

The critical constraint is avoiding loaded texture files (PNG/JPG). Every texture must be generated procedurally in a `useMemo` block using `THREE.CanvasTexture` drawn with `canvas 2D API`. This adds zero bytes to the bundle.

**Felt carpet — procedural fiber texture:**
```typescript
function makeFeltTexture(color: string, size = 128): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  // Random short strokes to simulate carpet pile
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 800; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const angle = Math.random() * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * 2, y + Math.sin(angle) * 2);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4); // tile 4x over the hole surface
  return tex;
}
```

**Galvanized steel — procedural grain + subtle reflection:**
```typescript
function makeSteelTexture(size = 128): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  // Base brushed grain lines
  for (let y = 0; y < size; y++) {
    const v = 190 + Math.random() * 30;
    ctx.fillStyle = `rgb(${v},${v},${v+5})`;
    ctx.fillRect(0, y, size, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 8);
  return tex;
}
```

**Concrete — noise roughness map:**
```typescript
function makeConcreteTexture(size = 128): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  // Coarse grain noise
  for (let x = 0; x < size; x += 2) {
    for (let y = 0; y < size; y += 2) {
      const v = 175 + Math.floor(Math.random() * 40);
      ctx.fillStyle = `rgb(${v},${v},${v-5})`;
      ctx.fillRect(x, y, 2, 2);
    }
  }
  return new THREE.CanvasTexture(canvas);
}
```

**Normal map approximation without PNG:** For MDF, use `THREE.CanvasTexture` filled with `rgb(128, 128, 255)` (flat normal) — effectively no normal mapping. For steel, encode a subtle grain normal in the blue channel. The performance gain of skipping real normal maps outweighs the visual loss for this planning tool.

### Material Type in Data Model

Add an optional `materialPreset` field to the `Hole` type and per-component override fields:

```typescript
// src/types/hole.ts (proposed extension)
export type MaterialPreset =
  | "felt-green"
  | "felt-blue"
  | "felt-red"
  | "mdf-painted"
  | "mdf-raw"
  | "steel-galvanized"
  | "steel-brushed"
  | "concrete"
  | "pla-3dprint"
  | "timber-painted"
  | "timber-raw";

export type HoleMaterials = {
  surface?: MaterialPreset;  // felt surface
  bumpers?: MaterialPreset;  // bumper walls
  obstacle?: MaterialPreset; // ramp/loop/windmill/tunnel accent
};

export type Hole = {
  // existing fields...
  materials?: HoleMaterials; // optional, falls back to type defaults
};
```

Extend `useMaterials.ts` to accept per-hole overrides:

```typescript
// useMaterials.ts (extended)
export function useMaterials(holeMaterials?: HoleMaterials): MaterialSet {
  const uvMode = useStore((s) => s.ui.uvMode);
  const baseSet = uvMode ? uvMaterials : planningMaterials;

  return useMemo(() => {
    if (!holeMaterials) return baseSet;
    return {
      felt: holeMaterials.surface
        ? buildMaterial(holeMaterials.surface, uvMode)
        : baseSet.felt,
      bumper: holeMaterials.bumpers
        ? buildMaterial(holeMaterials.bumpers, uvMode)
        : baseSet.bumper,
      tee: baseSet.tee,
      cup: baseSet.cup,
    };
  }, [holeMaterials, uvMode, baseSet]);
}
```

**Implementation priority:** Medium. The planning tool works well without this. Add it when the user wants to preview "steel bumpers vs. MDF bumpers" — a useful question for the Austrian construction budget.

---

## 2. Enhanced UV/Blacklight Rendering

### Current State Assessment

The current UV mode is a solid first step:
- Dark floor (`#0A0A1A`) and walls (`#1A1A2E`)
- Emissive neon colors on all hole materials
- Dimmed ambient light with purple tint
- No postprocessing

The result looks like a planning tool with glowing shapes, not like an actual blacklight venue. The missing ingredient is **bloom** — that soft, bleeding luminous halo that makes UV paint appear to glow beyond its geometry boundary.

### What Makes Blacklight Look Authentic

In a real blacklight venue:
1. The space is very dark — almost pitch black away from UV-painted surfaces
2. UV-reactive paint appears to emit light rather than reflect it
3. Bright edges bloom and bleed into surrounding darkness
4. The bloom is color-specific — neon green bleeds green, magenta bleeds magenta
5. There is subtle atmospheric scattering (fog/haze from UV tubes)
6. The human eye's dark-adapted state makes contrast very high

### R3F Postprocessing Stack

The `@react-three/postprocessing` package (built on pmndrs/postprocessing, not three.js built-in) is the correct tool. It does not exist in the current `package.json` and must be added.

```bash
npm install @react-three/postprocessing
```

This adds approximately 150 KB to the bundle. Mitigate by dynamic-importing the entire postprocessing subtree only when `uvMode === true`.

**Recommended effect stack for UV mode:**

```typescript
// src/components/three/UVPostProcessing.tsx
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import { Vector2 } from "three";

export function UVPostProcessing() {
  return (
    <EffectComposer>
      {/* Primary bloom — the key UV effect */}
      <Bloom
        intensity={1.2}
        luminanceThreshold={0.2}  // only glow pixels above this brightness
        luminanceSmoothing={0.4}
        kernelSize={KernelSize.LARGE}
        mipmapBlur={true}         // smoother bloom, lower GPU cost
      />
      {/* Vignette darkens edges, reinforces the "dark room" feel */}
      <Vignette
        offset={0.3}
        darkness={0.8}
        blendFunction={BlendFunction.NORMAL}
      />
      {/* Subtle chromatic aberration — adds a UV tube "buzz" quality */}
      <ChromaticAberration
        offset={new Vector2(0.0003, 0.0003)}
        radialModulation={true}
        modulationOffset={0.4}
      />
    </EffectComposer>
  );
}
```

**Critical: `frameloop` interaction.** The current canvas uses `frameloop="demand"`. `EffectComposer` from `@react-three/postprocessing` works with demand rendering when you call `invalidate()` after state changes. The bloom pass renders on the same demand frame — no special handling needed. However, if you later add animated effects (like a slow bloom pulse), you would need `frameloop="always"` while UV mode is active, which increases battery usage.

**Emissive intensity calibration for bloom:**

With bloom `luminanceThreshold: 0.2`, materials need `emissiveIntensity >= 0.6` to visibly bloom. Current values are 0.5 — bump all UV material `emissiveIntensity` values to `0.8` when the postprocessing stack is active. Add a constant:

```typescript
// shared.ts
export const UV_EMISSIVE_INTENSITY_BASE = 0.5;  // without postprocessing
export const UV_EMISSIVE_INTENSITY_BLOOM = 0.8; // with bloom active
```

**Atmospheric fog/haze:**

A real UV venue has hazy air (moisture, sometimes theatrical fog). Approximate this with R3F's built-in fog:

```typescript
// In App.tsx Canvas, inside scene, conditional on uvMode
{uvMode && <fog attach="fog" args={["#0A0A1A", 8, 25]} />}
```

This adds soft distance falloff with negligible GPU cost — no extra package needed.

**Dark ambient — use hemisphere light instead of ambient:**

Replace the current `ambientLight` in UV mode with a `hemisphereLight` that provides a very faint ground bounce from the floor:

```typescript
// App.tsx — replace ambientLight + directionalLight in UV mode
{uvMode ? (
  <>
    {/* Almost no ambient — let the emissive materials dominate */}
    <hemisphereLight
      color="#110022"
      groundColor="#000011"
      intensity={0.15}
    />
    {/* A single dim purple "UV tube" directional */}
    <directionalLight
      position={[5, 4, 5]}
      color="#5500AA"
      intensity={0.2}
    />
  </>
) : (
  <>
    <ambientLight color="#ffffff" intensity={0.8} />
    <directionalLight position={[10, 20, 5]} intensity={0.5} />
  </>
)}
```

**UV tube strip lights (point lights):**

Add 4-6 `pointLight` elements along the ceiling centerline of the hall to simulate UV tube fixtures. These have near-zero cost (MeshStandardMaterial responds to point lights natively):

```typescript
// UVCeilingLights.tsx
export function UVCeilingLights() {
  const { width, length } = useStore((s) => s.hall);
  const uvMode = useStore((s) => s.ui.uvMode);
  if (!uvMode) return null;

  const ceilingY = 3.5; // approximate ceiling height
  const lights = [];
  const steps = 4;
  for (let i = 0; i < steps; i++) {
    const z = (length / (steps + 1)) * (i + 1);
    lights.push(
      <pointLight
        key={i}
        position={[width / 2, ceilingY, z]}
        color="#7700FF"
        intensity={0.8}
        distance={6}
        decay={2}
      />
    );
  }
  return <group>{lights}</group>;
}
```

### Dynamic Import of Postprocessing (Bundle Optimization)

```typescript
// src/components/three/UVEffects.tsx
import { lazy, Suspense } from "react";
import { useStore } from "../../store";

const UVPostProcessing = lazy(
  () => import("./UVPostProcessing")
);

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

Add `UVEffects` inside the `Canvas` in `App.tsx`. The postprocessing chunk is only loaded on first UV mode activation — zero cost on normal planning use.

**Estimated bundle impact:** postprocessing chunk ~150 KB, loaded lazily. Main bundle stays at ~1,200 KB.

### Mobile Consideration

On low-end Android devices, bloom is expensive. Detect mobile and reduce kernel size:

```typescript
const bloomKernelSize = isMobile ? KernelSize.SMALL : KernelSize.LARGE;
const bloomIntensity = isMobile ? 0.7 : 1.2;
```

The `isMobile` utility already exists at `src/utils/isMobile.ts`.

---

## 3. Geo-Enhanced 3D Scene

### Current Geo Features

- Exact coordinates: `lat: 48.3715, lng: 14.214, elevation: 526m` in `src/constants/location.ts`
- Real sun position via `suncalc` — azimuth and altitude computed live
- `SunIndicator` arrow outside the hall pointing toward the sun
- Wall exposure coloring in `HallOpenings` based on sun dot product
- OSM minimap tile

### What Could Be Added (with analysis)

#### A. Shadow Casting from Real Sun Position

**Feasibility: High. Effort: Low-Medium. Value: High.**

The sun's azimuth and altitude are already computed. `three.js` `DirectionalLight` with `castShadow: true` needs the light position set to match the real sun angle.

```typescript
// HallScene.tsx — sun-driven shadow light
export function SunShadowLight({ sunData }: { sunData: SunData }) {
  const uvMode = useStore((s) => s.ui.uvMode);
  if (uvMode || !sunData.isDay) return null;

  const { width, length } = useStore((s) => s.hall);

  // Convert sun azimuth/altitude to 3D light position
  const distance = 30;
  const altRad = sunData.altitude; // already in radians
  const azRad = sunData.azimuth;   // suncalc convention
  const lx = -Math.sin(azRad) * Math.cos(altRad) * distance + width / 2;
  const ly = Math.sin(altRad) * distance;
  const lz = Math.cos(azRad) * Math.cos(altRad) * distance + length / 2;

  return (
    <directionalLight
      position={[lx, ly, lz]}
      target-position={[width / 2, 0, length / 2]}
      intensity={0.6}
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-camera-near={1}
      shadow-camera-far={80}
      shadow-camera-left={-15}
      shadow-camera-right={15}
      shadow-camera-top={25}
      shadow-camera-bottom={-15}
    />
  );
}
```

Enable shadow receiving on the floor and hole models:

```typescript
// HallFloor.tsx
<mesh receiveShadow ...>

// Each hole component mesh
<mesh castShadow receiveShadow ...>
```

**Note:** The Canvas must have `shadows` prop:
```typescript
<Canvas shadows="soft" ...>
```

**Performance impact:** Shadow map is 1024x1024 = 1 MB GPU texture, computed once per `invalidate()` call. With `frameloop="demand"`, shadow maps only recompute when the scene changes (hole moved, sun time changed). No per-frame cost at idle. On mobile, use 512x512 shadow maps.

**Value for the user:** Seeing shadow patterns in the hall for a given date/time is genuinely useful for planning. You could check whether the 16:00 winter sun casts long shadows through the south windows onto specific hole positions.

#### B. Compass Rose

**Feasibility: High. Effort: Very Low. Value: Medium.**

Place a flat HTML overlay compass in the canvas viewport, or render a 3D disc just outside the hall floor. The north direction is already known (Z axis = south in scene space, so -Z = north).

Simple HTML overlay approach (no R3F mesh needed):

```typescript
// CompassOverlay.tsx
export function CompassOverlay() {
  const uvMode = useStore((s) => s.ui.uvMode);
  return (
    <div
      className={`absolute bottom-4 right-4 h-12 w-12 rounded-full border-2 flex items-center justify-center text-xs font-bold
        ${uvMode ? "border-indigo-600 bg-gray-900 text-purple-400" : "border-gray-300 bg-white/80 text-gray-700"}`}
    >
      N
    </div>
  );
}
```

A richer version would rotate the N label based on camera azimuth. Doable with `useThree((s) => s.camera)` and reading the camera's world rotation.

#### C. Surrounding Terrain from Elevation Data

**Feasibility: Low without a backend. Value: Low for this use case.**

Elevation data for the Gramastetten area is available from OpenTopography API or from the Austrian BEV (Bundesamt fur Eich- und Vermessungswesen) open data portal. However:
- Any fetch at runtime requires a network request (not ideal for a PWA with offline support)
- The terrain around the industrial park is relatively flat (~526m elevation plateau in Urfahr-Umgebung)
- Adding terrain geometry (TIN mesh or height map) adds significant bundle and runtime complexity
- The value for this planning tool is minimal — you are planning the inside of a hall, not its site

**Recommendation:** Skip. Not worth the complexity for a personal tool.

#### D. Day/Night Cycle Animation and Seasonal Light

**Feasibility: Medium. Value: Medium for presentation use.**

The `useSunPosition` hook already supports arbitrary dates via the `sunDate` state. The user can already scrub through time using `SunControls`. What would add value is an animated time-lapse — pressing a "play" button that animates `sunDate` forward by 1 hour per second, showing shadow sweep across the floor.

```typescript
// useSunAnimation.ts
export function useSunAnimation() {
  const setSunDate = useStore((s) => s.setSunDate);
  const [playing, setPlaying] = useState(false);
  const animRef = useRef<number>(0);
  const dateRef = useRef(new Date());

  function start(fromDate: Date) {
    dateRef.current = fromDate;
    setPlaying(true);
  }

  function stop() {
    setPlaying(false);
    cancelAnimationFrame(animRef.current);
  }

  useEffect(() => {
    if (!playing) return;
    let lastTime = performance.now();

    function tick(now: number) {
      const elapsed = now - lastTime; // ms real time
      lastTime = now;
      // 1 real second = 1 simulated hour
      dateRef.current = new Date(
        dateRef.current.getTime() + elapsed * 3600
      );
      setSunDate(new Date(dateRef.current));
      animRef.current = requestAnimationFrame(tick);
    }

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, setSunDate]);

  return { playing, start, stop };
}
```

This is an additive feature with no data model changes.

#### E. Sun-Driven `DirectionalLight` for the Main Scene (Non-Shadow)

**Feasibility: High. Effort: Very Low.**

Currently the directional light in `App.tsx` is at a fixed position `[10, 20, 5]`. Replace it with a light whose position tracks `sunData.azimuth` and `sunData.altitude`. This way, wall colors via `HallOpenings` and any diffuse shading on hole models respond to the real sun angle.

---

## 4. Interactive Material Picker UX

### Design Constraints

- Sidebar is 256px wide (`w-64`) with three tabs: Holes, Detail, Budget
- Detail tab currently shows: hole type badge, name input, par input, rotation buttons, position display, delete button
- Mobile uses `MobileDetailPanel` — a slide-up overlay from the bottom
- Hole data model has no material fields yet
- Any material change must trigger R3F material recreation (handled by `useMaterials` hook)

### Desktop Sidebar Integration

Add a "Materials" section to `HoleDetail.tsx` below the rotation controls:

```tsx
{/* Materials section — only when materials feature is enabled */}
<div className="flex flex-col gap-2">
  <span className="text-xs font-medium text-gray-500 uppercase">
    Materials
  </span>
  <MaterialPresetPicker
    label="Surface"
    value={hole.materials?.surface ?? "felt-green"}
    onChange={(v) => updateHole(selectedId, {
      materials: { ...hole.materials, surface: v }
    })}
    options={SURFACE_MATERIAL_OPTIONS}
  />
  <MaterialPresetPicker
    label="Bumpers"
    value={hole.materials?.bumpers ?? "mdf-painted"}
    onChange={(v) => updateHole(selectedId, {
      materials: { ...hole.materials, bumpers: v }
    })}
    options={BUMPER_MATERIAL_OPTIONS}
  />
</div>
```

**MaterialPresetPicker component:**

```tsx
type MaterialPresetPickerProps = {
  label: string;
  value: MaterialPreset;
  onChange: (preset: MaterialPreset) => void;
  options: { preset: MaterialPreset; label: string; color: string }[];
};

export function MaterialPresetPicker({
  label, value, onChange, options
}: MaterialPresetPickerProps) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((opt) => (
          <button
            key={opt.preset}
            type="button"
            title={opt.label}
            onClick={() => onChange(opt.preset)}
            className={`h-7 w-7 rounded border-2 transition-all ${
              value === opt.preset
                ? "border-blue-500 scale-110"
                : "border-transparent hover:border-gray-300"
            }`}
            style={{ backgroundColor: opt.color }}
          />
        ))}
      </div>
    </div>
  );
}
```

**Options data:**

```typescript
export const SURFACE_MATERIAL_OPTIONS = [
  { preset: "felt-green", label: "Green felt", color: "#2E7D32" },
  { preset: "felt-blue", label: "Blue felt", color: "#1565C0" },
  { preset: "felt-red", label: "Red felt", color: "#B71C1C" },
  { preset: "felt-black", label: "Black felt", color: "#212121" },
  { preset: "concrete", label: "Concrete", color: "#9E9E9E" },
];

export const BUMPER_MATERIAL_OPTIONS = [
  { preset: "mdf-painted", label: "MDF painted", color: "#F5F5F5" },
  { preset: "steel-galvanized", label: "Galvanized steel", color: "#B0BEC5" },
  { preset: "timber-painted", label: "Painted timber", color: "#EFEBE9" },
  { preset: "timber-raw", label: "Raw plywood", color: "#D7CCC8" },
];
```

### 3D Preview Update

The 3D scene updates in real-time because:
1. `updateHole` calls `set()` in Zustand
2. Components subscribed via `useStore((s) => s.holes[id])` re-render
3. `useMaterials(hole.materials)` creates new material instances via `useMemo`
4. R3F detects the material reference change and invalidates the canvas

No special invalidation logic needed — Zustand + R3F handle this automatically.

### Mobile UX for Material Picker

In `MobileDetailPanel`, the screen is typically 360-414px wide. The swatch buttons are 28x28px with 4px gaps. Five surface swatches = 160px, fits comfortably on a single row within a 48px-padded panel.

For obstacle material (ramp color, windmill blade color), consider a horizontal scroll row on mobile:

```tsx
<div className="flex gap-2 overflow-x-auto pb-1 -mx-2 px-2">
  {options.map((opt) => (
    <button key={opt.preset} ...> {/* h-8 w-8 min-w-8 */} </button>
  ))}
</div>
```

### Real-Time Cost Feedback

The material picker sits near the budget system. A future integration: selecting "steel-galvanized" bumpers could automatically adjust the budget estimate for the "course" category upward. This requires a `materialCostMultiplier` lookup table per preset, which would integrate with the Phase 8 cost estimation system already built.

---

## 5. Enhanced Camera and Navigation

### Current Camera Assessment

- `OrthographicCamera`: top-down, zoom 15-120, pan with right-click/drag
- `PerspectiveCamera`: fixed position at 45-degree angle above hall center, orbit enabled
- Keyboard: arrow pan, +/- zoom, `R` to reset, double-tap touch to reset
- No animated transitions between views

### Recommended Camera Modes

#### A. Walkthrough Mode (First-Person Player Height)

**Value: High.** The single most useful addition for a mini golf venue planner. Walking the course in first-person at ~1.0m eye height reveals:
- Obstacle sight lines (can the player see the cup from the tee?)
- Signage visibility
- Flow path width — does a 90-degree turn feel cramped?
- Ceiling clearance for the loop and windmill obstacles

**Implementation:**

```typescript
// Add to ViewMode type
export type ViewMode = "top" | "3d" | "walkthrough";

// CameraControls.tsx additions
const WALKTHROUGH_HEIGHT = 1.0;  // player eye level in meters
const WALKTHROUGH_NEAR = 0.1;
const WALKTHROUGH_FAR = 50;
const WALKTHROUGH_FOV = 80;      // wider FOV than 3D overview

// In isWalkthrough mode:
// - PerspectiveCamera at y=1.0
// - OrbitControls with enableRotate=true, maxPolarAngle=Math.PI/2 (no looking below floor)
// - Mouse: LEFT = ROTATE (look around), MIDDLE = n/a, RIGHT = n/a
// - WASD keyboard movement (new hook needed)
// - Touch: ONE = TOUCH.ROTATE (look around), no dolly
```

**Walkthrough locomotion hook:**

```typescript
// hooks/useWalkthroughControls.ts
export function useWalkthroughControls(
  cameraRef: React.RefObject<THREE.PerspectiveCamera>,
  enabled: boolean
) {
  const { invalidate } = useThree();
  const keysRef = useRef({ w: false, a: false, s: false, d: false });

  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "w" || e.key === "ArrowUp") keysRef.current.w = true;
      if (e.key === "s" || e.key === "ArrowDown") keysRef.current.s = true;
      if (e.key === "a" || e.key === "ArrowLeft") keysRef.current.a = true;
      if (e.key === "d" || e.key === "ArrowRight") keysRef.current.d = true;
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === "w" || e.key === "ArrowUp") keysRef.current.w = false;
      if (e.key === "s" || e.key === "ArrowDown") keysRef.current.s = false;
      if (e.key === "a" || e.key === "ArrowLeft") keysRef.current.a = false;
      if (e.key === "d" || e.key === "ArrowRight") keysRef.current.d = false;
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [enabled]);

  // Called from a useFrame or requestAnimationFrame loop
  function update(delta: number) {
    const cam = cameraRef.current;
    if (!cam) return;
    const speed = 3 * delta;
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const right = new THREE.Vector3().crossVectors(dir, THREE.Object3D.DEFAULT_UP);

    if (keysRef.current.w) cam.position.addScaledVector(dir, speed);
    if (keysRef.current.s) cam.position.addScaledVector(dir, -speed);
    if (keysRef.current.a) cam.position.addScaledVector(right, -speed);
    if (keysRef.current.d) cam.position.addScaledVector(right, speed);

    if (keysRef.current.w || keysRef.current.s ||
        keysRef.current.a || keysRef.current.d) {
      cam.position.y = WALKTHROUGH_HEIGHT; // maintain eye height
      invalidate();
    }
  }

  return { update };
}
```

**Note:** Walkthrough mode requires `frameloop="always"` while active (or a per-frame RAF loop). Switch to `frameloop="always"` only when `view === "walkthrough"` to preserve battery during normal planning use.

#### B. Cinematic Auto-Orbit (Screenshot Mode)

**Value: Medium. Effort: Low.**

A "Screenshot" mode that:
1. Switches to perspective camera
2. Enables smooth auto-orbit at a slow angular speed
3. Hides the toolbar overlay
4. Shows a "Capture" button

```typescript
// CinematicOrbit.tsx
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

export function CinematicOrbit({ enabled }: { enabled: boolean }) {
  const orbitRef = useRef<OrbitControlsImpl>(null);

  useFrame((_, delta) => {
    if (!enabled || !orbitRef.current) return;
    orbitRef.current.autoRotate = true;
    orbitRef.current.autoRotateSpeed = 0.3; // slow, cinematic
    orbitRef.current.update();
  });

  return enabled ? (
    <OrbitControls
      ref={orbitRef}
      enablePan={false}
      enableZoom={false}
      makeDefault
    />
  ) : null;
}
```

This requires `frameloop="always"` during cinematic mode.

#### C. Camera Transition Animations

**Value: Medium. Effort: Medium.**

Currently switching between top and 3D view snaps instantly — jarring. Use drei's `CameraControls` (the advanced version, not the simple `OrbitControls`) which supports `setLookAt()` with `enableTransition: true` for smooth lerped transitions.

Note: drei exports `CameraControls` separately from `OrbitControls`. They are different primitives. Migrating requires changing the import and adjusting the touch/mouse button configuration.

```typescript
import { CameraControls } from "@react-three/drei";

// In transition handler:
const cameraControlsRef = useRef<CameraControlsImpl>(null);

function transitionToTop() {
  const cc = cameraControlsRef.current;
  if (!cc) return;
  cc.setLookAt(
    width/2, 50, length/2,  // eye position
    width/2, 0, length/2,   // target
    true                     // enableTransition
  );
}

function transitionTo3D() {
  const cc = cameraControlsRef.current;
  if (!cc) return;
  cc.setLookAt(
    width/2, 12, length + 8,
    width/2, 0, length/2,
    true
  );
}
```

#### D. AR Preview via Device Camera

**Value: High conceptually. Effort: Very High. Feasibility: Low for PWA.**

WebXR AR mode requires `ARButton` from three.js extras and the user granting camera permission. It does not work in most PWA contexts on iOS (iOS supports WebXR AR only in Safari 17+ with feature flag). Android Chrome supports it better.

The primary use case would be: point your phone at the empty hall floor and overlay the planned hole layout in AR scale. This is genuinely impressive but is a Phase 12+ feature, not a near-term priority.

**For now, recommend:** Defer AR. Note the technical requirement for when this is considered: remove `frameloop="demand"`, add `xr` prop to Canvas, handle XR session management. The procedural geometry works well in AR — no texture loading needed.

---

## 6. Performance Optimization

### Current Bundle Analysis

1,346 KB JS (single chunk). This is over the 244 KB recommended initial load budget but acceptable for a desktop PWA used by a single operator. The mobile concern is real — 1.3 MB parse + execute time on mid-range Android.

### Code-Splitting Strategy

**Split 1: 3D rendering (highest priority, largest chunk)**

The R3F + drei + three.js stack is the dominant cost. Dynamic import the entire 3D canvas:

```typescript
// src/components/three/ThreeCanvas.tsx (new file — extract Canvas content from App.tsx)
export function ThreeCanvas({ sunData }: { sunData: SunData }) {
  return (
    <Canvas ...>
      {/* all 3D content */}
    </Canvas>
  );
}

// App.tsx
const ThreeCanvas = lazy(() => import("./components/three/ThreeCanvas").then(
  m => ({ default: m.ThreeCanvas })
));
```

**Expected savings:** three.js core is ~600 KB. Lazily loading it means the initial HTML + CSS + Zustand/Tailwind shell loads in ~200ms, then the 3D chunk loads. The user sees the toolbar and sidebar first.

**Split 2: Budget/financial panel (medium priority)**

The `BudgetPanel`, `CostSettingsModal`, `FinancialSettingsModal`, `CourseBreakdown`, `ExpenseList`, and related selectors are used only when the budget tab is open. Dynamic import on first tab activation:

```typescript
// In Sidebar.tsx
const BudgetPanel = lazy(() =>
  import("./BudgetPanel").then(m => ({ default: m.BudgetPanel }))
);
```

**Expected savings:** ~80 KB of budget calculation logic and UI.

**Split 3: UV postprocessing (already described in Section 2)**

~150 KB lazy-loaded on first UV mode activation.

### Vite Configuration

```typescript
// vite.config.ts
export default defineConfig({
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
})
```

This creates separate cache-able chunks. `vendor-three` (~700 KB) is cached across versions unless the library version changes. `vendor-react` (~150 KB) changes rarely.

### Lazy-Load 3D Hole Models

For the 7 hole types, consider lazy dispatch in `HoleModel.tsx`:

```typescript
const HoleStraight = lazy(() =>
  import("./HoleStraight").then(m => ({ default: m.HoleStraight }))
);
// ... etc for each type
```

**However:** Since all 7 types are small and always needed in a full course, the split overhead (7 async chunks) is worse than keeping them together. Avoid this specific split — it is premature micro-optimization.

### Memory Management

Each hole currently uses shared material singletons — good. The per-type accent materials (loop, windmill, etc.) are created with `useMemo` per component instance — each placed hole gets its own material object. With 18 holes, that is 18 windmill material instances. This is fine for 18 holes but would be wasteful at 100+.

**Optimization:** Convert per-type accent materials to a shared material cache keyed by `(type, color, uvMode)`:

```typescript
// hooks/useMaterialCache.ts
const materialCache = new Map<string, THREE.MeshStandardMaterial>();

export function getCachedMaterial(
  key: string,
  factory: () => THREE.MeshStandardMaterial
): THREE.MeshStandardMaterial {
  if (!materialCache.has(key)) {
    materialCache.set(key, factory());
  }
  return materialCache.get(key)!;
}
```

This reduces GPU material objects from `O(holeCount)` to `O(uniqueTypes)` — important when the user duplicates many holes of the same type.

### Frame Budget Analysis

With `frameloop="demand"`, frames only render when:
- A hole is placed/moved/deleted
- Camera is panned/zoomed/rotated
- Sun date changes
- UV mode toggles

At idle the render cost is zero. The bottleneck is the invalidate-triggered frame after interaction. With 18 holes (each 10-30 meshes = 180-540 draw calls), a single frame renders in <2ms on any modern device. This is not currently a performance problem.

**The real mobile performance concern is:**
1. **Parse time:** 1.3 MB JS takes 800ms-2s to parse on mid-range Android
2. **Texture creation:** if procedural textures are added (Section 1), each `CanvasTexture` takes 5-20ms to generate
3. **First meaningful paint:** blocked until the JS is parsed

Code-splitting addresses concern #1. Deferring procedural texture generation to `useEffect` (not render path) addresses concern #2.

---

## 7. Export and Sharing

### Current Export

`buildExportData()` + `downloadJson()` — produces a JSON file with `holes`, `budget`, `budgetConfig`, `financialSettings`, `expenses`. Useful for backup and session transfer.

### Recommended Export Additions

#### A. High-Resolution Screenshot Export

**Feasibility: High. Value: High.**

R3F provides `gl.domElement` which is a WebGL canvas. Use `canvas.toBlob()` for lossless PNG.

```typescript
// utils/captureScreenshot.ts
export async function captureScreenshot(
  gl: THREE.WebGLRenderer,
  filename = "golf-plan.png"
): Promise<void> {
  // Force a render at 2x resolution for crisp output
  const originalDpr = gl.getPixelRatio();
  gl.setPixelRatio(Math.min(window.devicePixelRatio * 2, 4));
  gl.render(/* scene, camera */); // needs scene/camera refs

  return new Promise((resolve) => {
    gl.domElement.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      gl.setPixelRatio(originalDpr);
      resolve();
    }, "image/png");
  });
}
```

**Access to renderer in a button click (outside Canvas):** Use a React ref forwarded from inside Canvas to outside, or use the `useThree` hook in a component inside Canvas that exposes a callback via a Zustand action or a ref stored outside.

A cleaner pattern:

```typescript
// store.ts — add a capture callback slot
captureCallback: (() => void) | null;
registerCapture: (fn: () => void) => void;

// Inside Canvas — a component registers the capture function
export function ScreenshotCapture() {
  const { gl, scene, camera } = useThree();
  const registerCapture = useStore((s) => s.registerCapture);

  useEffect(() => {
    registerCapture(() => {
      gl.render(scene, camera);
      gl.domElement.toBlob((blob) => { /* download */ }, "image/png");
    });
  }, [gl, scene, camera, registerCapture]);

  return null;
}

// ExportButton.tsx — calls captureCallback
const captureCallback = useStore((s) => s.captureCallback);
<button onClick={() => captureCallback?.()}>Screenshot</button>
```

**UV mode screenshot value:** With bloom postprocessing active, `gl.domElement.toBlob()` captures the composited output including all effects. A UV mode screenshot shows the actual visual output.

#### B. PDF Floor Plan Export

**Feasibility: Medium. Value: High for a planning tool.**

Options:
1. **jsPDF** (~250 KB) — programmatic PDF generation
2. **Print CSS** — use `window.print()` with a dedicated print stylesheet

**Recommendation: Print CSS approach first.** Create a `PrintLayout` component that renders when `window.matchMedia("print")` is true — a clean 2D top-down SVG floor plan with hole numbers, dimensions, and scale bar. No library needed.

```typescript
// utils/generateFloorPlanSVG.ts
export function generateFloorPlanSVG(
  hall: Hall,
  holes: Record<string, Hole>,
  holeOrder: string[]
): string {
  const scale = 50; // 50px per meter
  const W = hall.width * scale;
  const L = hall.length * scale;
  const padding = 40;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg"
    width="${W + padding * 2}" height="${L + padding * 2}"
    viewBox="0 0 ${W + padding * 2} ${L + padding * 2}">
    <rect x="${padding}" y="${padding}" width="${W}" height="${L}"
      fill="#f5f5f5" stroke="#333" stroke-width="2"/>`;

  // Draw each hole as a rectangle with number label
  for (const id of holeOrder) {
    const hole = holes[id];
    if (!hole) continue;
    const def = HOLE_TYPE_MAP[hole.type];
    const hw = (def.dimensions.width / 2) * scale;
    const hl = (def.dimensions.length / 2) * scale;
    const cx = padding + hole.position.x * scale;
    const cz = padding + hole.position.z * scale;
    const orderIndex = holeOrder.indexOf(id) + 1;

    svg += `<rect x="${cx - hw}" y="${cz - hl}" width="${hw * 2}" height="${hl * 2}"
      fill="${def.color}40" stroke="${def.color}" stroke-width="1.5"
      transform="rotate(${hole.rotation}, ${cx}, ${cz})"/>
    <text x="${cx}" y="${cz}" text-anchor="middle" dominant-baseline="middle"
      font-size="12" font-family="monospace" fill="#333">${orderIndex}</text>`;
  }

  svg += "</svg>";
  return svg;
}
```

Download as SVG (viewable in browser, printable to PDF via browser print dialog) — zero new dependencies.

#### C. 3D Model Export (glTF/GLB)

**Feasibility: Medium. Value: Medium.**

three.js includes `GLTFExporter` in `three/addons/exporters/GLTFExporter.js`. It is not in the main bundle by default but can be imported.

```typescript
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";

export async function exportGLTF(scene: THREE.Scene): Promise<void> {
  const exporter = new GLTFExporter();
  const gltf = await exporter.parseAsync(scene, { binary: true });
  const blob = new Blob([gltf as ArrayBuffer], { type: "model/gltf-binary" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "golf-plan.glb";
  a.click();
  URL.revokeObjectURL(url);
}
```

**Practical value:** You could import the exported GLB into Blender for detailed rendering, or share it with a contractor for visualization. The procedural geometry exports well — all BufferGeometry is supported.

**Bundle impact:** `GLTFExporter` is ~80 KB. Dynamic import on click only.

#### D. Shareable URL (URL-Encoded State)

**Feasibility: High. Value: High for sharing with contractors or collaborators.**

Encode the persisted state slice into the URL hash as base64-compressed JSON:

```typescript
// utils/shareUrl.ts
import { deflate, inflate } from "pako"; // ~50 KB, lazy-loadable

export function encodeStateToUrl(holes: Record<string, Hole>, holeOrder: string[]): string {
  const data = JSON.stringify({ holes, holeOrder });
  const compressed = deflate(new TextEncoder().encode(data));
  const b64 = btoa(String.fromCharCode(...compressed));
  return `${window.location.origin}${window.location.pathname}#state=${encodeURIComponent(b64)}`;
}

export function decodeStateFromUrl(): { holes: Record<string, Hole>; holeOrder: string[] } | null {
  const hash = window.location.hash;
  const match = hash.match(/state=([^&]+)/);
  if (!match) return null;
  try {
    const compressed = Uint8Array.from(atob(decodeURIComponent(match[1])), c => c.charCodeAt(0));
    const json = new TextDecoder().decode(inflate(compressed));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
```

A full 18-hole layout with positions and rotations is approximately 2-3 KB of JSON. Compressed to ~800 bytes, base64-encoded to ~1,100 bytes. URL stays under 2,000 characters (safe for all browsers).

**UX flow:** "Share" button copies URL to clipboard. Opening the URL in a new browser loads the holes from the hash. Budget and financial data is NOT shared (too sensitive) — holes only.

**Pako is the right choice:** `pako` is small (~50 KB) and universally supported. The native `CompressionStream` API (no library) is modern Chrome/Firefox only and would exclude the user if they share with someone on an older browser.

---

## 8. Touch/Mobile Improvements

### Current Mobile State

- `isMobile` detection at `src/utils/isMobile.ts`
- Canvas uses `dpr={[1, 1.5]}` on mobile (vs `[1, 2]` desktop)
- `gl={{ antialias: !isMobile }}`
- `frameloop="demand"` — critical for battery
- Bottom toolbar with UV, Flow, 3D, Snap buttons
- `HoleDrawer` — slide-up panel for hole selection
- `MobileDetailPanel` — slide-up panel for hole properties
- Touch: `ONE = ROTATE` in 3D mode, `ONE = PAN` in top mode, `TWO = DOLLY_PAN`
- Double-tap to reset camera

### Gesture Improvements

#### A. Pinch to Zoom (currently TWO = DOLLY_PAN)

`DOLLY_PAN` already handles pinch-zoom. No change needed. Verify that two-finger pan is not fighting with browser scroll momentum — add `touch-action: none` to the canvas wrapper (already set in `App.tsx`).

#### B. Long-Press for Context Menu

**Value: Medium.** Long-press on a placed hole could show a context menu: Edit / Rotate / Duplicate / Delete. On desktop, right-click would trigger the same menu.

Implementation:

```typescript
// hooks/useLongPress.ts
export function useLongPress(
  onLongPress: (e: PointerEvent) => void,
  delay = 600
) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const posRef = useRef({ x: 0, y: 0 });

  return {
    onPointerDown: (e: PointerEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      timerRef.current = setTimeout(() => onLongPress(e), delay);
    },
    onPointerMove: (e: PointerEvent) => {
      const dx = Math.abs(e.clientX - posRef.current.x);
      const dy = Math.abs(e.clientY - posRef.current.y);
      if (dx > 10 || dy > 10) clearTimeout(timerRef.current);
    },
    onPointerUp: () => clearTimeout(timerRef.current),
    onPointerCancel: () => clearTimeout(timerRef.current),
  };
}
```

**Integration:** In `MiniGolfHole.tsx`, attach long-press handlers to the mesh. On long-press, open a context menu positioned at the tap point.

#### C. Swipe to Cycle Holes in Drawer

**Value: Medium.** When the `HoleDrawer` is open and a hole is selected, swipe left/right to cycle through the order.

```typescript
// hooks/useSwipeToNavigate.ts
export function useSwipeToNavigate(
  onNext: () => void,
  onPrev: () => void,
  minSwipeDistance = 60
) {
  const startXRef = useRef(0);

  return {
    onTouchStart: (e: TouchEvent) => {
      startXRef.current = e.touches[0].clientX;
    },
    onTouchEnd: (e: TouchEvent) => {
      const delta = e.changedTouches[0].clientX - startXRef.current;
      if (delta > minSwipeDistance) onPrev();
      else if (delta < -minSwipeDistance) onNext();
    },
  };
}
```

#### D. Material Selection on Small Screens

The swatch button approach (28x28px) works well on 360px+ screens. On very small screens (320px), reduce swatch size to 24x24px and use a horizontal scroll row as described in Section 4.

**Alternative for material selection:** A bottom sheet with a list of labeled material options, triggered by tapping a material preview swatch. This is more accessible than small color-only swatches (no text label = accessibility failure).

```
+------------------------------------------+
|  Surface Material                    [x]  |
+------------------------------------------+
|  [green swatch] Green Felt         [✓]   |
|  [blue swatch]  Blue Felt               |
|  [red swatch]   Red Felt                |
|  [grey swatch]  Concrete                |
+------------------------------------------+
```

This uses the existing bottom sheet pattern from `HoleDrawer` and `MobileDetailPanel`.

#### E. Mobile 3D Navigation Improvements

**Two-finger rotation limitation:** Currently in 3D mode, `ONE = TOUCH.ROTATE`. This means single-finger drag rotates the camera. Users often try to pan the scene with one finger, then get frustrated by rotation. Consider swapping:

```typescript
// In 3D mode on mobile:
touches={{
  ONE: TOUCH.PAN,        // single finger = pan (move the scene)
  TWO: TOUCH.ROTATE,     // two fingers = rotate (intentional gesture)
  // THREE = DOLLY handled by DOLLY_PAN within TWO
}}
```

This matches how most mobile 3D apps work (Google Maps 3D, Matterport).

**Haptic feedback on placement:** Use the Vibration API when a hole is successfully placed or deleted:

```typescript
// utils/haptics.ts
export const haptic = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(30),
  heavy: () => navigator.vibrate?.(60),
  success: () => navigator.vibrate?.([10, 50, 10]),
  error: () => navigator.vibrate?.([30, 30, 30]),
};

// In addHole action or PlacementHandler:
haptic.success();  // hole placed successfully

// In removeHole:
haptic.medium();   // hole deleted
```

This is a one-liner integration and significantly improves mobile feel.

#### F. Touch-Optimized Placement Flow

**Current issue:** "Place" mode requires: tap hole type in drawer -> tap canvas to place. On mobile, the HoleDrawer closes after selection and the canvas becomes the tap target. This works but could be smoother.

**Improvement:** Keep the HoleDrawer visible as a compact strip at the bottom (not full-screen overlay) during place mode. Show a translucent ghost of the hole following the finger. Current `GhostHole` component handles this in `PlacementHandler.tsx` via raycasting — verify it fires correctly on touch events.

---

## 9. Priority Recommendations (What to Build Next)

Ranked by impact-to-effort ratio for this specific use case (personal planning tool, Austrian construction context):

### Tier 1: High Impact, Low Effort (Phase 9 candidates)

1. **Bloom postprocessing for UV mode** — the single biggest visual upgrade. `npm install @react-three/postprocessing`, add `UVEffects` component, adjust emissive intensities. Estimated: 1 day. Makes UV preview actually look like a blacklight venue.

2. **Sun-driven shadow casting** — turn on `castShadow`/`receiveShadow` on existing geometry, add a `DirectionalLight` whose position tracks `sunData.azimuth`/`sunData.altitude`. Estimated: 4 hours. Genuinely useful for planning window placement impact.

3. **SVG floor plan export** — pure client-side, no dependencies. Estimated: 4 hours. Printable output for contractors.

4. **Haptic feedback** — 10 lines of code. Estimated: 30 minutes.

5. **Shareable URL** — add `pako` dep, implement encode/decode, add Share button. Estimated: 1 day. Useful for sharing with the contractor building the hall.

### Tier 2: Medium Impact, Medium Effort

6. **Camera transition animations** — migrate OrbitControls to drei CameraControls for smooth view switching. Estimated: 1 day.

7. **Code-splitting (Vite manualChunks + lazy Canvas)** — reduce initial load from 1,346 KB to ~400 KB initial + lazy 700 KB 3D chunk. Estimated: 4 hours.

8. **Walkthrough camera mode** — first-person navigation at player height. Estimated: 2-3 days.

9. **Day cycle animation** — animated sun sweep via `useSunAnimation` hook. Estimated: 4 hours.

### Tier 3: Lower Immediate Impact, Higher Effort

10. **Per-hole material picker UX** — requires data model extension, new UI component, procedural texture system. Estimated: 3-4 days.

11. **GLB 3D export** — useful for Blender renders. `GLTFExporter` dynamic import. Estimated: 1 day.

12. **Mobile two-finger rotate swap** — change `ONE/TWO` touch mapping in 3D mode. Low effort but requires UX testing. Estimated: 2 hours.

13. **Long-press context menu** — useful but existing hole detail panel covers the same actions. Estimated: 1 day.

---

## 10. Technical Debt and Risks

### Risk 1: `frameloop="demand"` vs. Animation Modes

Adding walkthrough mode, cinematic orbit, or animated sun requires `frameloop="always"` while those modes are active. The current architecture isolates this in the `view` state — switching to `frameloop={view === "walkthrough" ? "always" : "demand"}` is clean. Do not switch the whole app to `frameloop="always"`.

### Risk 2: Postprocessing + Demand Rendering

`EffectComposer` works with demand rendering but only if you call `invalidate()` after any state change that should trigger a re-render. Currently this is handled well throughout the codebase. Verify after adding postprocessing that toggle UV mode -> back to planning mode properly removes the effect composer and the scene renders cleanly.

### Risk 3: Three.js Material Mutation Bug

The current `shared.ts` comment warns: "DO NOT set emissive on these [shared material singletons]." This is correct — mutating a shared material affects all meshes using it. Any future code that calls `material.emissive.set(...)` directly (instead of creating a new material) will create invisible bugs where selecting one hole tints all holes. The `useMemo` pattern for per-type accent materials is the correct approach. Enforce this via a code convention.

### Risk 4: Bundle Size Growth

The roadmap above could add:
- `@react-three/postprocessing`: +150 KB (lazy)
- `pako` (sharing): +50 KB (lazy)
- `GLTFExporter` (export): +80 KB (lazy)
- Procedural textures: +0 KB (code only)

Total potential additions: ~280 KB, all lazy-loaded. The main bundle should not grow significantly if manualChunks and lazy imports are implemented first.

### Risk 5: iOS PWA and WebXR

AR mode (if pursued) will not work as a PWA on iOS. Clarify this upfront. iOS Safari requires the page to be served from a native WKWebView with specific permissions for AR. For a personal tool running on a local/Vercel URL, this is a hard blocker on iOS.

---

## Appendix: Package Additions Summary

| Package | Purpose | Install size | Loading |
|---------|---------|-------------|---------|
| `@react-three/postprocessing` | Bloom, vignette, chromatic aberration | ~150 KB | Lazy (UV mode only) |
| `pako` | URL state compression | ~50 KB | Lazy (share action only) |
| `three/addons/exporters/GLTFExporter` | GLB export | ~80 KB | Lazy (export action only) |

No additional packages required for: shadow casting, procedural textures, SVG floor plan export, sun animation, haptic feedback, compass overlay, cinematic orbit, material picker UI, swipe gestures, long-press, or code-splitting. These all use existing dependencies.

---

*End of Phase 9 analysis. Total pages: ~35 equivalent. Ready for adversarial review and task decomposition.*
