diff --git a/src/components/layout/DualViewport.tsx b/src/components/layout/DualViewport.tsx
index 11cc694..b177ecc 100644
--- a/src/components/layout/DualViewport.tsx
+++ b/src/components/layout/DualViewport.tsx
@@ -33,7 +33,7 @@ import { ViewportContext } from "../../contexts/ViewportContext";
 import type { ViewportInfo } from "../../contexts/ViewportContext";
 import { useMouseStatusStore } from "../../stores/mouseStatusStore";
 import { canvasPointerEvents } from "../../utils/uvTransitionConfig";
-import { WalkthroughController } from "../three/environment";
+import { WalkthroughController, WalkthroughOverlay } from "../three/environment";
 import { CameraPresets } from "../three/CameraPresets";
 import { PlacementHandler } from "../three/PlacementHandler";
 import { SharedScene } from "../three/SharedScene";
@@ -411,6 +411,8 @@ export function DualViewport({ sunData }: DualViewportProps) {
 					</View>
 					{/* Camera presets overlay (HTML, outside Canvas) */}
 					<CameraPresets cameraControlsRef={controls3DRef} />
+					{/* Walkthrough overlay (HTML, outside Canvas) */}
+					<WalkthroughOverlay />
 				</div>
 			)}
 
diff --git a/src/components/three/CameraPresets.tsx b/src/components/three/CameraPresets.tsx
index 07406db..ebff13f 100644
--- a/src/components/three/CameraPresets.tsx
+++ b/src/components/three/CameraPresets.tsx
@@ -19,6 +19,9 @@ const PRESET_BUTTONS = [
 
 export function CameraPresets({ cameraControlsRef }: CameraPresetsProps) {
 	const hall = useStore((s) => s.hall);
+	const walkthroughMode = useStore((s) => s.ui.walkthroughMode);
+	const enterWalkthrough = useStore((s) => s.enterWalkthrough);
+	const exitWalkthrough = useStore((s) => s.exitWalkthrough);
 
 	// Hide camera preset buttons on mobile — no dedicated 3D pane
 	if (isMobile) return null;
@@ -56,6 +59,22 @@ export function CameraPresets({ cameraControlsRef }: CameraPresetsProps) {
 					<span>{btn.label}</span>
 				</button>
 			))}
