diff --git a/package-lock.json b/package-lock.json
index a5f1777..463035b 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -8,13 +8,14 @@
 			"name": "golf-planner",
 			"version": "0.0.0",
 			"dependencies": {
-				"@react-three/drei": "^10.7.7",
-				"@react-three/fiber": "^9.5.0",
-				"@react-three/postprocessing": "^3.0.4",
+				"@pmndrs/detect-gpu": "6.0.0",
+				"@react-three/drei": "10.7.7",
+				"@react-three/fiber": "9.5.0",
+				"@react-three/postprocessing": "3.0.4",
 				"react": "^19.2.0",
 				"react-dom": "^19.2.0",
 				"suncalc": "^1.9.0",
-				"three": "^0.183.0",
+				"three": "0.183.0",
 				"zundo": "^2.3.0",
 				"zustand": "^5.0.11"
 			},
@@ -25,7 +26,7 @@
 				"@types/react": "^19.2.7",
 				"@types/react-dom": "^19.2.3",
 				"@types/suncalc": "^1.9.2",
-				"@types/three": "^0.183.0",
+				"@types/three": "0.183.0",
 				"@vitejs/plugin-react": "^5.1.1",
 				"jsdom": "^28.1.0",
 				"tailwindcss": "^4.2.0",
@@ -2533,6 +2534,15 @@
 				"three": ">= 0.159.0"
 			}
 		},
+		"node_modules/@pmndrs/detect-gpu": {
+			"version": "6.0.0",
+			"resolved": "https://registry.npmjs.org/@pmndrs/detect-gpu/-/detect-gpu-6.0.0.tgz",
+			"integrity": "sha512-eo4JOFtQf2CBt/q+SDIXAiiERnTMMALGTg1ZPu4YfarWNHb1I7qMxv5BTIEZ2ng+IjRK5PpptTuGJer7QWtikA==",
+			"license": "MIT",
+			"dependencies": {
+				"webgl-constants": "^1.1.1"
+			}
+		},
 		"node_modules/@react-three/drei": {
 			"version": "10.7.7",
 			"resolved": "https://registry.npmjs.org/@react-three/drei/-/drei-10.7.7.tgz",
diff --git a/package.json b/package.json
index 9df8cfd..dce3eaa 100644
--- a/package.json
+++ b/package.json
@@ -12,13 +12,14 @@
 		"test": "vitest"
 	},
 	"dependencies": {
-		"@react-three/drei": "^10.7.7",
-		"@react-three/fiber": "^9.5.0",
-		"@react-three/postprocessing": "^3.0.4",
+		"@pmndrs/detect-gpu": "6.0.0",
+		"@react-three/drei": "10.7.7",
+		"@react-three/fiber": "9.5.0",
+		"@react-three/postprocessing": "3.0.4",
 		"react": "^19.2.0",
 		"react-dom": "^19.2.0",
 		"suncalc": "^1.9.0",
-		"three": "^0.183.0",
+		"three": "0.183.0",
 		"zundo": "^2.3.0",
 		"zustand": "^5.0.11"
 	},
@@ -29,7 +30,7 @@
 		"@types/react": "^19.2.7",
 		"@types/react-dom": "^19.2.3",
 		"@types/suncalc": "^1.9.2",
-		"@types/three": "^0.183.0",
+		"@types/three": "0.183.0",
 		"@vitejs/plugin-react": "^5.1.1",
 		"jsdom": "^28.1.0",
 		"tailwindcss": "^4.2.0",
diff --git a/src/App.tsx b/src/App.tsx
index bd64a67..8231a2d 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -1,3 +1,4 @@
+import { PerformanceMonitor } from "@react-three/drei";
 import { Canvas } from "@react-three/fiber";
 import { lazy, Suspense, useEffect } from "react";
 import { BottomToolbar } from "./components/ui/BottomToolbar";
@@ -11,6 +12,7 @@ import { MobileSunControls } from "./components/ui/MobileSunControls";
 import { Sidebar } from "./components/ui/Sidebar";
 import { SunControls } from "./components/ui/SunControls";
 import { Toolbar } from "./components/ui/Toolbar";
