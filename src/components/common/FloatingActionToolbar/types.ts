import type { ReactNode } from "react";

export interface SearchConfig {
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
}

export interface FloatingActionToolbarProps {
	/**
	 * Start FAB hiển thị phía trước (bên trái) Toolbar.
	 * Thường dùng cho nút quay lại (Back) hoặc hành động chính đặc thù.
	 * Tự động ẩn/thu gọn mượt mà khi Search active.
	 */
	startFab?: ReactNode;

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
