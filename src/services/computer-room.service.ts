import { API_BASE_URL } from '../config/api';
import type {
  ComputerRoom,
  CreateComputerRoomRequest,
  UpdateComputerRoomRequest,
} from '../types/computer-room.types';
import { authFetch } from './auth-fetch';

const COMPUTER_ROOM_API_BASE_URL = `${API_BASE_URL}/computer-rooms`;
const jsonHeaders = { 'Content-Type': 'application/json' };

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const errorData = await response.json().catch(() => null);
  if (!errorData) return fallback;

  if (typeof errorData.message === 'string' && errorData.message.trim()) {
    return errorData.message;
  }

  if (errorData.errors && typeof errorData.errors === 'object') {
    const firstField = Object.keys(errorData.errors)[0];
    const firstErrors = Array.isArray(errorData.errors[firstField]) ? errorData.errors[firstField] : [];
    if (firstErrors.length > 0) {
      return String(firstErrors[0]);
    }
  }

  return fallback;
};

class ComputerRoomService {
  async getBySchool(
    schoolId: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
    includeInactive = false
  ): Promise<ComputerRoom[]> {
    const response = await authFetch(
      `${COMPUTER_ROOM_API_BASE_URL}?schoolId=${encodeURIComponent(schoolId)}&includeInactive=${includeInactive}`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể tải danh sách phòng máy');
      throw new Error(message);
    }

    return response.json();
  }

  async create(
    payload: CreateComputerRoomRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ComputerRoom> {
    const response = await authFetch(
      COMPUTER_ROOM_API_BASE_URL,
      {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể tạo phòng máy');
      throw new Error(message);
    }

    return response.json();
  }

  async update(
    id: string,
    payload: UpdateComputerRoomRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ComputerRoom> {
    const response = await authFetch(
      `${COMPUTER_ROOM_API_BASE_URL}/${id}`,
      {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify(payload),
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể cập nhật phòng máy');
      throw new Error(message);
    }

    return response.json();
  }

  async delete(
    id: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<void> {
    const response = await authFetch(
      `${COMPUTER_ROOM_API_BASE_URL}/${id}`,
      {
        method: 'DELETE',
        headers: jsonHeaders,
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể xóa phòng máy');
      throw new Error(message);
    }
  }
}

export const computerRoomService = new ComputerRoomService();
