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
    const response = await authFetch(
      `${API_BASE_URL}/assignment/grading-endpoints`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Khong the lay danh sach grading endpoints');
    }

    return response.json();
  },
};
