Now I have all the context needed. Let me produce the section content.

# Section 04: Dual Canvas Views

## Overview

This section implements the core architectural change: setting up the single Canvas with two drei `<View>` components, extracting the existing `ThreeCanvas.tsx` into `SharedScene.tsx` (rendered in both Views) and `ThreeDOnlyContent.tsx` (rendered only in the 3D View), and wiring everything into the `DualViewport` container built in section-03.

This is the pivotal integration step. After this section, the app renders the same scene in two viewports simultaneously through a single WebGL context using `gl.scissor`-based View splitting.

## Dependencies

- **section-02-types-and-store** must be complete: `ViewportLayout`, `LayerId`, `LayerState` types in `src/types/viewport.ts`; viewport/layer state and actions in the store (`viewportLayout`, `splitRatio`, `activeViewport`, `layers`)
- **section-03-split-pane-layout** must be complete: `DualViewport.tsx` shell (HTML/CSS split-pane with divider), `SplitDivider.tsx`, `useSplitPane.ts` hook. At this point `DualViewport` renders two empty pane divs and a divider but no Canvas.

## Background: The drei View Pattern

The `@react-three/drei` `<View>` component allows splitting a single `<Canvas>` into multiple viewports. Each `<View>` is a regular HTML `<div>` that defines its viewport bounds via CSS. Inside the Canvas, `<View.Port />` renders both views using WebGL scissor tests.

Key pattern:
1. A parent container div holds two `<View>` divs (the panes) positioned via CSS (flex or absolute)
2. A `<Canvas>` is positioned `absolute inset-0` behind both View divs, with `eventSource` pointing to the parent container ref
3. `<View.Port />` is placed inside the Canvas -- it iterates all tracked Views and renders them
4. Each `<View>` contains its own camera, controls, and scene content as children

Why this works: both Views share one WebGL context, one set of GPU textures/geometries, and one `<Canvas>` DOM element. The scissor test clips each View's rendering to its pane boundaries.

## Files to Create

| File | Purpose |
|------|---------|
| `golf-planner/src/components/three/SharedScene.tsx` | Scene content rendered in both 2D and 3D Views |
| `golf-planner/src/components/three/ThreeDOnlyContent.tsx` | Content exclusive to the 3D View (effects, fog, environment) |

## Files to Modify

| File | Change |
|------|--------|
| `golf-planner/src/components/layout/DualViewport.tsx` | Add Canvas + View + View.Port wiring, SoftShadows at Canvas level, PlacementHandler in 2D View |
| `golf-planner/src/App.tsx` | Pass sunData to DualViewport |

## Files Deleted

| File | Reason |
|------|--------|
| `golf-planner/src/components/three/ThreeCanvas.tsx` | Dead code after extraction to SharedScene + ThreeDOnlyContent |

---

## Tests

There are no formal unit tests for this section. The changes are architectural -- they reorganize R3F component rendering into Views. Validation is:

1. **Type checking** -- `npx tsc --noEmit` passes with no errors after all changes
2. **Visual verification** -- the app renders the hall, holes, grid, flow path, and sun indicator in both panes simultaneously
3. **Existing tests** -- all 548 Vitest tests continue to pass (`cd golf-planner && npx vitest run`)
4. **Visual regression** (later, in section-12) -- Playwright screenshots of the dual layout

The TDD plan confirms: "DualViewport Component -- No unit tests -- R3F Canvas/View integration tested via visual regression. Store integration tested via store tests."

---

## Implementation Details

### Step 1: Create SharedScene Component

**File:** `golf-planner/src/components/three/SharedScene.tsx`

Extract the following content from the current `ThreeCanvas.tsx` into a new `SharedScene` component. This component renders in **both** the 2D and 3D Views.

**SharedScene contains:**
- `<ambientLight>` -- UV-mode-aware color/intensity
- `<directionalLight>` -- Sun-positioned or static, with shadow configuration
- `<Hall sunData={sunData} />` -- Floor, walls, doors, windows
- `<PlacedHoles />` -- All placed mini golf holes
- `<FlowPath />` -- Numbered path connecting holes in sequence
- `<FloorGrid />` -- The grid overlay
- `<SunIndicator sunData={sunData} />` -- Sun direction marker
- `<PlacementHandler />` -- Pointer interaction for placing holes

**Props:** `SharedScene` needs `sunData: SunData` passed from the parent.

**What SharedScene does NOT contain** (these move to ThreeDOnlyContent):
- `<fogExp2>` and `<FogController>`
- `<Environment>` with Lightformers
- `<SoftShadows>`
- `<UVLamps>`
- `<GodRaysSource>`
- `<Sparkles>`
- `<UVEffects>` / `<PostProcessing>`
- `<ScreenshotCapture>`
- `<PerformanceMonitor>` and `<Stats>`

