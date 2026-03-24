import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  BookOpen,
  Building2,
  CalendarClock,
  CheckCheck,
  ClipboardCheck,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Monitor,
  Pencil,
  Plus,
  Power,
  Sparkles,
  Trash2,
  RefreshCw,
  Volume2,
  Wind,
  Wrench,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classService } from '../services/class.service';
import { computerRoomService } from '../services/computer-room.service';
import { schoolService } from '../services/school.service';
import { scheduleService } from '../services/schedule.service';
import type { Class } from '../types/class.types';
import type {
  ComputerRoom,
  CreateComputerRoomRequest,
  UpdateComputerRoomRequest,
} from '../types/computer-room.types';
import type { School } from '../types/school.types';
import type {
  AttendanceStatus,
  SaveScheduleAttendanceItem,
  ScheduleReportsPayload,
  ScheduleAttendanceResponse,
  ScheduleEndLessonReport,
  ScheduleProfessionalReport,
  ScheduleStartLessonReport,
  ScheduleItem,
  UpdateScheduleRequest,
} from '../types/schedule.types';
import { notify } from '../utils/notify';

interface ScheduleFormState {
  schoolId: string;
  classId: string;
  className: string;
  subject: string;
  roomName: string;
  roomId: string;
  periodLabel: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  isActive: boolean;
}

interface ComputerRoomFormState {
  schoolId: string;
  name: string;
  studentMachineCount: string;
  teacherMachineCount: string;
  brokenMachineCount: string;
  netSupportStatus: string;
  audioStatus: string;
  coolingStatus: string;
  devicesPoweredOffStatus: string;
  seatingOrderStatus: string;
  roomHygieneStatus: string;
  isActive: boolean;
}

interface AttendanceDraftState {
  status: AttendanceStatus;
  note: string;
}

type AttendancePanelTab = 'attendance' | 'startLesson' | 'professional' | 'endLesson';

const weekdayLabels: Record<number, string> = {
  0: 'CN',
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
};

const vietnameseCollator = new Intl.Collator('vi', {
  sensitivity: 'variant',
  numeric: true,
});

const toYmd = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay(); // 0..6
  const diff = (day + 6) % 7; // monday = 0
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const parseApiDateToLocalYmd = (value: string): string => {
  if (!value) return '';

  const plainYmd = value.match(/^\d{4}-\d{2}-\d{2}$/);
  if (plainYmd) return plainYmd[0];

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return toYmd(parsed);
  }

  const fallback = value.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(fallback) ? fallback : '';
};

const formatDateViFromYmd = (ymd: string): string => {
  const [y, m, d] = ymd.split('-');
  if (!y || !m || !d) return ymd;
  return `${d}/${m}/${y}`;
};

const getWeekdayLabelFromYmd = (ymd: string): string => {
  const date = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(date.getTime())) return '-';
  return weekdayLabels[date.getDay()] || '-';
};

const normalizeTimeValue = (rawValue: string): string => {
  const value = rawValue.trim();
  if (!value) return value;

  // HH:mm or HH:mm:ss
  const hhmmss = value.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hhmmss) {
    const hour = Number(hhmmss[1]);
    const minute = Number(hhmmss[2]);
    if (!Number.isNaN(hour) && !Number.isNaN(minute) && hour >= 0 && hour <= 23) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }

  // h:mm AM/PM
  const ampm = value.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (ampm) {
    let hour = Number(ampm[1]);
    const minute = Number(ampm[2]);
    const marker = ampm[3].toUpperCase();
    if (marker === 'PM' && hour < 12) hour += 12;
    if (marker === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  return value;
};

const parseTimeToMinutes = (timeValue: string): number | null => {
  const value = normalizeTimeValue(timeValue);
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return hour * 60 + minute;
};

type TodayLessonTimeline = 'done' | 'ongoing' | 'upcoming';

const createDefaultForm = (weekStart: string): ScheduleFormState => ({
  schoolId: '',
  classId: '',
  className: '',
  subject: '',
  roomName: '',
  roomId: '',
  periodLabel: '',
  date: weekStart,
  startTime: '07:00',
  endTime: '07:45',
  notes: '',
  isActive: true,
});

const createDefaultRoomForm = (schoolId = ''): ComputerRoomFormState => ({
  schoolId,
  name: '',
  studentMachineCount: '45',
  teacherMachineCount: '1',
  brokenMachineCount: '0',
  netSupportStatus: 'Tốt',
  audioStatus: 'Tốt',
  coolingStatus: 'Tốt',
  devicesPoweredOffStatus: 'Rồi',
  seatingOrderStatus: 'Tốt',
  roomHygieneStatus: 'Tốt',
  isActive: true,
});

const getRoomConditionTone = (value: string): string => {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return 'border-slate-200 bg-slate-100 text-slate-600';
  }

  const positiveSignals = ['tốt', 'tot', 'rồi', 'roi', 'ổn', 'on', 'ok', 'sạch', 'sach', 'gọn', 'gon'];
  const warningSignals = ['trung bình', 'tam', 'tạm', 'ít', 'it', 'thiếu', 'thieu', 'chậm', 'cham'];
  const negativeSignals = ['lỗi', 'loi', 'hỏng', 'hong', 'không', 'khong', 'chưa', 'chua', 'kém', 'kem'];

  if (negativeSignals.some((signal) => normalized.includes(signal))) {
    return 'border-rose-200 bg-rose-50 text-rose-700';
  }

  if (warningSignals.some((signal) => normalized.includes(signal))) {
    return 'border-amber-200 bg-amber-50 text-amber-700';
  }

  if (positiveSignals.some((signal) => normalized.includes(signal))) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }

  return 'border-sky-200 bg-sky-50 text-sky-700';
};

const resolveSnapshotValue = (
  snapshotValue: string | number | undefined | null,
  fallbackValue?: string
): string => {
  if (snapshotValue === undefined || snapshotValue === null) return fallbackValue || '';
  const normalized = `${snapshotValue}`.trim();
  return normalized || fallbackValue || '';
};

const calculateMissingMachinesByFormula = (data: ScheduleAttendanceResponse): number | null => {
  const roomSnapshot = data.computerRoom;
  if (!roomSnapshot) return null;

  // "Thiếu cho học sinh" chỉ tính trên máy học sinh, không tính máy giáo viên.
  const studentMachines = Math.max(0, roomSnapshot.studentMachineCount);
  const brokenMachines = Math.max(0, roomSnapshot.brokenMachineCount);
  const availableStudentMachines = Math.max(0, studentMachines - brokenMachines);
  const classSizeFromSnapshot =
    Number.isFinite(roomSnapshot.currentClassStudents) && roomSnapshot.currentClassStudents > 0
      ? roomSnapshot.currentClassStudents
      : null;
  const classSize = Math.max(0, classSizeFromSnapshot ?? data.students.length);

  return Math.max(classSize - availableStudentMachines, 0);
};

const startLessonRoomAutoFields: (keyof ScheduleStartLessonReport)[] = [
  'roomName',
  'totalMachines',
  'brokenMachinesSummary',
  'missingMachinesForStudents',
  'netSupportStatus',
  'audioStatus',
  'coolingStatus',
  'hygieneStatus',
];

const endLessonRoomAutoFields: (keyof ScheduleEndLessonReport)[] = [
  'roomName',
  'totalMachines',
  'brokenMachinesSummary',
  'netSupportStatus',
  'audioStatus',
  'coolingStatus',
  'devicesPoweredOffStatus',
  'seatingOrderStatus',
  'roomHygieneStatus',
];

const buildAttendanceDraft = (data: ScheduleAttendanceResponse): Record<string, AttendanceDraftState> => {
  const next: Record<string, AttendanceDraftState> = {};
  data.students.forEach((student) => {
    next[student.studentId] = {
      status: student.attendanceStatus || 'Present',
      note: student.note || '',
    };
  });
  return next;
};

const emptyStartLessonReport = (): ScheduleStartLessonReport => ({
  teacherName: '',
  assistantName: '',
  roomName: '',
  totalMachines: '',
  brokenMachinesSummary: '',
  missingMachinesForStudents: '',
  netSupportStatus: '',
  audioStatus: '',
  coolingStatus: '',
  hygieneStatus: '',
});

const emptyProfessionalReport = (): ScheduleProfessionalReport => ({
  teacherName: '',
  className: '',
  subjectName: '',
  teachingMaterials: '',
  teachingContent: '',
  plannedLessons: '',
  taughtLessons: '',
  ongoingPracticeCompletions: '',
  gmetrixResultRate: '',
});

const emptyEndLessonReport = (): ScheduleEndLessonReport => ({
  teacherName: '',
  assistantName: '',
  roomName: '',
  totalMachines: '',
  classStudentCountSummary: '',
  studentMaterialCoverageRate: '',
  brokenMachinesSummary: '',
  netSupportStatus: '',
  audioStatus: '',
  coolingStatus: '',
  devicesPoweredOffStatus: '',
  seatingOrderStatus: '',
  roomHygieneStatus: '',
  studentRuleComplianceStatus: '',
  violationListSummary: '',
});

const emptyReportsPayload = (): ScheduleReportsPayload => ({
  startLesson: emptyStartLessonReport(),
  professional: emptyProfessionalReport(),
  endLesson: emptyEndLessonReport(),
});

