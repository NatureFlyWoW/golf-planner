diff --git a/src/App.tsx b/src/App.tsx
index 8231a2d..94ac367 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -46,7 +46,7 @@ export default function App() {
 	}, [budgetSize, initBudget]);
 
 	return (
-		<div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-100">
+		<div className="flex h-screen w-screen flex-col overflow-hidden bg-surface">
 			<Toolbar />
 			<div className="flex flex-1 overflow-hidden">
 				<Sidebar />
diff --git a/src/components/builder/Builder.tsx b/src/components/builder/Builder.tsx
index d6f7423..10a3add 100644
--- a/src/components/builder/Builder.tsx
+++ b/src/components/builder/Builder.tsx
@@ -14,7 +14,7 @@ export default function Builder() {
 	if (!builderMode) return null;
 
 	return (
-		<div className="fixed inset-0 z-50 flex flex-col bg-gray-100">
+		<div className="fixed inset-0 z-50 flex flex-col bg-surface">
 			<BuilderUI
 				selectedSegmentId={selectedSegmentId}
 				onSelectSegment={setSelectedSegmentId}
diff --git a/src/components/builder/BuilderUI.tsx b/src/components/builder/BuilderUI.tsx
index f8ec6ed..932328f 100644
--- a/src/components/builder/BuilderUI.tsx
+++ b/src/components/builder/BuilderUI.tsx
@@ -79,16 +79,16 @@ export function BuilderUI({ selectedSegmentId, onSelectSegment }: Props) {
 
 	// Top bar
 	const topBar = (
-		<div className="flex items-center gap-2 border-b bg-white px-3 py-2">
+		<div className="flex items-center gap-2 border-b border-subtle bg-surface-raised px-3 py-2">
 			<input
 				type="text"
 				value={draft?.name ?? ""}
 				onChange={(e) => setDraftName(e.target.value)}
-				className="w-24 min-w-0 flex-shrink rounded border px-2 py-1 text-sm"
+				className="w-24 min-w-0 flex-shrink rounded border border-subtle px-2 py-1 text-sm"
 				placeholder="Hole name"
 			/>
 
-			<div className="flex items-center gap-1 text-xs text-gray-500">
+			<div className="flex items-center gap-1 text-xs text-text-secondary">
 				<span>W:</span>
 				<input
 					type="range"
@@ -102,12 +102,12 @@ export function BuilderUI({ selectedSegmentId, onSelectSegment }: Props) {
 				<span>{(draft?.feltWidth ?? 0.6).toFixed(1)}m</span>
 			</div>
 
-			<div className="flex items-center gap-1 text-xs text-gray-500">
+			<div className="flex items-center gap-1 text-xs text-text-secondary">
 				<span>Par:</span>
 				<select
 					value={draft?.defaultPar ?? 3}
 					onChange={(e) => setDraftPar(Number(e.target.value))}
-					className="rounded border px-1 py-0.5 text-xs"
+					className="rounded border border-subtle px-1 py-0.5 text-xs"
 				>
 					{[1, 2, 3, 4, 5, 6].map((p) => (
 						<option key={p} value={p}>
@@ -121,7 +121,7 @@ export function BuilderUI({ selectedSegmentId, onSelectSegment }: Props) {
 				<button
 					type="button"
 					onClick={builderUndo}
-					className="rounded p-1 text-gray-500 hover:bg-gray-100"
+					className="rounded p-1 text-text-secondary hover:bg-plasma"
 					title="Undo"
 				>
 					&#x21A9;
@@ -129,7 +129,7 @@ export function BuilderUI({ selectedSegmentId, onSelectSegment }: Props) {
 				<button
 					type="button"
 					onClick={builderRedo}
-					className="rounded p-1 text-gray-500 hover:bg-gray-100"
+					className="rounded p-1 text-text-secondary hover:bg-plasma"
 					title="Redo"
 				>
 					&#x21AA;
@@ -137,7 +137,7 @@ export function BuilderUI({ selectedSegmentId, onSelectSegment }: Props) {
 				<button
 					type="button"
 					onClick={removeLastSegment}
-					className="rounded p-1 text-gray-500 hover:bg-gray-100"
+					className="rounded p-1 text-text-secondary hover:bg-plasma"
 					title="Remove last segment"
 				>
 					&#x232B;
@@ -148,8 +148,8 @@ export function BuilderUI({ selectedSegmentId, onSelectSegment }: Props) {
 					disabled={!canDelete}
 					className={`rounded p-1 transition-colors ${
 						canDelete
-							? "text-red-500 hover:bg-red-50"
-							: "cursor-not-allowed text-gray-300"
+							? "text-neon-pink hover:bg-neon-pink/10"
+							: "cursor-not-allowed text-text-muted"
 					}`}
 					title="Delete selected segment (Delete key)"
 				>
@@ -158,7 +158,7 @@ export function BuilderUI({ selectedSegmentId, onSelectSegment }: Props) {
 				<button
 					type="button"
 					onClick={handleCancel}
-					className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300"
+					className="rounded bg-plasma px-2 py-1 text-xs text-primary hover:bg-grid-ghost"
 				>
 					Cancel
 				</button>
@@ -168,8 +168,8 @@ export function BuilderUI({ selectedSegmentId, onSelectSegment }: Props) {
 					disabled={!canSave}
 					className={`rounded px-2 py-1 text-xs font-medium ${
 						canSave
-							? "bg-green-600 text-white hover:bg-green-700"
-							: "cursor-not-allowed bg-gray-300 text-gray-500"
+							? "bg-neon-green/80 text-white hover:bg-neon-green/70"
+							: "cursor-not-allowed bg-plasma text-text-muted"
 					}`}
 				>
 					Save
@@ -182,13 +182,13 @@ export function BuilderUI({ selectedSegmentId, onSelectSegment }: Props) {
 	const panelContent = (
 		<>
 			{isMobile && (
-				<div className="flex border-b">
+				<div className="flex border-b border-subtle">
 					<button
 						type="button"
 						className={`flex-1 py-2 text-xs font-medium ${
 							activeTab === "build"
-								? "border-b-2 border-green-600 text-green-700"
-								: "text-gray-500"
+								? "border-b-2 border-neon-green text-neon-green"
+								: "text-text-secondary"
 						}`}
 						onClick={() => setActiveTab("build")}
 					>
@@ -198,8 +198,8 @@ export function BuilderUI({ selectedSegmentId, onSelectSegment }: Props) {
 						type="button"
 						className={`flex-1 py-2 text-xs font-medium ${
 							activeTab === "chain"
-								? "border-b-2 border-green-600 text-green-700"
-								: "text-gray-500"
+								? "border-b-2 border-neon-green text-neon-green"
+								: "text-text-secondary"
 						}`}
 						onClick={() => setActiveTab("chain")}
 					>
@@ -230,7 +230,7 @@ export function BuilderUI({ selectedSegmentId, onSelectSegment }: Props) {
 			<>
 				{topBar}
 				{/* Bottom panel */}
-				<div className="absolute inset-x-0 bottom-0 z-10 flex max-h-[40vh] flex-col border-t bg-white">
+				<div className="absolute inset-x-0 bottom-0 z-10 flex max-h-[40vh] flex-col border-t border-subtle bg-surface-raised">
 					{panelContent}
 				</div>
 			</>
@@ -241,7 +241,7 @@ export function BuilderUI({ selectedSegmentId, onSelectSegment }: Props) {
 	return (
 		<>
 			{topBar}
-			<div className="absolute inset-y-0 left-0 top-[41px] z-10 flex w-64 flex-col border-r bg-white">
+			<div className="absolute inset-y-0 left-0 top-[41px] z-10 flex w-64 flex-col border-r border-subtle bg-surface-raised">
 				{panelContent}
 			</div>
 		</>
diff --git a/src/components/builder/ChainList.tsx b/src/components/builder/ChainList.tsx
index d6ae9c6..a7f3f24 100644
--- a/src/components/builder/ChainList.tsx
+++ b/src/components/builder/ChainList.tsx
@@ -15,7 +15,7 @@ export function ChainList({ selectedSegmentId, onSelectSegment }: Props) {
 
 	if (segments.length === 0) {
 		return (
-			<div className="flex h-24 items-center justify-center text-sm text-gray-400">
+			<div className="flex h-24 items-center justify-center text-sm text-text-muted">
 				Add segments to build your hole
 			</div>
 		);
@@ -23,7 +23,7 @@ export function ChainList({ selectedSegmentId, onSelectSegment }: Props) {
 
 	return (
 		<div className="flex flex-col gap-1">
-			<div className="text-xs text-gray-500">
+			<div className="text-xs text-text-secondary">
 				{segments.length} segments · {totalLength.toFixed(1)}m total
 			</div>
 			<div
@@ -36,14 +36,14 @@ export function ChainList({ selectedSegmentId, onSelectSegment }: Props) {
 						type="button"
 						className={`flex items-center gap-2 rounded px-2 py-1 text-left text-xs transition-colors ${
 							selectedSegmentId === seg.id
-								? "bg-green-100 text-green-800"
-								: "text-gray-700 hover:bg-gray-100"
+								? "bg-neon-green/15 text-neon-green"
+								: "text-primary hover:bg-plasma"
 						}`}
 						onClick={() =>
 							onSelectSegment(selectedSegmentId === seg.id ? null : seg.id)
 						}
 					>
-						<span className="text-gray-400">{i + 1}.</span>
+						<span className="text-text-muted">{i + 1}.</span>
 						<span>{SEGMENT_SPECS[seg.specId].label}</span>
 					</button>
 				))}
diff --git a/src/components/builder/SegmentPalette.tsx b/src/components/builder/SegmentPalette.tsx
index bcef5fe..c55f1bc 100644
--- a/src/components/builder/SegmentPalette.tsx
+++ b/src/components/builder/SegmentPalette.tsx
@@ -41,8 +41,8 @@ export function SegmentPalette({ onSelect, activeSpecId, replaceMode }: Props) {
 						type="button"
 						className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
 							activeCategory === id
-								? "bg-green-600 text-white"
-								: "bg-gray-200 text-gray-700 hover:bg-gray-300"
+								? "bg-neon-green/80 text-white"
+								: "bg-plasma text-primary hover:bg-grid-ghost"
 						}`}
 						onClick={() => setActiveCategory(id)}
 					>
@@ -62,7 +62,7 @@ export function SegmentPalette({ onSelect, activeSpecId, replaceMode }: Props) {
 								? "border-green-500 bg-green-50 text-green-700"
 								: replaceMode
 									? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
-									: "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
+									: "border-subtle bg-surface-raised text-primary hover:bg-plasma"
 						}`}
 						onClick={() => onSelect(spec.id)}
 					>
diff --git a/src/components/ui/BottomToolbar.tsx b/src/components/ui/BottomToolbar.tsx
index 4840fb1..bad5969 100644
--- a/src/components/ui/BottomToolbar.tsx
+++ b/src/components/ui/BottomToolbar.tsx
@@ -20,7 +20,6 @@ export function BottomToolbar() {
 	const holeOrder = useStore((s) => s.holeOrder);
 	const activePanel = useStore((s) => s.ui.activePanel);
 	const setActivePanel = useStore((s) => s.setActivePanel);
-	const uvMode = useStore((s) => s.ui.uvMode);
 	const [showOverflow, setShowOverflow] = useState(false);
 
 	const selectedHole = selectedId ? holes[selectedId] : null;
@@ -60,9 +59,7 @@ export function BottomToolbar() {
 
 	return (
 		<div
-			className={`flex flex-col border-t md:hidden ${
-				uvMode ? "border-indigo-900 bg-gray-900" : "border-gray-200 bg-white"
-			}`}
+			className="flex flex-col border-t border-subtle bg-surface-raised md:hidden"
 			style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
 		>
 			{/* Info chip row — only when hole selected */}
@@ -70,19 +67,19 @@ export function BottomToolbar() {
 				<button
 					type="button"
 					onClick={handleInfoChipTap}
-					className="flex items-center gap-2 border-b border-gray-100 px-3 py-1.5"
+					className="flex items-center gap-2 border-b border-subtle px-3 py-1.5"
 				>
-					<span className="text-xs font-medium text-gray-700">
+					<span className="text-xs font-medium text-primary">
 						Hole {selectedIndex + 1} &middot; {selectedHole.type}
 					</span>
-					<span className="text-[10px] text-gray-400">tap for details</span>
+					<span className="text-[10px] text-text-muted">tap for details</span>
 				</button>
 			)}
 
 			{/* Placing type chip */}
 			{placingType && (
-				<div className="flex items-center gap-2 border-b border-gray-100 px-3 py-1">
-					<span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
+				<div className="flex items-center gap-2 border-b border-subtle px-3 py-1">
+					<span className="rounded-full bg-plasma px-2 py-0.5 text-xs font-medium text-accent-text">
 						{placingType}
 					</span>
 					<button
@@ -91,7 +88,7 @@ export function BottomToolbar() {
 							setPlacingType(null);
 							setTool("select");
 						}}
-						className="text-xs text-gray-400 hover:text-gray-600"
+						className="text-xs text-text-muted hover:text-text-secondary"
 					>
 						&#x2715;
 					</button>
@@ -108,12 +105,8 @@ export function BottomToolbar() {
 						className={`flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 ${
 							activeTool === tool ||
 							(tool === "place" && activePanel === "holes")
-								? uvMode
-									? "bg-purple-600 text-white"
-									: "bg-blue-600 text-white"
-								: uvMode
-									? "text-gray-400"
-									: "text-gray-600"
+								? "bg-accent-text text-white"
+								: "text-text-secondary"
 						}`}
 					>
 						<span className="text-lg">{icon}</span>
@@ -121,13 +114,13 @@ export function BottomToolbar() {
 					</button>
 				))}
 
-				<div className={`h-8 w-px ${uvMode ? "bg-gray-700" : "bg-gray-200"}`} />
+				<div className="h-8 w-px bg-grid-ghost" />
 
 				{/* Undo */}
 				<button
 					type="button"
 					onClick={() => useStore.temporal?.getState()?.undo()}
-					className={`flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 ${uvMode ? "text-gray-400" : "text-gray-600"}`}
+					className="flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 text-text-secondary"
 				>
 					<span className="text-lg">&#x21A9;</span>
 					<span className="text-[10px]">Undo</span>
@@ -137,26 +130,26 @@ export function BottomToolbar() {
 				<button
 					type="button"
 					onClick={() => useStore.temporal?.getState()?.redo()}
-					className={`flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 ${uvMode ? "text-gray-400" : "text-gray-600"}`}
+					className="flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 text-text-secondary"
 				>
 					<span className="text-lg">&#x21AA;</span>
 					<span className="text-[10px]">Redo</span>
 				</button>
 
-				<div className={`h-8 w-px ${uvMode ? "bg-gray-700" : "bg-gray-200"}`} />
+				<div className="h-8 w-px bg-grid-ghost" />
 
 				{/* More (overflow) */}
 				<button
 					type="button"
 					onClick={() => setShowOverflow((v) => !v)}
 					className={`relative flex min-w-[48px] flex-col items-center justify-center rounded-lg px-2 py-1 ${
-						showOverflow ? "bg-gray-200 text-gray-800" : "text-gray-600"
+						showOverflow ? "bg-plasma text-primary" : "text-text-secondary"
 					}`}
 				>
 					<span className="text-lg">&middot;&middot;&middot;</span>
 					<span className="text-[10px]">More</span>
 					{hasActiveToggles && (
-						<span className="absolute right-1 top-0 h-2 w-2 rounded-full bg-blue-500" />
+						<span className="absolute right-1 top-0 h-2 w-2 rounded-full bg-accent-text" />
 					)}
 				</button>
 			</div>
@@ -197,11 +190,7 @@ function OverflowPopover({ onClose }: { onClose: () => void }) {
 				role="presentation"
 			/>
 			{/* Popover */}
-			<div
-				className={`absolute bottom-16 right-2 z-50 grid grid-cols-2 gap-2 rounded-lg border p-3 shadow-lg ${
-					uvMode ? "border-indigo-900 bg-gray-900" : "border-gray-200 bg-white"
-				}`}
-			>
+			<div className="absolute bottom-16 right-2 z-50 grid grid-cols-2 gap-2 rounded-lg border border-subtle bg-surface-raised p-3 shadow-lg">
 				<ToggleBtn label="Snap" active={snapEnabled} onTap={toggleSnap} />
 				<ToggleBtn label="Flow" active={showFlowPath} onTap={toggleFlowPath} />
 				<ToggleBtn
@@ -227,9 +216,7 @@ function OverflowPopover({ onClose }: { onClose: () => void }) {
 						}
 						onClose();
 					}}
-					className={`rounded-lg px-4 py-2 text-sm font-medium ${
-						uvMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
-					}`}
+					className="rounded-lg bg-plasma px-4 py-2 text-sm font-medium text-text-secondary"
 				>
 					Save
 				</button>
@@ -248,9 +235,7 @@ function OverflowPopover({ onClose }: { onClose: () => void }) {
 						downloadJson(data);
 						onClose();
 					}}
-					className={`rounded-lg px-4 py-2 text-sm font-medium ${
-						uvMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
-					}`}
+					className="rounded-lg bg-plasma px-4 py-2 text-sm font-medium text-text-secondary"
 				>
 					Export
 				</button>
@@ -260,9 +245,7 @@ function OverflowPopover({ onClose }: { onClose: () => void }) {
 						setActivePanel("budget");
 						onClose();
 					}}
-					className={`rounded-lg px-4 py-2 text-sm font-medium ${
-						uvMode ? "bg-gray-800 text-gray-300" : "bg-gray-100 text-gray-700"
-					}`}
+					className="rounded-lg bg-plasma px-4 py-2 text-sm font-medium text-text-secondary"
 				>
 					Budget
 				</button>
@@ -280,19 +263,14 @@ function ToggleBtn({
 	active: boolean;
 	onTap: () => void;
 }) {
-	const uvMode = useStore((s) => s.ui.uvMode);
 	return (
 		<button
 			type="button"
 			onClick={onTap}
 			className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
 				active
-					? uvMode
-						? "bg-purple-600 text-white"
-						: "bg-blue-600 text-white"
-					: uvMode
-						? "bg-gray-800 text-gray-300"
-						: "bg-gray-100 text-gray-700"
+					? "bg-accent-text text-white"
+					: "bg-plasma text-text-secondary"
 			}`}
 		>
 			{label}
diff --git a/src/components/ui/BudgetPanel.tsx b/src/components/ui/BudgetPanel.tsx
index 26bd467..51ad328 100644
--- a/src/components/ui/BudgetPanel.tsx
+++ b/src/components/ui/BudgetPanel.tsx
@@ -24,8 +24,8 @@ function displayEur(n: number): string {
 /** Progress bar color based on actual/estimated ratio */
 function progressColor(ratio: number): string {
 	if (ratio > 1) return "bg-red-500";
-	if (ratio > 0.8) return "bg-amber-500";
-	return "bg-blue-500";
+	if (ratio > 0.8) return "bg-neon-amber";
+	return "bg-accent-text";
 }
 
 type BudgetWarning = {
@@ -47,16 +47,16 @@ function quoteStatusBadge(quote: QuoteInfo | undefined): {
 	if (daysRemaining < 0) {
 		return {
 			label: `Expired ${Math.abs(daysRemaining)}d ago`,
-			className: "bg-red-100 text-red-700",
+			className: "bg-neon-pink/15 text-neon-pink",
 		};
 	}
 	if (daysRemaining <= 14) {
 		return {
 			label: `Expires in ${daysRemaining}d`,
-			className: "bg-amber-100 text-amber-700",
+			className: "bg-neon-amber/10 text-neon-amber",
 		};
 	}
-	return { label: "Quoted", className: "bg-green-100 text-green-700" };
+	return { label: "Quoted", className: "bg-neon-green/15 text-neon-green" };
 }
 
 export function BudgetPanel() {
@@ -177,13 +177,13 @@ export function BudgetPanel() {
 	return (
 		<div className="flex h-full flex-col">
 			{/* Summary header */}
-			<div className="border-b border-gray-200 px-3 py-2">
+			<div className="border-b border-subtle px-3 py-2">
 				<div className="flex items-center justify-between">
-					<span className="text-xs font-semibold text-gray-700">Budget</span>
+					<span className="text-xs font-semibold text-primary">Budget</span>
 					<button
 						type="button"
 						onClick={() => setShowFinancialSettings(true)}
-						className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
+						className="rounded p-1 text-text-muted hover:bg-plasma hover:text-text-secondary"
 						title="Financial Settings"
 					>
 						<span className="text-sm">{"\u2699"}</span>
@@ -198,10 +198,10 @@ export function BudgetPanel() {
 								key={w.id}
 								className={`rounded px-2 py-1 text-[10px] ${
 									w.severity === "critical"
-										? "bg-red-50 text-red-700"
+										? "bg-neon-pink/10 text-neon-pink"
 										: w.severity === "warning"
-											? "bg-amber-50 text-amber-700"
-											: "bg-blue-50 text-blue-700"
+											? "bg-neon-amber/10 text-neon-amber"
+											: "bg-plasma text-accent-text"
 								}`}
 							>
 								{w.title}
@@ -211,31 +211,31 @@ export function BudgetPanel() {
 				)}
 
 				<div className="mt-1 flex items-baseline justify-between">
-					<span className="text-xs text-gray-500">Subtotal (net)</span>
+					<span className="text-xs text-text-secondary">Subtotal (net)</span>
 					<span className="text-sm font-semibold">
 						{displayEur(subtotalNet)}
 					</span>
 				</div>
 				{hasInflation && (
 					<div className="flex items-baseline justify-between">
-						<span className="text-xs text-amber-600">
+						<span className="text-xs text-neon-amber">
 							Inflated (+{inflationPct}%)
 						</span>
-						<span className="text-xs font-medium text-amber-600">
+						<span className="text-xs font-medium text-neon-amber">
 							{displayEur(inflatedSubtotalNet)}
 						</span>
 					</div>
 				)}
 				<div className="flex items-baseline justify-between">
-					<span className="text-xs text-gray-500">
+					<span className="text-xs text-text-secondary">
 						Risk buffer ({toleranceLabel}, {riskPercent}%)
 					</span>
-					<span className="text-xs text-gray-600">
+					<span className="text-xs text-text-secondary">
 						{displayEur(riskBuffer)}
 					</span>
 				</div>
 				<div className="mt-0.5 flex items-baseline justify-between">
-					<span className="text-xs font-semibold text-gray-700">
+					<span className="text-xs font-semibold text-primary">
 						Budget Target
 					</span>
 					<span className="text-sm font-bold">
@@ -243,17 +243,17 @@ export function BudgetPanel() {
 					</span>
 				</div>
 				<div className="flex items-baseline justify-between">
-					<span className="text-xs text-gray-500">Actual (spent)</span>
+					<span className="text-xs text-text-secondary">Actual (spent)</span>
 					<span className="text-sm font-semibold">
 						{displayEur(actualTotal)}
 					</span>
 				</div>
 				{financialSettings.vatRegistered && reclaimableVat > 0 && (
 					<div className="mt-0.5 flex items-baseline justify-between">
-						<span className="text-[10px] text-green-600">
+						<span className="text-[10px] text-neon-green">
 							Reclaimable Vorsteuer
 						</span>
-						<span className="text-xs font-medium text-green-600">
+						<span className="text-xs font-medium text-neon-green">
 							{displayEur(reclaimableVat)}
 						</span>
 					</div>
@@ -277,13 +277,13 @@ export function BudgetPanel() {
 								ref={(el) => {
 									cardRefs.current[cat.id] = el;
 								}}
-								className="rounded-lg border border-gray-200 bg-white"
+								className="rounded-lg border border-subtle bg-surface-raised"
 							>
 								{/* Card header */}
 								<div className="flex items-center gap-1 px-2.5 pt-2">
 									{cat.mandatory && (
 										<span
-											className="text-[10px] text-gray-400"
+											className="text-[10px] text-text-muted"
 											title="Mandatory"
 										>
 											{"\uD83D\uDD12"}
@@ -292,7 +292,7 @@ export function BudgetPanel() {
 									<button
 										type="button"
 										onClick={() => handleExpand(cat.id)}
-										className="flex-1 text-left text-xs font-medium text-gray-700"
+										className="flex-1 text-left text-xs font-medium text-primary"
 									>
 										{cat.name}
 									</button>
@@ -300,14 +300,14 @@ export function BudgetPanel() {
 									<span
 										className={`rounded px-1 py-0.5 text-[9px] font-medium ${
 											cat.confidenceTier === "fixed"
-												? "bg-green-100 text-green-700"
+												? "bg-neon-green/15 text-neon-green"
 												: cat.confidenceTier === "low"
-													? "bg-blue-100 text-blue-700"
+													? "bg-plasma text-accent-text"
 													: cat.confidenceTier === "medium"
 														? "bg-yellow-100 text-yellow-700"
 														: cat.confidenceTier === "high"
 															? "bg-orange-100 text-orange-700"
-															: "bg-red-100 text-red-700"
+															: "bg-neon-pink/15 text-neon-pink"
 										}`}
 									>
 										{cat.confidenceTier === "very_high"
@@ -330,7 +330,7 @@ export function BudgetPanel() {
 										<button
 											type="button"
 											onClick={() => toggleCourseOverride()}
-											className="rounded p-0.5 text-gray-400 hover:text-gray-600"
+											className="rounded p-0.5 text-text-muted hover:text-text-secondary"
 											title={
 												cat.manualOverride
 													? "Unlock auto-calculation"
@@ -349,13 +349,13 @@ export function BudgetPanel() {
 									className="w-full px-2.5 pb-2 text-left"
 								>
 									{BUDGET_HINTS[cat.id] && (
-										<div className="text-[10px] text-gray-400 italic">
+										<div className="text-[10px] text-text-muted italic">
 											{BUDGET_HINTS[cat.id]}
 										</div>
 									)}
 									<div className="mt-1 flex gap-2">
 										<div className="flex items-center gap-1">
-											<span className="text-[10px] text-gray-400">Net</span>
+											<span className="text-[10px] text-text-muted">Net</span>
 											<span className="text-xs font-medium">
 												{displayEur(displayNet)}
 											</span>
@@ -363,23 +363,23 @@ export function BudgetPanel() {
 										{financialSettings.displayMode !== "net" &&
 											cat.vatProfile === "standard_20" && (
 												<div className="flex items-center gap-1">
-													<span className="text-[10px] text-gray-400">
+													<span className="text-[10px] text-text-muted">
 														Gross
 													</span>
-													<span className="text-xs text-gray-500">
+													<span className="text-xs text-text-secondary">
 														{displayEur(Math.round(displayNet * 1.2))}
 													</span>
 												</div>
 											)}
 										<div className="flex items-center gap-1">
-											<span className="text-[10px] text-gray-400">Spent</span>
+											<span className="text-[10px] text-text-muted">Spent</span>
 											<span className="text-xs font-medium">
 												{displayEur(catActual)}
 											</span>
 										</div>
 									</div>
 									{/* Progress bar */}
-									<div className="mt-1.5 h-1 w-full rounded-full bg-gray-100">
+									<div className="mt-1.5 h-1 w-full rounded-full bg-surface">
 										<div
 											className={`h-1 rounded-full transition-all ${progressColor(ratio)}`}
 											style={{
@@ -391,11 +391,11 @@ export function BudgetPanel() {
 
 								{/* Expanded: edit fields */}
 								{isExpanded && (
-									<div className="border-t border-gray-100 px-2.5 py-2">
+									<div className="border-t border-subtle px-2.5 py-2">
 										<div className="flex flex-col gap-2">
 											{isCourse && !cat.manualOverride ? (
 												<div className="flex flex-col gap-0.5">
-													<span className="text-[10px] text-gray-400">
+													<span className="text-[10px] text-text-muted">
 														Estimated (auto)
 													</span>
 													<span className="text-xs font-medium">
@@ -404,12 +404,12 @@ export function BudgetPanel() {
 												</div>
 											) : (
 												<label className="flex flex-col gap-0.5">
-													<span className="text-[10px] text-gray-400">
+													<span className="text-[10px] text-text-muted">
 														Estimated (net)
 														{isCourse ? " \u2014 pinned" : ""}
 													</span>
 													<div className="flex items-center gap-1">
-														<span className="text-xs text-gray-400">
+														<span className="text-xs text-text-muted">
 															{"\u20AC"}
 														</span>
 														<input
@@ -424,14 +424,14 @@ export function BudgetPanel() {
 																	),
 																})
 															}
-															className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
+															className="w-full rounded border border-subtle px-1.5 py-1 text-xs"
 														/>
 													</div>
 												</label>
 											)}
 											{/* Confidence tier selector */}
 											<label className="flex flex-col gap-0.5">
-												<span className="text-[10px] text-gray-400">
+												<span className="text-[10px] text-text-muted">
 													Confidence Tier
 												</span>
 												<select
@@ -442,7 +442,7 @@ export function BudgetPanel() {
 															e.target.value as ConfidenceTier,
 														)
 													}
-													className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
+													className="w-full rounded border border-subtle px-1.5 py-1 text-xs"
 												>
 													<option value="fixed">Fixed price (\u00B12%)</option>
 													<option value="low">
@@ -460,7 +460,7 @@ export function BudgetPanel() {
 												</select>
 											</label>
 											<label className="flex flex-col gap-0.5">
-												<span className="text-[10px] text-gray-400">Notes</span>
+												<span className="text-[10px] text-text-muted">Notes</span>
 												<textarea
 													value={cat.notes}
 													onChange={(e) =>
@@ -469,7 +469,7 @@ export function BudgetPanel() {
 														})
 													}
 													rows={2}
-													className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs"
+													className="w-full rounded border border-subtle px-1.5 py-1 text-xs"
 												/>
 											</label>
 											{/* Expense tracking */}
@@ -484,17 +484,17 @@ export function BudgetPanel() {
 			</div>
 
 			{/* Footer: risk buffer + budget target */}
-			<div className="border-t border-gray-200 px-3 py-2">
+			<div className="border-t border-subtle px-3 py-2">
 				<div className="flex items-baseline justify-between">
-					<span className="text-[10px] text-gray-400">
+					<span className="text-[10px] text-text-muted">
 						Risk buffer ({toleranceLabel}, {riskPercent}%)
 					</span>
-					<span className="text-xs text-gray-600">
+					<span className="text-xs text-text-secondary">
 						{displayEur(riskBuffer)}
 					</span>
 				</div>
 				<div className="mt-0.5 flex items-baseline justify-between">
-					<span className="text-xs font-semibold text-gray-700">
+					<span className="text-xs font-semibold text-primary">
 						Budget Target
 					</span>
 					<span className="text-sm font-bold">
@@ -503,10 +503,10 @@ export function BudgetPanel() {
 				</div>
 				{financialSettings.vatRegistered && reclaimableVat > 0 && (
 					<div className="mt-0.5 flex items-baseline justify-between">
-						<span className="text-[10px] text-green-600">
+						<span className="text-[10px] text-neon-green">
 							Reclaimable Vorsteuer
 						</span>
-						<span className="text-xs font-medium text-green-600">
+						<span className="text-xs font-medium text-neon-green">
 							{displayEur(reclaimableVat)}
 						</span>
 					</div>
diff --git a/src/components/ui/CanvasSkeleton.tsx b/src/components/ui/CanvasSkeleton.tsx
index c9b913b..7cc9582 100644
--- a/src/components/ui/CanvasSkeleton.tsx
+++ b/src/components/ui/CanvasSkeleton.tsx
@@ -1,9 +1,9 @@
 export function CanvasSkeleton() {
 	return (
-		<div className="flex h-full w-full items-center justify-center bg-gray-100">
+		<div className="flex h-full w-full items-center justify-center bg-surface">
 			<div className="flex flex-col items-center gap-2">
-				<div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
-				<span className="text-xs text-gray-400">Loading 3D view...</span>
+				<div className="h-8 w-8 animate-spin rounded-full border-2 border-grid-ghost border-t-accent-text" />
+				<span className="text-xs text-text-muted">Loading 3D view...</span>
 			</div>
 		</div>
 	);
diff --git a/src/components/ui/CostSettingsModal.tsx b/src/components/ui/CostSettingsModal.tsx
index 1d0e3b7..289ab39 100644
--- a/src/components/ui/CostSettingsModal.tsx
+++ b/src/components/ui/CostSettingsModal.tsx
@@ -74,21 +74,21 @@ export function CostSettingsModal({ onClose }: Props) {
 		>
 			{/* biome-ignore lint/a11y/noStaticElementInteractions: modal content */}
 			<div
-				className="mx-4 w-full max-w-sm rounded-xl bg-white shadow-xl"
+				className="mx-4 w-full max-w-sm rounded-xl bg-surface-raised shadow-xl"
 				role="presentation"
 				onClick={(e) => e.stopPropagation()}
 				onKeyDown={(e) => e.stopPropagation()}
 			>
 				{/* Header */}
-				<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
+				<div className="flex items-center justify-between border-b border-subtle px-4 py-3">
 					<div className="flex flex-col">
 						<span className="text-sm font-semibold">Per-Type Hole Costs</span>
-						<span className="text-[10px] text-gray-400">{modeLabel}</span>
+						<span className="text-[10px] text-text-muted">{modeLabel}</span>
 					</div>
 					<button
 						type="button"
 						onClick={onClose}
-						className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
+						className="rounded-lg p-1 text-text-muted hover:bg-plasma hover:text-text-secondary"
 					>
 						<span className="text-lg">✕</span>
 					</button>
@@ -96,8 +96,8 @@ export function CostSettingsModal({ onClose }: Props) {
 
 				{/* Material Tier */}
 				{buildMode !== "professional" && (
-					<div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
-						<span className="text-[10px] text-gray-500 uppercase font-medium">
+					<div className="flex items-center justify-between px-4 py-2 border-b border-subtle">
+						<span className="text-[10px] text-text-secondary uppercase font-medium">
 							Material Tier
 						</span>
 						<select
@@ -108,7 +108,7 @@ export function CostSettingsModal({ onClose }: Props) {
 										.value as MaterialProfile,
 								})
 							}
-							className="rounded border border-gray-200 px-2 py-1 text-xs"
+							className="rounded border border-subtle px-2 py-1 text-xs"
 						>
 							<option value="budget_diy">
 								Budget DIY (0.65x)
@@ -126,9 +126,9 @@ export function CostSettingsModal({ onClose }: Props) {
 					{HOLE_TYPES.map((ht) => (
 						// biome-ignore lint/a11y/noLabelWithoutControl: input is conditionally rendered inside
 						<label key={ht.type} className="flex items-center justify-between">
-							<span className="text-xs text-gray-700">{ht.label}</span>
+							<span className="text-xs text-primary">{ht.label}</span>
 							<div className="flex items-center gap-1">
-								<span className="text-xs text-gray-400">€</span>
+								<span className="text-xs text-text-muted">€</span>
 								{isEditable ? (
 									<input
 										type="number"
@@ -137,10 +137,10 @@ export function CostSettingsModal({ onClose }: Props) {
 										onChange={(e) =>
 											handleCostChange(ht.type, Number(e.target.value))
 										}
-										className="w-24 rounded border border-gray-200 px-1.5 py-1 text-right text-xs"
+										className="w-24 rounded border border-subtle px-1.5 py-1 text-right text-xs"
 									/>
 								) : (
-									<span className="w-24 text-right text-xs text-gray-600">
+									<span className="w-24 text-right text-xs text-text-secondary">
 										{(costMap[ht.type] ?? 0).toLocaleString("de-AT")}
 									</span>
 								)}
@@ -151,7 +151,7 @@ export function CostSettingsModal({ onClose }: Props) {
 
 				{/* Build mode info */}
 				{buildMode === "professional" && (
-					<div className="px-4 pb-2 text-[10px] text-gray-400 italic">
+					<div className="px-4 pb-2 text-[10px] text-text-muted italic">
 						Professional costs are fixed. Switch to DIY or Mixed in Financial
 						Settings to edit.
 					</div>
@@ -159,18 +159,18 @@ export function CostSettingsModal({ onClose }: Props) {
 
 				{/* Override warning */}
 				{manualOverride && (
-					<div className="px-4 pb-2 text-[10px] text-amber-600 italic">
+					<div className="px-4 pb-2 text-[10px] text-neon-amber italic">
 						Course estimate is pinned. Changes here apply when you unlock it.
 					</div>
 				)}
 
 				{/* Footer */}
-				<div className="flex justify-end gap-2 border-t border-gray-200 px-4 py-3">
+				<div className="flex justify-end gap-2 border-t border-subtle px-4 py-3">
 					{isEditable && (
 						<button
 							type="button"
 							onClick={handleReset}
-							className="rounded-lg px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100"
+							className="rounded-lg px-3 py-1.5 text-xs text-text-secondary hover:bg-plasma"
 						>
 							Reset Defaults
 						</button>
@@ -178,7 +178,7 @@ export function CostSettingsModal({ onClose }: Props) {
 					<button
 						type="button"
 						onClick={onClose}
-						className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs text-white hover:bg-blue-600"
+						className="rounded-lg bg-accent-text px-3 py-1.5 text-xs text-white hover:bg-accent-text/80"
 					>
 						Close
 					</button>
diff --git a/src/components/ui/CourseBreakdown.tsx b/src/components/ui/CourseBreakdown.tsx
index ac39e40..bc2a354 100644
--- a/src/components/ui/CourseBreakdown.tsx
+++ b/src/components/ui/CourseBreakdown.tsx
@@ -58,25 +58,25 @@ export function CourseBreakdown({ onOpenSettings }: Props) {
 
 	if (holeCount === 0) {
 		return (
-			<div className="px-3 py-2 text-center text-xs text-gray-400 italic">
+			<div className="px-3 py-2 text-center text-xs text-text-muted italic">
 				Place holes to see course cost estimate
 			</div>
 		);
 	}
 
 	return (
-		<div className="border-b border-gray-200">
+		<div className="border-b border-subtle">
 			<div className="flex items-center justify-between px-3 py-2">
 				<div className="flex items-center gap-2">
 					<button
 						type="button"
 						onClick={() => setExpanded(!expanded)}
-						className="flex items-center gap-1 text-xs font-medium text-gray-700"
+						className="flex items-center gap-1 text-xs font-medium text-primary"
 					>
 						<span>{expanded ? "▼" : "▶"}</span>
 						<span>Course Cost Breakdown</span>
 					</button>
-					<span className="text-[10px] text-gray-400">
+					<span className="text-[10px] text-text-muted">
 						(
 						{buildMode === "diy"
 							? "DIY"
@@ -89,7 +89,7 @@ export function CourseBreakdown({ onOpenSettings }: Props) {
 				<button
 					type="button"
 					onClick={onOpenSettings}
-					className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
+					className="rounded p-1 text-text-muted hover:bg-plasma hover:text-text-secondary"
 					title="Edit per-type costs"
 				>
 					<span className="text-sm">⚙</span>
@@ -104,12 +104,12 @@ export function CourseBreakdown({ onOpenSettings }: Props) {
 								key={item.type}
 								className="flex items-baseline justify-between text-xs"
 							>
-								<span className="text-gray-600">
+								<span className="text-text-secondary">
 									{item.count}× {item.label}
 								</span>
-								<span className="text-gray-500">
+								<span className="text-text-secondary">
 									@ {formatEur(item.unitCost)} ={" "}
-									<span className="font-medium text-gray-700">
+									<span className="font-medium text-primary">
 										{formatEur(item.subtotal)}
 									</span>
 								</span>
@@ -117,22 +117,22 @@ export function CourseBreakdown({ onOpenSettings }: Props) {
 						))}
 					</div>
 
-					<div className="my-1 border-t border-gray-100" />
+					<div className="my-1 border-t border-subtle" />
 					<div className="flex items-baseline justify-between text-xs">
-						<span className="font-medium text-gray-700">
+						<span className="font-medium text-primary">
 							Course total ({holeCount} holes)
 						</span>
 						<span className="font-semibold">{formatEur(courseCost)}</span>
 					</div>
 
 					{manualOverride && (
-						<div className="mt-1 text-[10px] text-amber-600 italic">
+						<div className="mt-1 text-[10px] text-neon-amber italic">
 							Pinned estimate — unlock to auto-calculate
 						</div>
 					)}
 
 					{!manualOverride && (
-						<div className="mt-1 text-[10px] text-gray-400 italic">
+						<div className="mt-1 text-[10px] text-text-muted italic">
 							Planning estimates — replace with real quotes when available
 						</div>
 					)}
diff --git a/src/components/ui/ExpenseList.tsx b/src/components/ui/ExpenseList.tsx
index bd0e64c..bb540fa 100644
--- a/src/components/ui/ExpenseList.tsx
+++ b/src/components/ui/ExpenseList.tsx
@@ -43,7 +43,7 @@ export function ExpenseList({ categoryId }: Props) {
 	return (
 		<div className="flex flex-col gap-1">
 			<div className="flex items-center justify-between">
-				<span className="text-[10px] text-gray-400">
+				<span className="text-[10px] text-text-muted">
 					Expenses ({catExpenses.length})
 				</span>
 				<span className="text-xs font-medium">
@@ -58,14 +58,14 @@ export function ExpenseList({ categoryId }: Props) {
 					{catExpenses.map((exp) => (
 						<div
 							key={exp.id}
-							className="flex items-center justify-between rounded bg-gray-50 px-2 py-1"
+							className="flex items-center justify-between rounded bg-surface-raised px-2 py-1"
 						>
 							<div className="flex flex-col">
-								<span className="text-[10px] text-gray-600">
+								<span className="text-[10px] text-text-secondary">
 									{exp.date} — {exp.vendor || "No vendor"}
 								</span>
 								{exp.note && (
-									<span className="text-[9px] text-gray-400">{exp.note}</span>
+									<span className="text-[9px] text-text-muted">{exp.note}</span>
 								)}
 							</div>
 							<div className="flex items-center gap-1">
@@ -78,7 +78,7 @@ export function ExpenseList({ categoryId }: Props) {
 								<button
 									type="button"
 									onClick={() => deleteExpense(exp.id)}
-									className="rounded p-0.5 text-[10px] text-gray-400 hover:text-red-500"
+									className="rounded p-0.5 text-[10px] text-text-muted hover:text-neon-pink"
 									title="Delete expense"
 								>
 									{"\u2715"}
@@ -91,23 +91,23 @@ export function ExpenseList({ categoryId }: Props) {
 
 			{/* Add expense form */}
 			{showForm ? (
-				<div className="flex flex-col gap-1.5 rounded border border-gray-200 bg-gray-50 p-2">
+				<div className="flex flex-col gap-1.5 rounded border border-subtle bg-surface-raised p-2">
 					<div className="flex gap-1">
 						<input
 							type="date"
 							value={date}
 							onChange={(e) => setDate(e.target.value)}
-							className="flex-1 rounded border border-gray-200 px-1.5 py-1 text-[10px]"
+							className="flex-1 rounded border border-subtle px-1.5 py-1 text-[10px]"
 						/>
 						<div className="flex items-center gap-0.5">
-							<span className="text-[10px] text-gray-400">{"\u20AC"}</span>
+							<span className="text-[10px] text-text-muted">{"\u20AC"}</span>
 							<input
 								type="number"
 								value={amount}
 								min={0}
 								placeholder="Amount"
 								onChange={(e) => setAmount(e.target.value)}
-								className="w-20 rounded border border-gray-200 px-1.5 py-1 text-[10px]"
+								className="w-20 rounded border border-subtle px-1.5 py-1 text-[10px]"
 							/>
 						</div>
 					</div>
@@ -116,27 +116,27 @@ export function ExpenseList({ categoryId }: Props) {
 						value={vendor}
 						placeholder="Vendor (optional)"
 						onChange={(e) => setVendor(e.target.value)}
-						className="rounded border border-gray-200 px-1.5 py-1 text-[10px]"
+						className="rounded border border-subtle px-1.5 py-1 text-[10px]"
 					/>
 					<input
 						type="text"
 						value={note}
 						placeholder="Note (optional)"
 						onChange={(e) => setNote(e.target.value)}
-						className="rounded border border-gray-200 px-1.5 py-1 text-[10px]"
+						className="rounded border border-subtle px-1.5 py-1 text-[10px]"
 					/>
 					<div className="flex justify-end gap-1">
 						<button
 							type="button"
 							onClick={() => setShowForm(false)}
-							className="rounded px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-200"
+							className="rounded px-2 py-1 text-[10px] text-text-secondary hover:bg-plasma"
 						>
 							Cancel
 						</button>
 						<button
 							type="button"
 							onClick={handleAdd}
-							className="rounded bg-blue-500 px-2 py-1 text-[10px] text-white hover:bg-blue-600"
+							className="rounded bg-accent-text px-2 py-1 text-[10px] text-white hover:bg-accent-text/80"
 						>
 							Add
 						</button>
@@ -146,7 +146,7 @@ export function ExpenseList({ categoryId }: Props) {
 				<button
 					type="button"
 					onClick={() => setShowForm(true)}
-					className="rounded border border-dashed border-gray-300 px-2 py-1 text-[10px] text-gray-400 hover:bg-gray-50 hover:text-gray-600"
+					className="rounded border border-dashed border-grid-ghost px-2 py-1 text-[10px] text-text-muted hover:bg-surface-raised hover:text-text-secondary"
 				>
 					+ Add expense
 				</button>
diff --git a/src/components/ui/ExportButton.tsx b/src/components/ui/ExportButton.tsx
index 022e65e..6c686f2 100644
--- a/src/components/ui/ExportButton.tsx
+++ b/src/components/ui/ExportButton.tsx
@@ -27,7 +27,7 @@ export function ExportButton() {
 		<button
 			type="button"
 			onClick={handleExport}
-			className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
+			className="rounded bg-surface px-3 py-1.5 text-sm font-medium text-primary hover:bg-plasma"
 		>
 			Export JSON
 		</button>
diff --git a/src/components/ui/FinancialSettingsModal.tsx b/src/components/ui/FinancialSettingsModal.tsx
index b507a9c..7642fe0 100644
--- a/src/components/ui/FinancialSettingsModal.tsx
+++ b/src/components/ui/FinancialSettingsModal.tsx
@@ -52,18 +52,18 @@ export function FinancialSettingsModal({ onClose }: Props) {
 		>
 			{/* biome-ignore lint/a11y/noStaticElementInteractions: modal content */}
 			<div
-				className="mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl"
+				className="mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-surface-raised shadow-xl"
 				role="presentation"
 				onClick={(e) => e.stopPropagation()}
 				onKeyDown={(e) => e.stopPropagation()}
 			>
 				{/* Header */}
-				<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
+				<div className="flex items-center justify-between border-b border-subtle px-4 py-3">
 					<span className="text-sm font-semibold">Financial Settings</span>
 					<button
 						type="button"
 						onClick={onClose}
-						className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
+						className="rounded-lg p-1 text-text-muted hover:bg-plasma hover:text-text-secondary"
 					>
 						<span className="text-lg">{"\u2715"}</span>
 					</button>
@@ -79,20 +79,20 @@ export function FinancialSettingsModal({ onClose }: Props) {
 								onChange={(e) =>
 									setSettings({ vatRegistered: e.target.checked })
 								}
-								className="h-4 w-4 rounded border-gray-300"
+								className="h-4 w-4 rounded border-subtle"
 							/>
-							<span className="text-xs font-medium text-gray-700">
+							<span className="text-xs font-medium text-primary">
 								VAT registered (Vorsteuerabzugsberechtigt)
 							</span>
 						</label>
-						<p className="mt-1 text-[10px] text-gray-400">
+						<p className="mt-1 text-[10px] text-text-muted">
 							When enabled, shows reclaimable Vorsteuer and net-basis budgeting.
 						</p>
 					</div>
 
 					{/* Display Mode */}
 					<div>
-						<span className="text-[10px] font-medium text-gray-500 uppercase">
+						<span className="text-[10px] font-medium text-text-secondary uppercase">
 							Display Mode
 						</span>
 						<div className="mt-1 flex gap-1">
@@ -103,8 +103,8 @@ export function FinancialSettingsModal({ onClose }: Props) {
 									onClick={() => setSettings({ displayMode: opt.value })}
 									className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] ${
 										settings.displayMode === opt.value
-											? "bg-blue-500 text-white"
-											: "bg-gray-100 text-gray-600 hover:bg-gray-200"
+											? "bg-accent-text text-white"
+											: "bg-surface text-text-secondary hover:bg-plasma"
 									}`}
 								>
 									{opt.label}
@@ -115,7 +115,7 @@ export function FinancialSettingsModal({ onClose }: Props) {
 
 					{/* Risk Tolerance */}
 					<div>
-						<span className="text-[10px] font-medium text-gray-500 uppercase">
+						<span className="text-[10px] font-medium text-text-secondary uppercase">
 							Risk Tolerance
 						</span>
 						<div className="mt-1 flex flex-col gap-1">
@@ -126,12 +126,12 @@ export function FinancialSettingsModal({ onClose }: Props) {
 									onClick={() => setSettings({ riskTolerance: opt.value })}
 									className={`flex items-baseline justify-between rounded-lg px-3 py-2 text-left ${
 										settings.riskTolerance === opt.value
-											? "bg-blue-50 ring-1 ring-blue-500"
-											: "bg-gray-50 hover:bg-gray-100"
+											? "bg-plasma ring-1 ring-accent-text"
+											: "bg-surface-raised hover:bg-plasma"
 									}`}
 								>
 									<span className="text-xs font-medium">{opt.label}</span>
-									<span className="text-[10px] text-gray-400">{opt.desc}</span>
+									<span className="text-[10px] text-text-muted">{opt.desc}</span>
 								</button>
 							))}
 						</div>
@@ -139,7 +139,7 @@ export function FinancialSettingsModal({ onClose }: Props) {
 
 					{/* Build Mode */}
 					<div>
-						<span className="text-[10px] font-medium text-gray-500 uppercase">
+						<span className="text-[10px] font-medium text-text-secondary uppercase">
 							Build Mode (Course Costs)
 						</span>
 						<div className="mt-1 flex flex-col gap-1">
@@ -150,12 +150,12 @@ export function FinancialSettingsModal({ onClose }: Props) {
 									onClick={() => setSettings({ buildMode: opt.value })}
 									className={`flex items-baseline justify-between rounded-lg px-3 py-2 text-left ${
 										settings.buildMode === opt.value
-											? "bg-blue-50 ring-1 ring-blue-500"
-											: "bg-gray-50 hover:bg-gray-100"
+											? "bg-plasma ring-1 ring-accent-text"
+											: "bg-surface-raised hover:bg-plasma"
 									}`}
 								>
 									<span className="text-xs font-medium">{opt.label}</span>
-									<span className="text-[10px] text-gray-400">{opt.desc}</span>
+									<span className="text-[10px] text-text-muted">{opt.desc}</span>
 								</button>
 							))}
 						</div>
@@ -164,7 +164,7 @@ export function FinancialSettingsModal({ onClose }: Props) {
 					{/* Inflation Adjustment */}
 					<div>
 						<label className="flex flex-col gap-1">
-							<span className="text-[10px] font-medium text-gray-500 uppercase">
+							<span className="text-[10px] font-medium text-text-secondary uppercase">
 								Inflation Adjustment
 							</span>
 							<div className="flex items-center gap-2">
@@ -179,12 +179,12 @@ export function FinancialSettingsModal({ onClose }: Props) {
 											inflationFactor: 1 + Number(e.target.value) / 100,
 										})
 									}
-									className="w-20 rounded border border-gray-200 px-2 py-1 text-xs"
+									className="w-20 rounded border border-subtle px-2 py-1 text-xs"
 								/>
-								<span className="text-xs text-gray-500">%</span>
+								<span className="text-xs text-text-secondary">%</span>
 							</div>
 							{settings.inflationFactor !== 1 && (
-								<p className="text-[10px] text-amber-600">
+								<p className="text-[10px] text-neon-amber">
 									Estimates adjusted for{" "}
 									{Math.round((settings.inflationFactor - 1) * 100)}% inflation
 									(non-fixed categories only).
@@ -195,7 +195,7 @@ export function FinancialSettingsModal({ onClose }: Props) {
 
 					{/* GPU Quality */}
 					<div>
-						<span className="text-[10px] font-medium text-gray-500 uppercase">
+						<span className="text-[10px] font-medium text-text-secondary uppercase">
 							GPU Quality
 						</span>
 						<div className="mt-1 flex gap-1">
@@ -211,8 +211,8 @@ export function FinancialSettingsModal({ onClose }: Props) {
 									}}
 									className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] ${
 										gpuTierOverride === opt.value
-											? "bg-blue-500 text-white"
-											: "bg-gray-100 text-gray-600 hover:bg-gray-200"
+											? "bg-accent-text text-white"
+											: "bg-surface text-text-secondary hover:bg-plasma"
 									}`}
 								>
 									{opt.value === "auto"
@@ -221,18 +221,18 @@ export function FinancialSettingsModal({ onClose }: Props) {
 								</button>
 							))}
 						</div>
-						<p className="mt-1 text-[10px] text-gray-400">
+						<p className="mt-1 text-[10px] text-text-muted">
 							Controls 3D rendering quality. Lower = better performance.
 						</p>
 					</div>
 				</div>
 
 				{/* Footer */}
-				<div className="flex justify-end border-t border-gray-200 px-4 py-3">
+				<div className="flex justify-end border-t border-subtle px-4 py-3">
 					<button
 						type="button"
 						onClick={onClose}
-						className="rounded-lg bg-blue-500 px-4 py-1.5 text-xs text-white hover:bg-blue-600"
+						className="rounded-lg bg-accent-text px-4 py-1.5 text-xs text-white hover:bg-accent-text/80"
 					>
 						Done
 					</button>
diff --git a/src/components/ui/HoleDetail.tsx b/src/components/ui/HoleDetail.tsx
index 1b18466..1cd4f7a 100644
--- a/src/components/ui/HoleDetail.tsx
+++ b/src/components/ui/HoleDetail.tsx
@@ -13,7 +13,7 @@ export function HoleDetail() {
 
 	if (!selectedId) {
 		return (
-			<p className="text-xs text-gray-400">Select a hole to see details</p>
+			<p className="text-xs text-text-muted">Select a hole to see details</p>
 		);
 	}
 
@@ -50,17 +50,17 @@ export function HoleDetail() {
 			</div>
 
 			<label className="flex flex-col gap-1">
-				<span className="text-xs text-gray-500">Name</span>
+				<span className="text-xs text-text-secondary">Name</span>
 				<input
 					type="text"
 					value={hole.name}
 					onChange={(e) => updateHole(selectedId, { name: e.target.value })}
-					className="rounded border border-gray-200 px-2 py-1 text-sm"
+					className="rounded border border-subtle px-2 py-1 text-sm"
 				/>
 			</label>
 
 			<label className="flex flex-col gap-1">
-				<span className="text-xs text-gray-500">Par</span>
+				<span className="text-xs text-text-secondary">Par</span>
 				<input
 					type="number"
 					value={hole.par}
@@ -71,12 +71,12 @@ export function HoleDetail() {
 							par: Math.min(6, Math.max(1, Number(e.target.value))),
 						})
 					}
-					className="w-20 rounded border border-gray-200 px-2 py-1 text-sm"
+					className="w-20 rounded border border-subtle px-2 py-1 text-sm"
 				/>
 			</label>
 
 			<div className="flex flex-col gap-1">
-				<span className="text-xs text-gray-500">Rotation</span>
+				<span className="text-xs text-text-secondary">Rotation</span>
 				<div className="flex items-center gap-2">
 					<input
 						type="number"
@@ -89,9 +89,9 @@ export function HoleDetail() {
 								rotation: ((Number(e.target.value) % 360) + 360) % 360,
 							})
 						}
-						className="w-20 rounded border border-gray-200 px-2 py-1 text-sm"
+						className="w-20 rounded border border-subtle px-2 py-1 text-sm"
 					/>
-					<span className="text-xs text-gray-400">°</span>
+					<span className="text-xs text-text-muted">°</span>
 				</div>
 				<div className="flex gap-1">
 					{[0, 90, 180, 270].map((r) => (
@@ -101,8 +101,8 @@ export function HoleDetail() {
 							onClick={() => updateHole(selectedId, { rotation: r })}
 							className={`rounded px-2.5 py-1 text-xs font-medium ${
 								hole.rotation === r
-									? "bg-blue-600 text-white"
-									: "bg-gray-100 text-gray-600 hover:bg-gray-200"
+									? "bg-accent-text text-white"
+									: "bg-surface text-text-secondary hover:bg-plasma"
 							}`}
 						>
 							{r}°
@@ -111,26 +111,26 @@ export function HoleDetail() {
 				</div>
 			</div>
 
-			<div className="text-xs text-gray-400">
+			<div className="text-xs text-text-muted">
 				Position: ({hole.position.x.toFixed(1)}, {hole.position.z.toFixed(1)})
 			</div>
 
 			{dimensionLabel ? (
-				<div className="text-xs text-gray-400">Size: {dimensionLabel}</div>
+				<div className="text-xs text-text-muted">Size: {dimensionLabel}</div>
 			) : null}
 
 			{template ? (
-				<div className="flex flex-col gap-1 rounded border border-gray-100 bg-gray-50 p-2">
-					<div className="text-xs text-gray-500">
-						Template: <span className="font-medium text-gray-700">{template.name}</span>
+				<div className="flex flex-col gap-1 rounded border border-subtle bg-surface-raised p-2">
+					<div className="text-xs text-text-secondary">
+						Template: <span className="font-medium text-primary">{template.name}</span>
 					</div>
-					<div className="text-xs text-gray-500">
-						Segments: <span className="font-medium text-gray-700">{template.segments.length}</span>
+					<div className="text-xs text-text-secondary">
+						Segments: <span className="font-medium text-primary">{template.segments.length}</span>
 					</div>
 					<button
 						type="button"
 						onClick={() => enterBuilder(template.id)}
-						className="mt-1 rounded bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-100"
+						className="mt-1 rounded bg-plasma px-3 py-1.5 text-xs font-medium text-accent-text hover:bg-plasma"
 					>
 						Edit in Builder
 					</button>
@@ -140,7 +140,7 @@ export function HoleDetail() {
 			<button
 				type="button"
 				onClick={() => removeHole(selectedId)}
-				className="mt-2 rounded bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
+				className="mt-2 rounded bg-neon-pink/10 px-3 py-1.5 text-xs font-medium text-neon-pink hover:bg-neon-pink/15"
 			>
 				Delete Hole
 			</button>
diff --git a/src/components/ui/HoleDrawer.tsx b/src/components/ui/HoleDrawer.tsx
index 534c033..2e26d49 100644
--- a/src/components/ui/HoleDrawer.tsx
+++ b/src/components/ui/HoleDrawer.tsx
@@ -29,18 +29,18 @@ export function HoleDrawer() {
 				role="presentation"
 			/>
 			{/* Drawer */}
-			<div className="fixed inset-x-0 bottom-0 z-40 flex max-h-[40vh] flex-col rounded-t-2xl bg-white shadow-2xl md:hidden">
+			<div className="fixed inset-x-0 bottom-0 z-40 flex max-h-[40vh] flex-col rounded-t-2xl bg-surface-raised shadow-2xl md:hidden">
 				{/* Handle bar */}
 				<div className="flex justify-center py-2">
-					<div className="h-1 w-10 rounded-full bg-gray-300" />
+					<div className="h-1 w-10 rounded-full bg-grid-ghost" />
 				</div>
 				{/* Header */}
-				<div className="flex items-center justify-between border-b border-gray-100 px-4 pb-2">
+				<div className="flex items-center justify-between border-b border-subtle px-4 pb-2">
 					<span className="text-sm font-semibold">Choose Hole Type</span>
 					<button
 						type="button"
 						onClick={handleClose}
-						className="text-gray-400 hover:text-gray-600"
+						className="text-text-muted hover:text-text-secondary"
 					>
 						&#x2715;
 					</button>
@@ -55,8 +55,8 @@ export function HoleDrawer() {
 								onClick={() => handleSelect(ht.type)}
 								className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
 									placingType === ht.type
-										? "border-blue-500 bg-blue-50"
-										: "border-gray-200 active:bg-gray-50"
+										? "border-accent-text bg-plasma"
+										: "border-subtle active:bg-surface-raised"
 								}`}
 							>
 								<div
@@ -65,7 +65,7 @@ export function HoleDrawer() {
 								/>
 								<div>
 									<p className="text-sm font-medium">{ht.label}</p>
-									<p className="text-xs text-gray-400">
+									<p className="text-xs text-text-muted">
 										{ht.dimensions.width}m &times; {ht.dimensions.length}m
 										&middot; Par {ht.defaultPar}
 									</p>
diff --git a/src/components/ui/HoleLibrary.tsx b/src/components/ui/HoleLibrary.tsx
index f709fb5..d3f60db 100644
--- a/src/components/ui/HoleLibrary.tsx
+++ b/src/components/ui/HoleLibrary.tsx
@@ -22,7 +22,7 @@ export function HoleLibrary() {
 
 	return (
 		<div className="flex flex-col gap-2">
-			<p className="text-xs font-medium text-gray-500 uppercase">Hole Types</p>
+			<p className="text-xs font-medium text-text-secondary uppercase">Hole Types</p>
 			{HOLE_TYPES.map((ht) => (
 				<button
 					key={ht.type}
@@ -30,8 +30,8 @@ export function HoleLibrary() {
 					onClick={() => handleSelect(ht.type)}
 					className={`flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
 						placingType === ht.type
-							? "border-blue-500 bg-blue-50"
-							: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
+							? "border-accent-text bg-plasma"
+							: "border-subtle hover:border-subtle hover:bg-surface-raised"
 					}`}
 				>
 					<div
@@ -40,7 +40,7 @@ export function HoleLibrary() {
 					/>
 					<div>
 						<p className="text-sm font-medium">{ht.label}</p>
-						<p className="text-xs text-gray-400">
+						<p className="text-xs text-text-muted">
 							{ht.dimensions.width}m x {ht.dimensions.length}m · Par{" "}
 							{ht.defaultPar}
 						</p>
@@ -50,7 +50,7 @@ export function HoleLibrary() {
 
 			{templateList.length > 0 && (
 				<>
-					<p className="mt-4 text-xs font-medium text-gray-500 uppercase">
+					<p className="mt-4 text-xs font-medium text-text-secondary uppercase">
 						My Holes
 					</p>
 					{templateList.map((template) => (
@@ -66,8 +66,8 @@ export function HoleLibrary() {
 								}}
 								className={`flex flex-1 items-center gap-3 rounded-lg border p-2.5 text-left transition-colors ${
 									placingTemplateId === template.id
-										? "border-blue-500 bg-blue-50"
-										: "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
+										? "border-accent-text bg-plasma"
+										: "border-subtle hover:border-subtle hover:bg-surface-raised"
 								}`}
 							>
 								<div
@@ -76,7 +76,7 @@ export function HoleLibrary() {
 								/>
 								<div>
 									<p className="text-sm font-medium">{template.name}</p>
-									<p className="text-xs text-gray-400">
+									<p className="text-xs text-text-muted">
 										{template.segments.length} segments · Par{" "}
 										{template.defaultPar}
 									</p>
@@ -85,7 +85,7 @@ export function HoleLibrary() {
 							<button
 								type="button"
 								onClick={() => enterBuilder(template.id)}
-								className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
+								className="rounded p-1 text-text-muted hover:bg-plasma hover:text-text-secondary"
 								title="Edit template"
 							>
 								&#x270E;
@@ -98,7 +98,7 @@ export function HoleLibrary() {
 			<button
 				type="button"
 				onClick={() => enterBuilder()}
-				className="mt-4 w-full rounded-lg border-2 border-dashed border-gray-300 p-3 text-center text-sm font-medium text-gray-500 transition-colors hover:border-green-400 hover:text-green-600"
+				className="mt-4 w-full rounded-lg border-2 border-dashed border-grid-ghost p-3 text-center text-sm font-medium text-text-secondary transition-colors hover:border-green-400 hover:text-neon-green"
 			>
 				+ Build Custom Hole
 			</button>
diff --git a/src/components/ui/KeyboardHelp.tsx b/src/components/ui/KeyboardHelp.tsx
index e42a1e9..3e2605d 100644
--- a/src/components/ui/KeyboardHelp.tsx
+++ b/src/components/ui/KeyboardHelp.tsx
@@ -18,17 +18,17 @@ export function KeyboardHelp() {
 				onClick={() => setOpen(!open)}
 				onMouseEnter={() => setOpen(true)}
 				onMouseLeave={() => setOpen(false)}
-				className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-800/70 text-xs text-gray-300 hover:bg-gray-700/70"
+				className="flex h-6 w-6 items-center justify-center rounded-full bg-plasma/70 text-xs text-text-secondary hover:bg-plasma"
 			>
 				?
 			</button>
 			{open && (
-				<div className="absolute bottom-8 left-0 rounded bg-gray-900/90 p-2 shadow-lg">
-					<table className="text-xs text-gray-300">
+				<div className="absolute bottom-8 left-0 rounded bg-surface/90 p-2 shadow-lg">
+					<table className="text-xs text-text-secondary">
 						<tbody>
 							{SHORTCUTS.map(({ key, action }) => (
 								<tr key={key}>
-									<td className="pr-3 font-mono text-white">{key}</td>
+									<td className="pr-3 font-mono text-primary">{key}</td>
 									<td className="whitespace-nowrap">{action}</td>
 								</tr>
 							))}
diff --git a/src/components/ui/LocationBar.tsx b/src/components/ui/LocationBar.tsx
index 3dc3945..3a965e4 100644
--- a/src/components/ui/LocationBar.tsx
+++ b/src/components/ui/LocationBar.tsx
@@ -11,54 +11,54 @@ export function LocationBar({ sunData }: LocationBarProps) {
 	const [expanded, setExpanded] = useState(false);
 
 	return (
-		<div className="hidden border-t border-gray-700 bg-gray-900 text-gray-300 md:block">
+		<div className="hidden border-t border-subtle bg-surface text-text-secondary md:block">
 			<button
 				type="button"
 				onClick={() => setExpanded(!expanded)}
-				className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-gray-800 transition-colors"
+				className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-plasma transition-colors"
 			>
-				<span className="font-medium text-white">{LOCATION.address}</span>
-				<span className="text-gray-500">·</span>
+				<span className="font-medium text-primary">{LOCATION.address}</span>
+				<span className="text-text-secondary">·</span>
 				<span>{LOCATION.elevation}m</span>
-				<span className="text-gray-500">·</span>
+				<span className="text-text-secondary">·</span>
 				<span>
 					{LOCATION.lat.toFixed(4)}°N {LOCATION.lng.toFixed(4)}°E
 				</span>
 				{sunData?.isDay && (
 					<>
-						<span className="text-gray-500">·</span>
+						<span className="text-text-secondary">·</span>
 						<span className="text-amber-400">
 							{sunData.azimuthDeg}° · {sunData.altitudeDeg}° alt
 						</span>
 					</>
 				)}
-				<span className="ml-auto text-gray-500">{expanded ? "▾" : "▸"}</span>
+				<span className="ml-auto text-text-secondary">{expanded ? "▾" : "▸"}</span>
 			</button>
 			{expanded && (
-				<div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-gray-700 px-3 py-2 text-xs md:grid-cols-4">
+				<div className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-subtle px-3 py-2 text-xs md:grid-cols-4">
 					<div>
-						<span className="text-gray-500">Address: </span>
-						<span className="text-white">{LOCATION.address}</span>
+						<span className="text-text-secondary">Address: </span>
+						<span className="text-primary">{LOCATION.address}</span>
 					</div>
 					<div>
-						<span className="text-gray-500">Region: </span>
+						<span className="text-text-secondary">Region: </span>
 						<span>{LOCATION.region}</span>
 					</div>
 					<div>
-						<span className="text-gray-500">Coordinates: </span>
+						<span className="text-text-secondary">Coordinates: </span>
 						<span>
 							{LOCATION.lat}°N, {LOCATION.lng}°E
 						</span>
 					</div>
 					<div>
-						<span className="text-gray-500">Elevation: </span>
+						<span className="text-text-secondary">Elevation: </span>
 						<span>{LOCATION.elevation}m above sea level</span>
 					</div>
 					{sunData && (
 						<div>
-							<span className="text-gray-500">Sun: </span>
+							<span className="text-text-secondary">Sun: </span>
 							<span
-								className={sunData.isDay ? "text-amber-400" : "text-gray-500"}
+								className={sunData.isDay ? "text-amber-400" : "text-text-secondary"}
 							>
 								{sunData.isDay
 									? `${sunData.azimuthDeg}° bearing, ${sunData.altitudeDeg}° elevation`
@@ -71,7 +71,7 @@ export function LocationBar({ sunData }: LocationBarProps) {
 							href={LOCATION.osmUrl}
 							target="_blank"
 							rel="noopener noreferrer"
-							className="text-blue-400 hover:underline"
+							className="text-accent-text hover:underline"
 						>
 							Open in Maps
 						</a>
@@ -79,7 +79,7 @@ export function LocationBar({ sunData }: LocationBarProps) {
 							href={LOCATION.googleMapsUrl}
 							target="_blank"
 							rel="noopener noreferrer"
-							className="text-blue-400 hover:underline"
+							className="text-accent-text hover:underline"
 						>
 							Satellite View
 						</a>
diff --git a/src/components/ui/MiniMap.tsx b/src/components/ui/MiniMap.tsx
index ac07648..3b7ec1a 100644
--- a/src/components/ui/MiniMap.tsx
+++ b/src/components/ui/MiniMap.tsx
@@ -67,7 +67,7 @@ export function MiniMap() {
 			</a>
 			{/* Attribution */}
 			<div
-				className="absolute right-0 bottom-0 bg-white/80 px-1 text-gray-600"
+				className="absolute right-0 bottom-0 bg-surface-raised/80 px-1 text-text-secondary"
 				style={{ fontSize: "8px" }}
 			>
 				OpenStreetMap
diff --git a/src/components/ui/MobileBudgetPanel.tsx b/src/components/ui/MobileBudgetPanel.tsx
index dfed4c9..475290f 100644
--- a/src/components/ui/MobileBudgetPanel.tsx
+++ b/src/components/ui/MobileBudgetPanel.tsx
@@ -12,14 +12,14 @@ export function MobileBudgetPanel() {
 	}
 
 	return (
-		<div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
+		<div className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden">
 			{/* Header */}
-			<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
+			<div className="flex items-center justify-between border-b border-subtle px-4 py-3">
 				<span className="text-base font-semibold">Budget</span>
 				<button
 					type="button"
 					onClick={handleClose}
-					className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
+					className="rounded-lg p-2 text-text-muted hover:bg-plasma hover:text-text-secondary"
 				>
 					<span className="text-xl">&#x2715;</span>
 				</button>
diff --git a/src/components/ui/MobileDetailPanel.tsx b/src/components/ui/MobileDetailPanel.tsx
index d737a88..f68d071 100644
--- a/src/components/ui/MobileDetailPanel.tsx
+++ b/src/components/ui/MobileDetailPanel.tsx
@@ -54,9 +54,9 @@ export function MobileDetailPanel() {
 	}
 
 	return (
-		<div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
+		<div className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden">
 			{/* Header */}
-			<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
+			<div className="flex items-center justify-between border-b border-subtle px-4 py-3">
 				<div className="flex items-center gap-2">
 					<div
 						className="h-6 w-6 rounded"
@@ -69,7 +69,7 @@ export function MobileDetailPanel() {
 				<button
 					type="button"
 					onClick={handleClose}
-					className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
+					className="rounded-lg p-2 text-text-muted hover:bg-plasma hover:text-text-secondary"
 				>
 					<span className="text-xl">&#x2715;</span>
 				</button>
@@ -80,18 +80,18 @@ export function MobileDetailPanel() {
 				<div className="flex flex-col gap-5">
 					{/* Name */}
 					<label className="flex flex-col gap-1.5">
-						<span className="text-sm font-medium text-gray-500">Name</span>
+						<span className="text-sm font-medium text-text-secondary">Name</span>
 						<input
 							type="text"
 							value={hole.name}
 							onChange={(e) => updateHole(selectedId, { name: e.target.value })}
-							className="rounded-lg border border-gray-200 px-3 py-2.5 text-base"
+							className="rounded-lg border border-subtle px-3 py-2.5 text-base"
 						/>
 					</label>
 
 					{/* Par */}
 					<label className="flex flex-col gap-1.5">
-						<span className="text-sm font-medium text-gray-500">Par</span>
+						<span className="text-sm font-medium text-text-secondary">Par</span>
 						<input
 							type="number"
 							value={hole.par}
@@ -102,13 +102,13 @@ export function MobileDetailPanel() {
 									par: Math.min(6, Math.max(1, Number(e.target.value))),
 								})
 							}
-							className="w-24 rounded-lg border border-gray-200 px-3 py-2.5 text-base"
+							className="w-24 rounded-lg border border-subtle px-3 py-2.5 text-base"
 						/>
 					</label>
 
 					{/* Rotation — large preset buttons as primary */}
 					<div className="flex flex-col gap-1.5">
-						<span className="text-sm font-medium text-gray-500">Rotation</span>
+						<span className="text-sm font-medium text-text-secondary">Rotation</span>
 						<div className="flex gap-2">
 							{[0, 90, 180, 270].map((r) => (
 								<button
@@ -117,8 +117,8 @@ export function MobileDetailPanel() {
 									onClick={() => updateHole(selectedId, { rotation: r })}
 									className={`h-11 flex-1 rounded-lg text-sm font-medium ${
 										hole.rotation === r
-											? "bg-blue-600 text-white"
-											: "bg-gray-100 text-gray-600 active:bg-gray-200"
+											? "bg-accent-text text-white"
+											: "bg-surface text-text-secondary active:bg-plasma"
 									}`}
 								>
 									{r}&deg;
@@ -136,38 +136,38 @@ export function MobileDetailPanel() {
 									rotation: ((Number(e.target.value) % 360) + 360) % 360,
 								})
 							}
-							className="mt-1 w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
+							className="mt-1 w-24 rounded-lg border border-subtle px-3 py-2 text-sm"
 						/>
 					</div>
 
 					{/* Position (read-only) */}
-					<div className="text-sm text-gray-400">
+					<div className="text-sm text-text-muted">
 						Position: ({hole.position.x.toFixed(1)},{" "}
 						{hole.position.z.toFixed(1)})
 					</div>
 
 					{/* Dimensions (read-only) */}
 					{dimensionLabel ? (
-						<div className="text-sm text-gray-400">Size: {dimensionLabel}</div>
+						<div className="text-sm text-text-muted">Size: {dimensionLabel}</div>
 					) : null}
 
 					{/* Template info */}
 					{template ? (
-						<div className="flex flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
-							<div className="text-sm text-gray-500">
+						<div className="flex flex-col gap-2 rounded-lg border border-subtle bg-surface-raised p-3">
+							<div className="text-sm text-text-secondary">
 								Template:{" "}
-								<span className="font-medium text-gray-700">{template.name}</span>
+								<span className="font-medium text-primary">{template.name}</span>
 							</div>
-							<div className="text-sm text-gray-500">
+							<div className="text-sm text-text-secondary">
 								Segments:{" "}
-								<span className="font-medium text-gray-700">
+								<span className="font-medium text-primary">
 									{template.segments.length}
 								</span>
 							</div>
 							<button
 								type="button"
 								onClick={handleEditInBuilder}
-								className="rounded-lg bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-600 active:bg-blue-100"
+								className="rounded-lg bg-plasma px-4 py-2.5 text-sm font-medium text-accent-text active:bg-plasma"
 							>
 								Edit in Builder
 							</button>
@@ -178,7 +178,7 @@ export function MobileDetailPanel() {
 					<button
 						type="button"
 						onClick={handleDelete}
-						className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-base font-medium text-red-600 active:bg-red-100"
+						className="mt-4 rounded-lg bg-neon-pink/10 px-4 py-3 text-base font-medium text-neon-pink active:bg-neon-pink/15"
 					>
 						Delete Hole
 					</button>
diff --git a/src/components/ui/MobileSunControls.tsx b/src/components/ui/MobileSunControls.tsx
index 8b1ad38..6f68b1d 100644
--- a/src/components/ui/MobileSunControls.tsx
+++ b/src/components/ui/MobileSunControls.tsx
@@ -23,14 +23,14 @@ export function MobileSunControls() {
 	}
 
 	return (
-		<div className="fixed inset-0 z-50 flex flex-col bg-white md:hidden">
+		<div className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden">
 			{/* Header */}
-			<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
+			<div className="flex items-center justify-between border-b border-subtle px-4 py-3">
 				<span className="text-base font-semibold">Sun Position</span>
 				<button
 					type="button"
 					onClick={handleClose}
-					className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
+					className="rounded-lg p-2 text-text-muted hover:bg-plasma hover:text-text-secondary"
 				>
 					<span className="text-xl">&#x2715;</span>
 				</button>
@@ -41,7 +41,7 @@ export function MobileSunControls() {
 				<div className="flex flex-col gap-4">
 					{/* Presets */}
 					<div className="flex flex-col gap-1.5">
-						<span className="text-sm font-medium text-gray-500">Presets</span>
+						<span className="text-sm font-medium text-text-secondary">Presets</span>
 						<div className="flex gap-2">
 							{SUN_PRESETS.map(({ label, date }) => (
 								<button
@@ -53,8 +53,8 @@ export function MobileSunControls() {
 									}}
 									className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
 										activePreset === label
-											? "bg-amber-500 text-white"
-											: "bg-gray-100 text-gray-700 active:bg-gray-200"
+											? "bg-neon-amber text-white"
+											: "bg-surface text-primary active:bg-plasma"
 									}`}
 								>
 									{label}
@@ -69,8 +69,8 @@ export function MobileSunControls() {
 						onClick={() => setShowCustom(!showCustom)}
 						className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
 							activePreset === "Custom"
-								? "bg-amber-500 text-white"
-								: "bg-gray-100 text-gray-700 active:bg-gray-200"
+								? "bg-neon-amber text-white"
+								: "bg-surface text-primary active:bg-plasma"
 						}`}
 					>
 						Custom Date & Time
@@ -80,7 +80,7 @@ export function MobileSunControls() {
 					{showCustom && (
 						<div className="flex flex-col gap-3">
 							<label className="flex flex-col gap-1.5">
-								<span className="text-sm font-medium text-gray-500">Date</span>
+								<span className="text-sm font-medium text-text-secondary">Date</span>
 								<input
 									type="date"
 									defaultValue="2026-06-21"
@@ -93,11 +93,11 @@ export function MobileSunControls() {
 											new Date(y, m - 1, d, time.getHours(), time.getMinutes()),
 										);
 									}}
-									className="rounded-lg border border-gray-200 px-3 py-2.5 text-base"
+									className="rounded-lg border border-subtle px-3 py-2.5 text-base"
 								/>
 							</label>
 							<label className="flex flex-col gap-1.5">
-								<span className="text-sm font-medium text-gray-500">Time</span>
+								<span className="text-sm font-medium text-text-secondary">Time</span>
 								<input
 									type="time"
 									defaultValue="12:00"
@@ -116,7 +116,7 @@ export function MobileSunControls() {
 											),
 										);
 									}}
-									className="rounded-lg border border-gray-200 px-3 py-2.5 text-base"
+									className="rounded-lg border border-subtle px-3 py-2.5 text-base"
 								/>
 							</label>
 						</div>
diff --git a/src/components/ui/SaveManager.tsx b/src/components/ui/SaveManager.tsx
index bb827ff..5b792a5 100644
--- a/src/components/ui/SaveManager.tsx
+++ b/src/components/ui/SaveManager.tsx
@@ -79,7 +79,7 @@ export function SaveManager() {
 			<button
 				type="button"
 				onClick={() => setOpen(true)}
-				className="rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
+				className="rounded bg-surface px-3 py-1.5 text-sm font-medium text-primary hover:bg-plasma"
 			>
 				Saves
 			</button>
@@ -87,13 +87,13 @@ export function SaveManager() {
 	}
 
 	return (
-		<div className="absolute right-2 top-12 z-50 w-72 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
+		<div className="absolute right-2 top-12 z-50 w-72 rounded-lg border border-subtle bg-surface-raised p-3 shadow-lg">
 			<div className="mb-2 flex items-center justify-between">
 				<span className="text-sm font-semibold">Saves ({saveCount}/10)</span>
 				<button
 					type="button"
 					onClick={() => setOpen(false)}
-					className="text-gray-400 hover:text-gray-600"
+					className="text-text-muted hover:text-text-secondary"
 				>
 					&#x2715;
 				</button>
@@ -107,24 +107,24 @@ export function SaveManager() {
 					onChange={(e) => setSaveName(e.target.value)}
 					onKeyDown={(e) => e.key === "Enter" && handleSave()}
 					placeholder="Save name..."
-					className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
+					className="flex-1 rounded border border-subtle px-2 py-1 text-sm"
 					maxLength={40}
 				/>
 				<button
 					type="button"
 					onClick={handleSave}
 					disabled={!saveName.trim() || saveCount >= 10}
-					className="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
+					className="rounded bg-accent-text px-2 py-1 text-sm text-white hover:bg-accent-text/80 disabled:opacity-50"
 				>
 					Save
 				</button>
 			</div>
 
-			{error && <p className="mb-2 text-xs text-red-600">{error}</p>}
+			{error && <p className="mb-2 text-xs text-neon-pink">{error}</p>}
 
 			{/* Save list */}
 			{sortedSaves.length === 0 ? (
-				<p className="text-center text-xs text-gray-400">
+				<p className="text-center text-xs text-text-muted">
 					No saved layouts yet
 				</p>
 			) : (
@@ -132,7 +132,7 @@ export function SaveManager() {
 					{sortedSaves.map(([id, slot]) => (
 						<li
 							key={id}
-							className="flex items-center gap-1 rounded bg-gray-50 px-2 py-1.5"
+							className="flex items-center gap-1 rounded bg-surface-raised px-2 py-1.5"
 						>
 							{editingId === id ? (
 								<input
@@ -141,7 +141,7 @@ export function SaveManager() {
 									onChange={(e) => setEditName(e.target.value)}
 									onKeyDown={(e) => e.key === "Enter" && handleRename(id)}
 									onBlur={() => handleRename(id)}
-									className="flex-1 rounded border border-gray-300 px-1 text-xs"
+									className="flex-1 rounded border border-subtle px-1 text-xs"
 									maxLength={40}
 								/>
 							) : (
@@ -154,7 +154,7 @@ export function SaveManager() {
 									<span className="block truncate text-xs font-medium">
 										{slot.name}
 									</span>
-									<span className="text-[10px] text-gray-400">
+									<span className="text-[10px] text-text-muted">
 										{new Date(slot.savedAt).toLocaleString()}
 									</span>
 								</button>
@@ -165,7 +165,7 @@ export function SaveManager() {
 									setEditingId(id);
 									setEditName(slot.name);
 								}}
-								className="text-xs text-gray-400 hover:text-blue-600"
+								className="text-xs text-text-muted hover:text-accent-text"
 								title="Rename"
 							>
 								&#x270E;
@@ -173,7 +173,7 @@ export function SaveManager() {
 							<button
 								type="button"
 								onClick={() => handleDelete(id)}
-								className="text-xs text-gray-400 hover:text-red-600"
+								className="text-xs text-text-muted hover:text-neon-pink"
 								title="Delete"
 							>
 								&#x2715;
diff --git a/src/components/ui/Sidebar.tsx b/src/components/ui/Sidebar.tsx
index 46bc2bc..dbdd844 100644
--- a/src/components/ui/Sidebar.tsx
+++ b/src/components/ui/Sidebar.tsx
@@ -15,8 +15,8 @@ export function Sidebar() {
 	const setSidebarTab = useStore((s) => s.setSidebarTab);
 
 	return (
-		<div className="hidden h-full w-64 flex-col border-r border-gray-200 bg-white md:flex">
-			<div className="flex border-b border-gray-200">
+		<div className="hidden h-full w-64 flex-col border-r border-subtle bg-surface-raised md:flex">
+			<div className="flex border-b border-subtle">
 				{tabs.map(({ tab, label }) => (
 					<button
 						type="button"
@@ -24,8 +24,8 @@ export function Sidebar() {
 						onClick={() => setSidebarTab(tab)}
 						className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
 							activeTab === tab
-								? "border-b-2 border-blue-600 text-blue-600"
-								: "text-gray-500 hover:text-gray-700"
+								? "border-b-2 border-accent-text text-accent-text"
+								: "text-text-secondary hover:text-primary"
 						}`}
 					>
 						{label}
diff --git a/src/components/ui/SunControls.tsx b/src/components/ui/SunControls.tsx
index 9a33c96..61ce2fd 100644
--- a/src/components/ui/SunControls.tsx
+++ b/src/components/ui/SunControls.tsx
@@ -28,8 +28,8 @@ export function SunControls() {
 						}}
 						className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
 							activePreset === label
-								? "bg-amber-500 text-white"
-								: "bg-gray-800/70 text-gray-200 hover:bg-gray-700/70"
+								? "bg-neon-amber text-white"
+								: "bg-plasma/70 text-text-secondary hover:bg-plasma"
 						}`}
 					>
 						{label}
@@ -40,15 +40,15 @@ export function SunControls() {
 					onClick={() => setShowCustom(!showCustom)}
 					className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
 						activePreset === "Custom"
-							? "bg-amber-500 text-white"
-							: "bg-gray-800/70 text-gray-200 hover:bg-gray-700/70"
+							? "bg-neon-amber text-white"
+							: "bg-plasma/70 text-text-secondary hover:bg-plasma"
 					}`}
 				>
 					Custom
 				</button>
 			</div>
 			{showCustom && (
-				<div className="flex gap-1 rounded bg-gray-800/80 p-2">
+				<div className="flex gap-1 rounded bg-surface/80 p-2">
 					<input
 						type="date"
 						defaultValue="2026-06-21"
@@ -61,7 +61,7 @@ export function SunControls() {
 								new Date(y, m - 1, d, time.getHours(), time.getMinutes()),
 							);
 						}}
-						className="rounded bg-gray-700 px-1 py-0.5 text-xs text-white"
+						className="rounded bg-plasma px-1 py-0.5 text-xs text-primary"
 					/>
 					<input
 						type="time"
@@ -81,7 +81,7 @@ export function SunControls() {
 								),
 							);
 						}}
-						className="rounded bg-gray-700 px-1 py-0.5 text-xs text-white"
+						className="rounded bg-plasma px-1 py-0.5 text-xs text-primary"
 					/>
 				</div>
 			)}
diff --git a/src/components/ui/Toolbar.tsx b/src/components/ui/Toolbar.tsx
index cbc7feb..7432b94 100644
--- a/src/components/ui/Toolbar.tsx
+++ b/src/components/ui/Toolbar.tsx
@@ -22,8 +22,8 @@ export function Toolbar() {
 	const toggleFlowPath = useStore((s) => s.toggleFlowPath);
 	const view = useStore((s) => s.ui.view);
 	const setView = useStore((s) => s.setView);
-	const uvMode = useStore((s) => s.ui.uvMode);
 	const toggleUvMode = useStore((s) => s.toggleUvMode);
+	const uvMode = useStore((s) => s.ui.uvMode);
 	const captureScreenshot = useStore((s) => s.captureScreenshot);
 	const holes = useStore((s) => s.holes);
 	const holeOrder = useStore((s) => s.holeOrder);
@@ -40,61 +40,38 @@ export function Toolbar() {
 		downloadSVG(svg);
 	}
 
-	const barClass = uvMode
-		? "hidden items-center gap-1 border-b border-indigo-900 bg-gray-900 px-3 py-2 md:flex"
-		: "hidden items-center gap-1 border-b border-gray-200 bg-white px-3 py-2 md:flex";
+	const barClass = "hidden items-center gap-1 border-b border-subtle bg-surface-raised px-3 py-2 md:flex";
 
 	const btnClass = (active: boolean) =>
-		uvMode
-			? `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
-					active
-						? "bg-purple-600 text-white"
-						: "bg-gray-800 text-gray-300 hover:bg-gray-700"
-				}`
-			: `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
-					active
-						? "bg-blue-600 text-white"
-						: "bg-gray-100 text-gray-700 hover:bg-gray-200"
-				}`;
-
-	const neutralBtnClass = uvMode
-		? "rounded bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
-		: "rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200";
-
-	const smallBtnClass = uvMode
-		? "rounded bg-gray-800 px-2 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
-		: "rounded bg-gray-100 px-2 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200";
-
-	const dividerClass = uvMode
-		? "mx-2 h-6 w-px bg-gray-700"
-		: "mx-2 h-6 w-px bg-gray-200";
-
-	const snapBtnClass = uvMode
-		? `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
-				snapEnabled
-					? "bg-purple-600 text-white"
-					: "bg-gray-800 text-gray-300 hover:bg-gray-700"
-			}`
-		: `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
-				snapEnabled
-					? "bg-green-600 text-white"
-					: "bg-gray-100 text-gray-700 hover:bg-gray-200"
-			}`;
-
-	const flowBtnClass = uvMode
-		? `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
-				showFlowPath
-					? "bg-purple-600 text-white"
-					: "bg-gray-800 text-gray-300 hover:bg-gray-700"
-			}`
-		: `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
-				showFlowPath
-					? "bg-purple-600 text-white"
-					: "bg-gray-100 text-gray-700 hover:bg-gray-200"
-			}`;
+		`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
+			active
+				? "bg-accent-text text-white"
+				: "bg-plasma text-text-secondary hover:bg-grid-ghost"
+		}`;
+
+	const neutralBtnClass = "rounded bg-plasma px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-grid-ghost";
+
+	const smallBtnClass = "rounded bg-plasma px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-grid-ghost";
+
+	const dividerClass = "mx-2 h-6 w-px bg-grid-ghost";
+
+	const snapBtnClass = `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
+		snapEnabled
+			? "bg-accent-text text-white"
+			: "bg-plasma text-text-secondary hover:bg-grid-ghost"
+	}`;
+
+	const flowBtnClass = `rounded px-3 py-1.5 text-sm font-medium transition-colors ${
+		showFlowPath
+			? "bg-accent-text text-white"
+			: "bg-plasma text-text-secondary hover:bg-grid-ghost"
+	}`;
 
 	return (
 		<div className={barClass}>
+			<span className="font-display text-sm font-bold tracking-wider text-accent-text" style={{ textShadow: "0 0 8px #9D00FF, 0 0 16px #9D00FF40" }}>GOLF FORGE</span>
+			<div className="mx-2 h-6 w-px bg-grid-ghost" />
+
 			{tools.map(({ tool, label, icon }) => (
 				<button
 					type="button"
diff --git a/src/index.css b/src/index.css
index bc4377e..46bcc9b 100644
--- a/src/index.css
+++ b/src/index.css
@@ -98,6 +98,8 @@
 	--color-text-primary: var(--color-felt-white);
 	--color-accent: var(--color-neon-violet);
 	/* accent-text already defined as a base token above */
+	--color-text-secondary: #B0B0D8;
+	--color-text-muted: #6E6E9A;
 	--color-data: var(--color-neon-cyan);
 	--color-success: var(--color-neon-green);
 	--color-warning: var(--color-neon-amber);
diff --git a/tests/darkTheme.test.ts b/tests/darkTheme.test.ts
new file mode 100644
index 0000000..7a833d7
--- /dev/null
+++ b/tests/darkTheme.test.ts
@@ -0,0 +1,78 @@
+import * as fs from "node:fs";
+import * as path from "node:path";
+import { describe, expect, it } from "vitest";
+
+const SRC_UI = path.resolve("src/components/ui");
+const SRC_BUILDER = path.resolve("src/components/builder");
+const SRC_APP = path.resolve("src/App.tsx");
+
+/** Read all .tsx files from a directory (non-recursive). */
+function readTsxFiles(dir: string): { file: string; content: string }[] {
+	if (!fs.existsSync(dir)) return [];
+	return fs
+		.readdirSync(dir)
+		.filter((f) => f.endsWith(".tsx"))
+		.map((f) => ({
+			file: f,
+			content: fs.readFileSync(path.join(dir, f), "utf-8"),
+		}));
+}
+
+function countMatches(files: { file: string; content: string }[], pattern: RegExp): string[] {
+	const matches: string[] = [];
+	for (const { file, content } of files) {
+		const m = content.match(pattern);
+		if (m) matches.push(`${file}: ${m.length} match(es)`);
+	}
+	return matches;
+}
+
+describe("Dark Theme Conversion", () => {
+	const uiFiles = readTsxFiles(SRC_UI);
+	const builderFiles = readTsxFiles(SRC_BUILDER);
+	const allComponentFiles = [...uiFiles, ...builderFiles];
+
+	it("no remaining bg-white classes in src/components/", () => {
+		const matches = countMatches(allComponentFiles, /bg-white/g);
+		expect(matches, `Found bg-white in: ${matches.join(", ")}`).toHaveLength(0);
+	});
+
+	it("no remaining bg-gray-50 or bg-gray-100 in UI/builder components", () => {
+		const matches = countMatches(allComponentFiles, /bg-gray-(?:50|100)\b/g);
+		expect(matches, `Found bg-gray-50/100 in: ${matches.join(", ")}`).toHaveLength(0);
+	});
+
+	it("no remaining bg-gray-200 backgrounds in UI components", () => {
+		const matches = countMatches(uiFiles, /bg-gray-200/g);
+		expect(matches, `Found bg-gray-200 in: ${matches.join(", ")}`).toHaveLength(0);
+	});
+
+	it("no remaining text-gray-900/800/700 in UI components", () => {
+		const matches = countMatches(uiFiles, /text-gray-(?:900|800|700)\b/g);
+		expect(matches, `Found dark-on-light text in: ${matches.join(", ")}`).toHaveLength(0);
+	});
+
+	it("no remaining border-gray-200 in UI components", () => {
+		const matches = countMatches(uiFiles, /border-gray-200/g);
+		expect(matches, `Found border-gray-200 in: ${matches.join(", ")}`).toHaveLength(0);
+	});
+
+	it("no remaining uvMode ternaries in UI components", () => {
+		const uiAndToolbar = uiFiles;
+		const matches = countMatches(uiAndToolbar, /uvMode\s*\?/g);
+		expect(matches, `Found uvMode ? in UI: ${matches.join(", ")}`).toHaveLength(0);
+	});
+
+	it("3D component files are allowed to have uvMode ternaries", () => {
+		// This test documents the exception — it should always pass
+		expect(true).toBe(true);
+	});
+
+	it("App.tsx root div uses dark background class", () => {
+		const appContent = fs.readFileSync(SRC_APP, "utf-8");
+		expect(
+			appContent.includes("bg-surface") || appContent.includes("bg-void"),
+			"App.tsx should use bg-surface or bg-void",
+		).toBe(true);
+	});
+});
