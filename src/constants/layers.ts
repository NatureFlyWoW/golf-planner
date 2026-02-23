import type { LayerDefinition } from "../types/viewport";

/**
 * Ordered list of layer definitions for the Layer Panel UI.
 * Order matches the visual stacking order (top-most layer first).
 */
export const LAYER_DEFINITIONS: LayerDefinition[] = [
	{ id: "holes", label: "Holes", icon: "\u26F3" },
	{ id: "flowPath", label: "Flow Path", icon: "\u2192" },
	{ id: "grid", label: "Grid", icon: "\u2317" },
	{ id: "walls", label: "Walls", icon: "\u25A1" },
	{ id: "sunIndicator", label: "Sun", icon: "\u2600" },
	{ id: "environment", label: "Environment", icon: "E" },
];
