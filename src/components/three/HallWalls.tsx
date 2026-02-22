import { useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef } from "react";
import { MeshStandardMaterial } from "three";
import * as THREE from "three";
import { useGroupOpacity } from "../../hooks/useGroupOpacity";
import { useStore } from "../../store";
import type { GpuTier } from "../../types/ui";

// Module-level singletons — created once, never mutated (kept for test compat)
export const planningWallMaterial = new MeshStandardMaterial({
	color: "#B0B0B0",
});

export const uvWallMaterial = new MeshStandardMaterial({
	color: "#1A1A2E",
});

/** Pure selector for testability. */
export function getWallMaterial(uvMode: boolean): MeshStandardMaterial {
	return uvMode ? uvWallMaterial : planningWallMaterial;
}

// --- Pure functions (exported for testing) ---

const STEEL_PANEL_WIDTH = 1;

type WallMaterialInput = { gpuTier: GpuTier; uvMode: boolean };
type WallMaterialConfig = { useTextures: boolean; color: string };

export function shouldLoadHallTextures(gpuTier: GpuTier): boolean {
	return gpuTier !== "low";
}

export function getWallMaterialConfig(
	input: WallMaterialInput,
): WallMaterialConfig {
	const useTextures = input.gpuTier !== "low";
	const color = input.uvMode ? "#1A1A2E" : "#B0B0B0";
	return { useTextures, color };
}

export function getWallUVRepeat(wallLength: number): [number, number] {
	return [wallLength / STEEL_PANEL_WIDTH, 1];
}

// --- Components ---

type WallsProps = {
	width: number;
	length: number;
	wallHeight: number;
	wallThickness: number;
	uvMode: boolean;
};

function FlatHallWalls({
	width,
	length,
	wallHeight,
	wallThickness,
	uvMode,
}: WallsProps) {
	const halfH = wallHeight / 2;
	const material = getWallMaterial(uvMode);

	return (
		<group>
			<mesh position={[width / 2, halfH, 0]} material={material}>
				<boxGeometry args={[width, wallHeight, wallThickness]} />
			</mesh>
			<mesh position={[width / 2, halfH, length]} material={material}>
				<boxGeometry args={[width, wallHeight, wallThickness]} />
			</mesh>
			<mesh position={[0, halfH, length / 2]} material={material}>
				<boxGeometry args={[wallThickness, wallHeight, length]} />
			</mesh>
			<mesh position={[width, halfH, length / 2]} material={material}>
				<boxGeometry args={[wallThickness, wallHeight, length]} />
			</mesh>
		</group>
	);
}

