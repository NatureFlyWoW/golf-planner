import type {
	BudgetCategory,
	BudgetCategoryV2,
	BudgetConfig,
	BudgetConfigV2,
	ConfidenceTier,
	FinancialSettings,
	MaterialProfile,
} from "../types";

export const COURSE_CATEGORY_ID = "course";
export const DEFAULT_HOLE_COST = 2700;

export const DEFAULT_COST_PER_TYPE: Record<string, number> = {
	straight: 2000,
	"l-shape": 2500,
	dogleg: 2800,
	ramp: 3000,
	loop: 3200,
	windmill: 3500,
	tunnel: 2800,
};

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
	costPerType: { ...DEFAULT_COST_PER_TYPE },
};

export const BUDGET_HINTS: Record<string, string> = {
	"uv-lighting":
		"Industry mid-range: \u20ac5,500\u2013\u20ac9,000 for 12\u201318 holes",
	electrical:
		"Industry mid-range: \u20ac10,000\u2013\u20ac15,000 for 12\u201318 holes",
	equipment:
		"Industry mid-range: \u20ac10,000\u2013\u20ac15,000 for indoor mini golf",
};

export const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
	{
		id: "hall",
		name: "BORGA Hall",
		estimated: 108000,
		actual: 0,
		notes: "",
	},
	{
		id: "course",
		name: "Mini golf course",
		estimated: 37800,
		actual: 0,
		notes: "",
	},
	{
		id: "uv-lighting",
		name: "UV lighting system",
		estimated: 5500,
		actual: 0,
		notes: "",
	},
	{
		id: "emergency-lighting",
		name: "Emergency lighting",
		estimated: 2000,
		actual: 0,
		notes: "",
	},
	{
		id: "heat-pumps",
		name: "Heat pumps (heating/cooling)",
		estimated: 10000,
		actual: 0,
		notes: "",
	},
	{
		id: "ventilation",
		name: "Ventilation with heat recovery",
		estimated: 4500,
		actual: 0,
		notes: "",
	},
	{
		id: "electrical",
		name: "Electrical installation",
		estimated: 12500,
		actual: 0,
		notes: "",
	},
	{
		id: "plumbing",
		name: "Plumbing & WC facilities",
		estimated: 15000,
		actual: 0,
		notes: "",
	},
	{
		id: "wall-art",
		name: "UV graffiti / wall art",
		estimated: 15000,
		actual: 0,
		notes: "",
	},
	{
		id: "finishing",
		name: "Interior finishing & flooring",
		estimated: 10000,
		actual: 0,
		notes: "",
	},
	{
		id: "equipment",
		name: "Sound, POS, furniture",
		estimated: 10000,
		actual: 0,
		notes: "",
	},
	{
		id: "fire-safety",
		name: "Fire safety & emergency systems",
		estimated: 3500,
		actual: 0,
		notes: "",
	},
	{
		id: "permits",
		name: "Permits, architect, fees",
		estimated: 9500,
		actual: 0,
		notes: "",
	},
	{
		id: "insurance",
		name: "Insurance (annual)",
		estimated: 2200,
		actual: 0,
		notes:
			"Annual Betriebshaftpflicht \u2014 multiply by operating years for total",
	},
];

export const DEFAULT_COST_PER_TYPE_DIY: Record<string, number> = {
	straight: 800,
	"l-shape": 1000,
	dogleg: 1100,
	ramp: 1200,
	loop: 1500,
	windmill: 1800,
	tunnel: 1100,
};

export const MATERIAL_PROFILE_MULTIPLIERS: Record<MaterialProfile, number> = {
	budget_diy: 0.65,
	standard_diy: 1.0,
	semi_pro: 1.8,
};

export const DEFAULT_BUDGET_CONFIG_V2: BudgetConfigV2 = {
	costPerType: DEFAULT_COST_PER_TYPE,
	costPerTypeDiy: DEFAULT_COST_PER_TYPE_DIY,
	materialProfile: "standard_diy",
};

