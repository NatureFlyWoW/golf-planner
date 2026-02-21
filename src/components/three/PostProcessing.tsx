import {
	Bloom,
	ChromaticAberration,
	EffectComposer,
	GodRays,
	N8AO,
	ToneMapping,
	Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Vector2 } from "three";
import { useStore } from "../../store";
import { GODRAYS_EFFECT_CONFIG } from "../../utils/godraysConfig";
import { isMobile } from "../../utils/isMobile";
import {
	BLOOM_CONFIG,
	EFFECT_COMPOSER_CONFIG,
} from "../../utils/postprocessingConfig";

const chromaticOffset = new Vector2(0.0015, 0.0015);

export default function PostProcessing() {
	const gpuTier = useStore((s) => s.ui.gpuTier);
	const godRaysLampRef = useStore((s) => s.ui.godRaysLampRef);

	return (
		<EffectComposer multisampling={EFFECT_COMPOSER_CONFIG.multisampling}>
			{gpuTier === "high" && <N8AO quality="medium" halfRes />}
			{gpuTier === "high" && godRaysLampRef?.current && (
				<GodRays
					sun={godRaysLampRef.current}
					samples={GODRAYS_EFFECT_CONFIG.samples}
					density={GODRAYS_EFFECT_CONFIG.density}
					decay={GODRAYS_EFFECT_CONFIG.decay}
					weight={GODRAYS_EFFECT_CONFIG.weight}
					blur={GODRAYS_EFFECT_CONFIG.blur}
				/>
			)}
			<Bloom
				mipmapBlur
				luminanceThreshold={BLOOM_CONFIG.luminanceThreshold}
				luminanceSmoothing={BLOOM_CONFIG.luminanceSmoothing}
				intensity={
					isMobile
						? BLOOM_CONFIG.intensity.mobile
						: BLOOM_CONFIG.intensity.desktop
				}
			/>
			{gpuTier !== "low" && <ChromaticAberration offset={chromaticOffset} />}
			<Vignette offset={0.3} darkness={0.8} />
			<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
		</EffectComposer>
	);
}
