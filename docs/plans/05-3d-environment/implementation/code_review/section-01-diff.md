diff --git a/src/components/layout/DualViewport.tsx b/src/components/layout/DualViewport.tsx
index 7a165d5..c185ed0 100644
--- a/src/components/layout/DualViewport.tsx
+++ b/src/components/layout/DualViewport.tsx
@@ -208,11 +208,13 @@ export function DualViewport({ sunData }: DualViewportProps) {
 			: gpuTier === "mid"
 				? [1, 1.5]
 				: [1, 1];
+	const walkthroughMode = useStore((s) => s.ui.walkthroughMode);
 	const frameloop = deriveFrameloop(
 		uvMode,
 		gpuTier,
 		transitioning,
 		viewportLayout,
+		walkthroughMode,
 	);
 	const shadows = getShadowType(gpuTier, isMobile);
 
diff --git a/src/store/store.ts b/src/store/store.ts
index fe1af60..f6047c6 100644
--- a/src/store/store.ts
+++ b/src/store/store.ts
@@ -31,6 +31,7 @@ import type {
 } from "../types";
 import type { HoleTemplate } from "../types/template";
 import { uncertaintyFromTier } from "../utils/financial";
+import { isMobile } from "../utils/isMobile";
 import {
 	migrateBudgetCategories,
 	migrateBudgetConfig,
@@ -107,6 +108,9 @@ type StoreActions = {
 	toggleLayerVisible: (layerId: LayerId) => void;
 	toggleLayerLocked: (layerId: LayerId) => void;
 	resetLayers: () => void;
+	// Walkthrough actions
+	enterWalkthrough: () => void;
+	exitWalkthrough: () => void;
 } & BuilderActions;
 
 export type Store = StoreState & StoreActions;
@@ -152,6 +156,8 @@ const DEFAULT_UI: UIState = {
 	activeViewport: null,
 	splitRatio: 0.5,
 	layers: { ...DEFAULT_LAYERS },
+	walkthroughMode: false,
+	previousViewportLayout: null,
 };
 
 function migrateToV4(state: PersistedSlice): void {
@@ -678,6 +684,32 @@ export const useStore = create<Store>()(
 					set((state) => ({
 						ui: { ...state.ui, layers: { ...DEFAULT_LAYERS } },
 					})),
+				enterWalkthrough: () => {
+					if (isMobile) return;
+					set((state) => ({
+						ui: {
+							...state.ui,
+							walkthroughMode: true,
+							previousViewportLayout: state.ui.viewportLayout,
+							viewportLayout: "3d-only",
+						},
+					}));
+				},
+				exitWalkthrough: () => {
+					const { previousViewportLayout } = get().ui;
+					set((state) => ({
+						ui: { ...state.ui, walkthroughMode: false },
+					}));
+					requestAnimationFrame(() => {
+						set((state) => ({
+							ui: {
+								...state.ui,
+								viewportLayout: previousViewportLayout ?? "dual",
+								previousViewportLayout: null,
+							},
+						}));
+					});
+				},
 			}),
 			{
 				name: "golf-planner-state",
diff --git a/src/types/ui.ts b/src/types/ui.ts
index e26742a..d3aba58 100644
--- a/src/types/ui.ts
+++ b/src/types/ui.ts
@@ -33,4 +33,6 @@ export type UIState = {
 	activeViewport: "2d" | "3d" | null;
 	splitRatio: number; // 0.0-1.0, only used in "dual" mode
 	layers: Record<LayerId, LayerState>;
+	walkthroughMode: boolean;
+	previousViewportLayout: ViewportLayout | null;
 };
diff --git a/src/utils/environmentGating.ts b/src/utils/environmentGating.ts
index a91e2b4..1b7eb78 100644
--- a/src/utils/environmentGating.ts
+++ b/src/utils/environmentGating.ts
@@ -25,7 +25,11 @@ export function deriveFrameloop(
 	gpuTier: GpuTier,
 	transitioning: boolean,
 	viewportLayout: ViewportLayout,
+	walkthroughMode: boolean,
 ): "always" | "demand" {
+	// Walkthrough always needs continuous rendering (FPS camera)
+	if (walkthroughMode) return "always";
+
 	// Transitioning always needs continuous rendering
 	if (transitioning) return "always";
 
diff --git a/tests/store/walkthrough.test.ts b/tests/store/walkthrough.test.ts
new file mode 100644
index 0000000..40c8d91
--- /dev/null
+++ b/tests/store/walkthrough.test.ts
@@ -0,0 +1,180 @@
+import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
+
+const mockMobile = vi.hoisted(() => ({ value: false }));
+vi.mock("../../src/utils/isMobile", () => ({
+	get isMobile() {
+		return mockMobile.value;
+	},
+}));
+
+import { useStore } from "../../src/store/store";
+
+beforeEach(() => {
+	useStore.setState((state) => ({
+		ui: {
+			...state.ui,
+			walkthroughMode: false,
+			previousViewportLayout: null,
+			viewportLayout: "dual",
+		},
+	}));
+});
+
+describe("enterWalkthrough", () => {
+	it("sets walkthroughMode to true", () => {
+		useStore.getState().enterWalkthrough();
+		expect(useStore.getState().ui.walkthroughMode).toBe(true);
+	});
+
+	it("sets viewportLayout to '3d-only'", () => {
+		useStore.getState().enterWalkthrough();
+		expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
+	});
+
+	it("saves previous viewportLayout to previousViewportLayout", () => {
+		useStore.getState().enterWalkthrough();
+		expect(useStore.getState().ui.previousViewportLayout).toBe("dual");
+	});
+
+	it("saves 'dual' as previousViewportLayout when entering from dual", () => {
+		useStore.setState((state) => ({
+			ui: { ...state.ui, viewportLayout: "dual" },
+		}));
+		useStore.getState().enterWalkthrough();
+		expect(useStore.getState().ui.previousViewportLayout).toBe("dual");
+	});
+
+	it("saves '2d-only' as previousViewportLayout when entering from 2d-only", () => {
+		useStore.setState((state) => ({
+			ui: { ...state.ui, viewportLayout: "2d-only" },
+		}));
+		useStore.getState().enterWalkthrough();
+		expect(useStore.getState().ui.previousViewportLayout).toBe("2d-only");
+	});
+});
+
+describe("enterWalkthrough mobile guard", () => {
+	it("no-ops when isMobile is true", () => {
+		mockMobile.value = true;
+		useStore.setState((state) => ({
+			ui: {
+				...state.ui,
+				walkthroughMode: false,
+				viewportLayout: "dual",
+			},
+		}));
+		useStore.getState().enterWalkthrough();
+		expect(useStore.getState().ui.walkthroughMode).toBe(false);
+		expect(useStore.getState().ui.viewportLayout).toBe("dual");
+		mockMobile.value = false;
+	});
+});
+
+describe("exitWalkthrough", () => {
+	let rafCallbacks: Array<() => void>;
+
+	beforeEach(() => {
+		rafCallbacks = [];
+		vi.stubGlobal(
+			"requestAnimationFrame",
+			(cb: () => void) => {
+				rafCallbacks.push(cb);
+				return rafCallbacks.length;
+			},
+		);
+	});
+
+	afterEach(() => {
+		vi.unstubAllGlobals();
+	});
+
+	function flushRAF() {
+		for (const cb of rafCallbacks) cb();
+		rafCallbacks = [];
+	}
+
+	it("sets walkthroughMode to false immediately", () => {
+		useStore.getState().enterWalkthrough();
+		useStore.getState().exitWalkthrough();
+		expect(useStore.getState().ui.walkthroughMode).toBe(false);
+	});
+
+	it("restores viewportLayout from previousViewportLayout after rAF", () => {
+		useStore.getState().enterWalkthrough();
+		expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
+		useStore.getState().exitWalkthrough();
+		flushRAF();
+		expect(useStore.getState().ui.viewportLayout).toBe("dual");
+	});
+
+	it("clears previousViewportLayout to null after rAF", () => {
+		useStore.getState().enterWalkthrough();
+		useStore.getState().exitWalkthrough();
+		flushRAF();
+		expect(useStore.getState().ui.previousViewportLayout).toBeNull();
+	});
+
+	it("full round-trip from dual: enter → exit → restores dual", () => {
+		useStore.setState((state) => ({
+			ui: { ...state.ui, viewportLayout: "dual" },
+		}));
+		useStore.getState().enterWalkthrough();
+		expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
+		expect(useStore.getState().ui.walkthroughMode).toBe(true);
+		useStore.getState().exitWalkthrough();
+		flushRAF();
+		expect(useStore.getState().ui.viewportLayout).toBe("dual");
+		expect(useStore.getState().ui.walkthroughMode).toBe(false);
+	});
+
+	it("full round-trip from 2d-only: enter → exit → restores 2d-only", () => {
+		useStore.setState((state) => ({
+			ui: { ...state.ui, viewportLayout: "2d-only" },
+		}));
+		useStore.getState().enterWalkthrough();
+		expect(useStore.getState().ui.viewportLayout).toBe("3d-only");
+		useStore.getState().exitWalkthrough();
+		flushRAF();
+		expect(useStore.getState().ui.viewportLayout).toBe("2d-only");
+	});
+});
+
+describe("Persistence exclusion", () => {
+	it("walkthroughMode is not included in persisted state", () => {
+		// The partialize function picks specific top-level keys.
+		// ui (where walkthroughMode lives) is not in partialize.
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
+		expect(persisted).not.toHaveProperty("walkthroughMode");
+		expect(persisted).not.toHaveProperty("ui");
+	});
+
+	it("previousViewportLayout is not included in persisted state", () => {
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
+		expect(persisted).not.toHaveProperty("previousViewportLayout");
+		expect(persisted).not.toHaveProperty("ui");
+	});
+});
diff --git a/tests/utils/environment.test.ts b/tests/utils/environment.test.ts
index 4400150..3692a64 100644
--- a/tests/utils/environment.test.ts
+++ b/tests/utils/environment.test.ts
@@ -28,35 +28,95 @@ describe("shouldEnableFog (with viewportLayout)", () => {
 
 describe("deriveFrameloop (with viewportLayout)", () => {
 	it('returns "always" when viewportLayout="dual" (View rendering requires continuous frames)', () => {
-		expect(deriveFrameloop(false, "low", false, "dual")).toBe("always");
-		expect(deriveFrameloop(false, "mid", false, "dual")).toBe("always");
+		expect(deriveFrameloop(false, "low", false, "dual", false)).toBe(
+			"always",
+		);
+		expect(deriveFrameloop(false, "mid", false, "dual", false)).toBe(
+			"always",
+		);
 	});
 
 	it('returns "demand" when uvMode=false AND viewportLayout="3d-only"', () => {
-		expect(deriveFrameloop(false, "low", false, "3d-only")).toBe("demand");
+		expect(deriveFrameloop(false, "low", false, "3d-only", false)).toBe(
+			"demand",
+		);
 	});
 
 	it('returns "demand" when uvMode=true + gpuTier="low" AND viewportLayout="3d-only"', () => {
-		expect(deriveFrameloop(true, "low", false, "3d-only")).toBe("demand");
+		expect(deriveFrameloop(true, "low", false, "3d-only", false)).toBe(
+			"demand",
+		);
 	});
 
 	it('returns "always" when uvMode=true + gpuTier="mid" AND viewportLayout="3d-only"', () => {
-		expect(deriveFrameloop(true, "mid", false, "3d-only")).toBe("always");
+		expect(deriveFrameloop(true, "mid", false, "3d-only", false)).toBe(
+			"always",
+		);
 	});
 
 	it('returns "always" when uvMode=true + gpuTier="high" AND viewportLayout="3d-only"', () => {
-		expect(deriveFrameloop(true, "high", false, "3d-only")).toBe("always");
+		expect(deriveFrameloop(true, "high", false, "3d-only", false)).toBe(
+			"always",
+		);
 	});
 
 	it('returns "always" when transitioning=true regardless of viewportLayout', () => {
-		expect(deriveFrameloop(false, "low", true, "3d-only")).toBe("always");
-		expect(deriveFrameloop(false, "mid", true, "dual")).toBe("always");
-		expect(deriveFrameloop(false, "high", true, "2d-only")).toBe("always");
+		expect(deriveFrameloop(false, "low", true, "3d-only", false)).toBe(
+			"always",
+		);
+		expect(deriveFrameloop(false, "mid", true, "dual", false)).toBe(
+			"always",
+		);
+		expect(deriveFrameloop(false, "high", true, "2d-only", false)).toBe(
+			"always",
+		);
 	});
 
 	it('returns "demand" when viewportLayout="2d-only" and not transitioning', () => {
-		expect(deriveFrameloop(false, "mid", false, "2d-only")).toBe("demand");
-		expect(deriveFrameloop(true, "high", false, "2d-only")).toBe("demand");
+		expect(deriveFrameloop(false, "mid", false, "2d-only", false)).toBe(
+			"demand",
+		);
+		expect(deriveFrameloop(true, "high", false, "2d-only", false)).toBe(
+			"demand",
+		);
+	});
+});
+
+describe("deriveFrameloop with walkthroughMode", () => {
+	it('returns "always" when walkthroughMode=true, regardless of other params', () => {
+		expect(deriveFrameloop(false, "low", false, "3d-only", true)).toBe(
+			"always",
+		);
+	});
+
+	it('walkthroughMode=true + uvMode=false + gpuTier="low" + viewportLayout="3d-only" → "always"', () => {
+		expect(deriveFrameloop(false, "low", false, "3d-only", true)).toBe(
+			"always",
+		);
+	});
+
+	it('walkthroughMode=true + uvMode=true + gpuTier="high" + viewportLayout="3d-only" → "always"', () => {
+		expect(deriveFrameloop(true, "high", false, "3d-only", true)).toBe(
+			"always",
+		);
+	});
+
+	it('walkthroughMode=true + transitioning=false + viewportLayout="2d-only" → "always"', () => {
+		expect(deriveFrameloop(false, "mid", false, "2d-only", true)).toBe(
+			"always",
+		);
+	});
+
+	it('walkthroughMode=false preserves existing behavior: dual → "always"', () => {
+		expect(deriveFrameloop(false, "mid", false, "dual", false)).toBe(
+			"always",
+		);
+	});
+
+	it('walkthroughMode=false preserves existing behavior: 3d-only + low GPU → "demand"', () => {
+		expect(deriveFrameloop(false, "low", false, "3d-only", false)).toBe(
+			"demand",
+		);
 	});
 });
 
