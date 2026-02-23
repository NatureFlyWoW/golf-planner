Good -- neither section-02 nor any architectural components have been implemented yet. Now I have all the context I need to write the section.

# Section 07: Textured 2D Holes

## Overview

This section adds felt-textured overlays to placed holes in the 2D viewport, replacing the flat top-down view of 3D hole models with visually rich, architectural-quality playing surfaces. Each placed hole gets a procedural felt `ShaderMaterial` plane with a subtle noise pattern, tinted to the hole type's accent color, plus a crisp `<Line>` outline border.

**User-visible outcome:** When viewing the 2D pane at close zoom, hole surfaces display a fabric-like felt texture instead of the flat top-down projection of 3D geometry. At overview zoom, holes show as solid-color fills for performance.

---

## Dependencies

- **Section 02 (Viewport-Aware SharedScene):** Provides the `useViewportId()` hook (or `useViewportInfo()` from `src/contexts/ViewportContext.ts`) so `HoleFelt2D` can render only in the 2D viewport. The section-02 work makes `SharedScene` viewport-aware and introduces the `ArchitecturalFloorPlan` wrapper component.
- **Section 08 (LOD System):** Provides the `useZoomLOD()` hook. `HoleFelt2D` uses the LOD level to decide between solid-color fill (overview) and procedural felt shader (detail). If section-08 is not yet implemented, a local fallback reading `camera.zoom` directly is acceptable.

These sections must be completed (or stubbed) before this section can fully function.

---

## File Structure

### New Files

| File | Purpose |
|------|---------|
| `src/components/three/architectural/HoleFelt2D.tsx` | Felt-textured overlay component for one hole |
| `src/components/three/architectural/HoleFeltShader.ts` | GLSL vertex/fragment shader strings and `ShaderMaterial` factory |

### Modified Files

| File | Change |
|------|--------|
| `src/components/three/architectural/ArchitecturalFloorPlan.tsx` | Mount `<HoleFeltOverlays>` alongside walls, openings, grid |
| `src/components/three/PlacedHoles.tsx` | No changes needed -- felt overlays render separately via `ArchitecturalFloorPlan` |

---

## Tests

### Visual Tests (Playwright)

The TDD plan specifies one visual regression test for this section. No unit tests are required since the implementation is primarily visual (ShaderMaterial rendering).

**File:** `tests/e2e/textured-holes-2d.spec.ts`

```typescript
/**
 * Visual regression: zoomed-in 2D view shows textured hole surfaces.
 *
 * Setup:
 * - Navigate to app
 * - Place at least one hole via store injection (window.__STORE__)
 * - Set camera zoom to >= 40 (detail level) on the 2D pane
 * - Capture screenshot of 2D pane region
 *
 * Assertions:
 * - Screenshot matches baseline (felt texture visible vs flat color at overview zoom)
 * - At overview zoom (< 15), holes render as solid color (compare second screenshot)
 */
import { expect, test } from "@playwright/test";

test.describe("Textured 2D Holes", () => {
	test("zoomed-in 2D view shows textured hole surfaces", async ({ page }) => {
		// Navigate and inject a hole via store
		// Set zoom to detail level (>= 40)
		// Screenshot the 2D pane
		// Compare to baseline
	});

	test("overview zoom shows solid color fills instead of texture", async ({
		page,
	}) => {
		// Navigate and inject a hole via store
		// Set zoom to overview level (< 15)
		// Screenshot the 2D pane
		// Compare to baseline (should be flat color, no felt noise)
	});
});
```

---

## Implementation Details

### Component: `HoleFelt2D`

**Purpose:** Renders a single felt-textured overlay plane for one placed hole in the 2D viewport.

**Location:** `src/components/three/architectural/HoleFelt2D.tsx`

**Props:**

```typescript
type HoleFelt2DProps = {
	hole: Hole;
	width: number;
	length: number;
	color: string;  // Hole type accent color (e.g., "#4CAF50" for straight)
};
```

**Rendering structure for each hole:**

1. **Group** positioned at `[hole.position.x, 0, hole.position.z]` with rotation `[0, rotationRad, 0]`
2. **Fill mesh** -- a `<mesh>` at `Y=0.03` (above floor at Y=0, above wall fill at Y=0.02, below interaction layer at Y=0.3):
   - `<planeGeometry args={[width, length]}>`
   - Rotated `-Math.PI / 2` around X to lie flat in the XZ plane
   - Material: `ShaderMaterial` at detail zoom, `MeshBasicMaterial` at overview/standard zoom
   - `raycast={() => {}}` to avoid blocking hole selection/drag interactions
3. **Border outline** -- a `<Line>` rectangle around the hole perimeter:
   - `lineWidth={2}`, `worldUnits={false}`
   - 5 points forming a closed rectangle: bottom-left, bottom-right, top-right, top-left, bottom-left
   - Points computed from `[-width/2, 0.03, -length/2]` etc.
   - Color: slightly darker than the hole accent color

### Scale-Dependent Rendering Logic

