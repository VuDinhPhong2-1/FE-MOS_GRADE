import {
	Icon,
	Menu,
	MenuContent,
	MenuGroup,
	MenuItem,
	MenuTrigger,
	PlainTooltip,
	ToolbarIconButton,
	TooltipBox,
} from "@bug-on/m3-expressive";
import { type MouseEvent, memo, useCallback, useMemo } from "react";
import { FloatingActionToolbar } from "../../../components/common/FloatingActionToolbar";
import type { SchoolActionToolbarProps } from "../types";

const SchoolActionToolbarComponent = ({
	onOpenAddModal,
	statusFilter,
	onStatusFilterChange,
	searchQuery,
	onSearchQueryChange,
	isSearchActive,
	onOpenSearch,
	onCloseSearch,
	onSearchActiveChange,
}: SchoolActionToolbarProps) => {
	// Giải phóng tap gesture của Motion trước khi mở modal thêm trường
	const handleOpenAddModal = useCallback(
		(e: MouseEvent<HTMLButtonElement>) => {
			e.currentTarget.dispatchEvent(
				new PointerEvent("pointercancel", { bubbles: true }),
			);
			e.currentTarget.blur();
			onOpenAddModal();
		},
		[onOpenAddModal],
	);

	// Cấu hình tìm kiếm cho FloatingActionToolbar
	const searchConfig = useMemo(
		() => ({
			id: "school-floating-search",
			placeholder: "Tìm theo tên, mã, địa chỉ...",
			ariaLabel: "Tìm kiếm trường học",
			query: searchQuery,
			onQueryChange: onSearchQueryChange,
			widthClassName: "w-56 sm:w-72 md:w-80",
		}),
		[searchQuery, onSearchQueryChange],
	);

	// Action buttons dành riêng cho School List: Bộ lọc trạng thái & Nút thêm trường
	const actions = (
		<>
			{/* Bộ lọc trạng thái hoạt động */}
			<Menu variant="expressive" colorVariant="vibrant">
				<MenuTrigger asChild>
					<div>
						<TooltipBox
							tooltip={
								<PlainTooltip>
									{statusFilter === "all"
										? "Lọc trạng thái"
										: `Đang lọc: ${statusFilter === "active"
											? "Đang hoạt động"
											: "Ngừng hoạt động"
										}`}
								</PlainTooltip>
							}
							placement="top"
						>
							<ToolbarIconButton
								aria-label="Lọc trạng thái"
								emphasis={statusFilter !== "all" ? "tonal" : "standard"}
								className={
									statusFilter !== "all"
										? "text-m3-primary relative"
										: undefined
								}
							>
								<Icon name="tune" size={24} />
								{statusFilter !== "all" && (
									<span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-m3-primary" />
								)}
							</ToolbarIconButton>
						</TooltipBox>
					</div>
				</MenuTrigger>
				<MenuContent align="center" className="w-56" separatorStyle="gap">
					<MenuGroup label="Trạng thái hoạt động">
						<MenuItem
							selected={statusFilter === "all"}
							onClick={() => onStatusFilterChange("all")}
						>
							Tất cả
						</MenuItem>
						<MenuItem
							selected={statusFilter === "active"}
							onClick={() => onStatusFilterChange("active")}
						>
							Đang hoạt động
						</MenuItem>
						<MenuItem
							selected={statusFilter === "inactive"}
							onClick={() => onStatusFilterChange("inactive")}
						>
							Ngừng hoạt động
						</MenuItem>
					</MenuGroup>
				</MenuContent>
			</Menu>

			{/* Nút thêm trường mới */}
			<TooltipBox
				tooltip={<PlainTooltip>Thêm trường mới</PlainTooltip>}
				placement="top"
			>
				<ToolbarIconButton
					aria-label="Thêm trường mới"
					emphasis="filled"
					width="wide"
					onClick={handleOpenAddModal}
				>
					<Icon name="domain_add" size={24} />
				</ToolbarIconButton>
			</TooltipBox>
		</>
	);

	return (
		<FloatingActionToolbar
			ariaLabel="Thanh công cụ quản lý trường học"
			actions={actions}
			search={searchConfig}
			isSearchActive={isSearchActive}
			onOpenSearch={onOpenSearch}
			onCloseSearch={onCloseSearch}
			onSearchActiveChange={onSearchActiveChange}
		/>
	);
};

export const SchoolActionToolbar = memo(SchoolActionToolbarComponent);
