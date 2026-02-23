diff --git a/src/components/three/architectural/ArchitecturalFloorPlan.tsx b/src/components/three/architectural/ArchitecturalFloorPlan.tsx
index 63a825f..083610e 100644
--- a/src/components/three/architectural/ArchitecturalFloorPlan.tsx
+++ b/src/components/three/architectural/ArchitecturalFloorPlan.tsx
@@ -1,4 +1,5 @@
 import { useViewportId } from "../../../hooks/useViewportId";
+import { ArchitecturalOpenings2D } from "./ArchitecturalOpenings2D";
 import { ArchitecturalWalls2D } from "./ArchitecturalWalls2D";
 
 /**
@@ -13,7 +14,7 @@ export function ArchitecturalFloorPlan() {
 	return (
 		<group name="architectural-floor-plan">
 			<ArchitecturalWalls2D />
-			{/* Section 04: ArchitecturalOpenings2D */}
+			<ArchitecturalOpenings2D />
 			{/* Section 06: ArchitecturalGrid2D */}
 			{/* Section 07: HoleFelt2D overlays */}
 		</group>
diff --git a/src/components/three/architectural/ArchitecturalOpenings2D.tsx b/src/components/three/architectural/ArchitecturalOpenings2D.tsx
new file mode 100644
index 0000000..8053cdb
--- /dev/null
+++ b/src/components/three/architectural/ArchitecturalOpenings2D.tsx
@@ -0,0 +1,34 @@
+import { useStore } from "../../../store";
+import { DoorSymbol2D } from "./DoorSymbol2D";
+import { WindowSymbol2D } from "./WindowSymbol2D";
+
+export function ArchitecturalOpenings2D() {
+	const { doors, windows, width, length } = useStore((s) => s.hall);
+	const uvMode = useStore((s) => s.ui.uvMode);
+	const wallsVisible = useStore((s) => s.ui.layers.walls?.visible ?? true);
+
+	if (!wallsVisible) return null;
+
+	return (
+		<group name="architectural-openings-2d">
+			{doors.map((door) => (
+				<DoorSymbol2D
+					key={door.id}
+					door={door}
+					hallWidth={width}
+					hallLength={length}
+					uvMode={uvMode}
+				/>
+			))}
+			{windows.map((win) => (
+				<WindowSymbol2D
+					key={win.id}
+					window={win}
+					hallWidth={width}
+					hallLength={length}
+					uvMode={uvMode}
+				/>
+			))}
+		</group>
+	);
+}
diff --git a/src/components/three/architectural/DoorSymbol2D.tsx b/src/components/three/architectural/DoorSymbol2D.tsx
new file mode 100644
index 0000000..2707d1a
--- /dev/null
+++ b/src/components/three/architectural/DoorSymbol2D.tsx
@@ -0,0 +1,47 @@
+import { Line } from "@react-three/drei";
+import { useMemo } from "react";
+import type { DoorSpec } from "../../../types/hall";
+import { computeDoorArc } from "../../../utils/arcPoints";
+
+const COLORS = {
+	planning: "#555555",
+	uv: "#3A3A6E",
+} as const;
+
+const WALL_THICKNESS = 0.2;
+
+export function DoorSymbol2D({
+	door,
+	hallWidth,
+	hallLength,
+	uvMode,
+}: {
+	door: DoorSpec;
+	hallWidth: number;
+	hallLength: number;
+	uvMode: boolean;
+}) {
+	const { arcPoints, panelLine } = useMemo(
+		() => computeDoorArc(door, hallWidth, hallLength, WALL_THICKNESS),
+		[door, hallWidth, hallLength],
+	);
+
+	const color = uvMode ? COLORS.uv : COLORS.planning;
+
+	return (
+		<group>
+			<Line
+				points={arcPoints}
+				lineWidth={1.5}
+				worldUnits={false}
+				color={color}
+			/>
+			<Line
+				points={panelLine}
+				lineWidth={1.5}
+				worldUnits={false}
+				color={color}
+			/>
+		</group>
+	);
+}
diff --git a/src/components/three/architectural/WindowSymbol2D.tsx b/src/components/three/architectural/WindowSymbol2D.tsx
new file mode 100644
index 0000000..df859f7
--- /dev/null
+++ b/src/components/three/architectural/WindowSymbol2D.tsx
@@ -0,0 +1,53 @@
+import { Line } from "@react-three/drei";
+import { useMemo } from "react";
+import type { WindowSpec } from "../../../types/hall";
+import { computeWindowLines } from "../../../utils/arcPoints";
+
+const COLORS = {
+	planning: "#6699CC",
+	uv: "#3300AA",
+} as const;
+
+const WALL_THICKNESS = 0.2;
+
+export function WindowSymbol2D({
+	window: win,
+	hallWidth,
+	hallLength,
+	uvMode,
+}: {
+	window: WindowSpec;
+	hallWidth: number;
+	hallLength: number;
+	uvMode: boolean;
+}) {
+	const { allPoints } = useMemo(() => {
+		const { glassLines, breakTicks } = computeWindowLines(
+			win,
+			hallWidth,
+			hallLength,
+			WALL_THICKNESS,
+		);
+		// Flatten all line segments into pairs for segments={true} mode
+		const pts: [number, number, number][] = [];
+		for (const [a, b] of glassLines) {
+			pts.push(a, b);
+		}
+		for (const [a, b] of breakTicks) {
+			pts.push(a, b);
+		}
+		return { allPoints: pts };
+	}, [win, hallWidth, hallLength]);
+
+	const color = uvMode ? COLORS.uv : COLORS.planning;
+
+	return (
+		<Line
+			points={allPoints}
+			segments
+			lineWidth={1}
+			worldUnits={false}
+			color={color}
+		/>
+	);
+}
diff --git a/src/utils/arcPoints.ts b/src/utils/arcPoints.ts
new file mode 100644
index 0000000..9a39eb8
--- /dev/null
+++ b/src/utils/arcPoints.ts
@@ -0,0 +1,234 @@
+import type { DoorSpec, Wall, WindowSpec } from "../types/hall";
+
+type Point3 = [number, number, number];
+
+const Y = 0.02;
+
+/**
+ * Returns the hinge position and wall-parallel/perpendicular directions
+ * for a door on a given wall side.
+ */
+function getDoorGeometry(
+	door: DoorSpec,
+	hallWidth: number,
+	hallLength: number,
+) {
+	const outward = door.type === "sectional";
+
+	switch (door.wall) {
+		case "south": {
+			const hingeX = door.offset;
+			const hingeZ = hallLength;
+			// Along wall = +X, perpendicular outward = +Z
+			return {
+				hinge: [hingeX, Y, hingeZ] as Point3,
+				alongX: 1,
+				alongZ: 0,
+				perpX: 0,
+				perpZ: outward ? 1 : -1,
+			};
+		}
+		case "north": {
+			const hingeX = door.offset;
+			const hingeZ = 0;
+			return {
+				hinge: [hingeX, Y, hingeZ] as Point3,
+				alongX: 1,
+				alongZ: 0,
+				perpX: 0,
+				perpZ: outward ? -1 : 1,
+			};
+		}
+		case "east": {
+			const hingeX = hallWidth;
+			const hingeZ = door.offset;
+			return {
+				hinge: [hingeX, Y, hingeZ] as Point3,
+				alongX: 0,
+				alongZ: 1,
+				perpX: outward ? 1 : -1,
+				perpZ: 0,
+			};
+		}
+		case "west": {
+			const hingeX = 0;
+			const hingeZ = door.offset;
+			return {
+				hinge: [hingeX, Y, hingeZ] as Point3,
+				alongX: 0,
+				alongZ: 1,
+				perpX: outward ? -1 : 1,
+				perpZ: 0,
+			};
+		}
+	}
+}
+
+export function computeDoorArc(
+	door: DoorSpec,
+	hallWidth: number,
+	hallLength: number,
+	_wallThickness: number,
+	segments = 24,
+): {
+	arcPoints: Point3[];
+	panelLine: [Point3, Point3];
+} {
+	const { hinge, alongX, alongZ, perpX, perpZ } = getDoorGeometry(
+		door,
+		hallWidth,
+		hallLength,
+	);
+	const radius = door.width;
+
+	const arcPoints: Point3[] = [];
+	for (let i = 0; i <= segments; i++) {
+		const angle = (i / segments) * (Math.PI / 2);
+		const cos = Math.cos(angle);
+		const sin = Math.sin(angle);
+		arcPoints.push([
+			hinge[0] + radius * (cos * alongX + sin * perpX),
+			Y,
+			hinge[2] + radius * (cos * alongZ + sin * perpZ),
+		]);
+	}
+
+	const panelLine: [Point3, Point3] = [
+		[...hinge],
+		[
+			hinge[0] + radius * alongX,
+			Y,
+			hinge[2] + radius * alongZ,
+		],
+	];
+
+	return { arcPoints, panelLine };
+}
+
+function getWindowGeometry(
+	win: WindowSpec,
+	hallWidth: number,
+	hallLength: number,
+	wallThickness: number,
+) {
+	switch (win.wall) {
+		case "east": {
+			const outerFace = hallWidth;
+			const innerFace = hallWidth - wallThickness;
+			return {
+				// Glass lines run along Z
+				glassLine1X: outerFace - wallThickness * 0.7,
+				glassLine2X: outerFace - wallThickness * 0.3,
+				startZ: win.offset,
+				endZ: win.offset + win.width,
+				// Break ticks run along X
+				tickInnerX: innerFace,
+				tickOuterX: outerFace,
+				axis: "z" as const,
+			};
+		}
+		case "west": {
+			const outerFace = 0;
+			const innerFace = wallThickness;
+			return {
+				glassLine1X: outerFace + wallThickness * 0.7,
+				glassLine2X: outerFace + wallThickness * 0.3,
+				startZ: win.offset,
+				endZ: win.offset + win.width,
+				tickInnerX: innerFace,
+				tickOuterX: outerFace,
+				axis: "z" as const,
+			};
+		}
+		case "south": {
+			const outerFace = hallLength;
+			const innerFace = hallLength - wallThickness;
+			return {
+				glassLine1X: outerFace - wallThickness * 0.7,
+				glassLine2X: outerFace - wallThickness * 0.3,
+				startZ: win.offset,
+				endZ: win.offset + win.width,
+				tickInnerX: innerFace,
+				tickOuterX: outerFace,
+				axis: "x" as const,
+			};
+		}
+		case "north": {
+			const outerFace = 0;
+			const innerFace = wallThickness;
+			return {
+				glassLine1X: outerFace + wallThickness * 0.7,
+				glassLine2X: outerFace + wallThickness * 0.3,
+				startZ: win.offset,
+				endZ: win.offset + win.width,
+				tickInnerX: innerFace,
+				tickOuterX: outerFace,
+				axis: "x" as const,
+			};
+		}
+	}
+}
+
+export function computeWindowLines(
+	win: WindowSpec,
+	hallWidth: number,
+	hallLength: number,
+	wallThickness: number,
+): {
+	glassLines: [Point3, Point3][];
+	breakTicks: [Point3, Point3][];
+} {
+	const geom = getWindowGeometry(win, hallWidth, hallLength, wallThickness);
+
+	if (geom.axis === "z") {
+		// East/west walls: glass lines run along Z, ticks along X
+		const glassLines: [Point3, Point3][] = [
+			[
+				[geom.glassLine1X, Y, geom.startZ],
+				[geom.glassLine1X, Y, geom.endZ],
+			],
+			[
+				[geom.glassLine2X, Y, geom.startZ],
+				[geom.glassLine2X, Y, geom.endZ],
+			],
+		];
+
+		const breakTicks: [Point3, Point3][] = [
+			[
+				[geom.tickInnerX, Y, geom.startZ],
+				[geom.tickOuterX, Y, geom.startZ],
+			],
+			[
+				[geom.tickInnerX, Y, geom.endZ],
+				[geom.tickOuterX, Y, geom.endZ],
+			],
+		];
+
+		return { glassLines, breakTicks };
+	}
+
+	// North/south walls: glass lines run along X, ticks along Z
+	const glassLines: [Point3, Point3][] = [
+		[
+			[geom.startZ, Y, geom.glassLine1X],
+			[geom.endZ, Y, geom.glassLine1X],
+		],
+		[
+			[geom.startZ, Y, geom.glassLine2X],
+			[geom.endZ, Y, geom.glassLine2X],
+		],
+	];
+
+	const breakTicks: [Point3, Point3][] = [
+		[
+			[geom.startZ, Y, geom.tickInnerX],
+			[geom.startZ, Y, geom.tickOuterX],
+		],
+		[
+			[geom.endZ, Y, geom.tickInnerX],
+			[geom.endZ, Y, geom.tickOuterX],
+		],
+	];
+
+	return { glassLines, breakTicks };
+}
diff --git a/tests/utils/arcPoints.test.ts b/tests/utils/arcPoints.test.ts
new file mode 100644
index 0000000..d8993dd
--- /dev/null
+++ b/tests/utils/arcPoints.test.ts
@@ -0,0 +1,224 @@
+import { describe, expect, it } from "vitest";
+import { computeDoorArc, computeWindowLines } from "../../src/utils/arcPoints";
+
+describe("computeDoorArc", () => {
+	const hallWidth = 10.0;
+	const hallLength = 20.0;
+	const wallThickness = 0.2;
+
+	const sectionalDoor = {
+		id: "door-sectional",
+		type: "sectional" as const,
+		width: 3.5,
+		height: 3.5,
+		wall: "south" as const,
+		offset: 3.25,
+	};
+
+	const pvcDoor = {
+		id: "door-pvc",
+		type: "pvc" as const,
+		width: 0.9,
+		height: 2.0,
+		wall: "south" as const,
+		offset: 8.1,
+	};
+
+	it("returns approximately 25 points for a quarter-circle (24 segments + 1)", () => {
+		const { arcPoints } = computeDoorArc(
+			sectionalDoor,
+			hallWidth,
+			hallLength,
+			wallThickness,
+		);
+		expect(arcPoints).toHaveLength(25);
+	});
+
+	it("first point is at door edge position (along wall)", () => {
+		const { arcPoints } = computeDoorArc(
+			sectionalDoor,
+			hallWidth,
+			hallLength,
+			wallThickness,
+		);
+		// Sectional door: hinge at X=3.25, arc starts at door edge X=6.75, Z=20
+		expect(arcPoints[0][0]).toBeCloseTo(6.75); // X = offset + width
+		expect(arcPoints[0][1]).toBeCloseTo(0.02); // Y
+		expect(arcPoints[0][2]).toBeCloseTo(20.0); // Z = hallLength (south wall)
+	});
+
+	it("last point is at perpendicular swing endpoint", () => {
+		const { arcPoints } = computeDoorArc(
+			sectionalDoor,
+			hallWidth,
+			hallLength,
+			wallThickness,
+		);
+		const last = arcPoints[arcPoints.length - 1];
+		// Sectional door swings outward (+Z): end at X=3.25, Z=20+3.5=23.5
+		expect(last[0]).toBeCloseTo(3.25);
+		expect(last[1]).toBeCloseTo(0.02);
+		expect(last[2]).toBeCloseTo(23.5);
+	});
+
+	it("all points are at radius distance from hinge", () => {
+		const { arcPoints } = computeDoorArc(
+			sectionalDoor,
+			hallWidth,
+			hallLength,
+			wallThickness,
+		);
+		const hingeX = 3.25;
+		const hingeZ = 20.0;
+		const radius = 3.5;
+		for (const pt of arcPoints) {
+			const dx = pt[0] - hingeX;
+			const dz = pt[2] - hingeZ;
+			const dist = Math.sqrt(dx * dx + dz * dz);
+			expect(dist).toBeCloseTo(radius, 4);
+		}
+	});
+
+	it("panel line goes from hinge to door edge", () => {
+		const { panelLine } = computeDoorArc(
+			sectionalDoor,
+			hallWidth,
+			hallLength,
+			wallThickness,
+		);
+		expect(panelLine[0][0]).toBeCloseTo(3.25); // hinge X
+		expect(panelLine[0][2]).toBeCloseTo(20.0); // hinge Z
+		expect(panelLine[1][0]).toBeCloseTo(6.75); // edge X
+		expect(panelLine[1][2]).toBeCloseTo(20.0); // edge Z
+	});
+
+	it("for inward-opening door (PVC), arc swings into the hall", () => {
+		const { arcPoints } = computeDoorArc(
+			pvcDoor,
+			hallWidth,
+			hallLength,
+			wallThickness,
+		);
+		// PVC on south wall: inward means Z < hallLength
+		for (const pt of arcPoints) {
+			expect(pt[2]).toBeLessThanOrEqual(hallLength + 0.001);
+		}
+	});
+
+	it("for outward-opening door (sectional), arc swings away from hall", () => {
+		const { arcPoints } = computeDoorArc(
+			sectionalDoor,
+			hallWidth,
+			hallLength,
+			wallThickness,
+		);
+		// Sectional on south wall: outward means Z >= hallLength
+		for (const pt of arcPoints) {
+			expect(pt[2]).toBeGreaterThanOrEqual(hallLength - 0.001);
+		}
+	});
+});
+
+describe("computeWindowLines", () => {
+	const hallWidth = 10.0;
+	const hallLength = 20.0;
+	const wallThickness = 0.2;
+
+	const eastWindow = {
+		id: "window-1",
+		width: 3.0,
+		height: 1.1,
+		wall: "east" as const,
+		offset: 2.0,
+		sillHeight: 1.5,
+	};
+
+	const westWindow = {
+		id: "window-3",
+		width: 3.0,
+		height: 1.1,
+		wall: "west" as const,
+		offset: 2.0,
+		sillHeight: 1.5,
+	};
+
+	it("returns 2 glass lines and 2 break ticks for an east wall window", () => {
+		const { glassLines, breakTicks } = computeWindowLines(
+			eastWindow,
+			hallWidth,
+			hallLength,
+			wallThickness,
+		);
+		expect(glassLines).toHaveLength(2);
+		expect(breakTicks).toHaveLength(2);
+	});
+
+	it("returns 2 glass lines and 2 break ticks for a west wall window", () => {
+		const { glassLines, breakTicks } = computeWindowLines(
+			westWindow,
+			hallWidth,
+			hallLength,
+			wallThickness,
+		);
+		expect(glassLines).toHaveLength(2);
+		expect(breakTicks).toHaveLength(2);
+	});
+
+	it("glass lines are parallel and inset from wall edges (east wall)", () => {
+		const { glassLines } = computeWindowLines(
+			eastWindow,
+			hallWidth,
+			hallLength,
+			wallThickness,
+		);
+		// East wall: outer face X=10, inner face X=9.8
+		// Glass line 1 at X = 10 - 0.2*0.7 = 9.86
+		// Glass line 2 at X = 10 - 0.2*0.3 = 9.94
+		const x1 = glassLines[0][0][0];
+		const x2 = glassLines[1][0][0];
+		expect(x1).toBeCloseTo(9.86);
+		expect(x2).toBeCloseTo(9.94);
+		// Both lines run from Z=2 to Z=5
+		expect(glassLines[0][0][2]).toBeCloseTo(2.0);
+		expect(glassLines[0][1][2]).toBeCloseTo(5.0);
+		expect(glassLines[1][0][2]).toBeCloseTo(2.0);
+		expect(glassLines[1][1][2]).toBeCloseTo(5.0);
+	});
+
+	it("break ticks are perpendicular to the wall at each end (east wall)", () => {
+		const { breakTicks } = computeWindowLines(
+			eastWindow,
+			hallWidth,
+			hallLength,
+			wallThickness,
+		);
+		// Tick at Z=2.0: from inner face (9.8) to outer face (10.0)
+		expect(breakTicks[0][0][2]).toBeCloseTo(2.0);
+		expect(breakTicks[0][1][2]).toBeCloseTo(2.0);
+		expect(Math.min(breakTicks[0][0][0], breakTicks[0][1][0])).toBeCloseTo(
+			9.8,
+		);
+		expect(Math.max(breakTicks[0][0][0], breakTicks[0][1][0])).toBeCloseTo(
+			10.0,
+		);
+		// Tick at Z=5.0
+		expect(breakTicks[1][0][2]).toBeCloseTo(5.0);
+		expect(breakTicks[1][1][2]).toBeCloseTo(5.0);
+	});
+
+	it("west wall window has glass lines inset from X=0 boundary", () => {
+		const { glassLines } = computeWindowLines(
+			westWindow,
+			hallWidth,
+			hallLength,
+			wallThickness,
+		);
+		// West wall: outer face X=0, inner face X=0.2
+		// Glass line 1 at X = 0 + 0.2*0.7 = 0.14
+		// Glass line 2 at X = 0 + 0.2*0.3 = 0.06
+		const x1 = glassLines[0][0][0];
+		const x2 = glassLines[1][0][0];
+		expect(x1).toBeCloseTo(0.14);
+		expect(x2).toBeCloseTo(0.06);
+	});
+});
