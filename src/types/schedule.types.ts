export interface ScheduleItem {
  id: string;
  ownerId: string;
  schoolId?: string;
  classId?: string;
  className: string;
  subject: string;
  roomName?: string;
  periodLabel?: string;
  date: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ScheduleWeekResponse {
  weekStart: string;
  weekEnd: string;
  data: ScheduleItem[];
}

export interface CreateScheduleRequest {
  schoolId?: string;
  classId?: string;
  className?: string;
  subject: string;
  roomName?: string;
  periodLabel?: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface UpdateScheduleRequest extends CreateScheduleRequest {
  isActive?: boolean;
}

export type AttendanceStatus = 'Present' | 'Absent';

export interface ScheduleAttendanceStudent {
  studentId: string;
  middleName: string;
  firstName: string;
  fullName: string;
  studentStatus: string;
  attendanceStatus: AttendanceStatus;
  note?: string;
  markedAt?: string;
}

export interface ScheduleAttendanceResponse {
  scheduleId: string;
  classId?: string;
  className: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  roomName?: string;
  students: ScheduleAttendanceStudent[];
  presentCount: number;
  absentCount: number;
}

export interface SaveScheduleAttendanceItem {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}
