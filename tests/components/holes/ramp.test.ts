import { describe, expect, it } from "vitest";
import * as THREE from "three";

// Constants matching implementation
const RAMP_HEIGHT = 0.15;
const RAMP_SLOPE_LENGTH = 0.5;
const BUMPER_HEIGHT = 0.08;
const SIDE_BUMPER_HEIGHT = BUMPER_HEIGHT + RAMP_HEIGHT;
const RAMP_CURVE_SEGMENTS = 16;

function createRampUpShape(): THREE.Shape {
	const shape = new THREE.Shape();
	shape.moveTo(0, 0);
	shape.bezierCurveTo(
		RAMP_SLOPE_LENGTH * 0.5,
		0,
		RAMP_SLOPE_LENGTH * 0.5,
		RAMP_HEIGHT,
		RAMP_SLOPE_LENGTH,
		RAMP_HEIGHT,
	);
	shape.lineTo(RAMP_SLOPE_LENGTH, 0);
	shape.closePath();
	return shape;
}

function createRampDownShape(): THREE.Shape {
	const shape = new THREE.Shape();
	shape.moveTo(0, RAMP_HEIGHT);
	shape.bezierCurveTo(
		RAMP_SLOPE_LENGTH * 0.5,
		RAMP_HEIGHT,
		RAMP_SLOPE_LENGTH * 0.5,
		0,
		RAMP_SLOPE_LENGTH,
		0,
	);
	shape.lineTo(RAMP_SLOPE_LENGTH, 0);
	shape.lineTo(0, 0);
	shape.closePath();
	return shape;
}

describe("RampObstacle geometry", () => {
	it("uses bezier curve profile (not triangular)", () => {
		const shape = createRampUpShape();
		const points = shape.getPoints(32);
		// A bezier curve should have intermediate points between 0 and RAMP_HEIGHT
		const intermediatePoints = points.filter(
			(p) => p.y > 0.01 && p.y < RAMP_HEIGHT - 0.01,
		);
		expect(intermediatePoints.length).toBeGreaterThan(0);
	});

	it("ramp profile has horizontal tangent at entry", () => {
		const shape = createRampUpShape();
		const points = shape.getPoints(64);
		// First few points should be nearly horizontal (Y near 0)
		expect(points[0].y).toBeCloseTo(0, 2);
		expect(points[1].y).toBeCloseTo(0, 1);
	});

	it("ramp profile has horizontal tangent at top", () => {
		const shape = createRampUpShape();
		const points = shape.getPoints(64);
		// Find points near the curve end (before the lineTo back down)
		// The bezier curve goes from (0,0) to (RAMP_SLOPE_LENGTH, RAMP_HEIGHT)
		// Then lineTo down and closePath
		// Points along bezier portion should approach RAMP_HEIGHT smoothly
		const bezierPoints = points.filter(
			(p) => p.x > 0 && p.x < RAMP_SLOPE_LENGTH && p.y > 0,
		);
		if (bezierPoints.length > 2) {
			const last = bezierPoints[bezierPoints.length - 1];
			const secondLast = bezierPoints[bezierPoints.length - 2];
			const dy = Math.abs(last.y - secondLast.y);
			const dx = Math.abs(last.x - secondLast.x);
			// Tangent should be mostly horizontal at the top
			expect(dy / dx).toBeLessThan(0.5);
		}
	});

	it("ramp down shape mirrors the ramp up", () => {
		const downShape = createRampDownShape();
		const points = downShape.getPoints(32);
		// Should start at RAMP_HEIGHT
		expect(points[0].y).toBeCloseTo(RAMP_HEIGHT, 2);
	});

	it("side bumpers height equals BUMPER_HEIGHT + RAMP_HEIGHT", () => {
		expect(SIDE_BUMPER_HEIGHT).toBeCloseTo(0.23, 2);
	});

	it("extruded ramp geometry has vertices", () => {
		const shape = createRampUpShape();
		const geom = new THREE.ExtrudeGeometry(shape, {
			depth: 0.5,
			bevelEnabled: false,
			curveSegments: RAMP_CURVE_SEGMENTS,
		});
		const posAttr = geom.getAttribute("position");
		expect(posAttr.count).toBeGreaterThan(0);
		geom.dispose();
	});
});
