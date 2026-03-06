import type {
  BulkImportResult,
  BulkImportStudentRequest,
  Student,
  StudentResponse,
} from '../types/student.types';
import { API_BASE_URL } from '../config/api';
import { authFetch } from './auth-fetch';

const STUDENT_API_BASE_URL = `${API_BASE_URL}/student`;
const jsonHeaders = { 'Content-Type': 'application/json' };

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const errorData = await response.json().catch(() => null);
  return errorData?.message || fallback;
};

class StudentService {
  async getAllStudents(
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<StudentResponse[]> {
    const response = await authFetch(
      STUDENT_API_BASE_URL,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Không thể lấy danh sách học sinh');
    }

    return response.json();
  }

  async getStudentById(
    id: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<StudentResponse> {
    const response = await authFetch(
      `${STUDENT_API_BASE_URL}/${id}`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Không tìm thấy học sinh');
    }

    return response.json();
  }

  async createStudent(
    student: Partial<Student>,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<StudentResponse> {
    const response = await authFetch(
      STUDENT_API_BASE_URL,
      { method: 'POST', headers: jsonHeaders, body: JSON.stringify(student) },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Không thể tạo học sinh');
    }

    return response.json();
  }

  async bulkImportStudents(
    request: BulkImportStudentRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<BulkImportResult> {
    const response = await authFetch(
      `${STUDENT_API_BASE_URL}/bulk-import`,
      { method: 'POST', headers: jsonHeaders, body: JSON.stringify(request) },
      getAccessToken
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Không thể nhập học sinh');
    }

    const result = await response.json();
    return result.data;
  }

  async updateStudent(
    id: string,
    student: Partial<Student>,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<StudentResponse> {
    const response = await authFetch(
      `${STUDENT_API_BASE_URL}/${id}`,
      { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(student) },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể cập nhật học sinh');
      throw new Error(message);
    }

    return response.json();
  }

  async deleteStudent(
    id: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<void> {
    const response = await authFetch(
      `${STUDENT_API_BASE_URL}/${id}`,
      { method: 'DELETE', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Không thể xóa học sinh');
    }
  }

  async getStudentsByClassId(
    classId: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<StudentResponse[]> {
    const response = await authFetch(
      `${STUDENT_API_BASE_URL}/class/${classId}`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Không thể lấy danh sách học sinh');
    }

    const result = await response.json();
    return result.data;
  }
}

export default new StudentService();

