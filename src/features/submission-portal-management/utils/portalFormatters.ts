import type { Assignment } from "../../../types/assignment.types";

export type ScoringPolicy = "BestScore" | "LatestScore";

export type PageMessage = {
	type: "success" | "warning" | "error" | "info";
	text: string;
};

export const formatDateTime = (value?: string): string =>
	value ? new Date(value).toLocaleString("vi-VN") : "Không giới hạn";

export const subjectBadge = (subject?: string): string =>
	subject?.toUpperCase() || "AUTO";

export const hasAutoGradingEndpoint = (assignment: Assignment): boolean => {
	const gradingType = String(assignment.gradingType || "")
		.trim()
		.toLowerCase();
	const endpoint = assignment.gradingApiEndpoint?.trim();

	return Boolean(endpoint) && (!gradingType || gradingType === "auto");
};

export const severityLabel = (severity: string): string => {
	const normalized = severity.toLowerCase();
	if (normalized.includes("high")) return "Nghiêm trọng";
	if (normalized.includes("medium")) return "Cần kiểm tra";
	return "Thông tin";
};

export const severityColors = (
	severity: string,
): {
	containerClass: string;
	badgeClass: string;
	borderClass: string;
	iconClass: string;
} => {
	const normalized = severity.toLowerCase();
	if (normalized.includes("high")) {
		return {
			containerClass: "bg-m3-error-container text-m3-on-error-container",
			badgeClass:
				"bg-m3-error text-m3-on-error border-none shadow-none font-semibold",
			borderClass: "border-m3-on-error",
			iconClass: "text-m3-on-error",
		};
	}
	if (normalized.includes("medium")) {
		return {
			containerClass: "bg-m3-tertiary-container text-m3-on-tertiary-container",
			badgeClass:
				"bg-m3-tertiary text-m3-on-tertiary border-none shadow-none font-semibold",
			borderClass: "border-m3-on-tertiary",
			iconClass: "text-m3-on-tertiary",
		};
	}
	return {
		containerClass: "bg-m3-secondary-container text-m3-on-secondary-container",
		badgeClass:
			"bg-m3-secondary text-m3-on-secondary border-none shadow-none font-semibold",
		borderClass: "border-m3-on-secondary",
		iconClass: "text-m3-on-secondary",
	};
};
