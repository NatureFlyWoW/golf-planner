diff --git a/src/hooks/useZoomLOD.ts b/src/hooks/useZoomLOD.ts
new file mode 100644
index 0000000..dc03593
--- /dev/null
+++ b/src/hooks/useZoomLOD.ts
@@ -0,0 +1,42 @@
+import { useFrame } from "@react-three/fiber";
+import { useRef } from "react";
+
+/** Level of detail for the 2D architectural view. */
+export type LODLevel = "overview" | "standard" | "detail";
+
+/**
+ * Computes the LOD level from a camera zoom value.
+ *
+ * Thresholds:
+ * - zoom < 15       -> "overview"  (far out, minimal detail)
+ * - 15 <= zoom < 40 -> "standard"  (working zoom, standard detail)
+ * - zoom >= 40      -> "detail"    (close up, full detail)
+ */
+export function computeLODLevel(zoom: number): LODLevel {
+	if (zoom < 15) return "overview";
+	if (zoom < 40) return "standard";
+	return "detail";
+}
+
+/**
+ * Returns a ref containing the current LOD level based on camera zoom.
+ *
+ * Uses useFrame to read camera.zoom each frame. Stores result in a ref
+ * to avoid React state updates and re-renders. Consumers read
+ * `lodRef.current` during their own useFrame or render.
+ *
+ * Must be called inside an R3F Canvas context.
+ */
+export function useZoomLOD(): React.RefObject<LODLevel> {
+	const lodRef = useRef<LODLevel>("standard");
+
+	useFrame(({ camera }) => {
+		if ("zoom" in camera) {
+			lodRef.current = computeLODLevel(
+				(camera as { zoom: number }).zoom,
+			);
+		}
+	});
+
+	return lodRef;
+}
diff --git a/tests/hooks/useZoomLOD.test.ts b/tests/hooks/useZoomLOD.test.ts
new file mode 100644
index 0000000..da56000
--- /dev/null
+++ b/tests/hooks/useZoomLOD.test.ts
@@ -0,0 +1,38 @@
+import { describe, expect, it } from "vitest";
+import { computeLODLevel } from "../../src/hooks/useZoomLOD";
+
+describe("computeLODLevel", () => {
+	it("returns 'overview' when zoom < 15", () => {
+		expect(computeLODLevel(5)).toBe("overview");
+		expect(computeLODLevel(10)).toBe("overview");
+		expect(computeLODLevel(14.9)).toBe("overview");
+	});
+
+	it("returns 'standard' when zoom is between 15 and 40", () => {
+		expect(computeLODLevel(20)).toBe("standard");
+		expect(computeLODLevel(30)).toBe("standard");
+		expect(computeLODLevel(39.9)).toBe("standard");
+	});
+
+	it("returns 'detail' when zoom >= 40", () => {
+		expect(computeLODLevel(40)).toBe("detail");
+		expect(computeLODLevel(50)).toBe("detail");
+		expect(computeLODLevel(100)).toBe("detail");
+	});
+
+	it("boundary at exactly 15 returns 'standard'", () => {
+		expect(computeLODLevel(15)).toBe("standard");
+	});
+
+	it("boundary at exactly 40 returns 'detail'", () => {
+		expect(computeLODLevel(40)).toBe("detail");
+	});
+
+	it("returns 'overview' for zoom of 0", () => {
+		expect(computeLODLevel(0)).toBe("overview");
+	});
+
+	it("returns 'overview' for negative zoom (edge case)", () => {
+		expect(computeLODLevel(-1)).toBe("overview");
+	});
+});
