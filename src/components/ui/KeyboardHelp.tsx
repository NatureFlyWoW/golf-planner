import { useState } from "react";

const SHORTCUTS = [
	{ key: "R", action: "Reset view" },
	{ key: "F", action: "Fit to content" },
	{ key: "+ / -", action: "Zoom in / out" },
	{ key: "0", action: "Reset zoom" },
	{ key: "Arrows", action: "Pan" },
] as const;

export function KeyboardHelp() {
	const [open, setOpen] = useState(false);

	return (
		<div className="hidden md:block absolute bottom-2 left-2 z-10">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				onMouseEnter={() => setOpen(true)}
				onMouseLeave={() => setOpen(false)}
				className="flex h-6 w-6 items-center justify-center rounded-full bg-plasma/70 text-xs text-text-secondary hover:bg-plasma"
			>
				?
			</button>
			{open && (
				<div className="absolute bottom-8 left-0 rounded bg-surface/90 p-2 shadow-lg">
					<table className="text-xs text-text-secondary">
						<tbody>
							{SHORTCUTS.map(({ key, action }) => (
								<tr key={key}>
									<td className="pr-3 font-mono text-primary">{key}</td>
									<td className="whitespace-nowrap">{action}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
