import { describe, expect, it } from "vitest";
import { migratePersistedState } from "../../src/store/store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal v5 persisted state — missing holeTemplates and builderDraft. */
function makeV5State(
	overrides?: Record<string, unknown>,
): Record<string, unknown> {
	return {
		holes: {},
		holeOrder: [],
		budget: {},
		budgetConfig: {
			materialProfile: "standard_diy",
			courseOverride: false,
			costPerType: {},
		},
		financialSettings: {
			vatRegistered: false,
			displayMode: "net",
			riskTolerance: "balanced",
			buildMode: "diy",
			inflationYears: 0,
		},
		expenses: [],
		...overrides,
	};
}

/** Minimal v3 persisted state — missing financialSettings, expenses, holeTemplates, builderDraft. */
function makeV3State(
	overrides?: Record<string, unknown>,
): Record<string, unknown> {
	return {
		holes: {},
		holeOrder: [],
		budget: {},
		budgetConfig: {},
		...overrides,
	};
}

// ---------------------------------------------------------------------------
// v5 → v6 migration
// ---------------------------------------------------------------------------

describe("v5 → v6 migration: holeTemplates and builderDraft fields", () => {
	it("adds holeTemplates: {} when field is absent", () => {
		const v5 = makeV5State();
		const result = migratePersistedState(v5, 5) as Record<string, unknown>;
		expect(result.holeTemplates).toEqual({});
	});

	it("adds builderDraft: null when field is absent", () => {
		const v5 = makeV5State();
		const result = migratePersistedState(v5, 5) as Record<string, unknown>;
		expect(result.builderDraft).toBeNull();
	});

	it("does not overwrite existing holeTemplates when already present in a v5-versioned payload", () => {
		// Edge case: someone manually stored holeTemplates at version 5.
		// The migration guard checks !("holeTemplates" in p), so it must not overwrite.
		const existingTemplates = {
			"t2": { id: "t2", name: "Existing", segments: [] },
		};
		const stateWithTemplates = {
			...makeV5State(),
			holeTemplates: existingTemplates,
		};
		const result = migratePersistedState(stateWithTemplates, 5) as Record<
			string,
			unknown
		>;
		expect(result.holeTemplates).toEqual(existingTemplates);
	});

	it("preserves holes after migration", () => {
		const holes = {
			"h1": {
				id: "h1",
				type: "straight",
				position: { x: 5, z: 3 },
				rotation: 90,
				name: "Hole 1",
				par: 3,
			},
		};
		const v5 = makeV5State({ holes, holeOrder: ["h1"] });
		const result = migratePersistedState(v5, 5) as Record<string, unknown>;
		expect(result.holes).toEqual(holes);
	});

	it("preserves holeOrder after migration", () => {
		const v5 = makeV5State({
			holes: {
				"h1": {
					id: "h1",
					type: "straight",
					position: { x: 1, z: 2 },
					rotation: 0,
					name: "Hole 1",
					par: 2,
				},
			},
			holeOrder: ["h1"],
		});
		const result = migratePersistedState(v5, 5) as Record<string, unknown>;
		expect(result.holeOrder).toEqual(["h1"]);
	});

	it("preserves budget data after migration", () => {
		const budget = {
			hall: { id: "hall", label: "Hall", estimatedNet: 50000 },
		};
		const v5 = makeV5State({ budget });
		const result = migratePersistedState(v5, 5) as Record<string, unknown>;
		expect(result.budget).toEqual(budget);
	});

	it("preserves expenses after migration", () => {
		const expenses = [
			{
				id: "e1",
				categoryId: "hall",
				date: "2026-01-01",
				amount: 1000,
				vendor: "Vendor GmbH",
				note: "",
			},
		];
		const v5 = makeV5State({ expenses });
		const result = migratePersistedState(v5, 5) as Record<string, unknown>;
		expect(result.expenses).toEqual(expenses);
	});

	it("preserves financialSettings after migration", () => {
		const financialSettings = {
			vatRegistered: true,
			displayMode: "gross",
			riskTolerance: "optimistic",
			buildMode: "pro",
			inflationYears: 2,
		};
		const v5 = makeV5State({ financialSettings });
		const result = migratePersistedState(v5, 5) as Record<string, unknown>;
		expect(result.financialSettings).toEqual(financialSettings);
	});
});

// ---------------------------------------------------------------------------
// Full migration chain: v3 → v6
// ---------------------------------------------------------------------------

describe("full migration chain v3 → v6", () => {
	it("adds financialSettings when migrating from v3", () => {
		const v3 = makeV3State();
		const result = migratePersistedState(v3, 3) as Record<string, unknown>;
		expect(result).toHaveProperty("financialSettings");
		expect(result.financialSettings).not.toBeNull();
	});

	it("adds expenses array when migrating from v3", () => {
		const v3 = makeV3State();
		const result = migratePersistedState(v3, 3) as Record<string, unknown>;
		expect(result).toHaveProperty("expenses");
		expect(Array.isArray(result.expenses)).toBe(true);
	});

	it("adds holeTemplates: {} when migrating from v3", () => {
		const v3 = makeV3State();
		const result = migratePersistedState(v3, 3) as Record<string, unknown>;
		expect(result.holeTemplates).toEqual({});
	});

	it("adds builderDraft: null when migrating from v3", () => {
		const v3 = makeV3State();
		const result = migratePersistedState(v3, 3) as Record<string, unknown>;
		expect(result.builderDraft).toBeNull();
	});

	it("adds materialProfile to budgetConfig when migrating from v3", () => {
		const v3 = makeV3State({
			budgetConfig: { costPerType: { straight: 2000 } },
		});
		const result = migratePersistedState(v3, 3) as Record<string, unknown>;
		const budgetConfig = result.budgetConfig as Record<string, unknown>;
		expect(budgetConfig).toHaveProperty("materialProfile");
	});

	it("preserves holes through full v3 → v6 chain", () => {
		const holes = {
			"h1": {
				id: "h1",
				type: "curve",
				position: { x: 3, z: 1 },
				rotation: 45,
				name: "Curve 1",
				par: 3,
			},
		};
		const v3 = makeV3State({ holes, holeOrder: ["h1"] });
		const result = migratePersistedState(v3, 3) as Record<string, unknown>;
		expect(result.holeOrder).toEqual(["h1"]);
	});
});

// ---------------------------------------------------------------------------
// v6 passthrough — no mutation of already-current state
// ---------------------------------------------------------------------------

describe("v6 state passthrough", () => {
	it("preserves holeTemplates on current-version state (no migration branches run)", () => {
		const existingTemplates = {
			"t1": { id: "t1", name: "T", segments: [] },
		};
		const v6 = {
			...makeV5State(),
			holeTemplates: existingTemplates,
			builderDraft: null,
		};
		// version === 6, so no migration branch should execute
		const result = migratePersistedState(v6, 6) as Record<string, unknown>;
		expect(result.holeTemplates).toEqual(existingTemplates);
		expect(result.builderDraft).toBeNull();
	});

	it("preserves non-empty holeTemplates on v6 state", () => {
		const templates = {
			"tpl-abc": { id: "tpl-abc", name: "My Hole", segments: [{ id: "s1" }] },
			"tpl-def": { id: "tpl-def", name: "Another", segments: [] },
		};
		const v6 = {
			...makeV5State(),
			holeTemplates: templates,
			builderDraft: null,
		};
		const result = migratePersistedState(v6, 6) as Record<string, unknown>;
		expect(Object.keys(result.holeTemplates as object)).toHaveLength(2);
	});
});
