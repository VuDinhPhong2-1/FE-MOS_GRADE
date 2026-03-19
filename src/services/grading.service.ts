import type { GradingResult } from '../types/grading.types';
import { authFetch } from './auth-fetch';
import { API_BASE_URL, API_ORIGIN } from '../config/api';


interface GradingRequestMeta {
  classId: string;
  assignmentId: string;
  studentId: string;
}

interface GradingTestProject {
  code: string;
  endpoint: string;
  displayName: string;
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

const normalizeProjectCode = (projectCode: string): string => {
  const raw = projectCode.trim();
  if (!raw) {
    throw new Error('Mã project đang trống');
  }

  let normalized = raw
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase();

  if (normalized.startsWith('api/grading/')) {
    normalized = normalized.slice('api/grading/'.length);
  } else if (normalized.startsWith('grading/')) {
    normalized = normalized.slice('grading/'.length);
  }

  if (normalized.startsWith('excel/')) {
    normalized = normalized.slice('excel/'.length);
  }

  const match = normalized.match(/^project(\d{1,2})$/);
  if (!match) {
    throw new Error('Mã project không hợp lệ');
  }

  const projectNumber = Number.parseInt(match[1], 10);
  if (!Number.isFinite(projectNumber) || projectNumber < 1) {
    throw new Error('Mã project không hợp lệ');
  }

  return `project${projectNumber.toString().padStart(2, '0')}`;
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
    return gradingService.gradeByEndpoint('/grading/excel/project09', studentFile, getAccessToken, meta);
  },

  async gradeForTesting(
    projectCode: string,
    studentFile: File,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<GradingResult> {
    const normalizedProjectCode = normalizeProjectCode(projectCode);
    const formData = new FormData();
    formData.append('studentFile', studentFile);

    const response = await authFetch(
      `${API_BASE_URL}/grading-test/excel/${normalizedProjectCode}`,
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

  async getTestingProjects(
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<GradingTestProject[]> {
    const response = await authFetch(
      `${API_BASE_URL}/grading-test/projects`,
      { method: 'GET' },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return response.json();
  },
};

