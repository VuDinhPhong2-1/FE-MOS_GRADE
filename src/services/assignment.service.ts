import type {
  Assignment,
  AssignmentTemplateResponse,
  AssignmentWithStats,
  CreateAssignmentRequest,
  GradingEndpointInfo,
  UpdateAssignmentRequest,
} from '../types/assignment.types';
import { API_BASE_URL } from '../config/api';
import { authFetch } from './auth-fetch';

const jsonHeaders = { 'Content-Type': 'application/json' };

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

const extractProjectNumber = (assignment: Pick<Assignment, 'gradingApiEndpoint' | 'name'>): number | null => {
  const normalizedEndpoint = normalizeProjectEndpoint(assignment.gradingApiEndpoint);
  const endpointMatch = normalizedEndpoint?.match(/project(\d{1,3})$/i);
  if (endpointMatch) {
    return Number.parseInt(endpointMatch[1], 10);
  }

  const normalizedName = (assignment.name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const nameMatch = normalizedName.match(/(?:project|du an)\s*0*(\d{1,3})/i);
  if (nameMatch) {
    return Number.parseInt(nameMatch[1], 10);
  }

  return null;
};

const compareAssignmentsForDisplay = <T extends Assignment>(left: T, right: T): number => {
  const leftProjectNumber = extractProjectNumber(left);
  const rightProjectNumber = extractProjectNumber(right);

  if (leftProjectNumber !== null && rightProjectNumber !== null && leftProjectNumber !== rightProjectNumber) {
    return leftProjectNumber - rightProjectNumber;
  }

  if (leftProjectNumber !== null && rightProjectNumber === null) return -1;
  if (leftProjectNumber === null && rightProjectNumber !== null) return 1;

  const byName = (left.name || '').localeCompare(right.name || '', 'vi', {
    numeric: true,
    sensitivity: 'base',
  });
  if (byName !== 0) return byName;

  const leftCreatedAt = new Date(left.createdAt || 0).getTime();
  const rightCreatedAt = new Date(right.createdAt || 0).getTime();
  return rightCreatedAt - leftCreatedAt;
};

const sortAssignmentsForDisplay = <T extends Assignment>(items: T[]): T[] =>
  [...items].sort(compareAssignmentsForDisplay);

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
    return sortAssignmentsForDisplay(data.map(normalizeAssignmentEndpoint));
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
    return sortAssignmentsForDisplay(
      data.map((item) => normalizeAssignmentEndpoint(item as AssignmentWithStats))
    );
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
        return [];
      }

      const data = (await response.json()) as GradingEndpointInfo[];
      const normalized = (data || []).map((item) => ({
        ...item,
        endpoint: normalizeProjectEndpoint(item.endpoint) || item.endpoint,
      }));
      return normalized.sort((a, b) =>
        a.displayName.localeCompare(b.displayName, 'vi', { numeric: true, sensitivity: 'base' })
      );
    } catch {
      return [];
    }
  },

  async getTemplates(
    classId: string,
    subject: 'excel' | 'word' | 'ppt',
    examType: 'otth' | 'onthi' | 'gmetrix',
    getAccessToken: (forceRefresh?: boolean) => Promise<string | null>
  ): Promise<AssignmentTemplateResponse[]> {
    const query = new URLSearchParams({
      classId,
      subject,
      examType,
    });

    const response = await authFetch(
      `${API_BASE_URL}/assignment/templates?${query.toString()}`,
      { method: 'GET', headers: jsonHeaders },
      getAccessToken
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.message || 'Không thể lấy mẫu bài tập.');
    }

    return (await response.json()) as AssignmentTemplateResponse[];
  },
};