+			{/* Walkthrough toggle — desktop only */}
+			<hr className="border-white/20 my-1" />
+			<button
+				type="button"
+				onClick={walkthroughMode ? exitWalkthrough : enterWalkthrough}
+				className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
+					walkthroughMode
+						? "bg-indigo-600/80 text-white hover:bg-indigo-600"
+						: "bg-black/60 text-white/80 hover:bg-black/80 hover:text-white"
+				}`}
+				title="Walkthrough mode (F)"
+				data-testid="walkthrough-btn"
+			>
+				<span className="w-3 text-white/50">F</span>
+				<span>{walkthroughMode ? "Exit Walk" : "Walk"}</span>
+			</button>
 		</div>
 	);
 }
diff --git a/src/components/three/environment/WalkthroughOverlay.tsx b/src/components/three/environment/WalkthroughOverlay.tsx
new file mode 100644
index 0000000..5c101cb
--- /dev/null
+++ b/src/components/three/environment/WalkthroughOverlay.tsx
@@ -0,0 +1,61 @@
+import { useEffect, useState } from "react";
+import { useStore } from "../../../store";
+
+/**
+ * HTML overlay shown when walkthrough mode is active.
+ * Positioned absolutely over the 3D viewport.
+ * Contains: exit button (top-right), controls hint (bottom-center, fades after 3s), crosshair.
+ */
+export function WalkthroughOverlay() {
+	const walkthroughMode = useStore((s) => s.ui.walkthroughMode);
+	const exitWalkthrough = useStore((s) => s.exitWalkthrough);
+	const [hintVisible, setHintVisible] = useState(true);
+
+	// Fade hint out after 3 seconds whenever walkthrough mode activates
+	useEffect(() => {
+		if (!walkthroughMode) {
+			setHintVisible(true); // reset for next entry
+			return;
+		}
+		setHintVisible(true);
+		const timer = setTimeout(() => setHintVisible(false), 3000);
+		return () => clearTimeout(timer);
+	}, [walkthroughMode]);
+
+	if (!walkthroughMode) return null;
+
+	return (
+		<div
+			className="pointer-events-none absolute inset-0 z-20"
+			data-testid="walkthrough-overlay"
+		>
+			{/* Exit button — top right */}
+			<button
+				type="button"
+				className="pointer-events-auto absolute right-3 top-3 rounded bg-black/60 px-3 py-1.5 text-sm text-white/90 hover:bg-black/80 transition-colors"
+				onClick={exitWalkthrough}
+				data-testid="walkthrough-exit-btn"
+			>
+				Exit Walkthrough
+			</button>
+
+			{/* Controls hint — bottom center, fades after 3s */}
+			<div
+				className={`absolute bottom-6 left-1/2 -translate-x-1/2 rounded bg-black/50 px-4 py-2 text-xs text-white/80 transition-opacity duration-700 ${
+					hintVisible ? "opacity-100" : "opacity-0"
+				}`}
+				data-testid="walkthrough-hint"
+			>
+				WASD to move | Drag to look | Shift to run | Esc to exit
+			</div>
+
+			{/* Crosshair — center */}
+			<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
+				<div className="relative h-4 w-4 opacity-60">
+					<div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white" />
+					<div className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2 bg-white" />
+				</div>
+			</div>
+		</div>
+	);
+}
diff --git a/src/components/three/environment/index.ts b/src/components/three/environment/index.ts
index 9cf3d9d..a192bff 100644
--- a/src/components/three/environment/index.ts
+++ b/src/components/three/environment/index.ts
@@ -1 +1,2 @@
 export { WalkthroughController } from "./WalkthroughController";
+export { WalkthroughOverlay } from "./WalkthroughOverlay";
diff --git a/src/hooks/useKeyboardControls.ts b/src/hooks/useKeyboardControls.ts
index 6cc8597..5a74456 100644
--- a/src/hooks/useKeyboardControls.ts
+++ b/src/hooks/useKeyboardControls.ts
@@ -16,6 +16,21 @@ export function shouldHandleKey(activeElementTag: string): boolean {
 	return !BLOCKED_TAGS.has(activeElementTag);
 }
 
+/**
+ * Returns true if a key event should be suppressed because walkthrough
+ * mode is active and the key belongs to camera/viewport controls.
+ * Undo (z/Z) and snap toggle (g/G) remain active at all times.
+ */
+export function shouldSuppressForWalkthrough(
+	key: string,
+	walkthroughMode: boolean,
+): boolean {
+	if (!walkthroughMode) return false;
+	const alwaysActive = new Set(["z", "Z", "g", "G"]);
+	if (alwaysActive.has(key)) return false;
+	return true;
+}
+
 /** Compute bounding box for all placed holes, with 2m padding. Falls back to hall bounds. */
 function getHolesBoundingBox() {
 	const { holes, hall } = useStore.getState();
@@ -113,8 +128,25 @@ export function useKeyboardControls({
 				return;
 			}
 
+			// Escape key exits walkthrough
+			if (e.key === "Escape") {
+				const { walkthroughMode } = useStore.getState().ui;
+				if (walkthroughMode) {
+					useStore.getState().exitWalkthrough();
+				}
+				return;
+			}
+
 			const viewport = resolveViewport();
 
+			// During walkthrough, suppress all camera/viewport shortcuts.
+			// WalkthroughController handles its own WASD via window.addEventListener.
+			const { walkthroughMode } = useStore.getState().ui;
+			if (shouldSuppressForWalkthrough(e.key, walkthroughMode)) {
+				e.stopPropagation();
+				return;
+			}
+
 			// Camera preset keys (1-6) — 3D only
 			if (e.key in PRESET_KEYS && viewport === "3d") {
 				const ctrl3D = controls3DRef.current;
@@ -263,19 +295,12 @@ export function useKeyboardControls({
 					}
 					case "f":
 					case "F": {
-						const { centerX, centerZ, rangeX, rangeZ } = getHolesBoundingBox();
-						const extent = Math.max(rangeX, rangeZ);
-						const distance = extent * 1.5;
-
-						ctrl3D.setLookAt(
-							centerX + distance * 0.5,
-							distance * 0.6,
-							centerZ + distance * 0.5,
-							centerX,
-							0,
-							centerZ,
-							true,
-						);
+						const uiState = useStore.getState().ui;
+						if (uiState.walkthroughMode) {
+							useStore.getState().exitWalkthrough();
+						} else {
+							useStore.getState().enterWalkthrough();
+						}
 						break;
 					}
 				}
diff --git a/tests/hooks/walkthroughKeyboard.test.ts b/tests/hooks/walkthroughKeyboard.test.ts
new file mode 100644
index 0000000..58e63ba
--- /dev/null
+++ b/tests/hooks/walkthroughKeyboard.test.ts
@@ -0,0 +1,50 @@
+import { describe, expect, it } from "vitest";
+import { shouldSuppressForWalkthrough } from "../../src/hooks/useKeyboardControls";
+
+describe("shouldSuppressForWalkthrough", () => {
+	it("suppresses camera preset key '1' when walkthroughMode is true", () => {
+		expect(shouldSuppressForWalkthrough("1", true)).toBe(true);
+	});
+
+	it("suppresses camera preset key '6' when walkthroughMode is true", () => {
+		expect(shouldSuppressForWalkthrough("6", true)).toBe(true);
+	});
+
+	it("does NOT suppress '1' when walkthroughMode is false", () => {
+		expect(shouldSuppressForWalkthrough("1", false)).toBe(false);
+	});
+
+	it("suppresses 'r' (reset camera) when walkthroughMode is true", () => {
+		expect(shouldSuppressForWalkthrough("r", true)).toBe(true);
+	});
+
+	it("suppresses 'f' (fit holes) when walkthroughMode is true", () => {
+		expect(shouldSuppressForWalkthrough("f", true)).toBe(true);
+	});
+
+	it("does NOT suppress 'z' (undo) during walkthrough", () => {
+		expect(shouldSuppressForWalkthrough("z", true)).toBe(false);
+	});
+
+	it("does NOT suppress 'Z' (redo) during walkthrough", () => {
+		expect(shouldSuppressForWalkthrough("Z", true)).toBe(false);
+	});
+
+	it("does NOT suppress 'g' (snap toggle) during walkthrough", () => {
+		expect(shouldSuppressForWalkthrough("g", true)).toBe(false);
+	});
+
+	it("does NOT suppress 'G' during walkthrough", () => {
+		expect(shouldSuppressForWalkthrough("G", true)).toBe(false);
+	});
+
+	it("suppresses arrow keys during walkthrough", () => {
+		expect(shouldSuppressForWalkthrough("ArrowUp", true)).toBe(true);
+		expect(shouldSuppressForWalkthrough("ArrowDown", true)).toBe(true);
+	});
+
+	it("returns false for any key when walkthroughMode is false", () => {
+		expect(shouldSuppressForWalkthrough("r", false)).toBe(false);
+		expect(shouldSuppressForWalkthrough("ArrowUp", false)).toBe(false);
+	});
+});