function TexturedHallWalls({
	width,
	length,
	wallHeight,
	wallThickness,
	uvMode,
}: WallsProps) {
	const textures = useTexture({
		map: "/textures/steel/color.jpg",
		normalMap: "/textures/steel/normal.jpg",
		roughnessMap: "/textures/steel/roughness.jpg",
		metalnessMap: "/textures/steel/metalness.jpg",
	});

	const longRepeat = getWallUVRepeat(length);
	const shortRepeat = getWallUVRepeat(width);

	// Create materials for long and short walls with different UV repeats
	const { longMat, shortMat } = useMemo(() => {
		const baseProps = uvMode
			? { color: "#1A1A2E", metalness: 0.1, roughness: 0.5 }
			: { color: "#B0B0B0", metalness: 0.7, roughness: 0.6 };

		// Clone textures for long walls
		const longMap = textures.map.clone();
		longMap.wrapS = THREE.RepeatWrapping;
		longMap.wrapT = THREE.RepeatWrapping;
		longMap.repeat.set(longRepeat[0], longRepeat[1]);
		const longNorm = textures.normalMap.clone();
		longNorm.wrapS = THREE.RepeatWrapping;
		longNorm.wrapT = THREE.RepeatWrapping;
		longNorm.repeat.set(longRepeat[0], longRepeat[1]);
		const longRough = textures.roughnessMap.clone();
		longRough.wrapS = THREE.RepeatWrapping;
		longRough.wrapT = THREE.RepeatWrapping;
		longRough.repeat.set(longRepeat[0], longRepeat[1]);
		const longMetal = textures.metalnessMap.clone();
		longMetal.wrapS = THREE.RepeatWrapping;
		longMetal.wrapT = THREE.RepeatWrapping;
		longMetal.repeat.set(longRepeat[0], longRepeat[1]);

		// Clone textures for short walls
		const shortMap = textures.map.clone();
		shortMap.wrapS = THREE.RepeatWrapping;
		shortMap.wrapT = THREE.RepeatWrapping;
		shortMap.repeat.set(shortRepeat[0], shortRepeat[1]);
		const shortNorm = textures.normalMap.clone();
		shortNorm.wrapS = THREE.RepeatWrapping;
		shortNorm.wrapT = THREE.RepeatWrapping;
		shortNorm.repeat.set(shortRepeat[0], shortRepeat[1]);
		const shortRough = textures.roughnessMap.clone();
		shortRough.wrapS = THREE.RepeatWrapping;
		shortRough.wrapT = THREE.RepeatWrapping;
		shortRough.repeat.set(shortRepeat[0], shortRepeat[1]);
		const shortMetal = textures.metalnessMap.clone();
		shortMetal.wrapS = THREE.RepeatWrapping;
		shortMetal.wrapT = THREE.RepeatWrapping;
		shortMetal.repeat.set(shortRepeat[0], shortRepeat[1]);

		const lm = new THREE.MeshStandardMaterial({
			...baseProps,
			map: uvMode ? undefined : longMap,
			normalMap: longNorm,
			roughnessMap: uvMode ? undefined : longRough,
			metalnessMap: uvMode ? undefined : longMetal,
		});

		const sm = new THREE.MeshStandardMaterial({
			...baseProps,
			map: uvMode ? undefined : shortMap,
			normalMap: shortNorm,
			roughnessMap: uvMode ? undefined : shortRough,
			metalnessMap: uvMode ? undefined : shortMetal,
		});

		return { longMat: lm, shortMat: sm };
	}, [textures, uvMode, longRepeat, shortRepeat]);

	useEffect(() => {
		return () => {
			longMat.dispose();
			shortMat.dispose();
		};
	}, [longMat, shortMat]);

	const halfH = wallHeight / 2;

	return (
		<group>
			{/* North wall (z=0) — short */}
			<mesh position={[width / 2, halfH, 0]} material={shortMat}>
				<boxGeometry args={[width, wallHeight, wallThickness]} />
			</mesh>
			{/* South wall (z=length) — short */}
			<mesh position={[width / 2, halfH, length]} material={shortMat}>
				<boxGeometry args={[width, wallHeight, wallThickness]} />
			</mesh>
			{/* West wall (x=0) — long */}
			<mesh position={[0, halfH, length / 2]} material={longMat}>
				<boxGeometry args={[wallThickness, wallHeight, length]} />
			</mesh>
			{/* East wall (x=width) — long */}
			<mesh position={[width, halfH, length / 2]} material={longMat}>
				<boxGeometry args={[wallThickness, wallHeight, length]} />
			</mesh>
		</group>
	);
}

type HallWallsOuterProps = {
	layerOpacity?: number;
};

export function HallWalls({ layerOpacity = 1 }: HallWallsOuterProps) {
	const { width, length, wallHeight, wallThickness } = useStore(
		(s) => s.hall,
	);
	const uvMode = useStore((s) => s.ui.uvMode);
	const gpuTier = useStore((s) => s.ui.gpuTier);
	const groupRef = useRef<THREE.Group>(null);

	useGroupOpacity(groupRef, layerOpacity);

	const props = { width, length, wallHeight, wallThickness, uvMode };

	if (!shouldLoadHallTextures(gpuTier)) {
		return (
			<group ref={groupRef}>
				<FlatHallWalls {...props} />
			</group>
		);
	}

	return (
		<group ref={groupRef}>
			<Suspense fallback={<FlatHallWalls {...props} />}>
				<TexturedHallWalls {...props} />
			</Suspense>
		</group>
	);
}
