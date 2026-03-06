import { API_BASE_URL } from '../config/api';
import type { CreateSchoolRequest, School } from '../types';
import { authFetch } from './auth-fetch';

export const schoolService = {
  async getSchools(getAccessToken: (forceRefresh?: boolean) => Promise<string | null>): Promise<School[]> {
    const response = await authFetch(
      `${API_BASE_URL}/school`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Không thể lấy danh sách trường');
    }

    return response.json();
  },

  async createSchool(
    data: CreateSchoolRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<School> {
    const response = await authFetch(
      `${API_BASE_URL}/school`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      getAccessToken
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Không thể tạo trường');
    }

    return response.json();
  },

  async updateSchool(
    id: string,
    data: Partial<School>,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<School> {
    const response = await authFetch(
      `${API_BASE_URL}/school/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      },
      getAccessToken
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Không thể cập nhật trường');
    }

    return response.json();
  },

  async deleteSchool(
    id: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<void> {
    const response = await authFetch(
      `${API_BASE_URL}/school/${id}`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Không thể xóa trường');
    }
  },
};

