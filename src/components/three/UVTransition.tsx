import { useCallback, useEffect, useRef } from "react";
import { useStore } from "../../store";
import {
	DARKNESS_END,
	FLICKER_END,
	TRANSITION_DURATION,
} from "../../utils/uvTransitionConfig";

/**
 * Full-viewport DOM overlay for the UV "Lights Out" transition.
 * Drives opacity via direct DOM manipulation + rAF for smooth 60fps animation.
 * Calls flipUvMode() at MATERIAL_SWAP_TIME behind the dark overlay.
 */
export function UVTransition() {
	const overlayRef = useRef<HTMLDivElement>(null);
	const rafRef = useRef<number>(0);
	const startTimeRef = useRef(0);
	const swappedRef = useRef(false);

	const transitioning = useStore((s) => s.ui.transitioning);
	const flipUvMode = useStore((s) => s.flipUvMode);
	const setTransitioning = useStore((s) => s.setTransitioning);

	const animate = useCallback(
		(now: number) => {
			const elapsed = now - startTimeRef.current;
			const el = overlayRef.current;
			if (!el) return;

			if (elapsed < FLICKER_END) {
				// Phase 1: Flicker — sine-based opacity oscillation
				const t = elapsed / FLICKER_END;
				const flicker =
					Math.sin(t * Math.PI * 6) * 0.3 + t * 0.5;
				el.style.opacity = String(Math.max(0, Math.min(0.7, flicker)));
			} else if (elapsed < DARKNESS_END) {
				// Phase 2: Darkness — ramp to near-black
				el.style.opacity = "0.95";

				// Material swap at MATERIAL_SWAP_TIME (= FLICKER_END)
				if (!swappedRef.current) {
					swappedRef.current = true;
					flipUvMode();
				}
			} else if (elapsed < TRANSITION_DURATION) {
				// Phase 3: Reveal — fade from 0.95 to 0
				const revealT =
					(elapsed - DARKNESS_END) / (TRANSITION_DURATION - DARKNESS_END);
				el.style.opacity = String(0.95 * (1 - revealT));
			} else {
				// Phase 4: Complete
				el.style.opacity = "0";
				setTransitioning(false);
				return;
			}

			rafRef.current = requestAnimationFrame(animate);
		},
		[flipUvMode, setTransitioning],
	);

	useEffect(() => {
		if (!transitioning) {
			// Reset overlay when not transitioning
			if (overlayRef.current) {
				overlayRef.current.style.opacity = "0";
			}
			return;
		}

		// Start animation
		startTimeRef.current = performance.now();
		swappedRef.current = false;
		rafRef.current = requestAnimationFrame(animate);

		return () => {
			cancelAnimationFrame(rafRef.current);
			// If unmounted mid-transition, ensure store is cleaned up
			if (useStore.getState().ui.transitioning) {
				setTransitioning(false);
			}
		};
	}, [transitioning, animate]);

	return (
		<div
			ref={overlayRef}
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 9999,
				pointerEvents: "none",
				background: "#07071A",
				opacity: 0,
				willChange: transitioning ? "opacity" : "auto",
			}}
		/>
	);
}
