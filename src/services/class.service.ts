import type { Class, CreateClassRequest } from '../types/class.types';

const API_BASE_URL = 'https://localhost:7223/api';

export const classService = {
    // Lấy danh sách lớp theo trường
    async getClassesBySchool(
        schoolId: string,
        getAccessToken: () => Promise<string | null>, showInactive: Boolean
    ): Promise<Class[]> {
        const accessToken = await getAccessToken();

        const response = await fetch(`${API_BASE_URL}/class/school/${schoolId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
        });

        if (!response.ok) {
            throw new Error('Không thể lấy danh sách lớp');
        }

        return response.json();
    },

    // Lấy thông tin chi tiết một lớp
    async getClassById(
        id: string,
        getAccessToken: () => Promise<string | null>
    ): Promise<Class> {
        const accessToken = await getAccessToken();

        const response = await fetch(`${API_BASE_URL}/class/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
        });

        if (!response.ok) {
            throw new Error('Không thể lấy thông tin lớp');
        }

        return response.json();
    },

    // Tạo lớp mới
    async createClass(
        data: CreateClassRequest,
        getAccessToken: () => Promise<string | null>
    ): Promise<Class> {
        const accessToken = await getAccessToken();

        const response = await fetch(`${API_BASE_URL}/class`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể tạo lớp');
        }

        return response.json();
    },

    // Cập nhật lớp
    async updateClass(
        id: string,
        data: Partial<CreateClassRequest>,
        getAccessToken: () => Promise<string | null>
    ): Promise<Class> {
        const accessToken = await getAccessToken();

        const response = await fetch(`${API_BASE_URL}/class/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Không thể cập nhật lớp');
        }

        return response.json();
    },

    // Xóa lớp
    async deleteClass(
        id: string,
        getAccessToken: () => Promise<string | null>
    ): Promise<void> {
        const accessToken = await getAccessToken();

        const response = await fetch(`${API_BASE_URL}/class/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
        });

        if (!response.ok) {
            throw new Error('Không thể xóa lớp');
        }
    },
};
