import {
	Button,
	Card,
	Chip,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogOverlay,
	DialogPortal,
	DialogTitle,
	Icon,
	ProgressIndicator,
} from "@bug-on/m3-expressive";
import type { ComponentProps } from "react";
import {
	DialogHeaderIcon,
	useUnsavedChangesGuard,
} from "../../components/common";
import type {
	AttendanceStatus,
	ScheduleAttendanceResponse,
	ScheduleEndLessonReport,
	ScheduleProfessionalReport,
	ScheduleReportsPayload,
	ScheduleStartLessonReport,
} from "../../types/schedule.types";
import { AttendanceTabContent } from "./AttendanceTabContent";
import { ReportTabContent } from "./ReportTabContent";
import type { AttendanceDraftState, AttendancePanelTab } from "./types";
import { formatDateViFromYmd, parseApiDateToLocalYmd } from "./utils";

interface AttendanceModalProps {
	open: boolean;
	attendanceLoading: boolean;
	attendanceSaving: boolean;
	attendanceSyncing: boolean;
	attendanceData: ScheduleAttendanceResponse | null;
	attendanceDraft: Record<string, AttendanceDraftState>;
	reportsDraft: ScheduleReportsPayload;
	attendanceTab: AttendancePanelTab;
	attendanceKeyword: string;
	attendanceNameSortDirection: "none" | "asc" | "desc";
	attendanceSchoolName: string;
	attendanceMissingMachinesByFormula: number | null;
	hasRoomSnapshot: boolean;
	hasUnsavedAttendanceChanges: boolean;
	attendanceStats: { present: number; absent: number };
	filteredAttendanceStudents: ScheduleAttendanceResponse["students"];
	onClose: () => void;
	onTabChange: (tab: AttendancePanelTab) => void;
	onKeywordChange: (keyword: string) => void;
	onToggleNameSort: () => void;
	onSetAllStatus: (status: AttendanceStatus) => void;
	onToggleStatus: (studentId: string) => void;
	onUpdateNote: (studentId: string, note: string) => void;
	onUpdateStartLessonField: (
		field: keyof ScheduleStartLessonReport,
		value: string,
	) => void;
	onUpdateProfessionalField: (
		field: keyof ScheduleProfessionalReport,
		value: string,
	) => void;
	onUpdateEndLessonField: (
		field: keyof ScheduleEndLessonReport,
		value: string,
	) => void;
	onSaveAttendance: () => void;
	onSyncToGoogleSheet: () => void;
}

type M3IconName = ComponentProps<typeof Icon>["name"];
type ReportStepTab = Exclude<AttendancePanelTab, "attendance">;

const attendanceMenuItems: {
	value: AttendancePanelTab;
	label: string;
	description: string;
	icon: M3IconName;
}[] = [
	{
		value: "attendance",
		label: "Điểm danh",
		description: "Cập nhật có mặt, vắng và ghi chú.",
		icon: "fact_check",
	},
	{
		value: "startLesson",
		label: "Báo cáo đầu buổi",
		description: "Thông tin phòng máy đầu buổi.",
		icon: "description",
	},
	{
		value: "professional",
		label: "Báo cáo chuyên môn",
		description: "Nội dung dạy, tài liệu và số tiết.",
		icon: "menu_book",
	},
	{
		value: "endLesson",
		label: "Báo cáo cuối buổi",
		description: "Sĩ số và tình trạng cuối buổi.",
		icon: "assignment",
	},
];

