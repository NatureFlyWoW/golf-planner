# Section 08 Code Review Interview — Auto-Resolved

User is away; all items triaged and resolved by Claude autonomously.

## Warnings

### W-01: Duplicate LayerDefinition type
- **Decision:** AUTO-FIX
- **Action:** Remove local type from constants/layers.ts, import from types/viewport. Fix stale Lucide comment in viewport.ts.

### W-02: Unused layerId prop in LayerRow
- **Decision:** AUTO-FIX
- **Action:** Add `data-testid={`layer-row-${layerId}`}` to the row div for future testability, rather than removing the prop.

### W-03: Missing aria-label on MobileLayerPanel close button
- **Decision:** AUTO-FIX
- **Action:** Add `aria-label="Close layers panel"` to the close button.

## Notes (Let Go)
- N-01: MobileLayerPanel content wrapper differs slightly — intentional (better for scrollable content)
- N-02: No confirmation on Reset — plan-compliant, can add later
- N-03: No percentage readout on slider — minor UX gap, can add later
- N-04: MobileLayerPanel not wired in App.tsx — deferred to section-11 per plan
