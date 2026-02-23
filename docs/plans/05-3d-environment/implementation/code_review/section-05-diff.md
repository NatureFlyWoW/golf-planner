diff --git a/public/textures/asphalt/color.jpg b/public/textures/asphalt/color.jpg
new file mode 100644
index 0000000..d975ea1
Binary files /dev/null and b/public/textures/asphalt/color.jpg differ
diff --git a/public/textures/asphalt/normal.jpg b/public/textures/asphalt/normal.jpg
new file mode 100644
index 0000000..3c4422c
Binary files /dev/null and b/public/textures/asphalt/normal.jpg differ
diff --git a/public/textures/asphalt/roughness.jpg b/public/textures/asphalt/roughness.jpg
new file mode 100644
index 0000000..32b26ce
Binary files /dev/null and b/public/textures/asphalt/roughness.jpg differ
diff --git a/src/components/three/ThreeDOnlyContent.tsx b/src/components/three/ThreeDOnlyContent.tsx
index 5241d9a..2e5b3a3 100644
--- a/src/components/three/ThreeDOnlyContent.tsx
+++ b/src/components/three/ThreeDOnlyContent.tsx
@@ -12,6 +12,7 @@ import { useStore } from "../../store";
 import { shouldEnableFog } from "../../utils/environmentGating";
 import { shouldShowGodRays } from "../../utils/godraysConfig";
 import { shouldShowSparkles } from "../../utils/postprocessingConfig";
+import { GroundPlane } from "./environment/GroundPlane";
 import { GodRaysSource } from "./GodRaysSource";
 import { ScreenshotCapture } from "./ScreenshotCapture";
 import { UVEffects } from "./UVEffects";
