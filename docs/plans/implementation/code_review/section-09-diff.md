diff --git a/src/components/three/GodRaysSource.tsx b/src/components/three/GodRaysSource.tsx
new file mode 100644
index 0000000..11e1ea3
--- /dev/null
+++ b/src/components/three/GodRaysSource.tsx
@@ -0,0 +1,46 @@
+import { useEffect, useRef } from "react";
+import type { Mesh } from "three";
+import { useStore } from "../../store";
+import {
+	GODRAYS_SOURCE_CONFIG,
+	GODRAYS_SOURCE_POSITIONS,
+} from "../../utils/godraysConfig";
+
+/**
+ * Emissive sphere meshes co-located with UV lamp positions.
+ * Serves as the "sun" source for the GodRays postprocessing effect.
+ * Decoupled from UVLamps — can be deleted entirely if GodRays are cut.
+ */
+export function GodRaysSource() {
+	const primaryRef = useRef<Mesh>(null);
+	const setGodRaysLampRef = useStore((s) => s.setGodRaysLampRef);
+
+	useEffect(() => {
+		if (primaryRef.current) {
+			setGodRaysLampRef(primaryRef);
+		}
+		return () => {
+			setGodRaysLampRef(null);
+		};
+	}, [setGodRaysLampRef]);
+
+	return (
+		<group>
+			{GODRAYS_SOURCE_POSITIONS.map((pos, i) => (
+				<mesh
+					key={`godrays-${pos[0]}-${pos[2]}`}
+					ref={i === 0 ? primaryRef : undefined}
+					position={pos}
+				>
+					<sphereGeometry args={[GODRAYS_SOURCE_CONFIG.radius, 16, 16]} />
+					<meshBasicMaterial
+						color={GODRAYS_SOURCE_CONFIG.emissiveColor}
+						transparent={GODRAYS_SOURCE_CONFIG.transparent}
+						depthWrite={GODRAYS_SOURCE_CONFIG.depthWrite}
+						toneMapped={false}
+					/>
+				</mesh>
+			))}
+		</group>
+	);
+}
diff --git a/src/components/three/PostProcessing.tsx b/src/components/three/PostProcessing.tsx
index f1688f2..d973271 100644
--- a/src/components/three/PostProcessing.tsx
+++ b/src/components/three/PostProcessing.tsx
@@ -2,6 +2,7 @@ import {
 	Bloom,
 	ChromaticAberration,
 	EffectComposer,
+	GodRays,
 	N8AO,
 	ToneMapping,
 	Vignette,
@@ -9,6 +10,7 @@ import {
 import { ToneMappingMode } from "postprocessing";
 import { Vector2 } from "three";
 import { useStore } from "../../store";
+import { GODRAYS_EFFECT_CONFIG } from "../../utils/godraysConfig";
 import { isMobile } from "../../utils/isMobile";
 import {
 	BLOOM_CONFIG,
@@ -19,11 +21,21 @@ const chromaticOffset = new Vector2(0.0015, 0.0015);
 
 export default function PostProcessing() {
 	const gpuTier = useStore((s) => s.ui.gpuTier);
+	const godRaysLampRef = useStore((s) => s.ui.godRaysLampRef);
 
-	// TODO(Section-09): Read godRaysLampRef from store, render <GodRays> for high tier
 	return (
 		<EffectComposer multisampling={EFFECT_COMPOSER_CONFIG.multisampling}>
 			{gpuTier === "high" && <N8AO quality="medium" halfRes />}
+			{gpuTier === "high" && godRaysLampRef?.current && (
+				<GodRays
+					sun={godRaysLampRef.current}
+					samples={GODRAYS_EFFECT_CONFIG.samples}
+					density={GODRAYS_EFFECT_CONFIG.density}
+					decay={GODRAYS_EFFECT_CONFIG.decay}
+					weight={GODRAYS_EFFECT_CONFIG.weight}
+					blur={GODRAYS_EFFECT_CONFIG.blur}
+				/>
+			)}
 			<Bloom
 				mipmapBlur
 				luminanceThreshold={BLOOM_CONFIG.luminanceThreshold}
diff --git a/src/components/three/ThreeCanvas.tsx b/src/components/three/ThreeCanvas.tsx
index bbacf90..c1d6d37 100644
--- a/src/components/three/ThreeCanvas.tsx
+++ b/src/components/three/ThreeCanvas.tsx
@@ -16,10 +16,12 @@ import {
 	shouldEnableSoftShadows,
 } from "../../utils/environmentGating";
 import { isMobile } from "../../utils/isMobile";
+import { shouldShowGodRays } from "../../utils/godraysConfig";
 import { shouldShowSparkles } from "../../utils/postprocessingConfig";
 import { CameraControls } from "./CameraControls";
 import { FloorGrid } from "./FloorGrid";
 import { FlowPath } from "./FlowPath";
+import { GodRaysSource } from "./GodRaysSource";
 import { Hall } from "./Hall";
 import { PlacedHoles } from "./PlacedHoles";
 import { PlacementHandler } from "./PlacementHandler";
@@ -121,6 +123,7 @@ export default function ThreeCanvas({ sunData }: ThreeCanvasProps) {
 				/>
 			)}
 			{uvMode && <UVLamps />}
+			{shouldShowGodRays({ gpuTier, uvMode }) && <GodRaysSource />}
 			<CameraControls />
 			<FloorGrid />
 			<Hall sunData={sunData} />
diff --git a/src/utils/godraysConfig.ts b/src/utils/godraysConfig.ts
new file mode 100644
index 0000000..a58f4a7
--- /dev/null
+++ b/src/utils/godraysConfig.ts
@@ -0,0 +1,29 @@
+import { UV_LAMP_POSITIONS } from "../constants/uvLamps";
+import type { GpuTier } from "../types/ui";
+
+/** GodRays only render on high-tier GPUs in UV mode. */
+export function shouldShowGodRays(state: {
+	gpuTier: GpuTier;
+	uvMode: boolean;
+}): boolean {
+	return state.gpuTier === "high" && state.uvMode;
+}
+
+export const GODRAYS_SOURCE_CONFIG = {
+	radius: 0.1,
+	transparent: true,
+	depthWrite: false,
+	emissiveColor: "#8800FF",
+	emissiveIntensity: 3.0,
+} as const;
+
+/** Co-located with UV lamp ceiling positions from constants/uvLamps.ts */
+export const GODRAYS_SOURCE_POSITIONS = UV_LAMP_POSITIONS;
+
+export const GODRAYS_EFFECT_CONFIG = {
+	samples: 30,
+	density: 0.96,
+	decay: 0.9,
+	weight: 0.4,
+	blur: true,
+} as const;
diff --git a/tests/godrays.test.ts b/tests/godrays.test.ts
new file mode 100644
index 0000000..a872856
--- /dev/null
+++ b/tests/godrays.test.ts
@@ -0,0 +1,96 @@
+import { describe, expect, it } from "vitest";
+import { UV_LAMP_POSITIONS } from "../src/constants/uvLamps";
+import {
+	GODRAYS_EFFECT_CONFIG,
+	GODRAYS_SOURCE_CONFIG,
+	GODRAYS_SOURCE_POSITIONS,
+	shouldShowGodRays,
+} from "../src/utils/godraysConfig";
+import { getEffectsForTier } from "../src/utils/postprocessingConfig";
+
+describe("GodRays gating", () => {
+	it("renders when gpuTier=high AND uvMode=true", () => {
+		expect(shouldShowGodRays({ gpuTier: "high", uvMode: true })).toBe(true);
+	});
+
+	it("does not render when gpuTier=mid even if uvMode=true", () => {
+		expect(shouldShowGodRays({ gpuTier: "mid", uvMode: true })).toBe(false);
+	});
+
+	it("does not render when gpuTier=low even if uvMode=true", () => {
+		expect(shouldShowGodRays({ gpuTier: "low", uvMode: true })).toBe(false);
+	});
+
+	it("does not render when uvMode=false even if gpuTier=high", () => {
+		expect(shouldShowGodRays({ gpuTier: "high", uvMode: false })).toBe(false);
+	});
+});
+
+describe("GodRays source mesh configuration", () => {
+	it("has transparent=true", () => {
+		expect(GODRAYS_SOURCE_CONFIG.transparent).toBe(true);
+	});
+
+	it("has depthWrite=false", () => {
+		expect(GODRAYS_SOURCE_CONFIG.depthWrite).toBe(false);
+	});
+
+	it("has sphere radius of 0.1", () => {
+		expect(GODRAYS_SOURCE_CONFIG.radius).toBe(0.1);
+	});
+});
+
+describe("GodRays source positions", () => {
+	it("has 4 positions matching UV lamp positions", () => {
+		expect(GODRAYS_SOURCE_POSITIONS).toHaveLength(4);
+		expect(GODRAYS_SOURCE_POSITIONS).toEqual(UV_LAMP_POSITIONS);
+	});
+
+	it("positions are at ceiling height y=4.3", () => {
+		for (const pos of GODRAYS_SOURCE_POSITIONS) {
+			expect(pos[1]).toBe(4.3);
+		}
+	});
+});
+
+describe("GodRays ref wiring via getEffectsForTier", () => {
+	it("excludes godRays when hasGodRaysRef=false", () => {
+		expect(
+			getEffectsForTier("high", { hasGodRaysRef: false }),
+		).not.toContain("godRays");
+	});
+
+	it("includes godRays when hasGodRaysRef=true on high tier", () => {
+		expect(getEffectsForTier("high", { hasGodRaysRef: true })).toContain(
+			"godRays",
+		);
+	});
+
+	it("excludes godRays on mid tier even with hasGodRaysRef=true", () => {
+		expect(
+			getEffectsForTier("mid", { hasGodRaysRef: true }),
+		).not.toContain("godRays");
+	});
+});
+
+describe("GodRays effect configuration", () => {
+	it("samples is 30", () => {
+		expect(GODRAYS_EFFECT_CONFIG.samples).toBe(30);
+	});
+
+	it("density is 0.96", () => {
+		expect(GODRAYS_EFFECT_CONFIG.density).toBe(0.96);
+	});
+
+	it("decay is 0.9", () => {
+		expect(GODRAYS_EFFECT_CONFIG.decay).toBe(0.9);
+	});
+
+	it("weight is 0.4", () => {
+		expect(GODRAYS_EFFECT_CONFIG.weight).toBe(0.4);
+	});
+
+	it("blur is true", () => {
+		expect(GODRAYS_EFFECT_CONFIG.blur).toBe(true);
+	});
+});
