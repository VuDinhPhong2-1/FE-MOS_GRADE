import {
	Chip,
	FAB,
	Icon,
	PlainTooltip,
	ProgressIndicator,
	ToolbarDivider,
	ToolbarIconButton,
	TooltipBox,
} from "@bug-on/m3-expressive";
import { memo, useMemo } from "react";
import { FloatingActionToolbar } from "../../../../components/common/FloatingActionToolbar";

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

				{(onSelectAll || onClear) && <ToolbarDivider />}

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

				{/* Bỏ chọn */}
				{onClear && (
					<TooltipBox
						tooltip={<PlainTooltip>Bỏ chọn tất cả</PlainTooltip>}
						placement="top"
					>
						<ToolbarIconButton
							aria-label="Bỏ chọn tất cả"
							onClick={onClear}
							disabled={isLoading || selectedCount === 0}
							emphasis="standard"
						>
							<Icon name="deselect" size={24} />
						</ToolbarIconButton>
					</TooltipBox>
				)}
			</>
		),
		[
			onBack,
			isLoading,
			onSelectAll,
			onClear,
			totalAssignmentsCount,
			selectedCount,
		],
	);

	// Chip đếm số bài tập đã chọn
	const infoSlot = useMemo(
		() => (
			<Chip
				variant="assist"
				leadingIcon={<Icon name="fact_check" size={16} />}
				label={`${selectedCount}/${totalAssignmentsCount} bài`}
				className="h-8! px-3! rounded-full pointer-events-none text-xs font-semibold"
			/>
		),
		[selectedCount, totalAssignmentsCount],
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
