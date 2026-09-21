import {
	FAB,
	FAST_SPATIAL_SPRING,
	Icon,
	IconButton,
	PlainTooltip,
	ToolbarIconButton,
	TooltipBox,
} from "@bug-on/m3-expressive";
import { AnimatePresence, motion } from "motion/react";
import { memo, useMemo } from "react";
import {
	FloatingActionToolbar,
	type SearchConfig,
} from "../../../../components/common/floating-action-toolbar";
import { cn } from "../../../../utils/utils";

export interface MultiGradingToolbarProps {
	onBack: () => void;
	/** Số bài tập đã chốt hiển thị trong bảng */
	committedCount?: number;
	/** Số bài tập đang chọn nháp */
	draftCount?: number;
	/** Alias cho committedCount để tương thích ngược */
	selectedCount?: number;
	totalAssignmentsCount: number;
	isLoading: boolean;
	hasPendingChanges: boolean;
	onCommit?: () => void;
	onSaveAll: () => void;
	onSelectAll?: () => void;
	onClear?: () => void;
	searchQuery?: string;
	onSearchQueryChange?: (query: string) => void;
	studentSearchQuery?: string;
	onStudentSearchQueryChange?: (query: string) => void;
	studentSearchMatchedCount?: number;
	studentSearchMatchIndex?: number;
	onStudentSearchSubmit?: () => void;
	onStudentSearchNavigate?: (direction: -1 | 1) => void;
	onStudentSearchReset?: () => void;
	isSearchActive?: boolean;
	onOpenSearch?: () => void;
	onCloseSearch?: () => void;
	onSearchActiveChange?: (active: boolean) => void;
}

