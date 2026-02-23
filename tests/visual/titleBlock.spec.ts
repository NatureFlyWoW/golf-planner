import { expect, test } from "@playwright/test";

test.describe("Title Block 2D", () => {
	test("title block is visible in bottom-left of 2D pane", async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector('[data-testid="pane-2d"]');
		const titleBlock = page.getByTestId("title-block-2d");
		await expect(titleBlock).toBeVisible();
		// Verify position is in bottom-left of 2D pane
		const pane = await page.getByTestId("pane-2d").boundingBox();
		const block = await titleBlock.boundingBox();
		expect(block).toBeTruthy();
		expect(pane).toBeTruthy();
		if (pane && block) {
			// Block left edge should be near pane left edge
			expect(block.x).toBeLessThan(pane.x + pane.width * 0.3);
			// Block bottom edge should be near pane bottom edge
			expect(block.y + block.height).toBeGreaterThan(
				pane.y + pane.height * 0.7,
			);
		}
	});

	test('title block shows "Golf Forge" text', async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector('[data-testid="pane-2d"]');
		const titleBlock = page.getByTestId("title-block-2d");
		await expect(titleBlock).toContainText("Golf Forge");
	});
});
