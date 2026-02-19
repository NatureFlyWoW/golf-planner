import { describe, expect, it } from "vitest";
import {
	getSunDirection,
	getWallExposure,
} from "../../src/hooks/useSunPosition";

describe("getSunDirection", () => {
	it("azimuth=0 (south): sun position is Z+ direction", () => {
		const dir = getSunDirection(0);
		expect(dir.x).toBeCloseTo(0, 5);
		expect(dir.z).toBeCloseTo(1, 5); // south = Z+
	});

	it("azimuth=PI/2 (west): sun position is X- direction", () => {
		const dir = getSunDirection(Math.PI / 2);
		expect(dir.x).toBeCloseTo(-1, 5); // west = X-
		expect(dir.z).toBeCloseTo(0, 1);
	});

	it("azimuth=-PI/2 (east): sun position is X+ direction", () => {
		const dir = getSunDirection(-Math.PI / 2);
		expect(dir.x).toBeCloseTo(1, 5); // east = X+
		expect(dir.z).toBeCloseTo(0, 1);
	});

	it("azimuth=PI (north): sun position is Z- direction", () => {
		const dir = getSunDirection(Math.PI);
		expect(dir.x).toBeCloseTo(0, 1);
		expect(dir.z).toBeCloseTo(-1, 5); // north = Z-
	});
});

describe("getWallExposure", () => {
	it("south wall is exposed when sun is due south (azimuth=0)", () => {
		const exposure = getWallExposure(0);
		expect(exposure.south).toBeGreaterThan(0);
		expect(exposure.north).toBeLessThanOrEqual(0);
	});

	it("east wall is exposed when sun is due east (azimuth=-PI/2)", () => {
		const exposure = getWallExposure(-Math.PI / 2);
		expect(exposure.east).toBeGreaterThan(0);
		expect(exposure.west).toBeLessThanOrEqual(0);
	});

	it("all walls have zero exposure when sun is below horizon", () => {
		const exposure = getWallExposure(0, -10);
		expect(exposure.north).toBe(0);
		expect(exposure.south).toBe(0);
		expect(exposure.east).toBe(0);
		expect(exposure.west).toBe(0);
	});
});
