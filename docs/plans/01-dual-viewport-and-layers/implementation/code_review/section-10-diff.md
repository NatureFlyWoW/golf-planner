diff --git a/src/components/layout/DualViewport.tsx b/src/components/layout/DualViewport.tsx
index 891f770..f426838 100644
--- a/src/components/layout/DualViewport.tsx
+++ b/src/components/layout/DualViewport.tsx
@@ -265,6 +265,7 @@ export function DualViewport({ sunData }: DualViewportProps) {
 							<PlacementHandler />
 						</ViewportContext.Provider>
 					</View>
+					<MiniMap />
 				</div>
 			)}
 
@@ -344,7 +345,6 @@ export function DualViewport({ sunData }: DualViewportProps) {
 			{/* Overlay components */}
 			<SunControls />
 			<KeyboardHelp />
-			<MiniMap />
 		</div>
 	);
 }
diff --git a/src/components/ui/BottomToolbar.tsx b/src/components/ui/BottomToolbar.tsx
index 12a1c13..e08ede2 100644
--- a/src/components/ui/BottomToolbar.tsx
+++ b/src/components/ui/BottomToolbar.tsx
@@ -28,8 +28,8 @@ export function BottomToolbar() {
 	const selectHole = useStore((s) => s.selectHole);
 
 	const snapEnabled = useStore((s) => s.ui.snapEnabled);
-	const showFlowPath = useStore((s) => s.ui.showFlowPath);
-	const hasActiveToggles = snapEnabled || showFlowPath;
+	const flowPathVisible = useStore((s) => s.ui.layers.flowPath.visible);
+	const hasActiveToggles = snapEnabled || flowPathVisible;
 
 	function handleToolTap(tool: Tool) {
 		if (tool === "place") {
@@ -166,8 +166,8 @@ export function BottomToolbar() {
 function OverflowPopover({ onClose }: { onClose: () => void }) {
 	const snapEnabled = useStore((s) => s.ui.snapEnabled);
 	const toggleSnap = useStore((s) => s.toggleSnap);
-	const showFlowPath = useStore((s) => s.ui.showFlowPath);
-	const toggleFlowPath = useStore((s) => s.toggleFlowPath);
+	const flowPathVisible = useStore((s) => s.ui.layers.flowPath.visible);
+	const toggleLayerVisible = useStore((s) => s.toggleLayerVisible);
 	const view = useStore((s) => s.ui.view);
 	const setView = useStore((s) => s.setView);
 	const uvMode = useStore((s) => s.ui.uvMode);
@@ -194,7 +194,7 @@ function OverflowPopover({ onClose }: { onClose: () => void }) {
 			{/* Popover */}
 			<div className="absolute bottom-16 right-2 z-50 grid grid-cols-2 gap-2 rounded-lg border border-subtle bg-surface-raised p-3 shadow-lg">
 				<ToggleBtn label="Snap" active={snapEnabled} onTap={toggleSnap} />
-				<ToggleBtn label="Flow" active={showFlowPath} onTap={toggleFlowPath} />
+				<ToggleBtn label="Flow" active={flowPathVisible} onTap={() => toggleLayerVisible("flowPath")} />
 				<ToggleBtn
 					label={view === "top" ? "3D" : "2D"}
 					active={false}
diff --git a/src/components/ui/Toolbar.tsx b/src/components/ui/Toolbar.tsx
index 18331a2..7fa5c2d 100644
--- a/src/components/ui/Toolbar.tsx
+++ b/src/components/ui/Toolbar.tsx
@@ -18,10 +18,8 @@ export function Toolbar() {
 	const setTool = useStore((s) => s.setTool);
 	const snapEnabled = useStore((s) => s.ui.snapEnabled);
 	const toggleSnap = useStore((s) => s.toggleSnap);
-	const showFlowPath = useStore((s) => s.ui.showFlowPath);
-	const toggleFlowPath = useStore((s) => s.toggleFlowPath);
-	const view = useStore((s) => s.ui.view);
-	const setView = useStore((s) => s.setView);
+	const flowPathVisible = useStore((s) => s.ui.layers.flowPath.visible);
+	const toggleLayerVisible = useStore((s) => s.toggleLayerVisible);
 	const toggleUvMode = useStore((s) => s.toggleUvMode);
 	const uvMode = useStore((s) => s.ui.uvMode);
 	const transitioning = useStore((s) => s.ui.transitioning);
@@ -63,7 +61,7 @@ export function Toolbar() {
 	}`;
 
 	const flowBtnClass = `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
-		showFlowPath
+		flowPathVisible
 			? "bg-accent-text text-white"
 			: "bg-plasma text-text-secondary hover:bg-grid-ghost"
 	}`;
@@ -98,23 +96,13 @@ export function Toolbar() {
 
 			<button
 				type="button"
-				onClick={toggleFlowPath}
+				onClick={() => toggleLayerVisible("flowPath")}
 				className={flowBtnClass}
 				title="Toggle player flow path"
 			>
 				Flow
 			</button>
 
-			<button
-				type="button"
-				onClick={() => setView(view === "top" ? "3d" : "top")}
-				className={neutralBtnClass}
-				title="Toggle 2D/3D view"
-				data-testid="view-toggle"
-			>
-				{view === "top" ? "3D" : "2D"}
-			</button>
-
 			<button
 				type="button"
 				onClick={toggleUvMode}
diff --git a/src/store/store.ts b/src/store/store.ts
index 80454bb..0081b27 100644
--- a/src/store/store.ts
+++ b/src/store/store.ts
@@ -76,7 +76,6 @@ type StoreActions = {
 	setView: (view: UIState["view"]) => void;
 	setSidebarTab: (tab: UIState["sidebarTab"]) => void;
 	toggleSnap: () => void;
-	toggleFlowPath: () => void;
 	setActivePanel: (panel: UIState["activePanel"]) => void;
 	setSunDate: (date: Date | undefined) => void;
 	updateBudget: (id: string, updates: Partial<BudgetCategoryV2>) => void;
@@ -143,7 +142,6 @@ const DEFAULT_UI: UIState = {
 	view: "top",
 	sidebarTab: "holes",
 	snapEnabled: false,
-	showFlowPath: true,
 	activePanel: null,
 	sunDate: undefined,
 	uvMode: false,
@@ -463,15 +461,6 @@ export const useStore = create<Store>()(
 					}));
 				},
 
-				toggleFlowPath: () => {
-					set((state) => ({
-						ui: {
-							...state.ui,
-							showFlowPath: !state.ui.showFlowPath,
-						},
-					}));
-				},
-
 				setActivePanel: (panel) => {
 					set((state) => ({
 						ui: { ...state.ui, activePanel: panel },
diff --git a/src/types/ui.ts b/src/types/ui.ts
index cefaefd..e26742a 100644
--- a/src/types/ui.ts
+++ b/src/types/ui.ts
@@ -23,7 +23,6 @@ export type UIState = {
 	view: ViewMode;
 	sidebarTab: SidebarTab;
 	snapEnabled: boolean;
-	showFlowPath: boolean;
 	activePanel: ActivePanel;
 	sunDate: Date | undefined;
 	uvMode: boolean;
diff --git a/tests/components/featureMigration.test.ts b/tests/components/featureMigration.test.ts
new file mode 100644
index 0000000..a3311b6
--- /dev/null
+++ b/tests/components/featureMigration.test.ts
@@ -0,0 +1,42 @@
+import { beforeEach, describe, expect, it } from "vitest";
+import { useStore } from "../../src/store";
+
+describe("Feature Migration", () => {
+	beforeEach(() => {
+		useStore.setState({
+			holes: {},
+			holeOrder: [],
+			selectedId: null,
+		});
+	});
+
+	describe("showFlowPath removal", () => {
+		it("store no longer has showFlowPath field in UIState", () => {
+			const ui = useStore.getState().ui;
+			expect("showFlowPath" in ui).toBe(false);
+		});
+
+		it("store no longer has toggleFlowPath action", () => {
+			const store = useStore.getState();
+			expect("toggleFlowPath" in store).toBe(false);
+		});
+	});
+
+	describe("Flow path toggle migration", () => {
+		it("layers.flowPath.visible exists and defaults to true", () => {
+			const store = useStore.getState();
+			expect(store.ui.layers.flowPath.visible).toBe(true);
+		});
+
+		it("toggleLayerVisible('flowPath') toggles visibility", () => {
+			const store = useStore.getState();
+			expect(store.ui.layers.flowPath.visible).toBe(true);
+
+			store.toggleLayerVisible("flowPath");
+			expect(useStore.getState().ui.layers.flowPath.visible).toBe(false);
+
+			useStore.getState().toggleLayerVisible("flowPath");
+			expect(useStore.getState().ui.layers.flowPath.visible).toBe(true);
+		});
+	});
+});
diff --git a/tests/utils/activePanel.test.ts b/tests/utils/activePanel.test.ts
index e652d70..a2c4639 100644
--- a/tests/utils/activePanel.test.ts
+++ b/tests/utils/activePanel.test.ts
@@ -13,7 +13,6 @@ describe("activePanel", () => {
 				view: "top",
 				sidebarTab: "holes",
 				snapEnabled: false,
-				showFlowPath: true,
 				activePanel: null,
 				sunDate: undefined,
 			},
diff --git a/tests/utils/store.test.ts b/tests/utils/store.test.ts
index 02a3aee..c211214 100644
--- a/tests/utils/store.test.ts
+++ b/tests/utils/store.test.ts
@@ -13,7 +13,6 @@ describe("store", () => {
 				view: "top",
 				sidebarTab: "holes",
 				snapEnabled: false,
-				showFlowPath: true,
 				activePanel: null,
 			},
 		});
