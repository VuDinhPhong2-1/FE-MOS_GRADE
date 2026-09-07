import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
  DatePicker,
  DatePickerDialog,
  Icon,
  IconButton,
  ProgressIndicator,
  useDatePickerState,
} from '@bug-on/m3-expressive';
import type { ScheduleItem } from '../../types/schedule.types';
import type { TodayLessonTimeline } from './types';
import {
  formatDateViFromYmd,
  getWeekdayLabelFromYmd,
  parseApiDateToLocalYmd,
  parseTimeToMinutes,
  utcMsToYmd,
  ymdToUtcMs,
} from './utils';

interface ScheduleTableProps {
  schedules: ScheduleItem[];
  loading: boolean;
  copying: boolean;
  weekStart: string;
  weekEnd: string;
  todayYmd: string;
  nowMinutesInDay: number;
  selectedScheduleIds: string[];
  areAllSchedulesSelected: boolean;
  resolveSchoolNameForSchedule: (item: ScheduleItem) => string;
  onShiftWeek: (offsetDays: number) => void;
  onSelectWeekDate: (dateStr: string) => void;
  onToggleSelectAll: () => void;
  onToggleSelectSchedule: (scheduleId: string) => void;
  onClearSelection: () => void;
  onDeleteSelected: () => void;
  onCopySelected: () => void;
  onOpenAttendance: (item: ScheduleItem) => void;
  onOpenEdit: (item: ScheduleItem) => void;
  onDeleteSchedule: (item: ScheduleItem) => void;
}

