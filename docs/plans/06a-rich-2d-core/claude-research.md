# Research Findings — Split 06a: Rich 2D Floor Plan Core + Status Bar

## Research Sources
- Web research: R3F line rendering, Three.js hatch patterns, text rendering approaches
- Context7: drei (Line, Text, Html, Hud), Three.js (Line2, LineMaterial, LineGeometry)
- Existing codebase knowledge from Split 01 implementation

---

## 1. Crisp Line Rendering in R3F / Three.js

### The Problem
WebGL's native `GL_LINES` are clamped to 1px on most GPUs. Anti-aliasing is poor — 1px lines aren't antialiased properly because AA is performed on an sRGB buffer using linear calculations. Native line primitives are inadequate for architectural-quality rendering.

### Recommended: drei `<Line>` (wraps Three.js `Line2`)
Three.js's `Line2` system from `examples/jsm/lines/` draws lines as screen-space-expanded triangle strips with a custom shader. drei wraps this as `<Line>`:

```tsx
<Line
  points={[[0, 0, 0], [10, 0, 0], [10, 5, 0]]}
  color="black"
  lineWidth={1.5}       // pixels (screen-space) by default
  segments={false}      // false = Line2, true = LineSegments2
  dashed={false}
  // worldUnits={false}  // false = pixels, true = world units
/>
```

**Key configuration for floor plans:**

| Property | Recommendation | Rationale |
|----------|---------------|-----------|
| `lineWidth` | Pixel mode (default) | Lines should stay constant thickness regardless of zoom |
| `worldUnits` | `false` | Screen-space gives consistent visual weight at all zoom levels |
| `resolution` | Auto-handled by drei | Raw LineMaterial needs `material.resolution.set(w, h)` on resize |
| `dashed` | Available but world-space | Screen-space dashes need custom shader |

**Anti-aliasing:** Renderer `antialias: true` + Line2's built-in feathered edges via alpha blending at sub-pixel widths.

### Alternative: Instanced Line Rendering
For 500k+ segments, Rye Terrell's instanced technique uses a single instanced draw call. More performant at extreme scales but requires custom implementation. Not needed for our floor plan (~100-200 line segments).

