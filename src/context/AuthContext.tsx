/* eslint-disable react-refresh/only-export-components */

import { jwtDecode } from "jwt-decode";
import type { ReactNode } from "react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { RouteLoadingFallback } from "../components/common";
import { AUTH_API_BASE_URL } from "../config/api";
import type { AuthContextType, User } from "../types/auth.types";

interface JwtPayload {
	exp?: number;
}
interface AuthProviderProps {
	children: ReactNode;
}

const REFRESH_EARLY_MS = 5 * 60 * 1000;
const REFRESH_LOCK_KEY = "auth_refresh_lock";
const REFRESH_BROADCAST_KEY = "auth_refresh_broadcast";
const REFRESH_LOCK_TTL_MS = 12_000;
const REFRESH_WAIT_TIMEOUT_MS = 12_500;
const REFRESH_REQUEST_TIMEOUT_MS = 10_000;
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const USER_KEY = "user";
const AUTH_SYNC_CHANNEL = "mos_auth_sync_channel";
const SESSION_INVALIDATION_BROADCAST_KEY = "auth_session_invalidated";
const SESSION_ENDED_NOTICE_KEY = "auth_session_ended_notice";
const SESSION_ENDED_MESSAGE =
	"Phiên đăng nhập đã kết thúc hoặc bạn đã bị đăng xuất từ thiết bị khác. Vui lòng đăng nhập lại.";

type AuthSyncMessage =
	| {
			type: "LOGIN";
			user: User;
			accessToken: string;
			refreshToken: string;
			fromTabId: string;
	  }
	| {
			type: "TOKEN_REFRESH";
			accessToken: string;
			refreshToken?: string;
			fromTabId: string;
	  }
	| { type: "UPDATE_USER"; user: User; fromTabId: string }
	| { type: "LOGOUT"; fromTabId: string }
	| { type: "INVALIDATE_SESSION"; fromTabId: string }
	| { type: "REQUEST_SESSION"; fromTabId: string }
	| {
			type: "SESSION_SYNC";
			user: User;
			accessToken: string;
			refreshToken: string;
			fromTabId: string;
	  };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface RefreshRequest {
	id: string;
	generation: number;
	controller: AbortController;
	promise: Promise<string | null>;
}

const getTokenExpiryMs = (token: string | null): number | null => {
	if (!token) return null;
	try {
		const { exp } = jwtDecode<JwtPayload>(token);
		return exp ? exp * 1000 : null;
	} catch {
		return null;
	}
};

const isTokenExpired = (token: string | null) => {
	const expiryMs = getTokenExpiryMs(token);
	return !expiryMs || expiryMs <= Date.now();
};

