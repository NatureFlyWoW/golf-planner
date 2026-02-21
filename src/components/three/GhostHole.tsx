import { useMemo } from "react";
import * as THREE from "three";
import { HOLE_TYPE_MAP } from "../../constants";
import { useStore } from "../../store";
import type { HoleType } from "../../types";
import { computeTemplateBounds } from "../../utils/chainCompute";

const HOLE_HEIGHT = 0.3;
const GREEN = new THREE.Color("#4CAF50");
const RED = new THREE.Color("#EF5350");
const UV_GREEN = new THREE.Color("#00FF66");
const UV_RED = new THREE.Color("#FF3333");

type GhostHoleProps = {
	type: HoleType;
	position: { x: number; z: number };
	rotation: number;
	isValid: boolean;
	templateId?: string;
};

export function GhostHole({
	type,
	position,
	rotation,
	isValid,
	templateId,
}: GhostHoleProps) {
	const uvMode = useStore((s) => s.ui.uvMode);
	const holeTemplates = useStore((s) => s.holeTemplates);

	const color = isValid ? (uvMode ? UV_GREEN : GREEN) : uvMode ? UV_RED : RED;
	const rotationRad = (rotation * Math.PI) / 180;

	const dimensions = useMemo(() => {
		if (templateId && holeTemplates[templateId]) {
			return computeTemplateBounds(holeTemplates[templateId]);
		}
		const definition = HOLE_TYPE_MAP[type];
		if (definition) return definition.dimensions;
		return null;
	}, [templateId, holeTemplates, type]);

	const material = useMemo(
		() =>
			new THREE.MeshStandardMaterial({
				color,
				transparent: true,
				opacity: 0.4,
				depthWrite: false,
			}),
		[color],
	);

	if (!dimensions) return null;

	const { width, length } = dimensions;

	return (
		<group
			position={[position.x, HOLE_HEIGHT / 2, position.z]}
			rotation={[0, rotationRad, 0]}
		>
			<mesh material={material}>
				<boxGeometry args={[width, HOLE_HEIGHT, length]} />
			</mesh>
		</group>
	);
}
