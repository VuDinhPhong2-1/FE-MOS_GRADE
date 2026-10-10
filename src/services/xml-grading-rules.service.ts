import { API_BASE_URL } from "../config/api";
import type {
	GradingRuleSet,
	GradingRuleSetSummary,
	ProjectXmlRule,
	TaskXmlRule,
	XmlGradingCondition,
	XmlRuleGradeResult,
	XmlRuleValidationResult,
} from "../types/xml-grading-rules.types";
import type { AccessTokenGetter } from "./auth-fetch";
import { authFetch } from "./auth-fetch";

export interface ExcelExam02EvidenceSummary {
	id: string;
	projectCode: string;
	scope: string;
	workbookSha256: string;
	fileName: string;
	availableTaskIds: string[];
	decisions: Record<string, string>;
	submittedAtUtc: string;
	reviewedAtUtc?: string;
	reviewedBy?: string;
	reviewNote?: string;
}

const jsonHeaders = { "Content-Type": "application/json" };
const baseUrl = `${API_BASE_URL}/admin/xml-grading-rules`;

const readError = async (response: Response) => {
	const flattenErrors = (errors: unknown): string => {
		if (Array.isArray(errors)) {
			return errors.map(String).filter(Boolean).join("\n");
		}

		if (errors && typeof errors === "object") {
			return Object.entries(errors as Record<string, unknown>)
				.flatMap(([field, value]) => {
					if (Array.isArray(value)) {
						return value.map((item) => `${field}: ${String(item)}`);
					}
					return [`${field}: ${String(value)}`];
				})
				.filter(Boolean)
				.join("\n");
		}

		return "";
	};

	try {
		const body = await response.json();
		const errors = flattenErrors(body?.errors);
		return (
			body?.message ||
			errors ||
			body?.detail ||
			body?.title ||
			JSON.stringify(body)
		);
	} catch {
		return `HTTP ${response.status}`;
	}
};

const requestJson = async <T>(
	url: string,
	init: RequestInit,
	getAccessToken: AccessTokenGetter,
): Promise<T> => {
	const response = await authFetch(url, init, getAccessToken);
	if (!response.ok) throw new Error(await readError(response));
	if (response.status === 204) return undefined as T;
	return response.json() as Promise<T>;
};

