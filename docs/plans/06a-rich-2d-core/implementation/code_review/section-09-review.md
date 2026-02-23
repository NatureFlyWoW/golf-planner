# Section 09 Code Review — Title Block

## Critical Issues

### 1. Playwright tests will never run (HIGH)
The Playwright config sets `testDir: './tests/visual'`. The new e2e tests at `tests/e2e/` are outside this directory and will never be discovered. Combined with the vite.config.ts exclusion, these tests are excluded from BOTH Vitest and Playwright — dead code.

**Fix:** Move the test to `tests/visual/titleBlock.spec.ts`, or update Playwright config.

### 2. TitleBlock2D is hidden behind MiniMap (HIGH)
MiniMap is positioned `absolute right-2 bottom-2 z-10` at 150x150px. TitleBlock2D is also `absolute bottom-2 right-2` with no z-index. Both are siblings in the pane-2d div. The MiniMap completely occludes the title block.

**Fix:** Reposition TitleBlock2D — e.g., `bottom-2 left-2`, or `bottom-[170px] right-2` (above MiniMap).

## Minor Issues

### 3. UTC date instead of local
`new Date().toISOString().slice(0, 10)` uses UTC. In Austria (UTC+1/+2), shows yesterday's date after 10 PM. Use `new Date().toLocaleDateString('sv-SE')` for local YYYY-MM-DD.

### 4. No accessibility attributes
Consider `aria-hidden="true"` since it's decorative/informational.

## What Looks Good
- Clean component, proper hooks usage
- Semantic Tailwind tokens consistent with codebase
- pointer-events-none correct
- Mobile exclusion works naturally
- Correct integration point in DualViewport
