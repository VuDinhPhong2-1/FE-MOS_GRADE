import type { ComponentProps } from 'react';
import { Button, Icon, ProgressIndicator } from '@bug-on/m3-expressive';
import type {
  AttendanceStatus,
  ScheduleAttendanceResponse,
  ScheduleEndLessonReport,
  ScheduleProfessionalReport,
  ScheduleReportsPayload,
  ScheduleStartLessonReport,
} from '../../types/schedule.types';
import { AttendanceTabContent } from './AttendanceTabContent';
import { ReportTabContent } from './ReportTabContent';
import type { AttendanceDraftState, AttendancePanelTab } from './types';
import { formatDateViFromYmd, parseApiDateToLocalYmd } from './utils';

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
  attendanceNameSortDirection: 'none' | 'asc' | 'desc';
  attendanceSchoolName: string;
  attendanceMissingMachinesByFormula: number | null;
  hasRoomSnapshot: boolean;
  hasUnsavedAttendanceChanges: boolean;
  attendanceStats: { present: number; absent: number };
  filteredAttendanceStudents: ScheduleAttendanceResponse['students'];
  onClose: () => void;
  onTabChange: (tab: AttendancePanelTab) => void;
  onKeywordChange: (keyword: string) => void;
  onToggleNameSort: () => void;
  onSetAllStatus: (status: AttendanceStatus) => void;
  onToggleStatus: (studentId: string) => void;
  onUpdateNote: (studentId: string, note: string) => void;
  onUpdateStartLessonField: (
    field: keyof ScheduleStartLessonReport,
    value: string
  ) => void;
  onUpdateProfessionalField: (
    field: keyof ScheduleProfessionalReport,
    value: string
  ) => void;
  onUpdateEndLessonField: (
    field: keyof ScheduleEndLessonReport,
    value: string
  ) => void;
  onSaveAttendance: () => void;
  onSyncToGoogleSheet: () => void;
}

type M3IconName = ComponentProps<typeof Icon>['name'];
type ReportStepTab = Exclude<AttendancePanelTab, 'attendance'>;

