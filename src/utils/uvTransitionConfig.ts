/** Phase 1 end: flicker simulation (0-800ms) */
export const FLICKER_END = 800;
/** Phase 2 end: darkness period (800-1400ms) */
export const DARKNESS_END = 1400;
/** Total transition duration (0-2400ms) */
export const TRANSITION_DURATION = 2400;
/** Material swap happens at this time (behind dark overlay) */
export const MATERIAL_SWAP_TIME = FLICKER_END;

/** Derive canvas pointer-events based on transitioning state. */
export function canvasPointerEvents(transitioning: boolean): "none" | "auto" {
	return transitioning ? "none" : "auto";
}
