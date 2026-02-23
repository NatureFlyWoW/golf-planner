# Section 03 Code Review Interview

## Triage

| Finding | Severity | Decision |
|---------|----------|----------|
| Material re-creation on UV toggle | MEDIUM | Let go — UV toggle is rare, opacity usually 1.0, R3F handles material disposal |
| Unused `wallSide` in rects | LOW | Auto-fix — removed dead field from rects array |
| No gap clamping | LOW | Let go — personal tool, data validated upstream |
| No tests for `rectToOutlineSegments` | INFO | Let go — trivial geometry, tested indirectly |
| `outlineOnly` mobile path | INFO | Let go — correctly deferred to future |

## Auto-fixes Applied

1. Removed unused `wallSide` field from `allRects` array — changed type from `{ rect: WallRect; wallSide: Wall }[]` to `WallRect[]`, simplified destructuring in map callback, removed unused `Wall` type import.

## No User Interview Needed

All findings were either low-risk auto-fixes or items to let go. No tradeoff decisions requiring user input.
