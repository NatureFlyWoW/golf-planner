import { beforeEach, describe, expect, it } from "vitest";
import { useMouseStatusStore } from "../../src/stores/mouseStatusStore";

describe("mouseStatusStore", () => {
	beforeEach(() => {
		useMouseStatusStore.setState({
			mouseWorldPos: null,
			currentZoom: 40,
		});
	});

	it("initial state has null mouseWorldPos", () => {
		const state = useMouseStatusStore.getState();
		expect(state.mouseWorldPos).toBeNull();
	});

	it("setMouseWorldPos updates store correctly", () => {
		useMouseStatusStore.getState().setMouseWorldPos({ x: 5.23, z: 12.47 });
		const state = useMouseStatusStore.getState();
		expect(state.mouseWorldPos).toEqual({ x: 5.23, z: 12.47 });
	});

	it("setCurrentZoom updates store correctly", () => {
		useMouseStatusStore.getState().setCurrentZoom(42);
		expect(useMouseStatusStore.getState().currentZoom).toBe(42);
	});

	it("setMouseWorldPos(null) clears position", () => {
		useMouseStatusStore.getState().setMouseWorldPos({ x: 1, z: 2 });
		useMouseStatusStore.getState().setMouseWorldPos(null);
		expect(useMouseStatusStore.getState().mouseWorldPos).toBeNull();
	});
});
