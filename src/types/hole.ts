export type HoleType =
	| "straight"
	| "l-shape"
	| "dogleg"
	| "ramp"
	| "loop"
	| "windmill"
	| "tunnel";

export type HoleRotation = number;

export type Hole = {
	id: string;
	type: HoleType;
	position: { x: number; z: number };
	rotation: HoleRotation;
	name: string;
	par: number;
};

export type HoleTypeDefinition = {
	type: HoleType;
	label: string;
	dimensions: { width: number; length: number };
	color: string;
	defaultPar: number;
};
