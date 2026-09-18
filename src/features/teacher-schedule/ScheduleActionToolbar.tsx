import {
	Button,
	FAB,
	FAST_SPATIAL_SPRING,
	Icon,
	IconButton,
	PlainTooltip,
	ToolbarDivider,
	ToolbarIconButton,
	TooltipBox,
} from "@bug-on/m3-expressive";
import { AnimatePresence, motion } from "motion/react";
import { type MouseEvent, memo, useCallback, useMemo } from "react";
import { FloatingActionToolbar } from "../../components/common/floating-action-toolbar";
import { formatDateViFromYmd } from "./utils";

export interface ScheduleActionToolbarProps {
	weekStart: string;
	weekEnd?: string;
	onShiftWeek: (offsetDays: number) => void;
	onOpenDatePicker: () => void;
	selectedScheduleIds: string[];
	copying: boolean;
	loading: boolean;
	onOpenCreate: () => void;
	onOpenRoomManager: () => void;
	onCopyToNextWeek: () => void;
	onCopySelectedToNextWeek: () => void;
	onDeleteSelected: () => void;
	onClearSelection: () => void;
}

const ScheduleActionToolbarComponent = ({
	weekStart,
	onShiftWeek,
	onOpenDatePicker,
	selectedScheduleIds,
	copying,
	loading,
	onOpenCreate,
	onOpenRoomManager,
	onCopyToNextWeek,
	onCopySelectedToNextWeek,
	onDeleteSelected,
	onClearSelection,
}: ScheduleActionToolbarProps) => {
	const selectedCount = selectedScheduleIds.length;
	const hasSelection = selectedCount > 0;

	// Giải phóng tap gesture của Motion trước khi mở modal tạo lịch
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

	// Giải phóng tap gesture của Motion trước khi mở modal quản lý phòng máy
	const handleOpenRoomManager = useCallback(
		(e: MouseEvent<HTMLButtonElement>) => {
			e.currentTarget.dispatchEvent(
				new PointerEvent("pointercancel", { bubbles: true }),
			);
			e.currentTarget.blur();
			onOpenRoomManager();
		},
		[onOpenRoomManager],
	);

	// End FAB cho phép thêm lịch dạy mới
	const endFab = useMemo(
		() => (
			<TooltipBox
				tooltip={<PlainTooltip>Thêm lịch dạy</PlainTooltip>}
				placement="top"
			>
				<FAB
					colorStyle="tertiary"
					aria-label="Thêm lịch dạy"
					onClick={handleOpenCreate}
					icon={<Icon name="calendar_add_on" size={24} />}
				/>
			</TooltipBox>
		),
		[handleOpenCreate],
	);

	// Các action buttons chính trong Toolbar
	const actions = useMemo(
		() => (
			<>
				{/* Quản lý phòng máy */}
				<TooltipBox
					tooltip={<PlainTooltip>Quản lý phòng máy</PlainTooltip>}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Quản lý phòng máy"
						onClick={handleOpenRoomManager}
					>
						<Icon name="desktop_windows" size={24} />
					</ToolbarIconButton>
				</TooltipBox>

				{/* Divider ngăn cách phòng máy với cụm 4 buttons bên phải */}
				<ToolbarDivider />

				{/* Tuần trước */}
				<TooltipBox
					tooltip={<PlainTooltip>Tuần trước</PlainTooltip>}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Tuần trước"
						onClick={() => onShiftWeek(-7)}
					>
						<Icon name="chevron_left" size={24} />
					</ToolbarIconButton>
				</TooltipBox>

				{/* Mở date picker chọn ngày trong tuần */}
				<TooltipBox
					tooltip={<PlainTooltip>Chọn ngày trong lịch</PlainTooltip>}
					placement="top"
				>
					<Button
						colorStyle="tonal"
						size="sm"
						icon={
							<Icon
								name="calendar_month"
								className="text-base text-m3-primary"
							/>
						}
						onClick={onOpenDatePicker}
						className="font-medium shrink-0"
						title="Nhấn để chọn ngày trong lịch"
					>
						{formatDateViFromYmd(weekStart)}
					</Button>
				</TooltipBox>

				{/* Tuần sau */}
				<TooltipBox
					tooltip={<PlainTooltip>Tuần sau</PlainTooltip>}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Tuần sau"
						onClick={() => onShiftWeek(7)}
					>
						<Icon name="chevron_right" size={24} />
					</ToolbarIconButton>
				</TooltipBox>

				{/* Sao chép tuần sau */}
				<TooltipBox
					tooltip={
						<PlainTooltip>
							{copying
								? "Đang sao chép..."
								: "Sao chép toàn bộ tuần sang tuần sau"}
						</PlainTooltip>
					}
					placement="top"
				>
					<ToolbarIconButton
						aria-label="Sao chép toàn bộ tuần sang tuần sau"
						onClick={onCopyToNextWeek}
						disabled={copying || loading}
					>
						<Icon name="content_copy" size={24} />
					</ToolbarIconButton>
				</TooltipBox>
			</>
		),
		[
			copying,
			handleOpenRoomManager,
			loading,
			onCopyToNextWeek,
			onOpenDatePicker,
			onShiftWeek,
			weekStart,
		],
	);

	// Info Slot hiển thị trạng thái selection kèm thao tác nhanh (Copy / Delete / Clear)
	const infoSlot = useMemo(
		() => (
			<AnimatePresence>
				{hasSelection && (
					<motion.div
						key="schedule-selection-slot"
						initial={{ opacity: 0, scale: 0.8, width: 0 }}
						animate={{ opacity: 1, scale: 1, width: "auto" }}
						exit={{ opacity: 0, scale: 0.8, width: 0 }}
						transition={FAST_SPATIAL_SPRING}
						className="overflow-hidden flex shrink-0"
					>
						<div className="flex items-center gap-2 rounded-full bg-m3-surface-container-high pl-3 pr-2 py-2 text-xs shadow-xs text-m3-on-surface">
							<span className="font-semibold text-m3-primary px-2 whitespace-nowrap">
								Đã chọn {selectedCount}
							</span>

							{/* Sao chép các lịch đã chọn sang tuần sau */}
							<TooltipBox
								tooltip={
									<PlainTooltip>
										{copying
											? "Đang sao chép..."
											: `Sao chép ${selectedCount} lịch đã chọn sang tuần sau`}
									</PlainTooltip>
								}
								placement="top"
							>
								<IconButton
									aria-label="Sao chép các lịch đã chọn sang tuần sau"
									colorStyle="tonal"
									size="sm"
									onClick={onCopySelectedToNextWeek}
									disabled={copying || loading}
								>
									<Icon name="content_copy" size={20} />
								</IconButton>
							</TooltipBox>

							{/* Xóa các lịch đã chọn */}
							<TooltipBox
								tooltip={
									<PlainTooltip>Xóa {selectedCount} lịch đã chọn</PlainTooltip>
								}
								placement="top"
							>
								<IconButton
									aria-label="Xóa các lịch đã chọn"
									colorStyle="tonal"
									size="sm"
									className="text-m3-error! hover:bg-m3-error-container/20!"
									onClick={onDeleteSelected}
									disabled={loading}
								>
									<Icon name="delete" size={20} />
								</IconButton>
							</TooltipBox>

							{/* Bỏ chọn */}
							<TooltipBox
								tooltip={<PlainTooltip>Bỏ chọn</PlainTooltip>}
								placement="top"
							>
								<IconButton
									aria-label="Bỏ chọn"
									colorStyle="standard"
									size="sm"
									onClick={onClearSelection}
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
			copying,
			loading,
			onCopySelectedToNextWeek,
			onDeleteSelected,
			onClearSelection,
		],
	);

	return (
		<FloatingActionToolbar
			ariaLabel="Thanh công cụ quản lý lịch dạy"
			actions={actions}
			endFab={endFab}
			infoSlot={infoSlot}
			infoSlotPosition="before"
		/>
	);
};

export const ScheduleActionToolbar = memo(ScheduleActionToolbarComponent);
