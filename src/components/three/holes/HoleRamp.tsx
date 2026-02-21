import { useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import { UV_EMISSIVE_INTENSITY } from "./materialPresets";
import { BumperRail } from "./BumperRail";
import { Cup } from "./Cup";
import { TeePad } from "./TeePad";
import { BUMPER_HEIGHT, BUMPER_THICKNESS, SURFACE_THICKNESS } from "./shared";
import { useMaterials } from "./useMaterials";

const RAMP_HEIGHT = 0.15;
const RAMP_SLOPE_LENGTH = 0.5;
const PLATEAU_LENGTH = 0.4;
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
	const BT = BUMPER_THICKNESS;
	const ST = SURFACE_THICKNESS;

	const entryLength = (length - RAMP_SLOPE_LENGTH * 2 - PLATEAU_LENGTH) / 2;
	const rampUpStartZ = -halfL + entryLength + BT;
	const plateauStartZ = rampUpStartZ + RAMP_SLOPE_LENGTH;
	const rampDownStartZ = plateauStartZ + PLATEAU_LENGTH;
	const plateauCenterZ = plateauStartZ + PLATEAU_LENGTH / 2;

	const rampUpGeo = useMemo(() => {
		const shape = new THREE.Shape();
		shape.moveTo(0, 0);
		shape.lineTo(RAMP_SLOPE_LENGTH, 0);
		shape.lineTo(0, RAMP_HEIGHT);
		shape.closePath();
		return new THREE.ExtrudeGeometry(shape, { depth: laneW, bevelEnabled: false });
	}, [laneW]);

	const rampDownGeo = useMemo(() => {
		const shape = new THREE.Shape();
		shape.moveTo(0, RAMP_HEIGHT);
		shape.lineTo(0, 0);
		shape.lineTo(RAMP_SLOPE_LENGTH, 0);
		shape.closePath();
		return new THREE.ExtrudeGeometry(shape, { depth: laneW, bevelEnabled: false });
	}, [laneW]);

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
			{/* Base felt surface */}
			<mesh position={[0, ST / 2, 0]} material={felt}>
				<boxGeometry args={[laneW, ST, length - BT * 2]} />
			</mesh>

			{/* Ramp slopes + plateau (obstacle geometry unchanged) */}
			<mesh
				castShadow
				geometry={rampUpGeo}
				material={rampMaterial}
				position={[laneW / 2, 0, rampUpStartZ]}
				rotation={[0, -Math.PI / 2, 0]}
			/>
			<mesh castShadow position={[0, RAMP_HEIGHT / 2 + ST, plateauCenterZ]} material={rampMaterial}>
				<boxGeometry args={[laneW, RAMP_HEIGHT, PLATEAU_LENGTH]} />
			</mesh>
			<mesh
				castShadow
				geometry={rampDownGeo}
				material={rampMaterial}
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
