import * as THREE from "three";

/**
 * Creates a quarter-cylinder BufferGeometry for corner fillets.
 * The geometry is a 90-degree wedge in the +X/+Z quadrant,
 * with height along the Y axis. The caller rotates it to face
 * the correct corner direction.
 */
export function createCornerFilletGeometry(
	radius: number,
	height: number,
	segments = 8,
): THREE.CylinderGeometry {
	// CylinderGeometry(radiusTop, radiusBottom, height, radialSegments, heightSegments, openEnded, thetaStart, thetaLength)
	// thetaStart=0 starts at +X, thetaLength=PI/2 sweeps 90 degrees toward +Z
	return new THREE.CylinderGeometry(
		radius,
		radius,
		height,
		segments,
		1,
		false,
		0,
		Math.PI / 2,
	);
}
