import type { GradingResult } from '../types/grading.types';
import type { CreateGradingTestBugNoteRequest, GradingTestBugNote } from '../types/grading-test-bug-note.types';
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
  fileType?: string;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

/**
 * Tách gradingApiEndpoint dạng "excel/project09" thành subject + projectCode
 * để gọi route mới: /api/admin/xml-grading-rules/grade/{subject}/{projectCode}
 */
const splitSubjectAndProjectCode = (gradingEndpoint: string): { subject: string; projectCode: string } => {
  const normalized = gradingEndpoint
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '')
    .toLowerCase();

  const match = normalized.match(/^(excel|word|ppt)\/(project\d{1,2})$/);
  if (!match) {
    throw new Error(`gradingApiEndpoint không đúng định dạng subject/projectCode: ${gradingEndpoint}`);
  }

  return { subject: match[1], projectCode: match[2] };
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

// ===== Giữ nguyên các helper phục vụ gradeForTesting (route /grading-test/..., không đổi) =====

const inferLegacyFileType = (projectCode: string, studentFile?: File): 'excel' | 'word' => {
  const normalizedCode = projectCode.trim().toLowerCase();
  if (normalizedCode.includes('-word') || normalizedCode.startsWith('word/')) {
    return 'word';
  }
  if (normalizedCode.includes('-excel') || normalizedCode.startsWith('excel/')) {
    return 'excel';
  }

  const fileName = (studentFile?.name || '').toLowerCase();
  if (fileName.endsWith('.docx') || fileName.endsWith('.doc') || fileName.endsWith('.txt')) {
    return 'word';
  }

  return 'excel';
};

const normalizeProjectCode = (
  projectCode: string,
  studentFile?: File
): { projectNumber: string; fileType: 'excel' | 'word' } => {
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

  let match = normalized.match(/^project(\d{1,2})-(excel|word)$/);
  if (match) {
    const projectNumber = Number.parseInt(match[1], 10);
    if (!Number.isFinite(projectNumber) || projectNumber < 1) {
      throw new Error('Mã project không hợp lệ');
    }
    const fileType: 'excel' | 'word' = match[2] === 'word' ? 'word' : 'excel';
    return {
      projectNumber: `project${projectNumber.toString().padStart(2, '0')}`,
      fileType,
    };
  }

  if (normalized.startsWith('excel/')) {
    normalized = normalized.slice('excel/'.length);
  }

  match = normalized.match(/^project(\d{1,2})$/);
  if (!match) {
    throw new Error('Mã project không hợp lệ');
  }

  const projectNumber = Number.parseInt(match[1], 10);
  if (!Number.isFinite(projectNumber) || projectNumber < 1) {
    throw new Error('Mã project không hợp lệ');
  }

  return {
    projectNumber: `project${projectNumber.toString().padStart(2, '0')}`,
    fileType: inferLegacyFileType(raw, studentFile),
  };
};

export const gradingService = {
  /**
   * ĐÃ SỬA: gọi XmlGradingRulesController thay vì route /grading/... cũ.
   * Chữ ký hàm giữ nguyên (kể cả tham số meta không dùng nữa) để không phải
   * sửa GradingModal.tsx / StudentList.tsx.
   */
  async gradeByEndpoint(
    gradingEndpoint: string,
    studentFile: File,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
    _meta?: GradingRequestMeta
  ): Promise<GradingResult> {
    const { subject, projectCode } = splitSubjectAndProjectCode(gradingEndpoint);

    const formData = new FormData();
    formData.append('file', studentFile); // đúng tên param IFormFile file trong XmlGradingRulesController

    const response = await authFetch(
      `${API_ORIGIN}/api/admin/xml-grading-rules/grade/${subject}/${projectCode}`,
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
    return gradingService.gradeByEndpoint('excel/project09', studentFile, getAccessToken, meta);
  },

  // ===== Không đổi: vẫn dùng route /grading-test/... riêng =====

  async gradeForTesting(
    projectCode: string,
    studentFile: File,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<GradingResult> {
    const { projectNumber, fileType } = normalizeProjectCode(projectCode, studentFile);
    const formData = new FormData();
    formData.append('studentFile', studentFile);

    const endpoint = fileType === 'word'
      ? `${API_BASE_URL}/grading-test/word/${projectNumber}`
      : `${API_BASE_URL}/grading-test/excel/${projectNumber}`;

    const response = await authFetch(
      endpoint,
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

  async getTestingBugNotes(
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
    projectCode?: string
  ): Promise<GradingTestBugNote[]> {
    const query = projectCode ? `?projectCode=${encodeURIComponent(projectCode)}` : '';
    const response = await authFetch(
      `${API_BASE_URL}/grading-test/bug-notes${query}`,
      { method: 'GET', headers: jsonHeaders, cache: 'no-store' },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return response.json();
  },

  async createTestingBugNote(
    request: CreateGradingTestBugNoteRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<GradingTestBugNote> {
    const response = await authFetch(
      `${API_BASE_URL}/grading-test/bug-notes`,
      {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(request),
      },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }

    return response.json();
  },

  async deleteTestingBugNote(
    id: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<void> {
    const response = await authFetch(
      `${API_BASE_URL}/grading-test/bug-notes/${id}`,
      { method: 'DELETE', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error(await parseErrorMessage(response));
    }
  },
};