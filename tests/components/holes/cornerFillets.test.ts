import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createCornerFilletGeometry } from "../../../src/utils/filletGeometry";

const SURFACE_THICKNESS = 0.02;
const BUMPER_HEIGHT = 0.08;

describe("Corner fillet geometry", () => {
	it("createCornerFilletGeometry returns a BufferGeometry", () => {
		const geom = createCornerFilletGeometry(0.15, SURFACE_THICKNESS);
		expect(geom).toBeInstanceOf(THREE.BufferGeometry);
		const posAttr = geom.getAttribute("position");
		expect(posAttr.count).toBeGreaterThan(0);
		geom.dispose();
	});

	it("fillet geometry has correct radius bounds", () => {
		const radius = 0.15;
		const geom = createCornerFilletGeometry(radius, SURFACE_THICKNESS);
		geom.computeBoundingBox();
		const box = geom.boundingBox as THREE.Box3;
		// All vertices should fit within the radius in XZ plane
		const maxExtent = Math.max(
			Math.abs(box.max.x),
			Math.abs(box.min.x),
			Math.abs(box.max.z),
			Math.abs(box.min.z),
		);
		expect(maxExtent).toBeLessThanOrEqual(radius + 0.01);
		geom.dispose();
	});

	it("fillet geometry has correct height", () => {
		const height = SURFACE_THICKNESS;
		const geom = createCornerFilletGeometry(0.15, height);
		geom.computeBoundingBox();
		const box = geom.boundingBox as THREE.Box3;
		const geomHeight = box.max.y - box.min.y;
		expect(geomHeight).toBeCloseTo(height, 2);
		geom.dispose();
	});

	it("fillet geometry is a quarter-circle wedge", () => {
		const geom = createCornerFilletGeometry(0.15, SURFACE_THICKNESS);
		geom.computeBoundingBox();
		const box = geom.boundingBox as THREE.Box3;
		// Quarter-cylinder: should only extend in positive X and positive Z
		// (or at most from 0 to radius in both)
		expect(box.min.x).toBeGreaterThanOrEqual(-0.01);
		expect(box.min.z).toBeGreaterThanOrEqual(-0.01);
		geom.dispose();
	});

	it("fillet within hole bounding box", () => {
		// Fillets should be small enough to not extend beyond typical hole dimensions
		const radius = 0.15;
		const geom = createCornerFilletGeometry(radius, SURFACE_THICKNESS);
		geom.computeBoundingBox();
		const box = geom.boundingBox as THREE.Box3;
		expect(box.max.x).toBeLessThanOrEqual(radius + 0.01);
		expect(box.max.z).toBeLessThanOrEqual(radius + 0.01);
		geom.dispose();
	});

	it("geometry can be disposed without errors", () => {
		const geom = createCornerFilletGeometry(0.15, SURFACE_THICKNESS);
		expect(() => geom.dispose()).not.toThrow();
	});
});
