Now I have all the context I need. Let me generate the section content.

# Section 12: Visual Regression Test Suite

## Overview

This section covers the installation, configuration, and creation of a Playwright-based visual regression test suite for the GOLF FORGE app. Playwright screenshot comparison tests capture all key visual states after all other Phase 11A tasks (T1 through T11) are complete. This suite runs independently from the existing Vitest unit test suite using a separate test runner and configuration.

**This section depends on ALL other sections (01 through 11) being complete.** It captures the final visual state of the entire Phase 11A transformation. Do not begin this section until every other section's implementation is verified and committed.

## Background

The project currently uses Vitest 4.0.18 with jsdom for 229 unit tests across 20 test files. All tests are pure logic/utility tests -- no component rendering or visual tests exist. The existing test files live in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/` with `*.test.ts` naming.

Playwright visual tests are fundamentally different from the existing Vitest tests:
- They launch a real browser (Chromium) and navigate to the running dev server
- They capture full-page or element screenshots and compare against baseline images
- They use a separate config file (`playwright.config.ts`) and separate test runner (`npx playwright test`)
- They require the app to be running (either via `webServer` config or a manual dev server)

The environment is WSL2 Ubuntu 24.04. Node is managed via fnm. The Playwright MCP server runs on the Windows side, but the Playwright test suite itself will run in WSL2 via `npx playwright test`. Headless Chromium in WSL2 requires specific system dependencies.

## TODO List

1. Install `@playwright/test` as a devDependency
2. Install Playwright browsers (Chromium only)
3. Create `playwright.config.ts` at the project root
4. Create the `tests/visual/` directory for screenshot tests
5. Create screenshot test file covering all key visual states
6. Generate initial baseline screenshots
7. Add npm script for running visual tests
8. Document test running instructions in a README

## Tests First

The tests ARE the deliverable for this section. The Playwright test file itself is the primary output. Below are the test specifications.

### File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/visual/golf-forge.spec.ts`

