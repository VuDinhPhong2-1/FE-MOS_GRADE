import {
	Button,
	DatePicker,
	DatePickerDialog,
	useDatePickerState,
} from "@bug-on/m3-expressive";
import {
	type FormEvent,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePageHeader } from "../context/PageActionsContext";
import {
	AttendanceModal,
	createDefaultForm,
	formatDateViFromYmd,
	getWeekStart,
	isDateInWeek,
	normalizeTimeValue,
	parseApiDateToLocalYmd,
	ScheduleActionToolbar,
	ScheduleFormModal,
	type ScheduleFormState,
	ScheduleTable,
	toYmd,
	useAttendancePanel,
	useScheduleData,
	utcMsToYmd,
	ymdToUtcMs,
} from "../features/teacher-schedule";
import { scheduleService } from "../services/schedule.service";
import type {
	ScheduleItem,
	UpdateScheduleRequest,
} from "../types/schedule.types";
import { notify } from "../utils/notify";

const TeacherSchedule = () => {
	const navigate = useNavigate();
	const { getAccessToken, user } = useAuth();
	const teacherDisplayName = user?.fullName || user?.username || "";

	// Timer tick for real-time lesson status (ongoing / upcoming / done)
	const [nowTick, setNowTick] = useState<number>(() => Date.now());
	useEffect(() => {
		const timer = window.setInterval(() => setNowTick(Date.now()), 30_000);
		return () => window.clearInterval(timer);
	}, []);

	const nowMinutesInDay = useMemo(() => {
		const now = new Date(nowTick);
		return now.getHours() * 60 + now.getMinutes();
	}, [nowTick]);
	const todayYmd = useMemo(() => toYmd(new Date(nowTick)), [nowTick]);

	// Hook: Schedule data, week navigation & bulk actions
	const {
		weekStart,
		weekEnd,
		setWeekStart,
		shiftWeek,
		schedules,
		classes,
		schools,
		computerRooms,
		computerRoomsLoading,
		loading,
		copying,
		selectedScheduleIds,
		setSelectedScheduleIds,
		areAllSchedulesSelected,
		toggleScheduleSelection,
		toggleSelectAllSchedules,
		handleDeleteSchedule,
		handleDeleteSelected,
		handleCopyToNextWeek,
		handleCopySelectedToNextWeek,
		loadSchedules,
		loadComputerRoomsForForm,
		resolveSchoolNameForSchedule,
	} = useScheduleData({ getAccessToken });

	// State for Date Picker dialog
	const [datePickerOpen, setDatePickerOpen] = useState(false);

	const datePickerState = useDatePickerState({
		initialSelectedDateMs: weekStart ? ymdToUtcMs(weekStart) : null,
		locale: { locale: "vi-VN", weekStartsOn: 1 },
	});

	const { selectDate, navigateToMonth } = datePickerState;

	// Sync datePickerState when weekStart changes (e.g. from Tuần trước / Tuần sau)
	useEffect(() => {
		if (weekStart) {
			const ms = ymdToUtcMs(weekStart);
			selectDate(ms);
			const [y, m] = weekStart.split("-").map(Number);
			if (y && m) {
				navigateToMonth(y, m - 1);
			}
		}
	}, [weekStart, selectDate, navigateToMonth]);

	const handleConfirmDate = useCallback(() => {
		if (datePickerState.selectedDateMs !== null) {
			const ymd = utcMsToYmd(datePickerState.selectedDateMs);
			setWeekStart(toYmd(getWeekStart(new Date(`${ymd}T00:00:00`))));
		}
		setDatePickerOpen(false);
	}, [datePickerState.selectedDateMs, setWeekStart]);

	// Hook: Attendance & Reports panel
	const {
		attendanceOpen,
		attendanceLoading,
		attendanceSaving,
		attendanceSyncing,
		attendanceData,
		attendanceDraft,
		reportsDraft,
		attendanceTab,
		setAttendanceTab,
		attendanceKeyword,
		setAttendanceKeyword,
		attendanceNameSortDirection,
		hasRoomSnapshot,
		attendanceMissingMachinesByFormula,
		attendanceSchoolName,
		attendanceStats,
		hasUnsavedAttendanceChanges,
		filteredAttendanceStudents,
		openAttendance,
		closeAttendance,
		toggleAttendanceStatus,
		updateAttendanceNote,
		setAllAttendanceStatus,
		updateStartLessonReportField,
		updateProfessionalReportField,
		updateEndLessonReportField,
		handleSaveAttendance,
		handleSyncAttendanceToGoogleSheet,
		toggleAttendanceNameSort,
	} = useAttendancePanel({
		getAccessToken,
		teacherDisplayName,
		resolveSchoolNameForSchedule,
		onScheduleUpdated: loadSchedules,
	});

	// State: Schedule create/edit form
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<ScheduleItem | null>(null);
	const [form, setForm] = useState<ScheduleFormState>(() =>
		createDefaultForm(weekStart),
	);

	// Keep single school auto-selected in create form
	useEffect(() => {
		if (!formOpen || editing || form.schoolId || schools.length !== 1) return;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setForm((prev) => ({ ...prev, schoolId: schools[0].id }));
	}, [editing, form.schoolId, formOpen, schools]);

	// Reload computer rooms when form school changes
	useEffect(() => {
		void loadComputerRoomsForForm(form.schoolId);
	}, [form.schoolId, loadComputerRoomsForForm]);

	// Keep form roomName synced with selected roomId
	useEffect(() => {
		if (!form.roomId) return;
		const matchedRoom = computerRooms.find((room) => room.id === form.roomId);
		if (!matchedRoom) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setForm((prev) => ({ ...prev, roomId: "" }));
			return;
		}
		if (form.roomName === matchedRoom.name) return;
		setForm((prev) => ({ ...prev, roomName: matchedRoom.name }));
	}, [computerRooms, form.roomId, form.roomName]);

	const classesBySelectedSchool = useMemo(() => {
		if (!form.schoolId) return [];
		return classes.filter(
			(item) => item.schoolId === form.schoolId && item.isActive,
		);
	}, [classes, form.schoolId]);

	const openCreate = useCallback(() => {
		setEditing(null);
		setForm(createDefaultForm(weekStart));
		setFormOpen(true);
	}, [weekStart]);

	const openEdit = useCallback(
		(item: ScheduleItem) => {
			const matchedClass = item.classId
				? classes.find((classItem) => classItem.id === item.classId)
				: undefined;
			setEditing(item);
			setForm({
				schoolId: item.schoolId || matchedClass?.schoolId || "",
				classId: item.classId || "",
				className: item.className || "",
				subject: item.subject,
				roomName: item.roomName || "",
				roomId: item.roomId || "",
				periodLabel: item.periodLabel || "",
				date: parseApiDateToLocalYmd(item.date),
				startTime: item.startTime,
				endTime: item.endTime,
				notes: item.notes || "",
				isActive: item.isActive,
			});
			setFormOpen(true);
		},
		[classes],
	);

	const handleSubmitSchedule = useCallback(
		async (event: FormEvent<HTMLFormElement>) => {
			event.preventDefault();

			if (!form.schoolId) {
				notify.warning("Vui lòng chọn trường");
				return;
			}
			if (!form.classId) {
				notify.warning("Vui lòng chọn lớp");
				return;
			}
			if (!form.subject.trim()) {
				notify.warning("Vui lòng nhập môn học");
				return;
			}
			if (!form.className.trim()) {
				notify.warning("Vui lòng nhập tên lớp");
				return;
			}

			const normalizedStart = normalizeTimeValue(form.startTime);
			const normalizedEnd = normalizeTimeValue(form.endTime);
			const selectedRoom = computerRooms.find(
				(room) => room.id === form.roomId,
			);
			const resolvedRoomName = selectedRoom?.name || form.roomName.trim();

			const payload: UpdateScheduleRequest = {
				schoolId: form.schoolId,
				classId: form.classId || undefined,
				className: form.className.trim(),
				subject: form.subject.trim(),
				roomName: resolvedRoomName || undefined,
				roomId: selectedRoom?.id || undefined,
				periodLabel: form.periodLabel.trim() || undefined,
				date: form.date,
				startTime: normalizedStart,
				endTime: normalizedEnd,
				notes: form.notes.trim() || undefined,
				isActive: form.isActive,
			};

			try {
				let savedItem: ScheduleItem;
				if (editing) {
					savedItem = await scheduleService.update(
						editing.id,
						payload,
						getAccessToken,
					);
					notify.success("Cập nhật lịch dạy thành công");
				} else {
					savedItem = await scheduleService.create(payload, getAccessToken);
					notify.success("Tạo lịch dạy thành công");
				}

				setFormOpen(false);

				const savedDate = parseApiDateToLocalYmd(savedItem.date || form.date);
				const inCurrentWeek = isDateInWeek(savedDate, weekStart);

				if (!savedItem.isActive) {
					notify.info(
						"Lịch đã lưu ở trạng thái tạm ẩn, mặc định sẽ không hiển thị trong danh sách.",
					);
					await loadSchedules();
					return;
				}

				if (!inCurrentWeek) {
					const nextWeek = toYmd(
						getWeekStart(new Date(`${savedDate}T00:00:00`)),
					);
					setWeekStart(nextWeek);
					notify.info(
						"Lịch đã được chuyển sang tuần tương ứng sau khi cập nhật.",
					);
					return;
				}

				await loadSchedules();
			} catch (error) {
				notify.error(
					error instanceof Error ? error.message : "Không thể lưu lịch dạy",
				);
			}
		},
		[
			form,
			editing,
			computerRooms,
			getAccessToken,
			weekStart,
			setWeekStart,
			loadSchedules,
		],
	);

	const handleFormChange = useCallback(
		<K extends keyof ScheduleFormState>(
			field: K,
			value: ScheduleFormState[K],
		) => {
			setForm((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	const handleFormSchoolChange = useCallback((schoolId: string) => {
		setForm((prev) => ({
			...prev,
			schoolId,
			classId: "",
			className: "",
			roomId: "",
			roomName: "",
		}));
	}, []);

	const handleFormClassChange = useCallback(
		(classId: string, className: string, schoolId: string) => {
			setForm((prev) => ({
				...prev,
				classId,
				className,
				schoolId: schoolId || prev.schoolId,
			}));
		},
		[],
	);

	const handleFormRoomChange = useCallback(
		(roomId: string, roomName: string) => {
			setForm((prev) => ({
				...prev,
				roomId,
				roomName,
			}));
		},
		[],
	);

	// Top header info
	usePageHeader(
		{
			title: "Lịch dạy trong tuần",
			subtitle: (
				<span>
					Tuần:{" "}
					<strong className="font-semibold text-m3-primary">
						{formatDateViFromYmd(weekStart)}
					</strong>{" "}
					đến{" "}
					<strong className="font-semibold text-m3-primary">
						{formatDateViFromYmd(weekEnd)}
					</strong>
				</span>
			),
		},
		[weekStart, weekEnd],
	);

	return (
		<div className="min-h-full space-y-5 pb-20 sm:pb-18">
			{/* Bảng lịch dạy */}
			<ScheduleTable
				schedules={schedules}
				loading={loading}
				copying={copying}
				todayYmd={todayYmd}
				nowMinutesInDay={nowMinutesInDay}
				selectedScheduleIds={selectedScheduleIds}
				areAllSchedulesSelected={areAllSchedulesSelected}
				resolveSchoolNameForSchedule={resolveSchoolNameForSchedule}
				onToggleSelectAll={toggleSelectAllSchedules}
				onToggleSelectSchedule={toggleScheduleSelection}
				onClearSelection={() => setSelectedScheduleIds([])}
				onDeleteSelected={() => {
					void handleDeleteSelected();
				}}
				onCopySelected={() => {
					void handleCopySelectedToNextWeek();
				}}
				onOpenAttendance={(item) => {
					void openAttendance(item);
				}}
				onOpenEdit={openEdit}
				onDeleteSchedule={(item) => {
					void handleDeleteSchedule(item);
				}}
				hideSelectionBar={true}
			/>

			{/* Modal điểm danh & báo cáo */}
			<AttendanceModal
				open={attendanceOpen}
				attendanceLoading={attendanceLoading}
				attendanceSaving={attendanceSaving}
				attendanceSyncing={attendanceSyncing}
				attendanceData={attendanceData}
				attendanceDraft={attendanceDraft}
				reportsDraft={reportsDraft}
				attendanceTab={attendanceTab}
				attendanceKeyword={attendanceKeyword}
				attendanceNameSortDirection={attendanceNameSortDirection}
				attendanceSchoolName={attendanceSchoolName}
				attendanceMissingMachinesByFormula={attendanceMissingMachinesByFormula}
				hasRoomSnapshot={hasRoomSnapshot}
				hasUnsavedAttendanceChanges={hasUnsavedAttendanceChanges}
				attendanceStats={attendanceStats}
				filteredAttendanceStudents={filteredAttendanceStudents}
				onClose={closeAttendance}
				onTabChange={setAttendanceTab}
				onKeywordChange={setAttendanceKeyword}
				onToggleNameSort={toggleAttendanceNameSort}
				onSetAllStatus={setAllAttendanceStatus}
				onToggleStatus={toggleAttendanceStatus}
				onUpdateNote={updateAttendanceNote}
				onUpdateStartLessonField={updateStartLessonReportField}
				onUpdateProfessionalField={updateProfessionalReportField}
				onUpdateEndLessonField={updateEndLessonReportField}
				onSaveAttendance={() => {
					void handleSaveAttendance();
				}}
				onSyncToGoogleSheet={() => {
					void handleSyncAttendanceToGoogleSheet();
				}}
			/>

			{/* Modal thêm/chỉnh sửa lịch dạy */}
			<ScheduleFormModal
				open={formOpen}
				editing={editing}
				form={form}
				schools={schools}
				classesBySelectedSchool={classesBySelectedSchool}
				computerRooms={computerRooms}
				computerRoomsLoading={computerRoomsLoading}
				onClose={() => setFormOpen(false)}
				onSubmit={(e) => {
					void handleSubmitSchedule(e);
				}}
				onFormChange={handleFormChange}
				onSchoolChange={handleFormSchoolChange}
				onClassChange={handleFormClassChange}
				onRoomChange={handleFormRoomChange}
			/>

			{/* Thanh tác vụ nổi (Floating Action Toolbar) */}
			<ScheduleActionToolbar
				weekStart={weekStart}
				weekEnd={weekEnd}
				onShiftWeek={shiftWeek}
				onOpenDatePicker={() => setDatePickerOpen(true)}
				selectedScheduleIds={selectedScheduleIds}
				copying={copying}
				loading={loading}
				onOpenCreate={openCreate}
				onOpenRoomManager={() => {
					const targetSchoolId = form.schoolId || schools[0]?.id;
					navigate(
						targetSchoolId
							? `/computer-rooms?schoolId=${targetSchoolId}`
							: "/computer-rooms",
					);
				}}
				onCopyToNextWeek={() => {
					void handleCopyToNextWeek();
				}}
				onCopySelectedToNextWeek={() => {
					void handleCopySelectedToNextWeek();
				}}
				onDeleteSelected={() => {
					void handleDeleteSelected();
				}}
				onClearSelection={() => setSelectedScheduleIds([])}
			/>

			{/* Modal Date Picker Dialog cho việc chọn tuần */}
			<DatePickerDialog
				open={datePickerOpen}
				onDismiss={() => setDatePickerOpen(false)}
				title="Chọn ngày trong tuần"
				className="w-[calc(100vw-2rem)]! sm:w-100! max-w-md!"
				confirmButton={
					<Button
						type="button"
						colorStyle="filled"
						size="sm"
						onClick={handleConfirmDate}
					>
						Xác nhận
					</Button>
				}
				dismissButton={
					<Button
						type="button"
						colorStyle="text"
						size="sm"
						onClick={() => setDatePickerOpen(false)}
					>
						Hủy
					</Button>
				}
			>
				<DatePicker
					state={datePickerState}
					title="Chọn ngày trong tuần"
					className="w-full! max-w-none!"
				/>
			</DatePickerDialog>
		</div>
	);
};

export default TeacherSchedule;
