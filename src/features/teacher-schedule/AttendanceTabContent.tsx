import { Button, Card, Icon, Text, TextField } from "@bug-on/m3-expressive";
import {
	createColumnHelper,
	createSortedRowModel,
	rowSortingFeature,
	tableFeatures,
	useTable,
} from "@tanstack/react-table";
import { memo, useMemo } from "react";
import {
	DataTable,
	SortableHeader,
	TableEmptyState,
} from "../../components/data-table";
import type {
	AttendanceStatus,
	ScheduleAttendanceResponse,
	ScheduleAttendanceStudent,
} from "../../types/schedule.types";
import type { AttendanceDraftState } from "./types";
import { vietnameseCollator } from "./utils";

export interface AttendanceTabContentProps {
	attendanceData: ScheduleAttendanceResponse | null;
	attendanceDraft: Record<string, AttendanceDraftState>;
	attendanceStats: { present: number; absent: number };
	attendanceKeyword: string;
	attendanceNameSortDirection?: "none" | "asc" | "desc";
	attendanceSyncing: boolean;
	attendanceSaving: boolean;
	attendanceLoading: boolean;
	hasUnsavedAttendanceChanges: boolean;
	filteredAttendanceStudents: ScheduleAttendanceStudent[];
	onKeywordChange: (keyword: string) => void;
	onToggleNameSort?: () => void;
	onSetAllStatus: (status: AttendanceStatus) => void;
	onToggleStatus: (studentId: string) => void;
	onUpdateNote: (studentId: string, note: string) => void;
	onSyncToGoogleSheet: () => void;
}

interface AttendanceTableMeta {
	attendanceDraft: Record<string, AttendanceDraftState>;
	onToggleStatus: (studentId: string) => void;
	onUpdateNote: (studentId: string, note: string) => void;
}

const AttendanceStatusCell = memo(function AttendanceStatusCell({
	studentId,
	status,
	onToggle,
}: {
	studentId: string;
	status: AttendanceStatus;
	onToggle: (studentId: string) => void;
}) {
	const isAbsent = status === "Absent";
	return (
		<Button
			colorStyle={isAbsent ? "outlined" : "tonal"}
			size="sm"
			className={isAbsent ? "border-m3-error/50! text-m3-error!" : ""}
			onClick={() => onToggle(studentId)}
		>
			{isAbsent ? "Vắng" : "Có mặt"}
		</Button>
	);
});

const AttendanceNoteCell = memo(function AttendanceNoteCell({
	studentId,
	note,
	onUpdateNote,
}: {
	studentId: string;
	note: string;
	onUpdateNote: (studentId: string, note: string) => void;
}) {
	return (
		<TextField
			dense
			variant="outlined"
			value={note}
			onChange={(val) => onUpdateNote(studentId, val)}
			placeholder="Ghi chú..."
			fullWidth
			className="min-w-56"
		/>
	);
});

const StudentAttendanceMobileCard = memo(function StudentAttendanceMobileCard({
	student,
	index,
	draft,
	onToggleStatus,
	onUpdateNote,
}: {
	student: ScheduleAttendanceStudent;
	index: number;
	draft?: AttendanceDraftState;
	onToggleStatus: (studentId: string) => void;
	onUpdateNote: (studentId: string, note: string) => void;
}) {
	const isAbsent = draft?.status === "Absent";
	return (
		<Card
			variant="filled"
			className={`rounded-2xl p-3.5 transition-colors ${
				isAbsent
					? "bg-m3-error-container/25 text-m3-on-error-container"
					: "bg-m3-surface-container text-m3-on-surface"
			}`}
		>
			<div className="flex items-start justify-between gap-3">
				<div>
					<Text variant="label-sm" className="text-xs text-m3-on-surface-variant">#{index + 1}</Text>
					<Text variant="body-md" className="font-semibold text-m3-on-surface">
						{student.middleName} {student.firstName}
					</Text>
					<Text variant="body-sm" className="text-xs text-m3-on-surface-variant">
						Trạng thái học sinh: {student.studentStatus || "-"}
					</Text>
				</div>
				<Button
					colorStyle={isAbsent ? "outlined" : "filled"}
					size="sm"
					className={isAbsent ? "border-m3-error! text-m3-error!" : ""}
					onClick={() => onToggleStatus(student.studentId)}
				>
					{isAbsent ? "Vắng" : "Có mặt"}
				</Button>
			</div>

			<div className="mt-2.5">
				<TextField
					dense
					variant="filled"
					value={draft?.note ?? ""}
					onChange={(val) => onUpdateNote(student.studentId, val)}
					placeholder="Ghi chú..."
					className="w-full"
				/>
			</div>
		</Card>
	);
});

