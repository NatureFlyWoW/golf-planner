import { temporal } from "zundo";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
	COURSE_CATEGORY_ID,
	DEFAULT_BUDGET_CATEGORIES_V2,
	DEFAULT_BUDGET_CONFIG_V2,
	DEFAULT_CONFIDENCE_TIERS,
	DEFAULT_COST_PER_TYPE_DIY,
	DEFAULT_FINANCIAL_SETTINGS,
} from "../constants/budget";
import { HALL } from "../constants/hall";
import { HOLE_TYPE_MAP } from "../constants/holeTypes";
import type {
	BudgetCategoryV2,
	BudgetConfigV2,
	ConfidenceTier,
	ConstructionPhase,
	ExpenseEntry,
	FinancialSettings,
	Hall,
	Hole,
	HoleType,
	UIState,
	VatProfile,
} from "../types";
import type { HoleTemplate } from "../types/template";
import { uncertaintyFromTier } from "../utils/financial";
import {
	migrateBudgetCategories,
	migrateBudgetConfig,
} from "../utils/migrateBudgetConfig";
import type { BuilderActions } from "./builderSlice";
import { BUILDER_INITIAL_STATE, createBuilderActions } from "./builderSlice";

type StoreState = {
	hall: Hall;
	holes: Record<string, Hole>;
	holeOrder: string[];
	selectedId: string | null;
	budget: Record<string, BudgetCategoryV2>;
	budgetConfig: BudgetConfigV2;
	financialSettings: FinancialSettings;
	expenses: ExpenseEntry[];
	ui: UIState;
	captureScreenshot: (() => void) | null;
	// Builder state
	holeTemplates: Record<string, HoleTemplate>;
	builderDraft: HoleTemplate | null;
	builderMode: boolean;
	editingTemplateId: string | null;
	builderUndoStack: HoleTemplate[];
	builderRedoStack: HoleTemplate[];
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
	updateBudget: (id: string, updates: Partial<BudgetCategoryV2>) => void;
	initBudget: () => void;
	setBudgetConfig: (updates: Partial<BudgetConfigV2>) => void;
	toggleCourseOverride: () => void;
	toggleUvMode: () => void;
	setFinancialSettings: (updates: Partial<FinancialSettings>) => void;
	addExpense: (expense: ExpenseEntry) => void;
	deleteExpense: (expenseId: string) => void;
	updateCategoryTier: (id: string, tier: ConfidenceTier) => void;
	registerScreenshotCapture: (fn: () => void) => void;
} & BuilderActions;

export type Store = StoreState & StoreActions;

/** Shape of the persisted slice written to localStorage. */
type PersistedSlice = {
	holes: Record<string, Hole>;
	holeOrder: string[];
	budget: Record<string, BudgetCategoryV2>;
	budgetConfig: BudgetConfigV2;
	financialSettings: FinancialSettings;
	expenses: ExpenseEntry[];
	holeTemplates?: Record<string, HoleTemplate>;
	builderDraft?: HoleTemplate | null;
	// Legacy fields for migration
	costPerHole?: number;
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
	uvMode: false,
};

function migrateToV4(state: PersistedSlice): void {
	// Migrate budget categories to v2
	if (state.budget) {
		const DEFAULT_TIERS = DEFAULT_CONFIDENCE_TIERS;
		const VAT_PROFILES: Record<string, VatProfile> = {
			permits: "exempt",
			insurance: "exempt",
		};

		const PHASES: Record<string, ConstructionPhase> = {
			hall: "construction",
			foundation: "construction",
			course: "fit-out",
			"uv-lighting": "fit-out",
			"emergency-lighting": "fit-out",
			"heat-pumps": "construction",
			ventilation: "construction",
			electrical: "construction",
			plumbing: "construction",
			"wall-art": "commissioning",
			finishing: "fit-out",
			equipment: "commissioning",
			"fire-safety": "fit-out",
			permits: "pre-construction",
			insurance: "ongoing",
			"lightning-protection": "construction",
			"grid-connection": "pre-construction",
			"water-connection": "pre-construction",
		};

		const MANDATORY = new Set([
			"hall",
			"foundation",
			"emergency-lighting",
			"electrical",
			"plumbing",
			"fire-safety",
			"permits",
			"insurance",
			"lightning-protection",
			"grid-connection",
			"water-connection",
		]);

		for (const [id, cat] of Object.entries(state.budget)) {
			const oldCat = cat as Record<string, unknown>;
			const tier = DEFAULT_TIERS[id] ?? "medium";
			const vatProfile = VAT_PROFILES[id] ?? "standard_20";

			// If the category doesn't have v2 fields, add them
			if (!("estimatedNet" in oldCat)) {
				// Convert estimated (assumed gross) to net
				const estimated = (oldCat.estimated as number) ?? 0;
				const net =
					vatProfile === "standard_20"
						? Math.round((estimated / 1.2) * 100) / 100
						: estimated;

				(oldCat as Record<string, unknown>).estimatedNet = net;
				(oldCat as Record<string, unknown>).vatProfile = vatProfile;
				(oldCat as Record<string, unknown>).confidenceTier = tier;
				(oldCat as Record<string, unknown>).uncertainty = uncertaintyFromTier(
					net,
					tier,
				);
				(oldCat as Record<string, unknown>).mandatory = MANDATORY.has(id);
				(oldCat as Record<string, unknown>).phase = PHASES[id] ?? "fit-out";
			}
		}

		// Seed new categories that don't exist yet
		for (const defaultCat of DEFAULT_BUDGET_CATEGORIES_V2) {
			if (!state.budget[defaultCat.id]) {
				(state.budget as Record<string, unknown>)[defaultCat.id] = {
					...defaultCat,
				};
			}
		}
	}

	// Add financialSettings if missing
	if (!("financialSettings" in (state as Record<string, unknown>))) {
		(state as Record<string, unknown>).financialSettings = {
			...DEFAULT_FINANCIAL_SETTINGS,
		};
	}

	// Add expenses array if missing
	if (!("expenses" in (state as Record<string, unknown>))) {
		const expenses: ExpenseEntry[] = [];

		// Migrate existing actual values to expense entries
		if (state.budget) {
			for (const [id, cat] of Object.entries(state.budget)) {
				const actual = (cat as Record<string, unknown>).actual as number;
				if (actual && actual > 0) {
					expenses.push({
						id: `migrated-${id}`,
						categoryId: id,
						date: new Date().toISOString().slice(0, 10),
						amount: actual,
						vendor: "Migrated from v3",
						note: "Auto-migrated from previous budget version",
					});
				}
			}
		}

		(state as Record<string, unknown>).expenses = expenses;
	}

	// Migrate budgetConfig to v2 (add costPerTypeDiy if missing)
	if (state.budgetConfig && !("costPerTypeDiy" in state.budgetConfig)) {
		(state.budgetConfig as Record<string, unknown>).costPerTypeDiy = {
			...DEFAULT_COST_PER_TYPE_DIY,
		};
	}
}

