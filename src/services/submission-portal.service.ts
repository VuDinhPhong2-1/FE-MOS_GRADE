import { API_BASE_URL } from "../config/api";
import type {
	CreateSubmissionPortalRequest,
	PublicPortalInfo,
	PublicPortalStudent,
	PublicPortalSubmitResult,
	SubmissionAlert,
	SubmissionLeaderboardItem,
	SubmissionLog,
	SubmissionPortal,
	UpdateSubmissionPortalRequest,
} from "../types/submission-portal.types";
import { authFetch } from "./auth-fetch";

const jsonHeaders = { "Content-Type": "application/json" };

const errorMessage = async (response: Response, fallback: string) => {
	try {
		const data = await response.json();
		return data?.message || fallback;
	} catch {
		return fallback;
	}
};

export const submissionPortalService = {
	async getAll(
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	) {
		const res = await authFetch(
			`${API_BASE_URL}/submission-portals`,
			{ headers: jsonHeaders },
			getAccessToken,
		);
		if (!res.ok)
			throw new Error(
				await errorMessage(res, "Không thể lấy danh sách link nộp bài"),
			);
		return res.json() as Promise<SubmissionPortal[]>;
	},

	async create(
		data: CreateSubmissionPortalRequest,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	) {
		const res = await authFetch(
			`${API_BASE_URL}/submission-portals`,
			{ method: "POST", headers: jsonHeaders, body: JSON.stringify(data) },
			getAccessToken,
		);
		if (!res.ok)
			throw new Error(await errorMessage(res, "Không thể tạo link nộp bài"));
		return res.json() as Promise<SubmissionPortal>;
	},

	async update(
		portalId: string,
		data: UpdateSubmissionPortalRequest,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	) {
		const res = await authFetch(
			`${API_BASE_URL}/submission-portals/${portalId}`,
			{ method: "PUT", headers: jsonHeaders, body: JSON.stringify(data) },
			getAccessToken,
		);
		if (!res.ok)
			throw new Error(await errorMessage(res, "Không thể cập nhật link nộp bài"));
		return res.json() as Promise<SubmissionPortal>;
	},

	async delete(
		portalId: string,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	) {
		const res = await authFetch(
			`${API_BASE_URL}/submission-portals/${portalId}`,
			{ method: "DELETE" },
			getAccessToken,
		);
		if (!res.ok)
			throw new Error(await errorMessage(res, "Không thể xóa link nộp bài"));
	},

	async getAlerts(
		portalId: string,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	) {
		const res = await authFetch(
			`${API_BASE_URL}/submission-portals/${portalId}/alerts`,
			{ headers: jsonHeaders },
			getAccessToken,
		);
		if (!res.ok)
			throw new Error(await errorMessage(res, "Không thể lấy cảnh báo"));
		return res.json() as Promise<SubmissionAlert[]>;
	},

	async getLogs(
		portalId: string,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	) {
		const res = await authFetch(
			`${API_BASE_URL}/submission-portals/${portalId}/submission-logs`,
			{ headers: jsonHeaders },
			getAccessToken,
		);
		if (!res.ok)
			throw new Error(await errorMessage(res, "Không thể lấy lịch sử nộp"));
		return res.json() as Promise<SubmissionLog[]>;
	},

	async getPublicInfo(token: string) {
		const res = await fetch(`${API_BASE_URL}/public/portals/${token}`);
		if (!res.ok)
			throw new Error(await errorMessage(res, "Không tìm thấy link nộp bài"));
		return res.json() as Promise<PublicPortalInfo>;
	},

	async getPublicStudents(token: string, classId: string) {
		const res = await fetch(
			`${API_BASE_URL}/public/portals/${token}/classes/${classId}/students`,
		);
		if (!res.ok)
			throw new Error(
				await errorMessage(res, "Không thể lấy danh sách học sinh"),
			);
		return res.json() as Promise<PublicPortalStudent[]>;
	},

	async submit(
		token: string,
		classId: string,
		studentId: string,
		assignmentId: string,
		file: File,
	) {
		const body = new FormData();
		body.append("classId", classId);
		body.append("studentId", studentId);
		body.append("assignmentId", assignmentId);
		body.append("file", file);
		const res = await fetch(
			`${API_BASE_URL}/public/portals/${token}/grade-and-submit`,
			{ method: "POST", body },
		);
		if (!res.ok) throw new Error(await errorMessage(res, "Không thể nộp bài"));
		return res.json() as Promise<PublicPortalSubmitResult>;
	},

	async gradePreview(
		token: string,
		classId: string,
		studentId: string,
		assignmentId: string,
		file: File,
	) {
		const body = new FormData();
		body.append("classId", classId);
		body.append("studentId", studentId);
		body.append("assignmentId", assignmentId);
		body.append("file", file);
		const res = await fetch(
			`${API_BASE_URL}/public/portals/${token}/grade-preview`,
			{ method: "POST", body },
		);
		if (!res.ok) throw new Error(await errorMessage(res, "Không thể chấm thử bài"));
		return res.json() as Promise<PublicPortalSubmitResult>;
	},

	async getLeaderboard(token: string, classId?: string, assignmentId?: string) {
		const params = new URLSearchParams();
		if (classId) params.set("classId", classId);
		if (assignmentId) params.set("assignmentId", assignmentId);
		const query = params.toString();
		const res = await fetch(
			`${API_BASE_URL}/public/portals/${token}/leaderboard${query ? `?${query}` : ""}`,
		);
		if (!res.ok)
			throw new Error(await errorMessage(res, "Không thể lấy bảng xếp hạng"));
		return res.json() as Promise<SubmissionLeaderboardItem[]>;
	},
};
