import type { ThreeEvent } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import { HOLE_TYPE_MAP } from "../../constants";
import {
	isEventForThisViewport,
	useViewportInfo,
} from "../../contexts/ViewportContext";
import { useStore } from "../../store";
import type { HoleTemplate } from "../../types/template";
import { computeTemplateBounds } from "../../utils/chainCompute";
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
			templateId?: string;
		}
	>,
	templates: Record<string, HoleTemplate>,
) {
	const map: Record<
		string,
		{ pos: { x: number; z: number }; rot: number; w: number; l: number }
	> = {};
	for (const [id, hole] of Object.entries(holes)) {
		if (hole.templateId && templates[hole.templateId]) {
			const bounds = computeTemplateBounds(templates[hole.templateId]);
			map[id] = {
				pos: hole.position,
				rot: hole.rotation,
				w: bounds.width,
				l: bounds.length,
			};
		} else {
			const def = HOLE_TYPE_MAP[hole.type];
			if (!def) continue;
			map[id] = {
				pos: hole.position,
				rot: hole.rotation,
				w: def.dimensions.width,
				l: def.dimensions.length,
			};
		}
	}
	return map;
}

export function PlacementHandler() {
	const hall = useStore((s) => s.hall);
	const tool = useStore((s) => s.ui.tool);
	const placingType = useStore((s) => s.ui.placingType);
	const placingTemplateId = useStore((s) => s.ui.placingTemplateId);
	const snapEnabled = useStore((s) => s.ui.snapEnabled);
	const holes = useStore((s) => s.holes);
	const holeTemplates = useStore((s) => s.holeTemplates);
	const addHole = useStore((s) => s.addHole);
	const selectHole = useStore((s) => s.selectHole);

	const [ghostPos, setGhostPos] = useState<{
		x: number;
		z: number;
	} | null>(null);
	const [ghostValid, setGhostValid] = useState(true);

	const pointerDownScreen = useRef<{ x: number; y: number } | null>(null);
	const pointerDownWorld = useRef<{ x: number; z: number } | null>(null);
	const viewportInfo = useViewportInfo();

	const isPlacing =
		tool === "place" && (placingType != null || placingTemplateId != null);

	// Derive dimensions for placement boundary clamping and collision
	const placingDimensions = useMemo(() => {
		if (placingTemplateId) {
			const template = holeTemplates[placingTemplateId];
			if (template) return computeTemplateBounds(template);
		}
		if (placingType) {
			const def = HOLE_TYPE_MAP[placingType];
			if (def) return def.dimensions;
		}
		return null;
	}, [placingType, placingTemplateId, holeTemplates]);

	function computePosition(point: { x: number; z: number }) {
		let x = point.x;
		let z = point.z;

		if (snapEnabled) {
			x = snapToGrid(x, GRID_SIZE);
			z = snapToGrid(z, GRID_SIZE);
		}

		if (placingDimensions) {
			x = Math.max(
				placingDimensions.width / 2,
				Math.min(hall.width - placingDimensions.width / 2, x),
			);
			z = Math.max(
				placingDimensions.length / 2,
				Math.min(hall.length - placingDimensions.length / 2, z),
			);
		}

		return { x, z };
	}

	function checkValidity(pos: { x: number; z: number }) {
		if (!placingDimensions) return true;
		const { width, length } = placingDimensions;
		const candidate = { pos, rot: 0, w: width, l: length };
		const inBounds = checkHallBounds(pos, 0, width, length, hall);
		const obbMap = buildOBBMap(holes, holeTemplates);
		const collides = checkAnyCollision(candidate, obbMap);
		return inBounds && !collides;
	}

	function handlePointerMove(e: ThreeEvent<PointerEvent>) {
		if (!isPlacing) return;
		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
		const pos = computePosition({ x: e.point.x, z: e.point.z });
		setGhostPos(pos);
		setGhostValid(checkValidity(pos));
	}

	function handlePointerDown(e: ThreeEvent<PointerEvent>) {
		if (!isPlacing || !isMobile) return;
		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
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
		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;

		if (pointerDownScreen.current && pointerDownWorld.current) {
			const dx = e.nativeEvent.clientX - pointerDownScreen.current.x;
			const dy = e.nativeEvent.clientY - pointerDownScreen.current.y;
			const moved = Math.hypot(dx, dy);

			if (moved < 10 && ghostValid) {
				if (placingTemplateId) {
					addHole("straight", pointerDownWorld.current, placingTemplateId);
				} else if (placingType) {
					addHole(placingType, pointerDownWorld.current);
				}
			}
		} else if (tool === "select") {
			selectHole(null);
		}

		pointerDownScreen.current = null;
		pointerDownWorld.current = null;
	}

	function handleClick(e: ThreeEvent<MouseEvent>) {
		if (viewportInfo && !isEventForThisViewport(e, viewportInfo)) return;
		e.stopPropagation();

		if (isMobile) return;

		if (tool === "place" && ghostPos) {
			if (ghostValid) {
				if (placingTemplateId) {
					addHole("straight", ghostPos, placingTemplateId);
				} else if (placingType) {
					addHole(placingType, ghostPos);
				}
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
			{isPlacing &&
				ghostPos &&
				(placingType != null || placingTemplateId != null) && (
					<GhostHole
						type={placingType ?? "straight"}
						position={ghostPos}
						rotation={0}
						isValid={ghostValid}
						templateId={placingTemplateId ?? undefined}
					/>
				)}
		</>
	);
}
