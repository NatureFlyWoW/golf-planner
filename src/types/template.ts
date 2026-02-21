export type SegmentSpecId =
	| "straight_1m"
	| "straight_2m"
	| "straight_3m"
	| "curve_90_left"
	| "curve_90_right"
	| "curve_45_left"
	| "curve_45_right"
	| "curve_30_wide"
	| "s_curve"
	| "u_turn"
	| "chicane";

export type SegmentCategory = "straight" | "curve" | "complex";

export type ConnectionPointDef = {
	x: number;
	z: number;
	angle: number; // degrees, outward direction
};

export type SegmentSpec = {
	id: SegmentSpecId;
	label: string;
	category: SegmentCategory;
	entryPoint: ConnectionPointDef;
	exitPoint: ConnectionPointDef;
	arcCenter?: { x: number; z: number };
	arcRadius?: number;
	arcSweep?: number; // degrees
	length: number; // approximate centerline length in meters
};

export type SegmentConnection = {
	segmentId: string | null;
};

export type Segment = {
	id: string;
	specId: SegmentSpecId;
	position: { x: number; z: number };
	rotation: number; // degrees
	connections: {
		entry: SegmentConnection;
		exit: SegmentConnection;
	};
};

export type PrefabId =
	| "windmill"
	| "ramp"
	| "tunnel"
	| "loop"
	| "bumper_post"
	| "wall_bank";

export type PrefabObstacle = {
	id: string;
	prefabId: PrefabId;
	position: { x: number; z: number };
	rotation: number;
};

export type Obstacle = PrefabObstacle;

export type HoleTemplate = {
	id: string;
	version: 1;
	name: string;
	feltWidth: number;
	segments: Segment[];
	obstacles: Obstacle[];
	defaultPar: number;
	color: string;
	createdAt: string;
};
