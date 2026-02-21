import * as THREE from "three";
import {
	mergeGeometries,
	mergeVertices,
} from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { SEGMENT_SPECS } from "../constants/segmentSpecs";
import type { SegmentSpecId } from "../types/template";
import { createBumperGeometry, createBumperProfile } from "./bumperProfile";

// ── Constants (mirrored from shared.ts to avoid React/DOM deps in pure util) ─
const SURFACE_THICKNESS = 0.02;
const BUMPER_HEIGHT = 0.08;
const BUMPER_THICKNESS = 0.05;
const BEVEL_RADIUS = 0.008;

// ── Public Types ──────────────────────────────────────────────────────────────

export type SegmentGeometries = {
	felt: THREE.BufferGeometry;
	bumperLeft: THREE.BufferGeometry;
	bumperRight: THREE.BufferGeometry;
};

// ── Entry Point ───────────────────────────────────────────────────────────────

/**
 * Creates THREE.js BufferGeometry objects for a given segment spec.
 * All geometries are in LOCAL segment space: entry at origin (0,0,0),
 * path extends toward +Z. The caller is responsible for positioning /
 * rotating each geometry using the chain-computed transform.
 */
export function createSegmentGeometries(
	specId: SegmentSpecId,
	feltWidth: number,
): SegmentGeometries {
	const spec = SEGMENT_SPECS[specId];

	let result: SegmentGeometries;

	if (spec.category === "straight") {
		result = createStraightGeometries(spec.length, feltWidth);
	} else if (spec.category === "complex") {
		result = createComplexGeometries(specId, feltWidth);
	} else if (
		spec.arcRadius !== undefined &&
		spec.arcSweep !== undefined &&
		spec.arcCenter !== undefined
	) {
		result = createCurveGeometries(
			spec.arcRadius,
			spec.arcSweep,
			spec.arcCenter,
			feltWidth,
		);
	} else {
		// Fallback — should never reach here for valid specIds
		result = createStraightGeometries(spec.length, feltWidth);
	}

	return {
		felt: mergeVertices(result.felt),
		bumperLeft: mergeVertices(result.bumperLeft),
		bumperRight: mergeVertices(result.bumperRight),
	};
}

// ── Straight ──────────────────────────────────────────────────────────────────

function createStraightGeometries(
	length: number,
	feltWidth: number,
): SegmentGeometries {
	const hw = feltWidth / 2;

	// Felt: flat slab on XZ plane, y-centered at SURFACE_THICKNESS/2
	const felt = new THREE.BoxGeometry(feltWidth, SURFACE_THICKNESS, length);
	felt.translate(0, SURFACE_THICKNESS / 2, length / 2);

	// Rounded bumper cross-section profile
	const profile = createBumperProfile(
		BUMPER_HEIGHT,
		BUMPER_THICKNESS,
		BEVEL_RADIUS,
	);

	// Left bumper: negative X side
	// ExtrudeGeometry: X centered, Y from 0 to BUMPER_HEIGHT, Z from 0 to length
	const bumperLeft = createBumperGeometry(profile, length);
	bumperLeft.translate(-(hw + BUMPER_THICKNESS / 2), 0, 0);

	// Right bumper: positive X side
	const bumperRight = createBumperGeometry(profile, length);
	bumperRight.translate(hw + BUMPER_THICKNESS / 2, 0, 0);

	return { felt, bumperLeft, bumperRight };
}

// ── Curve ─────────────────────────────────────────────────────────────────────

/**
 * Builds arc geometries for a single-arc curve segment.
 *
 * Coordinate system:
 *   - Entry at world origin (0, 0)
 *   - Path travels in +Z initially
 *   - Arc center is perpendicular to entry direction (on the X axis from origin)
 *
 * RingGeometry is created on the XY plane with thetaStart=0 pointing +X.
 * We need the ring sector to span from the entry point to the exit point.
 *
 * For a LEFT curve (arcCenter.x < 0, e.g. x=-R):
 *   - Center at (-R, 0) in XZ plane
 *   - Entry point is at angle 0 from center (pointing +X from center)
 *   - After rotateX(-PI/2) + translate(arcCenter.x, 0, arcCenter.z):
 *     the ring's starting edge ends up at center + (R, 0, 0) = (0, 0, 0) ✓
 *
 * For a RIGHT curve (arcCenter.x > 0, e.g. x=+R):
 *   - Center at (+R, 0) in XZ plane
 *   - Entry point is at angle PI from center (pointing -X from center)
 *   - thetaStart=PI so ring begins at -X direction from center,
 *     which after translation lands at (+R + (-R), 0) = (0, 0) ✓
 */
