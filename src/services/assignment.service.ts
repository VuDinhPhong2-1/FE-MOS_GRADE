// src/services/assignment.service.ts
import type {
  Assignment,
  AssignmentWithStats,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  GradingEndpointInfo,
} from '../types/assignment.types';

const API_BASE_URL = 'https://localhost:7223/api';

export const assignmentService = {
  // Lấy danh sách bài tập theo lớp
  async getByClass(
    classId: string,
    getAccessToken: () => Promise<string | null>
  ): Promise<Assignment[]> {
    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/assignment/class/${classId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });
    return response.json();
  },

  // Lấy danh sách bài tập kèm thống kê
  async getByClassWithStats(
    classId: string,
    getAccessToken: () => Promise<string | null>
  ): Promise<AssignmentWithStats[]> {
    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/assignment/class/${classId}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Không thể lấy danh sách bài tập với thống kê');
    }

    return response.json();
  },

  // Lấy chi tiết bài tập
  async getById(
    id: string,
    getAccessToken: () => Promise<string | null>
  ): Promise<Assignment> {
    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/assignment/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Không thể lấy thông tin bài tập');
    }

    return response.json();
  },

  // Tạo bài tập mới
  async create(
    data: CreateAssignmentRequest,
    getAccessToken: () => Promise<string | null>
  ): Promise<Assignment> {
    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/assignment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Không thể tạo bài tập');
    }

    return response.json();
  },

  // Cập nhật bài tập
  async update(
    id: string,
    data: UpdateAssignmentRequest,
    getAccessToken: () => Promise<string | null>
  ): Promise<Assignment> {
    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/assignment/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Không thể cập nhật bài tập');
    }

    return response.json();
  },

  // Xóa bài tập
  async delete(
    id: string,
    getAccessToken: () => Promise<string | null>
  ): Promise<void> {
    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/assignment/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Không thể xóa bài tập');
    }
  },

  // Lấy danh sách Grading Endpoints
  async getGradingEndpoints(
    getAccessToken: () => Promise<string | null>
  ): Promise<GradingEndpointInfo[]> {
    const accessToken = await getAccessToken();

    const response = await fetch(`${API_BASE_URL}/assignment/grading-endpoints`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      },
    });

    if (!response.ok) {
      throw new Error('Không thể lấy danh sách Grading Endpoints');
    }

    return response.json();
  },
};
