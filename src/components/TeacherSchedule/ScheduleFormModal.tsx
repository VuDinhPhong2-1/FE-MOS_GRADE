import { useCallback, useMemo, useState, type FormEvent } from 'react';
import {
  Button,
  Checkbox,
  DatePicker,
  DatePickerDialog,
  Icon,
  IconButton,
  Select,
  TextField,
  TimePicker,
  TimePickerDialog,
  useDatePickerState,
  useTimePickerState,
  type SelectOption,
} from '@bug-on/m3-expressive';
import type { Class } from '../../types/class.types';
import type { ComputerRoom } from '../../types/computer-room.types';
import type { ScheduleItem } from '../../types/schedule.types';
import type { School } from '../../types/school.types';
import type { ScheduleFormState } from './types';
import { formatDateViFromYmd, parseTimeToMinutes, toYmd } from './utils';

interface ScheduleFormModalProps {
  open: boolean;
  editing: ScheduleItem | null;
  form: ScheduleFormState;
  schools: School[];
  classesBySelectedSchool: Class[];
  computerRooms: ComputerRoom[];
  computerRoomsLoading: boolean;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  onFormChange: <K extends keyof ScheduleFormState>(
    field: K,
    value: ScheduleFormState[K]
  ) => void;
  onSchoolChange: (schoolId: string) => void;
  onClassChange: (classId: string, className: string, schoolId: string) => void;
  onRoomChange: (roomId: string, roomName: string) => void;
}