export const xmlGradingRulesService = {
	listExam02Evidence: (getAccessToken: AccessTokenGetter) =>
		requestJson<ExcelExam02EvidenceSummary[]>(
			`${baseUrl}/evidence?projectCode=exam02%2Fproject11`,
			{ method: "GET" }, getAccessToken,
		),
	reviewExam02Evidence: (id: string, taskId: string, approved: boolean, getAccessToken: AccessTokenGetter) =>
		requestJson<ExcelExam02EvidenceSummary>(
			`${baseUrl}/evidence/${encodeURIComponent(id)}/review`,
			{ method: "POST", headers: jsonHeaders, body: JSON.stringify({ taskId, approved }) }, getAccessToken,
		),
	downloadExam02Evidence: async (id: string, getAccessToken: AccessTokenGetter) => {
		const response = await authFetch(`${baseUrl}/evidence/${encodeURIComponent(id)}/download`,
			{ method: "GET" }, getAccessToken);
		if (!response.ok) throw new Error(await readError(response));
		return response.blob();
	},
	list: (
		getAccessToken: AccessTokenGetter,
		filters?: { subject?: string; isActive?: boolean },
	) => {
		const params = new URLSearchParams();
		if (filters?.subject) params.set("subject", filters.subject);
		if (filters?.isActive !== undefined)
			params.set("isActive", String(filters.isActive));
		const query = params.toString();
		return requestJson<GradingRuleSet[]>(
			`${baseUrl}${query ? `?${query}` : ""}`,
			{ method: "GET" },
			getAccessToken,
		);
	},
	listSummaries: (
		getAccessToken: AccessTokenGetter,
		filters?: { subject?: string; isActive?: boolean },
	) => {
		const params = new URLSearchParams({ summary: "true" });
		if (filters?.subject) params.set("subject", filters.subject);
		if (filters?.isActive !== undefined)
			params.set("isActive", String(filters.isActive));
		return requestJson<GradingRuleSetSummary[]>(
			`${baseUrl}?${params.toString()}`,
			{ method: "GET" },
			getAccessToken,
		);
	},
	get: (id: string, getAccessToken: AccessTokenGetter) =>
		requestJson<GradingRuleSet>(
			`${baseUrl}/${id}`,
			{ method: "GET" },
			getAccessToken,
		),
	create: (
		ruleSet: Partial<GradingRuleSet>,
		getAccessToken: AccessTokenGetter,
	) =>
		requestJson<GradingRuleSet>(
			baseUrl,
			{ method: "POST", headers: jsonHeaders, body: JSON.stringify(ruleSet) },
			getAccessToken,
		),
	update: (
		id: string,
		ruleSet: GradingRuleSet,
		getAccessToken: AccessTokenGetter,
	) =>
		requestJson<GradingRuleSet>(
			`${baseUrl}/${id}`,
			{ method: "PUT", headers: jsonHeaders, body: JSON.stringify(ruleSet) },
			getAccessToken,
		),
	delete: (id: string, getAccessToken: AccessTokenGetter) =>
		requestJson<void>(`${baseUrl}/${id}`, { method: "DELETE" }, getAccessToken),
	addProject: (
		ruleSetId: string,
		project: ProjectXmlRule,
		getAccessToken: AccessTokenGetter,
	) =>
		requestJson<GradingRuleSet>(
			`${baseUrl}/${ruleSetId}/projects`,
			{ method: "POST", headers: jsonHeaders, body: JSON.stringify(project) },
			getAccessToken,
		),
	updateProject: (
		ruleSetId: string,
		projectCode: string,
		project: ProjectXmlRule,
		getAccessToken: AccessTokenGetter,
	) =>
		requestJson<GradingRuleSet>(
			`${baseUrl}/${ruleSetId}/projects/${encodeURIComponent(projectCode)}`,
			{ method: "PUT", headers: jsonHeaders, body: JSON.stringify(project) },
			getAccessToken,
		),
	deleteProject: (
		ruleSetId: string,
		projectCode: string,
		getAccessToken: AccessTokenGetter,
	) =>
		requestJson<GradingRuleSet>(
			`${baseUrl}/${ruleSetId}/projects/${encodeURIComponent(projectCode)}`,
			{ method: "DELETE" },
			getAccessToken,
		),
	addTask: (
		ruleSetId: string,
		projectCode: string,
		task: TaskXmlRule,
		getAccessToken: AccessTokenGetter,
	) =>
		requestJson<GradingRuleSet>(
			`${baseUrl}/${ruleSetId}/projects/${encodeURIComponent(projectCode)}/tasks`,
			{ method: "POST", headers: jsonHeaders, body: JSON.stringify(task) },
			getAccessToken,
		),
	updateTask: (
		ruleSetId: string,
		projectCode: string,
		taskId: string,
		task: TaskXmlRule,
		getAccessToken: AccessTokenGetter,
	) =>
		requestJson<GradingRuleSet>(
			`${baseUrl}/${ruleSetId}/projects/${encodeURIComponent(projectCode)}/tasks/${encodeURIComponent(taskId)}`,
			{ method: "PUT", headers: jsonHeaders, body: JSON.stringify(task) },
			getAccessToken,
		),
	deleteTask: (
		ruleSetId: string,
		projectCode: string,
		taskId: string,
		getAccessToken: AccessTokenGetter,
	) =>
		requestJson<GradingRuleSet>(
			`${baseUrl}/${ruleSetId}/projects/${encodeURIComponent(projectCode)}/tasks/${encodeURIComponent(taskId)}`,
			{ method: "DELETE" },
			getAccessToken,
		),
	addCondition: (
		ruleSetId: string,
		projectCode: string,
		taskId: string,
		condition: XmlGradingCondition,
		getAccessToken: AccessTokenGetter,
	) =>
		requestJson<GradingRuleSet>(
			`${baseUrl}/${ruleSetId}/projects/${encodeURIComponent(projectCode)}/tasks/${encodeURIComponent(taskId)}/conditions`,
			{ method: "POST", headers: jsonHeaders, body: JSON.stringify(condition) },
			getAccessToken,
		),
	updateCondition: (
		ruleSetId: string,
		projectCode: string,
		taskId: string,
		conditionId: string,
		condition: XmlGradingCondition,
		getAccessToken: AccessTokenGetter,
	) =>
		requestJson<GradingRuleSet>(
			`${baseUrl}/${ruleSetId}/projects/${encodeURIComponent(projectCode)}/tasks/${encodeURIComponent(taskId)}/conditions/${encodeURIComponent(conditionId)}`,
			{ method: "PUT", headers: jsonHeaders, body: JSON.stringify(condition) },
			getAccessToken,
		),
	deleteCondition: (
		ruleSetId: string,
		projectCode: string,
		taskId: string,
		conditionId: string,
		getAccessToken: AccessTokenGetter,
	) =>
		requestJson<GradingRuleSet>(
			`${baseUrl}/${ruleSetId}/projects/${encodeURIComponent(projectCode)}/tasks/${encodeURIComponent(taskId)}/conditions/${encodeURIComponent(conditionId)}`,
			{ method: "DELETE" },
			getAccessToken,
		),
	validate: (ruleSet: GradingRuleSet, getAccessToken: AccessTokenGetter) =>
		requestJson<XmlRuleValidationResult>(
			`${baseUrl}/validate`,
			{ method: "POST", headers: jsonHeaders, body: JSON.stringify(ruleSet) },
			getAccessToken,
		),
	grade: (
		subject: string,
		projectCode: string,
		file: File,
		getAccessToken: AccessTokenGetter,
		attachmentFile?: File | null,
	) => {
		const formData = new FormData();
		formData.append("file", file);
		if (attachmentFile) {
			formData.append("attachmentFile", attachmentFile);
		}
		return requestJson<XmlRuleGradeResult>(
			`${baseUrl}/grade/${encodeURIComponent(subject)}/${projectCode.split("/").map(encodeURIComponent).join("/")}`,
			{ method: "POST", body: formData },
			getAccessToken,
		);
	},
	seedPptGm2: (getAccessToken: AccessTokenGetter) =>
		requestJson<GradingRuleSet>(
			`${baseUrl}/seed/ppt/gm2`,
			{ method: "POST" },
			getAccessToken,
		),
};
