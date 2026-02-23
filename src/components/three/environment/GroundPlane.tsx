import { useTexture } from "@react-three/drei";
import { Suspense, useEffect } from "react";
import * as THREE from "three";
import { HALL } from "../../../constants/hall";
import { useViewportId } from "../../../hooks/useViewportId";
import { useStore } from "../../../store";
import { shouldShowGroundTexture } from "../../../utils/environmentGating";

const GROUND_EXTENSION = 30;
const TILE_SIZE = 2;
const FLAT_COLOR = "#4a4a4a";

/** Returns total ground plane dimensions given hall size + 30m extension. */
export function getGroundPlaneDimensions(
	hallWidth: number,
	hallLength: number,
): { width: number; length: number } {
	return {
		width: hallWidth + GROUND_EXTENSION,
		length: hallLength + GROUND_EXTENSION,
	};
}

/** Returns world-space center position for the ground plane (Y=-0.01). */
export function getGroundPlanePosition(
	hallWidth: number = HALL.width,
	hallLength: number = HALL.length,
): { x: number; y: number; z: number } {
	return {
		x: hallWidth / 2,
		y: -0.01,
		z: hallLength / 2,
	};
}

/** Returns UV repeat counts for a given tile size (default 2m). */
export function getGroundTextureRepeat(
	totalWidth: number,
	totalLength: number,
	tileSize: number = TILE_SIZE,
): { repeatX: number; repeatZ: number } {
	return {
		repeatX: totalWidth / tileSize,
		repeatZ: totalLength / tileSize,
	};
}

function FlatGround({
	width,
	length,
	position,
}: {
	width: number;
	length: number;
	position: [number, number, number];
}) {
	return (
		<mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
			<planeGeometry args={[width, length]} />
			<meshBasicMaterial color={FLAT_COLOR} />
		</mesh>
	);
}

function TexturedGround({
	width,
	length,
	position,
	gpuTier,
	repeatX,
	repeatZ,
}: {
	width: number;
	length: number;
	position: [number, number, number];
	gpuTier: "mid" | "high";
	repeatX: number;
	repeatZ: number;
}) {
	const texturePaths =
		gpuTier === "high"
			? {
					map: "/textures/asphalt/color.jpg",
					normalMap: "/textures/asphalt/normal.jpg",
					roughnessMap: "/textures/asphalt/roughness.jpg",
				}
			: {
					map: "/textures/asphalt/color.jpg",
				};

	const textures = useTexture(texturePaths);

	useEffect(() => {
		for (const tex of Object.values(textures)) {
			if (tex instanceof THREE.Texture) {
				tex.wrapS = THREE.RepeatWrapping;
				tex.wrapT = THREE.RepeatWrapping;
				tex.repeat.set(repeatX, repeatZ);
				tex.needsUpdate = true;
			}
		}
	}, [textures, repeatX, repeatZ]);

	return (
		<mesh
			position={position}
			rotation={[-Math.PI / 2, 0, 0]}
			receiveShadow
		>
			<planeGeometry args={[width, length]} />
			<meshStandardMaterial
				{...textures}
				roughness={0.9}
				metalness={0}
			/>
		</mesh>
	);
}

export function GroundPlane(): JSX.Element | null {
	const viewportId = useViewportId();
	const envLayerVisible = useStore((s) => s.ui.layers.environment.visible);
	const gpuTier = useStore((s) => s.ui.gpuTier);

	// 3D only — skip in 2D pane
	if (viewportId === "2d") return null;

	// Layer visibility gating
	if (!envLayerVisible) return null;

	const { width, length } = getGroundPlaneDimensions(HALL.width, HALL.length);
	const pos = getGroundPlanePosition(HALL.width, HALL.length);
	const position: [number, number, number] = [pos.x, pos.y, pos.z];
	const showTexture = shouldShowGroundTexture(gpuTier);

	if (!showTexture) {
		return <FlatGround width={width} length={length} position={position} />;
	}

	const { repeatX, repeatZ } = getGroundTextureRepeat(width, length);

	return (
		<Suspense
			fallback={
				<FlatGround width={width} length={length} position={position} />
			}
		>
			<TexturedGround
				width={width}
				length={length}
				position={position}
				gpuTier={gpuTier as "mid" | "high"}
				repeatX={repeatX}
				repeatZ={repeatZ}
			/>
		</Suspense>
	);
}
