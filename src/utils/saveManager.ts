import type { Hole } from "../types";

const STORAGE_KEY = "golf-planner-saves";
const MAX_SAVES = 10;

export type SaveSlot = {
	name: string;
	holes: Record<string, Hole>;
	holeOrder: string[];
	savedAt: string;
};

function readStorage(): Record<string, SaveSlot> {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		return JSON.parse(raw) as Record<string, SaveSlot>;
	} catch {
		return {};
	}
}

function writeStorage(saves: Record<string, SaveSlot>) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
}

export function getSaves(): Record<string, SaveSlot> {
	return readStorage();
}

export function saveLayout(
	name: string,
	holes: Record<string, Hole>,
	holeOrder: string[],
): string {
	const saves = readStorage();
	if (Object.keys(saves).length >= MAX_SAVES) {
		throw new Error("Maximum 10 saves reached");
	}
	const id = crypto.randomUUID();
	saves[id] = {
		name,
		holes,
		holeOrder,
		savedAt: new Date().toISOString(),
	};
	writeStorage(saves);
	return id;
}

export function loadSave(id: string): SaveSlot | null {
	const saves = readStorage();
	return saves[id] ?? null;
}

export function renameSave(id: string, name: string) {
	const saves = readStorage();
	if (!saves[id]) return;
	saves[id].name = name;
	writeStorage(saves);
}

export function deleteSave(id: string) {
	const saves = readStorage();
	delete saves[id];
	writeStorage(saves);
}
