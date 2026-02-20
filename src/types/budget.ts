// === Existing types (preserved for migration) ===

export type BudgetCategory = {
	id: string;
	name: string;
	estimated: number;
	actual: number;
	notes: string;
	manualOverride?: boolean;
};

export type BudgetConfig = {
	costPerType: Record<string, number>;
};

// === V2 types (Phase 8) ===

export type VatProfile = "standard_20" | "exempt";

export type ConfidenceTier = "fixed" | "low" | "medium" | "high" | "very_high";

export type ConstructionPhase =
	| "pre-construction"
	| "construction"
	| "fit-out"
	| "commissioning"
	| "ongoing";

export type RiskTolerance = "optimistic" | "balanced" | "conservative";

export type BuildMode = "diy" | "professional" | "mixed";

export type UncertaintyParams = {
	min: number;
	mode: number;
	max: number;
};

export type BudgetCategoryV2 = {
	id: string;
	name: string;
	estimatedNet: number;
	notes: string;
	manualOverride?: boolean;
	vatProfile: VatProfile;
	confidenceTier: ConfidenceTier;
	uncertainty: UncertaintyParams;
	mandatory: boolean;
	phase: ConstructionPhase;
};

export type ExpenseEntry = {
	id: string;
	categoryId: string;
	date: string;
	amount: number;
	vendor: string;
	note: string;
};

export type FinancialSettings = {
	vatRegistered: boolean;
	displayMode: "net" | "gross" | "both";
	inflationFactor: number;
	riskTolerance: RiskTolerance;
	buildMode: BuildMode;
};

export type MaterialProfile = "budget_diy" | "standard_diy" | "semi_pro";

export type BudgetConfigV2 = {
	costPerType: Record<string, number>;
	costPerTypeDiy: Record<string, number>;
	materialProfile: MaterialProfile;
};