export const DEFAULT_FINANCIAL_SETTINGS: FinancialSettings = {
	vatRegistered: false,
	displayMode: "gross",
	inflationFactor: 1.0,
	riskTolerance: "balanced",
	buildMode: "diy",
};

export const DEFAULT_CONFIDENCE_TIERS: Record<string, ConfidenceTier> = {
	hall: "fixed",
	foundation: "high",
	course: "high",
	"uv-lighting": "medium",
	"emergency-lighting": "low",
	"heat-pumps": "medium",
	ventilation: "low",
	electrical: "medium",
	plumbing: "medium",
	"wall-art": "very_high",
	finishing: "high",
	equipment: "high",
	"fire-safety": "low",
	permits: "medium",
	insurance: "fixed",
	"lightning-protection": "medium",
	"grid-connection": "medium",
	"water-connection": "medium",
};

// Full v2 category defaults — 18 categories
export const DEFAULT_BUDGET_CATEGORIES_V2: BudgetCategoryV2[] = [
	{
		id: "hall",
		name: "BORGA Hall",
		estimatedNet: 90000,
		notes: "BORGA offer Nr. 015-659208. Fixed-price turnkey.",
		vatProfile: "standard_20",
		confidenceTier: "fixed",
		uncertainty: { min: 88200, mode: 90000, max: 91800 },
		mandatory: true,
		phase: "construction",
	},
	{
		id: "foundation",
		name: "Foundation & earthworks",
		estimatedNet: 20000,
		notes:
			"Strip foundations + Bodenplatte. Excluded from BORGA offer. Consult BORGA for specs.",
		vatProfile: "standard_20",
		confidenceTier: "high",
		uncertainty: { min: 12000, mode: 20000, max: 32000 },
		mandatory: true,
		phase: "construction",
	},
	{
		id: "course",
		name: "Mini golf course",
		estimatedNet: 0,
		notes: "Auto-calculated from placed holes. Lock to override.",
		manualOverride: false,
		vatProfile: "standard_20",
		confidenceTier: "high",
		uncertainty: { min: 0, mode: 0, max: 0 },
		mandatory: true,
		phase: "fit-out",
	},
	{
		id: "uv-lighting",
		name: "UV lighting system",
		estimatedNet: 4583,
		notes:
			"Industry mid-range: \u20ac5,500\u2013\u20ac9,000 for 12\u201318 holes",
		vatProfile: "standard_20",
		confidenceTier: "medium",
		uncertainty: { min: 3666, mode: 4583, max: 5958 },
		mandatory: false,
		phase: "fit-out",
	},
	{
		id: "emergency-lighting",
		name: "Emergency lighting",
		estimatedNet: 1667,
		notes: "ÖNORM EN 1838: min 1 lux on escape routes, 60 min battery.",
		vatProfile: "standard_20",
		confidenceTier: "low",
		uncertainty: { min: 1500, mode: 1667, max: 1917 },
		mandatory: true,
		phase: "fit-out",
	},
	{
		id: "heat-pumps",
		name: "Heat pumps (heating/cooling)",
		estimatedNet: 8333,
		notes: "2-3 air-to-air split units (Daikin/Mitsubishi).",
		vatProfile: "standard_20",
		confidenceTier: "medium",
		uncertainty: { min: 6666, mode: 8333, max: 10833 },
		mandatory: false,
		phase: "construction",
	},
	{
		id: "ventilation",
		name: "Ventilation with heat recovery",
		estimatedNet: 3750,
		notes:
			"Essential for blacklight venue (windows blacked out). 900 m\u00b3/h for 30 occupants.",
		vatProfile: "standard_20",
		confidenceTier: "low",
		uncertainty: { min: 3375, mode: 3750, max: 4313 },
		mandatory: false,
		phase: "construction",
	},
	{
		id: "electrical",
		name: "Electrical installation",
		estimatedNet: 10417,
		notes:
			"Industry mid-range: \u20ac10,000\u2013\u20ac15,000. Licensed Elektrotechniker required.",
		vatProfile: "standard_20",
		confidenceTier: "medium",
		uncertainty: { min: 8334, mode: 10417, max: 13542 },
		mandatory: true,
		phase: "construction",
	},
	{
		id: "plumbing",
		name: "Plumbing & WC facilities",
		estimatedNet: 12500,
		notes:
			"Min 3 WCs (men, women, accessible). Licensed Installateur required.",
		vatProfile: "standard_20",
		confidenceTier: "medium",
		uncertainty: { min: 10000, mode: 12500, max: 16250 },
		mandatory: true,
		phase: "construction",
	},
	{
		id: "wall-art",
		name: "UV graffiti / wall art",
		estimatedNet: 12500,
		notes:
			"\u20ac150-300/m\u00b2 for professional UV murals. ~180m\u00b2 wall area. Highest variance.",
		vatProfile: "standard_20",
		confidenceTier: "very_high",
		uncertainty: { min: 6250, mode: 12500, max: 25000 },
		mandatory: false,
		phase: "commissioning",
	},
	{
		id: "finishing",
		name: "Interior finishing & flooring",
		estimatedNet: 8333,
		notes: "Epoxy floor coating, wall treatment, ceiling paint.",
		vatProfile: "standard_20",
		confidenceTier: "high",
		uncertainty: { min: 5000, mode: 8333, max: 13333 },
		mandatory: false,
		phase: "fit-out",
	},
	{
		id: "equipment",
		name: "Sound, POS, furniture",
		estimatedNet: 8333,
		notes: "Industry mid-range: \u20ac10,000\u2013\u20ac15,000.",
		vatProfile: "standard_20",
		confidenceTier: "high",
		uncertainty: { min: 5000, mode: 8333, max: 13333 },
		mandatory: false,
		phase: "commissioning",
	},
	{
		id: "fire-safety",
		name: "Fire safety & emergency systems",
		estimatedNet: 2917,
		notes:
			"TRVB 124 F: 1\u00d7 6kg ABC per 200m\u00b2. Brandschutzplaner required.",
		vatProfile: "standard_20",
		confidenceTier: "low",
		uncertainty: { min: 2625, mode: 2917, max: 3355 },
		mandatory: true,
		phase: "fit-out",
	},
	{
		id: "permits",
		name: "Permits, architect, fees",
		estimatedNet: 9500,
		notes:
			"Baubewilligung, Energieausweis, structural calculations. Gov fees are VAT-exempt.",
		vatProfile: "exempt",
		confidenceTier: "medium",
		uncertainty: { min: 7600, mode: 9500, max: 12350 },
		mandatory: true,
		phase: "pre-construction",
	},
	{
		id: "insurance",
		name: "Insurance (annual)",
		estimatedNet: 2200,
		notes:
			"Betriebshaftpflicht. Annual \u2014 multiply by operating years for total.",
		vatProfile: "exempt",
		confidenceTier: "fixed",
		uncertainty: { min: 2156, mode: 2200, max: 2244 },
		mandatory: true,
		phase: "ongoing",
	},
	{
		id: "lightning-protection",
		name: "Lightning protection (Blitzschutz)",
		estimatedNet: 3500,
		notes:
			"Explicitly excluded from BORGA offer. Required for commercial buildings.",
		vatProfile: "standard_20",
		confidenceTier: "medium",
		uncertainty: { min: 2800, mode: 3500, max: 4550 },
		mandatory: true,
		phase: "construction",
	},
	{
		id: "grid-connection",
		name: "Grid connection (Stromanschluss)",
		estimatedNet: 2500,
		notes: "Netz O\u00d6 connection fee. Varies by distance from supply.",
		vatProfile: "standard_20",
		confidenceTier: "medium",
		uncertainty: { min: 2000, mode: 2500, max: 3250 },
		mandatory: true,
		phase: "pre-construction",
	},
	{
		id: "water-connection",
		name: "Water & sewer connection",
		estimatedNet: 1500,
		notes: "Municipal water/Kanal connection. Varies by Gemeinde.",
		vatProfile: "standard_20",
		confidenceTier: "medium",
		uncertainty: { min: 1200, mode: 1500, max: 1950 },
		mandatory: true,
		phase: "pre-construction",
	},
];
