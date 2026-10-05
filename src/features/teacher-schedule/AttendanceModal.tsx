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
	ScrollArea,
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
import { cn } from "../../utils/utils";
import { AttendanceTabContent } from "./AttendanceTabContent";
import { BonusTabContent } from "./BonusTabContent";
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
	bonusDraft?: Record<
		string,
		{ points: number; reason: string; category: string }
	>;
	onUpdateBonus?: (
		studentId: string,
		updates: Partial<{ points: number; reason: string; category: string }>,
	) => void;
	onSaveBonus?: () => void;
	bonusSaving?: boolean;
}

type M3IconName = ComponentProps<typeof Icon>["name"];
type ReportStepTab = "startLesson" | "professional" | "endLesson";

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
		value: "bonusPoints",
		label: "Điểm cộng",
		description: "Ghi nhận điểm cộng buổi học.",
		icon: "star",
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
	bonusDraft = {},
	onUpdateBonus = () => {},
	onSaveBonus = () => {},
	bonusSaving = false,
}: AttendanceModalProps) => {
	const activeReportTab: ReportStepTab | null =
		attendanceTab === "startLesson" ||
		attendanceTab === "professional" ||
		attendanceTab === "endLesson"
			? attendanceTab
			: null;

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
					className="flex max-h-[92vh] w-[calc(100%-2rem)] max-w-6xl flex-col overflow-hidden rounded-4xl bg-m3-surface-container p-0 text-m3-on-surface"
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
									leadingIcon={
										<Icon
											name="domain"
											size={16}
											className="text-m3-on-primary-container"
										/>
									}
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
					<ScrollArea
						type="scroll"
						orientation="both"
						className="min-h-0 flex-1"
						viewportClassName="p-4 sm:p-6"
					>
						<div className="flex flex-col gap-4">
							{attendanceLoading && (
								<div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
									<ProgressIndicator
										variant="circular"
										shape="wavy"
										size={64}
										aria-label="Đang tải danh sách học sinh..."
									/>
									<p className="text-xs text-m3-on-surface font-medium">
										Đang tải danh sách học sinh...
									</p>
								</div>
							)}

							{!attendanceLoading && attendanceData && (
								<>
									<div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
										{attendanceMenuItems.map((item) => {
											const isActive = attendanceTab === item.value;

											return (
												<Card
													key={item.value}
													variant="filled"
													interactive
													disableElevation
													onClick={() => onTabChange(item.value)}
													disabled={attendanceSaving}
													className={cn(
														"p-3.5 text-left cursor-pointer",
														isActive
															? "bg-m3-primary-container text-m3-on-primary-container"
															: "bg-m3-surface-container-lowest text-m3-on-surface",
													)}
												>
													<span
														className={cn(
															"flex items-center gap-2 text-sm font-bold",
															isActive
																? "text-m3-on-primary-container"
																: "text-m3-on-surface",
														)}
													>
														<Icon
															name={item.icon}
															size={18}
															className={
																isActive
																	? "text-m3-on-primary-container"
																	: "text-m3-on-surface"
															}
														/>
														{item.label}
													</span>
													<span
														className={cn(
															"mt-1.5 block text-xs leading-snug",
															isActive
																? "text-m3-on-primary-container/80"
																: "text-m3-on-surface-variant",
														)}
													>
														{item.description}
													</span>
												</Card>
											);
										})}
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
									) : attendanceTab === "bonusPoints" ? (
										<BonusTabContent
											attendanceData={attendanceData}
											attendanceDraft={attendanceDraft}
											bonusDraft={bonusDraft}
											onUpdateBonus={onUpdateBonus}
											onSaveBonus={onSaveBonus}
											bonusSaving={bonusSaving}
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
					</ScrollArea>

					{/* Modal Footer */}
					<DialogFooter className="gap-2 px-6 py-3 mt-0 bg-m3-surface-container">
						<Button
							colorStyle="text"
							onClick={() => handleSafeClose(onClose)}
							disabled={attendanceSaving}
						>
							Hủy
						</Button>
						<Button
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
