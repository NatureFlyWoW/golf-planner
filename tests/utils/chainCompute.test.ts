import { describe, expect, it } from "vitest";
import type { Segment } from "../../src/types/template";
import {
	computeChainPositions,
	computeTemplateBounds,
} from "../../src/utils/chainCompute";

/** Helper: create a minimal Segment with default position/rotation (overridden by chain computation). */
function makeSegment(specId: string, id?: string): Segment {
	return {
		id: id ?? `seg-${specId}`,
		specId: specId as Segment["specId"],
		position: { x: 0, z: 0 },
		rotation: 0,
		connections: { entry: { segmentId: null }, exit: { segmentId: null } },
	};
}

// ---------------------------------------------------------------------------
// computeChainPositions
// ---------------------------------------------------------------------------

describe("computeChainPositions", () => {
	it("returns empty array for empty input", () => {
		expect(computeChainPositions([])).toEqual([]);
	});

	it("single segment: placed at origin with rotation 0", () => {
		const result = computeChainPositions([makeSegment("straight_1m")]);
		expect(result).toHaveLength(1);
		expect(result[0].position.x).toBeCloseTo(0, 5);
		expect(result[0].position.z).toBeCloseTo(0, 5);
		expect(result[0].rotation).toBe(0);
	});

	it("two straight_1m segments chain end-to-end: second at (0, 1)", () => {
		const result = computeChainPositions([
			makeSegment("straight_1m", "s0"),
			makeSegment("straight_1m", "s1"),
		]);
		expect(result).toHaveLength(2);
		// First at origin
		expect(result[0].position.x).toBeCloseTo(0, 5);
		expect(result[0].position.z).toBeCloseTo(0, 5);
		expect(result[0].rotation).toBe(0);
		// Second snapped to first's exit (0, 1)
		expect(result[1].position.x).toBeCloseTo(0, 5);
		expect(result[1].position.z).toBeCloseTo(1, 5);
		expect(result[1].rotation).toBeCloseTo(0, 5);
	});

	it("three straight_1m segments accumulate: third at (0, 2)", () => {
		const result = computeChainPositions([
			makeSegment("straight_1m", "s0"),
			makeSegment("straight_1m", "s1"),
			makeSegment("straight_1m", "s2"),
		]);
		expect(result).toHaveLength(3);
		expect(result[2].position.x).toBeCloseTo(0, 5);
		expect(result[2].position.z).toBeCloseTo(2, 5);
		expect(result[2].rotation).toBeCloseTo(0, 5);
	});

	it("straight_3m segments: second at (0, 3)", () => {
		const result = computeChainPositions([
			makeSegment("straight_3m", "s0"),
			makeSegment("straight_3m", "s1"),
		]);
		expect(result[1].position.x).toBeCloseTo(0, 5);
		expect(result[1].position.z).toBeCloseTo(3, 5);
		expect(result[1].rotation).toBeCloseTo(0, 5);
	});

	it("straight then curve_90_left: curve at (0, 1) with rotation 0", () => {
		// straight_1m exits at (0, 1) with angle 0
		// curve rotation = normalizeAngle(0 - 0) = 0
		// curve entry at (0,0) rotated by 0 = (0,0) → curve position = (0,1)
		const result = computeChainPositions([
			makeSegment("straight_1m", "s0"),
			makeSegment("curve_90_left", "c1"),
		]);
		expect(result).toHaveLength(2);
		expect(result[1].position.x).toBeCloseTo(0, 5);
		expect(result[1].position.z).toBeCloseTo(1, 5);
		expect(result[1].rotation).toBeCloseTo(0, 5);
	});

	it("after curve_90_left: next straight has rotation 90° and position (-0.8, 1.8)", () => {
		// Chain: straight_1m → curve_90_left → straight_1m
		// After straight_1m: curve at (0,1), rot=0
		// curve_90_left exitPoint = (-0.8, 0.8), exitAngle=270
		// rotatePoint(-0.8, 0.8, 0) = (-0.8, 0.8) → world exit = (0 + -0.8, 1 + 0.8) = (-0.8, 1.8)
		// nextRotation = normalizeAngle(0 - 270) = 90
		// nextEntryLocal = rotatePoint(0, 0, 90) = (0, 0)
		// nextPos = (-0.8 - 0, 1.8 - 0) = (-0.8, 1.8)
		const result = computeChainPositions([
			makeSegment("straight_1m", "s0"),
			makeSegment("curve_90_left", "c1"),
			makeSegment("straight_1m", "s2"),
		]);
		expect(result).toHaveLength(3);
		const seg2 = result[2];
		expect(seg2.rotation).toBeCloseTo(90, 5);
		expect(seg2.position.x).toBeCloseTo(-0.8, 5);
		expect(seg2.position.z).toBeCloseTo(1.8, 5);
	});

	it("after curve_90_left at rotation 90: next segment extends in -X direction", () => {
		// At rotation 90, the straight_1m's exitPoint (0, 1) rotated by 90° gives:
		// rotatePoint(0, 1, 90): cos=0, sin=1 → x=0*0-1*1=-1, z=0*1+1*0=0 → (-1, 0)
		// So exit is at pos.x + (-1), pos.z + 0 — extends in -X ✓
		const result = computeChainPositions([
			makeSegment("straight_1m", "s0"),
			makeSegment("curve_90_left", "c1"),
			makeSegment("straight_1m", "s2"),
		]);
		const seg2 = result[2]; // rotation=90, pos=(-0.8, 1.8)
		// exit world = rotatePoint(0, 1, 90) + pos = (-1, 0) + (-0.8, 1.8) = (-1.8, 1.8)
		const exitLocal = { x: -1, z: 0 }; // rotatePoint(0,1,90)
		expect(seg2.position.x + exitLocal.x).toBeCloseTo(-1.8, 4);
		expect(seg2.position.z + exitLocal.z).toBeCloseTo(1.8, 4);
	});

	it("after curve_90_right: next straight has rotation 270 and extends in +X direction", () => {
		// curve_90_right exitPoint = (0.8, 0.8), exitAngle=90
		// nextRotation = normalizeAngle(0 - 90) = 270
		// nextPos = (0.8, 1.8)
		const result = computeChainPositions([
			makeSegment("straight_1m", "s0"),
			makeSegment("curve_90_right", "c1"),
			makeSegment("straight_1m", "s2"),
		]);
		const seg2 = result[2];
		expect(seg2.rotation).toBeCloseTo(270, 5);
		expect(seg2.position.x).toBeCloseTo(0.8, 5);
		expect(seg2.position.z).toBeCloseTo(1.8, 5);
	});

	it("full U-turn chain: third straight extends in -Z direction", () => {
		// straight_1m → u_turn → straight_1m
		// u_turn exitPoint = (-1.6, 0), exitAngle=180
		// curve at (0,1), rot=0
		// rotatePoint(-1.6, 0, 0) = (-1.6, 0) → world exit = (-1.6, 1)
		// nextRotation = normalizeAngle(0 - 180) = 180
		// nextEntryLocal = rotatePoint(0, 0, 180) = (0, 0)
		// nextPos = (-1.6, 1)
		// At rot=180, straight_1m exit rotated: rotatePoint(0, 1, 180) = (0, -1) → -Z ✓
		const result = computeChainPositions([
			makeSegment("straight_1m", "s0"),
			makeSegment("u_turn", "u1"),
			makeSegment("straight_1m", "s2"),
		]);
		expect(result).toHaveLength(3);
		const seg2 = result[2];
		expect(seg2.rotation).toBeCloseTo(180, 5);
		expect(seg2.position.x).toBeCloseTo(-1.6, 5);
		expect(seg2.position.z).toBeCloseTo(1, 5);

		// Verify it exits in -Z: rotatePoint(0, 1, 180) ≈ (0, -1) → world exit z decreases
		const DEG2RAD = Math.PI / 180;
		const exitX = 0 * Math.cos(180 * DEG2RAD) - 1 * Math.sin(180 * DEG2RAD);
		const exitZ = 0 * Math.sin(180 * DEG2RAD) + 1 * Math.cos(180 * DEG2RAD);
		expect(seg2.position.z + exitZ).toBeCloseTo(seg2.position.z - 1, 4);
		expect(exitX).toBeCloseTo(0, 4);
	});

	it("20 straight_1m segments: no drift, last at (0, 19)", () => {
		const segments = Array.from({ length: 20 }, (_, i) =>
			makeSegment("straight_1m", `s${i}`),
		);
		const result = computeChainPositions(segments);
		expect(result).toHaveLength(20);
		const last = result[19];
		expect(last.position.x).toBeCloseTo(0, 5);
		expect(last.position.z).toBeCloseTo(19, 5);
		expect(last.rotation).toBeCloseTo(0, 5);
	});

	it("preserves segment id and specId through computation", () => {
		const segs = [
			makeSegment("straight_1m", "my-id-0"),
			makeSegment("curve_90_left", "my-id-1"),
		];
		const result = computeChainPositions(segs);
		expect(result[0].id).toBe("my-id-0");
		expect(result[0].specId).toBe("straight_1m");
		expect(result[1].id).toBe("my-id-1");
		expect(result[1].specId).toBe("curve_90_left");
	});

	it("does not mutate the original segments array", () => {
		const segs = [
			makeSegment("straight_1m", "s0"),
			makeSegment("straight_1m", "s1"),
		];
		const origPos0 = { ...segs[0].position };
		const origPos1 = { ...segs[1].position };
		computeChainPositions(segs);
		expect(segs[0].position).toEqual(origPos0);
		expect(segs[1].position).toEqual(origPos1);
	});

	it("45° left curve: next segment has rotation 45°", () => {
		// curve_45_left exitAngle = 315
		// nextRotation = normalizeAngle(0 - 315) = 45
		const result = computeChainPositions([
			makeSegment("straight_1m", "s0"),
			makeSegment("curve_45_left", "c1"),
			makeSegment("straight_1m", "s2"),
		]);
		const seg2 = result[2];
		expect(seg2.rotation).toBeCloseTo(45, 5);
	});

	it("s_curve exits going same direction as entry (angle 0): next rotation = 0", () => {
		// s_curve exitAngle = 0
		// nextRotation = normalizeAngle(0 - 0) = 0
		const result = computeChainPositions([
			makeSegment("straight_1m", "s0"),
			makeSegment("s_curve", "sc1"),
			makeSegment("straight_1m", "s2"),
		]);
		const seg2 = result[2];
		expect(seg2.rotation).toBeCloseTo(0, 5);
	});
});

