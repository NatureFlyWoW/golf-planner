import { useStore } from "../../../store";
import { DoorSymbol2D } from "./DoorSymbol2D";
import { WindowSymbol2D } from "./WindowSymbol2D";

export function ArchitecturalOpenings2D() {
	const { doors, windows, width, length } = useStore((s) => s.hall);
	const uvMode = useStore((s) => s.ui.uvMode);
	const wallsVisible = useStore((s) => s.ui.layers.walls?.visible ?? true);

	if (!wallsVisible) return null;

	return (
		<group name="architectural-openings-2d">
			{doors.map((door) => (
				<DoorSymbol2D
					key={door.id}
					door={door}
					hallWidth={width}
					hallLength={length}
					uvMode={uvMode}
				/>
			))}
			{windows.map((win) => (
				<WindowSymbol2D
					key={win.id}
					window={win}
					hallWidth={width}
					hallLength={length}
					uvMode={uvMode}
				/>
			))}
		</group>
	);
}