export const ScheduleTable = ({
  schedules,
  loading,
  copying,
  weekStart,
  weekEnd,
  todayYmd,
  nowMinutesInDay,
  selectedScheduleIds,
  areAllSchedulesSelected,
  resolveSchoolNameForSchedule,
  onShiftWeek,
  onSelectWeekDate,
  onToggleSelectAll,
  onToggleSelectSchedule,
  onClearSelection,
  onDeleteSelected,
  onCopySelected,
  onOpenAttendance,
  onOpenEdit,
  onDeleteSchedule,
}: ScheduleTableProps) => {
  // State for Date Picker dialog
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const datePickerState = useDatePickerState({
    initialSelectedDateMs: weekStart ? ymdToUtcMs(weekStart) : null,
    locale: { locale: 'vi-VN', weekStartsOn: 1 },
  });

  const { selectDate, navigateToMonth } = datePickerState;

  // Sync datePickerState when weekStart changes (e.g. from Tuần trước / Tuần sau)
  useEffect(() => {
    if (weekStart) {
      const ms = ymdToUtcMs(weekStart);
      selectDate(ms);
      const [y, m] = weekStart.split('-').map(Number);
      if (y && m) {
        navigateToMonth(y, m - 1);
      }
    }
  }, [weekStart, selectDate, navigateToMonth]);

  const handleConfirmDate = useCallback(() => {
    if (datePickerState.selectedDateMs !== null) {
      const ymd = utcMsToYmd(datePickerState.selectedDateMs);
      onSelectWeekDate(ymd);
    }
    setDatePickerOpen(false);
  }, [datePickerState.selectedDateMs, onSelectWeekDate]);

  return (
    <>
      <section className="rounded-3xl bg-m3-surface-container p-0 shadow-xs overflow-hidden">
        {/* Toolbar điều hướng tuần */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              colorStyle="tonal"
              size="sm"
              icon={<Icon name="chevron_left" className="text-base" />}
              onClick={() => onShiftWeek(-7)}
            >
              Tuần trước
            </Button>

            <Button
              type="button"
              colorStyle="tonal"
              size="sm"
              icon={<Icon name="calendar_month" className="text-base text-m3-primary" />}
              onClick={() => setDatePickerOpen(true)}
              className="font-medium"
              title="Nhấn để chọn ngày trong lịch"
            >
              {formatDateViFromYmd(weekStart)}
            </Button>

            <Button
              type="button"
              colorStyle="tonal"
              size="sm"
              icon={<Icon name="chevron_right" className="text-base" />}
              iconPosition="trailing"
              onClick={() => onShiftWeek(7)}
            >
              Tuần sau
            </Button>
          </div>

          <div className="rounded-xl border border-m3-primary/20 bg-m3-primary/10 px-3 py-1.5 text-xs font-semibold text-m3-primary">
            Tuần: <strong>{formatDateViFromYmd(weekStart)}</strong> đến{' '}
            <strong>{formatDateViFromYmd(weekEnd)}</strong>
          </div>
        </div>

        {selectedScheduleIds.length > 0 && (
          <div className="mx-4 mb-4 flex flex-col gap-3 rounded-2xl border border-m3-primary/30 bg-m3-primary/10 px-4 py-3 text-sm text-m3-on-surface sm:mx-5 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Đã chọn <strong>{selectedScheduleIds.length}</strong> lịch dạy
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                colorStyle="tonal"
                size="sm"
                icon={<Icon name="content_copy" className="text-sm" />}
                onClick={onCopySelected}
                disabled={copying || loading}
              >
                {copying ? 'Đang sao chép...' : 'Sao chép đã chọn'}
              </Button>
              <Button
                type="button"
                colorStyle="outlined"
                size="sm"
                className="border-m3-error/40! text-m3-error! hover:bg-m3-error-container/20!"
                icon={<Icon name="delete" className="text-sm" />}
                onClick={onDeleteSelected}
                disabled={loading}
              >
                Xóa đã chọn
              </Button>
              <Button
                type="button"
                colorStyle="text"
                size="sm"
                onClick={onClearSelection}
              >
                Bỏ chọn
              </Button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-m3-surface-container overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-m3-outline-variant/60 bg-m3-surface-container-high text-m3-on-surface-variant backdrop-blur-xs">
              <tr>
                <th className="w-12 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
                  <div className="flex justify-center">
                    <Checkbox
                      checked={areAllSchedulesSelected}
                      onCheckedChange={onToggleSelectAll}
                      disabled={loading || schedules.length === 0}
                      aria-label="Chọn tất cả lịch trong tuần"
                    />
                  </div>
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
                  Ngày
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
                  Thứ
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
                  Tiết
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
                  Thời gian
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
                  Môn học
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
                  Lớp
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
                  Trường
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
                  Phòng
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
                  Ghi chú
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-m3-on-surface-variant">
                  Trạng thái
                </th>
                <th className="px-3 py-3 text-right font-semibold text-m3-on-surface-variant">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0 divide-y divide-m3-outline-variant/30">
              {loading && (
                <tr>
                  <td className="px-3 py-12 text-center" colSpan={12}>
                    <div className="flex flex-col items-center justify-center gap-3">
                      <ProgressIndicator
                        variant="circular"
                        shape="wavy"
                        size={28}
                        aria-label="Đang tải lịch dạy..."
                      />
                      <p className="text-xs text-m3-on-surface-variant font-medium">
                        Đang tải lịch dạy...
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && schedules.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-12 text-center text-m3-on-surface-variant"
                    colSpan={12}
                  >
                    <Icon
                      name="event_busy"
                      className="mx-auto mb-2 text-3xl opacity-40"
                    />
                    Tuần này chưa có lịch dạy.
                  </td>
                </tr>
              )}

              {!loading &&
                schedules.map((item) => {
                  const isSelected = selectedScheduleIds.includes(item.id);
                  const localYmd = parseApiDateToLocalYmd(item.date);
                  const isToday = localYmd === todayYmd;
                  const startMinutes = parseTimeToMinutes(item.startTime);
                  const endMinutes = parseTimeToMinutes(item.endTime);
                  const todayLessonTimeline: TodayLessonTimeline | null =
                    isToday && startMinutes !== null && endMinutes !== null
                      ? nowMinutesInDay > endMinutes
                        ? 'done'
                        : nowMinutesInDay >= startMinutes
                          ? 'ongoing'
                          : 'upcoming'
                      : null;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => onOpenAttendance(item)}
                      className={`cursor-pointer transition ${
                        isSelected
                          ? 'bg-m3-primary/10 hover:bg-m3-primary/15'
                          : isToday
                            ? 'bg-m3-tertiary/10 hover:bg-m3-tertiary/15'
                            : 'hover:bg-m3-surface-container-high/60'
                      }`}
                    >
                      <td
                        className="px-3 py-3 text-center"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex justify-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onToggleSelectSchedule(item.id)}
                            aria-label={`Chọn lịch ${item.subject} - ${item.className}`}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-m3-on-surface">
                        <div className="flex items-center gap-2">
                          <span>{formatDateViFromYmd(localYmd)}</span>
                          {isToday ? (
                            <span className="rounded-full bg-m3-tertiary/15 px-2 py-0.5 text-[11px] font-semibold text-m3-tertiary">
                              Hôm nay
                            </span>
                          ) : null}
                          {todayLessonTimeline === 'ongoing' ? (
                            <span className="rounded-full bg-m3-primary/15 px-2 py-0.5 text-[11px] font-semibold text-m3-primary">
                              Đang dạy
                            </span>
                          ) : null}
                          {todayLessonTimeline === 'done' ? (
                            <span className="rounded-full bg-m3-surface-container-highest px-2 py-0.5 text-[11px] font-semibold text-m3-on-surface-variant">
                              Đã dạy
                            </span>
                          ) : null}
                          {todayLessonTimeline === 'upcoming' ? (
                            <span className="rounded-full bg-m3-secondary/15 px-2 py-0.5 text-[11px] font-semibold text-m3-secondary">
                              Sắp tới
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-m3-on-surface">
                        {getWeekdayLabelFromYmd(localYmd)}
                      </td>
                      <td className="px-3 py-3 text-m3-on-surface">
                        {item.periodLabel || '-'}
                      </td>
                      <td className="px-3 py-3 text-m3-on-surface">
                        {item.startTime} - {item.endTime}
                      </td>
                      <td className="px-3 py-3 font-semibold text-m3-on-surface">
                        {item.subject}
                      </td>
                      <td className="px-3 py-3 text-m3-on-surface">
                        {item.className}
                      </td>
                      <td className="px-3 py-3 text-m3-on-surface-variant">
                        {resolveSchoolNameForSchedule(item) || (
                          <span className="text-m3-on-surface-variant/40">
                            Chưa gán trường
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-m3-on-surface">
                        {item.roomName || '-'}
                      </td>
                      <td className="max-w-65 truncate px-3 py-3 text-m3-on-surface-variant">
                        {item.notes || '-'}
                      </td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.isActive
                              ? 'bg-m3-primary-container text-m3-on-primary-container'
                              : 'bg-m3-surface-container-highest text-m3-on-surface-variant'
                          }`}
                        >
                          {item.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <IconButton
                            type="button"
                            aria-label="Điểm danh"
                            colorStyle="tonal"
                            size="xs"
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenAttendance(item);
                            }}
                          >
                            <Icon
                              name="fact_check"
                              className="text-sm text-m3-primary"
                            />
                          </IconButton>
                          <IconButton
                            type="button"
                            aria-label="Chỉnh sửa"
                            colorStyle="outlined"
                            size="xs"
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenEdit(item);
                            }}
                          >
                            <Icon name="edit" className="text-sm" />
                          </IconButton>
                          <IconButton
                            type="button"
                            aria-label="Xóa"
                            colorStyle="outlined"
                            size="xs"
                            className="border-m3-error/30! text-m3-error! hover:bg-m3-error-container/20!"
                            onClick={(event) => {
                              event.stopPropagation();
                              onDeleteSchedule(item);
                            }}
                          >
                            <Icon name="delete" className="text-sm" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-m3-outline-variant/60 px-4 py-2.5 text-xs text-m3-on-surface-variant bg-m3-surface-container-high/40">
          Mẹo: bấm vào dòng lịch hoặc nút{' '}
          <span className="font-semibold text-m3-primary">Điểm danh</span> để mở
          điểm danh. Tick checkbox để chọn nhiều lịch rồi xóa/sao chép cùng lúc.
        </div>
      </section>

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
    </>
  );
};
