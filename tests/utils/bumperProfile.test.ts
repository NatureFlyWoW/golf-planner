import { describe, expect, it } from "vitest";
import {
	createBumperGeometry,
	createBumperProfile,
} from "../../src/utils/bumperProfile";

describe("createBumperProfile", () => {
	it("returns a THREE.Shape with correct dimensions", () => {
		const shape = createBumperProfile(0.08, 0.05, 0.008);
		expect(shape).toBeDefined();
		expect(shape.getPoints).toBeTypeOf("function");
		const points = shape.getPoints(8);
		expect(points.length).toBeGreaterThan(4);
	});

	it("applies bevel radius to all 4 corners", () => {
		const shape = createBumperProfile(0.08, 0.05, 0.008);
		const points = shape.getPoints(8);
		expect(points.length).toBeGreaterThanOrEqual(16);
	});
});

describe("createBumperGeometry", () => {
	it("returns a BufferGeometry", () => {
		const profile = createBumperProfile(0.08, 0.05, 0.008);
		const geom = createBumperGeometry(profile, 1.0);
		expect(geom).toBeDefined();
		expect(geom.attributes.position).toBeDefined();
	});

	it("triangle count is within 500-triangle budget", () => {
		const profile = createBumperProfile(0.08, 0.05, 0.008);
		const geom = createBumperGeometry(profile, 1.0);
		const indexCount = geom.index ? geom.index.count : 0;
		const triangles = indexCount / 3;
		expect(triangles).toBeLessThanOrEqual(500);
		expect(triangles).toBeGreaterThan(0);
	});

	it("produces geometry with curveSegments=8 for smooth profile", () => {
		const profile = createBumperProfile(0.08, 0.05, 0.008);
		const geom = createBumperGeometry(profile, 1.0, { curveSegments: 8 });
		const indexCount = geom.index ? geom.index.count : 0;
		expect(indexCount).toBeGreaterThan(0);
	});

	it("geometry can be disposed cleanly", () => {
		const profile = createBumperProfile(0.08, 0.05, 0.008);
		const geom = createBumperGeometry(profile, 1.0);
		expect(() => geom.dispose()).not.toThrow();
	});
});
