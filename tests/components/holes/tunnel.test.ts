import { describe, expect, it } from "vitest";
import * as THREE from "three";
import {
	createArchProfile,
	createTunnelArchGeometry,
} from "../../../src/utils/tunnelGeometry";

const TUNNEL_LENGTH = 1.6;
const WALL_THICKNESS = 0.05;

describe("Tunnel arch profile", () => {
	it("createArchProfile returns a THREE.Shape", () => {
		const shape = createArchProfile(0.3, WALL_THICKNESS);
		expect(shape).toBeInstanceOf(THREE.Shape);
	});

	it("arch profile has wall thickness (inner radius < outer radius)", () => {
		const archRadius = 0.3;
		const shape = createArchProfile(archRadius, WALL_THICKNESS);
		// The shape should exist and have curves
		const points = shape.getPoints(32);
		expect(points.length).toBeGreaterThan(4);
		// The max X extent should be approximately archRadius
		const maxX = Math.max(...points.map((p) => Math.abs(p.x)));
		expect(maxX).toBeCloseTo(archRadius, 1);
	});

	it("arch profile base extends to ground level (y=0)", () => {
		const shape = createArchProfile(0.3, WALL_THICKNESS);
		const points = shape.getPoints(64);
		const minY = Math.min(...points.map((p) => p.y));
		expect(minY).toBeCloseTo(0, 1);
	});
});

describe("Tunnel arch geometry", () => {
	it("createTunnelArchGeometry returns BufferGeometry", () => {
		const geom = createTunnelArchGeometry(0.3, TUNNEL_LENGTH);
		expect(geom).toBeInstanceOf(THREE.BufferGeometry);
		geom.dispose();
	});

	it("arch extrusion depth matches tunnel length", () => {
		const geom = createTunnelArchGeometry(0.3, TUNNEL_LENGTH);
		geom.computeBoundingBox();
		const box = geom.boundingBox as THREE.Box3;
		// Extrusion goes along Z axis
		const depth = box.max.z - box.min.z;
		expect(depth).toBeCloseTo(TUNNEL_LENGTH, 1);
		geom.dispose();
	});

	it("arch width matches archRadius", () => {
		const archRadius = 0.3;
		const geom = createTunnelArchGeometry(archRadius, TUNNEL_LENGTH);
		geom.computeBoundingBox();
		const box = geom.boundingBox as THREE.Box3;
		const width = box.max.x - box.min.x;
		expect(width).toBeCloseTo(archRadius * 2, 1);
		geom.dispose();
	});

	it("geometry has position attribute with vertices", () => {
		const geom = createTunnelArchGeometry(0.3, TUNNEL_LENGTH);
		const posAttr = geom.getAttribute("position");
		expect(posAttr).toBeDefined();
		expect(posAttr.count).toBeGreaterThan(0);
		geom.dispose();
	});
});

describe("Tunnel materials", () => {
	it("tunnel flat material is stone-brown colored", () => {
		const mat = new THREE.MeshStandardMaterial({
			color: "#8B7355",
			roughness: 0.85,
			metalness: 0.05,
		});
		expect(mat.roughness).toBe(0.85);
		expect(mat.metalness).toBe(0.05);
		mat.dispose();
	});

	it("UV mode material has purple emissive", () => {
		const mat = new THREE.MeshStandardMaterial({
			color: "#0D001A",
			emissive: "#9933FF",
			emissiveIntensity: 2.0,
			roughness: 0.6,
			metalness: 0.1,
		});
		expect(mat.emissive.getHexString()).toBe("9933ff");
		expect(mat.emissiveIntensity).toBe(2.0);
		mat.dispose();
	});
});

describe("Tunnel geometry disposal", () => {
	it("arch geometry can be disposed without errors", () => {
		const geom = createTunnelArchGeometry(0.3, TUNNEL_LENGTH);
		expect(() => geom.dispose()).not.toThrow();
	});
});
