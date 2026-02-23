import { type Page, expect, test } from "@playwright/test";

/**
 * Visual regression tests for GOLF FORGE.
 *
 * These tests capture screenshots of key app states and compare
 * against baseline images stored in tests/visual/golf-forge.spec.ts-snapshots/.
 *
 * First run generates baselines. Subsequent runs compare against them.
 * Update baselines with: npx playwright test --update-snapshots
 *
 * Threshold: 0.1% pixel diff tolerance (maxDiffPixelRatio: 0.001)
 */

/** Wait for canvas and initial scene render. */
async function waitForCanvasRender(page: Page) {
	await page.waitForSelector("canvas", { timeout: 10000 });
	await page.waitForTimeout(2000);
}

/** Collapse the dual viewport to 3D-only via store. */
async function collapseTo3DOnly(page: Page) {
	await page.evaluate(() => {
		const store = (window as Record<string, any>).__STORE__;
		if (store) store.getState().collapseTo("3d");
	});
	await page.waitForTimeout(1000);
}

test.describe("Setup validation", () => {
	test("app loads successfully", async ({ page }) => {
		await page.goto("/");
		const toolbar = page.locator("[data-testid='toolbar']");
		await expect(toolbar).toBeVisible({ timeout: 10000 });
	});

	test("canvas renders within 5 seconds", async ({ page }) => {
		await page.goto("/");
		const canvas = page.locator("canvas").first();
		await expect(canvas).toBeVisible({ timeout: 5000 });
	});
});

test.describe("Planning Mode", () => {
	test("top-down orthographic view", async ({ page }) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		await expect(page).toHaveScreenshot("planning-top-down.png");
	});

	test("3D perspective view", async ({ page }) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		// Collapse to 3D-only mode (view-toggle removed in dual-viewport migration)
		await collapseTo3DOnly(page);
		await expect(page).toHaveScreenshot("planning-3d.png");
	});
});

test.describe("UV Mode", () => {
	test("top-down view", async ({ page }) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		// Toggle UV mode
		await page.locator("[data-testid='uv-toggle']").click();
		// Wait for transition animation (2.4s) + buffer
		await page.waitForTimeout(3000);
		await expect(page).toHaveScreenshot("uv-top-down.png");
	});

	test("3D perspective view with effects", async ({ page }) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		// Toggle UV mode
		await page.locator("[data-testid='uv-toggle']").click();
		await page.waitForTimeout(3000);
		// Collapse to 3D-only mode (view-toggle removed in dual-viewport migration)
		await collapseTo3DOnly(page);
		await page.waitForTimeout(1000);
		await expect(page).toHaveScreenshot("uv-3d.png");
	});
});

test.describe("Dark Theme UI", () => {
	test("sidebar — Holes tab", async ({ page }) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		const sidebar = page.locator("[data-testid='sidebar']");
		await expect(sidebar).toHaveScreenshot("sidebar-holes.png");
	});

	test("sidebar — Budget tab", async ({ page }) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		// Click Budget tab
		const budgetTab = page.locator("[data-testid='sidebar'] button", {
			hasText: "Budget",
		});
		await budgetTab.click();
		await page.waitForTimeout(500);
		const sidebar = page.locator("[data-testid='sidebar']");
		await expect(sidebar).toHaveScreenshot("sidebar-budget.png");
	});

	test("toolbar with GOLF FORGE branding", async ({ page }) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		const toolbar = page.locator("[data-testid='toolbar']");
		await expect(toolbar).toHaveScreenshot("toolbar.png");
	});
});

test.describe("Architectural Floor Plan (Split 06a)", () => {
	test("full 2D architectural floor plan at default zoom", async ({ page }) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		await expect(page).toHaveScreenshot("architectural-2d-default.png");
	});

	test("2D pane with collapsed 3D shows full-width floor plan", async ({
		page,
	}) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		await page.evaluate(() => {
			const store = (window as Record<string, any>).__STORE__;
			if (store) store.getState().collapseTo("2d");
		});
		await page.waitForTimeout(1000);
		await expect(page).toHaveScreenshot("architectural-2d-fullwidth.png");
	});

	test("UV mode shows appropriate colors for architectural elements", async ({
		page,
	}) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		await page.locator("[data-testid='uv-toggle']").click();
		await page.waitForTimeout(3000);
		await expect(page).toHaveScreenshot("architectural-2d-uv-mode.png");
	});
});

test.describe("Mobile", () => {
	test("mobile bottom toolbar", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await waitForCanvasRender(page);
		const bottomToolbar = page.locator("[data-testid='bottom-toolbar']");
		await expect(bottomToolbar).toHaveScreenshot("mobile-bottom-toolbar.png");
	});
});
