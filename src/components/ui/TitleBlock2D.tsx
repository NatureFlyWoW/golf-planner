import { useMouseStatusStore } from "../../stores/mouseStatusStore";
import { computeScale } from "../../utils/zoomScale";

/**
 * Small architectural title block overlay for the 2D pane.
 * Positioned in the bottom-left corner (bottom-right is taken by MiniMap).
 * Shows project name, drawing scale, and current date.
 * pointer-events: none so it doesn't block canvas interaction.
 */
export function TitleBlock2D() {
	const currentZoom = useMouseStatusStore((s) => s.currentZoom);
	const scale = computeScale(currentZoom);
	const date = new Date().toLocaleDateString("sv-SE");

	return (
		<div
			data-testid="title-block-2d"
			aria-hidden="true"
			className="absolute bottom-2 left-2 rounded border border-subtle bg-surface/80 px-2 py-1.5 font-mono text-[10px] leading-tight text-text-secondary pointer-events-none"
		>
			<div className="font-bold text-primary">Golf Forge</div>
			<div>{scale}</div>
			<div>{date}</div>
		</div>
	);
}
