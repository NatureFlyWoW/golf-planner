import { MapControls } from "@react-three/drei";
import { useMemo } from "react";
import { SEGMENT_SPECS } from "../../constants/segmentSpecs";
import { useStore } from "../../store";
import type { Segment, SegmentSpecId } from "../../types/template";
import { createSegmentGeometries } from "../../utils/segmentGeometry";
import {
	bumperMaterial,
	CUP_RADIUS,
	cupMaterial,
	feltMaterial,
	SURFACE_THICKNESS,
	TEE_RADIUS,
	teeMaterial,
} from "../three/holes/shared";

// ── SegmentMesh ───────────────────────────────────────────────────────────────

type SegmentMeshProps = {
	specId: SegmentSpecId;
	feltWidth: number;
	position: { x: number; z: number };
	rotation: number;
	isFirst: boolean;
	isLast: boolean;
	isSelected: boolean;
	onClick: () => void;
};

function SegmentMesh({
	specId,
	feltWidth,
	position,
	rotation,
	isFirst,
	isLast,
	isSelected,
	onClick,
}: SegmentMeshProps) {
	const geometries = useMemo(
		() => createSegmentGeometries(specId, feltWidth),
		[specId, feltWidth],
	);

	// Cup exit position in local segment space (entry is at origin).
	const spec = SEGMENT_SPECS[specId];
	const cupLocalX = spec.exitPoint.x;
	const cupLocalZ = spec.exitPoint.z;

	const DEG2RAD = Math.PI / 180;

	// R3F Y-axis rotation: our convention uses CCW rotations (rotation=R means the
	// segment rotated R degrees CCW viewed from above). In R3F's right-handed
	// coordinate system, positive Y rotation goes +Z → -X (CW from above), so
	// we negate to convert our CCW convention to R3F's Y-rotation direction.
	const yRot = -rotation * DEG2RAD;

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: R3F 3D scene group — not a DOM element, pointer events are part of the 3D interaction model
		<group
			position={[position.x, 0, position.z]}
			rotation={[0, yRot, 0]}
			onClick={(e) => {
				e.stopPropagation();
				onClick();
			}}
		>
			<mesh geometry={geometries.felt} material={feltMaterial} />
			<mesh geometry={geometries.bumperLeft} material={bumperMaterial} />
			<mesh geometry={geometries.bumperRight} material={bumperMaterial} />

			{/* Tee marker at entry (segment origin = entry point for first segment) */}
			{isFirst && (
				<mesh
					position={[0, SURFACE_THICKNESS + 0.01, 0]}
					material={teeMaterial}
				>
					<cylinderGeometry args={[TEE_RADIUS, TEE_RADIUS, 0.01, 16]} />
				</mesh>
			)}

			{/* Cup marker at exit point in local segment space */}
			{isLast && (
				<mesh
					position={[cupLocalX, SURFACE_THICKNESS + 0.01, cupLocalZ]}
					material={cupMaterial}
				>
					<cylinderGeometry args={[CUP_RADIUS, CUP_RADIUS, 0.01, 16]} />
				</mesh>
			)}

			{/* Selection outline: slightly enlarged semi-transparent orange box */}
			{isSelected && (
				<mesh position={[0, SURFACE_THICKNESS / 2, 0]}>
					<boxGeometry
						args={[feltWidth + 0.06, SURFACE_THICKNESS + 0.02, 0.1]}
					/>
					<meshBasicMaterial
						color="orange"
						transparent
						opacity={0.35}
						depthWrite={false}
					/>
				</mesh>
			)}
		</group>
	);
}

// ── BuilderCanvas (exported) ──────────────────────────────────────────────────

/**
 * R3F scene content for the hole builder. Renders all segments from the current
 * builderDraft, a grid floor for orientation, and basic lighting. Interactions
 * (click-to-select, ghost preview) are wired in Task 7.
 */
export function BuilderCanvas() {
	const draft = useStore((s) => s.builderDraft);
	const segments: Segment[] = draft?.segments ?? [];
	const feltWidth = draft?.feltWidth ?? 0.6;

	return (
		<>
			<ambientLight intensity={0.6} />
			<directionalLight position={[5, 10, 5]} intensity={0.8} />

			{/* Reference grid: 20m span, 0.5m cells (40 divisions) */}
			<gridHelper args={[20, 40, "#cccccc", "#eeeeee"]} />

			{segments.map((seg, i) => (
				<SegmentMesh
					key={seg.id}
					specId={seg.specId}
					feltWidth={feltWidth}
					position={seg.position}
					rotation={seg.rotation}
					isFirst={i === 0}
					isLast={i === segments.length - 1}
					isSelected={false}
					onClick={() => {
						// Selection wiring in Task 7
					}}
				/>
			))}

			<MapControls
				enableRotate={false}
				enableDamping={false}
				minZoom={20}
				maxZoom={200}
			/>
		</>
	);
}
