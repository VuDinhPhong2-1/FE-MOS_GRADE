import type { GradingEndpointInfo } from "../../../types/assignment.types";
import type { GradingResult } from "../../../types/grading.types";
import type { AutoGradingTaskResultRequest } from "../../../types/score.types";
import { getNotifyIssuesFromTaskResults } from "../../../utils/gradingIssues";
import type { NotifyIssue } from "../../../utils/notify";
import type {
	AssignmentPresetCode,
	BulkAssignmentDraft,
	PracticeCode,
	SubjectCode,
} from "../types/gradingFeature.types";

export const BULK_GRADING_CONCURRENCY = 3;

export const EXAM_REVIEW_PROJECT_NUMBERS_EXCEL = [
	2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22,
];

export const EXAM_REVIEW_PROJECT_NUMBERS_WORD = [
	1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 20, 22,
];

export const runLimitedConcurrency = async (
	tasks: Array<() => Promise<void>>,
	concurrency = BULK_GRADING_CONCURRENCY,
): Promise<void> => {
	const workerCount = Math.min(Math.max(1, concurrency), tasks.length);
	let nextIndex = 0;

	await Promise.all(
		Array.from({ length: workerCount }, async () => {
			while (nextIndex < tasks.length) {
				const task = tasks[nextIndex];
				nextIndex += 1;
				await task();
			}
		}),
	);
};

