import {
	Bloom,
	ChromaticAberration,
	EffectComposer,
	N8AO,
	ToneMapping,
	Vignette,
} from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Vector2 } from "three";
import { useStore } from "../../store";
import { isMobile } from "../../utils/isMobile";
import {
	BLOOM_CONFIG,
	EFFECT_COMPOSER_CONFIG,
} from "../../utils/postprocessingConfig";

const chromaticOffset = new Vector2(0.0015, 0.0015);

export default function PostProcessing() {
	const gpuTier = useStore((s) => s.ui.gpuTier);

	// TODO(Section-09): Read godRaysLampRef from store, render <GodRays> for high tier
	return (
		<EffectComposer multisampling={EFFECT_COMPOSER_CONFIG.multisampling}>
			{gpuTier === "high" && <N8AO quality="medium" halfRes />}
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