Component signature:

```typescript
import type { SunData } from "../../hooks/useSunPosition";

type SharedSceneProps = {
	sunData: SunData;
};

export function SharedScene({ sunData }: SharedSceneProps) {
	// Read uvMode from store for light colors
	// Render: ambientLight, directionalLight, Hall, PlacedHoles,
	//         FlowPath, FloorGrid, SunIndicator, PlacementHandler
}
```

**Important note on duplication:** Both Views instantiate `SharedScene` independently. This means React components like `PlacedHoles`, `Hall`, etc. are mounted twice -- doubling Zustand selector calls, `useFrame` callbacks, and pointer event handlers. For the small scene (up to 18 holes, hall, grid, flow path), this overhead is acceptable. GPU draw calls are also doubled but shared geometry/textures keep memory stable.

### Step 2: Create ThreeDOnlyContent Component

**File:** `golf-planner/src/components/three/ThreeDOnlyContent.tsx`

Extract 3D-only content from `ThreeCanvas.tsx` into this component. It renders only inside the 3D View. This is critical because several components are singletons (e.g., `GodRaysSource` stores a mesh ref in Zustand -- mounting it twice would cause conflicts).

**ThreeDOnlyContent contains:**
- `<fogExp2>` + `<FogController>` (UV + 3D perspective only)
- `<Environment preset="night">` with UV tube Lightformers
- `<SoftShadows>` (GPU tier gated)
- `<UVLamps>` (UV mode only)
- `<GodRaysSource>` (singleton -- stores mesh ref in Zustand)
- `<Sparkles>` (GPU tier gated)
- `<UVEffects>` (UV mode postprocessing)
- `<ScreenshotCapture>` (captures from 3D camera)
- `<PerformanceMonitor>` + `<Stats>` (dev-only FPS counter)

The existing `FogController` function (currently defined inside `ThreeCanvas.tsx`) should move here or be co-located.

Component signature:

```typescript
import type { SunData } from "../../hooks/useSunPosition";

type ThreeDOnlyContentProps = {
	sunData: SunData;
};

export function ThreeDOnlyContent({ sunData }: ThreeDOnlyContentProps) {
	// Read uvMode, gpuTier, view from store
	// Render fog, environment, soft shadows, UV lamps, god rays,
	//         sparkles, UV effects, screenshot capture, perf monitor
}
```

Note: `ThreeDOnlyContent` does not need `sunData` itself currently but the signature accepts it for future use and consistency. If no child uses it, it can be omitted.

### Step 3: Wire Canvas + Views into DualViewport

**File:** `golf-planner/src/components/layout/DualViewport.tsx`

This file was created as an HTML/CSS shell in section-03. Now add the R3F Canvas and View integration.

**Key changes:**

1. **Add a container ref** to the outermost div wrapping both panes and the Canvas. This ref is passed to `<Canvas eventSource={containerRef}>`.

2. **Import `View` from `@react-three/drei`** and wrap each pane's content in a `<View>` component. The View components receive `track` refs pointing to their respective pane divs (the View component is an HTML div -- use `style` to fill the pane).

3. **Position the Canvas** absolutely behind both panes using `style={{ position: "absolute", inset: 0 }}` or Tailwind class `absolute inset-0`. The Canvas itself is invisible as a backdrop -- Views control what renders where.

4. **Add `<View.Port />`** inside the Canvas. This is the magic component that iterates all tracked Views and renders them into the correct scissor regions.

5. **Each View contains its scene content:**
   - 2D View: `<SharedScene sunData={sunData} />` + its own camera (placeholder for section-05; for now use an `<OrthographicCamera makeDefault>`)
   - 3D View: `<SharedScene sunData={sunData} />` + `<ThreeDOnlyContent />` + its own camera (placeholder for section-05; for now use a `<PerspectiveCamera makeDefault>`)

**Critical: `eventSource` pattern.** The `<Canvas>` must receive `eventSource={containerRef}` where `containerRef` points to the container div that wraps both pane divs. Without this, R3F pointer events won't know which View the cursor is over. The container must have `style={{ position: "relative" }}` and the Canvas must be a child of this container.

**Structural sketch:**

