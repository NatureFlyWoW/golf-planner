import { useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import { UV_EMISSIVE_INTENSITY } from "./materialPresets";
import {
	BUMPER_HEIGHT,
	BUMPER_THICKNESS,
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
} from "./shared";
import { useMaterials } from "./useMaterials";

const RAMP_HEIGHT = 0.15;
const RAMP_SLOPE_LENGTH = 0.5;
const PLATEAU_LENGTH = 0.4;

// Tall bumper height used on the sides to contain the ball over the ramp peak.
const SIDE_BUMPER_HEIGHT = BUMPER_HEIGHT + RAMP_HEIGHT;

export function HoleRamp({
	width,
	length,
	color,
}: {
	width: number;
	length: number;
	color: string;
}) {
	const { felt, bumper, tee, cup } = useMaterials();
	const uvMode = useStore((s) => s.ui.uvMode);

	const halfW = width / 2;
	const halfL = length / 2;
	const laneW = width - BUMPER_THICKNESS * 2;

	// ── Zone Z boundaries (all relative to model center) ──────────────────────
	// Layout along Z: [back bumper] [entry flat] [ramp up] [plateau] [ramp down] [exit flat] [front bumper]
	// entryLength = exitLength (symmetric)
	const entryLength = (length - RAMP_SLOPE_LENGTH * 2 - PLATEAU_LENGTH) / 2;

	// rampUpStartZ: where the slope begins, measured from center.
	// We add BUMPER_THICKNESS to clear the back wall.
	const rampUpStartZ = -halfL + entryLength + BUMPER_THICKNESS;
	const plateauStartZ = rampUpStartZ + RAMP_SLOPE_LENGTH;
	const rampDownStartZ = plateauStartZ + PLATEAU_LENGTH;

	const plateauCenterZ = plateauStartZ + PLATEAU_LENGTH / 2;

	// ── Ramp slope geometry (ExtrudeGeometry in XY plane, extruded along +Z) ──
	// Triangle cross-section: right-angle at origin, base RAMP_SLOPE_LENGTH along +X,
	// height RAMP_HEIGHT along +Y.  After rotation=[0, -PI/2, 0]:
	//   original +X  →  model +Z   (base runs along length direction)
	//   original +Y  →  model +Y   (height stays up)
	//   original +Z  →  model -X   (extrusion depth spans -X direction)
	// We offset the mesh by +laneW/2 in X so the extrusion is centred.
	const rampUpGeo = useMemo(() => {
		const shape = new THREE.Shape();
		shape.moveTo(0, 0);
		shape.lineTo(RAMP_SLOPE_LENGTH, 0);
		shape.lineTo(0, RAMP_HEIGHT);
		shape.closePath();
		return new THREE.ExtrudeGeometry(shape, {
			depth: laneW,
			bevelEnabled: false,
		});
	}, [laneW]);

	// Ramp-down cross-section: the HIGH end is at local X=0 and the LOW end is at
	// X=RAMP_SLOPE_LENGTH, so that after rotation=[0, -PI/2, 0] the high end sits
	// at model Z=rampDownStartZ (coming from the plateau) and the low end exits
	// at +Z (descending back to floor level).
	// Triangle: origin at (0, RAMP_HEIGHT), corners at (0,0) and (RAMP_SLOPE_LENGTH,0).
	const rampDownGeo = useMemo(() => {
		const shape = new THREE.Shape();
		shape.moveTo(0, RAMP_HEIGHT);
		shape.lineTo(0, 0);
		shape.lineTo(RAMP_SLOPE_LENGTH, 0);
		shape.closePath();
		return new THREE.ExtrudeGeometry(shape, {
			depth: laneW,
			bevelEnabled: false,
		});
	}, [laneW]);

	// Coloured felt material for the ramp surfaces.
	const rampMaterial = useMemo(
		() =>
			new THREE.MeshStandardMaterial(
				uvMode
					? {
							color: "#1A001A",
							emissive: "#FF00FF",
							emissiveIntensity: UV_EMISSIVE_INTENSITY,
							roughness: 0.7,
							metalness: 0,
						}
					: { color, roughness: 0.7, metalness: 0 },
			),
		[color, uvMode],
	);

	return (
		<group>
			{/* ── Base flat felt surface (spans full lane, sits under ramp) ── */}
			<mesh position={[0, SURFACE_THICKNESS / 2, 0]} material={felt}>
				<boxGeometry
					args={[laneW, SURFACE_THICKNESS, length - BUMPER_THICKNESS * 2]}
				/>
			</mesh>

			{/* ── Ramp up slope ───────────────────────────────────────────── */}
			{/*
				rotation=[0, -PI/2, 0]: original +X → model +Z, extrusion → model -X.
				X offset +laneW/2 re-centres the extruded slab over X=0.
				The shape origin (0,0) maps to world (laneW/2, 0, rampUpStartZ) so the
				slope rises from rampUpStartZ to rampUpStartZ+RAMP_SLOPE_LENGTH.
			*/}
			<mesh
				castShadow
				geometry={rampUpGeo}
				material={rampMaterial}
				position={[laneW / 2, 0, rampUpStartZ]}
				rotation={[0, -Math.PI / 2, 0]}
			/>

			{/* ── Plateau ─────────────────────────────────────────────────── */}
			<mesh
				castShadow
				position={[0, RAMP_HEIGHT / 2 + SURFACE_THICKNESS, plateauCenterZ]}
				material={rampMaterial}
			>
				<boxGeometry args={[laneW, RAMP_HEIGHT, PLATEAU_LENGTH]} />
			</mesh>

			{/* ── Ramp down slope ─────────────────────────────────────────── */}
			{/*
				Same rotation. The triangle starts HIGH at local X=0 (→ model Z=rampDownStartZ)
				and descends to floor at local X=RAMP_SLOPE_LENGTH (→ model Z=rampDownStartZ+RAMP_SLOPE_LENGTH).
			*/}
			<mesh
				castShadow
				geometry={rampDownGeo}
				material={rampMaterial}
				position={[laneW / 2, 0, rampDownStartZ]}
				rotation={[0, -Math.PI / 2, 0]}
			/>

			{/* ── Side bumpers (taller to contain ball over ramp) ─────────── */}
			{/* Left bumper */}
			<mesh
				castShadow
				position={[
					-halfW + BUMPER_THICKNESS / 2,
					SURFACE_THICKNESS + SIDE_BUMPER_HEIGHT / 2,
					0,
				]}
				material={bumper}
			>
				<boxGeometry args={[BUMPER_THICKNESS, SIDE_BUMPER_HEIGHT, length]} />
			</mesh>

			{/* Right bumper */}
			<mesh
				castShadow
				position={[
					halfW - BUMPER_THICKNESS / 2,
					SURFACE_THICKNESS + SIDE_BUMPER_HEIGHT / 2,
					0,
				]}
				material={bumper}
			>
				<boxGeometry args={[BUMPER_THICKNESS, SIDE_BUMPER_HEIGHT, length]} />
			</mesh>

			{/* Back bumper (-Z, tee end) */}
			<mesh
				castShadow
				position={[
					0,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					-halfL + BUMPER_THICKNESS / 2,
				]}
				material={bumper}
			>
				<boxGeometry args={[laneW, BUMPER_HEIGHT, BUMPER_THICKNESS]} />
			</mesh>

			{/* Front bumper (+Z, cup end) */}
			<mesh
				castShadow
				position={[
					0,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					halfL - BUMPER_THICKNESS / 2,
				]}
				material={bumper}
			>
				<boxGeometry args={[laneW, BUMPER_HEIGHT, BUMPER_THICKNESS]} />
			</mesh>

			{/* ── Tee marker (yellow, at -Z end) ──────────────────────────── */}
			<mesh
				position={[0, SURFACE_THICKNESS + 0.001, -halfL + 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={tee}
			>
				<circleGeometry args={[TEE_RADIUS, 16]} />
			</mesh>

			{/* ── Cup marker (black, at +Z end) ────────────────────────────── */}
			<mesh
				position={[0, SURFACE_THICKNESS + 0.001, halfL - 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={cup}
			>
				<circleGeometry args={[CUP_RADIUS, 16]} />
			</mesh>
		</group>
	);
}