The component uses the LOD level from `useZoomLOD()` (section 08) to decide what to render:

| LOD Level | Rendering |
|-----------|-----------|
| `"overview"` (zoom < 15) | Solid-color `MeshBasicMaterial` with hole accent color, no outline |
| `"standard"` (15 <= zoom < 40) | Solid-color `MeshBasicMaterial` with hole accent color, with outline |
| `"detail"` (zoom >= 40) | Procedural felt `ShaderMaterial` with noise texture, with outline |

If `useZoomLOD` is not yet available (section 08 not implemented), use a local fallback:

```typescript
import { useThree } from "@react-three/fiber";

// Fallback if useZoomLOD is not available
const camera = useThree((s) => s.camera);
const zoom = (camera as THREE.OrthographicCamera).zoom ?? 20;
const lod = zoom < 15 ? "overview" : zoom < 40 ? "standard" : "detail";
```

### Procedural Felt ShaderMaterial

**Location:** `src/components/three/architectural/HoleFeltShader.ts`

The felt shader creates a fabric-like appearance using procedural noise. It operates in object-space UVs (no texture loading needed).

**Vertex shader:** Standard passthrough that forwards UV coordinates.

```glsl
varying vec2 vUv;

void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

**Fragment shader:** Value noise via `fract(sin(dot(...)))` to simulate felt fiber randomness.

```glsl
uniform vec3 uColor;
uniform float uNoiseScale;
uniform float uNoiseStrength;

varying vec2 vUv;

// Simple value noise
float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
	vec2 i = floor(p);
	vec2 f = fract(p);
	f = f * f * (3.0 - 2.0 * f); // smoothstep
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));
	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
	float n = noise(vUv * uNoiseScale);
	vec3 feltColor = uColor * (1.0 - uNoiseStrength + n * uNoiseStrength * 2.0);
	gl_FragColor = vec4(feltColor, 1.0);
}
```

**Uniform defaults:**
- `uColor`: the hole type accent color converted to a `THREE.Color` vector
- `uNoiseScale`: `50.0` (controls density of felt fiber pattern)
- `uNoiseStrength`: `0.08` (subtle variation -- not overpowering)

**Factory function:**

```typescript
import * as THREE from "three";

export function createFeltMaterial(color: string): THREE.ShaderMaterial {
	/** Create a ShaderMaterial with felt noise uniforms.
	 *  Color is the hole type accent color (hex string).
	 *  Returns a ShaderMaterial with vertex/fragment shaders inlined.
	 */
	// Implementation: new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
}
```

The material should be memoized per color string to avoid recreating on every render. Use `useMemo` keyed on the color value in the component.

### UV Mode Colors

The accent color should be adjusted based on whether UV mode is active:

- **Planning mode:** Use the hole type's `color` property directly (e.g., `"#4CAF50"` for straight). Apply green tinting by mixing with `#2E7D32`.
- **UV mode:** Replace with a dark purple tint. Convert the base color to HSL, shift hue toward purple (~280 degrees), reduce saturation, and darken. Alternatively, use a simple mapping:
  - Base felt: `#1A1A3E` (dark purple base)
  - Neon accent: mix the original color at 30% with the purple base at 70%

The UV mode flag is read from the store: `useStore((s) => s.ui.uvMode)`.

### Border Line Colors

The outline border should complement the fill:

- **Planning mode:** Hole accent color darkened by 30% (e.g., `#388E3C` for straight holes)
- **UV mode:** Neon version of accent color at reduced intensity (e.g., `#6600FF` tint)

### Integration: Mounting in ArchitecturalFloorPlan

The `ArchitecturalFloorPlan.tsx` component (created in section 02) is the 2D-only wrapper that lives inside `SharedScene`. It should render a `<HoleFeltOverlays>` component that iterates over all placed holes:

```typescript
function HoleFeltOverlays() {
	/** Iterates over placed holes from the store and renders a HoleFelt2D
	 *  overlay for each. Respects holes layer visibility.
	 *  Uses the same data sources as PlacedHoles:
	 *  - useStore(s => s.holes) for hole data
	 *  - useStore(s => s.holeOrder) for iteration order
	 *  - useStore(s => s.holeTemplates) for template dimensions
	 *  - HOLE_TYPE_MAP for legacy hole dimensions
	 */
}
```

This component should be added inside `ArchitecturalFloorPlan` alongside the other 2D architectural elements (walls, openings, grid). It renders ONLY in the 2D viewport because `ArchitecturalFloorPlan` itself is viewport-gated.

### Layer Integration

The felt overlays must respect the `holes` layer:

- Read `useStore((s) => s.ui.layers.holes)` for visibility and opacity
- Return `null` when `holesLayer.visible` is `false`
- Apply opacity via `useGroupOpacity` hook on a wrapping `<group>` ref, same pattern as `HoleModel.tsx`

### Dimension Computation

Each hole's overlay dimensions come from the same source as `MiniGolfHole`:

