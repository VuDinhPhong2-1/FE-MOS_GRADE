import {
	FAB,
	Icon,
	Menu,
	MenuContent,
	MenuDivider,
	MenuGroup,
	MenuItem,
	MenuTrigger,
	PlainTooltip,
	ToolbarIconButton,
	TooltipBox,
} from "@bug-on/m3-expressive";
import { type MouseEvent, memo, useCallback, useMemo } from "react";
import { FloatingActionToolbar } from "../../../components/common/FloatingActionToolbar";
import type { ClassActionToolbarProps } from "../ClassList.types";

const ClassActionToolbarComponent = ({
	onOpenAddModal,
	canCreateClass,
	statusFilter,
	onStatusFilterChange,
	searchQuery,
	onSearchQueryChange,
	isSearchActive,
	onOpenSearch,
	onCloseSearch,
	onSearchActiveChange,
	selectedGradeFilter,
	onGradeFilterChange,
	onBackToSchools,
}: ClassActionToolbarProps) => {
	// Thực hiện back về danh sách trường
	const handleBack = useCallback(() => {
		onBackToSchools?.();
	}, [onBackToSchools]);

	// Giải phóng tap gesture của Motion trước khi mở modal thêm lớp
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
			id: "class-floating-search",
			placeholder: "Tìm theo tên lớp...",
			ariaLabel: "Tìm kiếm lớp học",
			query: searchQuery,
			onQueryChange: onSearchQueryChange,
			widthClassName: "w-56 sm:w-72 md:w-80",
		}),
		[searchQuery, onSearchQueryChange],
	);

	const hasActiveFilters =
		statusFilter !== "all" || Boolean(selectedGradeFilter);

	const filterTooltipText = useMemo(() => {
		if (!hasActiveFilters) return "Bộ lọc lớp học";
		const parts: string[] = [];
		if (statusFilter === "active") parts.push("Đang hoạt động");
		if (statusFilter === "inactive") parts.push("Ngừng hoạt động");
		if (selectedGradeFilter) parts.push(`Khối ${selectedGradeFilter}`);
		return `Đang lọc: ${parts.join(", ")}`;
	}, [hasActiveFilters, statusFilter, selectedGradeFilter]);

	// Action buttons dành riêng cho Class List: Nút quay lại & Bộ lọc đa tiêu chí
	const actions = (
		<>
			{/* Quay lại danh sách trường */}
			{onBackToSchools && (
				<TooltipBox
					tooltip={<PlainTooltip>Quay lại danh sách trường</PlainTooltip>}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Quay lại danh sách trường"
						onClick={handleBack}
					>
						<Icon name="arrow_back" size={24} />
					</ToolbarIconButton>
				</TooltipBox>
			)}

			{/* Menu bộ lọc (Trạng thái + Khối) */}
			<Menu variant="expressive" colorVariant="vibrant" density={-2}>
				<MenuTrigger asChild>
					<div>
						<TooltipBox
							tooltip={<PlainTooltip>{filterTooltipText}</PlainTooltip>}
							placement="top"
						>
							<ToolbarIconButton
								aria-label="Bộ lọc lớp học"
								emphasis={hasActiveFilters ? "tonal" : "standard"}
								className={
									hasActiveFilters ? "text-m3-primary relative" : undefined
								}
							>
								<Icon name="tune" size={24} />
								{hasActiveFilters && (
									<span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-m3-primary" />
								)}
							</ToolbarIconButton>
						</TooltipBox>
					</div>
				</MenuTrigger>
				<MenuContent align="center" className="w-64" separatorStyle="gap">
					<MenuGroup label="Trạng thái lớp">
						<MenuItem
							selected={statusFilter === "all"}
							keepOpen
							onClick={() => onStatusFilterChange("all")}
						>
							Tất cả trạng thái
						</MenuItem>
						<MenuItem
							selected={statusFilter === "active"}
							keepOpen
							onClick={() => onStatusFilterChange("active")}
						>
							Đang hoạt động
						</MenuItem>
						<MenuItem
							selected={statusFilter === "inactive"}
							keepOpen
							onClick={() => onStatusFilterChange("inactive")}
						>
							Ngừng hoạt động
						</MenuItem>
					</MenuGroup>

					<MenuDivider isGapVariant className="bg-transparent" />

					<MenuGroup label="Lọc theo khối">
						<MenuItem
							selected={selectedGradeFilter === ""}
							keepOpen
							onClick={() => onGradeFilterChange("")}
						>
							Tất cả các khối
						</MenuItem>
						<MenuItem
							selected={selectedGradeFilter === "10"}
							keepOpen
							onClick={() => onGradeFilterChange("10")}
						>
							Khối 10
						</MenuItem>
						<MenuItem
							selected={selectedGradeFilter === "11"}
							keepOpen
							onClick={() => onGradeFilterChange("11")}
						>
							Khối 11
						</MenuItem>
						<MenuItem
							selected={selectedGradeFilter === "12"}
							keepOpen
							onClick={() => onGradeFilterChange("12")}
						>
							Khối 12
						</MenuItem>
					</MenuGroup>
				</MenuContent>
			</Menu>
		</>
	);

	// End FAB cho phép thêm lớp mới
	const endFab = useMemo(() => {
		if (!canCreateClass) return undefined;

		return (
			<TooltipBox
				tooltip={<PlainTooltip>Thêm lớp mới</PlainTooltip>}
				placement="top"
			>
				<FAB
					colorStyle="tertiary"
					aria-label="Thêm lớp mới"
					onClick={handleOpenAddModal}
					icon={<Icon name="group_add" size={24} />}
				/>
			</TooltipBox>
		);
	}, [canCreateClass, handleOpenAddModal]);

	return (
		<FloatingActionToolbar
			ariaLabel="Thanh công cụ quản lý lớp học"
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

export const ClassActionToolbar = memo(ClassActionToolbarComponent);
