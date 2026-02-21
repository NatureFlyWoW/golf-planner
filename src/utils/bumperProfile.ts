import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Creates a rounded rectangle Shape for bumper cross-section.
 * The shape lies in the XY plane: X = thickness, Y = height.
 * Four corners get quadraticCurveTo bevels for rounded edges.
 */
export function createBumperProfile(
	height: number,
	thickness: number,
	bevelRadius: number,
): THREE.Shape {
	const r = Math.min(bevelRadius, thickness / 2, height / 2);
	const hw = thickness / 2;
	const hh = height;

	const shape = new THREE.Shape();

	// Start at bottom-left + bevel offset, go clockwise
	shape.moveTo(-hw + r, 0);

	// Bottom edge -> bottom-right corner
	shape.lineTo(hw - r, 0);
	shape.quadraticCurveTo(hw, 0, hw, r);

	// Right edge -> top-right corner
	shape.lineTo(hw, hh - r);
	shape.quadraticCurveTo(hw, hh, hw - r, hh);

	// Top edge -> top-left corner
	shape.lineTo(-hw + r, hh);
	shape.quadraticCurveTo(-hw, hh, -hw, hh - r);

	// Left edge -> bottom-left corner
	shape.lineTo(-hw, r);
	shape.quadraticCurveTo(-hw, 0, -hw + r, 0);

	return shape;
}

/**
 * Creates ExtrudeGeometry for a straight bumper rail.
 * Extrudes the bumper profile along the Z axis for the given length.
 */
export function createBumperGeometry(
	profile: THREE.Shape,
	length: number,
	options?: { curveSegments?: number },
): THREE.ExtrudeGeometry {
	const curveSegments = options?.curveSegments ?? 8;

	const geom = new THREE.ExtrudeGeometry(profile, {
		depth: length,
		bevelEnabled: false,
		curveSegments,
	});

	return mergeVertices(geom) as THREE.ExtrudeGeometry;
}