const buildReportsDraft = (data: ScheduleAttendanceResponse, teacherName: string): ScheduleReportsPayload => {
  const source = data.reports || emptyReportsPayload();
  const roomSnapshot = data.computerRoom;
  const roomNameDefault = roomSnapshot?.name || data.roomName || '';
  const totalMachinesDefault = roomSnapshot?.totalMachinesText || '';
  const brokenMachinesDefault =
    roomSnapshot && Number.isFinite(roomSnapshot.brokenMachineCount)
      ? `${roomSnapshot.brokenMachineCount}`
      : '';
  const missingMachinesByFormula = calculateMissingMachinesByFormula(data);
  const missingMachinesDefault =
    missingMachinesByFormula !== null
      ? `${missingMachinesByFormula}`
      : roomSnapshot && Number.isFinite(roomSnapshot.missingMachinesForStudents)
        ? `${roomSnapshot.missingMachinesForStudents}`
        : '';

  return {
    startLesson: {
      ...emptyStartLessonReport(),
      ...(source.startLesson || {}),
      teacherName: source.startLesson?.teacherName || teacherName || '',
      roomName: resolveSnapshotValue(roomNameDefault, source.startLesson?.roomName),
      totalMachines: resolveSnapshotValue(totalMachinesDefault, source.startLesson?.totalMachines),
      brokenMachinesSummary: resolveSnapshotValue(
        brokenMachinesDefault,
        source.startLesson?.brokenMachinesSummary
      ),
      missingMachinesForStudents:
        resolveSnapshotValue(missingMachinesDefault, source.startLesson?.missingMachinesForStudents),
      netSupportStatus: resolveSnapshotValue(
        roomSnapshot?.netSupportStatus,
        source.startLesson?.netSupportStatus
      ),
      audioStatus: resolveSnapshotValue(roomSnapshot?.audioStatus, source.startLesson?.audioStatus),
      coolingStatus: resolveSnapshotValue(
        roomSnapshot?.coolingStatus,
        source.startLesson?.coolingStatus
      ),
      hygieneStatus: resolveSnapshotValue(
        roomSnapshot?.roomHygieneStatus,
        source.startLesson?.hygieneStatus
      ),
    },
    professional: {
      ...emptyProfessionalReport(),
      ...(source.professional || {}),
      teacherName: source.professional?.teacherName || teacherName || '',
      className: source.professional?.className || data.className || '',
      subjectName: source.professional?.subjectName || data.subject || '',
    },
    endLesson: {
      ...emptyEndLessonReport(),
      ...(source.endLesson || {}),
      teacherName: source.endLesson?.teacherName || teacherName || '',
      roomName: resolveSnapshotValue(roomNameDefault, source.endLesson?.roomName),
      totalMachines: resolveSnapshotValue(totalMachinesDefault, source.endLesson?.totalMachines),
      brokenMachinesSummary: resolveSnapshotValue(
        brokenMachinesDefault,
        source.endLesson?.brokenMachinesSummary
      ),
      netSupportStatus: resolveSnapshotValue(
        roomSnapshot?.netSupportStatus,
        source.endLesson?.netSupportStatus
      ),
      audioStatus: resolveSnapshotValue(roomSnapshot?.audioStatus, source.endLesson?.audioStatus),
      coolingStatus: resolveSnapshotValue(roomSnapshot?.coolingStatus, source.endLesson?.coolingStatus),
      devicesPoweredOffStatus:
        resolveSnapshotValue(roomSnapshot?.devicesPoweredOffStatus, source.endLesson?.devicesPoweredOffStatus),
      seatingOrderStatus:
        resolveSnapshotValue(roomSnapshot?.seatingOrderStatus, source.endLesson?.seatingOrderStatus),
      roomHygieneStatus: resolveSnapshotValue(
        roomSnapshot?.roomHygieneStatus,
        source.endLesson?.roomHygieneStatus
      ),
      classStudentCountSummary:
        data.roomSessionContext?.sharedClassStudentSummary || source.endLesson?.classStudentCountSummary || '',
    },
  };
};

