import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { KernelSize } from "postprocessing";
import { isMobile } from "../../utils/isMobile";

export default function UVPostProcessing() {
	return (
		<EffectComposer>
			<Bloom
				intensity={isMobile ? 0.7 : 1.2}
				luminanceThreshold={0.2}
				luminanceSmoothing={0.4}
				kernelSize={isMobile ? KernelSize.SMALL : KernelSize.LARGE}
				mipmapBlur
			/>
			<Vignette offset={0.3} darkness={0.8} />
		</EffectComposer>
	);
}