const features = tableFeatures({
	rowSortingFeature,
	sortedRowModel: createSortedRowModel(),
});

const helper = createColumnHelper<typeof features, ScheduleAttendanceStudent>();

export const AttendanceTabContent = ({
	attendanceData,
	attendanceDraft,
	attendanceStats,
	attendanceKeyword,
	attendanceNameSortDirection,
	attendanceSyncing,
	attendanceSaving,
	attendanceLoading,
	hasUnsavedAttendanceChanges,
	filteredAttendanceStudents,
	onKeywordChange,
	onToggleNameSort,
	onSetAllStatus,
	onToggleStatus,
	onUpdateNote,
	onSyncToGoogleSheet,
}: AttendanceTabContentProps) => {
	const columns = useMemo(
		() =>
			helper.columns([
				helper.display({
					id: "index",
					header: "STT",
					meta: {
						className: "w-16 text-center",
						align: "center",
					},
					cell: ({ row }) => (
						<span className="text-m3-on-surface-variant">{row.index + 1}</span>
					),
				}),
				helper.accessor("firstName", {
					id: "name",
					header: ({ header }) => (
						<SortableHeader header={header} title="Họ và tên" />
					),
					meta: {
						className: "px-3 py-2.5",
					},
					sortFn: (rowA, rowB) => {
						const byFirst = vietnameseCollator.compare(
							rowA.original.firstName || "",
							rowB.original.firstName || "",
						);
						if (byFirst !== 0) return byFirst;
						return vietnameseCollator.compare(
							rowA.original.middleName || "",
							rowB.original.middleName || "",
						);
					},
					cell: ({ row }) => (
						<div>
							<Text variant="body-md" className="font-medium text-m3-on-surface">
								{row.original.middleName} {row.original.firstName}
							</Text>
							<Text variant="body-sm" className="text-xs text-m3-on-surface-variant">
								Trạng thái: {row.original.studentStatus || "-"}
							</Text>
						</div>
					),
				}),
				helper.display({
					id: "status",
					header: "Trạng thái",
					meta: {
						className: "px-3 py-2.5",
					},
					cell: ({ row, table }) => {
						const meta = table.options.meta as AttendanceTableMeta | undefined;
						const status =
							meta?.attendanceDraft[row.original.studentId]?.status ??
							"Present";
						return (
							<AttendanceStatusCell
								studentId={row.original.studentId}
								status={status}
								onToggle={meta?.onToggleStatus ?? (() => {})}
							/>
						);
					},
				}),
				helper.display({
					id: "note",
					header: "Ghi chú điểm danh",
					meta: {
						className: "px-3 py-1.5",
					},
					cell: ({ row, table }) => {
						const meta = table.options.meta as AttendanceTableMeta | undefined;
						const note =
							meta?.attendanceDraft[row.original.studentId]?.note ?? "";
						return (
							<AttendanceNoteCell
								studentId={row.original.studentId}
								note={note}
								onUpdateNote={meta?.onUpdateNote ?? (() => {})}
							/>
						);
					},
				}),
			]),
		[],
	);

	const tableMeta = useMemo<AttendanceTableMeta>(
		() => ({
			attendanceDraft,
			onToggleStatus,
			onUpdateNote,
		}),
		[attendanceDraft, onToggleStatus, onUpdateNote],
	);

	const table = useTable({
		features,
		columns,
		data: filteredAttendanceStudents,
		getRowId: (row) => row.studentId,
		meta: tableMeta,
	});

	const nameColumn = table.getColumn("name");
	const isNameSorted = nameColumn?.getIsSorted();

	const handleHeaderSort = () => {
		if (nameColumn) {
			nameColumn.toggleSorting();
		} else if (onToggleNameSort) {
			onToggleNameSort();
		}
	};

	const sortIndicator =
		isNameSorted === "asc"
			? "▲"
			: isNameSorted === "desc"
				? "▼"
				: attendanceNameSortDirection === "asc"
					? "▲"
					: attendanceNameSortDirection === "desc"
						? "▼"
						: "⇅";

	return (
		<div className="space-y-4 pt-4">
			<div className="grid gap-2 sm:grid-cols-2">
				<Card
					variant="filled"
					className="bg-m3-primary-container px-4 py-3 text-sm text-m3-on-primary-container"
				>
					<span className="flex items-center gap-2 font-medium">
						<Icon
							name="check_circle"
							size={18}
							className="text-m3-on-primary-container"
						/>
						Có mặt:{" "}
						<strong className="text-base">{attendanceStats.present}</strong>
					</span>
				</Card>
				<Card
					variant="filled"
					className="bg-m3-error-container px-4 py-3 text-sm text-m3-on-error-container"
				>
					<span className="flex items-center gap-2 font-medium">
						<Icon
							name="cancel"
							size={18}
							className="text-m3-on-error-container"
						/>
						Vắng:{" "}
						<strong className="text-base">{attendanceStats.absent}</strong>
					</span>
				</Card>
			</div>

			<div className="flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
				<TextField
					dense
					variant="outlined"
					value={attendanceKeyword}
					onChange={onKeywordChange}
					placeholder="Tìm theo tên học sinh..."
					leadingIcon={<Icon name="search" size={18} />}
					trailingIconMode="clear"
					className="w-full sm:max-w-xs"
				/>

				<Button
					colorStyle="outlined"
					size="sm"
					onClick={handleHeaderSort}
					title="Sắp xếp theo tên"
				>
					Tên {sortIndicator}
				</Button>

				<Button
					colorStyle="filled"
					size="sm"
					icon={<Icon name="done_all" size={20} />}
					onClick={() => onSetAllStatus("Present")}
				>
					Tất cả có mặt
				</Button>

				<Button
					colorStyle="outlined"
					size="sm"
					className="border-m3-error/40! text-m3-error! hover:bg-m3-error-container/20!"
					onClick={() => onSetAllStatus("Absent")}
				>
					Tất cả vắng
				</Button>

				<Button
					colorStyle="tonal"
					size="sm"
					icon={
						<Icon
							name="refresh"
							size={20}
							className={attendanceSyncing ? "animate-spin" : ""}
						/>
					}
					onClick={onSyncToGoogleSheet}
					disabled={
						attendanceSyncing ||
						attendanceSaving ||
						attendanceLoading ||
						!attendanceData ||
						hasUnsavedAttendanceChanges
					}
					title={
						hasUnsavedAttendanceChanges
							? "Lưu điểm danh trước khi đồng bộ Google Sheet"
							: "Đồng bộ điểm danh đã lưu với Google Sheet"
					}
				>
					{attendanceSyncing ? "Đang đồng bộ..." : "Đồng bộ GG Sheet"}
				</Button>
			</div>

			<Text variant="body-sm" className="text-xs text-m3-on-surface-variant">
				Chạm vào nút trạng thái của từng học sinh để đổi nhanh giữa{" "}
				<strong>Có mặt</strong> và <strong>Vắng</strong>.
			</Text>

			{/* Mobile view */}
			<div className="space-y-2.5 md:hidden">
				{table.getRowModel().rows.map((row, index) => {
					const student = row.original;
					return (
						<StudentAttendanceMobileCard
							key={student.studentId}
							student={student}
							index={index}
							draft={attendanceDraft[student.studentId]}
							onToggleStatus={onToggleStatus}
							onUpdateNote={onUpdateNote}
						/>
					);
				})}

				{filteredAttendanceStudents.length === 0 && (
					<Card
						variant="filled"
						className="rounded-2xl bg-m3-surface-container px-3 py-8 text-center text-sm text-m3-on-surface-variant"
					>
						Không có học sinh phù hợp với từ khóa tìm kiếm.
					</Card>
				)}
			</div>

			{/* Desktop table with TanStack Table v9 DataTable */}
			<div className="hidden md:block">
				<DataTable
					table={table}
					isLoading={attendanceLoading}
					loadingAriaLabel="Đang tải danh sách điểm danh..."
					minWidthClassName="min-w-175 w-full text-sm"
					scrollContainerClassName="max-h-[60vh]"
					stickyHeader
					getRowClassName={(row) => {
						const draft = attendanceDraft[row.original.studentId] ?? {
							status: "Present" as AttendanceStatus,
							note: "",
						};
						return draft.status === "Absent" ? "bg-m3-error-container/15" : "";
					}}
					emptyState={
						<TableEmptyState
							icon="person_search"
							title="Không có học sinh phù hợp với từ khóa tìm kiếm."
						/>
					}
				/>
			</div>
		</div>
	);
};
