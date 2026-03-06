import type {
  Assignment,
  AssignmentWithStats,
  CreateAssignmentRequest,
  GradingEndpointInfo,
  UpdateAssignmentRequest,
} from '../types/assignment.types';
import { API_BASE_URL } from '../config/api';
import { authFetch } from './auth-fetch';

const jsonHeaders = { 'Content-Type': 'application/json' };

const fallbackGradingEndpoints: GradingEndpointInfo[] = [
  {
    endpoint: 'project01',
    displayName: 'Project 01',
    description: 'Cham diem Project 01',
    maxScore: 20,
  },
  {
    endpoint: 'project02',
    displayName: 'Project 02',
    description: 'Cham diem Project 02',
    maxScore: 28,
  },
  {
    endpoint: 'project03',
    displayName: 'Project 03',
    description: 'Cham diem Project 03 (Task 1-5 tu dong, Task 6 thu cong)',
    maxScore: 20,
  },
  {
    endpoint: 'project04',
    displayName: 'Project 04',
    description: 'Cham diem Project 04',
    maxScore: 28,
  },
  {
    endpoint: 'project09',
    displayName: 'Project 09',
    description: 'Cham diem Project 09',
    maxScore: 32,
  },
];

const mergeEndpointFallback = (items: GradingEndpointInfo[]): GradingEndpointInfo[] => {
  const map = new Map<string, GradingEndpointInfo>();

  items.forEach((item) => {
    if (!item?.endpoint) return;
    map.set(item.endpoint.toLowerCase(), item);
  });

  fallbackGradingEndpoints.forEach((item) => {
    const key = item.endpoint.toLowerCase();
    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName, 'en', { numeric: true, sensitivity: 'base' })
  );
};

export const assignmentService = {
  async getByClass(
    classId: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<Assignment[]> {
    const response = await authFetch(
      `${API_BASE_URL}/assignment/class/${classId}`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Khong the lay danh sach bai tap');
    }

    return response.json();
  },

  async getByClassWithStats(
    classId: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<AssignmentWithStats[]> {
    const response = await authFetch(
      `${API_BASE_URL}/assignment/class/${classId}/stats`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Khong the lay danh sach bai tap voi thong ke');
    }

    return response.json();
  },

  async getById(
    id: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<Assignment> {
    const response = await authFetch(
      `${API_BASE_URL}/assignment/${id}`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Khong the lay thong tin bai tap');
    }

    return response.json();
  },

  async create(
    data: CreateAssignmentRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<Assignment> {
    const response = await authFetch(
      `${API_BASE_URL}/assignment`,
      { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) },
      getAccessToken
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Khong the tao bai tap');
    }

    return response.json();
  },

  async update(
    id: string,
    data: UpdateAssignmentRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<Assignment> {
    const response = await authFetch(
      `${API_BASE_URL}/assignment/${id}`,
      { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data) },
      getAccessToken
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Khong the cap nhat bai tap');
    }

    return response.json();
  },

  async delete(
    id: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<void> {
    const response = await authFetch(
      `${API_BASE_URL}/assignment/${id}`,
      { method: 'DELETE', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Khong the xoa bai tap');
    }
  },

  async getGradingEndpoints(
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<GradingEndpointInfo[]> {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/assignment/grading-endpoints`,
        { method: 'GET', headers: jsonHeaders },
        getAccessToken
      );

      if (!response.ok) {
        return fallbackGradingEndpoints;
      }

      const data = (await response.json()) as GradingEndpointInfo[];
      return mergeEndpointFallback(data || []);
    } catch {
      return fallbackGradingEndpoints;
    }
  },
};
