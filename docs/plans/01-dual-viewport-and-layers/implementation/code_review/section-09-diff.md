diff --git a/src/components/layout/DualViewport.tsx b/src/components/layout/DualViewport.tsx
index d8db920..891f770 100644
--- a/src/components/layout/DualViewport.tsx
+++ b/src/components/layout/DualViewport.tsx
@@ -202,11 +202,7 @@ export function DualViewport({ sunData }: DualViewportProps) {
 			: gpuTier === "mid"
 				? [1, 1.5]
 				: [1, 1];
-	// View rendering requires frameloop="always" in dual mode
-	const frameloop =
-		viewportLayout === "dual"
-			? "always"
-			: deriveFrameloop(uvMode, gpuTier, transitioning);
+	const frameloop = deriveFrameloop(uvMode, gpuTier, transitioning, viewportLayout);
 	const shadows = getShadowType(gpuTier, isMobile);
 
 	return (
diff --git a/src/components/three/PostProcessing.tsx b/src/components/three/PostProcessing.tsx
index d245657..7c13cd6 100644
--- a/src/components/three/PostProcessing.tsx
+++ b/src/components/three/PostProcessing.tsx
@@ -10,6 +10,7 @@ import {
 import { ToneMappingMode } from "postprocessing";
 import { Vector2 } from "three";
 import { useStore } from "../../store";
+import { shouldEnablePostProcessing } from "../../utils/environmentGating";
 import { GODRAYS_EFFECT_CONFIG } from "../../utils/godraysConfig";
 import { isMobile } from "../../utils/isMobile";
 import {
@@ -21,7 +22,12 @@ const chromaticOffset = new Vector2(0.0015, 0.0015);
 
 export default function PostProcessing() {
 	const gpuTier = useStore((s) => s.ui.gpuTier);
+	const viewportLayout = useStore((s) => s.ui.viewportLayout);
 	const godRaysLampRef = useStore((s) => s.ui.godRaysLampRef);
+
+	// PostProcessing (EffectComposer) cannot be scoped to a single View.
+	// Only render in 3d-only mode (fullscreen 3D pane).
+	if (!shouldEnablePostProcessing(viewportLayout)) return null;
 	const showGodRays =
 		gpuTier === "high" && godRaysLampRef?.current != null;
 
diff --git a/src/components/three/ScreenshotCapture.tsx b/src/components/three/ScreenshotCapture.tsx
index a7da484..6ba224e 100644
--- a/src/components/three/ScreenshotCapture.tsx
+++ b/src/components/three/ScreenshotCapture.tsx
@@ -1,39 +1,79 @@
 import { useThree } from "@react-three/fiber";
 import { useEffect } from "react";
+import { WebGLRenderTarget } from "three";
 import { useStore } from "../../store";
 
+/**
+ * Captures screenshots from the 3D viewport by rendering to an offscreen
+ * WebGLRenderTarget. This works correctly regardless of viewport layout
+ * (dual-pane, single-pane) because it renders independently of View scissor.
+ */
 export function ScreenshotCapture() {
-	const { gl, scene, camera } = useThree();
+	const { gl, scene, camera, size } = useThree();
 	const register = useStore((s) => s.registerScreenshotCapture);
 
 	useEffect(() => {
 		register(() => {
-			const dpr = gl.getPixelRatio();
-			gl.setPixelRatio(Math.min(window.devicePixelRatio * 2, 4));
+			// Create a render target matching the current canvas resolution
+			const dpr = Math.min(window.devicePixelRatio * 2, 4);
+			const width = Math.floor(size.width * dpr);
+			const height = Math.floor(size.height * dpr);
+			const renderTarget = new WebGLRenderTarget(width, height);
+
+			// Save current state
+			const currentRenderTarget = gl.getRenderTarget();
+			const currentPixelRatio = gl.getPixelRatio();
+
+			// Render to offscreen target
+			gl.setRenderTarget(renderTarget);
+			gl.setPixelRatio(1); // Target already has DPR baked into dimensions
 			gl.render(scene, camera);
-			gl.domElement.toBlob(
-				(blob) => {
-					if (blob) {
-						const url = URL.createObjectURL(blob);
-						const a = document.createElement("a");
-						a.href = url;
-						a.download = `golf-plan-${Date.now()}.png`;
-						a.click();
-						URL.revokeObjectURL(url);
-					} else {
-						// iOS fallback
-						const dataUrl = gl.domElement.toDataURL("image/png");
-						const a = document.createElement("a");
-						a.href = dataUrl;
-						a.download = `golf-plan-${Date.now()}.png`;
-						a.click();
-					}
-					gl.setPixelRatio(dpr);
-				},
-				"image/png",
-			);
+
+			// Read pixels and create image
+			const buffer = new Uint8Array(width * height * 4);
+			gl.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer);
+
+			// Restore state
+			gl.setRenderTarget(currentRenderTarget);
+			gl.setPixelRatio(currentPixelRatio);
+
+			// Convert to canvas for download (WebGL pixels are bottom-up)
+			const canvas = document.createElement("canvas");
+			canvas.width = width;
+			canvas.height = height;
+			const ctx = canvas.getContext("2d");
+			if (ctx) {
+				const imageData = ctx.createImageData(width, height);
+				// Flip vertically (WebGL reads bottom-to-top)
+				for (let y = 0; y < height; y++) {
+					const srcRow = (height - y - 1) * width * 4;
+					const dstRow = y * width * 4;
+					imageData.data.set(
+						buffer.subarray(srcRow, srcRow + width * 4),
+						dstRow,
+					);
+				}
+				ctx.putImageData(imageData, 0, 0);
+
+				canvas.toBlob(
+					(blob) => {
+						if (blob) {
+							const url = URL.createObjectURL(blob);
+							const a = document.createElement("a");
+							a.href = url;
+							a.download = `golf-plan-${Date.now()}.png`;
+							a.click();
+							URL.revokeObjectURL(url);
+						}
+					},
+					"image/png",
+				);
+			}
+
+			// Clean up render target
+			renderTarget.dispose();
 		});
-	}, [gl, scene, camera, register]);
+	}, [gl, scene, camera, size, register]);
 
 	return null;
 }
diff --git a/src/components/three/ThreeDOnlyContent.tsx b/src/components/three/ThreeDOnlyContent.tsx
index d986ac1..5241d9a 100644
--- a/src/components/three/ThreeDOnlyContent.tsx
+++ b/src/components/three/ThreeDOnlyContent.tsx
@@ -29,13 +29,11 @@ function FogController({ enabled }: { enabled: boolean }) {
 
 export function ThreeDOnlyContent() {
 	const uvMode = useStore((s) => s.ui.uvMode);
-	const view = useStore((s) => s.ui.view);
 	const gpuTier = useStore((s) => s.ui.gpuTier);
 	const viewportLayout = useStore((s) => s.ui.viewportLayout);
 
 	// Fog is scene-level (shared between Views) — only enable in 3d-only mode
-	const fogEnabled =
-		viewportLayout === "3d-only" && shouldEnableFog(uvMode, view);
+	const fogEnabled = shouldEnableFog(uvMode, viewportLayout);
 
 	return (
 		<>
diff --git a/src/components/three/UVEffects.tsx b/src/components/three/UVEffects.tsx
index 4f43672..794358d 100644
--- a/src/components/three/UVEffects.tsx
+++ b/src/components/three/UVEffects.tsx
@@ -1,11 +1,17 @@
 import { lazy, Suspense } from "react";
 import { useStore } from "../../store";
+import { shouldEnablePostProcessing } from "../../utils/environmentGating";
 
 const PostProcessing = lazy(() => import("./PostProcessing"));
 
 export function UVEffects() {
 	const uvMode = useStore((s) => s.ui.uvMode);
+	const viewportLayout = useStore((s) => s.ui.viewportLayout);
+
+	// No UV effects in non-UV mode or when PostProcessing is disabled
 	if (!uvMode) return null;
+	if (!shouldEnablePostProcessing(viewportLayout)) return null;
+
 	return (
 		<Suspense fallback={null}>
 			<PostProcessing />
diff --git a/src/utils/environmentGating.ts b/src/utils/environmentGating.ts
index 8ac7677..a91e2b4 100644
--- a/src/utils/environmentGating.ts
+++ b/src/utils/environmentGating.ts
@@ -1,26 +1,55 @@
-import type { GpuTier, ViewMode } from "../types/ui";
+import type { GpuTier } from "../types/ui";
+import type { ViewportLayout } from "../types/viewport";
 
 /**
- * Fog should only render in UV mode AND 3D perspective view.
- * Exponential fog in orthographic view creates uniform darkening
- * with no atmospheric value.
+ * Fog is scene-level (shared between Views) — cannot be scoped to one View.
+ * Only enable in "3d-only" mode (fullscreen 3D pane) when UV mode is active.
+ * In "dual" mode, fog would bleed into the 2D pane since both Views share one scene.
  */
-export function shouldEnableFog(uvMode: boolean, view: ViewMode): boolean {
-	return uvMode && view === "3d";
+export function shouldEnableFog(
+	uvMode: boolean,
+	viewportLayout: ViewportLayout,
+): boolean {
+	if (viewportLayout !== "3d-only") return false;
+	return uvMode;
 }
 
 /**
  * Derive the Canvas frameloop mode from current state.
- * "always" when UV effects need continuous rendering or during transitions.
+ * "always" when UV effects need continuous rendering, during transitions,
+ * or in dual-pane mode (View rendering requires continuous frames).
  * Low-tier GPUs always use "demand" in UV mode (static effects only).
  */
 export function deriveFrameloop(
 	uvMode: boolean,
 	gpuTier: GpuTier,
 	transitioning: boolean,
+	viewportLayout: ViewportLayout,
 ): "always" | "demand" {
-	const needsAlways = transitioning || (uvMode && gpuTier !== "low");
-	return needsAlways ? "always" : "demand";
+	// Transitioning always needs continuous rendering
+	if (transitioning) return "always";
+
+	// Dual mode: View rendering requires continuous frames
+	if (viewportLayout === "dual") return "always";
+
+	// 2d-only mode: no 3D animations, use demand
+	if (viewportLayout === "2d-only") return "demand";
+
+	// 3d-only mode: UV effects with capable GPU need "always"
+	if (uvMode && gpuTier !== "low") return "always";
+
+	return "demand";
+}
+
+/**
+ * PostProcessing (EffectComposer) cannot be scoped to a single View —
+ * it takes over the entire Canvas rendering pipeline.
+ * Only enable when the 3D pane is fullscreen (no View splitting).
+ */
+export function shouldEnablePostProcessing(
+	viewportLayout: ViewportLayout,
+): boolean {
+	return viewportLayout === "3d-only";
 }
 
 /**
@@ -34,6 +63,9 @@ export function shouldEnableSoftShadows(gpuTier: GpuTier): boolean {
  * Shadow type: mobile gets basic boolean shadows (cheaper),
  * desktop gets "soft" (PCSS) when GPU tier allows it.
  */
-export function getShadowType(gpuTier: GpuTier, mobile: boolean): true | "soft" {
+export function getShadowType(
+	gpuTier: GpuTier,
+	mobile: boolean,
+): true | "soft" {
 	return shouldEnableSoftShadows(gpuTier) && !mobile ? "soft" : true;
 }
diff --git a/tests/utils/environment.test.ts b/tests/utils/environment.test.ts
index 636a600..4400150 100644
--- a/tests/utils/environment.test.ts
+++ b/tests/utils/environment.test.ts
@@ -2,52 +2,75 @@ import { describe, expect, it } from "vitest";
 import {
 	deriveFrameloop,
 	shouldEnableFog,
+	shouldEnablePostProcessing,
 	shouldEnableSoftShadows,
 } from "../../src/utils/environmentGating";
 
-describe("shouldEnableFog", () => {
-	it("returns true when uvMode=true AND view='3d'", () => {
-		expect(shouldEnableFog(true, "3d")).toBe(true);
+describe("shouldEnableFog (with viewportLayout)", () => {
+	it('returns false when viewportLayout is "2d-only" regardless of uvMode', () => {
+		expect(shouldEnableFog(true, "2d-only")).toBe(false);
+		expect(shouldEnableFog(false, "2d-only")).toBe(false);
 	});
 
-	it("returns false when uvMode=true AND view='top'", () => {
-		expect(shouldEnableFog(true, "top")).toBe(false);
+	it('returns false when viewportLayout is "dual" (fog is scene-level, shared between Views)', () => {
+		expect(shouldEnableFog(true, "dual")).toBe(false);
+		expect(shouldEnableFog(false, "dual")).toBe(false);
 	});
 
-	it("returns false when uvMode=false AND view='3d'", () => {
-		expect(shouldEnableFog(false, "3d")).toBe(false);
+	it('returns true when uvMode=true AND viewportLayout is "3d-only"', () => {
+		expect(shouldEnableFog(true, "3d-only")).toBe(true);
 	});
 
-	it("returns false when uvMode=false AND view='top'", () => {
-		expect(shouldEnableFog(false, "top")).toBe(false);
+	it('returns false when uvMode=false AND viewportLayout is "3d-only"', () => {
+		expect(shouldEnableFog(false, "3d-only")).toBe(false);
 	});
 });
 
-describe("deriveFrameloop", () => {
-	it("returns 'demand' when uvMode=false", () => {
-		expect(deriveFrameloop(false, "low", false)).toBe("demand");
+describe("deriveFrameloop (with viewportLayout)", () => {
+	it('returns "always" when viewportLayout="dual" (View rendering requires continuous frames)', () => {
+		expect(deriveFrameloop(false, "low", false, "dual")).toBe("always");
+		expect(deriveFrameloop(false, "mid", false, "dual")).toBe("always");
 	});
 
-	it("returns 'demand' when uvMode=true + gpuTier='low'", () => {
-		expect(deriveFrameloop(true, "low", false)).toBe("demand");
+	it('returns "demand" when uvMode=false AND viewportLayout="3d-only"', () => {
+		expect(deriveFrameloop(false, "low", false, "3d-only")).toBe("demand");
 	});
 
-	it("returns 'always' when uvMode=true + gpuTier='mid'", () => {
-		expect(deriveFrameloop(true, "mid", false)).toBe("always");
+	it('returns "demand" when uvMode=true + gpuTier="low" AND viewportLayout="3d-only"', () => {
+		expect(deriveFrameloop(true, "low", false, "3d-only")).toBe("demand");
 	});
 
-	it("returns 'always' when uvMode=true + gpuTier='high'", () => {
-		expect(deriveFrameloop(true, "high", false)).toBe("always");
+	it('returns "always" when uvMode=true + gpuTier="mid" AND viewportLayout="3d-only"', () => {
+		expect(deriveFrameloop(true, "mid", false, "3d-only")).toBe("always");
 	});
 
-	it("returns 'always' when transitioning=true regardless of tier", () => {
-		expect(deriveFrameloop(false, "low", true)).toBe("always");
-		expect(deriveFrameloop(false, "mid", true)).toBe("always");
-		expect(deriveFrameloop(false, "high", true)).toBe("always");
+	it('returns "always" when uvMode=true + gpuTier="high" AND viewportLayout="3d-only"', () => {
+		expect(deriveFrameloop(true, "high", false, "3d-only")).toBe("always");
 	});
 
-	it("returns 'always' when transitioning=true AND uvMode=true", () => {
-		expect(deriveFrameloop(true, "mid", true)).toBe("always");
+	it('returns "always" when transitioning=true regardless of viewportLayout', () => {
+		expect(deriveFrameloop(false, "low", true, "3d-only")).toBe("always");
+		expect(deriveFrameloop(false, "mid", true, "dual")).toBe("always");
+		expect(deriveFrameloop(false, "high", true, "2d-only")).toBe("always");
+	});
+
+	it('returns "demand" when viewportLayout="2d-only" and not transitioning', () => {
+		expect(deriveFrameloop(false, "mid", false, "2d-only")).toBe("demand");
+		expect(deriveFrameloop(true, "high", false, "2d-only")).toBe("demand");
+	});
+});
+
+describe("shouldEnablePostProcessing", () => {
+	it('returns false when viewportLayout is "dual"', () => {
+		expect(shouldEnablePostProcessing("dual")).toBe(false);
+	});
+
+	it('returns true when viewportLayout is "3d-only"', () => {
+		expect(shouldEnablePostProcessing("3d-only")).toBe(true);
+	});
+
+	it('returns false when viewportLayout is "2d-only"', () => {
+		expect(shouldEnablePostProcessing("2d-only")).toBe(false);
 	});
 });
 
