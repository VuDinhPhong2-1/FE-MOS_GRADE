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
	className?: string;
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
	className,
}: PortalActionToolbarProps) => {
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

	const isFilterActive = Boolean(selectedClassId);

	const filterTooltipText = useMemo(() => {
		if (selectedClassId) {
			const foundOption = classOptions.find(
				(opt) => opt.value === selectedClassId,
			);
			return `Đang lọc: ${foundOption ? foundOption.label : "Lớp đã chọn"}`;
		}
		return "Lọc theo lớp học";
	}, [selectedClassId, classOptions]);

	const classListOptions = useMemo(
		() => classOptions.filter((opt) => Boolean(opt.value)),
		[classOptions],
	);

	const actions = (
		<>
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

			<Menu variant="expressive" colorVariant="vibrant" density={-2}>
				<MenuTrigger asChild>
					<div>
						<TooltipBox
							tooltip={<PlainTooltip>{filterTooltipText}</PlainTooltip>}
							placement="top"
						>
							<ToolbarIconButton
								aria-label="Lọc theo lớp học"
								emphasis={isFilterActive ? "tonal" : "standard"}
								className={
									isFilterActive ? "text-m3-primary relative" : undefined
								}
							>
								<Icon name="tune" size={24} />
								{isFilterActive && (
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
			className={cn(
				"absolute bottom-4 lg:bottom-6 left-1/2 -translate-x-1/2 max-w-[calc(100%-2rem)] pointer-events-auto",
				className,
			)}
			isSearchActive={isSearchActive}
			onOpenSearch={onOpenSearch}
			onCloseSearch={onCloseSearch}
			onSearchActiveChange={onSearchActiveChange}
		/>
	);
};

export const PortalActionToolbar = memo(PortalActionToolbarComponent);
