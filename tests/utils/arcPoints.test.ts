import { describe, expect, it } from "vitest";
import { computeDoorArc, computeWindowLines } from "../../src/utils/arcPoints";

describe("computeDoorArc", () => {
	const hallWidth = 10.0;
	const hallLength = 20.0;
	const sectionalDoor = {
		id: "door-sectional",
		type: "sectional" as const,
		width: 3.5,
		height: 3.5,
		wall: "south" as const,
		offset: 3.25,
	};

	const pvcDoor = {
		id: "door-pvc",
		type: "pvc" as const,
		width: 0.9,
		height: 2.0,
		wall: "south" as const,
		offset: 8.1,
	};

	it("returns approximately 25 points for a quarter-circle (24 segments + 1)", () => {
		const { arcPoints } = computeDoorArc(
			sectionalDoor,
			hallWidth,
			hallLength,
		);
		expect(arcPoints).toHaveLength(25);
	});

	it("first point is at door edge position (along wall)", () => {
		const { arcPoints } = computeDoorArc(
			sectionalDoor,
			hallWidth,
			hallLength,
		);
		// Sectional door: hinge at X=3.25, arc starts at door edge X=6.75, Z=20
		expect(arcPoints[0][0]).toBeCloseTo(6.75); // X = offset + width
		expect(arcPoints[0][1]).toBeCloseTo(0.02); // Y
		expect(arcPoints[0][2]).toBeCloseTo(20.0); // Z = hallLength (south wall)
	});

	it("last point is at perpendicular swing endpoint", () => {
		const { arcPoints } = computeDoorArc(
			sectionalDoor,
			hallWidth,
			hallLength,
		);
		const last = arcPoints[arcPoints.length - 1];
		// Sectional door swings outward (+Z): end at X=3.25, Z=20+3.5=23.5
		expect(last[0]).toBeCloseTo(3.25);
		expect(last[1]).toBeCloseTo(0.02);
		expect(last[2]).toBeCloseTo(23.5);
	});

	it("all points are at radius distance from hinge", () => {
		const { arcPoints } = computeDoorArc(
			sectionalDoor,
			hallWidth,
			hallLength,
		);
		const hingeX = 3.25;
		const hingeZ = 20.0;
		const radius = 3.5;
		for (const pt of arcPoints) {
			const dx = pt[0] - hingeX;
			const dz = pt[2] - hingeZ;
			const dist = Math.sqrt(dx * dx + dz * dz);
			expect(dist).toBeCloseTo(radius, 4);
		}
	});

	it("panel line goes from hinge to door edge", () => {
		const { panelLine } = computeDoorArc(
			sectionalDoor,
			hallWidth,
			hallLength,
		);
		expect(panelLine[0][0]).toBeCloseTo(3.25); // hinge X
		expect(panelLine[0][2]).toBeCloseTo(20.0); // hinge Z
		expect(panelLine[1][0]).toBeCloseTo(6.75); // edge X
		expect(panelLine[1][2]).toBeCloseTo(20.0); // edge Z
	});

	it("for inward-opening door (PVC), arc swings into the hall", () => {
		const { arcPoints } = computeDoorArc(
			pvcDoor,
			hallWidth,
			hallLength,
		);
		// PVC on south wall: inward means Z < hallLength
		for (const pt of arcPoints) {
			expect(pt[2]).toBeLessThanOrEqual(hallLength + 0.001);
		}
	});

	it("for outward-opening door (sectional), arc swings away from hall", () => {
		const { arcPoints } = computeDoorArc(
			sectionalDoor,
			hallWidth,
			hallLength,
		);
		// Sectional on south wall: outward means Z >= hallLength
		for (const pt of arcPoints) {
			expect(pt[2]).toBeGreaterThanOrEqual(hallLength - 0.001);
		}
	});
});

describe("computeWindowLines", () => {
	const hallWidth = 10.0;
	const hallLength = 20.0;
	const wallThickness = 0.2;

	const eastWindow = {
		id: "window-1",
		width: 3.0,
		height: 1.1,
		wall: "east" as const,
		offset: 2.0,
		sillHeight: 1.5,
	};

	const westWindow = {
		id: "window-3",
		width: 3.0,
		height: 1.1,
		wall: "west" as const,
		offset: 2.0,
		sillHeight: 1.5,
	};

	it("returns 2 glass lines and 2 break ticks for an east wall window", () => {
		const { glassLines, breakTicks } = computeWindowLines(
			eastWindow,
			hallWidth,
			hallLength,
			wallThickness,
		);
		expect(glassLines).toHaveLength(2);
		expect(breakTicks).toHaveLength(2);
	});

	it("returns 2 glass lines and 2 break ticks for a west wall window", () => {
		const { glassLines, breakTicks } = computeWindowLines(
			westWindow,
			hallWidth,
			hallLength,
			wallThickness,
		);
		expect(glassLines).toHaveLength(2);
		expect(breakTicks).toHaveLength(2);
	});

	it("glass lines are parallel and inset from wall edges (east wall)", () => {
		const { glassLines } = computeWindowLines(
			eastWindow,
			hallWidth,
			hallLength,
			wallThickness,
		);
		// East wall: outer face X=10, inner face X=9.8
		// Glass line 1 at X = 10 - 0.2*0.7 = 9.86
		// Glass line 2 at X = 10 - 0.2*0.3 = 9.94
		const x1 = glassLines[0][0][0];
		const x2 = glassLines[1][0][0];
		expect(x1).toBeCloseTo(9.86);
		expect(x2).toBeCloseTo(9.94);
		// Both lines run from Z=2 to Z=5
		expect(glassLines[0][0][2]).toBeCloseTo(2.0);
		expect(glassLines[0][1][2]).toBeCloseTo(5.0);
		expect(glassLines[1][0][2]).toBeCloseTo(2.0);
		expect(glassLines[1][1][2]).toBeCloseTo(5.0);
	});

	it("break ticks are perpendicular to the wall at each end (east wall)", () => {
		const { breakTicks } = computeWindowLines(
			eastWindow,
			hallWidth,
			hallLength,
			wallThickness,
		);
		// Tick at Z=2.0: from inner face (9.8) to outer face (10.0)
		expect(breakTicks[0][0][2]).toBeCloseTo(2.0);
		expect(breakTicks[0][1][2]).toBeCloseTo(2.0);
		expect(Math.min(breakTicks[0][0][0], breakTicks[0][1][0])).toBeCloseTo(
			9.8,
		);
		expect(Math.max(breakTicks[0][0][0], breakTicks[0][1][0])).toBeCloseTo(
			10.0,
		);
		// Tick at Z=5.0
		expect(breakTicks[1][0][2]).toBeCloseTo(5.0);
		expect(breakTicks[1][1][2]).toBeCloseTo(5.0);
	});

	it("west wall window has glass lines inset from X=0 boundary", () => {
		const { glassLines } = computeWindowLines(
			westWindow,
			hallWidth,
			hallLength,
			wallThickness,
		);
		// West wall: outer face X=0, inner face X=0.2
		// Glass line 1 at X = 0 + 0.2*0.7 = 0.14
		// Glass line 2 at X = 0 + 0.2*0.3 = 0.06
		const x1 = glassLines[0][0][0];
		const x2 = glassLines[1][0][0];
		expect(x1).toBeCloseTo(0.14);
		expect(x2).toBeCloseTo(0.06);
	});
});
