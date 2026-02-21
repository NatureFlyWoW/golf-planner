diff --git a/src/components/three/HallFloor.tsx b/src/components/three/HallFloor.tsx
index a43ebc7..ac983db 100644
--- a/src/components/three/HallFloor.tsx
+++ b/src/components/three/HallFloor.tsx
@@ -1,13 +1,73 @@
+import { MeshReflectorMaterial } from "@react-three/drei";
+import { useFrame } from "@react-three/fiber";
+import { useRef } from "react";
+import type { GpuTier, ViewMode } from "../../types/ui";
 import { useStore } from "../../store";
 
+// --- Pure gating functions (exported for testing) ---
+
+type ReflectorGateInput = {
+	uvMode: boolean;
+	view: ViewMode;
+	gpuTier: GpuTier;
+	perfCurrent: number;
+};
+
+export function shouldUseReflector(input: ReflectorGateInput): boolean {
+	return (
+		input.uvMode &&
+		input.view === "3d" &&
+		input.gpuTier !== "low" &&
+		input.perfCurrent >= 0.5
+	);
+}
+
+export function getReflectorResolution(gpuTier: GpuTier): number {
+	return gpuTier === "high" ? 512 : 256;
+}
+
+// --- Component ---
+
 export function HallFloor() {
 	const { width, length } = useStore((s) => s.hall);
 	const uvMode = useStore((s) => s.ui.uvMode);
+	const view = useStore((s) => s.ui.view);
+	const gpuTier = useStore((s) => s.ui.gpuTier);
+
+	const perfRef = useRef(1.0);
+	useFrame((state) => {
+		perfRef.current = state.performance.current;
+	});
+
+	const useReflector = shouldUseReflector({
+		uvMode,
+		view,
+		gpuTier,
+		perfCurrent: perfRef.current,
+	});
 
 	return (
-		<mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, length / 2]}>
+		<mesh
+			receiveShadow
+			rotation={[-Math.PI / 2, 0, 0]}
+			position={[width / 2, 0, length / 2]}
+		>
 			<planeGeometry args={[width, length]} />
-			<meshStandardMaterial color={uvMode ? "#0A0A1A" : "#E0E0E0"} />
+			{useReflector ? (
+				<MeshReflectorMaterial
+					resolution={getReflectorResolution(gpuTier)}
+					blur={[200, 100]}
+					mixStrength={0.8}
+					mirror={0}
+					color="#07071A"
+					roughness={0.3}
+					metalness={0.8}
+				/>
+			) : (
+				<meshStandardMaterial
+					color={uvMode ? "#07071A" : "#E0E0E0"}
+				/>
+			)}
 		</mesh>
 	);
 }
diff --git a/tests/reflections.test.ts b/tests/reflections.test.ts
new file mode 100644
index 0000000..b98b386
--- /dev/null
+++ b/tests/reflections.test.ts
@@ -0,0 +1,111 @@
+/**
+ * Tests for MeshReflectorMaterial gating logic and configuration.
+ *
+ * Tests the pure functions that determine:
+ * 1. Whether the reflector should be enabled (boolean gating)
+ * 2. What resolution the reflector should use (tier-dependent)
+ * 3. Whether PerformanceMonitor degradation disables it
+ */
+
+import { describe, expect, it } from "vitest";
+import {
+	getReflectorResolution,
+	shouldUseReflector,
+} from "../src/components/three/HallFloor";
+
+describe("MeshReflectorMaterial gating", () => {
+	describe("shouldUseReflector", () => {
+		it("returns true when uvMode=true, view='3d', gpuTier='mid'", () => {
+			expect(
+				shouldUseReflector({
+					uvMode: true,
+					view: "3d",
+					gpuTier: "mid",
+					perfCurrent: 1.0,
+				}),
+			).toBe(true);
+		});
+
+		it("returns true when uvMode=true, view='3d', gpuTier='high'", () => {
+			expect(
+				shouldUseReflector({
+					uvMode: true,
+					view: "3d",
+					gpuTier: "high",
+					perfCurrent: 1.0,
+				}),
+			).toBe(true);
+		});
+
+		it("returns false when view='top' (any tier)", () => {
+			expect(
+				shouldUseReflector({
+					uvMode: true,
+					view: "top",
+					gpuTier: "high",
+					perfCurrent: 1.0,
+				}),
+			).toBe(false);
+		});
+
+		it("returns false when uvMode=false (any view)", () => {
+			expect(
+				shouldUseReflector({
+					uvMode: false,
+					view: "3d",
+					gpuTier: "high",
+					perfCurrent: 1.0,
+				}),
+			).toBe(false);
+		});
+
+		it("returns false when gpuTier='low' (any state)", () => {
+			expect(
+				shouldUseReflector({
+					uvMode: true,
+					view: "3d",
+					gpuTier: "low",
+					perfCurrent: 1.0,
+				}),
+			).toBe(false);
+		});
+	});
+
+	describe("getReflectorResolution", () => {
+		it("returns 256 for mid tier", () => {
+			expect(getReflectorResolution("mid")).toBe(256);
+		});
+
+		it("returns 512 for high tier", () => {
+			expect(getReflectorResolution("high")).toBe(512);
+		});
+
+		it("returns 256 for low tier (safe default)", () => {
+			expect(getReflectorResolution("low")).toBe(256);
+		});
+	});
+
+	describe("PerformanceMonitor degradation", () => {
+		it("returns false when performance.current < 0.5", () => {
+			expect(
+				shouldUseReflector({
+					uvMode: true,
+					view: "3d",
+					gpuTier: "high",
+					perfCurrent: 0.4,
+				}),
+			).toBe(false);
+		});
+
+		it("returns true when performance.current >= 0.5", () => {
+			expect(
+				shouldUseReflector({
+					uvMode: true,
+					view: "3d",
+					gpuTier: "high",
+					perfCurrent: 0.5,
+				}),
+			).toBe(true);
+		});
+	});
+});
