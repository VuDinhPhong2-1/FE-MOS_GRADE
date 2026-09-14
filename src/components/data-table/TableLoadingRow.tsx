import { ProgressIndicator } from "@bug-on/m3-expressive";

export interface TableLoadingRowProps {
	colSpan: number;
	message?: string;
}

export function TableLoadingRow({
	colSpan,
	message = "Đang tải dữ liệu...",
}: TableLoadingRowProps) {
	return (
		<tr>
			<td colSpan={colSpan} className="px-6 py-12 text-center">
				<div className="mx-auto flex max-w-xs flex-col items-center justify-center gap-4">
					<ProgressIndicator
						variant="circular"
						shape="wavy"
						size={40}
						aria-label={message}
					/>
					<p className="text-sm font-medium text-m3-on-surface-variant">
						{message}
					</p>
				</div>
			</td>
		</tr>
	);
}

export function TableLoadingBar({
	ariaLabel = "Đang tải dữ liệu",
}: {
	ariaLabel?: string;
}) {
	return (
		<div className="absolute top-0 left-0 right-0 z-10">
			<ProgressIndicator
				variant="linear"
				trackShape="flat"
				shape="flat"
				showStopIndicator
				aria-label={ariaLabel}
				className="w-full"
			/>
		</div>
	);
}
