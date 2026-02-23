import { Line, Text } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import type { Group } from "three";
import { useGroupOpacity } from "../../../hooks/useGroupOpacity";
import { useStore } from "../../../store";
import {
	computeGridLabelPositions,
	computeGridLineSegments,
	computeGridSpacing,
} from "../../../utils/gridSpacing";

const COLORS = {
	planning: { major: "#cccccc", minor: "#eeeeee", label: "#999999" },
	uv: { major: "#2A2A5E", minor: "#1A1A4E", label: "#4A4A8E" },
};

const LABEL_FONT_SIZE = 0.3;
/** Label scale = DEFAULT_ZOOM / currentZoom — keeps labels ~constant screen size */
const DEFAULT_ZOOM = 40;
const noRaycast = () => {};

/**
 * Custom architectural grid for the 2D viewport with labeled coordinates
 * and adaptive spacing based on camera zoom level.
 * Replaces the drei <Grid> which continues to render in the 3D viewport.
 */
export function ArchitecturalGrid2D() {
	const groupRef = useRef<Group>(null);
	const labelsRef = useRef<Group>(null);
	const gridLayer = useStore((s) => s.ui.layers.grid);
	const uvMode = useStore((s) => s.ui.uvMode);
	const hallWidth = useStore((s) => s.hallWidth);
	const hallLength = useStore((s) => s.hallLength);

	useGroupOpacity(groupRef, gridLayer.opacity);

	// Track zoom band for adaptive spacing (only re-render at thresholds)
	const [zoomBand, setZoomBand] = useState<"far" | "medium" | "close">(
		"medium",
	);
	const lastBandRef = useRef(zoomBand);

	useFrame(({ camera }) => {
		if (!("zoom" in camera)) return;
		const zoom = (camera as { zoom: number }).zoom;

		// Update zoom band for grid density
		let band: "far" | "medium" | "close";
		if (zoom < 10) band = "far";
		else if (zoom <= 30) band = "medium";
		else band = "close";
		if (band !== lastBandRef.current) {
			lastBandRef.current = band;
			setZoomBand(band);
		}

		// Imperatively scale labels for constant screen size
		if (labelsRef.current) {
			const scale = DEFAULT_ZOOM / zoom;
			for (const child of labelsRef.current.children) {
				child.scale.setScalar(scale);
			}
		}
	});

	const { camera } = useThree();
	const currentZoom = "zoom" in camera ? (camera as { zoom: number }).zoom : 40;
	// eslint-disable-next-line react-hooks/exhaustive-deps -- zoomBand triggers recalc
	const spacing = useMemo(() => computeGridSpacing(currentZoom), [zoomBand]);

	const majorPoints = useMemo(
		() => computeGridLineSegments(hallWidth, hallLength, spacing.majorSpacing),
		[hallWidth, hallLength, spacing.majorSpacing],
	);

	const minorPoints = useMemo(() => {
		if (!spacing.minorSpacing) return null;
		const allMinor = computeGridLineSegments(
			hallWidth,
			hallLength,
			spacing.minorSpacing,
		);
		// Filter out lines that coincide with major lines
		const majorSet = new Set<string>();
		for (let i = 0; i < majorPoints.length; i += 2) {
			const p = majorPoints[i];
			majorSet.add(`${p[0]},${p[2]}`);
		}
		const filtered: Array<[number, number, number]> = [];
		for (let i = 0; i < allMinor.length; i += 2) {
			const key = `${allMinor[i][0]},${allMinor[i][2]}`;
			if (!majorSet.has(key)) {
				filtered.push(allMinor[i], allMinor[i + 1]);
			}
		}
		return filtered;
	}, [hallWidth, hallLength, spacing.minorSpacing, majorPoints]);

	const xLabels = useMemo(
		() => computeGridLabelPositions("x", hallWidth, spacing.majorSpacing),
		[hallWidth, spacing.majorSpacing],
	);

	const zLabels = useMemo(
		() => computeGridLabelPositions("z", hallLength, spacing.majorSpacing),
		[hallLength, spacing.majorSpacing],
	);

	if (!gridLayer.visible) return null;

	const colors = uvMode ? COLORS.uv : COLORS.planning;

	return (
		<group ref={groupRef} name="architectural-grid-2d">
			{majorPoints.length > 0 && (
				<Line
					points={majorPoints}
					segments
					color={colors.major}
					lineWidth={0.5}
					worldUnits={false}
				/>
			)}

			{minorPoints && minorPoints.length > 0 && (
				<Line
					points={minorPoints}
					segments
					color={colors.minor}
					lineWidth={0.3}
					worldUnits={false}
				/>
			)}

			{/* Labels at world positions; scale set imperatively in useFrame */}
			<group ref={labelsRef}>
				{xLabels.map((label) => (
					<Text
						key={`x-${label.value}`}
						position={label.position}
						fontSize={LABEL_FONT_SIZE}
						color={colors.label}
						anchorX="center"
						anchorY="middle"
						raycast={noRaycast}
					>
						{String(label.value)}
					</Text>
				))}
				{zLabels.map((label) => (
					<Text
						key={`z-${label.value}`}
						position={label.position}
						fontSize={LABEL_FONT_SIZE}
						color={colors.label}
						anchorX="center"
						anchorY="middle"
						raycast={noRaycast}
					>
						{String(label.value)}
					</Text>
				))}
			</group>
		</group>
	);
}
