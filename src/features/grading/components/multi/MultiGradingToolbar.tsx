import {
	FAB,
	FAST_SPATIAL_SPRING,
	Icon,
	IconButton,
	PlainTooltip,
	ProgressIndicator,
	ToolbarIconButton,
	TooltipBox,
} from "@bug-on/m3-expressive";
import { AnimatePresence, motion } from "motion/react";
import { memo, useMemo } from "react";
import { FloatingActionToolbar } from "../../../../components/common/floating-action-toolbar";
import { cn } from "../../../../utils/utils";

export interface MultiGradingToolbarProps {
	onBack: () => void;
	selectedCount: number;
	totalAssignmentsCount: number;
	isLoading: boolean;
	hasPendingChanges: boolean;
	onSaveAll: () => void;
	onSelectAll?: () => void;
	onClear?: () => void;
}

const MultiGradingToolbarComponent = ({
	onBack,
	selectedCount,
	totalAssignmentsCount,
	isLoading,
	hasPendingChanges,
	onSaveAll,
	onSelectAll,
	onClear,
}: MultiGradingToolbarProps) => {
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
							disabled={isLoading || totalAssignmentsCount === 0}
							emphasis="standard"
						>
							<Icon name="select_all" size={24} />
						</ToolbarIconButton>
					</TooltipBox>
				)}
			</>
		),
		[onBack, isLoading, onSelectAll, totalAssignmentsCount],
	);

	// Info slot hiển thị trạng thái chọn bài dạng Spring Pill kèm nút bỏ chọn (không border, không shadow)
	const infoSlot = useMemo(
		() => (
			<AnimatePresence>
				{totalAssignmentsCount > 0 && (
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
								"flex items-center gap-1.5 rounded-full bg-m3-surface-container-high pl-3 py-1.5 text-xs text-m3-on-surface",
								onClear && selectedCount > 0 ? "pr-1.5" : "pr-3",
							)}
						>
							<Icon
								name="fact_check"
								size={16}
								className="text-m3-primary shrink-0"
							/>
							<span className="font-semibold text-m3-primary px-1 whitespace-nowrap">
								{selectedCount}/{totalAssignmentsCount} bài
							</span>

							{/* Nút bỏ chọn tất cả khi có bài tập đang được chọn */}
							<AnimatePresence>
								{onClear && selectedCount > 0 && (
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
		[totalAssignmentsCount, onClear, selectedCount, isLoading],
	);

	// FAB lưu điểm nhiều bài
	const endFab = useMemo(() => {
		const canSave = selectedCount > 0 && !hasPendingChanges && !isLoading;
		const tooltipText = hasPendingChanges
			? "Vui lòng chốt lại danh sách bài tập trước khi lưu"
			: selectedCount === 0
				? "Chưa có bài tập nào được chọn để lưu"
				: "Lưu điểm nhiều bài";

		return (
			<TooltipBox
				tooltip={<PlainTooltip>{tooltipText}</PlainTooltip>}
				placement="top"
			>
				<FAB
					colorStyle="primary"
					size="md"
					aria-label={tooltipText}
					onClick={onSaveAll}
					disabled={!canSave}
					icon={
						isLoading ? (
							<ProgressIndicator
								variant="circular"
								shape="wavy"
								size={22}
								aria-label="Đang lưu..."
							/>
						) : (
							<Icon name="save" size={24} />
						)
					}
				/>
			</TooltipBox>
		);
	}, [selectedCount, hasPendingChanges, isLoading, onSaveAll]);

	return (
		<FloatingActionToolbar
			ariaLabel="Thanh công cụ chấm nhiều bài"
			actions={actions}
			infoSlot={infoSlot}
			infoSlotPosition="before"
			endFab={endFab}
		/>
	);
};

export const MultiGradingToolbar = memo(MultiGradingToolbarComponent);
