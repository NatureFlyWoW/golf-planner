import { beforeEach, describe, expect, it } from "vitest";
import {
	computeSplitRatio,
	getDoubleClickAction,
} from "../../src/hooks/useSplitPane";
import { useStore } from "../../src/store/store";

beforeEach(() => {
	useStore.setState({
		ui: {
			...useStore.getState().ui,
			viewportLayout: "dual",
			activeViewport: null,
			splitRatio: 0.5,
		},
	});
});

describe("computeSplitRatio", () => {
	const rect = { left: 0, width: 1000 };

	it("computes ratio from clientX and container rect", () => {
		expect(computeSplitRatio(600, rect)).toBeCloseTo(0.6);
	});

	it("clamps minimum to 0.2", () => {
		expect(computeSplitRatio(50, rect)).toBe(0.2);
	});

	it("clamps maximum to 0.8", () => {
		expect(computeSplitRatio(950, rect)).toBe(0.8);
	});

	it("returns exactly 0.2 at boundary", () => {
		expect(computeSplitRatio(200, rect)).toBe(0.2);
	});

	it("returns exactly 0.8 at boundary", () => {
		expect(computeSplitRatio(800, rect)).toBe(0.8);
	});

	it("handles offset container (left !== 0)", () => {
		const offsetRect = { left: 200, width: 1000 };
		// clientX 700 → (700 - 200) / 1000 = 0.5
		expect(computeSplitRatio(700, offsetRect)).toBeCloseTo(0.5);
	});

	it("returns 0.5 for zero-width container", () => {
		expect(computeSplitRatio(500, { left: 0, width: 0 })).toBe(0.5);
	});
});

describe("getDoubleClickAction", () => {
	it("returns 'collapse-2d' in dual mode with null activeViewport", () => {
		expect(getDoubleClickAction("dual", null)).toBe("collapse-2d");
	});

	it("returns 'collapse-2d' in dual mode with '2d' activeViewport", () => {
		expect(getDoubleClickAction("dual", "2d")).toBe("collapse-2d");
	});

	it("returns 'collapse-3d' in dual mode with '3d' activeViewport", () => {
		expect(getDoubleClickAction("dual", "3d")).toBe("collapse-3d");
	});

	it("returns 'expand' when in 2d-only mode", () => {
		expect(getDoubleClickAction("2d-only", null)).toBe("expand");
	});

	it("returns 'expand' when in 3d-only mode", () => {
		expect(getDoubleClickAction("3d-only", null)).toBe("expand");
	});
});

describe("Store integration: drag updates splitRatio", () => {
	it("setSplitRatio from computed ratio", () => {
		const ratio = computeSplitRatio(650, { left: 0, width: 1000 });
		useStore.getState().setSplitRatio(ratio);
		expect(useStore.getState().ui.splitRatio).toBeCloseTo(0.65);
	});

	it("clamped value propagates to store", () => {
		const ratio = computeSplitRatio(50, { left: 0, width: 1000 });
		useStore.getState().setSplitRatio(ratio);
		expect(useStore.getState().ui.splitRatio).toBe(0.2);
	});
});

describe("Store integration: double-click toggles layout", () => {
	it("collapseTo '2d' in dual mode", () => {
		const action = getDoubleClickAction("dual", null);
		expect(action).toBe("collapse-2d");
		useStore.getState().collapseTo("2d");
		expect(useStore.getState().ui.viewportLayout).toBe("2d-only");
	});

	it("expandDual from collapsed mode", () => {
		useStore.getState().collapseTo("3d");
		const action = getDoubleClickAction(
			useStore.getState().ui.viewportLayout,
			null,
		);
		expect(action).toBe("expand");
		useStore.getState().expandDual();
		expect(useStore.getState().ui.viewportLayout).toBe("dual");
	});

	it("preserves splitRatio through collapse/expand cycle", () => {
		useStore.getState().setSplitRatio(0.65);
		useStore.getState().collapseTo("2d");
		useStore.getState().expandDual();
		expect(useStore.getState().ui.splitRatio).toBe(0.65);
	});
});
