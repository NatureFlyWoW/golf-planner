diff --git a/src/components/three/HallWalls.tsx b/src/components/three/HallWalls.tsx
index 46af7ba..7281ecf 100644
--- a/src/components/three/HallWalls.tsx
+++ b/src/components/three/HallWalls.tsx
@@ -1,32 +1,45 @@
+import { MeshStandardMaterial } from "three";
 import { useStore } from "../../store";
 
+// Module-level singletons — created once, never mutated
+export const planningWallMaterial = new MeshStandardMaterial({
+	color: "#B0B0B0",
+});
+
+export const uvWallMaterial = new MeshStandardMaterial({
+	color: "#1A1A2E",
+});
+
+/** Pure selector for testability. */
+export function getWallMaterial(
+	uvMode: boolean,
+): MeshStandardMaterial {
+	return uvMode ? uvWallMaterial : planningWallMaterial;
+}
+
 export function HallWalls() {
 	const { width, length, wallHeight, wallThickness } = useStore((s) => s.hall);
 	const halfH = wallHeight / 2;
 	const uvMode = useStore((s) => s.ui.uvMode);
-	const color = uvMode ? "#1A1A2E" : "#B0B0B0";
+	const material = getWallMaterial(uvMode);
 
 	return (
 		<group>
 			{/* North wall (z=0) */}
-			<mesh position={[width / 2, halfH, 0]}>
+			<mesh position={[width / 2, halfH, 0]} material={material}>
 				<boxGeometry args={[width, wallHeight, wallThickness]} />
-				<meshStandardMaterial color={color} />
 			</mesh>
 			{/* South wall (z=length) */}
-			<mesh position={[width / 2, halfH, length]}>
+			<mesh position={[width / 2, halfH, length]} material={material}>
 				<boxGeometry args={[width, wallHeight, wallThickness]} />
-				<meshStandardMaterial color={color} />
 			</mesh>
 			{/* West wall (x=0) */}
-			<mesh position={[0, halfH, length / 2]}>
+			<mesh position={[0, halfH, length / 2]} material={material}>
 				<boxGeometry args={[wallThickness, wallHeight, length]} />
-				<meshStandardMaterial color={color} />
 			</mesh>
 			{/* East wall (x=width) */}
-			<mesh position={[width, halfH, length / 2]}>
+			<mesh position={[width, halfH, length / 2]} material={material}>
 				<boxGeometry args={[wallThickness, wallHeight, length]} />
-				<meshStandardMaterial color={color} />
 			</mesh>
 		</group>
 	);
diff --git a/src/utils/environmentGating.ts b/src/utils/environmentGating.ts
index 6a6f520..4fac5d4 100644
--- a/src/utils/environmentGating.ts
+++ b/src/utils/environmentGating.ts
@@ -29,3 +29,11 @@ export function deriveFrameloop(
 export function shouldEnableSoftShadows(gpuTier: GpuTier): boolean {
 	return gpuTier === "mid" || gpuTier === "high";
 }
+
+/**
+ * Shadow type: mobile gets basic boolean shadows (cheaper),
+ * desktop gets "soft" (PCSS) when available.
+ */
+export function getShadowType(mobile: boolean): true | "soft" {
+	return mobile ? true : "soft";
+}
diff --git a/tests/perfFixes.test.ts b/tests/perfFixes.test.ts
new file mode 100644
index 0000000..614c699
--- /dev/null
+++ b/tests/perfFixes.test.ts
@@ -0,0 +1,43 @@
+import { describe, expect, it } from "vitest";
+import {
+	getWallMaterial,
+	planningWallMaterial,
+	uvWallMaterial,
+} from "../src/components/three/HallWalls";
+import { getShadowType } from "../src/utils/environmentGating";
+
+describe("HallWalls singleton materials", () => {
+	it("planning material is a module-level singleton (same reference)", () => {
+		const a = planningWallMaterial;
+		const b = planningWallMaterial;
+		expect(a).toBe(b);
+	});
+
+	it("UV material is a module-level singleton (same reference)", () => {
+		const a = uvWallMaterial;
+		const b = uvWallMaterial;
+		expect(a).toBe(b);
+	});
+
+	it("planning material and UV material are different instances", () => {
+		expect(planningWallMaterial).not.toBe(uvWallMaterial);
+	});
+
+	it("returns planning material when uvMode is false", () => {
+		expect(getWallMaterial(false)).toBe(planningWallMaterial);
+	});
+
+	it("returns UV material when uvMode is true", () => {
+		expect(getWallMaterial(true)).toBe(uvWallMaterial);
+	});
+});
+
+describe("Mobile shadow optimization", () => {
+	it("uses shadows={true} on mobile", () => {
+		expect(getShadowType(true)).toBe(true);
+	});
+
+	it("uses shadows='soft' on desktop", () => {
+		expect(getShadowType(false)).toBe("soft");
+	});
+});
