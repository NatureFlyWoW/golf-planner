import { Line } from "@react-three/drei";
import { useMemo } from "react";
import type { WindowSpec } from "../../../types/hall";
import { computeWindowLines } from "../../../utils/arcPoints";
import { ARCH_WALL_THICKNESS } from "../../../utils/wallGeometry";

const COLORS = {
	planning: "#6699CC",
	uv: "#3300AA",
} as const;

export function WindowSymbol2D({
	window: win,
	hallWidth,
	hallLength,
	uvMode,
}: {
	window: WindowSpec;
	hallWidth: number;
	hallLength: number;
	uvMode: boolean;
}) {
	const { allPoints } = useMemo(() => {
		const { glassLines, breakTicks } = computeWindowLines(
			win,
			hallWidth,
			hallLength,
			ARCH_WALL_THICKNESS,
		);
		// Flatten all line segments into pairs for segments={true} mode
		const pts: [number, number, number][] = [];
		for (const [a, b] of glassLines) {
			pts.push(a, b);
		}
		for (const [a, b] of breakTicks) {
			pts.push(a, b);
		}
		return { allPoints: pts };
	}, [win, hallWidth, hallLength]);

	const color = uvMode ? COLORS.uv : COLORS.planning;

	return (
		<Line
			points={allPoints}
			segments
			lineWidth={1}
			worldUnits={false}
			color={color}
		/>
	);
}
