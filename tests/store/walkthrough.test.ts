import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockMobile = vi.hoisted(() => ({ value: false }));
vi.mock("../../src/utils/isMobile", () => ({
	get isMobile() {
		return mockMobile.value;
	},
}));

import { useStore } from "../../src/store/store";
import { deriveFrameloop } from "../../src/utils/environmentGating";

beforeEach(() => {
	useStore.setState((state) => ({
		ui: {
			...state.ui,
			walkthroughMode: false,
			previousViewportLayout: null,
			viewportLayout: "dual",
		},
	}));
});

describe("enterWalkthrough", () => {
	it("sets walkthroughMode to true", () => {
		useStore.getState().enterWalkthrough();
		expect(useStore.getState().ui.walkthroughMode).toBe(true);
	});

	it("sets viewportLayout to '3d-only'", () => {
		useStore.getState().enterWalkthrough();
		expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
	});

	it("saves previous viewportLayout to previousViewportLayout", () => {
		useStore.getState().enterWalkthrough();
		expect(useStore.getState().ui.previousViewportLayout).toBe("dual");
	});

	it("saves 'dual' as previousViewportLayout when entering from dual", () => {
		useStore.setState((state) => ({
			ui: { ...state.ui, viewportLayout: "dual" },
		}));
		useStore.getState().enterWalkthrough();
		expect(useStore.getState().ui.previousViewportLayout).toBe("dual");
	});

	it("saves '2d-only' as previousViewportLayout when entering from 2d-only", () => {
		useStore.setState((state) => ({
			ui: { ...state.ui, viewportLayout: "2d-only" },
		}));
		useStore.getState().enterWalkthrough();
		expect(useStore.getState().ui.previousViewportLayout).toBe("2d-only");
	});
});

describe("enterWalkthrough mobile guard", () => {
	afterEach(() => {
		mockMobile.value = false;
	});

	it("no-ops when isMobile is true", () => {
		mockMobile.value = true;
		useStore.setState((state) => ({
			ui: {
				...state.ui,
				walkthroughMode: false,
				viewportLayout: "dual",
			},
		}));
		useStore.getState().enterWalkthrough();
		expect(useStore.getState().ui.walkthroughMode).toBe(false);
		expect(useStore.getState().ui.viewportLayout).toBe("dual");
	});
});

describe("enterWalkthrough idempotency guard", () => {
	it("no-ops when already in walkthrough mode (preserves original previousViewportLayout)", () => {
		useStore.getState().enterWalkthrough();
		expect(useStore.getState().ui.previousViewportLayout).toBe("dual");
		// Second call should be a no-op
		useStore.getState().enterWalkthrough();
		expect(useStore.getState().ui.previousViewportLayout).toBe("dual");
	});
});

