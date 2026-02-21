diff --git a/src/App.tsx b/src/App.tsx
index f48652b..4ff0276 100644
--- a/src/App.tsx
+++ b/src/App.tsx
@@ -11,12 +11,14 @@ import { MobileDetailPanel } from "./components/ui/MobileDetailPanel";
 import { MobileSunControls } from "./components/ui/MobileSunControls";
 import { Sidebar } from "./components/ui/Sidebar";
 import { SunControls } from "./components/ui/SunControls";
+import { UVTransition } from "./components/three/UVTransition";
 import { Toolbar } from "./components/ui/Toolbar";
 import { useGpuTier } from "./hooks/useGpuTier";
 import { useSunPosition } from "./hooks/useSunPosition";
 import { useStore } from "./store";
 import { deriveFrameloop, shouldEnableSoftShadows } from "./utils/environmentGating";
 import { isMobile } from "./utils/isMobile";
+import { canvasPointerEvents } from "./utils/uvTransitionConfig";
 
 const Builder = lazy(() => import("./components/builder/Builder"));
 const ThreeCanvas = lazy(() => import("./components/three/ThreeCanvas"));
@@ -60,6 +62,7 @@ export default function App() {
 					style={{
 						cursor: tool === "delete" ? "crosshair" : "default",
 						touchAction: "none",
+						pointerEvents: canvasPointerEvents(transitioning),
 					}}
 				>
 					<Canvas
@@ -93,6 +96,7 @@ export default function App() {
 					<Builder />
 				</Suspense>
 			)}
+			<UVTransition />
 		</div>
 	);
 }
