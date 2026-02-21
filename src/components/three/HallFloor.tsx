import { MeshReflectorMaterial, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useRef, useState } from "react";
import * as THREE from "three";
import { useStore } from "../../store";
import type { GpuTier, ViewMode } from "../../types/ui";

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

// --- Floor material config (exported for testing) ---

const CONCRETE_TILE_SIZE = 2;

type FloorMaterialInput = { gpuTier: GpuTier; uvMode: boolean };
type FloorMaterialConfig = { useTextures: boolean; color: string };

export function getFloorMaterialConfig(
	input: FloorMaterialInput,
): FloorMaterialConfig {
	const useTextures = input.gpuTier !== "low";
	const color = input.uvMode ? "#07071A" : "#E0E0E0";
	return { useTextures, color };
}

export function getFloorUVRepeat(
	hallWidth: number,
	hallLength: number,
): [number, number] {
	return [
		hallWidth / CONCRETE_TILE_SIZE,
		hallLength / CONCRETE_TILE_SIZE,
	];
}

// --- Components ---

function FlatHallFloor({
	width,
	length,
	uvMode,
	useReflector,
	gpuTier,
}: {
	width: number;
	length: number;
	uvMode: boolean;
	useReflector: boolean;
	gpuTier: GpuTier;
}) {
	const color = uvMode ? "#07071A" : "#E0E0E0";
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
					color={color}
					roughness={0.3}
					metalness={0.8}
				/>
			) : (
				<meshStandardMaterial color={color} />
			)}
		</mesh>
	);
}

function TexturedHallFloor({
	width,
	length,
	uvMode,
	useReflector,
	gpuTier,
}: {
	width: number;
	length: number;
	uvMode: boolean;
	useReflector: boolean;
	gpuTier: GpuTier;
}) {
	const textures = useTexture({
		map: "/textures/concrete/color.jpg",
		normalMap: "/textures/concrete/normal.jpg",
		roughnessMap: "/textures/concrete/roughness.jpg",
	});

	const repeat = getFloorUVRepeat(width, length);
	for (const tex of Object.values(textures)) {
		if (tex instanceof THREE.Texture) {
			tex.wrapS = THREE.RepeatWrapping;
			tex.wrapT = THREE.RepeatWrapping;
			tex.repeat.set(repeat[0], repeat[1]);
		}
	}

	const color = uvMode ? "#07071A" : "#E0E0E0";

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
					color={color}
					roughness={0.8}
					metalness={0}
					map={uvMode ? undefined : textures.map}
					normalMap={textures.normalMap}
					roughnessMap={uvMode ? undefined : textures.roughnessMap}
				/>
			) : (
				<meshStandardMaterial
					color={color}
					map={uvMode ? undefined : textures.map}
					normalMap={textures.normalMap}
					roughnessMap={uvMode ? undefined : textures.roughnessMap}
					roughness={0.85}
				/>
			)}
		</mesh>
	);
}

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

	const config = getFloorMaterialConfig({ gpuTier, uvMode });
	const flatFallback = (
		<FlatHallFloor
			width={width}
			length={length}
			uvMode={uvMode}
			useReflector={useReflector}
			gpuTier={gpuTier}
		/>
	);

	if (!config.useTextures) {
		return flatFallback;
	}

	return (
		<Suspense fallback={flatFallback}>
			<TexturedHallFloor
				width={width}
				length={length}
				uvMode={uvMode}
				useReflector={useReflector}
				gpuTier={gpuTier}
			/>
		</Suspense>
	);
}
