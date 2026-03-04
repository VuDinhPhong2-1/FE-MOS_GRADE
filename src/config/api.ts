const defaultLocalOrigin = 'https://localhost:7223';

type ApiTarget = 'local' | 'deploy';

const normalizeBaseUrl = (rawValue?: string): string => {
  const trimmed = rawValue?.trim();
  if (!trimmed) {
    return `${defaultLocalOrigin}/api`;
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  if (withoutTrailingSlash.endsWith('/api')) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/api`;
};

const normalizeTarget = (rawValue?: string): ApiTarget => {
  const value = (rawValue || '').trim().toLowerCase();
  return value === 'deploy' ? 'deploy' : 'local';
};

const resolveBaseUrl = (): string => {
  const explicit = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (explicit?.trim()) {
    return normalizeBaseUrl(explicit);
  }

  const target = normalizeTarget(import.meta.env.VITE_API_TARGET as string | undefined);
  const localUrl = import.meta.env.VITE_API_LOCAL_URL as string | undefined;
  const deployUrl = import.meta.env.VITE_API_DEPLOY_URL as string | undefined;

  if (target === 'deploy' && deployUrl?.trim()) {
    return normalizeBaseUrl(deployUrl);
  }

  if (target === 'local' && localUrl?.trim()) {
    return normalizeBaseUrl(localUrl);
  }

  return normalizeBaseUrl(defaultLocalOrigin);
};

export const API_TARGET = normalizeTarget(import.meta.env.VITE_API_TARGET as string | undefined);
export const API_BASE_URL = resolveBaseUrl();
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');
export const AUTH_API_BASE_URL = `${API_BASE_URL}/auth`;
