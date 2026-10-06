import {
	FAB,
	Icon,
	Menu,
	MenuContent,
	MenuGroup,
	MenuItem,
	MenuTrigger,
	PlainTooltip,
	type SelectOption,
	ToolbarIconButton,
	TooltipBox,
} from "@bug-on/m3-expressive";
import { type MouseEvent, memo, useCallback, useMemo } from "react";
import {
	FloatingActionToolbar,
	type SearchConfig,
} from "../../../components/common/floating-action-toolbar";
import { cn } from "../../../utils/utils";

export interface PortalActionToolbarProps {
	scopeFilter: "all" | "teacher";
	onScopeChange: (scope: "all" | "teacher") => void;
	selectedClassId: string;
	onClassChange: (classId: string) => void;
	classOptions: SelectOption[];
	onResetFilters: () => void;
	hasActiveFilters: boolean;
	searchQuery: string;
	onSearchQueryChange: (query: string) => void;
	isSearchActive?: boolean;
	onOpenSearch?: () => void;
	onCloseSearch?: () => void;
	onSearchActiveChange?: (isActive: boolean) => void;
	onOpenCreate: () => void;
}

const PortalActionToolbarComponent = ({
	scopeFilter,
	onScopeChange,
	selectedClassId,
	onClassChange,
	classOptions,
	onResetFilters,
	hasActiveFilters,
	searchQuery,
	onSearchQueryChange,
	isSearchActive,
	onOpenSearch,
	onCloseSearch,
	onSearchActiveChange,
	onOpenCreate,
}: PortalActionToolbarProps) => {
	// Giải phóng tap gesture của Motion trước khi mở dialog tạo cổng
	const handleOpenCreate = useCallback(
		(e: MouseEvent<HTMLButtonElement>) => {
			e.currentTarget.dispatchEvent(
				new PointerEvent("pointercancel", { bubbles: true }),
			);
			e.currentTarget.blur();
			onOpenCreate();
		},
		[onOpenCreate],
	);

	// Cấu hình tìm kiếm cho FloatingActionToolbar
	const searchConfig: SearchConfig = useMemo(
		() => ({
			id: "portal-floating-search",
			placeholder: "Tìm theo tiêu đề, lớp, mô tả...",
			ariaLabel: "Tìm kiếm cổng nộp bài",
			query: searchQuery,
			onQueryChange: onSearchQueryChange,
			widthClassName: "w-56 sm:w-72 md:w-80",
			clearQueryOnClose: true,
			variant: "filled",
		}),
		[searchQuery, onSearchQueryChange],
	);

	// Kiểm tra xem bộ lọc lớp học có đang kích hoạt không
	const hasFilterMenuActive = Boolean(selectedClassId);

	// Tooltip mô tả trạng thái lọc lớp học
	const filterTooltipText = useMemo(() => {
		if (selectedClassId) {
			const foundOption = classOptions.find(
				(opt) => opt.value === selectedClassId,
			);
			return `Đang lọc: ${foundOption ? foundOption.label : "Lớp đã chọn"}`;
		}
		return "Lọc theo lớp học";
	}, [selectedClassId, classOptions]);

	// Danh sách các lớp học (loại bỏ tùy chọn rỗng nếu có)
	const classListOptions = useMemo(
		() => classOptions.filter((opt) => Boolean(opt.value)),
		[classOptions],
	);

	// Action buttons trên FloatingActionToolbar
	const actions = (
		<>
			{/* Nút lọc Phạm vi nộp bài: Tất cả vs Lớp của tôi */}
			<TooltipBox
				tooltip={
					<PlainTooltip>
						{scopeFilter === "teacher"
							? "Đang lọc: Lớp của tôi (Bấm để xem tất cả)"
							: "Đang xem: Tất cả các cổng (Bấm để lọc lớp của tôi)"}
					</PlainTooltip>
				}
				placement="top"
			>
				<ToolbarIconButton
					aria-label={
						scopeFilter === "teacher"
							? "Lọc theo lớp trực thuộc của giáo viên"
							: "Hiển thị tất cả các cổng nộp bài"
					}
					onClick={() =>
						onScopeChange(scopeFilter === "teacher" ? "all" : "teacher")
					}
					emphasis={scopeFilter === "teacher" ? "tonal" : "standard"}
					className={cn(
						scopeFilter === "teacher"
							? "text-m3-on-secondary-container"
							: "text-m3-on-primary-container",
					)}
				>
					<Icon
						name={scopeFilter === "teacher" ? "school" : "public"}
						size={24}
						animateFill
						fill={scopeFilter === "teacher" ? 1 : 0}
						className={cn(
							scopeFilter === "teacher"
								? "text-m3-on-secondary-container"
								: "text-m3-on-primary-container",
						)}
					/>
				</ToolbarIconButton>
			</TooltipBox>

			{/* Menu Bộ lọc theo lớp học */}
			<Menu variant="expressive" colorVariant="vibrant" density={-2}>
				<MenuTrigger asChild>
					<div>
						<TooltipBox
							tooltip={<PlainTooltip>{filterTooltipText}</PlainTooltip>}
							placement="top"
						>
							<ToolbarIconButton
								aria-label="Lọc theo lớp học"
								emphasis={hasFilterMenuActive ? "tonal" : "standard"}
								className={
									hasFilterMenuActive ? "text-m3-primary relative" : undefined
								}
							>
								<Icon name="tune" size={24} />
								{hasFilterMenuActive && (
									<span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-m3-primary" />
								)}
							</ToolbarIconButton>
						</TooltipBox>
					</div>
				</MenuTrigger>
				<MenuContent align="center" className="w-64" separatorStyle="gap">
					<MenuGroup label="Lọc theo lớp học">
						<MenuItem
							selected={selectedClassId === ""}
							keepOpen
							onClick={() => onClassChange("")}
						>
							Tất cả các lớp
						</MenuItem>
						{classListOptions.map((option) => (
							<MenuItem
								key={option.value}
								selected={selectedClassId === option.value}
								keepOpen
								onClick={() => onClassChange(String(option.value))}
							>
								{option.label}
							</MenuItem>
						))}
					</MenuGroup>
				</MenuContent>
			</Menu>

			{/* Nút Xóa bộ lọc khi có bất kỳ điều kiện lọc nào kích hoạt */}
			{hasActiveFilters && (
				<TooltipBox
					tooltip={<PlainTooltip>Xóa bộ lọc & tìm kiếm</PlainTooltip>}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Xóa bộ lọc & tìm kiếm"
						onClick={onResetFilters}
						emphasis="standard"
						className="text-m3-primary hover:bg-m3-primary/10"
					>
						<Icon name="filter_alt_off" size={24} />
					</ToolbarIconButton>
				</TooltipBox>
			)}
		</>
	);

	// End FAB cho phép tạo link mới
	const endFab = useMemo(
		() => (
			<TooltipBox
				tooltip={<PlainTooltip>Tạo link mới</PlainTooltip>}
				placement="top"
			>
				<FAB
					colorStyle="tertiary"
					aria-label="Tạo link mới"
					onClick={handleOpenCreate}
					icon={<Icon name="add_link" size={24} />}
				/>
			</TooltipBox>
		),
		[handleOpenCreate],
	);

	return (
		<FloatingActionToolbar
			ariaLabel="Thanh công cụ quản lý cổng nộp bài"
			actions={actions}
			endFab={endFab}
			search={searchConfig}
			isSearchActive={isSearchActive}
			onOpenSearch={onOpenSearch}
			onCloseSearch={onCloseSearch}
			onSearchActiveChange={onSearchActiveChange}
		/>
	);
};

export const PortalActionToolbar = memo(PortalActionToolbarComponent);
