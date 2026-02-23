import { Line } from "@react-three/drei";
import { useMemo } from "react";
import type { DoorSpec } from "../../../types/hall";
import { computeDoorArc } from "../../../utils/arcPoints";

const COLORS = {
	planning: "#555555",
	uv: "#3A3A6E",
} as const;

export function DoorSymbol2D({
	door,
	hallWidth,
	hallLength,
	uvMode,
}: {
	door: DoorSpec;
	hallWidth: number;
	hallLength: number;
	uvMode: boolean;
}) {
	const { arcPoints, panelLine } = useMemo(
		() => computeDoorArc(door, hallWidth, hallLength),
		[door, hallWidth, hallLength],
	);

	const color = uvMode ? COLORS.uv : COLORS.planning;

	return (
		<group>
			<Line
				points={arcPoints}
				lineWidth={1.5}
				worldUnits={false}
				color={color}
			/>
			<Line
				points={panelLine}
				lineWidth={1.5}
				worldUnits={false}
				color={color}
			/>
		</group>
	);
}
