import type { NotifyIssue } from "./notify";

type DisplayIssueLike = {
	heading?: string;
	message?: string;
	fixAction?: string;
};

type TaskResultLike = {
	displayIssues: DisplayIssueLike[];
};

export const normalizeIssueText = (value: string): string =>
	value.replace(/\s+/g, " ").trim();

export const toIssueDedupKey = (value: string): string =>
	normalizeIssueText(value)
		.toLowerCase()
		.replace(/[.:;!?]+$/g, "");

export const getNotifyIssuesFromTaskResults = (
	taskResults?: TaskResultLike[],
): NotifyIssue[] => {
	if (!taskResults?.length) return [];

	const issues: NotifyIssue[] = [];
	const seen = new Set<string>();

	for (const task of taskResults) {
		for (const issue of task.displayIssues || []) {
			const heading = normalizeIssueText(issue.heading || "");
			const message = normalizeIssueText(issue.message || "");
			const fixAction = normalizeIssueText(issue.fixAction || "");

			if (!heading || !message) {
				continue;
			}

			const dedupKey = toIssueDedupKey(`${heading}\n${message}\n${fixAction}`);
			if (seen.has(dedupKey)) {
				continue;
			}

			seen.add(dedupKey);
			issues.push({
				heading,
				message,
				fixAction,
			});
		}
	}

	return issues;
};
