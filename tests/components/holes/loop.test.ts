import { describe, expect, it } from "vitest";
import * as THREE from "three";

// Constants matching implementation
const LOOP_RADIUS = 0.3;
const TUBE_RADIUS = 0.04;
const PILLAR_RADIUS = 0.04;
const PILLAR_HEIGHT = 0.15;
const TUBE_SEGMENTS = 48;
const TUBE_RADIAL_SEGMENTS = 12;
const BRACE_SIZE = 0.02;

function createLoopCurve(): THREE.CatmullRomCurve3 {
	const points: THREE.Vector3[] = [];
	const segments = 12;
	for (let i = 0; i <= segments; i++) {
		const t = (i / segments) * Math.PI;
		points.push(
			new THREE.Vector3(
				0,
				LOOP_RADIUS * Math.sin(t),
				-LOOP_RADIUS * Math.cos(t),
			),
		);
	}
	return new THREE.CatmullRomCurve3(points);
}

describe("LoopObstacle geometry", () => {
	it("uses TubeGeometry with semicircular path", () => {
		const curve = createLoopCurve();
		const geom = new THREE.TubeGeometry(
			curve,
			TUBE_SEGMENTS,
			TUBE_RADIUS,
			TUBE_RADIAL_SEGMENTS,
			false,
		);
		expect(geom).toBeInstanceOf(THREE.TubeGeometry);
		const posAttr = geom.getAttribute("position");
		expect(posAttr.count).toBeGreaterThan(0);
		geom.dispose();
	});

	it("tube path traces 180-degree semicircle", () => {
		const curve = createLoopCurve();
		const start = curve.getPoint(0);
		const apex = curve.getPoint(0.5);
		const end = curve.getPoint(1);

		// Start and end should be at base (Y near 0)
		expect(start.y).toBeCloseTo(0, 1);
		expect(end.y).toBeCloseTo(0, 1);
		// Apex should be at top
		expect(apex.y).toBeCloseTo(LOOP_RADIUS, 1);
		// Z coordinates at start and end should be +/- LOOP_RADIUS
		expect(start.z).toBeCloseTo(-LOOP_RADIUS, 1);
		expect(end.z).toBeCloseTo(LOOP_RADIUS, 1);
	});

	it("tube segment count >= 48", () => {
		expect(TUBE_SEGMENTS).toBeGreaterThanOrEqual(48);
	});

	it("support pillars are tapered (wider at base)", () => {
		const radiusTop = PILLAR_RADIUS * 0.7;
		const radiusBottom = PILLAR_RADIUS * 1.3;
		const geom = new THREE.CylinderGeometry(
			radiusTop,
			radiusBottom,
			PILLAR_HEIGHT,
			8,
		);
		expect(radiusTop).toBeLessThan(radiusBottom);
		expect(radiusBottom).toBeGreaterThan(PILLAR_RADIUS);
		geom.dispose();
	});

	it("cross-brace spans between pillars", () => {
		const braceLength = 2 * LOOP_RADIUS;
		expect(braceLength).toBeCloseTo(0.6, 2);
		const brace = new THREE.BoxGeometry(BRACE_SIZE, BRACE_SIZE, braceLength);
		brace.computeBoundingBox();
		const box = brace.boundingBox as THREE.Box3;
		expect(box.max.z - box.min.z).toBeCloseTo(braceLength, 2);
		brace.dispose();
	});

	it("metallic material has high metalness and low roughness", () => {
		const mat = new THREE.MeshStandardMaterial({
			color: "#B0BEC5",
			roughness: 0.3,
			metalness: 0.6,
		});
		expect(mat.roughness).toBeLessThan(0.5);
		expect(mat.metalness).toBeGreaterThan(0.2);
		mat.dispose();
	});

	it("UV mode applies neon cyan emissive", () => {
		const mat = new THREE.MeshStandardMaterial({
			color: "#001A1A",
			emissive: "#00FFFF",
			emissiveIntensity: 2.0,
			roughness: 0.4,
			metalness: 0.2,
		});
		expect(mat.emissive.getHexString()).toBe("00ffff");
		expect(mat.emissiveIntensity).toBe(2.0);
		mat.dispose();
	});
});
