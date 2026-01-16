// src/services/student.service.ts

import type {
    Student,
    BulkImportStudentRequest,
    BulkImportResult,
    StudentResponse,
} from '../types/student.types';

const API_BASE_URL = 'https://localhost:7223/api/student';

class StudentService {
    private getAuthHeaders(): HeadersInit {
        const token = localStorage.getItem('accessToken');
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        };
    }

    // Lấy tất cả học sinh
    async getAllStudents(): Promise<StudentResponse[]> {
        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Không thể lấy danh sách học sinh');
        }

        return response.json();
    }

    // Lấy học sinh theo ID
    async getStudentById(id: string): Promise<StudentResponse> {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'GET',
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Không tìm thấy học sinh');
        }

        return response.json();
    }

    // Tạo học sinh mới
    async createStudent(student: Partial<Student>): Promise<StudentResponse> {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(student),
        });

        if (!response.ok) {
            throw new Error('Không thể tạo học sinh');
        }

        return response.json();
    }

    // Bulk Import học sinh
    async bulkImportStudents(
        request: BulkImportStudentRequest
    ): Promise<BulkImportResult> {
        console.log('📤 Sending bulk import request:', request);

        const response = await fetch(`${API_BASE_URL}/bulk-import`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Bulk import error:', errorData);
            throw new Error(errorData.message || 'Không thể import học sinh');
        }

        const result = await response.json();
        console.log('✅ Bulk import result:', result);
        return result.data; // Backend trả về { message, data }
    }

    // Cập nhật học sinh
    async updateStudent(
        id: string,
        student: Partial<Student>
    ): Promise<StudentResponse> {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: this.getAuthHeaders(),
            body: JSON.stringify(student),
        });

        if (!response.ok) {
            throw new Error('Không thể cập nhật học sinh');
        }

        return response.json();
    }

    // Xóa học sinh
    async deleteStudent(id: string): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE',
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Không thể xóa học sinh');
        }
    }
    async getStudentsByClassId(classId: string): Promise<StudentResponse[]> {
        console.log('📤 Fetching students for class:', classId);

        const response = await fetch(`${API_BASE_URL}/class/${classId}`, {
            method: 'GET',
            headers: this.getAuthHeaders(),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error fetching students:', errorData);
            throw new Error(errorData.message || 'Không thể lấy danh sách học sinh');
        }

        const result = await response.json();
        console.log('✅ Students fetched:', result);
        return result.data; // Backend trả về { message, data }
    }
}

export default new StudentService();
