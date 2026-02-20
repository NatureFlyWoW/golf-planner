export type BudgetCategory = {
	id: string;
	name: string;
	estimated: number;
	actual: number;
	notes: string;
};

export type BudgetConfig = {
	costPerHole: number;
};
