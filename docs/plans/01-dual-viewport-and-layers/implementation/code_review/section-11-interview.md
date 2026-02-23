# Section 11 Code Review Interview — Auto-Resolved

User away (brunch). All items triaged by Claude.

## Findings

### I1: CameraPresets uses static isMobile instead of reactive hook
**Decision: LET GO — component is never rendered on mobile path**
CameraPresets lives inside the 3D pane div. When `isMobileViewport` is true, the mobile early-return renders a completely different tree that doesn't include the 3D pane div at all. The `isMobile` guard inside CameraPresets is just a safety net for the desktop path, where it correctly hides presets on touch-primary devices. No functional issue.

### I2: Mobile fallback re-creates camera on view toggle
**Decision: LET GO — mirrors pre-DualViewport behavior**
Before the dual-viewport refactor, the app had a single Canvas with conditional camera rendering based on `ui.view`. The mobile path preserves this exact behavior. Camera state loss on toggle is a pre-existing limitation, not a regression introduced by this section.

### I3: SSR guard inconsistency in useIsMobileViewport
**Decision: LET GO — useEffect is inherently client-side**
React's `useEffect` never runs during SSR by design. The `useState` initializer guard is needed because it runs during module evaluation/render. The `useEffect` body is safe without a guard. This is standard React practice.

### I4: Mobile path omits MiniMap
**Decision: LET GO — intentional for mobile UX**
MiniMap is useful for the always-visible 2D pane on desktop. On mobile (375px width), it would consume excessive screen space. Users can zoom out for the overview. No plan requirement for mobile MiniMap.

### I5: Mobile path hardcodes antialias: false
**Decision: LET GO — performance optimization for small viewports**
On viewports below 768px, antialiasing provides minimal visual benefit due to pixel density. The edge case of a desktop browser resized to mobile width is uncommon and the performance saving is worthwhile.

### I6: useDoubleTapReset hooks fire on mobile
**Decision: LET GO — React Rules of Hooks require it**
Hooks cannot be called conditionally. The hooks safely handle null refs (early return in useEffect). Zero overhead on mobile — no event listeners attached.

### I7: Mobile path doesn't set activeViewport
**Decision: LET GO — irrelevant on single-pane**
activeViewport is used for event isolation in dual-pane mode (determining which pane a pointer event belongs to). On mobile single-pane, there's no event isolation needed. All ViewportContext consumers handle null context gracefully.

### I8-I10: Low-severity observations acknowledged
All cosmetic/documentation items. No action needed.
