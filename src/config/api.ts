const defaultBaseUrl = 'https://localhost:7223/api';

const normalizeBaseUrl = (rawValue?: string): string => {
  const trimmed = rawValue?.trim();
  if (!trimmed) {
    return defaultBaseUrl;
  }

  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  if (withoutTrailingSlash.endsWith('/api')) {
    return withoutTrailingSlash;
  }

  return `${withoutTrailingSlash}/api`;
};

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');
export const AUTH_API_BASE_URL = `${API_BASE_URL}/auth`;
