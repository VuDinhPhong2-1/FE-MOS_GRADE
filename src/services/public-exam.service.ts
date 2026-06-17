import { API_BASE_URL } from '../config/api';
import type { PublicExamPublicationInfo } from '../types/public-exam.types';

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const data = await response.json().catch(() => null);
  return data?.message || fallback;
};

export const publicExamService = {
  async getByToken(token: string): Promise<PublicExamPublicationInfo> {
    const response = await fetch(`${API_BASE_URL}/public/exams/${encodeURIComponent(token)}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể tải thông tin ca thi.');
      throw new Error(message);
    }

    return response.json();
  },
};
