// src/services/bonus-point.service.ts
import { API_BASE_URL } from "../config/api";
import type {
	BonusPointResponse,
	BulkBonusPointRequest,
	ClassBonusSummaryResponse,
	CreateBonusPointRequest,
	UpdateBonusPointRequest,
} from "../types/bonus-point.types";
import { authFetch } from "./auth-fetch";

const jsonHeaders = { "Content-Type": "application/json" };

export const bonusPointService = {
	async getByClass(
		classId: string,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<ClassBonusSummaryResponse> {
		const response = await authFetch(
			`${API_BASE_URL}/bonuspoint/class/${classId}`,
			{ method: "GET", headers: jsonHeaders, cache: "no-store" },
			getAccessToken,
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(
				errorData?.message || "Không thể lấy tổng hợp điểm cộng theo lớp",
			);
		}
		return response.json();
	},

	async getByClassAndDate(
		classId: string,
		date: string,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<BonusPointResponse[]> {
		const response = await authFetch(
			`${API_BASE_URL}/bonuspoint/class/${classId}/date/${date}`,
			{ method: "GET", headers: jsonHeaders, cache: "no-store" },
			getAccessToken,
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(
				errorData?.message || "Không thể lấy điểm cộng theo ngày",
			);
		}
		return response.json();
	},

	async getByStudent(
		studentId: string,
		classId: string,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<BonusPointResponse[]> {
		const response = await authFetch(
			`${API_BASE_URL}/bonuspoint/student/${studentId}/class/${classId}`,
			{ method: "GET", headers: jsonHeaders, cache: "no-store" },
			getAccessToken,
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(
				errorData?.message || "Không thể lấy lịch sử điểm cộng học sinh",
			);
		}
		return response.json();
	},

	async create(
		data: CreateBonusPointRequest,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<BonusPointResponse> {
		const response = await authFetch(
			`${API_BASE_URL}/bonuspoint`,
			{ method: "POST", headers: jsonHeaders, body: JSON.stringify(data) },
			getAccessToken,
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(errorData?.message || "Không thể thêm điểm cộng");
		}
		return response.json();
	},

	async bulkCreate(
		data: BulkBonusPointRequest,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<BonusPointResponse[]> {
		const response = await authFetch(
			`${API_BASE_URL}/bonuspoint/bulk`,
			{ method: "POST", headers: jsonHeaders, body: JSON.stringify(data) },
			getAccessToken,
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(
				errorData?.message || "Không thể lưu điểm cộng hàng loạt",
			);
		}
		return response.json();
	},

	async update(
		id: string,
		data: UpdateBonusPointRequest,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<BonusPointResponse> {
		const response = await authFetch(
			`${API_BASE_URL}/bonuspoint/${id}`,
			{ method: "PUT", headers: jsonHeaders, body: JSON.stringify(data) },
			getAccessToken,
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(errorData?.message || "Không thể cập nhật điểm cộng");
		}
		return response.json();
	},

	async delete(
		id: string,
		getAccessToken: (forceRefresh?: boolean) => Promise<string | null>,
	): Promise<void> {
		const response = await authFetch(
			`${API_BASE_URL}/bonuspoint/${id}`,
			{ method: "DELETE", headers: jsonHeaders },
			getAccessToken,
		);

		if (!response.ok) {
			const errorData = await response.json().catch(() => null);
			throw new Error(errorData?.message || "Không thể xóa điểm cộng");
		}
	},
};
