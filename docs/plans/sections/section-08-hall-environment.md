# Section 08: Hall Environment Polish

## Overview

This section transforms the BORGA steel hall from flat-colored planes into a textured, realistic-looking building environment. The concrete floor gets a proper PBR texture with normal and roughness maps, and the steel panel walls get a corrugated iron texture. The existing MeshReflectorMaterial on the floor (Phase 11A) is preserved -- concrete textures are applied as the base layer with the reflection effect layered on top.

**What the user sees after this section:** The hall floor shows concrete slab texture with visible surface detail (normal map) instead of a flat gray/dark plane. The walls show corrugated steel panels instead of flat gray rectangles. In UV mode, the dark + emissive treatment still applies but with subtle texture detail underneath. On low-tier GPUs, flat-color materials are used (same as today) for performance.

**What stays the same:** All hall geometry, dimensions, doors, windows, placement logic, collision detection, and UI remain untouched. This is purely a material/texture upgrade.

## Dependencies

- **Section 01 (Straight Hole Glow-Up):** Provides the `useTexturedMaterials()` hook pattern, the `TexturedHole`/`FlatHole` dispatch pattern with Suspense + ErrorBoundary, and the texture asset directory structure under `public/textures/`.
- **No file overlap** with sections 02-07. This section modifies only `HallFloor.tsx`, `HallWalls.tsx`, and `Hall.tsx`.

## Files to Create or Modify

| File | Action | Purpose |
|------|--------|---------|
| `tests/components/three/hallEnvironment.test.ts` | **Create** | Tests for hall texture application and GPU tier gating |
| `public/textures/concrete/color.jpg` | **Create** | CC0 concrete floor color map (1K) |
| `public/textures/concrete/normal.jpg` | **Create** | CC0 concrete floor normal map (1K) |
| `public/textures/concrete/roughness.jpg` | **Create** | CC0 concrete floor roughness map (1K) |
| `public/textures/steel/color.jpg` | **Create** | CC0 corrugated steel color map (1K) |
| `public/textures/steel/normal.jpg` | **Create** | CC0 corrugated steel normal map (1K) |
| `public/textures/steel/roughness.jpg` | **Create** | CC0 corrugated steel roughness map (1K) |
| `public/textures/steel/metalness.jpg` | **Create** | CC0 corrugated steel metalness map (1K) |
| `src/components/three/HallFloor.tsx` | **Modify** | Add concrete texture support with GPU tier gating |
| `src/components/three/HallWalls.tsx` | **Modify** | Add steel panel texture support with GPU tier gating |
| `src/components/three/Hall.tsx` | **Modify** | Add Suspense wrapper for textured hall |

All paths relative to `/mnt/c/Users/Caus/Golf_Plan/golf-planner/`.

## Texture Sources (all CC0)

| Surface | Source | Resolution | Files |
|---------|--------|-----------|-------|
| Concrete floor | Poly Haven `concrete_floor_02` or ambientCG `Concrete034` | 1K JPG | color.jpg, normal.jpg, roughness.jpg |
| Corrugated steel | Poly Haven `corrugated_iron` or ambientCG `Metal034` | 1K JPG | color.jpg, normal.jpg, roughness.jpg, metalness.jpg |

**Fallback plan:** If CC0 textures cannot be sourced or downloaded, generate procedural textures using Canvas2D:
- **Concrete:** 256x256 canvas, fill with `#C0C0C0`, add Perlin-style noise patches in slightly different grays. Convert to `THREE.CanvasTexture`.
- **Steel:** 256x256 canvas, draw vertical corrugation ridges (alternating light/dark gray stripes with slight wave). Convert to `THREE.CanvasTexture`.

## Hall Dimensions (from `src/constants/hall.ts`)

- Floor: 10.00m (width) x 20.00m (length)
- Wall height: 4.30m
- Wall thickness: 0.10m

### UV Repeat Calculations

- **Concrete floor:** Repeat `[5, 10]` for a 2m tile size (10m / 5 = 2m per tile, 20m / 10 = 2m per tile)
- **Steel walls (long walls, 20m):** Repeat `[20, 1]` for ~1m corrugated panel width
- **Steel walls (short walls, 10m):** Repeat `[10, 1]` for the same ~1m panel width

---

## Tests (Write First)

**File:** `tests/components/three/hallEnvironment.test.ts`

These tests validate the pure logic functions extracted from the hall components. Texture loading (drei `useTexture`) requires a WebGL context and is not tested directly.

