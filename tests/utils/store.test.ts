import { beforeEach, describe, expect, it } from "vitest";
import { useStore } from "../../src/store";

describe("store", () => {
	beforeEach(() => {
		useStore.setState({
			holes: {},
			holeOrder: [],
			selectedId: null,
			ui: {
				tool: "select",
				placingType: null,
				view: "top",
				sidebarTab: "holes",
				snapEnabled: false,
				showFlowPath: true,
				activePanel: null,
			},
		});
	});

	describe("addHole", () => {
		it("adds a hole to the store and appends to holeOrder", () => {
			useStore.getState().addHole("straight", { x: 5, z: 10 });

			const state = useStore.getState();
			const holeIds = Object.keys(state.holes);
			expect(holeIds).toHaveLength(1);
			expect(state.holeOrder).toHaveLength(1);
			expect(state.holeOrder[0]).toBe(holeIds[0]);

			const hole = state.holes[holeIds[0]];
			expect(hole.type).toBe("straight");
			expect(hole.position).toEqual({ x: 5, z: 10 });
			expect(hole.rotation).toBe(0);
			expect(hole.par).toBe(2);
			expect(hole.name).toBe("Hole 1");
		});

		it("auto-increments hole names", () => {
			const store = useStore.getState();
			store.addHole("straight", { x: 1, z: 1 });
			store.addHole("ramp", { x: 3, z: 3 });

			const state = useStore.getState();
			const holes = state.holeOrder.map((id) => state.holes[id]);
			expect(holes[0].name).toBe("Hole 1");
			expect(holes[1].name).toBe("Hole 2");
		});
	});

	describe("removeHole", () => {
		it("removes a hole and its order entry", () => {
			useStore.getState().addHole("straight", { x: 5, z: 10 });
			const id = useStore.getState().holeOrder[0];

			useStore.getState().removeHole(id);

			const state = useStore.getState();
			expect(Object.keys(state.holes)).toHaveLength(0);
			expect(state.holeOrder).toHaveLength(0);
		});

		it("clears selectedId if the removed hole was selected", () => {
			useStore.getState().addHole("straight", { x: 5, z: 10 });
			const id = useStore.getState().holeOrder[0];
			useStore.getState().selectHole(id);
			expect(useStore.getState().selectedId).toBe(id);

			useStore.getState().removeHole(id);
			expect(useStore.getState().selectedId).toBeNull();
		});
	});

	describe("updateHole", () => {
		it("updates hole properties", () => {
			useStore.getState().addHole("straight", { x: 5, z: 10 });
			const id = useStore.getState().holeOrder[0];

			useStore.getState().updateHole(id, {
				name: "The Volcano",
				rotation: 90,
				par: 4,
			});

			const hole = useStore.getState().holes[id];
			expect(hole.name).toBe("The Volcano");
			expect(hole.rotation).toBe(90);
			expect(hole.par).toBe(4);
			expect(hole.position).toEqual({ x: 5, z: 10 });
		});
	});

	describe("selectHole", () => {
		it("selects a hole and switches to detail tab", () => {
			useStore.getState().addHole("straight", { x: 5, z: 10 });
			const id = useStore.getState().holeOrder[0];

			useStore.getState().selectHole(id);

			expect(useStore.getState().selectedId).toBe(id);
			expect(useStore.getState().ui.sidebarTab).toBe("detail");
		});

		it("deselects when null is passed", () => {
			useStore.getState().addHole("straight", { x: 5, z: 10 });
			const id = useStore.getState().holeOrder[0];
			useStore.getState().selectHole(id);
			useStore.getState().selectHole(null);

			expect(useStore.getState().selectedId).toBeNull();
		});
	});

	describe("setTool", () => {
		it("sets the active tool", () => {
			useStore.getState().setTool("place");
			expect(useStore.getState().ui.tool).toBe("place");
		});
	});

	describe("reorderHoles", () => {
		it("moves a hole in the order", () => {
			const store = useStore.getState();
			store.addHole("straight", { x: 1, z: 1 });
			store.addHole("ramp", { x: 3, z: 3 });
			store.addHole("dogleg", { x: 5, z: 5 });

			const order = useStore.getState().holeOrder;
			const [a, b, c] = order;

			useStore.getState().reorderHoles(2, 0);

			expect(useStore.getState().holeOrder).toEqual([c, a, b]);
		});
	});
});
