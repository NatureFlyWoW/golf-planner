# Task 6: Simple Expense Tracking

**Goal:** Replace the single `actual` field with an expense list per category. Each category shows an expandable list of `ExpenseEntry` items with inline add/delete. The `actual` total for a category is derived by summing its expenses.

**Files:**
- Create: `src/components/ui/ExpenseList.tsx` (new sub-component)
- Modify: `src/components/ui/BudgetPanel.tsx` (integrate ExpenseList into expanded cards)

**Depends on:** Task 2 (store has `expenses`, `addExpense`, `deleteExpense`)

---

## Step 1: Create the ExpenseList sub-component

Create `src/components/ui/ExpenseList.tsx`:

```typescript
import { useState } from "react";
import { useStore } from "../../store";
import { computeCategoryActual } from "../../store/selectors";
import type { ExpenseEntry } from "../../types/budget";

type Props = {
	categoryId: string;
};

export function ExpenseList({ categoryId }: Props) {
	const expenses = useStore((s) => s.expenses);
	const addExpense = useStore((s) => s.addExpense);
	const deleteExpense = useStore((s) => s.deleteExpense);

	const catExpenses = expenses.filter((e) => e.categoryId === categoryId);
	const total = computeCategoryActual(expenses, categoryId);

	const [showForm, setShowForm] = useState(false);
	const [date, setDate] = useState(
		() => new Date().toISOString().slice(0, 10),
	);
	const [amount, setAmount] = useState("");
	const [vendor, setVendor] = useState("");
	const [note, setNote] = useState("");

	function handleAdd() {
		const amt = Number(amount);
		if (amt <= 0) return;

		addExpense({
			id: crypto.randomUUID(),
			categoryId,
			date,
			amount: amt,
			vendor: vendor.trim(),
			note: note.trim(),
		});

		// Reset form
		setAmount("");
		setVendor("");
		setNote("");
		setShowForm(false);
	}

	return (
		<div className="flex flex-col gap-1">
			<div className="flex items-center justify-between">
				<span className="text-[10px] text-gray-400">
					Expenses ({catExpenses.length})
				</span>
				<span className="text-xs font-medium">
					€{total.toLocaleString("de-AT", { maximumFractionDigits: 0 })}
				</span>
			</div>

			{/* Expense list */}
			{catExpenses.length > 0 && (
				<div className="flex flex-col gap-0.5">
					{catExpenses.map((exp) => (
						<div
							key={exp.id}
							className="flex items-center justify-between rounded bg-gray-50 px-2 py-1"
						>
							<div className="flex flex-col">
								<span className="text-[10px] text-gray-600">
									{exp.date} — {exp.vendor || "No vendor"}
								</span>
								{exp.note && (
									<span className="text-[9px] text-gray-400">
										{exp.note}
									</span>
								)}
							</div>
							<div className="flex items-center gap-1">
								<span className="text-xs font-medium">
									€{exp.amount.toLocaleString("de-AT", { maximumFractionDigits: 0 })}
								</span>
								<button
									type="button"
									onClick={() => deleteExpense(exp.id)}
									className="rounded p-0.5 text-[10px] text-gray-400 hover:text-red-500"
									title="Delete expense"
								>
									✕
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add expense form */}
			{showForm ? (
				<div className="flex flex-col gap-1.5 rounded border border-gray-200 bg-gray-50 p-2">
					<div className="flex gap-1">
						<input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							className="flex-1 rounded border border-gray-200 px-1.5 py-1 text-[10px]"
						/>
						<div className="flex items-center gap-0.5">
							<span className="text-[10px] text-gray-400">€</span>
							<input
								type="number"
								value={amount}
								min={0}
								placeholder="Amount"
								onChange={(e) => setAmount(e.target.value)}
								className="w-20 rounded border border-gray-200 px-1.5 py-1 text-[10px]"
							/>
						</div>
					</div>
					<input
						type="text"
						value={vendor}
						placeholder="Vendor (optional)"
						onChange={(e) => setVendor(e.target.value)}
						className="rounded border border-gray-200 px-1.5 py-1 text-[10px]"
					/>
					<input
						type="text"
						value={note}
						placeholder="Note (optional)"
						onChange={(e) => setNote(e.target.value)}
						className="rounded border border-gray-200 px-1.5 py-1 text-[10px]"
					/>
					<div className="flex justify-end gap-1">
						<button
							type="button"
							onClick={() => setShowForm(false)}
							className="rounded px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-200"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleAdd}
							className="rounded bg-blue-500 px-2 py-1 text-[10px] text-white hover:bg-blue-600"
						>
							Add
						</button>
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setShowForm(true)}
					className="rounded border border-dashed border-gray-300 px-2 py-1 text-[10px] text-gray-400 hover:bg-gray-50 hover:text-gray-600"
				>
					+ Add expense
				</button>
			)}
		</div>
	);
}
```

## Step 2: Integrate ExpenseList into BudgetPanel expanded cards

In `src/components/ui/BudgetPanel.tsx`, add import:

```typescript
import { ExpenseList } from "./ExpenseList";
```

In the expanded card section (the `isExpanded` block), **replace the old "Actual" input** with the ExpenseList component. After the notes `<textarea>`, add:

```typescript
{/* Expense tracking */}
<ExpenseList categoryId={cat.id} />
```

## Step 3: Update progress bar to use derived actual

The progress bar should use derived actual from expenses. Add a helper at the top of the component (after existing hooks):

```typescript
const expenses = useStore((s) => s.expenses);
```

Then in the category map, compute actual from expenses:

```typescript
const catActual = expenses
	.filter((e) => e.categoryId === cat.id)
	.reduce((sum, e) => sum + e.amount, 0);
const ratio = displayNet > 0 ? catActual / displayNet : 0;
```

And display `catActual` in the card body:

```typescript
<div className="flex items-center gap-1">
	<span className="text-[10px] text-gray-400">Spent</span>
	<span className="text-xs font-medium">
		{displayEur(catActual)}
	</span>
</div>
```

## Step 4: Run type check and tests

```bash
cd golf-planner && npx tsc --noEmit && npm run test -- --run
```

Expected: All tests pass.

## Step 5: Commit

```bash
git add src/components/ui/ExpenseList.tsx src/components/ui/BudgetPanel.tsx
git commit -m "feat(phase8): add expense tracking with per-category inline lists"
```
