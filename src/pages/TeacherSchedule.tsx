import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarClock, CheckCheck, ClipboardCheck, ChevronLeft, ChevronRight, Copy, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { classService } from '../services/class.service';
import { schoolService } from '../services/school.service';
import { scheduleService } from '../services/schedule.service';
import type { Class } from '../types/class.types';
import type { School } from '../types/school.types';
import type {
  AttendanceStatus,
  SaveScheduleAttendanceItem,
  ScheduleAttendanceResponse,
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
  periodLabel: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  isActive: boolean;
}

interface AttendanceDraftState {
  status: AttendanceStatus;
  note: string;
}

const weekdayLabels: Record<number, string> = {
  0: 'CN',
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
};

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

const createDefaultForm = (weekStart: string): ScheduleFormState => ({
  schoolId: '',
  classId: '',
  className: '',
  subject: '',
  roomName: '',
  periodLabel: '',
  date: weekStart,
  startTime: '07:00',
  endTime: '07:45',
  notes: '',
  isActive: true,
});

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
  roomName?: string
): string => {
  return [
    dateYmd,
    className.trim().toLowerCase(),
    subject.trim().toLowerCase(),
    (periodLabel || '').trim().toLowerCase(),
    (startTime || '').trim(),
    (endTime || '').trim(),
    (roomName || '').trim().toLowerCase(),
  ].join('|');
};

