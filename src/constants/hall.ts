import type { Hall } from "../types";

/**
 * BORGA hall specifications from offer #015-659208.
 * Canonical source of truth — CLAUDE.md references this file.
 *
 * Door/window wall assignments and offsets are planning decisions,
 * not from the BORGA offer (which doesn't specify placement).
 */
export const HALL: Hall = {
	width: 10.0,
	length: 20.0,
	wallHeight: 4.3,
	firstHeight: 4.9,
	roofPitch: 7,
	wallThickness: 0.1,
	frameSpacing: [4.8, 5.0, 5.0, 4.8],
	doors: [
		{
			id: "door-sectional",
			type: "sectional",
			width: 3.5,
			height: 3.5,
			wall: "south",
			offset: 3.25,
		},
		{
			id: "door-pvc",
			type: "pvc",
			width: 0.9,
			height: 2.0,
			wall: "south",
			offset: 8.1,
		},
	],
	windows: [
		{
			id: "window-1",
			width: 3.0,
			height: 1.1,
			wall: "east",
			offset: 2.0,
			sillHeight: 1.5,
		},
		{
			id: "window-2",
			width: 3.0,
			height: 1.1,
			wall: "east",
			offset: 10.0,
			sillHeight: 1.5,
		},
		{
			id: "window-3",
			width: 3.0,
			height: 1.1,
			wall: "west",
			offset: 2.0,
			sillHeight: 1.5,
		},
		{
			id: "window-4",
			width: 3.0,
			height: 1.1,
			wall: "west",
			offset: 10.0,
			sillHeight: 1.5,
		},
	],
};
