export type AccessTokenGetter = (forceRefresh?: boolean) => Promise<string | null>;

export const authFetch = async (
  input: RequestInfo | URL,
  init: RequestInit = {},
  getAccessToken: AccessTokenGetter
): Promise<Response> => {
  const execute = async (token: string | null): Promise<Response> => {
    const headers = new Headers(init.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(input, {
      ...init,
      headers,
    });
  };

  const currentToken = await getAccessToken(false);
  let response = await execute(currentToken);

  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await getAccessToken(true);
  if (!refreshedToken) {
    return response;
  }

  response = await execute(refreshedToken);
  return response;
};
