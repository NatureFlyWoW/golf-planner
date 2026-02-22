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
	GpuTier,
	GpuTierOverride,
	Hall,
	Hole,
	HoleType,
	LayerId,
	LayerState,
	UIState,
	VatProfile,
	ViewportLayout,
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
	gpuTierOverride: GpuTierOverride;
	uvTransitionEnabled: boolean;
	// Builder state
	holeTemplates: Record<string, HoleTemplate>;
	builderDraft: HoleTemplate | null;
	builderMode: boolean;
	editingTemplateId: string | null;
	builderUndoStack: HoleTemplate[];
	builderRedoStack: HoleTemplate[];
};

type StoreActions = {
	addHole: (
		type: HoleType,
		position: { x: number; z: number },
		templateId?: string,
	) => void;
	removeHole: (id: string) => void;
	updateHole: (id: string, updates: Partial<Hole>) => void;
	reorderHoles: (fromIndex: number, toIndex: number) => void;
	selectHole: (id: string | null) => void;
	setTool: (tool: UIState["tool"]) => void;
	setPlacingType: (type: HoleType | null) => void;
	setPlacingTemplateId: (templateId: string | null) => void;
	setView: (view: UIState["view"]) => void;
	setSidebarTab: (tab: UIState["sidebarTab"]) => void;
	toggleSnap: () => void;
	setActivePanel: (panel: UIState["activePanel"]) => void;
	setSunDate: (date: Date | undefined) => void;
	updateBudget: (id: string, updates: Partial<BudgetCategoryV2>) => void;
	initBudget: () => void;
	setBudgetConfig: (updates: Partial<BudgetConfigV2>) => void;
	toggleCourseOverride: () => void;
	toggleUvMode: () => void;
	flipUvMode: () => void;
	setUvTransitionEnabled: (enabled: boolean) => void;
	setGpuTier: (tier: GpuTier) => void;
	setGpuTierOverride: (override: GpuTierOverride) => void;
	setTransitioning: (transitioning: boolean) => void;
	setGodRaysLampRef: (ref: UIState["godRaysLampRef"]) => void;
	setFinancialSettings: (updates: Partial<FinancialSettings>) => void;
	addExpense: (expense: ExpenseEntry) => void;
	deleteExpense: (expenseId: string) => void;
	updateCategoryTier: (id: string, tier: ConfidenceTier) => void;
	registerScreenshotCapture: (fn: () => void) => void;
	// Viewport layout actions
	setViewportLayout: (layout: ViewportLayout) => void;
	setSplitRatio: (ratio: number) => void;
	collapseTo: (pane: "2d" | "3d") => void;
	expandDual: () => void;
	setActiveViewport: (viewport: "2d" | "3d" | null) => void;
	// Layer management actions
	setLayerVisible: (layerId: LayerId, visible: boolean) => void;
	setLayerOpacity: (layerId: LayerId, opacity: number) => void;
	setLayerLocked: (layerId: LayerId, locked: boolean) => void;
	toggleLayerVisible: (layerId: LayerId) => void;
	toggleLayerLocked: (layerId: LayerId) => void;
	resetLayers: () => void;
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
	gpuTierOverride?: GpuTierOverride;
	uvTransitionEnabled?: boolean;
	// Legacy fields for migration
	costPerHole?: number;
};

export const DEFAULT_LAYERS: Record<LayerId, LayerState> = {
	holes: { visible: true, opacity: 1, locked: false },
	flowPath: { visible: true, opacity: 1, locked: false },
	grid: { visible: true, opacity: 1, locked: false },
	walls: { visible: true, opacity: 1, locked: false },
	sunIndicator: { visible: true, opacity: 1, locked: false },
};

