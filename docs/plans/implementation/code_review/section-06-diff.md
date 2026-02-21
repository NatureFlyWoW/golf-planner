diff --git a/docs/session-handoff.md b/docs/session-handoff.md
index 3f0860a..4f76007 100644
--- a/docs/session-handoff.md
+++ b/docs/session-handoff.md
@@ -1,86 +1,86 @@
-# Session Handoff — 2026-02-21 (Phase 11A Planning)
+# Session Handoff — 2026-02-21 (Phase 11A Implementation, Sections 01-05)
 
 ## Completed This Session
-- `6a09a48` docs: add Phase 11A GOLF FORGE implementation plan (4-round adversarial review)
+- `e0c1e7e` feat: add GPU tier detection with detect-gpu (section-01)
+- `9dbc66b` feat: add GOLF FORGE theme tokens, fonts, and PWA manifest (section-02)
+- `7a75ba2` feat: convert all UI to dark theme with GOLF FORGE palette (section-03)
+- `7e5b821` feat: add monospace financial figures and neon-amber accents (section-04)
+- `b5928d0` feat: add environment gating, UV lighting, and canvas optimizations (section-05)
 
 ## Current State
-- **Branch**: master
-- **Working tree**: 7 deleted screenshots (from prior session cleanup), 1 untracked dir (.claude/homunculus/) — neither affects functionality
-- **Stash**: empty
-- **Tests**: 229 passing, 0 failing (20 test files)
-- **Build**: passing (1,456 KB total, PWA v1.2.0)
+- **Branch**: `feature/phase-11a-visual-rendering`
+- **Working tree**: clean (all changes committed)
+- **Tests**: 304 passing, 0 failing (25 test files)
 - **Type check**: passing (zero errors)
-- **Remote sync**: up to date with origin/master
+- **Build**: not verified this session (should check)
+- **Remote sync**: NOT pushed yet — push when ready
 
-## What This Session Produced
+## What's Built So Far (Sections 01-05)
 
-**Phase 11A "GOLF FORGE" implementation plan** — a comprehensive visual identity and rendering overhaul. The plan underwent 4 rounds of adversarial review (Devil's Advocate Deep → Blue Team → Devil's Advocate Round 2 → Blue Team Final) with 10 amendments integrated and 8 consistency fixes applied.
+### Section 01 — GPU Tier Classifier
+- detect-gpu integration, 3-tier system (low/mid/high), store v7 migration
+- `src/hooks/useGpuTier.ts`, `src/types/ui.ts` updated
 
-### Plan Artifacts (all in `golf-planner/docs/plans/`)
-- `claude-plan.md` — 412-line implementation plan (12 tasks, 7 waves)
-- `claude-integration-notes.md` — 135-line decision log (13 Round 1 integrations, 9 Round 1 rejections, 10 Round 2 amendments, 7 Round 2 rejections, 8 Round 3 consistency fixes)
-- `claude-spec.md` — specification from deep-plan stakeholder interview
-- `claude-research.md` — codebase research findings
-- `claude-interview.md` — stakeholder interview transcript
-- `reviews/iteration-1-opus.md` — first Opus review iteration
-- `deep_plan_config.json` — deep-plan configuration
+### Section 02 — Theme Tokens
+- 11 GOLF FORGE blacklight tokens + semantic aliases in Tailwind v4 @theme
+- JetBrains Mono font, PWA manifest updated
+- `src/index.css` — all tokens defined
 
-### Phase 11A Summary (12 tasks)
-- T1: GPU Tier Classifier (detect-gpu, 3-tier system, store v7)
-- T2: Tailwind Semantic Tokens + Fonts + PWA Manifest (11-token palette)
-- T3: Dark Theme Conversion + Branding (big-bang, uvMode ternary removal)
-- T4: High-Contrast Data Panels (amber-on-dark, JetBrains Mono)
-- T5: Environment + SoftShadows + Fog + Canvas GL
-- T6: PostProcessing + Sparkles + Effects (single EffectComposer)
-- T7: MeshReflectorMaterial (reflective floor)
-- T8: Enhanced UV Lighting (4x RectAreaLight)
-- T9: GodRays (decoupled from T8, cut contingency)
-- T10: UV "Lights Out" Transition (useRef + rAF timing)
-- T11: Performance Fixes (singleton materials)
-- T12: Visual Regression Test Suite (Playwright)
+### Section 03 — Dark Theme Conversion
+- Big-bang conversion of ~25 UI/builder component files
+- All light-theme classes replaced with GOLF FORGE semantic tokens
+- Code review caught 15 issues (unconverted branches, broken hovers, missing inputs)
 
