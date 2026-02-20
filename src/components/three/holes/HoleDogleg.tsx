import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
} from "./shared";
import { useMaterials } from "./useMaterials";

// ── Lane constants ───────────────────────────────────────────────────────────
const LANE_WIDTH = 0.6;
const OFFSET = 0.15;

export function HoleDogleg({
	width,
	length,
}: {
	width: number;
	length: number;
}) {
	const { felt, bumper, tee, cup } = useMaterials();
	const halfW = width / 2;
	const halfL = length / 2;

	// Inner lane length after subtracting end bumpers
	const innerL = length - BUMPER_THICKNESS * 2;
	const segLen = innerL / 3;

	// Z centres for each of the three felt segments
	const zEntry = -halfL + BUMPER_THICKNESS + segLen / 2;
	const zMid = 0;
	const zExit = halfL - BUMPER_THICKNESS - segLen / 2;

	// Z boundaries between segments (world space)
	const zBend1 = -halfL + BUMPER_THICKNESS + segLen; // entry/middle boundary
	const zBend2 = halfL - BUMPER_THICKNESS - segLen; // middle/exit boundary

	// Transition patch dimensions – cover the gap caused by the X shift
	// The patch spans the full combined width of both adjacent lanes
	const transitionW = LANE_WIDTH + OFFSET; // 0.75 — bridges the offset gap
	const transitionL = BUMPER_THICKNESS; // thin slab to fill the seam

	// Shared Y positions
	const surfaceY = SURFACE_THICKNESS / 2;
	const bumperY = SURFACE_THICKNESS + BUMPER_HEIGHT / 2;

	// Inner guide bumper dimensions
	const guideBumperH = BUMPER_HEIGHT * 0.6;
	const guideBumperY = SURFACE_THICKNESS + guideBumperH / 2;
	const guideBumperLen = BUMPER_THICKNESS * 1.5;

	return (
		<group>
			{/* ── Felt surfaces ─────────────────────────────────────────────── */}

			{/* Entry segment: offset right (+X) */}
			<mesh position={[OFFSET, surfaceY, zEntry]} material={felt}>
				<boxGeometry args={[LANE_WIDTH, SURFACE_THICKNESS, segLen]} />
			</mesh>

			{/* Middle segment: centred */}
			<mesh position={[0, surfaceY, zMid]} material={felt}>
				<boxGeometry args={[LANE_WIDTH, SURFACE_THICKNESS, segLen]} />
			</mesh>

			{/* Exit segment: offset left (-X) */}
			<mesh position={[-OFFSET, surfaceY, zExit]} material={felt}>
				<boxGeometry args={[LANE_WIDTH, SURFACE_THICKNESS, segLen]} />
			</mesh>

			{/* ── Transition felt patches ────────────────────────────────────── */}

			{/*
			 * Bend 1 (entry → middle): entry is at +OFFSET, middle is at 0.
			 * The patch is centred between them → X = +OFFSET/2
			 */}
			<mesh position={[OFFSET / 2, surfaceY, zBend1]} material={felt}>
				<boxGeometry args={[transitionW, SURFACE_THICKNESS, transitionL]} />
			</mesh>

			{/*
			 * Bend 2 (middle → exit): middle is at 0, exit is at -OFFSET.
			 * The patch is centred between them → X = -OFFSET/2
			 */}
			<mesh position={[-OFFSET / 2, surfaceY, zBend2]} material={felt}>
				<boxGeometry args={[transitionW, SURFACE_THICKNESS, transitionL]} />
			</mesh>

			{/* ── Outer bumper walls ────────────────────────────────────────── */}

			{/* Left outer bumper (full length, at -X bounding edge) */}
			<mesh
				castShadow
				position={[-halfW + BUMPER_THICKNESS / 2, bumperY, 0]}
				material={bumper}
			>
				<boxGeometry args={[BUMPER_THICKNESS, BUMPER_HEIGHT, length]} />
			</mesh>

			{/* Right outer bumper (full length, at +X bounding edge) */}
			<mesh
				castShadow
				position={[halfW - BUMPER_THICKNESS / 2, bumperY, 0]}
				material={bumper}
			>
				<boxGeometry args={[BUMPER_THICKNESS, BUMPER_HEIGHT, length]} />
			</mesh>

			{/* ── End bumpers ───────────────────────────────────────────────── */}

			{/* Back end bumper (-Z, tee end) */}
			<mesh
				castShadow
				position={[0, bumperY, -halfL + BUMPER_THICKNESS / 2]}
				material={bumper}
			>
				<boxGeometry args={[width, BUMPER_HEIGHT, BUMPER_THICKNESS]} />
			</mesh>

			{/* Front end bumper (+Z, cup end) */}
			<mesh
				castShadow
				position={[0, bumperY, halfL - BUMPER_THICKNESS / 2]}
				material={bumper}
			>
				<boxGeometry args={[width, BUMPER_HEIGHT, BUMPER_THICKNESS]} />
			</mesh>

			{/* ── Inner guide bumpers at bends ──────────────────────────────── */}

			{/*
			 * Right guide at bend 1: sits at the right edge of the entry lane
			 * (entry lane right edge = OFFSET + LANE_WIDTH/2 = 0.15 + 0.3 = 0.45)
			 * Positioned between the entry and middle segments.
			 */}
			<mesh
				castShadow
				position={[
					OFFSET + LANE_WIDTH / 2 + BUMPER_THICKNESS / 2,
					guideBumperY,
					zBend1,
				]}
				material={bumper}
			>
				<boxGeometry args={[BUMPER_THICKNESS, guideBumperH, guideBumperLen]} />
			</mesh>

			{/*
			 * Left guide at bend 2: sits at the left edge of the exit lane
			 * (exit lane left edge = -OFFSET - LANE_WIDTH/2 = -0.15 - 0.3 = -0.45)
			 * Positioned between the middle and exit segments.
			 */}
			<mesh
				castShadow
				position={[
					-OFFSET - LANE_WIDTH / 2 - BUMPER_THICKNESS / 2,
					guideBumperY,
					zBend2,
				]}
				material={bumper}
			>
				<boxGeometry args={[BUMPER_THICKNESS, guideBumperH, guideBumperLen]} />
			</mesh>

			{/* ── Tee marker (yellow disc, at entry segment, slightly right) ── */}
			<mesh
				position={[OFFSET, SURFACE_THICKNESS + 0.001, -halfL + 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={tee}
			>
				<circleGeometry args={[TEE_RADIUS, 16]} />
			</mesh>

			{/* ── Cup marker (black disc, at exit segment, slightly left) ───── */}
			<mesh
				position={[-OFFSET, SURFACE_THICKNESS + 0.001, halfL - 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={cup}
			>
				<circleGeometry args={[CUP_RADIUS, 16]} />
			</mesh>
		</group>
	);
}
