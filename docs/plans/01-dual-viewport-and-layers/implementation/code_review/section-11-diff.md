diff --git a/src/App.tsx b/src/App.tsx
index 18a7b31..ff9f7dc 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -4,6 +4,7 @@ import { BottomToolbar } from "./components/ui/BottomToolbar";
 import { HoleDrawer } from "./components/ui/HoleDrawer";
 import { LocationBar } from "./components/ui/LocationBar";
 import { MobileBudgetPanel } from "./components/ui/MobileBudgetPanel";
+import { MobileLayerPanel } from "./components/ui/MobileLayerPanel";
 import { MobileDetailPanel } from "./components/ui/MobileDetailPanel";
 import { MobileSunControls } from "./components/ui/MobileSunControls";
 import { Sidebar } from "./components/ui/Sidebar";
@@ -43,6 +44,7 @@ export default function App() {
 			<MobileDetailPanel />
 			<MobileSunControls />
 			<MobileBudgetPanel />
+			<MobileLayerPanel />
 			{builderMode && (
 				<Suspense fallback={null}>
 					<Builder />
diff --git a/src/components/layout/DualViewport.tsx b/src/components/layout/DualViewport.tsx
index f426838..50ab11c 100644
--- a/src/components/layout/DualViewport.tsx
+++ b/src/components/layout/DualViewport.tsx
@@ -11,6 +11,7 @@ import type CameraControlsImpl from "camera-controls";
 import { Suspense, useEffect, useMemo, useRef, useState } from "react";
 import { MOUSE, NoToneMapping, TOUCH } from "three";
 import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
+import { useIsMobileViewport } from "../../hooks/useIsMobileViewport";
 import { useKeyboardControls } from "../../hooks/useKeyboardControls";
 import { useSplitPane } from "../../hooks/useSplitPane";
 import type { SunData } from "../../hooks/useSunPosition";
@@ -92,11 +93,13 @@ export function DualViewport({ sunData }: DualViewportProps) {
 	const viewportLayout = useStore((s) => s.ui.viewportLayout);
 	const splitRatio = useStore((s) => s.ui.splitRatio);
 	const tool = useStore((s) => s.ui.tool);
+	const view = useStore((s) => s.ui.view);
 	const uvMode = useStore((s) => s.ui.uvMode);
 	const gpuTier = useStore((s) => s.ui.gpuTier);
 	const transitioning = useStore((s) => s.ui.transitioning);
 	const hall = useStore((s) => s.hall);
 	const setActiveViewport = useStore((s) => s.setActiveViewport);
+	const isMobileViewport = useIsMobileViewport();
 	const {
 		isDragging,
 		onDividerMouseDown,
@@ -205,6 +208,87 @@ export function DualViewport({ sunData }: DualViewportProps) {
 	const frameloop = deriveFrameloop(uvMode, gpuTier, transitioning, viewportLayout);
 	const shadows = getShadowType(gpuTier, isMobile);
 
+	// Mobile: single-pane fallback — no View components, camera driven by ui.view
+	if (isMobileViewport) {
+		return (
+			<div
+				ref={containerRef}
+				className="relative flex-1 overflow-hidden"
+				style={{
+					cursor:
+						tool === "delete" ? "crosshair" : "default",
+					touchAction: "none",
+					pointerEvents: canvasPointerEvents(transitioning),
+				}}
+			>
+				<Canvas
+					dpr={dpr}
+					frameloop={frameloop}
+					shadows={shadows}
+					gl={{
+						antialias: false,
+						preserveDrawingBuffer: false,
+						powerPreference: "high-performance",
+						toneMapping: NoToneMapping,
+					}}
+				>
+					{shouldEnableSoftShadows(gpuTier) && (
+						<SoftShadows size={25} samples={10} />
+					)}
+					<Suspense fallback={null}>
+						{view === "top" ? (
+							<>
+								<OrthographicCamera
+									makeDefault
+									position={[defaultTarget[0], 50, defaultTarget[2]]}
+									zoom={DEFAULT_ORTHO_ZOOM}
+									near={0.1}
+									far={200}
+								/>
+								<OrbitControls
+									ref={controls2DRef}
+									target={defaultTarget}
+									enableRotate={false}
+									enablePan={true}
+									enableZoom={true}
+									minZoom={MIN_ORTHO_ZOOM}
+									maxZoom={MAX_ORTHO_ZOOM}
+									touches={{
+										ONE: TOUCH.PAN,
+										TWO: TOUCH.DOLLY_PAN,
+									}}
+									makeDefault
+								/>
+								<SharedScene sunData={sunData} />
+								<PlacementHandler />
+							</>
+						) : (
+							<>
+								<PerspectiveCamera
+									makeDefault
+									position={initialIsoPosition}
+									fov={PERSPECTIVE_FOV}
+									near={0.1}
+									far={500}
+								/>
+								<CameraControls
+									ref={controls3DRef}
+									makeDefault
+								/>
+								<SharedScene sunData={sunData} />
+								<ThreeDOnlyContent />
+								<PlacementHandler />
+							</>
+						)}
+					</Suspense>
+				</Canvas>
+				{/* Overlay components */}
+				<SunControls />
+				<KeyboardHelp />
+			</div>
+		);
+	}
+
 	return (
 		<div
 			ref={containerRef}
diff --git a/src/components/three/CameraPresets.tsx b/src/components/three/CameraPresets.tsx
index 67d8d96..98911fd 100644
--- a/src/components/three/CameraPresets.tsx
+++ b/src/components/three/CameraPresets.tsx
@@ -2,6 +2,7 @@ import type CameraControlsImpl from "camera-controls";
 import type { RefObject } from "react";
 import { useStore } from "../../store";
 import { getCameraPresets } from "../../utils/cameraPresets";
+import { isMobile } from "../../utils/isMobile";
 
 type CameraPresetsProps = {
 	cameraControlsRef: RefObject<CameraControlsImpl | null>;
@@ -19,6 +20,9 @@ const PRESET_BUTTONS = [
 export function CameraPresets({ cameraControlsRef }: CameraPresetsProps) {
 	const hall = useStore((s) => s.hall);
 
+	// Hide camera preset buttons on mobile — no dedicated 3D pane
+	if (isMobile) return null;
+
 	function handlePresetClick(presetKey: (typeof PRESET_BUTTONS)[number]["key"]) {
 		const ctrl = cameraControlsRef.current;
 		if (!ctrl) return;
diff --git a/src/components/ui/BottomToolbar.tsx b/src/components/ui/BottomToolbar.tsx
index e08ede2..0d4ab81 100644
--- a/src/components/ui/BottomToolbar.tsx
+++ b/src/components/ui/BottomToolbar.tsx
@@ -251,6 +251,16 @@ function OverflowPopover({ onClose }: { onClose: () => void }) {
 				>
 					Budget
 				</button>
+				<button
+					type="button"
+					onClick={() => {
+						setActivePanel("layers");
+						onClose();
+					}}
+					className="rounded-lg bg-plasma px-4 py-2 text-sm font-medium text-text-secondary"
+				>
+					Layers
+				</button>
 			</div>
 		</>
 	);
diff --git a/src/hooks/useIsMobileViewport.ts b/src/hooks/useIsMobileViewport.ts
new file mode 100644
index 0000000..e716fd8
--- /dev/null
+++ b/src/hooks/useIsMobileViewport.ts
@@ -0,0 +1,24 @@
+import { useEffect, useState } from "react";
+
+const MOBILE_QUERY = "(min-width: 768px)";
+
+/**
+ * Reactive hook that returns true when viewport width is below 768px.
+ * Unlike the static `isMobile` utility, this responds to window resize.
+ */
+export function useIsMobileViewport(): boolean {
+	const [isMobileViewport, setIsMobileViewport] = useState(() => {
+		if (typeof window === "undefined") return false;
+		return !window.matchMedia(MOBILE_QUERY).matches;
+	});
+
+	useEffect(() => {
+		const mql = window.matchMedia(MOBILE_QUERY);
+		const handler = (e: MediaQueryListEvent) =>
+			setIsMobileViewport(!e.matches);
+		mql.addEventListener("change", handler);
+		return () => mql.removeEventListener("change", handler);
+	}, []);
+
+	return isMobileViewport;
+}
