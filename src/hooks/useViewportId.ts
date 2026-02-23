import { useContext } from "react";
import type { ViewportId } from "../contexts/ViewportContext";
import { ViewportContext } from "../contexts/ViewportContext";

/**
 * Pure logic extracted for testing: given ViewportInfo or null, returns the id.
 */
export function getViewportId(
	info: { id: ViewportId } | null,
): ViewportId | null {
	return info?.id ?? null;
}

/**
 * Returns the current viewport id ("2d" or "3d"), or null if not inside
 * a ViewportContext.Provider (e.g., mobile single-pane mode).
 */
export function useViewportId(): ViewportId | null {
	const info = useContext(ViewportContext);
	return getViewportId(info);
}
