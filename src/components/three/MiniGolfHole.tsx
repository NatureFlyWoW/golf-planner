import * as THREE from "three";
import { HOLE_TYPE_MAP } from "../../constants";
import type { Hole } from "../../types";

type Props = {
	hole: Hole;
	isSelected: boolean;
	onClick: () => void;
};

const HOLE_HEIGHT = 0.3;

export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
	const definition = HOLE_TYPE_MAP[hole.type];
	if (!definition) return null;

	const { width, length } = definition.dimensions;
	const rotationRad = (hole.rotation * Math.PI) / 180;

	return (
		<group
			position={[hole.position.x, HOLE_HEIGHT / 2, hole.position.z]}
			rotation={[0, rotationRad, 0]}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: R3F mesh element, not HTML */}
			<mesh
				onClick={(e) => {
					e.stopPropagation();
					onClick();
				}}
			>
				<boxGeometry args={[width, HOLE_HEIGHT, length]} />
				<meshStandardMaterial
					color={isSelected ? "#FFC107" : definition.color}
				/>
			</mesh>
			{isSelected && (
				<lineSegments>
					<edgesGeometry
						args={[
							new THREE.BoxGeometry(
								width + 0.05,
								HOLE_HEIGHT + 0.05,
								length + 0.05,
							),
						]}
					/>
					<lineBasicMaterial color="#FF9800" />
				</lineSegments>
			)}
		</group>
	);
}
