import type {
	ToolbarIconButtonProps,
	ToolbarIconButtonVariant,
} from "@bug-on/m3-expressive";
import type { ReactNode } from "react";

export interface SearchConfig
	extends Partial<
		Omit<
			ToolbarIconButtonProps,
			"children" | "id" | "onClick" | "aria-label" | "emphasis"
		>
	> {
	/** ID duy nhất cho ô input <Search>, phục vụ querySelector và accessibility */
	id: string;
	/** Placeholder hiển thị trong input */
	placeholder: string;
	/** Nhãn accessibility cho search input và tooltip */
	ariaLabel: string;
	/** Giá trị query hiện tại */
	query: string;
	/** Callback khi giá trị query thay đổi */
	onQueryChange: (query: string) => void;
	/** Chiều rộng tùy chỉnh cho Search component (mặc định: "w-56 sm:w-72 md:w-80") */
	widthClassName?: string;
	/** Có hiển thị leading search icon trong input khi mở hay không (mặc định: false) */
	showLeadingIcon?: boolean;
	/** Tự động xóa query khi đóng tìm kiếm (mặc định: false) */
	clearQueryOnClose?: boolean;
	/** Tự động focus vào ô input khi mở tìm kiếm (mặc định: true) */
	autoFocus?: boolean;

	/** Callback khi submit tìm kiếm (nhấn Enter hoặc submit) */
	onSubmit?: () => void;
	/** Callback điều hướng giữa các kết quả (-1: kết quả trước, 1: kết quả tiếp theo) */
	onNavigate?: (direction: -1 | 1) => void;
	/** Callback reset trạng thái tìm kiếm (nhấn Escape hoặc nút đóng) */
	onReset?: () => void;
	/** Tổng số kết quả khớp */
	matchedCount?: number;
	/** Vị trí kết quả đang duyệt (0-indexed) */
	matchIndex?: number;
	/** Gợi ý hoặc thông báo kết quả tìm kiếm */
	hint?: string;

	/**
	 * Visual emphasis cho ToolbarIconButton ("standard" | "tonal" | "filled").
	 * Hỗ trợ string mở rộng để không bắt buộc 'as const' khi khai báo object literal.
	 */
	emphasis?: ToolbarIconButtonVariant | (string & {});

	/**
	 * Alias cho `emphasis` ("standard" | "tonal" | "filled") để thuận tiện tuỳ biến theo tên variant.
	 * Nếu truyền cả `emphasis` và `variant`, `emphasis` sẽ được ưu tiên.
	 */
	variant?: ToolbarIconButtonVariant | (string & {});

	/** Variant hình học cho Material Symbol Icon ("outlined" | "rounded" | "sharp") */
	iconVariant?: "outlined" | "rounded" | "sharp" | (string & {});

	/** Tên icon Material Symbol tùy biến (mặc định: "search") */
	iconName?: string;

	/** Kích thước icon (mặc định: 24) */
	iconSize?: number;
}

export interface FloatingActionToolbarProps {
	/**
	 * Start FAB hiển thị phía trước (bên trái) Toolbar.
	 * Thường dùng cho nút quay lại (Back) hoặc hành động chính đặc thù.
	 * Tự động ẩn/thu gọn mượt mà khi Search active.
	 */
	startFab?: ReactNode;

	/**
	 * End FAB hiển thị phía sau (bên phải) Toolbar.
	 * Thường dùng cho hành động chính như Thêm mới (Add).
	 * Tự động ẩn/thu gọn mượt mà khi Search active.
	 */
	endFab?: ReactNode;

	/**
	 * Các action buttons tuỳ chỉnh hiển thị khi search không active.
	 * Ví dụ: Menu lọc, Nút thêm, Nút xuất file...
	 */
	actions?: ReactNode;

	/**
	 * Cấu hình chức năng tìm kiếm tích hợp.
	 * Nếu không truyền, toolbar sẽ không hiển thị nút tìm kiếm.
	 */
	search?: SearchConfig;

	/**
	 * Slot hiển thị thông tin ngữ cảnh tuỳ ý (ví dụ: chip đếm số lượng, trạng thái lọc...).
	 * Hỗ trợ tối đa sự linh hoạt cho các trang khác nhau (School, Class, Calendar, XML, Permission...).
	 */
	infoSlot?: ReactNode;

	/** Vị trí hiển thị của infoSlot tương đối với Toolbar (mặc định: "before") */
	infoSlotPosition?: "before" | "after";

	/** Aria label mô tả thanh công cụ */
	ariaLabel?: string;

	/** Class tùy biến cho wrapper motion.div ngoài cùng */
	className?: string;

	/** Class tùy biến cho chính HorizontalFloatingToolbar */
	toolbarClassName?: string;

	/** Tooltip hiển thị trên FAB nút đóng tìm kiếm (mặc định: "Đóng tìm kiếm (Esc)") */
	closeSearchTooltip?: string;

	/**
	 * Callback báo trạng thái mở/đóng ô tìm kiếm ra ngoài để page cha đồng bộ layout.
	 * Chú ý: Nên memoize hàm này bằng useCallback ở caller để tránh re-render thừa.
	 */
	onSearchActiveChange?: (isActive: boolean) => void;

	/**
	 * Hỗ trợ Controlled state nếu caller muốn quản lý trạng thái search từ bên ngoài.
	 */
	isSearchActive?: boolean;
	onOpenSearch?: () => void;
	onCloseSearch?: () => void;
}
