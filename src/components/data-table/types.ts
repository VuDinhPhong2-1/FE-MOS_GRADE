import type {
	ScrollAreaOrientation,
	ScrollAreaProps,
	ScrollAreaType,
} from "@bug-on/m3-expressive";
import type { ScrollAreaScrollbar } from "@bug-on/m3-expressive";
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

type ScrollAreaScrollbarProps = React.ComponentPropsWithoutRef<
	typeof ScrollAreaScrollbar
>;

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
	 * - "scroll": Hiển thị khi đang cuộn (mặc định)
	 * - "hover": Hiển thị khi hover chuột
	 * - "always": Luôn luôn hiển thị
	 * - "none": Ẩn thanh cuộn tùy biến, giữ hành vi cuộn gốc
	 * @default "scroll"
	 */
	scrollType?: ScrollAreaType;
	/**
	 * Hướng cuộn của ScrollArea.
	 * - "both": Hỗ trợ cuộn cả ngang và dọc khi nội dung tràn khung nhìn (mặc định cho bảng)
	 * - "horizontal": Chỉ cuộn ngang
	 * - "vertical": Chỉ cuộn dọc
	 * @default "both"
	 */
	scrollOrientation?: ScrollAreaOrientation;
	/**
	 * Độ dày của thanh cuộn tính theo pixel (chiều rộng cho thanh dọc, chiều cao cho thanh ngang).
	 * @default 8
	 */
	scrollbarSize?: number;
	/**
	 * Thời gian chờ (ms) trước khi ẩn thanh cuộn khi scrollType là "scroll" hoặc "hover".
	 * @default 600
	 */
	scrollHideDelay?: number;
	/**
	 * Class Tailwind CSS bổ sung cho phần con trượt (thumb) của thanh cuộn.
	 */
	thumbClassName?: string;
	/**
	 * Class Tailwind CSS bổ sung cho rãnh trượt (track) của thanh cuộn.
	 */
	trackClassName?: string;
	/**
	 * Class CSS cho góc giao nhau (corner) khi cả 2 thanh cuộn ngang và dọc cùng hiển thị.
	 */
	cornerClassName?: string;
	/**
	 * Cấu hình chi tiết riêng cho thanh cuộn dọc.
	 */
	verticalScrollbarProps?: Omit<ScrollAreaScrollbarProps, "orientation">;
	/**
	 * Cấu hình chi tiết riêng cho thanh cuộn ngang.
	 */
	horizontalScrollbarProps?: Omit<ScrollAreaScrollbarProps, "orientation">;
	/**
	 * Ref trỏ tới phần tử Viewport cuộn bên trong của Radix ScrollArea.
	 */
	viewportRef?: React.Ref<HTMLDivElement>;
	/**
	 * Class CSS bổ sung cho phần tử Viewport cuộn bên trong.
	 */
	viewportClassName?: string;
	/**
	 * Props tùy biến chuyển tiếp trực tiếp vào Viewport của Radix ScrollArea.
	 */
	viewportProps?: ScrollAreaProps["viewportProps"];
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
