import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { HALL } from "../../../src/constants/hall";
import { getFoundationStrips } from "../../../src/components/three/environment/HallFoundation";
import { getRoofGeometryParams } from "../../../src/components/three/environment/HallRoof";
import { shouldLoadExteriorTextures } from "../../../src/components/three/environment/HallWallsExterior";

describe("getRoofGeometryParams", () => {
	it("ridge height equals hall.firstHeight (4.9m)", () => {
		const params = getRoofGeometryParams(HALL);
		expect(params.ridgeY).toBe(HALL.firstHeight);
	});

	it("ridge X is at hall centerline (width / 2)", () => {
		const params = getRoofGeometryParams(HALL);
		expect(params.ridgeX).toBe(HALL.width / 2);
	});

	it("eave Y equals wall height (4.3m)", () => {
		const params = getRoofGeometryParams(HALL);
		expect(params.eaveY).toBe(HALL.wallHeight);
	});

	it("slope half-width is hall.width / 2 (5.0m)", () => {
		const params = getRoofGeometryParams(HALL);
		expect(params.slopeHalfWidth).toBe(HALL.width / 2);
	});

	it("slope length equals hall.length (20.0m)", () => {
		const params = getRoofGeometryParams(HALL);
		expect(params.slopeLength).toBe(HALL.length);
	});

	it("slope angle is approximately 6.84 degrees (atan2(0.6, 5.0))", () => {
		const params = getRoofGeometryParams(HALL);
		const expectedAngle = Math.atan2(
			HALL.firstHeight - HALL.wallHeight,
			HALL.width / 2,
		);
		expect(params.slopeAngle).toBeCloseTo(expectedAngle, 5);
	});
});

describe("getFoundationStrips", () => {
	it("returns 4 strips (one per wall side)", () => {
		const strips = getFoundationStrips(HALL);
		expect(strips).toHaveLength(4);
	});

	it("all strips have height 0.15m", () => {
		const strips = getFoundationStrips(HALL);
		for (const strip of strips) {
			expect(strip.size[1]).toBe(0.15);
		}
	});

	it("all strips have Y position -0.075 (half above, half below ground)", () => {
		const strips = getFoundationStrips(HALL);
		for (const strip of strips) {
			expect(strip.position[1]).toBe(-0.075);
		}
	});

	it("long wall strips (east/west) have 0.3m perpendicular width", () => {
		const strips = getFoundationStrips(HALL);
		const westStrip = strips.find((s) => s.position[0] === 0);
		expect(westStrip?.size[0]).toBe(0.3);
	});

	it("long wall strips span hall.length in Z", () => {
		const strips = getFoundationStrips(HALL);
		const westStrip = strips.find((s) => s.position[0] === 0);
		expect(westStrip?.size[2]).toBe(HALL.length);
	});

	it("short wall strips span hall.width + corner overlap in X", () => {
		const strips = getFoundationStrips(HALL);
		const northStrip = strips.find((s) => s.position[2] === 0);
		expect(northStrip?.size[0]).toBe(HALL.width + 0.6);
	});
});

describe("shouldLoadExteriorTextures", () => {
	it("returns false for low GPU tier", () => {
		expect(shouldLoadExteriorTextures("low")).toBe(false);
	});

	it("returns true for mid GPU tier", () => {
		expect(shouldLoadExteriorTextures("mid")).toBe(true);
	});

	it("returns true for high GPU tier", () => {
		expect(shouldLoadExteriorTextures("high")).toBe(true);
	});
});

describe("Exterior wall material side", () => {
	it("THREE.BackSide has expected numeric value (1)", () => {
		expect(THREE.BackSide).toBe(1);
		expect(THREE.FrontSide).toBe(0);
		expect(THREE.DoubleSide).toBe(2);
	});
});
