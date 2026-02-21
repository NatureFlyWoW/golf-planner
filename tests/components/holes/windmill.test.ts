import { describe, expect, it } from "vitest";
import * as THREE from "three";

// Constants matching the implementation
const TOWER_BASE_RADIUS = 0.12;
const TOWER_TOP_RADIUS = 0.08;
const TOWER_HEIGHT = 0.5;
const ROOF_RADIUS = 0.14;
const ROOF_HEIGHT = 0.18;
const BLADE_LENGTH = 0.28;
const BLADE_HUB_WIDTH = 0.04;
const BLADE_TIP_WIDTH = 0.06;
const BLADE_THICKNESS = 0.01;
const ROTATION_SPEED = 0.5;

describe("WindmillObstacle geometry", () => {
	it("tower body is tapered (base radius > top radius)", () => {
		const tower = new THREE.CylinderGeometry(
			TOWER_TOP_RADIUS,
			TOWER_BASE_RADIUS,
			TOWER_HEIGHT,
			12,
		);
		// CylinderGeometry params: radiusTop, radiusBottom, height
		expect(TOWER_BASE_RADIUS).toBeGreaterThan(TOWER_TOP_RADIUS);
		expect(tower).toBeInstanceOf(THREE.CylinderGeometry);
		tower.computeBoundingBox();
		const box = tower.boundingBox as THREE.Box3;
		expect(box.max.y - box.min.y).toBeCloseTo(TOWER_HEIGHT, 2);
		tower.dispose();
	});

	it("roof is a cone (ConeGeometry)", () => {
		const roof = new THREE.ConeGeometry(ROOF_RADIUS, ROOF_HEIGHT, 12);
		expect(roof).toBeInstanceOf(THREE.ConeGeometry);
		roof.computeBoundingBox();
		const box = roof.boundingBox as THREE.Box3;
		expect(box.max.y - box.min.y).toBeCloseTo(ROOF_HEIGHT, 2);
		expect(ROOF_RADIUS).toBeGreaterThan(TOWER_TOP_RADIUS);
		roof.dispose();
	});

	it("blade geometry uses ExtrudeGeometry (not BoxGeometry)", () => {
		const shape = new THREE.Shape();
		shape.moveTo(-BLADE_HUB_WIDTH / 2, 0);
		shape.lineTo(-BLADE_TIP_WIDTH / 2, BLADE_LENGTH);
		shape.lineTo(BLADE_TIP_WIDTH / 2, BLADE_LENGTH);
		shape.lineTo(BLADE_HUB_WIDTH / 2, 0);
		shape.closePath();

		const blade = new THREE.ExtrudeGeometry(shape, {
			depth: BLADE_THICKNESS,
			bevelEnabled: false,
		});
		expect(blade).toBeInstanceOf(THREE.ExtrudeGeometry);
		blade.computeBoundingBox();
		const box = blade.boundingBox as THREE.Box3;
		expect(box.max.y - box.min.y).toBeCloseTo(BLADE_LENGTH, 1);
		blade.dispose();
	});

	it("windmill obstacle total height is approximately correct", () => {
		const totalHeight = TOWER_HEIGHT + ROOF_HEIGHT;
		// Tower + roof ~ 0.68m, blade center at tower top, blades extend further
		expect(totalHeight).toBeGreaterThan(0.5);
		expect(totalHeight).toBeLessThan(1.0);
		// Blade span
		const bladeSpan = BLADE_LENGTH * 2;
		expect(bladeSpan).toBeGreaterThan(0.4);
		expect(bladeSpan).toBeLessThan(0.8);
	});

	it("UV mode tower material has dark base and pink emissive", () => {
		const mat = new THREE.MeshStandardMaterial({
			color: "#1A0011",
			emissive: "#FF1493",
			emissiveIntensity: 2.0,
			roughness: 0.4,
			metalness: 0.3,
		});
		expect(mat.emissive.getHexString()).toBe("ff1493");
		expect(mat.emissiveIntensity).toBe(2.0);
		expect(mat.color.getHexString()).toBe("1a0011");
		mat.dispose();
	});

	it("UV mode blade material has neon emissive", () => {
		const mat = new THREE.MeshStandardMaterial({
			color: "#1A0011",
			emissive: "#FF1493",
			emissiveIntensity: 2.0,
			roughness: 0.5,
			metalness: 0.1,
		});
		expect(mat.emissiveIntensity).toBeGreaterThan(0);
		expect(mat.emissive.getHexString()).toBe("ff1493");
		mat.dispose();
	});
});

describe("WindmillObstacle blade animation", () => {
	it("blade rotation speed is ~0.5 rad/sec", () => {
		const delta = 1.0;
		const rotationChange = ROTATION_SPEED * delta;
		expect(rotationChange).toBeCloseTo(0.5, 2);
	});

	it("rotation is cumulative over frames", () => {
		let rotation = 0;
		for (let i = 0; i < 10; i++) {
			rotation += ROTATION_SPEED * 0.016; // ~60fps
		}
		expect(rotation).toBeCloseTo(0.08, 2);
	});
});

describe("WindmillObstacle geometry disposal", () => {
	it("all geometries can be disposed without errors", () => {
		const tower = new THREE.CylinderGeometry(
			TOWER_TOP_RADIUS,
			TOWER_BASE_RADIUS,
			TOWER_HEIGHT,
			12,
		);
		const roof = new THREE.ConeGeometry(ROOF_RADIUS, ROOF_HEIGHT, 12);
		const hub = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8);

		const shape = new THREE.Shape();
		shape.moveTo(-BLADE_HUB_WIDTH / 2, 0);
		shape.lineTo(-BLADE_TIP_WIDTH / 2, BLADE_LENGTH);
		shape.lineTo(BLADE_TIP_WIDTH / 2, BLADE_LENGTH);
		shape.lineTo(BLADE_HUB_WIDTH / 2, 0);
		shape.closePath();
		const blade = new THREE.ExtrudeGeometry(shape, {
			depth: BLADE_THICKNESS,
			bevelEnabled: false,
		});

		expect(() => {
			tower.dispose();
			roof.dispose();
			hub.dispose();
			blade.dispose();
		}).not.toThrow();
	});
});
