import type { Assignment } from "../../../types/assignment.types";
import type { AutoGradingTaskResultRequest } from "../../../types/score.types";
import type { Student } from "../../../types/student.types";
import type { NotifyIssue } from "../../../utils/notify";

export type CompetencyLevel = "" | "A" | "B" | "C" | "D";
export type AssignmentColumnDisplayMode = "full" | "hidden";
export type ScoreTableSortKey =
	| "none"
	| "name"
	| "classification"
	| "totalScore";
export type ScoreTableSortDirection = "asc" | "desc";
export type PracticeCode =
	| "practice01"
	| "practice02"
	| "practice03"
	| "exam_review"
	| (string & {});
export type SummaryColumnKind = "completion" | "score";

export const SCORE_SORT_KEY_OPTIONS = [
	{ value: "none", label: "Mặc định" },
	{ value: "name", label: "Theo tên (A → Z)" },
	{ value: "classification", label: "Theo xếp loại" },
	{ value: "totalScore", label: "Theo tổng điểm" },
];

export interface PracticeSummary {
	completionText: string;
	totalScore: number;
}

export interface DisplayStudentRow {
	id: string;
	middleName: string;
	firstName: string;
	notes: string;
	calculatedScores: Record<string, number>;
	errorsByAssignment: Record<string, string[]>;
	issuesByAssignment: Record<string, NotifyIssue[]>;
	totalScore: number;
	otthPercentage: number;
	examReviewPercentage: number;
	classification: CompetencyLevel;
	practiceSummaries: Record<PracticeCode, PracticeSummary>;
}

export interface ViewAllScoresModalProps {
	isOpen: boolean;
	onClose: () => void;
	assignments: Assignment[];
	students: Student[];
	classDisplayName?: string;
	displayMode?: "modal" | "page";
	title?: string;
	onStudentClassificationUpdated?: (
		studentId: string,
		classification: CompetencyLevel,
	) => void;
	onStudentNotesUpdated?: (studentId: string, notes: string) => void;
	scores: {
		studentId: string;
		assignmentId: string;
		assignmentName?: string;
		scoreValue: number | null;
		autoGradingErrors?: string[];
		autoGradingTaskResults?: AutoGradingTaskResultRequest[];
	}[];
}

export const formatScore = (value: number): string => {
	if (!Number.isFinite(value)) return "0";
	return Number.isInteger(value)
		? String(value)
		: value.toFixed(2).replace(/\.00$/, "");
};

export const getScorePillClass = (score: number, maxScore: number): string => {
	if (!Number.isFinite(maxScore) || maxScore <= 0) {
		return "border-m3-outline-variant/60 bg-m3-surface-container-high text-m3-on-surface-variant";
	}
	const ratio = score / maxScore;
	if (ratio >= 0.85)
		return "border-m3-tertiary/40 bg-m3-tertiary-container text-m3-on-tertiary-container";
	if (ratio >= 0.65)
		return "border-m3-secondary/40 bg-m3-secondary-container text-m3-on-secondary-container";
	if (ratio > 0)
		return "border-m3-primary/40 bg-m3-primary-container text-m3-on-primary-container";
	return "border-m3-outline-variant/60 bg-m3-surface-container-high text-m3-on-surface-variant";
};

export const getPercentagePillClass = (percentage: number): string => {
	if (percentage >= 75)
		return "border-m3-tertiary/40 bg-m3-tertiary-container text-m3-on-tertiary-container";
	if (percentage >= 50)
		return "border-m3-secondary/40 bg-m3-secondary-container text-m3-on-secondary-container";
	if (percentage > 0)
		return "border-m3-primary/40 bg-m3-primary-container text-m3-on-primary-container";
	return "border-m3-outline-variant/60 bg-m3-surface-container-high text-m3-on-surface-variant";
};

export const normalizeClassification = (value?: string): CompetencyLevel => {
	const normalized = (value || "").trim().toUpperCase();
	return normalized === "A" ||
		normalized === "B" ||
		normalized === "C" ||
		normalized === "D"
		? normalized
		: "";
};

export const isStudentTakingExam = (student?: Student): boolean =>
	Boolean(student?.takesExam ?? student?.thi);

export const classificationClassMap: Record<"A" | "B" | "C" | "D", string> = {
	A: "bg-m3-tertiary-container text-m3-on-tertiary-container border-m3-tertiary/40",
	B: "bg-m3-secondary-container text-m3-on-secondary-container border-m3-secondary/40",
	C: "bg-m3-primary-container text-m3-on-primary-container border-m3-primary/40",
	D: "bg-m3-error-container text-m3-on-error-container border-m3-error/40",
};

export const classificationLevels: Array<Exclude<CompetencyLevel, "">> = [
	"A",
	"B",
	"C",
	"D",
];