const isDateInWeek = (dateYmd: string, weekStart: string): boolean => {
  const target = new Date(`${dateYmd}T00:00:00`);
  const start = new Date(`${weekStart}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return target >= start && target <= end;
};

const buildScheduleKey = (
  dateYmd: string,
  className: string,
  subject: string,
  periodLabel?: string,
  startTime?: string,
  endTime?: string,
  roomName?: string,
  roomId?: string
): string => {
  return [
    dateYmd,
    className.trim().toLowerCase(),
    subject.trim().toLowerCase(),
    (periodLabel || '').trim().toLowerCase(),
    (startTime || '').trim(),
    (endTime || '').trim(),
    (roomName || '').trim().toLowerCase(),
    (roomId || '').trim().toLowerCase(),
  ].join('|');
};

const TeacherSchedule = () => {
  const { getAccessToken, user } = useAuth();
  const todayYmd = toYmd(new Date());
  const [weekStart, setWeekStart] = useState<string>(toYmd(getWeekStart(new Date())));
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [computerRooms, setComputerRooms] = useState<ComputerRoom[]>([]);
  const [computerRoomsLoading, setComputerRoomsLoading] = useState(false);
  const [roomManagerOpen, setRoomManagerOpen] = useState(false);
  const [roomManagerSchoolId, setRoomManagerSchoolId] = useState('');
  const [roomManagerRows, setRoomManagerRows] = useState<ComputerRoom[]>([]);
  const [roomManagerLoading, setRoomManagerLoading] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState('');
  const [roomSubmitting, setRoomSubmitting] = useState(false);
  const [roomForm, setRoomForm] = useState<ComputerRoomFormState>(createDefaultRoomForm());
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [selectedScheduleIds, setSelectedScheduleIds] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(createDefaultForm(weekStart));
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
  const [nowTick, setNowTick] = useState<number>(Date.now());
  const teacherDisplayName = user?.fullName || user?.username || '';
  const hasRoomSnapshot = Boolean(attendanceData?.computerRoom);
  const attendanceMissingMachinesByFormula = useMemo(() => {
    if (!attendanceData) return null;
    return calculateMissingMachinesByFormula(attendanceData);
  }, [attendanceData]);

  const weekEnd = useMemo(() => {
    const start = new Date(`${weekStart}T00:00:00`);
    start.setDate(start.getDate() + 6);
    return toYmd(start);
  }, [weekStart]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const nowMinutesInDay = useMemo(() => {
    const now = new Date(nowTick);
    return now.getHours() * 60 + now.getMinutes();
  }, [nowTick]);

  const classesBySelectedSchool = useMemo(() => {
    if (!form.schoolId) return [];
    return classes.filter((item) => item.schoolId === form.schoolId && item.isActive);
  }, [classes, form.schoolId]);

  const schoolNameById = useMemo(() => {
    return new Map(schools.map((item) => [item.id, item.name]));
  }, [schools]);

  const selectedRoomManagerSchool = useMemo(
    () => schools.find((item) => item.id === roomManagerSchoolId) || null,
    [roomManagerSchoolId, schools]
  );

  const classById = useMemo(() => {
    return new Map(classes.map((item) => [item.id, item]));
  }, [classes]);

  const roomManagerSummary = useMemo(
    () =>
      roomManagerRows.reduce(
        (acc, room) => {
          acc.totalRooms += 1;
          acc.activeRooms += room.isActive ? 1 : 0;
          acc.totalMachines += room.totalMachineCount;
          acc.availableMachines += room.availableStudentMachines;
          return acc;
        },
        {
          totalRooms: 0,
          activeRooms: 0,
          totalMachines: 0,
          availableMachines: 0,
        }
      ),
    [roomManagerRows]
  );

  const roomFormMachinePreview = useMemo(() => {
    const studentMachines = Math.max(0, Number.parseInt(roomForm.studentMachineCount, 10) || 0);
    const teacherMachines = Math.max(0, Number.parseInt(roomForm.teacherMachineCount, 10) || 0);
    const brokenMachines = Math.max(0, Number.parseInt(roomForm.brokenMachineCount, 10) || 0);

    return {
      totalMachines: studentMachines + teacherMachines,
      availableMachines: Math.max(0, studentMachines - brokenMachines),
    };
  }, [roomForm.brokenMachineCount, roomForm.studentMachineCount, roomForm.teacherMachineCount]);

  const resolveSchoolNameForSchedule = (item: ScheduleItem): string => {
    if (item.schoolId && schoolNameById.has(item.schoolId)) {
      return schoolNameById.get(item.schoolId) || '';
    }

    if (item.classId && classById.has(item.classId)) {
      const matchedClass = classById.get(item.classId);
      if (matchedClass?.schoolId && schoolNameById.has(matchedClass.schoolId)) {
        return schoolNameById.get(matchedClass.schoolId) || '';
      }
    }

    return '';
  };

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
  }, [attendanceData, classById, schoolNameById]);

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

  const toggleAttendanceNameSort = () => {
    setAttendanceNameSortDirection((prev) => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  };

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

  const selectedSchedules = useMemo(() => {
    if (selectedScheduleIds.length === 0) return [];
    const selectedIdSet = new Set(selectedScheduleIds);
    return schedules.filter((item) => selectedIdSet.has(item.id));
  }, [schedules, selectedScheduleIds]);

  const areAllSchedulesSelected = schedules.length > 0 && selectedScheduleIds.length === schedules.length;

  const loadSchedules = async () => {
    try {
      setLoading(true);
      const response = await scheduleService.getWeekSchedules(weekStart, getAccessToken);
      setSchedules(response.data || []);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể tải thời khóa biểu');
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const items = await classService.getAllClasses(getAccessToken, true);
      setClasses(items);
    } catch {
      // Không chặn màn hình nếu danh sách lớp lỗi
    }
  };

  const loadSchools = async () => {
    try {
      const items = await schoolService.getSchools(getAccessToken);
      setSchools(items.filter((item) => item.isActive !== false));
    } catch {
      // Không chặn màn hình nếu danh sách trường lỗi
    }
  };

  const loadComputerRoomsForForm = async (schoolId: string) => {
    if (!schoolId) {
      setComputerRooms([]);
      return;
    }
    try {
      setComputerRoomsLoading(true);
      const rows = await computerRoomService.getBySchool(schoolId, getAccessToken, false);
      setComputerRooms(rows);
    } catch (error) {
      setComputerRooms([]);
      notify.error(error instanceof Error ? error.message : 'Không thể tải danh sách phòng máy');
    } finally {
      setComputerRoomsLoading(false);
    }
  };

  const loadRoomManagerRows = async (schoolId: string) => {
    if (!schoolId) {
      setRoomManagerRows([]);
      return;
    }
    try {
      setRoomManagerLoading(true);
      const rows = await computerRoomService.getBySchool(schoolId, getAccessToken, true);
      setRoomManagerRows(rows);
    } catch (error) {
      setRoomManagerRows([]);
      notify.error(error instanceof Error ? error.message : 'Không thể tải dữ liệu quản lý phòng máy');
    } finally {
      setRoomManagerLoading(false);
    }
  };

  const resetRoomForm = (schoolId: string) => {
    setEditingRoomId('');
    setRoomForm(createDefaultRoomForm(schoolId));
  };

  const openRoomManager = () => {
    const fallbackSchoolId = form.schoolId || roomManagerSchoolId || schools[0]?.id || '';
    if (!fallbackSchoolId) {
      notify.warning('Chưa có trường học để quản lý phòng máy');
      return;
    }
    setRoomManagerSchoolId(fallbackSchoolId);
    resetRoomForm(fallbackSchoolId);
    setRoomManagerOpen(true);
  };

  useEffect(() => {
    void loadClasses();
    void loadSchools();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart]);

  useEffect(() => {
    setSelectedScheduleIds((prev) => {
      if (prev.length === 0) return prev;
      const validIds = new Set(schedules.map((item) => item.id));
      const filtered = prev.filter((id) => validIds.has(id));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [schedules]);

  useEffect(() => {
    if (!formOpen || editing || form.schoolId || schools.length !== 1) return;
    setForm((prev) => ({ ...prev, schoolId: schools[0].id }));
  }, [editing, form.schoolId, formOpen, schools]);

  useEffect(() => {
    void loadComputerRoomsForForm(form.schoolId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.schoolId]);

  useEffect(() => {
    if (!roomManagerSchoolId && schools.length > 0) {
      setRoomManagerSchoolId(schools[0].id);
    }
  }, [roomManagerSchoolId, schools]);

  useEffect(() => {
    if (!roomManagerOpen) return;
    void loadRoomManagerRows(roomManagerSchoolId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomManagerOpen, roomManagerSchoolId]);

  useEffect(() => {
    if (!form.roomId) return;
    const matchedRoom = computerRooms.find((room) => room.id === form.roomId);
    if (!matchedRoom) {
      setForm((prev) => ({ ...prev, roomId: '' }));
      return;
    }
    if (form.roomName === matchedRoom.name) return;
    setForm((prev) => ({ ...prev, roomName: matchedRoom.name }));
  }, [computerRooms, form.roomId, form.roomName]);

  const openCreate = () => {
    setEditing(null);
    setForm(createDefaultForm(weekStart));
    setFormOpen(true);
  };

  const openEdit = (item: ScheduleItem) => {
    const matchedClass = item.classId ? classes.find((classItem) => classItem.id === item.classId) : undefined;
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
  };

  const parseNonNegativeInt = (value: string, fallback: number): number => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.max(0, parsed);
  };

  const handleEditRoom = (room: ComputerRoom) => {
    setEditingRoomId(room.id);
    setRoomForm({
      schoolId: room.schoolId,
      name: room.name,
      studentMachineCount: `${room.studentMachineCount}`,
      teacherMachineCount: `${room.teacherMachineCount}`,
      brokenMachineCount: `${room.brokenMachineCount}`,
      netSupportStatus: room.netSupportStatus || 'Tốt',
      audioStatus: room.audioStatus || 'Tốt',
      coolingStatus: room.coolingStatus || 'Tốt',
      devicesPoweredOffStatus: room.devicesPoweredOffStatus || 'Rồi',
      seatingOrderStatus: room.seatingOrderStatus || 'Tốt',
      roomHygieneStatus: room.roomHygieneStatus || 'Tốt',
      isActive: room.isActive,
    });
  };

  const handleDeleteRoom = async (room: ComputerRoom) => {
    const confirmed = window.confirm(`Xóa phòng máy "${room.name}"?`);
    if (!confirmed) return;
    try {
      await computerRoomService.delete(room.id, getAccessToken);
      notify.success('Đã xóa phòng máy');
      await loadRoomManagerRows(roomManagerSchoolId);
      if (form.schoolId === room.schoolId) {
        await loadComputerRoomsForForm(form.schoolId);
      }
      if (form.roomId === room.id) {
        setForm((prev) => ({ ...prev, roomId: '', roomName: '' }));
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể xóa phòng máy');
    }
  };

  const handleSaveRoom = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const schoolId = roomForm.schoolId || roomManagerSchoolId;
    if (!schoolId) {
      notify.warning('Vui lòng chọn trường');
      return;
    }
    if (!roomForm.name.trim()) {
      notify.warning('Vui lòng nhập tên phòng máy');
      return;
    }

    const sharedPayload = {
      name: roomForm.name.trim(),
      studentMachineCount: parseNonNegativeInt(roomForm.studentMachineCount, 0),
      teacherMachineCount: parseNonNegativeInt(roomForm.teacherMachineCount, 1),
      brokenMachineCount: parseNonNegativeInt(roomForm.brokenMachineCount, 0),
      netSupportStatus: roomForm.netSupportStatus.trim() || 'Tốt',
      audioStatus: roomForm.audioStatus.trim() || 'Tốt',
      coolingStatus: roomForm.coolingStatus.trim() || 'Tốt',
      devicesPoweredOffStatus: roomForm.devicesPoweredOffStatus.trim() || 'Rồi',
      seatingOrderStatus: roomForm.seatingOrderStatus.trim() || 'Tốt',
      roomHygieneStatus: roomForm.roomHygieneStatus.trim() || 'Tốt',
    };

    try {
      setRoomSubmitting(true);
      if (editingRoomId) {
        const updatePayload: UpdateComputerRoomRequest = {
          ...sharedPayload,
          isActive: roomForm.isActive,
        };
        await computerRoomService.update(editingRoomId, updatePayload, getAccessToken);
        notify.success('Cập nhật phòng máy thành công');
      } else {
        const createPayload: CreateComputerRoomRequest = {
          schoolId,
          ...sharedPayload,
        };
        await computerRoomService.create(createPayload, getAccessToken);
        notify.success('Tạo phòng máy thành công');
      }

      resetRoomForm(schoolId);
      await loadRoomManagerRows(schoolId);
      if (form.schoolId === schoolId) {
        await loadComputerRoomsForForm(schoolId);
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể lưu phòng máy');
    } finally {
      setRoomSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
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
  };

  const toggleScheduleSelection = (scheduleId: string) => {
    setSelectedScheduleIds((prev) => {
      if (prev.includes(scheduleId)) {
        return prev.filter((id) => id !== scheduleId);
      }
      return [...prev, scheduleId];
    });
  };

  const toggleSelectAllSchedules = () => {
    if (areAllSchedulesSelected) {
      setSelectedScheduleIds([]);
      return;
    }
    setSelectedScheduleIds(schedules.map((item) => item.id));
  };

  const handleDelete = async (item: ScheduleItem) => {
    const confirmed = window.confirm(`Xóa lịch "${item.subject} - ${item.className}"?`);
    if (!confirmed) return;
    try {
      await scheduleService.delete(item.id, getAccessToken);
      notify.success('Đã xóa lịch dạy');
      await loadSchedules();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể xóa lịch dạy');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedSchedules.length === 0) {
      notify.info('Vui lòng chọn ít nhất 1 lịch để xóa.');
      return;
    }

    const confirmed = window.confirm(`Xóa ${selectedSchedules.length} lịch đã chọn?`);
    if (!confirmed) return;

    const results = await Promise.allSettled(
      selectedSchedules.map((item) => scheduleService.delete(item.id, getAccessToken))
    );
    const deleted = results.filter((result) => result.status === 'fulfilled').length;
    const failed = results.length - deleted;

    if (deleted > 0) {
      notify.success(
        failed > 0 ? `Đã xóa ${deleted} lịch, lỗi ${failed} lịch.` : `Đã xóa ${deleted} lịch dạy.`
      );
      setSelectedScheduleIds([]);
      await loadSchedules();
      return;
    }

    notify.error('Không thể xóa các lịch đã chọn');
  };

  const shiftWeek = (offsetDays: number) => {
    const d = new Date(`${weekStart}T00:00:00`);
    d.setDate(d.getDate() + offsetDays);
    setWeekStart(toYmd(getWeekStart(d)));
  };

  const copySchedulesToNextWeek = async (sourceSchedules: ScheduleItem[], sourceLabel: string) => {
    if (copying) return;

    if (sourceSchedules.length === 0) {
      notify.info('Không có lịch phù hợp để sao chép.');
      return;
    }

    const confirmed = window.confirm(`Sao chép ${sourceSchedules.length} lịch ${sourceLabel} sang tuần sau?`);
    if (!confirmed) return;

    setCopying(true);
    try {
      const currentWeekDate = new Date(`${weekStart}T00:00:00`);
      const nextWeekDate = new Date(currentWeekDate);
      nextWeekDate.setDate(nextWeekDate.getDate() + 7);
      const nextWeekStart = toYmd(nextWeekDate);

      const nextWeekResponse = await scheduleService.getWeekSchedules(nextWeekStart, getAccessToken);
      const existingKeys = new Set(
        (nextWeekResponse.data || []).map((item) =>
          buildScheduleKey(
            parseApiDateToLocalYmd(item.date),
            item.className,
            item.subject,
            item.periodLabel,
            item.startTime,
            item.endTime,
            item.roomName,
            item.roomId
          )
        )
      );

      let created = 0;
      let skipped = 0;
      let failed = 0;

      for (const item of sourceSchedules) {
        const sourceDate = new Date(`${parseApiDateToLocalYmd(item.date)}T00:00:00`);
        sourceDate.setDate(sourceDate.getDate() + 7);
        const targetYmd = toYmd(sourceDate);

        const targetKey = buildScheduleKey(
          targetYmd,
          item.className,
          item.subject,
          item.periodLabel,
          item.startTime,
          item.endTime,
          item.roomName,
          item.roomId
        );

        if (existingKeys.has(targetKey)) {
          skipped++;
          continue;
        }

        try {
          await scheduleService.create(
            {
              schoolId: item.schoolId || undefined,
              classId: item.classId || undefined,
              className: item.className,
              subject: item.subject,
              roomName: item.roomName || undefined,
              roomId: item.roomId || undefined,
              periodLabel: item.periodLabel || undefined,
              date: targetYmd,
              startTime: item.startTime,
              endTime: item.endTime,
              notes: item.notes || undefined,
            },
            getAccessToken
          );
          existingKeys.add(targetKey);
          created++;
        } catch {
          failed++;
        }
      }

      if (created > 0) {
        setWeekStart(nextWeekStart);
      }

      if (created === 0 && skipped > 0 && failed === 0) {
        notify.info('Tuần sau đã có đủ lịch tương ứng, không tạo thêm lịch mới.');
        return;
      }

      const message = `Đã sao chép ${created} lịch${skipped > 0 ? `, bỏ qua ${skipped} lịch trùng` : ''}${failed > 0 ? `, lỗi ${failed} lịch` : ''
        }.`;
      if (failed > 0) {
        notify.warning(message);
      } else {
        notify.success(message);
      }
      setSelectedScheduleIds([]);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể sao chép lịch sang tuần sau');
    } finally {
      setCopying(false);
    }
  };

  const handleCopyToNextWeek = async () => {
    if (schedules.length === 0) {
      notify.info('Tuần hiện tại chưa có lịch để sao chép.');
      return;
    }
    await copySchedulesToNextWeek(schedules, 'trong tuần hiện tại');
  };

  const handleCopySelectedToNextWeek = async () => {
    if (selectedSchedules.length === 0) {
      notify.info('Vui lòng chọn ít nhất 1 lịch để sao chép.');
      return;
    }
    await copySchedulesToNextWeek(selectedSchedules, 'đã chọn');
  };

  const openAttendance = async (item: ScheduleItem) => {
    try {
      setAttendanceOpen(true);
      setAttendanceLoading(true);
      setAttendanceData(null);
      setAttendanceKeyword('');
      setAttendanceTab('attendance');
      console.log("fetching attendance for scheduleId", item.id);
      const response = await scheduleService.getAttendance(item.id, getAccessToken);
      console.log("attendance response", response);
      setAttendanceData(response);
      setAttendanceDraft(buildAttendanceDraft(response));
      setReportsDraft(buildReportsDraft(response, teacherDisplayName));
    } catch (error) {
      setAttendanceOpen(false);
      notify.error(error instanceof Error ? error.message : 'Không thể mở điểm danh');
    } finally {
      setAttendanceLoading(false);
    }
  };

  const closeAttendance = () => {
    if (attendanceSaving) return;
    setAttendanceOpen(false);
    setAttendanceData(null);
    setAttendanceDraft({});
    setReportsDraft(emptyReportsPayload());
    setAttendanceTab('attendance');
    setAttendanceKeyword('');
  };

  const toggleAttendanceStatus = (studentId: string) => {
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
  };

  const updateAttendanceNote = (studentId: string, note: string) => {
    setAttendanceDraft((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status ?? 'Present',
        note,
      },
    }));
  };

  const setAllAttendanceStatus = (status: AttendanceStatus) => {
    if (!attendanceData) return;

    setAttendanceDraft((prev) => {
      const next = { ...prev };
      attendanceData.students.forEach((student) => {
        next[student.studentId] = {
          status,
          note: prev[student.studentId]?.note ?? '',
        };
      });
      return next;
    });
  };

  const updateStartLessonReportField = (field: keyof ScheduleStartLessonReport, value: string) => {
    if (hasRoomSnapshot && startLessonRoomAutoFields.includes(field)) return;
    setReportsDraft((prev) => ({
      ...prev,
      startLesson: {
        ...prev.startLesson,
        [field]: value,
      },
    }));
  };

  const updateProfessionalReportField = (field: keyof ScheduleProfessionalReport, value: string) => {
    setReportsDraft((prev) => ({
      ...prev,
      professional: {
        ...prev.professional,
        [field]: value,
      },
    }));
  };

  const updateEndLessonReportField = (field: keyof ScheduleEndLessonReport, value: string) => {
    if (hasRoomSnapshot && endLessonRoomAutoFields.includes(field)) return;
    setReportsDraft((prev) => ({
      ...prev,
      endLesson: {
        ...prev.endLesson,
        [field]: value,
      },
    }));
  };

  const handleSaveAttendance = async () => {
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
        reportsDraft,
        getAccessToken
      );
      setAttendanceData(response);
      setAttendanceDraft(buildAttendanceDraft(response));
      setReportsDraft(buildReportsDraft(response, teacherDisplayName));
      notify.success('Đã lưu điểm danh và báo cáo');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể lưu điểm danh và báo cáo');
    } finally {
      setAttendanceSaving(false);
    }
  };

  const handleSyncAttendanceToGoogleSheet = async () => {
    if (!attendanceData) return;
    console.log("attendanceData", attendanceData);
    // return;
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
  };

  return (
    <div className="space-y-4">
      <section className="app-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <CalendarClock size={22} />
            </div>
            <div>
              <h2 className="app-section-title text-2xl">Lịch dạy trong tuần</h2>
              <p className="text-sm text-slate-500">
                Sắp xếp lớp, phòng học, tiết học, môn học theo từng tuần.
              </p>
            </div>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => shiftWeek(-7)}
              className="app-btn-secondary inline-flex items-center gap-1 px-3 py-2 text-sm"
            >
              <ChevronLeft size={16} />
              Tuần trước
            </button>

            <input
              type="date"
              value={weekStart}
              onChange={(event) => setWeekStart(toYmd(getWeekStart(new Date(`${event.target.value}T00:00:00`))))}
              className="px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={() => shiftWeek(7)}
              className="app-btn-secondary inline-flex items-center gap-1 px-3 py-2 text-sm"
            >
              Tuần sau
              <ChevronRight size={16} />
            </button>

            <button type="button" onClick={openCreate} className="app-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm">
              <Plus size={16} />
              Thêm lịch
            </button>

            <button
              type="button"
              onClick={openRoomManager}
              className="app-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm"
            >
              <Monitor size={15} />
              Quản lý phòng máy
            </button>

            <button
              type="button"
              onClick={handleCopyToNextWeek}
              disabled={copying || loading}
              className="app-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm"
            >
              <Copy size={15} />
              {copying ? 'Đang sao chép...' : 'Sao chép tuần sau'}
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-sm text-blue-800">
          Tuần đang xem: <strong>{formatDateViFromYmd(weekStart)}</strong> đến <strong>{formatDateViFromYmd(weekEnd)}</strong>
        </div>

        {selectedScheduleIds.length > 0 && (
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2 text-sm text-sky-900 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Đã chọn <strong>{selectedScheduleIds.length}</strong> lịch dạy
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  void handleCopySelectedToNextWeek();
                }}
                disabled={copying || loading}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Copy size={14} />
                {copying ? 'Đang sao chép...' : 'Sao chép đã chọn'}
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleDeleteSelected();
                }}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 size={14} />
                Xóa đã chọn
              </button>
              <button
                type="button"
                onClick={() => setSelectedScheduleIds([])}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Bỏ chọn
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <th className="w-12 px-3 py-3 text-center font-semibold">
                  <input
                    type="checkbox"
                    checked={areAllSchedulesSelected}
                    onChange={toggleSelectAllSchedules}
                    disabled={loading || schedules.length === 0}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    title="Chọn tất cả lịch trong tuần"
                  />
                </th>
                <th className="px-3 py-3 text-left font-semibold">Ngày</th>
                <th className="px-3 py-3 text-left font-semibold">Thứ</th>
                <th className="px-3 py-3 text-left font-semibold">Tiết</th>
                <th className="px-3 py-3 text-left font-semibold">Thời gian</th>
                <th className="px-3 py-3 text-left font-semibold">Môn học</th>
                <th className="px-3 py-3 text-left font-semibold">Lớp</th>
                <th className="px-3 py-3 text-left font-semibold">Trường</th>
                <th className="px-3 py-3 text-left font-semibold">Phòng</th>
                <th className="px-3 py-3 text-left font-semibold">Ghi chú</th>
                <th className="px-3 py-3 text-left font-semibold">Trạng thái</th>
                <th className="px-3 py-3 text-right font-semibold">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td className="px-3 py-6 text-center text-slate-500" colSpan={12}>
                    Đang tải lịch dạy...
                  </td>
                </tr>
              )}

              {!loading && schedules.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-slate-500" colSpan={12}>
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
                      onClick={() => {
                        void openAttendance(item);
                      }}
                      className={`cursor-pointer border-t border-slate-100 ${isSelected
                        ? 'bg-blue-50/75 hover:bg-blue-100/70'
                        : isToday
                          ? 'bg-amber-50/85 hover:bg-amber-100/70'
                          : 'hover:bg-slate-50/80'
                        }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => toggleScheduleSelection(item.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          title={`Chọn lịch ${item.subject} - ${item.className}`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span>{formatDateViFromYmd(localYmd)}</span>
                          {isToday ? (
                            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                              Hôm nay
                            </span>
                          ) : null}
                          {todayLessonTimeline === 'ongoing' ? (
                            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                              Đang dạy
                            </span>
                          ) : null}
                          {todayLessonTimeline === 'done' ? (
                            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                              Đã dạy
                            </span>
                          ) : null}
                          {todayLessonTimeline === 'upcoming' ? (
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700">
                              Sắp tới
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-3">{getWeekdayLabelFromYmd(localYmd)}</td>
                      <td className="px-3 py-3">{item.periodLabel || '-'}</td>
                      <td className="px-3 py-3">
                        {item.startTime} - {item.endTime}
                      </td>
                      <td className="px-3 py-3 font-semibold text-slate-800">{item.subject}</td>
                      <td className="px-3 py-3">{item.className}</td>
                      <td className="px-3 py-3 text-slate-700">
                        {resolveSchoolNameForSchedule(item) || <span className="text-slate-400">Chưa gán trường</span>}
                      </td>
                      <td className="px-3 py-3">{item.roomName || '-'}</td>
                      <td className="max-w-[260px] truncate px-3 py-3 text-slate-600">{item.notes || '-'}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                            }`}
                        >
                          {item.isActive ? 'Hoạt động' : 'Tạm ẩn'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void openAttendance(item);
                            }}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-emerald-700 hover:bg-emerald-100"
                            title="Điểm danh"
                          >
                            <ClipboardCheck size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openEdit(item);
                            }}
                            className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-blue-700 hover:bg-blue-100"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void handleDelete(item);
                            }}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-rose-700 hover:bg-rose-100"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
          Mẹo: bấm vào dòng lịch hoặc nút <span className="font-semibold text-emerald-700">Điểm danh</span> để mở điểm danh. Tick checkbox để chọn nhiều lịch rồi xóa/sao chép cùng lúc.
        </div>
      </section>

      {attendanceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] sm:grid sm:place-items-center sm:p-3">
          <div className="app-card flex h-[100dvh] w-full flex-col overflow-hidden rounded-none sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-2xl">
            <div
              className="shrink-0 border-b border-slate-200 bg-white px-4 py-3"
              style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Điểm danh học sinh</h3>
                  {attendanceData ? (
                    <p className="text-sm text-slate-600">
                      {attendanceData.subject} - {attendanceData.className} - {formatDateViFromYmd(parseApiDateToLocalYmd(attendanceData.date))}
                      {' · '}
                      {attendanceData.startTime} - {attendanceData.endTime}
                    </p>
                  ) : null}
                  {attendanceSchoolName ? (
                    <p className="text-xs font-medium text-blue-700">Trường: {attendanceSchoolName}</p>
                  ) : null}
                  {attendanceData?.computerRoom ? (
                    <p className="text-xs text-slate-600">
                      Phòng máy: <span className="font-semibold text-slate-800">{attendanceData.computerRoom.name}</span>
                      {' · '}
                      Tổng máy: <span className="font-semibold text-slate-800">{attendanceData.computerRoom.totalMachinesText}</span>
                      {' · '}
                      Máy lỗi: <span className="font-semibold text-slate-800">{attendanceData.computerRoom.brokenMachineCount}</span>
                      {' · '}
                      Thiếu cho HS:{' '}
                      <span className="font-semibold text-slate-800">
                        {attendanceMissingMachinesByFormula ?? attendanceData.computerRoom.missingMachinesForStudents}
                      </span>
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={closeAttendance}
                  className="app-btn-secondary px-3 py-1.5 text-sm"
                  disabled={attendanceSaving}
                >
                  Đóng
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {attendanceLoading && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-slate-600">
                  Đang tải danh sách học sinh...
                </div>
              )}

              {!attendanceLoading && attendanceData && (
                <>
                  <div className="grid gap-2 sm:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => setAttendanceTab('attendance')}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium ${attendanceTab === 'attendance'
                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <ClipboardCheck size={14} />
                      Điểm danh
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceTab('startLesson')}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium ${attendanceTab === 'startLesson'
                        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <FileText size={14} />
                      Báo cáo đầu buổi
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceTab('professional')}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium ${attendanceTab === 'professional'
                        ? 'border-violet-300 bg-violet-50 text-violet-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <BookOpen size={14} />
                      Báo cáo chuyên môn
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttendanceTab('endLesson')}
                      className={`inline-flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-medium ${attendanceTab === 'endLesson'
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      <ClipboardList size={14} />
                      Báo cáo cuối buổi
                    </button>
                  </div>

                  {attendanceTab === 'attendance' && (
                    <>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                          Có mặt: <strong>{attendanceStats.present}</strong>
                        </div>
                        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                          Vắng: <strong>{attendanceStats.absent}</strong>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                        <input
                          value={attendanceKeyword}
                          onChange={(event) => setAttendanceKeyword(event.target.value)}
                          placeholder="Tìm theo tên học sinh..."
                          className="w-full px-3 py-2 text-sm sm:max-w-xs"
                        />
                        <button
                          type="button"
                          onClick={toggleAttendanceNameSort}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:w-auto"
                          title="Sắp xếp theo tên"
                        >
                          Tên {attendanceNameSortDirection === 'asc' ? '▲' : attendanceNameSortDirection === 'desc' ? '▼' : '⇅'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setAllAttendanceStatus('Present')}
                          className="w-full rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 sm:w-auto"
                        >
                          <span className="inline-flex items-center gap-1">
                            <CheckCheck size={14} />
                            Tất cả có mặt
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAllAttendanceStatus('Absent')}
                          className="w-full rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100 sm:w-auto"
                        >
                          Tất cả vắng
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleSyncAttendanceToGoogleSheet()}
                          disabled={attendanceSyncing || attendanceSaving || attendanceLoading || !attendanceData || hasUnsavedAttendanceChanges}
                          title={hasUnsavedAttendanceChanges ? 'Lưu điểm danh trước khi đồng bộ Google Sheet' : 'Đồng bộ điểm danh đã lưu với Google Sheet'}
                          className={`w-full rounded-lg border px-3 py-2 text-sm font-medium sm:w-auto ${attendanceSyncing || attendanceSaving || attendanceLoading || !attendanceData || hasUnsavedAttendanceChanges
                            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                            : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <RefreshCw size={14} className={attendanceSyncing ? 'animate-spin' : ''} />
                            {attendanceSyncing ? 'Đang đồng bộ...' : 'Đồng bộ GG Sheet'}
                          </span>
                        </button>
                      </div>

                      <p className="text-xs text-slate-500">
                        Chạm vào nút trạng thái của từng học sinh để đổi nhanh giữa <strong>Có mặt</strong> và <strong>Vắng</strong>.
                      </p>

                      <div className="space-y-2 md:hidden">
                        {filteredAttendanceStudents.map((student, index) => {
                          const draft = attendanceDraft[student.studentId] ?? { status: 'Present' as AttendanceStatus, note: '' };
                          const isAbsent = draft.status === 'Absent';
                          return (
                            <article
                              key={student.studentId}
                              className={`rounded-xl border p-3 ${isAbsent ? 'border-rose-200 bg-rose-50/60' : 'border-emerald-200 bg-emerald-50/60'
                                }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs text-slate-500">#{index + 1}</p>
                                  <p className="font-semibold text-slate-900">
                                    {student.middleName} {student.firstName}
                                  </p>
                                  <p className="text-xs text-slate-500">Trạng thái học sinh: {student.studentStatus || '-'}</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleAttendanceStatus(student.studentId)}
                                  className={`min-w-[104px] rounded-lg px-3 py-2 text-sm font-semibold ${isAbsent
                                    ? 'border border-rose-300 bg-rose-100 text-rose-700'
                                    : 'border border-emerald-300 bg-emerald-100 text-emerald-700'
                                    }`}
                                >
                                  {isAbsent ? 'Vắng' : 'Có mặt'}
                                </button>
                              </div>

                              <input
                                value={draft.note}
                                onChange={(event) => updateAttendanceNote(student.studentId, event.target.value)}
                                className="mt-2 w-full px-3 py-2 text-sm"
                                placeholder="Ghi chú..."
                              />
                            </article>
                          );
                        })}

                        {filteredAttendanceStudents.length === 0 && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-8 text-center text-sm text-slate-500">
                            Không có học sinh phù hợp với từ khóa tìm kiếm.
                          </div>
                        )}
                      </div>

                      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
                        <table className="min-w-full text-sm">
                          <thead className="bg-slate-50 text-slate-700">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold">STT</th>
                              <th className="px-3 py-2 text-left font-semibold">
                                <button
                                  type="button"
                                  onClick={toggleAttendanceNameSort}
                                  className="inline-flex items-center gap-1 hover:text-slate-900"
                                  title="Sắp xếp theo tên"
                                >
                                  Họ và tên
                                  <span className="text-[10px] text-slate-400">
                                    {attendanceNameSortDirection === 'asc'
                                      ? '▲'
                                      : attendanceNameSortDirection === 'desc'
                                        ? '▼'
                                        : '⇅'}
                                  </span>
                                </button>
                              </th>
                              <th className="px-3 py-2 text-left font-semibold">Trạng thái</th>
                              <th className="px-3 py-2 text-left font-semibold">Ghi chú điểm danh</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredAttendanceStudents.map((student, index) => {
                              const draft = attendanceDraft[student.studentId] ?? { status: 'Present' as AttendanceStatus, note: '' };
                              const isAbsent = draft.status === 'Absent';
                              return (
                                <tr
                                  key={student.studentId}
                                  className={`border-t ${isAbsent ? 'border-rose-100 bg-rose-50/40' : 'border-slate-100'}`}
                                >
                                  <td className="px-3 py-2 text-slate-500">{index + 1}</td>
                                  <td className="px-3 py-2">
                                    <p className="font-medium text-slate-800">
                                      {student.middleName} {student.firstName}
                                    </p>
                                    <p className="text-xs text-slate-500">Trạng thái học sinh: {student.studentStatus || '-'}</p>
                                  </td>
                                  <td className="px-3 py-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleAttendanceStatus(student.studentId)}
                                      className={`min-w-[116px] rounded-lg px-3 py-2 text-sm font-semibold ${isAbsent
                                        ? 'border border-rose-300 bg-rose-100 text-rose-700'
                                        : 'border border-emerald-300 bg-emerald-100 text-emerald-700'
                                        }`}
                                    >
                                      {isAbsent ? 'Vắng' : 'Có mặt'}
                                    </button>
                                  </td>
                                  <td className="px-3 py-2">
                                    <input
                                      value={draft.note}
                                      onChange={(event) => updateAttendanceNote(student.studentId, event.target.value)}
                                      className="w-full min-w-[240px] px-2 py-1.5 text-sm"
                                      placeholder="Ghi chú..."
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                            {filteredAttendanceStudents.length === 0 && (
                              <tr>
                                <td colSpan={4} className="px-3 py-8 text-center text-slate-500">
                                  Không có học sinh phù hợp với từ khóa tìm kiếm.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {attendanceTab === 'startLesson' && (
                    <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                      <h4 className="font-semibold text-emerald-800">BÁO CÁO ĐẦU BUỔI DẠY</h4>
                      {hasRoomSnapshot && (
                        <p className="text-xs text-emerald-700">
                          Các trường liên quan phòng máy được tự động lấy từ cấu hình phòng máy trong database.
                        </p>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1 text-sm">
                          <span>Tên giáo viên</span>
                          <input value={reportsDraft.startLesson.teacherName} onChange={(e) => updateStartLessonReportField('teacherName', e.target.value)} className="px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tên trợ giảng</span>
                          <input value={reportsDraft.startLesson.assistantName} onChange={(e) => updateStartLessonReportField('assistantName', e.target.value)} className="px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Phòng máy</span>
                          <input value={reportsDraft.startLesson.roomName} onChange={(e) => updateStartLessonReportField('roomName', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tổng số máy</span>
                          <input value={reportsDraft.startLesson.totalMachines} onChange={(e) => updateStartLessonReportField('totalMachines', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm sm:col-span-2">
                          <span>Tổng số máy lỗi (mô tả)</span>
                          <input value={reportsDraft.startLesson.brokenMachinesSummary} onChange={(e) => updateStartLessonReportField('brokenMachinesSummary', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Số máy thiếu cho học sinh</span>
                          <input value={reportsDraft.startLesson.missingMachinesForStudents} onChange={(e) => updateStartLessonReportField('missingMachinesForStudents', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tình trạng NetSupport</span>
                          <input value={reportsDraft.startLesson.netSupportStatus} onChange={(e) => updateStartLessonReportField('netSupportStatus', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tình trạng loa, âm ly</span>
                          <input value={reportsDraft.startLesson.audioStatus} onChange={(e) => updateStartLessonReportField('audioStatus', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tình trạng máy lạnh, quạt</span>
                          <input value={reportsDraft.startLesson.coolingStatus} onChange={(e) => updateStartLessonReportField('coolingStatus', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm sm:col-span-2">
                          <span>Tình trạng vệ sinh phòng máy</span>
                          <input value={reportsDraft.startLesson.hygieneStatus} onChange={(e) => updateStartLessonReportField('hygieneStatus', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                      </div>
                    </div>
                  )}

                  {attendanceTab === 'professional' && (
                    <div className="space-y-3 rounded-xl border border-violet-200 bg-violet-50/40 p-4">
                      <h4 className="font-semibold text-violet-800">BÁO CÁO CHUYÊN MÔN</h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1 text-sm">
                          <span>Tên giáo viên</span>
                          <input value={reportsDraft.professional.teacherName} onChange={(e) => updateProfessionalReportField('teacherName', e.target.value)} className="px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Lớp</span>
                          <input value={reportsDraft.professional.className} onChange={(e) => updateProfessionalReportField('className', e.target.value)} className="px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Môn</span>
                          <input value={reportsDraft.professional.subjectName} onChange={(e) => updateProfessionalReportField('subjectName', e.target.value)} className="px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tài liệu dạy</span>
                          <input value={reportsDraft.professional.teachingMaterials} onChange={(e) => updateProfessionalReportField('teachingMaterials', e.target.value)} className="px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm sm:col-span-2">
                          <span>Nội dung dạy</span>
                          <textarea value={reportsDraft.professional.teachingContent} onChange={(e) => updateProfessionalReportField('teachingContent', e.target.value)} className="min-h-[78px] px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Số tiết dự kiến</span>
                          <input value={reportsDraft.professional.plannedLessons} onChange={(e) => updateProfessionalReportField('plannedLessons', e.target.value)} className="px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Số tiết đã dạy</span>
                          <input value={reportsDraft.professional.taughtLessons} onChange={(e) => updateProfessionalReportField('taughtLessons', e.target.value)} className="px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Số lần hoàn thành OTTH</span>
                          <input value={reportsDraft.professional.ongoingPracticeCompletions} onChange={(e) => updateProfessionalReportField('ongoingPracticeCompletions', e.target.value)} className="px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tỷ lệ kết quả Gmetrix</span>
                          <input value={reportsDraft.professional.gmetrixResultRate} onChange={(e) => updateProfessionalReportField('gmetrixResultRate', e.target.value)} className="px-3 py-2" />
                        </label>
                      </div>
                    </div>
                  )}

                  {attendanceTab === 'endLesson' && (
                    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                      <h4 className="font-semibold text-amber-800">BÁO CÁO CUỐI BUỔI DẠY</h4>
                      {hasRoomSnapshot && (
                        <p className="text-xs text-amber-700">
                          Các trường liên quan phòng máy được tự động lấy từ cấu hình phòng máy trong database.
                        </p>
                      )}
                      <div className="rounded-lg border border-amber-200 bg-amber-100/60 px-3 py-2 text-xs text-amber-800">
                        {attendanceData.roomSessionContext?.isSharedRoomSession
                          ? `Đang là báo cáo cuối buổi dùng chung cho ${attendanceData.roomSessionContext.sharedClasses.length} lớp cùng phòng (${attendanceData.roomSessionContext.sessionLabel.toLowerCase()}).`
                          : 'Chỉ có 1 lớp trong cùng phòng/buổi nên báo cáo cuối buổi áp dụng cho lịch hiện tại.'}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="grid gap-1 text-sm">
                          <span>Tên giáo viên</span>
                          <input value={reportsDraft.endLesson.teacherName} onChange={(e) => updateEndLessonReportField('teacherName', e.target.value)} className="px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tên trợ giảng</span>
                          <input value={reportsDraft.endLesson.assistantName} onChange={(e) => updateEndLessonReportField('assistantName', e.target.value)} className="px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Phòng máy</span>
                          <input value={reportsDraft.endLesson.roomName} onChange={(e) => updateEndLessonReportField('roomName', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tổng số máy</span>
                          <input value={reportsDraft.endLesson.totalMachines} onChange={(e) => updateEndLessonReportField('totalMachines', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm sm:col-span-2">
                          <span>Số lượng học sinh các lớp cùng phòng</span>
                          <input value={reportsDraft.endLesson.classStudentCountSummary} onChange={(e) => updateEndLessonReportField('classStudentCountSummary', e.target.value)} className="px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tỷ lệ học sinh có tài liệu</span>
                          <input value={reportsDraft.endLesson.studentMaterialCoverageRate} onChange={(e) => updateEndLessonReportField('studentMaterialCoverageRate', e.target.value)} className="px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tổng số máy lỗi (mô tả)</span>
                          <input value={reportsDraft.endLesson.brokenMachinesSummary} onChange={(e) => updateEndLessonReportField('brokenMachinesSummary', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tình trạng NetSupport</span>
                          <input value={reportsDraft.endLesson.netSupportStatus} onChange={(e) => updateEndLessonReportField('netSupportStatus', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tình trạng loa, âm ly</span>
                          <input value={reportsDraft.endLesson.audioStatus} onChange={(e) => updateEndLessonReportField('audioStatus', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tình trạng máy lạnh, quạt</span>
                          <input value={reportsDraft.endLesson.coolingStatus} onChange={(e) => updateEndLessonReportField('coolingStatus', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Đã tắt các thiết bị điện</span>
                          <input value={reportsDraft.endLesson.devicesPoweredOffStatus} onChange={(e) => updateEndLessonReportField('devicesPoweredOffStatus', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>HS sắp xếp ghế ngồi</span>
                          <input value={reportsDraft.endLesson.seatingOrderStatus} onChange={(e) => updateEndLessonReportField('seatingOrderStatus', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>HS vệ sinh phòng máy</span>
                          <input value={reportsDraft.endLesson.roomHygieneStatus} onChange={(e) => updateEndLessonReportField('roomHygieneStatus', e.target.value)} className="px-3 py-2" disabled={hasRoomSnapshot} />
                        </label>
                        <label className="grid gap-1 text-sm">
                          <span>Tuân thủ nội quy của HS</span>
                          <input value={reportsDraft.endLesson.studentRuleComplianceStatus} onChange={(e) => updateEndLessonReportField('studentRuleComplianceStatus', e.target.value)} className="px-3 py-2" />
                        </label>
                        <label className="grid gap-1 text-sm sm:col-span-2">
                          <span>Danh sách vi phạm</span>
                          <textarea value={reportsDraft.endLesson.violationListSummary} onChange={(e) => updateEndLessonReportField('violationListSummary', e.target.value)} className="min-h-[78px] px-3 py-2" />
                        </label>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div
              className="shrink-0 border-t border-slate-200 bg-white px-4 py-3"
              style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
            >
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeAttendance}
                  className="app-btn-secondary w-full px-4 py-2 text-sm sm:w-auto"
                  disabled={attendanceSaving}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => void handleSaveAttendance()}
                  className="app-btn-primary w-full px-4 py-2 text-sm sm:w-auto"
                  disabled={attendanceSaving || attendanceLoading || !attendanceData}
                >
                  {attendanceSaving ? 'Đang lưu...' : 'Lưu điểm danh & báo cáo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {roomManagerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm sm:grid sm:place-items-center sm:p-4">
          <div className="app-card flex h-[100dvh] w-full flex-col overflow-hidden rounded-none sm:h-auto sm:max-h-[94vh] sm:max-w-7xl sm:rounded-[28px]">
            <div
              className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(147,197,253,0.28),_transparent_35%),linear-gradient(135deg,_#f8fbff,_#eef4ff_55%,_#f8fafc)] px-4 py-4 sm:px-5"
              style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top))' }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25">
                    <Monitor size={22} />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900">Quản lý phòng máy</h3>
                      <p className="text-sm text-slate-600">
                        Cấu hình phòng máy theo từng trường để dùng cho lịch dạy, điểm danh và báo cáo.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs font-medium">
                      <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-blue-700">
                        <Building2 size={13} />
                        {selectedRoomManagerSchool?.name || 'Chưa chọn trường'}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
                        {roomManagerSummary.totalRooms} phòng
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-emerald-700">
                        {roomManagerSummary.activeRooms} đang hoạt động
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRoomManagerOpen(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:border-slate-300 hover:bg-white hover:text-slate-900"
                >
                  <X size={16} />
                  Đóng
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,_rgba(248,250,252,0.92),_rgba(255,255,255,1))] p-4 sm:p-5">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_420px]">
                <div className="space-y-2">
                  <div className="app-card-soft p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="flex-1">
                        <label className="grid gap-1.5 text-sm">
                          <span className="font-semibold text-slate-700">Trường áp dụng</span>
                          <select
                            value={roomManagerSchoolId}
                            onChange={(event) => {
                              const nextSchoolId = event.target.value;
                              setRoomManagerSchoolId(nextSchoolId);
                              resetRoomForm(nextSchoolId);
                            }}
                            className="min-w-[260px] bg-white px-3 py-2.5"
                          >
                            <option value="">-- Chọn trường --</option>
                            {schools.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => resetRoomForm(roomManagerSchoolId)}
                        className="app-btn-secondary inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm"
                      >
                        <Plus size={15} />
                        Tạo phòng mới
                      </button>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl border border-white/70 bg-white/90 p-3 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Tổng phòng
                        </div>
                        <div className="mt-2 text-2xl font-extrabold text-slate-900">
                          {roomManagerSummary.totalRooms}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                          Máy sẵn sàng
                        </div>
                        <div className="mt-2 text-2xl font-extrabold text-emerald-700">
                          {roomManagerSummary.availableMachines}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-3 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                          Tổng thiết bị
                        </div>
                        <div className="mt-2 text-2xl font-extrabold text-blue-700">
                          {roomManagerSummary.totalMachines}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="app-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">Danh sách phòng máy</h4>
                        <p className="text-sm text-slate-500">
                          Chọn một phòng để chỉnh sửa nhanh cấu hình và trạng thái vận hành.
                        </p>
                      </div>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                        {roomManagerRows.length} mục
                      </span>
                    </div>
                    <div className="max-h-[58vh] overflow-y-auto bg-white p-3 sm:p-4">
                      {roomManagerLoading && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                          Đang tải phòng máy...
                        </div>
                      )}

                      {!roomManagerLoading && roomManagerRows.length === 0 && (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                          Chưa có phòng máy nào trong trường này.
                        </div>
                      )}

                      {!roomManagerLoading && roomManagerRows.length > 0 && (
                        <div className="space-y-3">
                          {roomManagerRows.map((room) => (
                            <article
                              key={room.id}
                              className={`rounded-2xl border p-4 shadow-sm transition ${editingRoomId === room.id
                                ? 'border-blue-300 bg-blue-50/70 shadow-blue-100'
                                : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-md'
                                }`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <h5 className="text-lg font-bold text-slate-900">{room.name}</h5>
                                    <span
                                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${room.isActive
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-slate-200 text-slate-600'
                                        }`}
                                    >
                                      {room.isActive ? 'Đang dùng' : 'Tạm ẩn'}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-sm text-slate-500">
                                    Tổng {room.totalMachinesText} · Máy lỗi {room.brokenMachineCount} · Dùng được{' '}
                                    {room.availableStudentMachines}
                                  </p>
                                </div>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleEditRoom(room)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                                  >
                                    <Pencil size={13} />
                                    Sửa
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void handleDeleteRoom(room)}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                                  >
                                    <Trash2 size={13} />
                                    Xóa
                                  </button>
                                </div>
                              </div>

                              <div className="mt-4 grid gap-2 sm:grid-cols-4">
                                <div className="rounded-xl bg-slate-50 px-3 py-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Máy HS
                                  </div>
                                  <div className="mt-1 text-base font-bold text-slate-800">
                                    {room.studentMachineCount}
                                  </div>
                                </div>
                                <div className="rounded-xl bg-slate-50 px-3 py-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Máy GV
                                  </div>
                                  <div className="mt-1 text-base font-bold text-slate-800">
                                    {room.teacherMachineCount}
                                  </div>
                                </div>
                                <div className="rounded-xl bg-slate-50 px-3 py-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Khả dụng
                                  </div>
                                  <div className="mt-1 text-base font-bold text-emerald-700">
                                    {room.availableStudentMachines}
                                  </div>
                                </div>
                                <div className="rounded-xl bg-slate-50 px-3 py-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                                    Máy lỗi
                                  </div>
                                  <div className="mt-1 text-base font-bold text-rose-600">
                                    {room.brokenMachineCount}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap gap-2">
                                {[
                                  { label: 'NetSupport', value: room.netSupportStatus },
                                  { label: 'Âm thanh', value: room.audioStatus },
                                  { label: 'Làm mát', value: room.coolingStatus },
                                  { label: 'Vệ sinh', value: room.roomHygieneStatus },
                                ].map((item) => (
                                  <span
                                    key={`${room.id}-${item.label}`}
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${getRoomConditionTone(item.value)}`}
                                  >
                                    {item.label}: {item.value || 'Chưa cập nhật'}
                                  </span>
                                ))}
                              </div>

                              <p className="mt-3 text-xs text-slate-500">
                                Tắt điện: {room.devicesPoweredOffStatus || 'Chưa cập nhật'} · Xếp ghế:{' '}
                                {room.seatingOrderStatus || 'Chưa cập nhật'}
                              </p>
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveRoom} className="app-card flex min-h-[640px] flex-col overflow-hidden">
                  <div className="border-b border-slate-200 bg-slate-50/90 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          {editingRoomId ? 'Chỉnh sửa phòng máy' : 'Tạo phòng máy mới'}
                        </h4>
                        <p className="mt-1 text-sm text-slate-500">
                          {editingRoomId
                            ? 'Cập nhật nhanh cấu hình và tình trạng vận hành của phòng đang chọn.'
                            : 'Khai báo một phòng máy chuẩn để dùng xuyên suốt cho lịch dạy và báo cáo.'}
                        </p>
                      </div>
                      {editingRoomId && (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          Đang sửa
                        </span>
                      )}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
                          Tổng máy dự kiến
                        </div>
                        <div className="mt-2 text-2xl font-extrabold text-blue-700">
                          {roomFormMachinePreview.totalMachines}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-3">
                        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">
                          Máy dùng được
                        </div>
                        <div className="mt-2 text-2xl font-extrabold text-emerald-700">
                          {roomFormMachinePreview.availableMachines}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-white p-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <label className="grid gap-1.5 text-sm">
                        <span className="font-semibold text-slate-700">Tên phòng máy *</span>
                        <input
                          value={roomForm.name}
                          onChange={(event) =>
                            setRoomForm((prev) => ({ ...prev, name: event.target.value }))
                          }
                          placeholder="Ví dụ: PM 01 hoặc Phòng máy A"
                          className="bg-white px-3 py-2.5"
                          required
                        />
                      </label>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Wrench size={16} className="text-slate-500" />
                        <h5 className="text-sm font-bold text-slate-800">Cấu hình thiết bị</h5>
                      </div>
                      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(108px,1fr))]">
                        <label className="grid min-w-0 gap-1.5 text-sm">
                          <span className="font-medium leading-snug text-slate-700">Số máy HS</span>
                          <input
                            type="number"
                            min={0}
                            value={roomForm.studentMachineCount}
                            onChange={(event) =>
                              setRoomForm((prev) => ({
                                ...prev,
                                studentMachineCount: event.target.value,
                              }))
                            }
                            className="w-full bg-white px-3 py-2.5"
                            required
                          />
                        </label>
                        <label className="grid min-w-0 gap-1.5 text-sm">
                          <span className="font-medium leading-snug text-slate-700">Số máy GV</span>
                          <input
                            type="number"
                            min={0}
                            value={roomForm.teacherMachineCount}
                            onChange={(event) =>
                              setRoomForm((prev) => ({
                                ...prev,
                                teacherMachineCount: event.target.value,
                              }))
                            }
                            className="w-full bg-white px-3 py-2.5"
                            required
                          />
                        </label>
                        <label className="grid min-w-0 gap-1.5 text-sm">
                          <span className="font-medium leading-snug text-slate-700">Máy lỗi</span>
                          <input
                            type="number"
                            min={0}
                            value={roomForm.brokenMachineCount}
                            onChange={(event) =>
                              setRoomForm((prev) => ({
                                ...prev,
                                brokenMachineCount: event.target.value,
                              }))
                            }
                            className="w-full bg-white px-3 py-2.5"
                            required
                          />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Sparkles size={16} className="text-slate-500" />
                        <h5 className="text-sm font-bold text-slate-800">Tình trạng trước giờ học</h5>
                      </div>
                      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
                        <label className="grid min-w-0 gap-1.5 text-sm">
                          <span className="flex items-start gap-1.5 font-medium leading-snug text-slate-700">
                            <Monitor size={14} className="mt-0.5 shrink-0 text-slate-400" />
                            <span className="min-w-0">Tình trạng NetSupport</span>
                          </span>
                          <input
                            value={roomForm.netSupportStatus}
                            onChange={(event) =>
                              setRoomForm((prev) => ({
                                ...prev,
                                netSupportStatus: event.target.value,
                              }))
                            }
                            className="w-full bg-white px-3 py-2.5"
                          />
                        </label>
                        <label className="grid min-w-0 gap-1.5 text-sm">
                          <span className="flex items-start gap-1.5 font-medium leading-snug text-slate-700">
                            <Volume2 size={14} className="mt-0.5 shrink-0 text-slate-400" />
                            <span className="min-w-0">Tình trạng loa, âm ly</span>
                          </span>
                          <input
                            value={roomForm.audioStatus}
                            onChange={(event) =>
                              setRoomForm((prev) => ({ ...prev, audioStatus: event.target.value }))
                            }
                            className="w-full bg-white px-3 py-2.5"
                          />
                        </label>
                        <label className="grid min-w-0 gap-1.5 text-sm">
                          <span className="flex items-start gap-1.5 font-medium leading-snug text-slate-700">
                            <Wind size={14} className="mt-0.5 shrink-0 text-slate-400" />
                            <span className="min-w-0">Tình trạng máy lạnh, quạt</span>
                          </span>
                          <input
                            value={roomForm.coolingStatus}
                            onChange={(event) =>
                              setRoomForm((prev) => ({
                                ...prev,
                                coolingStatus: event.target.value,
                              }))
                            }
                            className="w-full bg-white px-3 py-2.5"
                          />
                        </label>
                        <label className="grid min-w-0 gap-1.5 text-sm">
                          <span className="font-medium leading-snug text-slate-700">HS vệ sinh phòng máy</span>
                          <input
                            value={roomForm.roomHygieneStatus}
                            onChange={(event) =>
                              setRoomForm((prev) => ({
                                ...prev,
                                roomHygieneStatus: event.target.value,
                              }))
                            }
                            className="w-full bg-white px-3 py-2.5"
                          />
                        </label>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                      <div className="mb-3 flex items-center gap-2">
                        <Power size={16} className="text-slate-500" />
                        <h5 className="text-sm font-bold text-slate-800">Tình trạng sau giờ học</h5>
                      </div>
                      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
                        <label className="grid min-w-0 gap-1.5 text-sm">
                          <span className="font-medium leading-snug text-slate-700">Đã tắt thiết bị điện</span>
                          <input
                            value={roomForm.devicesPoweredOffStatus}
                            onChange={(event) =>
                              setRoomForm((prev) => ({
                                ...prev,
                                devicesPoweredOffStatus: event.target.value,
                              }))
                            }
                            className="w-full bg-white px-3 py-2.5"
                          />
                        </label>
                        <label className="grid min-w-0 gap-1.5 text-sm">
                          <span className="font-medium leading-snug text-slate-700">HS xếp ghế gọn gàng</span>
                          <input
                            value={roomForm.seatingOrderStatus}
                            onChange={(event) =>
                              setRoomForm((prev) => ({
                                ...prev,
                                seatingOrderStatus: event.target.value,
                              }))
                            }
                            className="w-full bg-white px-3 py-2.5"
                          />
                        </label>
                      </div>
                    </div>

                    {editingRoomId && (
                      <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={roomForm.isActive}
                          onChange={(event) =>
                            setRoomForm((prev) => ({ ...prev, isActive: event.target.checked }))
                          }
                        />
                        Phòng đang hoạt động
                      </label>
                    )}
                  </div>

                  <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      {editingRoomId && (
                        <button
                          type="button"
                          onClick={() => resetRoomForm(roomManagerSchoolId)}
                          className="app-btn-secondary px-4 py-2 text-sm"
                        >
                          Hủy sửa
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={roomSubmitting}
                        className="app-btn-primary inline-flex items-center justify-center gap-2 px-4 py-2 text-sm"
                      >
                        {roomSubmitting ? (
                          'Đang lưu...'
                        ) : editingRoomId ? (
                          <>
                            <Pencil size={15} />
                            Lưu phòng máy
                          </>
                        ) : (
                          <>
                            <Plus size={15} />
                            Tạo phòng máy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            <div
              className="shrink-0 border-t border-slate-200 bg-white px-4 py-3"
              style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
            >
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setRoomManagerOpen(false)}
                  className="app-btn-secondary px-4 py-2 text-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/45 backdrop-blur-[1px] sm:grid sm:place-items-center sm:p-3">
          <div className="app-card flex h-[100dvh] w-full flex-col overflow-hidden rounded-none sm:h-auto sm:max-h-[92vh] sm:max-w-3xl sm:rounded-2xl">
            <div
              className="border-b border-slate-200 px-4 py-3"
              style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}
            >
              <h3 className="text-lg font-bold text-slate-900">
                {editing ? 'Chỉnh sửa lịch dạy' : 'Tạo lịch dạy mới'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-slate-700">Trường *</span>
                    <select
                      value={form.schoolId}
                      onChange={(event) => {
                        const nextSchoolId = event.target.value;
                        setForm((prev) => ({
                          ...prev,
                          schoolId: nextSchoolId,
                          classId: '',
                          className: '',
                          roomId: '',
                          roomName: '',
                        }));
                      }}
                      className="px-3 py-2"
                      required
                    >
                      <option value="">-- Chọn trường --</option>
                      {schools.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-slate-700">Lớp có sẵn</span>
                    <select
                      value={form.classId}
                      disabled={!form.schoolId}
                      onChange={(event) => {
                        const nextClassId = event.target.value;
                        const selectedClass = classesBySelectedSchool.find(
                          (item) => item.id === nextClassId
                        );
                        setForm((prev) => ({
                          ...prev,
                          schoolId: selectedClass?.schoolId || prev.schoolId,
                          classId: nextClassId,
                          className: selectedClass?.name || prev.className,
                        }));
                      }}
                      className="px-3 py-2"
                    >
                      <option value="">-- Chọn lớp --</option>
                      {classesBySelectedSchool.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-slate-700">Tên lớp hiển thị *</span>
                    <input
                      value={form.className}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, className: event.target.value }))
                      }
                      placeholder="Ví dụ: 11A11"
                      className="px-3 py-2"
                      required
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-slate-700">Môn học *</span>
                    <input
                      value={form.subject}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, subject: event.target.value }))
                      }
                      placeholder="Ví dụ: Tin học"
                      className="px-3 py-2"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-slate-700">Phòng máy đã cấu hình</span>
                    <select
                      value={form.roomId}
                      disabled={!form.schoolId || computerRoomsLoading}
                      onChange={(event) => {
                        const nextRoomId = event.target.value;
                        const selectedRoom = computerRooms.find((room) => room.id === nextRoomId);
                        setForm((prev) => ({
                          ...prev,
                          roomId: nextRoomId,
                          roomName: selectedRoom?.name || prev.roomName,
                        }));
                      }}
                      className="px-3 py-2"
                    >
                      <option value="">-- Chọn phòng --</option>
                      {computerRooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.name} ({room.totalMachinesText}, lỗi: {room.brokenMachineCount})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-slate-700">Phòng học / phòng máy</span>
                    <input
                      value={form.roomName}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, roomName: event.target.value, roomId: '' }))
                      }
                      placeholder={form.roomId ? 'Đã lấy theo phòng đã chọn' : 'Ví dụ: P.Máy 03'}
                      className="px-3 py-2"
                      disabled={Boolean(form.roomId)}
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-slate-700">Tiết mấy</span>
                    <input
                      value={form.periodLabel}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, periodLabel: event.target.value }))
                      }
                      placeholder="Ví dụ: Tiết 1-2"
                      className="px-3 py-2"
                    />
                  </label>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-slate-700">Ngày dạy *</span>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
                      className="px-3 py-2"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-slate-700">Giờ bắt đầu *</span>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, startTime: event.target.value }))
                      }
                      className="px-3 py-2"
                      required
                    />
                  </label>
                  <label className="grid gap-1 text-sm">
                    <span className="font-semibold text-slate-700">Giờ kết thúc *</span>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, endTime: event.target.value }))
                      }
                      className="px-3 py-2"
                      required
                    />
                  </label>
                </div>

                <label className="grid gap-1 text-sm">
                  <span className="font-semibold text-slate-700">Ghi chú</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
                    className="min-h-[80px] px-3 py-2"
                    placeholder="Ghi chú thêm..."
                  />
                </label>

                {editing && (
                  <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                      }
                    />
                    Lịch đang hoạt động
                  </label>
                )}
              </div>

              <div
                className="shrink-0 border-t border-slate-200 bg-white px-4 py-3"
                style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
              >
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="app-btn-secondary px-4 py-2 text-sm"
                  >
                    Hủy
                  </button>
                  <button type="submit" className="app-btn-primary px-4 py-2 text-sm">
                    {editing ? 'Lưu cập nhật' : 'Tạo lịch'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;