export const ScheduleFormModal = ({
  open,
  editing,
  form,
  schools,
  classesBySelectedSchool,
  computerRooms,
  computerRoomsLoading,
  onClose,
  onSubmit,
  onFormChange,
  onSchoolChange,
  onClassChange,
  onRoomChange,
}: ScheduleFormModalProps) => {
  // State for Date Picker dialog
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const initialDateMs = useMemo(() => {
    if (form.date) {
      const parsed = new Date(`${form.date}T00:00:00`).getTime();
      if (!Number.isNaN(parsed)) return parsed;
    }
    return null;
  }, [form.date]);

  const datePickerState = useDatePickerState({
    initialSelectedDateMs: initialDateMs,
  });

  const handleConfirmDate = useCallback(() => {
    if (datePickerState.selectedDateMs) {
      const ymd = toYmd(new Date(datePickerState.selectedDateMs));
      onFormChange('date', ymd);
    }
    setDatePickerOpen(false);
  }, [datePickerState.selectedDateMs, onFormChange]);

  // State for Start Time Picker dialog
  const [startTimePickerOpen, setStartTimePickerOpen] = useState(false);
  const initialStartMinutes = useMemo(() => {
    return parseTimeToMinutes(form.startTime) ?? 7 * 60;
  }, [form.startTime]);

  const startTimePickerState = useTimePickerState({
    initialHour: Math.floor(initialStartMinutes / 60),
    initialMinute: initialStartMinutes % 60,
    is24hour: true,
  });

  const handleConfirmStartTime = useCallback(() => {
    const formatted = `${String(startTimePickerState.hour).padStart(2, '0')}:${String(
      startTimePickerState.minute
    ).padStart(2, '0')}`;
    onFormChange('startTime', formatted);
    setStartTimePickerOpen(false);
  }, [startTimePickerState.hour, startTimePickerState.minute, onFormChange]);

  // State for End Time Picker dialog
  const [endTimePickerOpen, setEndTimePickerOpen] = useState(false);
  const initialEndMinutes = useMemo(() => {
    return parseTimeToMinutes(form.endTime) ?? 8 * 60 + 30;
  }, [form.endTime]);

  const endTimePickerState = useTimePickerState({
    initialHour: Math.floor(initialEndMinutes / 60),
    initialMinute: initialEndMinutes % 60,
    is24hour: true,
  });

  const handleConfirmEndTime = useCallback(() => {
    const formatted = `${String(endTimePickerState.hour).padStart(2, '0')}:${String(
      endTimePickerState.minute
    ).padStart(2, '0')}`;
    onFormChange('endTime', formatted);
    setEndTimePickerOpen(false);
  }, [endTimePickerState.hour, endTimePickerState.minute, onFormChange]);

  // Select Options memoization
  const schoolOptions = useMemo<SelectOption[]>(() => {
    return schools.map((school) => ({
      label: school.name,
      value: school.id,
    }));
  }, [schools]);

  const classOptions = useMemo<SelectOption[]>(() => {
    return classesBySelectedSchool.map((c) => ({
      label: c.name,
      value: c.id,
      supportingText: `Trường: ${schools.find((s) => s.id === c.schoolId)?.name || ''}`,
    }));
  }, [classesBySelectedSchool, schools]);

  const roomOptions = useMemo<SelectOption[]>(() => {
    return [
      {
        label: '-- Không dùng phòng cấu hình (nhập thủ công) --',
        value: '',
      },
      ...computerRooms.map((room) => ({
        label: room.name,
        value: room.id,
        supportingText: `${room.totalMachinesText} · Lỗi: ${room.brokenMachineCount}`,
      })),
    ];
  }, [computerRooms]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs sm:grid sm:place-items-center sm:p-4">
      <div className="flex h-dvh w-full flex-col overflow-hidden rounded-none border border-m3-outline-variant/60 bg-m3-surface-container shadow-2xl sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-4xl">
        {/* Header */}
        <div
          className="shrink-0 border-b border-m3-outline-variant/60 bg-m3-surface-container-high px-5 py-4 shadow-xs"
          style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-linear-to-br from-m3-primary to-m3-primary/80 text-m3-on-primary shadow-md">
                <Icon name="calendar_month" className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold tracking-tight text-m3-on-surface font-md3-expressive">
                  {editing ? 'Chỉnh sửa lịch dạy' : 'Tạo lịch dạy mới'}
                </h3>
                <p className="mt-0.5 text-sm text-m3-on-surface-variant">
                  {editing
                    ? 'Cập nhật thông tin cho buổi dạy này.'
                    : 'Điền thông tin để thêm một buổi dạy vào tuần.'}
                </p>
              </div>
            </div>
            <IconButton
              type="button"
              aria-label="Đóng"
              colorStyle="standard"
              size="sm"
              onClick={onClose}
            >
              <Icon name="close" className="text-base" />
            </IconButton>
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-m3-surface p-4 sm:p-5">
            {/* Nhóm: Trường & Lớp học */}
            <div className="rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 sm:p-5 shadow-xs">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="domain" className="text-base text-m3-primary" />
                <h4 className="text-sm font-bold text-m3-on-surface">
                  Trường &amp; lớp học
                </h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select
                  label="Trường học *"
                  options={schoolOptions}
                  value={form.schoolId}
                  onChange={(val) => onSchoolChange(val)}
                  searchable
                  placeholder="-- Chọn trường --"
                  required
                  variant='filled'
                />

                <Select
                  label="Lớp có sẵn"
                  options={classOptions}
                  value={form.classId}
                  onChange={(val) => {
                    const matched = classesBySelectedSchool.find((c) => c.id === val);
                    onClassChange(
                      val,
                      matched?.name || form.className,
                      matched?.schoolId || form.schoolId
                    );
                  }}
                  searchable
                  placeholder="-- Chọn lớp --"
                  disabled={!form.schoolId}
                  supportingText={
                    !form.schoolId ? 'Vui lòng chọn trường trước' : undefined
                  }
                />

                <div className="sm:col-span-2">
                  <TextField
                    label="Tên lớp hiển thị *"
                    value={form.className}
                    onChange={(val) => onFormChange('className', val)}
                    placeholder="Ví dụ: 11A11"
                    required
                    fullWidth
                  />
                </div>
              </div>
            </div>

            {/* Nhóm: Môn học & phòng */}
            <div className="rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 sm:p-5 shadow-xs">
              <div className="mb-3 flex items-center gap-2">
                <Icon
                  name="desktop_windows"
                  className="text-base text-m3-primary"
                />
                <h4 className="text-sm font-bold text-m3-on-surface">
                  Môn học &amp; phòng dạy
                </h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Môn học *"
                  value={form.subject}
                  onChange={(val) => onFormChange('subject', val)}
                  placeholder="Ví dụ: Tin học"
                  required
                  fullWidth
                />

                <TextField
                  label="Tiết mấy"
                  value={form.periodLabel}
                  onChange={(val) => onFormChange('periodLabel', val)}
                  placeholder="Ví dụ: Tiết 1-2"
                  fullWidth
                />

                <Select
                  label="Phòng máy cấu hình sẵn"
                  options={roomOptions}
                  value={form.roomId}
                  onChange={(val) => {
                    const matched = computerRooms.find((r) => r.id === val);
                    onRoomChange(val, matched?.name || form.roomName);
                  }}
                  searchable
                  loading={computerRoomsLoading}
                  placeholder="-- Chọn phòng máy --"
                  disabled={!form.schoolId || computerRoomsLoading}
                  variant='filled'
                />

                <TextField
                  label="Phòng học / phòng máy"
                  value={form.roomName}
                  onChange={(val) => {
                    onFormChange('roomName', val);
                    if (form.roomId) {
                      onFormChange('roomId', '');
                    }
                  }}
                  placeholder={
                    form.roomId
                      ? 'Đã lấy theo phòng cấu hình'
                      : 'Ví dụ: P.Máy 03'
                  }
                  disabled={Boolean(form.roomId)}
                  supportingText={
                    form.roomId
                      ? 'Đã liên kết phòng máy từ danh mục'
                      : undefined
                  }
                  fullWidth
                />
              </div>
            </div>

            {/* Nhóm: Thời gian */}
            <div className="rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 sm:p-5 shadow-xs">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="schedule" className="text-base text-m3-primary" />
                <h4 className="text-sm font-bold text-m3-on-surface">
                  Thời gian
                </h4>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {/* Ngày dạy */}
                <div
                  className="cursor-pointer"
                  onClick={() => setDatePickerOpen(true)}
                >
                  <TextField
                    label="Ngày dạy *"
                    value={
                      form.date
                        ? formatDateViFromYmd(form.date)
                        : ''
                    }
                    readOnly
                    required
                    fullWidth
                    leadingIcon={<Icon name="calendar_today" className="text-base" />}
                    trailingIconMode="custom"
                    trailingIcon={
                      <IconButton
                        type="button"
                        aria-label="Chọn ngày dạy"
                        size="xs"
                        colorStyle="standard"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDatePickerOpen(true);
                        }}
                      >
                        <Icon name="edit_calendar" className="text-sm" />
                      </IconButton>
                    }
                  />
                </div>

                {/* Giờ bắt đầu */}
                <div
                  className="cursor-pointer"
                  onClick={() => setStartTimePickerOpen(true)}
                >
                  <TextField
                    label="Giờ bắt đầu *"
                    value={form.startTime}
                    readOnly
                    required
                    fullWidth
                    leadingIcon={<Icon name="schedule" className="text-base" />}
                    trailingIconMode="custom"
                    trailingIcon={
                      <IconButton
                        type="button"
                        aria-label="Chọn giờ bắt đầu"
                        size="xs"
                        colorStyle="standard"
                        onClick={(e) => {
                          e.stopPropagation();
                          setStartTimePickerOpen(true);
                        }}
                      >
                        <Icon name="more_time" className="text-sm" />
                      </IconButton>
                    }
                  />
                </div>

                {/* Giờ kết thúc */}
                <div
                  className="cursor-pointer"
                  onClick={() => setEndTimePickerOpen(true)}
                >
                  <TextField
                    label="Giờ kết thúc *"
                    value={form.endTime}
                    readOnly
                    required
                    fullWidth
                    leadingIcon={<Icon name="alarm_on" className="text-base" />}
                    trailingIconMode="custom"
                    trailingIcon={
                      <IconButton
                        type="button"
                        aria-label="Chọn giờ kết thúc"
                        size="xs"
                        colorStyle="standard"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEndTimePickerOpen(true);
                        }}
                      >
                        <Icon name="more_time" className="text-sm" />
                      </IconButton>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Nhóm: Ghi chú & trạng thái */}
            <div className="rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 sm:p-5 shadow-xs">
              <div className="mb-3 flex items-center gap-2">
                <Icon name="chat" className="text-base text-m3-primary" />
                <h4 className="text-sm font-bold text-m3-on-surface">Ghi chú</h4>
              </div>
              <TextField
                label="Ghi chú thêm"
                type="textarea"
                rows={3}
                autoResize
                value={form.notes}
                onChange={(val) => onFormChange('notes', val)}
                placeholder="Ghi chú thêm về buổi học..."
                fullWidth
              />

              {editing && (
                <div className="mt-3">
                  <Checkbox
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      onFormChange('isActive', checked)
                    }
                    label="Lịch đang hoạt động"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className="shrink-0 border-t border-m3-outline-variant/60 bg-m3-surface-container-high px-4 py-3 sm:px-6"
            style={{
              paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
            }}
          >
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                colorStyle="tonal"
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                colorStyle="filled"
                icon={
                  <Icon
                    name={editing ? 'edit' : 'add'}
                    className="text-base"
                  />
                }
                className="w-full sm:w-auto"
              >
                {editing ? 'Lưu cập nhật' : 'Tạo lịch'}
              </Button>
            </div>
          </div>
        </form>

        {/* Modal Date Picker Dialog */}
        <DatePickerDialog
          open={datePickerOpen}
          onDismiss={() => setDatePickerOpen(false)}
          title="Chọn ngày dạy"
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
          <DatePicker state={datePickerState} className="w-full! max-w-none!" />
        </DatePickerDialog>

        {/* Modal Start Time Picker Dialog */}
        <TimePickerDialog
          open={startTimePickerOpen}
          onDismiss={() => setStartTimePickerOpen(false)}
          title="Chọn giờ bắt đầu"
          confirmButton={
            <Button
              type="button"
              colorStyle="filled"
              size="sm"
              onClick={handleConfirmStartTime}
            >
              Xác nhận
            </Button>
          }
          dismissButton={
            <Button
              type="button"
              colorStyle="text"
              size="sm"
              onClick={() => setStartTimePickerOpen(false)}
            >
              Hủy
            </Button>
          }
        >
          <TimePicker state={startTimePickerState} />
        </TimePickerDialog>

        {/* Modal End Time Picker Dialog */}
        <TimePickerDialog
          open={endTimePickerOpen}
          onDismiss={() => setEndTimePickerOpen(false)}
          title="Chọn giờ kết thúc"
          confirmButton={
            <Button
              type="button"
              colorStyle="filled"
              size="sm"
              onClick={handleConfirmEndTime}
            >
              Xác nhận
            </Button>
          }
          dismissButton={
            <Button
              type="button"
              colorStyle="text"
              size="sm"
              onClick={() => setEndTimePickerOpen(false)}
            >
              Hủy
            </Button>
          }
        >
          <TimePicker state={endTimePickerState} />
        </TimePickerDialog>
      </div>
    </div>
  );
};
