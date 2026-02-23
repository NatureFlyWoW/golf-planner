import { describe, expect, it } from "vitest";
import { HALL } from "../../src/constants/hall";
import type { OBBInput } from "../../src/utils/collision";
import {
	CAMERA_RADIUS,
	checkWalkthroughCollision,
	getDoorZones,
} from "../../src/utils/walkthroughCollision";

describe("getDoorZones", () => {
	const zones = getDoorZones(HALL);

	it("returns zone for PVC door: x=[7.65, 8.55] on south wall", () => {
		const pvc = zones.find(
			(z) => Math.abs(z.xMin - 7.65) < 0.01 && Math.abs(z.xMax - 8.55) < 0.01,
		);
		expect(pvc).toBeDefined();
		expect(pvc!.wall).toBe("south");
	});

	it("returns zone for sectional door: x=[1.5, 5.0] on south wall", () => {
		const sec = zones.find(
			(z) => Math.abs(z.xMin - 1.5) < 0.01 && Math.abs(z.xMax - 5.0) < 0.01,
		);
		expect(sec).toBeDefined();
		expect(sec!.wall).toBe("south");
	});

	it("both zones are on south wall", () => {
		for (const z of zones) {
			expect(z.wall).toBe("south");
		}
	});

	it("zone xMin = door.offset - door.width/2", () => {
		const pvcDoor = HALL.doors.find((d) => d.type === "pvc")!;
		const pvcZone = zones.find((z) => z.wall === "south" && z.xMin > 7)!;
		expect(pvcZone.xMin).toBeCloseTo(pvcDoor.offset - pvcDoor.width / 2, 5);
	});

	it("zone xMax = door.offset + door.width/2", () => {
		const pvcDoor = HALL.doors.find((d) => d.type === "pvc")!;
		const pvcZone = zones.find((z) => z.wall === "south" && z.xMin > 7)!;
		expect(pvcZone.xMax).toBeCloseTo(pvcDoor.offset + pvcDoor.width / 2, 5);
	});
});

describe("wall collision clamping", () => {
	const noHoles: OBBInput[] = [];

	it("position inside hall (5, 10) returns unchanged", () => {
		const res = checkWalkthroughCollision(
			{ x: 5, z: 10 },
			noHoles,
			HALL,
		);
		expect(res.x).toBeCloseTo(5, 5);
		expect(res.z).toBeCloseTo(10, 5);
	});

	it("position at north wall edge clamps z to CAMERA_RADIUS", () => {
		const res = checkWalkthroughCollision(
			{ x: 5, z: 0.1 },
			noHoles,
			HALL,
		);
		expect(res.z).toBeCloseTo(CAMERA_RADIUS, 5);
	});

	it("position at south wall edge clamps z to hall.length - CAMERA_RADIUS", () => {
		const res = checkWalkthroughCollision(
			{ x: 5.5, z: 20.5 },
			noHoles,
			HALL,
		);
		expect(res.z).toBeCloseTo(HALL.length - CAMERA_RADIUS, 5);
	});

	it("position at west wall edge clamps x to CAMERA_RADIUS", () => {
		const res = checkWalkthroughCollision(
			{ x: 0.1, z: 10 },
			noHoles,
			HALL,
		);
		expect(res.x).toBeCloseTo(CAMERA_RADIUS, 5);
	});

	it("position at east wall edge clamps x to hall.width - CAMERA_RADIUS", () => {
		const res = checkWalkthroughCollision(
			{ x: 10.5, z: 10 },
			noHoles,
			HALL,
		);
		expect(res.x).toBeCloseTo(HALL.width - CAMERA_RADIUS, 5);
	});

	it("position through PVC door zone (x=8.1, z=20.5) is NOT z-clamped", () => {
		const res = checkWalkthroughCollision(
			{ x: 8.1, z: 20.5 },
			noHoles,
			HALL,
		);
		expect(res.z).toBeCloseTo(20.5, 5);
	});

	it("position outside hall not in door zone (x=5.5, z=20.5) IS z-clamped", () => {
		const res = checkWalkthroughCollision(
			{ x: 5.5, z: 20.5 },
			noHoles,
			HALL,
		);
		expect(res.z).toBeCloseTo(HALL.length - CAMERA_RADIUS, 5);
	});

	it("position far outside hall through PVC door (x=8.1, z=25) is unconstrained", () => {
		const res = checkWalkthroughCollision(
			{ x: 8.1, z: 25 },
			noHoles,
			HALL,
		);
		expect(res.z).toBeCloseTo(25, 5);
	});

	it("corner position clamps both x and z axes", () => {
		const res = checkWalkthroughCollision(
			{ x: -1, z: -1 },
			noHoles,
			HALL,
		);
		expect(res.x).toBeCloseTo(CAMERA_RADIUS, 5);
		expect(res.z).toBeCloseTo(CAMERA_RADIUS, 5);
	});
});

