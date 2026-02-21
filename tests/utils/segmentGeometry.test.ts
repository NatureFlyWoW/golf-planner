import { describe, expect, it } from "vitest";
import { createSegmentGeometries } from "../../src/utils/segmentGeometry";

// Helper: compute bounding box and return it, throwing if null
function getBB(geom: THREE.BufferGeometry) {
	geom.computeBoundingBox();
	const bb = geom.boundingBox;
	if (bb === null) throw new Error("computeBoundingBox returned null");
	return bb;
}

// THREE is available from the import in segmentGeometry, but we need the type here.
// Use the module's return type instead.
import type * as THREE from "three";

describe("createSegmentGeometries", () => {
	it("creates geometries for straight_1m", () => {
		const geom = createSegmentGeometries("straight_1m", 0.6);
		expect(geom.felt).toBeDefined();
		expect(geom.bumperLeft).toBeDefined();
		expect(geom.bumperRight).toBeDefined();
	});

	it("creates geometries for curve_90_left", () => {
		const geom = createSegmentGeometries("curve_90_left", 0.6);
		expect(geom.felt).toBeDefined();
		expect(geom.bumperLeft).toBeDefined();
		expect(geom.bumperRight).toBeDefined();
	});

	it("creates geometries for all 11 specs without errors", () => {
		const specs = [
			"straight_1m",
			"straight_2m",
			"straight_3m",
			"curve_90_left",
			"curve_90_right",
			"curve_45_left",
			"curve_45_right",
			"curve_30_wide",
			"s_curve",
			"u_turn",
			"chicane",
		] as const;
		for (const specId of specs) {
			const geom = createSegmentGeometries(specId, 0.6);
			expect(geom.felt).toBeDefined();
			expect(geom.bumperLeft).toBeDefined();
			expect(geom.bumperRight).toBeDefined();
		}
	});

	it("straight felt geometry has vertices", () => {
		const geom = createSegmentGeometries("straight_2m", 0.6);
		const posAttr = geom.felt.getAttribute("position");
		expect(posAttr.count).toBeGreaterThan(0);
	});

	it("curve felt geometry has vertices", () => {
		const geom = createSegmentGeometries("curve_90_left", 0.6);
		const posAttr = geom.felt.getAttribute("position");
		expect(posAttr.count).toBeGreaterThan(0);
	});

	it("different felt widths produce different geometry bounds", () => {
		const narrow = createSegmentGeometries("straight_2m", 0.4);
		const wide = createSegmentGeometries("straight_2m", 1.0);
		const narrowBB = getBB(narrow.felt);
		const wideBB = getBB(wide.felt);
		const narrowWidth = narrowBB.max.x - narrowBB.min.x;
		const wideWidth = wideBB.max.x - wideBB.min.x;
		expect(wideWidth).toBeGreaterThan(narrowWidth);
	});

	it("bumpers are taller than felt", () => {
		const geom = createSegmentGeometries("straight_1m", 0.6);
		const feltBB = getBB(geom.felt);
		const bumperBB = getBB(geom.bumperLeft);
		expect(bumperBB.max.y).toBeGreaterThan(feltBB.max.y);
	});

	it("straight felt bounding box matches expected dimensions", () => {
		const feltWidth = 0.6;
		const geom = createSegmentGeometries("straight_2m", feltWidth);
		const bb = getBB(geom.felt);
		// Width = feltWidth
		expect(bb.max.x - bb.min.x).toBeCloseTo(feltWidth, 5);
		// Length = 2m
		expect(bb.max.z - bb.min.z).toBeCloseTo(2, 5);
	});

	it("straight bumper is positioned outside the felt surface", () => {
		const feltWidth = 0.6;
		const hw = feltWidth / 2;
		const geom = createSegmentGeometries("straight_1m", feltWidth);
		const leftBB = getBB(geom.bumperLeft);
		const rightBB = getBB(geom.bumperRight);
		// Left bumper's right edge should be at -hw (or very close)
		expect(leftBB.max.x).toBeCloseTo(-hw, 4);
		// Right bumper's left edge should be at +hw
		expect(rightBB.min.x).toBeCloseTo(hw, 4);
	});

	it("curve geometries have vertices for all curve types", () => {
		const curveTypes = [
			"curve_90_left",
			"curve_90_right",
			"curve_45_left",
			"curve_45_right",
			"curve_30_wide",
		] as const;
		for (const specId of curveTypes) {
			const geom = createSegmentGeometries(specId, 0.6);
			expect(geom.felt.getAttribute("position").count).toBeGreaterThan(0);
			expect(geom.bumperLeft.getAttribute("position").count).toBeGreaterThan(0);
			expect(geom.bumperRight.getAttribute("position").count).toBeGreaterThan(
				0,
			);
		}
	});

	it("complex geometries have vertices for u_turn, s_curve, chicane", () => {
		const complexTypes = ["u_turn", "s_curve", "chicane"] as const;
		for (const specId of complexTypes) {
			const geom = createSegmentGeometries(specId, 0.6);
			expect(geom.felt.getAttribute("position").count).toBeGreaterThan(0);
			expect(geom.bumperLeft.getAttribute("position").count).toBeGreaterThan(0);
			expect(geom.bumperRight.getAttribute("position").count).toBeGreaterThan(
				0,
			);
		}
	});

	it("bumper left and bumper right are distinct geometries", () => {
		const geom = createSegmentGeometries("straight_1m", 0.6);
		const leftBB = getBB(geom.bumperLeft);
		const rightBB = getBB(geom.bumperRight);
		// Left bumper is at negative X, right at positive X
		expect(leftBB.max.x).toBeLessThan(0);
		expect(rightBB.min.x).toBeGreaterThan(0);
	});

	it("s_curve felt extends in both X and Z", () => {
		const geom = createSegmentGeometries("s_curve", 0.6);
		const bb = getBB(geom.felt);
		// S-curve goes to x=-1.6, z=1.6, so bounding box must cover that range
		expect(bb.min.x).toBeLessThan(-0.5);
		expect(bb.max.z).toBeGreaterThan(0.5);
	});

	it("u_turn felt is wide in X (covers -1.6 to 0)", () => {
		const geom = createSegmentGeometries("u_turn", 0.6);
		const bb = getBB(geom.felt);
		// U-turn arc center at (-0.8, 0), sweeps 180°. Felt should span wide in X.
		expect(bb.max.x - bb.min.x).toBeGreaterThan(1.0);
	});

	it("right curve bumperLeft (outer) has greater radius span than bumperRight (inner)", () => {
		// For right curves, center is at +X. Outer bumper = left side, inner = right side.
		// The outer bumper spans a wider arc in X than the inner bumper.
		const geom = createSegmentGeometries("curve_90_right", 0.6);
		const leftBB = getBB(geom.bumperLeft);
		const rightBB = getBB(geom.bumperRight);
		const leftSpanX = leftBB.max.x - leftBB.min.x;
		const rightSpanX = rightBB.max.x - rightBB.min.x;
		// Outer (left) bumper spans a wider X range than inner (right) bumper
		expect(leftSpanX).toBeGreaterThan(rightSpanX);
	});

	it("straight bumpers use ExtrudeGeometry (vertex count > 24)", () => {
		const geom = createSegmentGeometries("straight_1m", 0.6);
		// BoxGeometry has exactly 24 vertices; ExtrudeGeometry with rounded profile has more
		expect(geom.bumperLeft.getAttribute("position").count).toBeGreaterThan(24);
		expect(geom.bumperRight.getAttribute("position").count).toBeGreaterThan(24);
	});

	it("chicane bumpers use ExtrudeGeometry (vertex count > 48)", () => {
		const geom = createSegmentGeometries("chicane", 0.6);
		// Chicane merges 2 sections; with BoxGeometry that's 2×24=48.
		// ExtrudeGeometry merged sections should exceed 48.
		expect(geom.bumperLeft.getAttribute("position").count).toBeGreaterThan(48);
		expect(geom.bumperRight.getAttribute("position").count).toBeGreaterThan(48);
	});

	it("all 11 segment types produce bumpers with vertex count > 24", () => {
		const specs = [
			"straight_1m",
			"straight_2m",
			"straight_3m",
			"curve_90_left",
			"curve_90_right",
			"curve_45_left",
			"curve_45_right",
			"curve_30_wide",
			"s_curve",
			"u_turn",
			"chicane",
		] as const;
		for (const specId of specs) {
			const geom = createSegmentGeometries(specId, 0.6);
			expect(
				geom.bumperLeft.getAttribute("position").count,
			).toBeGreaterThan(24);
			expect(
				geom.bumperRight.getAttribute("position").count,
			).toBeGreaterThan(24);
		}
	});

	it("bumper triangle count stays within budget (<=500 per rail)", () => {
		const geom = createSegmentGeometries("straight_1m", 0.6);
		const leftIdx = geom.bumperLeft.getIndex();
		const leftTriangles = leftIdx
			? leftIdx.count / 3
			: geom.bumperLeft.getAttribute("position").count / 3;
		const rightIdx = geom.bumperRight.getIndex();
		const rightTriangles = rightIdx
			? rightIdx.count / 3
			: geom.bumperRight.getAttribute("position").count / 3;
		expect(leftTriangles).toBeLessThanOrEqual(500);
		expect(rightTriangles).toBeLessThanOrEqual(500);
	});
});