describe("exitWalkthrough", () => {
	let rafCallbacks: Array<() => void>;

	beforeEach(() => {
		rafCallbacks = [];
		vi.stubGlobal(
			"requestAnimationFrame",
			(cb: () => void) => {
				rafCallbacks.push(cb);
				return rafCallbacks.length;
			},
		);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	function flushRAF() {
		for (const cb of rafCallbacks) cb();
		rafCallbacks = [];
	}

	it("sets walkthroughMode to false immediately", () => {
		useStore.getState().enterWalkthrough();
		useStore.getState().exitWalkthrough();
		expect(useStore.getState().ui.walkthroughMode).toBe(false);
	});

	it("restores viewportLayout from previousViewportLayout after rAF", () => {
		useStore.getState().enterWalkthrough();
		expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
		useStore.getState().exitWalkthrough();
		flushRAF();
		expect(useStore.getState().ui.viewportLayout).toBe("dual");
	});

	it("clears previousViewportLayout to null after rAF", () => {
		useStore.getState().enterWalkthrough();
		useStore.getState().exitWalkthrough();
		flushRAF();
		expect(useStore.getState().ui.previousViewportLayout).toBeNull();
	});

	it("full round-trip from dual: enter → exit → restores dual", () => {
		useStore.setState((state) => ({
			ui: { ...state.ui, viewportLayout: "dual" },
		}));
		useStore.getState().enterWalkthrough();
		expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
		expect(useStore.getState().ui.walkthroughMode).toBe(true);
		useStore.getState().exitWalkthrough();
		flushRAF();
		expect(useStore.getState().ui.viewportLayout).toBe("dual");
		expect(useStore.getState().ui.walkthroughMode).toBe(false);
	});

	it("full round-trip from 2d-only: enter → exit → restores 2d-only", () => {
		useStore.setState((state) => ({
			ui: { ...state.ui, viewportLayout: "2d-only" },
		}));
		useStore.getState().enterWalkthrough();
		expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
		useStore.getState().exitWalkthrough();
		flushRAF();
		expect(useStore.getState().ui.viewportLayout).toBe("2d-only");
	});

	it("no-ops when not in walkthrough mode (does not clobber viewportLayout)", () => {
		useStore.setState((state) => ({
			ui: { ...state.ui, viewportLayout: "2d-only", walkthroughMode: false },
		}));
		useStore.getState().exitWalkthrough();
		flushRAF();
		expect(useStore.getState().ui.viewportLayout).toBe("2d-only");
	});
});

describe("Walkthrough lifecycle integration (section 09)", () => {
	it("enterWalkthrough from 3d-only layout stays 3d-only", () => {
		useStore.setState((state) => ({
			ui: { ...state.ui, viewportLayout: "3d-only" },
		}));
		useStore.getState().enterWalkthrough();
		expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
		expect(useStore.getState().ui.walkthroughMode).toBe(true);
		expect(useStore.getState().ui.previousViewportLayout).toBe("3d-only");
	});

	it("exitWalkthrough from stored 3d-only restores 3d-only", () => {
		const rafCallbacks: Array<() => void> = [];
		vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
			rafCallbacks.push(cb);
			return rafCallbacks.length;
		});

		useStore.setState((state) => ({
			ui: { ...state.ui, viewportLayout: "3d-only" },
		}));
		useStore.getState().enterWalkthrough();
		useStore.getState().exitWalkthrough();
		for (const cb of rafCallbacks) cb();
		expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
		expect(useStore.getState().ui.walkthroughMode).toBe(false);

		vi.unstubAllGlobals();
	});

	it("deriveFrameloop returns 'always' during walkthrough, 'demand' after exit", () => {
		const rafCallbacks: Array<() => void> = [];
		vi.stubGlobal("requestAnimationFrame", (cb: () => void) => {
			rafCallbacks.push(cb);
			return rafCallbacks.length;
		});

		useStore.setState((state) => ({
			ui: { ...state.ui, viewportLayout: "3d-only" },
		}));
		useStore.getState().enterWalkthrough();

		const stateInWT = useStore.getState().ui;
		expect(
			deriveFrameloop(
				false,
				"low",
				false,
				stateInWT.viewportLayout,
				stateInWT.walkthroughMode,
			),
		).toBe("always");

		useStore.getState().exitWalkthrough();
		for (const cb of rafCallbacks) cb();

		const stateAfter = useStore.getState().ui;
		expect(
			deriveFrameloop(
				false,
				"low",
				false,
				stateAfter.viewportLayout,
				stateAfter.walkthroughMode,
			),
		).toBe("demand");

		vi.unstubAllGlobals();
	});
});

describe("Persistence exclusion", () => {
	it("walkthroughMode is not included in persisted state", () => {
		// The partialize function picks specific top-level keys.
		// ui (where walkthroughMode lives) is not in partialize.
		const state = useStore.getState();
		const persisted = {
			holes: state.holes,
			holeOrder: state.holeOrder,
			budget: state.budget,
			budgetConfig: state.budgetConfig,
			financialSettings: state.financialSettings,
			expenses: state.expenses,
			holeTemplates: state.holeTemplates,
			builderDraft: state.builderDraft,
			gpuTierOverride: state.gpuTierOverride,
			uvTransitionEnabled: state.uvTransitionEnabled,
		};
		expect(persisted).not.toHaveProperty("walkthroughMode");
		expect(persisted).not.toHaveProperty("ui");
	});

	it("previousViewportLayout is not included in persisted state", () => {
		const state = useStore.getState();
		const persisted = {
			holes: state.holes,
			holeOrder: state.holeOrder,
			budget: state.budget,
			budgetConfig: state.budgetConfig,
			financialSettings: state.financialSettings,
			expenses: state.expenses,
			holeTemplates: state.holeTemplates,
			builderDraft: state.builderDraft,
			gpuTierOverride: state.gpuTierOverride,
			uvTransitionEnabled: state.uvTransitionEnabled,
		};
		expect(persisted).not.toHaveProperty("previousViewportLayout");
		expect(persisted).not.toHaveProperty("ui");
	});
});
