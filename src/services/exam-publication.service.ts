import { API_BASE_URL } from '../config/api';
import type { CreateExamPublicationRequest, ExamPublicationResponse } from '../types/exam-publication.types';
import { authFetch } from './auth-fetch';

const parseErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const data = await response.json().catch(() => null);
  return data?.message || fallback;
};

export const examPublicationService = {
  async createExamPublication(
    request: CreateExamPublicationRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<ExamPublicationResponse> {
    const response = await authFetch(
      `${API_BASE_URL}/exam-publications`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      },
      getAccessToken
    );

    if (!response.ok) {
      const message = await parseErrorMessage(response, 'Không thể tạo ca thi test.');
      throw new Error(message);
    }

    return response.json();
  },
};
