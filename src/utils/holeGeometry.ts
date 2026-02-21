import * as THREE from "three";

/** Depth of the recessed cup below the felt surface */
export const CUP_DEPTH = 0.015;

/** Height of the flag pin above the felt surface */
export const FLAG_PIN_HEIGHT = 0.2;

/**
 * Creates a recessed CylinderGeometry for the cup (hole).
 * Oriented along Y axis, open at the top.
 */
export function createCupGeometry(radius: number): THREE.CylinderGeometry {
	return new THREE.CylinderGeometry(radius, radius, CUP_DEPTH, 16, 1, true);
}

/**
 * Creates a slightly raised CylinderGeometry for the tee pad.
 * 3mm height, positioned on top of the felt surface.
 */
export function createTeeGeometry(radius: number): THREE.CylinderGeometry {
	return new THREE.CylinderGeometry(radius, radius, 0.003, 16);
}

/**
 * Creates a thin CylinderGeometry for the flag pin shaft.
 */
export function createFlagPinGeometry(): THREE.CylinderGeometry {
	return new THREE.CylinderGeometry(0.003, 0.003, FLAG_PIN_HEIGHT, 6);
}
