import type { CreateSchoolRequest, School } from '../types';
import { authFetch } from './auth-fetch';

const API_BASE_URL = 'https://localhost:7223/api';

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
      throw new Error('Khong the lay danh sach truong');
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
      throw new Error(errorData?.message || 'Khong the tao truong');
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
      throw new Error(errorData?.message || 'Khong the cap nhat truong');
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
      throw new Error('Khong the xoa truong');
    }
  },
};
