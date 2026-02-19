import { useStore } from "../../store";
import type { Tool } from "../../types";

const tools: { tool: Tool; label: string; icon: string }[] = [
	{ tool: "select", label: "Select", icon: "\u2196" },
	{ tool: "place", label: "Place", icon: "+" },
	{ tool: "delete", label: "Delete", icon: "\u2715" },
];

export function Toolbar() {
	const activeTool = useStore((s) => s.ui.tool);
	const setTool = useStore((s) => s.setTool);

	return (
		<div className="flex items-center gap-1 border-b border-gray-200 bg-white px-3 py-2">
			{tools.map(({ tool, label, icon }) => (
				<button
					type="button"
					key={tool}
					onClick={() => setTool(tool)}
					className={`rounded px-3 py-1.5 text-sm font-medium transition-colors ${
						activeTool === tool
							? "bg-blue-600 text-white"
							: "bg-gray-100 text-gray-700 hover:bg-gray-200"
					}`}
				>
					<span className="mr-1">{icon}</span>
					{label}
				</button>
			))}
		</div>
	);
}
