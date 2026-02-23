diff --git a/src/components/three/architectural/ArchitecturalFloorPlan.tsx b/src/components/three/architectural/ArchitecturalFloorPlan.tsx
index 083610e..f4be499 100644
--- a/src/components/three/architectural/ArchitecturalFloorPlan.tsx
+++ b/src/components/three/architectural/ArchitecturalFloorPlan.tsx
@@ -1,4 +1,5 @@
 import { useViewportId } from "../../../hooks/useViewportId";
+import { ArchitecturalGrid2D } from "./ArchitecturalGrid2D";
 import { ArchitecturalOpenings2D } from "./ArchitecturalOpenings2D";
 import { ArchitecturalWalls2D } from "./ArchitecturalWalls2D";
 
@@ -13,9 +14,9 @@ export function ArchitecturalFloorPlan() {
 
 	return (
 		<group name="architectural-floor-plan">
+			<ArchitecturalGrid2D />
 			<ArchitecturalWalls2D />
 			<ArchitecturalOpenings2D />
-			{/* Section 06: ArchitecturalGrid2D */}
 			{/* Section 07: HoleFelt2D overlays */}
 		</group>
 	);
diff --git a/src/components/three/architectural/ArchitecturalGrid2D.tsx b/src/components/three/architectural/ArchitecturalGrid2D.tsx
new file mode 100644
index 0000000..95dc4bc
--- /dev/null
+++ b/src/components/three/architectural/ArchitecturalGrid2D.tsx
@@ -0,0 +1,166 @@
+import { Line, Text } from "@react-three/drei";
+import { useFrame, useThree } from "@react-three/fiber";
+import { useMemo, useRef, useState } from "react";
+import type { Group } from "three";
+import { useGroupOpacity } from "../../../hooks/useGroupOpacity";
+import { useStore } from "../../../store";
+import {
+	computeGridLabelPositions,
+	computeGridLineSegments,
+	computeGridSpacing,
+} from "../../../utils/gridSpacing";
+
+const COLORS = {
+	planning: { major: "#cccccc", minor: "#eeeeee", label: "#999999" },
+	uv: { major: "#2A2A5E", minor: "#1A1A4E", label: "#4A4A8E" },
+};
+
+const LABEL_FONT_SIZE = 0.3;
+const noRaycast = () => {};
+
+/**
+ * Custom architectural grid for the 2D viewport with labeled coordinates
+ * and adaptive spacing based on camera zoom level.
+ * Replaces the drei <Grid> which continues to render in the 3D viewport.
+ */
+export function ArchitecturalGrid2D() {
+	const groupRef = useRef<Group>(null);
+	const labelsRef = useRef<Group>(null);
+	const gridLayer = useStore((s) => s.ui.layers.grid);
+	const uvMode = useStore((s) => s.ui.uvMode);
+	const hall = useStore((s) => s.hall);
+
+	useGroupOpacity(groupRef, gridLayer.opacity);
+
+	// Track zoom band for adaptive spacing (only re-render at thresholds)
+	const [zoomBand, setZoomBand] = useState<"far" | "medium" | "close">(
+		"medium",
+	);
+	const lastBandRef = useRef(zoomBand);
+
+	useFrame(({ camera }) => {
+		if (!("zoom" in camera)) return;
+		const zoom = (camera as { zoom: number }).zoom;
+
+		// Update zoom band for grid density
+		let band: "far" | "medium" | "close";
+		if (zoom < 10) band = "far";
+		else if (zoom <= 30) band = "medium";
+		else band = "close";
+		if (band !== lastBandRef.current) {
+			lastBandRef.current = band;
+			setZoomBand(band);
+		}
+
+		// Imperatively scale labels for constant screen size
+		if (labelsRef.current) {
+			const scale = 40 / zoom;
+			for (const child of labelsRef.current.children) {
+				child.scale.setScalar(scale);
+			}
+		}
+	});
+
+	const { camera } = useThree();
+	const currentZoom =
+		"zoom" in camera ? (camera as { zoom: number }).zoom : 40;
+	// eslint-disable-next-line react-hooks/exhaustive-deps -- zoomBand triggers recalc
+	const spacing = useMemo(() => computeGridSpacing(currentZoom), [zoomBand]);
+
+	const majorPoints = useMemo(
+		() =>
+			computeGridLineSegments(hall.width, hall.length, spacing.majorSpacing),
+		[hall.width, hall.length, spacing.majorSpacing],
+	);
+
+	const minorPoints = useMemo(() => {
+		if (!spacing.minorSpacing) return null;
+		const allMinor = computeGridLineSegments(
+			hall.width,
+			hall.length,
+			spacing.minorSpacing,
+		);
+		// Filter out lines that coincide with major lines
+		const majorSet = new Set<string>();
+		for (let i = 0; i < majorPoints.length; i += 2) {
+			const p = majorPoints[i];
+			majorSet.add(`${p[0]},${p[2]}`);
+		}
+		const filtered: Array<[number, number, number]> = [];
+		for (let i = 0; i < allMinor.length; i += 2) {
+			const key = `${allMinor[i][0]},${allMinor[i][2]}`;
+			if (!majorSet.has(key)) {
+				filtered.push(allMinor[i], allMinor[i + 1]);
+			}
+		}
+		return filtered;
+	}, [hall.width, hall.length, spacing.minorSpacing, majorPoints]);
+
+	const xLabels = useMemo(
+		() => computeGridLabelPositions("x", hall.width, spacing.majorSpacing),
+		[hall.width, spacing.majorSpacing],
+	);
+
+	const zLabels = useMemo(
+		() => computeGridLabelPositions("z", hall.length, spacing.majorSpacing),
+		[hall.length, spacing.majorSpacing],
+	);
+
+	if (!gridLayer.visible) return null;
+
+	const colors = uvMode ? COLORS.uv : COLORS.planning;
+
+	return (
+		<group ref={groupRef} name="architectural-grid-2d">
+			{majorPoints.length > 0 && (
+				<Line
+					points={majorPoints}
+					segments
+					color={colors.major}
+					lineWidth={0.5}
+					worldUnits={false}
+				/>
+			)}
+
+			{minorPoints && minorPoints.length > 0 && (
+				<Line
+					points={minorPoints}
+					segments
+					color={colors.minor}
+					lineWidth={0.3}
+					worldUnits={false}
+				/>
+			)}
+
+			{/* Labels at world positions; scale set imperatively in useFrame */}
+			<group ref={labelsRef}>
+				{xLabels.map((label) => (
+					<Text
+						key={`x-${label.value}`}
+						position={label.position}
+						fontSize={LABEL_FONT_SIZE}
+						color={colors.label}
+						anchorX="center"
+						anchorY="middle"
+						raycast={noRaycast}
+					>
+						{String(label.value)}
+					</Text>
+				))}
+				{zLabels.map((label) => (
+					<Text
+						key={`z-${label.value}`}
+						position={label.position}
+						fontSize={LABEL_FONT_SIZE}
+						color={colors.label}
+						anchorX="center"
+						anchorY="middle"
+						raycast={noRaycast}
+					>
+						{String(label.value)}
+					</Text>
+				))}
+			</group>
+		</group>
+	);
+}
diff --git a/src/utils/gridSpacing.ts b/src/utils/gridSpacing.ts
new file mode 100644
index 0000000..bed838c
--- /dev/null
+++ b/src/utils/gridSpacing.ts
@@ -0,0 +1,69 @@
+export type GridSpacing = {
+	majorSpacing: number;
+	minorSpacing: number | null;
+};
+
+export type GridLabel = {
+	value: number;
+	position: [number, number, number];
+};
+
+/**
+ * Determines grid line spacing based on camera zoom level.
+ * Returns major and minor spacing in meters.
+ */
+export function computeGridSpacing(zoom: number): GridSpacing {
+	if (zoom < 10) {
+		return { majorSpacing: 5, minorSpacing: null };
+	}
+	if (zoom <= 30) {
+		return { majorSpacing: 1, minorSpacing: 0.5 };
+	}
+	return { majorSpacing: 1, minorSpacing: 0.25 };
+}
+
+/**
+ * Generates label positions along an axis edge.
+ * X-axis labels are placed along the top edge (Z = -0.5).
+ * Z-axis labels are placed along the left edge (X = -0.5).
+ */
+export function computeGridLabelPositions(
+	axis: "x" | "z",
+	maxValue: number,
+	spacing: number,
+): GridLabel[] {
+	const labels: GridLabel[] = [];
+	for (let v = 0; v <= maxValue + spacing * 0.01; v += spacing) {
+		const value = Math.round(v * 1000) / 1000;
+		if (value > maxValue) break;
+		const position: [number, number, number] =
+			axis === "x" ? [value, 0.01, -0.5] : [-0.5, 0.01, value];
+		labels.push({ value, position });
+	}
+	return labels;
+}
+
+/**
+ * Generates grid line segment points for batched rendering.
+ * Each consecutive pair of points forms one line segment.
+ */
+export function computeGridLineSegments(
+	hallWidth: number,
+	hallLength: number,
+	spacing: number,
+): Array<[number, number, number]> {
+	const points: Array<[number, number, number]> = [];
+	// Vertical lines (constant X)
+	for (let x = 0; x <= hallWidth + spacing * 0.01; x += spacing) {
+		const xr = Math.round(x * 1000) / 1000;
+		if (xr > hallWidth) break;
+		points.push([xr, 0.01, 0], [xr, 0.01, hallLength]);
+	}
+	// Horizontal lines (constant Z)
+	for (let z = 0; z <= hallLength + spacing * 0.01; z += spacing) {
+		const zr = Math.round(z * 1000) / 1000;
+		if (zr > hallLength) break;
+		points.push([0, 0.01, zr], [hallWidth, 0.01, zr]);
+	}
+	return points;
+}
diff --git a/tests/utils/gridSpacing.test.ts b/tests/utils/gridSpacing.test.ts
new file mode 100644
index 0000000..223b1f3
--- /dev/null
+++ b/tests/utils/gridSpacing.test.ts
@@ -0,0 +1,72 @@
+import { describe, expect, it } from "vitest";
+import {
+	computeGridSpacing,
+	computeGridLabelPositions,
+} from "../../src/utils/gridSpacing";
+
+describe("computeGridSpacing", () => {
+	it("returns 5m major lines with no minor lines at zoom < 10", () => {
+		const result = computeGridSpacing(5);
+		expect(result.majorSpacing).toBe(5);
+		expect(result.minorSpacing).toBeNull();
+	});
+
+	it("returns 1m major + 0.5m minor lines at zoom 10-30", () => {
+		const result = computeGridSpacing(20);
+		expect(result.majorSpacing).toBe(1);
+		expect(result.minorSpacing).toBe(0.5);
+	});
+
+	it("returns 1m major + 0.25m minor lines at zoom > 30", () => {
+		const result = computeGridSpacing(50);
+		expect(result.majorSpacing).toBe(1);
+		expect(result.minorSpacing).toBe(0.25);
+	});
+
+	it("boundary: zoom exactly 10 returns medium spacing", () => {
+		const result = computeGridSpacing(10);
+		expect(result.majorSpacing).toBe(1);
+		expect(result.minorSpacing).toBe(0.5);
+	});
+
+	it("boundary: zoom exactly 30 returns medium spacing", () => {
+		const result = computeGridSpacing(30);
+		expect(result.majorSpacing).toBe(1);
+		expect(result.minorSpacing).toBe(0.5);
+	});
+
+	it("boundary: zoom 30.01 returns close spacing", () => {
+		const result = computeGridSpacing(30.01);
+		expect(result.majorSpacing).toBe(1);
+		expect(result.minorSpacing).toBe(0.25);
+	});
+});
+
+describe("computeGridLabelPositions", () => {
+	it("returns correct X-axis label positions for 10m width at 1m spacing", () => {
+		const labels = computeGridLabelPositions("x", 10, 1);
+		expect(labels).toHaveLength(11);
+		expect(labels[0]).toEqual({ value: 0, position: [0, 0.01, -0.5] });
+		expect(labels[10]).toEqual({ value: 10, position: [10, 0.01, -0.5] });
+	});
+
+	it("returns correct Z-axis label positions for 20m length at 1m spacing", () => {
+		const labels = computeGridLabelPositions("z", 20, 1);
+		expect(labels).toHaveLength(21);
+		expect(labels[0]).toEqual({ value: 0, position: [-0.5, 0.01, 0] });
+		expect(labels[20]).toEqual({ value: 20, position: [-0.5, 0.01, 20] });
+	});
+
+	it("returns correct positions at 5m spacing for overview zoom", () => {
+		const labels = computeGridLabelPositions("x", 10, 5);
+		expect(labels).toHaveLength(3);
+		expect(labels[0].value).toBe(0);
+		expect(labels[1].value).toBe(5);
+		expect(labels[2].value).toBe(10);
+	});
+
+	it("returns correct Z labels at 5m spacing", () => {
+		const labels = computeGridLabelPositions("z", 20, 5);
+		expect(labels).toHaveLength(5);
+	});
+});
