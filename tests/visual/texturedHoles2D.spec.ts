import { type Page, expect, test } from "@playwright/test";

/**
 * Visual regression tests for textured 2D hole felt overlays.
 * Verifies LOD-based rendering: felt shader at detail zoom, solid color at overview.
 */

async function waitForCanvasRender(page: Page) {
	await page.waitForSelector("canvas", { timeout: 10000 });
	await page.waitForTimeout(2000);
}

/** Collapse to 2D-only mode for clear felt overlay visibility. */
async function collapseToLayout(page: Page, layout: "2d-only" | "3d-only") {
	const side = layout === "2d-only" ? "2d" : "3d";
	await page.evaluate((s) => {
		const store = (window as Record<string, any>).__STORE__;
		if (store) store.getState().collapseTo(s);
	}, side);
	await page.waitForTimeout(500);
}

/** Place a straight hole at center via store injection (positional args). */
async function placeTestHole(page: Page) {
	await page.evaluate(() => {
		const store = (window as Record<string, any>).__STORE__;
		if (!store) return;
		const state = store.getState();
		state.addHole("straight", { x: 5, z: 10 });
	});
	await page.waitForTimeout(500);
}

test.describe("Textured 2D Holes", () => {
	test("zoomed-in 2D view shows textured hole surfaces", async ({ page }) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		await collapseToLayout(page, "2d-only");
		await placeTestHole(page);
		// Zoom in via mousewheel on the 2D pane
		const pane = page.locator("[data-testid='pane-2d']");
		for (let i = 0; i < 15; i++) {
			await pane.dispatchEvent("wheel", { deltaY: -100 });
			await page.waitForTimeout(50);
		}
		await page.waitForTimeout(1000);
		await expect(page).toHaveScreenshot("hole-felt-detail-zoom.png");
	});

	test("overview zoom shows solid color fills instead of texture", async ({
		page,
	}) => {
		await page.goto("/");
		await waitForCanvasRender(page);
		await collapseToLayout(page, "2d-only");
		await placeTestHole(page);
		// Zoom out via mousewheel on the 2D pane
		const pane = page.locator("[data-testid='pane-2d']");
		for (let i = 0; i < 10; i++) {
			await pane.dispatchEvent("wheel", { deltaY: 200 });
			await page.waitForTimeout(50);
		}
		await page.waitForTimeout(1000);
		await expect(page).toHaveScreenshot("hole-felt-overview-zoom.png");
	});
});
