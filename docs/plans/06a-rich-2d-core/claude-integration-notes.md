# Integration Notes — Opus Review Feedback

## Integrating

### #1 SharedScene Dual-Rendering (CRITICAL)
**Integrating.** This is the central architectural problem. The plan must specify how `SharedScene` becomes viewport-aware. Solution: Use `ViewportContext` to conditionally render 2D-specific vs 3D-specific components within `SharedScene`. `Hall` will conditionally skip `HallWalls` and `HallOpenings` in the 2D viewport, replaced by `ArchitecturalFloorPlan`.

### #11 Section Ordering
**Integrating.** Moving viewport-aware rendering from Section 9 to Section 2 (after the spike). This is correct — it's a prerequisite for all 2D-specific components.

### #13 Raycast Passthrough
**Integrating.** All new architectural meshes must set `raycast` to a no-op to avoid blocking hole placement/selection raycasting. Adding this to each component section.

### #2 StatusBar vs LocationBar
**Integrating.** The existing `LocationBar` will be enhanced/merged with the new status bar functionality rather than creating a duplicate. Mouse coordinates and zoom level will be added to the existing bar. Renaming the enhanced component to `StatusBar`.

### #3 Store Update Frequency
**Integrating.** Will use a ref-based approach: store mouseWorldPos in a `useRef` updated at 60Hz, with the StatusBar subscribing via `useSyncExternalStore` or a separate lightweight Zustand store (no `ui` nesting overhead).

### #5 Mobile Path
**Integrating.** Mobile top-down view will get simplified architectural walls (outline only, no fill) when in ortho mode. `SharedScene` will check both viewport context and mobile layout.

### #12 UV Mode Per Section
**Integrating.** Adding UV mode color specifications to each section rather than deferring.

### #14 Performance/Object Count
**Integrating.** Revised count with mitigation: use `segments={true}` on `<Line>` to batch grid lines into fewer draw calls. Use a single `<Line>` per wall outline group rather than individual line segments.

### #15 Pointer Leave Handling
**Integrating.** Add `onPointerLeave` on the 2D pane container div to null out mouse position.

### #7 Remove Hatch from Spike
**Integrating.** Spike will validate only the three techniques actually used: mesh fill, Line2 lines, and SDF text.

### #10 Scale Formula
**Integrating.** Correcting the formula to account for actual camera frustum and viewport size.

## NOT Integrating

### #6 HoleFelt2D Integration Details
**Deferring depth.** The plan will note that HoleFelt2D renders *on top of* existing 3D models at a slight Y-offset (0.01) to avoid Z-fighting, similar to how FloorGrid already renders at Y=0.01. Full detail of the integration will be left to the implementor since it depends on how the viewport-aware SharedScene shakes out.

### #8 Single-Source LOD
**Not integrating.** Per-component `useZoomLOD()` hooks calling `useFrame` individually is fine for 4-5 components. The overhead is negligible (~5 ref reads per frame). A prop-drilling approach adds coupling between the wrapper and all child components.

### #16 Interior Wall Thickness
**Not integrating.** There are no interior walls in the current hall data. The 0.2m value applies to all exterior walls. Interior partitions are out of scope for this split.
