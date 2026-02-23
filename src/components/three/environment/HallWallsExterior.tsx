import { useTexture } from "@react-three/drei";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import type { GpuTier } from "../../../types/ui";
import { getWallUVRepeat } from "../HallWalls";

/** Returns true if exterior wall meshes should use textures. */
export function shouldLoadExteriorTextures(gpuTier: GpuTier): boolean {
	return gpuTier !== "low";
}

type WallsProps = {
	width: number;
	length: number;
	wallHeight: number;
	wallThickness: number;
};

const flatExteriorMaterial = new THREE.MeshBasicMaterial({
	color: "#A0A0A0",
	side: THREE.BackSide,
});

function FlatExteriorWalls({
	width,
	length,
	wallHeight,
	wallThickness,
}: WallsProps) {
	const halfH = wallHeight / 2;

	return (
		<group>
			<mesh position={[width / 2, halfH, 0]} material={flatExteriorMaterial}>
				<boxGeometry args={[width, wallHeight, wallThickness]} />
			</mesh>
			<mesh
				position={[width / 2, halfH, length]}
				material={flatExteriorMaterial}
			>
				<boxGeometry args={[width, wallHeight, wallThickness]} />
			</mesh>
			<mesh position={[0, halfH, length / 2]} material={flatExteriorMaterial}>
				<boxGeometry args={[wallThickness, wallHeight, length]} />
			</mesh>
			<mesh
				position={[width, halfH, length / 2]}
				material={flatExteriorMaterial}
			>
				<boxGeometry args={[wallThickness, wallHeight, length]} />
			</mesh>
		</group>
	);
}

function TexturedExteriorWalls({
	width,
	length,
	wallHeight,
	wallThickness,
}: WallsProps) {
	const textures = useTexture({
		map: "/textures/steel/color.jpg",
		normalMap: "/textures/steel/normal.jpg",
		roughnessMap: "/textures/steel/roughness.jpg",
		metalnessMap: "/textures/steel/metalness.jpg",
	});

	const longRepeat = getWallUVRepeat(length);
	const shortRepeat = getWallUVRepeat(width);

	const { longMat, shortMat, clonedTextures } = useMemo(() => {
		const baseProps = {
			color: "#A0A0A0",
			metalness: 0.5,
			roughness: 0.7,
			side: THREE.BackSide as THREE.Side,
		};

		const cloned: THREE.Texture[] = [];
		const cloneAndRepeat = (
			tex: THREE.Texture,
			repeat: [number, number],
		): THREE.Texture => {
			const c = tex.clone();
			c.wrapS = THREE.RepeatWrapping;
			c.wrapT = THREE.RepeatWrapping;
			c.repeat.set(repeat[0], repeat[1]);
			c.needsUpdate = true;
			cloned.push(c);
			return c;
		};

		const lm = new THREE.MeshStandardMaterial({
			...baseProps,
			map: cloneAndRepeat(textures.map, longRepeat),
			normalMap: cloneAndRepeat(textures.normalMap, longRepeat),
			roughnessMap: cloneAndRepeat(textures.roughnessMap, longRepeat),
			metalnessMap: cloneAndRepeat(textures.metalnessMap, longRepeat),
		});

		const sm = new THREE.MeshStandardMaterial({
			...baseProps,
			map: cloneAndRepeat(textures.map, shortRepeat),
			normalMap: cloneAndRepeat(textures.normalMap, shortRepeat),
			roughnessMap: cloneAndRepeat(textures.roughnessMap, shortRepeat),
			metalnessMap: cloneAndRepeat(textures.metalnessMap, shortRepeat),
		});

		return { longMat: lm, shortMat: sm, clonedTextures: cloned };
	}, [textures, longRepeat, shortRepeat]);

	useEffect(() => {
		return () => {
			longMat.dispose();
			shortMat.dispose();
			for (const tex of clonedTextures) {
				tex.dispose();
			}
		};
	}, [longMat, shortMat, clonedTextures]);

	const halfH = wallHeight / 2;

	return (
		<group>
			<mesh position={[width / 2, halfH, 0]} material={shortMat}>
				<boxGeometry args={[width, wallHeight, wallThickness]} />
			</mesh>
			<mesh position={[width / 2, halfH, length]} material={shortMat}>
				<boxGeometry args={[width, wallHeight, wallThickness]} />
			</mesh>
			<mesh position={[0, halfH, length / 2]} material={longMat}>
				<boxGeometry args={[wallThickness, wallHeight, length]} />
			</mesh>
			<mesh position={[width, halfH, length / 2]} material={longMat}>
				<boxGeometry args={[wallThickness, wallHeight, length]} />
			</mesh>
		</group>
	);
}

export function HallWallsExterior() {
	const { width, length, wallHeight, wallThickness } = useStore(
		(s) => s.hall,
	);
	const envLayerVisible = useStore(
		(s) => s.ui.layers.environment?.visible ?? true,
	);
	const gpuTier = useStore((s) => s.ui.gpuTier);

	if (!envLayerVisible) return null;

	const props = { width, length, wallHeight, wallThickness };

	if (!shouldLoadExteriorTextures(gpuTier)) {
		return <FlatExteriorWalls {...props} />;
	}

	return (
		<Suspense fallback={<FlatExteriorWalls {...props} />}>
			<TexturedExteriorWalls {...props} />
		</Suspense>
	);
}
