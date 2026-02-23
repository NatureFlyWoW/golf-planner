import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

/** Level of detail for the 2D architectural view. */
export type LODLevel = "overview" | "standard" | "detail";

/**
 * Computes the LOD level from a camera zoom value.
 *
 * Thresholds:
 * - zoom < 15       -> "overview"  (far out, minimal detail)
 * - 15 <= zoom < 40 -> "standard"  (working zoom, standard detail)
 * - zoom >= 40      -> "detail"    (close up, full detail)
 */
export function computeLODLevel(zoom: number): LODLevel {
	if (zoom < 15) return "overview";
	if (zoom < 40) return "standard";
	return "detail";
}

/**
 * Returns a ref containing the current LOD level based on camera zoom.
 *
 * Uses useFrame to read camera.zoom each frame. Stores result in a ref
 * to avoid React state updates and re-renders. Consumers read
 * `lodRef.current` during their own useFrame or render.
 *
 * Must be called inside an R3F Canvas context.
 */
export function useZoomLOD(): React.RefObject<LODLevel> {
	const lodRef = useRef<LODLevel>("standard");

	useFrame(({ camera }) => {
		if ("zoom" in camera) {
			lodRef.current = computeLODLevel(
				(camera as { zoom: number }).zoom,
			);
		}
	});

	return lodRef;
}
