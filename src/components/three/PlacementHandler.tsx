import type { ThreeEvent } from "@react-three/fiber";
import { useRef, useState } from "react";
import { HOLE_TYPE_MAP } from "../../constants";
import { useStore } from "../../store";
import { checkAnyCollision, checkHallBounds } from "../../utils/collision";
import { isMobile } from "../../utils/isMobile";
import { snapToGrid } from "../../utils/snap";
import { GhostHole } from "./GhostHole";

const GRID_SIZE = 0.25;

function buildOBBMap(
	holes: Record<
		string,
		{
			position: { x: number; z: number };
			rotation: number;
			type: string;
		}
	>,
) {
	const map: Record<
		string,
		{ pos: { x: number; z: number }; rot: number; w: number; l: number }
	> = {};
	for (const [id, hole] of Object.entries(holes)) {
		const def = HOLE_TYPE_MAP[hole.type];
		if (!def) continue;
		map[id] = {
			pos: hole.position,
			rot: hole.rotation,
			w: def.dimensions.width,
			l: def.dimensions.length,
		};
	}
	return map;
}

export function PlacementHandler() {
	const hall = useStore((s) => s.hall);
	const tool = useStore((s) => s.ui.tool);
	const placingType = useStore((s) => s.ui.placingType);
	const snapEnabled = useStore((s) => s.ui.snapEnabled);
	const holes = useStore((s) => s.holes);
	const addHole = useStore((s) => s.addHole);
	const selectHole = useStore((s) => s.selectHole);

	const [ghostPos, setGhostPos] = useState<{
		x: number;
		z: number;
	} | null>(null);
	const [ghostValid, setGhostValid] = useState(true);

	const pointerDownScreen = useRef<{ x: number; y: number } | null>(null);
	const pointerDownWorld = useRef<{ x: number; z: number } | null>(null);

	const showGhost = tool === "place" && placingType != null;
	const definition = placingType ? HOLE_TYPE_MAP[placingType] : null;

	function computePosition(point: { x: number; z: number }) {
		let x = point.x;
		let z = point.z;

		if (snapEnabled) {
			x = snapToGrid(x, GRID_SIZE);
			z = snapToGrid(z, GRID_SIZE);
		}

		if (definition) {
			x = Math.max(
				definition.dimensions.width / 2,
				Math.min(hall.width - definition.dimensions.width / 2, x),
			);
			z = Math.max(
				definition.dimensions.length / 2,
				Math.min(hall.length - definition.dimensions.length / 2, z),
			);
		}

		return { x, z };
	}

	function checkValidity(pos: { x: number; z: number }) {
		if (!definition || !placingType) return true;
		const { width, length } = definition.dimensions;
		const candidate = { pos, rot: 0, w: width, l: length };
		const inBounds = checkHallBounds(pos, 0, width, length, hall);
		const obbMap = buildOBBMap(holes);
		const collides = checkAnyCollision(candidate, obbMap);
		return inBounds && !collides;
	}

	function handlePointerMove(e: ThreeEvent<PointerEvent>) {
		if (!showGhost) return;
		const pos = computePosition({ x: e.point.x, z: e.point.z });
		setGhostPos(pos);
		setGhostValid(checkValidity(pos));
	}

	function handlePointerDown(e: ThreeEvent<PointerEvent>) {
		if (!showGhost || !isMobile) return;
		const pos = computePosition({ x: e.point.x, z: e.point.z });
		setGhostPos(pos);
		setGhostValid(checkValidity(pos));
		pointerDownScreen.current = {
			x: e.nativeEvent.clientX,
			y: e.nativeEvent.clientY,
		};
		pointerDownWorld.current = pos;
	}

	function handlePointerUp(e: ThreeEvent<PointerEvent>) {
		if (!isMobile) return;

		if (pointerDownScreen.current && pointerDownWorld.current) {
			const dx = e.nativeEvent.clientX - pointerDownScreen.current.x;
			const dy = e.nativeEvent.clientY - pointerDownScreen.current.y;
			const moved = Math.hypot(dx, dy);

			if (moved < 10 && ghostValid && placingType) {
				addHole(placingType, pointerDownWorld.current);
			}
		} else if (tool === "select") {
			selectHole(null);
		}

		pointerDownScreen.current = null;
		pointerDownWorld.current = null;
	}

	function handleClick(e: ThreeEvent<MouseEvent>) {
		e.stopPropagation();

		if (isMobile) return;

		if (tool === "place" && placingType && ghostPos) {
			if (ghostValid) {
				addHole(placingType, ghostPos);
			}
		} else if (tool === "select") {
			selectHole(null);
		}
	}

	return (
		<>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: R3F mesh element, not HTML */}
			<mesh
				rotation={[-Math.PI / 2, 0, 0]}
				position={[hall.width / 2, -0.01, hall.length / 2]}
				onClick={handleClick}
				onPointerMove={handlePointerMove}
				onPointerDown={handlePointerDown}
				onPointerUp={handlePointerUp}
				visible={false}
			>
				<planeGeometry args={[hall.width, hall.length]} />
				<meshBasicMaterial transparent opacity={0} />
			</mesh>
			{showGhost && ghostPos && placingType && (
				<GhostHole
					type={placingType}
					position={ghostPos}
					rotation={0}
					isValid={ghostValid}
				/>
			)}
		</>
	);
}
