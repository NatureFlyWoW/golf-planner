import { useStore } from "../../store";
import type { BuildMode, RiskTolerance } from "../../types/budget";
import type { GpuTierOverride } from "../../types/ui";

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
	{
		value: "professional",
		label: "Professional",
		desc: "Installed by contractors",
	},
	{ value: "mixed", label: "Mixed", desc: "Custom per-type costs" },
];

const GPU_TIER_OPTIONS: { value: GpuTierOverride; label: string }[] = [
	{ value: "auto", label: "Auto" },
	{ value: "low", label: "Low" },
	{ value: "mid", label: "Mid" },
	{ value: "high", label: "High" },
];

const DISPLAY_OPTIONS = [
	{ value: "net" as const, label: "Net (excl. MwSt)" },
	{ value: "gross" as const, label: "Gross (incl. MwSt)" },
	{ value: "both" as const, label: "Both" },
];

export function FinancialSettingsModal({ onClose }: Props) {
	const settings = useStore((s) => s.financialSettings);
	const setSettings = useStore((s) => s.setFinancialSettings);
	const gpuTierOverride = useStore((s) => s.gpuTierOverride);
	const gpuTier = useStore((s) => s.ui.gpuTier);
	const setGpuTierOverride = useStore((s) => s.setGpuTierOverride);
	const setGpuTier = useStore((s) => s.setGpuTier);
	const uvTransitionEnabled = useStore((s) => s.uvTransitionEnabled);
	const setUvTransitionEnabled = useStore((s) => s.setUvTransitionEnabled);

	return (
		// biome-ignore lint/a11y/noStaticElementInteractions: backdrop dismiss
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
			role="presentation"
			onClick={onClose}
		>
			{/* biome-ignore lint/a11y/noStaticElementInteractions: modal content */}
			<div
				className="mx-4 max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-surface-raised shadow-xl"
				role="presentation"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				{/* Header */}
				<div className="flex items-center justify-between border-b border-subtle px-4 py-3">
					<span className="text-sm font-semibold">Financial Settings</span>
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg p-1 text-text-muted hover:bg-plasma hover:text-text-secondary"
					>
						<span className="text-lg">{"\u2715"}</span>
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
								className="h-4 w-4 rounded border-subtle"
							/>
							<span className="text-xs font-medium text-primary">
								VAT registered (Vorsteuerabzugsberechtigt)
							</span>
						</label>
						<p className="mt-1 text-[10px] text-text-muted">
							When enabled, shows reclaimable Vorsteuer and net-basis budgeting.
						</p>
					</div>

					{/* Display Mode */}
					<div>
						<span className="text-[10px] font-medium text-text-secondary uppercase">
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
											? "bg-accent-text text-white"
											: "bg-surface text-text-secondary hover:bg-plasma"
									}`}
								>
									{opt.label}
								</button>
							))}
						</div>
					</div>

					{/* Risk Tolerance */}
					<div>
						<span className="text-[10px] font-medium text-text-secondary uppercase">
							Risk Tolerance
						</span>
						<div className="mt-1 flex flex-col gap-1">
							{RISK_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => setSettings({ riskTolerance: opt.value })}
									className={`flex items-baseline justify-between rounded-lg px-3 py-2 text-left ${
										settings.riskTolerance === opt.value
											? "bg-plasma ring-1 ring-accent-text"
											: "bg-surface-raised hover:bg-plasma"
									}`}
								>
									<span className="text-xs font-medium">{opt.label}</span>
									<span className="text-[10px] text-text-muted">
										{opt.desc}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Build Mode */}
					<div>
						<span className="text-[10px] font-medium text-text-secondary uppercase">
							Build Mode (Course Costs)
						</span>
						<div className="mt-1 flex flex-col gap-1">
							{BUILD_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => setSettings({ buildMode: opt.value })}
									className={`flex items-baseline justify-between rounded-lg px-3 py-2 text-left ${
										settings.buildMode === opt.value
											? "bg-plasma ring-1 ring-accent-text"
											: "bg-surface-raised hover:bg-plasma"
									}`}
								>
									<span className="text-xs font-medium">{opt.label}</span>
									<span className="text-[10px] text-text-muted">
										{opt.desc}
									</span>
								</button>
							))}
						</div>
					</div>

					{/* Inflation Adjustment */}
					<div>
						<label className="flex flex-col gap-1">
							<span className="text-[10px] font-medium text-text-secondary uppercase">
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
									className="w-20 rounded border border-subtle px-2 py-1 font-mono text-xs"
								/>
								<span className="text-xs text-text-secondary">%</span>
							</div>
							{settings.inflationFactor !== 1 && (
								<p className="text-[10px] text-neon-amber">
									Estimates adjusted for{" "}
									{Math.round((settings.inflationFactor - 1) * 100)}% inflation
									(non-fixed categories only).
								</p>
							)}
						</label>
					</div>

					{/* GPU Quality */}
					<div>
						<span className="text-[10px] font-medium text-text-secondary uppercase">
							GPU Quality
						</span>
						<div className="mt-1 flex gap-1">
							{GPU_TIER_OPTIONS.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => {
										setGpuTierOverride(opt.value);
										if (opt.value !== "auto") {
											setGpuTier(opt.value);
										}
									}}
									className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] ${
										gpuTierOverride === opt.value
											? "bg-accent-text text-white"
											: "bg-surface text-text-secondary hover:bg-plasma"
									}`}
								>
									{opt.value === "auto" ? `Auto (${gpuTier})` : opt.label}
								</button>
							))}
						</div>
						<p className="mt-1 text-[10px] text-text-muted">
							Controls 3D rendering quality. Lower = better performance.
						</p>
					</div>

					{/* UV Transition Animation */}
					<div>
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={uvTransitionEnabled}
								onChange={(e) => setUvTransitionEnabled(e.target.checked)}
								className="h-4 w-4 rounded border-subtle"
							/>
							<span className="text-xs font-medium text-primary">
								UV transition animation
							</span>
						</label>
						<p className="mt-1 text-[10px] text-text-muted">
							Play theatrical lighting transition when toggling UV mode.
						</p>
					</div>
				</div>

				{/* Footer */}
				<div className="flex justify-end border-t border-subtle px-4 py-3">
					<button
						type="button"
						onClick={onClose}
						className="rounded-lg bg-accent-text px-4 py-1.5 text-xs text-white hover:bg-accent-text/80"
					>
						Done
					</button>
				</div>
			</div>
		</div>
	);
}
