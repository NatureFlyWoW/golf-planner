import type { Hall } from "../types/hall";

export const WALK_SPEED = 2.0;
export const RUN_SPEED = 4.0;
export const EYE_HEIGHT = 1.7;
export const LOOK_SENSITIVITY = 0.003;
export const MAX_PITCH = (85 * Math.PI) / 180;
const SPAWN_OFFSET_FROM_SOUTH_WALL = 0.5;

export type KeyState = {
	forward: boolean;
	backward: boolean;
	left: boolean;
	right: boolean;
	shift: boolean;
};

type MovementResult = { x: number; y: number; z: number };

/**
 * Compute world-space movement delta for one frame.
 * Yaw angle (radians) describes camera horizontal facing (Y-axis rotation).
 * Returns a vector ready to be added to camera position.
 * Y is always 0 — vertical position is locked to EYE_HEIGHT externally.
 */
export function computeMovementVector(
	keys: KeyState,
	yaw: number,
	delta: number,
): MovementResult {
	// Front vector: -Z is forward at yaw=0 (Three.js convention)
	const fx = -Math.sin(yaw);
	const fz = -Math.cos(yaw);

	// Side vector (right): perpendicular to front on XZ plane
	const sx = Math.cos(yaw);
	const sz = -Math.sin(yaw);

	const fb = (keys.forward ? 1 : 0) - (keys.backward ? 1 : 0);
	const rl = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);

	let dx = fx * fb + sx * rl;
	let dz = fz * fb + sz * rl;

	const len = Math.sqrt(dx * dx + dz * dz);
	if (len > 0) {
		dx /= len;
		dz /= len;
	}

	const speed = keys.shift ? RUN_SPEED : WALK_SPEED;
	return { x: dx * speed * delta, y: 0, z: dz * speed * delta };
}

/**
 * Clamp pitch angle (radians) to prevent camera flip.
 * Positive pitch = looking up, negative pitch = looking down.
 */
export function clampPitch(pitch: number): number {
	return Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch));
}

/**
 * Compute the camera spawn position for walkthrough mode.
 * Places the camera just inside the south wall near the PVC entrance door.
 */
export function getWalkthroughSpawnPoint(hall: Hall): {
	x: number;
	y: number;
	z: number;
} {
	const pvcDoor = hall.doors.find((d) => d.type === "pvc");
	const x = pvcDoor ? pvcDoor.offset : hall.width / 2;
	return {
		x,
		y: EYE_HEIGHT,
		z: hall.length - SPAWN_OFFSET_FROM_SOUTH_WALL,
	};
}
