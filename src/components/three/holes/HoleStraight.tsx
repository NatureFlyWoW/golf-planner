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

type Props = { width: number; length: number };

export function HoleStraight({ width, length }: Props) {
	const halfW = width / 2;
	const halfL = length / 2;
	const laneW = width - BUMPER_THICKNESS * 2;
	const laneL = length - BUMPER_THICKNESS * 2;

	return (
		<group>
			{/* Green felt surface */}
			<mesh position={[0, SURFACE_THICKNESS / 2, 0]} material={feltMaterial}>
				<boxGeometry args={[laneW, SURFACE_THICKNESS, laneL]} />
			</mesh>

			{/* Left bumper */}
			<mesh
				position={[
					-halfW + BUMPER_THICKNESS / 2,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					0,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[BUMPER_THICKNESS, BUMPER_HEIGHT, length]} />
			</mesh>

			{/* Right bumper */}
			<mesh
				position={[
					halfW - BUMPER_THICKNESS / 2,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					0,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[BUMPER_THICKNESS, BUMPER_HEIGHT, length]} />
			</mesh>

			{/* Back bumper (-Z) */}
			<mesh
				position={[
					0,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					-halfL + BUMPER_THICKNESS / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[laneW, BUMPER_HEIGHT, BUMPER_THICKNESS]} />
			</mesh>

			{/* Front bumper (+Z) */}
			<mesh
				position={[
					0,
					SURFACE_THICKNESS + BUMPER_HEIGHT / 2,
					halfL - BUMPER_THICKNESS / 2,
				]}
				material={bumperMaterial}
			>
				<boxGeometry args={[laneW, BUMPER_HEIGHT, BUMPER_THICKNESS]} />
			</mesh>

			{/* Tee marker (yellow circle, tee end at -Z) */}
			<mesh
				position={[0, SURFACE_THICKNESS + 0.001, -halfL + 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={teeMaterial}
			>
				<circleGeometry args={[TEE_RADIUS, 16]} />
			</mesh>

			{/* Cup (black circle, cup end at +Z) */}
			<mesh
				position={[0, SURFACE_THICKNESS + 0.001, halfL - 0.15]}
				rotation={[-Math.PI / 2, 0, 0]}
				material={cupMaterial}
			>
				<circleGeometry args={[CUP_RADIUS, 16]} />
			</mesh>
		</group>
	);
}
