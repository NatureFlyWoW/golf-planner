export type OBBInput = {
	pos: { x: number; z: number };
	rot: number; // degrees
	w: number; // full width
	l: number; // full length
};

type Vec2 = [number, number];

function getCorners(obb: OBBInput): Vec2[] {
	const rad = (obb.rot * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	const hw = obb.w / 2;
	const hl = obb.l / 2;
	return [
		[obb.pos.x + cos * hw - sin * hl, obb.pos.z + sin * hw + cos * hl],
		[obb.pos.x - cos * hw - sin * hl, obb.pos.z - sin * hw + cos * hl],
		[obb.pos.x - cos * hw + sin * hl, obb.pos.z - sin * hw - cos * hl],
		[obb.pos.x + cos * hw + sin * hl, obb.pos.z + sin * hw - cos * hl],
	];
}

function getAxes(obb: OBBInput): Vec2[] {
	const rad = (obb.rot * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	return [
		[cos, sin],
		[-sin, cos],
	];
}

function project(corners: Vec2[], axis: Vec2): [number, number] {
	let min = Infinity;
	let max = -Infinity;
	for (const [x, z] of corners) {
		const p = x * axis[0] + z * axis[1];
		if (p < min) min = p;
		if (p > max) max = p;
	}
	return [min, max];
}

/**
 * SAT-based OBB collision test on 2D rotated rectangles.
 * Returns true if the two rectangles overlap (strict — touching edges = no collision).
 */
export function checkOBBCollision(a: OBBInput, b: OBBInput): boolean {
	const cornersA = getCorners(a);
	const cornersB = getCorners(b);
	const axes = [...getAxes(a), ...getAxes(b)];

	for (const axis of axes) {
		const [minA, maxA] = project(cornersA, axis);
		const [minB, maxB] = project(cornersB, axis);
		if (maxA <= minB || maxB <= minA) return false;
	}
	return true;
}

/**
 * Check if all corners of a rotated rectangle are inside the hall boundaries.
 */
export function checkHallBounds(
	pos: { x: number; z: number },
	rot: number,
	w: number,
	l: number,
	hall: { width: number; length: number },
): boolean {
	const corners = getCorners({ pos, rot, w, l });
	return corners.every(
		([x, z]) => x >= 0 && x <= hall.width && z >= 0 && z <= hall.length,
	);
}

/**
 * Check if a candidate hole collides with any existing hole.
 * Returns true if placement is INVALID (collision detected).
 */
export function checkAnyCollision(
	candidate: OBBInput,
	allHoles: Record<
		string,
		{ pos: { x: number; z: number }; rot: number; w: number; l: number }
	>,
	excludeId?: string,
): boolean {
	for (const [id, other] of Object.entries(allHoles)) {
		if (id === excludeId) continue;
		if (checkOBBCollision(candidate, other)) return true;
	}
	return false;
}
