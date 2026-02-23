diff --git a/src/components/three/CameraPresets.tsx b/src/components/three/CameraPresets.tsx
index ebff13f..d1b853e 100644
--- a/src/components/three/CameraPresets.tsx
+++ b/src/components/three/CameraPresets.tsx
@@ -15,6 +15,7 @@ const PRESET_BUTTONS = [
 	{ key: "left", label: "Left", shortcut: "4" },
 	{ key: "right", label: "Right", shortcut: "5" },
 	{ key: "isometric", label: "Iso", shortcut: "6" },
+	{ key: "overview", label: "Overview", shortcut: "7" },
 ] as const;
 
 export function CameraPresets({ cameraControlsRef }: CameraPresetsProps) {
diff --git a/src/components/three/GroundClamp.tsx b/src/components/three/GroundClamp.tsx
new file mode 100644
index 0000000..77b2f5c
--- /dev/null
+++ b/src/components/three/GroundClamp.tsx
@@ -0,0 +1,21 @@
+import { useFrame, useThree } from "@react-three/fiber";
+import { useStore } from "../../store";
+import { clampCameraY } from "../../utils/groundClamp";
+
+/**
+ * GroundClamp — prevents orbit camera from going below Y = 0.5m.
+ * No-ops during walkthrough mode (WalkthroughController locks Y separately).
+ */
+export function GroundClamp(): null {
+	const camera = useThree((s) => s.camera);
+
+	useFrame(() => {
+		const walkthroughMode = useStore.getState().ui.walkthroughMode;
+		const clamped = clampCameraY(camera.position.y, walkthroughMode);
+		if (clamped !== camera.position.y) {
+			camera.position.y = clamped;
+		}
+	});
+
+	return null;
+}
diff --git a/src/components/three/ThreeDOnlyContent.tsx b/src/components/three/ThreeDOnlyContent.tsx
index 0716d30..b8df81f 100644
--- a/src/components/three/ThreeDOnlyContent.tsx
+++ b/src/components/three/ThreeDOnlyContent.tsx
@@ -22,6 +22,7 @@ import { HallRoof } from "./environment/HallRoof";
 import { HallWallsExterior } from "./environment/HallWallsExterior";
 import { SkyEnvironment } from "./environment/SkyEnvironment";
 import { GodRaysSource } from "./GodRaysSource";
+import { GroundClamp } from "./GroundClamp";
 import { ScreenshotCapture } from "./ScreenshotCapture";
 import { UVEffects } from "./UVEffects";
 import { UVLamps } from "./UVLamps";
@@ -98,6 +99,7 @@ export function ThreeDOnlyContent() {
 				/>
 			)}
 			<UVEffects />
+			<GroundClamp />
 			<ScreenshotCapture />
 
 			<PerformanceMonitor />
