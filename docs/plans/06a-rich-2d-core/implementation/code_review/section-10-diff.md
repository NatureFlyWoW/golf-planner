diff --git a/src/components/builder/BuilderCanvas.tsx b/src/components/builder/BuilderCanvas.tsx
index b0cd196..c0a2248 100644
--- a/src/components/builder/BuilderCanvas.tsx
+++ b/src/components/builder/BuilderCanvas.tsx
@@ -53,7 +53,10 @@ function SegmentMesh({
 	// Compute a bounding box that spans the full segment length for the
 	// selection outline. We use the absolute exit coordinates so that
 	// curved segments still get a reasonable (approximate) highlight.
-	const selectionWidth = Math.max(Math.abs(cupLocalX) + feltWidth, feltWidth + 0.06);
+	const selectionWidth = Math.max(
+		Math.abs(cupLocalX) + feltWidth,
+		feltWidth + 0.06,
+	);
 	const selectionDepth = Math.max(Math.abs(cupLocalZ), spec.length) + 0.06;
 	const selectionCenterZ = cupLocalZ / 2;
 
diff --git a/src/components/layout/DualViewport.tsx b/src/components/layout/DualViewport.tsx
index 3b3da3a..a0e6460 100644
--- a/src/components/layout/DualViewport.tsx
+++ b/src/components/layout/DualViewport.tsx
@@ -208,7 +208,12 @@ export function DualViewport({ sunData }: DualViewportProps) {
 			: gpuTier === "mid"
 				? [1, 1.5]
 				: [1, 1];
-	const frameloop = deriveFrameloop(uvMode, gpuTier, transitioning, viewportLayout);
+	const frameloop = deriveFrameloop(
+		uvMode,
+		gpuTier,
+		transitioning,
+		viewportLayout,
+	);
 	const shadows = getShadowType(gpuTier, isMobile);
 
 	// Mobile: single-pane fallback — no View components, camera driven by ui.view
@@ -218,8 +223,7 @@ export function DualViewport({ sunData }: DualViewportProps) {
 				ref={containerRef}
 				className="relative flex-1 overflow-hidden"
 				style={{
-					cursor:
-						tool === "delete" ? "crosshair" : "default",
+					cursor: tool === "delete" ? "crosshair" : "default",
 					touchAction: "none",
 					pointerEvents: canvasPointerEvents(transitioning),
 				}}
@@ -274,10 +278,7 @@ export function DualViewport({ sunData }: DualViewportProps) {
 									near={0.1}
 									far={500}
 								/>
-								<CameraControls
-									ref={controls3DRef}
-									makeDefault
-								/>
+								<CameraControls ref={controls3DRef} makeDefault />
 								<SharedScene sunData={sunData} />
 								<ThreeDOnlyContent />
 								<PlacementHandler />
@@ -316,15 +317,11 @@ export function DualViewport({ sunData }: DualViewportProps) {
 					data-testid="pane-2d"
 					className="relative h-full overflow-hidden"
 					style={{
-						width: showDivider
-							? `calc(${splitRatio * 100}% - 6px)`
-							: "100%",
+						width: showDivider ? `calc(${splitRatio * 100}% - 6px)` : "100%",
 					}}
 					onPointerEnter={() => setActiveViewport("2d")}
 					onPointerLeave={() =>
-						useMouseStatusStore
-							.getState()
-							.setMouseWorldPos(null)
+						useMouseStatusStore.getState().setMouseWorldPos(null)
 					}
 				>
 					<View style={{ width: "100%", height: "100%" }}>
@@ -396,10 +393,7 @@ export function DualViewport({ sunData }: DualViewportProps) {
 								near={0.1}
 								far={500}
 							/>
-							<CameraControls
-								ref={controls3DRef}
-								makeDefault
-							/>
+							<CameraControls ref={controls3DRef} makeDefault />
 							<SharedScene sunData={sunData} />
 							<ThreeDOnlyContent />
 							{!show2D && <PlacementHandler />}
diff --git a/src/components/layout/SplitDivider.tsx b/src/components/layout/SplitDivider.tsx
index f18635c..3b9b611 100644
--- a/src/components/layout/SplitDivider.tsx
+++ b/src/components/layout/SplitDivider.tsx
@@ -32,9 +32,7 @@ export function SplitDivider({
 				{/* Visual bar */}
 				<div
 					className={`absolute inset-0 transition-colors ${
-						isDragging
-							? "bg-accent"
-							: "bg-border group-hover:bg-accent/70"
+						isDragging ? "bg-accent" : "bg-border group-hover:bg-accent/70"
 					}`}
 				/>
 				{/* Chevrons on hover (hidden when dragging) */}
diff --git a/src/components/three/CameraPresets.tsx b/src/components/three/CameraPresets.tsx
index 98911fd..07406db 100644
--- a/src/components/three/CameraPresets.tsx
+++ b/src/components/three/CameraPresets.tsx
@@ -23,7 +23,9 @@ export function CameraPresets({ cameraControlsRef }: CameraPresetsProps) {
 	// Hide camera preset buttons on mobile — no dedicated 3D pane
 	if (isMobile) return null;
 
-	function handlePresetClick(presetKey: (typeof PRESET_BUTTONS)[number]["key"]) {
+	function handlePresetClick(
+		presetKey: (typeof PRESET_BUTTONS)[number]["key"],
+	) {
 		const ctrl = cameraControlsRef.current;
 		if (!ctrl) return;
 
diff --git a/src/components/three/FlowPath.tsx b/src/components/three/FlowPath.tsx
index 27578ff..0d832ad 100644
--- a/src/components/three/FlowPath.tsx
+++ b/src/components/three/FlowPath.tsx
@@ -49,8 +49,8 @@ export function FlowPath() {
 							anchorY="middle"
 							outlineWidth={0.03}
 							outlineColor={uvMode ? "#0A0A1A" : "black"}
-						fillOpacity={flowPathLayer.opacity}
-						outlineOpacity={flowPathLayer.opacity}
+							fillOpacity={flowPathLayer.opacity}
+							outlineOpacity={flowPathLayer.opacity}
 						>
 							{index + 1}
 						</Text>
diff --git a/src/components/three/HallFloor.tsx b/src/components/three/HallFloor.tsx
index d722c36..17a38c5 100644
--- a/src/components/three/HallFloor.tsx
+++ b/src/components/three/HallFloor.tsx
@@ -46,10 +46,7 @@ export function getFloorUVRepeat(
 	hallWidth: number,
 	hallLength: number,
 ): [number, number] {
-	return [
-		hallWidth / CONCRETE_TILE_SIZE,
-		hallLength / CONCRETE_TILE_SIZE,
-	];
+	return [hallWidth / CONCRETE_TILE_SIZE, hallLength / CONCRETE_TILE_SIZE];
 }
 
 // --- Components ---
diff --git a/src/components/three/HallWalls.tsx b/src/components/three/HallWalls.tsx
index f3cfde9..dc3cde8 100644
--- a/src/components/three/HallWalls.tsx
+++ b/src/components/three/HallWalls.tsx
@@ -195,9 +195,7 @@ type HallWallsOuterProps = {
 };
 
 export function HallWalls({ layerOpacity = 1 }: HallWallsOuterProps) {
-	const { width, length, wallHeight, wallThickness } = useStore(
-		(s) => s.hall,
-	);
+	const { width, length, wallHeight, wallThickness } = useStore((s) => s.hall);
 	const uvMode = useStore((s) => s.ui.uvMode);
 	const gpuTier = useStore((s) => s.ui.gpuTier);
 	const groupRef = useRef<THREE.Group>(null);
diff --git a/src/components/three/MiniGolfHole.tsx b/src/components/three/MiniGolfHole.tsx
index d0b3bd6..33c6c82 100644
--- a/src/components/three/MiniGolfHole.tsx
+++ b/src/components/three/MiniGolfHole.tsx
@@ -193,8 +193,7 @@ export function MiniGolfHole({
 				position={[0, INTERACTION_HEIGHT / 2, 0]}
 				onClick={(e) => {
 					if (layerLocked) return;
-					if (viewportInfo && !isEventForThisViewport(e, viewportInfo))
-						return;
+					if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
 					e.stopPropagation();
 					if (tool === "delete") {
 						removeHole(hole.id);
@@ -207,14 +206,12 @@ export function MiniGolfHole({
 				onPointerUp={handlePointerUp}
 				onPointerEnter={(e) => {
 					if (layerLocked) return;
-					if (viewportInfo && !isEventForThisViewport(e, viewportInfo))
-						return;
+					if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
 					setIsHovered(true);
 				}}
 				onPointerLeave={(e) => {
 					if (layerLocked) return;
-					if (viewportInfo && !isEventForThisViewport(e, viewportInfo))
-						return;
+					if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
 					setIsHovered(false);
 				}}
 			>
diff --git a/src/components/three/PlacementHandler.tsx b/src/components/three/PlacementHandler.tsx
index 0818a8d..3c0e475 100644
--- a/src/components/three/PlacementHandler.tsx
+++ b/src/components/three/PlacementHandler.tsx
@@ -75,7 +75,8 @@ export function PlacementHandler() {
 	const pointerDownWorld = useRef<{ x: number; z: number } | null>(null);
 	const viewportInfo = useViewportInfo();
 
-	const isPlacing = tool === "place" && (placingType != null || placingTemplateId != null);
+	const isPlacing =
+		tool === "place" && (placingType != null || placingTemplateId != null);
 
 	// Derive dimensions for placement boundary clamping and collision
 	const placingDimensions = useMemo(() => {
@@ -202,15 +203,17 @@ export function PlacementHandler() {
 				<planeGeometry args={[hall.width, hall.length]} />
 				<meshBasicMaterial transparent opacity={0} />
 			</mesh>
-			{isPlacing && ghostPos && (placingType != null || placingTemplateId != null) && (
-				<GhostHole
-					type={placingType ?? "straight"}
-					position={ghostPos}
-					rotation={0}
-					isValid={ghostValid}
-					templateId={placingTemplateId ?? undefined}
-				/>
-			)}
+			{isPlacing &&
+				ghostPos &&
+				(placingType != null || placingTemplateId != null) && (
+					<GhostHole
+						type={placingType ?? "straight"}
+						position={ghostPos}
+						rotation={0}
+						isValid={ghostValid}
+						templateId={placingTemplateId ?? undefined}
+					/>
+				)}
 		</>
 	);
 }
diff --git a/src/components/three/PostProcessing.tsx b/src/components/three/PostProcessing.tsx
index 7c13cd6..93d9a2d 100644
--- a/src/components/three/PostProcessing.tsx
+++ b/src/components/three/PostProcessing.tsx
@@ -28,8 +28,7 @@ export default function PostProcessing() {
 	// PostProcessing (EffectComposer) cannot be scoped to a single View.
 	// Only render in 3d-only mode (fullscreen 3D pane).
 	if (!shouldEnablePostProcessing(viewportLayout)) return null;
-	const showGodRays =
-		gpuTier === "high" && godRaysLampRef?.current != null;
+	const showGodRays = gpuTier === "high" && godRaysLampRef?.current != null;
 
 	if (gpuTier === "high") {
 		return (
diff --git a/src/components/three/ScreenshotCapture.tsx b/src/components/three/ScreenshotCapture.tsx
index 73cd524..ee7b5e9 100644
--- a/src/components/three/ScreenshotCapture.tsx
+++ b/src/components/three/ScreenshotCapture.tsx
@@ -53,26 +53,20 @@ export function ScreenshotCapture() {
 			for (let y = 0; y < height; y++) {
 				const srcRow = (height - y - 1) * width * 4;
 				const dstRow = y * width * 4;
-				imageData.data.set(
-					buffer.subarray(srcRow, srcRow + width * 4),
-					dstRow,
-				);
+				imageData.data.set(buffer.subarray(srcRow, srcRow + width * 4), dstRow);
 			}
 			ctx.putImageData(imageData, 0, 0);
 
-			canvas.toBlob(
-				(blob) => {
-					if (blob) {
-						const url = URL.createObjectURL(blob);
-						const a = document.createElement("a");
-						a.href = url;
-						a.download = `golf-plan-${Date.now()}.png`;
-						a.click();
-						URL.revokeObjectURL(url);
-					}
-				},
-				"image/png",
-			);
+			canvas.toBlob((blob) => {
+				if (blob) {
+					const url = URL.createObjectURL(blob);
+					const a = document.createElement("a");
+					a.href = url;
+					a.download = `golf-plan-${Date.now()}.png`;
+					a.click();
+					URL.revokeObjectURL(url);
+				}
+			}, "image/png");
 
 			// Clean up render target
 			renderTarget.dispose();
diff --git a/src/components/three/SharedScene.tsx b/src/components/three/SharedScene.tsx
index 05a5793..9a3b2c2 100644
--- a/src/components/three/SharedScene.tsx
+++ b/src/components/three/SharedScene.tsx
@@ -7,8 +7,6 @@ import { Hall } from "./Hall";
 import { PlacedHoles } from "./PlacedHoles";
 import { SunIndicator } from "./SunIndicator";
 import { ArchitecturalFloorPlan } from "./architectural/ArchitecturalFloorPlan";
-// Temporary spike — remove in Section 10
-import { RenderingSpike } from "./architectural/RenderingSpike";
 
 type SharedSceneProps = {
 	sunData: SunData;
@@ -34,14 +32,10 @@ export function SharedScene({ sunData }: SharedSceneProps) {
 					position={
 						sunData
 							? [
-									-Math.sin(sunData.azimuth) *
-										Math.cos(sunData.altitude) *
-										30 +
+									-Math.sin(sunData.azimuth) * Math.cos(sunData.altitude) * 30 +
 										5,
 									Math.sin(sunData.altitude) * 30,
-									Math.cos(sunData.azimuth) *
-										Math.cos(sunData.altitude) *
-										30 +
+									Math.cos(sunData.azimuth) * Math.cos(sunData.altitude) * 30 +
 										10,
 								]
 							: [10, 20, 5]
@@ -64,8 +58,6 @@ export function SharedScene({ sunData }: SharedSceneProps) {
 			<FloorGrid />
 			<ArchitecturalFloorPlan />
 			<SunIndicator sunData={sunData} />
-			{/* Temporary spike — remove in Section 10 */}
-			<RenderingSpike />
 		</>
 	);
 }
diff --git a/src/components/three/UVLamps.tsx b/src/components/three/UVLamps.tsx
index de00943..7767334 100644
--- a/src/components/three/UVLamps.tsx
+++ b/src/components/three/UVLamps.tsx
@@ -21,7 +21,11 @@ const fixtureMaterial = new THREE.MeshStandardMaterial({
 });
 
 const LAMP_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0];
-const FIXTURE_ARGS: [number, number, number] = [UV_LAMP_WIDTH, 0.05, UV_LAMP_HEIGHT];
+const FIXTURE_ARGS: [number, number, number] = [
+	UV_LAMP_WIDTH,
+	0.05,
+	UV_LAMP_HEIGHT,
+];
 
 export function UVLamps() {
 	const view = useStore((s) => s.ui.view);
diff --git a/src/components/three/UVTransition.tsx b/src/components/three/UVTransition.tsx
index 9b3da21..4b15ab8 100644
--- a/src/components/three/UVTransition.tsx
+++ b/src/components/three/UVTransition.tsx
@@ -30,8 +30,7 @@ export function UVTransition() {
 			if (elapsed < FLICKER_END) {
 				// Phase 1: Flicker — sine-based opacity oscillation
 				const t = elapsed / FLICKER_END;
-				const flicker =
-					Math.sin(t * Math.PI * 6) * 0.3 + t * 0.5;
+				const flicker = Math.sin(t * Math.PI * 6) * 0.3 + t * 0.5;
 				el.style.opacity = String(Math.max(0, Math.min(0.7, flicker)));
 			} else if (elapsed < DARKNESS_END) {
 				// Phase 2: Darkness — ramp to near-black
diff --git a/src/components/three/architectural/ArchitecturalGrid2D.tsx b/src/components/three/architectural/ArchitecturalGrid2D.tsx
index 56e130a..d3b7d44 100644
--- a/src/components/three/architectural/ArchitecturalGrid2D.tsx
+++ b/src/components/three/architectural/ArchitecturalGrid2D.tsx
@@ -65,14 +65,12 @@ export function ArchitecturalGrid2D() {
 	});
 
 	const { camera } = useThree();
-	const currentZoom =
-		"zoom" in camera ? (camera as { zoom: number }).zoom : 40;
+	const currentZoom = "zoom" in camera ? (camera as { zoom: number }).zoom : 40;
 	// eslint-disable-next-line react-hooks/exhaustive-deps -- zoomBand triggers recalc
 	const spacing = useMemo(() => computeGridSpacing(currentZoom), [zoomBand]);
 
 	const majorPoints = useMemo(
-		() =>
-			computeGridLineSegments(hallWidth, hallLength, spacing.majorSpacing),
+		() => computeGridLineSegments(hallWidth, hallLength, spacing.majorSpacing),
 		[hallWidth, hallLength, spacing.majorSpacing],
 	);
 
diff --git a/src/components/three/architectural/ArchitecturalWalls2D.tsx b/src/components/three/architectural/ArchitecturalWalls2D.tsx
index d5b9726..98f716a 100644
--- a/src/components/three/architectural/ArchitecturalWalls2D.tsx
+++ b/src/components/three/architectural/ArchitecturalWalls2D.tsx
@@ -16,9 +16,7 @@ const COLORS = {
 	uv: { fill: "#1A1A2E", outline: "#2A2A5E" },
 } as const;
 
-function rectToOutlineSegments(
-	rect: WallRect,
-): [number, number, number][] {
+function rectToOutlineSegments(rect: WallRect): [number, number, number][] {
 	const [cx, cy, cz] = rect.position;
 	const [w, d] = rect.size;
 	const hw = w / 2;
@@ -37,7 +35,9 @@ const noRaycast = () => {};
 
 export function ArchitecturalWalls2D({
 	outlineOnly = false,
-}: { outlineOnly?: boolean }) {
+}: {
+	outlineOnly?: boolean;
+}) {
 	const groupRef = useRef<Group>(null);
 	const { width, length, doors, windows } = useStore((s) => s.hall);
 	const uvMode = useStore((s) => s.ui.uvMode);
diff --git a/src/components/three/architectural/HoleFelt2D.tsx b/src/components/three/architectural/HoleFelt2D.tsx
index db1f608..8da2f3d 100644
--- a/src/components/three/architectural/HoleFelt2D.tsx
+++ b/src/components/three/architectural/HoleFelt2D.tsx
@@ -77,10 +77,7 @@ export function HoleFelt2D({ hole, width, length, color }: HoleFelt2DProps) {
 
 	const lod = useZoomLodFallback();
 
-	const feltMaterial = useMemo(
-		() => createFeltMaterial(fill),
-		[fill],
-	);
+	const feltMaterial = useMemo(() => createFeltMaterial(fill), [fill]);
 
 	const solidMaterial = useMemo(
 		() => new THREE.MeshBasicMaterial({ color: fill }),
diff --git a/src/components/three/architectural/RenderingSpike.tsx b/src/components/three/architectural/RenderingSpike.tsx
deleted file mode 100644
index 475b15c..0000000
--- a/src/components/three/architectural/RenderingSpike.tsx
+++ /dev/null
@@ -1,121 +0,0 @@
-import { Line, Text } from "@react-three/drei";
-import { useFrame } from "@react-three/fiber";
-import { useRef } from "react";
-import type { Mesh, OrthographicCamera } from "three";
-import { useViewportInfo } from "../../../contexts/ViewportContext";
-import { useStore } from "../../../store";
-
-const WALL_W = 3;
-const WALL_D = 0.2;
-const Y = 0.02;
-const ARC_SEGMENTS = 24;
-const ARC_RADIUS = 2;
-
-const COLORS = {
-	planning: {
-		wallFill: "#3a3a3a",
-		wallOutline: "#222222",
-		arc: "#555555",
-		text: "#333333",
-	},
-	uv: {
-		wallFill: "#1A1A2E",
-		wallOutline: "#2A2A5E",
-		arc: "#3A3A6E",
-		text: "#9999CC",
-	},
-} as const;
-
-function buildArcPoints(
-	cx: number,
-	cz: number,
-): [number, number, number][] {
-	const pts: [number, number, number][] = [];
-	for (let i = 0; i <= ARC_SEGMENTS; i++) {
-		const angle = (Math.PI / 2) * (i / ARC_SEGMENTS);
-		pts.push([cx + ARC_RADIUS * Math.cos(angle), Y, cz + ARC_RADIUS * Math.sin(angle)]);
-	}
-	return pts;
-}
-
-function buildRectOutline(
-	cx: number,
-	cz: number,
-	w: number,
-	d: number,
-): [number, number, number][] {
-	const hw = w / 2;
-	const hd = d / 2;
-	return [
-		[cx - hw, Y, cz - hd],
-		[cx + hw, Y, cz - hd],
-		[cx + hw, Y, cz + hd],
-		[cx - hw, Y, cz + hd],
-		[cx - hw, Y, cz - hd],
-	];
-}
-
-const noopRaycast = () => {};
-
-export function RenderingSpike() {
-	const viewport = useViewportInfo();
-	const uvMode = useStore((s) => s.ui.uvMode);
-	const textRef = useRef<Mesh>(null);
-
-	useFrame(({ camera }) => {
-		if (textRef.current && "zoom" in camera) {
-			const zoom = (camera as OrthographicCamera).zoom;
-			textRef.current.scale.setScalar(1 / zoom);
-		}
-	});
-
-	if (viewport?.id !== "2d") return null;
-
-	const c = uvMode ? COLORS.uv : COLORS.planning;
-	const cx = 5; // hall center X (10m / 2)
-	const cz = 10; // hall center Z (20m / 2)
-
-	const rectOutline = buildRectOutline(cx, cz - 2, WALL_W, WALL_D);
-	const arcPoints = buildArcPoints(cx - 1, cz + 1);
-
-	return (
-		<group>
-			{/* Wall rectangle: solid fill + outline */}
-			<mesh
-				raycast={noopRaycast}
-				position={[cx, Y, cz - 2]}
-				rotation={[-Math.PI / 2, 0, 0]}
-			>
-				<planeGeometry args={[WALL_W, WALL_D]} />
-				<meshBasicMaterial color={c.wallFill} />
-			</mesh>
-			<Line
-				points={rectOutline}
-				color={c.wallOutline}
-				lineWidth={2}
-				worldUnits={false}
-			/>
-
-			{/* Door swing arc */}
-			<Line
-				points={arcPoints}
-				color={c.arc}
-				lineWidth={1.5}
-				worldUnits={false}
-			/>
-
-			{/* Text label with inverse-zoom scaling */}
-			<Text
-				ref={textRef}
-				position={[cx, Y, cz + 4]}
-				rotation={[-Math.PI / 2, 0, 0]}
-				fontSize={12}
-				color={c.text}
-				anchorX="center"
-				anchorY="middle"
-			>
-				Sample Label
-			</Text>
-		</group>
-	);
-}
diff --git a/src/components/three/holes/Cup.tsx b/src/components/three/holes/Cup.tsx
index 230ec1d..608fa98 100644
--- a/src/components/three/holes/Cup.tsx
+++ b/src/components/three/holes/Cup.tsx
@@ -24,11 +24,20 @@ export function Cup({ position, material, showFlag = true }: CupProps) {
 	const flagClothGeom = useMemo(() => new THREE.PlaneGeometry(0.03, 0.02), []);
 
 	const flagPinMat = useMemo(
-		() => new THREE.MeshStandardMaterial({ color: "#E0E0E0", metalness: 0.8, roughness: 0.2 }),
+		() =>
+			new THREE.MeshStandardMaterial({
+				color: "#E0E0E0",
+				metalness: 0.8,
+				roughness: 0.2,
+			}),
 		[],
 	);
 	const flagClothMat = useMemo(
-		() => new THREE.MeshStandardMaterial({ color: FLAG_COLOR, side: THREE.DoubleSide }),
+		() =>
+			new THREE.MeshStandardMaterial({
+				color: FLAG_COLOR,
+				side: THREE.DoubleSide,
+			}),
 		[],
 	);
 
diff --git a/src/components/three/holes/HoleDogleg.tsx b/src/components/three/holes/HoleDogleg.tsx
index 754ff8d..7fb04f0 100644
--- a/src/components/three/holes/HoleDogleg.tsx
+++ b/src/components/three/holes/HoleDogleg.tsx
@@ -8,7 +8,13 @@ import { useMaterials } from "./useMaterials";
 const LANE_WIDTH = 0.6;
 const OFFSET = 0.15;
 
-export function HoleDogleg({ width, length }: { width: number; length: number }) {
+export function HoleDogleg({
+	width,
+	length,
+}: {
+	width: number;
+	length: number;
+}) {
 	const { felt, bumper, tee, cup } = useMaterials();
 	const halfW = width / 2;
 	const halfL = length / 2;
@@ -50,8 +56,16 @@ export function HoleDogleg({ width, length }: { width: number; length: number })
 			</mesh>
 
 			{/* Outer bumpers */}
-			<BumperRail length={length} position={[-halfW + BT / 2, ST, -halfL]} material={bumper} />
-			<BumperRail length={length} position={[halfW - BT / 2, ST, -halfL]} material={bumper} />
+			<BumperRail
+				length={length}
+				position={[-halfW + BT / 2, ST, -halfL]}
+				material={bumper}
+			/>
+			<BumperRail
+				length={length}
+				position={[halfW - BT / 2, ST, -halfL]}
+				material={bumper}
+			/>
 			{/* End bumpers */}
 			<BumperRail
 				length={width}
@@ -69,13 +83,21 @@ export function HoleDogleg({ width, length }: { width: number; length: number })
 			{/* Guide bumpers at bends */}
 			<BumperRail
 				length={guideBumperLen}
-				position={[OFFSET + LANE_WIDTH / 2 + BT / 2, ST, zBend1 - guideBumperLen / 2]}
+				position={[
+					OFFSET + LANE_WIDTH / 2 + BT / 2,
+					ST,
+					zBend1 - guideBumperLen / 2,
+				]}
 				height={guideBumperH}
 				material={bumper}
 			/>
 			<BumperRail
 				length={guideBumperLen}
-				position={[-OFFSET - LANE_WIDTH / 2 - BT / 2, ST, zBend2 - guideBumperLen / 2]}
+				position={[
+					-OFFSET - LANE_WIDTH / 2 - BT / 2,
+					ST,
+					zBend2 - guideBumperLen / 2,
+				]}
 				height={guideBumperH}
 				material={bumper}
 			/>
diff --git a/src/components/three/holes/HoleLShape.tsx b/src/components/three/holes/HoleLShape.tsx
index 61aa3aa..2b006d6 100644
--- a/src/components/three/holes/HoleLShape.tsx
+++ b/src/components/three/holes/HoleLShape.tsx
@@ -34,7 +34,11 @@ export function HoleLShape({ width, length }: Props) {
 			</mesh>
 
 			{/* Right wall — full length */}
-			<BumperRail length={length} position={[halfW - BT / 2, ST, -halfL]} material={bumper} />
+			<BumperRail
+				length={length}
+				position={[halfW - BT / 2, ST, -halfL]}
+				material={bumper}
+			/>
 			{/* Bottom wall — entry lane at -Z */}
 			<BumperRail
 				length={LANE_WIDTH}
diff --git a/src/components/three/holes/HoleStraight.tsx b/src/components/three/holes/HoleStraight.tsx
index 2d61e0e..a3cbfab 100644
--- a/src/components/three/holes/HoleStraight.tsx
+++ b/src/components/three/holes/HoleStraight.tsx
@@ -33,7 +33,11 @@ export function HoleStraight({ width, length }: Props) {
 			/>
 			<BumperRail
 				length={laneW}
-				position={[-laneW / 2, SURFACE_THICKNESS, -halfL + BUMPER_THICKNESS / 2]}
+				position={[
+					-laneW / 2,
+					SURFACE_THICKNESS,
+					-halfL + BUMPER_THICKNESS / 2,
+				]}
 				rotation={[0, -Math.PI / 2, 0]}
 				material={bumper}
 			/>
diff --git a/src/components/three/holes/TeePad.tsx b/src/components/three/holes/TeePad.tsx
index 427b0f9..12a87c6 100644
--- a/src/components/three/holes/TeePad.tsx
+++ b/src/components/three/holes/TeePad.tsx
@@ -19,5 +19,11 @@ export function TeePad({ position, material }: TeePadProps) {
 
 	const [px, , pz] = position;
 
-	return <mesh geometry={geom} material={material} position={[px, SURFACE_THICKNESS + 0.0015, pz]} />;
+	return (
+		<mesh
+			geometry={geom}
+			material={material}
+			position={[px, SURFACE_THICKNESS + 0.0015, pz]}
+		/>
+	);
 }
diff --git a/src/components/three/holes/TemplateHoleModel.tsx b/src/components/three/holes/TemplateHoleModel.tsx
index 60d8e61..062e0ca 100644
--- a/src/components/three/holes/TemplateHoleModel.tsx
+++ b/src/components/three/holes/TemplateHoleModel.tsx
@@ -52,9 +52,7 @@ function SegmentMesh({
 			<mesh geometry={geometries.felt} material={materials.felt} />
 			<mesh geometry={geometries.bumperLeft} material={materials.bumper} />
 			<mesh geometry={geometries.bumperRight} material={materials.bumper} />
-			{isFirst && (
-				<TeePad position={[0, 0, 0]} material={materials.tee} />
-			)}
+			{isFirst && <TeePad position={[0, 0, 0]} material={materials.tee} />}
 			{isLast && (
 				<Cup
 					position={[spec.exitPoint.x, 0, spec.exitPoint.z]}
diff --git a/src/components/three/holes/useTexturedMaterials.tsx b/src/components/three/holes/useTexturedMaterials.tsx
index d1bdb46..8114dab 100644
--- a/src/components/three/holes/useTexturedMaterials.tsx
+++ b/src/components/three/holes/useTexturedMaterials.tsx
@@ -149,7 +149,9 @@ export function useTexturedMaterials(): MaterialSet {
  */
 export function TexturedMaterialsProvider({
 	children,
-}: { children: ReactNode }) {
+}: {
+	children: ReactNode;
+}) {
 	const materials = useTexturedMaterials();
 	return (
 		<TexturedMaterialsContext.Provider value={materials}>
diff --git a/src/components/ui/BottomToolbar.tsx b/src/components/ui/BottomToolbar.tsx
index 0d4ab81..63595b0 100644
--- a/src/components/ui/BottomToolbar.tsx
+++ b/src/components/ui/BottomToolbar.tsx
@@ -194,13 +194,23 @@ function OverflowPopover({ onClose }: { onClose: () => void }) {
 			{/* Popover */}
 			<div className="absolute bottom-16 right-2 z-50 grid grid-cols-2 gap-2 rounded-lg border border-subtle bg-surface-raised p-3 shadow-lg">
 				<ToggleBtn label="Snap" active={snapEnabled} onTap={toggleSnap} />
-				<ToggleBtn label="Flow" active={flowPathVisible} onTap={() => toggleLayerVisible("flowPath")} />
+				<ToggleBtn
+					label="Flow"
+					active={flowPathVisible}
+					onTap={() => toggleLayerVisible("flowPath")}
+				/>
 				<ToggleBtn
 					label={view === "top" ? "3D" : "2D"}
 					active={false}
 					onTap={() => setView(view === "top" ? "3d" : "top")}
 				/>
-				<ToggleBtn label="UV" active={uvMode} onTap={toggleUvMode} disabled={transitioning} className={uvMode && !transitioning ? "uv-button-pulse" : ""} />
+				<ToggleBtn
+					label="UV"
+					active={uvMode}
+					onTap={toggleUvMode}
+					disabled={transitioning}
+					className={uvMode && !transitioning ? "uv-button-pulse" : ""}
+				/>
 				<ToggleBtn
 					label="Sun"
 					active={false}
@@ -285,9 +295,7 @@ function ToggleBtn({
 			onClick={onTap}
 			disabled={disabled}
 			className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
-				active
-					? "bg-accent-text text-white"
-					: "bg-plasma text-text-secondary"
+				active ? "bg-accent-text text-white" : "bg-plasma text-text-secondary"
 			}${disabled ? " opacity-50" : ""}${extraClass ? ` ${extraClass}` : ""}`}
 		>
 			{label}
diff --git a/src/components/ui/BudgetPanel.tsx b/src/components/ui/BudgetPanel.tsx
index 448a14a..4e00225 100644
--- a/src/components/ui/BudgetPanel.tsx
+++ b/src/components/ui/BudgetPanel.tsx
@@ -460,7 +460,9 @@ export function BudgetPanel() {
 												</select>
 											</label>
 											<label className="flex flex-col gap-0.5">
-												<span className="text-[10px] text-text-muted">Notes</span>
+												<span className="text-[10px] text-text-muted">
+													Notes
+												</span>
 												<textarea
 													value={cat.notes}
 													onChange={(e) =>
diff --git a/src/components/ui/CostSettingsModal.tsx b/src/components/ui/CostSettingsModal.tsx
index 6fb2202..3edeab9 100644
--- a/src/components/ui/CostSettingsModal.tsx
+++ b/src/components/ui/CostSettingsModal.tsx
@@ -104,18 +104,13 @@ export function CostSettingsModal({ onClose }: Props) {
 							value={materialProfile}
 							onChange={(e) =>
 								setBudgetConfig({
-									materialProfile: e.target
-										.value as MaterialProfile,
+									materialProfile: e.target.value as MaterialProfile,
 								})
 							}
 							className="rounded border border-subtle px-2 py-1 text-xs"
 						>
-							<option value="budget_diy">
-								Budget DIY (0.65x)
-							</option>
-							<option value="standard_diy">
-								Standard DIY (1.0x)
-							</option>
+							<option value="budget_diy">Budget DIY (0.65x)</option>
+							<option value="standard_diy">Standard DIY (1.0x)</option>
 							<option value="semi_pro">Semi-Pro (1.8x)</option>
 						</select>
 					</div>
diff --git a/src/components/ui/CourseBreakdown.tsx b/src/components/ui/CourseBreakdown.tsx
index ee3aa80..c0da328 100644
--- a/src/components/ui/CourseBreakdown.tsx
+++ b/src/components/ui/CourseBreakdown.tsx
@@ -122,7 +122,9 @@ export function CourseBreakdown({ onOpenSettings }: Props) {
 						<span className="font-medium text-primary">
 							Course total ({holeCount} holes)
 						</span>
-						<span className="font-mono font-semibold text-neon-amber">{formatEur(courseCost)}</span>
+						<span className="font-mono font-semibold text-neon-amber">
+							{formatEur(courseCost)}
+						</span>
 					</div>
 
 					{manualOverride && (
diff --git a/src/components/ui/FinancialSettingsModal.tsx b/src/components/ui/FinancialSettingsModal.tsx
index de4ac98..82f56c4 100644
--- a/src/components/ui/FinancialSettingsModal.tsx
+++ b/src/components/ui/FinancialSettingsModal.tsx
@@ -133,7 +133,9 @@ export function FinancialSettingsModal({ onClose }: Props) {
 									}`}
 								>
 									<span className="text-xs font-medium">{opt.label}</span>
-									<span className="text-[10px] text-text-muted">{opt.desc}</span>
+									<span className="text-[10px] text-text-muted">
+										{opt.desc}
+									</span>
 								</button>
 							))}
 						</div>
@@ -157,7 +159,9 @@ export function FinancialSettingsModal({ onClose }: Props) {
 									}`}
 								>
 									<span className="text-xs font-medium">{opt.label}</span>
-									<span className="text-[10px] text-text-muted">{opt.desc}</span>
+									<span className="text-[10px] text-text-muted">
+										{opt.desc}
+									</span>
 								</button>
 							))}
 						</div>
@@ -217,9 +221,7 @@ export function FinancialSettingsModal({ onClose }: Props) {
 											: "bg-surface text-text-secondary hover:bg-plasma"
 									}`}
 								>
-									{opt.value === "auto"
-										? `Auto (${gpuTier})`
-										: opt.label}
+									{opt.value === "auto" ? `Auto (${gpuTier})` : opt.label}
 								</button>
 							))}
 						</div>
@@ -234,9 +236,7 @@ export function FinancialSettingsModal({ onClose }: Props) {
 							<input
 								type="checkbox"
 								checked={uvTransitionEnabled}
-								onChange={(e) =>
-									setUvTransitionEnabled(e.target.checked)
-								}
+								onChange={(e) => setUvTransitionEnabled(e.target.checked)}
 								className="h-4 w-4 rounded border-subtle"
 							/>
 							<span className="text-xs font-medium text-primary">
diff --git a/src/components/ui/HoleDetail.tsx b/src/components/ui/HoleDetail.tsx
index 1afadbd..e77ba44 100644
--- a/src/components/ui/HoleDetail.tsx
+++ b/src/components/ui/HoleDetail.tsx
@@ -25,7 +25,9 @@ export function HoleDetail() {
 	const orderIndex = holeOrder.indexOf(selectedId);
 
 	const swatchColor = template ? template.color : (definition?.color ?? "#999");
-	const headerLabel = template ? template.name : (definition?.label ?? hole.type);
+	const headerLabel = template
+		? template.name
+		: (definition?.label ?? hole.type);
 
 	let dimensionLabel: string;
 	if (template) {
@@ -122,10 +124,14 @@ export function HoleDetail() {
 			{template ? (
 				<div className="flex flex-col gap-1 rounded border border-subtle bg-surface-raised p-2">
 					<div className="text-xs text-text-secondary">
-						Template: <span className="font-medium text-primary">{template.name}</span>
+						Template:{" "}
+						<span className="font-medium text-primary">{template.name}</span>
 					</div>
 					<div className="text-xs text-text-secondary">
-						Segments: <span className="font-medium text-primary">{template.segments.length}</span>
+						Segments:{" "}
+						<span className="font-medium text-primary">
+							{template.segments.length}
+						</span>
 					</div>
 					<button
 						type="button"
diff --git a/src/components/ui/HoleLibrary.tsx b/src/components/ui/HoleLibrary.tsx
index 5d8e248..4556cf5 100644
--- a/src/components/ui/HoleLibrary.tsx
+++ b/src/components/ui/HoleLibrary.tsx
@@ -22,7 +22,9 @@ export function HoleLibrary() {
 
 	return (
 		<div className="flex flex-col gap-2">
-			<p className="text-xs font-medium text-text-secondary uppercase">Hole Types</p>
+			<p className="text-xs font-medium text-text-secondary uppercase">
+				Hole Types
+			</p>
 			{HOLE_TYPES.map((ht) => (
 				<button
 					key={ht.type}
diff --git a/src/components/ui/MobileDetailPanel.tsx b/src/components/ui/MobileDetailPanel.tsx
index 9f022a8..108dde1 100644
--- a/src/components/ui/MobileDetailPanel.tsx
+++ b/src/components/ui/MobileDetailPanel.tsx
@@ -23,7 +23,9 @@ export function MobileDetailPanel() {
 	const orderIndex = holeOrder.indexOf(selectedId);
 
 	const swatchColor = template ? template.color : (definition?.color ?? "#999");
-	const headerLabel = template ? template.name : (definition?.label ?? hole.type);
+	const headerLabel = template
+		? template.name
+		: (definition?.label ?? hole.type);
 
 	let dimensionLabel: string;
 	if (template) {
@@ -80,7 +82,9 @@ export function MobileDetailPanel() {
 				<div className="flex flex-col gap-5">
 					{/* Name */}
 					<label className="flex flex-col gap-1.5">
-						<span className="text-sm font-medium text-text-secondary">Name</span>
+						<span className="text-sm font-medium text-text-secondary">
+							Name
+						</span>
 						<input
 							type="text"
 							value={hole.name}
@@ -108,7 +112,9 @@ export function MobileDetailPanel() {
 
 					{/* Rotation — large preset buttons as primary */}
 					<div className="flex flex-col gap-1.5">
-						<span className="text-sm font-medium text-text-secondary">Rotation</span>
+						<span className="text-sm font-medium text-text-secondary">
+							Rotation
+						</span>
 						<div className="flex gap-2">
 							{[0, 90, 180, 270].map((r) => (
 								<button
@@ -148,7 +154,9 @@ export function MobileDetailPanel() {
 
 					{/* Dimensions (read-only) */}
 					{dimensionLabel ? (
-						<div className="text-sm text-text-muted">Size: {dimensionLabel}</div>
+						<div className="text-sm text-text-muted">
+							Size: {dimensionLabel}
+						</div>
 					) : null}
 
 					{/* Template info */}
@@ -156,7 +164,9 @@ export function MobileDetailPanel() {
 						<div className="flex flex-col gap-2 rounded-lg border border-subtle bg-surface-raised p-3">
 							<div className="text-sm text-text-secondary">
 								Template:{" "}
-								<span className="font-medium text-primary">{template.name}</span>
+								<span className="font-medium text-primary">
+									{template.name}
+								</span>
 							</div>
 							<div className="text-sm text-text-secondary">
 								Segments:{" "}
diff --git a/src/components/ui/MobileSunControls.tsx b/src/components/ui/MobileSunControls.tsx
index 6f68b1d..593b9a0 100644
--- a/src/components/ui/MobileSunControls.tsx
+++ b/src/components/ui/MobileSunControls.tsx
@@ -41,7 +41,9 @@ export function MobileSunControls() {
 				<div className="flex flex-col gap-4">
 					{/* Presets */}
 					<div className="flex flex-col gap-1.5">
-						<span className="text-sm font-medium text-text-secondary">Presets</span>
+						<span className="text-sm font-medium text-text-secondary">
+							Presets
+						</span>
 						<div className="flex gap-2">
 							{SUN_PRESETS.map(({ label, date }) => (
 								<button
@@ -80,7 +82,9 @@ export function MobileSunControls() {
 					{showCustom && (
 						<div className="flex flex-col gap-3">
 							<label className="flex flex-col gap-1.5">
-								<span className="text-sm font-medium text-text-secondary">Date</span>
+								<span className="text-sm font-medium text-text-secondary">
+									Date
+								</span>
 								<input
 									type="date"
 									defaultValue="2026-06-21"
@@ -97,7 +101,9 @@ export function MobileSunControls() {
 								/>
 							</label>
 							<label className="flex flex-col gap-1.5">
-								<span className="text-sm font-medium text-text-secondary">Time</span>
+								<span className="text-sm font-medium text-text-secondary">
+									Time
+								</span>
 								<input
 									type="time"
 									defaultValue="12:00"
diff --git a/src/components/ui/Sidebar.tsx b/src/components/ui/Sidebar.tsx
index a8cba75..15f477a 100644
--- a/src/components/ui/Sidebar.tsx
+++ b/src/components/ui/Sidebar.tsx
@@ -17,7 +17,10 @@ export function Sidebar() {
 	const setSidebarTab = useStore((s) => s.setSidebarTab);
 
 	return (
-		<div className="hidden h-full w-64 flex-col border-r border-subtle bg-surface-raised md:flex" data-testid="sidebar">
+		<div
+			className="hidden h-full w-64 flex-col border-r border-subtle bg-surface-raised md:flex"
+			data-testid="sidebar"
+		>
 			<div className="flex border-b border-subtle">
 				{tabs.map(({ tab, label }) => (
 					<button
diff --git a/src/components/ui/StatusBar.tsx b/src/components/ui/StatusBar.tsx
index 3b3300b..bdfb184 100644
--- a/src/components/ui/StatusBar.tsx
+++ b/src/components/ui/StatusBar.tsx
@@ -17,10 +17,8 @@ export function StatusBar({ sunData }: StatusBarProps) {
 
 	const has2D = viewportLayout !== "3d-only";
 	const scale = has2D ? computeScale(currentZoom) : "--";
-	const xDisplay =
-		has2D && mouseWorldPos ? mouseWorldPos.x.toFixed(2) : "--";
-	const zDisplay =
-		has2D && mouseWorldPos ? mouseWorldPos.z.toFixed(2) : "--";
+	const xDisplay = has2D && mouseWorldPos ? mouseWorldPos.x.toFixed(2) : "--";
+	const zDisplay = has2D && mouseWorldPos ? mouseWorldPos.z.toFixed(2) : "--";
 
 	return (
 		<div className="hidden border-t border-subtle bg-surface text-text-secondary md:block">
@@ -29,9 +27,7 @@ export function StatusBar({ sunData }: StatusBarProps) {
 				onClick={() => setExpanded(!expanded)}
 				className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-plasma transition-colors"
 			>
-				<span className="font-medium text-primary">
-					{LOCATION.address}
-				</span>
+				<span className="font-medium text-primary">{LOCATION.address}</span>
 				<span className="text-text-secondary">·</span>
 				<span>{LOCATION.elevation}m</span>
 				<span className="text-text-secondary">·</span>
@@ -60,9 +56,7 @@ export function StatusBar({ sunData }: StatusBarProps) {
 					<span>Scale: {scale}</span>
 				</span>
 
-				<span className="text-text-secondary">
-					{expanded ? "▾" : "▸"}
-				</span>
+				<span className="text-text-secondary">{expanded ? "▾" : "▸"}</span>
 			</button>
 			{expanded && (
 				<div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-subtle px-3 py-2 text-xs md:grid-cols-4">
@@ -75,17 +69,13 @@ export function StatusBar({ sunData }: StatusBarProps) {
 						<span>{LOCATION.region}</span>
 					</div>
 					<div>
-						<span className="text-text-secondary">
-							Coordinates:{" "}
-						</span>
+						<span className="text-text-secondary">Coordinates: </span>
 						<span>
 							{LOCATION.lat}°N, {LOCATION.lng}°E
 						</span>
 					</div>
 					<div>
-						<span className="text-text-secondary">
-							Elevation:{" "}
-						</span>
+						<span className="text-text-secondary">Elevation: </span>
 						<span>{LOCATION.elevation}m above sea level</span>
 					</div>
 					{sunData && (
@@ -93,9 +83,7 @@ export function StatusBar({ sunData }: StatusBarProps) {
 							<span className="text-text-secondary">Sun: </span>
 							<span
 								className={
-									sunData.isDay
-										? "text-amber-400"
-										: "text-text-secondary"
+									sunData.isDay ? "text-amber-400" : "text-text-secondary"
 								}
 							>
 								{sunData.isDay
diff --git a/src/components/ui/Toolbar.tsx b/src/components/ui/Toolbar.tsx
index 7fa5c2d..69b6316 100644
--- a/src/components/ui/Toolbar.tsx
+++ b/src/components/ui/Toolbar.tsx
@@ -1,9 +1,6 @@
 import { useStore } from "../../store";
 import type { Tool } from "../../types";
-import {
-	downloadSVG,
-	generateFloorPlanSVG,
-} from "../../utils/floorPlanExport";
+import { downloadSVG, generateFloorPlanSVG } from "../../utils/floorPlanExport";
 import { ExportButton } from "./ExportButton";
 import { SaveManager } from "./SaveManager";
 
@@ -39,7 +36,8 @@ export function Toolbar() {
 		downloadSVG(svg);
 	}
 
-	const barClass = "hidden items-center gap-1 border-b border-subtle bg-surface-raised px-3 py-2 md:flex";
+	const barClass =
+		"hidden items-center gap-1 border-b border-subtle bg-surface-raised px-3 py-2 md:flex";
 
 	const btnClass = (active: boolean) =>
 		`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
@@ -48,9 +46,11 @@ export function Toolbar() {
 				: "bg-plasma text-text-secondary hover:bg-grid-ghost"
 		}`;
 
-	const neutralBtnClass = "rounded bg-plasma px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-grid-ghost";
+	const neutralBtnClass =
+		"rounded bg-plasma px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-grid-ghost";
 
-	const smallBtnClass = "rounded bg-plasma px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-grid-ghost";
+	const smallBtnClass =
+		"rounded bg-plasma px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-grid-ghost";
 
 	const dividerClass = "mx-2 h-6 w-px bg-grid-ghost";
 
@@ -68,7 +68,12 @@ export function Toolbar() {
 
 	return (
 		<div className={barClass} data-testid="toolbar">
-			<span className="font-display text-sm font-bold tracking-wider text-accent-text" style={{ textShadow: "0 0 8px #9D00FF, 0 0 16px #9D00FF40" }}>GOLF FORGE</span>
+			<span
+				className="font-display text-sm font-bold tracking-wider text-accent-text"
+				style={{ textShadow: "0 0 8px #9D00FF, 0 0 16px #9D00FF40" }}
+			>
+				GOLF FORGE
+			</span>
 			<div className="mx-2 h-6 w-px bg-grid-ghost" />
 
 			{tools.map(({ tool, label, icon }) => (
diff --git a/src/hooks/useGroupOpacity.ts b/src/hooks/useGroupOpacity.ts
index 15af2c6..55cedff 100644
--- a/src/hooks/useGroupOpacity.ts
+++ b/src/hooks/useGroupOpacity.ts
@@ -6,7 +6,10 @@ import type { Group, Material, Mesh } from "three";
  * Stores original values and restores them on cleanup or when opacity returns to 1.
  */
 
-const originals = new WeakMap<Material, { transparent: boolean; opacity: number }>();
+const originals = new WeakMap<
+	Material,
+	{ transparent: boolean; opacity: number }
+>();
 
 function storeOriginal(mat: Material) {
 	if (!originals.has(mat)) {
diff --git a/src/hooks/useIsMobileViewport.ts b/src/hooks/useIsMobileViewport.ts
index e716fd8..8e492ef 100644
--- a/src/hooks/useIsMobileViewport.ts
+++ b/src/hooks/useIsMobileViewport.ts
@@ -14,8 +14,7 @@ export function useIsMobileViewport(): boolean {
 
 	useEffect(() => {
 		const mql = window.matchMedia(MOBILE_QUERY);
-		const handler = (e: MediaQueryListEvent) =>
-			setIsMobileViewport(!e.matches);
+		const handler = (e: MediaQueryListEvent) => setIsMobileViewport(!e.matches);
 		mql.addEventListener("change", handler);
 		return () => mql.removeEventListener("change", handler);
 	}, []);
diff --git a/src/hooks/useKeyboardControls.ts b/src/hooks/useKeyboardControls.ts
index 357ac80..6cc8597 100644
--- a/src/hooks/useKeyboardControls.ts
+++ b/src/hooks/useKeyboardControls.ts
@@ -155,8 +155,7 @@ export function useKeyboardControls({
 					}
 					case "f":
 					case "F": {
-						const { centerX, centerZ, rangeX, rangeZ } =
-							getHolesBoundingBox();
+						const { centerX, centerZ, rangeX, rangeZ } = getHolesBoundingBox();
 
 						ctrl2D.target.set(centerX, 0, centerZ);
 						camera.position.set(centerX, 50, centerZ);
@@ -264,8 +263,7 @@ export function useKeyboardControls({
 					}
 					case "f":
 					case "F": {
-						const { centerX, centerZ, rangeX, rangeZ } =
-							getHolesBoundingBox();
+						const { centerX, centerZ, rangeX, rangeZ } = getHolesBoundingBox();
 						const extent = Math.max(rangeX, rangeZ);
 						const distance = extent * 1.5;
 
diff --git a/src/hooks/useZoomLOD.ts b/src/hooks/useZoomLOD.ts
index dc03593..9c292e8 100644
--- a/src/hooks/useZoomLOD.ts
+++ b/src/hooks/useZoomLOD.ts
@@ -32,9 +32,7 @@ export function useZoomLOD(): React.RefObject<LODLevel> {
 
 	useFrame(({ camera }) => {
 		if ("zoom" in camera) {
-			lodRef.current = computeLODLevel(
-				(camera as { zoom: number }).zoom,
-			);
+			lodRef.current = computeLODLevel((camera as { zoom: number }).zoom);
 		}
 	});
 
diff --git a/src/store/selectors.ts b/src/store/selectors.ts
index dcd0011..3da89a9 100644
--- a/src/store/selectors.ts
+++ b/src/store/selectors.ts
@@ -24,8 +24,8 @@ export function selectCourseCost(state: Store): number {
 	const materialMultiplier =
 		buildMode === "professional"
 			? 1.0
-			: MATERIAL_PROFILE_MULTIPLIERS[state.budgetConfig.materialProfile] ??
-				1.0;
+			: (MATERIAL_PROFILE_MULTIPLIERS[state.budgetConfig.materialProfile] ??
+				1.0);
 
 	const raw = state.holeOrder.reduce(
 		(sum, id) => sum + (costMap[state.holes[id]?.type] ?? DEFAULT_HOLE_COST),
@@ -55,8 +55,8 @@ export function selectCourseBreakdown(state: Store): CourseBreakdownItem[] {
 	const materialMultiplier =
 		buildMode === "professional"
 			? 1.0
-			: MATERIAL_PROFILE_MULTIPLIERS[state.budgetConfig.materialProfile] ??
-				1.0;
+			: (MATERIAL_PROFILE_MULTIPLIERS[state.budgetConfig.materialProfile] ??
+				1.0);
 
 	const counts: Record<string, number> = {};
 	for (const id of state.holeOrder) {
diff --git a/src/store/store.ts b/src/store/store.ts
index 0081b27..fe1af60 100644
--- a/src/store/store.ts
+++ b/src/store/store.ts
@@ -348,7 +348,7 @@ export const useStore = create<Store>()(
 				ui: DEFAULT_UI,
 				captureScreenshot: null,
 				gpuTierOverride: "auto" as GpuTierOverride,
-			uvTransitionEnabled: true,
+				uvTransitionEnabled: true,
 				...BUILDER_INITIAL_STATE,
 				...createBuilderActions(set, get),
 
diff --git a/src/types/viewport.ts b/src/types/viewport.ts
index b96bd8e..d5ab471 100644
--- a/src/types/viewport.ts
+++ b/src/types/viewport.ts
@@ -8,12 +8,7 @@ export type CameraPreset =
 	| "right"
 	| "isometric";
 
-export type LayerId =
-	| "holes"
-	| "flowPath"
-	| "grid"
-	| "walls"
-	| "sunIndicator";
+export type LayerId = "holes" | "flowPath" | "grid" | "walls" | "sunIndicator";
 
 export type LayerState = {
 	visible: boolean;
diff --git a/src/utils/arcPoints.ts b/src/utils/arcPoints.ts
index 2548e84..0b00b4f 100644
--- a/src/utils/arcPoints.ts
+++ b/src/utils/arcPoints.ts
@@ -94,11 +94,7 @@ export function computeDoorArc(
 
 	const panelLine: [Point3, Point3] = [
 		[...hinge],
-		[
-			hinge[0] + radius * alongX,
-			Y,
-			hinge[2] + radius * alongZ,
-		],
+		[hinge[0] + radius * alongX, Y, hinge[2] + radius * alongZ],
 	];
 
 	return { arcPoints, panelLine };
diff --git a/src/utils/wallGeometry.ts b/src/utils/wallGeometry.ts
index 6ee4870..1d4948b 100644
--- a/src/utils/wallGeometry.ts
+++ b/src/utils/wallGeometry.ts
@@ -16,9 +16,7 @@ export type WallRect = {
 type Gap = { start: number; end: number };
 
 function getWallLength(wallSide: Wall, hallWidth: number, hallLength: number) {
-	return wallSide === "north" || wallSide === "south"
-		? hallWidth
-		: hallLength;
+	return wallSide === "north" || wallSide === "south" ? hallWidth : hallLength;
 }
 
 function mergeGaps(gaps: Gap[]): Gap[] {
diff --git a/tests/components/holes/loop.test.ts b/tests/components/holes/loop.test.ts
index a541f21..a133cd1 100644
--- a/tests/components/holes/loop.test.ts
+++ b/tests/components/holes/loop.test.ts
@@ -16,7 +16,11 @@ function createLoopCurve(): THREE.CatmullRomCurve3 {
 	for (let i = 0; i <= segments; i++) {
 		const t = (i / segments) * Math.PI;
 		points.push(
-			new THREE.Vector3(0, LOOP_RADIUS * Math.sin(t), -LOOP_RADIUS * Math.cos(t)),
+			new THREE.Vector3(
+				0,
+				LOOP_RADIUS * Math.sin(t),
+				-LOOP_RADIUS * Math.cos(t),
+			),
 		);
 	}
 	return new THREE.CatmullRomCurve3(points);
diff --git a/tests/components/holes/sharedComponents.test.ts b/tests/components/holes/sharedComponents.test.ts
index d46706e..1071c5e 100644
--- a/tests/components/holes/sharedComponents.test.ts
+++ b/tests/components/holes/sharedComponents.test.ts
@@ -25,9 +25,17 @@ describe("BumperRail shared component geometry", () => {
 		const long = createBumperGeometry(profile, 2.0);
 		short.computeBoundingBox();
 		long.computeBoundingBox();
-		const shortBB = short.boundingBox as { max: { z: number }; min: { z: number } };
-		const longBB = long.boundingBox as { max: { z: number }; min: { z: number } };
-		expect(longBB.max.z - longBB.min.z).toBeGreaterThan(shortBB.max.z - shortBB.min.z);
+		const shortBB = short.boundingBox as {
+			max: { z: number };
+			min: { z: number };
+		};
+		const longBB = long.boundingBox as {
+			max: { z: number };
+			min: { z: number };
+		};
+		expect(longBB.max.z - longBB.min.z).toBeGreaterThan(
+			shortBB.max.z - shortBB.min.z,
+		);
 	});
 
 	it("height matches BUMPER_HEIGHT (0.08)", () => {
diff --git a/tests/darkTheme.test.ts b/tests/darkTheme.test.ts
index 7a833d7..2596b40 100644
--- a/tests/darkTheme.test.ts
+++ b/tests/darkTheme.test.ts
@@ -18,7 +18,10 @@ function readTsxFiles(dir: string): { file: string; content: string }[] {
 		}));
 }
 
-function countMatches(files: { file: string; content: string }[], pattern: RegExp): string[] {
+function countMatches(
+	files: { file: string; content: string }[],
+	pattern: RegExp,
+): string[] {
 	const matches: string[] = [];
 	for (const { file, content } of files) {
 		const m = content.match(pattern);
@@ -39,28 +42,41 @@ describe("Dark Theme Conversion", () => {
 
 	it("no remaining bg-gray-50 or bg-gray-100 in UI/builder components", () => {
 		const matches = countMatches(allComponentFiles, /bg-gray-(?:50|100)\b/g);
-		expect(matches, `Found bg-gray-50/100 in: ${matches.join(", ")}`).toHaveLength(0);
+		expect(
+			matches,
+			`Found bg-gray-50/100 in: ${matches.join(", ")}`,
+		).toHaveLength(0);
 	});
 
 	it("no remaining bg-gray-200 backgrounds in UI components", () => {
 		const matches = countMatches(uiFiles, /bg-gray-200/g);
-		expect(matches, `Found bg-gray-200 in: ${matches.join(", ")}`).toHaveLength(0);
+		expect(matches, `Found bg-gray-200 in: ${matches.join(", ")}`).toHaveLength(
+			0,
+		);
 	});
 
 	it("no remaining text-gray-900/800/700 in UI components", () => {
 		const matches = countMatches(uiFiles, /text-gray-(?:900|800|700)\b/g);
-		expect(matches, `Found dark-on-light text in: ${matches.join(", ")}`).toHaveLength(0);
+		expect(
+			matches,
+			`Found dark-on-light text in: ${matches.join(", ")}`,
+		).toHaveLength(0);
 	});
 
 	it("no remaining border-gray-200 in UI components", () => {
 		const matches = countMatches(uiFiles, /border-gray-200/g);
-		expect(matches, `Found border-gray-200 in: ${matches.join(", ")}`).toHaveLength(0);
+		expect(
+			matches,
+			`Found border-gray-200 in: ${matches.join(", ")}`,
+		).toHaveLength(0);
 	});
 
 	it("no remaining uvMode ternaries in UI components", () => {
 		const uiAndToolbar = uiFiles;
 		const matches = countMatches(uiAndToolbar, /uvMode\s*\?/g);
-		expect(matches, `Found uvMode ? in UI: ${matches.join(", ")}`).toHaveLength(0);
+		expect(matches, `Found uvMode ? in UI: ${matches.join(", ")}`).toHaveLength(
+			0,
+		);
 	});
 
 	it("3D component files are allowed to have uvMode ternaries", () => {
diff --git a/tests/dataPanelStyling.test.ts b/tests/dataPanelStyling.test.ts
index 6b404ab..4fa7de6 100644
--- a/tests/dataPanelStyling.test.ts
+++ b/tests/dataPanelStyling.test.ts
@@ -66,22 +66,20 @@ describe("High-Contrast Data Panels", () => {
 	});
 
 	describe("no light-only classes remain", () => {
-		it.each(DATA_PANEL_FILES)(
-			"%s has no bg-gray-50 or bg-gray-100 classes",
-			(filePath) => {
-				const src = readSrc(filePath);
-				expect(src).not.toMatch(/bg-gray-(?:50|100)\b/);
-			},
-		);
+		it.each(
+			DATA_PANEL_FILES,
+		)("%s has no bg-gray-50 or bg-gray-100 classes", (filePath) => {
+			const src = readSrc(filePath);
+			expect(src).not.toMatch(/bg-gray-(?:50|100)\b/);
+		});
 	});
 
 	describe("contrast safety", () => {
-		it.each(DATA_PANEL_FILES)(
-			"%s does not use text-neon-violet for readable body text",
-			(filePath) => {
-				const src = readSrc(filePath);
-				expect(src).not.toMatch(/text-neon-violet/);
-			},
-		);
+		it.each(
+			DATA_PANEL_FILES,
+		)("%s does not use text-neon-violet for readable body text", (filePath) => {
+			const src = readSrc(filePath);
+			expect(src).not.toMatch(/text-neon-violet/);
+		});
 	});
 });
diff --git a/tests/godrays.test.ts b/tests/godrays.test.ts
index bfbb5c4..165985a 100644
--- a/tests/godrays.test.ts
+++ b/tests/godrays.test.ts
@@ -59,9 +59,9 @@ describe("GodRays source positions", () => {
 
 describe("GodRays ref wiring via getEffectsForTier", () => {
 	it("excludes godRays when hasGodRaysRef=false", () => {
-		expect(
-			getEffectsForTier("high", { hasGodRaysRef: false }),
-		).not.toContain("godRays");
+		expect(getEffectsForTier("high", { hasGodRaysRef: false })).not.toContain(
+			"godRays",
+		);
 	});
 
 	it("includes godRays when hasGodRaysRef=true on high tier", () => {
@@ -71,9 +71,9 @@ describe("GodRays ref wiring via getEffectsForTier", () => {
 	});
 
 	it("excludes godRays on mid tier even with hasGodRaysRef=true", () => {
-		expect(
-			getEffectsForTier("mid", { hasGodRaysRef: true }),
-		).not.toContain("godRays");
+		expect(getEffectsForTier("mid", { hasGodRaysRef: true })).not.toContain(
+			"godRays",
+		);
 	});
 });
 
diff --git a/tests/store/migration.test.ts b/tests/store/migration.test.ts
index 41fb669..139ab34 100644
--- a/tests/store/migration.test.ts
+++ b/tests/store/migration.test.ts
@@ -64,7 +64,7 @@ describe("v5 → v6 migration: holeTemplates and builderDraft fields", () => {
 		// Edge case: someone manually stored holeTemplates at version 5.
 		// The migration guard checks !("holeTemplates" in p), so it must not overwrite.
 		const existingTemplates = {
-			"t2": { id: "t2", name: "Existing", segments: [] },
+			t2: { id: "t2", name: "Existing", segments: [] },
 		};
 		const stateWithTemplates = {
 			...makeV5State(),
@@ -79,7 +79,7 @@ describe("v5 → v6 migration: holeTemplates and builderDraft fields", () => {
 
 	it("preserves holes after migration", () => {
 		const holes = {
-			"h1": {
+			h1: {
 				id: "h1",
 				type: "straight",
 				position: { x: 5, z: 3 },
@@ -96,7 +96,7 @@ describe("v5 → v6 migration: holeTemplates and builderDraft fields", () => {
 	it("preserves holeOrder after migration", () => {
 		const v5 = makeV5State({
 			holes: {
-				"h1": {
+				h1: {
 					id: "h1",
 					type: "straight",
 					position: { x: 1, z: 2 },
@@ -192,7 +192,7 @@ describe("full migration chain v3 → v6", () => {
 
 	it("preserves holes through full v3 → v6 chain", () => {
 		const holes = {
-			"h1": {
+			h1: {
 				id: "h1",
 				type: "curve",
 				position: { x: 3, z: 1 },
@@ -238,7 +238,7 @@ describe("v6 → v7 migration: gpuTierOverride field", () => {
 
 	it("preserves holeTemplates after v6 → v7 migration", () => {
 		const templates = {
-			"t1": { id: "t1", name: "Loop", segments: [] },
+			t1: { id: "t1", name: "Loop", segments: [] },
 		};
 		const v6 = makeV6State({ holeTemplates: templates });
 		const result = migratePersistedState(v6, 6) as Record<string, unknown>;
@@ -300,7 +300,7 @@ describe("v7 → v8 migration", () => {
 
 	it("preserves all v7 fields alongside new uvTransitionEnabled", () => {
 		const existingTemplates = {
-			"t1": { id: "t1", name: "T", segments: [] },
+			t1: { id: "t1", name: "T", segments: [] },
 		};
 		const v7 = {
 			...makeV6State(),
diff --git a/tests/utils/arcPoints.test.ts b/tests/utils/arcPoints.test.ts
index 40ec1ba..152dd31 100644
--- a/tests/utils/arcPoints.test.ts
+++ b/tests/utils/arcPoints.test.ts
@@ -23,20 +23,12 @@ describe("computeDoorArc", () => {
 	};
 
 	it("returns approximately 25 points for a quarter-circle (24 segments + 1)", () => {
-		const { arcPoints } = computeDoorArc(
-			sectionalDoor,
-			hallWidth,
-			hallLength,
-		);
+		const { arcPoints } = computeDoorArc(sectionalDoor, hallWidth, hallLength);
 		expect(arcPoints).toHaveLength(25);
 	});
 
 	it("first point is at door edge position (along wall)", () => {
-		const { arcPoints } = computeDoorArc(
-			sectionalDoor,
-			hallWidth,
-			hallLength,
-		);
+		const { arcPoints } = computeDoorArc(sectionalDoor, hallWidth, hallLength);
 		// Sectional door: hinge at X=3.25, arc starts at door edge X=6.75, Z=20
 		expect(arcPoints[0][0]).toBeCloseTo(6.75); // X = offset + width
 		expect(arcPoints[0][1]).toBeCloseTo(0.02); // Y
@@ -44,11 +36,7 @@ describe("computeDoorArc", () => {
 	});
 
 	it("last point is at perpendicular swing endpoint", () => {
-		const { arcPoints } = computeDoorArc(
-			sectionalDoor,
-			hallWidth,
-			hallLength,
-		);
+		const { arcPoints } = computeDoorArc(sectionalDoor, hallWidth, hallLength);
 		const last = arcPoints[arcPoints.length - 1];
 		// Sectional door swings outward (+Z): end at X=3.25, Z=20+3.5=23.5
 		expect(last[0]).toBeCloseTo(3.25);
@@ -57,11 +45,7 @@ describe("computeDoorArc", () => {
 	});
 
 	it("all points are at radius distance from hinge", () => {
-		const { arcPoints } = computeDoorArc(
-			sectionalDoor,
-			hallWidth,
-			hallLength,
-		);
+		const { arcPoints } = computeDoorArc(sectionalDoor, hallWidth, hallLength);
 		const hingeX = 3.25;
 		const hingeZ = 20.0;
 		const radius = 3.5;
@@ -74,11 +58,7 @@ describe("computeDoorArc", () => {
 	});
 
 	it("panel line goes from hinge to door edge", () => {
-		const { panelLine } = computeDoorArc(
-			sectionalDoor,
-			hallWidth,
-			hallLength,
-		);
+		const { panelLine } = computeDoorArc(sectionalDoor, hallWidth, hallLength);
 		expect(panelLine[0][0]).toBeCloseTo(3.25); // hinge X
 		expect(panelLine[0][2]).toBeCloseTo(20.0); // hinge Z
 		expect(panelLine[1][0]).toBeCloseTo(6.75); // edge X
@@ -86,11 +66,7 @@ describe("computeDoorArc", () => {
 	});
 
 	it("for inward-opening door (PVC), arc swings into the hall", () => {
-		const { arcPoints } = computeDoorArc(
-			pvcDoor,
-			hallWidth,
-			hallLength,
-		);
+		const { arcPoints } = computeDoorArc(pvcDoor, hallWidth, hallLength);
 		// PVC on south wall: inward means Z < hallLength
 		for (const pt of arcPoints) {
 			expect(pt[2]).toBeLessThanOrEqual(hallLength + 0.001);
@@ -98,11 +74,7 @@ describe("computeDoorArc", () => {
 	});
 
 	it("for outward-opening door (sectional), arc swings away from hall", () => {
-		const { arcPoints } = computeDoorArc(
-			sectionalDoor,
-			hallWidth,
-			hallLength,
-		);
+		const { arcPoints } = computeDoorArc(sectionalDoor, hallWidth, hallLength);
 		// Sectional on south wall: outward means Z >= hallLength
 		for (const pt of arcPoints) {
 			expect(pt[2]).toBeGreaterThanOrEqual(hallLength - 0.001);
@@ -186,9 +158,7 @@ describe("computeWindowLines", () => {
 		// Tick at Z=2.0: from inner face (9.8) to outer face (10.0)
 		expect(breakTicks[0][0][2]).toBeCloseTo(2.0);
 		expect(breakTicks[0][1][2]).toBeCloseTo(2.0);
-		expect(Math.min(breakTicks[0][0][0], breakTicks[0][1][0])).toBeCloseTo(
-			9.8,
-		);
+		expect(Math.min(breakTicks[0][0][0], breakTicks[0][1][0])).toBeCloseTo(9.8);
 		expect(Math.max(breakTicks[0][0][0], breakTicks[0][1][0])).toBeCloseTo(
 			10.0,
 		);
diff --git a/tests/utils/segmentGeometry.test.ts b/tests/utils/segmentGeometry.test.ts
index a049f97..df5bac2 100644
--- a/tests/utils/segmentGeometry.test.ts
+++ b/tests/utils/segmentGeometry.test.ts
@@ -198,12 +198,12 @@ describe("createSegmentGeometries", () => {
 		] as const;
 		for (const specId of specs) {
 			const geom = createSegmentGeometries(specId, 0.6);
-			expect(
-				geom.bumperLeft.getAttribute("position").count,
-			).toBeGreaterThan(24);
-			expect(
-				geom.bumperRight.getAttribute("position").count,
-			).toBeGreaterThan(24);
+			expect(geom.bumperLeft.getAttribute("position").count).toBeGreaterThan(
+				24,
+			);
+			expect(geom.bumperRight.getAttribute("position").count).toBeGreaterThan(
+				24,
+			);
 		}
 	});
 
diff --git a/tests/uvTransition.test.ts b/tests/uvTransition.test.ts
index 6f88022..b768175 100644
--- a/tests/uvTransition.test.ts
+++ b/tests/uvTransition.test.ts
@@ -142,4 +142,3 @@ describe("UV Transition", () => {
 		});
 	});
 });
-
diff --git a/tests/visual/dualViewport.spec.ts b/tests/visual/dualViewport.spec.ts
index 1846857..945e7f4 100644
--- a/tests/visual/dualViewport.spec.ts
+++ b/tests/visual/dualViewport.spec.ts
@@ -16,13 +16,10 @@ async function waitForCanvasRender(page: Page) {
 /** Collapse the dual viewport via store (more reliable than DOM interactions with Canvas overlay). */
 async function collapseToLayout(page: Page, layout: "2d-only" | "3d-only") {
 	const side = layout === "2d-only" ? "2d" : "3d";
-	await page.evaluate(
-		(s) => {
-			const store = (window as Record<string, any>).__STORE__;
-			if (store) store.getState().collapseTo(s);
-		},
-		side,
-	);
+	await page.evaluate((s) => {
+		const store = (window as Record<string, any>).__STORE__;
+		if (store) store.getState().collapseTo(s);
+	}, side);
 	await page.waitForTimeout(500);
 }
 
@@ -46,7 +43,9 @@ test.describe("Dual Viewport Layout", () => {
 		// Verify 2D pane visible, 3D pane and divider hidden
 		await expect(page.locator("[data-testid='pane-2d']")).toBeVisible();
 		await expect(page.locator("[data-testid='pane-3d']")).not.toBeAttached();
-		await expect(page.locator("[data-testid='split-divider']")).not.toBeAttached();
+		await expect(
+			page.locator("[data-testid='split-divider']"),
+		).not.toBeAttached();
 		await expect(page).toHaveScreenshot("collapsed-2d-only.png");
 	});
 
@@ -58,7 +57,9 @@ test.describe("Dual Viewport Layout", () => {
 		// Verify 3D pane visible, 2D pane and divider hidden
 		await expect(page.locator("[data-testid='pane-3d']")).toBeVisible();
 		await expect(page.locator("[data-testid='pane-2d']")).not.toBeAttached();
-		await expect(page.locator("[data-testid='split-divider']")).not.toBeAttached();
+		await expect(
+			page.locator("[data-testid='split-divider']"),
+		).not.toBeAttached();
 		await expect(page).toHaveScreenshot("collapsed-3d-only.png");
 	});
 });
@@ -99,7 +100,9 @@ test.describe("Mobile Fallback", () => {
 		await page.goto("/");
 		await waitForCanvasRender(page);
 		// Verify no dual-viewport structure on mobile
-		await expect(page.locator("[data-testid='dual-viewport']")).not.toBeAttached();
+		await expect(
+			page.locator("[data-testid='dual-viewport']"),
+		).not.toBeAttached();
 		await expect(page).toHaveScreenshot("mobile-single-pane.png");
 	});
 });
diff --git a/tests/visual/golf-forge.spec.ts b/tests/visual/golf-forge.spec.ts
index 6c57d52..0fa743d 100644
--- a/tests/visual/golf-forge.spec.ts
+++ b/tests/visual/golf-forge.spec.ts
@@ -93,7 +93,9 @@ test.describe("Dark Theme UI", () => {
 		await page.goto("/");
 		await waitForCanvasRender(page);
 		// Click Budget tab
-		const budgetTab = page.locator("[data-testid='sidebar'] button", { hasText: "Budget" });
+		const budgetTab = page.locator("[data-testid='sidebar'] button", {
+			hasText: "Budget",
+		});
 		await budgetTab.click();
 		await page.waitForTimeout(500);
 		const sidebar = page.locator("[data-testid='sidebar']");
@@ -108,6 +110,37 @@ test.describe("Dark Theme UI", () => {
 	});
 });
 
+test.describe("Architectural Floor Plan (Split 06a)", () => {
+	test("full 2D architectural floor plan at default zoom", async ({ page }) => {
+		await page.goto("/");
+		await waitForCanvasRender(page);
+		await expect(page).toHaveScreenshot("architectural-2d-default.png");
+	});
+
+	test("2D pane with collapsed 3D shows full-width floor plan", async ({
+		page,
+	}) => {
+		await page.goto("/");
+		await waitForCanvasRender(page);
+		await page.evaluate(() => {
+			const store = (window as Record<string, any>).__STORE__;
+			if (store) store.getState().collapseTo("2d");
+		});
+		await page.waitForTimeout(1000);
+		await expect(page).toHaveScreenshot("architectural-2d-fullwidth.png");
+	});
+
+	test("UV mode shows appropriate colors for architectural elements", async ({
+		page,
+	}) => {
+		await page.goto("/");
+		await waitForCanvasRender(page);
+		await page.locator("[data-testid='uv-toggle']").click();
+		await page.waitForTimeout(3000);
+		await expect(page).toHaveScreenshot("architectural-2d-uv-mode.png");
+	});
+});
+
 test.describe("Mobile", () => {
 	test("mobile bottom toolbar", async ({ page }) => {
 		await page.setViewportSize({ width: 375, height: 667 });
diff --git a/tests/visual/texturedHoles2D.spec.ts b/tests/visual/texturedHoles2D.spec.ts
index 0a43c83..b534336 100644
--- a/tests/visual/texturedHoles2D.spec.ts
+++ b/tests/visual/texturedHoles2D.spec.ts
@@ -13,13 +13,10 @@ async function waitForCanvasRender(page: Page) {
 /** Collapse to 2D-only mode for clear felt overlay visibility. */
 async function collapseToLayout(page: Page, layout: "2d-only" | "3d-only") {
 	const side = layout === "2d-only" ? "2d" : "3d";
-	await page.evaluate(
-		(s) => {
-			const store = (window as Record<string, any>).__STORE__;
-			if (store) store.getState().collapseTo(s);
-		},
-		side,
-	);
+	await page.evaluate((s) => {
+		const store = (window as Record<string, any>).__STORE__;
+		if (store) store.getState().collapseTo(s);
+	}, side);
 	await page.waitForTimeout(500);
 }
 
diff --git a/tests/visual/titleBlock.spec.ts b/tests/visual/titleBlock.spec.ts
index 6776722..d48a55b 100644
--- a/tests/visual/titleBlock.spec.ts
+++ b/tests/visual/titleBlock.spec.ts
@@ -1,9 +1,7 @@
 import { expect, test } from "@playwright/test";
 
 test.describe("Title Block 2D", () => {
-	test("title block is visible in bottom-left of 2D pane", async ({
-		page,
-	}) => {
+	test("title block is visible in bottom-left of 2D pane", async ({ page }) => {
 		await page.goto("/");
 		await page.waitForSelector('[data-testid="pane-2d"]');
 		const titleBlock = page.getByTestId("title-block-2d");