### Dashed Lines Note
Built-in `dashed` property uses world-space dash patterns (dashes change visual size with zoom). For constant screen-space dashes, a custom `LineMaterial` shader extension is needed. This is an open Three.js feature request (#31583).

---

## 2. Hatch Patterns and Architectural Fills

### Recommended: Procedural Fragment Shader (ShaderMaterial)

Use `gl_FragCoord` for screen-space zoom-independent hatching (architectural convention for section fills):

**Diagonal hatch:**
```glsl
vec2 screenPos = gl_FragCoord.xy;
float diagonal = screenPos.x + screenPos.y;
float pattern = fract(diagonal / u_lineSpacing);
float line = step(pattern, u_lineWidth / u_lineSpacing);
```

**Cross-hatch (two directions):**
```glsl
float d1 = fract((screenPos.x + screenPos.y) / spacing);
float d2 = fract((screenPos.x - screenPos.y) / spacing);
float crosshatch = max(step(d1, threshold), step(d2, threshold));
```

**Screen-space vs Object-space:**

| Approach | Pattern moves with zoom? | Pattern moves with pan? | Use for |
|----------|------------------------|------------------------|---------|
| Screen-space (`gl_FragCoord`) | No (fixed density) | Yes (slides) | Section hatching (architectural standard) |
| Object-space (UV) | Yes (scales) | No (locked) | Material textures |

### Alternative: Texture-Based
Repeating texture with `THREE.RepeatWrapping`. Simpler but pattern scales with geometry. Making it zoom-independent requires dynamically updating `texture.repeat` based on camera zoom — less elegant than shader approach.

### Alternative: TAM Hatching
Sophisticated approach using 6 progressive hatch textures blended by lighting. Designed for NPR rendering of 3D objects, overkill for floor plan hatching.

---

## 3. Text Rendering at Variable Zoom Levels

### Comparison Matrix

| Approach | Zoom Quality | Performance | Styling | Constant Screen Size | Complexity |
|----------|-------------|-------------|---------|---------------------|------------|
| **drei `<Text>` (SDF/Troika)** | Excellent | Good | Limited | Manual inverse-zoom | Low |
| **drei `<Html>`** | Perfect (DOM) | Poor at scale | Full CSS | Built-in `distanceFactor` | Very low |
| **Canvas Texture** | Poor (bitmap) | Best | Good | Must regenerate per zoom | Medium |
| **MSDF pre-generated** | Excellent | Best for static | Very limited | Manual scaling | High |

### drei `<Text>` (Troika SDF) — Primary Choice
Generates SDF atlases on-the-fly from font files in a web worker. Text stays crisp when scaled because bilinear interpolation of distance values preserves edge information.

For constant screen-size text with orthographic zoom, scale inversely to camera zoom:
```tsx
useFrame(({ camera }) => {
  const scale = 1 / camera.zoom;
  ref.current.scale.setScalar(scale);
});
```

### drei `<Html>` — For Interactive Overlays
Real DOM elements positioned via CSS `transform: matrix3d()`. `distanceFactor` prop auto-scales with orthographic zoom. Performance degrades above ~100 instances, unusable at 2000+.

**Use for:** tooltips, editable labels, interactive UI overlays (keep count under ~50).

### drei Hud Component — For Fixed-Position Overlays
Renders content on top of scene with separate camera. Suitable for title block and status bar type elements that should NOT move with the scene.

---

## 4. Existing Codebase Patterns (from Split 01)

### Architecture
- **Single Canvas** with `@react-three/drei` `<View>` component for dual-pane layout
- **Orthographic camera** in 2D pane with pan/zoom controls
- **Zustand store** with slices: hall, holes, ui, viewport, layers
- **Layer system**: visibility toggles, opacity sliders, lock state

### Key Files
- `src/constants/hall.ts` — Hall dimensions (10m x 20m), wall positions, doors, windows
- `src/components/three/HallWalls.tsx` — Current wall rendering
- `src/components/three/Hall.tsx` — Floor, grid, walls, doors, windows
- `src/components/three/DualViewport.tsx` — View layout with split pane
- `src/store/slices/layerSlice.ts` — Layer state management

### Rendering Context
- `preserveDrawingBuffer: false` required in dual-view mode (View sets `autoClear=false`)
- EffectComposer in one View does NOT bleed into other Views
- SoftShadows patches `THREE.ShaderChunk` globally — don't dynamically mount/unmount
- GPU tier gating for performance-sensitive features
- PostToolUse hook runs `npx tsc --noEmit` automatically

### Testing
- 582 Vitest tests (52 files) + Playwright visual tests
- Store format v8
- Store exposed on `window.__STORE__` for E2E testing (dev mode)

---

## 5. Holistic Floor Plan Rendering Patterns

Open-source architectural floor plan projects share common patterns:
- Orthographic camera for 2D view
- Triangle-expanded lines (not native GL lines) for walls
- HTML overlay or Canvas2D for text labels
- Separate materials for different architectural conventions

Notable projects: blueprint3d, architect3d, Floorspace.js

---

## 6. Recommendation Summary

| Need | Solution | Key Detail |
|------|----------|------------|
| Wall outlines | drei `<Line>` with `worldUnits={false}` | Constant pixel width at any zoom |
| Wall fill | `<mesh>` with `ShaderMaterial` + hatch shader | Screen-space diagonal hatch |
| Door arcs | drei `<Line>` with computed arc points | Quarter-circle point array |
| Window symbols | drei `<Line>` segments | Standard plan symbol geometry |
| Room/area labels | drei `<Text>` + inverse-zoom scaling | SDF stays crisp at all zoom |
| Title block | drei `<Hud>` or HTML overlay | Fixed position, doesn't scroll |
| Status bar | React DOM (outside Canvas) | HTML div at bottom of app |
| Grid labels | drei `<Text>` at grid edges | Scale with zoom for readability |
| Hole felt texture | Custom `ShaderMaterial` or texture | Object-space for material look |
| Scale-dependent detail | LOD based on `camera.zoom` | Threshold-based rendering |

### Key Sources
- "Drawing Lines is Hard" — Matt DesLauriers (definitive WebGL line reference)
- drei Line/Text/Html/Hud docs (Context7)
- Three.js Line2/LineMaterial docs (Context7)
- The Book of Shaders ch. 9 — procedural patterns
- Three.js examples: fat lines, instanced lines
