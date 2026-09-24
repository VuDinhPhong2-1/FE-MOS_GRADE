import type {
	PublicPortalAssignment,
	PublicPortalAutoGradingTaskResult,
	PublicPortalSubmitResult,
} from "../../../types/submission-portal.types";
import { expectedExtensionsBySubject, subjectMeta } from "./subjectMeta";

export const normalizeText = (value: string): string =>
	value
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/đ/g, "d")
		.trim();

export const uniqueNonEmpty = (items?: string[]): string[] =>
	Array.from(new Set((items || []).map((item) => item.trim()).filter(Boolean)));

export const getFailedTaskResults = (
	result: PublicPortalSubmitResult,
): PublicPortalAutoGradingTaskResult[] =>
	(result.autoGradingTaskResults || []).filter((task) => {
		const errors = uniqueNonEmpty(task.errors);
		const fixes = uniqueNonEmpty(task.fixActions);
		return task.isPassed === false || errors.length > 0 || fixes.length > 0;
	});

export const getScoreTone = (score?: number, maxScore = 100): string => {
	if (score === undefined) {
		return "bg-m3-surface-container-high text-m3-on-surface-variant";
	}
	const ratio = maxScore > 0 ? score / maxScore : 0;
	if (ratio >= 0.8) {
		return "bg-m3-primary-container text-m3-on-primary-container";
	}
	if (ratio >= 0.5) {
		return "bg-m3-tertiary-container text-m3-on-tertiary-container";
	}
	return "bg-m3-error-container text-m3-on-error-container";
};

export const getTaskLabel = (
	task: PublicPortalAutoGradingTaskResult,
	index: number,
): string => task.taskName?.trim() || task.taskId?.trim() || `Câu ${index + 1}`;

export const getFileExtensionWarning = (
	assignment: PublicPortalAssignment,
	file?: File,
): string => {
	if (!file) return "";
	const fileName = file.name.toLowerCase();
	const expectedExtensions =
		expectedExtensionsBySubject[assignment.subject] || [];
	if (expectedExtensions.some((extension) => fileName.endsWith(extension))) {
		return "";
	}

	return `File này có thể không đúng định dạng cho bài ${subjectMeta[assignment.subject].label}. Nên chọn file ${expectedExtensions.join(", ")}.`;
};
