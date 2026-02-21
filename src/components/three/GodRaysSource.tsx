import { useEffect, useRef } from "react";
import type { Mesh } from "three";
import { useStore } from "../../store";
import {
	GODRAYS_SOURCE_CONFIG,
	GODRAYS_SOURCE_POSITIONS,
} from "../../utils/godraysConfig";

/**
 * Emissive sphere meshes co-located with UV lamp positions.
 * Serves as the "sun" source for the GodRays postprocessing effect.
 * Decoupled from UVLamps — can be deleted entirely if GodRays are cut.
 */
export function GodRaysSource() {
	const primaryRef = useRef<Mesh>(null);
	const setGodRaysLampRef = useStore((s) => s.setGodRaysLampRef);

	useEffect(() => {
		if (primaryRef.current) {
			setGodRaysLampRef(primaryRef);
		}
		return () => {
			setGodRaysLampRef(null);
		};
	}, [setGodRaysLampRef]);

	return (
		<group>
			{GODRAYS_SOURCE_POSITIONS.map((pos, i) => (
				<mesh
					key={`godrays-${pos[0]}-${pos[1]}-${pos[2]}`}
					ref={i === 0 ? primaryRef : undefined}
					position={pos}
				>
					<sphereGeometry args={[GODRAYS_SOURCE_CONFIG.radius, 16, 16]} />
					<meshBasicMaterial
						color={GODRAYS_SOURCE_CONFIG.emissiveColor}
						transparent={GODRAYS_SOURCE_CONFIG.transparent}
						depthWrite={GODRAYS_SOURCE_CONFIG.depthWrite}
						toneMapped={false}
					/>
				</mesh>
			))}
		</group>
	);
}
