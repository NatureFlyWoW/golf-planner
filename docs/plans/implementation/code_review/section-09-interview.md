# Section 09 Code Review Interview

## Triage Summary

| # | Issue | Severity | Decision |
|---|-------|----------|----------|
| 1 | GodRaysEffect reconstruction per render | HIGH | Let go — props are stable primitives from `as const`, React shallow-compares |
| 2 | Stale ref in strict mode | HIGH | Let go — dev-only, no production impact |
| 3 | Dead `emissiveIntensity` config | MEDIUM | Auto-fix — removed unused field (meshBasicMaterial has no emissiveIntensity) |
| 4 | Pass RefObject vs .current | MEDIUM | Let go — `.current` is clearer; mount/unmount is intentional design |
| 5 | Missing `emissiveColor` test | MEDIUM | Auto-fix — added test |
| 6 | Reference alias not copy | LOW | Let go — positions are const in practice |
| 7 | Missing undefined field test | LOW | Let go — TS prevents this |
| 8 | Key missing y coordinate | LOW | Auto-fix — included all 3 coords |

## Auto-fixes Applied

1. Removed `emissiveIntensity: 3.0` from `GODRAYS_SOURCE_CONFIG` (meshBasicMaterial doesn't use it)
2. Added `emissiveColor` test to `tests/godrays.test.ts`
3. Changed mesh key from `godrays-${pos[0]}-${pos[2]}` to `godrays-${pos[0]}-${pos[1]}-${pos[2]}`

## User Interview

User away — no items required user input. All decisions were auto-triaged.
