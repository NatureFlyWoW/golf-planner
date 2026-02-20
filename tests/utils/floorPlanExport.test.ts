import { describe, expect, it } from "vitest";
import { generateFloorPlanSVG } from "../../src/utils/floorPlanExport";
import type { Hole } from "../../src/types";

describe("generateFloorPlanSVG", () => {
	const hall = { width: 10, length: 20 };

	it("returns a valid SVG string", () => {
		const svg = generateFloorPlanSVG(hall, {}, []);
		expect(svg).toContain("<svg");
		expect(svg).toContain("</svg>");
	});

	it("includes hall boundary with correct dimensions", () => {
		const svg = generateFloorPlanSVG(hall, {}, []);
		expect(svg).toContain('width="500"');
		expect(svg).toContain('height="1000"');
		expect(svg).toContain("10.0m");
		expect(svg).toContain("20.0m");
	});

	it("renders placed holes with type labels", () => {
		const holes: Record<string, Hole> = {
			h1: {
				id: "h1",
				type: "straight",
				position: { x: 2, z: 5 },
				rotation: 0,
				name: "Hole 1",
				par: 2,
			},
		};
		const svg = generateFloorPlanSVG(hall, holes, ["h1"]);
		expect(svg).toContain("Straight");
		expect(svg).toContain("#1");
	});

	it("renders flow path as dashed polyline", () => {
		const holes: Record<string, Hole> = {
			h1: {
				id: "h1",
				type: "straight",
				position: { x: 2, z: 5 },
				rotation: 0,
				name: "Hole 1",
				par: 2,
			},
			h2: {
				id: "h2",
				type: "ramp",
				position: { x: 5, z: 10 },
				rotation: 0,
				name: "Hole 2",
				par: 3,
			},
		};
		const svg = generateFloorPlanSVG(hall, holes, ["h1", "h2"]);
		expect(svg).toContain("stroke-dasharray");
		expect(svg).toContain("<polyline");
	});

	it("includes scale bar", () => {
		const svg = generateFloorPlanSVG(hall, {}, []);
		expect(svg).toContain("1m");
	});

	it("applies rotation to holes", () => {
		const holes: Record<string, Hole> = {
			h1: {
				id: "h1",
				type: "straight",
				position: { x: 3, z: 4 },
				rotation: 90,
				name: "Hole 1",
				par: 2,
			},
		};
		const svg = generateFloorPlanSVG(hall, holes, ["h1"]);
		expect(svg).toContain("rotate(90");
	});
});
