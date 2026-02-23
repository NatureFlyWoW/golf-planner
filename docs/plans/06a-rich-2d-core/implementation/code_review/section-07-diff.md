diff --git a/src/components/three/architectural/ArchitecturalFloorPlan.tsx b/src/components/three/architectural/ArchitecturalFloorPlan.tsx
index f4be499..9f46d70 100644
--- a/src/components/three/architectural/ArchitecturalFloorPlan.tsx
+++ b/src/components/three/architectural/ArchitecturalFloorPlan.tsx
@@ -2,6 +2,7 @@ import { useViewportId } from "../../../hooks/useViewportId";
 import { ArchitecturalGrid2D } from "./ArchitecturalGrid2D";
 import { ArchitecturalOpenings2D } from "./ArchitecturalOpenings2D";
 import { ArchitecturalWalls2D } from "./ArchitecturalWalls2D";
+import { HoleFeltOverlays } from "./HoleFeltOverlays";
 
 /**
  * Container for all 2D architectural floor plan elements.
@@ -17,7 +18,7 @@ export function ArchitecturalFloorPlan() {
 			<ArchitecturalGrid2D />
 			<ArchitecturalWalls2D />
 			<ArchitecturalOpenings2D />
-			{/* Section 07: HoleFelt2D overlays */}
+			<HoleFeltOverlays />
 		</group>
 	);
 }