export const AttendanceModal = ({
	open,
	attendanceLoading,
	attendanceSaving,
	attendanceSyncing,
	attendanceData,
	attendanceDraft,
	reportsDraft,
	attendanceTab,
	attendanceKeyword,
	attendanceNameSortDirection,
	attendanceSchoolName,
	attendanceMissingMachinesByFormula,
	hasRoomSnapshot,
	hasUnsavedAttendanceChanges,
	attendanceStats,
	filteredAttendanceStudents,
	onClose,
	onTabChange,
	onKeywordChange,
	onToggleNameSort,
	onSetAllStatus,
	onToggleStatus,
	onUpdateNote,
	onUpdateStartLessonField,
	onUpdateProfessionalField,
	onUpdateEndLessonField,
	onSaveAttendance,
	onSyncToGoogleSheet,
}: AttendanceModalProps) => {
	const activeReportTab: ReportStepTab | null =
		attendanceTab === "attendance" ? null : attendanceTab;

	const { handleSafeClose } = useUnsavedChangesGuard({
		isDirty: hasUnsavedAttendanceChanges,
		isOpen: open,
		isSubmitting: attendanceSaving,
		message:
			"Bạn có dữ liệu điểm danh/báo cáo chưa lưu. Bạn có chắc muốn đóng?",
	});

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => !isOpen && handleSafeClose(onClose)}
		>
			<DialogPortal open={open}>
				<DialogOverlay />
				<DialogContent
					hideCloseButton
					className="flex max-h-[92vh] w-[calc(100%-2rem)] max-w-5xl flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl"
				>
					{/* Modal Header */}
					<div className="flex items-center justify-between px-6 pt-5 pb-3">
						<DialogHeader className="mb-0 flex-row items-center gap-3 space-y-0 text-left">
							<DialogHeaderIcon icon="fact_check" />
							<div>
								<DialogTitle className="text-lg font-bold text-m3-on-surface font-md3-expressive">
									Điểm danh học sinh
								</DialogTitle>
								<DialogDescription className="text-xs text-m3-on-surface-variant">
									{attendanceData ? (
										<span>
											{attendanceData.subject} - {attendanceData.className} -{" "}
											{formatDateViFromYmd(
												parseApiDateToLocalYmd(attendanceData.date),
											)}
											{" · "}
											{attendanceData.startTime} - {attendanceData.endTime}
										</span>
									) : (
										"Cập nhật thông tin điểm danh và báo cáo buổi dạy."
									)}
								</DialogDescription>
							</div>
						</DialogHeader>
					</div>

					{/* Sub-header info badges */}
					{(attendanceSchoolName || attendanceData?.computerRoom) && (
						<div className="flex flex-wrap items-center gap-2 px-6 pb-3 text-xs">
							{attendanceSchoolName ? (
								<Chip
									variant="assist"
									leadingIcon={<Icon name="domain" size={16} />}
									label={`Trường: ${attendanceSchoolName}`}
									className="border-0 bg-m3-primary-container text-m3-on-primary-container font-medium"
								/>
							) : null}
							{attendanceData?.computerRoom ? (
								<Chip
									variant="assist"
									leadingIcon={<Icon name="desktop_windows" size={16} />}
									label={
										<span>
											Phòng máy:{" "}
											<span className="font-semibold text-m3-on-surface">
												{attendanceData.computerRoom.name}
											</span>
											{" · "}
											Tổng máy:{" "}
											<span className="font-semibold text-m3-on-surface">
												{attendanceData.computerRoom.totalMachinesText}
											</span>
											{" · "}
											Máy lỗi:{" "}
											<span className="font-semibold text-m3-on-surface">
												{attendanceData.computerRoom.brokenMachineCount}
											</span>
											{" · "}
											Thiếu cho HS:{" "}
											<span className="font-semibold text-m3-on-surface">
												{attendanceMissingMachinesByFormula ??
													attendanceData.computerRoom
														.missingMachinesForStudents}
											</span>
										</span>
									}
									className="border-0 bg-m3-surface-container-highest text-m3-on-surface-variant"
								/>
							) : null}
							{attendanceData?.computerRoom?.brokenMachinesDetail ? (
								<Chip
									variant="assist"
									leadingIcon={<Icon name="error" size={16} />}
									label={`Chi tiết máy hỏng: ${attendanceData.computerRoom.brokenMachinesDetail}`}
									className="border-0 bg-m3-error-container text-m3-on-error-container"
								/>
							) : null}
						</div>
					)}

					{/* Content */}
					<div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
						{attendanceLoading && (
							<div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
								<ProgressIndicator
									variant="circular"
									shape="wavy"
									size={64}
									aria-label="Đang tải danh sách học sinh..."
								/>
								<p className="text-xs text-m3-on-surface-variant font-medium">
									Đang tải danh sách học sinh...
								</p>
							</div>
						)}

						{!attendanceLoading && attendanceData && (
							<>
								<div className="rounded-3xl bg-m3-surface-container p-3 sm:p-4">
									<p className="text-xs font-semibold uppercase tracking-wider text-m3-primary mb-2.5">
										Báo cáo
									</p>

									<div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
										{attendanceMenuItems.map((item) => {
											const isActive = attendanceTab === item.value;

											return (
												<Card
													key={item.value}
													variant="filled"
													interactive
													onClick={() => onTabChange(item.value)}
													disabled={attendanceSaving}
													className={`rounded-2xl p-3.5 text-left transition-all duration-200 cursor-pointer ${
														isActive
															? "bg-m3-primary-container text-m3-on-primary-container shadow-xs"
															: "bg-m3-surface-container-low hover:bg-m3-surface-container-low text-m3-on-surface"
													}`}
												>
													<span
														className={`flex items-center gap-2 text-sm font-bold ${
															isActive
																? "text-m3-on-primary-container"
																: "text-m3-on-surface"
														}`}
													>
														<Icon
															name={item.icon}
															size={18}
															className={
																isActive
																	? "text-m3-on-primary-container"
																	: "text-m3-primary"
															}
														/>
														{item.label}
													</span>
													<span
														className={`mt-1.5 block text-xs leading-snug ${
															isActive
																? "text-m3-on-primary-container/80"
																: "text-m3-on-surface-variant"
														}`}
													>
														{item.description}
													</span>
												</Card>
											);
										})}
									</div>
								</div>

								{attendanceTab === "attendance" ? (
									<AttendanceTabContent
										attendanceData={attendanceData}
										attendanceDraft={attendanceDraft}
										attendanceStats={attendanceStats}
										attendanceKeyword={attendanceKeyword}
										attendanceNameSortDirection={attendanceNameSortDirection}
										attendanceSyncing={attendanceSyncing}
										attendanceSaving={attendanceSaving}
										attendanceLoading={attendanceLoading}
										hasUnsavedAttendanceChanges={hasUnsavedAttendanceChanges}
										filteredAttendanceStudents={filteredAttendanceStudents}
										onKeywordChange={onKeywordChange}
										onToggleNameSort={onToggleNameSort}
										onSetAllStatus={onSetAllStatus}
										onToggleStatus={onToggleStatus}
										onUpdateNote={onUpdateNote}
										onSyncToGoogleSheet={onSyncToGoogleSheet}
									/>
								) : activeReportTab ? (
									<ReportTabContent
										activeStep={activeReportTab}
										reportsDraft={reportsDraft}
										hasRoomSnapshot={hasRoomSnapshot}
										attendanceData={attendanceData}
										attendanceDraft={attendanceDraft}
										onUpdateStartLessonField={onUpdateStartLessonField}
										onUpdateProfessionalField={onUpdateProfessionalField}
										onUpdateEndLessonField={onUpdateEndLessonField}
									/>
								) : null}
							</>
						)}
					</div>

					{/* Modal Footer */}
					<DialogFooter className="gap-2 border-t border-m3-outline-variant/60 px-6 py-3 mt-0 bg-m3-surface-container-high">
						<Button
							type="button"
							colorStyle="text"
							onClick={() => handleSafeClose(onClose)}
							disabled={attendanceSaving}
						>
							Hủy
						</Button>
						<Button
							type="button"
							colorStyle="filled"
							onClick={onSaveAttendance}
							disabled={
								attendanceSaving || attendanceLoading || !attendanceData
							}
							loading={attendanceSaving}
						>
							Lưu điểm danh &amp; báo cáo
						</Button>
					</DialogFooter>
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};