diff --git a/src/hooks/useKeyboardControls.ts b/src/hooks/useKeyboardControls.ts
index bf6fed9..6eb1818 100644
--- a/src/hooks/useKeyboardControls.ts
+++ b/src/hooks/useKeyboardControls.ts
@@ -80,6 +80,7 @@ const PRESET_KEYS: Record<string, number> = {
 	"4": 3,
 	"5": 4,
 	"6": 5,
+	"7": 6,
 };
 const PRESET_NAMES = [
 	"top",
@@ -88,6 +89,7 @@ const PRESET_NAMES = [
 	"left",
 	"right",
 	"isometric",
+	"overview",
 ] as const;
 
 /**
diff --git a/src/types/viewport.ts b/src/types/viewport.ts
index 01cda66..39df721 100644
--- a/src/types/viewport.ts
+++ b/src/types/viewport.ts
@@ -6,7 +6,8 @@ export type CameraPreset =
 	| "back"
 	| "left"
 	| "right"
-	| "isometric";
+	| "isometric"
+	| "overview";
 
 export type LayerId =
 	| "holes"
diff --git a/src/utils/cameraPresets.ts b/src/utils/cameraPresets.ts
index 452d047..8ceea84 100644
--- a/src/utils/cameraPresets.ts
+++ b/src/utils/cameraPresets.ts
@@ -47,5 +47,9 @@ export function getCameraPresets(
 			position: [cx + dist * 0.7, dist * 0.8, cz + dist * 0.7],
 			target: [...target],
 		},
+		overview: {
+			position: [cx + dist * 1.4, dist * 1.0, cz + dist * 1.4],
+			target: [...target],
+		},
 	};
 }
diff --git a/src/utils/groundClamp.ts b/src/utils/groundClamp.ts
new file mode 100644
index 0000000..cf61207
--- /dev/null
+++ b/src/utils/groundClamp.ts
@@ -0,0 +1,7 @@
+const MIN_CAMERA_Y = 0.5;
+
+/** Clamp camera Y to prevent going underground. No-ops in walkthrough mode. */
+export function clampCameraY(y: number, walkthroughMode: boolean): number {
+	if (walkthroughMode) return y;
+	return Math.max(y, MIN_CAMERA_Y);
+}
diff --git a/tests/utils/cameraPresets.test.ts b/tests/utils/cameraPresets.test.ts
index f5cc1e6..ab59b9e 100644
--- a/tests/utils/cameraPresets.test.ts
+++ b/tests/utils/cameraPresets.test.ts
@@ -6,14 +6,15 @@ describe("getCameraPresets", () => {
 	const hallLength = 20;
 	const presets = getCameraPresets(hallWidth, hallLength);
 
-	it("returns all 6 presets (top, front, back, left, right, isometric)", () => {
-		expect(Object.keys(presets)).toHaveLength(6);
+	it("returns all 7 presets (top, front, back, left, right, isometric, overview)", () => {
+		expect(Object.keys(presets)).toHaveLength(7);
 		expect(presets).toHaveProperty("top");
 		expect(presets).toHaveProperty("front");
 		expect(presets).toHaveProperty("back");
 		expect(presets).toHaveProperty("left");
 		expect(presets).toHaveProperty("right");
 		expect(presets).toHaveProperty("isometric");
+		expect(presets).toHaveProperty("overview");
 	});
 
 	it("each preset has a position array of length 3", () => {
@@ -71,6 +72,24 @@ describe("getCameraPresets", () => {
 		}
 	});
 
+	it('"overview" preset position is outside hall perimeter', () => {
+		const pos = presets.overview.position;
+		const outsideX = pos[0] < 0 || pos[0] > hallWidth;
+		const outsideZ = pos[2] < 0 || pos[2] > hallLength;
+		expect(outsideX || outsideZ).toBe(true);
+	});
+
+	it('"overview" preset target is hall center', () => {
+		const cx = hallWidth / 2;
+		const cz = hallLength / 2;
+		expect(presets.overview.target[0]).toBeCloseTo(cx);
+		expect(presets.overview.target[2]).toBeCloseTo(cz);
+	});
+
+	it('"overview" preset Y position is elevated (above hall roof)', () => {
+		expect(presets.overview.position[1]).toBeGreaterThan(10);
+	});
+
 	it("different hall dimensions produce different positions", () => {
 		const smallPresets = getCameraPresets(5, 10);
 		const largePresets = getCameraPresets(20, 40);
diff --git a/tests/utils/groundClamp.test.ts b/tests/utils/groundClamp.test.ts
new file mode 100644
index 0000000..aed1426
--- /dev/null
+++ b/tests/utils/groundClamp.test.ts
@@ -0,0 +1,20 @@
+import { describe, expect, it } from "vitest";
+import { clampCameraY } from "../../src/utils/groundClamp";
+
+describe("clampCameraY", () => {
+	it("clamps Y below 0.5 to 0.5 when not in walkthrough", () => {
+		expect(clampCameraY(-1.0, false)).toBe(0.5);
+		expect(clampCameraY(0.0, false)).toBe(0.5);
+		expect(clampCameraY(0.4, false)).toBe(0.5);
+	});
+
+	it("does not clamp Y above 0.5 when not in walkthrough", () => {
+		expect(clampCameraY(0.6, false)).toBe(0.6);
+		expect(clampCameraY(100, false)).toBe(100);
+	});
+
+	it("does NOT clamp during walkthrough mode", () => {
+		expect(clampCameraY(-1.0, true)).toBe(-1.0);
+		expect(clampCameraY(0.3, true)).toBe(0.3);
+	});
+});
