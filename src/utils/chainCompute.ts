import { SEGMENT_SPECS } from "../constants/segmentSpecs";
import type { HoleTemplate, Segment } from "../types/template";

const DEG2RAD = Math.PI / 180;

function rotatePoint(
	x: number,
	z: number,
	angleDeg: number,
): { x: number; z: number } {
	const rad = angleDeg * DEG2RAD;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);
	return {
		x: x * cos - z * sin,
		z: x * sin + z * cos,
	};
}

/** Normalize angle to [0, 360) */
function normalizeAngle(angle: number): number {
	return ((angle % 360) + 360) % 360;
}

/**
 * Recompute all segment positions and rotations from scratch.
 * Segment 0 is placed at origin with rotation 0. Each subsequent segment
 * snaps its entry point to the previous segment's exit point.
 *
 * Angle convention: 0=+Z, 90=+X, 180=-Z, 270=-X.
 * The rotatePoint function performs standard CCW rotation.
 * To advance the chain correctly: rotation_B = rotation_A - exitAngle_local_A
 */
export function computeChainPositions(segments: Segment[]): Segment[] {
	if (segments.length === 0) return [];

	const result: Segment[] = [
		{ ...segments[0], position: { x: 0, z: 0 }, rotation: 0 },
	];

	for (let i = 1; i < segments.length; i++) {
		const prev = result[i - 1];
		const prevSpec = SEGMENT_SPECS[prev.specId];

		// Previous segment's exit point rotated into world space
		const prevExitLocal = rotatePoint(
			prevSpec.exitPoint.x,
			prevSpec.exitPoint.z,
			prev.rotation,
		);
		const prevExitWorld = {
			x: prev.position.x + prevExitLocal.x,
			z: prev.position.z + prevExitLocal.z,
		};

		// Correct rotation formula: rotation_B = rotation_A - exitAngle_local_A
		// This ensures the current segment continues in the direction the previous one exits.
		const currRotation = normalizeAngle(
			prev.rotation - prevSpec.exitPoint.angle,
		);

		// Current segment's entry point in world space (entry is at origin in local coords)
		// We need to offset so the entry lands on prevExitWorld
		const currSpec = SEGMENT_SPECS[segments[i].specId];
		const currEntryLocal = rotatePoint(
			currSpec.entryPoint.x,
			currSpec.entryPoint.z,
			currRotation,
		);

		result.push({
			...segments[i],
			position: {
				x: prevExitWorld.x - currEntryLocal.x,
				z: prevExitWorld.z - currEntryLocal.z,
			},
			rotation: currRotation,
		});
	}

	return result;
}

/**
 * Compute the axis-aligned bounding box (AABB) of a template.
 * Returns width (X extent) and length (Z extent) including felt width padding.
 *
 * Entry and exit points of each segment contribute to the AABB, padded by
 * feltWidth/2 in all directions. For arc segments the arc midpoint is also
 * sampled to capture inward or outward bulge.
 */
export function computeTemplateBounds(
	template: Pick<HoleTemplate, "segments" | "feltWidth">,
): { width: number; length: number } {
	const positioned = computeChainPositions(template.segments);
	if (positioned.length === 0) return { width: 0, length: 0 };

	let minX = Number.POSITIVE_INFINITY;
	let maxX = Number.NEGATIVE_INFINITY;
	let minZ = Number.POSITIVE_INFINITY;
	let maxZ = Number.NEGATIVE_INFINITY;

	const hw = template.feltWidth / 2;

	function expandWithPoint(wx: number, wz: number): void {
		minX = Math.min(minX, wx - hw);
		maxX = Math.max(maxX, wx + hw);
		minZ = Math.min(minZ, wz - hw);
		maxZ = Math.max(maxZ, wz + hw);
	}

	for (const seg of positioned) {
		const spec = SEGMENT_SPECS[seg.specId];

		// Check entry and exit points
		for (const pt of [spec.entryPoint, spec.exitPoint]) {
			const world = rotatePoint(pt.x, pt.z, seg.rotation);
			expandWithPoint(seg.position.x + world.x, seg.position.z + world.z);
		}

		// For arc segments, also sample the arc midpoint to capture the curve's extent
		if (
			spec.arcCenter !== undefined &&
			spec.arcRadius !== undefined &&
			spec.arcSweep !== undefined
		) {
			const midAngle = (spec.arcSweep / 2) * DEG2RAD;
			const midLocalX = spec.arcCenter.x + spec.arcRadius * Math.sin(midAngle);
			const midLocalZ = spec.arcCenter.z + spec.arcRadius * Math.cos(midAngle);
			const world = rotatePoint(midLocalX, midLocalZ, seg.rotation);
			expandWithPoint(seg.position.x + world.x, seg.position.z + world.z);
		}
	}

	return {
		width: maxX - minX,
		length: maxZ - minZ,
	};
}
