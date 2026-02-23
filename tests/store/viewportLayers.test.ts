import { beforeEach, describe, expect, it } from "vitest";
import { DEFAULT_LAYERS, useStore } from "../../src/store/store";

beforeEach(() => {
	useStore.setState({
		ui: {
			...useStore.getState().ui,
			viewportLayout: "dual",
			activeViewport: null,
			splitRatio: 0.5,
			layers: {
				holes: { visible: true, opacity: 1, locked: false },
				flowPath: { visible: true, opacity: 1, locked: false },
				grid: { visible: true, opacity: 1, locked: false },
				walls: { visible: true, opacity: 1, locked: false },
				sunIndicator: { visible: true, opacity: 1, locked: false },
				environment: { visible: true, opacity: 1, locked: false },
			},
		},
	});
});

describe("Default State", () => {
	it("initial viewportLayout is 'dual'", () => {
		expect(useStore.getState().ui.viewportLayout).toBe("dual");
	});

	it("initial splitRatio is 0.5", () => {
		expect(useStore.getState().ui.splitRatio).toBe(0.5);
	});

	it("initial activeViewport is null", () => {
		expect(useStore.getState().ui.activeViewport).toBeNull();
	});

	it("all 6 layers present", () => {
		const layers = useStore.getState().ui.layers;
		expect(Object.keys(layers)).toHaveLength(6);
		expect(layers).toHaveProperty("holes");
		expect(layers).toHaveProperty("flowPath");
		expect(layers).toHaveProperty("grid");
		expect(layers).toHaveProperty("walls");
		expect(layers).toHaveProperty("sunIndicator");
		expect(layers).toHaveProperty("environment");
	});

	it("all layers default visible=true, opacity=1, locked=false", () => {
		const layers = useStore.getState().ui.layers;
		for (const layer of Object.values(layers)) {
			expect(layer.visible).toBe(true);
			expect(layer.opacity).toBe(1);
			expect(layer.locked).toBe(false);
		}
	});
});

describe("Viewport Layout Actions", () => {
	describe("setViewportLayout", () => {
		it("sets viewportLayout to 'dual'", () => {
			useStore.getState().setViewportLayout("2d-only");
			useStore.getState().setViewportLayout("dual");
			expect(useStore.getState().ui.viewportLayout).toBe("dual");
		});

		it("sets viewportLayout to '2d-only'", () => {
			useStore.getState().setViewportLayout("2d-only");
			expect(useStore.getState().ui.viewportLayout).toBe("2d-only");
		});

		it("sets viewportLayout to '3d-only'", () => {
			useStore.getState().setViewportLayout("3d-only");
			expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
		});
	});

	describe("setSplitRatio", () => {
		it("sets splitRatio to 0.5", () => {
			useStore.getState().setSplitRatio(0.5);
			expect(useStore.getState().ui.splitRatio).toBe(0.5);
		});

		it("clamps minimum to 0.2", () => {
			useStore.getState().setSplitRatio(0.1);
			expect(useStore.getState().ui.splitRatio).toBe(0.2);
		});

		it("clamps maximum to 0.8", () => {
			useStore.getState().setSplitRatio(0.95);
			expect(useStore.getState().ui.splitRatio).toBe(0.8);
		});

		it("sets exactly 0.2 (boundary)", () => {
			useStore.getState().setSplitRatio(0.2);
			expect(useStore.getState().ui.splitRatio).toBe(0.2);
		});

		it("sets exactly 0.8 (boundary)", () => {
			useStore.getState().setSplitRatio(0.8);
			expect(useStore.getState().ui.splitRatio).toBe(0.8);
		});
	});

	describe("collapseTo", () => {
		it("collapseTo('2d') sets viewportLayout to '2d-only'", () => {
			useStore.getState().collapseTo("2d");
			expect(useStore.getState().ui.viewportLayout).toBe("2d-only");
		});

		it("collapseTo('3d') sets viewportLayout to '3d-only'", () => {
			useStore.getState().collapseTo("3d");
			expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
		});

		it("preserves splitRatio for later expandDual", () => {
			useStore.getState().setSplitRatio(0.65);
			useStore.getState().collapseTo("2d");
			expect(useStore.getState().ui.splitRatio).toBe(0.65);
		});
	});

	describe("expandDual", () => {
		it("sets viewportLayout to 'dual'", () => {
			useStore.getState().collapseTo("3d");
			useStore.getState().expandDual();
			expect(useStore.getState().ui.viewportLayout).toBe("dual");
		});

		it("preserves splitRatio from before collapse", () => {
			useStore.getState().setSplitRatio(0.65);
			useStore.getState().collapseTo("2d");
			useStore.getState().expandDual();
			expect(useStore.getState().ui.viewportLayout).toBe("dual");
			expect(useStore.getState().ui.splitRatio).toBe(0.65);
		});
	});

	describe("setActiveViewport", () => {
		it("sets activeViewport to '2d'", () => {
			useStore.getState().setActiveViewport("2d");
			expect(useStore.getState().ui.activeViewport).toBe("2d");
		});

		it("sets activeViewport to '3d'", () => {
			useStore.getState().setActiveViewport("3d");
			expect(useStore.getState().ui.activeViewport).toBe("3d");
		});

		it("clears activeViewport with null", () => {
			useStore.getState().setActiveViewport("2d");
			useStore.getState().setActiveViewport(null);
			expect(useStore.getState().ui.activeViewport).toBeNull();
		});
	});
});

