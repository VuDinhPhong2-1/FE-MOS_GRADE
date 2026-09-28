import type {
	Cell,
	CellData,
	Header,
	ReactTable,
	Row,
	RowData,
	TableFeatures,
	TableState,
} from "@tanstack/react-table";
import type React from "react";

export interface DataTableColumnMeta {
	className?: string;
	headerClassName?: string;
	cellClassName?: string;
	align?: "left" | "center" | "right";
}

declare module "@tanstack/table-core" {
	interface ColumnMeta<
		TFeatures extends TableFeatures,
		TData extends RowData,
		TValue = unknown,
	> extends DataTableColumnMeta {}
}

export interface DataTableProps<
	TFeatures extends TableFeatures,
	TData extends RowData,
> {
	table: ReactTable<TFeatures, TData, TableState<TFeatures>>;
	isLoading?: boolean;
	loadingAriaLabel?: string;
	emptyState?: React.ReactNode;
	headerSlot?: React.ReactNode;
	footerSlot?: React.ReactNode;
	className?: string;
	tableClassName?: string;
	headerRowClassName?: string;
	bodyClassName?: string;
	onRowClick?: (
		row: Row<TFeatures, TData>,
		event: React.MouseEvent<HTMLTableRowElement>,
	) => void;
	getRowClassName?: (row: Row<TFeatures, TData>, index: number) => string;
	renderRow?: (
		row: Row<TFeatures, TData>,
		index: number,
		defaultCells: React.ReactNode,
	) => React.ReactNode;
	renderCell?: (
		cell: Cell<TFeatures, TData, CellData>,
		defaultContent: React.ReactNode,
	) => React.ReactNode;
	minWidthClassName?: string;
	/**
	 * Cho phép hiển thị hàng xen kẽ màu (banded / zebra rows).
	 * @default true
	 */
	banded?: boolean;
	/**
	 * Class cho container bao quanh bảng (thẻ div/ScrollArea cuộn).
	 * Dùng để giới hạn chiều cao và bật cuộn dọc, ví dụ: "max-h-120".
	 */
	scrollContainerClassName?: string;
	/**
	 * Cố định thanh tiêu đề ở trên cùng khi cuộn dọc.
	 * @default false
	 */
	stickyHeader?: boolean;
	/**
	 * Sử dụng ScrollArea từ @bug-on/m3-expressive thay vì thanh cuộn native của trình duyệt.
	 * @default true
	 */
	useScrollArea?: boolean;
	/**
	 * Cơ chế hiển thị thanh cuộn trong ScrollArea.
	 * @default "scroll"
	 */
	scrollType?: "scroll" | "hover" | "always" | "none";
	/**
	 * Hướng cuộn của ScrollArea.
	 * Mặc định tự động nhận diện: "both" nếu scrollContainerClassName có max-h/h-, ngược lại "horizontal".
	 */
	scrollOrientation?: "vertical" | "horizontal" | "both";
	"data-student-scroll-container"?: string | boolean;
}

export interface SortableHeaderProps<
	TFeatures extends TableFeatures,
	TData extends RowData,
	TValue = unknown,
> {
	header: Header<TFeatures, TData, TValue>;
	title?: React.ReactNode;
	align?: "left" | "center" | "right";
	className?: string;
	children?: React.ReactNode;
}

export interface TableEmptyStateProps {
	icon?: string;
	title: string;
	description?: string;
	action?: React.ReactNode;
	className?: string;
}
