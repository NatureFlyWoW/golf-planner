import { describe, expect, it } from "vitest";
import {
	getGroundPlaneDimensions,
	getGroundPlanePosition,
	getGroundTextureRepeat,
} from "../../../src/components/three/environment/GroundPlane";
import { shouldShowGroundTexture } from "../../../src/utils/environmentGating";
import { HALL } from "../../../src/constants/hall";

describe("getGroundPlaneDimensions", () => {
	it("extends 30m beyond hall in both dimensions", () => {
		const { width, length } = getGroundPlaneDimensions(HALL.width, HALL.length);
		expect(width).toBe(HALL.width + 30);
		expect(length).toBe(HALL.length + 30);
	});

	it("uses extension constant of 30m", () => {
		const { width, length } = getGroundPlaneDimensions(10, 20);
		expect(width).toBe(40);
		expect(length).toBe(50);
	});
});

describe("getGroundPlanePosition", () => {
	it("Y position is -0.01 (below floor to avoid z-fighting)", () => {
		const { y } = getGroundPlanePosition();
		expect(y).toBe(-0.01);
	});

	it("is centered on hall center X (width/2)", () => {
		const { x } = getGroundPlanePosition(HALL.width, HALL.length);
		expect(x).toBe(HALL.width / 2);
	});

	it("is centered on hall center Z (length/2)", () => {
		const { z } = getGroundPlanePosition(HALL.width, HALL.length);
		expect(z).toBe(HALL.length / 2);
	});
});

describe("getGroundTextureRepeat", () => {
	it("divides total width by tile size (2m)", () => {
		const { repeatX } = getGroundTextureRepeat(40, 50);
		expect(repeatX).toBe(20);
	});

	it("divides total length by tile size (2m)", () => {
		const { repeatZ } = getGroundTextureRepeat(40, 50);
		expect(repeatZ).toBe(25);
	});

	it("uses 2m tile size by default", () => {
		const { repeatX } = getGroundTextureRepeat(10, 10);
		expect(repeatX).toBe(5);
	});
});

describe("shouldShowGroundTexture (environmentGating)", () => {
	it('returns false for "low" GPU tier', () => {
		expect(shouldShowGroundTexture("low")).toBe(false);
	});

	it('returns true for "mid" GPU tier', () => {
		expect(shouldShowGroundTexture("mid")).toBe(true);
	});

	it('returns true for "high" GPU tier', () => {
		expect(shouldShowGroundTexture("high")).toBe(true);
	});
});
