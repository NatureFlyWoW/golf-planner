diff --git a/src/components/three/ThreeCanvas.tsx b/src/components/three/ThreeCanvas.tsx
index d3c37b1..bbacf90 100644
--- a/src/components/three/ThreeCanvas.tsx
+++ b/src/components/three/ThreeCanvas.tsx
@@ -26,6 +26,7 @@ import { PlacementHandler } from "./PlacementHandler";
 import { ScreenshotCapture } from "./ScreenshotCapture";
 import { SunIndicator } from "./SunIndicator";
 import { UVEffects } from "./UVEffects";
+import { UVLamps } from "./UVLamps";
 
 type ThreeCanvasProps = {
 	sunData: SunData;
@@ -119,6 +120,7 @@ export default function ThreeCanvas({ sunData }: ThreeCanvasProps) {
 					shadow-bias={-0.001}
 				/>
 			)}
+			{uvMode && <UVLamps />}
 			<CameraControls />
 			<FloorGrid />
 			<Hall sunData={sunData} />
diff --git a/src/components/three/UVLamps.tsx b/src/components/three/UVLamps.tsx
new file mode 100644
index 0000000..7f55e30
--- /dev/null
+++ b/src/components/three/UVLamps.tsx
@@ -0,0 +1,46 @@
+import {
+	UV_LAMP_COLOR,
+	UV_LAMP_HEIGHT,
+	UV_LAMP_INTENSITY,
+	UV_LAMP_POSITIONS,
+	UV_LAMP_WIDTH,
+} from "../../constants/uvLamps";
+import type { ViewMode } from "../../types/ui";
+import { useStore } from "../../store";
+
+export function shouldShowFixtures(view: ViewMode): boolean {
+	return view === "3d";
+}
+
+export function UVLamps() {
+	const view = useStore((s) => s.ui.view);
+	const fixturesVisible = shouldShowFixtures(view);
+
+	return (
+		<group>
+			{UV_LAMP_POSITIONS.map((pos) => (
+				<group key={`uv-lamp-${pos[0]}-${pos[2]}`} position={pos}>
+					{/* RectAreaLight: actual illumination facing downward */}
+					<rectAreaLight
+						color={UV_LAMP_COLOR}
+						intensity={UV_LAMP_INTENSITY}
+						width={UV_LAMP_WIDTH}
+						height={UV_LAMP_HEIGHT}
+						rotation={[-Math.PI / 2, 0, 0]}
+					/>
+					{/* Visible fixture mesh: thin emissive strip */}
+					<mesh visible={fixturesVisible}>
+						<boxGeometry
+							args={[UV_LAMP_WIDTH, 0.05, UV_LAMP_HEIGHT]}
+						/>
+						<meshStandardMaterial
+							color={UV_LAMP_COLOR}
+							emissive={UV_LAMP_COLOR}
+							emissiveIntensity={2.0}
+						/>
+					</mesh>
+				</group>
+			))}
+		</group>
+	);
+}
diff --git a/tests/materialPresets.test.ts b/tests/materialPresets.test.ts
new file mode 100644
index 0000000..dff6431
--- /dev/null
+++ b/tests/materialPresets.test.ts
@@ -0,0 +1,8 @@
+import { describe, expect, it } from "vitest";
+import { UV_EMISSIVE_INTENSITY } from "../src/components/three/holes/materialPresets";
+
+describe("materialPresets", () => {
+	it("UV_EMISSIVE_INTENSITY is 2.0", () => {
+		expect(UV_EMISSIVE_INTENSITY).toBe(2.0);
+	});
+});
diff --git a/tests/uvLamps.test.ts b/tests/uvLamps.test.ts
new file mode 100644
index 0000000..779a3f9
--- /dev/null
+++ b/tests/uvLamps.test.ts
@@ -0,0 +1,60 @@
+import { readFileSync } from "node:fs";
+import { resolve } from "node:path";
+import { describe, expect, it } from "vitest";
+import {
+	UV_LAMP_COLOR,
+	UV_LAMP_HEIGHT,
+	UV_LAMP_INTENSITY,
+	UV_LAMP_POSITIONS,
+	UV_LAMP_WIDTH,
+} from "../src/constants/uvLamps";
+import { shouldShowFixtures } from "../src/components/three/UVLamps";
+
+describe("UV Lamps", () => {
+	describe("UV_LAMP_POSITIONS", () => {
+		it("has 4 entries", () => {
+			expect(UV_LAMP_POSITIONS).toHaveLength(4);
+		});
+
+		it("positions match expected coordinates", () => {
+			expect(UV_LAMP_POSITIONS).toEqual([
+				[2.5, 4.3, 5],
+				[7.5, 4.3, 5],
+				[2.5, 4.3, 15],
+				[7.5, 4.3, 15],
+			]);
+		});
+	});
+
+	it("UV lamp color is #8800FF", () => {
+		expect(UV_LAMP_COLOR).toBe("#8800FF");
+	});
+
+	it("UV lamp intensity is 0.8", () => {
+		expect(UV_LAMP_INTENSITY).toBe(0.8);
+	});
+
+	it("UV lamp dimensions — width 0.3, height 2", () => {
+		expect(UV_LAMP_WIDTH).toBe(0.3);
+		expect(UV_LAMP_HEIGHT).toBe(2);
+	});
+
+	describe("fixture visibility gating", () => {
+		it("visible when view='3d'", () => {
+			expect(shouldShowFixtures("3d")).toBe(true);
+		});
+
+		it("hidden when view='top'", () => {
+			expect(shouldShowFixtures("top")).toBe(false);
+		});
+	});
+
+	it("lamp fixture has NO transparent/depthWrite props", () => {
+		const src = readFileSync(
+			resolve(__dirname, "../src/components/three/UVLamps.tsx"),
+			"utf-8",
+		);
+		expect(src).not.toContain("transparent");
+		expect(src).not.toContain("depthWrite");
+	});
+});
