import type CameraControlsImpl from "camera-controls";
import type { RefObject } from "react";
import { useStore } from "../../store";
import { getCameraPresets } from "../../utils/cameraPresets";

type CameraPresetsProps = {
	cameraControlsRef: RefObject<CameraControlsImpl | null>;
};

const PRESET_BUTTONS = [
	{ key: "top", label: "Top", shortcut: "1" },
	{ key: "front", label: "Front", shortcut: "2" },
	{ key: "back", label: "Back", shortcut: "3" },
	{ key: "left", label: "Left", shortcut: "4" },
	{ key: "right", label: "Right", shortcut: "5" },
	{ key: "isometric", label: "Iso", shortcut: "6" },
] as const;

export function CameraPresets({ cameraControlsRef }: CameraPresetsProps) {
	const hall = useStore((s) => s.hall);

	function handlePresetClick(presetKey: (typeof PRESET_BUTTONS)[number]["key"]) {
		const ctrl = cameraControlsRef.current;
		if (!ctrl) return;

		const presets = getCameraPresets(hall.width, hall.length);
		const preset = presets[presetKey];
		ctrl.setLookAt(
			preset.position[0],
			preset.position[1],
			preset.position[2],
			preset.target[0],
			preset.target[1],
			preset.target[2],
			true,
		);
	}

	return (
		<div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
			{PRESET_BUTTONS.map((btn) => (
				<button
					key={btn.key}
					type="button"
					onClick={() => handlePresetClick(btn.key)}
					className="flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-xs text-white/80 hover:bg-black/80 hover:text-white transition-colors"
					title={`${btn.label} view (${btn.shortcut})`}
				>
					<span className="w-3 text-white/50">{btn.shortcut}</span>
					<span>{btn.label}</span>
				</button>
			))}
		</div>
	);
}
