import type { ThreeEvent } from "@react-three/fiber";
import { createContext, useContext } from "react";

/** Identifies which viewport pane a component is rendering inside */
export type ViewportId = "2d" | "3d";

export type ViewportInfo = {
	id: ViewportId;
	/** The clientX of the right edge of the 2D pane (divider position).
	 *  null when in single-pane mode. */
	paneBoundaryX: number | null;
};

export const ViewportContext = createContext<ViewportInfo | null>(null);

/** Hook to read the current viewport info. Returns null if not inside a View. */
export function useViewportInfo(): ViewportInfo | null {
	return useContext(ViewportContext);
}

/**
 * Checks whether a pointer event originated from the same pane
 * as the component calling this function.
 *
 * Uses position-based detection: compares the event's clientX
 * against the divider position (paneBoundaryX).
 *
 * Returns true in single-pane mode (no gating needed).
 */
export function isEventForThisViewport(
	e: ThreeEvent<PointerEvent> | ThreeEvent<MouseEvent>,
	viewport: ViewportInfo,
): boolean {
	if (viewport.paneBoundaryX === null) return true;
	const pointerPane =
		e.nativeEvent.clientX < viewport.paneBoundaryX ? "2d" : "3d";
	return pointerPane === viewport.id;
}
