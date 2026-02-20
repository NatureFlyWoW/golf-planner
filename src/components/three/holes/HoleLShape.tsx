import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	bumperMaterial,
	CUP_RADIUS,
	cupMaterial,
	feltMaterial,
	SURFACE_THICKNESS,
	TEE_RADIUS,
	teeMaterial,
} from "./shared";

// Lane width is fixed regardless of overall bounding box dimensions.
const LANE_WIDTH = 0.5;

type Props = { width: number; length: number };

/**
 * L-Shape mini golf hole.
 *
 * Bounding box: width (X) × length (Z), centered at origin.
 * Ball path: enters from -Z (tee), travels north along the right-side
 * entry lane, turns left at the top-right corner, then exits west
 * along the top exit lane toward -X (cup).
 *
 * Layout (top-down, +Z = top, +X = right):
 *
 *   ┌──────────────────┬───┐   ← +halfL (+Z)
 *   │   exit lane      │   │
 *   │   (going -X)     │ T │
 *   │                  │ u │
 *   ╠══════════════════╡ r │
 *   │   (void)         │ n │
 *   │                  │   │
 *   │                  │   │
 *   │                  │   │
 *   └──────────────────┴───┘   ← -halfL (-Z)
 *   ↑ -halfW (-X)      ↑ +halfW (+X)
 *
 * Felt surfaces use three non-overlapping rectangles:
 *   1. Entry lane  — right column, full height
 *   2. Exit lane   — top strip, left portion only (avoids double-covering turn)
 */
export function HoleLShape({ width, length }: Props) {
	const halfW = width / 2; // +X edge
	const halfL = length / 2; // +Z edge
	const BT = BUMPER_THICKNESS;
	const BH = BUMPER_HEIGHT;
	const ST = SURFACE_THICKNESS;
	const surfaceY = ST / 2;
	const bumperY = ST + BH / 2;

	// ── Entry lane geometry (right column) ──────────────────────────────────
	// X: from (halfW - LANE_WIDTH) to halfW, centered at entryLaneCX
	const entryLaneCX = halfW - LANE_WIDTH / 2; // center X of entry lane
	const innerEdgeX = halfW - LANE_WIDTH; // inner (left) edge of entry lane = +X - 0.5

	// ── Exit lane geometry (top strip, left portion) ─────────────────────────
	// Z: from (halfL - LANE_WIDTH) to halfL, centered at exitLaneCZ
	const exitLaneCZ = halfL - LANE_WIDTH / 2; // center Z of exit lane
	const innerEdgeZ = halfL - LANE_WIDTH; // inner (bottom) edge of exit lane = +Z - 0.5

	// Exit lane felt covers: X from -halfW to innerEdgeX, Z = exit strip
	// (the turn square at top-right is already covered by the entry lane felt)
	const exitFeltW = innerEdgeX - -halfW; // width of exit felt (excludes turn square)
	const exitFeltCX = -halfW + exitFeltW / 2; // center X of exit felt

	// ── Bumper wall helpers ──────────────────────────────────────────────────
	// Common Y values reused throughout.

	return (
		<group>
			{/* ── Felt surfaces ─────────────────────────────────────────── */}

			{/* 1. Entry lane: right column, full bounding-box height */}
			<mesh position={[entryLaneCX, surfaceY, 0]} material={feltMaterial}>
				<boxGeometry args={[LANE_WIDTH, ST, length]} />
			</mesh>

			{/* 2. Exit lane: top strip, left portion (excludes turn square) */}
			<mesh
				position={[exitFeltCX, surfaceY, exitLaneCZ]}
				material={feltMaterial}
			>
				<boxGeometry args={[exitFeltW, ST, LANE_WIDTH]} />
			</mesh>

			{/* ── Bumper walls ──────────────────────────────────────────── */}

			{/* Right wall — full bounding-box height, right edge */}
			<mesh position={[halfW - BT / 2, bumperY, 0]} material={bumperMaterial}>
				<boxGeometry args={[BT, BH, length]} />
			</mesh>

			{/* Bottom wall — closes the entry lane at -Z */}
			<mesh
				position={[entryLaneCX, bumperY, -halfL + BT / 2]}
				material={bumperMaterial}
			>
				<boxGeometry args={[LANE_WIDTH, BH, BT]} />
			</mesh>

			{/* Top wall — full bounding-box width, +Z edge */}
			<mesh position={[0, bumperY, halfL - BT / 2]} material={bumperMaterial}>
				<boxGeometry args={[width, BH, BT]} />
			</mesh>

			{/* Left wall — only the exit lane section, -X edge */}
			<mesh
				position={[-halfW + BT / 2, bumperY, exitLaneCZ]}
				material={bumperMaterial}
			>
				<boxGeometry args={[BT, BH, LANE_WIDTH]} />
			</mesh>

			{/* Inner bottom of exit lane — horizontal segment from -X to inner corner */}
			{/* Runs from -halfW to innerEdgeX at Z = innerEdgeZ */}
			<mesh
				position={[exitFeltCX, bumperY, innerEdgeZ + BT / 2]}
				material={bumperMaterial}
			>
				<boxGeometry args={[exitFeltW, BH, BT]} />
			</mesh>

			{/* Inner right of entry lane — vertical segment from -Z to inner corner */}
			{/* Runs from -halfL to innerEdgeZ at X = innerEdgeX */}
			<mesh
				position={[innerEdgeX - BT / 2, bumperY, (-halfL + innerEdgeZ) / 2]}
				material={bumperMaterial}
			>
				<boxGeometry args={[BT, BH, innerEdgeZ - -halfL]} />
			</mesh>

			{/* ── Tee marker ────────────────────────────────────────────── */}
			{/* Yellow circle in the entry lane near the bottom (-Z) */}
			<mesh
				position={[entryLaneCX, ST + 0.001, -halfL + 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={teeMaterial}
			>
				<circleGeometry args={[TEE_RADIUS, 16]} />
			</mesh>

			{/* ── Cup marker ────────────────────────────────────────────── */}
			{/* Black circle in the exit lane near the left end (-X) */}
			<mesh
				position={[-halfW + 0.15, ST + 0.001, exitLaneCZ]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={cupMaterial}
			>
				<circleGeometry args={[CUP_RADIUS, 16]} />
			</mesh>
		</group>
	);
}
