import {
	FAB,
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
import type { RoomActionToolbarProps } from "../types";

const RoomActionToolbarComponent = ({
	onOpenAddModal,
	statusFilter,
	onStatusFilterChange,
	searchQuery,
	onSearchQueryChange,
	isSearchActive,
	onOpenSearch,
	onCloseSearch,
	onSearchActiveChange,
	onBackToSchedule,
}: RoomActionToolbarProps) => {
	// Release tap gesture of Motion before opening add modal
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

	// Search configuration for FloatingActionToolbar
	const searchConfig = useMemo(
		() => ({
			id: "room-floating-search",
			placeholder: "Tìm theo tên phòng, máy hỏng...",
			ariaLabel: "Tìm kiếm phòng máy",
			query: searchQuery,
			onQueryChange: onSearchQueryChange,
			widthClassName: "w-56 sm:w-72 md:w-80",
			variant: "filled",
		}),
		[searchQuery, onSearchQueryChange],
	);

	const filterTooltipText = useMemo(() => {
		if (statusFilter === "all") return "Lọc trạng thái phòng máy";
		return `Đang lọc: ${
			statusFilter === "active" ? "Đang hoạt động" : "Tạm ẩn"
		}`;
	}, [statusFilter]);

	// Custom actions: Back button & Status filter menu
	const actions = (
		<>
			{/* Back to Schedule button */}
			{onBackToSchedule && (
				<TooltipBox
					tooltip={<PlainTooltip>Quay lại Lịch dạy</PlainTooltip>}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Quay lại Lịch dạy"
						onClick={onBackToSchedule}
					>
						<Icon name="arrow_back" size={24} />
					</ToolbarIconButton>
				</TooltipBox>
			)}

			{/* Status Filter Menu */}
			<Menu variant="expressive" colorVariant="vibrant" density={-2}>
				<MenuTrigger asChild>
					<div>
						<TooltipBox
							tooltip={<PlainTooltip>{filterTooltipText}</PlainTooltip>}
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
					<MenuGroup label="Trạng thái phòng máy">
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
							Tạm ẩn
						</MenuItem>
					</MenuGroup>
				</MenuContent>
			</Menu>
		</>
	);

	// End FAB cho phép tạo phòng máy mới
	const endFab = useMemo(
		() => (
			<TooltipBox
				tooltip={<PlainTooltip>Tạo phòng máy mới</PlainTooltip>}
				placement="top"
			>
				<FAB
					colorStyle="tertiary"
					aria-label="Tạo phòng máy mới"
					onClick={handleOpenAddModal}
					icon={<Icon name="desktop_landscape_add" size={24} />}
				/>
			</TooltipBox>
		),
		[handleOpenAddModal],
	);

	return (
		<FloatingActionToolbar
			ariaLabel="Thanh công cụ quản lý phòng máy"
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

export const RoomActionToolbar = memo(RoomActionToolbarComponent);
