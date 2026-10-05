import { Icon, Text } from "@bug-on/m3-expressive";
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
			<div className="flex size-16 items-center justify-center rounded-2xl bg-m3-surface-container-lowest text-m3-on-surface-variant shadow-xs">
				<Icon name={icon} size={40} className="text-m3-on-surface-variant" />
			</div>
			<div>
				<Text variant="headline-sm" className="text-m3-on-surface">
					{title}
				</Text>
				{description && (
					<Text
						variant="body-md"
						className="mt-1 text-m3-on-surface-variant"
					>
						{description}
					</Text>
				)}
			</div>
			{action && <div className="mt-1">{action}</div>}
		</div>
	);
}
