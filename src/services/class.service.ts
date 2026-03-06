import { API_BASE_URL } from '../config/api';
import type { Class, CreateClassRequest } from '../types/class.types';
import { authFetch } from './auth-fetch';

export class ApiServiceError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
        this.name = 'ApiServiceError';
    }
}

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
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

export const classService = {
    async getClassesBySchool(
        schoolId: string,
        getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
        showInactive: boolean
    ): Promise<Class[]> {
        const query = showInactive ? '?includeInactive=true' : '';

        const response = await authFetch(`${API_BASE_URL}/class/school/${schoolId}${query}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }, getAccessToken);

        if (!response.ok) {
            const message = await parseErrorMessage(response, 'Không thể lấy danh sách lớp');
            throw new ApiServiceError(response.status, message);
        }

        return response.json();
    },

    async getClassById(
        id: string,
        getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
    ): Promise<Class> {
        const response = await authFetch(`${API_BASE_URL}/class/${id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        }, getAccessToken);

        if (!response.ok) {
            const message = await parseErrorMessage(response, 'Không thể lấy thông tin lớp');
            throw new ApiServiceError(response.status, message);
        }

        return response.json();
    },

    async createClass(
        data: CreateClassRequest,
        getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
    ): Promise<Class> {
        const response = await authFetch(`${API_BASE_URL}/class`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }, getAccessToken);

        if (!response.ok) {
            const message = await parseErrorMessage(response, 'Không thể tạo lớp');
            throw new ApiServiceError(response.status, message);
        }

        return response.json();
    },

    async updateClass(
        id: string,
        data: Partial<CreateClassRequest>,
        getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
    ): Promise<Class> {
        const response = await authFetch(`${API_BASE_URL}/class/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        }, getAccessToken);

        if (!response.ok) {
            const message = await parseErrorMessage(response, 'Không thể cập nhật lớp');
            throw new ApiServiceError(response.status, message);
        }

        return response.json();
    },

    async deleteClass(
        id: string,
        getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
    ): Promise<void> {
        const response = await authFetch(`${API_BASE_URL}/class/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        }, getAccessToken);

        if (!response.ok) {
            const message = await parseErrorMessage(response, 'Không thể xóa lớp');
            throw new ApiServiceError(response.status, message);
        }
    },
};

