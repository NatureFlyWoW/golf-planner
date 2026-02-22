import { Line, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh, OrthographicCamera } from "three";
import { useViewportInfo } from "../../../contexts/ViewportContext";
import { useStore } from "../../../store";

const WALL_W = 3;
const WALL_D = 0.2;
const Y = 0.02;
const ARC_SEGMENTS = 24;
const ARC_RADIUS = 2;

const COLORS = {
	planning: {
		wallFill: "#3a3a3a",
		wallOutline: "#222222",
		arc: "#555555",
		text: "#333333",
	},
	uv: {
		wallFill: "#1A1A2E",
		wallOutline: "#2A2A5E",
		arc: "#3A3A6E",
		text: "#9999CC",
	},
} as const;

function buildArcPoints(
	cx: number,
	cz: number,
): [number, number, number][] {
	const pts: [number, number, number][] = [];
	for (let i = 0; i <= ARC_SEGMENTS; i++) {
		const angle = (Math.PI / 2) * (i / ARC_SEGMENTS);
		pts.push([cx + ARC_RADIUS * Math.cos(angle), Y, cz + ARC_RADIUS * Math.sin(angle)]);
	}
	return pts;
}

function buildRectOutline(
	cx: number,
	cz: number,
	w: number,
	d: number,
): [number, number, number][] {
	const hw = w / 2;
	const hd = d / 2;
	return [
		[cx - hw, Y, cz - hd],
		[cx + hw, Y, cz - hd],
		[cx + hw, Y, cz + hd],
		[cx - hw, Y, cz + hd],
		[cx - hw, Y, cz - hd],
	];
}

const noopRaycast = () => {};

export function RenderingSpike() {
	const viewport = useViewportInfo();
	const uvMode = useStore((s) => s.ui.uvMode);
	const textRef = useRef<Mesh>(null);

	useFrame(({ camera }) => {
		if (textRef.current && "zoom" in camera) {
			const zoom = (camera as OrthographicCamera).zoom;
			textRef.current.scale.setScalar(1 / zoom);
		}
	});

	if (viewport?.id !== "2d") return null;

	const c = uvMode ? COLORS.uv : COLORS.planning;
	const cx = 5; // hall center X (10m / 2)
	const cz = 10; // hall center Z (20m / 2)

	const rectOutline = buildRectOutline(cx, cz - 2, WALL_W, WALL_D);
	const arcPoints = buildArcPoints(cx - 1, cz + 1);

	return (
		<group>
			{/* Wall rectangle: solid fill + outline */}
			<mesh
				raycast={noopRaycast}
				position={[cx, Y, cz - 2]}
				rotation={[-Math.PI / 2, 0, 0]}
			>
				<planeGeometry args={[WALL_W, WALL_D]} />
				<meshBasicMaterial color={c.wallFill} />
			</mesh>
			<Line
				points={rectOutline}
				color={c.wallOutline}
				lineWidth={2}
				worldUnits={false}
			/>

			{/* Door swing arc */}
			<Line
				points={arcPoints}
				color={c.arc}
				lineWidth={1.5}
				worldUnits={false}
			/>

			{/* Text label with inverse-zoom scaling */}
			<Text
				ref={textRef}
				position={[cx, Y, cz + 4]}
				rotation={[-Math.PI / 2, 0, 0]}
				fontSize={12}
				color={c.text}
				anchorX="center"
				anchorY="middle"
			>
				Sample Label
			</Text>
		</group>
	);
}
