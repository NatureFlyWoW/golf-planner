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
}: {
	door: DoorSpec;
	hallWidth: number;
	hallLength: number;
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
	const color = door.type === "sectional" ? "#4CAF50" : "#81C784";

	return (
		<mesh position={position} rotation={rotation}>
			<planeGeometry args={[door.width, door.height]} />
			<meshStandardMaterial color={color} side={2} />
		</mesh>
	);
}

function Window({
	window: win,
	hallWidth,
	hallLength,
	sunExposure,
}: {
	window: WindowSpec;
	hallWidth: number;
	hallLength: number;
	sunExposure: number;
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
	const color = sunExposure > 0 ? "#FFD54F" : "#64B5F6";

	return (
		<mesh position={position} rotation={rotation}>
			<planeGeometry args={[win.width, win.height]} />
			<meshStandardMaterial
				color={color}
				opacity={sunExposure > 0 ? 0.8 : 1}
				transparent={sunExposure > 0}
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
	const exposure = sunData
		? getWallExposure(sunData.azimuth, sunData.altitudeDeg)
		: { north: 0, south: 0, east: 0, west: 0 };

	return (
		<group>
			{doors.map((door) => (
				<Door key={door.id} door={door} hallWidth={width} hallLength={length} />
			))}
			{windows.map((win) => (
				<Window
					key={win.id}
					window={win}
					hallWidth={width}
					hallLength={length}
					sunExposure={exposure[win.wall as keyof typeof exposure] ?? 0}
				/>
			))}
		</group>
	);
}
