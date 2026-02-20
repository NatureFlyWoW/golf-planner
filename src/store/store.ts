import { temporal } from "zundo";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
	COURSE_CATEGORY_ID,
	DEFAULT_BUDGET_CATEGORIES,
	DEFAULT_BUDGET_CONFIG,
} from "../constants/budget";
import { HALL } from "../constants/hall";
import { HOLE_TYPE_MAP } from "../constants/holeTypes";
import type {
	BudgetCategory,
	BudgetConfig,
	Hall,
	Hole,
	HoleType,
	UIState,
} from "../types";
import {
	migrateBudgetCategories,
	migrateBudgetConfig,
} from "../utils/migrateBudgetConfig";

type StoreState = {
	hall: Hall;
	holes: Record<string, Hole>;
	holeOrder: string[];
	selectedId: string | null;
	budget: Record<string, BudgetCategory>;
	budgetConfig: BudgetConfig;
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
	setActivePanel: (panel: UIState["activePanel"]) => void;
	setSunDate: (date: Date | undefined) => void;
	updateBudget: (id: string, updates: Partial<BudgetCategory>) => void;
	initBudget: () => void;
	setBudgetConfig: (updates: Partial<BudgetConfig>) => void;
	toggleCourseOverride: () => void;
};

export type Store = StoreState & StoreActions;

/** Shape of the persisted slice written to localStorage. */
type PersistedSlice = {
	holes?: Record<string, Hole>;
	holeOrder?: string[];
	budget?: Record<string, BudgetCategory>;
	budgetConfig?: BudgetConfig | { costPerHole?: number };
};

const DEFAULT_UI: UIState = {
	tool: "select",
	placingType: null,
	view: "top",
	sidebarTab: "holes",
	snapEnabled: false,
	showFlowPath: true,
	activePanel: null,
	sunDate: undefined,
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
				budgetConfig: DEFAULT_BUDGET_CONFIG,
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

				setActivePanel: (panel) => {
					set((state) => ({
						ui: { ...state.ui, activePanel: panel },
					}));
				},

				setSunDate: (date) => {
					set((state) => ({ ui: { ...state.ui, sunDate: date } }));
				},

				updateBudget: (id, updates) => {
					set((state) => ({
						budget: {
							...state.budget,
							[id]: { ...state.budget[id], ...updates },
						},
					}));
				},

				initBudget: () => {
					const budget: Record<string, BudgetCategory> = {};
					for (const cat of DEFAULT_BUDGET_CATEGORIES) {
						budget[cat.id] = { ...cat };
					}
					set({ budget });
				},

				setBudgetConfig: (updates) => {
					set((state) => ({
						budgetConfig: { ...state.budgetConfig, ...updates },
					}));
				},

				toggleCourseOverride: () => {
					set((state) => {
						const cat = state.budget[COURSE_CATEGORY_ID];
						if (!cat) return state;
						return {
							budget: {
								...state.budget,
								[COURSE_CATEGORY_ID]: {
									...cat,
									manualOverride: !cat.manualOverride,
								},
							},
						};
					});
				},
			}),
			{
				name: "golf-planner-state",
				version: 3,
				partialize: (state) => ({
					holes: state.holes,
					holeOrder: state.holeOrder,
					budget: state.budget,
					budgetConfig: state.budgetConfig,
				}),
				migrate: (persisted: unknown, version: number) => {
					const p = persisted as PersistedSlice;
					if (version < 3 && p) {
						p.budgetConfig = migrateBudgetConfig(
							(p.budgetConfig ?? {}) as Parameters<
								typeof migrateBudgetConfig
							>[0],
						);
						if (p.budget) {
							p.budget = migrateBudgetCategories(p.budget);
						}
					}
					return p;
				},
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
