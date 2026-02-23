# Research: Dual Viewport & Layer System

## Part 1: Codebase Analysis

### Canvas & 3D Setup

**App.tsx layout:**
```
<div flex h-screen>
  <Toolbar />
  <div flex flex-1>
    <Sidebar />        <!-- hidden on mobile, 16rem desktop -->
    <div relative flex-1>  <!-- main canvas container -->
      <Canvas dpr={dpr} frameloop={frameloop} shadows={shadows} gl={...}>
        <ThreeCanvas sunData={sunData} />
      </Canvas>
      <SunControls /> <KeyboardHelp /> <MiniMap />
    </div>
  </div>
  <LocationBar /> <BottomToolbar /> <HoleDrawer />
  {builderMode && <Builder />}  <!-- fullscreen overlay, separate Canvas -->
</div>
```

- Single `<Canvas>` from R3F, `flex-1` sizing fills space after sidebar
- All R3F components inside one `ThreeCanvas`
- Builder uses a **separate** Canvas in a `z-50` fixed overlay — no dual-pane interaction needed

**ThreeCanvas.tsx scene graph (149 lines):**
```
<>
  <fogExp2 /> + <FogController />         -- UV+3D only
  <Environment preset="night">            -- 11 UV tube lightformers
  <SoftShadows />                         -- high GPU tier only
  <PerformanceMonitor /> <Stats />
  <ambientLight /> <directionalLight />   -- sun-positioned or static
  <UVLamps /> <GodRaysSource />           -- UV mode only
  <CameraControls />                      -- switches ortho/perspective
  <FloorGrid /> <Hall /> <PlacementHandler />
  <PlacedHoles /> <FlowPath /> <SunIndicator />
  <Sparkles /> <UVEffects /> <ScreenshotCapture />
</>
```

### Camera System (CameraControls.tsx, 142 lines)

- Creates **two cameras**: OrthographicCamera (top) + PerspectiveCamera (3D)
- `makeDefault` prop switches active camera based on `ui.view`
- Mutually exclusive — only one renders at a time

**Ortho camera:** `position=[width/2, 50, length/2]`, zoom=40
**Perspective camera:** calculated isometric position, fov=60

**OrbitControls config:**
```tsx
<OrbitControls
  target={[width/2, 0, length/2]}
  enableRotate={is3D}          // rotation only in 3D
  enablePan={true}
  enableZoom={true}
  minZoom={is3D ? undefined : 15}
  maxZoom={is3D ? undefined : 120}
  minDistance={is3D ? 5 : undefined}
  maxDistance={is3D ? 80 : undefined}
  mouseButtons={{ LEFT: is3D ? MOUSE.ROTATE : undefined, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.PAN }}
  touches={{ ONE: is3D ? TOUCH.ROTATE : TOUCH.PAN, TWO: TOUCH.DOLLY_PAN }}
  onChange={() => invalidate()}
/>
```

### Store Architecture

**UIState (src/types/ui.ts):**
```typescript
type ViewMode = "top" | "3d";
type Tool = "select" | "place" | "move" | "delete";
type SidebarTab = "holes" | "detail" | "budget";
type GpuTier = "low" | "mid" | "high";

type UIState = {
  tool: Tool; placingType: HoleType | null; placingTemplateId: string | null;
  view: ViewMode; sidebarTab: SidebarTab; snapEnabled: boolean;
  showFlowPath: boolean; activePanel: ActivePanel; sunDate: Date | undefined;
  uvMode: boolean; gpuTier: GpuTier; transitioning: boolean;
  godRaysLampRef: RefObject<Mesh | null> | null;
};
```

**Persistence:** partialize excludes `ui` state (ephemeral). Persists holes, holeOrder, budget, budgetConfig.
**Undo/redo:** zundo temporal middleware on selected slices.

### Existing Layer-Like Patterns

**FlowPath.tsx (60 lines):**
```tsx
const showFlowPath = useStore((s) => s.ui.showFlowPath);
if (!showFlowPath || holeOrder.length < 2) return null;
// renders Line + Billboard text numbers
```

**FloorGrid.tsx (563 lines):** conditionally renders based on grid enabled state
**All materials:** check `ui.uvMode` for color switching

**Pattern:** Read boolean from store → conditionally return null → fast idiomatic R3F

### GPU Tier Gating

**useGpuTier.ts:** Detects at startup, sets `ui.gpuTier` to "low"/"mid"/"high"

**Gating helpers (environmentGating.ts, postprocessingConfig.ts):**
- `shouldEnableFog(uvMode, view)` → uvMode && view === "3d"
- `shouldEnableSoftShadows(gpuTier)` → mid or high
- `deriveFrameloop(...)` → "always" or "demand"
- PostProcessing.tsx: High=N8AO+GodRays+Bloom+CA+Vignette, Mid=Bloom+CA+Vignette, Low=Bloom+Vignette