function createCurveGeometries(
	arcRadius: number,
	arcSweep: number,
	arcCenter: { x: number; z: number },
	feltWidth: number,
): SegmentGeometries {
	const hw = feltWidth / 2;
	const sweepRad = (arcSweep * Math.PI) / 180;
	const segs = Math.max(16, Math.ceil(arcSweep / 3));

	const isRightCurve = arcCenter.x > 0;
	const thetaStart = isRightCurve ? Math.PI : 0;

	const felt = buildRingSegment(
		arcRadius - hw,
		arcRadius + hw,
		segs,
		thetaStart,
		sweepRad,
		SURFACE_THICKNESS / 2,
		arcCenter,
	);

	const innerBumper = buildRingSegment(
		arcRadius - hw - BUMPER_THICKNESS,
		arcRadius - hw,
		segs,
		thetaStart,
		sweepRad,
		BUMPER_HEIGHT / 2,
		arcCenter,
	);

	const outerBumper = buildRingSegment(
		arcRadius + hw,
		arcRadius + hw + BUMPER_THICKNESS,
		segs,
		thetaStart,
		sweepRad,
		BUMPER_HEIGHT / 2,
		arcCenter,
	);

	// Left curve: arc center is on left (-X), inner = left bumper, outer = right bumper.
	// Right curve: arc center is on right (+X), inner = right bumper, outer = left bumper.
	const bumperLeft = isRightCurve ? outerBumper : innerBumper;
	const bumperRight = isRightCurve ? innerBumper : outerBumper;

	return { felt, bumperLeft, bumperRight };
}

/**
 * Creates a RingGeometry flat sector, rotates it to the XZ plane,
 * sets a Y offset, then translates by arcCenter.
 *
 * rotateX(-PI/2) maps XY → XZ: (x, y, 0) → (x, 0, -y).
 */
function buildRingSegment(
	innerR: number,
	outerR: number,
	segments: number,
	thetaStart: number,
	thetaLength: number,
	yOffset: number,
	arcCenter: { x: number; z: number },
): THREE.BufferGeometry {
	// Clamp inner radius to avoid degenerate geometry
	const safeInner = Math.max(0, innerR);
	const geom = new THREE.RingGeometry(
		safeInner,
		outerR,
		segments,
		1,
		thetaStart,
		thetaLength,
	);
	// RingGeometry is on XY plane; rotate to XZ plane
	geom.rotateX(-Math.PI / 2);
	geom.translate(0, yOffset, 0);
	geom.translate(arcCenter.x, 0, arcCenter.z);
	return geom;
}

// ── Complex Geometries ────────────────────────────────────────────────────────

function createComplexGeometries(
	specId: SegmentSpecId,
	feltWidth: number,
): SegmentGeometries {
	switch (specId) {
		case "u_turn":
			return createUTurnGeometries(feltWidth);
		case "s_curve":
			return createSCurveGeometries(feltWidth);
		case "chicane":
			return createChicaneGeometries(feltWidth);
		default:
			// Should not happen for valid specIds
			return createStraightGeometries(1, feltWidth);
	}
}

/**
 * U-turn: 180° arc around center (-0.8, 0).
 * Delegates to the standard curve helper with the spec's arc data.
 */
function createUTurnGeometries(feltWidth: number): SegmentGeometries {
	const R = 0.8;
	return createCurveGeometries(R, 180, { x: -R, z: 0 }, feltWidth);
}

/**
 * S-curve: two 90° arcs.
 *
 * Arc 1 (left, 90°): center (-R, 0), entry at (0,0), exit at (-R, R).
 *   thetaStart = 0 (left curve convention).
 *
 * Arc 2 (right, 90°): center (-R, 2R), entry at (-R, R) going in -X direction.
 *   From center (-R, 2R) to entry (-R, R): direction is (0, -R) in XZ.
 *   rotateX(-PI/2) maps XZ direction (0, -R) to XY angle PI/2.
 *   So thetaStart = PI/2 for arc 2.
 *   Verification: ring start at angle PI/2 in XY = (0, R).
 *   After rotateX(-PI/2): (0, 0, -R) in XZ.
 *   After translate by center (-R, 2R): (-R, 0, 2R-R) = (-R, 0, R) ✓ (entry).
 */
