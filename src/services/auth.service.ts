import { AUTH_API_BASE_URL } from "../config/api";
import type {
	ChangePasswordRequest,
	PermissionCatalogResponse,
	ProfileResponse,
	SetPasswordRequest,
	TeacherApprovalDecisionRequest,
	TeacherApprovalRequest,
	TeacherSummary,
	UpdateProfileRequest,
	UpdateTeacherPermissionsRequest,
	UserSession,
} from "../types/auth.types";
import { authFetch } from "./auth-fetch";

const jsonHeaders = { "Content-Type": "application/json" };

const parseErrorMessage = async (
	response: Response,
	fallback: string,
): Promise<string> => {
	const errorData = await response.json().catch(() => null);
	return errorData?.message || fallback;
};

class AuthService {
	async getSessions(
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<UserSession[]> {
		const response = await authFetch(
			`${AUTH_API_BASE_URL}/sessions`,
			{ method: "GET", headers: jsonHeaders },
			getAccessToken,
		);
		if (!response.ok)
			throw new Error(
				await parseErrorMessage(response, "Không thể tải thiết bị đăng nhập"),
			);
		return response.json();
	}

	async revokeSession(
		sessionId: string,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<void> {
		const response = await authFetch(
			`${AUTH_API_BASE_URL}/sessions/${encodeURIComponent(sessionId)}`,
			{ method: "DELETE", headers: jsonHeaders },
			getAccessToken,
		);
		if (!response.ok)
			throw new Error(
				await parseErrorMessage(response, "Không thể đăng xuất thiết bị"),
			);
	}

	async revokeOtherSessions(
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<number> {
		const response = await authFetch(
			`${AUTH_API_BASE_URL}/sessions/revoke-others`,
			{ method: "POST", headers: jsonHeaders },
			getAccessToken,
		);
		if (!response.ok)
			throw new Error(
				await parseErrorMessage(
					response,
					"Không thể đăng xuất các thiết bị khác",
				),
			);
		const data = (await response.json()) as { revokedCount?: number };
		return data.revokedCount ?? 0;
	}

	async getTeachers(
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
		includeInactive = false,
	): Promise<TeacherSummary[]> {
		const query = includeInactive ? "?includeInactive=true" : "";
		const response = await authFetch(
			`${AUTH_API_BASE_URL}/teachers${query}`,
			{
				method: "GET",
				headers: jsonHeaders,
			},
			getAccessToken,
		);

		if (!response.ok) {
			const message = await parseErrorMessage(
				response,
				"Không thể lấy danh sách giáo viên",
			);
			throw new Error(message);
		}

		return response.json();
	}

	async updateCurrentUserProfile(
		data: UpdateProfileRequest,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<ProfileResponse> {
		const response = await authFetch(
			`${AUTH_API_BASE_URL}/me`,
			{
				method: "PUT",
				headers: jsonHeaders,
				body: JSON.stringify(data),
			},
			getAccessToken,
		);

		if (!response.ok) {
			const message = await parseErrorMessage(
				response,
				"Không thể cập nhật thông tin tài khoản",
			);
			throw new Error(message);
		}

		return response.json();
	}

	async getPermissionCatalog(
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<PermissionCatalogResponse> {
		const response = await authFetch(
			`${AUTH_API_BASE_URL}/permissions`,
			{
				method: "GET",
				headers: jsonHeaders,
			},
			getAccessToken,
		);

		if (!response.ok) {
			const message = await parseErrorMessage(
				response,
				"Không thể lấy danh mục phân quyền",
			);
			throw new Error(message);
		}

		return response.json();
	}

	async getTeacherRequests(
		status: "pending" | "approved" | "rejected" | "all",
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<TeacherApprovalRequest[]> {
		const response = await authFetch(
			`${AUTH_API_BASE_URL}/teacher-requests?status=${encodeURIComponent(status)}`,
			{
				method: "GET",
				headers: jsonHeaders,
			},
			getAccessToken,
		);

		if (!response.ok) {
			const message = await parseErrorMessage(
				response,
				"Không thể lấy danh sách yêu cầu giáo viên",
			);
			throw new Error(message);
		}

		return response.json();
	}

	async decideTeacherRequest(
		userId: string,
		data: TeacherApprovalDecisionRequest,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<TeacherApprovalRequest> {
		const response = await authFetch(
			`${AUTH_API_BASE_URL}/teacher-requests/${userId}/decision`,
			{
				method: "PUT",
				headers: jsonHeaders,
				body: JSON.stringify(data),
			},
			getAccessToken,
		);

		if (!response.ok) {
			const message = await parseErrorMessage(
				response,
				"Không thể xử lý yêu cầu giáo viên",
			);
			throw new Error(message);
		}

		return response.json();
	}

	async updateTeacherPermissions(
		teacherId: string,
		data: UpdateTeacherPermissionsRequest,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<TeacherSummary> {
		const response = await authFetch(
			`${AUTH_API_BASE_URL}/teachers/${teacherId}/permissions`,
			{
				method: "PUT",
				headers: jsonHeaders,
				body: JSON.stringify(data),
			},
			getAccessToken,
		);

		if (!response.ok) {
			const message = await parseErrorMessage(
				response,
				"Không thể cập nhật phân quyền giáo viên",
			);
			throw new Error(message);
		}

		return response.json();
	}

	async changePassword(
		data: ChangePasswordRequest,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<{ message: string }> {
		const response = await authFetch(
			`${AUTH_API_BASE_URL}/change-password`,
			{
				method: "POST",
				headers: jsonHeaders,
				body: JSON.stringify(data),
			},
			getAccessToken,
		);

		if (!response.ok) {
			const message = await parseErrorMessage(
				response,
				"Không thể đổi mật khẩu",
			);
			throw new Error(message);
		}

		return response.json();
	}

	async setPassword(
		data: SetPasswordRequest,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<{ message: string }> {
		const response = await authFetch(
			`${AUTH_API_BASE_URL}/set-password`,
			{
				method: "POST",
				headers: jsonHeaders,
				body: JSON.stringify(data),
			},
			getAccessToken,
		);

		if (!response.ok) {
			const message = await parseErrorMessage(
				response,
				"Không thể thiết lập mật khẩu",
			);
			throw new Error(message);
		}

		return response.json();
	}
}

export const authService = new AuthService();
