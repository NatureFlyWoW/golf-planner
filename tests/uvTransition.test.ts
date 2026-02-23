import { beforeEach, describe, expect, it } from "vitest";
import {
	DARKNESS_END,
	FLICKER_END,
	MATERIAL_SWAP_TIME,
	TRANSITION_DURATION,
	canvasPointerEvents,
} from "../src/utils/uvTransitionConfig";
import { useStore } from "../src/store";

describe("UV Transition", () => {
	beforeEach(() => {
		useStore.setState(useStore.getInitialState());
	});

	describe("transitioning state", () => {
		it("starts false", () => {
			expect(useStore.getState().ui.transitioning).toBe(false);
		});

		it("set to true when UV toggle fires with animation enabled", () => {
			// Ensure animation is enabled and not currently transitioning
			useStore.setState({ uvTransitionEnabled: true });
			useStore.getState().setTransitioning(false);

			// Toggle UV mode — should start transition
			useStore.getState().toggleUvMode();
			expect(useStore.getState().ui.transitioning).toBe(true);
		});

		it("set back to false after setTransitioning(false)", () => {
			useStore.getState().setTransitioning(true);
			expect(useStore.getState().ui.transitioning).toBe(true);

			useStore.getState().setTransitioning(false);
			expect(useStore.getState().ui.transitioning).toBe(false);
		});
	});

	describe("double-click guard", () => {
		it("UV toggle ignored when transitioning is true", () => {
			// Start with known uvMode state
			useStore.setState({
				ui: { ...useStore.getState().ui, uvMode: false, transitioning: true },
				uvTransitionEnabled: true,
			});
			const before = useStore.getState().ui.uvMode;

			useStore.getState().toggleUvMode();

			// uvMode should NOT change, transitioning should stay true
			expect(useStore.getState().ui.uvMode).toBe(before);
		});

		it("UV toggle accepted when transitioning is false", () => {
			useStore.setState({
				ui: { ...useStore.getState().ui, uvMode: false, transitioning: false },
				uvTransitionEnabled: true,
			});

			useStore.getState().toggleUvMode();
			// With animation enabled, transitioning should be set to true
			expect(useStore.getState().ui.transitioning).toBe(true);
		});
	});

	describe("transition phases", () => {
		it("defines 4 phases with correct timing boundaries", () => {
			expect(FLICKER_END).toBe(800);
			expect(DARKNESS_END).toBe(1400);
			expect(TRANSITION_DURATION).toBe(2400);
		});

		it("material swap time equals FLICKER_END (800ms)", () => {
			expect(MATERIAL_SWAP_TIME).toBe(FLICKER_END);
			expect(MATERIAL_SWAP_TIME).toBe(800);
		});

		it("uvMode flip does NOT happen at t=0 — deferred to MATERIAL_SWAP_TIME", () => {
			// When animation is enabled, toggleUvMode sets transitioning=true
			// but does NOT flip uvMode. flipUvMode is called later at MATERIAL_SWAP_TIME.
			useStore.setState({
				ui: { ...useStore.getState().ui, uvMode: false, transitioning: false },
				uvTransitionEnabled: true,
			});

			useStore.getState().toggleUvMode();

			// uvMode should NOT have flipped yet
			expect(useStore.getState().ui.uvMode).toBe(false);
			// transitioning should be true
			expect(useStore.getState().ui.transitioning).toBe(true);
		});
	});

	describe("animation disable setting", () => {
		it("when off, uvMode flips instantly with no transition", () => {
			useStore.setState({
				ui: { ...useStore.getState().ui, uvMode: false, transitioning: false },
				uvTransitionEnabled: false,
			});

			useStore.getState().toggleUvMode();

			expect(useStore.getState().ui.uvMode).toBe(true);
			expect(useStore.getState().ui.transitioning).toBe(false);
		});

		it("transitioning is never set to true when animation disabled", () => {
			useStore.setState({
				ui: { ...useStore.getState().ui, uvMode: true, transitioning: false },
				uvTransitionEnabled: false,
			});

			useStore.getState().toggleUvMode();

			expect(useStore.getState().ui.transitioning).toBe(false);
		});
	});

	describe("Canvas pointer-events", () => {
		it("pointer-events is 'none' during transition", () => {
			expect(canvasPointerEvents(true)).toBe("none");
		});

		it("pointer-events is 'auto' after transition completes", () => {
			expect(canvasPointerEvents(false)).toBe("auto");
		});
	});

	describe("flipUvMode action", () => {
		it("flips uvMode without touching transitioning", () => {
			useStore.setState({
				ui: { ...useStore.getState().ui, uvMode: false, transitioning: true },
			});

			useStore.getState().flipUvMode();

			expect(useStore.getState().ui.uvMode).toBe(true);
			// transitioning unchanged
			expect(useStore.getState().ui.transitioning).toBe(true);
		});
	});
});