function createSCurveGeometries(feltWidth: number): SegmentGeometries {
	const R = 0.8;
	const hw = feltWidth / 2;
	const sweepRad = Math.PI / 2; // 90°
	const segs = Math.max(16, Math.ceil(90 / 3));

	const arc1Center = { x: -R, z: 0 };
	const arc1ThetaStart = 0;

	const arc2Center = { x: -R, z: 2 * R };
	const arc2ThetaStart = Math.PI / 2;

	// Arc 1 geometries
	const arc1Felt = buildRingSegment(
		R - hw,
		R + hw,
		segs,
		arc1ThetaStart,
		sweepRad,
		SURFACE_THICKNESS / 2,
		arc1Center,
	);
	const arc1Inner = buildRingSegment(
		R - hw - BUMPER_THICKNESS,
		R - hw,
		segs,
		arc1ThetaStart,
		sweepRad,
		BUMPER_HEIGHT / 2,
		arc1Center,
	);
	const arc1Outer = buildRingSegment(
		R + hw,
		R + hw + BUMPER_THICKNESS,
		segs,
		arc1ThetaStart,
		sweepRad,
		BUMPER_HEIGHT / 2,
		arc1Center,
	);

	// Arc 2 geometries
	const arc2Felt = buildRingSegment(
		R - hw,
		R + hw,
		segs,
		arc2ThetaStart,
		sweepRad,
		SURFACE_THICKNESS / 2,
		arc2Center,
	);
	const arc2Inner = buildRingSegment(
		R - hw - BUMPER_THICKNESS,
		R - hw,
		segs,
		arc2ThetaStart,
		sweepRad,
		BUMPER_HEIGHT / 2,
		arc2Center,
	);
	const arc2Outer = buildRingSegment(
		R + hw,
		R + hw + BUMPER_THICKNESS,
		segs,
		arc2ThetaStart,
		sweepRad,
		BUMPER_HEIGHT / 2,
		arc2Center,
	);

	// Arc1 is left (inner=left, outer=right); arc2 is right (inner=right, outer=left).
	// Merged left = arc1Inner + arc2Outer; merged right = arc1Outer + arc2Inner.
	const felt = mergeGeometries([arc1Felt, arc2Felt]) ?? arc1Felt;
	const bumperLeft = mergeGeometries([arc1Inner, arc2Outer]) ?? arc1Inner;
	const bumperRight = mergeGeometries([arc1Outer, arc2Inner]) ?? arc1Outer;

	return { felt, bumperLeft, bumperRight };
}

/**
 * Chicane: a quick left-right wiggle, exits at (-0.6, 2) going +Z.
 *
 * Approximated with two identical diagonal straight sections:
 *   Section 1: (0, 0) → (-0.3, 1.0)
 *   Section 2: (-0.3, 1.0) → (-0.6, 2.0)
 *
 * For each section, BoxGeometry is rotated around Y then translated to center.
 * The local +X axis after rotateY(rotY) is (cos(rotY), 0, -sin(rotY)) in global.
 * Bumper offsets use this to place bumpers perpendicular to the section direction.
 */
function createChicaneGeometries(feltWidth: number): SegmentGeometries {
	const hw = feltWidth / 2;
	const dx = -0.3;
	const dz = 1.0;
	const sectionLen = Math.sqrt(dx * dx + dz * dz);
	// rotY: rotation around Y so the box's +Z axis points from (0,0) toward (-0.3, 1.0)
	const rotY = Math.atan2(-dx, dz);

	// Bumper offset in global coords: local +X = (cos(rotY), 0, -sin(rotY))
	const bumpOffsetX = (hw + BUMPER_THICKNESS / 2) * Math.cos(rotY);
	const bumpOffsetZ = -(hw + BUMPER_THICKNESS / 2) * Math.sin(rotY);

	const feltParts: THREE.BufferGeometry[] = [];
	const leftParts: THREE.BufferGeometry[] = [];
	const rightParts: THREE.BufferGeometry[] = [];

	const profile = createBumperProfile(
		BUMPER_HEIGHT,
		BUMPER_THICKNESS,
		BEVEL_RADIUS,
	);

	// Build one diagonal section centered at (cx, cz)
	function addSection(cx: number, cz: number): void {
		const f = new THREE.BoxGeometry(feltWidth, SURFACE_THICKNESS, sectionLen);
		f.rotateY(rotY);
		f.translate(cx, SURFACE_THICKNESS / 2, cz);
		feltParts.push(f);

		// ExtrudeGeometry: X centered, Y [0, BH], Z [0, sectionLen]
		// Center Z for rotation, then translate to final position
		const bl = createBumperGeometry(profile, sectionLen);
		bl.translate(0, 0, -sectionLen / 2);
		bl.rotateY(rotY);
		bl.translate(cx - bumpOffsetX, 0, cz - bumpOffsetZ);
		leftParts.push(bl);

		const br = createBumperGeometry(profile, sectionLen);
		br.translate(0, 0, -sectionLen / 2);
		br.rotateY(rotY);
		br.translate(cx + bumpOffsetX, 0, cz + bumpOffsetZ);
		rightParts.push(br);
	}

	// Section 1: center at midpoint of (0,0)→(-0.3, 1.0)
	addSection(dx / 2, dz / 2);
	// Section 2: center at midpoint of (-0.3, 1.0)→(-0.6, 2.0)
	addSection(dx + dx / 2, dz + dz / 2);

	const felt = mergeGeometries(feltParts) ?? feltParts[0];
	const bumperLeft = mergeGeometries(leftParts) ?? leftParts[0];
	const bumperRight = mergeGeometries(rightParts) ?? rightParts[0];

	return { felt, bumperLeft, bumperRight };
}
