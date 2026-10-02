import {
	Button,
	ButtonDistribute,
	Checkbox,
	Icon,
	IconButton,
} from "@bug-on/m3-expressive";
import {
	createColumnHelper,
	rowSelectionFeature,
	Subscribe,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { DataTable, TableEmptyState } from "../../components/data-table";
import type { ScheduleItem } from "../../types/schedule.types";
import {
	formatDateViFromYmd,
	getLessonTimelineStatus,
	getWeekdayLabelFromYmd,
	lessonTimelineStatusClasses,
	lessonTimelineStatusLabels,
	parseApiDateToLocalYmd,
} from "./utils";

export interface ScheduleTableProps {
	schedules: ScheduleItem[];
	loading: boolean;
	copying: boolean;
	todayYmd: string;
	nowMinutesInDay: number;
	selectedScheduleIds: string[];
	areAllSchedulesSelected: boolean;
	resolveSchoolNameForSchedule: (item: ScheduleItem) => string;
	onToggleSelectAll: () => void;
	onToggleSelectSchedule: (scheduleId: string) => void;
	onClearSelection: () => void;
	onDeleteSelected: () => void;
	onCopySelected: () => void;
	onOpenAttendance: (item: ScheduleItem) => void;
	onOpenEdit: (item: ScheduleItem) => void;
	onDeleteSchedule: (item: ScheduleItem) => void;
	hideSelectionBar?: boolean;
}

interface ScheduleTableMeta {
	selectionDisabled: boolean;
	resolveSchoolNameForSchedule: (item: ScheduleItem) => string;
	onToggleSelectAll: () => void;
	onToggleSelectSchedule: (scheduleId: string) => void;
	onOpenAttendance: (item: ScheduleItem) => void;
	onOpenEdit: (item: ScheduleItem) => void;
	onDeleteSchedule: (item: ScheduleItem) => void;
}

const features = tableFeatures({
	rowSelectionFeature,
});

const helper = createColumnHelper<typeof features, ScheduleItem>();

export const ScheduleTable = ({
	schedules,
	loading,
	copying,
	todayYmd,
	nowMinutesInDay,
	selectedScheduleIds,
	areAllSchedulesSelected: _areAllSchedulesSelected,
	resolveSchoolNameForSchedule,
	onToggleSelectAll,
	onToggleSelectSchedule,
	onClearSelection,
	onDeleteSelected,
	onCopySelected,
	onOpenAttendance,
	onOpenEdit,
	onDeleteSchedule,
	hideSelectionBar = false,
}: ScheduleTableProps) => {
	const rowSelection = useMemo<Record<string, true>>(() => {
		const map: Record<string, true> = {};
		for (const id of selectedScheduleIds) {
			map[id] = true;
		}
		return map;
	}, [selectedScheduleIds]);

	const columns = useMemo(
		() =>
			helper.columns([
				helper.display({
					id: "select",
					header: ({ table }) => {
						const meta = table.options.meta as ScheduleTableMeta | undefined;
						return (
							<div className="flex justify-center" data-no-row-click="true">
								<Subscribe
									source={table.atoms.rowSelection}
									selector={() => table.getIsAllRowsSelected()}
								>
									{(allSelected) => (
										<Checkbox
											checked={allSelected}
											onCheckedChange={meta?.onToggleSelectAll}
											disabled={meta?.selectionDisabled}
											aria-label="Chọn tất cả lịch trong tuần"
										/>
									)}
								</Subscribe>
							</div>
						);
					},
					meta: {
						className: "w-12 text-center",
						align: "center",
					},
					cell: ({ row, table }) => {
						const meta = table.options.meta as ScheduleTableMeta | undefined;
						return (
							<div className="flex justify-center" data-no-row-click="true">
								<Subscribe
									source={row.table.atoms.rowSelection}
									selector={(selection) =>
										Boolean(selection?.[row.original.id])
									}
								>
									{(isSelected) => (
										<Checkbox
											checked={isSelected}
											onCheckedChange={() =>
												meta?.onToggleSelectSchedule(row.original.id)
											}
											aria-label={`Chọn lịch ${row.original.subject} - ${row.original.className}`}
										/>
									)}
								</Subscribe>
							</div>
						);
					},
				}),
				helper.display({
					id: "status",
					header: "Trạng thái",
					meta: {
						className: "whitespace-nowrap",
					},
					cell: ({ row }) => {
						const item = row.original;
						const localYmd = parseApiDateToLocalYmd(item.date);
						const lessonStatus = getLessonTimelineStatus(
							localYmd,
							todayYmd,
							nowMinutesInDay,
							item.startTime,
							item.endTime,
						);
						return (
							<span
								className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${lessonTimelineStatusClasses[lessonStatus]}`}
							>
								{lessonTimelineStatusLabels[lessonStatus]}
							</span>
						);
					},
				}),
				helper.display({
					id: "date",
					header: "Ngày",
					meta: {
						className: "whitespace-nowrap",
					},
					cell: ({ row }) => {
						const localYmd = parseApiDateToLocalYmd(row.original.date);
						const isToday = localYmd === todayYmd;
						return (
							<div className="flex items-center gap-2 text-m3-on-surface">
								<span>{formatDateViFromYmd(localYmd)}</span>
								{isToday ? (
									<span className="rounded-full bg-m3-tertiary/15 px-2 py-0.5 text-[11px] font-semibold text-m3-tertiary">
										Hôm nay
									</span>
								) : null}
							</div>
						);
					},
				}),
				helper.display({
					id: "weekday",
					header: "Thứ",
					meta: {
						className: "whitespace-nowrap",
					},
					cell: ({ row }) => {
						const localYmd = parseApiDateToLocalYmd(row.original.date);
						return (
							<span className="text-m3-on-surface">
								{getWeekdayLabelFromYmd(localYmd)}
							</span>
						);
					},
				}),
				helper.accessor("periodLabel", {
					header: "Tiết",
					meta: {
						className: "whitespace-nowrap",
					},
					cell: ({ getValue }) => (
						<span className="text-m3-on-surface">{getValue() || "-"}</span>
					),
				}),
				helper.display({
					id: "time",
					header: "Thời gian",
					meta: {
						className: "whitespace-nowrap",
					},
					cell: ({ row }) => (
						<span className="text-m3-on-surface">
							{row.original.startTime} - {row.original.endTime}
						</span>
					),
				}),
				helper.accessor("subject", {
					header: "Môn học",
					meta: {
						className: "whitespace-nowrap",
					},
					cell: ({ getValue }) => (
						<span className="font-semibold text-m3-on-surface">
							{getValue()}
						</span>
					),
				}),
				helper.accessor("className", {
					header: "Lớp",
					meta: {
						className: "whitespace-nowrap",
					},
					cell: ({ getValue }) => (
						<span className="text-m3-on-surface">{getValue()}</span>
					),
				}),
				helper.display({
					id: "school",
					header: "Trường",
					meta: {
						className: "whitespace-nowrap",
					},
					cell: ({ row, table }) => {
						const meta = table.options.meta as ScheduleTableMeta | undefined;
						const schoolName =
							meta?.resolveSchoolNameForSchedule(row.original) ?? "";
						return (
							<span className="text-m3-on-surface-variant">
								{schoolName || (
									<span className="text-m3-on-surface-variant/40">
										Chưa gán trường
									</span>
								)}
							</span>
						);
					},
				}),
				helper.accessor("roomName", {
					header: "Phòng",
					meta: {
						className: "whitespace-nowrap",
					},
					cell: ({ getValue }) => (
						<span className="text-m3-on-surface">{getValue() || "-"}</span>
					),
				}),
				helper.accessor("notes", {
					header: "Ghi chú",
					meta: {
						className: "whitespace-nowrap",
					},
					cell: ({ getValue }) => (
						<div className="max-w-65 truncate text-m3-on-surface-variant">
							{getValue() || "-"}
						</div>
					),
				}),
				helper.display({
					id: "actions",
					header: "Hành động",
					meta: {
						className: "text-right",
						align: "right",
					},
					cell: ({ row, table }) => {
						const meta = table.options.meta as ScheduleTableMeta | undefined;
						return (
							<div className="flex justify-end" data-no-row-click="true">
								<ButtonDistribute
									mode="dynamic"
									size="sm"
									weights={[2, 2, 1]}
									gap={4}
									expandRatio={0.1}
								>
									<IconButton
										aria-label="Điểm danh"
										size="sm"
										onClick={(event) => {
											event.stopPropagation();
											meta?.onOpenAttendance(row.original);
										}}
									>
										<Icon name="fact_check" size={20} />
									</IconButton>
									<IconButton
										aria-label="Chỉnh sửa"
										size="sm"
										onClick={(event) => {
											event.stopPropagation();
											meta?.onOpenEdit(row.original);
										}}
									>
										<Icon name="edit" size={20} />
									</IconButton>
									<IconButton
										aria-label="Xóa"
										colorStyle="standard"
										size="sm"
										className="border-m3-error/30! text-m3-error! hover:bg-m3-error-container/20!"
										onClick={(event) => {
											event.stopPropagation();
											meta?.onDeleteSchedule(row.original);
										}}
									>
										<Icon name="delete" size={20} />
									</IconButton>
								</ButtonDistribute>
							</div>
						);
					},
				}),
			]),
		[todayYmd, nowMinutesInDay],
	);

	const tableMeta = useMemo<ScheduleTableMeta>(
		() => ({
			selectionDisabled: loading || schedules.length === 0,
			resolveSchoolNameForSchedule,
			onToggleSelectAll,
			onToggleSelectSchedule,
			onOpenAttendance,
			onOpenEdit,
			onDeleteSchedule,
		}),
		[
			loading,
			schedules.length,
			resolveSchoolNameForSchedule,
			onToggleSelectAll,
			onToggleSelectSchedule,
			onOpenAttendance,
			onOpenEdit,
			onDeleteSchedule,
		],
	);

	const table = useTable({
		features,
		columns,
		data: schedules,
		getRowId: (row) => row.id,
		state: {
			rowSelection,
		},
		meta: tableMeta,
		enableRowSelection: true,
	});

	return (
		<div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
			{!hideSelectionBar && selectedScheduleIds.length > 0 && (
				<section className="shrink-0 overflow-hidden rounded-2xl bg-m3-surface-container p-4 shadow-xs">
					<div className="flex flex-col gap-3 rounded-2xl border border-m3-primary/30 bg-m3-primary/10 px-4 py-3 text-sm text-m3-on-surface sm:flex-row sm:items-center sm:justify-between">
						<p>
							Đã chọn <strong>{selectedScheduleIds.length}</strong> lịch dạy
						</p>
						<div className="flex flex-wrap items-center gap-2">
							<Button
								colorStyle="tonal"
								size="sm"
								icon={<Icon name="content_copy" className="text-sm" />}
								onClick={onCopySelected}
								disabled={copying || loading}
							>
								{copying ? "Đang sao chép..." : "Sao chép đã chọn"}
							</Button>
							<Button
								colorStyle="outlined"
								size="sm"
								className="border-m3-error/40! text-m3-error! hover:bg-m3-error-container/20!"
								icon={<Icon name="delete" className="text-sm" />}
								onClick={onDeleteSelected}
								disabled={loading}
							>
								Xóa đã chọn
							</Button>
							<Button colorStyle="text" size="sm" onClick={onClearSelection}>
								Bỏ chọn
							</Button>
						</div>
					</div>
				</section>
			)}

			<DataTable
				table={table}
				isLoading={loading}
				loadingAriaLabel="Đang tải lịch dạy..."
				stickyHeader={true}
				className="flex-1 min-h-0 flex flex-col overflow-hidden"
				scrollContainerClassName="flex-1 min-h-0"
				minWidthClassName="min-w-[1080px] w-full text-sm"
				onRowClick={(row, event) => {
					if ((event.target as HTMLElement).closest("[data-no-row-click]")) {
						return;
					}
					onOpenAttendance(row.original);
				}}
				getRowClassName={(row) => {
					const isSelected = Boolean(rowSelection[row.original.id]);
					const localYmd = parseApiDateToLocalYmd(row.original.date);
					const isToday = localYmd === todayYmd;
					return isSelected
						? "bg-m3-primary/10 hover:bg-m3-primary/15"
						: isToday
							? "bg-m3-tertiary/10 hover:bg-m3-tertiary/15"
							: "";
				}}
				emptyState={
					<TableEmptyState
						icon="event_busy"
						title="Tuần này chưa có lịch dạy."
						description="Bấm 'Thêm lịch dạy' để tạo buổi học mới."
					/>
				}
				footerSlot={
					<div className="shrink-0 border-t border-m3-outline-variant/60 bg-m3-surface-container-high/40 px-4 py-2.5 text-xs text-m3-on-surface-variant">
						Mẹo: bấm vào dòng lịch hoặc nút{" "}
						<span className="font-semibold text-m3-primary">Điểm danh</span> để
						mở điểm danh. Tick checkbox để chọn nhiều lịch rồi xóa/sao chép cùng
						lúc.
					</div>
				}
			/>
		</div>
	);
};
