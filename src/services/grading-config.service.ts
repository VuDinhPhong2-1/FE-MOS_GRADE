import { API_BASE_URL } from '../config/api';
import type {
  GradingConfigDetail,
  GradingConfigListItem,
  GradingConfigTestRun,
  GradingConfigVersion,
  GradingRuleType,
  ImportGradingConfigFromCodeRequest,
  PublishGradingConfigRequest,
  RestoreGradingConfigVersionRequest,
  UpdateGradingConfigRequest,
} from '../types/grading-config.types';
import { authFetch, type AccessTokenGetter } from './auth-fetch';
import type { GradingResult } from '../types';

const GRADING_CONFIG_API_BASE_URL = `${API_BASE_URL}/admin/grading-configs`;
const jsonHeaders = { 'Content-Type': 'application/json' };

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

  return `HTTP ${response.status}: Không thể xử lý grading config`;
};

const ensureOk = async (response: Response): Promise<void> => {
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
};

export const gradingConfigService = {
  async getAll(
    getAccessToken: AccessTokenGetter,
    filters?: { subject?: string; status?: string }
  ): Promise<GradingConfigListItem[]> {
    const query = new URLSearchParams();
    if (filters?.subject) query.set('subject', filters.subject);
    if (filters?.status) query.set('status', filters.status);

    const response = await authFetch(
      `${GRADING_CONFIG_API_BASE_URL}${query.toString() ? `?${query.toString()}` : ''}`,
      { method: 'GET' },
      getAccessToken
    );

    await ensureOk(response);
    return response.json();
  },

  async getById(id: string, getAccessToken: AccessTokenGetter): Promise<GradingConfigDetail> {
    const response = await authFetch(`${GRADING_CONFIG_API_BASE_URL}/${id}`, { method: 'GET' }, getAccessToken);
    await ensureOk(response);
    return response.json();
  },

  async getActiveByEndpoint(
    gradingApiEndpoint: string,
    getAccessToken: AccessTokenGetter
  ): Promise<GradingConfigDetail> {
    const query = new URLSearchParams({ gradingApiEndpoint });
    const response = await authFetch(
      `${GRADING_CONFIG_API_BASE_URL}/active?${query.toString()}`,
      { method: 'GET' },
      getAccessToken
    );

    await ensureOk(response);
    return response.json();
  },

  async getRuleTypes(getAccessToken: AccessTokenGetter): Promise<GradingRuleType[]> {
    const response = await authFetch(`${GRADING_CONFIG_API_BASE_URL}/rule-types`, { method: 'GET' }, getAccessToken);
    await ensureOk(response);
    return response.json();
  },

  async importFromCode(
    request: ImportGradingConfigFromCodeRequest,
    getAccessToken: AccessTokenGetter
  ): Promise<GradingConfigDetail> {
    const response = await authFetch(
      `${GRADING_CONFIG_API_BASE_URL}/import-from-code`,
      {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(request),
      },
      getAccessToken
    );

    await ensureOk(response);
    return response.json();
  },

  async update(
    id: string,
    request: UpdateGradingConfigRequest,
    getAccessToken: AccessTokenGetter
  ): Promise<GradingConfigDetail> {
    const response = await authFetch(
      `${GRADING_CONFIG_API_BASE_URL}/${id}`,
      {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify(request),
      },
      getAccessToken
    );

    await ensureOk(response);
    return response.json();
  },

  async publish(
    id: string,
    request: PublishGradingConfigRequest,
    getAccessToken: AccessTokenGetter
  ): Promise<GradingConfigDetail> {
    const response = await authFetch(
      `${GRADING_CONFIG_API_BASE_URL}/${id}/publish`,
      {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(request),
      },
      getAccessToken
    );

    await ensureOk(response);
    return response.json();
  },

  async getTestRuns(id: string, getAccessToken: AccessTokenGetter): Promise<GradingConfigTestRun[]> {
    const response = await authFetch(
      `${GRADING_CONFIG_API_BASE_URL}/${id}/test-runs`,
      { method: 'GET' },
      getAccessToken
    );

    await ensureOk(response);
    return response.json();
  },

  async testConfig(id: string, studentFile: File, getAccessToken: AccessTokenGetter): Promise<GradingResult> {
    const formData = new FormData();
    formData.append('studentFile', studentFile);

    const response = await authFetch(
      `${GRADING_CONFIG_API_BASE_URL}/${id}/test`,
      {
        method: 'POST',
        body: formData,
      },
      getAccessToken
    );

    await ensureOk(response);
    return response.json();
  },

  async getVersions(id: string, getAccessToken: AccessTokenGetter): Promise<GradingConfigVersion[]> {
    const response = await authFetch(
      `${GRADING_CONFIG_API_BASE_URL}/${id}/versions`,
      { method: 'GET' },
      getAccessToken
    );

    await ensureOk(response);
    return response.json();
  },

  async getVersionSnapshot(
    id: string,
    version: number,
    getAccessToken: AccessTokenGetter
  ): Promise<GradingConfigDetail> {
    const response = await authFetch(
      `${GRADING_CONFIG_API_BASE_URL}/${id}/versions/${version}`,
      { method: 'GET' },
      getAccessToken
    );

    await ensureOk(response);
    return response.json();
  },

  async restoreVersion(
    id: string,
    version: number,
    request: RestoreGradingConfigVersionRequest,
    getAccessToken: AccessTokenGetter
  ): Promise<GradingConfigDetail> {
    const response = await authFetch(
      `${GRADING_CONFIG_API_BASE_URL}/${id}/versions/${version}/restore`,
      {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify(request),
      },
      getAccessToken
    );

    await ensureOk(response);
    return response.json();
  },
};