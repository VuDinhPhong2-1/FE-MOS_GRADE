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

export interface CreateAssignmentToolbarProps {
	onBack: () => void;
	selectedCount: number;
	totalDraftsCount: number;
	isCreating: boolean;
	onSelectAll: () => void;
	onClear: () => void;
	onResetNames: () => void;
	onCreate: () => void;
}

const CreateAssignmentToolbarComponent = ({
	onBack,
	selectedCount,
	totalDraftsCount,
	isCreating,
	onSelectAll,
	onClear,
	onResetNames,
	onCreate,
}: CreateAssignmentToolbarProps) => {
	const hasSelection = selectedCount > 0;

	// Action buttons dành cho thao tác tạo bài tập
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
						disabled={isCreating}
						emphasis="standard"
					>
						<Icon name="arrow_back" size={24} />
					</ToolbarIconButton>
				</TooltipBox>

				{/* Chọn tất cả project */}
				<TooltipBox
					tooltip={<PlainTooltip>Chọn tất cả project</PlainTooltip>}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Chọn tất cả project"
						onClick={onSelectAll}
						disabled={isCreating || totalDraftsCount === 0}
						emphasis="standard"
					>
						<Icon name="select_all" size={24} />
					</ToolbarIconButton>
				</TooltipBox>

				{/* Đặt lại tên mặc định */}
				<TooltipBox
					tooltip={<PlainTooltip>Đặt lại tên mặc định</PlainTooltip>}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Đặt lại tên mặc định"
						onClick={onResetNames}
						disabled={isCreating || totalDraftsCount === 0}
						emphasis="standard"
					>
						<Icon name="restart_alt" size={24} />
					</ToolbarIconButton>
				</TooltipBox>
			</>
		),
		[onBack, isCreating, onSelectAll, totalDraftsCount, onResetNames],
	);

	// Info slot hiển thị số lượng bài đã chọn dạng Spring Pill bung ra khi có lựa chọn
	const infoSlot = useMemo(
		() => (
			<AnimatePresence>
				{hasSelection && (
					<motion.div
						key="create-assignment-selection-slot"
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
								Đã chọn {selectedCount}/{totalDraftsCount} bài
							</span>

							{/* Nút bỏ chọn tích hợp ngay trên pill */}
							<TooltipBox
								tooltip={<PlainTooltip>Bỏ chọn tất cả</PlainTooltip>}
								placement="top"
							>
								<IconButton
									aria-label="Bỏ chọn tất cả"
									colorStyle="tonal"
									size="sm"
									onClick={onClear}
									disabled={isCreating}
								>
									<Icon name="close" className="text-sm" />
								</IconButton>
							</TooltipBox>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		),
		[hasSelection, selectedCount, totalDraftsCount, onClear, isCreating],
	);

	// End FAB cho phép kích hoạt tạo hàng loạt bài tập đã chọn
	const endFab = useMemo(() => {
		const canCreate = !isCreating && selectedCount > 0;
		const tooltipText = isCreating
			? "Đang tạo các bài tập..."
			: selectedCount > 0
				? `Tạo ${selectedCount} bài tập đã chọn`
				: "Chọn ít nhất 1 bài tập để tạo";

		return (
			<TooltipBox
				tooltip={<PlainTooltip>{tooltipText}</PlainTooltip>}
				placement="top"
			>
				<FAB
					colorStyle="tertiary"
					aria-label={tooltipText}
					onClick={onCreate}
					disabled={!canCreate}
					icon={
						isCreating ? (
							<ProgressIndicator
								variant="circular"
								shape="wavy"
								size={22}
								aria-label="Đang tạo..."
							/>
						) : (
							<Icon name="contextual_token_add" size={24} />
						)
					}
				/>
			</TooltipBox>
		);
	}, [isCreating, selectedCount, onCreate]);

	return (
		<FloatingActionToolbar
			ariaLabel="Thanh công cụ tạo bài tập"
			actions={actions}
			infoSlot={infoSlot}
			infoSlotPosition="before"
			endFab={endFab}
		/>
	);
};

export const CreateAssignmentToolbar = memo(CreateAssignmentToolbarComponent);