-## Remaining Work
-- **Plan file**: `golf-planner/docs/plans/claude-plan.md`
-- **Current phase**: Phase 11A — PLANNING COMPLETE, ready for implementation
-- [ ] T1: GPU Tier Classifier (NEXT UP — Wave 1, parallel with T2)
-- [ ] T2: Tailwind Semantic Tokens + Fonts + PWA Manifest (Wave 1)
-- [ ] T3: Dark Theme Conversion + Branding (Wave 2, after T2)
-- [ ] T4: High-Contrast Data Panels (Wave 2, after T3)
-- [ ] T5: Environment + SoftShadows + Fog + Canvas GL (Wave 3, after T1)
-- [ ] T6-T8: Effects + Reflections + UV Lighting (Wave 4, parallel after T5)
-- [ ] T9-T10: GodRays + UV Transition (Wave 5, after T8)
-- [ ] T11: Performance Fixes (Wave 6, can run parallel with Wave 3+)
-- [ ] T12: Visual Regression Tests (Wave 7, after ALL tasks)
-- Estimated effort: 12-14 days sequential, ~7-8 days with parallelism
+### Section 04 — Data Panels
+- font-mono + text-neon-amber on all financial figures
+- BudgetPanel, CostSettingsModal, CourseBreakdown, ExpenseList, FinancialSettingsModal
 
-## Known Issues / Blockers
-- Pre-commit hook `--bail` was missing its required argument — fixed to `--bail 1` (in `.claude/hooks/pre-commit-test.sh`, not committed)
-- 7 deleted screenshot files in working tree (prior session cleanup) — not committed, harmless
-- THREE.Clock warning — upstream, harmless, no action needed
-- Chunk size warning (1,456 KB) — existing, consider code-splitting
-- 6 Biome warnings (noExplicitAny) in `tests/utils/migrateBudgetConfig.test.ts` — pre-existing, harmless
+### Section 05 — Environment
+- `src/utils/environmentGating.ts` — pure gating functions (fog, frameloop, soft shadows)
+- `src/constants/uvLamps.ts` — shared UV lamp positions/constants
+- `src/components/three/ThreeCanvas.tsx` — Environment + Lightformers + fog + SoftShadows
+- `src/App.tsx` — NoToneMapping, high-performance GL, mobile-aware DPR, tier-aware shadows
 
