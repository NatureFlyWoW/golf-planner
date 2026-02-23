import { useRef } from "react";
import type { Group } from "three";
import { HOLE_TYPE_MAP } from "../../../constants";
import { useGroupOpacity } from "../../../hooks/useGroupOpacity";
import { useStore } from "../../../store";
import { computeTemplateBounds } from "../../../utils/chainCompute";
import { HoleFelt2D } from "./HoleFelt2D";

/**
 * Iterates over placed holes and renders felt-textured 2D overlays.
 * Respects the holes layer visibility and opacity.
 */
export function HoleFeltOverlays() {
	const groupRef = useRef<Group>(null);
	const holes = useStore((s) => s.holes);
	const holeOrder = useStore((s) => s.holeOrder);
	const holeTemplates = useStore((s) => s.holeTemplates);
	const holesLayer = useStore((s) => s.ui.layers.holes);

	useGroupOpacity(groupRef, holesLayer.opacity);

	if (!holesLayer.visible) return null;

	return (
		<group ref={groupRef} name="hole-felt-overlays">
			{holeOrder.map((id) => {
				const hole = holes[id];
				if (!hole) return null;

				let width: number;
				let length: number;
				let color: string;

				if (hole.templateId && holeTemplates[hole.templateId]) {
					const template = holeTemplates[hole.templateId];
					const bounds = computeTemplateBounds(template);
					width = bounds.width;
					length = bounds.length;
					color = template.color;
				} else {
					const def = HOLE_TYPE_MAP[hole.type];
					if (!def) return null;
					width = def.dimensions.width;
					length = def.dimensions.length;
					color = def.color;
				}

				return (
					<HoleFelt2D
						key={id}
						hole={hole}
						width={width}
						length={length}
						color={color}
					/>
				);
			})}
		</group>
	);
}
