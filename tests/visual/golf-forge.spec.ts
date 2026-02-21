import { type Page, expect, test } from "@playwright/test";

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

/** Wait for canvas and initial scene render. */
async function waitForCanvasRender(page: Page) {
	await page.waitForSelector("canvas", { timeout: 10000 });
	await page.waitForTimeout(2000);
}

test.describe("Setup validation", () => {
	test("app loads successfully", async ({ page }) => {
		await page.goto("/");
		const toolbar = page.locator("[data-testid='toolbar']");
		await expect(toolbar).toBeVisible({ timeout: 10000 });
	});

	test("canvas renders within 5 seconds", async ({ page }) => {
		await page.goto("/");
		const canvas = page.locator("canvas");
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
		// Switch to 3D view
		await page.locator("[data-testid='view-toggle']").click();
		await page.waitForTimeout(1000);
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
		// Switch to 3D view
		await page.locator("[data-testid='view-toggle']").click();
		await page.waitForTimeout(2000);
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
		const budgetTab = page.locator("[data-testid='sidebar'] button", { hasText: "Budget" });
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

test.describe("Mobile", () => {
	test("mobile bottom toolbar", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await waitForCanvasRender(page);
		const bottomToolbar = page.locator("[data-testid='bottom-toolbar']");
		await expect(bottomToolbar).toHaveScreenshot("mobile-bottom-toolbar.png");
	});
});