This is a Playwright test file (`.spec.ts` is the Playwright convention, distinct from Vitest's `.test.ts`). It captures screenshots of all key visual states and compares them against stored baselines.

```ts
import { expect, test } from "@playwright/test";

/**
 * Visual regression tests for GOLF FORGE Phase 11A.
 *
 * These tests capture screenshots of key app states and compare
 * against baseline images stored in tests/visual/golf-forge.spec.ts-snapshots/.
 *
 * First run generates baselines. Subsequent runs compare against them.
 * Update baselines with: npx playwright test --update-snapshots
 *
 * Threshold: 0.1% pixel diff tolerance (maxDiffPixelRatio: 0.001)
 */

test.describe("Planning Mode", () => {
	test("top-down orthographic view", async ({ page }) => {
		/** Navigate to app, ensure planning mode (uvMode off),
		 *  ensure top-down view, wait for canvas render,
		 *  capture full-page screenshot */
	});

	test("3D perspective view", async ({ page }) => {
		/** Navigate to app, switch to 3D perspective view,
		 *  wait for canvas render, capture full-page screenshot */
	});
});

test.describe("UV Mode", () => {
	test("top-down view — no fog visible", async ({ page }) => {
		/** Navigate, toggle UV mode on, ensure top-down view,
		 *  wait for transition to complete (if animated),
		 *  capture screenshot — fog should NOT appear in orthographic */
	});

	test("3D perspective view — fog, reflections, sparkles visible", async ({ page }) => {
		/** Navigate, toggle UV mode, switch to 3D view,
		 *  wait for effects to render (sparkles, reflections, fog),
		 *  capture screenshot */
	});
});

test.describe("Dark Theme UI", () => {
	test("sidebar — Holes tab", async ({ page }) => {
		/** Navigate, ensure sidebar visible (desktop viewport),
		 *  ensure Holes tab is selected, capture sidebar region screenshot */
	});

	test("sidebar — Budget tab with amber financial data", async ({ page }) => {
		/** Navigate, switch to Budget tab,
		 *  capture sidebar region — verify amber-on-dark styling */
	});

	test("sidebar — Cost tab with amber cost data", async ({ page }) => {
		/** Navigate, switch to Cost tab,
		 *  capture sidebar region */
	});

	test("toolbar with GOLF FORGE branding", async ({ page }) => {
		/** Navigate, capture toolbar region screenshot,
		 *  verify GOLF FORGE text is present */
	});
});

test.describe("Settings and Mobile", () => {
	test("settings modal — GPU tier dropdown visible", async ({ page }) => {
		/** Navigate, open settings modal, capture modal screenshot,
		 *  verify GPU tier dropdown is visible */
	});

	test("mobile bottom toolbar — dark theme", async ({ page }) => {
		/** Set viewport to mobile dimensions (375x667),
		 *  navigate, capture bottom toolbar region */
	});
});
```

All screenshot assertions use:
```ts
await expect(page).toHaveScreenshot("descriptive-name.png", {
	maxDiffPixelRatio: 0.001,  // 0.1% pixel diff tolerance
});
```

Or for element-level screenshots:
```ts
const sidebar = page.locator("[data-testid='sidebar']");
await expect(sidebar).toHaveScreenshot("sidebar-holes.png", {
	maxDiffPixelRatio: 0.001,
});
```

### Self-Validating Setup Tests

Include a preliminary test that validates the Playwright setup itself.

```ts
test.describe("Setup validation", () => {
	test("app loads successfully", async ({ page }) => {
		/** Navigate to app URL, verify page title or
		 *  a known element is present (e.g., canvas, toolbar) */
	});

	test("canvas renders within 5 seconds", async ({ page }) => {
		/** Navigate, wait for the R3F canvas element to appear
		 *  with a 5-second timeout */
	});
});
```

## Implementation Details

### Step 1: Install Playwright

Add `@playwright/test` to devDependencies in `/mnt/c/Users/Caus/Golf_Plan/golf-planner/package.json`:

```json
"devDependencies": {
	"@playwright/test": "^1.52.0",
	...
}
```

After installing via `npm install`, install the Chromium browser:

```bash
npx playwright install chromium
```

On WSL2, Playwright may need system dependencies. Install them with:

```bash
npx playwright install-deps chromium
```

If `sudo` is required and unavailable, use the `--with-deps` flag during `install` or document that system deps must be installed manually (see Step 8).

### Step 2: Create Playwright Config

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/playwright.config.ts`

```ts
import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for GOLF FORGE visual regression tests.
 * Runs Chromium only. Uses the Vite dev server via webServer config.
 *
 * Run:   npx playwright test
 * Update baselines: npx playwright test --update-snapshots
 */
export default defineConfig({
	testDir: "./tests/visual",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: "html",
	use: {
		baseURL: "http://localhost:5173",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
				viewport: { width: 1280, height: 720 },
			},
		},
	],
	webServer: {
		command: "npm run dev",
		url: "http://localhost:5173",
		reuseExistingServer: !process.env.CI,
		timeout: 30000,
	},
	expect: {
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.001,
		},
	},
});
```

Key config decisions:

- **Single browser (Chromium)**: Visual regression needs consistency, not cross-browser coverage. One browser means one set of baselines.
- **`workers: 1`**: Serialized execution prevents canvas/WebGL resource contention.
- **`fullyParallel: false`**: Same reason -- R3F canvas and GPU resources should not be shared across parallel test processes.
- **`webServer` config**: Automatically starts the Vite dev server before tests and shuts it down after. Uses `reuseExistingServer` in local dev to avoid restarting if the dev server is already running.
- **`viewport: { width: 1280, height: 720 }`**: Desktop viewport for consistent screenshots. Mobile tests override this per-test.
- **`maxDiffPixelRatio: 0.001`**: 0.1% pixel diff tolerance set globally. Individual tests inherit this.

### Step 3: Create Test Directory Structure

```
golf-planner/
  tests/
    visual/
      golf-forge.spec.ts              # Main visual regression test file
      golf-forge.spec.ts-snapshots/   # Auto-created by Playwright on first run
        *.png                          # Baseline screenshots (auto-generated)
```

The `*-snapshots/` directory is auto-created by Playwright on the first test run. Baseline images are committed to git so that future runs can compare against them.

### Step 4: Write the Test File

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/visual/golf-forge.spec.ts`

The complete test file follows the structure shown in the "Tests First" section above. Implementation notes for each test:

**Navigation and State Setup**: Each test navigates to the app URL (`/`), then manipulates state through the UI. Key interactions:

- **UV mode toggle**: Click the UV toggle button in the toolbar. Wait for any transition animation to complete (up to 3 seconds for the 2.4s animation).
- **View switching**: Click the 3D/top-down toggle button.
- **Tab switching**: Click sidebar tab buttons (Holes, Budget, Cost).
- **Settings modal**: Click the settings gear icon in the toolbar.
- **Mobile viewport**: Use `page.setViewportSize({ width: 375, height: 667 })` before navigation.

**Canvas Rendering Wait Strategy**: R3F/Three.js rendering is asynchronous. After navigation or state changes, wait for the canvas to be fully rendered:

```ts
// Wait for the canvas element to exist
await page.waitForSelector("canvas", { timeout: 10000 });

// Allow time for Three.js scene initialization and first render
await page.waitForTimeout(2000);
```

