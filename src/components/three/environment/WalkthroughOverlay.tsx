import { useEffect, useState } from "react";
import { useStore } from "../../../store";

/**
 * HTML overlay shown when walkthrough mode is active.
 * Positioned absolutely over the 3D viewport.
 * Contains: exit button (top-right), controls hint (bottom-center, fades after 3s), crosshair.
 */
export function WalkthroughOverlay() {
	const walkthroughMode = useStore((s) => s.ui.walkthroughMode);
	const exitWalkthrough = useStore((s) => s.exitWalkthrough);
	const [hintVisible, setHintVisible] = useState(true);

	// Fade hint out after 3 seconds whenever walkthrough mode activates
	useEffect(() => {
		if (!walkthroughMode) {
			setHintVisible(true); // reset for next entry
			return;
		}
		setHintVisible(true);
		const timer = setTimeout(() => setHintVisible(false), 3000);
		return () => clearTimeout(timer);
	}, [walkthroughMode]);

	if (!walkthroughMode) return null;

	return (
		<div
			className="pointer-events-none absolute inset-0 z-20"
			data-testid="walkthrough-overlay"
		>
			{/* Exit button — top right */}
			<button
				type="button"
				className="pointer-events-auto absolute right-3 top-3 rounded bg-black/60 px-3 py-1.5 text-sm text-white/90 hover:bg-black/80 transition-colors"
				onClick={exitWalkthrough}
				data-testid="walkthrough-exit-btn"
			>
				Exit Walkthrough
			</button>

			{/* Controls hint — bottom center, fades after 3s */}
			<div
				className={`absolute bottom-6 left-1/2 -translate-x-1/2 rounded bg-black/50 px-4 py-2 text-xs text-white/80 transition-opacity duration-700 ${
					hintVisible ? "opacity-100" : "opacity-0"
				}`}
				data-testid="walkthrough-hint"
			>
				WASD to move | Drag to look | Shift to run | Esc to exit
			</div>

			{/* Crosshair — center */}
			<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
				<div className="relative h-4 w-4 opacity-60">
					<div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white" />
					<div className="absolute top-1/2 left-0 w-full h-px -translate-y-1/2 bg-white" />
				</div>
			</div>
		</div>
	);
}
