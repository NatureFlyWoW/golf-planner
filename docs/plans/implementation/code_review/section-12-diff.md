diff --git a/.gitignore b/.gitignore
index a547bf3..b709050 100644
--- a/.gitignore
+++ b/.gitignore
@@ -22,3 +22,7 @@ dist-ssr
 *.njsproj
 *.sln
 *.sw?
+
+# Playwright
+test-results/
+playwright-report/
diff --git a/package-lock.json b/package-lock.json
index 463035b..e557ae1 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -21,6 +21,7 @@
 			},
 			"devDependencies": {
 				"@biomejs/biome": "^2.4.2",
+				"@playwright/test": "^1.58.2",
 				"@tailwindcss/vite": "^4.2.0",
 				"@types/node": "^24.10.1",
 				"@types/react": "^19.2.7",
@@ -2534,6 +2535,22 @@
 				"three": ">= 0.159.0"
 			}
 		},
+		"node_modules/@playwright/test": {
+			"version": "1.58.2",
+			"resolved": "https://registry.npmjs.org/@playwright/test/-/test-1.58.2.tgz",
+			"integrity": "sha512-akea+6bHYBBfA9uQqSYmlJXn61cTa+jbO87xVLCWbTqbWadRVmhxlXATaOjOgcBaWU4ePo0wB41KMFv3o35IXA==",
+			"dev": true,
+			"license": "Apache-2.0",
+			"dependencies": {
+				"playwright": "1.58.2"
+			},
+			"bin": {
+				"playwright": "cli.js"
+			},
+			"engines": {
+				"node": ">=18"
+			}
+		},
 		"node_modules/@pmndrs/detect-gpu": {
 			"version": "6.0.0",
 			"resolved": "https://registry.npmjs.org/@pmndrs/detect-gpu/-/detect-gpu-6.0.0.tgz",
@@ -6417,6 +6434,53 @@
 				"url": "https://github.com/sponsors/jonschlinkert"
 			}
 		},
