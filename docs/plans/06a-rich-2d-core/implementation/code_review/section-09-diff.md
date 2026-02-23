diff --git a/src/components/layout/DualViewport.tsx b/src/components/layout/DualViewport.tsx
index 1517d1a..3b3da3a 100644
--- a/src/components/layout/DualViewport.tsx
+++ b/src/components/layout/DualViewport.tsx
@@ -41,6 +41,7 @@ import { ViewportStatusTracker } from "../three/ViewportStatusTracker";
 import { KeyboardHelp } from "../ui/KeyboardHelp";
 import { MiniMap } from "../ui/MiniMap";
 import { SunControls } from "../ui/SunControls";
+import { TitleBlock2D } from "../ui/TitleBlock2D";
 import { SplitDivider } from "./SplitDivider";
 
 type DualViewportProps = {
@@ -360,6 +361,7 @@ export function DualViewport({ sunData }: DualViewportProps) {
 						</ViewportContext.Provider>
 					</View>
 					<MiniMap />
+					<TitleBlock2D />
 				</div>
 			)}
 
diff --git a/src/components/ui/TitleBlock2D.tsx b/src/components/ui/TitleBlock2D.tsx
new file mode 100644
index 0000000..b655b5e
--- /dev/null
+++ b/src/components/ui/TitleBlock2D.tsx
@@ -0,0 +1,25 @@
+import { useMouseStatusStore } from "../../stores/mouseStatusStore";
+import { computeScale } from "../../utils/zoomScale";
+
+/**
+ * Small architectural title block overlay for the 2D pane.
+ * Positioned in the bottom-right corner.
+ * Shows project name, drawing scale, and current date.
+ * pointer-events: none so it doesn't block canvas interaction.
+ */
+export function TitleBlock2D() {
+	const currentZoom = useMouseStatusStore((s) => s.currentZoom);
+	const scale = computeScale(currentZoom);
+	const date = new Date().toISOString().slice(0, 10);
+
+	return (
+		<div
+			data-testid="title-block-2d"
+			className="absolute bottom-2 right-2 rounded border border-subtle bg-surface/80 px-2 py-1.5 font-mono text-[10px] leading-tight text-text-secondary pointer-events-none"
+		>
+			<div className="font-bold text-primary">Golf Forge</div>
+			<div>{scale}</div>
+			<div>{date}</div>
+		</div>
+	);
+}
diff --git a/tests/e2e/titleBlock.spec.ts b/tests/e2e/titleBlock.spec.ts
new file mode 100644
index 0000000..3775a25
--- /dev/null
+++ b/tests/e2e/titleBlock.spec.ts
@@ -0,0 +1,34 @@
+import { expect, test } from "@playwright/test";
+
+test.describe("Title Block 2D", () => {
+	test("title block is visible in bottom-right of 2D pane", async ({
+		page,
+	}) => {
+		await page.goto("/");
+		await page.waitForSelector('[data-testid="pane-2d"]');
+		const titleBlock = page.getByTestId("title-block-2d");
+		await expect(titleBlock).toBeVisible();
+		// Verify position is in bottom-right of 2D pane
+		const pane = await page.getByTestId("pane-2d").boundingBox();
+		const block = await titleBlock.boundingBox();
+		expect(block).toBeTruthy();
+		expect(pane).toBeTruthy();
+		if (pane && block) {
+			// Block right edge should be near pane right edge
+			expect(block.x + block.width).toBeGreaterThan(
+				pane.x + pane.width * 0.7,
+			);
+			// Block bottom edge should be near pane bottom edge
+			expect(block.y + block.height).toBeGreaterThan(
+				pane.y + pane.height * 0.7,
+			);
+		}
+	});
+
+	test('title block shows "Golf Forge" text', async ({ page }) => {
+		await page.goto("/");
+		await page.waitForSelector('[data-testid="pane-2d"]');
+		const titleBlock = page.getByTestId("title-block-2d");
+		await expect(titleBlock).toContainText("Golf Forge");
+	});
+});
diff --git a/vite.config.ts b/vite.config.ts
index 571c812..446b61f 100644
--- a/vite.config.ts
+++ b/vite.config.ts
@@ -78,6 +78,6 @@ export default defineConfig({
 		},
 	},
 	test: {
-		exclude: [...defaultExclude, "tests/visual/**"],
+		exclude: [...defaultExclude, "tests/visual/**", "tests/e2e/**"],
 	},
 });
