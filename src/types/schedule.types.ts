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
  schoolId?: string;
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
  reports: ScheduleReportsResponse;
  roomSessionContext: ScheduleRoomSessionContext;
}

export interface SaveScheduleAttendanceItem {
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface ScheduleStartLessonReport {
  teacherName: string;
  assistantName: string;
  roomName: string;
  totalMachines: string;
  brokenMachinesSummary: string;
  missingMachinesForStudents: string;
  netSupportStatus: string;
  audioStatus: string;
  coolingStatus: string;
  hygieneStatus: string;
}

export interface ScheduleProfessionalReport {
  teacherName: string;
  className: string;
  subjectName: string;
  teachingMaterials: string;
  teachingContent: string;
  plannedLessons: string;
  taughtLessons: string;
  ongoingPracticeCompletions: string;
  gmetrixResultRate: string;
}

export interface ScheduleEndLessonReport {
  teacherName: string;
  assistantName: string;
  roomName: string;
  totalMachines: string;
  classStudentCountSummary: string;
  studentMaterialCoverageRate: string;
  brokenMachinesSummary: string;
  netSupportStatus: string;
  audioStatus: string;
  coolingStatus: string;
  devicesPoweredOffStatus: string;
  seatingOrderStatus: string;
  roomHygieneStatus: string;
  studentRuleComplianceStatus: string;
  violationListSummary: string;
}

export interface ScheduleReportsResponse {
  startLesson: ScheduleStartLessonReport;
  professional: ScheduleProfessionalReport;
  endLesson: ScheduleEndLessonReport;
}

export interface ScheduleReportsPayload {
  startLesson: ScheduleStartLessonReport;
  professional: ScheduleProfessionalReport;
  endLesson: ScheduleEndLessonReport;
}

export interface ScheduleRoomClassSummary {
  classId?: string;
  className: string;
  currentStudents: number;
  maxStudents?: number;
}

export interface ScheduleRoomSessionContext {
  sessionLabel: string;
  isSharedRoomSession: boolean;
  sharedClassStudentSummary: string;
  sharedClasses: ScheduleRoomClassSummary[];
}
