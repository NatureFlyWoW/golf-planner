# Phase 11A Interview Transcript

## Q1: Bloom Strategy — Selective vs. Soft
**Q:** The design specifies emissiveIntensity: 2.0 with bloom threshold 0.8 for selective bloom. Current code uses emissiveIntensity: 0.8 with threshold 0.2 (everything blooms). Which approach?
**A:** Design's selective bloom — only neon surfaces glow intensely (emissiveIntensity 2.0 + threshold 0.8). More cinematic.

## Q2: App Branding
**Q:** Is 'GOLF FORGE' the final name or placeholder?
**A:** GOLF FORGE is the official name. Use it throughout.

## Q3: UV "Lights Out" Transition Priority
**Q:** How important is the 2.4s theatrical transition vs. core rendering?
**A:** High priority — it's the wow factor. The theatrical transition IS the experience.

## Q4: GPU Tier Detection Caching
**Q:** detect-gpu downloads ~200KB benchmarks from CDN. Cache result in localStorage or re-detect every session?
**A:** Cache in localStorage. Detect once, remember the tier. User can override in settings.

## Q5: Reflective Floor Usage
**Q:** How much time in 3D perspective vs. top-down?
**A:** Mixed use — switches between views regularly, both are important. Keep MeshReflectorMaterial view-gated but ensure it works well.

## Q6: UV Lamp Visibility
**Q:** Should UV lamp fixtures be visible geometry in the scene, or invisible light sources?
**A:** Visible only in 3D view — show lamp fixtures in 3D perspective but hide in top-down (they'd be ceiling clutter).

## Q7: Testing Approach
**Q:** How to test this visual-heavy phase? Unit tests only, visual regression, or manual QA?
**A:** Add visual regression tests — use Playwright screenshots to catch visual regressions.

## Q8: Dark Theme Conversion Strategy
**Q:** Big-bang conversion (one task, change everything) or incremental by component group?
**A:** Big-bang — define tokens first, then find-and-replace all Tailwind color classes in one pass.