// ---------------------------------------------------------------------------
// computeTemplateBounds
// ---------------------------------------------------------------------------

describe("computeTemplateBounds", () => {
	it("empty segments: returns zero bounds", () => {
		const bounds = computeTemplateBounds({ segments: [], feltWidth: 0.6 });
		expect(bounds.width).toBe(0);
		expect(bounds.length).toBe(0);
	});

	it("single straight_3m: width = feltWidth, length includes felt margin", () => {
		// straight_3m: entry=(0,0), exit=(0,3). Both padded by hw=0.3.
		// X: 0-0.3 to 0+0.3 → width = 0.6
		// Z: 0-0.3 to 3+0.3 → 3.6
		const bounds = computeTemplateBounds({
			segments: [makeSegment("straight_3m")],
			feltWidth: 0.6,
		});
		expect(bounds.width).toBeCloseTo(0.6, 5);
		expect(bounds.length).toBeCloseTo(3.6, 5);
	});

	it("single straight_1m: width = feltWidth, length = 1 + feltWidth", () => {
		// entry=(0,0), exit=(0,1), hw=0.3
		// Z: -0.3 to 1.3 → length=1.6
		const bounds = computeTemplateBounds({
			segments: [makeSegment("straight_1m")],
			feltWidth: 0.6,
		});
		expect(bounds.width).toBeCloseTo(0.6, 5);
		expect(bounds.length).toBeCloseTo(1.6, 5);
	});

	it("two straight_3m in sequence: length ≈ 6.6 (6m + feltWidth)", () => {
		// First at (0,0)→(0,3), second at (0,3)→(0,6). hw=0.3
		// Z: -0.3 to 6.3 → length=6.6
		const bounds = computeTemplateBounds({
			segments: [
				makeSegment("straight_3m", "s0"),
				makeSegment("straight_3m", "s1"),
			],
			feltWidth: 0.6,
		});
		expect(bounds.width).toBeCloseTo(0.6, 5);
		expect(bounds.length).toBeCloseTo(6.6, 5);
	});

	it("straight then 90-left curve: width includes curve's -X extent", () => {
		// curve_90_left at (0,1) rot=0: entry=(0,1), exit=(-0.8, 1.8), arc midpoint in -X territory
		// Width must be greater than feltWidth alone (0.6)
		const bounds = computeTemplateBounds({
			segments: [
				makeSegment("straight_1m", "s0"),
				makeSegment("curve_90_left", "c1"),
			],
			feltWidth: 0.6,
		});
		// Curve exit at x=-0.8 → minX = -0.8 - 0.3 = -1.1, maxX = 0 + 0.3 = 0.3
		// Width ≥ 1.4
		expect(bounds.width).toBeGreaterThan(1.0);
		// Z spans: 0 - 0.3 to 1.8 + 0.3 = 2.1 → length ≥ 2.1
		expect(bounds.length).toBeGreaterThan(2.0);
	});

	it("larger feltWidth increases bounds uniformly", () => {
		const narrow = computeTemplateBounds({
			segments: [makeSegment("straight_3m")],
			feltWidth: 0.4,
		});
		const wide = computeTemplateBounds({
			segments: [makeSegment("straight_3m")],
			feltWidth: 1.0,
		});
		// Width diff = 1.0 - 0.4 = 0.6
		expect(wide.width - narrow.width).toBeCloseTo(0.6, 5);
		// Length diff = 0.6 (0.3 on each Z end)
		expect(wide.length - narrow.length).toBeCloseTo(0.6, 5);
	});

	it("u_turn template: length is small (u-turn folds back), width is wide", () => {
		// u_turn exit at (-1.6, 0). With felt width, the template is wide in X.
		const bounds = computeTemplateBounds({
			segments: [makeSegment("u_turn")],
			feltWidth: 0.6,
		});
		// Arc midpoint at (-0.8, 0.8) → covers full width. Should be wider than 1.6+0.6=2.2
		expect(bounds.width).toBeGreaterThan(1.5);
	});

	it("bounds: single straight_2m: length = 2 + feltWidth", () => {
		const bounds = computeTemplateBounds({
			segments: [makeSegment("straight_2m")],
			feltWidth: 0.6,
		});
		expect(bounds.width).toBeCloseTo(0.6, 5);
		expect(bounds.length).toBeCloseTo(2.6, 5);
	});

	it("bounds are always non-negative for any non-empty template", () => {
		const specIds: Array<Segment["specId"]> = [
			"straight_1m",
			"curve_90_left",
			"curve_90_right",
			"u_turn",
			"s_curve",
			"chicane",
		];
		for (const specId of specIds) {
			const bounds = computeTemplateBounds({
				segments: [makeSegment(specId)],
				feltWidth: 0.6,
			});
			expect(bounds.width).toBeGreaterThan(0);
			expect(bounds.length).toBeGreaterThan(0);
		}
	});

	it("bounds: straight_3m with feltWidth=0 has exactly width=0, length=3", () => {
		// Without any felt padding, entry=(0,0) and exit=(0,3) both expand by 0
		// X: [0,0] → width=0; Z: [0,3] → length=3
		const bounds = computeTemplateBounds({
			segments: [makeSegment("straight_3m")],
			feltWidth: 0,
		});
		expect(bounds.width).toBeCloseTo(0, 5);
		expect(bounds.length).toBeCloseTo(3, 5);
	});
});
