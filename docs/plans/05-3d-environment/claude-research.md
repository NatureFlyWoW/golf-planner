# Research: Split 05 — 3D Environment

## Codebase Research

### Camera System
- **3D pane**: drei `CameraControls` (wraps `camera-controls` by yomotsu) with `setLookAt()` API
- **2D pane**: drei `OrbitControls` with rotation disabled
- **Camera presets**: 6 presets (top/front/back/left/right/isometric) computed from hall dims, keyboard 1-6
- **Camera state NOT persisted** — ephemeral in Zustand UI slice
- **Viewport layout**: `"dual" | "2d-only" | "3d-only"` stored in `ui.viewportLayout`

### Collision Detection
- **Existing**: SAT-based OBB collision in `src/utils/collision.ts` (`checkOBBCollision`, `checkHallBounds`, `checkAnyCollision`)
- **Hole bounding boxes**: width × length from `src/constants/holeTypes.ts`, position + rotation from store
- **Hall boundaries**: walls at x=0, x=10, z=0, z=20 with 0.1m thickness
- **Reusable for walkthrough**: treat camera as small AABB, test against walls + hole OBBs

### Hall Geometry
- **Constants**: `src/constants/hall.ts` — 10×20m, wallHeight 4.3m, firstHeight 4.9m, roofPitch 7°
- **Walls**: `HallWalls.tsx` — 4 `boxGeometry` walls. Already have exterior faces but material is `FrontSide` only. Fix: `side: THREE.DoubleSide`
- **Floor**: `HallFloor.tsx` — `planeGeometry` at Y=0, concrete texture, `MeshReflectorMaterial` on high tier
- **Doors**: sectional (3.5×3.5m south wall) + PVC (0.9×2.0m south wall)
- **Windows**: 4 windows on east/west walls (3.0×1.1m each, sillHeight 1.5m)

### 3D-Only Content Architecture
- `ThreeDOnlyContent.tsx` renders environment/effects gated to 3D view
- `ViewportContext` + `useViewportId()` gates components per viewport
- `SharedScene.tsx` renders shared lighting + hall + holes
- Environment items should go in `ThreeDOnlyContent.tsx` with viewport gating

### Layer System
- 5 layers defined: holes, flowPath, grid, walls, sunIndicator
- Adding "environment" layer: update `LayerId` type, `LAYER_DEFINITIONS`, `DEFAULT_LAYERS`
- Components check `useStore((s) => s.ui.layers.environment).visible`

### Existing Environment
- drei `<Environment preset="night">` with Lightformers for UV lamps
- `environmentIntensity: 0.15`, `background: false`
- Fog: `fogExp2` color #07071A density 0.04, only in 3d-only + UV mode
- Lighting: white ambient + directional sun (normal) / purple ambient + purple directional (UV)

### Keyboard Shortcuts
- `useKeyboardControls.ts` — key handlers gated by `resolveViewport()` (returns "2d" | "3d")
- F key currently maps to "fit all holes" in both 2D and 3D viewports
- WASD currently used for 2D panning
- Adding walkthrough: F key in 3D toggles walkthrough, WASD remapped to movement in walkthrough mode

### Frameloop
- `deriveFrameloop()` in `environmentGating.ts` returns "always" | "demand"
- "always" for: dual mode, UV + mid+ GPU, transitioning
- Walkthrough needs "always" — add condition check

### Testing Patterns
- Pure geometry/utility tests (no R3F rendering): test exported functions from `utils/`
- Gating function tests: `shouldEnableFog()`, etc. — pure input/output
- ViewportContext mocking: wrap components in `ViewportContext.Provider`
- Collision tests: test `checkOBBCollision` with various inputs

## Web Research

