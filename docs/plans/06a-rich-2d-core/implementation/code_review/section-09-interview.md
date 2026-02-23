# Section 09 Code Review Interview — Title Block

## Auto-Fixed Issues

### 1. Dead Playwright tests (CRITICAL) — AUTO-FIXED
Moved `tests/e2e/titleBlock.spec.ts` → `tests/visual/titleBlock.spec.ts` to match Playwright config's `testDir: './tests/visual'`. Reverted the unnecessary `tests/e2e/**` exclusion in vite.config.ts.

### 2. Hidden behind MiniMap (CRITICAL) — AUTO-FIXED
Repositioned title block from `bottom-2 right-2` → `bottom-2 left-2` to avoid occlusion by MiniMap (which is `bottom-2 right-2 z-10`). Updated Playwright test assertions accordingly.

### 3. UTC date (MINOR) — AUTO-FIXED
Changed `new Date().toISOString().slice(0, 10)` → `new Date().toLocaleDateString("sv-SE")` for local YYYY-MM-DD format.

### 4. Accessibility (MINOR) — AUTO-FIXED
Added `aria-hidden="true"` since the title block is decorative/informational.

## Let Go
- Date staleness if app left open past midnight — acceptable for personal tool
- UV mode styling deviation — correct per project convention (no uvMode ternaries in UI)
