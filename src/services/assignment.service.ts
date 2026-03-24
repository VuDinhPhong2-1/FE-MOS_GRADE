import type {
  Assignment,
  AssignmentWithStats,
  CreateAssignmentRequest,
  GradingEndpointInfo,
  UpdateAssignmentRequest,
} from '../types/assignment.types';
import { API_BASE_URL } from '../config/api';
import { authFetch } from './auth-fetch';

const jsonHeaders = { 'Content-Type': 'application/json' };

const PRACTICE_TOTAL_SCORE = 1000;
const PRACTICE_PROJECT_COUNT: Record<string, number> = {
  practice01: 8,
  practice02: 8,
  practice03: 8,
};

const getPracticeCodeByProject = (projectNumber: number): string => {
  if (projectNumber >= 1 && projectNumber <= 8) return 'practice01';
  if (projectNumber >= 9 && projectNumber <= 16) return 'practice02';
  return 'practice03';
};

const getPracticeScoreByProject = (projectNumber: number): number => {
  const practiceCode = getPracticeCodeByProject(projectNumber);
  const count = PRACTICE_PROJECT_COUNT[practiceCode] || 1;
  return Number((PRACTICE_TOTAL_SCORE / count).toFixed(2));
};

const createFallbackExcelEndpoint = (
  projectNumber: number,
  description: string,
  rawMaxScore: number
): GradingEndpointInfo => {
  const practiceCode = getPracticeCodeByProject(projectNumber);
  const practiceName = practiceCode.replace('practice', 'Practice ');
  const maxScore = getPracticeScoreByProject(projectNumber);

  return {
    endpoint: `excel/project${String(projectNumber).padStart(2, '0')}`,
    displayName: `Project ${String(projectNumber).padStart(2, '0')} - Excel`,
    description: `${description}. Quy đổi theo ${practiceName}: ${maxScore}/${PRACTICE_TOTAL_SCORE} điểm.`,
    maxScore,
    rawMaxScore,
    subject: 'excel',
    practiceCode,
    practiceName,
    practiceTotalScore: PRACTICE_TOTAL_SCORE,
    practiceProjectCount: PRACTICE_PROJECT_COUNT[practiceCode],
    apiPath: `/api/grading/excel/project${String(projectNumber).padStart(2, '0')}`,
  };
};

const fallbackGradingEndpoints: GradingEndpointInfo[] = [
  createFallbackExcelEndpoint(1, 'Chấm điểm dự án 01', 20),
  createFallbackExcelEndpoint(2, 'Chấm điểm dự án 02', 28),
  createFallbackExcelEndpoint(3, 'Chấm điểm dự án 03 (câu 1-5 tự động, câu 6 thủ công)', 20),
  createFallbackExcelEndpoint(4, 'Chấm điểm dự án 04', 28),
  createFallbackExcelEndpoint(5, 'Chấm điểm dự án 05', 24),
  createFallbackExcelEndpoint(6, 'Chấm điểm dự án 06', 24),
  createFallbackExcelEndpoint(7, 'Chấm điểm dự án 07', 24),
  createFallbackExcelEndpoint(8, 'Chấm điểm dự án 08', 24),
  createFallbackExcelEndpoint(9, 'Chấm điểm dự án 09', 32),
  createFallbackExcelEndpoint(10, 'Chấm điểm dự án 10', 24),
  createFallbackExcelEndpoint(11, 'Chấm điểm dự án 11', 24),
];

const mergeEndpointFallback = (items: GradingEndpointInfo[]): GradingEndpointInfo[] => {
  const map = new Map<string, GradingEndpointInfo>();

  items.forEach((item) => {
    if (!item?.endpoint) return;
    map.set(item.endpoint.toLowerCase(), item);
  });

  fallbackGradingEndpoints.forEach((item) => {
    const key = item.endpoint.toLowerCase();
    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName, 'vi', { numeric: true, sensitivity: 'base' })
  );
};

const normalizeProjectEndpoint = (endpoint?: string): string | undefined => {
  if (!endpoint) return endpoint;

  let normalized = endpoint.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  normalized = normalized.replace(/^api\/grading\//i, '').replace(/^grading\//i, '');

  const projectMatch = normalized.match(/^project(\d{1,2})$/i);
  if (projectMatch) {
    return `excel/project${projectMatch[1].padStart(2, '0')}`;
  }

  const excelMatch = normalized.match(/^excel\/project(\d{1,2})$/i);
  if (excelMatch) {
    return `excel/project${excelMatch[1].padStart(2, '0')}`;
  }

  return normalized;
};

const normalizeAssignmentEndpoint = <T extends Assignment>(assignment: T): T => ({
  ...assignment,
  gradingApiEndpoint: normalizeProjectEndpoint(assignment.gradingApiEndpoint),
});

export const assignmentService = {
  async getByClass(
    classId: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
    options?: { includeInactive?: boolean }
  ): Promise<Assignment[]> {
    const includeInactive = options?.includeInactive ? 'true' : 'false';
    const response = await authFetch(
      `${API_BASE_URL}/assignment/class/${classId}?includeInactive=${includeInactive}`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Không thể lấy danh sách bài tập');
    }

    const data = (await response.json()) as Assignment[];
    return data.map(normalizeAssignmentEndpoint);
  },

  async getByClassWithStats(
    classId: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<AssignmentWithStats[]> {
    const response = await authFetch(
      `${API_BASE_URL}/assignment/class/${classId}/stats`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Không thể lấy danh sách bài tập kèm thống kê');
    }

    const data = (await response.json()) as AssignmentWithStats[];
    return data.map((item) => normalizeAssignmentEndpoint(item as AssignmentWithStats));
  },

  async getById(
    id: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<Assignment> {
    const response = await authFetch(
      `${API_BASE_URL}/assignment/${id}`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Không thể lấy thông tin bài tập');
    }

    const data = (await response.json()) as Assignment;
    return normalizeAssignmentEndpoint(data);
  },

  async create(
    payload: CreateAssignmentRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<Assignment> {
    const response = await authFetch(
      `${API_BASE_URL}/assignment`,
      { method: 'POST', headers: jsonHeaders, body: JSON.stringify(payload) },
      getAccessToken
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Không thể tạo bài tập');
    }

    const assignment = (await response.json()) as Assignment;
    return normalizeAssignmentEndpoint(assignment);
  },

  async update(
    id: string,
    payload: UpdateAssignmentRequest,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<Assignment> {
    const response = await authFetch(
      `${API_BASE_URL}/assignment/${id}`,
      { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(payload) },
      getAccessToken
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Không thể cập nhật bài tập');
    }

    const assignment = (await response.json()) as Assignment;
    return normalizeAssignmentEndpoint(assignment);
  },

  async delete(
    id: string,
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<void> {
    const response = await authFetch(
      `${API_BASE_URL}/assignment/${id}`,
      { method: 'DELETE', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      throw new Error('Không thể xóa bài tập');
    }
  },

  async getGradingEndpoints(
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<GradingEndpointInfo[]> {
    try {
      const response = await authFetch(
        `${API_BASE_URL}/assignment/grading-endpoints`,
        { method: 'GET', headers: jsonHeaders },
        getAccessToken
      );

      if (!response.ok) {
        return fallbackGradingEndpoints;
      }

      const data = (await response.json()) as GradingEndpointInfo[];
      const normalized = (data || []).map((item) => ({
        ...item,
        endpoint: normalizeProjectEndpoint(item.endpoint) || item.endpoint,
      }));
      return mergeEndpointFallback(normalized);
    } catch {
      return fallbackGradingEndpoints;
    }
  },
};
