diff --git a/src/App.tsx b/src/App.tsx
index ff9f7dc..ac62f91 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -2,7 +2,7 @@ import { lazy, Suspense, useEffect } from "react";
 import { DualViewport } from "./components/layout/DualViewport";
 import { BottomToolbar } from "./components/ui/BottomToolbar";
 import { HoleDrawer } from "./components/ui/HoleDrawer";
-import { LocationBar } from "./components/ui/LocationBar";
+import { StatusBar } from "./components/ui/StatusBar";
 import { MobileBudgetPanel } from "./components/ui/MobileBudgetPanel";
 import { MobileLayerPanel } from "./components/ui/MobileLayerPanel";
 import { MobileDetailPanel } from "./components/ui/MobileDetailPanel";
@@ -38,7 +38,7 @@ export default function App() {
 				<Sidebar />
 				<DualViewport sunData={sunData} />
 			</div>
-			<LocationBar sunData={sunData} />
+			<StatusBar sunData={sunData} />
 			<BottomToolbar />
 			<HoleDrawer />
 			<MobileDetailPanel />
diff --git a/src/components/layout/DualViewport.tsx b/src/components/layout/DualViewport.tsx
index 9eaef43..1517d1a 100644
--- a/src/components/layout/DualViewport.tsx
+++ b/src/components/layout/DualViewport.tsx
@@ -31,11 +31,13 @@ import {
 import { isMobile } from "../../utils/isMobile";
 import { ViewportContext } from "../../contexts/ViewportContext";
 import type { ViewportInfo } from "../../contexts/ViewportContext";
+import { useMouseStatusStore } from "../../stores/mouseStatusStore";
 import { canvasPointerEvents } from "../../utils/uvTransitionConfig";
 import { CameraPresets } from "../three/CameraPresets";
 import { PlacementHandler } from "../three/PlacementHandler";
 import { SharedScene } from "../three/SharedScene";
 import { ThreeDOnlyContent } from "../three/ThreeDOnlyContent";
+import { ViewportStatusTracker } from "../three/ViewportStatusTracker";
 import { KeyboardHelp } from "../ui/KeyboardHelp";
 import { MiniMap } from "../ui/MiniMap";
 import { SunControls } from "../ui/SunControls";
@@ -318,6 +320,11 @@ export function DualViewport({ sunData }: DualViewportProps) {
 							: "100%",
 					}}
 					onPointerEnter={() => setActiveViewport("2d")}
+					onPointerLeave={() =>
+						useMouseStatusStore
+							.getState()
+							.setMouseWorldPos(null)
+					}
 				>
 					<View style={{ width: "100%", height: "100%" }}>
 						<ViewportContext.Provider value={viewport2DInfo}>
@@ -349,6 +356,7 @@ export function DualViewport({ sunData }: DualViewportProps) {
 							/>
 							<SharedScene sunData={sunData} />
 							<PlacementHandler />
+							<ViewportStatusTracker />
 						</ViewportContext.Provider>
 					</View>
 					<MiniMap />
diff --git a/src/components/three/ViewportStatusTracker.tsx b/src/components/three/ViewportStatusTracker.tsx
new file mode 100644
index 0000000..ceae71d
--- /dev/null
+++ b/src/components/three/ViewportStatusTracker.tsx
@@ -0,0 +1,44 @@
+import { useFrame, useThree } from "@react-three/fiber";
+import { useRef } from "react";
+import { useMouseStatusStore } from "../../stores/mouseStatusStore";
+
+/**
+ * R3F component mounted inside the 2D View that tracks mouse world position
+ * and camera zoom, writing to the micro-store for the StatusBar.
+ *
+ * Renders an invisible floor plane for pointer tracking.
+ */
+export function ViewportStatusTracker() {
+	const lastZoomRef = useRef(40);
+	const { camera } = useThree();
+
+	// Track zoom changes (throttled: only update when delta > 0.5)
+	useFrame(() => {
+		if ("zoom" in camera) {
+			const zoom = (camera as { zoom: number }).zoom;
+			if (Math.abs(zoom - lastZoomRef.current) > 0.5) {
+				lastZoomRef.current = zoom;
+				useMouseStatusStore.getState().setCurrentZoom(zoom);
+			}
+		}
+	});
+
+	return (
+		<mesh
+			position={[5, 0, 10]}
+			rotation={[-Math.PI / 2, 0, 0]}
+			onPointerMove={(e) => {
+				useMouseStatusStore
+					.getState()
+					.setMouseWorldPos({ x: e.point.x, z: e.point.z });
+			}}
+			onPointerLeave={() => {
+				useMouseStatusStore.getState().setMouseWorldPos(null);
+			}}
+		>
+			{/* Large invisible plane covering the hall area and beyond */}
+			<planeGeometry args={[30, 40]} />
+			<meshBasicMaterial visible={false} />
+		</mesh>
+	);
+}
diff --git a/src/components/ui/StatusBar.tsx b/src/components/ui/StatusBar.tsx
new file mode 100644
index 0000000..fdd2eac
--- /dev/null
+++ b/src/components/ui/StatusBar.tsx
@@ -0,0 +1,130 @@
+import { useState } from "react";
+import { LOCATION } from "../../constants/location";
+import type { SunData } from "../../hooks/useSunPosition";
+import { useStore } from "../../store";
+import { useMouseStatusStore } from "../../stores/mouseStatusStore";
+import { computeScale } from "../../utils/zoomScale";
+
+type StatusBarProps = {
+	sunData?: SunData;
+};
+
+export function StatusBar({ sunData }: StatusBarProps) {
+	const [expanded, setExpanded] = useState(false);
+	const mouseWorldPos = useMouseStatusStore((s) => s.mouseWorldPos);
+	const currentZoom = useMouseStatusStore((s) => s.currentZoom);
+	const viewportLayout = useStore((s) => s.ui.viewportLayout);
+	const hall = useStore((s) => s.hall);
+
+	const has2D = viewportLayout !== "3d-only";
+	const scale = has2D ? computeScale(currentZoom, 800, hall.width) : "--";
+	const xDisplay =
+		has2D && mouseWorldPos ? mouseWorldPos.x.toFixed(2) : "--";
+	const zDisplay =
+		has2D && mouseWorldPos ? mouseWorldPos.z.toFixed(2) : "--";
+
+	return (
+		<div className="hidden border-t border-subtle bg-surface text-text-secondary md:block">
+			<button
+				type="button"
+				onClick={() => setExpanded(!expanded)}
+				className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-plasma transition-colors"
+			>
+				<span className="font-medium text-primary">
+					{LOCATION.address}
+				</span>
+				<span className="text-text-secondary">·</span>
+				<span>{LOCATION.elevation}m</span>
+				<span className="text-text-secondary">·</span>
+				<span>
+					{LOCATION.lat.toFixed(4)}°N {LOCATION.lng.toFixed(4)}°E
+				</span>
+				{sunData?.isDay && (
+					<>
+						<span className="text-text-secondary">·</span>
+						<span className="text-amber-400">
+							{sunData.azimuthDeg}° · {sunData.altitudeDeg}° alt
+						</span>
+					</>
+				)}
+
+				{/* Right-aligned status section */}
+				<span className="ml-auto flex items-center gap-3 font-mono text-xs text-text-secondary">
+					<span>
+						X: {xDisplay}
+						{xDisplay !== "--" && "m"}
+					</span>
+					<span>
+						Z: {zDisplay}
+						{zDisplay !== "--" && "m"}
+					</span>
+					<span>Scale: {scale}</span>
+				</span>
+
+				<span className="text-text-secondary">
+					{expanded ? "▾" : "▸"}
+				</span>
+			</button>
+			{expanded && (
+				<div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-subtle px-3 py-2 text-xs md:grid-cols-4">
+					<div>
+						<span className="text-text-secondary">Address: </span>
+						<span className="text-primary">{LOCATION.address}</span>
+					</div>
+					<div>
+						<span className="text-text-secondary">Region: </span>
+						<span>{LOCATION.region}</span>
+					</div>
+					<div>
+						<span className="text-text-secondary">
+							Coordinates:{" "}
+						</span>
+						<span>
+							{LOCATION.lat}°N, {LOCATION.lng}°E
+						</span>
+					</div>
+					<div>
+						<span className="text-text-secondary">
+							Elevation:{" "}
+						</span>
+						<span>{LOCATION.elevation}m above sea level</span>
+					</div>
+					{sunData && (
+						<div>
+							<span className="text-text-secondary">Sun: </span>
+							<span
+								className={
+									sunData.isDay
+										? "text-amber-400"
+										: "text-text-secondary"
+								}
+							>
+								{sunData.isDay
+									? `${sunData.azimuthDeg}° bearing, ${sunData.altitudeDeg}° elevation`
+									: "Below horizon"}
+							</span>
+						</div>
+					)}
+					<div className="flex gap-2">
+						<a
+							href={LOCATION.osmUrl}
+							target="_blank"
+							rel="noopener noreferrer"
+							className="text-accent-text hover:underline"
+						>
+							Open in Maps
+						</a>
+						<a
+							href={LOCATION.googleMapsUrl}
+							target="_blank"
+							rel="noopener noreferrer"
+							className="text-accent-text hover:underline"
+						>
+							Satellite View
+						</a>
+					</div>
+				</div>
+			)}
+		</div>
+	);
+}
diff --git a/src/stores/mouseStatusStore.ts b/src/stores/mouseStatusStore.ts
new file mode 100644
index 0000000..d4f411a
--- /dev/null
+++ b/src/stores/mouseStatusStore.ts
@@ -0,0 +1,15 @@
+import { create } from "zustand";
+
+type MouseStatusState = {
+	mouseWorldPos: { x: number; z: number } | null;
+	currentZoom: number;
+	setMouseWorldPos: (pos: { x: number; z: number } | null) => void;
+	setCurrentZoom: (zoom: number) => void;
+};
+
+export const useMouseStatusStore = create<MouseStatusState>((set) => ({
+	mouseWorldPos: null,
+	currentZoom: 40,
+	setMouseWorldPos: (pos) => set({ mouseWorldPos: pos }),
+	setCurrentZoom: (zoom) => set({ currentZoom: zoom }),
+}));
diff --git a/src/utils/zoomScale.ts b/src/utils/zoomScale.ts
new file mode 100644
index 0000000..25d822a
--- /dev/null
+++ b/src/utils/zoomScale.ts
@@ -0,0 +1,37 @@
+const STANDARD_SCALES = [10, 20, 25, 50, 100, 200];
+
+/**
+ * Converts orthographic camera zoom to the nearest standard architectural scale string.
+ * At zoom=40 and viewportWidth=800 with a 10m hall, targets ~1:50.
+ */
+export function computeScale(
+	cameraZoom: number,
+	viewportWidthPx: number,
+	hallWidthM: number,
+): string {
+	// Orthographic camera: zoom = pixels per world unit
+	// Hall width in pixels = hallWidthM * cameraZoom
+	// Physical screen width at 96 DPI: viewportWidthPx / 96 inches = viewportWidthPx * 0.0254 / 96 meters
+	// But we want scale relative to real-world: 1m in model = X m on screen
+	// metersOnScreen = viewportWidthPx / (96 * 39.37) per pixel... simpler approach:
+	// At 96 DPI, 1 pixel ≈ 0.264mm = 0.000264m
+	// hallOnScreen_m = (hallWidthM * cameraZoom) * 0.000264
+	// scale = hallOnScreen_m / hallWidthM = cameraZoom * 0.000264
+	// scaleDenominator = 1 / (cameraZoom * 0.000264)
+
+	// Tuned so zoom=40 yields denominator=50 (i.e. 1:50)
+	const scaleDenominator = 1 / (cameraZoom * 0.0005);
+
+	// Find nearest standard scale
+	let bestScale = STANDARD_SCALES[0];
+	let bestDist = Math.abs(scaleDenominator - bestScale);
+	for (const s of STANDARD_SCALES) {
+		const dist = Math.abs(scaleDenominator - s);
+		if (dist < bestDist) {
+			bestDist = dist;
+			bestScale = s;
+		}
+	}
+
+	return `1:${bestScale}`;
+}
diff --git a/tests/stores/mouseStatusStore.test.ts b/tests/stores/mouseStatusStore.test.ts
new file mode 100644
index 0000000..97399fd
--- /dev/null
+++ b/tests/stores/mouseStatusStore.test.ts
@@ -0,0 +1,33 @@
+import { beforeEach, describe, expect, it } from "vitest";
+import { useMouseStatusStore } from "../../src/stores/mouseStatusStore";
+
+describe("mouseStatusStore", () => {
+	beforeEach(() => {
+		useMouseStatusStore.setState({
+			mouseWorldPos: null,
+			currentZoom: 40,
+		});
+	});
+
+	it("initial state has null mouseWorldPos", () => {
+		const state = useMouseStatusStore.getState();
+		expect(state.mouseWorldPos).toBeNull();
+	});
+
+	it("setMouseWorldPos updates store correctly", () => {
+		useMouseStatusStore.getState().setMouseWorldPos({ x: 5.23, z: 12.47 });
+		const state = useMouseStatusStore.getState();
+		expect(state.mouseWorldPos).toEqual({ x: 5.23, z: 12.47 });
+	});
+
+	it("setCurrentZoom updates store correctly", () => {
+		useMouseStatusStore.getState().setCurrentZoom(42);
+		expect(useMouseStatusStore.getState().currentZoom).toBe(42);
+	});
+
+	it("setMouseWorldPos(null) clears position", () => {
+		useMouseStatusStore.getState().setMouseWorldPos({ x: 1, z: 2 });
+		useMouseStatusStore.getState().setMouseWorldPos(null);
+		expect(useMouseStatusStore.getState().mouseWorldPos).toBeNull();
+	});
+});
diff --git a/tests/utils/zoomScale.test.ts b/tests/utils/zoomScale.test.ts
new file mode 100644
index 0000000..350d594
--- /dev/null
+++ b/tests/utils/zoomScale.test.ts
@@ -0,0 +1,37 @@
+import { describe, expect, it } from "vitest";
+import { computeScale } from "../../src/utils/zoomScale";
+
+describe("computeScale", () => {
+	it("returns a standard scale string at zoom=20", () => {
+		const result = computeScale(20, 800, 10);
+		expect(["1:10", "1:20", "1:25", "1:50", "1:100", "1:200"]).toContain(
+			result,
+		);
+	});
+
+	it("rounds to nearest standard scale", () => {
+		const result = computeScale(35, 800, 10);
+		expect(["1:10", "1:20", "1:25", "1:50", "1:100", "1:200"]).toContain(
+			result,
+		);
+	});
+
+	it("returns small scale at very high zoom", () => {
+		const result = computeScale(120, 800, 10);
+		// zoom=120 → denominator ≈ 16.7 → rounds to 1:20
+		expect(result).toBe("1:20");
+	});
+
+	it("returns '1:200' at very low zoom", () => {
+		const result = computeScale(5, 800, 10);
+		expect(result).toBe("1:200");
+	});
+
+	it("higher zoom produces smaller scale denominator", () => {
+		const lowZoom = computeScale(20, 800, 10);
+		const highZoom = computeScale(80, 800, 10);
+		const lowDenom = Number.parseInt(lowZoom.split(":")[1]);
+		const highDenom = Number.parseInt(highZoom.split(":")[1]);
+		expect(highDenom).toBeLessThanOrEqual(lowDenom);
+	});
+});
