import { describe, expect, it } from "vitest";
import { snapToGrid } from "../../src/utils/snap";

describe("snapToGrid", () => {
	it("snaps to nearest grid increment", () => {
		expect(snapToGrid(1.13, 0.25)).toBe(1.25);
		expect(snapToGrid(1.12, 0.25)).toBe(1.0);
	});

	it("returns exact value when already on grid", () => {
		expect(snapToGrid(2.5, 0.25)).toBe(2.5);
		expect(snapToGrid(0, 0.25)).toBe(0);
	});

	it("works with different grid sizes", () => {
		expect(snapToGrid(1.3, 0.5)).toBe(1.5);
		expect(snapToGrid(1.2, 0.5)).toBe(1.0);
		expect(snapToGrid(3.7, 1.0)).toBe(4.0);
	});

	it("handles negative values", () => {
		expect(snapToGrid(-1.13, 0.25)).toBe(-1.25);
		expect(snapToGrid(-1.63, 0.25)).toBe(-1.75);
	});
});