const clearSession = () => {
	try {
		sessionStorage.removeItem(ACCESS_TOKEN_KEY);
		sessionStorage.removeItem(REFRESH_TOKEN_KEY);
		sessionStorage.removeItem(USER_KEY);
	} catch {
		// Ignore storage errors.
	}
	try {
		localStorage.removeItem(ACCESS_TOKEN_KEY);
		localStorage.removeItem(REFRESH_TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
	} catch {
		// Ignore storage errors.
	}
};

const getInitialUser = (): User | null => {
	try {
		let savedUser = sessionStorage.getItem(USER_KEY);
		if (!savedUser) {
			const legacyUser = localStorage.getItem(USER_KEY);
			if (legacyUser) {
				savedUser = legacyUser;
				sessionStorage.setItem(USER_KEY, legacyUser);
				const legacyAccess = localStorage.getItem(ACCESS_TOKEN_KEY);
				if (legacyAccess) sessionStorage.setItem(ACCESS_TOKEN_KEY, legacyAccess);
				const legacyRefresh = localStorage.getItem(REFRESH_TOKEN_KEY);
				if (legacyRefresh)
					sessionStorage.setItem(REFRESH_TOKEN_KEY, legacyRefresh);
				localStorage.removeItem(ACCESS_TOKEN_KEY);
				localStorage.removeItem(REFRESH_TOKEN_KEY);
				localStorage.removeItem(USER_KEY);
			}
		}
		if (!savedUser) return null;
		return JSON.parse(savedUser) as User;
	} catch {
		clearSession();
		return null;
	}
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
	const [user, setUser] = useState<User | null>(() => getInitialUser());
	const [loading, setLoading] = useState(() => {
		const savedUser = getInitialUser();
		return Boolean(savedUser);
	});
	const authGenerationRef = useRef(0);
	const refreshRequestRef = useRef<RefreshRequest | null>(null);
	const refreshRequestSequenceRef = useRef(0);
	const proactiveTimerRef = useRef<number | null>(null);
	const channelRef = useRef<BroadcastChannel | null>(null);
	const tabIdRef = useRef(
		crypto.randomUUID?.() ?? `${Date.now()}_${Math.random()}`,
	);

	const broadcastMessage = (
		msg:
			| {
					type: "LOGIN";
					user: User;
					accessToken: string;
					refreshToken: string;
			  }
			| {
					type: "TOKEN_REFRESH";
					accessToken: string;
					refreshToken?: string;
			  }
			| { type: "UPDATE_USER"; user: User }
			| { type: "LOGOUT" }
			| { type: "INVALIDATE_SESSION" }
			| { type: "REQUEST_SESSION" }
			| {
					type: "SESSION_SYNC";
					user: User;
					accessToken: string;
					refreshToken: string;
			  },
	) => {
		try {
			channelRef.current?.postMessage({
				...msg,
				fromTabId: tabIdRef.current,
			} as AuthSyncMessage);
		} catch {
			// Ignore if channel is closed.
		}
	};

	const scheduleProactiveRefresh = (token: string | null) => {
		if (proactiveTimerRef.current)
			window.clearTimeout(proactiveTimerRef.current);
		const expiryMs = getTokenExpiryMs(token);
		if (!expiryMs) return;
		proactiveTimerRef.current = window.setTimeout(
			() => void getAccessToken(true),
			Math.max(0, expiryMs - Date.now() - REFRESH_EARLY_MS),
		);
	};

	const acquireRefreshLock = (owner: string) => {
		const now = Date.now();
		try {
			const raw = localStorage.getItem(REFRESH_LOCK_KEY);
			const lock = raw
				? (JSON.parse(raw) as { owner?: string; expiresAt?: number })
				: null;
			if (lock?.owner && lock.owner !== owner && (lock.expiresAt ?? 0) > now)
				return false;
		} catch {
			/* replace malformed lock */
		}
		try {
			localStorage.setItem(
				REFRESH_LOCK_KEY,
				JSON.stringify({
					owner,
					expiresAt: now + REFRESH_LOCK_TTL_MS,
				}),
			);
		} catch {
			// Ignore lock write failure.
		}
		return true;
	};

	const releaseRefreshLock = (owner: string) => {
		try {
			const lock = JSON.parse(
				localStorage.getItem(REFRESH_LOCK_KEY) || "{}",
			) as { owner?: string };
			if (lock.owner === owner) localStorage.removeItem(REFRESH_LOCK_KEY);
		} catch {
			try {
				localStorage.removeItem(REFRESH_LOCK_KEY);
			} catch {
				// Ignore storage errors.
			}
		}
	};

	const waitForRefresh = (generation: number) =>
		new Promise<string | null>((resolve) => {
			const startedAt = Date.now();
			let intervalId = 0;
			let resolved = false;
			const finish = (token: string | null) => {
				if (resolved) return;
				resolved = true;
				window.removeEventListener("storage", onStorage);
				window.clearInterval(intervalId);
				resolve(token);
			};
			const check = () => {
				if (generation !== authGenerationRef.current) {
					finish(null);
					return;
				}
				const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
				if (token && !isTokenExpired(token)) finish(token);
				else if (Date.now() - startedAt >= REFRESH_WAIT_TIMEOUT_MS)
					finish(null);
			};
			const onStorage = (event: StorageEvent) => {
				if (event.key === SESSION_INVALIDATION_BROADCAST_KEY) {
					finish(null);
					return;
				}
				if (
					[REFRESH_BROADCAST_KEY, REFRESH_LOCK_KEY].includes(event.key || "")
				)
					check();
			};
			window.addEventListener("storage", onStorage);
			intervalId = window.setInterval(check, 200);
			check();
		});

	const cancelRefreshRequest = () => {
		refreshRequestRef.current?.controller.abort();
		refreshRequestRef.current = null;
	};

	const advanceAuthGeneration = () => {
		authGenerationRef.current += 1;
		cancelRefreshRequest();
		return authGenerationRef.current;
	};

	const refreshAccessToken = async (
		forceRefresh = false,
	): Promise<string | null> => {
		if (refreshRequestRef.current) return refreshRequestRef.current.promise;
		const currentToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
		if (!forceRefresh && currentToken && !isTokenExpired(currentToken))
			return currentToken;
		const currentRefreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
		if (!currentRefreshToken) {
			if (!currentToken || isTokenExpired(currentToken)) {
				invalidateSession(true, authGenerationRef.current);
			}
			return null;
		}
		const generation = authGenerationRef.current;
		const requestId = `${tabIdRef.current}:${++refreshRequestSequenceRef.current}`;
		const lockOwner = requestId;
		const controller = new AbortController();
		const timeoutId = window.setTimeout(
			() => controller.abort(),
			REFRESH_REQUEST_TIMEOUT_MS,
		);
		let acquiredLock = false;
		const promise = (async () => {
			await Promise.resolve();
			try {
				acquiredLock = acquireRefreshLock(lockOwner);
				if (!acquiredLock) return await waitForRefresh(generation);
				const refreshTokenToSend = sessionStorage.getItem(REFRESH_TOKEN_KEY);
				if (!refreshTokenToSend) {
					const latestToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
					if (!latestToken || isTokenExpired(latestToken)) {
						invalidateSession(true, generation);
					}
					return null;
				}
				const response = await fetch(`${AUTH_API_BASE_URL}/refresh-token`, {
					method: "POST",
					credentials: "include",
					signal: controller.signal,
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ refreshToken: refreshTokenToSend }),
				});
				if (generation !== authGenerationRef.current) return null;
				if (response.status === 401 || response.status === 400) {
					invalidateSession(true, generation);
					return null;
				}
				if (!response.ok) return null;
				const data = (await response.json()) as {
					accessToken?: string;
					refreshToken?: string;
				};
				if (generation !== authGenerationRef.current) return null;
				if (!data.accessToken) return null;
				sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
				if (data.refreshToken) {
					sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
				}
				try {
					localStorage.setItem(
						REFRESH_BROADCAST_KEY,
						JSON.stringify({ at: Date.now(), by: tabIdRef.current }),
					);
				} catch {
					// Ignore storage errors.
				}
				broadcastMessage({
					type: "TOKEN_REFRESH",
					accessToken: data.accessToken,
					refreshToken: data.refreshToken,
				});
				scheduleProactiveRefresh(data.accessToken);
				return data.accessToken;
			} catch {
				return null;
			} finally {
				window.clearTimeout(timeoutId);
				if (acquiredLock) releaseRefreshLock(lockOwner);
				if (refreshRequestRef.current?.id === requestId)
					refreshRequestRef.current = null;
			}
		})();
		refreshRequestRef.current = {
			id: requestId,
			generation,
			controller,
			promise,
		};
		return promise;
	};

	const invalidateSession = (broadcast = true, generation?: number) => {
		if (generation !== undefined && generation !== authGenerationRef.current)
			return;
		advanceAuthGeneration();
		clearSession();
		if (proactiveTimerRef.current)
			window.clearTimeout(proactiveTimerRef.current);
		proactiveTimerRef.current = null;
		try {
			sessionStorage.setItem(SESSION_ENDED_NOTICE_KEY, SESSION_ENDED_MESSAGE);
		} catch {
			// Ignore unavailable session storage; the redirect still protects the app.
		}
		if (broadcast) {
			broadcastMessage({ type: "INVALIDATE_SESSION" });
			try {
				localStorage.setItem(
					SESSION_INVALIDATION_BROADCAST_KEY,
					String(Date.now()),
				);
			} catch {
				// Ignore storage errors.
			}
		}
		setUser(null);
	};

	const getAccessToken = (forceRefresh = false) =>
		refreshAccessToken(forceRefresh);
	const login = (
		userData: User,
		accessToken: string,
		refreshToken: string,
	) => {
		advanceAuthGeneration();
		sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
		sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
		sessionStorage.setItem(USER_KEY, JSON.stringify(userData));
		try {
			localStorage.removeItem(ACCESS_TOKEN_KEY);
			localStorage.removeItem(REFRESH_TOKEN_KEY);
			localStorage.removeItem(USER_KEY);
		} catch {
			// Ignore storage errors.
		}
		try {
			sessionStorage.removeItem(SESSION_ENDED_NOTICE_KEY);
		} catch {
			// Ignore unavailable session storage.
		}
		setUser(userData);
		scheduleProactiveRefresh(accessToken);
		broadcastMessage({
			type: "LOGIN",
			user: userData,
			accessToken,
			refreshToken,
		});
	};
	const updateUser = (userData: Partial<User>) =>
		setUser((previous) => {
			if (!previous) return previous;
			const next = { ...previous, ...userData };
			sessionStorage.setItem(USER_KEY, JSON.stringify(next));
			broadcastMessage({
				type: "UPDATE_USER",
				user: next,
			});
			return next;
		});
	const logout = () => {
		const accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
		advanceAuthGeneration();
		clearSession();
		setUser(null);
		if (proactiveTimerRef.current)
			window.clearTimeout(proactiveTimerRef.current);
		broadcastMessage({ type: "LOGOUT" });
		void fetch(`${AUTH_API_BASE_URL}/logout`, {
			method: "POST",
			credentials: "include",
			headers: accessToken
				? { Authorization: `Bearer ${accessToken}` }
				: undefined,
		});
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: Initialize the persisted session once per app mount.
	useEffect(() => {
		let mounted = true;
		if (typeof BroadcastChannel !== "undefined") {
			try {
				const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL);
				channelRef.current = channel;
				channel.onmessage = (event: MessageEvent<AuthSyncMessage>) => {
					const data = event.data;
					if (!data || data.fromTabId === tabIdRef.current) return;
					if (data.type === "LOGIN" || data.type === "SESSION_SYNC") {
						sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
						sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
						sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
						if (mounted) {
							setUser(data.user);
							scheduleProactiveRefresh(data.accessToken);
						}
					} else if (data.type === "TOKEN_REFRESH") {
						sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
						if (data.refreshToken) {
							sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
						}
						if (mounted) {
							scheduleProactiveRefresh(data.accessToken);
						}
					} else if (data.type === "UPDATE_USER") {
						sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
						if (mounted) setUser(data.user);
					} else if (data.type === "LOGOUT") {
						advanceAuthGeneration();
						clearSession();
						if (mounted) setUser(null);
					} else if (data.type === "INVALIDATE_SESSION") {
						invalidateSession(false);
					} else if (data.type === "REQUEST_SESSION") {
						const currentToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
						const currentRefresh = sessionStorage.getItem(REFRESH_TOKEN_KEY);
						const currentUser = sessionStorage.getItem(USER_KEY);
						if (currentToken && currentRefresh && currentUser) {
							try {
								const parsedUser = JSON.parse(currentUser) as User;
								broadcastMessage({
									type: "SESSION_SYNC",
									user: parsedUser,
									accessToken: currentToken,
									refreshToken: currentRefresh,
								});
							} catch {
								// Ignore malformed user JSON.
							}
						}
					}
				};
			} catch {
				// BroadcastChannel initialization failed, continue with single-tab session.
			}
		}

		const initialize = async () => {
			let savedUser = getInitialUser();
			if (!savedUser && channelRef.current) {
				broadcastMessage({ type: "REQUEST_SESSION" });
				await new Promise((resolve) => setTimeout(resolve, 120));
				savedUser = getInitialUser();
			}
			if (!savedUser) {
				if (mounted) setLoading(false);
				return;
			}
			setUser(savedUser);
			const currentToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
			if (!currentToken || isTokenExpired(currentToken)) {
				await refreshAccessToken(true);
			} else {
				scheduleProactiveRefresh(currentToken);
			}
			if (mounted) setLoading(false);
		};
		const refreshWhenActive = () => {
			if (document.visibilityState === "visible") void getAccessToken(false);
		};
		void initialize();
		window.addEventListener("online", refreshWhenActive);
		document.addEventListener("visibilitychange", refreshWhenActive);
		const onSessionInvalidated = (event: StorageEvent) => {
			if (event.key === SESSION_INVALIDATION_BROADCAST_KEY)
				invalidateSession(false);
		};
		window.addEventListener("storage", onSessionInvalidated);
		return () => {
			mounted = false;
			window.removeEventListener("online", refreshWhenActive);
			document.removeEventListener("visibilitychange", refreshWhenActive);
			window.removeEventListener("storage", onSessionInvalidated);
			if (proactiveTimerRef.current)
				window.clearTimeout(proactiveTimerRef.current);
			try {
				channelRef.current?.close();
			} catch {
				// Ignore channel close error.
			}
			channelRef.current = null;
		};
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				login,
				updateUser,
				logout,
				loading,
				getAccessToken,
				getRefreshToken: () => sessionStorage.getItem(REFRESH_TOKEN_KEY),
			}}
		>
			{loading ? (
				<RouteLoadingFallback
					fullScreen
					message="Đang khởi tạo phiên làm việc..."
				/>
			) : (
				children
			)}
		</AuthContext.Provider>
	);
};

export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) throw new Error("useAuth must be used within an AuthProvider");
	return context;
};
