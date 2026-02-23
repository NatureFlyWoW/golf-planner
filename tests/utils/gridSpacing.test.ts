import { describe, expect, it } from "vitest";
import {
	computeGridLabelPositions,
	computeGridLineSegments,
	computeGridSpacing,
} from "../../src/utils/gridSpacing";

describe("computeGridSpacing", () => {
	it("returns 5m major lines with no minor lines at zoom < 10", () => {
		const result = computeGridSpacing(5);
		expect(result.majorSpacing).toBe(5);
		expect(result.minorSpacing).toBeNull();
	});

	it("returns 1m major + 0.5m minor lines at zoom 10-30", () => {
		const result = computeGridSpacing(20);
		expect(result.majorSpacing).toBe(1);
		expect(result.minorSpacing).toBe(0.5);
	});

	it("returns 1m major + 0.25m minor lines at zoom > 30", () => {
		const result = computeGridSpacing(50);
		expect(result.majorSpacing).toBe(1);
		expect(result.minorSpacing).toBe(0.25);
	});

	it("boundary: zoom exactly 10 returns medium spacing", () => {
		const result = computeGridSpacing(10);
		expect(result.majorSpacing).toBe(1);
		expect(result.minorSpacing).toBe(0.5);
	});

	it("boundary: zoom exactly 30 returns medium spacing", () => {
		const result = computeGridSpacing(30);
		expect(result.majorSpacing).toBe(1);
		expect(result.minorSpacing).toBe(0.5);
	});

	it("boundary: zoom 30.01 returns close spacing", () => {
		const result = computeGridSpacing(30.01);
		expect(result.majorSpacing).toBe(1);
		expect(result.minorSpacing).toBe(0.25);
	});
});

describe("computeGridLabelPositions", () => {
	it("returns correct X-axis label positions for 10m width at 1m spacing", () => {
		const labels = computeGridLabelPositions("x", 10, 1);
		expect(labels).toHaveLength(11);
		expect(labels[0]).toEqual({ value: 0, position: [0, 0.01, -0.5] });
		expect(labels[10]).toEqual({ value: 10, position: [10, 0.01, -0.5] });
	});

	it("returns correct Z-axis label positions for 20m length at 1m spacing", () => {
		const labels = computeGridLabelPositions("z", 20, 1);
		expect(labels).toHaveLength(21);
		expect(labels[0]).toEqual({ value: 0, position: [-0.5, 0.01, 0] });
		expect(labels[20]).toEqual({ value: 20, position: [-0.5, 0.01, 20] });
	});

	it("returns correct positions at 5m spacing for overview zoom", () => {
		const labels = computeGridLabelPositions("x", 10, 5);
		expect(labels).toHaveLength(3);
		expect(labels[0].value).toBe(0);
		expect(labels[1].value).toBe(5);
		expect(labels[2].value).toBe(10);
	});

	it("returns correct Z labels at 5m spacing", () => {
		const labels = computeGridLabelPositions("z", 20, 5);
		expect(labels).toHaveLength(5);
	});

	it("returns empty array for zero spacing", () => {
		const labels = computeGridLabelPositions("x", 10, 0);
		expect(labels).toEqual([]);
	});
});

describe("computeGridLineSegments", () => {
	it("generates correct segment count for 1m spacing on 10x20 hall", () => {
		const segments = computeGridLineSegments(10, 20, 1);
		// 11 vertical lines (X=0..10) + 21 horizontal lines (Z=0..20) = 32 lines
		// Each line = 2 points, so 64 points total
		expect(segments).toHaveLength(64);
	});

	it("all points have Y = 0.01", () => {
		const segments = computeGridLineSegments(10, 20, 5);
		for (const point of segments) {
			expect(point[1]).toBe(0.01);
		}
	});

	it("handles spacing that does not evenly divide dimensions", () => {
		const segments = computeGridLineSegments(10, 20, 3);
		// X: 0, 3, 6, 9 → 4 vertical lines
		// Z: 0, 3, 6, 9, 12, 15, 18 → 7 horizontal lines
		// Total: (4 + 7) * 2 = 22 points
		expect(segments).toHaveLength(22);
	});

	it("returns empty array for zero spacing", () => {
		const segments = computeGridLineSegments(10, 20, 0);
		expect(segments).toEqual([]);
	});
});
