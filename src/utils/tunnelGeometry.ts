import * as THREE from "three";

const DEFAULT_WALL_THICKNESS = 0.05;

/**
 * Creates a 2D arch cross-section shape (semicircular annulus).
 * The profile is a half-donut shape sitting on the ground plane (y=0).
 */
export function createArchProfile(
	archRadius: number,
	wallThickness: number = DEFAULT_WALL_THICKNESS,
): THREE.Shape {
	const innerRadius = archRadius - wallThickness;
	const shape = new THREE.Shape();

	// Start at bottom-left (outer)
	shape.moveTo(-archRadius, 0);

	// Outer semicircle: left base to right base, curving over the top
	shape.absarc(0, 0, archRadius, Math.PI, 0, true);

	// Right wall: down to inner arc start
	shape.lineTo(innerRadius, 0);

	// Inner semicircle: right base back to left base (reversed)
	shape.absarc(0, 0, innerRadius, 0, Math.PI, false);

	// Close: left wall back to start
	shape.lineTo(-archRadius, 0);

	return shape;
}

/**
 * Creates an ExtrudeGeometry from the arch profile, extruded along Z.
 */
export function createTunnelArchGeometry(
	archRadius: number,
	tunnelLength: number,
	wallThickness: number = DEFAULT_WALL_THICKNESS,
): THREE.ExtrudeGeometry {
	const profile = createArchProfile(archRadius, wallThickness);
	return new THREE.ExtrudeGeometry(profile, {
		depth: tunnelLength,
		bevelEnabled: false,
	});
}
