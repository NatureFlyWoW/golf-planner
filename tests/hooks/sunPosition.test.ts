import { describe, expect, it } from "vitest";
import {
	getSunDirection,
	getWallExposure,
} from "../../src/hooks/useSunPosition";

describe("getSunDirection", () => {
	it("converts suncalc azimuth to scene direction vector", () => {
		// azimuth=0 means sun is due south in suncalc
		// In scene: sun is at Z+ (south), so arrow should point from Z+ toward center
		const dir = getSunDirection(0);
		expect(dir.x).toBeCloseTo(0, 5);
		expect(dir.z).toBeCloseTo(-1, 5); // pointing north (from south toward hall)
	});

	it("azimuth=PI/2 means sun is due west", () => {
		const dir = getSunDirection(Math.PI / 2);
		// Sun is west (X-), direction toward hall is east (X+)
		expect(dir.x).toBeCloseTo(-1, 5);
		expect(dir.z).toBeCloseTo(0, 1);
	});

	it("azimuth=-PI/2 means sun is due east", () => {
		const dir = getSunDirection(-Math.PI / 2);
		expect(dir.x).toBeCloseTo(1, 5);
		expect(dir.z).toBeCloseTo(0, 1);
	});

	it("azimuth=PI means sun is due north", () => {
		const dir = getSunDirection(Math.PI);
		expect(dir.x).toBeCloseTo(0, 1);
		expect(dir.z).toBeCloseTo(1, 5); // pointing south (from north toward hall)
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