export const normalizeVietnameseText = (value?: string): string =>
	(value || "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();

export const extractProjectNumberFromEndpoint = (
	endpoint?: string,
): number | null => {
	if (!endpoint) return null;

	let normalized = endpoint.trim().replace(/\\/g, "/").replace(/^\/+/, "");
	normalized = normalized
		.replace(/^api\/grading\//i, "")
		.replace(/^grading\//i, "");

	const directProjectMatch = normalized.match(/^project(\d{1,2})$/i);
	if (directProjectMatch) {
		return Number.parseInt(directProjectMatch[1], 10);
	}

	const subjectProjectMatch = normalized.match(
		/^(excel|word|ppt|powerpoint)\/(?:(?:exam0[1-3]|practice0[1-3])\/)?project(\d{1,2})$/i,
	);
	if (subjectProjectMatch) {
		return Number.parseInt(subjectProjectMatch[1], 10);
	}

	return null;
};

export const getAcceptedSubmissionFileTypes = (endpoint?: string): string => {
	const normalized = (endpoint || "").trim().replace(/\\/g, "/").toLowerCase();

	if (normalized.includes("word/")) {
		return normalized.includes("project07") ? ".docx,.txt" : ".docx";
	}

	if (normalized.includes("excel/")) {
		return ".xls,.xlsx,.xlsm";
	}

	return ".xls,.xlsx,.xlsm,.docx,.txt";
};

export const resolvePracticeCodeByProjectNumber = (
	projectNumber: number,
): Exclude<PracticeCode, "exam_review"> | null => {
	if (projectNumber >= 1 && projectNumber <= 8) return "practice01";
	if (projectNumber >= 9 && projectNumber <= 16) return "practice02";
	if (projectNumber >= 17 && projectNumber <= 24) return "practice03";
	return null;
};

export const getAssignmentPresetLabel = (
	presetCode: AssignmentPresetCode,
): string => {
	const labels: Record<AssignmentPresetCode, string> = {
		exam01: "Exam 1",
		exam02: "Exam 2",
		exam03: "Exam 3",
		practice01: "Practice 1",
		practice02: "Practice 2",
		practice03: "Practice 3",
		otth_odd: "OTTH lẻ",
		otth_even: "OTTH chẵn",
	};

	return labels[presetCode];
};

export const getSubjectDisplayName = (subjectCode: SubjectCode): string => {
	const labels: Record<SubjectCode, string> = {
		excel: "Excel",
		word: "Word",
		ppt: "PPT",
	};

	return labels[subjectCode];
};

export const isExamReviewAssignment = (assignment: {
	name?: string;
	description?: string;
	gradingApiEndpoint?: string;
}): boolean => {
	const candidates = [
		assignment.name || "",
		assignment.description || "",
		assignment.gradingApiEndpoint || "",
	].map(normalizeVietnameseText);

	return candidates.some(
		(text) =>
			text.includes("on thi") ||
			text.includes("exam review") ||
			text.includes("exam_review") ||
			text.includes("review exam"),
	);
};

export const resolveAssignmentPracticeCode = (assignment: {
	name?: string;
	description?: string;
	gradingApiEndpoint?: string;
}): PracticeCode | null => {
	if (isExamReviewAssignment(assignment)) {
		return "exam_review";
	}

	const projectNumber = extractProjectNumberFromEndpoint(
		assignment.gradingApiEndpoint,
	);
	if (!projectNumber) return null;
	return resolvePracticeCodeByProjectNumber(projectNumber);
};

export const extractProjectNumbersFromText = (value?: string): number[] => {
	const normalized = normalizeVietnameseText(value)
		.replace(/[_-]+/g, " ")
		.replace(/([0-9])([a-z])/g, "$1 $2")
		.replace(/([a-z])([0-9])/g, "$1 $2");
	if (!normalized) return [];

	const patterns = [
		/project\s*0*(\d{1,2})\b/gi,
		/proj\s*0*(\d{1,2})\b/gi,
		/pro\s*0*(\d{1,2})\b/gi,
		/pr\s*0*(\d{1,2})\b/gi,
		/bai\s*0*(\d{1,2})\b/gi,
		/\bp\s*0*(\d{1,2})\b/gi,
	];

	const numbers = new Set<number>();
	for (const pattern of patterns) {
		const matches = normalized.matchAll(pattern);
		for (const match of matches) {
			const parsed = Number.parseInt(match[1], 10);
			if (!Number.isFinite(parsed) || parsed < 1 || parsed > 24) continue;
			numbers.add(parsed);
		}
	}

	return Array.from(numbers);
};

export const rankProjectCandidates = (
	fromFileName: number[],
	fromWorkbookTitle: number[],
): number[] => {
	const scoreMap = new Map<number, number>();
	for (const projectNumber of new Set(fromFileName)) {
		scoreMap.set(projectNumber, (scoreMap.get(projectNumber) || 0) + 2);
	}
	for (const projectNumber of new Set(fromWorkbookTitle)) {
		scoreMap.set(projectNumber, (scoreMap.get(projectNumber) || 0) + 1);
	}

	return Array.from(scoreMap.entries())
		.sort((a, b) => b[1] - a[1])
		.map(([projectNumber]) => projectNumber);
};

export const buildBulkAssignmentDrafts = (
	endpoints: GradingEndpointInfo[],
	previousDrafts: BulkAssignmentDraft[],
	presetCode: AssignmentPresetCode,
	subjectCode?: SubjectCode,
): BulkAssignmentDraft[] => {
	const previousMap = new Map(
		previousDrafts.map((draft) => [draft.endpoint, draft]),
	);
	const presetLabel = getAssignmentPresetLabel(presetCode);
	const subjectLabel = subjectCode ? getSubjectDisplayName(subjectCode) : "";

	return endpoints.map((endpoint) => {
		const previous = previousMap.get(endpoint.endpoint);
		const previousName = (previous?.name || "").trim();
		const projectNumber = extractProjectNumberFromEndpoint(endpoint.endpoint);
		const projectLabel = projectNumber
			? `Project ${String(projectNumber).padStart(2, "0")}`
			: endpoint.displayName;
		const defaultName = subjectLabel
			? `${subjectLabel} ${presetLabel} - ${projectLabel}`
			: endpoint.displayName;
		const shouldUseDefaultName =
			(previousName === "" ||
				previousName === endpoint.displayName ||
				previousName === `On thi - ${endpoint.displayName}` ||
				previousName === `${endpoint.displayName} - On thi` ||
				previousName === `${endpoint.displayName} - Ôn thi` ||
				previousName.includes(" - Project "));
		const nextName = previous
			? shouldUseDefaultName
				? defaultName
				: previous.name
			: defaultName;
		return {
			endpoint: endpoint.endpoint,
			displayName: endpoint.displayName,
			maxScore: endpoint.maxScore,
			name: nextName,
			selected: previous ? previous.selected : true,
		};
	});
};

export const deriveExamTypeFromPractice = (
	presetCode: AssignmentPresetCode,
): "otth" | "gmetrix" => (presetCode.startsWith("exam") ? "gmetrix" : "otth");

export const deriveExamTypeFromPreset = deriveExamTypeFromPractice;

export const deriveProjectCodeFromEndpoint = (
	endpoint: string,
): string | undefined => {
	const projectNumber = extractProjectNumberFromEndpoint(endpoint);
	const subjectMatch = endpoint.match(
		/^(excel|word|ppt|powerpoint)(?:\/(exam0[1-3]|practice0[1-3]))?\//i,
	);
	if (!projectNumber || !subjectMatch) {
		return undefined;
	}

	const subject =
		subjectMatch[1].toLowerCase() === "powerpoint"
			? "ppt"
			: subjectMatch[1].toLowerCase();
	const group = subjectMatch[2]?.toUpperCase();
	const projectSuffix = `P${String(projectNumber).padStart(2, "0")}`;
	return group
		? `${subject.toUpperCase()}_${group}_${projectSuffix}`
		: `${subject.toUpperCase()}_${projectSuffix}`;
};

export const resolveEndpointsBySubjectAndPractice = (
	allEndpoints: GradingEndpointInfo[],
	subjectCode: SubjectCode,
	presetCode: AssignmentPresetCode,
): GradingEndpointInfo[] => {
	const subjectEndpoints = allEndpoints.filter((endpoint) => {
		const endpointSubject = (endpoint.subject || "excel").toLowerCase();
		if (subjectCode === "excel") {
			return endpointSubject === "excel" || !endpoint.subject;
		}

		return endpointSubject === subjectCode;
	});

	if (presetCode === "otth_odd" || presetCode === "otth_even") {
		return subjectEndpoints.filter((endpoint) => {
			const normalizedEndpoint = endpoint.endpoint
				.trim()
				.replace(/\\/g, "/")
				.toLowerCase();
			if (!normalizedEndpoint.includes("/practice")) return false;

			const projectNumber = extractProjectNumberFromEndpoint(endpoint.endpoint);
			if (!projectNumber) return false;

			const isEven = projectNumber % 2 === 0;
			return presetCode === "otth_even" ? isEven : !isEven;
		});
	}

	const groupPrefix = `${subjectCode}/${presetCode}/`;
	return subjectEndpoints.filter((endpoint) => {
		const normalizedEndpoint = endpoint.endpoint
			.trim()
			.replace(/\\/g, "/")
			.toLowerCase();
		return normalizedEndpoint.startsWith(groupPrefix);
	});
};

export const convertAutoScoreToAssignmentScale = (
	result: GradingResult,
	_assignmentMaxScore?: number,
): number => {
	const backendMax =
		typeof result.maxScore === "number" && Number.isFinite(result.maxScore)
			? result.maxScore
			: 0;
	const backendScore =
		typeof result.totalScore === "number" && Number.isFinite(result.totalScore)
			? result.totalScore
			: 0;

	if (backendMax > 0) {
		return Number(Math.max(0, Math.min(backendMax, backendScore)).toFixed(2));
	}

	return Number(Math.max(0, backendScore).toFixed(2));
};

export const getGradingIssues = (
	result: GradingResult | null,
): NotifyIssue[] => {
	return getNotifyIssuesFromTaskResults(result?.taskResults);
};

export const extractAutoGradingErrors = (
	result: GradingResult | null,
): string[] => {
	return getGradingIssues(result).map((issue) => issue.message);
};

export const mapTaskResultsForScorePayload = (
	result: GradingResult | null,
): AutoGradingTaskResultRequest[] => {
	if (!result?.taskResults?.length) {
		return [];
	}

	return result.taskResults.map((task, index) => {
		const fallbackTaskId = `TASK-${String(index + 1).padStart(2, "0")}`;
		const taskId = (task.taskId || "").trim() || fallbackTaskId;
		const taskName = (task.taskName || "").trim() || taskId;
		const score = Number.isFinite(task.score) ? task.score : 0;
		const maxScore =
			Number.isFinite(task.maxScore) && task.maxScore > 0 ? task.maxScore : 1;
		const details = (task.details || [])
			.map((item) => (item || "").trim())
			.filter((item) => item.length > 0);
		const errors = (task.errors || [])
			.map((item) => (item || "").trim())
			.filter((item) => item.length > 0);
		const fixActions = (task.fixActions || [])
			.map((item) => (item || "").trim())
			.filter((item) => item.length > 0);
		const displayIssues = (task.displayIssues || [])
			.map((item) => ({
				heading: (item.heading || "").trim(),
				message: (item.message || "").trim(),
				fixAction: (item.fixAction || "").trim(),
			}))
			.filter((item) => item.heading.length > 0 && item.message.length > 0);

		return {
			taskId,
			taskName,
			score,
			maxScore,
			isPassed: Boolean(task.isPassed),
			details,
			errors,
			fixActions,
			displayIssues,
		};
	});
};

export const getReadableErrorMessage = (
	error: unknown,
	fallback: string,
): string =>
	error instanceof Error && error.message ? error.message : fallback;
