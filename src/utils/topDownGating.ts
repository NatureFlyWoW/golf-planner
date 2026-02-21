import type { ViewMode } from "../types/ui";

/** Flag pins invisible from directly above. Hide in top-down. */
export function shouldShowFlagPin(view: ViewMode): boolean {
	return view === "3d";
}

/** Rounded bumper profiles look identical to boxes from above. Use cheaper geometry. */
export function shouldUseSimpleBumpers(view: ViewMode): boolean {
	return view === "top";
}

/** Normal maps add no visible detail from orthographic top-down. Skip them. */
export function shouldSkipNormalMaps(view: ViewMode): boolean {
	return view === "top";
}
