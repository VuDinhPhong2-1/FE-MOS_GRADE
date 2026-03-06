import type {
  ClassAnalyticsOverviewResponse,
  ProjectPerformanceResponse,
  WeakTaskResponse,
} from '../types/analytics.types';
import { authFetch } from './auth-fetch';
import { API_BASE_URL } from '../config/api';

const jsonHeaders = { 'Content-Type': 'application/json' };

const parseError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const data = await response.json();
    if (data && typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
  } catch {
    // ignore
  }

  return fallback;
};

export const analyticsService = {
  async getClassOverview(
    classId: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ClassAnalyticsOverviewResponse> {
    const response = await authFetch(
      `${API_BASE_URL}/analytics/class/${classId}/overview`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error(await parseError(response, 'Không thể tải tổng quan lớp'));
    }

    return response.json();
  },

  async getWeakTasks(
    classId: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
    projectEndpoint?: string,
    top = 10
  ): Promise<WeakTaskResponse[]> {
    const params = new URLSearchParams();
    if (projectEndpoint) params.set('projectEndpoint', projectEndpoint);
    params.set('top', String(top));

    const response = await authFetch(
      `${API_BASE_URL}/analytics/class/${classId}/weak-tasks?${params.toString()}`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error(await parseError(response, 'Không thể tải danh sách câu yếu'));
    }

    return response.json();
  },

  async getProjectPerformance(
    classId: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ProjectPerformanceResponse[]> {
    const response = await authFetch(
      `${API_BASE_URL}/analytics/class/${classId}/project-performance`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error(await parseError(response, 'Không thể tải hiệu suất theo dự án'));
    }

    return response.json();
  },
};

