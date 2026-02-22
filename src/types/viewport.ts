export type ViewportLayout = "dual" | "2d-only" | "3d-only";

export type CameraPreset =
	| "top"
	| "front"
	| "back"
	| "left"
	| "right"
	| "isometric";

export type LayerId =
	| "holes"
	| "flowPath"
	| "grid"
	| "walls"
	| "sunIndicator";

export type LayerState = {
	visible: boolean;
	opacity: number; // 0-1 range
	locked: boolean;
};

export type LayerDefinition = {
	id: LayerId;
	label: string;
	icon: string; // Lucide icon name
};
