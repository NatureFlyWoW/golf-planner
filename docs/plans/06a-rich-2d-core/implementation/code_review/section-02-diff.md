diff --git a/src/components/three/FloorGrid.tsx b/src/components/three/FloorGrid.tsx
index 136d1d5..ac95365 100644
--- a/src/components/three/FloorGrid.tsx
+++ b/src/components/three/FloorGrid.tsx
@@ -1,13 +1,18 @@
 import { Grid } from "@react-three/drei";
+import { useViewportId } from "../../hooks/useViewportId";
 import { useStore } from "../../store";
 
 export function FloorGrid() {
 	const { width, length } = useStore((s) => s.hall);
 	const uvMode = useStore((s) => s.ui.uvMode);
 	const gridLayer = useStore((s) => s.ui.layers.grid);
+	const viewportId = useViewportId();
 
 	if (!gridLayer.visible) return null;
 
+	// In 2D viewport, skip drei Grid (replaced by ArchitecturalGrid2D in section 06)
+	if (viewportId === "2d") return null;
+
 	return (
 		<Grid
 			position={[width / 2, 0.01, length / 2]}
diff --git a/src/components/three/Hall.tsx b/src/components/three/Hall.tsx
index cbfd12c..a95f1f6 100644
--- a/src/components/three/Hall.tsx
+++ b/src/components/three/Hall.tsx
@@ -1,5 +1,6 @@
 import { Suspense } from "react";
 import type { SunData } from "../../hooks/useSunPosition";
+import { useViewportId } from "../../hooks/useViewportId";
 import { useStore } from "../../store";
 import { HallFloor } from "./HallFloor";
 import { HallOpenings } from "./HallOpenings";
@@ -11,15 +12,18 @@ type HallProps = {
 
 export function Hall({ sunData }: HallProps) {
 	const wallsLayer = useStore((s) => s.ui.layers.walls);
+	const viewportId = useViewportId();
+	const is2D = viewportId === "2d";
 
 	return (
 		<Suspense fallback={null}>
 			<group>
 				<HallFloor />
-				{wallsLayer.visible && (
+				{/* 3D box-geometry walls: only in 3D viewport (or mobile/null) */}
+				{!is2D && wallsLayer.visible && (
 					<HallWalls layerOpacity={wallsLayer.opacity} />
 				)}
-				{wallsLayer.visible && <HallOpenings sunData={sunData} />}
+				{!is2D && wallsLayer.visible && <HallOpenings sunData={sunData} />}
 			</group>
 		</Suspense>
 	);
diff --git a/src/components/three/SharedScene.tsx b/src/components/three/SharedScene.tsx
index 1e4f699..05a5793 100644
--- a/src/components/three/SharedScene.tsx
+++ b/src/components/three/SharedScene.tsx
@@ -6,6 +6,7 @@ import { FlowPath } from "./FlowPath";
 import { Hall } from "./Hall";
 import { PlacedHoles } from "./PlacedHoles";
 import { SunIndicator } from "./SunIndicator";
+import { ArchitecturalFloorPlan } from "./architectural/ArchitecturalFloorPlan";
 // Temporary spike — remove in Section 10
 import { RenderingSpike } from "./architectural/RenderingSpike";
 
@@ -61,6 +62,7 @@ export function SharedScene({ sunData }: SharedSceneProps) {
 			<PlacedHoles />
 			<FlowPath />
 			<FloorGrid />
+			<ArchitecturalFloorPlan />
 			<SunIndicator sunData={sunData} />
 			{/* Temporary spike — remove in Section 10 */}
 			<RenderingSpike />
diff --git a/src/components/three/architectural/ArchitecturalFloorPlan.tsx b/src/components/three/architectural/ArchitecturalFloorPlan.tsx
new file mode 100644
index 0000000..c2b2df0
--- /dev/null
+++ b/src/components/three/architectural/ArchitecturalFloorPlan.tsx
@@ -0,0 +1,20 @@
+import { useViewportId } from "../../../hooks/useViewportId";
+
+/**
+ * Container for all 2D architectural floor plan elements.
+ * Only renders in the 2D viewport. Children added in sections 03-07.
+ */
+export function ArchitecturalFloorPlan() {
+	const viewportId = useViewportId();
+
+	if (viewportId !== "2d") return null;
+
+	return (
+		<group name="architectural-floor-plan">
+			{/* Section 03: ArchitecturalWalls2D */}
+			{/* Section 04: ArchitecturalOpenings2D */}
+			{/* Section 06: ArchitecturalGrid2D */}
+			{/* Section 07: HoleFelt2D overlays */}
+		</group>
+	);
+}
diff --git a/src/hooks/useViewportId.ts b/src/hooks/useViewportId.ts
new file mode 100644
index 0000000..f037257
--- /dev/null
+++ b/src/hooks/useViewportId.ts
@@ -0,0 +1,21 @@
+import { useContext } from "react";
+import type { ViewportId } from "../contexts/ViewportContext";
+import { ViewportContext } from "../contexts/ViewportContext";
+
+/**
+ * Pure logic extracted for testing: given ViewportInfo or null, returns the id.
+ */
+export function getViewportId(
+	info: { id: ViewportId } | null,
+): ViewportId | null {
+	return info?.id ?? null;
+}
+
+/**
+ * Returns the current viewport id ("2d" or "3d"), or null if not inside
+ * a ViewportContext.Provider (e.g., mobile single-pane mode).
+ */
+export function useViewportId(): ViewportId | null {
+	const info = useContext(ViewportContext);
+	return getViewportId(info);
+}
diff --git a/tests/hooks/useViewportId.test.ts b/tests/hooks/useViewportId.test.ts
new file mode 100644
index 0000000..d876c20
--- /dev/null
+++ b/tests/hooks/useViewportId.test.ts
@@ -0,0 +1,16 @@
+import { describe, expect, it } from "vitest";
+import { getViewportId } from "../../src/hooks/useViewportId";
+
+describe("getViewportId", () => {
+	it("returns '2d' when info has id='2d'", () => {
+		expect(getViewportId({ id: "2d" })).toBe("2d");
+	});
+
+	it("returns '3d' when info has id='3d'", () => {
+		expect(getViewportId({ id: "3d" })).toBe("3d");
+	});
+
+	it("returns null when info is null (mobile fallback)", () => {
+		expect(getViewportId(null)).toBeNull();
+	});
+});