### Responsive / Mobile

- Breakpoint: 768px (Tailwind `md`)
- Desktop: Sidebar visible, top toolbar
- Mobile: hidden sidebar, bottom toolbar, overlay panels (MobileDetailPanel, MobileSunControls, MobileBudgetPanel)
- Pattern: `{isMobile && <MobileXPanel />}`

### Testing

- **Vitest v4.0.18**: 46 files, 495 tests, mostly utility/math focused
- **Playwright v1.58.2**: visual regression tests, 1280x720 viewport, `maxDiffPixelRatio: 0.001`
- No R3F-specific test utilities — tests focus on store logic and placement math
- Visual tests in `tests/visual/`, excluded from Vitest config

### Dependencies

```json
"@react-three/fiber": "9.5.0",
"@react-three/drei": "10.7.7",
"@react-three/postprocessing": "3.0.4",
"react": "^19.2.0",
"zustand": "^5.0.11",
"zundo": "^2.3.0",
"three": "0.183.0"
```

- **No split-pane library** currently installed
- **drei View component available** in v10.7.7 ✓

### Key Files to Modify

| File | Change |
|------|--------|
| `App.tsx` | Replace single Canvas with dual-pane layout + View pattern |
| `ThreeCanvas.tsx` | Refactor scene to render through two Views |
| `CameraControls.tsx` | Split into separate 2D and 3D camera controls |
| `src/types/ui.ts` | Add layer types, viewport layout, camera state |
| `src/store/store.ts` | Add layer slice, viewport actions |
| `Sidebar.tsx` | Add "Layers" tab |
| `Toolbar.tsx` | Add camera preset buttons |
| `PlacedHoles.tsx` | Check layer visibility/opacity/lock |
| `FlowPath.tsx` | Check layer state |
| `FloorGrid.tsx` | Check layer state |

### Files NOT Changed

- `src/components/builder/` — separate Canvas, no interaction
- `src/components/three/holes/` — render logic unchanged, just respects opacity from parent
- `src/utils/collision.ts` — no viewport dependencies
- Budget/financial store slices — untouched

---

## Part 2: API Documentation (Context7)

### drei View Component

**Source:** pmndrs/drei docs

Views use `gl.scissor` to cut the viewport into segments. You tie a View to a **tracking div** which controls the position and bounds of the viewport. Views follow their tracking elements, scroll, resize automatically.

**Critical pattern — eventSource:**
```jsx
function App() {
  const container = useRef();
  return (
    <main ref={container}>
      <View style={{ width: 200, height: 200 }}>
        <mesh geometry={foo} />
        <OrbitControls />
      </View>
      <View className="canvas-view">
        <mesh geometry={bar} />
        <CameraControls />
      </View>
      <Canvas eventSource={container}>
        <View.Port />
      </Canvas>
    </main>
  );
}
```

**Key insights:**
- Each View can have its own camera (`<PerspectiveCamera makeDefault />` inside View)
- Each View can have its own controls (`<OrbitControls />` inside View)
- Canvas should fill the screen with fixed/absolute positioning
- `eventSource` must point to a parent containing both Views and Canvas
- `<View.Port />` inside Canvas renders all Views
- Views are **unstyled divs** — position them with CSS/Tailwind
- `visible` prop can hide a View

**For our dual viewport:**
```jsx
<main ref={containerRef} className="relative flex-1">
  {/* 2D View tracking div */}
  <div ref={view2dRef} style={{ width: `${splitRatio*100}%`, height: '100%' }}>
    <View track={view2dRef}>
      <OrthographicCamera makeDefault ... />
      <OrbitControls enableRotate={false} />
      {/* shared scene content */}
    </View>
  </div>

  {/* Divider */}

  {/* 3D View tracking div */}
  <div ref={view3dRef} style={{ width: `${(1-splitRatio)*100}%`, height: '100%' }}>
    <View track={view3dRef}>
      <PerspectiveCamera makeDefault ... />
      <OrbitControls />
      {/* shared scene content */}
    </View>
  </div>

  <Canvas eventSource={containerRef} style={{ position: 'absolute', inset: 0 }}>
    <View.Port />
  </Canvas>
</main>
```

### drei CameraControls (camera-controls library)

**Programmatic camera positioning with smooth transitions:**
```jsx
const controlsRef = useRef();

// Animate to position with smooth transition
controlsRef.current?.setLookAt(
  x, y, z,      // camera position
  tx, ty, tz,   // target/lookAt
  true           // enableTransition = smooth animation
);
```