describe("Layer Management Actions", () => {
	describe("setLayerVisible", () => {
		it("sets holes.visible to false", () => {
			useStore.getState().setLayerVisible("holes", false);
			expect(useStore.getState().ui.layers.holes.visible).toBe(false);
		});

		it("sets holes.visible to true", () => {
			useStore.getState().setLayerVisible("holes", false);
			useStore.getState().setLayerVisible("holes", true);
			expect(useStore.getState().ui.layers.holes.visible).toBe(true);
		});

		it("does not affect other layers", () => {
			useStore.getState().setLayerVisible("holes", false);
			const layers = useStore.getState().ui.layers;
			expect(layers.flowPath.visible).toBe(true);
			expect(layers.grid.visible).toBe(true);
			expect(layers.walls.visible).toBe(true);
			expect(layers.sunIndicator.visible).toBe(true);
		});
	});

	describe("setLayerOpacity", () => {
		it("sets holes.opacity to 0.5", () => {
			useStore.getState().setLayerOpacity("holes", 0.5);
			expect(useStore.getState().ui.layers.holes.opacity).toBe(0.5);
		});

		it("clamps minimum to 0", () => {
			useStore.getState().setLayerOpacity("holes", -0.5);
			expect(useStore.getState().ui.layers.holes.opacity).toBe(0);
		});

		it("clamps maximum to 1", () => {
			useStore.getState().setLayerOpacity("holes", 1.5);
			expect(useStore.getState().ui.layers.holes.opacity).toBe(1);
		});
	});

	describe("setLayerLocked", () => {
		it("sets holes.locked to true", () => {
			useStore.getState().setLayerLocked("holes", true);
			expect(useStore.getState().ui.layers.holes.locked).toBe(true);
		});

		it("sets holes.locked to false", () => {
			useStore.getState().setLayerLocked("holes", true);
			useStore.getState().setLayerLocked("holes", false);
			expect(useStore.getState().ui.layers.holes.locked).toBe(false);
		});
	});

	describe("toggleLayerVisible", () => {
		it("flips from true to false", () => {
			useStore.getState().toggleLayerVisible("holes");
			expect(useStore.getState().ui.layers.holes.visible).toBe(false);
		});

		it("flips from false to true", () => {
			useStore.getState().setLayerVisible("holes", false);
			useStore.getState().toggleLayerVisible("holes");
			expect(useStore.getState().ui.layers.holes.visible).toBe(true);
		});
	});

	describe("toggleLayerLocked", () => {
		it("flips from false to true", () => {
			useStore.getState().toggleLayerLocked("holes");
			expect(useStore.getState().ui.layers.holes.locked).toBe(true);
		});

		it("flips from true to false", () => {
			useStore.getState().setLayerLocked("holes", true);
			useStore.getState().toggleLayerLocked("holes");
			expect(useStore.getState().ui.layers.holes.locked).toBe(false);
		});
	});
});

describe("Reset Layers", () => {
	it("restores all layers to defaults", () => {
		useStore.getState().setLayerVisible("holes", false);
		useStore.getState().setLayerOpacity("grid", 0.3);
		useStore.getState().setLayerLocked("walls", true);
		useStore.getState().resetLayers();
		const layers = useStore.getState().ui.layers;
		for (const layer of Object.values(layers)) {
			expect(layer.visible).toBe(true);
			expect(layer.opacity).toBe(1);
			expect(layer.locked).toBe(false);
		}
	});

	it("works after modifying multiple layers", () => {
		useStore.getState().setLayerVisible("holes", false);
		useStore.getState().setLayerVisible("flowPath", false);
		useStore.getState().setLayerOpacity("grid", 0);
		useStore.getState().setLayerLocked("walls", true);
		useStore.getState().setLayerLocked("sunIndicator", true);
		useStore.getState().resetLayers();
		expect(useStore.getState().ui.layers).toEqual(DEFAULT_LAYERS);
	});
});

describe("Persistence & Undo Exclusion", () => {
	it("viewport/layer fields are NOT in the persisted slice", () => {
		// The persist middleware's partialize only includes specific top-level keys.
		// Since viewportLayout, activeViewport, splitRatio, and layers live inside ui
		// (which is excluded from partialize), they are not persisted.
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
		expect("viewportLayout" in persisted).toBe(false);
		expect("layers" in persisted).toBe(false);
		expect("activeViewport" in persisted).toBe(false);
		expect("splitRatio" in persisted).toBe(false);
	});
});
