import type { ThreeEvent } from "@react-three/fiber";
import { useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { HOLE_TYPE_MAP } from "../../constants";
import { useStore } from "../../store";
import type { Hole } from "../../types";
import { checkAnyCollision, checkHallBounds } from "../../utils/collision";
import { computeTemplateBounds } from "../../utils/chainCompute";
import { snapToGrid } from "../../utils/snap";
import { HoleModel } from "./holes/HoleModel";
import { MODEL_HEIGHTS, SURFACE_THICKNESS } from "./holes/shared";

type Props = {
	hole: Hole;
	isSelected: boolean;
	onClick: () => void;
};

const INTERACTION_HEIGHT = 0.3;
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

export function MiniGolfHole({ hole, isSelected, onClick }: Props) {
	const definition = HOLE_TYPE_MAP[hole.type];
	const updateHole = useStore((s) => s.updateHole);
	const removeHole = useStore((s) => s.removeHole);
	const hall = useStore((s) => s.hall);
	const tool = useStore((s) => s.ui.tool);
	const snapEnabled = useStore((s) => s.ui.snapEnabled);
	const holes = useStore((s) => s.holes);
	const holeTemplates = useStore((s) => s.holeTemplates);
	const { raycaster } = useThree();
	const [isDragging, setIsDragging] = useState(false);
	const [isHovered, setIsHovered] = useState(false);
	const dragStart = useRef<{ x: number; z: number } | null>(null);
	const pointerStartScreen = useRef<{ x: number; y: number } | null>(null);

	const template = hole.templateId ? holeTemplates[hole.templateId] : null;

	// Derive dimensions from template bounds or legacy definition
	const dimensions = useMemo(() => {
		if (template) {
			return computeTemplateBounds(template);
		}
		if (definition) {
			return definition.dimensions;
		}
		return { width: 1, length: 1 };
	}, [template, definition]);

	if (!definition && !template) return null;

	const { width, length } = dimensions;
	const color = template?.color ?? definition?.color ?? "#4CAF50";
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
		pointerStartScreen.current = {
			x: e.nativeEvent.clientX,
			y: e.nativeEvent.clientY,
		};
		// Don't setIsDragging(true) yet — wait for deadzone
	}

	function handlePointerMove(e: ThreeEvent<PointerEvent>) {
		if (!dragStart.current || !pointerStartScreen.current) return;
		e.stopPropagation();

		// Check deadzone if not yet dragging
		if (!isDragging) {
			const dx = e.nativeEvent.clientX - pointerStartScreen.current.x;
			const dy = e.nativeEvent.clientY - pointerStartScreen.current.y;
			if (Math.hypot(dx, dy) < 10) return;
			// Past deadzone — start dragging
			setIsDragging(true);
			useStore.temporal?.getState()?.pause();
		}

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
				if (h.templateId && holeTemplates[h.templateId]) {
					const bounds = computeTemplateBounds(holeTemplates[h.templateId]);
					obbMap[id] = {
						pos: h.position,
						rot: h.rotation,
						w: bounds.width,
						l: bounds.length,
					};
				} else {
					const def = HOLE_TYPE_MAP[h.type];
					if (!def) continue;
					obbMap[id] = {
						pos: h.position,
						rot: h.rotation,
						w: def.dimensions.width,
						l: def.dimensions.length,
					};
				}
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
		if (!dragStart.current) return;
		e.stopPropagation();
		if (isDragging) {
			useStore.temporal?.getState()?.resume();
		}
		setIsDragging(false);
		dragStart.current = null;
		pointerStartScreen.current = null;
	}

	const showOverlay =
		isDragging || isSelected || (tool === "delete" && isHovered);
	const overlayColor = isDragging
		? "#FFE082"
		: tool === "delete" && isHovered
			? "#EF5350"
			: "#FFC107";
	const modelHeight = MODEL_HEIGHTS[hole.type] ?? SURFACE_THICKNESS + 0.08;

	return (
		<group
			position={[hole.position.x, 0, hole.position.z]}
			rotation={[0, rotationRad, 0]}
		>
			{/* Interaction mesh — always raycastable, tinted overlay when active */}
			{/* biome-ignore lint/a11y/noStaticElementInteractions: R3F mesh element, not HTML */}
			<mesh
				position={[0, INTERACTION_HEIGHT / 2, 0]}
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
				<boxGeometry args={[width, INTERACTION_HEIGHT, length]} />
				<meshStandardMaterial
					color={showOverlay ? overlayColor : "#000000"}
					transparent
					opacity={showOverlay ? 0.35 : 0}
					depthWrite={false}
				/>
			</mesh>

			{/* Visual model */}
			<HoleModel
				type={hole.type}
				width={width}
				length={length}
				color={color}
				templateId={hole.templateId}
			/>

			{/* Selection outline — sized to model height */}
			{isSelected && (
				<lineSegments position={[0, modelHeight / 2, 0]}>
					<edgesGeometry
						args={[
							new THREE.BoxGeometry(
								width + 0.05,
								modelHeight + 0.05,
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
