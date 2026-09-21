import { Card } from "@bug-on/m3-expressive";
import type {
	Cell,
	CellData,
	Row,
	RowData,
	TableFeatures,
} from "@tanstack/react-table";
import type React from "react";
import { Fragment } from "react";
import { cn } from "../../utils/utils";
import { TableLoadingBar } from "./TableLoadingRow";
import type { DataTableColumnMeta, DataTableProps } from "./types";

interface TableWithVisibility<
	_TFeatures extends TableFeatures,
	_TData extends RowData,
> {
	getVisibleLeafColumns(): unknown[];
}

interface RowWithVisibility<
	TFeatures extends TableFeatures,
	TData extends RowData,
> {
	getVisibleCells(): Array<Cell<TFeatures, TData, CellData>>;
}

export function DataTable<
	TFeatures extends TableFeatures,
	TData extends RowData,
>({
	table,
	isLoading = false,
	loadingAriaLabel = "Đang tải dữ liệu",
	emptyState,
	headerSlot,
	footerSlot,
	className = "",
	tableClassName = "",
	headerRowClassName = "",
	bodyClassName = "",
	onRowClick,
	getRowClassName,
	renderRow,
	renderCell,
	minWidthClassName = "w-full",
	banded = true,
	"data-student-scroll-container": dataStudentScrollContainer,
}: DataTableProps<TFeatures, TData>) {
	const headerGroups = table.getHeaderGroups();
	const rows = table.getRowModel().rows;

	const hasVisibleColumns = (
		t: unknown,
	): t is TableWithVisibility<TFeatures, TData> =>
		typeof t === "object" && t !== null && "getVisibleLeafColumns" in t;

	const hasVisibleRowCells = (
		r: unknown,
	): r is RowWithVisibility<TFeatures, TData> =>
		typeof r === "object" && r !== null && "getVisibleCells" in r;

	// Calculate visible column count safely
	const visibleColCount = hasVisibleColumns(table)
		? table.getVisibleLeafColumns().length
		: table.getAllLeafColumns().length;

	const content = (
		<div className="overflow-x-auto">
			<table
				className={`border-collapse text-left ${minWidthClassName} ${tableClassName}`}
			>
				<thead>
					{headerGroups.map((headerGroup) => (
						<tr
							key={headerGroup.id}
							className={cn(
								"h-12 border-b border-m3-outline-variant/60 bg-m3-surface-container-high text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant",
								headerRowClassName,
							)}
						>
							{headerGroup.headers.map((header) => {
								const meta = header.column.columnDef.meta as
									| DataTableColumnMeta
									| undefined;
								const align = meta?.align;
								const alignClass =
									align === "center"
										? "text-center"
										: align === "right"
											? "text-right"
											: "text-left";

								const widthClass = meta?.headerClassName
									? meta.headerClassName
									: (meta?.className
											?.split(" ")
											.filter(
												(c) =>
													c.startsWith("w-") ||
													c.startsWith("min-w-") ||
													c.startsWith("max-w-") ||
													c === "truncate",
											)
											.join(" ") ?? "");

								return (
									<th
										key={header.id}
										colSpan={header.colSpan}
										className={cn(
											"h-12 px-6 py-3.5 align-middle text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant",
											alignClass,
											widthClass,
										)}
									>
										{header.isPlaceholder ? null : (
											<table.FlexRender header={header} />
										)}
									</th>
								);
							})}
						</tr>
					))}
				</thead>
				<tbody
					className={`divide-y divide-m3-outline-variant/40 text-sm ${bodyClassName}`}
				>
					{rows.length === 0 ? (
						<tr>
							<td colSpan={visibleColCount || 1} className="p-0">
								{emptyState}
							</td>
						</tr>
					) : (
						rows.map((row: Row<TFeatures, TData>, index: number) => {
							const cells = hasVisibleRowCells(row)
								? row.getVisibleCells()
								: (row.getAllCells() as Array<
										Cell<TFeatures, TData, CellData>
									>);

							const defaultCells = cells.map(
								(cell: Cell<TFeatures, TData, CellData>) => {
									const meta = cell.column.columnDef.meta as
										| DataTableColumnMeta
										| undefined;
									const align = meta?.align;
									const alignClass =
										align === "center"
											? "text-center"
											: align === "right"
												? "text-right"
												: "text-left";

									const renderedContent = <table.FlexRender cell={cell} />;

									return (
										<td
											key={cell.id}
											className={`px-6 py-4 ${alignClass} ${
												meta?.cellClassName || meta?.className || ""
											}`}
										>
											{renderCell
												? renderCell(cell, renderedContent)
												: renderedContent}
										</td>
									);
								},
							);

							if (renderRow) {
								return (
									<Fragment key={row.id}>
										{renderRow(row, index, defaultCells)}
									</Fragment>
								);
							}

							const isClickable = Boolean(onRowClick);
							const customRowClass = getRowClassName
								? getRowClassName(row, index)
								: "";
							const bandedClass = banded
								? index % 2 === 1
									? "bg-m3-surface-container-high"
									: "bg-transparent"
								: "";

							const handleKeyDown = (
								e: React.KeyboardEvent<HTMLTableRowElement>,
							) => {
								if (onRowClick && (e.key === "Enter" || e.key === " ")) {
									e.preventDefault();
									// Trigger row click for keyboard navigation
									onRowClick(
										row,
										e as unknown as React.MouseEvent<HTMLTableRowElement>,
									);
								}
							};

							return (
								<tr
									key={row.id}
									tabIndex={isClickable ? 0 : undefined}
									onKeyDown={isClickable ? handleKeyDown : undefined}
									onClick={onRowClick ? (e) => onRowClick(row, e) : undefined}
									className={cn(
										"transition-colors",
										bandedClass,
										isClickable
											? "cursor-pointer hover:bg-m3-surface-container-high/60 focus-within:bg-m3-primary/5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-m3-primary"
											: "hover:bg-m3-surface-container-high/35",
										customRowClass,
									)}
								>
									{defaultCells}
								</tr>
							);
						})
					)}
				</tbody>
			</table>
		</div>
	);

	return (
		<Card
			variant="filled"
			className={cn(
				"relative overflow-hidden rounded-2xl bg-m3-surface-container p-0 shadow-xs border-none",
				className,
			)}
			data-student-scroll-container={dataStudentScrollContainer}
		>
			{isLoading && <TableLoadingBar ariaLabel={loadingAriaLabel} />}
			{headerSlot}
			{content}
			{footerSlot}
		</Card>
	);
}
