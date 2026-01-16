// src/services/score.service.ts
import type {
  ScoreResponse,
  CreateScoreRequest,
  BulkScoreRequest,
  StudentScoreReportResponse,
} from '../types/score.types';

const API_BASE_URL = 'https://localhost:7223/api';

export const scoreService = {
  // Lấy điểm theo bài tập
  async getByAssignment(
    assignmentId: string,
    getAccessToken: () => Promise<string | null>
  ): Promise<ScoreResponse[]> {
    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/score/assignment/${assignmentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Không thể lấy điểm theo bài tập');
    }

    return response.json();
  },

  // Lấy điểm theo học sinh
  async getByStudent(
    studentId: string,
    getAccessToken: () => Promise<string | null>
  ): Promise<ScoreResponse[]> {
    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/score/student/${studentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Không thể lấy điểm theo học sinh');
    }

    return response.json();
  },

  // Lấy báo cáo điểm của học sinh
  async getStudentReport(
    studentId: string,
    classId: string,
    getAccessToken: () => Promise<string | null>
  ): Promise<StudentScoreReportResponse> {
    const accessToken = await getAccessToken();

    const response = await fetch(
      `${API_BASE_URL}/score/student/${studentId}/class/${classId}/report`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      }
    );

    if (!response.ok) {
      throw new Error('Không thể lấy báo cáo điểm');
    }

    return response.json();
  },

  // Chấm điểm cho 1 học sinh
  async createOrUpdate(
    data: CreateScoreRequest,
    getAccessToken: () => Promise<string | null>
  ): Promise<ScoreResponse> {
    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Không thể chấm điểm');
    }

    return response.json();
  },

  // Chấm điểm hàng loạt
  async bulkCreateOrUpdate(
    data: BulkScoreRequest,
    getAccessToken: () => Promise<string | null>
  ): Promise<{ message: string; scores: ScoreResponse[] }> {
    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/score/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Không thể chấm điểm hàng loạt');
    }

    return response.json();
  },

  // Xóa điểm
  async delete(
    id: string,
    getAccessToken: () => Promise<string | null>
  ): Promise<void> {
    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/score/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Không thể xóa điểm');
    }
  },
};
