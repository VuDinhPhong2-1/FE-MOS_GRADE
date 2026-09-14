import { Icon } from "@bug-on/m3-expressive";
import type { TableEmptyStateProps } from "./types";

export function TableEmptyState({
	icon = "search_off",
	title,
	description,
	action,
	className = "",
}: TableEmptyStateProps) {
	return (
		<div
			className={`mx-auto flex max-w-sm flex-col items-center justify-center gap-3 px-6 py-12 text-center ${className}`}
		>
			<div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-m3-surface-container-high text-m3-on-surface-variant shadow-xs">
				<Icon name={icon} className="text-3xl" />
			</div>
			<div>
				<p className="font-bold text-m3-on-surface">{title}</p>
				{description && (
					<p className="mt-1 text-xs text-m3-on-surface-variant">
						{description}
					</p>
				)}
			</div>
			{action && <div className="mt-1">{action}</div>}
		</div>
	);
}
