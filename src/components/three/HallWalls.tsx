import { MeshStandardMaterial } from "three";
import { useStore } from "../../store";

// Module-level singletons — created once, never mutated
export const planningWallMaterial = new MeshStandardMaterial({
	color: "#B0B0B0",
});

export const uvWallMaterial = new MeshStandardMaterial({
	color: "#1A1A2E",
});

/** Pure selector for testability. */
export function getWallMaterial(
	uvMode: boolean,
): MeshStandardMaterial {
	return uvMode ? uvWallMaterial : planningWallMaterial;
}

export function HallWalls() {
	const { width, length, wallHeight, wallThickness } = useStore((s) => s.hall);
	const halfH = wallHeight / 2;
	const uvMode = useStore((s) => s.ui.uvMode);
	const material = getWallMaterial(uvMode);

	return (
		<group>
			{/* North wall (z=0) */}
			<mesh position={[width / 2, halfH, 0]} material={material}>
				<boxGeometry args={[width, wallHeight, wallThickness]} />
			</mesh>
			{/* South wall (z=length) */}
			<mesh position={[width / 2, halfH, length]} material={material}>
				<boxGeometry args={[width, wallHeight, wallThickness]} />
			</mesh>
			{/* West wall (x=0) */}
			<mesh position={[0, halfH, length / 2]} material={material}>
				<boxGeometry args={[wallThickness, wallHeight, length]} />
			</mesh>
			{/* East wall (x=width) */}
			<mesh position={[width, halfH, length / 2]} material={material}>
				<boxGeometry args={[wallThickness, wallHeight, length]} />
			</mesh>
		</group>
	);
}
