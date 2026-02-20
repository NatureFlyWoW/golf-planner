# Task 4: Financial Settings Modal

**Goal:** Create a modal component accessible from BudgetPanel header for configuring VAT registration, display mode, build mode, inflation factor, and risk tolerance.

**Files:**
- Create: `src/components/ui/FinancialSettingsModal.tsx` (new component)
- Modify: `src/components/ui/BudgetPanel.tsx:58-80` (add gear icon to header)

**Depends on:** Task 2 (store has `financialSettings` + `setFinancialSettings`)

---

## Step 1: Create the FinancialSettingsModal component

Create `src/components/ui/FinancialSettingsModal.tsx`:

```typescript
import { useStore } from "../../store";
import type { BuildMode, RiskTolerance } from "../../types/budget";

type Props = {
	onClose: () => void;
};

const RISK_OPTIONS: { value: RiskTolerance; label: string; desc: string }[] = [
	{ value: "optimistic", label: "Optimistic", desc: "~P60 confidence" },
	{ value: "balanced", label: "Balanced", desc: "~P80 confidence" },
	{ value: "conservative", label: "Conservative", desc: "~P95 confidence" },
];

const BUILD_OPTIONS: { value: BuildMode; label: string; desc: string }[] = [
	{ value: "diy", label: "DIY", desc: "Material costs only" },
	{ value: "professional", label: "Professional", desc: "Installed by contractors" },
	{ value: "mixed", label: "Mixed", desc: "Custom per-type costs" },
];

const DISPLAY_OPTIONS = [
	{ value: "net" as const, label: "Net (excl. MwSt)" },
	{ value: "gross" as const, label: "Gross (incl. MwSt)" },
	{ value: "both" as const, label: "Both" },
];

export function FinancialSettingsModal({ onClose }: Props) {
	const settings = useStore((s) => s.financialSettings);
	const setSettings = useStore((s) => s.setFinancialSettings);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
			role="presentation"
			onClick={onClose}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: modal content */}
			<div
				className="mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-white shadow-xl"
				role="presentation"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
					<span className="text-sm font-semibold">Financial Settings</span>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
					>
						<span className="text-lg">✕</span>
					</button>
				</div>

				<div className="flex flex-col gap-4 px-4 py-3">
					{/* VAT Registration */}
					<div>
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={settings.vatRegistered}
								onChange={(e) =>
									setSettings({ vatRegistered: e.target.checked })
								}
								className="h-4 w-4 rounded border-gray-300"
							/>
							<span className="text-xs font-medium text-gray-700">
								VAT registered (Vorsteuerabzugsberechtigt)
							</span>
						</label>
						<p className="mt-1 text-[10px] text-gray-400">
							When enabled, shows reclaimable Vorsteuer and net-basis budgeting.
						</p>
					</div>

					{/* Display Mode */}
					<div>
						<span className="text-[10px] font-medium text-gray-500 uppercase">
							Display Mode
						</span>
						<div className="mt-1 flex gap-1">
							{DISPLAY_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => setSettings({ displayMode: opt.value })}
									className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] ${
										settings.displayMode === opt.value
											? "bg-blue-500 text-white"
											: "bg-gray-100 text-gray-600 hover:bg-gray-200"
									}`}
								>
									{opt.label}
								</button>
							))}
						</div>
					</div>

					{/* Risk Tolerance */}
					<div>
						<span className="text-[10px] font-medium text-gray-500 uppercase">
							Risk Tolerance
						</span>
						<div className="mt-1 flex flex-col gap-1">
							{RISK_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() =>
										setSettings({ riskTolerance: opt.value })
									}
									className={`flex items-baseline justify-between rounded-lg px-3 py-2 text-left ${
										settings.riskTolerance === opt.value
											? "bg-blue-50 ring-1 ring-blue-500"
											: "bg-gray-50 hover:bg-gray-100"
									}`}
								>
									<span className="text-xs font-medium">{opt.label}</span>
									<span className="text-[10px] text-gray-400">
										{opt.desc}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Build Mode */}
					<div>
						<span className="text-[10px] font-medium text-gray-500 uppercase">
							Build Mode (Course Costs)
						</span>
						<div className="mt-1 flex flex-col gap-1">
							{BUILD_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() =>
										setSettings({ buildMode: opt.value })
									}
									className={`flex items-baseline justify-between rounded-lg px-3 py-2 text-left ${
										settings.buildMode === opt.value
											? "bg-blue-50 ring-1 ring-blue-500"
											: "bg-gray-50 hover:bg-gray-100"
									}`}
								>
									<span className="text-xs font-medium">{opt.label}</span>
									<span className="text-[10px] text-gray-400">
										{opt.desc}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Inflation Adjustment */}
					<div>
						<label className="flex flex-col gap-1">
							<span className="text-[10px] font-medium text-gray-500 uppercase">
								Inflation Adjustment
							</span>
							<div className="flex items-center gap-2">
								<input
									type="number"
									value={Math.round((settings.inflationFactor - 1) * 100)}
									min={-10}
									max={50}
									step={1}
									onChange={(e) =>
										setSettings({
											inflationFactor: 1 + Number(e.target.value) / 100,
										})
									}
									className="w-20 rounded border border-gray-200 px-2 py-1 text-xs"
								/>
								<span className="text-xs text-gray-500">%</span>
							</div>
							{settings.inflationFactor !== 1 && (
								<p className="text-[10px] text-amber-600">
									Estimates adjusted for{" "}
									{Math.round((settings.inflationFactor - 1) * 100)}% inflation
									(non-fixed categories only).
								</p>
							)}
						</label>
					</div>
				</div>

				{/* Footer */}
				<div className="flex justify-end border-t border-gray-200 px-4 py-3">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg bg-blue-500 px-4 py-1.5 text-xs text-white hover:bg-blue-600"
					>
						Done
					</button>
				</div>
			</div>
		</div>
	);
}
```

## Step 2: Add gear icon to BudgetPanel header

In `src/components/ui/BudgetPanel.tsx`, add state and button for the settings modal.

Add import at top:

```typescript
import { FinancialSettingsModal } from "./FinancialSettingsModal";
```

Add state inside BudgetPanel component (after `showSettings` state):

```typescript
const [showFinancialSettings, setShowFinancialSettings] = useState(false);
```

Add gear icon button in the summary header `<div>` (at line 58, inside the border-b div, before the Estimated row):

```typescript
<div className="flex items-center justify-between">
	<span className="text-xs font-semibold text-gray-700">Budget</span>
	<button
		type="button"
		onClick={() => setShowFinancialSettings(true)}
		className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
		title="Financial Settings"
	>
		<span className="text-sm">⚙</span>
	</button>
</div>
```

Add the modal render at the end (before the closing `</div>` of the component, after the CostSettingsModal):

```typescript
{showFinancialSettings && (
	<FinancialSettingsModal onClose={() => setShowFinancialSettings(false)} />
)}
```

## Step 3: Run type check

```bash
cd golf-planner && npx tsc --noEmit
```

Expected: Clean.

## Step 4: Run full test suite

```bash
cd golf-planner && npm run test -- --run
```

Expected: All tests pass.

## Step 5: Commit

```bash
git add src/components/ui/FinancialSettingsModal.tsx src/components/ui/BudgetPanel.tsx
git commit -m "feat(phase8): add financial settings modal with VAT, risk, build mode"
```
