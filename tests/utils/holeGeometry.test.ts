import { describe, expect, it } from "vitest";
import {
	CUP_DEPTH,
	createCupGeometry,
	createFlagPinGeometry,
	createTeeGeometry,
	FLAG_PIN_HEIGHT,
} from "../../src/utils/holeGeometry";

function getBoundingBox(geom: {
	computeBoundingBox(): void;
	boundingBox: unknown;
}) {
	geom.computeBoundingBox();
	const bb = geom.boundingBox as {
		max: { x: number; y: number; z: number };
		min: { x: number; y: number; z: number };
	};
	return bb;
}

describe("createCupGeometry", () => {
	it("returns a CylinderGeometry for the recessed cup", () => {
		const geom = createCupGeometry(0.054);
		expect(geom).toBeDefined();
		expect(geom.attributes.position).toBeDefined();
	});

	it("cup has correct radius matching CUP_RADIUS", () => {
		const geom = createCupGeometry(0.054);
		const bb = getBoundingBox(geom);
		const diameter = bb.max.x - bb.min.x;
		expect(diameter).toBeCloseTo(0.108, 2);
	});

	it("cup has visible depth (height > 0)", () => {
		expect(CUP_DEPTH).toBeGreaterThan(0);
		expect(CUP_DEPTH).toBeLessThanOrEqual(0.03);
	});
});

describe("createTeeGeometry", () => {
	it("returns a CylinderGeometry for the raised tee pad", () => {
		const geom = createTeeGeometry(0.03);
		expect(geom).toBeDefined();
		expect(geom.attributes.position).toBeDefined();
	});

	it("tee has correct radius matching TEE_RADIUS", () => {
		const geom = createTeeGeometry(0.03);
		const bb = getBoundingBox(geom);
		const diameter = bb.max.x - bb.min.x;
		expect(diameter).toBeCloseTo(0.06, 2);
	});

	it("tee has visible height (2-3mm raised)", () => {
		const geom = createTeeGeometry(0.03);
		const bb = getBoundingBox(geom);
		const height = bb.max.y - bb.min.y;
		expect(height).toBeGreaterThanOrEqual(0.002);
		expect(height).toBeLessThanOrEqual(0.005);
	});
});

describe("createFlagPinGeometry", () => {
	it("returns a thin cylinder geometry for the flag pin shaft", () => {
		const geom = createFlagPinGeometry();
		expect(geom).toBeDefined();
		expect(geom.attributes.position).toBeDefined();
	});

	it("flag pin has reasonable height", () => {
		expect(FLAG_PIN_HEIGHT).toBeGreaterThanOrEqual(0.1);
		expect(FLAG_PIN_HEIGHT).toBeLessThanOrEqual(0.3);
	});
});
