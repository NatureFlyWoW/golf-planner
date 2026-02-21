import { describe, expect, it } from "vitest";
import {
	createBumperGeometry,
	createBumperProfile,
} from "../../../src/utils/bumperProfile";
import {
	CUP_DEPTH,
	FLAG_PIN_HEIGHT,
	createCupGeometry,
	createFlagPinGeometry,
	createTeeGeometry,
} from "../../../src/utils/holeGeometry";

describe("BumperRail shared component geometry", () => {
	it("creates ExtrudeGeometry with rounded profile", () => {
		const profile = createBumperProfile(0.08, 0.05, 0.008);
		const geom = createBumperGeometry(profile, 1.0);
		expect(geom.attributes.position).toBeDefined();
		expect(geom.attributes.position.count).toBeGreaterThan(0);
	});

	it("accepts variable length and produces different geometry", () => {
		const profile = createBumperProfile(0.08, 0.05, 0.008);
		const short = createBumperGeometry(profile, 0.5);
		const long = createBumperGeometry(profile, 2.0);
		short.computeBoundingBox();
		long.computeBoundingBox();
		const shortBB = short.boundingBox as { max: { z: number }; min: { z: number } };
		const longBB = long.boundingBox as { max: { z: number }; min: { z: number } };
		expect(longBB.max.z - longBB.min.z).toBeGreaterThan(shortBB.max.z - shortBB.min.z);
	});

	it("height matches BUMPER_HEIGHT (0.08)", () => {
		const profile = createBumperProfile(0.08, 0.05, 0.008);
		const geom = createBumperGeometry(profile, 1.0);
		geom.computeBoundingBox();
		const bb = geom.boundingBox as { max: { y: number }; min: { y: number } };
		const height = bb.max.y - bb.min.y;
		expect(height).toBeCloseTo(0.08, 2);
	});

	it("thickness matches BUMPER_THICKNESS (0.05)", () => {
		const profile = createBumperProfile(0.08, 0.05, 0.008);
		const geom = createBumperGeometry(profile, 1.0);
		geom.computeBoundingBox();
		const bb = geom.boundingBox as { max: { x: number }; min: { x: number } };
		const thickness = bb.max.x - bb.min.x;
		expect(thickness).toBeCloseTo(0.05, 2);
	});

	it("supports custom height for ramp taller bumpers", () => {
		const profile = createBumperProfile(0.23, 0.05, 0.008);
		const geom = createBumperGeometry(profile, 1.0);
		geom.computeBoundingBox();
		const bb = geom.boundingBox as { max: { y: number }; min: { y: number } };
		const height = bb.max.y - bb.min.y;
		expect(height).toBeCloseTo(0.23, 2);
	});

	it("geometry can be disposed cleanly", () => {
		const profile = createBumperProfile(0.08, 0.05, 0.008);
		const geom = createBumperGeometry(profile, 1.0);
		expect(() => geom.dispose()).not.toThrow();
	});
});

describe("Cup shared component geometry", () => {
	it("creates recessed cylinder geometry", () => {
		const geom = createCupGeometry(0.054);
		expect(geom.attributes.position).toBeDefined();
	});

	it("has correct radius", () => {
		const geom = createCupGeometry(0.054);
		geom.computeBoundingBox();
		const bb = geom.boundingBox as { max: { x: number }; min: { x: number } };
		expect(bb.max.x - bb.min.x).toBeCloseTo(0.108, 2);
	});

	it("has non-zero depth", () => {
		expect(CUP_DEPTH).toBeGreaterThan(0);
	});

	it("flag pin geometry is thin cylinder", () => {
		const geom = createFlagPinGeometry();
		geom.computeBoundingBox();
		const bb = geom.boundingBox as { max: { x: number }; min: { x: number } };
		const diameter = bb.max.x - bb.min.x;
		expect(diameter).toBeLessThan(0.01);
	});

	it("flag pin has correct height", () => {
		expect(FLAG_PIN_HEIGHT).toBe(0.2);
	});
});

describe("TeePad shared component geometry", () => {
	it("creates raised cylinder geometry", () => {
		const geom = createTeeGeometry(0.03);
		expect(geom.attributes.position).toBeDefined();
	});

	it("has correct radius", () => {
		const geom = createTeeGeometry(0.03);
		geom.computeBoundingBox();
		const bb = geom.boundingBox as { max: { x: number }; min: { x: number } };
		expect(bb.max.x - bb.min.x).toBeCloseTo(0.06, 2);
	});

	it("has small height (2-3mm)", () => {
		const geom = createTeeGeometry(0.03);
		geom.computeBoundingBox();
		const bb = geom.boundingBox as { max: { y: number }; min: { y: number } };
		const height = bb.max.y - bb.min.y;
		expect(height).toBeGreaterThanOrEqual(0.002);
		expect(height).toBeLessThanOrEqual(0.005);
	});
});
