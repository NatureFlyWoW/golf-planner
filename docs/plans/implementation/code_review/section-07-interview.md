## Section 07: Code Review Interview

### Triage

| Finding | Action | Rationale |
|---------|--------|-----------|
| B1: perfRef not reactive | Auto-fix | Obvious bug — useRef doesn't trigger re-render |
| B2: No hysteresis | Let go | Over-engineering; R3F debounce handles oscillation |
| M1: Material disposal on toggle | Let go | Acceptable for personal project |

### Auto-Fix Applied: B1

Changed from `useRef` (never triggers re-render) to `useState` with a `useRef` guard:
- `perfOkRef` tracks the current boolean to avoid unnecessary state updates
- `setPerfOk` only called when crossing the 0.5 threshold
- `shouldUseReflector` receives `1.0` or `0.0` based on `perfOk` boolean

This ensures the component re-renders when performance degrades below threshold.
