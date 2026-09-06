import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePageHeader } from '../context/PageActionsContext';
import { scheduleService } from '../services/schedule.service';
import type { ScheduleItem, UpdateScheduleRequest } from '../types/schedule.types';
import { notify } from '../utils/notify';
import {
  AttendanceModal,
  RoomManagerModal,
  ScheduleFormModal,
  ScheduleTable,
  createDefaultForm,
  isDateInWeek,
  normalizeTimeValue,
  parseApiDateToLocalYmd,
  toYmd,
  getWeekStart,
  useAttendancePanel,
  useRoomManager,
  useScheduleData,
  type ComputerRoomFormState,
  type ScheduleFormState,
} from '../components/TeacherSchedule';

const TeacherSchedule = () => {
  const { getAccessToken, user } = useAuth();
  const todayYmd = useMemo(() => toYmd(new Date()), []);
  const teacherDisplayName = user?.fullName || user?.username || '';

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
  const [form, setForm] = useState<ScheduleFormState>(() => createDefaultForm(weekStart));

  // Hook: Computer Room Manager
  const handleRoomsUpdated = useCallback(
    async (schoolId: string) => {
      if (form.schoolId === schoolId) {
        await loadComputerRoomsForForm(schoolId);
      }
    },
    [form.schoolId, loadComputerRoomsForForm]
  );

  const {
    roomManagerOpen,
    roomManagerSchoolId,
    setRoomManagerSchoolId,
    roomManagerRows,
    roomManagerLoading,
    editingRoomId,
    roomSubmitting,
    roomForm,
    setRoomForm,
    openRoomManager,
    closeRoomManager,
    resetRoomForm,
    handleEditRoom,
    handleDeleteRoom,
    handleSaveRoom,
    selectedRoomManagerSchool,
    roomManagerSummary,
    roomFormMachinePreview,
  } = useRoomManager({
    getAccessToken,
    schools,
    onRoomsChanged: handleRoomsUpdated,
  });

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

  // Keep default room manager school synced
  useEffect(() => {
    if (!roomManagerSchoolId && schools.length > 0) {
      setRoomManagerSchoolId(schools[0].id);
    }
  }, [roomManagerSchoolId, schools, setRoomManagerSchoolId]);

  // Keep form roomName synced with selected roomId
  useEffect(() => {
    if (!form.roomId) return;
    const matchedRoom = computerRooms.find((room) => room.id === form.roomId);
    if (!matchedRoom) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm((prev) => ({ ...prev, roomId: '' }));
      return;
    }
    if (form.roomName === matchedRoom.name) return;
    setForm((prev) => ({ ...prev, roomName: matchedRoom.name }));
  }, [computerRooms, form.roomId, form.roomName]);

  const classesBySelectedSchool = useMemo(() => {
    if (!form.schoolId) return [];
    return classes.filter((item) => item.schoolId === form.schoolId && item.isActive);
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
        schoolId: item.schoolId || matchedClass?.schoolId || '',
        classId: item.classId || '',
        className: item.className || '',
        subject: item.subject,
        roomName: item.roomName || '',
        roomId: item.roomId || '',
        periodLabel: item.periodLabel || '',
        date: parseApiDateToLocalYmd(item.date),
        startTime: item.startTime,
        endTime: item.endTime,
        notes: item.notes || '',
        isActive: item.isActive,
      });
      setFormOpen(true);
    },
    [classes]
  );

  const handleSubmitSchedule = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!form.schoolId) {
        notify.warning('Vui lòng chọn trường');
        return;
      }
      if (!form.classId) {
        notify.warning('Vui lòng chọn lớp');
        return;
      }
      if (!form.subject.trim()) {
        notify.warning('Vui lòng nhập môn học');
        return;
      }
      if (!form.className.trim()) {
        notify.warning('Vui lòng nhập tên lớp');
        return;
      }

      const normalizedStart = normalizeTimeValue(form.startTime);
      const normalizedEnd = normalizeTimeValue(form.endTime);
      const selectedRoom = computerRooms.find((room) => room.id === form.roomId);
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
          savedItem = await scheduleService.update(editing.id, payload, getAccessToken);
          notify.success('Cập nhật lịch dạy thành công');
        } else {
          savedItem = await scheduleService.create(payload, getAccessToken);
          notify.success('Tạo lịch dạy thành công');
        }

        setFormOpen(false);

        const savedDate = parseApiDateToLocalYmd(savedItem.date || form.date);
        const inCurrentWeek = isDateInWeek(savedDate, weekStart);

        if (!savedItem.isActive) {
          notify.info('Lịch đã lưu ở trạng thái tạm ẩn, mặc định sẽ không hiển thị trong danh sách.');
          await loadSchedules();
          return;
        }

        if (!inCurrentWeek) {
          const nextWeek = toYmd(getWeekStart(new Date(`${savedDate}T00:00:00`)));
          setWeekStart(nextWeek);
          notify.info('Lịch đã được chuyển sang tuần tương ứng sau khi cập nhật.');
          return;
        }

        await loadSchedules();
      } catch (error) {
        notify.error(error instanceof Error ? error.message : 'Không thể lưu lịch dạy');
      }
    },
    [form, editing, computerRooms, getAccessToken, weekStart, setWeekStart, loadSchedules]
  );

  const handleFormChange = useCallback(
    <K extends keyof ScheduleFormState>(field: K, value: ScheduleFormState[K]) => {
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleFormSchoolChange = useCallback((schoolId: string) => {
    setForm((prev) => ({
      ...prev,
      schoolId,
      classId: '',
      className: '',
      roomId: '',
      roomName: '',
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
    []
  );

  const handleFormRoomChange = useCallback((roomId: string, roomName: string) => {
    setForm((prev) => ({
      ...prev,
      roomId,
      roomName,
    }));
  }, []);

  const handleRoomFormFieldChange = useCallback(
    <K extends keyof ComputerRoomFormState>(field: K, value: ComputerRoomFormState[K]) => {
      setRoomForm?.((prev: ComputerRoomFormState) => ({ ...prev, [field]: value }));
    },
    [setRoomForm]
  );

  // Top header actions
  usePageHeader({
    title: 'Lịch dạy trong tuần',
    subtitle: 'Quản lý lịch giảng dạy, phòng máy và điểm danh theo tuần',
    actions: [
      {
        id: 'create-schedule',
        label: 'Thêm lịch',
        icon: 'add',
        colorStyle: 'filled',
        onClick: openCreate,
      },
      {
        id: 'manage-rooms',
        label: 'Quản lý phòng máy',
        icon: 'desktop_windows',
        colorStyle: 'tonal',
        onClick: () => openRoomManager(form.schoolId || schools[0]?.id),
      },
      {
        id: 'copy-next-week',
        label: copying ? 'Đang sao chép...' : 'Sao chép tuần sau',
        icon: 'content_copy',
        colorStyle: 'tonal',
        onClick: () => {
          void handleCopyToNextWeek();
        },
        disabled: copying || loading,
      },
    ],
  }, [openCreate, openRoomManager, form.schoolId, schools, copying, loading, handleCopyToNextWeek]);

  return (
    <div className="min-h-full space-y-5 bg-m3-surface p-1 sm:p-2">
      {/* Bảng lịch dạy và thanh điều hướng */}
      <ScheduleTable
        schedules={schedules}
        loading={loading}
        copying={copying}
        weekStart={weekStart}
        weekEnd={weekEnd}
        todayYmd={todayYmd}
        nowMinutesInDay={nowMinutesInDay}
        selectedScheduleIds={selectedScheduleIds}
        areAllSchedulesSelected={areAllSchedulesSelected}
        resolveSchoolNameForSchedule={resolveSchoolNameForSchedule}
        onShiftWeek={shiftWeek}
        onSelectWeekDate={(dateStr) =>
          setWeekStart(toYmd(getWeekStart(new Date(`${dateStr}T00:00:00`))))
        }
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

      {/* Modal quản lý phòng máy */}
      <RoomManagerModal
        open={roomManagerOpen}
        roomManagerSchoolId={roomManagerSchoolId}
        roomManagerRows={roomManagerRows}
        roomManagerLoading={roomManagerLoading}
        editingRoomId={editingRoomId}
        roomSubmitting={roomSubmitting}
        roomForm={roomForm}
        schools={schools}
        selectedRoomManagerSchool={selectedRoomManagerSchool}
        roomManagerSummary={roomManagerSummary}
        roomFormMachinePreview={roomFormMachinePreview}
        onClose={closeRoomManager}
        onSchoolChange={setRoomManagerSchoolId}
        onResetForm={resetRoomForm}
        onEditRoom={handleEditRoom}
        onDeleteRoom={(room) => {
          void handleDeleteRoom(room, form.roomId, () =>
            setForm((prev) => ({ ...prev, roomId: '', roomName: '' }))
          );
        }}
        onSaveRoom={(e) => {
          void handleSaveRoom(e);
        }}
        onRoomFormFieldChange={handleRoomFormFieldChange}
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
    </div>
  );
};

export default TeacherSchedule;
