export type AccessTokenGetter = (
	forceRefresh?: boolean,
) => Promise<string | null>;

const AUTH_FETCH_TIMEOUT_MS = 12_000;

export class AuthFetchTimeoutError extends Error {
	constructor() {
		super("Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.");
		this.name = "AuthFetchTimeoutError";
	}
}

export const authFetch = async (
	input: RequestInfo | URL,
	init: RequestInit = {},
	getAccessToken: AccessTokenGetter,
): Promise<Response> => {
	const controller = new AbortController();
	const timeoutId = window.setTimeout(
		() => controller.abort(new AuthFetchTimeoutError()),
		AUTH_FETCH_TIMEOUT_MS,
	);
	const requestSignal = init.signal;
	const abortFromCaller = () => controller.abort(requestSignal?.reason);
	if (requestSignal) {
		if (requestSignal.aborted) abortFromCaller();
		else
			requestSignal.addEventListener("abort", abortFromCaller, { once: true });
	}
	const throwIfAborted = () => {
		if (!controller.signal.aborted) return;
		throw controller.signal.reason instanceof Error
			? controller.signal.reason
			: new DOMException("The request was aborted.", "AbortError");
	};
	const execute = async (token: string | null): Promise<Response> => {
		const headers = new Headers(init.headers || {});
		if (token) {
			headers.set("Authorization", `Bearer ${token}`);
		}

		return fetch(input, {
			...init,
			headers,
			signal: controller.signal,
			credentials: "include",
		});
	};

	try {
		const currentToken = await getAccessToken(false);
		throwIfAborted();
		let response = await execute(currentToken);

		if (response.status !== 401) return response;

		const refreshedToken = await getAccessToken(true);
		throwIfAborted();
		if (!refreshedToken) return response;

		response = await execute(refreshedToken);
		return response;
	} catch (error) {
		if (controller.signal.reason instanceof AuthFetchTimeoutError)
			throw controller.signal.reason;
		throw error;
	} finally {
		window.clearTimeout(timeoutId);
		requestSignal?.removeEventListener("abort", abortFromCaller);
	}
};
