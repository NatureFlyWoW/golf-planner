import type { ThreeEvent } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { HOLE_TYPE_MAP } from "../../constants";
import { useStore } from "../../store";
import type { Hole } from "../../types";

type Props = {
	hole: Hole;
	isSelected: boolean;
	onClick: () => void;
};

const HOLE_HEIGHT = 0.3;
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
	const definition = HOLE_TYPE_MAP[hole.type];
	const updateHole = useStore((s) => s.updateHole);
	const removeHole = useStore((s) => s.removeHole);
	const hall = useStore((s) => s.hall);
	const tool = useStore((s) => s.ui.tool);
	const { raycaster } = useThree();
	const [isDragging, setIsDragging] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const dragStart = useRef<{ x: number; z: number } | null>(null);

	if (!definition) return null;

	const { width, length } = definition.dimensions;
	const rotationRad = (hole.rotation * Math.PI) / 180;

	function handlePointerDown(e: ThreeEvent<PointerEvent>) {
		if (tool !== "select" || !isSelected) return;
		e.stopPropagation();
		e.nativeEvent.target &&
			"setPointerCapture" in (e.nativeEvent.target as Element) &&
			(e.nativeEvent.target as Element).setPointerCapture(
				e.nativeEvent.pointerId,
			);
		dragStart.current = { x: hole.position.x, z: hole.position.z };
		setIsDragging(true);
	}

	function handlePointerMove(e: ThreeEvent<PointerEvent>) {
		if (!isDragging || !dragStart.current) return;
		e.stopPropagation();

		const intersection = new THREE.Vector3();
		raycaster.ray.intersectPlane(floorPlane, intersection);

		if (intersection) {
			const x = Math.max(
				width / 2,
				Math.min(hall.width - width / 2, intersection.x),
			);
			const z = Math.max(
				length / 2,
				Math.min(hall.length - length / 2, intersection.z),
			);
			updateHole(hole.id, { position: { x, z } });
		}
	}

	function handlePointerUp(e: ThreeEvent<PointerEvent>) {
		if (!isDragging) return;
		e.stopPropagation();
		setIsDragging(false);
		dragStart.current = null;
	}

	return (
		<group
			position={[hole.position.x, HOLE_HEIGHT / 2, hole.position.z]}
			rotation={[0, rotationRad, 0]}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: R3F mesh element, not HTML */}
			<mesh
				onClick={(e) => {
					e.stopPropagation();
					if (tool === "delete") {
						removeHole(hole.id);
					} else {
						onClick();
					}
				}}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
				onPointerEnter={() => setIsHovered(true)}
				onPointerLeave={() => setIsHovered(false)}
			>
				<boxGeometry args={[width, HOLE_HEIGHT, length]} />
				<meshStandardMaterial
					color={
						isDragging
							? "#FFE082"
							: tool === "delete" && isHovered
								? "#EF5350"
								: isSelected
									? "#FFC107"
									: definition.color
					}
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
