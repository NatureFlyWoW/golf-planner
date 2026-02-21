import { useMemo } from "react";
import { SEGMENT_SPECS } from "../../../constants/segmentSpecs";
import { useStore } from "../../../store";
import type { SegmentSpecId } from "../../../types/template";
import { computeChainPositions } from "../../../utils/chainCompute";
import { createSegmentGeometries } from "../../../utils/segmentGeometry";
import {
	CUP_RADIUS,
	SURFACE_THICKNESS,
	TEE_RADIUS,
	bumperMaterial,
	cupMaterial,
	feltMaterial,
	teeMaterial,
	uvBumperMaterial,
	uvCupMaterial,
	uvFeltMaterial,
	uvTeeMaterial,
} from "./shared";

type Props = { templateId: string };

type SegmentMeshProps = {
	specId: SegmentSpecId;
	feltWidth: number;
	position: { x: number; z: number };
	rotation: number;
	isFirst: boolean;
	isLast: boolean;
	uvMode: boolean;
};

function SegmentMesh({
	specId,
	feltWidth,
	position,
	rotation,
	isFirst,
	isLast,
	uvMode,
}: SegmentMeshProps) {
	const geometries = useMemo(
		() => createSegmentGeometries(specId, feltWidth),
		[specId, feltWidth],
	);
	const spec = SEGMENT_SPECS[specId];
	const DEG2RAD = Math.PI / 180;
	const yRot = -rotation * DEG2RAD;

	const felt = uvMode ? uvFeltMaterial : feltMaterial;
	const bumper = uvMode ? uvBumperMaterial : bumperMaterial;
	const tee = uvMode ? uvTeeMaterial : teeMaterial;
	const cup = uvMode ? uvCupMaterial : cupMaterial;

	return (
		<group position={[position.x, 0, position.z]} rotation={[0, yRot, 0]}>
			<mesh geometry={geometries.felt} material={felt} />
			<mesh geometry={geometries.bumperLeft} material={bumper} />
			<mesh geometry={geometries.bumperRight} material={bumper} />
			{isFirst && (
				<mesh position={[0, SURFACE_THICKNESS + 0.01, 0]} material={tee}>
					<cylinderGeometry args={[TEE_RADIUS, TEE_RADIUS, 0.01, 16]} />
				</mesh>
			)}
			{isLast && (
				<mesh
					position={[
						spec.exitPoint.x,
						SURFACE_THICKNESS + 0.01,
						spec.exitPoint.z,
					]}
					material={cup}
				>
					<cylinderGeometry args={[CUP_RADIUS, CUP_RADIUS, 0.01, 16]} />
				</mesh>
			)}
		</group>
	);
}

export function TemplateHoleModel({ templateId }: Props) {
	const template = useStore((s) => s.holeTemplates[templateId]);
	const uvMode = useStore((s) => s.ui.uvMode);

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
					uvMode={uvMode}
				/>
			))}
		</group>
	);
}
