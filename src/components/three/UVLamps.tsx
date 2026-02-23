import * as THREE from "three";
import {
	UV_LAMP_COLOR,
	UV_LAMP_HEIGHT,
	UV_LAMP_INTENSITY,
	UV_LAMP_POSITIONS,
	UV_LAMP_WIDTH,
} from "../../constants/uvLamps";
import type { ViewMode } from "../../types/ui";
import { useStore } from "../../store";

export function shouldShowFixtures(view: ViewMode): boolean {
	return view === "3d";
}

// Module-level singletons (avoids re-allocation per render)
const fixtureMaterial = new THREE.MeshStandardMaterial({
	color: UV_LAMP_COLOR,
	emissive: UV_LAMP_COLOR,
	emissiveIntensity: 2.0,
});

const LAMP_ROTATION: [number, number, number] = [-Math.PI / 2, 0, 0];
const FIXTURE_ARGS: [number, number, number] = [
	UV_LAMP_WIDTH,
	0.05,
	UV_LAMP_HEIGHT,
];

export function UVLamps() {
	const view = useStore((s) => s.ui.view);
	const fixturesVisible = shouldShowFixtures(view);

	return (
		<group>
			{UV_LAMP_POSITIONS.map((pos) => (
				<group key={`uv-lamp-${pos[0]}-${pos[2]}`} position={pos}>
					{/* RectAreaLight: actual illumination facing downward */}
					<rectAreaLight
						color={UV_LAMP_COLOR}
						intensity={UV_LAMP_INTENSITY}
						width={UV_LAMP_WIDTH}
						height={UV_LAMP_HEIGHT}
						rotation={LAMP_ROTATION}
					/>
					{/* Visible fixture mesh: thin emissive strip */}
					<mesh visible={fixturesVisible} material={fixtureMaterial}>
						<boxGeometry args={FIXTURE_ARGS} />
					</mesh>
				</group>
			))}
		</group>
	);
}
