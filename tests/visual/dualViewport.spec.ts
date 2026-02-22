import { type Page, expect, test } from "@playwright/test";

/**
 * Visual regression tests for the dual viewport and layer system.
 *
 * First run generates baselines. Subsequent runs compare against them.
 * Update baselines with: npx playwright test --update-snapshots
 */

/** Wait for canvas and initial scene render. */
async function waitForCanvasRender(page: Page) {
	await page.waitForSelector("canvas", { timeout: 10000 });
	await page.waitForTimeout(2000);
}

test.describe("Dual Viewport Layout", () => {
	test("dual-pane layout at 1280x720 (50/50 split)", async ({ page }) => {
		// Default viewport is 1280x720 per playwright.config.ts
		await page.goto("/");
		await waitForCanvasRender(page);
		// Verify both panes are visible in dual mode
		await expect(page.locator("[data-testid='pane-2d']")).toBeVisible();
		await expect(page.locator("[data-testid='pane-3d']")).toBeVisible();
		await expect(page.locator("[data-testid='split-divider']")).toBeVisible();
		await expect(page).toHaveScreenshot("dual-pane-default.png");
	});

	test("collapsed-to-2D mode", async ({ page }) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		// Double-click the divider — collapses to 2D-only (default active viewport)
		await page.locator("[data-testid='split-divider']").dblclick();
		await page.waitForTimeout(500);
		// Verify 2D pane visible, 3D pane and divider hidden
		await expect(page.locator("[data-testid='pane-2d']")).toBeVisible();
		await expect(page.locator("[data-testid='pane-3d']")).not.toBeAttached();
		await expect(page.locator("[data-testid='split-divider']")).not.toBeAttached();
		await expect(page).toHaveScreenshot("collapsed-2d-only.png");
	});

	test("collapsed-to-3D mode", async ({ page }) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		// Set active viewport to 3D by hovering, then collapse
		await page.locator("[data-testid='pane-3d']").hover();
		await page.waitForTimeout(200);
		await page.locator("[data-testid='split-divider']").dblclick();
		await page.waitForTimeout(500);
		// Verify 3D pane visible, 2D pane and divider hidden
		await expect(page.locator("[data-testid='pane-3d']")).toBeVisible();
		await expect(page.locator("[data-testid='pane-2d']")).not.toBeAttached();
		await expect(page.locator("[data-testid='split-divider']")).not.toBeAttached();
		await expect(page).toHaveScreenshot("collapsed-3d-only.png");
	});
});

test.describe("Layer Panel", () => {
	test("layer panel visible in sidebar", async ({ page }) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		// Click the Layers tab in the sidebar
		const layersTab = page.locator("[data-testid='sidebar'] button", {
			hasText: "Layers",
		});
		await layersTab.click();
		await page.waitForTimeout(500);
		const sidebar = page.locator("[data-testid='sidebar']");
		await expect(sidebar).toHaveScreenshot("sidebar-layers.png");
	});

	test("layer with visibility toggled off", async ({ page }) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		// Open layers tab
		const layersTab = page.locator("[data-testid='sidebar'] button", {
			hasText: "Layers",
		});
		await layersTab.click();
		await page.waitForTimeout(300);
		// Toggle holes layer visibility off
		await page.locator("[data-testid='layer-visibility-holes']").click();
		await page.waitForTimeout(500);
		await expect(page).toHaveScreenshot("holes-layer-hidden.png");
	});
});

test.describe("Mobile Fallback", () => {
	test("mobile single-pane fallback (375x667)", async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto("/");
		await waitForCanvasRender(page);
		// Verify no dual-viewport structure on mobile
		await expect(page.locator("[data-testid='dual-viewport']")).not.toBeAttached();
		await expect(page).toHaveScreenshot("mobile-single-pane.png");
	});
});
