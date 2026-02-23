import { useEffect, useMemo } from "react";
import { SEGMENT_SPECS } from "../../../constants/segmentSpecs";
import { useStore } from "../../../store";
import type { SegmentSpecId } from "../../../types/template";
import { computeChainPositions } from "../../../utils/chainCompute";
import { createSegmentGeometries } from "../../../utils/segmentGeometry";
import { Cup } from "./Cup";
import { TeePad } from "./TeePad";
import type { MaterialSet } from "../../../types/materials";
import { useMaterials } from "./useMaterials";

type Props = { templateId: string };

type SegmentMeshProps = {
	specId: SegmentSpecId;
	feltWidth: number;
	position: { x: number; z: number };
	rotation: number;
	isFirst: boolean;
	isLast: boolean;
	materials: MaterialSet;
};

function SegmentMesh({
	specId,
	feltWidth,
	position,
	rotation,
	isFirst,
	isLast,
	materials,
}: SegmentMeshProps) {
	const geometries = useMemo(
		() => createSegmentGeometries(specId, feltWidth),
		[specId, feltWidth],
	);

	useEffect(() => {
		return () => {
			geometries.felt.dispose();
			geometries.bumperLeft.dispose();
			geometries.bumperRight.dispose();
		};
	}, [geometries]);

	const spec = SEGMENT_SPECS[specId];
	const DEG2RAD = Math.PI / 180;
	const yRot = -rotation * DEG2RAD;

	return (
		<group position={[position.x, 0, position.z]} rotation={[0, yRot, 0]}>
			<mesh geometry={geometries.felt} material={materials.felt} />
			<mesh geometry={geometries.bumperLeft} material={materials.bumper} />
			<mesh geometry={geometries.bumperRight} material={materials.bumper} />
			{isFirst && <TeePad position={[0, 0, 0]} material={materials.tee} />}
			{isLast && (
				<Cup
					position={[spec.exitPoint.x, 0, spec.exitPoint.z]}
					material={materials.cup}
				/>
			)}
		</group>
	);
}

export function TemplateHoleModel({ templateId }: Props) {
	const template = useStore((s) => s.holeTemplates[templateId]);
	const materials = useMaterials();

	const segments = useMemo(() => {
		if (!template) return [];
		return computeChainPositions(template.segments);
	}, [template]);

	if (!template || segments.length === 0) return null;

	const feltWidth = template.feltWidth;

	return (
		<group>
			{segments.map((seg, i) => (
				<SegmentMesh
					key={seg.id}
					specId={seg.specId}
					feltWidth={feltWidth}
					position={seg.position}
					rotation={seg.rotation}
					isFirst={i === 0}
					isLast={i === segments.length - 1}
					materials={materials}
				/>
			))}
		</group>
	);
}
