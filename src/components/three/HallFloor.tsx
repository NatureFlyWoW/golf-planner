import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";
import type { GpuTier, ViewMode } from "../../types/ui";
import { useStore } from "../../store";

// --- Pure gating functions (exported for testing) ---

type ReflectorGateInput = {
	uvMode: boolean;
	view: ViewMode;
	gpuTier: GpuTier;
	perfCurrent: number;
};

export function shouldUseReflector(input: ReflectorGateInput): boolean {
	return (
		input.uvMode &&
		input.view === "3d" &&
		input.gpuTier !== "low" &&
		input.perfCurrent >= 0.5
	);
}

export function getReflectorResolution(gpuTier: GpuTier): number {
	return gpuTier === "high" ? 512 : 256;
}

// --- Component ---

export function HallFloor() {
	const { width, length } = useStore((s) => s.hall);
	const uvMode = useStore((s) => s.ui.uvMode);
	const view = useStore((s) => s.ui.view);
	const gpuTier = useStore((s) => s.ui.gpuTier);

	const [perfOk, setPerfOk] = useState(true);
	const perfOkRef = useRef(true);
	useFrame((state) => {
		const ok = state.performance.current >= 0.5;
		if (ok !== perfOkRef.current) {
			perfOkRef.current = ok;
			setPerfOk(ok);
		}
	});

	const useReflector = shouldUseReflector({
		uvMode,
		view,
		gpuTier,
		perfCurrent: perfOk ? 1.0 : 0.0,
	});

	return (
		<mesh
			receiveShadow
			rotation={[-Math.PI / 2, 0, 0]}
			position={[width / 2, 0, length / 2]}
		>
			<planeGeometry args={[width, length]} />
			{useReflector ? (
				<MeshReflectorMaterial
					resolution={getReflectorResolution(gpuTier)}
					blur={[200, 100]}
					mixStrength={0.8}
					mirror={0}
					color="#07071A"
					roughness={0.3}
					metalness={0.8}
				/>
			) : (
				<meshStandardMaterial
					color={uvMode ? "#07071A" : "#E0E0E0"}
				/>
			)}
		</mesh>
	);
}
