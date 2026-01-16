// src/services/school.service.ts
import type { CreateSchoolRequest } from '../types';
import type { School } from '../types';
const API_BASE_URL = 'https://localhost:7223/api';

export const schoolService = {
    // Lấy danh sách trường
    async getSchools(getAccessToken: () => Promise<string | null>): Promise<School[]> {
        const accessToken = await getAccessToken();

        const response = await fetch(`${API_BASE_URL}/school`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
        });

        if (!response.ok) {
            throw new Error('Không thể lấy danh sách trường');
        }

        return response.json();
    },

    // Tạo trường mới
    async createSchool(
        data: CreateSchoolRequest,
        getAccessToken: () => Promise<string | null>
    ): Promise<School> {
        const accessToken = await getAccessToken();

        const response = await fetch(`${API_BASE_URL}/school`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể tạo trường');
        }

        return response.json();
    },

    // ✅ Cập nhật trường
    async updateSchool(
        id: string,
        data: Partial<School>, // ✅ Đặt tên 'data', kiểu Partial<School>
        getAccessToken: () => Promise<string | null>
    ): Promise<School> {
        const accessToken = await getAccessToken();

        const response = await fetch(`${API_BASE_URL}/school/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể cập nhật trường');
        }
        return response.json();
    },

    // ✅ Xóa trường
    async deleteSchool(
        id: string,
        getAccessToken: () => Promise<string | null>
    ): Promise<void> {
        const accessToken = await getAccessToken();

        const response = await fetch(`${API_BASE_URL}/school/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
        });

        if (!response.ok) {
            throw new Error('Không thể xóa trường');
        }
    },
};