### FPS Camera Controls in R3F
- **drei `PointerLockControls`**: handles mouse-look, does NOT include WASD. Must pair with `KeyboardControls`/`useKeyboardControls`
- **Click-drag look (no pointer lock)**: Use `CameraControls` with `minDistance~0.01` to collapse orbit into first-person, or custom pointer event handler with euler rotation
- **drei `KeyboardControls`**: context wrapper + `useKeyboardControls` hook for WASD state reading in `useFrame`
- **Mode switching**: conditional render orbit/FPS controls. Save camera state (position + target) before switching. Use `makeDefault` on active controls.

### WASD Movement Pattern
```tsx
const SPEED = 5;
useFrame((_, delta) => {
  const { forward, back, left, right } = getKeys();
  _frontVector.set(0, 0, (back ? 1 : 0) - (forward ? 1 : 0));
  _sideVector.set((left ? 1 : 0) - (right ? 1 : 0), 0, 0);
  _direction.subVectors(_frontVector, _sideVector).normalize()
    .multiplyScalar(SPEED * delta).applyEuler(camera.rotation);
  _direction.y = 0; // horizontal only
  camera.position.add(_direction);
});
```

### Collision Detection (Without Physics Engine)
- **three-mesh-bvh**: BVH-based shapecast — gold standard for lightweight collision. Capsule vs mesh triangles.
- **BVHEcctrl (pmndrs)**: Drop-in R3F character controller wrapping three-mesh-bvh. `<StaticCollider>` marks scene geometry.
- **Simple raycasting**: 4-8 directional rays from camera. Cheapest for box-shaped rooms.
- **Recommendation for this project**: Simple raycasting (4 rays for walls) + AABB check against hole bounding boxes. The hall is a simple box — no need for BVH.

### drei Sky Component
- Preetham analytical sky model — very lightweight
- Props: `sunPosition`, `turbidity`, `rayleigh`, `mieCoefficient`, `mieDirectionalG`
- Sun position from elevation/azimuth: `Vector3.setFromSphericalCoords(1, phi, theta)`
- Can integrate with existing sun calculator to match directional light direction

### Sky ↔ UV Mode Switching
- Normal mode: `<Sky>` with sun position from calculator
- UV mode: remove Sky, use `<Environment preset="night">` (existing) + dark background
- Pattern: conditional render based on `uvMode` store state

### Ground Plane
- Simple `planeGeometry` + `meshStandardMaterial` + repeating texture
- `RepeatWrapping` + high repeat count is GPU-cheap
- Standard fog handles edge fade — fog color MUST match scene background color
- No geometry subdivision needed for flat ground

### Fog Configuration
- `<fog>` (linear, near/far distance) or `<fogExp2>` (density-based)
- Background color must match fog color for clean fade
- Currently fog only in UV mode — needs expansion for normal mode (lighter fog color)
- Normal mode fog: light gray/blue matching sky horizon color

## Key Technical Decisions

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| FPS look controls | Custom click-drag (default) + optional PointerLock toggle | Click-drag is less aggressive for planning tool; PointerLock as opt-in for immersion |
| WASD movement | Custom `useFrame` loop with collision checks | Don't need drei's KeyboardControls since existing `useKeyboardControls.ts` already handles keys |
| Wall collision | Simple AABB boundary clamping | Hall is a box; 4 boundary checks (x ∈ [0.5, 9.5], z ∈ [0.5, 19.5]) |
| Hole collision | AABB per hole from store | Reuse OBBInput format from collision.ts |
| Sky component | drei `<Sky>` with sun position from existing calculator | Lightweight, integrates with existing sun tracking |
| Ground texture | CC0 asphalt from Poly Haven, 512×512, RepeatWrapping | Matches BORGA commercial site context |
| Fog | Linear fog in normal mode (matching sky horizon), existing fogExp2 in UV mode | Cleaner ground edge fade |
| Hall exterior | `side: DoubleSide` on existing wall material | Simplest fix — walls are already box geometry with exterior faces |
| Roof | Two inclined planes meeting at ridge | BORGA 7° pitch, ridge = wallHeight + tan(7°) × 5m ≈ 4.3 + 0.61 = 4.91m |
