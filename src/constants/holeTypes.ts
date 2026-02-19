import type { HoleTypeDefinition } from "../types";

export const HOLE_TYPES: HoleTypeDefinition[] = [
	{
		type: "straight",
		label: "Straight",
		dimensions: { width: 0.6, length: 3.0 },
		color: "#4CAF50",
		defaultPar: 2,
	},
	{
		type: "l-shape",
		label: "L-Shape",
		dimensions: { width: 1.2, length: 2.5 },
		color: "#2196F3",
		defaultPar: 3,
	},
	{
		type: "dogleg",
		label: "Dogleg",
		dimensions: { width: 1.5, length: 3.3 },
		color: "#FF9800",
		defaultPar: 3,
	},
	{
		type: "ramp",
		label: "Ramp",
		dimensions: { width: 0.6, length: 3.0 },
		color: "#9C27B0",
		defaultPar: 3,
	},
	{
		type: "loop",
		label: "Loop",
		dimensions: { width: 1.8, length: 2.0 },
		color: "#00BCD4",
		defaultPar: 3,
	},
	{
		type: "windmill",
		label: "Windmill",
		dimensions: { width: 1.2, length: 2.5 },
		color: "#E91E63",
		defaultPar: 4,
	},
	{
		type: "tunnel",
		label: "Tunnel",
		dimensions: { width: 0.6, length: 4.0 },
		color: "#607D8B",
		defaultPar: 3,
	},
];

export const HOLE_TYPE_MAP = Object.fromEntries(
	HOLE_TYPES.map((ht) => [ht.type, ht]),
) as Record<string, HoleTypeDefinition>;
