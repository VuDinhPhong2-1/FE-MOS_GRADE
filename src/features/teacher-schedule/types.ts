import type { AttendanceStatus } from '../../types/schedule.types';

export interface ScheduleFormState {
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

export interface ComputerRoomFormState {
  schoolId: string;
  name: string;
  studentMachineCount: string;
  teacherMachineCount: string;
  brokenMachineCount: string;
  brokenMachinesDetail: string;
  netSupportStatus: string;
  audioStatus: string;
  coolingStatus: string;
  devicesPoweredOffStatus: string;
  seatingOrderStatus: string;
  roomHygieneStatus: string;
  isActive: boolean;
}

export interface AttendanceDraftState {
  status: AttendanceStatus;
  note: string;
}

export type AttendancePanelTab = 'attendance' | 'startLesson' | 'professional' | 'endLesson';

export type TodayLessonTimeline = 'done' | 'ongoing' | 'upcoming';
