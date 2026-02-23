import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import { useGroupOpacity } from "../../../hooks/useGroupOpacity";
import { useStore } from "../../../store";
import type { Wall } from "../../../types/hall";
import {
	ARCH_WALL_THICKNESS,
	type WallRect,
	computeWallSegments,
	wallSegmentToRect,
} from "../../../utils/wallGeometry";
const WALLS: Wall[] = ["north", "south", "east", "west"];

const COLORS = {
	planning: { fill: "#3a3a3a", outline: "#222222" },
	uv: { fill: "#1A1A2E", outline: "#2A2A5E" },
} as const;

function rectToOutlineSegments(rect: WallRect): [number, number, number][] {
	const [cx, cy, cz] = rect.position;
	const [w, d] = rect.size;
	const hw = w / 2;
	const hd = d / 2;

	const p0: [number, number, number] = [cx - hw, cy, cz - hd];
	const p1: [number, number, number] = [cx + hw, cy, cz - hd];
	const p2: [number, number, number] = [cx + hw, cy, cz + hd];
	const p3: [number, number, number] = [cx - hw, cy, cz + hd];

	// 4 line segments as pairs for segments={true} mode
	return [p0, p1, p1, p2, p2, p3, p3, p0];
}

const noRaycast = () => {};

export function ArchitecturalWalls2D({
	outlineOnly = false,
}: {
	outlineOnly?: boolean;
}) {
	const groupRef = useRef<Group>(null);
	const { width, length, doors, windows } = useStore((s) => s.hall);
	const uvMode = useStore((s) => s.ui.uvMode);
	const wallsLayer = useStore((s) => s.ui.layers.walls);

	const colors = uvMode ? COLORS.uv : COLORS.planning;

	const { rects, outlinePoints } = useMemo(() => {
		const allRects: WallRect[] = [];
		const allOutlinePoints: [number, number, number][] = [];

		for (const wallSide of WALLS) {
			const segments = computeWallSegments(
				wallSide,
				width,
				length,
				doors,
				windows,
			);
			for (const seg of segments) {
				const rect = wallSegmentToRect(
					seg,
					wallSide,
					ARCH_WALL_THICKNESS,
					width,
					length,
				);
				allRects.push(rect);
				allOutlinePoints.push(...rectToOutlineSegments(rect));
			}
		}

		return { rects: allRects, outlinePoints: allOutlinePoints };
	}, [width, length, doors, windows]);

	useGroupOpacity(groupRef, wallsLayer.opacity);

	if (!wallsLayer.visible) return null;

	return (
		<group ref={groupRef} name="architectural-walls-2d">
			{!outlineOnly &&
				rects.map((rect, i) => (
					<mesh
						key={`wall-fill-${
							// biome-ignore lint/suspicious/noArrayIndexKey: stable order from deterministic computation
							i
						}`}
						position={rect.position}
						rotation={[-Math.PI / 2, 0, 0]}
						raycast={noRaycast}
					>
						<planeGeometry args={[rect.size[0], rect.size[1]]} />
						<meshBasicMaterial color={colors.fill} />
					</mesh>
				))}
			{outlinePoints.length > 0 && (
				<Line
					points={outlinePoints}
					segments
					lineWidth={2}
					worldUnits={false}
					color={colors.outline}
				/>
			)}
		</group>
	);
}
