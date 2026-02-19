// src/components/ui/SunControls.tsx
import { useState } from "react";

type SunControlsProps = {
	selectedDate: Date | undefined;
	onDateChange: (date: Date | undefined) => void;
};

const PRESETS = [
	{ label: "Now", date: undefined },
	{ label: "Summer noon", date: new Date(2026, 5, 21, 12, 0) },
	{ label: "Winter noon", date: new Date(2026, 11, 21, 12, 0) },
] as const;

export function SunControls({ selectedDate, onDateChange }: SunControlsProps) {
	const [showCustom, setShowCustom] = useState(false);

	const activePreset =
		selectedDate === undefined
			? "Now"
			: (PRESETS.find(
					(p) => p.date && p.date.getTime() === selectedDate.getTime(),
				)?.label ?? "Custom");

	return (
		<div className="absolute bottom-10 left-2 z-10 flex flex-col gap-1">
			<div className="flex gap-1">
				{PRESETS.map(({ label, date }) => (
					<button
						key={label}
						type="button"
						onClick={() => {
							onDateChange(date);
							setShowCustom(false);
						}}
						className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
							activePreset === label
								? "bg-amber-500 text-white"
								: "bg-gray-800/70 text-gray-200 hover:bg-gray-700/70"
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
							? "bg-amber-500 text-white"
							: "bg-gray-800/70 text-gray-200 hover:bg-gray-700/70"
					}`}
				>
					Custom
				</button>
			</div>
			{showCustom && (
				<div className="flex gap-1 rounded bg-gray-800/80 p-2">
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
						className="rounded bg-gray-700 px-1 py-0.5 text-xs text-white"
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
						className="rounded bg-gray-700 px-1 py-0.5 text-xs text-white"
					/>
				</div>
			)}
		</div>
	);
}
