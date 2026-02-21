import { useState } from "react";
import { useStore } from "../../store";
import { computeCategoryActual } from "../../store/selectors";

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
	const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
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
				<span className="text-[10px] text-text-muted">
					Expenses ({catExpenses.length})
				</span>
				<span className="text-xs font-medium">
					{"\u20AC"}
					{total.toLocaleString("de-AT", { maximumFractionDigits: 0 })}
				</span>
			</div>

			{/* Expense list */}
			{catExpenses.length > 0 && (
				<div className="flex flex-col gap-0.5">
					{catExpenses.map((exp) => (
						<div
							key={exp.id}
							className="flex items-center justify-between rounded bg-surface-raised px-2 py-1"
						>
							<div className="flex flex-col">
								<span className="text-[10px] text-text-secondary">
									{exp.date} — {exp.vendor || "No vendor"}
								</span>
								{exp.note && (
									<span className="text-[9px] text-text-muted">{exp.note}</span>
								)}
							</div>
							<div className="flex items-center gap-1">
								<span className="text-xs font-medium">
									{"\u20AC"}
									{exp.amount.toLocaleString("de-AT", {
										maximumFractionDigits: 0,
									})}
								</span>
								<button
									type="button"
									onClick={() => deleteExpense(exp.id)}
									className="rounded p-0.5 text-[10px] text-text-muted hover:text-neon-pink"
									title="Delete expense"
								>
									{"\u2715"}
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{/* Add expense form */}
			{showForm ? (
				<div className="flex flex-col gap-1.5 rounded border border-subtle bg-surface-raised p-2">
					<div className="flex gap-1">
						<input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							className="flex-1 rounded border border-subtle bg-surface px-1.5 py-1 text-[10px] text-primary"
						/>
						<div className="flex items-center gap-0.5">
							<span className="text-[10px] text-text-muted">{"\u20AC"}</span>
							<input
								type="number"
								value={amount}
								min={0}
								placeholder="Amount"
								onChange={(e) => setAmount(e.target.value)}
								className="w-20 rounded border border-subtle px-1.5 py-1 text-[10px]"
							/>
						</div>
					</div>
					<input
						type="text"
						value={vendor}
						placeholder="Vendor (optional)"
						onChange={(e) => setVendor(e.target.value)}
						className="rounded border border-subtle bg-surface px-1.5 py-1 text-[10px] text-primary"
					/>
					<input
						type="text"
						value={note}
						placeholder="Note (optional)"
						onChange={(e) => setNote(e.target.value)}
						className="rounded border border-subtle bg-surface px-1.5 py-1 text-[10px] text-primary"
					/>
					<div className="flex justify-end gap-1">
						<button
							type="button"
							onClick={() => setShowForm(false)}
							className="rounded px-2 py-1 text-[10px] text-text-secondary hover:bg-plasma"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleAdd}
							className="rounded bg-accent-text px-2 py-1 text-[10px] text-white hover:bg-accent-text/80"
						>
							Add
						</button>
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setShowForm(true)}
					className="rounded border border-dashed border-grid-ghost px-2 py-1 text-[10px] text-text-muted hover:bg-plasma hover:text-text-secondary"
				>
					+ Add expense
				</button>
			)}
		</div>
	);
}
