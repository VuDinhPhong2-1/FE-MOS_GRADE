import type {
  BulkScoreRequest,
  CreateScoreRequest,
  ScoreResponse,
  StudentScoreReportResponse,
} from '../types/score.types';
import { authFetch } from './auth-fetch';
import { API_BASE_URL } from '../config/api';

const jsonHeaders = { 'Content-Type': 'application/json' };

export const scoreService = {
  async getByAssignment(
    assignmentId: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ScoreResponse[]> {
    const response = await authFetch(
      `${API_BASE_URL}/score/assignment/${assignmentId}`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) throw new Error('Khong the lay diem theo bai tap');
    return response.json();
  },

  async getByStudent(
    studentId: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ScoreResponse[]> {
    const response = await authFetch(
      `${API_BASE_URL}/score/student/${studentId}`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) throw new Error('Khong the lay diem theo hoc sinh');
    return response.json();
  },

  async getStudentReport(
    studentId: string,
    classId: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<StudentScoreReportResponse> {
    const response = await authFetch(
      `${API_BASE_URL}/score/student/${studentId}/class/${classId}/report`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) throw new Error('Khong the lay bao cao diem');
    return response.json();
  },

  async createOrUpdate(
    data: CreateScoreRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ScoreResponse> {
    const response = await authFetch(
      `${API_BASE_URL}/score`,
      { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) },
      getAccessToken
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Khong the cham diem');
    }

    return response.json();
  },

  async bulkCreateOrUpdate(
    data: BulkScoreRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<{ message: string; scores: ScoreResponse[] }> {
    const response = await authFetch(
      `${API_BASE_URL}/score/bulk`,
      { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) },
      getAccessToken
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Khong the cham diem hang loat');
    }

    return response.json();
  },

  async delete(
    id: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<void> {
    const response = await authFetch(
      `${API_BASE_URL}/score/${id}`,
      { method: 'DELETE', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) throw new Error('Khong the xoa diem');
  },

  async getByClass(
    classId: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ScoreResponse[]> {
    const response = await authFetch(
      `${API_BASE_URL}/score/class/${classId}`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) throw new Error('Khong the lay danh sach diem theo lop');
    return response.json();
  },
};