const TeacherSchedule = () => {
  const { getAccessToken } = useAuth();
  const todayYmd = toYmd(new Date());
  const [weekStart, setWeekStart] = useState<string>(toYmd(getWeekStart(new Date())));
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleItem | null>(null);
  const [form, setForm] = useState<ScheduleFormState>(createDefaultForm(weekStart));
  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const [attendanceData, setAttendanceData] = useState<ScheduleAttendanceResponse | null>(null);
  const [attendanceDraft, setAttendanceDraft] = useState<Record<string, AttendanceDraftState>>({});
  const [attendanceKeyword, setAttendanceKeyword] = useState('');

  const weekEnd = useMemo(() => {
    const start = new Date(`${weekStart}T00:00:00`);
    start.setDate(start.getDate() + 6);
    return toYmd(start);
  }, [weekStart]);

  const classesBySelectedSchool = useMemo(() => {
    if (!form.schoolId) return [];
    return classes.filter((item) => item.schoolId === form.schoolId && item.isActive);
  }, [classes, form.schoolId]);

  const schoolNameById = useMemo(() => {
    return new Map(schools.map((item) => [item.id, item.name]));
  }, [schools]);

  const classById = useMemo(() => {
    return new Map(classes.map((item) => [item.id, item]));
  }, [classes]);

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
    if (!keyword) return attendanceData.students;

    return attendanceData.students.filter((student) => {
      const fullName = `${student.middleName} ${student.firstName}`.toLowerCase();
      return fullName.split(/\s+/).includes(keyword) || fullName.startsWith(keyword);
    });
  }, [attendanceData, attendanceKeyword]);

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
    if (!formOpen || editing || form.schoolId || schools.length !== 1) return;
    setForm((prev) => ({ ...prev, schoolId: schools[0].id }));
  }, [editing, form.schoolId, formOpen, schools]);

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
      periodLabel: item.periodLabel || '',
      date: parseApiDateToLocalYmd(item.date),
      startTime: item.startTime,
      endTime: item.endTime,
      notes: item.notes || '',
      isActive: item.isActive,
    });
    setFormOpen(true);
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

    const payload: UpdateScheduleRequest = {
      schoolId: form.schoolId,
      classId: form.classId || undefined,
      className: form.className.trim(),
      subject: form.subject.trim(),
      roomName: form.roomName.trim() || undefined,
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

  const shiftWeek = (offsetDays: number) => {
    const d = new Date(`${weekStart}T00:00:00`);
    d.setDate(d.getDate() + offsetDays);
    setWeekStart(toYmd(getWeekStart(d)));
  };

  const handleCopyToNextWeek = async () => {
    if (copying) return;

    if (schedules.length === 0) {
      notify.info('Tuần hiện tại chưa có lịch để sao chép.');
      return;
    }

    const confirmed = window.confirm(`Sao chép ${schedules.length} lịch hiện tại sang tuần sau?`);
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
            item.roomName
          )
        )
      );

      let created = 0;
      let skipped = 0;
      let failed = 0;

      for (const item of schedules) {
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
          item.roomName
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

      const message = `Đã sao chép ${created} lịch${skipped > 0 ? `, bỏ qua ${skipped} lịch trùng` : ''}${
        failed > 0 ? `, lỗi ${failed} lịch` : ''
      }.`;
      if (failed > 0) {
        notify.warning(message);
      } else {
        notify.success(message);
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể sao chép lịch sang tuần sau');
    } finally {
      setCopying(false);
    }
  };

  const openAttendance = async (item: ScheduleItem) => {
    try {
      setAttendanceOpen(true);
      setAttendanceLoading(true);
      setAttendanceData(null);
      setAttendanceKeyword('');

      const response = await scheduleService.getAttendance(item.id, getAccessToken);
      setAttendanceData(response);
      setAttendanceDraft(buildAttendanceDraft(response));
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

  const handleSaveAttendance = async () => {
    if (!attendanceData) return;

    try {
      setAttendanceSaving(true);
      const payload: SaveScheduleAttendanceItem[] = attendanceData.students.map((student) => ({
        studentId: student.studentId,
        status: attendanceDraft[student.studentId]?.status ?? 'Present',
        note: attendanceDraft[student.studentId]?.note?.trim() || undefined,
      }));

      const response = await scheduleService.saveAttendance(attendanceData.scheduleId, payload, getAccessToken);
      setAttendanceData(response);
      setAttendanceDraft(buildAttendanceDraft(response));
      notify.success('Lưu điểm danh thành công');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không thể lưu điểm danh');
    } finally {
      setAttendanceSaving(false);
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
      </section>

      <section className="app-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
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
                  <td className="px-3 py-6 text-center text-slate-500" colSpan={11}>
                    Đang tải lịch dạy...
                  </td>
                </tr>
              )}

              {!loading && schedules.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-slate-500" colSpan={11}>
                    Tuần này chưa có lịch dạy.
                  </td>
                </tr>
              )}

              {!loading &&
                schedules.map((item) => {
                  const localYmd = parseApiDateToLocalYmd(item.date);
                  const isToday = localYmd === todayYmd;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => {
                        void openAttendance(item);
                      }}
                      className={`cursor-pointer border-t border-slate-100 ${
                        isToday ? 'bg-amber-50/85 hover:bg-amber-100/70' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <span>{formatDateViFromYmd(localYmd)}</span>
                          {isToday ? (
                            <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                              Hôm nay
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
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
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
          Mẹo: bấm vào dòng lịch hoặc nút <span className="font-semibold text-emerald-700">Điểm danh</span> để mở danh sách điểm danh học sinh.
        </div>
      </section>

      {attendanceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-[1px] sm:grid sm:place-items-center sm:p-3">
          <div className="app-card flex h-[100dvh] w-full flex-col overflow-hidden rounded-none sm:h-auto sm:max-h-[92vh] sm:max-w-5xl sm:rounded-2xl">
            <div className="shrink-0 border-b border-slate-200 bg-white px-4 py-3">
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
                          className={`rounded-xl border p-3 ${
                            isAbsent ? 'border-rose-200 bg-rose-50/60' : 'border-emerald-200 bg-emerald-50/60'
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
                              className={`min-w-[104px] rounded-lg px-3 py-2 text-sm font-semibold ${
                                isAbsent
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
                          <th className="px-3 py-2 text-left font-semibold">Họ và tên</th>
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
                                  className={`min-w-[116px] rounded-lg px-3 py-2 text-sm font-semibold ${
                                    isAbsent
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
            </div>

            <div className="shrink-0 border-t border-slate-200 bg-white px-4 py-3">
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
                  {attendanceSaving ? 'Đang lưu...' : 'Lưu điểm danh'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-900/45 p-3 backdrop-blur-[1px]">
          <div className="app-card w-full max-w-3xl overflow-hidden">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editing ? 'Chỉnh sửa lịch dạy' : 'Tạo lịch dạy mới'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 p-4">
              <div className="grid gap-3 md:grid-cols-3">
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
                      const selectedClass = classesBySelectedSchool.find((item) => item.id === nextClassId);
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
                    onChange={(event) => setForm((prev) => ({ ...prev, className: event.target.value }))}
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
                    onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                    placeholder="Ví dụ: Tin học"
                    className="px-3 py-2"
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-semibold text-slate-700">Phòng học / phòng máy</span>
                  <input
                    value={form.roomName}
                    onChange={(event) => setForm((prev) => ({ ...prev, roomName: event.target.value }))}
                    placeholder="Ví dụ: P.Máy 03"
                    className="px-3 py-2"
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-semibold text-slate-700">Tiết mấy</span>
                  <input
                    value={form.periodLabel}
                    onChange={(event) => setForm((prev) => ({ ...prev, periodLabel: event.target.value }))}
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
                    onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
                    className="px-3 py-2"
                    required
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="font-semibold text-slate-700">Giờ kết thúc *</span>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
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
                    onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  />
                  Lịch đang hoạt động
                </label>
              )}

              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
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
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherSchedule;