diff --git a/src/components/three/architectural/HoleFelt2D.tsx b/src/components/three/architectural/HoleFelt2D.tsx
new file mode 100644
index 0000000..ea85886
--- /dev/null
+++ b/src/components/three/architectural/HoleFelt2D.tsx
@@ -0,0 +1,112 @@
+import { Line } from "@react-three/drei";
+import { useThree } from "@react-three/fiber";
+import { useMemo } from "react";
+import * as THREE from "three";
+import { useStore } from "../../../store";
+import type { Hole } from "../../../types";
+import { createFeltMaterial } from "./HoleFeltShader";
+
+type HoleFelt2DProps = {
+	hole: Hole;
+	width: number;
+	length: number;
+	color: string;
+};
+
+const noRaycast = () => {};
+
+/** Darken a hex color by a factor (0-1, where 0.3 = 30% darker). */
+function darkenColor(hex: string, factor: number): string {
+	const c = new THREE.Color(hex);
+	c.multiplyScalar(1 - factor);
+	return `#${c.getHexString()}`;
+}
+
+/** Mix two colors: result = a * (1-t) + b * t. */
+function mixColors(a: string, b: string, t: number): string {
+	const ca = new THREE.Color(a);
+	const cb = new THREE.Color(b);
+	ca.lerp(cb, t);
+	return `#${ca.getHexString()}`;
+}
+
+/** Compute felt fill and border colors based on UV mode. */
+function useFeltColors(baseColor: string, uvMode: boolean) {
+	return useMemo(() => {
+		if (uvMode) {
+			const fill = mixColors(baseColor, "#1A1A3E", 0.7);
+			const border = mixColors(baseColor, "#6600FF", 0.6);
+			return { fill, border };
+		}
+		const fill = mixColors(baseColor, "#2E7D32", 0.3);
+		const border = darkenColor(baseColor, 0.3);
+		return { fill, border };
+	}, [baseColor, uvMode]);
+}
+
+/**
+ * Felt-textured overlay for a single placed hole in the 2D viewport.
+ * LOD-based: solid fill at overview/standard zoom, felt shader at detail zoom.
+ */
+export function HoleFelt2D({ hole, width, length, color }: HoleFelt2DProps) {
+	const uvMode = useStore((s) => s.ui.uvMode);
+	const { fill, border } = useFeltColors(color, uvMode);
+
+	// Fallback LOD: read camera zoom directly (section 08 will provide useZoomLOD)
+	const camera = useThree((s) => s.camera);
+	const zoom = (camera as THREE.OrthographicCamera).zoom ?? 20;
+	const lod: "overview" | "standard" | "detail" =
+		zoom < 15 ? "overview" : zoom < 40 ? "standard" : "detail";
+
+	const feltMaterial = useMemo(
+		() => createFeltMaterial(fill),
+		[fill],
+	);
+
+	const solidMaterial = useMemo(
+		() => new THREE.MeshBasicMaterial({ color: fill }),
+		[fill],
+	);
+
+	const rotationRad = (hole.rotation * Math.PI) / 180;
+
+	const outlinePoints = useMemo((): [number, number, number][] => {
+		const hw = width / 2;
+		const hl = length / 2;
+		const y = 0.03;
+		return [
+			[-hw, y, -hl],
+			[hw, y, -hl],
+			[hw, y, hl],
+			[-hw, y, hl],
+			[-hw, y, -hl],
+		];
+	}, [width, length]);
+
+	const showOutline = lod !== "overview";
+	const material = lod === "detail" ? feltMaterial : solidMaterial;
+
+	return (
+		<group
+			position={[hole.position.x, 0, hole.position.z]}
+			rotation={[0, rotationRad, 0]}
+		>
+			<mesh
+				raycast={noRaycast}
+				position={[0, 0.03, 0]}
+				rotation={[-Math.PI / 2, 0, 0]}
+			>
+				<planeGeometry args={[width, length]} />
+				<primitive object={material} attach="material" />
+			</mesh>
+			{showOutline && (
+				<Line
+					points={outlinePoints}
+					lineWidth={2}
+					worldUnits={false}
+					color={border}
+				/>
+			)}
+		</group>
+	);
+}
diff --git a/src/components/three/architectural/HoleFeltOverlays.tsx b/src/components/three/architectural/HoleFeltOverlays.tsx
new file mode 100644
index 0000000..cee9036
--- /dev/null
+++ b/src/components/three/architectural/HoleFeltOverlays.tsx
@@ -0,0 +1,60 @@
+import { useRef } from "react";
+import type { Group } from "three";
+import { HOLE_TYPE_MAP } from "../../../constants";
+import { useGroupOpacity } from "../../../hooks/useGroupOpacity";
+import { useStore } from "../../../store";
+import { computeTemplateBounds } from "../../../utils/chainCompute";
+import { HoleFelt2D } from "./HoleFelt2D";
+
+/**
+ * Iterates over placed holes and renders felt-textured 2D overlays.
+ * Respects the holes layer visibility and opacity.
+ */
+export function HoleFeltOverlays() {
+	const groupRef = useRef<Group>(null);
+	const holes = useStore((s) => s.holes);
+	const holeOrder = useStore((s) => s.holeOrder);
+	const holeTemplates = useStore((s) => s.holeTemplates);
+	const holesLayer = useStore((s) => s.ui.layers.holes);
+
+	useGroupOpacity(groupRef, holesLayer.opacity);
+
+	if (!holesLayer.visible) return null;
+
+	return (
+		<group ref={groupRef} name="hole-felt-overlays">
+			{holeOrder.map((id) => {
+				const hole = holes[id];
+				if (!hole) return null;
+
+				let width: number;
+				let length: number;
+				let color: string;
+
+				if (hole.templateId && holeTemplates[hole.templateId]) {
+					const template = holeTemplates[hole.templateId];
+					const bounds = computeTemplateBounds(template);
+					width = bounds.width;
+					length = bounds.length;
+					color = template.color;
+				} else {
+					const def = HOLE_TYPE_MAP[hole.type];
+					if (!def) return null;
+					width = def.dimensions.width;
+					length = def.dimensions.length;
+					color = def.color;
+				}
+
+				return (
+					<HoleFelt2D
+						key={id}
+						hole={hole}
+						width={width}
+						length={length}
+						color={color}
+					/>
+				);
+			})}
+		</group>
+	);
+}
diff --git a/src/components/three/architectural/HoleFeltShader.ts b/src/components/three/architectural/HoleFeltShader.ts
new file mode 100644
index 0000000..82fc2b3
--- /dev/null
+++ b/src/components/three/architectural/HoleFeltShader.ts
@@ -0,0 +1,53 @@
+import * as THREE from "three";
+
+const vertexShader = /* glsl */ `
+varying vec2 vUv;
+
+void main() {
+	vUv = uv;
+	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
+}
+`;
+
+const fragmentShader = /* glsl */ `
+uniform vec3 uColor;
+uniform float uNoiseScale;
+uniform float uNoiseStrength;
+
+varying vec2 vUv;
+
+float hash(vec2 p) {
+	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
+}
+
+float noise(vec2 p) {
+	vec2 i = floor(p);
+	vec2 f = fract(p);
+	f = f * f * (3.0 - 2.0 * f);
+	float a = hash(i);
+	float b = hash(i + vec2(1.0, 0.0));
+	float c = hash(i + vec2(0.0, 1.0));
+	float d = hash(i + vec2(1.0, 1.0));
+	return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
+}
+
+void main() {
+	float n = noise(vUv * uNoiseScale);
+	vec3 feltColor = uColor * (1.0 - uNoiseStrength + n * uNoiseStrength * 2.0);
+	gl_FragColor = vec4(feltColor, 1.0);
+}
+`;
+
+/** Create a ShaderMaterial with procedural felt noise. */
+export function createFeltMaterial(color: string): THREE.ShaderMaterial {
+	const c = new THREE.Color(color);
+	return new THREE.ShaderMaterial({
+		uniforms: {
+			uColor: { value: c },
+			uNoiseScale: { value: 50.0 },
+			uNoiseStrength: { value: 0.08 },
+		},
+		vertexShader,
+		fragmentShader,
+	});
+}
diff --git a/tests/visual/texturedHoles2D.spec.ts b/tests/visual/texturedHoles2D.spec.ts
new file mode 100644
index 0000000..d8b011e
--- /dev/null
+++ b/tests/visual/texturedHoles2D.spec.ts
@@ -0,0 +1,89 @@
+import { type Page, expect, test } from "@playwright/test";
+
+/**
+ * Visual regression tests for textured 2D hole felt overlays.
+ * Verifies LOD-based rendering: felt shader at detail zoom, solid color at overview.
+ */
+
+async function waitForCanvasRender(page: Page) {
+	await page.waitForSelector("canvas", { timeout: 10000 });
+	await page.waitForTimeout(2000);
+}
+
+/** Collapse to 2D-only mode for clear felt overlay visibility. */
+async function collapseToLayout(page: Page, layout: "2d-only" | "3d-only") {
+	const side = layout === "2d-only" ? "2d" : "3d";
+	await page.evaluate(
+		(s) => {
+			const store = (window as Record<string, any>).__STORE__;
+			if (store) store.getState().collapseTo(s);
+		},
+		side,
+	);
+	await page.waitForTimeout(500);
+}
+
+/** Place a straight hole at center via store injection. */
+async function placeTestHole(page: Page) {
+	await page.evaluate(() => {
+		const store = (window as Record<string, any>).__STORE__;
+		if (!store) return;
+		const state = store.getState();
+		state.addHole({
+			type: "straight",
+			position: { x: 5, z: 10 },
+			rotation: 0,
+			name: "Test Hole 1",
+			par: 2,
+		});
+	});
+	await page.waitForTimeout(500);
+}
+
+/** Set the 2D camera zoom level via store. */
+async function setZoom(page: Page, zoom: number) {
+	await page.evaluate(
+		(z) => {
+			const store = (window as Record<string, any>).__STORE__;
+			if (!store) return;
+			// Set zoom on the 2D camera via the orthographic camera
+			const canvas = document.querySelector("[data-testid='pane-2d'] canvas");
+			if (!canvas) return;
+			// Access the R3F store from the canvas fiber root
+			const fiber = (canvas as any).__r$;
+			if (fiber?.store) {
+				const cam = fiber.store.getState().camera;
+				if (cam) {
+					cam.zoom = z;
+					cam.updateProjectionMatrix();
+				}
+			}
+		},
+		zoom,
+	);
+	await page.waitForTimeout(500);
+}
+
+test.describe("Textured 2D Holes", () => {
+	test("zoomed-in 2D view shows textured hole surfaces", async ({ page }) => {
+		await page.goto("/");
+		await waitForCanvasRender(page);
+		await collapseToLayout(page, "2d-only");
+		await placeTestHole(page);
+		await setZoom(page, 50);
+		await page.waitForTimeout(500);
+		await expect(page).toHaveScreenshot("hole-felt-detail-zoom.png");
+	});
+
+	test("overview zoom shows solid color fills instead of texture", async ({
+		page,
+	}) => {
+		await page.goto("/");
+		await waitForCanvasRender(page);
+		await collapseToLayout(page, "2d-only");
+		await placeTestHole(page);
+		await setZoom(page, 10);
+		await page.waitForTimeout(500);
+		await expect(page).toHaveScreenshot("hole-felt-overview-zoom.png");
+	});
+});
