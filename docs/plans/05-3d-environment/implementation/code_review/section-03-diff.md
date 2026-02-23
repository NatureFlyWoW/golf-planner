diff --git a/src/utils/walkthroughCollision.ts b/src/utils/walkthroughCollision.ts
new file mode 100644
index 0000000..62bb2a8
--- /dev/null
+++ b/src/utils/walkthroughCollision.ts
@@ -0,0 +1,166 @@
+import type { Hall } from "../types/hall";
+import { type OBBInput, checkOBBCollision } from "./collision";
+
+export type DoorZone = {
+	wall: "north" | "south" | "east" | "west";
+	xMin: number;
+	xMax: number;
+};
+
+export type Vec2D = { x: number; z: number };
+
+/** Camera collision radius in metres */
+export const CAMERA_RADIUS = 0.4;
+
+/**
+ * Compute passable door zones from the hall's doors array.
+ * Each zone describes a range on a given wall where the camera may pass through.
+ */
+export function getDoorZones(hall: Hall): DoorZone[] {
+	return hall.doors.map((door) => ({
+		wall: door.wall,
+		xMin: door.offset - door.width / 2,
+		xMax: door.offset + door.width / 2,
+	}));
+}
+
+/**
+ * Check if an x-coordinate falls within any door zone on the specified wall.
+ */
+function isInDoorZone(
+	x: number,
+	doorZones: DoorZone[],
+	wall: "north" | "south" | "east" | "west",
+): boolean {
+	return doorZones.some(
+		(z) => z.wall === wall && x >= z.xMin && x <= z.xMax,
+	);
+}
+
+/**
+ * Apply AABB wall clamping to a desired camera XZ position.
+ * Door exceptions allow passage through doorways on the south wall.
+ * If camera is already far outside the hall, no clamping is applied.
+ */
+function clampToWalls(
+	desired: Vec2D,
+	hall: Hall,
+	doorZones: DoorZone[],
+): Vec2D {
+	let { x, z } = desired;
+
+	// X clamping (east/west walls — always applied inside or near hall)
+	x = Math.max(CAMERA_RADIUS, Math.min(hall.width - CAMERA_RADIUS, x));
+
+	// Z north wall clamping (always)
+	z = Math.max(CAMERA_RADIUS, z);
+
+	// Z south wall: allow passage through door zones
+	if (z > hall.length - CAMERA_RADIUS) {
+		if (!isInDoorZone(x, doorZones, "south")) {
+			z = hall.length - CAMERA_RADIUS;
+		}
+		// If in door zone, allow z to exceed hall bounds (passing through door)
+	}
+
+	return { x, z };
+}
+
+/**
+ * Resolve collision between the camera and a single placed hole using MTV.
+ * Camera is represented as an axis-aligned OBB with side 2×CAMERA_RADIUS.
+ */
+function resolveHoleCollision(cameraPos: Vec2D, hole: OBBInput): Vec2D {
+	const cameraOBB: OBBInput = {
+		pos: { x: cameraPos.x, z: cameraPos.z },
+		rot: 0,
+		w: CAMERA_RADIUS * 2,
+		l: CAMERA_RADIUS * 2,
+	};
+
+	if (!checkOBBCollision(cameraOBB, hole)) {
+		return cameraPos;
+	}
+
+	// Compute MTV (minimum translation vector) along axis-aligned directions
+	const holeRad = (hole.rot * Math.PI) / 180;
+	const cos = Math.cos(holeRad);
+	const sin = Math.sin(holeRad);
+
+	// Axes to test: camera axes (X, Z) and hole axes
+	const axes: [number, number][] = [
+		[1, 0], // camera X
+		[0, 1], // camera Z
+		[cos, sin], // hole local X
+		[-sin, cos], // hole local Z
+	];
+
+	const halfExtents = [
+		CAMERA_RADIUS, // camera half-width on X
+		CAMERA_RADIUS, // camera half-width on Z
+		hole.w / 2, // hole half-width
+		hole.l / 2, // hole half-length
+	];
+
+	let minOverlap = Number.POSITIVE_INFINITY;
+	let pushAxis: [number, number] = [1, 0];
+
+	for (let i = 0; i < axes.length; i++) {
+		const axis = axes[i];
+		// Project camera center and hole center onto this axis
+		const camProj =
+			cameraPos.x * axis[0] + cameraPos.z * axis[1];
+		const holeProj =
+			hole.pos.x * axis[0] + hole.pos.z * axis[1];
+
+		// Compute half-extent projections for both shapes on this axis
+		const camHalfOnAxis =
+			Math.abs(CAMERA_RADIUS * (axis[0] * 1 + axis[1] * 0)) +
+			Math.abs(CAMERA_RADIUS * (axis[0] * 0 + axis[1] * 1));
+
+		const holeHalfOnAxis =
+			Math.abs((hole.w / 2) * (axis[0] * cos + axis[1] * sin)) +
+			Math.abs((hole.l / 2) * (axis[0] * -sin + axis[1] * cos));
+
+		const dist = Math.abs(camProj - holeProj);
+		const overlap = camHalfOnAxis + holeHalfOnAxis - dist;
+
+		if (overlap <= 0) return cameraPos; // no collision
+
+		if (overlap < minOverlap) {
+			minOverlap = overlap;
+			// Push direction: away from hole center
+			const sign = camProj >= holeProj ? 1 : -1;
+			pushAxis = [axis[0] * sign, axis[1] * sign];
+		}
+	}
+
+	return {
+		x: cameraPos.x + pushAxis[0] * (minOverlap + 0.001),
+		z: cameraPos.z + pushAxis[1] * (minOverlap + 0.001),
+	};
+}
+
+/**
+ * Combined collision resolver for walkthrough camera.
+ * Step 1: Apply wall clamping (with door zone exceptions).
+ * Step 2: For each placed hole, resolve OBB overlap.
+ */
+export function checkWalkthroughCollision(
+	_currentPos: Vec2D,
+	desiredPos: Vec2D,
+	holeOBBs: OBBInput[],
+	hall: Hall,
+): Vec2D {
+	const doorZones = getDoorZones(hall);
+
+	// Step 1: Wall clamping
+	let resolved = clampToWalls(desiredPos, hall, doorZones);
+
+	// Step 2: Hole collision resolution
+	for (const hole of holeOBBs) {
+		resolved = resolveHoleCollision(resolved, hole);
+	}
+
+	return resolved;
+}
diff --git a/tests/utils/walkthroughCollision.test.ts b/tests/utils/walkthroughCollision.test.ts
new file mode 100644
index 0000000..3b4a522
--- /dev/null
+++ b/tests/utils/walkthroughCollision.test.ts
@@ -0,0 +1,292 @@
+import { describe, expect, it } from "vitest";
+import { HALL } from "../../src/constants/hall";
+import type { OBBInput } from "../../src/utils/collision";
+import {
+	CAMERA_RADIUS,
+	checkWalkthroughCollision,
+	getDoorZones,
+} from "../../src/utils/walkthroughCollision";
+
+describe("getDoorZones", () => {
+	const zones = getDoorZones(HALL);
+
+	it("returns zone for PVC door: x=[7.65, 8.55] on south wall", () => {
+		const pvc = zones.find(
+			(z) => Math.abs(z.xMin - 7.65) < 0.01 && Math.abs(z.xMax - 8.55) < 0.01,
+		);
+		expect(pvc).toBeDefined();
+		expect(pvc!.wall).toBe("south");
+	});
+
+	it("returns zone for sectional door: x=[1.5, 5.0] on south wall", () => {
+		const sec = zones.find(
+			(z) => Math.abs(z.xMin - 1.5) < 0.01 && Math.abs(z.xMax - 5.0) < 0.01,
+		);
+		expect(sec).toBeDefined();
+		expect(sec!.wall).toBe("south");
+	});
+
+	it("both zones are on south wall", () => {
+		for (const z of zones) {
+			expect(z.wall).toBe("south");
+		}
+	});
+
+	it("zone xMin = door.offset - door.width/2", () => {
+		const pvcDoor = HALL.doors.find((d) => d.type === "pvc")!;
+		const pvcZone = zones.find((z) => z.wall === "south" && z.xMin > 7)!;
+		expect(pvcZone.xMin).toBeCloseTo(pvcDoor.offset - pvcDoor.width / 2, 5);
+	});
+
+	it("zone xMax = door.offset + door.width/2", () => {
+		const pvcDoor = HALL.doors.find((d) => d.type === "pvc")!;
+		const pvcZone = zones.find((z) => z.wall === "south" && z.xMin > 7)!;
+		expect(pvcZone.xMax).toBeCloseTo(pvcDoor.offset + pvcDoor.width / 2, 5);
+	});
+});
+
+describe("wall collision clamping", () => {
+	const noHoles: OBBInput[] = [];
+
+	it("position inside hall (5, 10) returns unchanged", () => {
+		const res = checkWalkthroughCollision(
+			{ x: 5, z: 10 },
+			{ x: 5, z: 10 },
+			noHoles,
+			HALL,
+		);
+		expect(res.x).toBeCloseTo(5, 5);
+		expect(res.z).toBeCloseTo(10, 5);
+	});
+
+	it("position at north wall edge clamps z to CAMERA_RADIUS", () => {
+		const res = checkWalkthroughCollision(
+			{ x: 5, z: 1 },
+			{ x: 5, z: 0.1 },
+			noHoles,
+			HALL,
+		);
+		expect(res.z).toBeCloseTo(CAMERA_RADIUS, 5);
+	});
+
+	it("position at south wall edge clamps z to hall.length - CAMERA_RADIUS", () => {
+		const res = checkWalkthroughCollision(
+			{ x: 5.5, z: 19 },
+			{ x: 5.5, z: 20.5 },
+			noHoles,
+			HALL,
+		);
+		expect(res.z).toBeCloseTo(HALL.length - CAMERA_RADIUS, 5);
+	});
+
+	it("position at west wall edge clamps x to CAMERA_RADIUS", () => {
+		const res = checkWalkthroughCollision(
+			{ x: 1, z: 10 },
+			{ x: 0.1, z: 10 },
+			noHoles,
+			HALL,
+		);
+		expect(res.x).toBeCloseTo(CAMERA_RADIUS, 5);
+	});
+
+	it("position at east wall edge clamps x to hall.width - CAMERA_RADIUS", () => {
+		const res = checkWalkthroughCollision(
+			{ x: 9, z: 10 },
+			{ x: 10.5, z: 10 },
+			noHoles,
+			HALL,
+		);
+		expect(res.x).toBeCloseTo(HALL.width - CAMERA_RADIUS, 5);
+	});
+
+	it("position through PVC door zone (x=8.1, z=20.5) is NOT z-clamped", () => {
+		const res = checkWalkthroughCollision(
+			{ x: 8.1, z: 19.5 },
+			{ x: 8.1, z: 20.5 },
+			noHoles,
+			HALL,
+		);
+		expect(res.z).toBeCloseTo(20.5, 5);
+	});
+
+	it("position outside hall not in door zone (x=5.5, z=20.5) IS z-clamped", () => {
+		const res = checkWalkthroughCollision(
+			{ x: 5.5, z: 19 },
+			{ x: 5.5, z: 20.5 },
+			noHoles,
+			HALL,
+		);
+		expect(res.z).toBeCloseTo(HALL.length - CAMERA_RADIUS, 5);
+	});
+
+	it("position far outside hall through PVC door (x=8.1, z=25) is unconstrained", () => {
+		const res = checkWalkthroughCollision(
+			{ x: 8.1, z: 22 },
+			{ x: 8.1, z: 25 },
+			noHoles,
+			HALL,
+		);
+		expect(res.z).toBeCloseTo(25, 5);
+	});
+
+	it("corner position clamps both x and z axes", () => {
+		const res = checkWalkthroughCollision(
+			{ x: 1, z: 1 },
+			{ x: -1, z: -1 },
+			noHoles,
+			HALL,
+		);
+		expect(res.x).toBeCloseTo(CAMERA_RADIUS, 5);
+		expect(res.z).toBeCloseTo(CAMERA_RADIUS, 5);
+	});
+});
+
+describe("hole collision detection and resolution", () => {
+	const testHole: OBBInput = { pos: { x: 5, z: 10 }, rot: 0, w: 1.0, l: 2.0 };
+
+	it("camera position not overlapping any hole returns unchanged", () => {
+		const res = checkWalkthroughCollision(
+			{ x: 2, z: 10 },
+			{ x: 2, z: 10 },
+			[testHole],
+			HALL,
+		);
+		expect(res.x).toBeCloseTo(2, 5);
+		expect(res.z).toBeCloseTo(10, 5);
+	});
+
+	it("camera position overlapping a hole pushes out along shortest axis", () => {
+		// Camera at hole center — hole is 1.0 wide × 2.0 long
+		// Camera radius 0.4 → camera OBB is 0.8×0.8
+		// Overlap on X: 0.5 + 0.4 = 0.9 (half hole width + camera radius)
+		// Overlap on Z: 1.0 + 0.4 = 1.4 (half hole length + camera radius)
+		// Shortest push is along X
+		const res = checkWalkthroughCollision(
+			{ x: 5, z: 10 },
+			{ x: 5, z: 10 },
+			[testHole],
+			HALL,
+		);
+		// Should be pushed out, not at (5, 10)
+		const dist = Math.sqrt((res.x - 5) ** 2 + (res.z - 10) ** 2);
+		expect(dist).toBeGreaterThan(0.1);
+	});
+
+	it("camera near hole edge but not overlapping returns unchanged", () => {
+		// Camera at x=3.5 — far enough from hole at x=5, w=1.0
+		// Gap = |3.5 - 5| - 0.5 - 0.4 = 1.5 - 0.9 = 0.6m clearance
+		const res = checkWalkthroughCollision(
+			{ x: 3.5, z: 10 },
+			{ x: 3.5, z: 10 },
+			[testHole],
+			HALL,
+		);
+		expect(res.x).toBeCloseTo(3.5, 5);
+		expect(res.z).toBeCloseTo(10, 5);
+	});
+
+	it("rotated hole (45°) collision works correctly", () => {
+		const rotatedHole: OBBInput = {
+			pos: { x: 5, z: 10 },
+			rot: 45,
+			w: 2.0,
+			l: 2.0,
+		};
+		// Camera at (5, 10) overlaps the rotated hole
+		const res = checkWalkthroughCollision(
+			{ x: 5, z: 10 },
+			{ x: 5, z: 10 },
+			[rotatedHole],
+			HALL,
+		);
+		const dist = Math.sqrt((res.x - 5) ** 2 + (res.z - 10) ** 2);
+		expect(dist).toBeGreaterThan(0.1);
+	});
+
+	it("multiple holes — only colliding hole causes push-out", () => {
+		const hole1: OBBInput = { pos: { x: 2, z: 5 }, rot: 0, w: 1.0, l: 2.0 };
+		const hole2: OBBInput = { pos: { x: 8, z: 15 }, rot: 0, w: 1.0, l: 2.0 };
+		// Camera at (5, 10) — not overlapping either hole
+		const res = checkWalkthroughCollision(
+			{ x: 5, z: 10 },
+			{ x: 5, z: 10 },
+			[hole1, hole2],
+			HALL,
+		);
+		expect(res.x).toBeCloseTo(5, 5);
+		expect(res.z).toBeCloseTo(10, 5);
+	});
+});
+
+describe("checkWalkthroughCollision combined", () => {
+	it("applies wall clamping when no holes present", () => {
+		const res = checkWalkthroughCollision(
+			{ x: 0.1, z: 0.1 },
+			{ x: -1, z: -1 },
+			[],
+			HALL,
+		);
+		expect(res.x).toBeCloseTo(CAMERA_RADIUS, 5);
+		expect(res.z).toBeCloseTo(CAMERA_RADIUS, 5);
+	});
+
+	it("applies hole push-out when inside hall", () => {
+		const hole: OBBInput = { pos: { x: 5, z: 10 }, rot: 0, w: 2.0, l: 2.0 };
+		const res = checkWalkthroughCollision(
+			{ x: 5, z: 10 },
+			{ x: 5, z: 10 },
+			[hole],
+			HALL,
+		);
+		const dist = Math.sqrt((res.x - 5) ** 2 + (res.z - 10) ** 2);
+		expect(dist).toBeGreaterThan(0.1);
+	});
+
+	it("wall clamping runs before hole push-out", () => {
+		// Hole near west wall — camera pushed into wall should be re-clamped
+		const wallHole: OBBInput = {
+			pos: { x: 1, z: 10 },
+			rot: 0,
+			w: 1.0,
+			l: 1.0,
+		};
+		const res = checkWalkthroughCollision(
+			{ x: 1, z: 10 },
+			{ x: 1, z: 10 },
+			[wallHole],
+			HALL,
+		);
+		// Camera should not end up outside the wall
+		expect(res.x).toBeGreaterThanOrEqual(CAMERA_RADIUS - 0.01);
+	});
+
+	it("camera at hall corner (near two walls) is clamped on both axes", () => {
+		const res = checkWalkthroughCollision(
+			{ x: 0.1, z: 0.1 },
+			{ x: -5, z: -5 },
+			[],
+			HALL,
+		);
+		expect(res.x).toBeCloseTo(CAMERA_RADIUS, 5);
+		expect(res.z).toBeCloseTo(CAMERA_RADIUS, 5);
+	});
+
+	it("position through door zone with adjacent hole: door allowed, hole still collides", () => {
+		// Hole near PVC door
+		const doorHole: OBBInput = {
+			pos: { x: 8.1, z: 19.0 },
+			rot: 0,
+			w: 1.0,
+			l: 1.0,
+		};
+		const res = checkWalkthroughCollision(
+			{ x: 8.1, z: 19.0 },
+			{ x: 8.1, z: 19.0 },
+			[doorHole],
+			HALL,
+		);
+		// Should be pushed out of hole
+		const dist = Math.sqrt((res.x - 8.1) ** 2 + (res.z - 19) ** 2);
+		expect(dist).toBeGreaterThan(0.1);
+	});
+});
