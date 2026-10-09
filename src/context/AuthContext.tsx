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
const LEGACY_REFRESH_TOKEN_KEY = "refreshToken";
const SESSION_INVALIDATION_BROADCAST_KEY = "auth_session_invalidated";
const SESSION_ENDED_NOTICE_KEY = "auth_session_ended_notice";
const SESSION_ENDED_MESSAGE =
	"Phiên đăng nhập đã kết thúc hoặc bạn đã bị đăng xuất từ thiết bị khác. Vui lòng đăng nhập lại.";
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
	localStorage.removeItem("accessToken");
	localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
	localStorage.removeItem("user");
};

const getInitialUser = (): User | null => {
	const savedUser = localStorage.getItem("user");
	if (!savedUser) return null;
	try {
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
	const tabIdRef = useRef(
		crypto.randomUUID?.() ?? `${Date.now()}_${Math.random()}`,
	);

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
		localStorage.setItem(
			REFRESH_LOCK_KEY,
			JSON.stringify({
				owner,
				expiresAt: now + REFRESH_LOCK_TTL_MS,
			}),
		);
		return true;
	};

	const releaseRefreshLock = (owner: string) => {
		try {
			const lock = JSON.parse(
				localStorage.getItem(REFRESH_LOCK_KEY) || "{}",
			) as { owner?: string };
			if (lock.owner === owner) localStorage.removeItem(REFRESH_LOCK_KEY);
		} catch {
			localStorage.removeItem(REFRESH_LOCK_KEY);
		}
	};

	const waitForRefresh = (generation: number) =>
		new Promise<string | null>((resolve) => {
			const startedAt = Date.now();
			let intervalId = 0;
			const finish = (token: string | null) => {
				window.removeEventListener("storage", onStorage);
				window.clearInterval(intervalId);
				resolve(token);
			};
			const check = () => {
				if (generation !== authGenerationRef.current) {
					finish(null);
					return;
				}
				const token = localStorage.getItem("accessToken");
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
					["accessToken", REFRESH_BROADCAST_KEY, REFRESH_LOCK_KEY].includes(
						event.key || "",
					)
				)
					check();
			};
			window.addEventListener("storage", onStorage);
			intervalId = window.setInterval(check, 250);
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
		const currentToken = localStorage.getItem("accessToken");
		if (!forceRefresh && currentToken && !isTokenExpired(currentToken))
			return currentToken;
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
				const legacyRefreshToken = localStorage.getItem(
					LEGACY_REFRESH_TOKEN_KEY,
				);
				const response = await fetch(`${AUTH_API_BASE_URL}/refresh-token`, {
					method: "POST",
					credentials: "include",
					signal: controller.signal,
					headers: { "Content-Type": "application/json" },
					body: legacyRefreshToken
						? JSON.stringify({ refreshToken: legacyRefreshToken })
						: "{}",
				});
				if (generation !== authGenerationRef.current) return null;
				if (response.status === 401 || response.status === 400) {
					invalidateSession(true, generation);
					return null;
				}
				if (!response.ok) return null;
				const data = (await response.json()) as { accessToken?: string };
				if (generation !== authGenerationRef.current) return null;
				if (!data.accessToken) return null;
				localStorage.setItem("accessToken", data.accessToken);
				localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
				localStorage.setItem(
					REFRESH_BROADCAST_KEY,
					JSON.stringify({ at: Date.now(), by: tabIdRef.current }),
				);
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
			if (broadcast)
				localStorage.setItem(
					SESSION_INVALIDATION_BROADCAST_KEY,
					String(Date.now()),
				);
			sessionStorage.setItem(SESSION_ENDED_NOTICE_KEY, SESSION_ENDED_MESSAGE);
		} catch {
			// Ignore unavailable session storage; the redirect still protects the app.
		}
		setUser(null);
	};

	const getAccessToken = (forceRefresh = false) =>
		refreshAccessToken(forceRefresh);
	const login = (userData: User, accessToken: string) => {
		advanceAuthGeneration();
		localStorage.setItem("accessToken", accessToken);
		localStorage.removeItem(LEGACY_REFRESH_TOKEN_KEY);
		localStorage.setItem("user", JSON.stringify(userData));
		try {
			sessionStorage.removeItem(SESSION_ENDED_NOTICE_KEY);
		} catch {
			// Ignore unavailable session storage.
		}
		setUser(userData);
		scheduleProactiveRefresh(accessToken);
	};
	const updateUser = (userData: Partial<User>) =>
		setUser((previous) => {
			if (!previous) return previous;
			const next = { ...previous, ...userData };
			localStorage.setItem("user", JSON.stringify(next));
			return next;
		});
	const logout = () => {
		const accessToken = localStorage.getItem("accessToken");
		advanceAuthGeneration();
		clearSession();
		setUser(null);
		if (proactiveTimerRef.current)
			window.clearTimeout(proactiveTimerRef.current);
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
		const initialize = async () => {
			const savedUser = getInitialUser();
			if (!savedUser) {
				if (mounted) setLoading(false);
				return;
			}
			setUser(savedUser);
			await refreshAccessToken(true);
			if (mounted) setLoading(false);
		};
		const refreshWhenActive = () => {
			if (document.visibilityState === "visible") void getAccessToken(true);
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
		};
	}, []);

	return (
		<AuthContext.Provider
			value={{ user, login, updateUser, logout, loading, getAccessToken }}
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