const MultiGradingToolbarComponent = ({
	onBack,
	committedCount: propCommittedCount,
	draftCount: propDraftCount,
	selectedCount: propSelectedCount = 0,
	totalAssignmentsCount,
	isLoading,
	hasPendingChanges,
	onCommit,
	onSaveAll,
	onSelectAll,
	onClear,
	searchQuery,
	onSearchQueryChange,
	studentSearchQuery,
	onStudentSearchQueryChange,
	studentSearchMatchedCount,
	studentSearchMatchIndex,
	onStudentSearchSubmit,
	onStudentSearchNavigate,
	onStudentSearchReset,
	isSearchActive,
	onOpenSearch,
	onCloseSearch,
	onSearchActiveChange,
}: MultiGradingToolbarProps) => {
	const committedCount = propCommittedCount ?? propSelectedCount;
	const draftCount = propDraftCount ?? committedCount;

	// Cấu hình tìm kiếm cho Toolbar:
	// Khi đã chốt danh sách bài tập (committedCount > 0 và không có thay đổi chưa chốt !hasPendingChanges),
	// ưu tiên hiển thị chế độ tìm kiếm học sinh trong bảng ma trận.
	const searchConfig: SearchConfig | undefined = useMemo(() => {
		if (
			!hasPendingChanges &&
			committedCount > 0 &&
			studentSearchQuery !== undefined &&
			onStudentSearchQueryChange
		) {
			return {
				id: "multi-grading-student-search",
				placeholder: "Tìm tên học sinh...",
				ariaLabel: "Tìm kiếm học sinh",
				query: studentSearchQuery,
				onQueryChange: onStudentSearchQueryChange,
				onSubmit: onStudentSearchSubmit,
				onNavigate: onStudentSearchNavigate,
				onReset: onStudentSearchReset,
				matchedCount: studentSearchMatchedCount,
				matchIndex: studentSearchMatchIndex,
				widthClassName: "w-52 sm:w-64 md:w-72",
				clearQueryOnClose: true,
				variant: "filled",
			};
		}

		if (searchQuery !== undefined && onSearchQueryChange) {
			return {
				id: "multi-grading-floating-search",
				placeholder: "Tìm theo tên bài, mô tả, API...",
				ariaLabel: "Tìm kiếm bài tập ma trận",
				query: searchQuery,
				onQueryChange: onSearchQueryChange,
				widthClassName: "w-56 sm:w-72 md:w-80",
				clearQueryOnClose: true,
				variant: "filled",
			};
		}

		return undefined;
	}, [
		hasPendingChanges,
		committedCount,
		studentSearchQuery,
		onStudentSearchQueryChange,
		onStudentSearchSubmit,
		onStudentSearchNavigate,
		onStudentSearchReset,
		studentSearchMatchedCount,
		studentSearchMatchIndex,
		searchQuery,
		onSearchQueryChange,
	]);

	// Nút tác vụ trên toolbar
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

				{/* Chọn tất cả bài tập */}
				{onSelectAll && (
					<TooltipBox
						tooltip={<PlainTooltip>Chọn tất cả bài tập</PlainTooltip>}
						placement="top"
					>
						<ToolbarIconButton
							aria-label="Chọn tất cả bài tập"
							onClick={onSelectAll}
							disabled={
								isLoading ||
								totalAssignmentsCount === 0 ||
								draftCount === totalAssignmentsCount
							}
							emphasis="standard"
						>
							<Icon name="select_all" size={24} />
						</ToolbarIconButton>
					</TooltipBox>
				)}
			</>
		),
		[onBack, isLoading, onSelectAll, totalAssignmentsCount, draftCount],
	);

	// Info slot hiển thị trạng thái chọn bài dạng Spring Pill kèm nút bỏ chọn
	const infoSlot = useMemo(
		() => (
			<AnimatePresence>
				{(draftCount > 0 || committedCount > 0) && (
					<motion.div
						key="multi-grading-selection-slot"
						initial={{ opacity: 0, scale: 0.8, width: 0 }}
						animate={{ opacity: 1, scale: 1, width: "auto" }}
						exit={{ opacity: 0, scale: 0.8, width: 0 }}
						transition={FAST_SPATIAL_SPRING}
						className="overflow-hidden flex shrink-0"
					>
						<div
							className={cn(
								"flex items-center gap-2 rounded-full bg-m3-surface-container-high pl-3 py-2 text-xs text-m3-on-surface",
								onClear && draftCount > 0 ? "pr-2" : "pr-3",
							)}
						>
							<Icon
								name="checklist"
								size={16}
								className="text-m3-primary shrink-0"
							/>
							<div className="flex items-center gap-1.5 px-0.5 whitespace-nowrap">
								{hasPendingChanges ? (
									<>
										<span className="font-semibold text-m3-primary">
											Đang chọn {draftCount}/{totalAssignmentsCount}
										</span>
										<span className="text-m3-outline text-[11px]">•</span>
										<span className="text-m3-on-secondary-container font-medium text-[11px]">
											Chưa chốt
										</span>
									</>
								) : (
									<span className="font-semibold text-m3-primary">
										Đã chốt {committedCount}/{totalAssignmentsCount} bài
									</span>
								)}
							</div>

							{/* Nút bỏ chọn tất cả khi có bài tập đang được chọn */}
							<AnimatePresence>
								{onClear && draftCount > 0 && (
									<motion.div
										key="multi-clear-btn"
										initial={{ opacity: 0, scale: 0.6, width: 0 }}
										animate={{ opacity: 1, scale: 1, width: "auto" }}
										exit={{ opacity: 0, scale: 0.6, width: 0 }}
										transition={FAST_SPATIAL_SPRING}
										className="overflow-hidden flex shrink-0"
									>
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
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		),
		[
			totalAssignmentsCount,
			onClear,
			draftCount,
			committedCount,
			hasPendingChanges,
			isLoading,
		],
	);

	// End FAB: Animation đóng mở mượt mà khi chọn bài tập
	// Khi hasPendingChanges: FAB là "Chốt danh sách"
	// Khi đã chốt và có bài trong bảng: FAB là "Lưu điểm"
	const endFab = useMemo(() => {
		if (hasPendingChanges) {
			return (
				<TooltipBox
					tooltip={<PlainTooltip>Chốt danh sách bài tập</PlainTooltip>}
					placement="top"
				>
					<FAB
						key="fab-commit"
						colorStyle="tertiary"
						size="md"
						aria-label="Chốt danh sách bài tập"
						onClick={onCommit}
						disabled={isLoading}
						loading={isLoading}
						icon={<Icon name="check" size={24} />}
					/>
				</TooltipBox>
			);
		}

		if (committedCount > 0) {
			return (
				<TooltipBox
					tooltip={<PlainTooltip>Lưu điểm nhiều bài</PlainTooltip>}
					placement="top"
				>
					<FAB
						key="fab-save"
						colorStyle="tertiary"
						size="md"
						aria-label="Lưu điểm nhiều bài"
						onClick={onSaveAll}
						disabled={isLoading}
						loading={isLoading}
						icon={<Icon name="save" size={24} />}
					/>
				</TooltipBox>
			);
		}

		return null;
	}, [hasPendingChanges, committedCount, isLoading, onCommit, onSaveAll]);

	return (
		<FloatingActionToolbar
			ariaLabel="Thanh công cụ chấm nhiều bài"
			actions={actions}
			search={searchConfig}
			infoSlot={infoSlot}
			infoSlotPosition="before"
			endFab={endFab}
			isSearchActive={isSearchActive}
			onOpenSearch={onOpenSearch}
			onCloseSearch={onCloseSearch}
			onSearchActiveChange={onSearchActiveChange}
		/>
	);
};

export const MultiGradingToolbar = memo(MultiGradingToolbarComponent);
