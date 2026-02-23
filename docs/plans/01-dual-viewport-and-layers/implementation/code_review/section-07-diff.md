diff --git a/src/components/three/FloorGrid.tsx b/src/components/three/FloorGrid.tsx
index 4743822..136d1d5 100644
--- a/src/components/three/FloorGrid.tsx
+++ b/src/components/three/FloorGrid.tsx
@@ -4,6 +4,9 @@ import { useStore } from "../../store";
 export function FloorGrid() {
 	const { width, length } = useStore((s) => s.hall);
 	const uvMode = useStore((s) => s.ui.uvMode);
+	const gridLayer = useStore((s) => s.ui.layers.grid);
+
+	if (!gridLayer.visible) return null;
 
 	return (
 		<Grid
diff --git a/src/components/three/FlowPath.tsx b/src/components/three/FlowPath.tsx
index fe9fcef..eab10b0 100644
--- a/src/components/three/FlowPath.tsx
+++ b/src/components/three/FlowPath.tsx
@@ -5,12 +5,12 @@ const LINE_Y = 0.02;
 const LABEL_Y = 0.5;
 
 export function FlowPath() {
-	const showFlowPath = useStore((s) => s.ui.showFlowPath);
+	const flowPathLayer = useStore((s) => s.ui.layers.flowPath);
 	const holes = useStore((s) => s.holes);
 	const holeOrder = useStore((s) => s.holeOrder);
 	const uvMode = useStore((s) => s.ui.uvMode);
 
-	if (!showFlowPath || holeOrder.length < 2) return null;
+	if (!flowPathLayer.visible || holeOrder.length < 2) return null;
 
 	const points: [number, number, number][] = [];
 	for (const id of holeOrder) {
@@ -30,7 +30,7 @@ export function FlowPath() {
 				dashed
 				dashSize={0.3}
 				gapSize={0.15}
-				opacity={0.5}
+				opacity={0.5 * flowPathLayer.opacity}
 				transparent
 			/>
 			{holeOrder.map((id, index) => {
diff --git a/src/components/three/Hall.tsx b/src/components/three/Hall.tsx
index d9aa381..cbfd12c 100644
--- a/src/components/three/Hall.tsx
+++ b/src/components/three/Hall.tsx
@@ -1,5 +1,6 @@
 import { Suspense } from "react";
 import type { SunData } from "../../hooks/useSunPosition";
+import { useStore } from "../../store";
 import { HallFloor } from "./HallFloor";
 import { HallOpenings } from "./HallOpenings";
 import { HallWalls } from "./HallWalls";
@@ -9,12 +10,16 @@ type HallProps = {
 };
 
 export function Hall({ sunData }: HallProps) {
+	const wallsLayer = useStore((s) => s.ui.layers.walls);
+
 	return (
 		<Suspense fallback={null}>
 			<group>
 				<HallFloor />
-				<HallWalls />
-				<HallOpenings sunData={sunData} />
+				{wallsLayer.visible && (
+					<HallWalls layerOpacity={wallsLayer.opacity} />
+				)}
+				{wallsLayer.visible && <HallOpenings sunData={sunData} />}
 			</group>
 		</Suspense>
 	);
diff --git a/src/components/three/HallWalls.tsx b/src/components/three/HallWalls.tsx
index 43e9c06..7d36573 100644
--- a/src/components/three/HallWalls.tsx
+++ b/src/components/three/HallWalls.tsx
@@ -1,5 +1,5 @@
 import { useTexture } from "@react-three/drei";
-import { Suspense, useEffect, useMemo } from "react";
+import { Suspense, useEffect, useMemo, useRef } from "react";
 import { MeshStandardMaterial } from "three";
 import * as THREE from "three";
 import { useStore } from "../../store";
@@ -189,22 +189,53 @@ function TexturedHallWalls({
 	);
 }
 
-export function HallWalls() {
+type HallWallsOuterProps = {
+	layerOpacity?: number;
+};
+
+export function HallWalls({ layerOpacity = 1 }: HallWallsOuterProps) {
 	const { width, length, wallHeight, wallThickness } = useStore(
 		(s) => s.hall,
 	);
 	const uvMode = useStore((s) => s.ui.uvMode);
 	const gpuTier = useStore((s) => s.ui.gpuTier);
+	const groupRef = useRef<THREE.Group>(null);
+
+	useEffect(() => {
+		const group = groupRef.current;
+		if (!group) return;
+		const needsTransparency = layerOpacity < 1;
+		group.traverse((child) => {
+			if ((child as THREE.Mesh).isMesh) {
+				const mesh = child as THREE.Mesh;
+				const materials = Array.isArray(mesh.material)
+					? mesh.material
+					: [mesh.material];
+				for (const mat of materials) {
+					if (mat && "opacity" in mat) {
+						(mat as THREE.Material).transparent = needsTransparency;
+						(mat as THREE.Material).opacity = layerOpacity;
+					}
+				}
+			}
+		});
+	}, [layerOpacity]);
 
 	const props = { width, length, wallHeight, wallThickness, uvMode };
 
 	if (!shouldLoadHallTextures(gpuTier)) {
-		return <FlatHallWalls {...props} />;
+		return (
+			<group ref={groupRef}>
+				<FlatHallWalls {...props} />
+			</group>
+		);
 	}
 
 	return (
-		<Suspense fallback={<FlatHallWalls {...props} />}>
-			<TexturedHallWalls {...props} />
-		</Suspense>
+		<group ref={groupRef}>
+			<Suspense fallback={<FlatHallWalls {...props} />}>
+				<TexturedHallWalls {...props} />
+			</Suspense>
+		</group>
 	);
 }
diff --git a/src/components/three/MiniGolfHole.tsx b/src/components/three/MiniGolfHole.tsx
index 7cf640e..23487f0 100644
--- a/src/components/three/MiniGolfHole.tsx
+++ b/src/components/three/MiniGolfHole.tsx
@@ -19,12 +19,20 @@ type Props = {
 	hole: Hole;
 	isSelected: boolean;
 	onClick: () => void;
+	layerOpacity?: number;
+	layerLocked?: boolean;
 };
 
 const INTERACTION_HEIGHT = 0.3;
 const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
 
-export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
+export function MiniGolfHole({
+	hole,
+	isSelected,
+	onClick,
+	layerOpacity = 1,
+	layerLocked = false,
+}: Props) {
 	const definition = HOLE_TYPE_MAP[hole.type];
 	const updateHole = useStore((s) => s.updateHole);
 	const removeHole = useStore((s) => s.removeHole);
@@ -60,6 +68,7 @@ export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
 	const rotationRad = (hole.rotation * Math.PI) / 180;
 
 	function handlePointerDown(e: ThreeEvent<PointerEvent>) {
+		if (layerLocked) return;
 		if (tool !== "select" || !isSelected) return;
 		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
 		e.stopPropagation();
@@ -180,6 +189,7 @@ export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
 			<mesh
 				position={[0, INTERACTION_HEIGHT / 2, 0]}
 				onClick={(e) => {
+					if (layerLocked) return;
 					if (viewportInfo && !isEventForThisViewport(e, viewportInfo))
 						return;
 					e.stopPropagation();
@@ -193,11 +203,13 @@ export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
 				onPointerMove={handlePointerMove}
 				onPointerUp={handlePointerUp}
 				onPointerEnter={(e) => {
+					if (layerLocked) return;
 					if (viewportInfo && !isEventForThisViewport(e, viewportInfo))
 						return;
 					setIsHovered(true);
 				}}
 				onPointerLeave={(e) => {
+					if (layerLocked) return;
 					if (viewportInfo && !isEventForThisViewport(e, viewportInfo))
 						return;
 					setIsHovered(false);
@@ -237,6 +249,7 @@ export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
 				length={length}
 				color={color}
 				templateId={hole.templateId}
+				layerOpacity={layerOpacity}
 			/>
 
 			{/* Selection outline — sized to model height */}
diff --git a/src/components/three/PlacedHoles.tsx b/src/components/three/PlacedHoles.tsx
index b840d7f..eac99ae 100644
--- a/src/components/three/PlacedHoles.tsx
+++ b/src/components/three/PlacedHoles.tsx
@@ -7,6 +7,9 @@ export function PlacedHoles() {
 	const holeOrder = useStore((s) => s.holeOrder);
 	const selectedId = useStore((s) => s.selectedId);
 	const selectHole = useStore((s) => s.selectHole);
+	const holesLayer = useStore((s) => s.ui.layers.holes);
+
+	if (!holesLayer.visible) return null;
 
 	return (
 		<group>
@@ -19,15 +22,18 @@ export function PlacedHoles() {
 						hole={hole}
 						isSelected={selectedId === id}
 						onClick={() => selectHole(id)}
+						layerOpacity={holesLayer.opacity}
+						layerLocked={holesLayer.locked}
 					/>
 				);
 			})}
-			{selectedId && holes[selectedId] && (
+			{selectedId && holes[selectedId] && !holesLayer.locked && (
 				<RotationHandle
 					holeId={selectedId}
 					holeX={holes[selectedId].position.x}
 					holeZ={holes[selectedId].position.z}
 					rotation={holes[selectedId].rotation}
+					layerLocked={holesLayer.locked}
 				/>
 			)}
 		</group>
diff --git a/src/components/three/RotationHandle.tsx b/src/components/three/RotationHandle.tsx
index bd71005..7e59f25 100644
--- a/src/components/three/RotationHandle.tsx
+++ b/src/components/three/RotationHandle.tsx
@@ -18,6 +18,7 @@ type RotationHandleProps = {
 	holeX: number;
 	holeZ: number;
 	rotation: number;
+	layerLocked?: boolean;
 };
 
 export function RotationHandle({
@@ -25,6 +26,7 @@ export function RotationHandle({
 	holeX,
 	holeZ,
 	rotation,
+	layerLocked = false,
 }: RotationHandleProps) {
 	const updateHole = useStore((s) => s.updateHole);
 	const [isDragging, setIsDragging] = useState(false);
@@ -36,6 +38,7 @@ export function RotationHandle({
 	const handleZ = Math.cos(rotRad) * RING_RADIUS;
 
 	function handlePointerDown(e: ThreeEvent<PointerEvent>) {
+		if (layerLocked) return;
 		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
 		e.stopPropagation();
 		setIsDragging(true);
diff --git a/src/components/three/SunIndicator.tsx b/src/components/three/SunIndicator.tsx
index 88c9c35..03d494d 100644
--- a/src/components/three/SunIndicator.tsx
+++ b/src/components/three/SunIndicator.tsx
@@ -46,21 +46,31 @@ export function SunIndicator({ sunData }: SunIndicatorProps) {
 	}, [sunData.azimuth, sunData.isDay, width, length]);
 
 	const uvMode = useStore((s) => s.ui.uvMode);
+	const sunLayer = useStore((s) => s.ui.layers.sunIndicator);
 
 	if (uvMode) return null;
 	if (!visible) return null;
+	if (!sunLayer.visible) return null;
 
 	return (
 		<group position={position} rotation={[0, rotation, 0]}>
 			{/* Arrow body */}
 			<mesh position={[0, 0, 0.5]}>
 				<boxGeometry args={[0.3, 0.05, 1.0]} />
-				<meshStandardMaterial color="#FFA726" />
+				<meshStandardMaterial
+					color="#FFA726"
+					transparent={sunLayer.opacity < 1}
+					opacity={sunLayer.opacity}
+				/>
 			</mesh>
 			{/* Arrow head (triangle via cone) */}
 			<mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
 				<coneGeometry args={[0.4, 0.6, 3]} />
-				<meshStandardMaterial color="#FF9800" />
+				<meshStandardMaterial
+					color="#FF9800"
+					transparent={sunLayer.opacity < 1}
+					opacity={sunLayer.opacity}
+				/>
 			</mesh>
 			{/* Sun info label */}
 			<Html position={[0, 0.5, 1.2]} center>
@@ -75,6 +85,7 @@ export function SunIndicator({ sunData }: SunIndicatorProps) {
 						fontFamily: "monospace",
 						userSelect: "none",
 						pointerEvents: "none",
+						opacity: sunLayer.opacity,
 					}}
 				>
 					{sunData.azimuthDeg} {sunData.altitudeDeg} alt
diff --git a/src/components/three/holes/HoleModel.tsx b/src/components/three/holes/HoleModel.tsx
index 49a5443..015e40c 100644
--- a/src/components/three/holes/HoleModel.tsx
+++ b/src/components/three/holes/HoleModel.tsx
@@ -1,4 +1,5 @@
-import { Component, type ReactNode, Suspense } from "react";
+import { Component, type ReactNode, Suspense, useEffect, useRef } from "react";
+import type { Group, Material, Mesh } from "three";
 import { useStore } from "../../../store";
 import { HoleDogleg } from "./HoleDogleg";
 import { HoleLoop } from "./HoleLoop";
@@ -17,8 +18,35 @@ export type HoleModelProps = {
 	length: number;
 	color: string;
 	templateId?: string;
+	layerOpacity?: number;
 };
 
+/** Traverses a group and applies opacity to all mesh materials. */
+function useGroupOpacity(
+	groupRef: React.RefObject<Group | null>,
+	opacity: number,
+) {
+	useEffect(() => {
+		const group = groupRef.current;
+		if (!group) return;
+		const needsTransparency = opacity < 1;
+		group.traverse((child) => {
+			if ((child as Mesh).isMesh) {
+				const mesh = child as Mesh;
+				const materials = Array.isArray(mesh.material)
+					? mesh.material
+					: [mesh.material];
+				for (const mat of materials) {
+					if (mat && "opacity" in mat) {
+						(mat as Material).transparent = needsTransparency;
+						(mat as Material).opacity = opacity;
+					}
+				}
+			}
+		});
+	}, [groupRef, opacity]);
+}
+
 type HoleSwitchProps = {
 	type: string;
 	width: number;
@@ -91,11 +119,18 @@ export function HoleModel({
 	length,
 	color,
 	templateId,
+	layerOpacity = 1,
 }: HoleModelProps) {
 	const gpuTier = useStore((s) => s.ui.gpuTier);
+	const groupRef = useRef<Group>(null);
+	useGroupOpacity(groupRef, layerOpacity);
 
 	if (templateId) {
-		return <TemplateHoleModel templateId={templateId} />;
+		return (
+			<group ref={groupRef}>
+				<TemplateHoleModel templateId={templateId} />
+			</group>
+		);
 	}
 
 	if (gpuTier !== "low") {
@@ -103,20 +138,24 @@ export function HoleModel({
 			<HoleSwitch type={type} width={width} length={length} color={color} />
 		);
 		return (
-			<TextureErrorBoundary fallback={flatFallback}>
-				<Suspense fallback={flatFallback}>
-					<TexturedHoleSwitch
-						type={type}
-						width={width}
-						length={length}
-						color={color}
-					/>
-				</Suspense>
-			</TextureErrorBoundary>
+			<group ref={groupRef}>
+				<TextureErrorBoundary fallback={flatFallback}>
+					<Suspense fallback={flatFallback}>
+						<TexturedHoleSwitch
+							type={type}
+							width={width}
+							length={length}
+							color={color}
+						/>
+					</Suspense>
+				</TextureErrorBoundary>
+			</group>
 		);
 	}
 
 	return (
-		<HoleSwitch type={type} width={width} length={length} color={color} />
+		<group ref={groupRef}>
+			<HoleSwitch type={type} width={width} length={length} color={color} />
+		</group>
 	);
 }
diff --git a/tests/components/layerIntegration.test.ts b/tests/components/layerIntegration.test.ts
new file mode 100644
index 0000000..49969b0
--- /dev/null
+++ b/tests/components/layerIntegration.test.ts
@@ -0,0 +1,65 @@
+import { beforeEach, describe, expect, it } from "vitest";
+import { useStore } from "../../src/store/store";
+
+beforeEach(() => {
+	useStore.getState().resetLayers();
+});
+
+describe("Layer visibility integration", () => {
+	it("holes layer defaults to visible", () => {
+		expect(useStore.getState().ui.layers.holes.visible).toBe(true);
+	});
+
+	it("setting holes layer to invisible updates store", () => {
+		useStore.getState().setLayerVisible("holes", false);
+		expect(useStore.getState().ui.layers.holes.visible).toBe(false);
+	});
+
+	it("flowPath layer defaults to visible", () => {
+		expect(useStore.getState().ui.layers.flowPath.visible).toBe(true);
+	});
+
+	it("grid layer defaults to visible", () => {
+		expect(useStore.getState().ui.layers.grid.visible).toBe(true);
+	});
+
+	it("walls layer defaults to visible", () => {
+		expect(useStore.getState().ui.layers.walls.visible).toBe(true);
+	});
+
+	it("sunIndicator layer defaults to visible", () => {
+		expect(useStore.getState().ui.layers.sunIndicator.visible).toBe(true);
+	});
+});
+
+describe("Layer opacity integration", () => {
+	it("holes layer defaults to opacity 1", () => {
+		expect(useStore.getState().ui.layers.holes.opacity).toBe(1);
+	});
+
+	it("setting opacity to 0.5 updates store", () => {
+		useStore.getState().setLayerOpacity("holes", 0.5);
+		expect(useStore.getState().ui.layers.holes.opacity).toBe(0.5);
+	});
+});
+
+describe("Layer lock integration", () => {
+	it("holes layer defaults to unlocked", () => {
+		expect(useStore.getState().ui.layers.holes.locked).toBe(false);
+	});
+
+	it("locking holes layer updates store", () => {
+		useStore.getState().setLayerLocked("holes", true);
+		expect(useStore.getState().ui.layers.holes.locked).toBe(true);
+	});
+});
+
+describe("FlowPath toggle migration", () => {
+	it("toggleLayerVisible('flowPath') controls flowPath visibility", () => {
+		expect(useStore.getState().ui.layers.flowPath.visible).toBe(true);
+		useStore.getState().toggleLayerVisible("flowPath");
+		expect(useStore.getState().ui.layers.flowPath.visible).toBe(false);
+		useStore.getState().toggleLayerVisible("flowPath");
+		expect(useStore.getState().ui.layers.flowPath.visible).toBe(true);
+	});
+});
