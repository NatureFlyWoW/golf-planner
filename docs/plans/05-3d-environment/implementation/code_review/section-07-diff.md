diff --git a/src/components/three/ThreeDOnlyContent.tsx b/src/components/three/ThreeDOnlyContent.tsx
index c4c9fc7..0716d30 100644
--- a/src/components/three/ThreeDOnlyContent.tsx
+++ b/src/components/three/ThreeDOnlyContent.tsx
@@ -8,14 +8,19 @@ import {
 import { useThree } from "@react-three/fiber";
 import { useEffect } from "react";
 import { UV_LAMP_POSITIONS } from "../../constants/uvLamps";
+import { useSunPosition } from "../../hooks/useSunPosition";
 import { useStore } from "../../store";
-import { shouldEnableFog } from "../../utils/environmentGating";
+import {
+	shouldEnableFog,
+	shouldEnableNormalFog,
+} from "../../utils/environmentGating";
 import { shouldShowGodRays } from "../../utils/godraysConfig";
 import { shouldShowSparkles } from "../../utils/postprocessingConfig";
 import { GroundPlane } from "./environment/GroundPlane";
 import { HallFoundation } from "./environment/HallFoundation";
 import { HallRoof } from "./environment/HallRoof";
 import { HallWallsExterior } from "./environment/HallWallsExterior";
+import { SkyEnvironment } from "./environment/SkyEnvironment";
 import { GodRaysSource } from "./GodRaysSource";
 import { ScreenshotCapture } from "./ScreenshotCapture";
 import { UVEffects } from "./UVEffects";
@@ -35,9 +40,19 @@ export function ThreeDOnlyContent() {
 	const uvMode = useStore((s) => s.ui.uvMode);
 	const gpuTier = useStore((s) => s.ui.gpuTier);
 	const viewportLayout = useStore((s) => s.ui.viewportLayout);
+	const envLayerVisible = useStore(
+		(s) => s.ui.layers.environment?.visible ?? true,
+	);
+	const sunDate = useStore((s) => s.ui.sunDate);
+	const sunData = useSunPosition(sunDate);
 
 	// Fog is scene-level (shared between Views) — only enable in 3d-only mode
-	const fogEnabled = shouldEnableFog(uvMode, viewportLayout);
+	const uvFogEnabled = shouldEnableFog(uvMode, viewportLayout);
+	const normalFogEnabled = shouldEnableNormalFog(
+		viewportLayout,
+		uvMode,
+		envLayerVisible,
+	);
 
 	return (
 		<>
@@ -45,8 +60,12 @@ export function ThreeDOnlyContent() {
 			<HallRoof />
 			<HallFoundation />
 			<HallWallsExterior />
-			{fogEnabled && <fogExp2 attach="fog" args={["#07071A", 0.04]} />}
-			<FogController enabled={fogEnabled} />
+			<SkyEnvironment sunData={sunData} />
+			{normalFogEnabled && (
+				<fog attach="fog" args={["#b0c4d8", 25, 55]} />
+			)}
+			{uvFogEnabled && <fogExp2 attach="fog" args={["#07071A", 0.04]} />}
+			<FogController enabled={uvFogEnabled || normalFogEnabled} />
 
 			<Environment
 				preset="night"
diff --git a/src/components/three/environment/SkyEnvironment.tsx b/src/components/three/environment/SkyEnvironment.tsx
new file mode 100644
index 0000000..c3e34c6
--- /dev/null
+++ b/src/components/three/environment/SkyEnvironment.tsx
@@ -0,0 +1,46 @@
+import { Sky } from "@react-three/drei";
+import { useMemo } from "react";
+import type { SunData } from "../../../hooks/useSunPosition";
+import { useStore } from "../../../store";
+import {
+	shouldShowSky,
+	sunAltAzToVector3,
+} from "../../../utils/environmentGating";
+
+type SkyEnvironmentProps = {
+	sunData: SunData;
+};
+
+const NORMAL_BG = "#b0c4d8";
+const UV_BG = "#07071A";
+
+export function SkyEnvironment({ sunData }: SkyEnvironmentProps) {
+	const uvMode = useStore((s) => s.ui.uvMode);
+	const gpuTier = useStore((s) => s.ui.gpuTier);
+	const envLayerVisible = useStore(
+		(s) => s.ui.layers.environment?.visible ?? true,
+	);
+
+	const bgColor = uvMode ? UV_BG : NORMAL_BG;
+
+	const sunPosition = useMemo(
+		() => sunAltAzToVector3(sunData.altitude, sunData.azimuth),
+		[sunData.altitude, sunData.azimuth],
+	);
+
+	const showSky = shouldShowSky(uvMode, gpuTier) && envLayerVisible;
+
+	return (
+		<>
+			<color attach="background" args={[bgColor]} />
+			{showSky && (
+				<Sky
+					sunPosition={sunPosition}
+					turbidity={3}
+					rayleigh={0.5}
+					distance={450000}
+				/>
+			)}
+		</>
+	);
+}
diff --git a/src/components/three/environment/index.ts b/src/components/three/environment/index.ts
index 2958924..fe94bad 100644
--- a/src/components/three/environment/index.ts
+++ b/src/components/three/environment/index.ts
@@ -2,5 +2,6 @@ export { GroundPlane } from "./GroundPlane";
 export { HallFoundation } from "./HallFoundation";
 export { HallRoof } from "./HallRoof";
 export { HallWallsExterior } from "./HallWallsExterior";
+export { SkyEnvironment } from "./SkyEnvironment";
 export { WalkthroughController } from "./WalkthroughController";
 export { WalkthroughOverlay } from "./WalkthroughOverlay";
diff --git a/src/utils/environmentGating.ts b/src/utils/environmentGating.ts
index 2551088..1568d1c 100644
--- a/src/utils/environmentGating.ts
+++ b/src/utils/environmentGating.ts
@@ -83,3 +83,45 @@ export function getShadowType(
 export function shouldShowGroundTexture(gpuTier: GpuTier): boolean {
 	return gpuTier === "mid" || gpuTier === "high";
 }
+
+/**
+ * Whether to render the drei <Sky> component.
+ * False on low GPU tier (too expensive) and in UV mode (dark void instead).
+ */
+export function shouldShowSky(uvMode: boolean, gpuTier: GpuTier): boolean {
+	if (uvMode) return false;
+	return gpuTier === "mid" || gpuTier === "high";
+}
+
+/**
+ * Normal-mode fog gating.
+ * Only enabled in 3d-only layout, not UV mode, and only when env layer visible.
+ * In dual mode fog bleeds into the 2D pane since both Views share one scene.
+ */
+export function shouldEnableNormalFog(
+	viewportLayout: ViewportLayout,
+	uvMode: boolean,
+	envLayerVisible: boolean,
+): boolean {
+	if (viewportLayout !== "3d-only") return false;
+	if (uvMode) return false;
+	if (!envLayerVisible) return false;
+	return true;
+}
+
+/**
+ * Convert sun altitude (radians above horizon) and azimuth (radians, suncalc convention)
+ * to a Three.js-compatible sunPosition Vector3 tuple.
+ * suncalc azimuth: 0=south, PI/2=west. Scene: X+=east, Z+=south.
+ */
+export function sunAltAzToVector3(
+	altitude: number,
+	azimuth: number,
+): [number, number, number] {
+	const cosAlt = Math.cos(altitude);
+	return [
+		cosAlt * Math.sin(azimuth), // x: east-west
+		Math.sin(altitude), // y: elevation
+		cosAlt * Math.cos(azimuth), // z: south-north
+	];
+}
diff --git a/tests/utils/skyEnvironment.test.ts b/tests/utils/skyEnvironment.test.ts
new file mode 100644
index 0000000..ce1ca36
--- /dev/null
+++ b/tests/utils/skyEnvironment.test.ts
@@ -0,0 +1,79 @@
+import { describe, expect, it } from "vitest";
+import {
+	shouldEnableNormalFog,
+	shouldShowSky,
+	sunAltAzToVector3,
+} from "../../src/utils/environmentGating";
+
+describe("shouldShowSky", () => {
+	it("returns true for mid GPU in normal mode", () => {
+		expect(shouldShowSky(false, "mid")).toBe(true);
+	});
+
+	it("returns true for high GPU in normal mode", () => {
+		expect(shouldShowSky(false, "high")).toBe(true);
+	});
+
+	it("returns false for low GPU (too expensive)", () => {
+		expect(shouldShowSky(false, "low")).toBe(false);
+	});
+
+	it("returns false when uvMode=true regardless of GPU tier", () => {
+		expect(shouldShowSky(true, "high")).toBe(false);
+		expect(shouldShowSky(true, "mid")).toBe(false);
+		expect(shouldShowSky(true, "low")).toBe(false);
+	});
+});
+
+describe("shouldEnableNormalFog", () => {
+	it("returns true for 3d-only layout, normal mode, env layer visible", () => {
+		expect(shouldEnableNormalFog("3d-only", false, true)).toBe(true);
+	});
+
+	it("returns false for dual layout (fog bleeds into 2D pane)", () => {
+		expect(shouldEnableNormalFog("dual", false, true)).toBe(false);
+	});
+
+	it("returns false for 2d-only layout", () => {
+		expect(shouldEnableNormalFog("2d-only", false, true)).toBe(false);
+	});
+
+	it("returns false when uvMode=true (UV uses fogExp2 instead)", () => {
+		expect(shouldEnableNormalFog("3d-only", true, true)).toBe(false);
+	});
+
+	it("returns false when env layer is hidden", () => {
+		expect(shouldEnableNormalFog("3d-only", false, false)).toBe(false);
+	});
+});
+
+describe("sunAltAzToVector3", () => {
+	it("altitude=90° (zenith) produces y≈1, x≈0, z≈0", () => {
+		const [x, y, z] = sunAltAzToVector3(Math.PI / 2, 0);
+		expect(y).toBeCloseTo(1, 5);
+		expect(x).toBeCloseTo(0, 5);
+		expect(z).toBeCloseTo(0, 5);
+	});
+
+	it("altitude=0° (horizon) produces y≈0", () => {
+		const [, y] = sunAltAzToVector3(0, 0);
+		expect(y).toBeCloseTo(0, 5);
+	});
+
+	it("altitude=45°, azimuth=0° (south) produces correct south+up vector", () => {
+		const [x, y, z] = sunAltAzToVector3(Math.PI / 4, 0);
+		// At 45° elevation, sin(45°) = cos(45°) ≈ 0.7071
+		expect(y).toBeCloseTo(Math.SQRT1_2, 5);
+		// azimuth=0 (south), so x≈0, z≈cos(alt)*cos(0)≈cos(45°)
+		expect(x).toBeCloseTo(0, 5);
+		expect(z).toBeCloseTo(Math.SQRT1_2, 5);
+	});
+
+	it("returns tuple of 3 numbers", () => {
+		const result = sunAltAzToVector3(0.5, 1.0);
+		expect(result).toHaveLength(3);
+		expect(typeof result[0]).toBe("number");
+		expect(typeof result[1]).toBe("number");
+		expect(typeof result[2]).toBe("number");
+	});
+});