```
Tests to implement:

1. "getFloorMaterialConfig returns concrete texture paths for mid+ GPU tier in planning mode"
   - Call getFloorMaterialConfig({ gpuTier: "mid", uvMode: false })
   - Assert useTextures is true, color is "#E0E0E0"

2. "getFloorMaterialConfig returns dark color with no textures for UV mode"
   - Call getFloorMaterialConfig({ gpuTier: "mid", uvMode: true })
   - Assert color is "#07071A"

3. "getFloorMaterialConfig returns flat color for low GPU tier"
   - Call getFloorMaterialConfig({ gpuTier: "low", uvMode: false })
   - Assert useTextures is false, color is "#E0E0E0"

4. "getFloorUVRepeat returns [5, 10] for 10m x 20m hall (2m tile size)"
   - Call getFloorUVRepeat(10, 20)
   - Assert result equals [5, 10]

5. "getFloorUVRepeat scales with hall dimensions"
   - A 20m x 40m hall should produce [10, 20]

6. "getWallMaterialConfig returns steel texture paths for mid+ GPU tier in planning mode"
   - Call getWallMaterialConfig({ gpuTier: "mid", uvMode: false })
   - Assert useTextures is true, color is "#B0B0B0"

7. "getWallMaterialConfig returns dark color for UV mode"
   - Assert color is "#1A1A2E"

8. "getWallMaterialConfig returns flat color for low GPU tier"
   - Assert useTextures is false

9. "getWallUVRepeat returns correct repeat for long wall (20m)"
   - Assert [20, 1]

10. "getWallUVRepeat returns correct repeat for short wall (10m)"
    - Assert [10, 1]

11. "shouldLoadHallTextures returns false for low GPU tier"

12. "shouldLoadHallTextures returns true for mid GPU tier"

13. "shouldLoadHallTextures returns true for high GPU tier"

14. "floor in UV mode uses dark color #07071A"

15. "walls in UV mode use dark color #1A1A2E"
```

Each test imports pure functions. No R3F canvas required.

---

## Implementation Details

### Part 1: Texture Asset Acquisition

Download CC0 PBR texture assets and place them in `public/textures/`.

**Directory structure:**
```
public/textures/
  concrete/
    color.jpg       # Gray concrete slab texture
    normal.jpg      # Surface crack and grain normal map
    roughness.jpg   # Concrete roughness variation
  steel/
    color.jpg       # Corrugated steel panel texture
    normal.jpg      # Corrugation ridge normal map
    roughness.jpg   # Steel surface roughness
    metalness.jpg   # Steel metalness map (high metalness in ridges)
```

Sources:
- **Concrete:** Download from ambientCG `Concrete034` at 1K resolution. Extract `_Color`, `_NormalGL`, `_Roughness` JPGs and rename to `color.jpg`, `normal.jpg`, `roughness.jpg`.
- **Steel:** Download from ambientCG `Metal034` or Poly Haven `corrugated_iron` at 1K resolution. Extract and rename similarly.

### Part 2: Pure Logic Functions

Extract testable pure functions from the components.

#### HallFloor Pure Functions

Add exported functions to `src/components/three/HallFloor.tsx`:

```typescript
/** Tile size for concrete floor texture, in meters. */
const CONCRETE_TILE_SIZE = 2;

type FloorMaterialInput = { gpuTier: GpuTier; uvMode: boolean };
type FloorMaterialConfig = { useTextures: boolean; color: string };

/**
 * Determines floor material configuration based on GPU tier and UV mode.
 */
export function getFloorMaterialConfig(input: FloorMaterialInput): FloorMaterialConfig {
  const useTextures = input.gpuTier !== "low";
  const color = input.uvMode ? "#07071A" : "#E0E0E0";
  return { useTextures, color };
}

/**
 * Calculates UV repeat values for the concrete floor texture.
 * Based on a 2m tile size.
 */
export function getFloorUVRepeat(hallWidth: number, hallLength: number): [number, number] {
  return [hallWidth / CONCRETE_TILE_SIZE, hallLength / CONCRETE_TILE_SIZE];
}
```

#### HallWalls Pure Functions

Add exported functions to `src/components/three/HallWalls.tsx`:

```typescript
const STEEL_PANEL_WIDTH = 1;

type WallMaterialInput = { gpuTier: GpuTier; uvMode: boolean };
type WallMaterialConfig = { useTextures: boolean; color: string };

export function shouldLoadHallTextures(gpuTier: GpuTier): boolean {
  return gpuTier !== "low";
}

export function getWallMaterialConfig(input: WallMaterialInput): WallMaterialConfig {
  const useTextures = input.gpuTier !== "low";
  const color = input.uvMode ? "#1A1A2E" : "#B0B0B0";
  return { useTextures, color };
}

export function getWallUVRepeat(wallLength: number, _wallHeight: number): [number, number] {
  return [wallLength / STEEL_PANEL_WIDTH, 1];
}
```

