import { useEffect, useMemo } from 'react';
import { Icon } from '@bug-on/m3-expressive';
import type {
  ScheduleAttendanceResponse,
  ScheduleEndLessonReport,
  ScheduleProfessionalReport,
  ScheduleReportsPayload,
  ScheduleStartLessonReport,
} from '../../types/schedule.types';
import type { AttendanceDraftState, AttendancePanelTab } from './types';

interface ReportTabContentProps {
  activeStep: AttendancePanelTab;
  reportsDraft: ScheduleReportsPayload;
  hasRoomSnapshot: boolean;
  attendanceData: ScheduleAttendanceResponse;
  attendanceDraft: Record<string, AttendanceDraftState>;
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
}


type AnyRecord = Record<string, unknown>;

type ClassCount = {
  className: string;
  total: number;
  absent: number;
};

const isRecord = (value: unknown): value is AnyRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const readString = (source: AnyRecord, keys: string[]): string | null => {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const readNumber = (source: AnyRecord, keys: string[]): number | null => {
  for (const key of keys) {
    const value = toNumber(source[key]);
    if (value !== null) {
      return value;
    }
  }

  return null;
};

const getArrayFromPossibleKeys = (
  source: AnyRecord,
  keys: string[]
): unknown[] | null => {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return null;
};

const readClassName = (source: AnyRecord): string | null => {
  const directName = readString(source, [
    'className',
    'class_name',
    'classTitle',
    'classLabel',
    'name',
    'title',
  ]);

  if (directName) {
    return directName;
  }

  const nestedKeys = ['class', 'classInfo', 'classroom', 'studentClass'];
  for (const key of nestedKeys) {
    const nestedValue = source[key];
    if (!isRecord(nestedValue)) {
      continue;
    }

    const nestedName = readString(nestedValue, [
      'className',
      'class_name',
      'name',
      'title',
    ]);

    if (nestedName) {
      return nestedName;
    }
  }

  return null;
};

const readStudentId = (student: AnyRecord): string | null => {
  const value =
    student.studentId ??
    student.student_id ??
    student.id ??
    student._id ??
    student.studentCode ??
    student.code;

  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
};

const isAbsentText = (value: unknown): boolean => {
  if (typeof value !== 'string') {
    return false;
  }

  const normalized = value.trim().toLowerCase();

  return (
    normalized === 'absent' ||
    normalized === 'vắng' ||
    normalized === 'vang' ||
    normalized === 'a' ||
    normalized.includes('absent') ||
    normalized.includes('vắng') ||
    normalized.includes('vang')
  );
};

const isStudentAbsent = (
  student: AnyRecord,
  draft: AttendanceDraftState | undefined
): boolean => {
  // Ưu tiên draft vì đây là dữ liệu vừa được giáo viên tick trên giao diện.
  if (draft?.status) {
    return draft.status === 'Absent';
  }

  const booleanAbsent = student.isAbsent ?? student.absent ?? student.is_absent;
  if (typeof booleanAbsent === 'boolean') {
    return booleanAbsent;
  }

  return isAbsentText(
    student.status ??
    student.attendanceStatus ??
    student.attendance_status ??
    student.state ??
    student.lessonStatus
  );
};

const readArrayCount = (source: AnyRecord, keys: string[]): number | null => {
  const arr = getArrayFromPossibleKeys(source, keys);
  return arr ? arr.length : null;
};

const readAbsentCount = (source: AnyRecord): number => {
  return (
    readNumber(source, [
      'absentStudentCount',
      'absentStudentsCount',
      'absentCount',
      'absenceCount',
      'missingStudentCount',
      'missingCount',
      'numberOfAbsentStudents',
      'totalAbsentStudents',
    ]) ??
    readArrayCount(source, [
      'absentStudents',
      'absentStudentIds',
      'absentStudentList',
      'absenceStudents',
      'absenceStudentIds',
      'studentAbsences',
    ]) ??
    0
  );
};

const readTotalCount = (source: AnyRecord): number | null => {
  return (
    readNumber(source, [
      'totalStudents',
      'studentCount',
      'totalStudentCount',
      'total',
      'studentTotal',
      'numberOfStudents',
      'quantity',
    ]) ??
    readArrayCount(source, [
      'students',
      'studentAttendances',
      'attendanceStudents',
      'attendanceRecords',
      'records',
      'items',
    ])
  );
};

const formatClassCount = ({ className, total, absent }: ClassCount): string => {
  const present = Math.max(total - absent, 0);
  return `${className}(${present}/${total})`;
};

const buildClassSummaryFromStudents = (
  students: unknown[],
  attendanceDraft: Record<string, AttendanceDraftState>,
  fallbackClassName: string
): string => {
  const classMap = new Map<string, ClassCount>();

  students.forEach((student) => {
    if (!isRecord(student)) {
      return;
    }

    const className = readClassName(student) ?? fallbackClassName;
    if (!className) {
      return;
    }

    const studentId = readStudentId(student);
    const draft = studentId ? attendanceDraft[studentId] : undefined;
    const current = classMap.get(className) ?? {
      className,
      total: 0,
      absent: 0,
    };

    current.total += 1;

    if (isStudentAbsent(student, draft)) {
      current.absent += 1;
    }

    classMap.set(className, current);
  });

  return Array.from(classMap.values()).map(formatClassCount).join(', ');
};

const buildClassSummaryFromClassItems = (items: unknown[]): string => {
  const summaries = items
    .map((item) => {
      if (!isRecord(item)) {
        return null;
      }

      const className = readClassName(item);
      const total = readTotalCount(item);

      if (!className || total === null) {
        return null;
      }

      const absent = readAbsentCount(item);
      return formatClassCount({ className, total, absent });
    })
    .filter((summary): summary is string => Boolean(summary));

  return summaries.join(', ');
};

const buildClassStudentCountSummary = (
  attendanceData: ScheduleAttendanceResponse,
  attendanceDraft: Record<string, AttendanceDraftState>
): string => {
  if (!isRecord(attendanceData)) {
    return '';
  }

  const attendanceRecord = attendanceData as unknown as AnyRecord;
  const fallbackClassName = readString(attendanceRecord, [
    'className',
    'class_name',
    'classLabel',
    'classTitle',
  ]) ?? '';

  const possibleStudents = getArrayFromPossibleKeys(attendanceRecord, [
    'students',
    'studentAttendances',
    'attendanceStudents',
    'attendanceRecords',
    'records',
    'items',
  ]);

  if (possibleStudents?.length) {
    const summary = buildClassSummaryFromStudents(
      possibleStudents,
      attendanceDraft,
      fallbackClassName
    );
    if (summary) {
      return summary;
    }
  }

  const possibleClassItems = getArrayFromPossibleKeys(attendanceRecord, [
    'classes',
    'classSummaries',
    'classAttendanceSummaries',
    'roomClasses',
    'sharedClasses',
    'scheduleClasses',
  ]);

  if (possibleClassItems?.length) {
    const summary = buildClassSummaryFromClassItems(possibleClassItems);
    if (summary) {
      return summary;
    }
  }

  const roomSessionContext = attendanceRecord.roomSessionContext;
  if (isRecord(roomSessionContext)) {
    const sharedClasses = getArrayFromPossibleKeys(roomSessionContext, [
      'sharedClasses',
      'classes',
      'roomClasses',
      'scheduleClasses',
    ]);

    if (sharedClasses?.length) {
      const summary = buildClassSummaryFromClassItems(sharedClasses);
      if (summary) {
        return summary;
      }
    }
  }

  const total = readTotalCount(attendanceRecord);
  if (fallbackClassName && total !== null) {
    return formatClassCount({
      className: fallbackClassName,
      total,
      absent: readAbsentCount(attendanceRecord),
    });
  }

  return '';
};

export const ReportTabContent = ({
  activeStep,
  reportsDraft,
  hasRoomSnapshot,
  attendanceData,
  attendanceDraft,
  onUpdateStartLessonField,
  onUpdateProfessionalField,
  onUpdateEndLessonField,
}: ReportTabContentProps) => {
  const classStudentCountSummary = useMemo(
    () => buildClassStudentCountSummary(attendanceData, attendanceDraft),
    [attendanceData, attendanceDraft]
  );

  const missingMachinesForStudents = useMemo(() => {
    const computerRoom = attendanceData.computerRoom;

    if (!computerRoom) {
      return null;
    }

    const totalStudents = attendanceData.students.length;
    const availableMachines = computerRoom.availableStudentMachines;

    return Math.max(totalStudents - availableMachines, 0);
  }, [attendanceData.computerRoom, attendanceData.students.length]);

  const brokenMachinesSummary = useMemo(() => {
    const computerRoom = attendanceData.computerRoom;

    if (!computerRoom) {
      return null;
    }

    const brokenCount = computerRoom.brokenMachineCount ?? 0;
    const brokenDetail = computerRoom.brokenMachinesDetail?.trim();

    return brokenDetail
      ? `${brokenCount} (${brokenDetail})`
      : String(brokenCount);
  }, [attendanceData.computerRoom]);

  useEffect(() => {
    if (missingMachinesForStudents === null) {
      return;
    }

    const value = String(missingMachinesForStudents);

    if (reportsDraft.startLesson.missingMachinesForStudents !== value) {
      onUpdateStartLessonField('missingMachinesForStudents', value);
    }
  }, [
    missingMachinesForStudents,
    reportsDraft.startLesson.missingMachinesForStudents,
    onUpdateStartLessonField,
  ]);

  useEffect(() => {
    if (brokenMachinesSummary === null) {
      return;
    }

    if (
      reportsDraft.startLesson.brokenMachinesSummary !== brokenMachinesSummary
    ) {
      onUpdateStartLessonField(
        'brokenMachinesSummary',
        brokenMachinesSummary
      );
    }
  }, [
    brokenMachinesSummary,
    reportsDraft.startLesson.brokenMachinesSummary,
    onUpdateStartLessonField,
  ]);

  useEffect(() => {
    if (brokenMachinesSummary === null) {
      return;
    }

    if (
      reportsDraft.endLesson.brokenMachinesSummary !== brokenMachinesSummary
    ) {
      onUpdateEndLessonField(
        'brokenMachinesSummary',
        brokenMachinesSummary
      );
    }
  }, [
    brokenMachinesSummary,
    reportsDraft.endLesson.brokenMachinesSummary,
    onUpdateEndLessonField,
  ]);

  useEffect(() => {
    if (!classStudentCountSummary) {
      return;
    }

    if (
      reportsDraft.endLesson.classStudentCountSummary !==
      classStudentCountSummary
    ) {
      onUpdateEndLessonField(
        'classStudentCountSummary',
        classStudentCountSummary
      );
    }
  }, [
    classStudentCountSummary,
    reportsDraft.endLesson.classStudentCountSummary,
    onUpdateEndLessonField,
  ]);

  return (
    <>
      {activeStep === 'startLesson' && (
        <div className="pt-3">
          <div className="space-y-4 rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2">
              <Icon name="description" className="text-base text-m3-primary" />
              <h4 className="font-bold text-m3-primary">BÁO CÁO ĐẦU BUỔI DẠY</h4>
            </div>
            {hasRoomSnapshot && (
              <p className="text-xs text-m3-primary/80">
                Các trường liên quan phòng máy được tự động lấy từ cấu hình phòng
                máy trong database.
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Tên giáo viên
                </span>
                <input
                  value={reportsDraft.startLesson.teacherName}
                  onChange={(e) =>
                    onUpdateStartLessonField('teacherName', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">Tên trợ giảng</span>
                <input
                  value={reportsDraft.startLesson.assistantName}
                  onChange={(e) =>
                    onUpdateStartLessonField('assistantName', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">Phòng máy</span>
                <input
                  value={reportsDraft.startLesson.roomName}
                  onChange={(e) =>
                    onUpdateStartLessonField('roomName', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                  disabled={hasRoomSnapshot}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">Tổng số máy</span>
                <input
                  value={reportsDraft.startLesson.totalMachines}
                  onChange={(e) =>
                    onUpdateStartLessonField('totalMachines', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                  disabled={hasRoomSnapshot}
                />
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-m3-on-surface">
                  Tổng số máy lỗi (mô tả)
                </span>
                <input
                  value={
                    brokenMachinesSummary ??
                    reportsDraft.startLesson.brokenMachinesSummary
                  }
                  onChange={(e) => {
                    if (brokenMachinesSummary === null) {
                      onUpdateStartLessonField(
                        'brokenMachinesSummary',
                        e.target.value
                      );
                    }
                  }}
                  readOnly={brokenMachinesSummary !== null}
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary read-only:cursor-default read-only:bg-m3-surface-container-low"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Số máy thiếu cho học sinh
                </span>
                <input
                  value={
                    missingMachinesForStudents !== null
                      ? String(missingMachinesForStudents)
                      : reportsDraft.startLesson.missingMachinesForStudents
                  }
                  onChange={(e) => {
                    if (missingMachinesForStudents === null) {
                      onUpdateStartLessonField(
                        'missingMachinesForStudents',
                        e.target.value
                      );
                    }
                  }}
                  readOnly={missingMachinesForStudents !== null}
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary read-only:cursor-default read-only:bg-m3-surface-container-low"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Tình trạng NetSupport
                </span>
                <input
                  value={reportsDraft.startLesson.netSupportStatus}
                  onChange={(e) =>
                    onUpdateStartLessonField('netSupportStatus', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                  disabled={hasRoomSnapshot}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Tình trạng loa, âm ly
                </span>
                <input
                  value={reportsDraft.startLesson.audioStatus}
                  onChange={(e) =>
                    onUpdateStartLessonField('audioStatus', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                  disabled={hasRoomSnapshot}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Tình trạng máy lạnh, quạt
                </span>
                <input
                  value={reportsDraft.startLesson.coolingStatus}
                  onChange={(e) =>
                    onUpdateStartLessonField('coolingStatus', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                  disabled={hasRoomSnapshot}
                />
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-m3-on-surface">
                  Tình trạng vệ sinh phòng máy
                </span>
                <input
                  value={reportsDraft.startLesson.hygieneStatus}
                  onChange={(e) =>
                    onUpdateStartLessonField('hygieneStatus', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                  disabled={hasRoomSnapshot}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {activeStep === 'professional' && (
        <div className="pt-3">
          <div className="space-y-4 rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2">
              <Icon name="menu_book" className="text-base text-m3-secondary" />
              <h4 className="font-bold text-m3-secondary">BÁO CÁO CHUYÊN MÔN</h4>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Tên giáo viên
                </span>
                <input
                  value={reportsDraft.professional.teacherName}
                  onChange={(e) =>
                    onUpdateProfessionalField('teacherName', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">Lớp</span>
                <input
                  value={reportsDraft.professional.className}
                  onChange={(e) =>
                    onUpdateProfessionalField('className', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">Môn</span>
                <input
                  value={reportsDraft.professional.subjectName}
                  onChange={(e) =>
                    onUpdateProfessionalField('subjectName', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">Tài liệu dạy</span>
                <input
                  value={"Tin học Đại Dương"}
                  readOnly
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-m3-on-surface">
                  Nội dung dạy
                </span>
                <textarea
                  value={reportsDraft.professional.teachingContent}
                  onChange={(e) =>
                    onUpdateProfessionalField('teachingContent', e.target.value)
                  }
                  className="min-h-20 w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface p-3 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Số tiết dự kiến
                </span>
                <input
                  value={60}
                  readOnly
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Số tiết đã dạy
                </span>
                <input
                  value={reportsDraft.professional.taughtLessons}
                  onChange={(e) =>
                    onUpdateProfessionalField('taughtLessons', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Số lần hoàn thành OTTH
                </span>
                <input
                  value={'0'}
                  onChange={(e) =>
                    onUpdateProfessionalField(
                      'ongoingPracticeCompletions',
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Tỷ lệ kết quả Gmetrix
                </span>
                <input
                  value={'0'}
                  onChange={(e) =>
                    onUpdateProfessionalField('gmetrixResultRate', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {activeStep === 'endLesson' && (
        <div className="pt-3">
          <div className="space-y-4 rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-2">
              <Icon name="assignment" className="text-base text-m3-tertiary" />
              <h4 className="font-bold text-m3-tertiary">BÁO CÁO CUỐI BUỔI DẠY</h4>
            </div>
            {hasRoomSnapshot && (
              <p className="text-xs text-m3-tertiary/80">
                Các trường liên quan phòng máy được tự động lấy từ cấu hình phòng
                máy trong database.
              </p>
            )}
            <div className="rounded-2xl border border-m3-tertiary/30 bg-m3-tertiary-container/20 px-4 py-2.5 text-xs text-m3-on-tertiary-container">
              {attendanceData.roomSessionContext?.isSharedRoomSession
                ? `Đang là báo cáo cuối buổi dùng chung cho ${attendanceData.roomSessionContext.sharedClasses.length} lớp cùng phòng (${attendanceData.roomSessionContext.sessionLabel.toLowerCase()}).`
                : 'Chỉ có 1 lớp trong cùng phòng/buổi nên báo cáo cuối buổi áp dụng cho lịch hiện tại.'}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Tên giáo viên
                </span>
                <input
                  value={reportsDraft.endLesson.teacherName}
                  onChange={(e) =>
                    onUpdateEndLessonField('teacherName', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">Tên trợ giảng</span>
                <input
                  value={reportsDraft.endLesson.assistantName}
                  onChange={(e) =>
                    onUpdateEndLessonField('assistantName', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">Phòng máy</span>
                <input
                  value={reportsDraft.endLesson.roomName}
                  onChange={(e) =>
                    onUpdateEndLessonField('roomName', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                  disabled={hasRoomSnapshot}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">Tổng số máy</span>
                <input
                  value={reportsDraft.endLesson.totalMachines}
                  onChange={(e) =>
                    onUpdateEndLessonField('totalMachines', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                  disabled={hasRoomSnapshot}
                />
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-m3-on-surface">
                  Số lượng học sinh các lớp cùng phòng
                </span>
                <input
                  value={
                    classStudentCountSummary ||
                    reportsDraft.endLesson.classStudentCountSummary
                  }
                  readOnly
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Tỷ lệ học sinh có tài liệu
                </span>
                <input
                  value={'0%'}
                  readOnly
                  // onChange={(e) =>
                  //   onUpdateEndLessonField(
                  //     'studentMaterialCoverageRate',
                  //     e.target.value
                  //   )
                  // }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Tổng số máy lỗi (mô tả)
                </span>
                <input
                  value={
                    brokenMachinesSummary ??
                    reportsDraft.endLesson.brokenMachinesSummary
                  }
                  onChange={(e) => {
                    if (brokenMachinesSummary === null) {
                      onUpdateEndLessonField(
                        'brokenMachinesSummary',
                        e.target.value
                      );
                    }
                  }}
                  readOnly={brokenMachinesSummary !== null}
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary read-only:cursor-default read-only:bg-m3-surface-container-low"
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Tình trạng NetSupport
                </span>
                <input
                  value={reportsDraft.endLesson.netSupportStatus}
                  onChange={(e) =>
                    onUpdateEndLessonField('netSupportStatus', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                  disabled={hasRoomSnapshot}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Tình trạng loa, âm ly
                </span>
                <input
                  value={reportsDraft.endLesson.audioStatus}
                  onChange={(e) =>
                    onUpdateEndLessonField('audioStatus', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                  disabled={hasRoomSnapshot}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Tình trạng máy lạnh, quạt
                </span>
                <input
                  value={reportsDraft.endLesson.coolingStatus}
                  onChange={(e) =>
                    onUpdateEndLessonField('coolingStatus', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                  disabled={hasRoomSnapshot}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Đã tắt các thiết bị điện
                </span>
                <input
                  value={reportsDraft.endLesson.devicesPoweredOffStatus}
                  onChange={(e) =>
                    onUpdateEndLessonField(
                      'devicesPoweredOffStatus',
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                  disabled={hasRoomSnapshot}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  HS sắp xếp ghế ngồi
                </span>
                <input
                  value={reportsDraft.endLesson.seatingOrderStatus}
                  onChange={(e) =>
                    onUpdateEndLessonField('seatingOrderStatus', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                  disabled={hasRoomSnapshot}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  HS vệ sinh phòng máy
                </span>
                <input
                  value={reportsDraft.endLesson.roomHygieneStatus}
                  onChange={(e) =>
                    onUpdateEndLessonField('roomHygieneStatus', e.target.value)
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary disabled:opacity-50"
                  disabled={hasRoomSnapshot}
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-m3-on-surface">
                  Tuân thủ nội quy của HS
                </span>
                <input
                  value={reportsDraft.endLesson.studentRuleComplianceStatus}
                  onChange={(e) =>
                    onUpdateEndLessonField(
                      'studentRuleComplianceStatus',
                      e.target.value
                    )
                  }
                  className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface px-3 py-2 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
              <label className="grid gap-1 text-sm sm:col-span-2">
                <span className="font-medium text-m3-on-surface">
                  Danh sách vi phạm
                </span>
                <textarea
                  value={reportsDraft.endLesson.violationListSummary}
                  onChange={(e) =>
                    onUpdateEndLessonField('violationListSummary', e.target.value)
                  }
                  className="min-h-20 w-full rounded-xl border border-m3-outline-variant/60 bg-m3-surface p-3 text-sm text-m3-on-surface outline-none focus:border-m3-primary"
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
