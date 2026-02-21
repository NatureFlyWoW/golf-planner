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
