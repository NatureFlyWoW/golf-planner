diff --git a/src/store/store.ts b/src/store/store.ts
index 2995c19..80454bb 100644
--- a/src/store/store.ts
+++ b/src/store/store.ts
@@ -23,8 +23,11 @@ import type {
 	Hall,
 	Hole,
 	HoleType,
+	LayerId,
+	LayerState,
 	UIState,
 	VatProfile,
+	ViewportLayout,
 } from "../types";
 import type { HoleTemplate } from "../types/template";
 import { uncertaintyFromTier } from "../utils/financial";
@@ -92,6 +95,19 @@ type StoreActions = {
 	deleteExpense: (expenseId: string) => void;
 	updateCategoryTier: (id: string, tier: ConfidenceTier) => void;
 	registerScreenshotCapture: (fn: () => void) => void;
+	// Viewport layout actions
+	setViewportLayout: (layout: ViewportLayout) => void;
+	setSplitRatio: (ratio: number) => void;
+	collapseTo: (pane: "2d" | "3d") => void;
+	expandDual: () => void;
+	setActiveViewport: (viewport: "2d" | "3d" | null) => void;
+	// Layer management actions
+	setLayerVisible: (layerId: LayerId, visible: boolean) => void;
+	setLayerOpacity: (layerId: LayerId, opacity: number) => void;
+	setLayerLocked: (layerId: LayerId, locked: boolean) => void;
+	toggleLayerVisible: (layerId: LayerId) => void;
+	toggleLayerLocked: (layerId: LayerId) => void;
+	resetLayers: () => void;
 } & BuilderActions;
 
 export type Store = StoreState & StoreActions;
@@ -112,6 +128,14 @@ type PersistedSlice = {
 	costPerHole?: number;
 };
 