describe("hole collision detection and resolution", () => {
	const testHole: OBBInput = { pos: { x: 5, z: 10 }, rot: 0, w: 1.0, l: 2.0 };

	it("camera position not overlapping any hole returns unchanged", () => {
		const res = checkWalkthroughCollision(
			{ x: 2, z: 10 },
			[testHole],
			HALL,
		);
		expect(res.x).toBeCloseTo(2, 5);
		expect(res.z).toBeCloseTo(10, 5);
	});

	it("camera position overlapping a hole pushes out along shortest axis", () => {
		// Camera at hole center — hole is 1.0 wide × 2.0 long
		// Camera radius 0.4 → camera OBB is 0.8×0.8
		// Overlap on X: 0.5 + 0.4 = 0.9 (half hole width + camera radius)
		// Overlap on Z: 1.0 + 0.4 = 1.4 (half hole length + camera radius)
		// Shortest push is along X
		const res = checkWalkthroughCollision(
			{ x: 5, z: 10 },
			[testHole],
			HALL,
		);
		// Should be pushed out, not at (5, 10)
		const dist = Math.sqrt((res.x - 5) ** 2 + (res.z - 10) ** 2);
		expect(dist).toBeGreaterThan(0.1);
	});

	it("camera near hole edge but not overlapping returns unchanged", () => {
		// Camera at x=3.5 — far enough from hole at x=5, w=1.0
		// Gap = |3.5 - 5| - 0.5 - 0.4 = 1.5 - 0.9 = 0.6m clearance
		const res = checkWalkthroughCollision(
			{ x: 3.5, z: 10 },
			[testHole],
			HALL,
		);
		expect(res.x).toBeCloseTo(3.5, 5);
		expect(res.z).toBeCloseTo(10, 5);
	});

	it("rotated hole (45°) collision works correctly", () => {
		const rotatedHole: OBBInput = {
			pos: { x: 5, z: 10 },
			rot: 45,
			w: 2.0,
			l: 2.0,
		};
		// Camera at (5, 10) overlaps the rotated hole
		const res = checkWalkthroughCollision(
			{ x: 5, z: 10 },
			[rotatedHole],
			HALL,
		);
		const dist = Math.sqrt((res.x - 5) ** 2 + (res.z - 10) ** 2);
		expect(dist).toBeGreaterThan(0.1);
	});

	it("multiple holes — only colliding hole causes push-out", () => {
		const hole1: OBBInput = { pos: { x: 2, z: 5 }, rot: 0, w: 1.0, l: 2.0 };
		const hole2: OBBInput = { pos: { x: 8, z: 15 }, rot: 0, w: 1.0, l: 2.0 };
		// Camera at (5, 10) — not overlapping either hole
		const res = checkWalkthroughCollision(
			{ x: 5, z: 10 },
			[hole1, hole2],
			HALL,
		);
		expect(res.x).toBeCloseTo(5, 5);
		expect(res.z).toBeCloseTo(10, 5);
	});
});

describe("checkWalkthroughCollision combined", () => {
	it("applies wall clamping when no holes present", () => {
		const res = checkWalkthroughCollision(
			{ x: -1, z: -1 },
			[],
			HALL,
		);
		expect(res.x).toBeCloseTo(CAMERA_RADIUS, 5);
		expect(res.z).toBeCloseTo(CAMERA_RADIUS, 5);
	});

	it("applies hole push-out when inside hall", () => {
		const hole: OBBInput = { pos: { x: 5, z: 10 }, rot: 0, w: 2.0, l: 2.0 };
		const res = checkWalkthroughCollision(
			{ x: 5, z: 10 },
			[hole],
			HALL,
		);
		const dist = Math.sqrt((res.x - 5) ** 2 + (res.z - 10) ** 2);
		expect(dist).toBeGreaterThan(0.1);
	});

	it("wall clamping runs before hole push-out", () => {
		// Hole near west wall — camera pushed into wall should be re-clamped
		const wallHole: OBBInput = {
			pos: { x: 1, z: 10 },
			rot: 0,
			w: 1.0,
			l: 1.0,
		};
		const res = checkWalkthroughCollision(
			{ x: 1, z: 10 },
			[wallHole],
			HALL,
		);
		// Camera should not end up outside the wall
		expect(res.x).toBeGreaterThanOrEqual(CAMERA_RADIUS - 0.01);
	});

	it("camera at hall corner (near two walls) is clamped on both axes", () => {
		const res = checkWalkthroughCollision(
			{ x: -5, z: -5 },
			[],
			HALL,
		);
		expect(res.x).toBeCloseTo(CAMERA_RADIUS, 5);
		expect(res.z).toBeCloseTo(CAMERA_RADIUS, 5);
	});

	it("position through door zone with adjacent hole: door allowed, hole still collides", () => {
		// Hole near PVC door
		const doorHole: OBBInput = {
			pos: { x: 8.1, z: 19.0 },
			rot: 0,
			w: 1.0,
			l: 1.0,
		};
		const res = checkWalkthroughCollision(
			{ x: 8.1, z: 19.0 },
			[doorHole],
			HALL,
		);
		// Should be pushed out of hole
		const dist = Math.sqrt((res.x - 8.1) ** 2 + (res.z - 19) ** 2);
		expect(dist).toBeGreaterThan(0.1);
	});
});
