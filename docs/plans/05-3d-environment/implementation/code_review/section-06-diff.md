diff --git a/src/components/three/ThreeDOnlyContent.tsx b/src/components/three/ThreeDOnlyContent.tsx
index 2e5b3a3..c4c9fc7 100644
--- a/src/components/three/ThreeDOnlyContent.tsx
+++ b/src/components/three/ThreeDOnlyContent.tsx
@@ -13,6 +13,9 @@ import { shouldEnableFog } from "../../utils/environmentGating";
 import { shouldShowGodRays } from "../../utils/godraysConfig";
 import { shouldShowSparkles } from "../../utils/postprocessingConfig";
 import { GroundPlane } from "./environment/GroundPlane";
+import { HallFoundation } from "./environment/HallFoundation";
+import { HallRoof } from "./environment/HallRoof";
+import { HallWallsExterior } from "./environment/HallWallsExterior";
 import { GodRaysSource } from "./GodRaysSource";
 import { ScreenshotCapture } from "./ScreenshotCapture";
 import { UVEffects } from "./UVEffects";
@@ -39,6 +42,9 @@ export function ThreeDOnlyContent() {
 	return (
 		<>
 			<GroundPlane />
+			<HallRoof />
+			<HallFoundation />
+			<HallWallsExterior />
 			{fogEnabled && <fogExp2 attach="fog" args={["#07071A", 0.04]} />}
 			<FogController enabled={fogEnabled} />
 
diff --git a/src/components/three/environment/HallFoundation.tsx b/src/components/three/environment/HallFoundation.tsx
new file mode 100644
index 0000000..83196e6
--- /dev/null
+++ b/src/components/three/environment/HallFoundation.tsx
@@ -0,0 +1,64 @@
+import { HALL } from "../../../constants/hall";
+import { useStore } from "../../../store";
+
+const FOUNDATION_WIDTH = 0.3;
+const FOUNDATION_HEIGHT = 0.15;
+const FOUNDATION_Y = -0.075;
+const CORNER_OVERLAP = 0.6;
+
+/** Pure helper exported for tests. */
+export function getFoundationStrips(hall: {
+	width: number;
+	length: number;
+}): Array<{
+	position: [number, number, number];
+	size: [number, number, number];
+}> {
+	return [
+		// North (z=0)
+		{
+			position: [hall.width / 2, FOUNDATION_Y, 0],
+			size: [hall.width + CORNER_OVERLAP, FOUNDATION_HEIGHT, FOUNDATION_WIDTH],
+		},
+		// South (z=length)
+		{
+			position: [hall.width / 2, FOUNDATION_Y, hall.length],
+			size: [hall.width + CORNER_OVERLAP, FOUNDATION_HEIGHT, FOUNDATION_WIDTH],
+		},
+		// West (x=0)
+		{
+			position: [0, FOUNDATION_Y, hall.length / 2],
+			size: [FOUNDATION_WIDTH, FOUNDATION_HEIGHT, hall.length],
+		},
+		// East (x=width)
+		{
+			position: [hall.width, FOUNDATION_Y, hall.length / 2],
+			size: [FOUNDATION_WIDTH, FOUNDATION_HEIGHT, hall.length],
+		},
+	];
+}
+
+export function HallFoundation() {
+	const envLayerVisible = useStore(
+		(s) => s.ui.layers.environment?.visible ?? true,
+	);
+
+	if (!envLayerVisible) return null;
+
+	const strips = getFoundationStrips(HALL);
+
+	return (
+		<group>
+			{strips.map((strip, i) => (
+				<mesh key={i} position={strip.position}>
+					<boxGeometry args={strip.size} />
+					<meshStandardMaterial
+						color="#444444"
+						roughness={0.95}
+						metalness={0}
+					/>
+				</mesh>
+			))}
+		</group>
+	);
+}
diff --git a/src/components/three/environment/HallRoof.tsx b/src/components/three/environment/HallRoof.tsx
new file mode 100644
index 0000000..3a624f8
--- /dev/null
+++ b/src/components/three/environment/HallRoof.tsx
@@ -0,0 +1,230 @@
+import { useTexture } from "@react-three/drei";
+import { Suspense, useEffect, useMemo } from "react";
+import * as THREE from "three";
+import { HALL } from "../../../constants/hall";
+import { useStore } from "../../../store";
+
+/** Pure helper exported for tests. */
+export function getRoofGeometryParams(hall: {
+	width: number;
+	length: number;
+	wallHeight: number;
+	firstHeight: number;
+}): {
+	ridgeX: number;
+	ridgeY: number;
+	eaveY: number;
+	slopeAngle: number;
+	slopeHalfWidth: number;
+	slopeLength: number;
+} {
+	const rise = hall.firstHeight - hall.wallHeight;
+	const run = hall.width / 2;
+	return {
+		ridgeX: hall.width / 2,
+		ridgeY: hall.firstHeight,
+		eaveY: hall.wallHeight,
+		slopeAngle: Math.atan2(rise, run),
+		slopeHalfWidth: run,
+		slopeLength: hall.length,
+	};
+}
+
+const ROOF_COLOR = "#909090";
+
+function FlatHallRoof() {
+	const { ridgeX, ridgeY, eaveY, slopeAngle, slopeHalfWidth, slopeLength } =
+		getRoofGeometryParams(HALL);
+	const rise = ridgeY - eaveY;
+	const slopeWidth = Math.sqrt(slopeHalfWidth ** 2 + rise ** 2);
+
+	// Midpoint Y for each slope plane
+	const midY = (eaveY + ridgeY) / 2;
+
+	return (
+		<group>
+			{/* West slope */}
+			<mesh
+				position={[ridgeX / 2, midY, slopeLength / 2]}
+				rotation={[0, 0, slopeAngle]}
+			>
+				<planeGeometry args={[slopeWidth, slopeLength]} />
+				<meshStandardMaterial
+					color={ROOF_COLOR}
+					side={THREE.DoubleSide}
+					roughness={0.8}
+					metalness={0.3}
+				/>
+			</mesh>
+			{/* East slope */}
+			<mesh
+				position={[ridgeX + ridgeX / 2, midY, slopeLength / 2]}
+				rotation={[0, 0, -slopeAngle]}
+			>
+				<planeGeometry args={[slopeWidth, slopeLength]} />
+				<meshStandardMaterial
+					color={ROOF_COLOR}
+					side={THREE.DoubleSide}
+					roughness={0.8}
+					metalness={0.3}
+				/>
+			</mesh>
+			{/* North gable */}
+			<GableTriangle
+				z={0}
+				width={HALL.width}
+				wallHeight={eaveY}
+				ridgeHeight={ridgeY}
+				color={ROOF_COLOR}
+			/>
+			{/* South gable */}
+			<GableTriangle
+				z={slopeLength}
+				width={HALL.width}
+				wallHeight={eaveY}
+				ridgeHeight={ridgeY}
+				color={ROOF_COLOR}
+			/>
+		</group>
+	);
+}
+
+function GableTriangle({
+	z,
+	width,
+	wallHeight,
+	ridgeHeight,
+	color,
+}: {
+	z: number;
+	width: number;
+	wallHeight: number;
+	ridgeHeight: number;
+	color: string;
+}) {
+	const geometry = useMemo(() => {
+		const geo = new THREE.BufferGeometry();
+		const vertices = new Float32Array([
+			0,
+			wallHeight,
+			z,
+			width,
+			wallHeight,
+			z,
+			width / 2,
+			ridgeHeight,
+			z,
+		]);
+		geo.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
+		geo.computeVertexNormals();
+		return geo;
+	}, [z, width, wallHeight, ridgeHeight]);
+
+	return (
+		<mesh geometry={geometry}>
+			<meshStandardMaterial
+				color={color}
+				side={THREE.DoubleSide}
+				roughness={0.8}
+				metalness={0.3}
+			/>
+		</mesh>
+	);
+}
+
+function TexturedHallRoof() {
+	const textures = useTexture({
+		map: "/textures/steel/color.jpg",
+		normalMap: "/textures/steel/normal.jpg",
+		roughnessMap: "/textures/steel/roughness.jpg",
+		metalnessMap: "/textures/steel/metalness.jpg",
+	});
+
+	const { ridgeX, ridgeY, eaveY, slopeAngle, slopeHalfWidth, slopeLength } =
+		getRoofGeometryParams(HALL);
+	const rise = ridgeY - eaveY;
+	const slopeWidth = Math.sqrt(slopeHalfWidth ** 2 + rise ** 2);
+	const midY = (eaveY + ridgeY) / 2;
+
+	// Configure texture repeats for roof slope
+	const repeatX = slopeWidth / 1;
+	const repeatZ = slopeLength / 1;
+
+	const material = useMemo(() => {
+		const mat = new THREE.MeshStandardMaterial({
+			color: ROOF_COLOR,
+			side: THREE.DoubleSide,
+			roughness: 0.7,
+			metalness: 0.5,
+		});
+
+		for (const [key, tex] of Object.entries(textures)) {
+			if (tex instanceof THREE.Texture) {
+				const cloned = tex.clone();
+				cloned.wrapS = THREE.RepeatWrapping;
+				cloned.wrapT = THREE.RepeatWrapping;
+				cloned.repeat.set(repeatX, repeatZ);
+				cloned.needsUpdate = true;
+				(mat as Record<string, unknown>)[key] = cloned;
+			}
+		}
+
+		return mat;
+	}, [textures, repeatX, repeatZ]);
+
+	useEffect(() => {
+		return () => material.dispose();
+	}, [material]);
+
+	return (
+		<group>
+			<mesh
+				position={[ridgeX / 2, midY, slopeLength / 2]}
+				rotation={[0, 0, slopeAngle]}
+				material={material}
+			>
+				<planeGeometry args={[slopeWidth, slopeLength]} />
+			</mesh>
+			<mesh
+				position={[ridgeX + ridgeX / 2, midY, slopeLength / 2]}
+				rotation={[0, 0, -slopeAngle]}
+				material={material}
+			>
+				<planeGeometry args={[slopeWidth, slopeLength]} />
+			</mesh>
+			<GableTriangle
+				z={0}
+				width={HALL.width}
+				wallHeight={eaveY}
+				ridgeHeight={ridgeY}
+				color={ROOF_COLOR}
+			/>
+			<GableTriangle
+				z={slopeLength}
+				width={HALL.width}
+				wallHeight={eaveY}
+				ridgeHeight={ridgeY}
+				color={ROOF_COLOR}
+			/>
+		</group>
+	);
+}
+
+export function HallRoof() {
+	const envLayerVisible = useStore(
+		(s) => s.ui.layers.environment?.visible ?? true,
+	);
+	const gpuTier = useStore((s) => s.ui.gpuTier);
+
+	if (!envLayerVisible) return null;
+
+	if (gpuTier === "low") {
+		return <FlatHallRoof />;
+	}
+
+	return (
+		<Suspense fallback={<FlatHallRoof />}>
+			<TexturedHallRoof />
+		</Suspense>
+	);
+}
diff --git a/src/components/three/environment/HallWallsExterior.tsx b/src/components/three/environment/HallWallsExterior.tsx
new file mode 100644
index 0000000..a8ec877
--- /dev/null
+++ b/src/components/three/environment/HallWallsExterior.tsx
@@ -0,0 +1,174 @@
+import { useTexture } from "@react-three/drei";
+import { Suspense, useEffect, useMemo } from "react";
+import * as THREE from "three";
+import { useStore } from "../../../store";
+import type { GpuTier } from "../../../types/ui";
+import { getWallUVRepeat } from "../HallWalls";
+
+/** Returns true if exterior wall meshes should use textures. */
+export function shouldLoadExteriorTextures(gpuTier: GpuTier): boolean {
+	return gpuTier !== "low";
+}
+
+type WallsProps = {
+	width: number;
+	length: number;
+	wallHeight: number;
+	wallThickness: number;
+};
+
+function FlatExteriorWalls({
+	width,
+	length,
+	wallHeight,
+	wallThickness,
+}: WallsProps) {
+	const halfH = wallHeight / 2;
+
+	return (
+		<group>
+			<mesh position={[width / 2, halfH, 0]}>
+				<boxGeometry args={[width, wallHeight, wallThickness]} />
+				<meshStandardMaterial
+					color="#A0A0A0"
+					side={THREE.BackSide}
+					roughness={0.7}
+					metalness={0.1}
+				/>
+			</mesh>
+			<mesh position={[width / 2, halfH, length]}>
+				<boxGeometry args={[width, wallHeight, wallThickness]} />
+				<meshStandardMaterial
+					color="#A0A0A0"
+					side={THREE.BackSide}
+					roughness={0.7}
+					metalness={0.1}
+				/>
+			</mesh>
+			<mesh position={[0, halfH, length / 2]}>
+				<boxGeometry args={[wallThickness, wallHeight, length]} />
+				<meshStandardMaterial
+					color="#A0A0A0"
+					side={THREE.BackSide}
+					roughness={0.7}
+					metalness={0.1}
+				/>
+			</mesh>
+			<mesh position={[width, halfH, length / 2]}>
+				<boxGeometry args={[wallThickness, wallHeight, length]} />
+				<meshStandardMaterial
+					color="#A0A0A0"
+					side={THREE.BackSide}
+					roughness={0.7}
+					metalness={0.1}
+				/>
+			</mesh>
+		</group>
+	);
+}
+
+function TexturedExteriorWalls({
+	width,
+	length,
+	wallHeight,
+	wallThickness,
+}: WallsProps) {
+	const textures = useTexture({
+		map: "/textures/steel/color.jpg",
+		normalMap: "/textures/steel/normal.jpg",
+		roughnessMap: "/textures/steel/roughness.jpg",
+		metalnessMap: "/textures/steel/metalness.jpg",
+	});
+
+	const longRepeat = getWallUVRepeat(length);
+	const shortRepeat = getWallUVRepeat(width);
+
+	const { longMat, shortMat } = useMemo(() => {
+		const baseProps = {
+			color: "#A0A0A0",
+			metalness: 0.5,
+			roughness: 0.7,
+			side: THREE.BackSide as THREE.Side,
+		};
+
+		const cloneAndRepeat = (
+			tex: THREE.Texture,
+			repeat: [number, number],
+		): THREE.Texture => {
+			const c = tex.clone();
+			c.wrapS = THREE.RepeatWrapping;
+			c.wrapT = THREE.RepeatWrapping;
+			c.repeat.set(repeat[0], repeat[1]);
+			c.needsUpdate = true;
+			return c;
+		};
+
+		const lm = new THREE.MeshStandardMaterial({
+			...baseProps,
+			map: cloneAndRepeat(textures.map, longRepeat),
+			normalMap: cloneAndRepeat(textures.normalMap, longRepeat),
+			roughnessMap: cloneAndRepeat(textures.roughnessMap, longRepeat),
+			metalnessMap: cloneAndRepeat(textures.metalnessMap, longRepeat),
+		});
+
+		const sm = new THREE.MeshStandardMaterial({
+			...baseProps,
+			map: cloneAndRepeat(textures.map, shortRepeat),
+			normalMap: cloneAndRepeat(textures.normalMap, shortRepeat),
+			roughnessMap: cloneAndRepeat(textures.roughnessMap, shortRepeat),
+			metalnessMap: cloneAndRepeat(textures.metalnessMap, shortRepeat),
+		});
+
+		return { longMat: lm, shortMat: sm };
+	}, [textures, longRepeat, shortRepeat]);
+
+	useEffect(() => {
+		return () => {
+			longMat.dispose();
+			shortMat.dispose();
+		};
+	}, [longMat, shortMat]);
+
+	const halfH = wallHeight / 2;
+
+	return (
+		<group>
+			<mesh position={[width / 2, halfH, 0]} material={shortMat}>
+				<boxGeometry args={[width, wallHeight, wallThickness]} />
+			</mesh>
+			<mesh position={[width / 2, halfH, length]} material={shortMat}>
+				<boxGeometry args={[width, wallHeight, wallThickness]} />
+			</mesh>
+			<mesh position={[0, halfH, length / 2]} material={longMat}>
+				<boxGeometry args={[wallThickness, wallHeight, length]} />
+			</mesh>
+			<mesh position={[width, halfH, length / 2]} material={longMat}>
+				<boxGeometry args={[wallThickness, wallHeight, length]} />
+			</mesh>
+		</group>
+	);
+}
+
+export function HallWallsExterior() {
+	const { width, length, wallHeight, wallThickness } = useStore(
+		(s) => s.hall,
+	);
+	const envLayerVisible = useStore(
+		(s) => s.ui.layers.environment?.visible ?? true,
+	);
+	const gpuTier = useStore((s) => s.ui.gpuTier);
+
+	if (!envLayerVisible) return null;
+
+	const props = { width, length, wallHeight, wallThickness };
+
+	if (!shouldLoadExteriorTextures(gpuTier)) {
+		return <FlatExteriorWalls {...props} />;
+	}
+
+	return (
+		<Suspense fallback={<FlatExteriorWalls {...props} />}>
+			<TexturedExteriorWalls {...props} />
+		</Suspense>
+	);
+}
diff --git a/src/components/three/environment/index.ts b/src/components/three/environment/index.ts
index 1ad19c2..2958924 100644
--- a/src/components/three/environment/index.ts
+++ b/src/components/three/environment/index.ts
@@ -1,3 +1,6 @@
 export { GroundPlane } from "./GroundPlane";
+export { HallFoundation } from "./HallFoundation";
+export { HallRoof } from "./HallRoof";
+export { HallWallsExterior } from "./HallWallsExterior";
 export { WalkthroughController } from "./WalkthroughController";
 export { WalkthroughOverlay } from "./WalkthroughOverlay";
diff --git a/tests/components/three/hallExterior.test.ts b/tests/components/three/hallExterior.test.ts
new file mode 100644
index 0000000..07cce7b
--- /dev/null
+++ b/tests/components/three/hallExterior.test.ts
@@ -0,0 +1,103 @@
+import { describe, expect, it } from "vitest";
+import * as THREE from "three";
+import { HALL } from "../../../src/constants/hall";
+import { getFoundationStrips } from "../../../src/components/three/environment/HallFoundation";
+import { getRoofGeometryParams } from "../../../src/components/three/environment/HallRoof";
+import { shouldLoadExteriorTextures } from "../../../src/components/three/environment/HallWallsExterior";
+
+describe("getRoofGeometryParams", () => {
+	it("ridge height equals hall.firstHeight (4.9m)", () => {
+		const params = getRoofGeometryParams(HALL);
+		expect(params.ridgeY).toBe(HALL.firstHeight);
+	});
+
+	it("ridge X is at hall centerline (width / 2)", () => {
+		const params = getRoofGeometryParams(HALL);
+		expect(params.ridgeX).toBe(HALL.width / 2);
+	});
+
+	it("eave Y equals wall height (4.3m)", () => {
+		const params = getRoofGeometryParams(HALL);
+		expect(params.eaveY).toBe(HALL.wallHeight);
+	});
+
+	it("slope half-width is hall.width / 2 (5.0m)", () => {
+		const params = getRoofGeometryParams(HALL);
+		expect(params.slopeHalfWidth).toBe(HALL.width / 2);
+	});
+
+	it("slope length equals hall.length (20.0m)", () => {
+		const params = getRoofGeometryParams(HALL);
+		expect(params.slopeLength).toBe(HALL.length);
+	});
+
+	it("slope angle is approximately 6.84 degrees (atan2(0.6, 5.0))", () => {
+		const params = getRoofGeometryParams(HALL);
+		const expectedAngle = Math.atan2(
+			HALL.firstHeight - HALL.wallHeight,
+			HALL.width / 2,
+		);
+		expect(params.slopeAngle).toBeCloseTo(expectedAngle, 5);
+	});
+});
+
+describe("getFoundationStrips", () => {
+	it("returns 4 strips (one per wall side)", () => {
+		const strips = getFoundationStrips(HALL);
+		expect(strips).toHaveLength(4);
+	});
+
+	it("all strips have height 0.15m", () => {
+		const strips = getFoundationStrips(HALL);
+		for (const strip of strips) {
+			expect(strip.size[1]).toBe(0.15);
+		}
+	});
+
+	it("all strips have Y position -0.075 (half above, half below ground)", () => {
+		const strips = getFoundationStrips(HALL);
+		for (const strip of strips) {
+			expect(strip.position[1]).toBe(-0.075);
+		}
+	});
+
+	it("long wall strips (east/west) have 0.3m perpendicular width", () => {
+		const strips = getFoundationStrips(HALL);
+		const westStrip = strips.find((s) => s.position[0] === 0);
+		expect(westStrip?.size[0]).toBe(0.3);
+	});
+
+	it("long wall strips span hall.length in Z", () => {
+		const strips = getFoundationStrips(HALL);
+		const westStrip = strips.find((s) => s.position[0] === 0);
+		expect(westStrip?.size[2]).toBe(HALL.length);
+	});
+
+	it("short wall strips span hall.width + corner overlap in X", () => {
+		const strips = getFoundationStrips(HALL);
+		const northStrip = strips.find((s) => s.position[2] === 0);
+		expect(northStrip?.size[0]).toBe(HALL.width + 0.6);
+	});
+});
+
+describe("shouldLoadExteriorTextures", () => {
+	it("returns false for low GPU tier", () => {
+		expect(shouldLoadExteriorTextures("low")).toBe(false);
+	});
+
+	it("returns true for mid GPU tier", () => {
+		expect(shouldLoadExteriorTextures("mid")).toBe(true);
+	});
+
+	it("returns true for high GPU tier", () => {
+		expect(shouldLoadExteriorTextures("high")).toBe(true);
+	});
+});
+
+describe("Exterior wall material side", () => {
+	it("THREE.BackSide has expected numeric value (1)", () => {
+		expect(THREE.BackSide).toBe(1);
+		expect(THREE.FrontSide).toBe(0);
+		expect(THREE.DoubleSide).toBe(2);
+	});
+});