+export const DEFAULT_LAYERS: Record<LayerId, LayerState> = {
+	holes: { visible: true, opacity: 1, locked: false },
+	flowPath: { visible: true, opacity: 1, locked: false },
+	grid: { visible: true, opacity: 1, locked: false },
+	walls: { visible: true, opacity: 1, locked: false },
+	sunIndicator: { visible: true, opacity: 1, locked: false },
+};
+
 const DEFAULT_UI: UIState = {
 	tool: "select",
 	placingType: null,
@@ -126,6 +150,10 @@ const DEFAULT_UI: UIState = {
 	gpuTier: "low",
 	transitioning: false,
 	godRaysLampRef: null,
+	viewportLayout: "dual",
+	activeViewport: null,
+	splitRatio: 0.5,
+	layers: { ...DEFAULT_LAYERS },
 };
 
 function migrateToV4(state: PersistedSlice): void {
@@ -574,6 +602,93 @@ export const useStore = create<Store>()(
 					}),
 
 				registerScreenshotCapture: (fn) => set({ captureScreenshot: fn }),
+
+				// Viewport layout actions
+				setViewportLayout: (layout) =>
+					set((state) => ({ ui: { ...state.ui, viewportLayout: layout } })),
+				setSplitRatio: (ratio) =>
+					set((state) => ({
+						ui: {
+							...state.ui,
+							splitRatio: Math.max(0.2, Math.min(0.8, ratio)),
+						},
+					})),
+				collapseTo: (pane) =>
+					set((state) => ({
+						ui: {
+							...state.ui,
+							viewportLayout: pane === "2d" ? "2d-only" : "3d-only",
+						},
+					})),
+				expandDual: () =>
+					set((state) => ({ ui: { ...state.ui, viewportLayout: "dual" } })),
+				setActiveViewport: (viewport) =>
+					set((state) => ({ ui: { ...state.ui, activeViewport: viewport } })),
+
+				// Layer management actions
+				setLayerVisible: (layerId, visible) =>
+					set((state) => ({
+						ui: {
+							...state.ui,
+							layers: {
+								...state.ui.layers,
+								[layerId]: { ...state.ui.layers[layerId], visible },
+							},
+						},
+					})),
+				setLayerOpacity: (layerId, opacity) =>
+					set((state) => ({
+						ui: {
+							...state.ui,
+							layers: {
+								...state.ui.layers,
+								[layerId]: {
+									...state.ui.layers[layerId],
+									opacity: Math.max(0, Math.min(1, opacity)),
+								},
+							},
+						},
+					})),
+				setLayerLocked: (layerId, locked) =>
+					set((state) => ({
+						ui: {
+							...state.ui,
+							layers: {
+								...state.ui.layers,
+								[layerId]: { ...state.ui.layers[layerId], locked },
+							},
+						},
+					})),
+				toggleLayerVisible: (layerId) =>
+					set((state) => ({
+						ui: {
+							...state.ui,
+							layers: {
+								...state.ui.layers,
+								[layerId]: {
+									...state.ui.layers[layerId],
+									visible: !state.ui.layers[layerId].visible,
+								},
+							},
+						},
+					})),
+				toggleLayerLocked: (layerId) =>
+					set((state) => ({
+						ui: {
+							...state.ui,
+							layers: {
+								...state.ui.layers,
+								[layerId]: {
+									...state.ui.layers[layerId],
+									locked: !state.ui.layers[layerId].locked,
+								},
+							},
+						},
+					})),
+				resetLayers: () =>
+					set((state) => ({
+						ui: { ...state.ui, layers: { ...DEFAULT_LAYERS } },
+					})),
 			}),
 			{
 				name: "golf-planner-state",
diff --git a/src/types/index.ts b/src/types/index.ts
index bf54d18..6bdd3cf 100644
--- a/src/types/index.ts
+++ b/src/types/index.ts
@@ -37,3 +37,10 @@ export type {
 	UIState,
 	ViewMode,
 } from "./ui";
+export type {
+	CameraPreset,
+	LayerDefinition,
+	LayerId,
+	LayerState,
+	ViewportLayout,
+} from "./viewport";
diff --git a/src/types/ui.ts b/src/types/ui.ts
index adcd09d..33a6c68 100644
--- a/src/types/ui.ts
+++ b/src/types/ui.ts
@@ -1,11 +1,18 @@
 import type { RefObject } from "react";
 import type { Mesh } from "three";
 import type { HoleType } from "./hole";
+import type { LayerId, LayerState, ViewportLayout } from "./viewport";
 
 export type Tool = "select" | "place" | "move" | "delete";
 export type ViewMode = "top" | "3d";
-export type SidebarTab = "holes" | "detail" | "budget";
-export type ActivePanel = "holes" | "detail" | "budget" | "sun" | null;
+export type SidebarTab = "holes" | "detail" | "budget" | "layers";
+export type ActivePanel =
+	| "holes"
+	| "detail"
+	| "budget"
+	| "sun"
+	| "layers"
+	| null;
 export type GpuTier = "low" | "mid" | "high";
 export type GpuTierOverride = "auto" | "low" | "mid" | "high";
 
@@ -23,4 +30,8 @@ export type UIState = {
 	gpuTier: GpuTier;
 	transitioning: boolean;
 	godRaysLampRef: RefObject<Mesh | null> | null;
+	viewportLayout: ViewportLayout;
+	activeViewport: "2d" | "3d" | null;
+	splitRatio: number;
+	layers: Record<LayerId, LayerState>;
 };
diff --git a/src/types/viewport.ts b/src/types/viewport.ts
new file mode 100644
index 0000000..31e1574
--- /dev/null
+++ b/src/types/viewport.ts
@@ -0,0 +1,28 @@
+export type ViewportLayout = "dual" | "2d-only" | "3d-only";
+
+export type CameraPreset =
+	| "top"
+	| "front"
+	| "back"
+	| "left"
+	| "right"
+	| "isometric";
+
+export type LayerId =
+	| "holes"
+	| "flowPath"
+	| "grid"
+	| "walls"
+	| "sunIndicator";
+
+export type LayerState = {
+	visible: boolean;
+	opacity: number; // 0-1 range
+	locked: boolean;
+};
+
+export type LayerDefinition = {
+	id: LayerId;
+	label: string;
+	icon: string; // Lucide icon name
+};
diff --git a/tests/store/viewportLayers.test.ts b/tests/store/viewportLayers.test.ts
new file mode 100644
index 0000000..f6ded21
--- /dev/null
+++ b/tests/store/viewportLayers.test.ts
@@ -0,0 +1,282 @@
+import { beforeEach, describe, expect, it } from "vitest";
+import { DEFAULT_LAYERS, useStore } from "../../src/store/store";
+
+beforeEach(() => {
+	useStore.setState({
+		ui: {
+			...useStore.getState().ui,
+			viewportLayout: "dual",
+			activeViewport: null,
+			splitRatio: 0.5,
+			layers: {
+				holes: { visible: true, opacity: 1, locked: false },
+				flowPath: { visible: true, opacity: 1, locked: false },
+				grid: { visible: true, opacity: 1, locked: false },
+				walls: { visible: true, opacity: 1, locked: false },
+				sunIndicator: { visible: true, opacity: 1, locked: false },
+			},
+		},
+	});
+});
+
+describe("Default State", () => {
+	it("initial viewportLayout is 'dual'", () => {
+		expect(useStore.getState().ui.viewportLayout).toBe("dual");
+	});
+
+	it("initial splitRatio is 0.5", () => {
+		expect(useStore.getState().ui.splitRatio).toBe(0.5);
+	});
+
+	it("initial activeViewport is null", () => {
+		expect(useStore.getState().ui.activeViewport).toBeNull();
+	});
+
+	it("all 5 layers present", () => {
+		const layers = useStore.getState().ui.layers;
+		expect(Object.keys(layers)).toHaveLength(5);
+		expect(layers).toHaveProperty("holes");
+		expect(layers).toHaveProperty("flowPath");
+		expect(layers).toHaveProperty("grid");
+		expect(layers).toHaveProperty("walls");
+		expect(layers).toHaveProperty("sunIndicator");
+	});
+
+	it("all layers default visible=true, opacity=1, locked=false", () => {
+		const layers = useStore.getState().ui.layers;
+		for (const layer of Object.values(layers)) {
+			expect(layer.visible).toBe(true);
+			expect(layer.opacity).toBe(1);
+			expect(layer.locked).toBe(false);
+		}
+	});
+});
+
+describe("Viewport Layout Actions", () => {
+	describe("setViewportLayout", () => {
+		it("sets viewportLayout to 'dual'", () => {
+			useStore.getState().setViewportLayout("2d-only");
+			useStore.getState().setViewportLayout("dual");
+			expect(useStore.getState().ui.viewportLayout).toBe("dual");
+		});
+
+		it("sets viewportLayout to '2d-only'", () => {
+			useStore.getState().setViewportLayout("2d-only");
+			expect(useStore.getState().ui.viewportLayout).toBe("2d-only");
+		});
+
+		it("sets viewportLayout to '3d-only'", () => {
+			useStore.getState().setViewportLayout("3d-only");
+			expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
+		});
+	});
+
+	describe("setSplitRatio", () => {
+		it("sets splitRatio to 0.5", () => {
+			useStore.getState().setSplitRatio(0.5);
+			expect(useStore.getState().ui.splitRatio).toBe(0.5);
+		});
+
+		it("clamps minimum to 0.2", () => {
+			useStore.getState().setSplitRatio(0.1);
+			expect(useStore.getState().ui.splitRatio).toBe(0.2);
+		});
+
+		it("clamps maximum to 0.8", () => {
+			useStore.getState().setSplitRatio(0.95);
+			expect(useStore.getState().ui.splitRatio).toBe(0.8);
+		});
+
+		it("sets exactly 0.2 (boundary)", () => {
+			useStore.getState().setSplitRatio(0.2);
+			expect(useStore.getState().ui.splitRatio).toBe(0.2);
+		});
+
+		it("sets exactly 0.8 (boundary)", () => {
+			useStore.getState().setSplitRatio(0.8);
+			expect(useStore.getState().ui.splitRatio).toBe(0.8);
+		});
+	});
+
+	describe("collapseTo", () => {
+		it("collapseTo('2d') sets viewportLayout to '2d-only'", () => {
+			useStore.getState().collapseTo("2d");
+			expect(useStore.getState().ui.viewportLayout).toBe("2d-only");
+		});
+
+		it("collapseTo('3d') sets viewportLayout to '3d-only'", () => {
+			useStore.getState().collapseTo("3d");
+			expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
+		});
+
+		it("preserves splitRatio for later expandDual", () => {
+			useStore.getState().setSplitRatio(0.65);
+			useStore.getState().collapseTo("2d");
+			expect(useStore.getState().ui.splitRatio).toBe(0.65);
+		});
+	});
+
+	describe("expandDual", () => {
+		it("sets viewportLayout to 'dual'", () => {
+			useStore.getState().collapseTo("3d");
+			useStore.getState().expandDual();
+			expect(useStore.getState().ui.viewportLayout).toBe("dual");
+		});
+
+		it("preserves splitRatio from before collapse", () => {
+			useStore.getState().setSplitRatio(0.65);
+			useStore.getState().collapseTo("2d");
+			useStore.getState().expandDual();
+			expect(useStore.getState().ui.viewportLayout).toBe("dual");
+			expect(useStore.getState().ui.splitRatio).toBe(0.65);
+		});
+	});
+
+	describe("setActiveViewport", () => {
+		it("sets activeViewport to '2d'", () => {
+			useStore.getState().setActiveViewport("2d");
+			expect(useStore.getState().ui.activeViewport).toBe("2d");
+		});
+
+		it("sets activeViewport to '3d'", () => {
+			useStore.getState().setActiveViewport("3d");
+			expect(useStore.getState().ui.activeViewport).toBe("3d");
+		});
+
+		it("clears activeViewport with null", () => {
+			useStore.getState().setActiveViewport("2d");
+			useStore.getState().setActiveViewport(null);
+			expect(useStore.getState().ui.activeViewport).toBeNull();
+		});
+	});
+});
+
+describe("Layer Management Actions", () => {
+	describe("setLayerVisible", () => {
+		it("sets holes.visible to false", () => {
+			useStore.getState().setLayerVisible("holes", false);
+			expect(useStore.getState().ui.layers.holes.visible).toBe(false);
+		});
+
+		it("sets holes.visible to true", () => {
+			useStore.getState().setLayerVisible("holes", false);
+			useStore.getState().setLayerVisible("holes", true);
+			expect(useStore.getState().ui.layers.holes.visible).toBe(true);
+		});
+
+		it("does not affect other layers", () => {
+			useStore.getState().setLayerVisible("holes", false);
+			const layers = useStore.getState().ui.layers;
+			expect(layers.flowPath.visible).toBe(true);
+			expect(layers.grid.visible).toBe(true);
+			expect(layers.walls.visible).toBe(true);
+			expect(layers.sunIndicator.visible).toBe(true);
+		});
+	});
+
+	describe("setLayerOpacity", () => {
+		it("sets holes.opacity to 0.5", () => {
+			useStore.getState().setLayerOpacity("holes", 0.5);
+			expect(useStore.getState().ui.layers.holes.opacity).toBe(0.5);
+		});
+
+		it("clamps minimum to 0", () => {
+			useStore.getState().setLayerOpacity("holes", -0.5);
+			expect(useStore.getState().ui.layers.holes.opacity).toBe(0);
+		});
+
+		it("clamps maximum to 1", () => {
+			useStore.getState().setLayerOpacity("holes", 1.5);
+			expect(useStore.getState().ui.layers.holes.opacity).toBe(1);
+		});
+	});
+
+	describe("setLayerLocked", () => {
+		it("sets holes.locked to true", () => {
+			useStore.getState().setLayerLocked("holes", true);
+			expect(useStore.getState().ui.layers.holes.locked).toBe(true);
+		});
+
+		it("sets holes.locked to false", () => {
+			useStore.getState().setLayerLocked("holes", true);
+			useStore.getState().setLayerLocked("holes", false);
+			expect(useStore.getState().ui.layers.holes.locked).toBe(false);
+		});
+	});
+
+	describe("toggleLayerVisible", () => {
+		it("flips from true to false", () => {
+			useStore.getState().toggleLayerVisible("holes");
+			expect(useStore.getState().ui.layers.holes.visible).toBe(false);
+		});
+
+		it("flips from false to true", () => {
+			useStore.getState().setLayerVisible("holes", false);
+			useStore.getState().toggleLayerVisible("holes");
+			expect(useStore.getState().ui.layers.holes.visible).toBe(true);
+		});
+	});
+
+	describe("toggleLayerLocked", () => {
+		it("flips from false to true", () => {
+			useStore.getState().toggleLayerLocked("holes");
+			expect(useStore.getState().ui.layers.holes.locked).toBe(true);
+		});
+
+		it("flips from true to false", () => {
+			useStore.getState().setLayerLocked("holes", true);
+			useStore.getState().toggleLayerLocked("holes");
+			expect(useStore.getState().ui.layers.holes.locked).toBe(false);
+		});
+	});
+});
+
+describe("Reset Layers", () => {
+	it("restores all layers to defaults", () => {
+		useStore.getState().setLayerVisible("holes", false);
+		useStore.getState().setLayerOpacity("grid", 0.3);
+		useStore.getState().setLayerLocked("walls", true);
+		useStore.getState().resetLayers();
+		const layers = useStore.getState().ui.layers;
+		for (const layer of Object.values(layers)) {
+			expect(layer.visible).toBe(true);
+			expect(layer.opacity).toBe(1);
+			expect(layer.locked).toBe(false);
+		}
+	});
+
+	it("works after modifying multiple layers", () => {
+		useStore.getState().setLayerVisible("holes", false);
+		useStore.getState().setLayerVisible("flowPath", false);
+		useStore.getState().setLayerOpacity("grid", 0);
+		useStore.getState().setLayerLocked("walls", true);
+		useStore.getState().setLayerLocked("sunIndicator", true);
+		useStore.getState().resetLayers();
+		expect(useStore.getState().ui.layers).toEqual(DEFAULT_LAYERS);
+	});
+});
+
+describe("Persistence & Undo Exclusion", () => {
+	it("viewport/layer fields are NOT in the persisted slice", () => {
+		// The persist middleware's partialize only includes specific top-level keys.
+		// Since viewportLayout, activeViewport, splitRatio, and layers live inside ui
+		// (which is excluded from partialize), they are not persisted.
+		const state = useStore.getState();
+		const persisted = {
+			holes: state.holes,
+			holeOrder: state.holeOrder,
+			budget: state.budget,
+			budgetConfig: state.budgetConfig,
+			financialSettings: state.financialSettings,
+			expenses: state.expenses,
+			holeTemplates: state.holeTemplates,
+			builderDraft: state.builderDraft,
+			gpuTierOverride: state.gpuTierOverride,
+			uvTransitionEnabled: state.uvTransitionEnabled,
+		};
+		expect("viewportLayout" in persisted).toBe(false);
+		expect("layers" in persisted).toBe(false);
+		expect("activeViewport" in persisted).toBe(false);
+		expect("splitRatio" in persisted).toBe(false);
+	});
+});
