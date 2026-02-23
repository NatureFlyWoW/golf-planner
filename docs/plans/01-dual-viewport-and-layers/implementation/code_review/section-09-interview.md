# Section 09 Code Review Interview — Auto-Resolved

User away (brunch). All items triaged by Claude.

## Findings

### C1: shouldEnableFog returns false for "dual" (plan wanted true)
**Decision: LET GO — implementation is correct, plan was wrong**
The plan claimed fog renders only in the 3D View because ThreeDOnlyContent scopes it. This is wrong — `<fogExp2 attach="fog">` sets `scene.fog` on the shared scene object. Both Views render the same scene. Fog WOULD bleed into the 2D pane. Keeping fog disabled in dual mode is the correct behavior.

Mobile regression (viewportLayout stays "dual" on mobile, disabling fog) is a known issue to be resolved in section-10 (feature-migration) or section-11 (mobile-responsive), where mobile's `setView` action needs to sync `viewportLayout`.

### W1: deriveFrameloop forces "always" in dual mode (plan said same logic)
**Decision: LET GO — preserves spike finding**
The pre-existing DualViewport code forced "always" for dual mode because drei View rendering requires continuous frames. The plan was wrong to say the logic stays the same. Tests match the correct behavior.

### W2: ScreenshotCapture silent failure when 2d context unavailable
**Decision: AUTO-FIX — add console.warn**
If `canvas.getContext("2d")` returns null, add a console.warn so the failure isn't invisible.

### W3: iOS toBlob fallback removed
**Decision: LET GO — personal tool, modern iOS Safari**
The old fallback for toDataURL is no longer needed. The offscreen canvas's toBlob works on modern iOS Safari 15+.

### N1-N4: Informational notes
All acknowledged. No action needed.
