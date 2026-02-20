import { getWallExposure, type SunData } from "../../hooks/useSunPosition";
import { useStore } from "../../store";
import type { DoorSpec, WindowSpec } from "../../types";

function getWallPosition(
	wall: string,
	offset: number,
	centerY: number,
	hallWidth: number,
	hallLength: number,
	itemWidth: number,
): [number, number, number] {
	const wallOffset = 0.02;
	switch (wall) {
		case "north":
			return [offset + itemWidth / 2, centerY, -wallOffset];
		case "south":
			return [offset + itemWidth / 2, centerY, hallLength + wallOffset];
		case "west":
			return [-wallOffset, centerY, offset + itemWidth / 2];
		case "east":
			return [hallWidth + wallOffset, centerY, offset + itemWidth / 2];
		default:
			return [0, 0, 0];
	}
}

function getWallRotation(wall: string): [number, number, number] {
	switch (wall) {
		case "north":
		case "south":
			return [0, 0, 0];
		case "west":
		case "east":
			return [0, Math.PI / 2, 0];
		default:
			return [0, 0, 0];
	}
}

function Door({
	door,
	hallWidth,
	hallLength,
	uvMode,
}: {
	door: DoorSpec;
	hallWidth: number;
	hallLength: number;
	uvMode: boolean;
}) {
	const centerY = door.height / 2;
	const position = getWallPosition(
		door.wall,
		door.offset,
		centerY,
		hallWidth,
		hallLength,
		door.width,
	);
	const rotation = getWallRotation(door.wall);
	const color = uvMode
		? "#001A00"
		: door.type === "sectional"
			? "#4CAF50"
			: "#81C784";

	return (
		<mesh position={position} rotation={rotation}>
			<planeGeometry args={[door.width, door.height]} />
			<meshStandardMaterial
				color={color}
				side={2}
				emissive={uvMode ? "#00FF44" : "#000000"}
				emissiveIntensity={uvMode ? 0.3 : 0}
			/>
		</mesh>
	);
}

function Window({
	window: win,
	hallWidth,
	hallLength,
	sunExposure,
	uvMode,
}: {
	window: WindowSpec;
	hallWidth: number;
	hallLength: number;
	sunExposure: number;
	uvMode: boolean;
}) {
	const centerY = win.sillHeight + win.height / 2;
	const position = getWallPosition(
		win.wall,
		win.offset,
		centerY,
		hallWidth,
		hallLength,
		win.width,
	);
	const rotation = getWallRotation(win.wall);

	// Interpolate between default blue and warm yellow based on sun exposure
	const color = uvMode ? "#3300AA" : sunExposure > 0 ? "#FFD54F" : "#64B5F6";

	return (
		<mesh position={position} rotation={rotation}>
			<planeGeometry args={[win.width, win.height]} />
			<meshStandardMaterial
				color={color}
				opacity={uvMode ? 0.6 : sunExposure > 0 ? 0.8 : 1}
				transparent={uvMode || sunExposure > 0}
				side={2}
			/>
		</mesh>
	);
}

type HallOpeningsProps = {
	sunData?: SunData;
};

export function HallOpenings({ sunData }: HallOpeningsProps) {
	const { doors, windows, width, length } = useStore((s) => s.hall);
	const uvMode = useStore((s) => s.ui.uvMode);
	const exposure = sunData
		? getWallExposure(sunData.azimuth, sunData.altitudeDeg)
		: { north: 0, south: 0, east: 0, west: 0 };

	return (
		<group>
			{doors.map((door) => (
				<Door
					key={door.id}
					door={door}
					hallWidth={width}
					hallLength={length}
					uvMode={uvMode}
				/>
			))}
			{windows.map((win) => (
				<Window
					key={win.id}
					window={win}
					hallWidth={width}
					hallLength={length}
					sunExposure={exposure[win.wall as keyof typeof exposure] ?? 0}
					uvMode={uvMode}
				/>
			))}
		</group>
	);
}