**Mouse/touch config:**
```jsx
import { CameraControls as CameraControlsImpl } from '@react-three/drei';
const { ACTION } = CameraControlsImpl;

<CameraControls
  ref={controlsRef}
  mouseButtons={{
    left: ACTION.ROTATE,
    middle: ACTION.DOLLY,
    right: ACTION.TRUCK,
    wheel: ACTION.DOLLY,
  }}
  touches={{
    one: ACTION.TOUCH_ROTATE,
    two: ACTION.TOUCH_DOLLY_TRUCK,
  }}
/>
```

**Inject specific camera:**
```tsx
const [cam, setCam] = useState<THREE.PerspectiveCamera | null>();
<PerspectiveCamera ref={setCam} />
{cam && <CameraControls camera={cam} />}
```

**Recommendation:** Use drei `CameraControls` (not OrbitControls) for the 3D pane — it has built-in `setLookAt` with smooth transitions, perfect for camera presets. Keep OrbitControls for 2D pane (simpler, just pan/zoom).

### drei OrbitControls

```jsx
<OrbitControls
  makeDefault
  enableDamping dampingFactor={0.05}
  minDistance={2} maxDistance={20}
  minPolarAngle={0} maxPolarAngle={Math.PI / 2}
  enablePan={false}
  camera={MyCamera}  // inject specific camera
/>
```

**For 2D pane:** `enableRotate={false}` + zoom/pan limits = top-down only

### Three.js Layers System

**Object3D.layers:** Controls layer membership. Object is only visible if it shares at least one layer with the camera. Also filters raycaster intersection tests.

```javascript
// Camera sees only layer 1
camera.layers.set(1);

// Object on layer 1 = visible + raycastable
object.layers.enable(1);

// Toggle layer visibility
camera.layers.toggle(0);

// Enable/disable all
camera.layers.enableAll();
camera.layers.disableAll();

// Raycaster layer filtering
raycaster.layers.set(1);  // only test objects on layer 1
```

**For our layer system:** Three.js native layers give us visibility toggling and raycaster filtering (lock) for free. However, they don't support per-layer opacity — that needs custom material handling.

**Hybrid approach recommended:**
1. Use Three.js `Object3D.layers` for **visibility** (camera.layers) and **lock** (raycaster.layers)
2. Use Zustand state + material opacity for **per-layer opacity**
3. Keep Zustand as single source of truth, sync to Three.js layers on change

### Resizable Split-Pane

**No library needed.** Since Views are just tracking divs positioned with CSS, a simple custom hook handles resizing:

```tsx
// ~80-100 LOC custom implementation
function useSplitPane(initialRatio = 0.5) {
  const [ratio, setRatio] = useState(initialRatio);
  const isDragging = useRef(false);

  const onMouseDown = () => { isDragging.current = true; };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    const newRatio = e.clientX / containerWidth;
    setRatio(clamp(newRatio, 0.2, 0.8));
  };
  const onMouseUp = () => { isDragging.current = false; };

  return { ratio, onMouseDown, onMouseMove, onMouseUp };
}
```

**Collapse behavior:** Double-click divider → set ratio to 0 or 1. Click edge buttons → animate ratio.

---

## Part 3: Architecture Recommendations

### Dual Viewport: Single Canvas + View (Option A)

**Confirmed as the right approach** by Context7 docs. Key architecture:

1. One `<Canvas>` with `eventSource` pointing to parent container
2. Two `<View>` components tracking their respective pane divs
3. Each View contains its own camera + controls
4. Scene content rendered inside each View (or shared via portals)
5. `<View.Port />` inside Canvas renders both

### Camera Strategy

| Pane | Camera | Controls | Preset Support |
|------|--------|----------|----------------|
| 2D (left) | OrthographicCamera | OrbitControls (pan/zoom only, no rotate) | N/A |
| 3D (right) | PerspectiveCamera | CameraControls (full orbit + setLookAt) | Top, Front, Back, Left, Right, Isometric |

### Layer System: Hybrid Approach

| Feature | Implementation |
|---------|---------------|
| Visibility toggle | Three.js `Object3D.layers` + camera.layers |
| Opacity slider | Zustand state → material opacity prop |
| Lock (no interaction) | Three.js raycaster.layers filtering |
| State management | Zustand slice as source of truth |

### Performance Strategy

- 2D pane: no postprocessing, demand frameloop (render on interaction only)
- 3D pane: full postprocessing per GPU tier
- Both panes: shared geometry/textures via single Canvas (no duplication)
- Mobile (<768px): collapse to single pane with existing toggle
- Target: 30+ fps on mid-tier GPU with both panes active

### Testing Strategy

- **Unit tests:** Layer state logic (visibility, opacity, lock toggles), camera preset calculations, split-pane ratio math
- **Integration tests:** Selection sync between panes (Zustand-based, testable without R3F)
- **Visual tests:** Playwright screenshots of dual-pane layout, collapsed states
- **Existing tests:** 495 tests should pass unchanged (they test store/utils, not layout)