diff --git a/src/components/three/UVTransition.tsx b/src/components/three/UVTransition.tsx
new file mode 100644
index 0000000..13076ac
--- /dev/null
+++ b/src/components/three/UVTransition.tsx
@@ -0,0 +1,96 @@
+import { useCallback, useEffect, useRef } from "react";
+import { useStore } from "../../store";
+import {
+	DARKNESS_END,
+	FLICKER_END,
+	MATERIAL_SWAP_TIME,
+	TRANSITION_DURATION,
+} from "../../utils/uvTransitionConfig";
+
+/**
+ * Full-viewport DOM overlay for the UV "Lights Out" transition.
+ * Drives opacity via direct DOM manipulation + rAF for smooth 60fps animation.
+ * Calls flipUvMode() at MATERIAL_SWAP_TIME behind the dark overlay.
+ */
+export function UVTransition() {
+	const overlayRef = useRef<HTMLDivElement>(null);
+	const rafRef = useRef<number>(0);
+	const startTimeRef = useRef(0);
+	const swappedRef = useRef(false);
+
+	const transitioning = useStore((s) => s.ui.transitioning);
+	const flipUvMode = useStore((s) => s.flipUvMode);
+	const setTransitioning = useStore((s) => s.setTransitioning);
+
+	const animate = useCallback(
+		(now: number) => {
+			const elapsed = now - startTimeRef.current;
+			const el = overlayRef.current;
+			if (!el) return;
+
+			if (elapsed < FLICKER_END) {
+				// Phase 1: Flicker — sine-based opacity oscillation
+				const t = elapsed / FLICKER_END;
+				const flicker =
+					Math.sin(t * Math.PI * 6) * 0.3 + t * 0.5;
+				el.style.opacity = String(Math.max(0, Math.min(0.7, flicker)));
+			} else if (elapsed < DARKNESS_END) {
+				// Phase 2: Darkness — ramp to near-black
+				el.style.opacity = "0.95";
+
+				// Material swap at MATERIAL_SWAP_TIME (= FLICKER_END)
+				if (!swappedRef.current) {
+					swappedRef.current = true;
+					flipUvMode();
+				}
+			} else if (elapsed < TRANSITION_DURATION) {
+				// Phase 3: Reveal — fade from 0.95 to 0
+				const revealT =
+					(elapsed - DARKNESS_END) / (TRANSITION_DURATION - DARKNESS_END);
+				el.style.opacity = String(0.95 * (1 - revealT));
+			} else {
+				// Phase 4: Complete
+				el.style.opacity = "0";
+				setTransitioning(false);
+				return;
+			}
+
+			rafRef.current = requestAnimationFrame(animate);
+		},
+		[flipUvMode, setTransitioning],
+	);
+
+	useEffect(() => {
+		if (!transitioning) {
+			// Reset overlay when not transitioning
+			if (overlayRef.current) {
+				overlayRef.current.style.opacity = "0";
+			}
+			return;
+		}
+
+		// Start animation
+		startTimeRef.current = performance.now();
+		swappedRef.current = false;
+		rafRef.current = requestAnimationFrame(animate);
+
+		return () => {
+			cancelAnimationFrame(rafRef.current);
+		};
+	}, [transitioning, animate]);
+
+	return (
+		<div
+			ref={overlayRef}
+			style={{
+				position: "fixed",
+				inset: 0,
+				zIndex: 9999,
+				pointerEvents: "none",
+				background: "#07071A",
+				opacity: 0,
+				willChange: transitioning ? "opacity" : "auto",
+			}}
+		/>
+	);
+}
diff --git a/src/components/ui/BottomToolbar.tsx b/src/components/ui/BottomToolbar.tsx
index bad5969..62401c1 100644
--- a/src/components/ui/BottomToolbar.tsx
+++ b/src/components/ui/BottomToolbar.tsx
@@ -171,6 +171,7 @@ function OverflowPopover({ onClose }: { onClose: () => void }) {
 	const setView = useStore((s) => s.setView);
 	const uvMode = useStore((s) => s.ui.uvMode);
 	const toggleUvMode = useStore((s) => s.toggleUvMode);
+	const transitioning = useStore((s) => s.ui.transitioning);
 	const holes = useStore((s) => s.holes);
 	const holeOrder = useStore((s) => s.holeOrder);
 	const budget = useStore((s) => s.budget);
@@ -198,7 +199,7 @@ function OverflowPopover({ onClose }: { onClose: () => void }) {
 					active={false}
 					onTap={() => setView(view === "top" ? "3d" : "top")}
 				/>
-				<ToggleBtn label="UV" active={uvMode} onTap={toggleUvMode} />
+				<ToggleBtn label="UV" active={uvMode} onTap={toggleUvMode} disabled={transitioning} />
 				<ToggleBtn
 					label="Sun"
 					active={false}
@@ -258,20 +259,23 @@ function ToggleBtn({
 	label,
 	active,
 	onTap,
+	disabled,
 }: {
 	label: string;
 	active: boolean;
 	onTap: () => void;
+	disabled?: boolean;
 }) {
 	return (
 		<button
 			type="button"
 			onClick={onTap}
+			disabled={disabled}
 			className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
 				active
 					? "bg-accent-text text-white"
 					: "bg-plasma text-text-secondary"
-			}`}
+			}${disabled ? " opacity-50" : ""}`}
 		>
 			{label}
 		</button>
diff --git a/src/components/ui/FinancialSettingsModal.tsx b/src/components/ui/FinancialSettingsModal.tsx
index 10a3661..de4ac98 100644
--- a/src/components/ui/FinancialSettingsModal.tsx
+++ b/src/components/ui/FinancialSettingsModal.tsx
@@ -42,6 +42,8 @@ export function FinancialSettingsModal({ onClose }: Props) {
 	const gpuTier = useStore((s) => s.ui.gpuTier);
 	const setGpuTierOverride = useStore((s) => s.setGpuTierOverride);
 	const setGpuTier = useStore((s) => s.setGpuTier);
+	const uvTransitionEnabled = useStore((s) => s.uvTransitionEnabled);
+	const setUvTransitionEnabled = useStore((s) => s.setUvTransitionEnabled);
 
 	return (
 		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss
@@ -225,6 +227,26 @@ export function FinancialSettingsModal({ onClose }: Props) {
 							Controls 3D rendering quality. Lower = better performance.
 						</p>
 					</div>
+
+					{/* UV Transition Animation */}
+					<div>
+						<label className="flex items-center gap-2">
+							<input
+								type="checkbox"
+								checked={uvTransitionEnabled}
+								onChange={(e) =>
+									setUvTransitionEnabled(e.target.checked)
+								}
+								className="h-4 w-4 rounded border-subtle"
+							/>
+							<span className="text-xs font-medium text-primary">
+								UV transition animation
+							</span>
+						</label>
+						<p className="mt-1 text-[10px] text-text-muted">
+							Play theatrical lighting transition when toggling UV mode.
+						</p>
+					</div>
 				</div>
 
 				{/* Footer */}
diff --git a/src/components/ui/Toolbar.tsx b/src/components/ui/Toolbar.tsx
index 7432b94..7c0c050 100644
--- a/src/components/ui/Toolbar.tsx
+++ b/src/components/ui/Toolbar.tsx
@@ -24,6 +24,7 @@ export function Toolbar() {
 	const setView = useStore((s) => s.setView);
 	const toggleUvMode = useStore((s) => s.toggleUvMode);
 	const uvMode = useStore((s) => s.ui.uvMode);
+	const transitioning = useStore((s) => s.ui.transitioning);
 	const captureScreenshot = useStore((s) => s.captureScreenshot);
 	const holes = useStore((s) => s.holes);
 	const holeOrder = useStore((s) => s.holeOrder);
@@ -116,7 +117,8 @@ export function Toolbar() {
 			<button
 				type="button"
 				onClick={toggleUvMode}
-				className={btnClass(uvMode)}
+				disabled={transitioning}
+				className={`${btnClass(uvMode)}${uvMode && !transitioning ? " uv-button-pulse" : ""}`}
 				title="Toggle UV preview mode"
 			>
 				UV
diff --git a/src/index.css b/src/index.css
index 46bcc9b..b146824 100644
--- a/src/index.css
+++ b/src/index.css
@@ -114,3 +114,23 @@ html,
 body {
 	overscroll-behavior: none;
 }
+
+/* UV button pulse animation (active UV mode) */
+@keyframes uv-pulse {
+	0%,
+	100% {
+		box-shadow:
+			0 0 4px var(--color-neon-violet),
+			0 0 8px var(--color-neon-violet);
+	}
+	50% {
+		box-shadow:
+			0 0 8px var(--color-neon-violet),
+			0 0 16px var(--color-neon-violet),
+			0 0 24px var(--color-neon-violet);
+	}
+}
+
+.uv-button-pulse {
+	animation: uv-pulse 2s ease-in-out infinite;
+}
diff --git a/src/store/store.ts b/src/store/store.ts
index 388fcc7..2995c19 100644
--- a/src/store/store.ts
+++ b/src/store/store.ts
@@ -47,6 +47,7 @@ type StoreState = {
 	ui: UIState;
 	captureScreenshot: (() => void) | null;
 	gpuTierOverride: GpuTierOverride;
+	uvTransitionEnabled: boolean;
 	// Builder state
 	holeTemplates: Record<string, HoleTemplate>;
 	builderDraft: HoleTemplate | null;
@@ -80,6 +81,8 @@ type StoreActions = {
 	setBudgetConfig: (updates: Partial<BudgetConfigV2>) => void;
 	toggleCourseOverride: () => void;
 	toggleUvMode: () => void;
+	flipUvMode: () => void;
+	setUvTransitionEnabled: (enabled: boolean) => void;
 	setGpuTier: (tier: GpuTier) => void;
 	setGpuTierOverride: (override: GpuTierOverride) => void;
 	setTransitioning: (transitioning: boolean) => void;
@@ -104,6 +107,7 @@ type PersistedSlice = {
 	holeTemplates?: Record<string, HoleTemplate>;
 	builderDraft?: HoleTemplate | null;
 	gpuTierOverride?: GpuTierOverride;
+	uvTransitionEnabled?: boolean;
 	// Legacy fields for migration
 	costPerHole?: number;
 };
@@ -294,6 +298,12 @@ export function migratePersistedState(
 		}
 	}
 
+	if (version < 8 && p) {
+		if (!("uvTransitionEnabled" in (p as Record<string, unknown>))) {
+			(p as Record<string, unknown>).uvTransitionEnabled = true;
+		}
+	}
+
 	return p;
 }
 
@@ -312,6 +322,7 @@ export const useStore = create<Store>()(
 				ui: DEFAULT_UI,
 				captureScreenshot: null,
 				gpuTierOverride: "auto" as GpuTierOverride,
+			uvTransitionEnabled: true,
 				...BUILDER_INITIAL_STATE,
 				...createBuilderActions(set, get),
 
@@ -489,9 +500,21 @@ export const useStore = create<Store>()(
 				},
 
 				toggleUvMode: () => {
-					set((state) => ({
-						ui: { ...state.ui, uvMode: !state.ui.uvMode },
-					}));
+					const state = get();
+					if (state.ui.transitioning) return;
+					if (!state.uvTransitionEnabled) {
+						set((s) => ({ ui: { ...s.ui, uvMode: !s.ui.uvMode } }));
+					} else {
+						set((s) => ({ ui: { ...s.ui, transitioning: true } }));
+					}
+				},
+
+				flipUvMode: () => {
+					set((s) => ({ ui: { ...s.ui, uvMode: !s.ui.uvMode } }));
+				},
+
+				setUvTransitionEnabled: (enabled) => {
+					set({ uvTransitionEnabled: enabled });
 				},
 
 				setGpuTier: (tier) => {
@@ -554,7 +577,7 @@ export const useStore = create<Store>()(
 			}),
 			{
 				name: "golf-planner-state",
-				version: 7,
+				version: 8,
 				partialize: (state) => ({
 					holes: state.holes,
 					holeOrder: state.holeOrder,
@@ -565,6 +588,7 @@ export const useStore = create<Store>()(
 					holeTemplates: state.holeTemplates,
 					builderDraft: state.builderDraft,
 					gpuTierOverride: state.gpuTierOverride,
+					uvTransitionEnabled: state.uvTransitionEnabled,
 				}),
 				migrate: migratePersistedState,
 			},
diff --git a/src/utils/uvTransitionConfig.ts b/src/utils/uvTransitionConfig.ts
new file mode 100644
index 0000000..a3364b0
--- /dev/null
+++ b/src/utils/uvTransitionConfig.ts
@@ -0,0 +1,13 @@
+/** Phase 1 end: flicker simulation (0-800ms) */
+export const FLICKER_END = 800;
+/** Phase 2 end: darkness period (800-1400ms) */
+export const DARKNESS_END = 1400;
+/** Total transition duration (0-2400ms) */
+export const TRANSITION_DURATION = 2400;
+/** Material swap happens at this time (behind dark overlay) */
+export const MATERIAL_SWAP_TIME = FLICKER_END;
+
+/** Derive canvas pointer-events based on transitioning state. */
+export function canvasPointerEvents(transitioning: boolean): "none" | "auto" {
+	return transitioning ? "none" : "auto";
+}
diff --git a/tests/uvTransition.test.ts b/tests/uvTransition.test.ts
new file mode 100644
index 0000000..356c064
--- /dev/null
+++ b/tests/uvTransition.test.ts
@@ -0,0 +1,160 @@
+import { describe, expect, it } from "vitest";
+import {
+	DARKNESS_END,
+	FLICKER_END,
+	MATERIAL_SWAP_TIME,
+	TRANSITION_DURATION,
+	canvasPointerEvents,
+} from "../src/utils/uvTransitionConfig";
+import { useStore } from "../src/store";
+
+describe("UV Transition", () => {
+	describe("transitioning state", () => {
+		it("starts false", () => {
+			const state = useStore.getState();
+			expect(state.ui.transitioning).toBe(false);
+		});
+
+		it("set to true when UV toggle fires with animation enabled", () => {
+			const store = useStore.getState();
+			// Ensure animation is enabled and not currently transitioning
+			useStore.setState({ uvTransitionEnabled: true });
+			useStore.getState().setTransitioning(false);
+
+			// Toggle UV mode — should start transition
+			useStore.getState().toggleUvMode();
+			expect(useStore.getState().ui.transitioning).toBe(true);
+		});
+
+		it("set back to false after setTransitioning(false)", () => {
+			useStore.getState().setTransitioning(true);
+			expect(useStore.getState().ui.transitioning).toBe(true);
+
+			useStore.getState().setTransitioning(false);
+			expect(useStore.getState().ui.transitioning).toBe(false);
+		});
+	});
+
+	describe("double-click guard", () => {
+		it("UV toggle ignored when transitioning is true", () => {
+			// Start with known uvMode state
+			useStore.setState({
+				ui: { ...useStore.getState().ui, uvMode: false, transitioning: true },
+				uvTransitionEnabled: true,
+			});
+			const before = useStore.getState().ui.uvMode;
+
+			useStore.getState().toggleUvMode();
+
+			// uvMode should NOT change, transitioning should stay true
+			expect(useStore.getState().ui.uvMode).toBe(before);
+		});
+
+		it("UV toggle accepted when transitioning is false", () => {
+			useStore.setState({
+				ui: { ...useStore.getState().ui, uvMode: false, transitioning: false },
+				uvTransitionEnabled: true,
+			});
+
+			useStore.getState().toggleUvMode();
+			// With animation enabled, transitioning should be set to true
+			expect(useStore.getState().ui.transitioning).toBe(true);
+		});
+	});
+
+	describe("transition phases", () => {
+		it("defines 4 phases with correct timing boundaries", () => {
+			expect(FLICKER_END).toBe(800);
+			expect(DARKNESS_END).toBe(1400);
+			expect(TRANSITION_DURATION).toBe(2400);
+		});
+
+		it("material swap time equals FLICKER_END (800ms)", () => {
+			expect(MATERIAL_SWAP_TIME).toBe(FLICKER_END);
+			expect(MATERIAL_SWAP_TIME).toBe(800);
+		});
+
+		it("uvMode flip does NOT happen at t=0 — deferred to MATERIAL_SWAP_TIME", () => {
+			// When animation is enabled, toggleUvMode sets transitioning=true
+			// but does NOT flip uvMode. flipUvMode is called later at MATERIAL_SWAP_TIME.
+			useStore.setState({
+				ui: { ...useStore.getState().ui, uvMode: false, transitioning: false },
+				uvTransitionEnabled: true,
+			});
+
+			useStore.getState().toggleUvMode();
+
+			// uvMode should NOT have flipped yet
+			expect(useStore.getState().ui.uvMode).toBe(false);
+			// transitioning should be true
+			expect(useStore.getState().ui.transitioning).toBe(true);
+		});
+	});
+
+	describe("animation disable setting", () => {
+		it("when off, uvMode flips instantly with no transition", () => {
+			useStore.setState({
+				ui: { ...useStore.getState().ui, uvMode: false, transitioning: false },
+				uvTransitionEnabled: false,
+			});
+
+			useStore.getState().toggleUvMode();
+
+			expect(useStore.getState().ui.uvMode).toBe(true);
+			expect(useStore.getState().ui.transitioning).toBe(false);
+		});
+
+		it("transitioning is never set to true when animation disabled", () => {
+			useStore.setState({
+				ui: { ...useStore.getState().ui, uvMode: true, transitioning: false },
+				uvTransitionEnabled: false,
+			});
+
+			useStore.getState().toggleUvMode();
+
+			expect(useStore.getState().ui.transitioning).toBe(false);
+		});
+	});
+
+	describe("Canvas pointer-events", () => {
+		it("pointer-events is 'none' during transition", () => {
+			expect(canvasPointerEvents(true)).toBe("none");
+		});
+
+		it("pointer-events is 'auto' after transition completes", () => {
+			expect(canvasPointerEvents(false)).toBe("auto");
+		});
+	});
+
+	describe("flipUvMode action", () => {
+		it("flips uvMode without touching transitioning", () => {
+			useStore.setState({
+				ui: { ...useStore.getState().ui, uvMode: false, transitioning: true },
+			});
+
+			useStore.getState().flipUvMode();
+
+			expect(useStore.getState().ui.uvMode).toBe(true);
+			// transitioning unchanged
+			expect(useStore.getState().ui.transitioning).toBe(true);
+		});
+	});
+});
+
+describe("transition timing constants", () => {
+	it("FLICKER_END is 800ms", () => {
+		expect(FLICKER_END).toBe(800);
+	});
+
+	it("DARKNESS_END is 1400ms", () => {
+		expect(DARKNESS_END).toBe(1400);
+	});
+
+	it("TRANSITION_DURATION is 2400ms", () => {
+		expect(TRANSITION_DURATION).toBe(2400);
+	});
+
+	it("MATERIAL_SWAP_TIME equals FLICKER_END", () => {
+		expect(MATERIAL_SWAP_TIME).toBe(FLICKER_END);
+	});
+});
