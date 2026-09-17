import {
	FAST_SPATIAL_SPRING,
	Icon,
	IconButton,
	PlainTooltip,
	ProgressIndicator,
	ToolbarDivider,
	ToolbarIconButton,
	TooltipBox,
} from "@bug-on/m3-expressive";
import { AnimatePresence, motion } from "motion/react";
import { memo, useMemo } from "react";
import {
	FloatingActionToolbar,
	type SearchConfig,
} from "../../../../components/common/FloatingActionToolbar";

export interface ManageAssignmentToolbarProps {
	onBack: () => void;
	selectedCount: number;
	activeCount: number;
	isAllSelected: boolean;
	isLoading: boolean;
	onSelectAll: () => void;
	onClear: () => void;
	onDeactivateSelected: () => void;
	searchQuery: string;
	onSearchQueryChange: (query: string) => void;
	isSearchActive?: boolean;
	onOpenSearch?: () => void;
	onCloseSearch?: () => void;
	onSearchActiveChange?: (active: boolean) => void;
}

const ManageAssignmentToolbarComponent = ({
	onBack,
	selectedCount,
	activeCount,
	isAllSelected,
	isLoading,
	onSelectAll,
	onClear,
	onDeactivateSelected,
	searchQuery,
	onSearchQueryChange,
	isSearchActive,
	onOpenSearch,
	onCloseSearch,
	onSearchActiveChange,
}: ManageAssignmentToolbarProps) => {
	const hasSelection = selectedCount > 0;

	// Cấu hình tìm kiếm cho Toolbar
	const searchConfig: SearchConfig = useMemo(
		() => ({
			id: "manage-assignment-floating-search",
			placeholder: "Tìm kiếm theo tên bài, môn, endpoint...",
			ariaLabel: "Tìm kiếm bài tập",
			query: searchQuery,
			onQueryChange: onSearchQueryChange,
			widthClassName: "w-56 sm:w-72 md:w-80",
			clearQueryOnClose: true,
			variant: "filled",
		}),
		[searchQuery, onSearchQueryChange],
	);

	// Action buttons dành cho quản lý bài tập
	const actions = useMemo(
		() => (
			<>
				{/* Quay lại danh mục */}
				<TooltipBox
					tooltip={<PlainTooltip>Quay lại danh mục</PlainTooltip>}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Quay lại danh mục"
						onClick={onBack}
						disabled={isLoading}
						emphasis="standard"
					>
						<Icon name="arrow_back" size={24} />
					</ToolbarIconButton>
				</TooltipBox>

				<ToolbarDivider />

				{/* Chọn tất cả bài tập đang dùng */}
				<TooltipBox
					tooltip={<PlainTooltip>Chọn tất cả bài đang dùng</PlainTooltip>}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Chọn tất cả bài đang dùng"
						onClick={onSelectAll}
						disabled={isLoading || activeCount === 0 || isAllSelected}
						emphasis="standard"
					>
						<Icon name="select_all" size={24} />
					</ToolbarIconButton>
				</TooltipBox>
			</>
		),
		[onBack, isLoading, onSelectAll, activeCount, isAllSelected],
	);

	// Info slot hiển thị trạng thái chọn bài dạng Spring Pill kèm các hành động ngữ cảnh (Ẩn bài & Bỏ chọn)
	const infoSlot = useMemo(
		() => (
			<AnimatePresence>
				{hasSelection && (
					<motion.div
						key="manage-assignment-selection-slot"
						initial={{ opacity: 0, scale: 0.8, width: 0 }}
						animate={{ opacity: 1, scale: 1, width: "auto" }}
						exit={{ opacity: 0, scale: 0.8, width: 0 }}
						transition={FAST_SPATIAL_SPRING}
						className="overflow-hidden flex shrink-0"
					>
						<div className="flex items-center gap-1.5 rounded-full bg-m3-surface-container-high pl-3 pr-1.5 py-1.5 text-xs shadow-xs text-m3-on-surface">
							<Icon
								name="checklist"
								size={16}
								className="text-m3-primary shrink-0"
							/>
							<span className="font-semibold text-m3-primary px-1 whitespace-nowrap">
								Đã chọn {selectedCount}/{activeCount} bài
							</span>

							{/* Ẩn các bài tập đã chọn */}
							<TooltipBox
								tooltip={
									<PlainTooltip>
										{isLoading
											? "Đang xử lý..."
											: `Ẩn ${selectedCount} bài tập đã chọn`}
									</PlainTooltip>
								}
								placement="top"
							>
								<IconButton
									aria-label={`Ẩn ${selectedCount} bài tập đã chọn`}
									colorStyle="tonal"
									size="sm"
									onClick={onDeactivateSelected}
									disabled={isLoading}
								>
									{isLoading ? (
										<ProgressIndicator
											variant="circular"
											shape="wavy"
											size={16}
											aria-label="Đang xử lý..."
										/>
									) : (
										<Icon name="visibility_off" size={20} />
									)}
								</IconButton>
							</TooltipBox>

							{/* Nút bỏ chọn */}
							<TooltipBox
								tooltip={<PlainTooltip>Bỏ chọn tất cả</PlainTooltip>}
								placement="top"
							>
								<IconButton
									aria-label="Bỏ chọn tất cả"
									colorStyle="tonal"
									size="sm"
									onClick={onClear}
									disabled={isLoading}
								>
									<Icon name="close" size={20} />
								</IconButton>
							</TooltipBox>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		),
		[
			hasSelection,
			selectedCount,
			activeCount,
			isLoading,
			onDeactivateSelected,
			onClear,
		],
	);

	return (
		<FloatingActionToolbar
			ariaLabel="Thanh công cụ quản lý bài tập"
			actions={actions}
			search={searchConfig}
			infoSlot={infoSlot}
			infoSlotPosition="before"
			isSearchActive={isSearchActive}
			onOpenSearch={onOpenSearch}
			onCloseSearch={onCloseSearch}
			onSearchActiveChange={onSearchActiveChange}
		/>
	);
};

export const ManageAssignmentToolbar = memo(ManageAssignmentToolbarComponent);