The 2-second wait after canvas detection is a pragmatic approach. Three.js scene setup (loading Environment HDR, compiling shaders, generating shadows) takes variable time. A fixed delay is more reliable than trying to detect "render complete" from outside the WebGL context.

For UV mode transitions specifically, wait an additional 3 seconds after clicking the toggle (the transition animation is 2.4 seconds):

```ts
await uvToggleButton.click();
await page.waitForTimeout(3000); // Wait for 2.4s transition + buffer
```

**Element Selectors**: The tests need to locate UI elements. Use data-testid attributes where possible. If data-testid attributes do not exist on target elements, add them during this task:

- `data-testid="toolbar"` on the Toolbar component root
- `data-testid="sidebar"` on the Sidebar component root
- `data-testid="uv-toggle"` on the UV mode toggle button
- `data-testid="view-toggle"` on the 3D/top-down toggle button
- `data-testid="settings-button"` on the settings gear button
- `data-testid="settings-modal"` on the settings modal container

If adding data-testid attributes requires modifying UI component files, keep changes minimal -- add only the `data-testid` prop to the outermost element of each relevant component.

**Screenshot Types**:

- Full-page screenshots (`page.toHaveScreenshot(...)`) for 3D viewport states (planning mode, UV mode) where the entire visual composition matters.
- Element screenshots (`locator.toHaveScreenshot(...)`) for UI component states (sidebar, toolbar, modal) where you want to isolate the UI from the variable canvas content.

### Step 5: Add npm Script

Add a `test:visual` script to `/mnt/c/Users/Caus/Golf_Plan/golf-planner/package.json`:

```json
"scripts": {
	"test": "vitest",
	"test:visual": "playwright test",
	...
}
```

This keeps the Playwright tests separate from the Vitest suite. `npm test` continues to run only unit tests. `npm run test:visual` runs the Playwright screenshot comparison tests.

### Step 6: Generate Initial Baselines

On first run, Playwright will fail every `toHaveScreenshot` assertion because no baselines exist. Generate baselines with:

```bash
npx playwright test --update-snapshots
```

This creates the `tests/visual/golf-forge.spec.ts-snapshots/` directory and populates it with baseline PNG images. These baseline images must be committed to git.

**Important**: Baselines must be generated AFTER all T1-T11 tasks are complete and verified. The baselines represent the final Phase 11A visual state.

### Step 7: Git Considerations

Add the snapshot directory to git tracking:

```bash
git add tests/visual/golf-forge.spec.ts-snapshots/
```

The baseline PNGs are binary files. They will increase the repo size, but this is standard practice for visual regression testing. The number of screenshots (roughly 10-12) at typical web page sizes will add approximately 5-15 MB to the repo.

Add Playwright artifacts to `.gitignore` (these are generated on each run and should not be committed):

```
# Playwright
test-results/
playwright-report/
```

### Step 8: Document Test Instructions

Create a brief section in the test file's JSDoc header (already shown in the test spec above) and optionally a `tests/visual/README.md` file:

File: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/visual/README.md`

This file should document:

- **Prerequisites**: Node.js via fnm, Chromium browser installed via `npx playwright install chromium`
- **System dependencies on WSL2**: `npx playwright install-deps chromium` (requires sudo) or manual installation of: `libnss3`, `libatk-bridge2.0-0`, `libdrm2`, `libxkbcommon0`, `libgbm1`, `libpango-1.0-0`, `libcairo2`, `libasound2`
- **Run tests**: `npm run test:visual` or `npx playwright test`
- **Update baselines**: `npx playwright test --update-snapshots`
- **View report**: `npx playwright show-report` (opens HTML report in browser)
- **Threshold**: 0.1% pixel diff tolerance (configured globally in `playwright.config.ts`)
- **Note on consistency**: Screenshots are pixel-compared, so they are sensitive to rendering differences across platforms. Baselines must be generated and compared on the same environment (WSL2 Chromium headless). Do not mix baselines from different OSes or browser versions.

## Files to Create

| File | Purpose |
|------|---------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/playwright.config.ts` | Playwright configuration (Chromium, dev server, thresholds) |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/visual/golf-forge.spec.ts` | Screenshot comparison tests for all key visual states |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/tests/visual/README.md` | Documentation for running visual tests |

## Files to Modify

| File | Change |
|------|--------|
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/package.json` | Add `@playwright/test` devDependency, add `test:visual` npm script |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/.gitignore` | Add `test-results/` and `playwright-report/` entries |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/Toolbar.tsx` | Add `data-testid="toolbar"`, `data-testid="uv-toggle"`, `data-testid="view-toggle"`, `data-testid="settings-button"` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/Sidebar.tsx` | Add `data-testid="sidebar"` |
| `/mnt/c/Users/Caus/Golf_Plan/golf-planner/src/components/ui/BottomToolbar.tsx` | Add `data-testid="bottom-toolbar"` |

