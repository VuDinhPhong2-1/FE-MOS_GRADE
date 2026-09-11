import { Button, Icon } from "@bug-on/m3-expressive";
import type {
	AttendanceStatus,
	ScheduleAttendanceResponse,
	ScheduleAttendanceStudent,
} from "../../types/schedule.types";
import type { AttendanceDraftState } from "./types";

interface AttendanceTabContentProps {
	attendanceData: ScheduleAttendanceResponse | null;
	attendanceDraft: Record<string, AttendanceDraftState>;
	attendanceStats: { present: number; absent: number };
	attendanceKeyword: string;
	attendanceNameSortDirection: "none" | "asc" | "desc";
	attendanceSyncing: boolean;
	attendanceSaving: boolean;
	attendanceLoading: boolean;
	hasUnsavedAttendanceChanges: boolean;
	filteredAttendanceStudents: ScheduleAttendanceStudent[];
	onKeywordChange: (keyword: string) => void;
	onToggleNameSort: () => void;
	onSetAllStatus: (status: AttendanceStatus) => void;
	onToggleStatus: (studentId: string) => void;
	onUpdateNote: (studentId: string, note: string) => void;
	onSyncToGoogleSheet: () => void;
}

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
	return (
		<div className="space-y-4 pt-3">
			<div className="grid gap-2 sm:grid-cols-2">
				<div className="rounded-2xl border border-m3-primary/30 bg-m3-primary-container/20 px-4 py-2.5 text-sm text-m3-on-primary-container">
					Có mặt: <strong>{attendanceStats.present}</strong>
				</div>
				<div className="rounded-2xl border border-m3-error/30 bg-m3-error-container/20 px-4 py-2.5 text-sm text-m3-on-error-container">
					Vắng: <strong>{attendanceStats.absent}</strong>
				</div>
			</div>

			<div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
				<input
					value={attendanceKeyword}
					onChange={(event) => onKeywordChange(event.target.value)}
					placeholder="Tìm theo tên học sinh..."
					className="w-full rounded-xl border border-m3-outline-variant bg-m3-surface px-3.5 py-2 text-sm text-m3-on-surface focus:border-m3-primary focus:outline-hidden sm:max-w-xs"
				/>

				<Button
					type="button"
					colorStyle="outlined"
					size="sm"
					onClick={onToggleNameSort}
					title="Sắp xếp theo tên"
				>
					Tên{" "}
					{attendanceNameSortDirection === "asc"
						? "▲"
						: attendanceNameSortDirection === "desc"
							? "▼"
							: "⇅"}
				</Button>

				<Button
					type="button"
					colorStyle="tonal"
					size="sm"
					icon={<Icon name="done_all" className="text-sm" />}
					onClick={() => onSetAllStatus("Present")}
				>
					Tất cả có mặt
				</Button>

				<Button
					type="button"
					colorStyle="outlined"
					size="sm"
					className="border-m3-error/40! text-m3-error! hover:bg-m3-error-container/20!"
					onClick={() => onSetAllStatus("Absent")}
				>
					Tất cả vắng
				</Button>

				<Button
					type="button"
					colorStyle="tonal"
					size="sm"
					icon={
						<Icon
							name="refresh"
							className={attendanceSyncing ? "animate-spin text-sm" : "text-sm"}
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

			<p className="text-xs text-m3-on-surface-variant">
				Chạm vào nút trạng thái của từng học sinh để đổi nhanh giữa{" "}
				<strong>Có mặt</strong> và <strong>Vắng</strong>.
			</p>

			{/* Mobile view */}
			<div className="space-y-2 md:hidden">
				{filteredAttendanceStudents.map((student, index) => {
					const draft = attendanceDraft[student.studentId] ?? {
						status: "Present" as AttendanceStatus,
						note: "",
					};
					const isAbsent = draft.status === "Absent";
					return (
						<article
							key={student.studentId}
							className={`rounded-2xl border p-3.5 transition-colors ${
								isAbsent
									? "border-m3-error/40 bg-m3-error-container/20 text-m3-on-error-container"
									: "border-m3-outline-variant/60 bg-m3-surface-container text-m3-on-surface"
							}`}
						>
							<div className="flex items-start justify-between gap-3">
								<div>
									<p className="text-xs text-m3-on-surface-variant">
										#{index + 1}
									</p>
									<p className="font-semibold text-m3-on-surface">
										{student.middleName} {student.firstName}
									</p>
									<p className="text-xs text-m3-on-surface-variant">
										Trạng thái học sinh: {student.studentStatus || "-"}
									</p>
								</div>
								<Button
									type="button"
									colorStyle={isAbsent ? "outlined" : "filled"}
									size="sm"
									className={isAbsent ? "border-m3-error! text-m3-error!" : ""}
									onClick={() => onToggleStatus(student.studentId)}
								>
									{isAbsent ? "Vắng" : "Có mặt"}
								</Button>
							</div>

							<input
								value={draft.note}
								onChange={(event) =>
									onUpdateNote(student.studentId, event.target.value)
								}
								className="mt-2.5 w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-1.5 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
								placeholder="Ghi chú..."
							/>
						</article>
					);
				})}

				{filteredAttendanceStudents.length === 0 && (
					<div className="rounded-2xl border border-m3-outline-variant/60 bg-m3-surface-container px-3 py-8 text-center text-sm text-m3-on-surface-variant">
						Không có học sinh phù hợp với từ khóa tìm kiếm.
					</div>
				)}
			</div>

			{/* Desktop table */}
			<div className="hidden overflow-x-auto rounded-2xl border border-m3-outline-variant/60 md:block">
				<table className="min-w-full text-sm">
					<thead className="bg-m3-surface-container-high text-m3-on-surface-variant">
						<tr>
							<th className="px-3 py-2 text-left font-semibold">STT</th>
							<th className="px-3 py-2 text-left font-semibold">
								<button
									type="button"
									onClick={onToggleNameSort}
									className="inline-flex items-center gap-1 hover:text-m3-on-surface"
									title="Sắp xếp theo tên"
								>
									Họ và tên
									<span className="text-[10px] text-m3-on-surface-variant/60">
										{attendanceNameSortDirection === "asc"
											? "▲"
											: attendanceNameSortDirection === "desc"
												? "▼"
												: "⇅"}
									</span>
								</button>
							</th>
							<th className="px-3 py-2 text-left font-semibold">Trạng thái</th>
							<th className="px-3 py-2 text-left font-semibold">
								Ghi chú điểm danh
							</th>
						</tr>
					</thead>
					<tbody>
						{filteredAttendanceStudents.map((student, index) => {
							const draft = attendanceDraft[student.studentId] ?? {
								status: "Present" as AttendanceStatus,
								note: "",
							};
							const isAbsent = draft.status === "Absent";
							return (
								<tr
									key={student.studentId}
									className={`border-t border-m3-outline-variant/30 transition-colors hover:bg-m3-surface-container-high/60 ${
										isAbsent ? "bg-m3-error-container/15" : ""
									}`}
								>
									<td className="px-3 py-2 text-m3-on-surface-variant">
										{index + 1}
									</td>
									<td className="px-3 py-2.5">
										<p className="font-medium text-m3-on-surface">
											{student.middleName} {student.firstName}
										</p>
										<p className="text-xs text-m3-on-surface-variant">
											Trạng thái: {student.studentStatus || "-"}
										</p>
									</td>
									<td className="px-3 py-2.5">
										<Button
											type="button"
											colorStyle={isAbsent ? "outlined" : "tonal"}
											size="xs"
											className={
												isAbsent ? "border-m3-error/50! text-m3-error!" : ""
											}
											onClick={() => onToggleStatus(student.studentId)}
										>
											{isAbsent ? "Vắng" : "Có mặt"}
										</Button>
									</td>
									<td className="px-3 py-2.5">
										<input
											value={draft.note}
											onChange={(event) =>
												onUpdateNote(student.studentId, event.target.value)
											}
											className="w-full min-w-60 rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-1.5 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
											placeholder="Ghi chú..."
										/>
									</td>
								</tr>
							);
						})}
						{filteredAttendanceStudents.length === 0 && (
							<tr>
								<td
									colSpan={4}
									className="px-3 py-8 text-center text-m3-on-surface-variant"
								>
									Không có học sinh phù hợp với từ khóa tìm kiếm.
								</td>
							</tr>
						)}
					</tbody>
				</table>
			</div>
		</div>
	);
};
