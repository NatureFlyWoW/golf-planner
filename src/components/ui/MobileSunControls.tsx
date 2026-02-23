import { useState } from "react";
import { SUN_PRESETS } from "../../constants/sunPresets";
import { useStore } from "../../store";

export function MobileSunControls() {
	const activePanel = useStore((s) => s.ui.activePanel);
	const setActivePanel = useStore((s) => s.setActivePanel);
	const selectedDate = useStore((s) => s.ui.sunDate);
	const setSunDate = useStore((s) => s.setSunDate);
	const [showCustom, setShowCustom] = useState(false);

	if (activePanel !== "sun") return null;

	const activePreset =
		selectedDate === undefined
			? "Now"
			: (SUN_PRESETS.find(
					(p) => p.date && p.date.getTime() === selectedDate.getTime(),
				)?.label ?? "Custom");

	function handleClose() {
		setActivePanel(null);
	}

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-surface md:hidden">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-subtle px-4 py-3">
				<span className="text-base font-semibold">Sun Position</span>
				<button
					type="button"
					onClick={handleClose}
					className="rounded-lg p-2 text-text-muted hover:bg-plasma hover:text-text-secondary"
				>
					<span className="text-xl">&#x2715;</span>
				</button>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto p-4">
				<div className="flex flex-col gap-4">
					{/* Presets */}
					<div className="flex flex-col gap-1.5">
						<span className="text-sm font-medium text-text-secondary">
							Presets
						</span>
						<div className="flex gap-2">
							{SUN_PRESETS.map(({ label, date }) => (
								<button
									key={label}
									type="button"
									onClick={() => {
										setSunDate(date);
										setShowCustom(false);
									}}
									className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
										activePreset === label
											? "bg-neon-amber text-white"
											: "bg-surface text-primary active:bg-plasma"
									}`}
								>
									{label}
								</button>
							))}
						</div>
					</div>

					{/* Custom toggle */}
					<button
						type="button"
						onClick={() => setShowCustom(!showCustom)}
						className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
							activePreset === "Custom"
								? "bg-neon-amber text-white"
								: "bg-surface text-primary active:bg-plasma"
						}`}
					>
						Custom Date & Time
					</button>

					{/* Custom date/time inputs */}
					{showCustom && (
						<div className="flex flex-col gap-3">
							<label className="flex flex-col gap-1.5">
								<span className="text-sm font-medium text-text-secondary">
									Date
								</span>
								<input
									type="date"
									defaultValue="2026-06-21"
									onChange={(e) => {
										const val = e.target.value;
										if (!val) return;
										const [y, m, d] = val.split("-").map(Number);
										const time = selectedDate ?? new Date();
										setSunDate(
											new Date(y, m - 1, d, time.getHours(), time.getMinutes()),
										);
									}}
									className="rounded-lg border border-subtle px-3 py-2.5 text-base"
								/>
							</label>
							<label className="flex flex-col gap-1.5">
								<span className="text-sm font-medium text-text-secondary">
									Time
								</span>
								<input
									type="time"
									defaultValue="12:00"
									onChange={(e) => {
										const val = e.target.value;
										if (!val) return;
										const [h, min] = val.split(":").map(Number);
										const base = selectedDate ?? new Date(2026, 5, 21);
										setSunDate(
											new Date(
												base.getFullYear(),
												base.getMonth(),
												base.getDate(),
												h,
												min,
											),
										);
									}}
									className="rounded-lg border border-subtle px-3 py-2.5 text-base"
								/>
							</label>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
