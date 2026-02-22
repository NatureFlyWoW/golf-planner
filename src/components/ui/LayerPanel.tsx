import { LAYER_DEFINITIONS } from "../../constants/layers";
import { useStore } from "../../store";
import { LayerRow } from "./LayerRow";

export function LayerPanel() {
	const layers = useStore((s) => s.ui.layers);
	const toggleLayerVisible = useStore((s) => s.toggleLayerVisible);
	const setLayerOpacity = useStore((s) => s.setLayerOpacity);
	const toggleLayerLocked = useStore((s) => s.toggleLayerLocked);
	const resetLayers = useStore((s) => s.resetLayers);

	return (
		<div className="flex flex-col gap-1">
			<p className="mb-2 text-xs text-text-muted">
				Control layer visibility, opacity, and interaction locks.
			</p>

			{LAYER_DEFINITIONS.map((def) => {
				const state = layers[def.id];
				return (
					<LayerRow
						key={def.id}
						layerId={def.id}
						label={def.label}
						icon={def.icon}
						visible={state.visible}
						opacity={state.opacity}
						locked={state.locked}
						onToggleVisible={() => toggleLayerVisible(def.id)}
						onOpacityChange={(v) => setLayerOpacity(def.id, v)}
						onToggleLocked={() => toggleLayerLocked(def.id)}
					/>
				);
			})}

			<button
				type="button"
				onClick={resetLayers}
				className="mt-3 rounded bg-plasma px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-grid-ghost"
			>
				Reset All Layers
			</button>
		</div>
	);
}
