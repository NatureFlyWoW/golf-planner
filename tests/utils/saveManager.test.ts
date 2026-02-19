// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	deleteSave,
	getSaves,
	loadSave,
	renameSave,
	saveLayout,
} from "../../src/utils/saveManager";

describe("saveManager", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("saves a layout and retrieves it", () => {
		const holes = {
			h1: {
				id: "h1",
				type: "straight" as const,
				position: { x: 5, z: 10 },
				rotation: 0,
				name: "Hole 1",
				par: 2,
			},
		};
		saveLayout("Test Layout", holes, ["h1"]);
		const saves = getSaves();
		const keys = Object.keys(saves);
		expect(keys).toHaveLength(1);
		expect(saves[keys[0]].name).toBe("Test Layout");
		expect(saves[keys[0]].holes).toEqual(holes);
		expect(saves[keys[0]].holeOrder).toEqual(["h1"]);
		expect(saves[keys[0]].savedAt).toBeDefined();
	});

	it("loads a saved layout", () => {
		saveLayout("My Save", {}, []);
		const saves = getSaves();
		const id = Object.keys(saves)[0];
		const loaded = loadSave(id);
		expect(loaded).not.toBeNull();
		expect(loaded?.holeOrder).toEqual([]);
	});

	it("returns null when loading non-existent save", () => {
		expect(loadSave("nonexistent")).toBeNull();
	});

	it("renames a save", () => {
		saveLayout("Old Name", {}, []);
		const id = Object.keys(getSaves())[0];
		renameSave(id, "New Name");
		expect(getSaves()[id].name).toBe("New Name");
	});

	it("deletes a save", () => {
		saveLayout("To Delete", {}, []);
		const id = Object.keys(getSaves())[0];
		deleteSave(id);
		expect(Object.keys(getSaves())).toHaveLength(0);
	});

	it("enforces max 10 saves", () => {
		for (let i = 0; i < 10; i++) {
			saveLayout(`Save ${i}`, {}, []);
		}
		expect(Object.keys(getSaves())).toHaveLength(10);
		expect(() => saveLayout("Save 11", {}, [])).toThrow(
			"Maximum 10 saves reached",
		);
	});

	it("returns empty object when no saves exist", () => {
		expect(getSaves()).toEqual({});
	});
});
