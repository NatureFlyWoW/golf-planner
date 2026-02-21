import type {
	SegmentCategory,
	SegmentSpec,
	SegmentSpecId,
} from "../types/template";

// Convention: entry at origin (0,0) facing -Z (angle=180).
// The ball enters from outside along +Z and travels through the segment.
// Angle convention: 0=+Z, 90=+X, 180=-Z, 270=-X.
// Straight specs exit along +Z (angle=0).
// Curve specs are computed analytically with the arc center perpendicular to the travel direction.

const R_90 = 0.8; // radius for 90° curves
const R_45 = 1.2; // radius for 45° curves
const R_30 = 2.0; // radius for 30° wide curve

export const SEGMENT_SPECS: Record<SegmentSpecId, SegmentSpec> = {
	straight_1m: {
		id: "straight_1m",
		label: "Straight 1m",
		category: "straight",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: 0, z: 1, angle: 0 },
		length: 1,
	},

	straight_2m: {
		id: "straight_2m",
		label: "Straight 2m",
		category: "straight",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: 0, z: 2, angle: 0 },
		length: 2,
	},

	straight_3m: {
		id: "straight_3m",
		label: "Straight 3m",
		category: "straight",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: 0, z: 3, angle: 0 },
		length: 3,
	},

	// 90° left curve: arc center at (-R_90, 0), sweeps 90° CCW.
	// Exit at (-R_90, R_90) = (-0.8, 0.8), ball exits going -X (angle 270).
	curve_90_left: {
		id: "curve_90_left",
		label: "Curve 90° Left",
		category: "curve",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: -0.8, z: 0.8, angle: 270 },
		arcCenter: { x: -R_90, z: 0 },
		arcRadius: R_90,
		arcSweep: 90,
		length: 1.2566,
	},

	// 90° right curve: mirror of left on X axis.
	// Exit at (0.8, 0.8), ball exits going +X (angle 90).
	curve_90_right: {
		id: "curve_90_right",
		label: "Curve 90° Right",
		category: "curve",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: 0.8, z: 0.8, angle: 90 },
		arcCenter: { x: R_90, z: 0 },
		arcRadius: R_90,
		arcSweep: 90,
		length: 1.2566,
	},

	// 45° left curve: arc center at (-R_45, 0), sweeps 45° CCW.
	// Exit at (-R_45 + R_45*cos45°, R_45*sin45°) ≈ (-0.3515, 0.8485), angle 315.
	curve_45_left: {
		id: "curve_45_left",
		label: "Curve 45° Left",
		category: "curve",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: -0.3515, z: 0.8485, angle: 315 },
		arcCenter: { x: -R_45, z: 0 },
		arcRadius: R_45,
		arcSweep: 45,
		length: 0.9425,
	},

	// 45° right curve: mirror of left on X axis.
	// Exit at (0.3515, 0.8485), angle 45.
	curve_45_right: {
		id: "curve_45_right",
		label: "Curve 45° Right",
		category: "curve",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: 0.3515, z: 0.8485, angle: 45 },
		arcCenter: { x: R_45, z: 0 },
		arcRadius: R_45,
		arcSweep: 45,
		length: 0.9425,
	},

	// 30° wide curve (gentle left): arc center at (-R_30, 0), sweeps 30° CCW.
	// Exit at (-R_30 + R_30*cos30°, R_30*sin30°) ≈ (-0.2679, 1.0), angle 330.
	curve_30_wide: {
		id: "curve_30_wide",
		label: "Curve 30° Wide",
		category: "curve",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: -0.2679, z: 1.0, angle: 330 },
		arcCenter: { x: -R_30, z: 0 },
		arcRadius: R_30,
		arcSweep: 30,
		length: 1.0472,
	},

	// S-curve: 90° left arc then 90° right arc (R_90 each).
	// Net exit at (-2*R_90, 2*R_90) = (-1.6, 1.6), ball exits going +Z (angle 0).
	s_curve: {
		id: "s_curve",
		label: "S-Curve",
		category: "complex",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: -1.6, z: 1.6, angle: 0 },
		length: 2.5133,
	},

	// U-turn: 180° left arc (R_90).
	// Arc center at (-R_90, 0). Exit at (-2*R_90, 0) = (-1.6, 0), angle 180.
	u_turn: {
		id: "u_turn",
		label: "U-Turn",
		category: "complex",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: -1.6, z: 0, angle: 180 },
		arcCenter: { x: -R_90, z: 0 },
		arcRadius: R_90,
		arcSweep: 180,
		length: 2.5133,
	},

	// Chicane: quick left-right wiggle.
	// Exits at (-0.6, 2) going +Z (angle 0).
	chicane: {
		id: "chicane",
		label: "Chicane",
		category: "complex",
		entryPoint: { x: 0, z: 0, angle: 180 },
		exitPoint: { x: -0.6, z: 2, angle: 0 },
		length: 2.1,
	},
};

export const SEGMENT_SPEC_LIST: SegmentSpec[] = Object.values(SEGMENT_SPECS);

export const SEGMENT_CATEGORIES: Record<SegmentCategory, string> = {
	straight: "Straight",
	curve: "Curve",
	complex: "Complex",
};
