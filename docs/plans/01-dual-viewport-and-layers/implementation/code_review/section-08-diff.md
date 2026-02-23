diff --git a/src/components/ui/LayerPanel.tsx b/src/components/ui/LayerPanel.tsx
new file mode 100644
index 0000000..a1f79e9
--- /dev/null
+++ b/src/components/ui/LayerPanel.tsx
@@ -0,0 +1,45 @@
+import { LAYER_DEFINITIONS } from "../../constants/layers";
+import { useStore } from "../../store";
+import { LayerRow } from "./LayerRow";
+
+export function LayerPanel() {
+	const layers = useStore((s) => s.ui.layers);
+	const toggleLayerVisible = useStore((s) => s.toggleLayerVisible);
+	const setLayerOpacity = useStore((s) => s.setLayerOpacity);
+	const toggleLayerLocked = useStore((s) => s.toggleLayerLocked);
+	const resetLayers = useStore((s) => s.resetLayers);
+
+	return (
+		<div className="flex flex-col gap-1">
+			<p className="mb-2 text-xs text-text-muted">
+				Control layer visibility, opacity, and interaction locks.
+			</p>
+
+			{LAYER_DEFINITIONS.map((def) => {
+				const state = layers[def.id];
+				return (
+					<LayerRow
+						key={def.id}
+						layerId={def.id}
+						label={def.label}
+						icon={def.icon}
+						visible={state.visible}
+						opacity={state.opacity}
+						locked={state.locked}
+						onToggleVisible={() => toggleLayerVisible(def.id)}
+						onOpacityChange={(v) => setLayerOpacity(def.id, v)}
+						onToggleLocked={() => toggleLayerLocked(def.id)}
+					/>
+				);
+			})}
+
+			<button
+				type="button"
+				onClick={resetLayers}
+				className="mt-3 rounded bg-plasma px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-grid-ghost"
+			>
+				Reset All Layers
+			</button>
+		</div>
+	);
+}
diff --git a/src/components/ui/LayerRow.tsx b/src/components/ui/LayerRow.tsx
new file mode 100644
index 0000000..8166b53
--- /dev/null
+++ b/src/components/ui/LayerRow.tsx
@@ -0,0 +1,71 @@
+import type { LayerId } from "../../types/viewport";
+
+type LayerRowProps = {
+	layerId: LayerId;
+	label: string;
+	icon: string;
+	visible: boolean;
+	opacity: number;
+	locked: boolean;
+	onToggleVisible: () => void;
+	onOpacityChange: (value: number) => void;
+	onToggleLocked: () => void;
+};
+
+export function LayerRow({
+	label,
+	icon,
+	visible,
+	opacity,
+	locked,
+	onToggleVisible,
+	onOpacityChange,
+	onToggleLocked,
+}: LayerRowProps) {
+	return (
+		<div
+			className={`flex items-center gap-1.5 rounded px-1.5 py-1 ${visible ? "" : "opacity-50"}`}
+		>
+			{/* Visibility toggle */}
+			<button
+				type="button"
+				onClick={onToggleVisible}
+				aria-label={`Toggle ${label} visibility`}
+				className="w-6 text-center text-sm text-text-secondary hover:text-primary"
+				title={visible ? "Hide" : "Show"}
+			>
+				{visible ? "\u25C9" : "\u25CE"}
+			</button>
+
+			{/* Icon + Label */}
+			<span className="w-20 truncate text-xs text-text-secondary">
+				<span className="mr-1">{icon}</span>
+				{label}
+			</span>
+
+			{/* Opacity slider */}
+			<input
+				type="range"
+				min="0"
+				max="100"
+				step="1"
+				value={Math.round(opacity * 100)}
+				onChange={(e) => onOpacityChange(Number(e.target.value) / 100)}
+				disabled={!visible}
+				aria-label={`${label} opacity`}
+				className="h-1 flex-1 cursor-pointer accent-accent-text disabled:cursor-not-allowed disabled:opacity-40"
+			/>
+
+			{/* Lock toggle */}
+			<button
+				type="button"
+				onClick={onToggleLocked}
+				aria-label={`Toggle ${label} lock`}
+				className="w-6 text-center text-sm text-text-secondary hover:text-primary"
+				title={locked ? "Unlock" : "Lock"}
+			>
+				{locked ? "\uD83D\uDD12" : "\uD83D\uDD13"}
+			</button>
+		</div>
+	);
+}
diff --git a/src/components/ui/MobileLayerPanel.tsx b/src/components/ui/MobileLayerPanel.tsx
new file mode 100644
index 0000000..53acb48
--- /dev/null
+++ b/src/components/ui/MobileLayerPanel.tsx
@@ -0,0 +1,34 @@
+import { useStore } from "../../store";
+import { LayerPanel } from "./LayerPanel";
+
+export function MobileLayerPanel() {
+	const activePanel = useStore((s) => s.ui.activePanel);
+	const setActivePanel = useStore((s) => s.setActivePanel);
+
+	if (activePanel !== "layers") return null;
+
+	function handleClose() {
+		setActivePanel(null);
+	}
+
+	return (
+		<div className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden">
+			{/* Header */}
+			<div className="flex items-center justify-between border-b border-subtle px-4 py-3">
+				<span className="text-base font-semibold">Layers</span>
+				<button
+					type="button"
+					onClick={handleClose}
+					className="rounded-lg p-2 text-text-muted hover:bg-plasma hover:text-text-secondary"
+				>
+					<span className="text-xl">&#x2715;</span>
+				</button>
+			</div>
+
+			{/* Reuse LayerPanel content */}
+			<div className="flex-1 overflow-y-auto p-4">
+				<LayerPanel />
+			</div>
+		</div>
+	);
+}
diff --git a/src/components/ui/Sidebar.tsx b/src/components/ui/Sidebar.tsx
index 96a1cfd..a8cba75 100644
--- a/src/components/ui/Sidebar.tsx
+++ b/src/components/ui/Sidebar.tsx
@@ -3,11 +3,13 @@ import type { SidebarTab } from "../../types";
 import { BudgetPanel } from "./BudgetPanel";
 import { HoleDetail } from "./HoleDetail";
 import { HoleLibrary } from "./HoleLibrary";