export const useStore = create<Store>()(
	temporal(
		persist(
			(set, get) => ({
				hall: HALL,
				holes: {},
				holeOrder: [],
				selectedId: null,
				budget: {},
				budgetConfig: DEFAULT_BUDGET_CONFIG_V2,
				financialSettings: DEFAULT_FINANCIAL_SETTINGS,
				expenses: [],
				ui: DEFAULT_UI,
				captureScreenshot: null,
				...BUILDER_INITIAL_STATE,
				...createBuilderActions(set, get),

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
						ui: {
							...state.ui,
							snapEnabled: !state.ui.snapEnabled,
						},
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
					set((state) => {
						const existing = state.budget[id];
						if (!existing) return state;
						return {
							budget: {
								...state.budget,
								[id]: { ...existing, ...updates },
							},
						};
					});
				},

				initBudget: () => {
					set(() => {
						const budget: Record<string, BudgetCategoryV2> = {};
						for (const cat of DEFAULT_BUDGET_CATEGORIES_V2) {
							budget[cat.id] = { ...cat };
						}
						return { budget };
					});
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

				toggleUvMode: () => {
					set((state) => ({
						ui: { ...state.ui, uvMode: !state.ui.uvMode },
					}));
				},

				setFinancialSettings: (updates) =>
					set((state) => ({
						financialSettings: {
							...state.financialSettings,
							...updates,
						},
					})),

				addExpense: (expense) =>
					set((state) => ({
						expenses: [...state.expenses, expense],
					})),

				deleteExpense: (expenseId) =>
					set((state) => ({
						expenses: state.expenses.filter((e) => e.id !== expenseId),
					})),

				updateCategoryTier: (id, tier) =>
					set((state) => {
						const cat = state.budget[id];
						if (!cat) return state;
						return {
							budget: {
								...state.budget,
								[id]: {
									...cat,
									confidenceTier: tier,
									uncertainty: uncertaintyFromTier(cat.estimatedNet, tier),
								},
							},
						};
					}),

				registerScreenshotCapture: (fn) => set({ captureScreenshot: fn }),
			}),
			{
				name: "golf-planner-state",
				version: 6,
				partialize: (state) => ({
					holes: state.holes,
					holeOrder: state.holeOrder,
					budget: state.budget,
					budgetConfig: state.budgetConfig,
					financialSettings: state.financialSettings,
					expenses: state.expenses,
					holeTemplates: state.holeTemplates,
					builderDraft: state.builderDraft,
				}),
				migrate: (persisted: unknown, version: number) => {
					const p = persisted as PersistedSlice;
					if (version < 3 && p) {
						p.budgetConfig = migrateBudgetConfig(
							(p.budgetConfig ?? {}) as Parameters<
								typeof migrateBudgetConfig
							>[0],
						) as unknown as BudgetConfigV2;
						if (p.budget) {
							p.budget = migrateBudgetCategories(
								p.budget as unknown as Parameters<
									typeof migrateBudgetCategories
								>[0],
							) as unknown as Record<string, BudgetCategoryV2>;
						}
					}

					if (version < 4 && p) {
						migrateToV4(p);
					}

					if (version < 5 && p) {
						if (p.budgetConfig && !("materialProfile" in p.budgetConfig)) {
							(p.budgetConfig as Record<string, unknown>).materialProfile =
								"standard_diy";
						}
					}

					if (version < 6 && p) {
						if (!("holeTemplates" in (p as Record<string, unknown>))) {
							(p as Record<string, unknown>).holeTemplates = {};
						}
						if (!("builderDraft" in (p as Record<string, unknown>))) {
							(p as Record<string, unknown>).builderDraft = null;
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
