# Demo Screenshot Issues — 2026-02-21

## Summary
Attempted to capture Phase 11A screenshots via Playwright MCP. Some succeeded, others hit issues.

## Screenshots Captured Successfully
1. **phase11a-dark-theme-main.png** — Top-down view with GOLF FORGE dark theme, sidebar with hole library
2. **phase11a-3d-perspective.png** — 3D isometric view showing hall with placed holes, flow path, sun indicator
3. **phase11a-uv-3d-blacklight.png** — UV mode in 3D (subtle changes — bloom/reflections/godrays not yet implemented)

## Screenshot Save Location Issue
- Playwright MCP saved files relative to its own working directory (`docs/screenshots/phase11a-*.png`)
- This path is relative to wherever Playwright resolves, NOT the golf-planner project root
- The files did NOT appear in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/docs/screenshots/`
- **Fix**: Use absolute Windows paths or copy files after capture

## Sidebar Tab Switching Bug (Playwright)
### Symptoms
- Clicking the "Budget" tab button via Playwright does NOT switch the sidebar panel content
- The tab's CSS classes DO update to the active state (`border-accent-text text-accent-text`)
- But the sidebar body continues showing the Holes panel content

### Commands Tried (all failed to switch content)
```js
// 1. Playwright run_code with getByRole
await page.getByRole('button', { name: 'Budget' }).click();

// 2. Playwright snapshot ref click
browser_click(ref=e28, element="Budget tab button")
// Error: "Ref e28 not found in the current page snapshot"

// 3. Locator with force click
const btn = page.locator('button:has-text("Budget")').first();
await btn.click({ force: true });

// 4. Direct mouse coordinate click (THIS changed the CSS class but not content)
await page.mouse.click(175, 52);
// Result: classes changed to active, but panel content didn't switch
```

### Analysis
- The tab's `onClick` handler likely calls `useStore.getState().setSidebarTab('budget')`
- The CSS class change confirms the click IS reaching the button and state IS updating
- The sidebar content panel may be reading a different state variable, or there's a React rendering issue with Playwright's click events not triggering a proper re-render
- Alternatively, the 3D canvas overlay may be intercepting pointer events somehow

### Possible Causes
1. **Zustand state split**: Tab highlight reads `sidebarTab` but content renders based on a different condition
2. **Canvas pointer-events**: The R3F `<Canvas>` with `touchAction: "none"` might be intercepting events
3. **Playwright event dispatch**: Playwright's synthetic click may not trigger React's synthetic event system properly for Zustand updates
4. **Stale snapshot refs**: Multiple `browser_snapshot` calls returned refs (e.g., `e28`) that immediately became stale — suggesting rapid DOM updates

### Ref Staleness Issue
- `browser_snapshot` returns refs like `e13`, `e28`
- `browser_click(ref=e28)` consistently errors with "Ref not found in current page snapshot"
- Workaround: Use `browser_run_code` with Playwright locators instead of snapshot refs
- This is a known Playwright MCP issue — refs expire between snapshot and click

## Recommendations for Next Demo Session
1. Use absolute paths for screenshot saves: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/docs/screenshots/`
2. For tab switching, try dispatching the Zustand action directly:
   ```js
   // If store is exposed on window in dev mode
   window.__ZUSTAND_STORE__.getState().setSidebarTab('budget');
   ```
3. Or expose a `window.__setTab` debug helper in dev mode
4. Consider adding `data-testid` attributes to interactive elements for more reliable Playwright targeting
5. Use `browser_run_code` exclusively (not snapshot refs) for interaction
