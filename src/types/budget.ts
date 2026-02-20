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
