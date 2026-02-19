import { describe, expect, it } from "vitest";
import { checkHallBounds, checkOBBCollision } from "../../src/utils/collision";

describe("checkOBBCollision", () => {
	it("detects overlap between axis-aligned rectangles", () => {
		const a = { pos: { x: 1, z: 1 }, rot: 0, w: 2, l: 2 };
		const b = { pos: { x: 2, z: 1 }, rot: 0, w: 2, l: 2 };
		expect(checkOBBCollision(a, b)).toBe(true);
	});

	it("returns false for separated axis-aligned rectangles", () => {
		const a = { pos: { x: 0, z: 0 }, rot: 0, w: 1, l: 1 };
		const b = { pos: { x: 3, z: 0 }, rot: 0, w: 1, l: 1 };
		expect(checkOBBCollision(a, b)).toBe(false);
	});

	it("detects overlap between rotated rectangles", () => {
		const a = { pos: { x: 1, z: 1 }, rot: 45, w: 2, l: 2 };
		const b = { pos: { x: 2.5, z: 1 }, rot: 0, w: 2, l: 2 };
		expect(checkOBBCollision(a, b)).toBe(true);
	});

	it("returns false for rotated rectangles that miss", () => {
		const a = { pos: { x: 0, z: 0 }, rot: 45, w: 1, l: 1 };
		const b = { pos: { x: 3, z: 3 }, rot: 30, w: 1, l: 1 };
		expect(checkOBBCollision(a, b)).toBe(false);
	});

	it("returns true for identical overlapping position", () => {
		const a = { pos: { x: 5, z: 5 }, rot: 0, w: 2, l: 3 };
		const b = { pos: { x: 5, z: 5 }, rot: 90, w: 2, l: 3 };
		expect(checkOBBCollision(a, b)).toBe(true);
	});

	it("returns false when just touching edges (no overlap)", () => {
		const a = { pos: { x: 0, z: 0 }, rot: 0, w: 2, l: 2 };
		const b = { pos: { x: 2, z: 0 }, rot: 0, w: 2, l: 2 };
		expect(checkOBBCollision(a, b)).toBe(false);
	});
});

describe("checkHallBounds", () => {
	const hall = { width: 10, length: 20 };

	it("returns true when hole is fully inside hall", () => {
		expect(checkHallBounds({ x: 5, z: 10 }, 0, 2, 3, hall)).toBe(true);
	});

	it("returns false when hole extends past east wall", () => {
		expect(checkHallBounds({ x: 9.5, z: 10 }, 0, 2, 3, hall)).toBe(false);
	});

	it("returns false when hole extends past south wall", () => {
		expect(checkHallBounds({ x: 5, z: 19 }, 0, 2, 3, hall)).toBe(false);
	});

	it("handles rotated hole near corner", () => {
		expect(checkHallBounds({ x: 1, z: 1 }, 45, 1, 4, hall)).toBe(false);
	});

	it("rotated hole in center is fine", () => {
		expect(checkHallBounds({ x: 5, z: 10 }, 45, 2, 3, hall)).toBe(true);
	});
});
