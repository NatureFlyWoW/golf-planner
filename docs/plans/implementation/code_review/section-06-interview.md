# Section 06: Code Review Interview

## Triage

All review items auto-fixed or let go. No user decisions needed.

### Auto-fixed

1. **C1 (Indentation in store.ts)**: Fixed via `biome format --write`. Indentation now matches surrounding actions.
2. **M1 (React.RefObject without import)**: Changed to explicit `import type { RefObject } from "react"` in ui.ts.
3. **Import ordering**: Fixed via `biome check --fix --unsafe` in test file.
4. **Pre-existing noArrayIndexKey**: Fixed Lightformer key from array index to position-based string key.

### Added

1. **GodRays TODO**: Added `// TODO(Section-09)` comment in PostProcessing.tsx for future GodRays integration.

### Let go

1. **getEffectsForTier not consumed by PostProcessing**: Inline tier checks are simpler and match the gating function's logic. For this personal project, the indirection is not worth the complexity. The function serves its purpose as a testable abstraction.
2. **Max-effects-per-tier enforcement**: Not worth adding count assertions — the gating function already encodes the policy.