export const sanitizeFileNamePart = (value: string): string =>
	value
		.replace(/[\\/:*?"<>|]/g, "")
		.replace(/\s+/g, " ")
		.trim();

export const vietnameseCollator = new Intl.Collator("vi", {
	sensitivity: "base",
	numeric: true,
});

export const classificationSortOrder: Record<CompetencyLevel, number> = {
	A: 0,
	B: 1,
	C: 2,
	D: 3,
	"": 4,
};

export const PRACTICE_MAX_SCORE = 1000;
export const EXAM_REVIEW_PROJECT_NUMBERS = [
	2, 4, 5, 6, 8, 9, 10, 12, 14, 16, 18, 20, 22,
];
export const PRACTICE_COMPLETION_TARGETS: Record<PracticeCode, number> = {
	practice01: 8,
	practice02: 8,
	practice03: 8,
	exam_review: EXAM_REVIEW_PROJECT_NUMBERS.length,
};

export interface PracticeColumnDef {
	code: PracticeCode;
	shortLabel: string;
	title: string;
}

export const PRACTICE_COLUMNS: PracticeColumnDef[] = [
	{ code: "practice01", shortLabel: "P01", title: "Practice 01" },
	{ code: "practice02", shortLabel: "P02", title: "Practice 02" },
	{ code: "practice03", shortLabel: "P03", title: "Practice 03" },
	{ code: "exam_review", shortLabel: "Ôn thi", title: "Bài ôn thi" },
];

export const resolvePracticeColumnDef = (
	code: PracticeCode,
): PracticeColumnDef => {
	const found = PRACTICE_COLUMNS.find((col) => col.code === code);
	if (found) return found;

	const examMatch = code.match(/^exam0?(\d+)$/i);
	if (examMatch) {
		const num = Number.parseInt(examMatch[1], 10);
		return {
			code,
			shortLabel: `Exam ${num}`,
			title: `Exam ${String(num).padStart(2, "0")}`,
		};
	}

	const practiceMatch = code.match(/^practice0?(\d+)$/i);
	if (practiceMatch) {
		const num = Number.parseInt(practiceMatch[1], 10);
		return {
			code,
			shortLabel: `P${String(num).padStart(2, "0")}`,
			title: `Practice ${String(num).padStart(2, "0")}`,
		};
	}

	return {
		code,
		shortLabel: code,
		title: code,
	};
};

export const buildDiscoveredPracticeColumns = (
	assignmentIdsByPractice: Record<string, string[]>,
): PracticeColumnDef[] => {
	const codes = Object.keys(assignmentIdsByPractice).filter(
		(code) => (assignmentIdsByPractice[code]?.length ?? 0) > 0,
	);

	// Sort codes: Practice (practice01, practice02...), then Exam (exam01, exam02...), then exam_review, then others
	codes.sort((a, b) => {
		const getWeight = (code: string): number => {
			if (code.startsWith("practice")) {
				const num = Number.parseInt(code.replace(/\D/g, ""), 10) || 0;
				return 100 + num;
			}
			if (code.startsWith("exam") && code !== "exam_review") {
				const num = Number.parseInt(code.replace(/\D/g, ""), 10) || 0;
				return 200 + num;
			}
			if (code === "exam_review") {
				return 300;
			}
			return 400;
		};

		const weightA = getWeight(a);
		const weightB = getWeight(b);
		if (weightA !== weightB) return weightA - weightB;
		return a.localeCompare(b);
	});

	return codes.map((code) => resolvePracticeColumnDef(code));
};

export const getPracticeCompletionHeaderLabel = (
	practice: Pick<PracticeColumnDef, "code" | "shortLabel">,
): string =>
	practice.code === "exam_review"
		? "Ôn thi số bài"
		: `${practice.shortLabel} số bài`;

export const getPracticeScoreHeaderLabel = (
	practice: Pick<PracticeColumnDef, "code" | "shortLabel">,
): string =>
	practice.code === "exam_review"
		? "Tổng điểm ôn thi"
		: `${practice.shortLabel} tổng điểm`;

export const getPracticeExcelScoreHeaderLabel = (
	practice: Pick<PracticeColumnDef, "code" | "title">,
): string =>
	practice.code === "exam_review"
		? "Tổng điểm ôn thi"
		: `${practice.title} - Tổng điểm`;

export const PRACTICE_COLUMN_THEME: Record<
	string,
	{
		completionHeader: string;
		completionCell: string;
		scoreHeader: string;
		scoreCell: string;
	}
> = {
	practice01: {
		completionHeader: "bg-m3-tertiary-container text-m3-on-tertiary-container",
		completionCell: "bg-m3-tertiary-container/20 text-m3-on-tertiary-container",
		scoreHeader: "bg-m3-tertiary-container/80 text-m3-on-tertiary-container",
		scoreCell: "bg-m3-tertiary-container/30 text-m3-on-tertiary-container",
	},
	practice02: {
		completionHeader:
			"bg-m3-secondary-container text-m3-on-secondary-container",
		completionCell:
			"bg-m3-secondary-container/20 text-m3-on-secondary-container",
		scoreHeader: "bg-m3-secondary-container/80 text-m3-on-secondary-container",
		scoreCell: "bg-m3-secondary-container/30 text-m3-on-secondary-container",
	},
	practice03: {
		completionHeader: "bg-m3-primary-container text-m3-on-primary-container",
		completionCell: "bg-m3-primary-container/20 text-m3-on-primary-container",
		scoreHeader: "bg-m3-primary-container/80 text-m3-on-primary-container",
		scoreCell: "bg-m3-primary-container/30 text-m3-on-primary-container",
	},
	exam_review: {
		completionHeader: "bg-m3-error-container text-m3-on-error-container",
		completionCell: "bg-m3-error-container/20 text-m3-on-error-container",
		scoreHeader: "bg-m3-error-container/80 text-m3-on-error-container",
		scoreCell: "bg-m3-error-container/30 text-m3-on-error-container",
	},
	exam01: {
		completionHeader: "bg-m3-tertiary-container text-m3-on-tertiary-container",
		completionCell: "bg-m3-tertiary-container/20 text-m3-on-tertiary-container",
		scoreHeader: "bg-m3-tertiary-container/80 text-m3-on-tertiary-container",
		scoreCell: "bg-m3-tertiary-container/30 text-m3-on-tertiary-container",
	},
	exam02: {
		completionHeader:
			"bg-m3-secondary-container text-m3-on-secondary-container",
		completionCell:
			"bg-m3-secondary-container/20 text-m3-on-secondary-container",
		scoreHeader: "bg-m3-secondary-container/80 text-m3-on-secondary-container",
		scoreCell: "bg-m3-secondary-container/30 text-m3-on-secondary-container",
	},
	exam03: {
		completionHeader: "bg-m3-primary-container text-m3-on-primary-container",
		completionCell: "bg-m3-primary-container/20 text-m3-on-primary-container",
		scoreHeader: "bg-m3-primary-container/80 text-m3-on-primary-container",
		scoreCell: "bg-m3-primary-container/30 text-m3-on-primary-container",
	},
};

export const getPracticeColumnTheme = (
	code: PracticeCode,
): {
	completionHeader: string;
	completionCell: string;
	scoreHeader: string;
	scoreCell: string;
} => {
	if (PRACTICE_COLUMN_THEME[code]) {
		return PRACTICE_COLUMN_THEME[code];
	}
	return {
		completionHeader: "bg-m3-surface-container-highest text-m3-on-surface",
		completionCell: "bg-m3-surface-container/40 text-m3-on-surface",
		scoreHeader: "bg-m3-surface-container-highest/80 text-m3-on-surface",
		scoreCell: "bg-m3-surface-container/50 text-m3-on-surface",
	};
};

export const getSummaryColumnKey = (
	practiceCode: PracticeCode,
	kind: SummaryColumnKind,
): string => `${practiceCode}:${kind}`;

export const normalizeVietnameseText = (value: string): string =>
	value
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim();

export const isExamReviewAssignment = (
	assignment: Pick<Assignment, "name" | "description" | "gradingApiEndpoint">,
): boolean => {
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

export const extractGroupCodeFromEndpoint = (
	endpoint?: string,
): string | null => {
	if (!endpoint) return null;

	let normalized = endpoint.trim().replace(/\\/g, "/").replace(/^\/+/, "");
	normalized = normalized
		.replace(/^api\/grading\//i, "")
		.replace(/^grading\//i, "");

	const match = normalized.match(
		/^(?:excel|word|ppt|powerpoint)\/([a-zA-Z0-9_-]+)\/project\d{1,2}$/i,
	);
	return match ? match[1].toLowerCase() : null;
};

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
		/^(?:excel|word|ppt|powerpoint)\/(?:[a-zA-Z0-9_-]+\/)?project(\d{1,2})$/i,
	);
	if (subjectProjectMatch) {
		return Number.parseInt(subjectProjectMatch[1], 10);
	}

	return null;
};

export const resolvePracticeByProjectNumber = (
	projectNumber: number,
): Exclude<PracticeCode, "exam_review"> | null => {
	if (projectNumber >= 1 && projectNumber <= 8) return "practice01";
	if (projectNumber >= 9 && projectNumber <= 16) return "practice02";
	if (projectNumber >= 17 && projectNumber <= 24) return "practice03";
	return null;
};

export const resolveAssignmentPracticeCode = (
	assignment: Pick<Assignment, "name" | "description" | "gradingApiEndpoint">,
): PracticeCode | null => {
	if (isExamReviewAssignment(assignment)) {
		return "exam_review";
	}

	const groupCode = extractGroupCodeFromEndpoint(assignment.gradingApiEndpoint);
	if (groupCode) {
		if (groupCode.startsWith("exam")) {
			return groupCode;
		}
		if (groupCode.startsWith("practice")) {
			return groupCode;
		}
	}

	const projectNumber = extractProjectNumberFromEndpoint(
		assignment.gradingApiEndpoint,
	);
	if (!projectNumber) {
		return null;
	}

	return resolvePracticeByProjectNumber(projectNumber);
};