+import { LayerPanel } from "./LayerPanel";
 
 const tabs: { tab: SidebarTab; label: string }[] = [
 	{ tab: "holes", label: "Holes" },
 	{ tab: "detail", label: "Detail" },
 	{ tab: "budget", label: "Budget" },
+	{ tab: "layers", label: "Layers" },
 ];
 
 export function Sidebar() {
@@ -38,6 +40,7 @@ export function Sidebar() {
 				{activeTab === "holes" && <HoleLibrary />}
 				{activeTab === "detail" && <HoleDetail />}
 				{activeTab === "budget" && <BudgetPanel />}
+				{activeTab === "layers" && <LayerPanel />}
 			</div>
 		</div>
 	);
diff --git a/src/constants/layers.ts b/src/constants/layers.ts
new file mode 100644
index 0000000..26e55b3
--- /dev/null
+++ b/src/constants/layers.ts
@@ -0,0 +1,19 @@
+import type { LayerId } from "../types/viewport";
+
+export type LayerDefinition = {
+	id: LayerId;
+	label: string;
+	icon: string;
+};
+
+/**
+ * Ordered list of layer definitions for the Layer Panel UI.
+ * Order matches the visual stacking order (top-most layer first).
+ */
+export const LAYER_DEFINITIONS: LayerDefinition[] = [
+	{ id: "holes", label: "Holes", icon: "\u26F3" },
+	{ id: "flowPath", label: "Flow Path", icon: "\u2192" },
+	{ id: "grid", label: "Grid", icon: "\u2317" },
+	{ id: "walls", label: "Walls", icon: "\u25A1" },
+	{ id: "sunIndicator", label: "Sun", icon: "\u2600" },
+];
diff --git a/tests/components/layerPanel.test.ts b/tests/components/layerPanel.test.ts
new file mode 100644
index 0000000..e85ce91
--- /dev/null
+++ b/tests/components/layerPanel.test.ts
@@ -0,0 +1,25 @@
+import { describe, expect, it } from "vitest";
+import { LAYER_DEFINITIONS } from "../../src/constants/layers";
+
+describe("LAYER_DEFINITIONS", () => {
+	it("contains exactly 5 entries", () => {
+		expect(LAYER_DEFINITIONS).toHaveLength(5);
+	});
+
+	it("includes all expected layer IDs", () => {
+		const ids = LAYER_DEFINITIONS.map((d) => d.id);
+		expect(ids).toContain("holes");
+		expect(ids).toContain("flowPath");
+		expect(ids).toContain("grid");
+		expect(ids).toContain("walls");
+		expect(ids).toContain("sunIndicator");
+	});
+
+	it("each definition has id, label, and icon", () => {
+		for (const def of LAYER_DEFINITIONS) {
+			expect(def.id).toBeTruthy();
+			expect(def.label).toBeTruthy();
+			expect(def.icon).toBeTruthy();
+		}
+	});
+});
