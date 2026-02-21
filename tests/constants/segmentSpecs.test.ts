import { describe, expect, it } from "vitest";
import {
	SEGMENT_SPEC_LIST,
	SEGMENT_SPECS,
} from "../../src/constants/segmentSpecs";
import type { SegmentSpecId } from "../../src/types/template";

const ALL_IDS: SegmentSpecId[] = [
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
];

describe("SEGMENT_SPECS", () => {
	it("defines all 11 segment specs", () => {
		expect(Object.keys(SEGMENT_SPECS)).toHaveLength(11);
		for (const id of ALL_IDS) {
			expect(SEGMENT_SPECS[id]).toBeDefined();
		}
	});

	it("SEGMENT_SPEC_LIST contains all 11 specs", () => {
		expect(SEGMENT_SPEC_LIST).toHaveLength(11);
	});

	it("every spec has an id matching its key", () => {
		for (const [key, spec] of Object.entries(SEGMENT_SPECS)) {
			expect(spec.id).toBe(key);
		}
	});

	it("every spec has a positive length", () => {
		for (const spec of SEGMENT_SPEC_LIST) {
			expect(spec.length).toBeGreaterThan(0);
		}
	});

	it("every spec has entry at origin (0, 0) with angle 180", () => {
		for (const spec of SEGMENT_SPEC_LIST) {
			expect(spec.entryPoint.x).toBe(0);
			expect(spec.entryPoint.z).toBe(0);
			expect(spec.entryPoint.angle).toBe(180);
		}
	});

	describe("straight specs", () => {
		const straightIds: SegmentSpecId[] = [
			"straight_1m",
			"straight_2m",
			"straight_3m",
		];

		it("exit along +Z with angle 0", () => {
			for (const id of straightIds) {
				const spec = SEGMENT_SPECS[id];
				expect(spec.exitPoint.x).toBe(0);
				expect(spec.exitPoint.z).toBeGreaterThan(0);
				expect(spec.exitPoint.angle).toBe(0);
			}
		});

		it("exit Z matches declared length", () => {
			expect(SEGMENT_SPECS.straight_1m.exitPoint.z).toBe(1);
			expect(SEGMENT_SPECS.straight_2m.exitPoint.z).toBe(2);
			expect(SEGMENT_SPECS.straight_3m.exitPoint.z).toBe(3);
		});

		it("have category 'straight'", () => {
			for (const id of straightIds) {
				expect(SEGMENT_SPECS[id].category).toBe("straight");
			}
		});

		it("do not have arc properties", () => {
			for (const id of straightIds) {
				const spec = SEGMENT_SPECS[id];
				expect(spec.arcRadius).toBeUndefined();
				expect(spec.arcSweep).toBeUndefined();
				expect(spec.arcCenter).toBeUndefined();
			}
		});
	});

	describe("curve specs", () => {
		const curveIds: SegmentSpecId[] = [
			"curve_90_left",
			"curve_90_right",
			"curve_45_left",
			"curve_45_right",
			"curve_30_wide",
		];

		it("have category 'curve'", () => {
			for (const id of curveIds) {
				expect(SEGMENT_SPECS[id].category).toBe("curve");
			}
		});

		it("have arc properties (radius > 0, sweep > 0, center defined)", () => {
			for (const id of curveIds) {
				const spec = SEGMENT_SPECS[id];
				expect(spec.arcRadius).toBeDefined();
				expect(spec.arcRadius).toBeGreaterThan(0);
				expect(spec.arcSweep).toBeDefined();
				expect(spec.arcSweep).toBeGreaterThan(0);
				expect(spec.arcCenter).toBeDefined();
			}
		});

		it("90° pair: exit points are mirrored on X axis", () => {
			const left = SEGMENT_SPECS.curve_90_left;
			const right = SEGMENT_SPECS.curve_90_right;
			expect(left.exitPoint.x).toBeCloseTo(-right.exitPoint.x, 4);
			expect(left.exitPoint.z).toBeCloseTo(right.exitPoint.z, 4);
		});

		it("90° pair: exit angles are symmetric (270 and 90)", () => {
			expect(SEGMENT_SPECS.curve_90_left.exitPoint.angle).toBe(270);
			expect(SEGMENT_SPECS.curve_90_right.exitPoint.angle).toBe(90);
		});

		it("90° pair: arc centers are mirrored on X axis", () => {
			const left = SEGMENT_SPECS.curve_90_left;
			const right = SEGMENT_SPECS.curve_90_right;
			expect(left.arcCenter?.x).toBeCloseTo(-(right.arcCenter?.x ?? 0), 4);
			expect(left.arcCenter?.z).toBeCloseTo(right.arcCenter?.z ?? 0, 4);
		});

		it("45° pair: exit points are mirrored on X axis", () => {
			const left = SEGMENT_SPECS.curve_45_left;
			const right = SEGMENT_SPECS.curve_45_right;
			expect(left.exitPoint.x).toBeCloseTo(-right.exitPoint.x, 4);
			expect(left.exitPoint.z).toBeCloseTo(right.exitPoint.z, 4);
		});

		it("45° pair: exit angles are symmetric (315 and 45)", () => {
			expect(SEGMENT_SPECS.curve_45_left.exitPoint.angle).toBe(315);
			expect(SEGMENT_SPECS.curve_45_right.exitPoint.angle).toBe(45);
		});

		it("45° pair: arc centers are mirrored on X axis", () => {
			const left = SEGMENT_SPECS.curve_45_left;
			const right = SEGMENT_SPECS.curve_45_right;
			expect(left.arcCenter?.x).toBeCloseTo(-(right.arcCenter?.x ?? 0), 4);
			expect(left.arcCenter?.z).toBeCloseTo(right.arcCenter?.z ?? 0, 4);
		});

		it("30° wide curve has sweep of 30 and radius 2.0", () => {
			const spec = SEGMENT_SPECS.curve_30_wide;
			expect(spec.arcSweep).toBe(30);
			expect(spec.arcRadius).toBe(2.0);
		});
	});

	describe("complex specs", () => {
		const complexIds: SegmentSpecId[] = ["s_curve", "u_turn", "chicane"];

		it("have category 'complex'", () => {
			for (const id of complexIds) {
				expect(SEGMENT_SPECS[id].category).toBe("complex");
			}
		});

		it("s_curve exits going +Z (angle 0) with X offset", () => {
			const spec = SEGMENT_SPECS.s_curve;
			expect(spec.exitPoint.angle).toBe(0);
			expect(spec.exitPoint.x).not.toBe(0);
			expect(spec.exitPoint.z).toBeGreaterThan(0);
		});

		it("u_turn exits going -Z (angle 180) at (-1.6, 0)", () => {
			const spec = SEGMENT_SPECS.u_turn;
			expect(spec.exitPoint.angle).toBe(180);
			expect(spec.exitPoint.x).toBeCloseTo(-1.6, 4);
			expect(spec.exitPoint.z).toBeCloseTo(0, 4);
		});

		it("u_turn has 180° arc sweep", () => {
			expect(SEGMENT_SPECS.u_turn.arcSweep).toBe(180);
		});

		it("chicane exits going +Z (angle 0) with X and Z offset", () => {
			const spec = SEGMENT_SPECS.chicane;
			expect(spec.exitPoint.angle).toBe(0);
			expect(spec.exitPoint.x).toBeCloseTo(-0.6, 4);
			expect(spec.exitPoint.z).toBeCloseTo(2, 4);
		});
	});
});
