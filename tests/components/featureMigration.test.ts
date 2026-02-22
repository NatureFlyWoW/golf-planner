import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "../../src/store";

describe("Feature Migration", () => {
	beforeEach(() => {
		useStore.setState({
			holes: {},
			holeOrder: [],
			selectedId: null,
		});
	});

	describe("showFlowPath removal", () => {
		it("store no longer has showFlowPath field in UIState", () => {
			const ui = useStore.getState().ui;
			expect("showFlowPath" in ui).toBe(false);
		});

		it("store no longer has toggleFlowPath action", () => {
			const store = useStore.getState();
			expect("toggleFlowPath" in store).toBe(false);
		});
	});

	describe("Flow path toggle migration", () => {
		it("layers.flowPath.visible exists and defaults to true", () => {
			const store = useStore.getState();
			expect(store.ui.layers.flowPath.visible).toBe(true);
		});

		it("toggleLayerVisible('flowPath') toggles visibility", () => {
			const store = useStore.getState();
			expect(store.ui.layers.flowPath.visible).toBe(true);

			store.toggleLayerVisible("flowPath");
			expect(useStore.getState().ui.layers.flowPath.visible).toBe(false);

			useStore.getState().toggleLayerVisible("flowPath");
			expect(useStore.getState().ui.layers.flowPath.visible).toBe(true);
		});
	});
});
