import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { BumperRail } from "./BumperRail";
import { Cup } from "./Cup";
import { TeePad } from "./TeePad";
import { BUMPER_HEIGHT, BUMPER_THICKNESS, SURFACE_THICKNESS } from "./shared";
import { useMaterials } from "./useMaterials";

// ── Ramp Constants ─────────────────────────────────────────
const RAMP_HEIGHT = 0.15;
const RAMP_SLOPE_LENGTH = 0.5;
const PLATEAU_LENGTH = 0.4;
const SIDE_BUMPER_HEIGHT = BUMPER_HEIGHT + RAMP_HEIGHT;
const RAMP_CURVE_SEGMENTS = 16;

export function HoleRamp({
	width,
	length,
	color: _color,
}: {
	width: number;
	length: number;
	color: string;
}) {
	const { felt, bumper, tee, cup } = useMaterials();

	const halfW = width / 2;
	const halfL = length / 2;
	const laneW = width - BUMPER_THICKNESS * 2;
	const BT = BUMPER_THICKNESS;
	const ST = SURFACE_THICKNESS;

	const entryLength = (length - RAMP_SLOPE_LENGTH * 2 - PLATEAU_LENGTH) / 2;
	const rampUpStartZ = -halfL + entryLength + BT;
	const plateauStartZ = rampUpStartZ + RAMP_SLOPE_LENGTH;
	const rampDownStartZ = plateauStartZ + PLATEAU_LENGTH;
	const plateauCenterZ = plateauStartZ + PLATEAU_LENGTH / 2;

	// ── Geometries (bezier curves instead of triangles) ────
	const rampUpGeo = useMemo(() => {
		const shape = new THREE.Shape();
		shape.moveTo(0, 0);
		shape.bezierCurveTo(
			RAMP_SLOPE_LENGTH * 0.5,
			0,
			RAMP_SLOPE_LENGTH * 0.5,
			RAMP_HEIGHT,
			RAMP_SLOPE_LENGTH,
			RAMP_HEIGHT,
		);
		shape.lineTo(RAMP_SLOPE_LENGTH, 0);
		shape.closePath();
		return new THREE.ExtrudeGeometry(shape, {
			depth: laneW,
			bevelEnabled: false,
			curveSegments: RAMP_CURVE_SEGMENTS,
		});
	}, [laneW]);

	const rampDownGeo = useMemo(() => {
		const shape = new THREE.Shape();
		shape.moveTo(0, RAMP_HEIGHT);
		shape.bezierCurveTo(
			RAMP_SLOPE_LENGTH * 0.5,
			RAMP_HEIGHT,
			RAMP_SLOPE_LENGTH * 0.5,
			0,
			RAMP_SLOPE_LENGTH,
			0,
		);
		shape.lineTo(RAMP_SLOPE_LENGTH, 0);
		shape.lineTo(0, 0);
		shape.closePath();
		return new THREE.ExtrudeGeometry(shape, {
			depth: laneW,
			bevelEnabled: false,
			curveSegments: RAMP_CURVE_SEGMENTS,
		});
	}, [laneW]);

	// ── Geometry Disposal ───────────────────────────────────
	useEffect(() => {
		return () => {
			rampUpGeo.dispose();
			rampDownGeo.dispose();
		};
	}, [rampUpGeo, rampDownGeo]);

	return (
		<group>
			{/* Base felt surface */}
			<mesh position={[0, ST / 2, 0]} material={felt}>
				<boxGeometry args={[laneW, ST, length - BT * 2]} />
			</mesh>

			{/* Ramp slopes (bezier curves) + plateau */}
			<mesh
				castShadow
				geometry={rampUpGeo}
				material={felt}
				position={[laneW / 2, 0, rampUpStartZ]}
				rotation={[0, -Math.PI / 2, 0]}
			/>
			<mesh
				castShadow
				position={[0, RAMP_HEIGHT / 2 + ST, plateauCenterZ]}
				material={felt}
			>
				<boxGeometry args={[laneW, RAMP_HEIGHT, PLATEAU_LENGTH]} />
			</mesh>
			<mesh
				castShadow
				geometry={rampDownGeo}
				material={felt}
				position={[laneW / 2, 0, rampDownStartZ]}
				rotation={[0, -Math.PI / 2, 0]}
			/>

			{/* Side bumpers (taller for ramp) */}
			<BumperRail
				length={length}
				position={[-halfW + BT / 2, ST, -halfL]}
				height={SIDE_BUMPER_HEIGHT}
				material={bumper}
			/>
			<BumperRail
				length={length}
				position={[halfW - BT / 2, ST, -halfL]}
				height={SIDE_BUMPER_HEIGHT}
				material={bumper}
			/>
			{/* End bumpers (standard height) */}
			<BumperRail
				length={laneW}
				position={[-laneW / 2, ST, -halfL + BT / 2]}
				rotation={[0, -Math.PI / 2, 0]}
				material={bumper}
			/>
			<BumperRail
				length={laneW}
				position={[-laneW / 2, ST, halfL - BT / 2]}
				rotation={[0, -Math.PI / 2, 0]}
				material={bumper}
			/>

			<TeePad position={[0, 0, -halfL + 0.15]} material={tee} />
			<Cup position={[0, 0, halfL - 0.15]} material={cup} />
		</group>
	);
}