@@ -37,6 +38,7 @@ export function ThreeDOnlyContent() {
 
 	return (
 		<>
+			<GroundPlane />
 			{fogEnabled && <fogExp2 attach="fog" args={["#07071A", 0.04]} />}
 			<FogController enabled={fogEnabled} />
 
diff --git a/src/components/three/environment/GroundPlane.tsx b/src/components/three/environment/GroundPlane.tsx
new file mode 100644
index 0000000..916426a
--- /dev/null
+++ b/src/components/three/environment/GroundPlane.tsx
@@ -0,0 +1,161 @@
+import { useTexture } from "@react-three/drei";
+import { Suspense, useMemo } from "react";
+import * as THREE from "three";
+import { HALL } from "../../../constants/hall";
+import { useViewportId } from "../../../hooks/useViewportId";
+import { useStore } from "../../../store";
+import { shouldShowGroundTexture } from "../../../utils/environmentGating";
+
+const GROUND_EXTENSION = 30;
+const TILE_SIZE = 2;
+const FLAT_COLOR = "#4a4a4a";
+
+/** Returns total ground plane dimensions given hall size + 30m extension. */
+export function getGroundPlaneDimensions(
+	hallWidth: number,
+	hallLength: number,
+): { width: number; length: number } {
+	return {
+		width: hallWidth + GROUND_EXTENSION,
+		length: hallLength + GROUND_EXTENSION,
+	};
+}
+
+/** Returns world-space center position for the ground plane (Y=-0.01). */
+export function getGroundPlanePosition(
+	hallWidth: number = HALL.width,
+	hallLength: number = HALL.length,
+): { x: number; y: number; z: number } {
+	return {
+		x: hallWidth / 2,
+		y: -0.01,
+		z: hallLength / 2,
+	};
+}
+
+/** Returns UV repeat counts for a given tile size (default 2m). */
+export function getGroundTextureRepeat(
+	totalWidth: number,
+	totalLength: number,
+	tileSize: number = TILE_SIZE,
+): { repeatX: number; repeatZ: number } {
+	return {
+		repeatX: totalWidth / tileSize,
+		repeatZ: totalLength / tileSize,
+	};
+}
+
+function FlatGround({
+	width,
+	length,
+	position,
+}: {
+	width: number;
+	length: number;
+	position: [number, number, number];
+}) {
+	return (
+		<mesh
+			position={position}
+			rotation={[-Math.PI / 2, 0, 0]}
+			receiveShadow
+		>
+			<planeGeometry args={[width, length]} />
+			<meshBasicMaterial color={FLAT_COLOR} />
+		</mesh>
+	);
+}
+
+function TexturedGround({
+	width,
+	length,
+	position,
+	gpuTier,
+	repeatX,
+	repeatZ,
+}: {
+	width: number;
+	length: number;
+	position: [number, number, number];
+	gpuTier: "mid" | "high";
+	repeatX: number;
+	repeatZ: number;
+}) {
+	const texturePaths =
+		gpuTier === "high"
+			? {
+					map: "/textures/asphalt/color.jpg",
+					normalMap: "/textures/asphalt/normal.jpg",
+					roughnessMap: "/textures/asphalt/roughness.jpg",
+				}
+			: {
+					map: "/textures/asphalt/color.jpg",
+				};
+
+	const textures = useTexture(texturePaths);
+
+	useMemo(() => {
+		for (const tex of Object.values(textures)) {
+			if (tex instanceof THREE.Texture) {
+				tex.wrapS = THREE.RepeatWrapping;
+				tex.wrapT = THREE.RepeatWrapping;
+				tex.repeat.set(repeatX, repeatZ);
+			}
+		}
+	}, [textures, repeatX, repeatZ]);
+
+	return (
+		<mesh
+			position={position}
+			rotation={[-Math.PI / 2, 0, 0]}
+			receiveShadow
+		>
+			<planeGeometry args={[width, length]} />
+			<meshStandardMaterial
+				{...textures}
+				roughness={0.9}
+				metalness={0}
+			/>
+		</mesh>
+	);
+}
+
+export function GroundPlane(): JSX.Element | null {
+	const viewportId = useViewportId();
+	const envLayerVisible = useStore((s) => s.ui.layers.environment.visible);
+	const gpuTier = useStore((s) => s.ui.gpuTier);
+
+	// 3D only — skip in 2D pane
+	if (viewportId === "2d") return null;
+
+	// Layer visibility gating
+	if (!envLayerVisible) return null;
+
+	const { width, length } = getGroundPlaneDimensions(HALL.width, HALL.length);
+	const pos = getGroundPlanePosition(HALL.width, HALL.length);
+	const position: [number, number, number] = [pos.x, pos.y, pos.z];
+	const showTexture = shouldShowGroundTexture(gpuTier);
+
+	if (!showTexture) {
+		return <FlatGround width={width} length={length} position={position} />;
+	}
+
+	const { repeatX, repeatZ } = getGroundTextureRepeat(width, length);
+
+	return (
+		<Suspense
+			fallback={
+				<FlatGround width={width} length={length} position={position} />
+			}
+		>
+			<TexturedGround
+				width={width}
+				length={length}
+				position={position}
+				gpuTier={gpuTier as "mid" | "high"}
+				repeatX={repeatX}
+				repeatZ={repeatZ}
+			/>
+		</Suspense>
+	);
+}
diff --git a/src/components/three/environment/index.ts b/src/components/three/environment/index.ts
index a192bff..1ad19c2 100644
--- a/src/components/three/environment/index.ts
+++ b/src/components/three/environment/index.ts
@@ -1,2 +1,3 @@
+export { GroundPlane } from "./GroundPlane";
 export { WalkthroughController } from "./WalkthroughController";
 export { WalkthroughOverlay } from "./WalkthroughOverlay";
diff --git a/src/constants/layers.ts b/src/constants/layers.ts
index 91d7543..3a75752 100644
--- a/src/constants/layers.ts
+++ b/src/constants/layers.ts
@@ -10,4 +10,5 @@ export const LAYER_DEFINITIONS: LayerDefinition[] = [
 	{ id: "grid", label: "Grid", icon: "\u2317" },
 	{ id: "walls", label: "Walls", icon: "\u25A1" },
 	{ id: "sunIndicator", label: "Sun", icon: "\u2600" },
+	{ id: "environment", label: "Environment", icon: "E" },
 ];
diff --git a/src/store/store.ts b/src/store/store.ts
index 1ab7ec7..d4adcc2 100644
--- a/src/store/store.ts
+++ b/src/store/store.ts
@@ -137,6 +137,7 @@ export const DEFAULT_LAYERS: Record<LayerId, LayerState> = {
 	grid: { visible: true, opacity: 1, locked: false },
 	walls: { visible: true, opacity: 1, locked: false },
 	sunIndicator: { visible: true, opacity: 1, locked: false },
+	environment: { visible: true, opacity: 1, locked: false },
 };
 
 const DEFAULT_UI: UIState = {
diff --git a/src/types/viewport.ts b/src/types/viewport.ts
index d5ab471..01cda66 100644
--- a/src/types/viewport.ts
+++ b/src/types/viewport.ts
@@ -8,7 +8,13 @@ export type CameraPreset =
 	| "right"
 	| "isometric";
 
-export type LayerId = "holes" | "flowPath" | "grid" | "walls" | "sunIndicator";
+export type LayerId =
+	| "holes"
+	| "flowPath"
+	| "grid"
+	| "walls"
+	| "sunIndicator"
+	| "environment";
 
 export type LayerState = {
 	visible: boolean;
diff --git a/src/utils/environmentGating.ts b/src/utils/environmentGating.ts
index 1b7eb78..89aa8bc 100644
--- a/src/utils/environmentGating.ts
+++ b/src/utils/environmentGating.ts
@@ -73,3 +73,11 @@ export function getShadowType(
 ): true | "soft" {
 	return shouldEnableSoftShadows(gpuTier) && !mobile ? "soft" : true;
 }
+
+/**
+ * Ground texture: only load on mid+ GPU tiers.
+ * Low tier uses flat gray meshBasicMaterial (no texture maps).
+ */
+export function shouldShowGroundTexture(gpuTier: GpuTier): boolean {
+	return gpuTier === "mid" || gpuTier === "high";
+}
diff --git a/tests/components/layerPanel.test.ts b/tests/components/layerPanel.test.ts
index e85ce91..405ba40 100644
--- a/tests/components/layerPanel.test.ts
+++ b/tests/components/layerPanel.test.ts
@@ -2,8 +2,8 @@ import { describe, expect, it } from "vitest";
 import { LAYER_DEFINITIONS } from "../../src/constants/layers";
 
 describe("LAYER_DEFINITIONS", () => {
-	it("contains exactly 5 entries", () => {
-		expect(LAYER_DEFINITIONS).toHaveLength(5);
+	it("contains exactly 6 entries", () => {
+		expect(LAYER_DEFINITIONS).toHaveLength(6);
 	});
 
 	it("includes all expected layer IDs", () => {
diff --git a/tests/components/three/groundPlane.test.ts b/tests/components/three/groundPlane.test.ts
new file mode 100644
index 0000000..8cbb914
--- /dev/null
+++ b/tests/components/three/groundPlane.test.ts
@@ -0,0 +1,70 @@
+import { describe, expect, it } from "vitest";
+import {
+	getGroundPlaneDimensions,
+	getGroundPlanePosition,
+	getGroundTextureRepeat,
+} from "../../../src/components/three/environment/GroundPlane";
+import { shouldShowGroundTexture } from "../../../src/utils/environmentGating";
+import { HALL } from "../../../src/constants/hall";
+
+describe("getGroundPlaneDimensions", () => {
+	it("extends 30m beyond hall in both dimensions", () => {
+		const { width, length } = getGroundPlaneDimensions(HALL.width, HALL.length);
+		expect(width).toBe(HALL.width + 30);
+		expect(length).toBe(HALL.length + 30);
+	});
+
+	it("uses extension constant of 30m", () => {
+		const { width, length } = getGroundPlaneDimensions(10, 20);
+		expect(width).toBe(40);
+		expect(length).toBe(50);
+	});
+});
+
+describe("getGroundPlanePosition", () => {
+	it("Y position is -0.01 (below floor to avoid z-fighting)", () => {
+		const { y } = getGroundPlanePosition();
+		expect(y).toBe(-0.01);
+	});
+
+	it("is centered on hall center X (width/2)", () => {
+		const { x } = getGroundPlanePosition(HALL.width, HALL.length);
+		expect(x).toBe(HALL.width / 2);
+	});
+
+	it("is centered on hall center Z (length/2)", () => {
+		const { z } = getGroundPlanePosition(HALL.width, HALL.length);
+		expect(z).toBe(HALL.length / 2);
+	});
+});
+
+describe("getGroundTextureRepeat", () => {
+	it("divides total width by tile size (2m)", () => {
+		const { repeatX } = getGroundTextureRepeat(40, 50);
+		expect(repeatX).toBe(20);
+	});
+
+	it("divides total length by tile size (2m)", () => {
+		const { repeatZ } = getGroundTextureRepeat(40, 50);
+		expect(repeatZ).toBe(25);
+	});
+
+	it("uses 2m tile size by default", () => {
+		const { repeatX } = getGroundTextureRepeat(10, 10);
+		expect(repeatX).toBe(5);
+	});
+});
+
+describe("shouldShowGroundTexture (environmentGating)", () => {
+	it('returns false for "low" GPU tier', () => {
+		expect(shouldShowGroundTexture("low")).toBe(false);
+	});
+
+	it('returns true for "mid" GPU tier', () => {
+		expect(shouldShowGroundTexture("mid")).toBe(true);
+	});
+
+	it('returns true for "high" GPU tier', () => {
+		expect(shouldShowGroundTexture("high")).toBe(true);
+	});
+});
diff --git a/tests/constants/layers.test.ts b/tests/constants/layers.test.ts
new file mode 100644
index 0000000..eb2743c
--- /dev/null
+++ b/tests/constants/layers.test.ts
@@ -0,0 +1,43 @@
+import { describe, expect, it } from "vitest";
+import { LAYER_DEFINITIONS } from "../../src/constants/layers";
+import { DEFAULT_LAYERS } from "../../src/store/store";
+
+describe("Environment layer — LAYER_DEFINITIONS", () => {
+	it('includes "environment" layer definition', () => {
+		const ids = LAYER_DEFINITIONS.map((l) => l.id);
+		expect(ids).toContain("environment");
+	});
+
+	it('"environment" layer has label "Environment"', () => {
+		const def = LAYER_DEFINITIONS.find((l) => l.id === "environment");
+		expect(def?.label).toBe("Environment");
+	});
+
+	it('"environment" layer has non-emoji icon string', () => {
+		const def = LAYER_DEFINITIONS.find((l) => l.id === "environment");
+		expect(def?.icon).toBeTruthy();
+		expect(typeof def?.icon).toBe("string");
+	});
+});
+
+describe("Environment layer — DEFAULT_LAYERS", () => {
+	it('has "environment" entry in DEFAULT_LAYERS', () => {
+		expect(DEFAULT_LAYERS).toHaveProperty("environment");
+	});
+
+	it('"environment" defaults to visible=true', () => {
+		expect(DEFAULT_LAYERS.environment.visible).toBe(true);
+	});
+
+	it('"environment" defaults to opacity=1', () => {
+		expect(DEFAULT_LAYERS.environment.opacity).toBe(1);
+	});
+
+	it('"environment" defaults to locked=false', () => {
+		expect(DEFAULT_LAYERS.environment.locked).toBe(false);
+	});
+
+	it("now has 6 total layers (was 5, added environment)", () => {
+		expect(Object.keys(DEFAULT_LAYERS)).toHaveLength(6);
+	});
+});
diff --git a/tests/store/viewportLayers.test.ts b/tests/store/viewportLayers.test.ts
index f6ded21..f6e3d12 100644
--- a/tests/store/viewportLayers.test.ts
+++ b/tests/store/viewportLayers.test.ts
@@ -14,6 +14,7 @@ beforeEach(() => {
 				grid: { visible: true, opacity: 1, locked: false },
 				walls: { visible: true, opacity: 1, locked: false },
 				sunIndicator: { visible: true, opacity: 1, locked: false },
+				environment: { visible: true, opacity: 1, locked: false },
 			},
 		},
 	});
@@ -32,14 +33,15 @@ describe("Default State", () => {
 		expect(useStore.getState().ui.activeViewport).toBeNull();
 	});
 
-	it("all 5 layers present", () => {
+	it("all 6 layers present", () => {
 		const layers = useStore.getState().ui.layers;
-		expect(Object.keys(layers)).toHaveLength(5);
+		expect(Object.keys(layers)).toHaveLength(6);
 		expect(layers).toHaveProperty("holes");
 		expect(layers).toHaveProperty("flowPath");
 		expect(layers).toHaveProperty("grid");
 		expect(layers).toHaveProperty("walls");
 		expect(layers).toHaveProperty("sunIndicator");
+		expect(layers).toHaveProperty("environment");
 	});
 
 	it("all layers default visible=true, opacity=1, locked=false", () => {
diff --git a/tests/utils/environment.test.ts b/tests/utils/environment.test.ts
index 3692a64..107afd9 100644
--- a/tests/utils/environment.test.ts
+++ b/tests/utils/environment.test.ts
@@ -4,6 +4,7 @@ import {
 	shouldEnableFog,
 	shouldEnablePostProcessing,
 	shouldEnableSoftShadows,
+	shouldShowGroundTexture,
 } from "../../src/utils/environmentGating";
 
 describe("shouldEnableFog (with viewportLayout)", () => {
@@ -147,3 +148,17 @@ describe("shouldEnableSoftShadows", () => {
 		expect(shouldEnableSoftShadows("low")).toBe(false);
 	});
 });
+
+describe("shouldShowGroundTexture", () => {
+	it('returns false for "low" GPU tier', () => {
+		expect(shouldShowGroundTexture("low")).toBe(false);
+	});
+
+	it('returns true for "mid" GPU tier', () => {
+		expect(shouldShowGroundTexture("mid")).toBe(true);
+	});
+
+	it('returns true for "high" GPU tier', () => {
+		expect(shouldShowGroundTexture("high")).toBe(true);
+	});
+});