```tsx
import { Canvas } from "@react-three/fiber";
import { View } from "@react-three/drei";
import { useRef, Suspense } from "react";
// ...

export function DualViewport({ sunData }: DualViewportProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const pane2DRef = useRef<HTMLDivElement>(null);
	const pane3DRef = useRef<HTMLDivElement>(null);
	const splitRatio = useStore((s) => s.ui.splitRatio);
	const viewportLayout = useStore((s) => s.ui.viewportLayout);

	// ... useSplitPane hook from section-03

	const show2D = viewportLayout !== "3d-only";
	const show3D = viewportLayout !== "2d-only";

	return (
		<div ref={containerRef} style={{ position: "relative", /* flex-1, overflow-hidden */ }}>
			{/* 2D pane div */}
			{show2D && (
				<div
					ref={pane2DRef}
					style={{ width: viewportLayout === "dual" ? `${splitRatio * 100}%` : "100%", height: "100%" }}
				>
					<View style={{ width: "100%", height: "100%" }}>
						{/* 2D camera (section-05 adds proper camera) */}
						<SharedScene sunData={sunData} />
					</View>
				</div>
			)}

			{/* SplitDivider (only in dual mode) */}
			{viewportLayout === "dual" && <SplitDivider /* ... */ />}

			{/* 3D pane div */}
			{show3D && (
				<div
					ref={pane3DRef}
					style={{ width: viewportLayout === "dual" ? `${(1 - splitRatio) * 100}%` : "100%", height: "100%" }}
				>
					<View style={{ width: "100%", height: "100%" }}>
						{/* 3D camera (section-05 adds proper camera) */}
						<SharedScene sunData={sunData} />
						<ThreeDOnlyContent />
					</View>
				</div>
			)}

			{/* Canvas behind both panes */}
			<Canvas
				eventSource={containerRef}
				style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}
				/* ... dpr, frameloop, shadows, gl config from current App.tsx */
			>
				<Suspense fallback={null}>
					<View.Port />
				</Suspense>
			</Canvas>

			{/* Overlays: MiniMap, SunControls, etc. (section-10 repositions these) */}
		</div>
	);
}
```

**Important rendering detail:** The Canvas has `pointerEvents: "none"` in its style because pointer events are routed through the `eventSource` container. The View divs handle the actual pointer targets. R3F internally maps pointer coordinates from the eventSource to the correct View.

**View component note:** The drei `<View>` component renders as an HTML `<div>` by default. Its `style` prop controls its CSS dimensions. The `track` prop is an alternative approach where you pass a ref to an external div -- but the simpler pattern is to use the View itself as the positioned div (its rendered div IS the tracking element).

### Step 4: Update App.tsx

**File:** `golf-planner/src/App.tsx`

Replace the current canvas area (the `<div className="relative flex-1">` containing `<Canvas>`, `<SunControls>`, `<KeyboardHelp>`, `<MiniMap>`) with the new `<DualViewport>` component.

**Changes:**
1. Remove the `<Canvas>` element and its configuration props (dpr, frameloop, shadows, gl) -- these move into `DualViewport`
2. Remove the lazy import of `ThreeCanvas` -- it is no longer used directly from App
3. Import `DualViewport` instead
4. Pass `sunData` to `DualViewport`
5. The overlay components (`SunControls`, `KeyboardHelp`, `MiniMap`) temporarily move inside `DualViewport` or remain in App with adjusted positioning. Section-10 handles their final repositioning.

**Canvas configuration migration:** The current `App.tsx` computes `dpr`, `frameloop`, and `shadows` and passes them to `<Canvas>`. These computations move into `DualViewport.tsx` (or are passed as props). The Canvas config remains identical:

```typescript
// These values are computed in DualViewport or passed as props
const dpr: [number, number] = /* same mobile/gpuTier logic */;
const frameloop = deriveFrameloop(uvMode, gpuTier, transitioning);
const shadows = getShadowType(gpuTier, isMobile);

<Canvas
	dpr={dpr}
	frameloop={frameloop}
	shadows={shadows}
	gl={{
		antialias: !isMobile,
		preserveDrawingBuffer: true,
		powerPreference: "high-performance",
		toneMapping: NoToneMapping,
	}}
	eventSource={containerRef}
	style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
>
```

### Step 5: Handle Collapsed Modes

When `viewportLayout` is `"2d-only"` or `"3d-only"`, only one View renders at full width. The other View and its content are not mounted (conditional rendering with `show2D` / `show3D` booleans).

In `"2d-only"` mode:
- Only the 2D View renders, full width
- `ThreeDOnlyContent` is not mounted (no fog, environment, effects)
- This matches the current "top" view behavior

In `"3d-only"` mode:
- Only the 3D View renders, full width
- Both `SharedScene` and `ThreeDOnlyContent` are mounted
- PostProcessing can render (no scissor conflict with a single View)
- This matches the current "3d" view behavior

In `"dual"` mode:
- Both Views render side by side
- PostProcessing is disabled (handled in section-09)
- Both panes show `SharedScene`; only the 3D pane adds `ThreeDOnlyContent`

### Step 6: Deprecate ThreeCanvas.tsx

After extracting content into `SharedScene` and `ThreeDOnlyContent`, the original `ThreeCanvas.tsx` is no longer used. Options:
- **Delete it** if DualViewport fully replaces its role
- **Keep it as a thin re-export** if needed for backward compatibility during the migration (not recommended -- clean break is better)

