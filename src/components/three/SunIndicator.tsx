import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { getSunDirection, type SunData } from "../../hooks/useSunPosition";
import { useStore } from "../../store";

type SunIndicatorProps = {
	sunData: SunData;
};

export function SunIndicator({ sunData }: SunIndicatorProps) {
	const { width, length } = useStore((s) => s.hall);
	const invalidate = useThree((s) => s.invalidate);

	// Request a new frame when sun data changes (needed because frameloop="demand")
	// Reading sunData properties ensures Biome sees them as used dependencies
	useEffect(() => {
		void sunData.azimuth;
		void sunData.altitude;
		invalidate();
	}, [sunData.azimuth, sunData.altitude, invalidate]);

	const { position, rotation, visible } = useMemo(() => {
		if (!sunData.isDay) {
			return { position: [0, 0, 0] as const, rotation: 0, visible: false };
		}

		const dir = getSunDirection(sunData.azimuth);
		const centerX = width / 2;
		const centerZ = length / 2;

		// Place arrow 2m outside the hall, in the direction of the sun
		// getSunDirection returns direction FROM hall center TOWARD the sun
		const arrowDist = Math.max(width, length) / 2 + 2;
		const posX = centerX + dir.x * arrowDist;
		const posZ = centerZ + dir.z * arrowDist;

		// Rotation: arrow points toward hall center (opposite of sun direction)
		const angle = Math.atan2(-dir.x, -dir.z);

		return {
			position: [posX, 0.1, posZ] as const,
			rotation: angle,
			visible: true,
		};
	}, [sunData.azimuth, sunData.isDay, width, length]);

	const uvMode = useStore((s) => s.ui.uvMode);
	const sunLayer = useStore((s) => s.ui.layers.sunIndicator);

	if (uvMode) return null;
	if (!visible) return null;
	if (!sunLayer.visible) return null;

	return (
		<group position={position} rotation={[0, rotation, 0]}>
			{/* Arrow body */}
			<mesh position={[0, 0, 0.5]}>
				<boxGeometry args={[0.3, 0.05, 1.0]} />
				<meshStandardMaterial
					color="#FFA726"
					transparent={sunLayer.opacity < 1}
					opacity={sunLayer.opacity}
				/>
			</mesh>
			{/* Arrow head (triangle via cone) */}
			<mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<coneGeometry args={[0.4, 0.6, 3]} />
				<meshStandardMaterial
					color="#FF9800"
					transparent={sunLayer.opacity < 1}
					opacity={sunLayer.opacity}
				/>
			</mesh>
			{/* Sun info label */}
			<Html position={[0, 0.5, 1.2]} center>
				<div
					style={{
						background: "rgba(0,0,0,0.7)",
						color: "#FFD54F",
						padding: "2px 6px",
						borderRadius: "4px",
						fontSize: "11px",
						whiteSpace: "nowrap",
						fontFamily: "monospace",
						userSelect: "none",
						pointerEvents: "none",
						opacity: sunLayer.opacity,
					}}
				>
					{sunData.azimuthDeg} {sunData.altitudeDeg} alt
				</div>
			</Html>
		</group>
	);
}