+import { needsAlwaysFrameloop, useGpuTier } from "./hooks/useGpuTier";
 import { useSunPosition } from "./hooks/useSunPosition";
 import { useStore } from "./store";
 import { isMobile } from "./utils/isMobile";
@@ -21,12 +23,22 @@ const ThreeCanvas = lazy(() => import("./components/three/ThreeCanvas"));
 export default function App() {
 	const tool = useStore((s) => s.ui.tool);
 	const uvMode = useStore((s) => s.ui.uvMode);
+	const gpuTier = useStore((s) => s.ui.gpuTier);
+	const transitioning = useStore((s) => s.ui.transitioning);
 	const builderMode = useStore((s) => s.builderMode);
 	const sunDate = useStore((s) => s.ui.sunDate);
 	const sunData = useSunPosition(sunDate);
 	const budgetSize = useStore((s) => Object.keys(s.budget).length);
 	const initBudget = useStore((s) => s.initBudget);
 
+	useGpuTier();
+
+	const dpr: [number, number] =
+		gpuTier === "high" ? [1, 2] : gpuTier === "mid" ? [1, 1.5] : [1, 1];
+	const frameloop = needsAlwaysFrameloop(uvMode, gpuTier, transitioning)
+		? "always"
+		: "demand";
+
 	useEffect(() => {
 		if (budgetSize === 0) {
 			initBudget();
@@ -46,17 +58,19 @@ export default function App() {
 					}}
 				>
 					<Canvas
-						dpr={isMobile ? [1, 1.5] : [1, 2]}
-						frameloop="demand"
+						dpr={dpr}
+						frameloop={frameloop}
 						shadows={!uvMode ? "soft" : undefined}
 						gl={{
 							antialias: !isMobile,
 							preserveDrawingBuffer: true,
 						}}
 					>
-						<Suspense fallback={null}>
-							<ThreeCanvas sunData={sunData} />
-						</Suspense>
+						<PerformanceMonitor>
+							<Suspense fallback={null}>
+								<ThreeCanvas sunData={sunData} />
+							</Suspense>
+						</PerformanceMonitor>
 					</Canvas>
 					<SunControls />
 					<KeyboardHelp />
diff --git a/src/components/ui/FinancialSettingsModal.tsx b/src/components/ui/FinancialSettingsModal.tsx
index d8b3541..4dcf39c 100644
--- a/src/components/ui/FinancialSettingsModal.tsx
+++ b/src/components/ui/FinancialSettingsModal.tsx
@@ -1,5 +1,7 @@
+import { resolveGpuTier } from "../../hooks/useGpuTier";
 import { useStore } from "../../store";
 import type { BuildMode, RiskTolerance } from "../../types/budget";
+import type { GpuTierOverride } from "../../types/ui";
 
 type Props = {
 	onClose: () => void;
@@ -21,6 +23,13 @@ const BUILD_OPTIONS: { value: BuildMode; label: string; desc: string }[] = [
 	{ value: "mixed", label: "Mixed", desc: "Custom per-type costs" },
 ];
 
+const GPU_TIER_OPTIONS: { value: GpuTierOverride; label: string }[] = [
+	{ value: "auto", label: "Auto" },
+	{ value: "low", label: "Low" },
+	{ value: "mid", label: "Mid" },
+	{ value: "high", label: "High" },
+];
+
 const DISPLAY_OPTIONS = [
 	{ value: "net" as const, label: "Net (excl. MwSt)" },
 	{ value: "gross" as const, label: "Gross (incl. MwSt)" },
@@ -30,6 +39,10 @@ const DISPLAY_OPTIONS = [
 export function FinancialSettingsModal({ onClose }: Props) {
 	const settings = useStore((s) => s.financialSettings);
 	const setSettings = useStore((s) => s.setFinancialSettings);
+	const gpuTierOverride = useStore((s) => s.gpuTierOverride);
+	const gpuTier = useStore((s) => s.ui.gpuTier);
+	const setGpuTierOverride = useStore((s) => s.setGpuTierOverride);
+	const setGpuTier = useStore((s) => s.setGpuTier);
 
 	return (
 		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss
@@ -182,6 +195,42 @@ export function FinancialSettingsModal({ onClose }: Props) {
 					</div>
 				</div>
 
+				{/* GPU Quality */}
+					<div>
+						<span className="text-[10px] font-medium text-gray-500 uppercase">
+							GPU Quality
+						</span>
+						<div className="mt-1 flex gap-1">
+							{GPU_TIER_OPTIONS.map((opt) => (
+								<button
+									key={opt.value}
+									type="button"
+									onClick={() => {
+										setGpuTierOverride(opt.value);
+										if (opt.value !== "auto") {
+											setGpuTier(
+												resolveGpuTier(opt.value, gpuTier),
+											);
+										}
+									}}
+									className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] ${
+										gpuTierOverride === opt.value
+											? "bg-blue-500 text-white"
+											: "bg-gray-100 text-gray-600 hover:bg-gray-200"
+									}`}
+								>
+									{opt.value === "auto"
+										? `Auto (${gpuTier})`
+										: opt.label}
+								</button>
+							))}
+						</div>
+						<p className="mt-1 text-[10px] text-gray-400">
+							Controls 3D rendering quality. Lower = better performance.
+						</p>
+					</div>
+				</div>
+
 				{/* Footer */}
 				<div className="flex justify-end border-t border-gray-200 px-4 py-3">
 					<button
diff --git a/src/hooks/useGpuTier.ts b/src/hooks/useGpuTier.ts
new file mode 100644
index 0000000..894689a
--- /dev/null
+++ b/src/hooks/useGpuTier.ts
@@ -0,0 +1,94 @@
+import { getGPUTier } from "@pmndrs/detect-gpu";
+import { useEffect } from "react";
+import { useStore } from "../store";
+import type { GpuTier, GpuTierOverride } from "../types/ui";
+
+export const GPU_TIER_CACHE_KEY = "golf-planner-gpu-tier";
+
+/** Maps detect-gpu tier (0-3) to app tier (low/mid/high). */
+export function mapDetectGpuToAppTier(tier: number): GpuTier {
+	if (tier == null || tier <= 1) return "low";
+	if (tier === 2) return "mid";
+	return "high";
+}
+
+/** Resolves effective tier from override preference + detected tier. */
+export function resolveGpuTier(
+	override: GpuTierOverride,
+	detected: GpuTier,
+): GpuTier {
+	return override === "auto" ? detected : override;
+}
+
+/** Reads cached GPU tier from localStorage. */
+export function readCachedTier(): GpuTier | null {
+	try {
+		const cached = localStorage.getItem(GPU_TIER_CACHE_KEY);
+		if (cached === "low" || cached === "mid" || cached === "high")
+			return cached;
+	} catch {
+		// localStorage unavailable (SSR, privacy mode)
+	}
+	return null;
+}
+
+/** Writes GPU tier to localStorage cache. */
+export function writeCachedTier(tier: GpuTier): void {
+	try {
+		localStorage.setItem(GPU_TIER_CACHE_KEY, tier);
+	} catch {
+		// localStorage unavailable
+	}
+}
+
+/**
+ * Determines whether the R3F Canvas needs frameloop="always".
+ * true when: transitioning, or uvMode active with mid/high tier effects.
+ */
+export function needsAlwaysFrameloop(
+	uvMode: boolean,
+	gpuTier: GpuTier,
+	transitioning: boolean,
+): boolean {
+	if (transitioning) return true;
+	if (uvMode && gpuTier !== "low") return true;
+	return false;
+}
+
+/**
+ * React hook: runs GPU detection on mount and writes tier to store.
+ * Call once at app level (App.tsx). The Builder reads gpuTier from the
+ * shared Zustand store — it does NOT re-detect.
+ */
+export function useGpuTier(): void {
+	const gpuTierOverride = useStore((s) => s.gpuTierOverride);
+	const setGpuTier = useStore((s) => s.setGpuTier);
+
+	useEffect(() => {
+		// If override is set, use it directly
+		if (gpuTierOverride !== "auto") {
+			setGpuTier(gpuTierOverride);
+			return;
+		}
+
+		// Check localStorage cache
+		const cached = readCachedTier();
+		if (cached) {
+			setGpuTier(cached);
+			return;
+		}
+
+		// Async detection — gpuTier stays at "low" (safe default) until complete
+		let cancelled = false;
+		getGPUTier().then((result) => {
+			if (cancelled) return;
+			const detected = mapDetectGpuToAppTier(result.tier);
+			writeCachedTier(detected);
+			setGpuTier(detected);
+		});
+
+		return () => {
+			cancelled = true;
+		};
+	}, [gpuTierOverride, setGpuTier]);
+}
diff --git a/src/store/store.ts b/src/store/store.ts
index f735292..6d0d958 100644
--- a/src/store/store.ts
+++ b/src/store/store.ts
@@ -18,6 +18,8 @@ import type {
 	ConstructionPhase,
 	ExpenseEntry,
 	FinancialSettings,
+	GpuTier,
+	GpuTierOverride,
 	Hall,
 	Hole,
 	HoleType,
@@ -44,6 +46,7 @@ type StoreState = {
 	expenses: ExpenseEntry[];
 	ui: UIState;
 	captureScreenshot: (() => void) | null;
+	gpuTierOverride: GpuTierOverride;
 	// Builder state
 	holeTemplates: Record<string, HoleTemplate>;
 	builderDraft: HoleTemplate | null;
@@ -73,6 +76,9 @@ type StoreActions = {
 	setBudgetConfig: (updates: Partial<BudgetConfigV2>) => void;
 	toggleCourseOverride: () => void;
 	toggleUvMode: () => void;
+	setGpuTier: (tier: GpuTier) => void;
+	setGpuTierOverride: (override: GpuTierOverride) => void;
+	setTransitioning: (transitioning: boolean) => void;
 	setFinancialSettings: (updates: Partial<FinancialSettings>) => void;
 	addExpense: (expense: ExpenseEntry) => void;
 	deleteExpense: (expenseId: string) => void;
@@ -92,6 +98,7 @@ type PersistedSlice = {
 	expenses: ExpenseEntry[];
 	holeTemplates?: Record<string, HoleTemplate>;
 	builderDraft?: HoleTemplate | null;
+	gpuTierOverride?: GpuTierOverride;
 	// Legacy fields for migration
 	costPerHole?: number;
 };
@@ -107,6 +114,8 @@ const DEFAULT_UI: UIState = {
 	activePanel: null,
 	sunDate: undefined,
 	uvMode: false,
+	gpuTier: "low",
+	transitioning: false,
 };
 
 function migrateToV4(state: PersistedSlice): void {
@@ -231,7 +240,7 @@ function migrateToV4(state: PersistedSlice): void {
 /**
  * Zustand persist migration function — extracted for unit testability.
  * Called by the persist middleware whenever the stored version is older
- * than the current store version (6).
+ * than the current store version (7).
  */
 export function migratePersistedState(
 	persisted: unknown,
@@ -269,6 +278,16 @@ export function migratePersistedState(
 		}
 	}
 
+	if (version < 7 && p) {
+		try {
+			if (!("gpuTierOverride" in (p as Record<string, unknown>))) {
+				(p as Record<string, unknown>).gpuTierOverride = "auto";
+			}
+		} catch {
+			(p as Record<string, unknown>).gpuTierOverride = "auto";
+		}
+	}
+
 	return p;
 }
 
@@ -286,6 +305,7 @@ export const useStore = create<Store>()(
 				expenses: [],
 				ui: DEFAULT_UI,
 				captureScreenshot: null,
+				gpuTierOverride: "auto" as GpuTierOverride,
 				...BUILDER_INITIAL_STATE,
 				...createBuilderActions(set, get),
 
@@ -468,6 +488,22 @@ export const useStore = create<Store>()(
 					}));
 				},
 
+				setGpuTier: (tier) => {
+					set((state) => ({
+						ui: { ...state.ui, gpuTier: tier },
+					}));
+				},
+
+				setGpuTierOverride: (override) => {
+					set({ gpuTierOverride: override });
+				},
+
+				setTransitioning: (transitioning) => {
+					set((state) => ({
+						ui: { ...state.ui, transitioning },
+					}));
+				},
+
 				setFinancialSettings: (updates) =>
 					set((state) => ({
 						financialSettings: {
@@ -506,7 +542,7 @@ export const useStore = create<Store>()(
 			}),
 			{
 				name: "golf-planner-state",
-				version: 6,
+				version: 7,
 				partialize: (state) => ({
 					holes: state.holes,
 					holeOrder: state.holeOrder,
@@ -516,6 +552,7 @@ export const useStore = create<Store>()(
 					expenses: state.expenses,
 					holeTemplates: state.holeTemplates,
 					builderDraft: state.builderDraft,
+					gpuTierOverride: state.gpuTierOverride,
 				}),
 				migrate: migratePersistedState,
 			},
diff --git a/src/types/index.ts b/src/types/index.ts
index 1327a24..bf54d18 100644
--- a/src/types/index.ts
+++ b/src/types/index.ts
@@ -28,4 +28,12 @@ export type {
 	SegmentSpec,
 	SegmentSpecId,
 } from "./template";
-export type { ActivePanel, SidebarTab, Tool, UIState, ViewMode } from "./ui";
+export type {
+	ActivePanel,
+	GpuTier,
+	GpuTierOverride,
+	SidebarTab,
+	Tool,
+	UIState,
+	ViewMode,
+} from "./ui";
diff --git a/src/types/ui.ts b/src/types/ui.ts
index 025dbc7..b4eeb55 100644
--- a/src/types/ui.ts
+++ b/src/types/ui.ts
@@ -4,6 +4,8 @@ export type Tool = "select" | "place" | "move" | "delete";
 export type ViewMode = "top" | "3d";
 export type SidebarTab = "holes" | "detail" | "budget";
 export type ActivePanel = "holes" | "detail" | "budget" | "sun" | null;
+export type GpuTier = "low" | "mid" | "high";
+export type GpuTierOverride = "auto" | "low" | "mid" | "high";
 
 export type UIState = {
 	tool: Tool;
@@ -16,4 +18,6 @@ export type UIState = {
 	activePanel: ActivePanel;
 	sunDate: Date | undefined;
 	uvMode: boolean;
+	gpuTier: GpuTier;
+	transitioning: boolean;
 };
diff --git a/tests/hooks/gpuTier.test.ts b/tests/hooks/gpuTier.test.ts
new file mode 100644
index 0000000..5efb4ca
--- /dev/null
+++ b/tests/hooks/gpuTier.test.ts
@@ -0,0 +1,133 @@
+import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
+import {
+	GPU_TIER_CACHE_KEY,
+	mapDetectGpuToAppTier,
+	needsAlwaysFrameloop,
+	readCachedTier,
+	resolveGpuTier,
+	writeCachedTier,
+} from "../../src/hooks/useGpuTier";
+
+// ---------------------------------------------------------------------------
+// Mock localStorage (jsdom environment has worker timeout issues in WSL2)
+// ---------------------------------------------------------------------------
+const store: Record<string, string> = {};
+const mockLocalStorage = {
+	getItem: (key: string) => store[key] ?? null,
+	setItem: (key: string, value: string) => {
+		store[key] = value;
+	},
+	removeItem: (key: string) => {
+		delete store[key];
+	},
+	clear: () => {
+		for (const key of Object.keys(store)) delete store[key];
+	},
+	get length() {
+		return Object.keys(store).length;
+	},
+	key: (_index: number) => null,
+};
+vi.stubGlobal("localStorage", mockLocalStorage);
+
+// ---------------------------------------------------------------------------
+// Tier Mapping
+// ---------------------------------------------------------------------------
+
+describe("mapDetectGpuToAppTier", () => {
+	it("maps tier 0 to 'low'", () => {
+		expect(mapDetectGpuToAppTier(0)).toBe("low");
+	});
+
+	it("maps tier 1 to 'low'", () => {
+		expect(mapDetectGpuToAppTier(1)).toBe("low");
+	});
+
+	it("maps tier 2 to 'mid'", () => {
+		expect(mapDetectGpuToAppTier(2)).toBe("mid");
+	});
+
+	it("maps tier 3 to 'high'", () => {
+		expect(mapDetectGpuToAppTier(3)).toBe("high");
+	});
+
+	it("handles undefined input by returning 'low'", () => {
+		expect(mapDetectGpuToAppTier(undefined as unknown as number)).toBe("low");
+	});
+
+	it("handles null input by returning 'low'", () => {
+		expect(mapDetectGpuToAppTier(null as unknown as number)).toBe("low");
+	});
+});
+
+// ---------------------------------------------------------------------------
+// Override Logic
+// ---------------------------------------------------------------------------
+
+describe("resolveGpuTier (override logic)", () => {
+	it("returns detected tier when override is 'auto'", () => {
+		expect(resolveGpuTier("auto", "high")).toBe("high");
+	});
+
+	it("override 'low' overrides detected 'high'", () => {
+		expect(resolveGpuTier("low", "high")).toBe("low");
+	});
+
+	it("override 'high' overrides detected 'low'", () => {
+		expect(resolveGpuTier("high", "low")).toBe("high");
+	});
+});
+
+// ---------------------------------------------------------------------------
+// LocalStorage Caching
+// ---------------------------------------------------------------------------
+
+describe("GPU tier localStorage caching", () => {
+	beforeEach(() => {
+		localStorage.clear();
+	});
+
+	afterEach(() => {
+		localStorage.clear();
+	});
+
+	it("writes tier after first detection", () => {
+		writeCachedTier("mid");
+		expect(localStorage.getItem(GPU_TIER_CACHE_KEY)).toBe("mid");
+	});
+
+	it("reads cached tier on subsequent loads", () => {
+		localStorage.setItem(GPU_TIER_CACHE_KEY, "high");
+		expect(readCachedTier()).toBe("high");
+	});
+
+	it("returns null when no cached tier exists", () => {
+		expect(readCachedTier()).toBeNull();
+	});
+});
+
+// ---------------------------------------------------------------------------
+// Frameloop Derivation
+// ---------------------------------------------------------------------------
+
+describe("needsAlwaysFrameloop", () => {
+	it("returns false when uvMode=false", () => {
+		expect(needsAlwaysFrameloop(false, "high", false)).toBe(false);
+	});
+
+	it("returns false when uvMode=true + gpuTier='low'", () => {
+		expect(needsAlwaysFrameloop(true, "low", false)).toBe(false);
+	});
+
+	it("returns true when uvMode=true + gpuTier='mid'", () => {
+		expect(needsAlwaysFrameloop(true, "mid", false)).toBe(true);
+	});
+
+	it("returns true when uvMode=true + gpuTier='high'", () => {
+		expect(needsAlwaysFrameloop(true, "high", false)).toBe(true);
+	});
+
+	it("returns true when transitioning=true regardless of tier", () => {
+		expect(needsAlwaysFrameloop(false, "low", true)).toBe(true);
+	});
+});
diff --git a/tests/store/migration.test.ts b/tests/store/migration.test.ts
index 2ee4bc3..39f570e 100644
--- a/tests/store/migration.test.ts
+++ b/tests/store/migration.test.ts
@@ -208,36 +208,102 @@ describe("full migration chain v3 → v6", () => {
 });
 
 // ---------------------------------------------------------------------------
-// v6 passthrough — no mutation of already-current state
+// v6 → v7 migration: gpuTierOverride field
 // ---------------------------------------------------------------------------
 
-describe("v6 state passthrough", () => {
-	it("preserves holeTemplates on current-version state (no migration branches run)", () => {
+/** Minimal v6 persisted state — has holeTemplates/builderDraft, no gpuTierOverride. */
+function makeV6State(
+	overrides?: Record<string, unknown>,
+): Record<string, unknown> {
+	return {
+		...makeV5State(),
+		holeTemplates: {},
+		builderDraft: null,
+		...overrides,
+	};
+}
+
+describe("v6 → v7 migration: gpuTierOverride field", () => {
+	it("adds gpuTierOverride: 'auto' when field is absent", () => {
+		const v6 = makeV6State();
+		const result = migratePersistedState(v6, 6) as Record<string, unknown>;
+		expect(result.gpuTierOverride).toBe("auto");
+	});
+
+	it("does not overwrite existing gpuTierOverride when already present", () => {
+		const v6 = makeV6State({ gpuTierOverride: "high" });
+		const result = migratePersistedState(v6, 6) as Record<string, unknown>;
+		expect(result.gpuTierOverride).toBe("high");
+	});
+
+	it("preserves holeTemplates after v6 → v7 migration", () => {
+		const templates = {
+			"t1": { id: "t1", name: "Loop", segments: [] },
+		};
+		const v6 = makeV6State({ holeTemplates: templates });
+		const result = migratePersistedState(v6, 6) as Record<string, unknown>;
+		expect(result.holeTemplates).toEqual(templates);
+	});
+
+	it("preserves builderDraft after v6 → v7 migration", () => {
+		const v6 = makeV6State({ builderDraft: { id: "draft-1" } });
+		const result = migratePersistedState(v6, 6) as Record<string, unknown>;
+		expect(result.builderDraft).toEqual({ id: "draft-1" });
+	});
+});
+
+// ---------------------------------------------------------------------------
+// Full migration chain: v3 → v7
+// ---------------------------------------------------------------------------
+
+describe("full migration chain v3 → v7 (gpuTierOverride)", () => {
+	it("adds gpuTierOverride when migrating from v3", () => {
+		const v3 = makeV3State();
+		const result = migratePersistedState(v3, 3) as Record<string, unknown>;
+		expect(result.gpuTierOverride).toBe("auto");
+	});
+
+	it("adds gpuTierOverride when migrating from v5", () => {
+		const v5 = makeV5State();
+		const result = migratePersistedState(v5, 5) as Record<string, unknown>;
+		expect(result.gpuTierOverride).toBe("auto");
+	});
+});
+
+// ---------------------------------------------------------------------------
+// v7 passthrough — no mutation of already-current state
+// ---------------------------------------------------------------------------
+
+describe("v7 state passthrough", () => {
+	it("preserves all fields on current-version state (no migration branches run)", () => {
 		const existingTemplates = {
 			"t1": { id: "t1", name: "T", segments: [] },
 		};
-		const v6 = {
-			...makeV5State(),
+		const v7 = {
+			...makeV6State(),
 			holeTemplates: existingTemplates,
 			builderDraft: null,
+			gpuTierOverride: "mid",
 		};
-		// version === 6, so no migration branch should execute
-		const result = migratePersistedState(v6, 6) as Record<string, unknown>;
+		// version === 7, so no migration branch should execute
+		const result = migratePersistedState(v7, 7) as Record<string, unknown>;
 		expect(result.holeTemplates).toEqual(existingTemplates);
 		expect(result.builderDraft).toBeNull();
+		expect(result.gpuTierOverride).toBe("mid");
 	});
 
-	it("preserves non-empty holeTemplates on v6 state", () => {
+	it("preserves non-empty holeTemplates on v7 state", () => {
 		const templates = {
 			"tpl-abc": { id: "tpl-abc", name: "My Hole", segments: [{ id: "s1" }] },
 			"tpl-def": { id: "tpl-def", name: "Another", segments: [] },
 		};
-		const v6 = {
-			...makeV5State(),
+		const v7 = {
+			...makeV6State(),
 			holeTemplates: templates,
 			builderDraft: null,
+			gpuTierOverride: "auto",
 		};
-		const result = migratePersistedState(v6, 6) as Record<string, unknown>;
+		const result = migratePersistedState(v7, 7) as Record<string, unknown>;
 		expect(Object.keys(result.holeTemplates as object)).toHaveLength(2);
 	});
 });
