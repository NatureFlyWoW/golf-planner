export type Wall = "north" | "south" | "east" | "west";

export type DoorSpec = {
	id: string;
	type: "sectional" | "pvc";
	width: number;
	height: number;
	wall: Wall;
	offset: number;
};

export type WindowSpec = {
	id: string;
	width: number;
	height: number;
	wall: Wall;
	offset: number;
	sillHeight: number;
};

export type Hall = {
	width: number;
	length: number;
	wallHeight: number;
	firstHeight: number;
	roofPitch: number;
	wallThickness: number;
	frameSpacing: number[];
	doors: DoorSpec[];
	windows: WindowSpec[];
};
