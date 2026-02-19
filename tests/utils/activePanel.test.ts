import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "../../src/store";

describe("activePanel", () => {
	beforeEach(() => {
		useStore.setState({
			holes: {},
			holeOrder: [],
			selectedId: null,
			ui: {
				tool: "select",
				placingType: null,
				view: "top",
				sidebarTab: "holes",
				snapEnabled: false,
				showFlowPath: true,
				activePanel: null,
			},
		});
	});

	it("defaults to null", () => {
		expect(useStore.getState().ui.activePanel).toBeNull();
	});

	it("setActivePanel sets the panel", () => {
		useStore.getState().setActivePanel("holes");
		expect(useStore.getState().ui.activePanel).toBe("holes");
	});

	it("setActivePanel(null) clears the panel", () => {
		useStore.getState().setActivePanel("detail");
		useStore.getState().setActivePanel(null);
		expect(useStore.getState().ui.activePanel).toBeNull();
	});

	it("setActivePanel cycles through all valid values", () => {
		for (const panel of ["holes", "detail", "budget"] as const) {
			useStore.getState().setActivePanel(panel);
			expect(useStore.getState().ui.activePanel).toBe(panel);
		}
	});
});
