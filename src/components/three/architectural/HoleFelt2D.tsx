import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useStore } from "../../../store";
import type { Hole } from "../../../types";
import { createFeltMaterial } from "./HoleFeltShader";

type HoleFelt2DProps = {
	hole: Hole;
	width: number;
	length: number;
	color: string;
};

type LodLevel = "overview" | "standard" | "detail";

const noRaycast = () => {};

/** Darken a hex color by a factor (0-1, where 0.3 = 30% darker). */
function darkenColor(hex: string, factor: number): string {
	const c = new THREE.Color(hex);
	c.multiplyScalar(1 - factor);
	return `#${c.getHexString()}`;
}

/** Mix two colors: result = a * (1-t) + b * t. */
function mixColors(a: string, b: string, t: number): string {
	const ca = new THREE.Color(a);
	const cb = new THREE.Color(b);
	ca.lerp(cb, t);
	return `#${ca.getHexString()}`;
}

/** Compute felt fill and border colors based on UV mode. */
function useFeltColors(baseColor: string, uvMode: boolean) {
	return useMemo(() => {
		if (uvMode) {
			const fill = mixColors(baseColor, "#1A1A3E", 0.7);
			const border = mixColors(baseColor, "#6600FF", 0.6);
			return { fill, border };
		}
		const fill = mixColors(baseColor, "#2E7D32", 0.3);
		const border = darkenColor(baseColor, 0.3);
		return { fill, border };
	}, [baseColor, uvMode]);
}

/** Zoom-based LOD with band tracking (re-renders only on threshold crossings). */
function useZoomLodFallback(): LodLevel {
	const [lod, setLod] = useState<LodLevel>("standard");
	const lastLodRef = useRef<LodLevel>(lod);

	useFrame(({ camera }) => {
		if (!("zoom" in camera)) return;
		const zoom = (camera as { zoom: number }).zoom;
		let next: LodLevel;
		if (zoom < 15) next = "overview";
		else if (zoom < 40) next = "standard";
		else next = "detail";
		if (next !== lastLodRef.current) {
			lastLodRef.current = next;
			setLod(next);
		}
	});

	return lod;
}

/**
 * Felt-textured overlay for a single placed hole in the 2D viewport.
 * LOD-based: solid fill at overview/standard zoom, felt shader at detail zoom.
 */
export function HoleFelt2D({ hole, width, length, color }: HoleFelt2DProps) {
	const uvMode = useStore((s) => s.ui.uvMode);
	const { fill, border } = useFeltColors(color, uvMode);

	const lod = useZoomLodFallback();

	const feltMaterial = useMemo(
		() => createFeltMaterial(fill),
		[fill],
	);

	const solidMaterial = useMemo(
		() => new THREE.MeshBasicMaterial({ color: fill }),
		[fill],
	);

	// Dispose materials when they are replaced (UV mode toggle, etc.)
	useEffect(() => {
		return () => {
			feltMaterial.dispose();
			solidMaterial.dispose();
		};
	}, [feltMaterial, solidMaterial]);

	const rotationRad = (hole.rotation * Math.PI) / 180;

	const outlinePoints = useMemo((): [number, number, number][] => {
		const hw = width / 2;
		const hl = length / 2;
		const y = 0.03;
		return [
			[-hw, y, -hl],
			[hw, y, -hl],
			[hw, y, hl],
			[-hw, y, hl],
			[-hw, y, -hl],
		];
	}, [width, length]);

	const showOutline = lod !== "overview";
	const material = lod === "detail" ? feltMaterial : solidMaterial;

	return (
		<group
			position={[hole.position.x, 0, hole.position.z]}
			rotation={[0, rotationRad, 0]}
		>
			<mesh
				raycast={noRaycast}
				position={[0, 0.03, 0]}
				rotation={[-Math.PI / 2, 0, 0]}
			>
				<planeGeometry args={[width, length]} />
				<primitive object={material} attach="material" />
			</mesh>
			{showOutline && (
				<Line
					points={outlinePoints}
					lineWidth={2}
					worldUnits={false}
					color={border}
				/>
			)}
		</group>
	);
}