-## Key Decisions Made This Session
-- **accent-text (#B94FFF)** added as 11th palette token — neon-violet (#9D00FF) fails WCAG AA for text (3.1:1 on void), restricted to decorative use only
-- **useRef + requestAnimationFrame** for UV transition timing (not setTimeout chains)
-- **"Start low, upgrade"** GPU detection fallback (not "start mid")
-- **GodRays decoupled from UV Lamps** — separate GodRaysSource component (T9) with clean cut boundary from lamp fixtures (T8)
-- **fogExp2 gated to 3D perspective only** — useless in orthographic view
-- **T4 runs after T3**, not parallel — both edit BudgetPanel/CostPanel
-- **Version pinning** for Three.js ecosystem during Phase 11A
-- **Max effects per tier policy**: postprocessing effects capped (low=2, mid=4, high=6); scene features budgeted separately
+## Remaining Work — Sections 06-12
+
+### Next up: Section 06 — PostProcessing Stack
+- Single EffectComposer with Bloom, Vignette, ChromaticAberration, Noise
+- GPU-tier gated effects (low=2, mid=4, high=6)
+- Sparkles component for ambient particle effects
+
+### Remaining sections:
+- [ ] **Section 06**: PostProcessing + Sparkles + Effects
+- [ ] **Section 07**: MeshReflectorMaterial (reflective floor)
+- [ ] **Section 08**: Enhanced UV Lighting (4x RectAreaLight)
+- [ ] **Section 09**: GodRays (decoupled from T8)
+- [ ] **Section 10**: UV "Lights Out" Transition
+- [ ] **Section 11**: Performance Fixes (singleton materials)
+- [ ] **Section 12**: Visual Regression Test Suite
+
+## Deep-Implement State
+- **Workflow**: `/deep-implement @golf-planner/docs/plans/sections/index.md`
+- **Session ID**: `b36088d6-5e9c-4438-ae45-583080cd35ef`
+- **Plugin root**: `/home/ben/.claude/plugins/cache/piercelamb-plugins/deep-implement/0.2.0`
+- **Sections dir**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/docs/plans/sections`
+- **State dir**: `/mnt/c/Users/Caus/Golf_Plan/golf-planner/docs/plans/implementation`
+- **State file**: `deep_implement_config.json` tracks completed sections + commit hashes
+- Resuming: just re-run `/deep-implement @golf-planner/docs/plans/sections/index.md` — it auto-detects completed sections
+
+## Skipped Steps (carry forward)
+- **Code review for section-05**: Skipped (simple utility extraction + canvas config, low risk)
+- **Section-05 doc update**: Skipped (would be good to do but non-blocking)
+- **Devils-advocate + blue-team review**: User wants this! Do it after section 06 or 07 (first major 3D rendering section). This is the architectural checkpoint.
+- **needsAlwaysFrameloop cleanup**: Old function in useGpuTier.ts is now unused by production code (App.tsx uses deriveFrameloop instead). Consider removing it + its tests, or keep as public API.
+
+## User Preferences (this session)
+- Skip compaction prompts when recently compacted — just keep working
+- **Proactive compaction at 80-85% context** — don't let it auto-compact, do /handoff first
+- Do /devils-advocate + /blue-team at meaningful architectural checkpoints
+- User trusts Claude to work autonomously (was grocery shopping during sections 04-05)
+- Streamlined deep-implement: skip full code review for simple sections (section-04 pattern)
 
 ## Environment Notes
-- fnm must be sourced: `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"`
-- Git configured in golf-planner/ (user: Golf Planner Dev)
+- fnm: `export PATH="/home/ben/.local/share/fnm:$PATH" && eval "$(fnm env)"`
 - Biome uses **tabs** for indentation
-- PostToolUse hook runs `npx tsc --noEmit` automatically after edits
-- Pre-commit hook runs `npm test -- --bail 1` before every commit
-- Playwright MCP runs on Windows side — WSL paths fail for screenshots
-
-## Conversation Context
-- Session was entirely design/planning focused — no code changes, only documentation
-- Used /deep-plan artifacts (spec, research, interview) from a prior session as input
-- The 4-round adversarial review cycle was: DA Deep → BT → DA Round 2 (attacking the fixes, caught 3 overcorrections) → BT Final Synthesis
-- User preference confirmed: loves the multi-round adversarial review process, wants thorough design before coding
-- Next session should begin implementation using subagent-driven development (/implement skill)
+- PostToolUse hook runs `npx tsc --noEmit` after edits
+- Pre-commit hook runs `npm test -- --bail 1` before commits
diff --git a/src/components/three/PostProcessing.tsx b/src/components/three/PostProcessing.tsx
new file mode 100644
index 0000000..9c9efbf
--- /dev/null
+++ b/src/components/three/PostProcessing.tsx
@@ -0,0 +1,43 @@
+import {
+	Bloom,
+	ChromaticAberration,
+	EffectComposer,
+	N8AO,
+	ToneMapping,
+	Vignette,
+} from "@react-three/postprocessing";
+import { ToneMappingMode } from "postprocessing";
+import { Vector2 } from "three";
+import { useStore } from "../../store";
+import {
+	BLOOM_CONFIG,
+	EFFECT_COMPOSER_CONFIG,
+} from "../../utils/postprocessingConfig";
+import { isMobile } from "../../utils/isMobile";
+
+const chromaticOffset = new Vector2(0.0015, 0.0015);
+
+export default function PostProcessing() {
+	const gpuTier = useStore((s) => s.ui.gpuTier);
+
+	return (
+		<EffectComposer multisampling={EFFECT_COMPOSER_CONFIG.multisampling}>
+			{gpuTier === "high" && <N8AO quality="medium" halfRes />}
+			<Bloom
+				mipmapBlur
+				luminanceThreshold={BLOOM_CONFIG.luminanceThreshold}
+				luminanceSmoothing={BLOOM_CONFIG.luminanceSmoothing}
+				intensity={
+					isMobile
+						? BLOOM_CONFIG.intensity.mobile
+						: BLOOM_CONFIG.intensity.desktop
+				}
+			/>
+			{gpuTier !== "low" && (
+				<ChromaticAberration offset={chromaticOffset} />
+			)}
+			<Vignette offset={0.3} darkness={0.8} />
+			<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
+		</EffectComposer>
+	);
+}
diff --git a/src/components/three/ThreeCanvas.tsx b/src/components/three/ThreeCanvas.tsx
index 14046a6..08dcd1f 100644
--- a/src/components/three/ThreeCanvas.tsx
+++ b/src/components/three/ThreeCanvas.tsx
@@ -3,6 +3,7 @@ import {
 	Lightformer,
 	PerformanceMonitor,
 	SoftShadows,
+	Sparkles,
 	Stats,
 } from "@react-three/drei";
 import { useThree } from "@react-three/fiber";
@@ -14,6 +15,7 @@ import {
 	shouldEnableFog,
 	shouldEnableSoftShadows,
 } from "../../utils/environmentGating";
+import { shouldShowSparkles } from "../../utils/postprocessingConfig";
 import { isMobile } from "../../utils/isMobile";
 import { CameraControls } from "./CameraControls";
 import { FloorGrid } from "./FloorGrid";
@@ -130,6 +132,16 @@ export default function ThreeCanvas({ sunData }: ThreeCanvasProps) {
 			<PlacedHoles />
 			<FlowPath />
 			<SunIndicator sunData={sunData} />
+			{shouldShowSparkles({ gpuTier, uvMode }) && (
+				<Sparkles
+					count={400}
+					color="#9D00FF"
+					size={2}
+					speed={0.3}
+					scale={[10, 4.3, 20]}
+					position={[5, 2.15, 10]}
+				/>
+			)}
 			<UVEffects />
 			<ScreenshotCapture />
 		</>
diff --git a/src/components/three/UVEffects.tsx b/src/components/three/UVEffects.tsx
index 476ec0c..09b39ed 100644
--- a/src/components/three/UVEffects.tsx
+++ b/src/components/three/UVEffects.tsx
@@ -1,14 +1,14 @@
 import { Suspense, lazy } from "react";
 import { useStore } from "../../store";
 
-const UVPostProcessing = lazy(() => import("./UVPostProcessing"));
+const PostProcessing = lazy(() => import("./PostProcessing"));
 
 export function UVEffects() {
 	const uvMode = useStore((s) => s.ui.uvMode);
 	if (!uvMode) return null;
 	return (
 		<Suspense fallback={null}>
-			<UVPostProcessing />
+			<PostProcessing />
 		</Suspense>
 	);
 }
diff --git a/src/components/three/UVPostProcessing.tsx b/src/components/three/UVPostProcessing.tsx
deleted file mode 100644
index b7e0776..0000000
--- a/src/components/three/UVPostProcessing.tsx
+++ /dev/null
@@ -1,18 +0,0 @@
-import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
-import { KernelSize } from "postprocessing";
-import { isMobile } from "../../utils/isMobile";
-
-export default function UVPostProcessing() {
-	return (
-		<EffectComposer>
-			<Bloom
-				intensity={isMobile ? 0.7 : 1.2}
-				luminanceThreshold={0.2}
-				luminanceSmoothing={0.4}
-				kernelSize={isMobile ? KernelSize.SMALL : KernelSize.LARGE}
-				mipmapBlur
-			/>
-			<Vignette offset={0.3} darkness={0.8} />
-		</EffectComposer>
-	);
-}
diff --git a/src/components/three/holes/materialPresets.ts b/src/components/three/holes/materialPresets.ts
index 09d984c..5d9e069 100644
--- a/src/components/three/holes/materialPresets.ts
+++ b/src/components/three/holes/materialPresets.ts
@@ -18,4 +18,4 @@ export const FELT_PBR: Record<MaterialProfile, PBRProps> = {
 	semi_pro: { color: "#1B5E20", roughness: 0.95, metalness: 0.0 },
 };
 
-export const UV_EMISSIVE_INTENSITY = 0.8;
+export const UV_EMISSIVE_INTENSITY = 2.0;
diff --git a/src/components/three/holes/shared.ts b/src/components/three/holes/shared.ts
index 1b0cae5..7d92a5f 100644
--- a/src/components/three/holes/shared.ts
+++ b/src/components/three/holes/shared.ts
@@ -55,7 +55,7 @@ export const cupMaterial = new THREE.MeshStandardMaterial({
 export const uvFeltMaterial = new THREE.MeshStandardMaterial({
 	color: "#003300",
 	emissive: "#00FF66",
-	emissiveIntensity: 0.8,
+	emissiveIntensity: 2.0,
 	roughness: 0.9,
 	metalness: 0,
 	polygonOffset: true,
@@ -65,7 +65,7 @@ export const uvFeltMaterial = new THREE.MeshStandardMaterial({
 export const uvBumperMaterial = new THREE.MeshStandardMaterial({
 	color: "#001A33",
 	emissive: "#00CCFF",
-	emissiveIntensity: 0.8,
+	emissiveIntensity: 2.0,
 	roughness: 0.3,
 	metalness: 0.1,
 });
@@ -73,7 +73,7 @@ export const uvBumperMaterial = new THREE.MeshStandardMaterial({
 export const uvTeeMaterial = new THREE.MeshStandardMaterial({
 	color: "#333300",
 	emissive: "#FFFF00",
-	emissiveIntensity: 0.8,
+	emissiveIntensity: 2.0,
 	roughness: 0.5,
 	metalness: 0,
 });
@@ -81,7 +81,7 @@ export const uvTeeMaterial = new THREE.MeshStandardMaterial({
 export const uvCupMaterial = new THREE.MeshStandardMaterial({
 	color: "#331A00",
 	emissive: "#FF6600",
-	emissiveIntensity: 0.8,
+	emissiveIntensity: 2.0,
 	roughness: 0.5,
 	metalness: 0,
 });
diff --git a/src/store/store.ts b/src/store/store.ts
index 6d0d958..5d648b6 100644
--- a/src/store/store.ts
+++ b/src/store/store.ts
@@ -79,6 +79,7 @@ type StoreActions = {
 	setGpuTier: (tier: GpuTier) => void;
 	setGpuTierOverride: (override: GpuTierOverride) => void;
 	setTransitioning: (transitioning: boolean) => void;
+	setGodRaysLampRef: (ref: UIState["godRaysLampRef"]) => void;
 	setFinancialSettings: (updates: Partial<FinancialSettings>) => void;
 	addExpense: (expense: ExpenseEntry) => void;
 	deleteExpense: (expenseId: string) => void;
@@ -116,6 +117,7 @@ const DEFAULT_UI: UIState = {
 	uvMode: false,
 	gpuTier: "low",
 	transitioning: false,
+	godRaysLampRef: null,
 };
 
 function migrateToV4(state: PersistedSlice): void {
@@ -504,7 +506,13 @@ export const useStore = create<Store>()(
 					}));
 				},
 
-				setFinancialSettings: (updates) =>
+				setGodRaysLampRef: (ref) => {
+				set((state) => ({
+					ui: { ...state.ui, godRaysLampRef: ref },
+				}));
+			},
+
+			setFinancialSettings: (updates) =>
 					set((state) => ({
 						financialSettings: {
 							...state.financialSettings,
diff --git a/src/types/ui.ts b/src/types/ui.ts
index b4eeb55..2712567 100644
--- a/src/types/ui.ts
+++ b/src/types/ui.ts
@@ -1,3 +1,4 @@
+import type { Mesh } from "three";
 import type { HoleType } from "./hole";
 
 export type Tool = "select" | "place" | "move" | "delete";
@@ -20,4 +21,5 @@ export type UIState = {
 	uvMode: boolean;
 	gpuTier: GpuTier;
 	transitioning: boolean;
+	godRaysLampRef: React.RefObject<Mesh | null> | null;
 };
diff --git a/src/utils/postprocessingConfig.ts b/src/utils/postprocessingConfig.ts
new file mode 100644
index 0000000..7d5fc39
--- /dev/null
+++ b/src/utils/postprocessingConfig.ts
@@ -0,0 +1,53 @@
+import type { GpuTier } from "../types/ui";
+
+export type { GpuTier };
+
+export type EffectOptions = {
+	hasGodRaysRef?: boolean;
+};
+
+/**
+ * Returns the list of postprocessing effect names active for a given GPU tier.
+ * Always-on: bloom, vignette, toneMapping.
+ * Mid+: chromaticAberration.
+ * High only: n8ao, godRays (when lamp ref is available).
+ */
+export function getEffectsForTier(
+	tier: GpuTier,
+	options?: EffectOptions,
+): string[] {
+	const effects: string[] = ["bloom", "vignette", "toneMapping"];
+
+	if (tier === "mid" || tier === "high") {
+		effects.push("chromaticAberration");
+	}
+
+	if (tier === "high") {
+		effects.push("n8ao");
+		if (options?.hasGodRaysRef) {
+			effects.push("godRays");
+		}
+	}
+
+	return effects;
+}
+
+/**
+ * Returns true when Sparkles should render (mid+ tier, UV mode active).
+ */
+export function shouldShowSparkles(state: {
+	gpuTier: GpuTier;
+	uvMode: boolean;
+}): boolean {
+	return state.uvMode && state.gpuTier !== "low";
+}
+
+export const BLOOM_CONFIG = {
+	luminanceThreshold: 0.8,
+	luminanceSmoothing: 0.4,
+	intensity: { mobile: 0.7, desktop: 1.0 },
+} as const;
+
+export const EFFECT_COMPOSER_CONFIG = {
+	multisampling: 0,
+} as const;
diff --git a/tests/postprocessing.test.ts b/tests/postprocessing.test.ts
new file mode 100644
index 0000000..0c1a7db
--- /dev/null
+++ b/tests/postprocessing.test.ts
@@ -0,0 +1,85 @@
+import { describe, expect, it } from "vitest";
+import {
+	BLOOM_CONFIG,
+	EFFECT_COMPOSER_CONFIG,
+	getEffectsForTier,
+	shouldShowSparkles,
+} from "../src/utils/postprocessingConfig";
+import { UV_EMISSIVE_INTENSITY } from "../src/components/three/holes/materialPresets";
+
+describe("PostProcessing effect stack", () => {
+	it("includes Bloom at all tiers", () => {
+		expect(getEffectsForTier("low")).toContain("bloom");
+		expect(getEffectsForTier("mid")).toContain("bloom");
+		expect(getEffectsForTier("high")).toContain("bloom");
+	});
+
+	it("includes Vignette at all tiers", () => {
+		expect(getEffectsForTier("low")).toContain("vignette");
+		expect(getEffectsForTier("mid")).toContain("vignette");
+		expect(getEffectsForTier("high")).toContain("vignette");
+	});
+
+	it("includes ToneMapping at all tiers", () => {
+		expect(getEffectsForTier("low")).toContain("toneMapping");
+		expect(getEffectsForTier("mid")).toContain("toneMapping");
+		expect(getEffectsForTier("high")).toContain("toneMapping");
+	});
+
+	it("includes ChromaticAberration at mid+ only", () => {
+		expect(getEffectsForTier("low")).not.toContain("chromaticAberration");
+		expect(getEffectsForTier("mid")).toContain("chromaticAberration");
+		expect(getEffectsForTier("high")).toContain("chromaticAberration");
+	});
+
+	it("includes N8AO at high only", () => {
+		expect(getEffectsForTier("low")).not.toContain("n8ao");
+		expect(getEffectsForTier("mid")).not.toContain("n8ao");
+		expect(getEffectsForTier("high")).toContain("n8ao");
+	});
+
+	it("includes GodRays at high only when lampRef available", () => {
+		expect(
+			getEffectsForTier("high", { hasGodRaysRef: true }),
+		).toContain("godRays");
+		expect(
+			getEffectsForTier("high", { hasGodRaysRef: false }),
+		).not.toContain("godRays");
+		expect(
+			getEffectsForTier("mid", { hasGodRaysRef: true }),
+		).not.toContain("godRays");
+	});
+});
+
+describe("Sparkles gating", () => {
+	it("enabled for mid tier + uvMode", () => {
+		expect(shouldShowSparkles({ gpuTier: "mid", uvMode: true })).toBe(true);
+	});
+
+	it("enabled for high tier + uvMode", () => {
+		expect(shouldShowSparkles({ gpuTier: "high", uvMode: true })).toBe(true);
+	});
+
+	it("disabled for low tier", () => {
+		expect(shouldShowSparkles({ gpuTier: "low", uvMode: true })).toBe(false);
+	});
+
+	it("disabled when uvMode=false", () => {
+		expect(shouldShowSparkles({ gpuTier: "mid", uvMode: false })).toBe(false);
+		expect(shouldShowSparkles({ gpuTier: "high", uvMode: false })).toBe(false);
+	});
+});
+
+describe("Bloom and emissive configuration", () => {
+	it("bloom luminanceThreshold is 0.8", () => {
+		expect(BLOOM_CONFIG.luminanceThreshold).toBe(0.8);
+	});
+
+	it("UV_EMISSIVE_INTENSITY constant is 2.0", () => {
+		expect(UV_EMISSIVE_INTENSITY).toBe(2.0);
+	});
+
+	it("EffectComposer multisampling is 0", () => {
+		expect(EFFECT_COMPOSER_CONFIG.multisampling).toBe(0);
+	});
+});
