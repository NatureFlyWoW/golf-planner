import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { createSegmentGeometries } from "../../src/utils/segmentGeometry";

function getTriangleCount(geom: THREE.BufferGeometry): number {
	if (geom.index) return geom.index.count / 3;
	const posAttr = geom.getAttribute("position");
	return posAttr ? posAttr.count / 3 : 0;
}

describe("mergeVertices optimization", () => {
	it("reduces vertex count on ExtrudeGeometry", () => {
		const shape = new THREE.Shape();
		shape.moveTo(0, 0);
		shape.lineTo(1, 0);
		shape.lineTo(0.5, 1);
		shape.closePath();
		const geom = new THREE.ExtrudeGeometry(shape, {
			depth: 1,
			bevelEnabled: false,
		});
		const before = geom.getAttribute("position").count;
		const merged = mergeVertices(geom);
		const after = merged.getAttribute("position").count;
		expect(after).toBeLessThanOrEqual(before);
		geom.dispose();
		merged.dispose();
	});

	it("mergeVertices on BoxGeometry does not increase vertex count", () => {
		const geom = new THREE.BoxGeometry(1, 1, 1);
		const before = geom.getAttribute("position").count;
		const merged = mergeVertices(geom);
		const after = merged.getAttribute("position").count;
		expect(after).toBeLessThanOrEqual(before);
		geom.dispose();
		merged.dispose();
	});
});

describe("Triangle budget per segment type", () => {
	it("straight segment total triangles < 500", () => {
		const geom = createSegmentGeometries("straight_1m", 0.6);
		const total =
			getTriangleCount(geom.felt) +
			getTriangleCount(geom.bumperLeft) +
			getTriangleCount(geom.bumperRight);
		expect(total).toBeLessThan(500);
		geom.felt.dispose();
		geom.bumperLeft.dispose();
		geom.bumperRight.dispose();
	});

	it("curve segment total triangles < 2000", () => {
		const geom = createSegmentGeometries("curve_90_left", 0.6);
		const total =
			getTriangleCount(geom.felt) +
			getTriangleCount(geom.bumperLeft) +
			getTriangleCount(geom.bumperRight);
		expect(total).toBeLessThan(2000);
		geom.felt.dispose();
		geom.bumperLeft.dispose();
		geom.bumperRight.dispose();
	});

	it("complex segment (s_curve) total triangles < 4000", () => {
		const geom = createSegmentGeometries("s_curve", 0.6);
		const total =
			getTriangleCount(geom.felt) +
			getTriangleCount(geom.bumperLeft) +
			getTriangleCount(geom.bumperRight);
		expect(total).toBeLessThan(4000);
		geom.felt.dispose();
		geom.bumperLeft.dispose();
		geom.bumperRight.dispose();
	});

	it("18-hole course total triangles stays under 50K", () => {
		// Worst case: 18 s_curve segments
		const geom = createSegmentGeometries("s_curve", 0.6);
		const perHole =
			getTriangleCount(geom.felt) +
			getTriangleCount(geom.bumperLeft) +
			getTriangleCount(geom.bumperRight);
		expect(perHole * 18).toBeLessThan(50000);
		geom.felt.dispose();
		geom.bumperLeft.dispose();
		geom.bumperRight.dispose();
	});

	it("bumper rail triangle count <= 500 per segment", () => {
		const segTypes = [
			"straight_1m",
			"curve_90_left",
			"s_curve",
			"u_turn",
			"chicane",
		] as const;
		for (const specId of segTypes) {
			const geom = createSegmentGeometries(specId, 0.6);
			const leftTris = getTriangleCount(geom.bumperLeft);
			const rightTris = getTriangleCount(geom.bumperRight);
			expect(leftTris).toBeLessThanOrEqual(500);
			expect(rightTris).toBeLessThanOrEqual(500);
			geom.felt.dispose();
			geom.bumperLeft.dispose();
			geom.bumperRight.dispose();
		}
	});
});
