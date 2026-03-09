import { AUTH_API_BASE_URL } from '../config/api';
import type { ProfileResponse, UpdateProfileRequest } from '../types/auth.types';
import { authFetch } from './auth-fetch';

const jsonHeaders = { 'Content-Type': 'application/json' };

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const errorData = await response.json().catch(() => null);
  return errorData?.message || fallback;
};

class AuthService {
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
}

export const authService = new AuthService();