- **Template holes** (`hole.templateId` is set): call `computeTemplateBounds(template)` from `src/utils/chainCompute.ts` which returns `{ width, length }`
- **Legacy holes** (no `templateId`): look up `HOLE_TYPE_MAP[hole.type].dimensions` which has `{ width, length }`

Both sources are already used in `MiniGolfHole.tsx` and `PlacedHoles.tsx`.

### Raycast Passthrough

All meshes in `HoleFelt2D` MUST set `raycast` to a no-op function to avoid intercepting pointer events meant for hole selection, dragging, and placement:

```tsx
<mesh raycast={() => {}} position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
```

This is critical because the felt overlay sits at Y=0.03, which is above the floor (Y=0) but below the interaction mesh in `MiniGolfHole` (Y=0.15, height=0.3). Without the no-op raycast, the overlay plane would intercept clicks before they reach the interaction mesh.

### Mobile Handling

On mobile (no `ViewportContext`, single canvas), `ArchitecturalFloorPlan` does not render (it is viewport-gated to `"2d"` only). Mobile top-down view continues to show holes via the existing `PlacedHoles` / `MiniGolfHole` pipeline with 3D models visible from above. No felt overlay is needed on mobile.

---

## Implementation Checklist

1. Create `src/components/three/architectural/HoleFeltShader.ts` with GLSL shader strings and `createFeltMaterial()` factory function
2. Create `src/components/three/architectural/HoleFelt2D.tsx` with:
   - Props: `hole`, `width`, `length`, `color`
   - LOD-based rendering: solid fill at overview/standard, felt shader at detail
   - Border `<Line>` outline at standard/detail zoom
   - UV mode color adjustments
   - `raycast={() => {}}` on all meshes
3. Create `HoleFeltOverlays` wrapper (either in its own file or inside `ArchitecturalFloorPlan.tsx`) that:
   - Reads holes, holeOrder, holeTemplates from store
   - Computes dimensions for each hole (template bounds or legacy type map)
   - Renders `<HoleFelt2D>` for each placed hole
   - Respects `layers.holes` visibility and opacity
4. Mount `<HoleFeltOverlays>` inside `ArchitecturalFloorPlan.tsx` (section 02's file)
5. Write Playwright visual regression tests verifying textured vs solid-color rendering at different zoom levels
6. Verify no regressions: hole placement, selection, dragging, and deletion still work with the overlay present

---

## Performance Considerations

- **Material memoization:** Each unique hole color should produce one `ShaderMaterial` instance. Use `useMemo` keyed on color + UV mode to avoid recreating materials every frame.
- **Object count:** With 9-18 placed holes, this adds 9-18 plane meshes and 9-18 `<Line>` outlines. Combined with other architectural elements, total stays within the ~76-94 object budget defined in the plan.
- **Shader cost:** The value noise function is extremely cheap (a few `sin`/`fract` calls per fragment). No texture sampling. No performance concern even on low-tier GPUs.
- **LOD gating:** At overview zoom, the shader is not used at all -- just `MeshBasicMaterial` with a solid color, which has zero shader overhead.

---

## Implementation Notes (Post-Build)

### Actual Files Created/Modified

| File | Status |
|------|--------|
| `src/components/three/architectural/HoleFeltShader.ts` | Created |
| `src/components/three/architectural/HoleFelt2D.tsx` | Created |
| `src/components/three/architectural/HoleFeltOverlays.tsx` | Created (separate file, not inline) |
| `src/components/three/architectural/ArchitecturalFloorPlan.tsx` | Modified (added HoleFeltOverlays import + mount) |
| `tests/visual/texturedHoles2D.spec.ts` | Created |

### Deviations from Plan

1. **LOD detection uses `useFrame` band-tracking** instead of inline `useThree` — the plan's approach (`useThree((s) => s.camera)`) returns a stable ref that doesn't re-render on zoom changes. Adopted the same `useFrame` + `useState` + `useRef` pattern used by `ArchitecturalGrid2D.tsx` in a `useZoomLodFallback()` hook.

2. **Felt shader includes `uOpacity` uniform** — the plan's shader outputs hardcoded `alpha=1.0`. Since `useGroupOpacity` sets `mat.opacity` which has no effect on custom ShaderMaterials, added a `uOpacity` uniform so layer opacity works correctly.

3. **Material disposal added** — `useEffect` cleanup disposes `ShaderMaterial` and `MeshBasicMaterial` when color changes (UV mode toggle), preventing GPU memory leaks.

4. **HoleFeltOverlays in separate file** — plan allowed either inline or separate file; chose separate `HoleFeltOverlays.tsx` for consistency with other architectural components.

5. **Test file at `tests/visual/texturedHoles2D.spec.ts`** — plan specified `tests/e2e/textured-holes-2d.spec.ts` but all existing visual tests live in `tests/visual/` with camelCase naming.

6. **Zoom control in Playwright tests uses mousewheel events** — plan didn't specify zoom mechanism; initial approach using R3F internals (`__r$`) was too fragile.

### Test Results
- 632 Vitest tests passing (0 regressions)
- 2 Playwright visual regression tests added (baselines generated on first run)