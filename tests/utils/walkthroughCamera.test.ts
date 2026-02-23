import { describe, expect, it } from "vitest";
import { HALL } from "../../src/constants/hall";
import {
	EYE_HEIGHT,
	RUN_SPEED,
	WALK_SPEED,
	clampPitch,
	computeMovementVector,
	getWalkthroughSpawnPoint,
} from "../../src/utils/walkthroughCamera";

const noKeys = {
	forward: false,
	backward: false,
	left: false,
	right: false,
	shift: false,
};

describe("computeMovementVector", () => {
	it("returns zero movement when no keys are pressed", () => {
		const mv = computeMovementVector(noKeys, 0, 1);
		expect(mv.x).toBeCloseTo(0, 10);
		expect(mv.y).toBeCloseTo(0, 10);
		expect(mv.z).toBeCloseTo(0, 10);
	});

	it("rotates movement direction with non-zero yaw (90°)", () => {
		// At yaw=π/2, forward should be in -X direction (rotated 90° from -Z)
		const mv = computeMovementVector(
			{ ...noKeys, forward: true },
			Math.PI / 2,
			1,
		);
		expect(mv.x).toBeLessThan(-0.5);
		expect(Math.abs(mv.z)).toBeLessThan(0.001);
	});

	it("forward key produces movement in -Z direction at 0° yaw", () => {
		const mv = computeMovementVector(
			{ ...noKeys, forward: true },
			0,
			1,
		);
		expect(mv.z).toBeLessThan(0);
		expect(Math.abs(mv.x)).toBeLessThan(0.001);
	});

	it("backward key produces movement in +Z direction at 0° yaw", () => {
		const mv = computeMovementVector(
			{ ...noKeys, backward: true },
			0,
			1,
		);
		expect(mv.z).toBeGreaterThan(0);
		expect(Math.abs(mv.x)).toBeLessThan(0.001);
	});

	it("left strafe produces movement in -X direction at 0° yaw", () => {
		const mv = computeMovementVector({ ...noKeys, left: true }, 0, 1);
		expect(mv.x).toBeLessThan(0);
		expect(Math.abs(mv.z)).toBeLessThan(0.001);
	});

	it("right strafe produces movement in +X direction at 0° yaw", () => {
		const mv = computeMovementVector({ ...noKeys, right: true }, 0, 1);
		expect(mv.x).toBeGreaterThan(0);
		expect(Math.abs(mv.z)).toBeLessThan(0.001);
	});

	it("diagonal movement (forward + left) normalizes to unit length × speed", () => {
		const mv = computeMovementVector(
			{ ...noKeys, forward: true, left: true },
			0,
			1,
		);
		const len = Math.sqrt(mv.x ** 2 + mv.z ** 2);
		expect(len).toBeCloseTo(WALK_SPEED, 3);
	});

	it("movement scales with delta time (0.016s vs 0.032s = double distance)", () => {
		const mv1 = computeMovementVector(
			{ ...noKeys, forward: true },
			0,
			0.016,
		);
		const mv2 = computeMovementVector(
			{ ...noKeys, forward: true },
			0,
			0.032,
		);
		expect(Math.abs(mv2.z)).toBeCloseTo(Math.abs(mv1.z) * 2, 5);
	});

	it("walk speed is 2.0 m/s", () => {
		expect(WALK_SPEED).toBe(2.0);
		const mv = computeMovementVector(
			{ ...noKeys, forward: true },
			0,
			1,
		);
		const len = Math.sqrt(mv.x ** 2 + mv.z ** 2);
		expect(len).toBeCloseTo(2.0, 3);
	});

	it("run speed (shift held) is 4.0 m/s", () => {
		expect(RUN_SPEED).toBe(4.0);
		const mv = computeMovementVector(
			{ ...noKeys, forward: true, shift: true },
			0,
			1,
		);
		const len = Math.sqrt(mv.x ** 2 + mv.z ** 2);
		expect(len).toBeCloseTo(4.0, 3);
	});

	it("Y component of movement vector is always 0", () => {
		const mv = computeMovementVector(
			{ ...noKeys, forward: true, left: true, shift: true },
			Math.PI / 4,
			0.016,
		);
		expect(mv.y).toBe(0);
	});
});

describe("clampPitch", () => {
	const MAX_PITCH = (85 * Math.PI) / 180;

	it("clamps at +85° (looking nearly straight up)", () => {
		expect(clampPitch(Math.PI / 2)).toBeCloseTo(MAX_PITCH, 5);
	});

	it("clamps at -85° (looking nearly straight down)", () => {
		expect(clampPitch(-Math.PI / 2)).toBeCloseTo(-MAX_PITCH, 5);
	});

	it("leaves pitch unchanged when within range", () => {
		expect(clampPitch(0.5)).toBeCloseTo(0.5, 5);
		expect(clampPitch(-0.3)).toBeCloseTo(-0.3, 5);
	});

	it("returns exact boundary values at limits", () => {
		expect(clampPitch(MAX_PITCH)).toBeCloseTo(MAX_PITCH, 10);
		expect(clampPitch(-MAX_PITCH)).toBeCloseTo(-MAX_PITCH, 10);
	});
});

describe("getWalkthroughSpawnPoint", () => {
	it("returns position near PVC door (x≈8.1, y=1.7, z≈19.5)", () => {
		const sp = getWalkthroughSpawnPoint(HALL);
		expect(sp.x).toBeCloseTo(8.1, 1);
		expect(sp.y).toBeCloseTo(EYE_HEIGHT, 1);
		expect(sp.z).toBeCloseTo(19.5, 1);
	});

	it("spawn point Y is exactly 1.7m (eye level)", () => {
		const sp = getWalkthroughSpawnPoint(HALL);
		expect(sp.y).toBe(EYE_HEIGHT);
	});

	it("spawn point X is within hall boundaries [0, hall.width]", () => {
		const sp = getWalkthroughSpawnPoint(HALL);
		expect(sp.x).toBeGreaterThanOrEqual(0);
		expect(sp.x).toBeLessThanOrEqual(HALL.width);
	});

	it("spawn point Z is inside hall (not beyond south wall)", () => {
		const sp = getWalkthroughSpawnPoint(HALL);
		expect(sp.z).toBeLessThan(HALL.length);
		expect(sp.z).toBeGreaterThan(0);
	});

	it("falls back to hall center X when no PVC door exists", () => {
		const hallNoPvc = {
			...HALL,
			doors: HALL.doors.filter((d) => d.type !== "pvc"),
		};
		const sp = getWalkthroughSpawnPoint(hallNoPvc);
		expect(sp.x).toBeCloseTo(HALL.width / 2, 1);
		expect(sp.y).toBe(EYE_HEIGHT);
	});
});
