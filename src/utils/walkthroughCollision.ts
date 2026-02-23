import type { Hall } from "../types/hall";
import { type OBBInput, checkOBBCollision } from "./collision";

export type DoorZone = {
	wall: "north" | "south" | "east" | "west";
	xMin: number;
	xMax: number;
};

export type Vec2D = { x: number; z: number };

/** Camera collision radius in metres */
export const CAMERA_RADIUS = 0.4;

/**
 * Compute passable door zones from the hall's doors array.
 * Each zone describes a range on a given wall where the camera may pass through.
 */
export function getDoorZones(hall: Hall): DoorZone[] {
	return hall.doors.map((door) => ({
		wall: door.wall,
		xMin: door.offset - door.width / 2,
		xMax: door.offset + door.width / 2,
	}));
}

/**
 * Check if an x-coordinate falls within any door zone on the specified wall.
 */
function isInDoorZone(
	x: number,
	doorZones: DoorZone[],
	wall: "north" | "south" | "east" | "west",
): boolean {
	return doorZones.some(
		(z) => z.wall === wall && x >= z.xMin && x <= z.xMax,
	);
}

/**
 * Apply AABB wall clamping to a desired camera XZ position.
 * Door exceptions allow passage through doorways on the south wall.
 * When camera is well outside the hall (far past south wall via door), no clamping.
 */
function clampToWalls(
	desired: Vec2D,
	hall: Hall,
	doorZones: DoorZone[],
): Vec2D {
	let { x, z } = desired;

	// If camera is well outside south wall AND in a door zone, free roam
	if (
		z > hall.length + CAMERA_RADIUS &&
		isInDoorZone(x, doorZones, "south")
	) {
		return { x, z };
	}

	// X clamping (east/west walls)
	x = Math.max(CAMERA_RADIUS, Math.min(hall.width - CAMERA_RADIUS, x));

	// Z north wall clamping
	z = Math.max(CAMERA_RADIUS, z);

	// Z south wall: allow passage through door zones
	if (z > hall.length - CAMERA_RADIUS) {
		if (!isInDoorZone(x, doorZones, "south")) {
			z = hall.length - CAMERA_RADIUS;
		}
	}

	return { x, z };
}

/**
 * Resolve collision between the camera and a single placed hole using MTV.
 * Camera is represented as an axis-aligned OBB with side 2×CAMERA_RADIUS.
 */
function resolveHoleCollision(cameraPos: Vec2D, hole: OBBInput): Vec2D {
	const cameraOBB: OBBInput = {
		pos: { x: cameraPos.x, z: cameraPos.z },
		rot: 0,
		w: CAMERA_RADIUS * 2,
		l: CAMERA_RADIUS * 2,
	};

	if (!checkOBBCollision(cameraOBB, hole)) {
		return cameraPos;
	}

	// Compute MTV (minimum translation vector)
	const holeRad = (hole.rot * Math.PI) / 180;
	const cos = Math.cos(holeRad);
	const sin = Math.sin(holeRad);

	// SAT axes: camera axes (X, Z) and hole axes
	const axes: [number, number][] = [
		[1, 0],
		[0, 1],
		[cos, sin],
		[-sin, cos],
	];

	let minOverlap = Number.POSITIVE_INFINITY;
	let pushAxis: [number, number] = [1, 0];

	for (let i = 0; i < axes.length; i++) {
		const axis = axes[i];
		const camProj = cameraPos.x * axis[0] + cameraPos.z * axis[1];
		const holeProj = hole.pos.x * axis[0] + hole.pos.z * axis[1];

		// Half-extent projections for both shapes on this axis
		const camHalfOnAxis =
			Math.abs(CAMERA_RADIUS * axis[0]) +
			Math.abs(CAMERA_RADIUS * axis[1]);

		const holeHalfOnAxis =
			Math.abs((hole.w / 2) * (axis[0] * cos + axis[1] * sin)) +
			Math.abs((hole.l / 2) * (axis[0] * -sin + axis[1] * cos));

		const dist = Math.abs(camProj - holeProj);
		const overlap = camHalfOnAxis + holeHalfOnAxis - dist;

		if (overlap <= 0) return cameraPos;

		if (overlap < minOverlap) {
			minOverlap = overlap;
			const sign = camProj >= holeProj ? 1 : -1;
			pushAxis = [axis[0] * sign, axis[1] * sign];
		}
	}

	return {
		x: cameraPos.x + pushAxis[0] * (minOverlap + 0.001),
		z: cameraPos.z + pushAxis[1] * (minOverlap + 0.001),
	};
}

/**
 * Combined collision resolver for walkthrough camera.
 * Step 1: Apply wall clamping (with door zone exceptions).
 * Step 2: For each placed hole, resolve OBB overlap.
 * Step 3: Re-clamp to walls (hole push-out may have ejected camera).
 */
export function checkWalkthroughCollision(
	desiredPos: Vec2D,
	holeOBBs: OBBInput[],
	hall: Hall,
): Vec2D {
	const doorZones = getDoorZones(hall);

	// Step 1: Wall clamping
	let resolved = clampToWalls(desiredPos, hall, doorZones);

	// Step 2: Hole collision resolution
	for (const hole of holeOBBs) {
		resolved = resolveHoleCollision(resolved, hole);
	}

	// Step 3: Re-clamp to walls after hole push-out
	resolved = clampToWalls(resolved, hall, doorZones);

	return resolved;
}