### Part 3: HallFloor Textured Component

Split into `TexturedHallFloor` / `FlatHallFloor`:

- `TexturedHallFloor` -- uses drei `useTexture` to load concrete maps, suspends while loading
- `FlatHallFloor` -- current flat-color implementation (low GPU tier path and fallback)

The `MeshReflectorMaterial` from Phase 11A accepts `map`, `normalMap`, and `roughnessMap` props. Pass the concrete textures through these props so the texture shows as the reflector's base surface with the reflection layered on top.

**Key details:**
1. `MeshReflectorMaterial` extends `MeshStandardMaterial` internally -- it accepts `map`, `normalMap`, `roughnessMap` props directly.
2. In UV mode, the dark color dominates. For the reflector path, the texture `map` can still be passed (the normal map provides subtle surface variation in reflections). For non-reflector, skip the `map` in UV mode.
3. `useTexture` suspends the component. `<Suspense fallback={<FlatHallFloor />}>` renders flat floor immediately, swaps to textured once ready.
4. `ErrorBoundary` catches texture loading failures and falls back to flat floor.
5. UV repeat: set `wrapS = wrapT = RepeatWrapping`, `repeat.set(5, 10)` for the 10m x 20m floor.

### Part 4: HallWalls Textured Component

Same `TexturedHallWalls` / `FlatHallWalls` dispatch pattern.

**Key details:**
1. **Two different UV repeat values:** North/south walls span width (10m), east/west walls span length (20m). Each pair needs its own material with correct UV repeat. Clone loaded textures for each wall pair.
2. **BoxGeometry UV mapping:** Three.js `BoxGeometry` applies UVs per face [0,0] to [1,1]. The `texture.repeat` tiles within this.
3. **UV mode:** Dark color `#1A1A2E`, skip texture maps.
4. **Singleton exports preserved:** Keep `planningWallMaterial`, `uvWallMaterial`, and `getWallMaterial()` exports for existing tests in `tests/perfFixes.test.ts`.
5. **Material disposal:** Textured materials created per instance -- dispose on unmount via `useEffect` cleanup.
6. **Steel material:** `metalness: 0.7`, `roughness: 0.6`, with metalness map.

### Part 5: Hall.tsx Suspense Wrapper

Add a top-level `<Suspense fallback={null}>` around the entire `<Hall>` group as an outer safety net. Each component already has its own fallback internally.

### Part 6: ErrorBoundary

Reuse the shared `ErrorBoundary` from Section 01. If not yet created, add a small class component:

```typescript
class ErrorBoundary extends Component<{fallback: ReactNode; children: ReactNode}, {hasError: boolean}> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}
```

### Part 7: Lighting (Minor)

Optional tweaks during visual verification:
- Planning ambient light: keep at `0.8` or reduce to `0.7` if concrete appears washed out
- No UV mode lighting changes needed

## Existing Test Compatibility

- `tests/reflections.test.ts` tests `shouldUseReflector()` and `getReflectorResolution()` -- not modified, must still pass.
- `tests/perfFixes.test.ts` tests singleton wall materials -- exports must remain in `HallWalls.tsx`.

## Implementation Checklist

1. Write test file `tests/components/three/hallEnvironment.test.ts` (tests fail initially)
2. Download CC0 texture assets to `public/textures/concrete/` and `public/textures/steel/`. If download fails, implement procedural fallback.
3. Add pure logic functions to `HallFloor.tsx`. Run new tests -- should pass.
4. Add pure logic functions to `HallWalls.tsx`. Run new tests -- should pass.
5. Create `ErrorBoundary` component (if not already created by Section 01).
6. Modify `HallFloor.tsx`: split into `TexturedHallFloor` / `FlatHallFloor` with Suspense/ErrorBoundary dispatch. Apply concrete textures to reflector and standard material paths.
7. Modify `HallWalls.tsx`: split into `TexturedHallWalls` / `FlatHallWalls` with Suspense/ErrorBoundary dispatch. Apply steel textures with per-wall UV repeat. Keep singleton exports.
8. Modify `Hall.tsx`: add outer `<Suspense fallback={null}>` wrapper.
9. Run full test suite (`npm run test`) -- all pass including existing reflections + perfFixes tests.
10. Run `npx tsc --noEmit` -- no type errors.
11. Run `npm run check` -- Biome clean.
12. Visual verification: concrete floor visible in 3D, steel walls visible, UV mode still works, GPU tier "low" shows flat colors.
