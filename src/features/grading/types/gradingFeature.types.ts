import type { GradingResult } from "../../../types/grading.types";
import type { AutoGradingTaskResultRequest } from "../../../types/score.types";

export const PRACTICE_OPTIONS = [
	{ code: "practice01", label: "Practice 01" },
	{ code: "practice02", label: "Practice 02" },
	{ code: "practice03", label: "Practice 03" },
	{ code: "exam_review", label: "Tạo bài ôn thi" },
] as const;

export type PracticeCode = (typeof PRACTICE_OPTIONS)[number]["code"];

export const ASSIGNMENT_PRESET_OPTIONS = [
	{ code: "exam01", label: "Exam 1" },
	{ code: "exam02", label: "Exam 2" },
	{ code: "exam03", label: "Exam 3" },
	{ code: "practice01", label: "Practice 1" },
	{ code: "practice02", label: "Practice 2" },
	{ code: "practice03", label: "Practice 3" },
	{ code: "otth_odd", label: "OTTH lẻ" },
	{ code: "otth_even", label: "OTTH chẵn" },
] as const;

export type AssignmentPresetCode =
	(typeof ASSIGNMENT_PRESET_OPTIONS)[number]["code"];

export const SUBJECT_OPTIONS = [
	{ code: "excel", label: "Excel" },
	{ code: "word", label: "Word" },
	{ code: "ppt", label: "PowerPoint" },
] as const;

export type SubjectCode = (typeof SUBJECT_OPTIONS)[number]["code"];

export const QUICK_SELECT_PRACTICE_OPTIONS = [
	{ code: "practice01", label: "Practice 01" },
	{ code: "practice02", label: "Practice 02" },
	{ code: "practice03", label: "Practice 03" },
	{ code: "exam_review", label: "Ôn thi" },
] as const;

export type GradingMode =
	| null
	| "new"
	| "existing"
	| "existing-multi"
	| "manage";

export interface MultiAutoCellState {
	studentFile: File | null;
	isGrading: boolean;
	error: string | null;
	gradingResult: GradingResult | null;
}

export interface MultiScoreCellValue {
	scoreValue: number | null;
	feedback: string;
	autoGradingErrors: string[];
	autoGradingTaskResults: AutoGradingTaskResultRequest[];
}

export interface PersistedScoreSnapshot {
	scoreId: string;
	scoreValue: number | null;
	feedback: string;
	autoGradingErrors: string[];
	autoGradingTaskResults: AutoGradingTaskResultRequest[];
}

export interface SingleUndoSnapshot {
	previousState: {
		studentFile: File | null;
		isGrading: boolean;
		gradingResult: GradingResult | null;
		error: string | null;
		manualScore: number | null;
		manualComment: string;
		autoGradingErrors: string[];
	};
	previousPersistedScore: PersistedScoreSnapshot | null;
}

export interface MultiUndoSnapshot {
	previousAutoState: MultiAutoCellState;
	previousScoreState: MultiScoreCellValue;
}

export interface PendingManualMultiFileMatch {
	id: string;
	fileKey: string;
	studentId: string;
	file: File;
	reason: string;
	selectedAssignmentId: string;
	candidateAssignmentIds: string[];
}

export interface BulkAssignmentDraft {
	endpoint: string;
	displayName: string;
	maxScore: number;
	name: string;
	selected: boolean;
}