Additional UI component files may need `data-testid` attributes depending on the exact selector strategy chosen at implementation time. Keep modifications minimal -- one attribute per component root element.

## Dependencies on Other Sections

This section depends on **all** other sections (01 through 11) being complete:

- **Section 01 (GPU Tier)**: Settings modal must have GPU tier dropdown for the settings modal screenshot
- **Section 02 (Theme Tokens)**: Tailwind dark theme tokens must be defined for any dark-themed screenshots
- **Section 03 (Dark Theme)**: All UI components must be converted to dark theme, GOLF FORGE branding must be in the toolbar
- **Section 04 (Data Panels)**: BudgetPanel and CostPanel must have amber-on-dark styling for data panel screenshots
- **Section 05 (Environment)**: Environment, fog, and SoftShadows must be configured for 3D view screenshots
- **Section 06 (PostProcessing)**: Bloom, effects, and Sparkles must be active for UV mode screenshots
- **Section 07 (Reflections)**: MeshReflectorMaterial must be active for UV 3D perspective screenshot
- **Section 08 (UV Lighting)**: RectAreaLights and lamp fixtures must be present for UV mode screenshots
- **Section 09 (GodRays)**: GodRays effect must be rendering (or cleanly absent if cut) for UV 3D screenshot
- **Section 10 (UV Transition)**: Transition animation must be complete before UV mode screenshots are captured
- **Section 11 (Perf Fixes)**: Singleton materials must be in place for consistent rendering

## CI Considerations

Playwright visual tests in CI require a consistent rendering environment. For this project (personal tool, no CI pipeline), the tests run locally in WSL2. If CI is added later:

- Use a Docker container with a fixed Chromium version for deterministic rendering
- Set `process.env.CI` to enable `forbidOnly` and retries in the Playwright config
- Consider increasing the diff tolerance (`maxDiffPixelRatio`) for CI environments where GPU rendering may differ slightly from local

## Verification Checklist

After implementation, verify:

1. `npx playwright test` runs without configuration errors
2. `npx playwright test --update-snapshots` generates baseline images in `tests/visual/golf-forge.spec.ts-snapshots/`
3. Running `npx playwright test` a second time (without changes) passes with all screenshots matching baselines
4. Baseline screenshots visually show the expected content (dark theme, GOLF FORGE branding, amber data panels, UV effects)
5. The `npm run test:visual` script works as a shorthand
6. Existing Vitest tests (`npm test`) are unaffected and still pass
7. `test-results/` and `playwright-report/` are git-ignored
8. Baseline snapshot PNGs are committed to git

## Implementation Notes

### Files Summary (Actual)

| File | Action | Description |
|------|--------|-------------|
| `playwright.config.ts` | Created | Chromium only, workers:1, webServer config, 0.1% diff threshold |
| `tests/visual/golf-forge.spec.ts` | Created | 10 tests: 2 setup + 2 planning + 2 UV + 3 dark theme + 1 mobile |
| `tests/visual/README.md` | Created | Running instructions |
| `tests/visual/golf-forge.spec.ts-snapshots/` | Created | 8 baseline PNG screenshots |
| `package.json` | Modified | Added @playwright/test devDep, test:visual script |
| `.gitignore` | Modified | Added test-results/ and playwright-report/ |
| `vite.config.ts` | Modified | Added test.exclude for visual tests (using defaultExclude spread) |
| `src/components/ui/Toolbar.tsx` | Modified | data-testid on toolbar, uv-toggle, view-toggle |
| `src/components/ui/Sidebar.tsx` | Modified | data-testid on sidebar |
| `src/components/ui/BottomToolbar.tsx` | Modified | data-testid on bottom-toolbar |

### Deviations from Plan
- **Cost tab test omitted**: Sidebar has Holes/Detail/Budget tabs, no dedicated Cost tab. Plan was incorrect about sidebar structure.
- **Settings modal test omitted**: Settings is opened from BudgetPanel, not a toolbar gear icon. No `data-testid="settings-button"` or `data-testid="settings-modal"` needed.
- **UV test names simplified**: "top-down view" and "3D perspective view with effects" instead of plan's longer descriptions.
- Used `defaultExclude` spread from `vitest/config` to avoid clobbering Vitest's default test exclusions.

### Verification Results
- 10 Playwright tests pass (baseline generation + comparison)
- 377 Vitest tests unaffected
- `tsc --noEmit` clean