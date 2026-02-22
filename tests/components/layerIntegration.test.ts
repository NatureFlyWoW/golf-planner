import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "../../src/store/store";

beforeEach(() => {
	useStore.getState().resetLayers();
});

describe("Layer visibility integration", () => {
	it("holes layer defaults to visible", () => {
		expect(useStore.getState().ui.layers.holes.visible).toBe(true);
	});

	it("setting holes layer to invisible updates store", () => {
		useStore.getState().setLayerVisible("holes", false);
		expect(useStore.getState().ui.layers.holes.visible).toBe(false);
	});

	it("flowPath layer defaults to visible", () => {
		expect(useStore.getState().ui.layers.flowPath.visible).toBe(true);
	});

	it("grid layer defaults to visible", () => {
		expect(useStore.getState().ui.layers.grid.visible).toBe(true);
	});

	it("walls layer defaults to visible", () => {
		expect(useStore.getState().ui.layers.walls.visible).toBe(true);
	});

	it("sunIndicator layer defaults to visible", () => {
		expect(useStore.getState().ui.layers.sunIndicator.visible).toBe(true);
	});
});

describe("Layer opacity integration", () => {
	it("holes layer defaults to opacity 1", () => {
		expect(useStore.getState().ui.layers.holes.opacity).toBe(1);
	});

	it("setting opacity to 0.5 updates store", () => {
		useStore.getState().setLayerOpacity("holes", 0.5);
		expect(useStore.getState().ui.layers.holes.opacity).toBe(0.5);
	});
});

describe("Layer lock integration", () => {
	it("holes layer defaults to unlocked", () => {
		expect(useStore.getState().ui.layers.holes.locked).toBe(false);
	});

	it("locking holes layer updates store", () => {
		useStore.getState().setLayerLocked("holes", true);
		expect(useStore.getState().ui.layers.holes.locked).toBe(true);
	});
});

describe("FlowPath toggle migration", () => {
	it("toggleLayerVisible('flowPath') controls flowPath visibility", () => {
		expect(useStore.getState().ui.layers.flowPath.visible).toBe(true);
		useStore.getState().toggleLayerVisible("flowPath");
		expect(useStore.getState().ui.layers.flowPath.visible).toBe(false);
		useStore.getState().toggleLayerVisible("flowPath");
		expect(useStore.getState().ui.layers.flowPath.visible).toBe(true);
	});
});