const DEFAULT_UI: UIState = {
	tool: "select",
	placingType: null,
	placingTemplateId: null,
	view: "top",
	sidebarTab: "holes",
	snapEnabled: false,
	activePanel: null,
	sunDate: undefined,
	uvMode: false,
	gpuTier: "low",
	transitioning: false,
	godRaysLampRef: null,
	viewportLayout: "dual",
	activeViewport: null,
	splitRatio: 0.5,
	layers: { ...DEFAULT_LAYERS },
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

/**
 * Zustand persist migration function — extracted for unit testability.
 * Called by the persist middleware whenever the stored version is older
 * than the current store version (7).
 */
export function migratePersistedState(
	persisted: unknown,
	version: number,
): unknown {
	const p = persisted as PersistedSlice;
	if (version < 3 && p) {
		p.budgetConfig = migrateBudgetConfig(
			(p.budgetConfig ?? {}) as Parameters<typeof migrateBudgetConfig>[0],
		) as unknown as BudgetConfigV2;
		if (p.budget) {
			p.budget = migrateBudgetCategories(
				p.budget as unknown as Parameters<typeof migrateBudgetCategories>[0],
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

	if (version < 7 && p) {
		try {
			if (!("gpuTierOverride" in (p as Record<string, unknown>))) {
				(p as Record<string, unknown>).gpuTierOverride = "auto";
			}
		} catch {
			(p as Record<string, unknown>).gpuTierOverride = "auto";
		}
	}

	if (version < 8 && p) {
		if (!("uvTransitionEnabled" in (p as Record<string, unknown>))) {
			(p as Record<string, unknown>).uvTransitionEnabled = true;
		}
	}

	return p;
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
				gpuTierOverride: "auto" as GpuTierOverride,
			uvTransitionEnabled: true,
				...BUILDER_INITIAL_STATE,
				...createBuilderActions(set, get),

				addHole: (type, position, templateId?) => {
					const id = crypto.randomUUID();
					const definition = HOLE_TYPE_MAP[type];
					const template = templateId ? get().holeTemplates[templateId] : null;
					const holeNumber = get().holeOrder.length + 1;

					const hole: Hole = {
						id,
						type,
						position,
						rotation: 0,
						name: template ? template.name : `Hole ${holeNumber}`,
						par: template ? template.defaultPar : (definition?.defaultPar ?? 3),
						...(templateId ? { templateId } : {}),
					};

					set((state) => ({
						holes: { ...state.holes, [id]: hole },
						holeOrder: [...state.holeOrder, id],
						selectedId: id,
						ui: {
							...state.ui,
							tool: "select",
							placingType: null,
							placingTemplateId: null,
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
							placingTemplateId: null,
							tool: type ? "place" : "select",
						},
					}));
				},

				setPlacingTemplateId: (templateId) => {
					set((state) => ({
						ui: {
							...state.ui,
							placingTemplateId: templateId,
							placingType: null,
							tool: templateId ? "place" : "select",
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
					const state = get();
					if (state.ui.transitioning) return;
					if (!state.uvTransitionEnabled) {
						set((s) => ({ ui: { ...s.ui, uvMode: !s.ui.uvMode } }));
					} else {
						set((s) => ({ ui: { ...s.ui, transitioning: true } }));
					}
				},

				flipUvMode: () => {
					set((s) => ({ ui: { ...s.ui, uvMode: !s.ui.uvMode } }));
				},

				setUvTransitionEnabled: (enabled) => {
					set({ uvTransitionEnabled: enabled });
				},

				setGpuTier: (tier) => {
					set((state) => ({
						ui: { ...state.ui, gpuTier: tier },
					}));
				},

				setGpuTierOverride: (override) => {
					set({ gpuTierOverride: override });
				},

				setTransitioning: (transitioning) => {
					set((state) => ({
						ui: { ...state.ui, transitioning },
					}));
				},

				setGodRaysLampRef: (ref) => {
					set((state) => ({
						ui: { ...state.ui, godRaysLampRef: ref },
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

				// Viewport layout actions
				setViewportLayout: (layout) =>
					set((state) => ({ ui: { ...state.ui, viewportLayout: layout } })),
				setSplitRatio: (ratio) =>
					set((state) => ({
						ui: {
							...state.ui,
							splitRatio: Math.max(0.2, Math.min(0.8, ratio)),
						},
					})),
				collapseTo: (pane) =>
					set((state) => ({
						ui: {
							...state.ui,
							viewportLayout: pane === "2d" ? "2d-only" : "3d-only",
						},
					})),
				expandDual: () =>
					set((state) => ({ ui: { ...state.ui, viewportLayout: "dual" } })),
				setActiveViewport: (viewport) =>
					set((state) => ({ ui: { ...state.ui, activeViewport: viewport } })),

				// Layer management actions
				setLayerVisible: (layerId, visible) =>
					set((state) => ({
						ui: {
							...state.ui,
							layers: {
								...state.ui.layers,
								[layerId]: { ...state.ui.layers[layerId], visible },
							},
						},
					})),
				setLayerOpacity: (layerId, opacity) =>
					set((state) => ({
						ui: {
							...state.ui,
							layers: {
								...state.ui.layers,
								[layerId]: {
									...state.ui.layers[layerId],
									opacity: Math.max(0, Math.min(1, opacity)),
								},
							},
						},
					})),
				setLayerLocked: (layerId, locked) =>
					set((state) => ({
						ui: {
							...state.ui,
							layers: {
								...state.ui.layers,
								[layerId]: { ...state.ui.layers[layerId], locked },
							},
						},
					})),
				toggleLayerVisible: (layerId) =>
					set((state) => ({
						ui: {
							...state.ui,
							layers: {
								...state.ui.layers,
								[layerId]: {
									...state.ui.layers[layerId],
									visible: !state.ui.layers[layerId].visible,
								},
							},
						},
					})),
				toggleLayerLocked: (layerId) =>
					set((state) => ({
						ui: {
							...state.ui,
							layers: {
								...state.ui.layers,
								[layerId]: {
									...state.ui.layers[layerId],
									locked: !state.ui.layers[layerId].locked,
								},
							},
						},
					})),
				resetLayers: () =>
					set((state) => ({
						ui: { ...state.ui, layers: { ...DEFAULT_LAYERS } },
					})),
			}),
			{
				name: "golf-planner-state",
				version: 8,
				partialize: (state) => ({
					holes: state.holes,
					holeOrder: state.holeOrder,
					budget: state.budget,
					budgetConfig: state.budgetConfig,
					financialSettings: state.financialSettings,
					expenses: state.expenses,
					holeTemplates: state.holeTemplates,
					builderDraft: state.builderDraft,
					gpuTierOverride: state.gpuTierOverride,
					uvTransitionEnabled: state.uvTransitionEnabled,
				}),
				migrate: migratePersistedState,
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
