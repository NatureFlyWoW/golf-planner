// src/components/ui/SunControls.tsx
import { useState } from "react";
import { SUN_PRESETS } from "../../constants/sunPresets";
import { useStore } from "../../store";

export function SunControls() {
	const selectedDate = useStore((s) => s.ui.sunDate);
	const onDateChange = useStore((s) => s.setSunDate);
	const [showCustom, setShowCustom] = useState(false);

	const activePreset =
		selectedDate === undefined
			? "Now"
			: (SUN_PRESETS.find(
					(p) => p.date && p.date.getTime() === selectedDate.getTime(),
				)?.label ?? "Custom");

	return (
		<div className="hidden absolute bottom-10 left-2 z-10 flex-col gap-1 md:flex">
			<div className="flex gap-1">
				{SUN_PRESETS.map(({ label, date }) => (
					<button
						key={label}
						type="button"
						onClick={() => {
							onDateChange(date);
							setShowCustom(false);
						}}
						className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
							activePreset === label
								? "bg-neon-amber text-white"
								: "bg-plasma/70 text-text-secondary hover:bg-plasma"
						}`}
					>
						{label}
					</button>
				))}
				<button
					type="button"
					onClick={() => setShowCustom(!showCustom)}
					className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
						activePreset === "Custom"
							? "bg-neon-amber text-white"
							: "bg-plasma/70 text-text-secondary hover:bg-plasma"
					}`}
				>
					Custom
				</button>
			</div>
			{showCustom && (
				<div className="flex gap-1 rounded bg-surface/80 p-2">
					<input
						type="date"
						defaultValue="2026-06-21"
						onChange={(e) => {
							const val = e.target.value;
							if (!val) return;
							const [y, m, d] = val.split("-").map(Number);
							const time = selectedDate ?? new Date();
							onDateChange(
								new Date(y, m - 1, d, time.getHours(), time.getMinutes()),
							);
						}}
						className="rounded bg-plasma px-1 py-0.5 text-xs text-primary"
					/>
					<input
						type="time"
						defaultValue="12:00"
						onChange={(e) => {
							const val = e.target.value;
							if (!val) return;
							const [h, min] = val.split(":").map(Number);
							const base = selectedDate ?? new Date(2026, 5, 21);
							onDateChange(
								new Date(
									base.getFullYear(),
									base.getMonth(),
									base.getDate(),
									h,
									min,
								),
							);
						}}
						className="rounded bg-plasma px-1 py-0.5 text-xs text-primary"
					/>
				</div>
			)}
		</div>
	);
}