The lazy import in `App.tsx` (`const ThreeCanvas = lazy(() => import("./components/three/ThreeCanvas"))`) is removed.

---

## Critical Implementation Notes

### View.Port is required
The `<View.Port />` component MUST be inside the `<Canvas>`. Without it, Views will not render anything. This is the most common mistake when setting up the drei View pattern.

### eventSource is required for pointer events
Without `eventSource={containerRef}`, R3F will try to attach pointer event listeners to the Canvas DOM element directly. Since the Canvas is behind the View divs (with `pointerEvents: "none"`), no events would fire. The `eventSource` prop tells R3F to listen on the container div instead, and it maps coordinates to the correct View automatically.

### Both Views must have their own camera
Each `<View>` needs a camera with `makeDefault` set. If no camera is provided, the View will use the Canvas's default camera, which causes both Views to render from the same viewpoint. Section-05 handles proper camera setup -- for this section, use placeholder cameras:
- 2D View: `<OrthographicCamera makeDefault position={[5, 50, 10]} zoom={40} />`
- 3D View: `<PerspectiveCamera makeDefault position={[5, 15, 25]} fov={60} />`

These are temporary and will be replaced with full camera systems in section-05.

### Canvas sizing
The Canvas must fill the container (`position: absolute; inset: 0`). The View divs inside the container define the scissor regions. The Canvas does NOT control its own rendering dimensions per-View -- the View components handle that.

### Scene duplication is intentional
Both Views independently instantiate `SharedScene`. This is not a bug -- it is how the View pattern works. Each View has its own React subtree. The Three.js geometries and textures are shared at the GPU level (same WebGL context), so memory is not doubled. Draw calls are doubled, which is the main performance cost.

### CameraControls.tsx current behavior
The existing `CameraControls.tsx` component creates both an `OrthographicCamera` and a `PerspectiveCamera` and toggles `makeDefault` based on `ui.view`. In the dual-canvas architecture, this component is replaced by per-View camera components (section-05). For this section, use simple placeholder cameras inside each View and do NOT render the old `CameraControls` inside `SharedScene`. Instead, temporarily add basic cameras directly in each View.

### Overlay components
`SunControls`, `KeyboardHelp`, and `MiniMap` are HTML overlay components (absolute-positioned divs). They currently sit inside the `<div className="relative flex-1">` alongside the Canvas. In the new architecture, they should be placed inside the `DualViewport` container (as siblings of the Canvas, positioned absolutely). Section-10 handles their final repositioning (MiniMap to 2D pane corner, etc.). For this section, keep them in their current relative positions.

---

## Verification Checklist

After completing this section, verify:

1. `npx tsc --noEmit` passes with no errors
2. `npx vitest run` -- all 495 existing tests pass
3. The app loads and displays the hall, placed holes, grid, flow path, and sun indicator in **both** panes simultaneously
4. The 3D pane additionally shows fog, environment lighting, UV lamps (in UV mode), sparkles, and other 3D-only effects
5. Resizing the divider (from section-03) correctly adjusts both View rendering regions
6. Collapsing to single-pane mode (2d-only or 3d-only) shows one View at full width
7. The old ThreeCanvas.tsx is no longer imported anywhere

---

## Actual Implementation Notes

### Deviations from Plan

1. **ThreeDOnlyContent does not take sunData prop** — No child needed it, so the prop was omitted for simplicity.

2. **SoftShadows moved to Canvas level** — The plan placed SoftShadows inside ThreeDOnlyContent (inside a View). Code review caught that SoftShadows patches `THREE.ShaderChunk` globally and must NOT be dynamically mounted/unmounted. Moved to Canvas level in DualViewport.tsx where it's always mounted. Controlled by `shouldEnableSoftShadows(gpuTier)` which doesn't toggle at runtime.

3. **Fog gated on viewportLayout** — Fog attaches to `scene.fog` (scene-level, shared between Views). In dual mode it would darken the 2D View. Added `viewportLayout === "3d-only"` guard to ThreeDOnlyContent.

4. **PlacementHandler moved from SharedScene to DualViewport** — In SharedScene it mounted twice (once per View), causing double placement events. Now: always in 2D View, conditionally in 3D View only when `!show2D` (3d-only mode).

5. **ThreeCanvas.tsx deleted** — Clean break, not deprecated. No imports remained.

6. **preserveDrawingBuffer: false** — Plan showed `true` in the code sketch, but spike finding requires `false` for drei View (prevents paint trails). Implemented correctly.

### Final Test Count
- 548 tests passing (48 files) — includes 17 from section-03 useSplitPane + 36 from section-02 viewport/layers