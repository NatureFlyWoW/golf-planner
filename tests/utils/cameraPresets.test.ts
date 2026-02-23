import { describe, expect, it } from "vitest";
import { getCameraPresets } from "../../src/utils/cameraPresets";

describe("getCameraPresets", () => {
	const hallWidth = 10;
	const hallLength = 20;
	const presets = getCameraPresets(hallWidth, hallLength);

	it("returns all 7 presets (top, front, back, left, right, isometric, overview)", () => {
		expect(Object.keys(presets)).toHaveLength(7);
		expect(presets).toHaveProperty("top");
		expect(presets).toHaveProperty("front");
		expect(presets).toHaveProperty("back");
		expect(presets).toHaveProperty("left");
		expect(presets).toHaveProperty("right");
		expect(presets).toHaveProperty("isometric");
		expect(presets).toHaveProperty("overview");
	});

	it("each preset has a position array of length 3", () => {
		for (const key of Object.keys(presets)) {
			expect(presets[key as keyof typeof presets].position).toHaveLength(3);
		}
	});

	it("each preset has a target array of length 3", () => {
		for (const key of Object.keys(presets)) {
			expect(presets[key as keyof typeof presets].target).toHaveLength(3);
		}
	});

	it('"top" preset position is above hall center (Y > 30)', () => {
		expect(presets.top.position[1]).toBeGreaterThan(30);
	});

	it('"top" preset target is at hall center', () => {
		expect(presets.top.target[0]).toBeCloseTo(hallWidth / 2);
		expect(presets.top.target[2]).toBeCloseTo(hallLength / 2);
	});

	it('"front" preset is at negative Z, low Y, looking at center', () => {
		expect(presets.front.position[2]).toBeLessThan(0);
		expect(presets.front.position[1]).toBeLessThan(30);
	});

	it('"back" preset is at positive Z, low Y, looking at center', () => {
		expect(presets.back.position[2]).toBeGreaterThan(hallLength);
		expect(presets.back.position[1]).toBeLessThan(30);
	});

	it('"left" preset is at negative X', () => {
		expect(presets.left.position[0]).toBeLessThan(0);
	});

	it('"right" preset is at positive X', () => {
		expect(presets.right.position[0]).toBeGreaterThan(hallWidth);
	});

	it('"isometric" preset has non-zero X, Y, Z', () => {
		for (const v of presets.isometric.position) {
			expect(v).not.toBe(0);
		}
	});

	it("all presets have targets at approximately hall center", () => {
		const cx = hallWidth / 2;
		const cz = hallLength / 2;
		for (const key of Object.keys(presets)) {
			const t = presets[key as keyof typeof presets].target;
			expect(t[0]).toBeCloseTo(cx, 0);
			expect(t[2]).toBeCloseTo(cz, 0);
		}
	});

	it('"overview" preset position is outside hall perimeter', () => {
		const pos = presets.overview.position;
		const outsideX = pos[0] < 0 || pos[0] > hallWidth;
		const outsideZ = pos[2] < 0 || pos[2] > hallLength;
		expect(outsideX || outsideZ).toBe(true);
	});

	it('"overview" preset target is hall center', () => {
		const cx = hallWidth / 2;
		const cz = hallLength / 2;
		expect(presets.overview.target[0]).toBeCloseTo(cx);
		expect(presets.overview.target[2]).toBeCloseTo(cz);
	});

	it('"overview" preset Y position is elevated (above hall roof)', () => {
		expect(presets.overview.position[1]).toBeGreaterThan(10);
	});

	it("different hall dimensions produce different positions", () => {
		const smallPresets = getCameraPresets(5, 10);
		const largePresets = getCameraPresets(20, 40);
		expect(smallPresets.top.position).not.toEqual(largePresets.top.position);
		expect(smallPresets.front.position).not.toEqual(
			largePresets.front.position,
		);
	});
});
