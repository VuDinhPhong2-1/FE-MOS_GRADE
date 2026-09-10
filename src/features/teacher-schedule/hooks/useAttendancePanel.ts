import { useCallback, useMemo, useState } from 'react';
import { computerRoomService } from '../../../services/computer-room.service';
import { scheduleService } from '../../../services/schedule.service';
import type { ComputerRoom } from '../../../types/computer-room.types';
import type {
  AttendanceStatus,
  SaveScheduleAttendanceItem,
  ScheduleAttendanceResponse,
  ScheduleEndLessonReport,
  ScheduleItem,
  ScheduleProfessionalReport,
  ScheduleReportsPayload,
  ScheduleStartLessonReport,
} from '../../../types/schedule.types';
import { notify } from '../../../utils/notify';
import type { AttendanceDraftState, AttendancePanelTab } from '../types';
import {
  buildAttendanceDraft,
  buildReportsDraft,
  calculateMissingMachinesByFormula,
  emptyReportsPayload,
  endLessonRoomAutoFields,
  startLessonRoomAutoFields,
  vietnameseCollator,
} from '../utils';

const FIXED_PROFESSIONAL_REPORT_FIELDS = {
  plannedLessons: '60',
  ongoingPracticeCompletions: '0',
  gmetrixResultRate: '0%',
} as const;

const mergeComputerRoomDetail = (
  attendance: ScheduleAttendanceResponse,
  room: ComputerRoom
): ScheduleAttendanceResponse => {
  if (!attendance.computerRoom) {
    return attendance;
  }

  return {
    ...attendance,
    computerRoom: {
      ...attendance.computerRoom,
      brokenMachinesDetail:
        room.brokenMachinesDetail ?? attendance.computerRoom.brokenMachinesDetail,
      brokenMachineCount: room.brokenMachineCount,
      totalMachinesText: room.totalMachinesText || attendance.computerRoom.totalMachinesText,
      netSupportStatus: room.netSupportStatus || attendance.computerRoom.netSupportStatus,
      audioStatus: room.audioStatus || attendance.computerRoom.audioStatus,
      coolingStatus: room.coolingStatus || attendance.computerRoom.coolingStatus,
      devicesPoweredOffStatus:
        room.devicesPoweredOffStatus || attendance.computerRoom.devicesPoweredOffStatus,
      seatingOrderStatus: room.seatingOrderStatus || attendance.computerRoom.seatingOrderStatus,
      roomHygieneStatus: room.roomHygieneStatus || attendance.computerRoom.roomHygieneStatus,
    },
  };
};

interface UseAttendancePanelProps {
  getAccessToken: () => Promise<string | null>;
  teacherDisplayName: string;
  resolveSchoolNameForSchedule: (item: ScheduleItem) => string;
  onScheduleUpdated?: () => Promise<void>;
}

