import { Icon } from "@bug-on/m3-expressive";
import type { RowData, TableFeatures } from "@tanstack/react-table";
import { cn } from "../../utils/utils";
import type { SortableHeaderProps } from "./types";

interface ColumnWithSortingMethods {
	getCanSort?: () => boolean;
	getIsSorted?: () => false | "asc" | "desc";
	getToggleSortingHandler?: () => ((event: unknown) => void) | undefined;
}

export function SortableHeader<
	TFeatures extends TableFeatures,
	TData extends RowData,
	TValue = unknown,
>({
	header,
	title,
	align = "left",
	className = "",
	children,
}: SortableHeaderProps<TFeatures, TData, TValue>) {
	const sortableCol = header.column as unknown as ColumnWithSortingMethods;
	const canSort = Boolean(sortableCol.getCanSort?.());
	const isSorted = sortableCol.getIsSorted?.() || false;

	const content =
		children ??
		title ??
		(typeof header.column.columnDef.header === "string"
			? header.column.columnDef.header
			: null);

	if (!canSort) {
		return (
			<div
				className={cn(
					"inline-flex h-8 items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant",
					align === "center"
						? "justify-center text-center"
						: align === "right"
							? "justify-end text-right"
							: "justify-start text-left",
					className,
				)}
			>
				{content}
			</div>
		);
	}

	const toggleSortingHandler = sortableCol.getToggleSortingHandler?.();
	const sortDescription =
		isSorted === "asc"
			? "Đang sắp xếp tăng dần. Bấm để sắp xếp giảm dần."
			: isSorted === "desc"
				? "Đang sắp xếp giảm dần. Bấm để hủy sắp xếp."
				: "Bấm để sắp xếp";

	return (
		<button
			type="button"
			onClick={toggleSortingHandler}
			className={cn(
				"group -mx-2 inline-flex h-8 cursor-pointer select-none items-center gap-1.5 rounded-lg px-2 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-m3-surface-container-highest/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary",
				align === "center"
					? "mx-auto justify-center text-center"
					: align === "right"
						? "ml-auto justify-end text-right"
						: "justify-start text-left",
				className,
			)}
			title={sortDescription}
			aria-label={`${typeof content === "string" ? content : "Cột"}: ${sortDescription}`}
		>
			<span
				className={cn(
					"truncate font-bold uppercase tracking-wider",
					isSorted ? "text-m3-primary" : "text-m3-on-surface-variant",
				)}
			>
				{content}
			</span>
			<span className="flex h-4 w-4 shrink-0 items-center justify-center">
				{isSorted === "asc" ? (
					<Icon
						name="arrow_upward"
						className="text-sm text-m3-primary transition-transform duration-200"
					/>
				) : isSorted === "desc" ? (
					<Icon
						name="arrow_downward"
						className="text-sm text-m3-primary transition-transform duration-200"
					/>
				) : (
					<Icon
						name="unfold_more"
						className="text-sm text-m3-outline opacity-0 transition-opacity duration-150 group-hover:opacity-100"
					/>
				)}
			</span>
		</button>
	);
}
