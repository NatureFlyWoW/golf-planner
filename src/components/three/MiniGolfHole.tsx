import type { ThreeEvent } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { useRef, useState } from "react";
import * as THREE from "three";
import { HOLE_TYPE_MAP } from "../../constants";
import { useStore } from "../../store";
import type { Hole } from "../../types";
import { checkAnyCollision, checkHallBounds } from "../../utils/collision";
import { snapToGrid } from "../../utils/snap";

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
	const snapEnabled = useStore((s) => s.ui.snapEnabled);
	const holes = useStore((s) => s.holes);
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
		useStore.temporal?.getState()?.pause();
	}

	function handlePointerMove(e: ThreeEvent<PointerEvent>) {
		if (!isDragging || !dragStart.current) return;
		e.stopPropagation();

		const intersection = new THREE.Vector3();
		raycaster.ray.intersectPlane(floorPlane, intersection);

		if (intersection) {
			let x = intersection.x;
			let z = intersection.z;

			if (snapEnabled) {
				x = snapToGrid(x, 0.25);
				z = snapToGrid(z, 0.25);
			}

			x = Math.max(width / 2, Math.min(hall.width - width / 2, x));
			z = Math.max(length / 2, Math.min(hall.length - length / 2, z));

			const inBounds = checkHallBounds(
				{ x, z },
				hole.rotation,
				width,
				length,
				hall,
			);
			const obbMap: Record<
				string,
				{
					pos: { x: number; z: number };
					rot: number;
					w: number;
					l: number;
				}
			> = {};
			for (const [id, h] of Object.entries(holes)) {
				const def = HOLE_TYPE_MAP[h.type];
				if (!def) continue;
				obbMap[id] = {
					pos: h.position,
					rot: h.rotation,
					w: def.dimensions.width,
					l: def.dimensions.length,
				};
			}
			const collides = checkAnyCollision(
				{ pos: { x, z }, rot: hole.rotation, w: width, l: length },
				obbMap,
				hole.id,
			);

			if (inBounds && !collides) {
				updateHole(hole.id, { position: { x, z } });
			}
		}
	}

	function handlePointerUp(e: ThreeEvent<PointerEvent>) {
		if (!isDragging) return;
		e.stopPropagation();
		setIsDragging(false);
		dragStart.current = null;
		useStore.temporal?.getState()?.resume();
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
