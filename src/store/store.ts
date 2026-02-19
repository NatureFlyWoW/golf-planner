import { temporal } from "zundo";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { HALL } from "../constants/hall";
import { HOLE_TYPE_MAP } from "../constants/holeTypes";
import type { BudgetCategory, Hall, Hole, HoleType, UIState } from "../types";

type StoreState = {
	hall: Hall;
	holes: Record<string, Hole>;
	holeOrder: string[];
	selectedId: string | null;
	budget: Record<string, BudgetCategory>;
	ui: UIState;
};

type StoreActions = {
	addHole: (type: HoleType, position: { x: number; z: number }) => void;
	removeHole: (id: string) => void;
	updateHole: (id: string, updates: Partial<Hole>) => void;
	reorderHoles: (fromIndex: number, toIndex: number) => void;
	selectHole: (id: string | null) => void;
	setTool: (tool: UIState["tool"]) => void;
	setPlacingType: (type: HoleType | null) => void;
	setView: (view: UIState["view"]) => void;
	setSidebarTab: (tab: UIState["sidebarTab"]) => void;
	toggleSnap: () => void;
	toggleFlowPath: () => void;
	updateBudget: (id: string, updates: Partial<BudgetCategory>) => void;
};

export type Store = StoreState & StoreActions;

const DEFAULT_UI: UIState = {
	tool: "select",
	placingType: null,
	view: "top",
	sidebarTab: "holes",
	snapEnabled: false,
	showFlowPath: true,
};

export const useStore = create<Store>()(
	temporal(
		persist(
			(set, get) => ({
				hall: HALL,
				holes: {},
				holeOrder: [],
				selectedId: null,
				budget: {},
				ui: DEFAULT_UI,

				addHole: (type, position) => {
					const id = crypto.randomUUID();
					const definition = HOLE_TYPE_MAP[type];
					const holeNumber = get().holeOrder.length + 1;

					const hole: Hole = {
						id,
						type,
						position,
						rotation: 0,
						name: `Hole ${holeNumber}`,
						par: definition?.defaultPar ?? 3,
					};

					set((state) => ({
						holes: { ...state.holes, [id]: hole },
						holeOrder: [...state.holeOrder, id],
						selectedId: id,
						ui: {
							...state.ui,
							tool: "select",
							placingType: null,
							sidebarTab: "detail",
						},
					}));
				},

				removeHole: (id) => {
					set((state) => {
						const { [id]: _, ...remainingHoles } = state.holes;
						return {
							holes: remainingHoles,
							holeOrder: state.holeOrder.filter((hid) => hid !== id),
							selectedId: state.selectedId === id ? null : state.selectedId,
						};
					});
				},

				updateHole: (id, updates) => {
					set((state) => ({
						holes: {
							...state.holes,
							[id]: { ...state.holes[id], ...updates },
						},
					}));
				},

				reorderHoles: (fromIndex, toIndex) => {
					set((state) => {
						const order = [...state.holeOrder];
						const [moved] = order.splice(fromIndex, 1);
						order.splice(toIndex, 0, moved);
						return { holeOrder: order };
					});
				},

				selectHole: (id) => {
					set((state) => ({
						selectedId: id,
						ui: id ? { ...state.ui, sidebarTab: "detail" } : state.ui,
					}));
				},

				setTool: (tool) => {
					set((state) => ({ ui: { ...state.ui, tool } }));
				},

				setPlacingType: (type) => {
					set((state) => ({
						ui: {
							...state.ui,
							placingType: type,
							tool: type ? "place" : "select",
						},
					}));
				},

				setView: (view) => {
					set((state) => ({ ui: { ...state.ui, view } }));
				},

				setSidebarTab: (tab) => {
					set((state) => ({ ui: { ...state.ui, sidebarTab: tab } }));
				},

				toggleSnap: () => {
					set((state) => ({
						ui: { ...state.ui, snapEnabled: !state.ui.snapEnabled },
					}));
				},

				toggleFlowPath: () => {
					set((state) => ({
						ui: {
							...state.ui,
							showFlowPath: !state.ui.showFlowPath,
						},
					}));
				},

				updateBudget: (id, updates) => {
					set((state) => ({
						budget: {
							...state.budget,
							[id]: { ...state.budget[id], ...updates },
						},
					}));
				},
			}),
			{
				name: "golf-planner-state",
				partialize: (state) => ({
					holes: state.holes,
					holeOrder: state.holeOrder,
					budget: state.budget,
				}),
			},
		),
		{
			partialize: (state) => ({
				holes: state.holes,
				holeOrder: state.holeOrder,
				selectedId: state.selectedId,
			}),
			limit: 50,
		},
	),
);
