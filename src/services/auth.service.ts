import { AUTH_API_BASE_URL } from '../config/api';
import type {
  PermissionCatalogResponse,
  ProfileResponse,
  TeacherApprovalDecisionRequest,
  TeacherApprovalRequest,
  TeacherSummary,
  UpdateProfileRequest,
  UpdateTeacherPermissionsRequest
} from '../types/auth.types';
import { authFetch } from './auth-fetch';

const jsonHeaders = { 'Content-Type': 'application/json' };

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const errorData = await response.json().catch(() => null);
  return errorData?.message || fallback;
};

class AuthService {
  async getTeachers(
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
    includeInactive = false
  ): Promise<TeacherSummary[]> {
    const query = includeInactive ? '?includeInactive=true' : '';
    const response = await authFetch(
      `${AUTH_API_BASE_URL}/teachers${query}`,
      {
        method: 'GET',
        headers: jsonHeaders,
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể lấy danh sách giáo viên');
      throw new Error(message);
    }

    return response.json();
  }

  async updateCurrentUserProfile(
    data: UpdateProfileRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ProfileResponse> {
    const response = await authFetch(
      `${AUTH_API_BASE_URL}/me`,
      {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify(data),
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể cập nhật thông tin tài khoản');
      throw new Error(message);
    }

    return response.json();
  }

  async getPermissionCatalog(
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<PermissionCatalogResponse> {
    const response = await authFetch(
      `${AUTH_API_BASE_URL}/permissions`,
      {
        method: 'GET',
        headers: jsonHeaders,
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể lấy danh mục phân quyền');
      throw new Error(message);
    }

    return response.json();
  }

  async getTeacherRequests(
    status: 'pending' | 'approved' | 'rejected' | 'all',
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<TeacherApprovalRequest[]> {
    const response = await authFetch(
      `${AUTH_API_BASE_URL}/teacher-requests?status=${encodeURIComponent(status)}`,
      {
        method: 'GET',
        headers: jsonHeaders,
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể lấy danh sách yêu cầu giáo viên');
      throw new Error(message);
    }

    return response.json();
  }

  async decideTeacherRequest(
    userId: string,
    data: TeacherApprovalDecisionRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<TeacherApprovalRequest> {
    const response = await authFetch(
      `${AUTH_API_BASE_URL}/teacher-requests/${userId}/decision`,
      {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify(data),
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể xử lý yêu cầu giáo viên');
      throw new Error(message);
    }

    return response.json();
  }

  async updateTeacherPermissions(
    teacherId: string,
    data: UpdateTeacherPermissionsRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<TeacherSummary> {
    const response = await authFetch(
      `${AUTH_API_BASE_URL}/teachers/${teacherId}/permissions`,
      {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify(data),
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể cập nhật phân quyền giáo viên');
      throw new Error(message);
    }

    return response.json();
  }
}

export const authService = new AuthService();