+		"node_modules/playwright": {
+			"version": "1.58.2",
+			"resolved": "https://registry.npmjs.org/playwright/-/playwright-1.58.2.tgz",
+			"integrity": "sha512-vA30H8Nvkq/cPBnNw4Q8TWz1EJyqgpuinBcHET0YVJVFldr8JDNiU9LaWAE1KqSkRYazuaBhTpB5ZzShOezQ6A==",
+			"dev": true,
+			"license": "Apache-2.0",
+			"dependencies": {
+				"playwright-core": "1.58.2"
+			},
+			"bin": {
+				"playwright": "cli.js"
+			},
+			"engines": {
+				"node": ">=18"
+			},
+			"optionalDependencies": {
+				"fsevents": "2.3.2"
+			}
+		},
+		"node_modules/playwright-core": {
+			"version": "1.58.2",
+			"resolved": "https://registry.npmjs.org/playwright-core/-/playwright-core-1.58.2.tgz",
+			"integrity": "sha512-yZkEtftgwS8CsfYo7nm0KE8jsvm6i/PTgVtB8DL726wNf6H2IMsDuxCpJj59KDaxCtSnrWan2AeDqM7JBaultg==",
+			"dev": true,
+			"license": "Apache-2.0",
+			"bin": {
+				"playwright-core": "cli.js"
+			},
+			"engines": {
+				"node": ">=18"
+			}
+		},
+		"node_modules/playwright/node_modules/fsevents": {
+			"version": "2.3.2",
+			"resolved": "https://registry.npmjs.org/fsevents/-/fsevents-2.3.2.tgz",
+			"integrity": "sha512-xiqMQR4xAeHTuB9uWm+fFRcIOgKBMiOBP+eXiyT7jsgVCq1bkVygt00oASowB7EdtpOHaaPgKt812P9ab+DDKA==",
+			"dev": true,
+			"hasInstallScript": true,
+			"license": "MIT",
+			"optional": true,
+			"os": [
+				"darwin"
+			],
+			"engines": {
+				"node": "^8.16.0 || ^10.6.0 || >=11.0.0"
+			}
+		},
 		"node_modules/possible-typed-array-names": {
 			"version": "1.1.0",
 			"resolved": "https://registry.npmjs.org/possible-typed-array-names/-/possible-typed-array-names-1.1.0.tgz",
diff --git a/package.json b/package.json
index dce3eaa..b07513d 100644
--- a/package.json
+++ b/package.json
@@ -9,7 +9,8 @@
 		"preview": "vite preview",
 		"check": "biome check .",
 		"format": "biome format --write .",
-		"test": "vitest"
+		"test": "vitest",
+		"test:visual": "playwright test"
 	},
 	"dependencies": {
 		"@pmndrs/detect-gpu": "6.0.0",
@@ -25,6 +26,7 @@
 	},
 	"devDependencies": {
 		"@biomejs/biome": "^2.4.2",
+		"@playwright/test": "^1.58.2",
 		"@tailwindcss/vite": "^4.2.0",
 		"@types/node": "^24.10.1",
 		"@types/react": "^19.2.7",
diff --git a/playwright.config.ts b/playwright.config.ts
new file mode 100644
index 0000000..2d4ea90
--- /dev/null
+++ b/playwright.config.ts
@@ -0,0 +1,42 @@
+import { defineConfig, devices } from "@playwright/test";
+
+/**
+ * Playwright config for GOLF FORGE visual regression tests.
+ * Runs Chromium only. Uses the Vite dev server via webServer config.
+ *
+ * Run:   npx playwright test
+ * Update baselines: npx playwright test --update-snapshots
+ */
+export default defineConfig({
+	testDir: "./tests/visual",
+	fullyParallel: false,
+	forbidOnly: !!process.env.CI,
+	retries: process.env.CI ? 2 : 0,
+	workers: 1,
+	reporter: "html",
+	use: {
+		baseURL: "http://localhost:5173",
+		trace: "on-first-retry",
+		screenshot: "only-on-failure",
+	},
+	projects: [
+		{
+			name: "chromium",
+			use: {
+				...devices["Desktop Chrome"],
+				viewport: { width: 1280, height: 720 },
+			},
+		},
+	],
+	webServer: {
+		command: "npm run dev",
+		url: "http://localhost:5173",
+		reuseExistingServer: !process.env.CI,
+		timeout: 30000,
+	},
+	expect: {
+		toHaveScreenshot: {
+			maxDiffPixelRatio: 0.001,
+		},
+	},
+});
diff --git a/src/components/ui/BottomToolbar.tsx b/src/components/ui/BottomToolbar.tsx
index b2b12d0..12a1c13 100644
--- a/src/components/ui/BottomToolbar.tsx
+++ b/src/components/ui/BottomToolbar.tsx
@@ -61,6 +61,7 @@ export function BottomToolbar() {
 		<div
 			className="flex flex-col border-t border-subtle bg-surface-raised md:hidden"
 			style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
+			data-testid="bottom-toolbar"
 		>
 			{/* Info chip row — only when hole selected */}
 			{selectedHole && (
diff --git a/src/components/ui/Sidebar.tsx b/src/components/ui/Sidebar.tsx
index dbdd844..96a1cfd 100644
--- a/src/components/ui/Sidebar.tsx
+++ b/src/components/ui/Sidebar.tsx
@@ -15,7 +15,7 @@ export function Sidebar() {
 	const setSidebarTab = useStore((s) => s.setSidebarTab);
 
 	return (
-		<div className="hidden h-full w-64 flex-col border-r border-subtle bg-surface-raised md:flex">
+		<div className="hidden h-full w-64 flex-col border-r border-subtle bg-surface-raised md:flex" data-testid="sidebar">
 			<div className="flex border-b border-subtle">
 				{tabs.map(({ tab, label }) => (
 					<button
diff --git a/src/components/ui/Toolbar.tsx b/src/components/ui/Toolbar.tsx
index 7c0c050..18331a2 100644
--- a/src/components/ui/Toolbar.tsx
+++ b/src/components/ui/Toolbar.tsx
@@ -69,7 +69,7 @@ export function Toolbar() {
 	}`;
 
 	return (
-		<div className={barClass}>
+		<div className={barClass} data-testid="toolbar">
 			<span className="font-display text-sm font-bold tracking-wider text-accent-text" style={{ textShadow: "0 0 8px #9D00FF, 0 0 16px #9D00FF40" }}>GOLF FORGE</span>
 			<div className="mx-2 h-6 w-px bg-grid-ghost" />
 
@@ -110,6 +110,7 @@ export function Toolbar() {
 				onClick={() => setView(view === "top" ? "3d" : "top")}
 				className={neutralBtnClass}
 				title="Toggle 2D/3D view"
+				data-testid="view-toggle"
 			>
 				{view === "top" ? "3D" : "2D"}
 			</button>
@@ -120,6 +121,7 @@ export function Toolbar() {
 				disabled={transitioning}
 				className={`${btnClass(uvMode)}${uvMode && !transitioning ? " uv-button-pulse" : ""}`}
 				title="Toggle UV preview mode"
+				data-testid="uv-toggle"
 			>
 				UV
 			</button>
diff --git a/tests/visual/README.md b/tests/visual/README.md
new file mode 100644
index 0000000..e2c19e7
--- /dev/null
+++ b/tests/visual/README.md
@@ -0,0 +1,23 @@
+# Visual Regression Tests
+
+Playwright-based screenshot comparison tests for GOLF FORGE.
+
+## Prerequisites
+
+- Node.js via fnm
+- Chromium: `npx playwright install chromium`
+- WSL2 system deps: `npx playwright install-deps chromium` (requires sudo) or manually install: `libnss3 libatk-bridge2.0-0 libdrm2 libxkbcommon0 libgbm1 libpango-1.0-0 libcairo2 libasound2`
+
+## Commands
+
+| Command | Description |
+|---------|-------------|
+| `npm run test:visual` | Run visual regression tests |
+| `npx playwright test --update-snapshots` | Update baseline screenshots |
+| `npx playwright show-report` | View HTML test report |
+
+## Notes
+
+- Baselines are platform-specific. Generate and compare on the same environment (WSL2 Chromium headless).
+- Threshold: 0.1% pixel diff tolerance (configured in `playwright.config.ts`).
+- The dev server starts automatically via `webServer` config.
diff --git a/tests/visual/golf-forge.spec.ts b/tests/visual/golf-forge.spec.ts
new file mode 100644
index 0000000..8c8c0f1
--- /dev/null
+++ b/tests/visual/golf-forge.spec.ts
@@ -0,0 +1,111 @@
+import { expect, test } from "@playwright/test";
+
+/**
+ * Visual regression tests for GOLF FORGE Phase 11A.
+ *
+ * These tests capture screenshots of key app states and compare
+ * against baseline images stored in tests/visual/golf-forge.spec.ts-snapshots/.
+ *
+ * First run generates baselines. Subsequent runs compare against them.
+ * Update baselines with: npx playwright test --update-snapshots
+ *
+ * Threshold: 0.1% pixel diff tolerance (maxDiffPixelRatio: 0.001)
+ */
+
+/** Wait for canvas and initial scene render. */
+async function waitForCanvasRender(page: import("@playwright/test").Page) {
+	await page.waitForSelector("canvas", { timeout: 10000 });
+	await page.waitForTimeout(2000);
+}
+
+test.describe("Setup validation", () => {
+	test("app loads successfully", async ({ page }) => {
+		await page.goto("/");
+		const toolbar = page.locator("[data-testid='toolbar']");
+		await expect(toolbar).toBeVisible({ timeout: 10000 });
+	});
+
+	test("canvas renders within 5 seconds", async ({ page }) => {
+		await page.goto("/");
+		const canvas = page.locator("canvas");
+		await expect(canvas).toBeVisible({ timeout: 5000 });
+	});
+});
+
+test.describe("Planning Mode", () => {
+	test("top-down orthographic view", async ({ page }) => {
+		await page.goto("/");
+		await waitForCanvasRender(page);
+		await expect(page).toHaveScreenshot("planning-top-down.png");
+	});
+
+	test("3D perspective view", async ({ page }) => {
+		await page.goto("/");
+		await waitForCanvasRender(page);
+		// Switch to 3D view
+		await page.locator("[data-testid='view-toggle']").click();
+		await page.waitForTimeout(1000);
+		await expect(page).toHaveScreenshot("planning-3d.png");
+	});
+});
+
+test.describe("UV Mode", () => {
+	test("top-down view", async ({ page }) => {
+		await page.goto("/");
+		await waitForCanvasRender(page);
+		// Toggle UV mode
+		await page.locator("[data-testid='uv-toggle']").click();
+		// Wait for transition animation (2.4s) + buffer
+		await page.waitForTimeout(3000);
+		await expect(page).toHaveScreenshot("uv-top-down.png");
+	});
+
+	test("3D perspective view with effects", async ({ page }) => {
+		await page.goto("/");
+		await waitForCanvasRender(page);
+		// Toggle UV mode
+		await page.locator("[data-testid='uv-toggle']").click();
+		await page.waitForTimeout(3000);
+		// Switch to 3D view
+		await page.locator("[data-testid='view-toggle']").click();
+		await page.waitForTimeout(2000);
+		await expect(page).toHaveScreenshot("uv-3d.png");
+	});
+});
+
+test.describe("Dark Theme UI", () => {
+	test("sidebar — Holes tab", async ({ page }) => {
+		await page.goto("/");
+		await waitForCanvasRender(page);
+		const sidebar = page.locator("[data-testid='sidebar']");
+		await expect(sidebar).toHaveScreenshot("sidebar-holes.png");
+	});
+
+	test("sidebar — Budget tab", async ({ page }) => {
+		await page.goto("/");
+		await waitForCanvasRender(page);
+		// Click Budget tab
+		const budgetTab = page.locator("[data-testid='sidebar'] button", { hasText: "Budget" });
+		await budgetTab.click();
+		await page.waitForTimeout(500);
+		const sidebar = page.locator("[data-testid='sidebar']");
+		await expect(sidebar).toHaveScreenshot("sidebar-budget.png");
+	});
+
+	test("toolbar with GOLF FORGE branding", async ({ page }) => {
+		await page.goto("/");
+		await waitForCanvasRender(page);
+		const toolbar = page.locator("[data-testid='toolbar']");
+		await expect(toolbar).toHaveScreenshot("toolbar.png");
+	});
+});
+
+test.describe("Mobile", () => {
+	test("mobile bottom toolbar", async ({ page }) => {
+		await page.setViewportSize({ width: 375, height: 667 });
+		await page.goto("/");
+		await waitForCanvasRender(page);
+		const bottomToolbar = page.locator("[data-testid='bottom-toolbar']");
+		await expect(bottomToolbar).toHaveScreenshot("mobile-bottom-toolbar.png");
+	});
+});
diff --git a/tests/visual/golf-forge.spec.ts-snapshots/mobile-bottom-toolbar-chromium-linux.png b/tests/visual/golf-forge.spec.ts-snapshots/mobile-bottom-toolbar-chromium-linux.png
new file mode 100644
index 0000000..4cefa6f
Binary files /dev/null and b/tests/visual/golf-forge.spec.ts-snapshots/mobile-bottom-toolbar-chromium-linux.png differ
diff --git a/tests/visual/golf-forge.spec.ts-snapshots/planning-3d-chromium-linux.png b/tests/visual/golf-forge.spec.ts-snapshots/planning-3d-chromium-linux.png
new file mode 100644
index 0000000..324f7bd
Binary files /dev/null and b/tests/visual/golf-forge.spec.ts-snapshots/planning-3d-chromium-linux.png differ
diff --git a/tests/visual/golf-forge.spec.ts-snapshots/planning-top-down-chromium-linux.png b/tests/visual/golf-forge.spec.ts-snapshots/planning-top-down-chromium-linux.png
new file mode 100644
index 0000000..134ffe0
Binary files /dev/null and b/tests/visual/golf-forge.spec.ts-snapshots/planning-top-down-chromium-linux.png differ
diff --git a/tests/visual/golf-forge.spec.ts-snapshots/sidebar-budget-chromium-linux.png b/tests/visual/golf-forge.spec.ts-snapshots/sidebar-budget-chromium-linux.png
new file mode 100644
index 0000000..cca85b6
Binary files /dev/null and b/tests/visual/golf-forge.spec.ts-snapshots/sidebar-budget-chromium-linux.png differ
diff --git a/tests/visual/golf-forge.spec.ts-snapshots/sidebar-holes-chromium-linux.png b/tests/visual/golf-forge.spec.ts-snapshots/sidebar-holes-chromium-linux.png
new file mode 100644
index 0000000..f5d7871
Binary files /dev/null and b/tests/visual/golf-forge.spec.ts-snapshots/sidebar-holes-chromium-linux.png differ
diff --git a/tests/visual/golf-forge.spec.ts-snapshots/toolbar-chromium-linux.png b/tests/visual/golf-forge.spec.ts-snapshots/toolbar-chromium-linux.png
new file mode 100644
index 0000000..2cc152b
Binary files /dev/null and b/tests/visual/golf-forge.spec.ts-snapshots/toolbar-chromium-linux.png differ
diff --git a/tests/visual/golf-forge.spec.ts-snapshots/uv-3d-chromium-linux.png b/tests/visual/golf-forge.spec.ts-snapshots/uv-3d-chromium-linux.png
new file mode 100644
index 0000000..903c6da
Binary files /dev/null and b/tests/visual/golf-forge.spec.ts-snapshots/uv-3d-chromium-linux.png differ
diff --git a/tests/visual/golf-forge.spec.ts-snapshots/uv-top-down-chromium-linux.png b/tests/visual/golf-forge.spec.ts-snapshots/uv-top-down-chromium-linux.png
new file mode 100644
index 0000000..949922e
Binary files /dev/null and b/tests/visual/golf-forge.spec.ts-snapshots/uv-top-down-chromium-linux.png differ
diff --git a/vite.config.ts b/vite.config.ts
index 6800bff..ee956f7 100644
--- a/vite.config.ts
+++ b/vite.config.ts
@@ -76,4 +76,7 @@ export default defineConfig({
 			interval: 100,
 		},
 	},
+	test: {
+		exclude: ["tests/visual/**", "node_modules/**"],
+	},
 });
