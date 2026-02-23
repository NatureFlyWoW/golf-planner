diff --git a/src/components/three/architectural/ArchitecturalFloorPlan.tsx b/src/components/three/architectural/ArchitecturalFloorPlan.tsx
index c2b2df0..63a825f 100644
--- a/src/components/three/architectural/ArchitecturalFloorPlan.tsx
+++ b/src/components/three/architectural/ArchitecturalFloorPlan.tsx
@@ -1,4 +1,5 @@
 import { useViewportId } from "../../../hooks/useViewportId";
+import { ArchitecturalWalls2D } from "./ArchitecturalWalls2D";
 
 /**
  * Container for all 2D architectural floor plan elements.
@@ -11,7 +12,7 @@ export function ArchitecturalFloorPlan() {
 
 	return (
 		<group name="architectural-floor-plan">
-			{/* Section 03: ArchitecturalWalls2D */}
+			<ArchitecturalWalls2D />
 			{/* Section 04: ArchitecturalOpenings2D */}
 			{/* Section 06: ArchitecturalGrid2D */}
 			{/* Section 07: HoleFelt2D overlays */}
diff --git a/src/components/three/architectural/ArchitecturalWalls2D.tsx b/src/components/three/architectural/ArchitecturalWalls2D.tsx
new file mode 100644
index 0000000..0f29fbf
--- /dev/null
+++ b/src/components/three/architectural/ArchitecturalWalls2D.tsx
@@ -0,0 +1,110 @@
+import { Line } from "@react-three/drei";
+import { useMemo, useRef } from "react";
+import type { Group } from "three";
+import { useGroupOpacity } from "../../../hooks/useGroupOpacity";
+import { useStore } from "../../../store";
+import {
+	type WallRect,
+	computeWallSegments,
+	wallSegmentToRect,
+} from "../../../utils/wallGeometry";
+import type { Wall } from "../../../types/hall";
+
+const ARCH_WALL_THICKNESS = 0.2;
+const WALLS: Wall[] = ["north", "south", "east", "west"];
+
+const COLORS = {
+	planning: { fill: "#3a3a3a", outline: "#222222" },
+	uv: { fill: "#1A1A2E", outline: "#2A2A5E" },
+} as const;
+
+function rectToOutlineSegments(
+	rect: WallRect,
+): [number, number, number][] {
+	const [cx, cy, cz] = rect.position;
+	const [w, d] = rect.size;
+	const hw = w / 2;
+	const hd = d / 2;
+
+	const p0: [number, number, number] = [cx - hw, cy, cz - hd];
+	const p1: [number, number, number] = [cx + hw, cy, cz - hd];
+	const p2: [number, number, number] = [cx + hw, cy, cz + hd];
+	const p3: [number, number, number] = [cx - hw, cy, cz + hd];
+
+	// 4 line segments as pairs for segments={true} mode
+	return [p0, p1, p1, p2, p2, p3, p3, p0];
+}
+
+const noRaycast = () => {};
+
+export function ArchitecturalWalls2D({
+	outlineOnly = false,
+}: { outlineOnly?: boolean }) {
+	const groupRef = useRef<Group>(null);
+	const { width, length, doors, windows } = useStore((s) => s.hall);
+	const uvMode = useStore((s) => s.ui.uvMode);
+	const wallsLayer = useStore((s) => s.ui.layers.walls);
+
+	const colors = uvMode ? COLORS.uv : COLORS.planning;
+
+	const { rects, outlinePoints } = useMemo(() => {
+		const allRects: { rect: WallRect; wallSide: Wall }[] = [];
+		const allOutlinePoints: [number, number, number][] = [];
+
+		for (const wallSide of WALLS) {
+			const segments = computeWallSegments(
+				wallSide,
+				width,
+				length,
+				doors,
+				windows,
+			);
+			for (const seg of segments) {
+				const rect = wallSegmentToRect(
+					seg,
+					wallSide,
+					ARCH_WALL_THICKNESS,
+					width,
+					length,
+				);
+				allRects.push({ rect, wallSide });
+				allOutlinePoints.push(...rectToOutlineSegments(rect));
+			}
+		}
+
+		return { rects: allRects, outlinePoints: allOutlinePoints };
+	}, [width, length, doors, windows]);
+
+	useGroupOpacity(groupRef, wallsLayer.opacity);
+
+	if (!wallsLayer.visible) return null;
+
+	return (
+		<group ref={groupRef} name="architectural-walls-2d">
+			{!outlineOnly &&
+				rects.map(({ rect }, i) => (
+					<mesh
+						key={`wall-fill-${
+							// biome-ignore lint/suspicious/noArrayIndexKey: stable order from deterministic computation
+							i
+						}`}
+						position={rect.position}
+						rotation={[-Math.PI / 2, 0, 0]}
+						raycast={noRaycast}
+					>
+						<planeGeometry args={[rect.size[0], rect.size[1]]} />
+						<meshBasicMaterial color={colors.fill} />
+					</mesh>
+				))}
+			{outlinePoints.length > 0 && (
+				<Line
+					points={outlinePoints}
+					segments
+					lineWidth={2}
+					worldUnits={false}
+					color={colors.outline}
+				/>
+			)}
+		</group>
+	);
+}
diff --git a/src/utils/wallGeometry.ts b/src/utils/wallGeometry.ts
new file mode 100644
index 0000000..890a7b9
--- /dev/null
+++ b/src/utils/wallGeometry.ts
@@ -0,0 +1,108 @@
+import type { DoorSpec, Wall, WindowSpec } from "../types/hall";
+
+export type WallSegment = {
+	start: number;
+	end: number;
+};
+
+export type WallRect = {
+	position: [number, number, number]; // center [x, y, z]
+	size: [number, number]; // [widthAlongPrimary, depthAlongSecondary]
+};
+
+type Gap = { start: number; end: number };
+
+function getWallLength(wallSide: Wall, hallWidth: number, hallLength: number) {
+	return wallSide === "north" || wallSide === "south"
+		? hallWidth
+		: hallLength;
+}
+
+function mergeGaps(gaps: Gap[]): Gap[] {
+	if (gaps.length === 0) return [];
+	const sorted = [...gaps].sort((a, b) => a.start - b.start);
+	const merged: Gap[] = [{ ...sorted[0] }];
+	for (let i = 1; i < sorted.length; i++) {
+		const last = merged[merged.length - 1];
+		if (sorted[i].start <= last.end) {
+			last.end = Math.max(last.end, sorted[i].end);
+		} else {
+			merged.push({ ...sorted[i] });
+		}
+	}
+	return merged;
+}
+
+export function computeWallSegments(
+	wallSide: Wall,
+	hallWidth: number,
+	hallLength: number,
+	doors: DoorSpec[],
+	windows: WindowSpec[],
+): WallSegment[] {
+	const wallLen = getWallLength(wallSide, hallWidth, hallLength);
+
+	const gaps: Gap[] = [];
+	for (const door of doors) {
+		if (door.wall === wallSide) {
+			gaps.push({ start: door.offset, end: door.offset + door.width });
+		}
+	}
+	for (const win of windows) {
+		if (win.wall === wallSide) {
+			gaps.push({ start: win.offset, end: win.offset + win.width });
+		}
+	}
+
+	const merged = mergeGaps(gaps);
+
+	const segments: WallSegment[] = [];
+	let cursor = 0;
+	for (const gap of merged) {
+		if (cursor < gap.start) {
+			segments.push({ start: cursor, end: gap.start });
+		}
+		cursor = gap.end;
+	}
+	if (cursor < wallLen) {
+		segments.push({ start: cursor, end: wallLen });
+	}
+
+	return segments.filter((s) => s.end - s.start > 0);
+}
+
+const WALL_Y = 0.02;
+
+export function wallSegmentToRect(
+	segment: WallSegment,
+	wallSide: Wall,
+	thickness: number,
+	hallWidth: number,
+	hallLength: number,
+): WallRect {
+	const len = segment.end - segment.start;
+	const mid = (segment.start + segment.end) / 2;
+
+	switch (wallSide) {
+		case "north":
+			return {
+				position: [mid, WALL_Y, thickness / 2],
+				size: [len, thickness],
+			};
+		case "south":
+			return {
+				position: [mid, WALL_Y, hallLength - thickness / 2],
+				size: [len, thickness],
+			};
+		case "west":
+			return {
+				position: [thickness / 2, WALL_Y, mid],
+				size: [thickness, len],
+			};
+		case "east":
+			return {
+				position: [hallWidth - thickness / 2, WALL_Y, mid],
+				size: [thickness, len],
+			};
+	}
+}
diff --git a/tests/utils/wallGeometry.test.ts b/tests/utils/wallGeometry.test.ts
new file mode 100644
index 0000000..a644878
--- /dev/null
+++ b/tests/utils/wallGeometry.test.ts
@@ -0,0 +1,273 @@
+import { describe, expect, it } from "vitest";
+import {
+	computeWallSegments,
+	wallSegmentToRect,
+} from "../../src/utils/wallGeometry";
+
+describe("computeWallSegments", () => {
+	const hallWidth = 10.0;
+	const hallLength = 20.0;
+
+	const doors = [
+		{
+			id: "door-sectional",
+			type: "sectional" as const,
+			width: 3.5,
+			height: 3.5,
+			wall: "south" as const,
+			offset: 3.25,
+		},
+		{
+			id: "door-pvc",
+			type: "pvc" as const,
+			width: 0.9,
+			height: 2.0,
+			wall: "south" as const,
+			offset: 8.1,
+		},
+	];
+
+	const windows = [
+		{
+			id: "window-1",
+			width: 3.0,
+			height: 1.1,
+			wall: "east" as const,
+			offset: 2.0,
+			sillHeight: 1.5,
+		},
+		{
+			id: "window-2",
+			width: 3.0,
+			height: 1.1,
+			wall: "east" as const,
+			offset: 10.0,
+			sillHeight: 1.5,
+		},
+		{
+			id: "window-3",
+			width: 3.0,
+			height: 1.1,
+			wall: "west" as const,
+			offset: 2.0,
+			sillHeight: 1.5,
+		},
+		{
+			id: "window-4",
+			width: 3.0,
+			height: 1.1,
+			wall: "west" as const,
+			offset: 10.0,
+			sillHeight: 1.5,
+		},
+	];
+
+	it("south wall with 2 doors returns 3 segments", () => {
+		const segments = computeWallSegments(
+			"south",
+			hallWidth,
+			hallLength,
+			doors,
+			windows,
+		);
+		expect(segments).toEqual([
+			{ start: 0, end: 3.25 },
+			{ start: 6.75, end: 8.1 },
+			{ start: 9.0, end: 10.0 },
+		]);
+	});
+
+	it("east wall with 2 windows returns 3 segments", () => {
+		const segments = computeWallSegments(
+			"east",
+			hallWidth,
+			hallLength,
+			doors,
+			windows,
+		);
+		expect(segments).toEqual([
+			{ start: 0, end: 2.0 },
+			{ start: 5.0, end: 10.0 },
+			{ start: 13.0, end: 20.0 },
+		]);
+	});
+
+	it("north wall with no openings returns 1 full-length segment", () => {
+		const segments = computeWallSegments(
+			"north",
+			hallWidth,
+			hallLength,
+			doors,
+			windows,
+		);
+		expect(segments).toEqual([{ start: 0, end: 10.0 }]);
+	});
+
+	it("west wall with 2 windows returns 3 segments", () => {
+		const segments = computeWallSegments(
+			"west",
+			hallWidth,
+			hallLength,
+			doors,
+			windows,
+		);
+		expect(segments).toEqual([
+			{ start: 0, end: 2.0 },
+			{ start: 5.0, end: 10.0 },
+			{ start: 13.0, end: 20.0 },
+		]);
+	});
+
+	it("handles overlapping doors/windows by merging gaps", () => {
+		const overlappingDoors = [
+			{
+				id: "d1",
+				type: "pvc" as const,
+				width: 3.0,
+				height: 2.0,
+				wall: "south" as const,
+				offset: 2.0,
+			},
+			{
+				id: "d2",
+				type: "pvc" as const,
+				width: 3.0,
+				height: 2.0,
+				wall: "south" as const,
+				offset: 4.0,
+			},
+		];
+		const segments = computeWallSegments(
+			"south",
+			hallWidth,
+			hallLength,
+			overlappingDoors,
+			[],
+		);
+		// Gaps: [2,5] and [4,7] overlap => merged gap [2,7]
+		// Segments: [0,2] and [7,10]
+		expect(segments).toEqual([
+			{ start: 0, end: 2.0 },
+			{ start: 7.0, end: 10.0 },
+		]);
+	});
+
+	it("handles opening at wall start (offset 0)", () => {
+		const edgeDoor = [
+			{
+				id: "d-edge",
+				type: "pvc" as const,
+				width: 2.0,
+				height: 2.0,
+				wall: "south" as const,
+				offset: 0,
+			},
+		];
+		const segments = computeWallSegments(
+			"south",
+			hallWidth,
+			hallLength,
+			edgeDoor,
+			[],
+		);
+		// Gap: [0, 2] => segment: [2, 10]
+		expect(segments).toEqual([{ start: 2.0, end: 10.0 }]);
+	});
+
+	it("handles opening at wall end", () => {
+		const edgeDoor = [
+			{
+				id: "d-edge",
+				type: "pvc" as const,
+				width: 2.0,
+				height: 2.0,
+				wall: "south" as const,
+				offset: 8.0,
+			},
+		];
+		const segments = computeWallSegments(
+			"south",
+			hallWidth,
+			hallLength,
+			edgeDoor,
+			[],
+		);
+		// Gap: [8, 10] => segment: [0, 8]
+		expect(segments).toEqual([{ start: 0, end: 8.0 }]);
+	});
+});
+
+describe("wallSegmentToRect", () => {
+	const thickness = 0.2;
+	const hallWidth = 10.0;
+	const hallLength = 20.0;
+
+	it("south wall segment returns correct position and size", () => {
+		const segment = { start: 0, end: 3.25 };
+		const rect = wallSegmentToRect(
+			segment,
+			"south",
+			thickness,
+			hallWidth,
+			hallLength,
+		);
+		// South wall is at z=hallLength, extends inward (toward z=hallLength - thickness)
+		// X runs from segment.start to segment.end
+		expect(rect.size[0]).toBeCloseTo(3.25); // width along X
+		expect(rect.size[1]).toBeCloseTo(thickness); // depth along Z
+		// Position is center of the rectangle
+		expect(rect.position[0]).toBeCloseTo(3.25 / 2); // center X
+		expect(rect.position[1]).toBeCloseTo(0.02); // Y slightly above floor
+		expect(rect.position[2]).toBeCloseTo(hallLength - thickness / 2); // center Z
+	});
+
+	it("east wall segment returns correct position and size (rotated axis)", () => {
+		const segment = { start: 0, end: 2.0 };
+		const rect = wallSegmentToRect(
+			segment,
+			"east",
+			thickness,
+			hallWidth,
+			hallLength,
+		);
+		// East wall is at x=hallWidth, extends inward (toward x=hallWidth - thickness)
+		// Z runs from segment.start to segment.end
+		expect(rect.size[0]).toBeCloseTo(thickness); // width along X
+		expect(rect.size[1]).toBeCloseTo(2.0); // depth along Z
+		expect(rect.position[0]).toBeCloseTo(hallWidth - thickness / 2); // center X
+		expect(rect.position[1]).toBeCloseTo(0.02); // Y
+		expect(rect.position[2]).toBeCloseTo(1.0); // center Z
+	});
+
+	it("north wall segment returns correct position and size", () => {
+		const segment = { start: 0, end: 10.0 };
+		const rect = wallSegmentToRect(
+			segment,
+			"north",
+			thickness,
+			hallWidth,
+			hallLength,
+		);
+		expect(rect.size[0]).toBeCloseTo(10.0);
+		expect(rect.size[1]).toBeCloseTo(thickness);
+		expect(rect.position[0]).toBeCloseTo(5.0);
+		expect(rect.position[1]).toBeCloseTo(0.02);
+		expect(rect.position[2]).toBeCloseTo(thickness / 2);
+	});
+
+	it("west wall segment returns correct position and size", () => {
+		const segment = { start: 5.0, end: 10.0 };
+		const rect = wallSegmentToRect(
+			segment,
+			"west",
+			thickness,
+			hallWidth,
+			hallLength,
+		);
+		expect(rect.size[0]).toBeCloseTo(thickness);
+		expect(rect.size[1]).toBeCloseTo(5.0);
+		expect(rect.position[0]).toBeCloseTo(thickness / 2);
+		expect(rect.position[1]).toBeCloseTo(0.02);
+		expect(rect.position[2]).toBeCloseTo(7.5);
+	});
+});