export const useAttendancePanel = ({
  getAccessToken,
  teacherDisplayName,
  resolveSchoolNameForSchedule,
  onScheduleUpdated,
}: UseAttendancePanelProps) => {
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceSyncing, setAttendanceSyncing] = useState(false);
  const [attendanceData, setAttendanceData] = useState<ScheduleAttendanceResponse | null>(null);
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, AttendanceDraftState>>({});
  const [reportsDraft, setReportsDraft] = useState<ScheduleReportsPayload>(emptyReportsPayload());
  const [attendanceTab, setAttendanceTab] = useState<AttendancePanelTab>('attendance');
  const [attendanceKeyword, setAttendanceKeyword] = useState('');
  const [attendanceNameSortDirection, setAttendanceNameSortDirection] = useState<'none' | 'asc' | 'desc'>('none');

  const hasRoomSnapshot = useMemo(() => Boolean(attendanceData?.computerRoom), [attendanceData]);

  const attendanceMissingMachinesByFormula = useMemo(() => {
    if (!attendanceData) return null;
    return calculateMissingMachinesByFormula(attendanceData);
  }, [attendanceData]);

  const openAttendance = useCallback(
    async (item: ScheduleItem) => {
      try {
        setAttendanceOpen(true);
        setAttendanceLoading(true);
        setAttendanceData(null);
        setAttendanceKeyword('');
        setAttendanceTab('attendance');
        let response = await scheduleService.getAttendance(item.id, getAccessToken);

        if (
          response.computerRoom &&
          !response.computerRoom.brokenMachinesDetail &&
          response.schoolId
        ) {
          const rooms = await computerRoomService
            .getBySchool(response.schoolId, getAccessToken, true)
            .catch(() => []);
          const matchedRoom = rooms.find(
            (room) =>
              room.id === response.roomId ||
              room.id === response.computerRoom?.id ||
              room.name.trim().toLowerCase() ===
                response.computerRoom?.name.trim().toLowerCase()
          );

          if (matchedRoom) {
            response = mergeComputerRoomDetail(response, matchedRoom);
          }
        }

        setAttendanceData(response);
        setAttendanceDraft(buildAttendanceDraft(response));
        setReportsDraft(buildReportsDraft(response, teacherDisplayName));
      } catch (error) {
        setAttendanceOpen(false);
        notify.error(error instanceof Error ? error.message : 'Không thể mở điểm danh');
      } finally {
        setAttendanceLoading(false);
      }
    },
    [getAccessToken, teacherDisplayName]
  );

  const closeAttendance = useCallback(() => {
    if (attendanceSaving) return;
    setAttendanceOpen(false);
    setAttendanceData(null);
    setAttendanceDraft({});
    setReportsDraft(emptyReportsPayload());
    setAttendanceTab('attendance');
    setAttendanceKeyword('');
  }, [attendanceSaving]);

  const toggleAttendanceStatus = useCallback((studentId: string) => {
    setAttendanceDraft((prev) => {
      const currentStatus = prev[studentId]?.status ?? 'Present';
      const nextStatus: AttendanceStatus = currentStatus === 'Present' ? 'Absent' : 'Present';
      return {
        ...prev,
        [studentId]: {
          status: nextStatus,
          note: prev[studentId]?.note ?? '',
        },
      };
    });
  }, []);

  const updateAttendanceNote = useCallback((studentId: string, note: string) => {
    setAttendanceDraft((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status ?? 'Present',
        note,
      },
    }));
  }, []);

  const setAllAttendanceStatus = useCallback(
    (status: AttendanceStatus) => {
      if (!attendanceData) return;
      setAttendanceDraft((prev) => {
        const next: Record<string, AttendanceDraftState> = {};
        attendanceData.students.forEach((student) => {
          next[student.studentId] = {
            status,
            note: prev[student.studentId]?.note ?? '',
          };
        });
        return next;
      });
    },
    [attendanceData]
  );

  const updateStartLessonReportField = useCallback(
    (field: keyof ScheduleStartLessonReport, value: string) => {
      if (hasRoomSnapshot && startLessonRoomAutoFields.includes(field)) return;
      setReportsDraft((prev) => ({
        ...prev,
        startLesson: {
          ...prev.startLesson,
          [field]: value,
        },
      }));
    },
    [hasRoomSnapshot]
  );

  const updateProfessionalReportField = useCallback(
    (field: keyof ScheduleProfessionalReport, value: string) => {
      setReportsDraft((prev) => ({
        ...prev,
        professional: {
          ...prev.professional,
          [field]: value,
        },
      }));
    },
    []
  );

  const updateEndLessonReportField = useCallback(
    (field: keyof ScheduleEndLessonReport, value: string) => {
      if (hasRoomSnapshot && endLessonRoomAutoFields.includes(field)) return;
      setReportsDraft((prev) => ({
        ...prev,
        endLesson: {
          ...prev.endLesson,
          [field]: value,
        },
      }));
    },
    [hasRoomSnapshot]
  );

  const attendanceStats = useMemo(() => {
    if (!attendanceData) {
      return { present: 0, absent: 0 };
    }

    return attendanceData.students.reduce(
      (acc, student) => {
        const status = attendanceDraft[student.studentId]?.status ?? 'Present';
        if (status === 'Present') acc.present += 1;
        else acc.absent += 1;
        return acc;
      },
      { present: 0, absent: 0 }
    );
  }, [attendanceData, attendanceDraft]);

  const hasUnsavedAttendanceChanges = useMemo(() => {
    if (!attendanceData) return false;

    return attendanceData.students.some((student) => {
      const draft = attendanceDraft[student.studentId];
      if (!draft) return false;

      const serverStatus = student.attendanceStatus ?? 'Present';
      const serverNote = (student.note ?? '').trim();
      const draftNote = (draft.note ?? '').trim();

      return draft.status !== serverStatus || draftNote !== serverNote;
    });
  }, [attendanceData, attendanceDraft]);

  const handleSaveAttendance = useCallback(async () => {
    if (!attendanceData) return;

    try {
      setAttendanceSaving(true);
      const payload: SaveScheduleAttendanceItem[] = attendanceData.students.map((student) => ({
        studentId: student.studentId,
        status: attendanceDraft[student.studentId]?.status ?? 'Present',
        note: attendanceDraft[student.studentId]?.note?.trim() || undefined,
      }));

      const response = await scheduleService.saveAttendance(
        attendanceData.scheduleId,
        payload,
        {
          ...reportsDraft,
          professional: {
            ...reportsDraft.professional,
            ...FIXED_PROFESSIONAL_REPORT_FIELDS,
          },
        },
        getAccessToken
      );
      setAttendanceData(response);
      setAttendanceDraft(buildAttendanceDraft(response));
      setReportsDraft(buildReportsDraft(response, teacherDisplayName));
      notify.success('Đã lưu điểm danh và báo cáo');
      if (onScheduleUpdated) {
        await onScheduleUpdated();
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể lưu điểm danh và báo cáo');
    } finally {
      setAttendanceSaving(false);
    }
  }, [attendanceData, attendanceDraft, reportsDraft, getAccessToken, teacherDisplayName, onScheduleUpdated]);

  const handleSyncAttendanceToGoogleSheet = useCallback(async () => {
    if (!attendanceData) return;
    if (hasUnsavedAttendanceChanges) {
      notify.error('Vui lòng lưu điểm danh trước khi đồng bộ Google Sheet');
      return;
    }

    try {
      setAttendanceSyncing(true);
      const result = await scheduleService.syncAttendanceToGoogleSheet(attendanceData.scheduleId, getAccessToken);
      notify.success(result.message || 'Đã đồng bộ điểm danh với Google Sheet');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể đồng bộ điểm danh với Google Sheet');
    } finally {
      setAttendanceSyncing(false);
    }
  }, [attendanceData, hasUnsavedAttendanceChanges, getAccessToken]);

  const toggleAttendanceNameSort = useCallback(() => {
    setAttendanceNameSortDirection((prev) => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  }, []);

  const filteredAttendanceStudents = useMemo(() => {
    if (!attendanceData) return [];

    const keyword = attendanceKeyword.trim().toLowerCase();
    let list = [...attendanceData.students];

    if (keyword) {
      list = list.filter((student) => {
        const fullName = `${student.middleName} ${student.firstName}`.toLowerCase();
        return fullName.split(/\s+/).includes(keyword) || fullName.startsWith(keyword);
      });
    }

    if (attendanceNameSortDirection === 'asc') {
      list.sort((a, b) => {
        const byFirstName = vietnameseCollator.compare(a.firstName || '', b.firstName || '');
        if (byFirstName !== 0) return byFirstName;
        return vietnameseCollator.compare(a.middleName || '', b.middleName || '');
      });
    } else if (attendanceNameSortDirection === 'desc') {
      list.sort((a, b) => {
        const byFirstName = vietnameseCollator.compare(b.firstName || '', a.firstName || '');
        if (byFirstName !== 0) return byFirstName;
        return vietnameseCollator.compare(b.middleName || '', a.middleName || '');
      });
    }

    return list;
  }, [attendanceData, attendanceKeyword, attendanceNameSortDirection]);

  const attendanceSchoolName = useMemo(() => {
    if (!attendanceData) return '';
    const fakeSchedule: ScheduleItem = {
      id: attendanceData.scheduleId,
      ownerId: '',
      schoolId: undefined,
      classId: attendanceData.classId,
      className: attendanceData.className,
      subject: attendanceData.subject,
      roomName: attendanceData.roomName,
      roomId: attendanceData.roomId,
      periodLabel: undefined,
      date: attendanceData.date,
      dayOfWeek: 0,
      startTime: attendanceData.startTime,
      endTime: attendanceData.endTime,
      notes: undefined,
      isActive: true,
      createdAt: '',
      updatedAt: undefined,
    };
    return resolveSchoolNameForSchedule(fakeSchedule);
  }, [attendanceData, resolveSchoolNameForSchedule]);

  return {
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
  };
};
