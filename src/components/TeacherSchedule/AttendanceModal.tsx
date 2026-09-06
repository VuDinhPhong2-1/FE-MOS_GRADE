import {
  Button,
  Icon,
  ProgressIndicator,
  Tab,
  Tabs,
  TabsList,
} from '@bug-on/m3-expressive';
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
            <Tabs
              value={attendanceTab}
              onValueChange={(val) => onTabChange(val as AttendancePanelTab)}
            >
              <TabsList
                variant="secondary"
                className="w-full justify-start overflow-x-auto"
              >
                <Tab
                  value="attendance"
                  icon={<Icon name="fact_check" className="text-base" />}
                  inlineIcon
                >
                  Điểm danh
                </Tab>
                <Tab
                  value="startLesson"
                  icon={<Icon name="description" className="text-base" />}
                  inlineIcon
                >
                  Báo cáo đầu buổi
                </Tab>
                <Tab
                  value="professional"
                  icon={<Icon name="menu_book" className="text-base" />}
                  inlineIcon
                >
                  Báo cáo chuyên môn
                </Tab>
                <Tab
                  value="endLesson"
                  icon={<Icon name="assignment" className="text-base" />}
                  inlineIcon
                >
                  Báo cáo cuối buổi
                </Tab>
              </TabsList>

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

              <ReportTabContent
                reportsDraft={reportsDraft}
                hasRoomSnapshot={hasRoomSnapshot}
                attendanceData={attendanceData}
                onUpdateStartLessonField={onUpdateStartLessonField}
                onUpdateProfessionalField={onUpdateProfessionalField}
                onUpdateEndLessonField={onUpdateEndLessonField}
              />
            </Tabs>
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
              disabled={
                attendanceSaving || attendanceLoading || !attendanceData
              }
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
