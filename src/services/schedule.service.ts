import { API_BASE_URL } from '../config/api';
import type {
  CreateScheduleRequest,
  ScheduleReportsPayload,
  SaveScheduleAttendanceItem,
  ScheduleAttendanceResponse,
  ScheduleItem,
  ScheduleWeekResponse,
  UpdateScheduleRequest,
} from '../types/schedule.types';
import { authFetch } from './auth-fetch';

const SCHEDULE_API_BASE_URL = `${API_BASE_URL}/schedule`;
const jsonHeaders = { 'Content-Type': 'application/json' };

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const errorData = await response.json().catch(() => null);
  if (!errorData) return fallback;

  if (typeof errorData.message === 'string' && errorData.message.trim()) {
    return errorData.message;
  }

  if (errorData.errors && typeof errorData.errors === 'object') {
    const firstField = Object.keys(errorData.errors)[0];
    const firstErrors = Array.isArray(errorData.errors[firstField]) ? errorData.errors[firstField] : [];
    if (firstErrors.length > 0) {
      return String(firstErrors[0]);
    }
  }

  return fallback;
};

class ScheduleService {
  async getWeekSchedules(
    weekStart: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ScheduleWeekResponse> {
    const response = await authFetch(
      `${SCHEDULE_API_BASE_URL}/week?weekStart=${encodeURIComponent(weekStart)}`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể tải lịch dạy');
      throw new Error(message);
    }

    return response.json();
  }

  async create(
    data: CreateScheduleRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ScheduleItem> {
    const response = await authFetch(
      SCHEDULE_API_BASE_URL,
      {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(data),
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể tạo lịch dạy');
      throw new Error(message);
    }

    return response.json();
  }

  async update(
    id: string,
    data: UpdateScheduleRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ScheduleItem> {
    const response = await authFetch(
      `${SCHEDULE_API_BASE_URL}/${id}`,
      {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify(data),
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể cập nhật lịch dạy');
      throw new Error(message);
    }

    return response.json();
  }

  async delete(
    id: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<void> {
    const response = await authFetch(
      `${SCHEDULE_API_BASE_URL}/${id}`,
      {
        method: 'DELETE',
        headers: jsonHeaders,
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể xóa lịch dạy');
      throw new Error(message);
    }
  }

  async getAttendance(
    scheduleId: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ScheduleAttendanceResponse> {
    const response = await authFetch(
      `${SCHEDULE_API_BASE_URL}/${scheduleId}/attendance`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể tải điểm danh');
      throw new Error(message);
    }

    return response.json();
  }

  async saveAttendance(
    scheduleId: string,
    items: SaveScheduleAttendanceItem[],
    reports: ScheduleReportsPayload | undefined,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ScheduleAttendanceResponse> {
    const response = await authFetch(
      `${SCHEDULE_API_BASE_URL}/${scheduleId}/attendance`,
      {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({ items, reports }),
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể lưu điểm danh');
      throw new Error(message);
    }

    return response.json();
  }
}

export const scheduleService = new ScheduleService();