const attendanceMenuItems: {
  value: AttendancePanelTab;
  label: string;
  description: string;
  icon: M3IconName;
}[] = [
  {
    value: 'attendance',
    label: 'Điểm danh',
    description: 'Cập nhật có mặt, vắng và ghi chú.',
    icon: 'fact_check',
  },
  {
    value: 'startLesson',
    label: 'Báo cáo đầu buổi',
    description: 'Thông tin phòng máy đầu buổi.',
    icon: 'description',
  },
  {
    value: 'professional',
    label: 'Báo cáo chuyên môn',
    description: 'Nội dung dạy, tài liệu và số tiết.',
    icon: 'menu_book',
  },
  {
    value: 'endLesson',
    label: 'Báo cáo cuối buổi',
    description: 'Sĩ số và tình trạng cuối buổi.',
    icon: 'assignment',
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
    attendanceTab === 'attendance' ? null : attendanceTab;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 p-0 backdrop-blur-xs sm:grid sm:place-items-center sm:p-4">
      <div className="flex h-dvh w-full flex-col overflow-hidden rounded-none bg-m3-surface-container shadow-2xl sm:h-auto sm:max-h-[94vh] sm:max-w-5xl sm:rounded-4xl">
        <div
          className="shrink-0 border-b border-m3-outline-variant/60 bg-m3-surface-container-high px-4 py-4 sm:px-6 shadow-xs"
          style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-m3-on-surface font-md3-expressive">
                Điểm danh học sinh
              </h3>
              {attendanceData ? (
                <p className="text-sm text-m3-on-surface-variant">
                  {attendanceData.subject} - {attendanceData.className} -{' '}
                  {formatDateViFromYmd(
                    parseApiDateToLocalYmd(attendanceData.date)
                  )}
                  {' · '}
                  {attendanceData.startTime} - {attendanceData.endTime}
                </p>
              ) : null}
              {attendanceSchoolName ? (
                <p className="text-xs font-medium text-m3-primary">
                  Trường: {attendanceSchoolName}
                </p>
              ) : null}
              {attendanceData?.computerRoom ? (
                <p className="text-xs text-m3-on-surface-variant">
                  Phòng máy:{' '}
                  <span className="font-semibold text-m3-on-surface">
                    {attendanceData.computerRoom.name}
                  </span>
                  {' · '}
                  Tổng máy:{' '}
                  <span className="font-semibold text-m3-on-surface">
                    {attendanceData.computerRoom.totalMachinesText}
                  </span>
                  {' · '}
                  Máy lỗi:{' '}
                  <span className="font-semibold text-m3-on-surface">
                    {attendanceData.computerRoom.brokenMachineCount}
                  </span>
                  {' · '}
                  Thiếu cho HS:{' '}
                  <span className="font-semibold text-m3-on-surface">
                    {attendanceMissingMachinesByFormula ??
                      attendanceData.computerRoom.missingMachinesForStudents}
                  </span>
                </p>
              ) : null}
              {attendanceData?.computerRoom?.brokenMachinesDetail ? (
                <p className="text-xs text-m3-error">
                  Chi tiết máy hỏng:{' '}
                  {attendanceData.computerRoom.brokenMachinesDetail}
                </p>
              ) : null}
            </div>
            <Button
              type="button"
              colorStyle="outlined"
              size="sm"
              onClick={onClose}
              disabled={attendanceSaving}
            >
              <Icon name="close" className="text-base" />
              Đóng
            </Button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-m3-surface p-4 sm:p-6">
          {attendanceLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
              <ProgressIndicator
                variant="circular"
                shape="wavy"
                size={28}
                aria-label="Đang tải danh sách học sinh..."
              />
              <p className="text-xs text-m3-on-surface-variant font-medium">
                Đang tải danh sách học sinh...
              </p>
            </div>
          )}

          {!attendanceLoading && attendanceData && (
            <>
              <div className="rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container px-3 py-3 shadow-xs sm:px-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-m3-primary">
                    Menu báo cáo
                  </p>
                  <p className="hidden text-xs text-m3-on-surface-variant sm:block">
                    Chọn mục để chuyển trang, không cần bấm Tiếp tục.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {attendanceMenuItems.map((item) => {
                    const isActive = attendanceTab === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => onTabChange(item.value)}
                        disabled={attendanceSaving}
                        className={`rounded-2xl border px-3 py-2.5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                          isActive
                            ? 'border-m3-primary bg-m3-primary-container/50 shadow-sm'
                            : 'border-m3-outline-variant/60 bg-m3-surface hover:border-m3-primary/60 hover:bg-m3-surface-container-high'
                        }`}
                      >
                        <span
                          className={`flex items-center gap-2 text-sm font-bold ${
                            isActive
                              ? 'text-m3-primary'
                              : 'text-m3-on-surface'
                          }`}
                        >
                          <Icon name={item.icon} className="text-base" />
                          {item.label}
                        </span>
                        <span className="mt-1 block text-xs leading-snug text-m3-on-surface-variant">
                          {item.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {attendanceTab === 'attendance' ? (
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

        <div
          className="shrink-0 border-t border-m3-outline-variant/60 bg-m3-surface-container-high px-4 py-3"
          style={{
            paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))',
          }}
        >
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              colorStyle="tonal"
              onClick={onClose}
              disabled={attendanceSaving}
              className="w-full sm:w-auto"
            >
              Hủy
            </Button>
            <Button
              type="button"
              colorStyle="filled"
              onClick={onSaveAttendance}
              disabled={attendanceSaving || attendanceLoading || !attendanceData}
              loading={attendanceSaving}
              className="w-full sm:w-auto"
            >
              Lưu điểm danh &amp; báo cáo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
