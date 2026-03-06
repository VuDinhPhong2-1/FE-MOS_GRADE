import type { GradingResult } from '../types/grading.types';
import { authFetch } from './auth-fetch';
import { API_BASE_URL, API_ORIGIN } from '../config/api';


interface GradingRequestMeta {
  classId: string;
  assignmentId: string;
  studentId: string;
}

const buildGradingUrl = (gradingEndpoint: string): string => {
  const raw = gradingEndpoint.trim();
  if (!raw) {
    throw new Error('Đường dẫn chấm điểm đang trống');
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }

  if (raw.startsWith('/api/')) {
    return `${API_ORIGIN}${raw}`;
  }

  if (raw.startsWith('api/')) {
    return `${API_ORIGIN}/${raw}`;
  }

  if (raw.startsWith('/grading/')) {
    return `${API_BASE_URL}${raw}`;
  }

  if (raw.startsWith('grading/')) {
    return `${API_BASE_URL}/${raw}`;
  }

  const normalized = raw.replace(/^\/+/, '');
  return `${API_BASE_URL}/grading/${normalized}`;
};

const parseErrorMessage = async (response: Response): Promise<string> => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const data = await response.json().catch(() => null);
    if (data && typeof data.message === 'string' && data.message.trim()) {
      return data.message;
    }
    if (data && typeof data.error === 'string' && data.error.trim()) {
      return data.error;
    }
  }

  const text = await response.text().catch(() => '');
  if (text.trim()) {
    return text.trim();
  }

  return `HTTP ${response.status}: Không thể chấm điểm`;
};

export const gradingService = {
  async gradeByEndpoint(
    gradingEndpoint: string,
    studentFile: File,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
    meta?: GradingRequestMeta
  ): Promise<GradingResult> {
    const formData = new FormData();
    formData.append('studentFile', studentFile);

    if (meta) {
      formData.append('classId', meta.classId);
      formData.append('assignmentId', meta.assignmentId);
      formData.append('studentId', meta.studentId);
    }

    const response = await authFetch(
      buildGradingUrl(gradingEndpoint),
      {
        method: 'POST',
        body: formData,
      },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return response.json();
  },

  async gradeProject09(
    studentFile: File,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
    meta?: GradingRequestMeta
  ): Promise<GradingResult> {
    return gradingService.gradeByEndpoint('/grading/project09', studentFile, getAccessToken, meta);
  },
};

