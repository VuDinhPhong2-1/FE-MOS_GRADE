import { useCallback, useEffect, useMemo, useState } from "react";
import { showAlert } from "../../../components/common";
import { useAuth } from "../../../context/AuthContext";
import studentService from "../../../services/student.service";
import type { Assignment } from "../../../types/assignment.types";
import type { AutoGradingTaskResultRequest } from "../../../types/score.types";
import type { Student } from "../../../types/student.types";
import type { ExcelCellComment } from "../../../utils/exportUtils";
import { exportToExcel, exportToPdf } from "../../../utils/exportUtils";
import {
	getNotifyIssuesFromTaskResults,
	normalizeIssueText,
} from "../../../utils/gradingIssues";
import type { NotifyIssue } from "../../../utils/notify";
import { getShortAssignmentName } from "../utils/gradingUtils";
import {
	type AssignmentColumnDisplayMode,
	buildDiscoveredPracticeColumns,
	type CompetencyLevel,
	classificationLevels,
	classificationSortOrder,
	type DisplayStudentRow,
	extractProjectNumberFromEndpoint,
	formatScore,
	getPracticeExcelScoreHeaderLabel,
	getSummaryColumnKey,
	isStudentTakingExam,
	normalizeClassification,
	type PracticeCode,
	type PracticeSummary,
	resolveAssignmentPracticeCode,
	resolvePracticeByProjectNumber,
	type ScoreTableSortDirection,
	type ScoreTableSortKey,
	sanitizeFileNamePart,
	vietnameseCollator,
} from "../utils/scoreboardUtils";

export interface ScoreboardScoreItem {
	studentId: string;
	assignmentId: string;
	assignmentName?: string;
	scoreValue: number | null;
	autoGradingErrors?: string[];
	autoGradingTaskResults?: AutoGradingTaskResultRequest[];
}

export interface UseScoreboardStateProps {
	isOpen?: boolean;
	assignments: Assignment[];
	students: Student[];
	scores: ScoreboardScoreItem[];
	classDisplayName?: string;
	title?: string;
	onStudentClassificationUpdated?: (
		studentId: string,
		classification: CompetencyLevel,
	) => void;
	onStudentNotesUpdated?: (studentId: string, notes: string) => void;
}

export function useScoreboardState({
	isOpen = true,
	assignments,
	students,
	scores,
	classDisplayName,
	title,
	onStudentClassificationUpdated,
	onStudentNotesUpdated,
}: UseScoreboardStateProps) {
	const { getAccessToken } = useAuth();

	const [classificationByStudentId, setClassificationByStudentId] = useState<
		Record<string, CompetencyLevel>
	>({});
	const [notesByStudentId, setNotesByStudentId] = useState<
		Record<string, string>
	>({});
	const [savingClassificationStudentId, setSavingClassificationStudentId] =
		useState<string | null>(null);
	const [savingNotesStudentId, setSavingNotesStudentId] = useState<
		string | null
	>(null);
	const [columnVisibility, setColumnVisibility] = useState<
		Record<string, boolean>
	>({});
	const [isTotalScoreColumnVisible, setIsTotalScoreColumnVisible] =
		useState(true);
	const [isOtthPercentageColumnVisible, setIsOtthPercentageColumnVisible] =
		useState(true);
	const [isClassificationColumnVisible, setIsClassificationColumnVisible] =
		useState(true);
	const [sortKey, setSortKey] = useState<ScoreTableSortKey>("name");
	const [sortDirection, setSortDirection] =
		useState<ScoreTableSortDirection>("asc");
	const [searchTerm, setSearchTerm] = useState<string>("");
	const [showOnlyExamStudents, setShowOnlyExamStudents] = useState(false);

	const isAssignmentVisible = useCallback(
		(id: string) => columnVisibility[`assignment:${id}`] ?? true,
		[columnVisibility],
	);

	const isSummaryColumnVisible = useCallback(
		(key: string) => columnVisibility[`summary:${key}`] ?? true,
		[columnVisibility],
	);

	useEffect(() => {
		if (!isOpen) return;

		const nextClassificationMap: Record<string, CompetencyLevel> = {};
		const nextNotesMap: Record<string, string> = {};
		for (const student of students) {
			nextClassificationMap[student.id] = normalizeClassification(
				student.competencyLevel,
			);
			nextNotesMap[student.id] = (student.notes || "").trim();
		}
		setClassificationByStudentId(nextClassificationMap);
		setNotesByStudentId(nextNotesMap);
	}, [isOpen, students]);

	const assignmentIdsByPractice = useMemo(() => {
		const next: Record<string, string[]> = {};

		for (const assignment of assignments) {
			const practiceCode = resolveAssignmentPracticeCode(assignment);
			if (!practiceCode) continue;
			if (!next[practiceCode]) {
				next[practiceCode] = [];
			}
			next[practiceCode].push(assignment.id);
		}

		return next;
	}, [assignments]);

	const assignmentsById = useMemo(() => {
		const map = new Map<string, (typeof assignments)[number]>();
		for (const assignment of assignments) {
			map.set(assignment.id, assignment);
		}
		return map;
	}, [assignments]);

	const availablePracticeColumns = useMemo(
		() => buildDiscoveredPracticeColumns(assignmentIdsByPractice),
		[assignmentIdsByPractice],
	);

	useEffect(() => {
		if (!isOpen) return;
		setColumnVisibility((prev) => {
			const next = { ...prev };
			for (const assignment of assignments) {
				const key = `assignment:${assignment.id}`;
				if (next[key] === undefined) {
					next[key] = true;
				}
			}
			for (const practice of availablePracticeColumns) {
				const completionKey = `summary:${getSummaryColumnKey(practice.code, "completion")}`;
				const scoreKey = `summary:${getSummaryColumnKey(practice.code, "score")}`;
				if (next[completionKey] === undefined) next[completionKey] = true;
				if (next[scoreKey] === undefined) next[scoreKey] = true;
			}
			return next;
		});
	}, [isOpen, assignments, availablePracticeColumns]);

	useEffect(() => {
		if (!isOpen) return;
		setSortKey("name");
		setSortDirection("asc");
		setSearchTerm("");
		setShowOnlyExamStudents(false);
		setIsTotalScoreColumnVisible(true);
		setIsOtthPercentageColumnVisible(true);
	}, [isOpen]);

	const studentsById = useMemo(() => {
		const map = new Map<string, Student>();
		for (const student of students) {
			map.set(student.id, student);
		}
		return map;
	}, [students]);

	const filteredStudentCount = useMemo(
		() =>
			students.filter(
				(student) => !showOnlyExamStudents || isStudentTakingExam(student),
			).length,
		[students, showOnlyExamStudents],
	);

	const scoreLookup = useMemo(() => {
		const map = new Map<
			string,
			{
				scoreValue: number | null;
				autoGradingErrors?: string[];
				autoGradingTaskResults?: AutoGradingTaskResultRequest[];
			}
		>();
		for (const score of scores) {
			map.set(`${score.studentId}::${score.assignmentId}`, {
				scoreValue: score.scoreValue,
				autoGradingErrors: score.autoGradingErrors || [],
				autoGradingTaskResults: score.autoGradingTaskResults || [],
			});
		}
		return map;
	}, [scores]);

	const displayedAssignments = useMemo(
		() =>
			assignments.filter((assignment) => isAssignmentVisible(assignment.id)),
		[assignments, isAssignmentVisible],
	);

	const practiceMetricsByCode = useMemo(() => {
		const completionTargetByCode: Record<string, number> = {};
		const maxScoreByCode: Record<string, number> = {};

		for (const practice of availablePracticeColumns) {
			const maxScoreByProjectKey = new Map<string, number>();

			for (const assignmentId of assignmentIdsByPractice[practice.code] || []) {
				const assignment = assignmentsById.get(assignmentId);
				if (!assignment) continue;

				const projectNumber = extractProjectNumberFromEndpoint(
					assignment.gradingApiEndpoint,
				);
				const projectKey = projectNumber
					? `project-${projectNumber}`
					: `assignment-${assignment.id}`;
				const currentMaxScore = maxScoreByProjectKey.get(projectKey) ?? 0;
				const assignmentMaxScore = assignment.maxScore || 0;
				maxScoreByProjectKey.set(
					projectKey,
					Math.max(currentMaxScore, assignmentMaxScore),
				);
			}

			completionTargetByCode[practice.code] = maxScoreByProjectKey.size;
			maxScoreByCode[practice.code] = Array.from(
				maxScoreByProjectKey.values(),
			).reduce((sum, value) => sum + value, 0);
		}

		return { completionTargetByCode, maxScoreByCode };
	}, [availablePracticeColumns, assignmentIdsByPractice, assignmentsById]);

	const practiceMaxScoreByCode = practiceMetricsByCode.maxScoreByCode;
	const practiceCompletionTargetByCode =
		practiceMetricsByCode.completionTargetByCode;
	const maxScoreTotal =
		(practiceMaxScoreByCode.practice01 || 0) +
		(practiceMaxScoreByCode.practice02 || 0) +
		(practiceMaxScoreByCode.practice03 || 0);
	const examReviewMaxScore = practiceMaxScoreByCode.exam_review || 0;
	const hasPracticeScoreColumns = maxScoreTotal > 0;
	const hasExamReviewScoreColumns = examReviewMaxScore > 0;
	const showTotalScoreColumn =
		isTotalScoreColumnVisible && hasPracticeScoreColumns;
	const showOtthPercentageColumn =
		isOtthPercentageColumnVisible && hasPracticeScoreColumns;
	const showExamReviewPercentageColumn = hasExamReviewScoreColumns;

	const visibleSummaryColumnCount = useMemo(
		() =>
			availablePracticeColumns.reduce((count, practice) => {
				const completionVisible = isSummaryColumnVisible(
					getSummaryColumnKey(practice.code, "completion"),
				);
				const scoreVisible = isSummaryColumnVisible(
					getSummaryColumnKey(practice.code, "score"),
				);
				return count + (completionVisible ? 1 : 0) + (scoreVisible ? 1 : 0);
			}, 0),
		[availablePracticeColumns, isSummaryColumnVisible],
	);

	const staticColumnCount =
		3 +
		(isClassificationColumnVisible ? 1 : 0) +
		visibleSummaryColumnCount +
		(showTotalScoreColumn ? 1 : 0) +
		(showOtthPercentageColumn ? 1 : 0) +
		(showExamReviewPercentageColumn ? 1 : 0) +
		1;

	const practiceGroupVisibility = useMemo(() => {
		return availablePracticeColumns.reduce(
			(acc, practice) => {
				const assignmentIds = assignmentIdsByPractice[practice.code] || [];
				const visibleAssignmentCount = assignmentIds.filter((assignmentId) =>
					isAssignmentVisible(assignmentId),
				).length;
				const completionVisible = isSummaryColumnVisible(
					getSummaryColumnKey(practice.code, "completion"),
				);
				const scoreVisible = isSummaryColumnVisible(
					getSummaryColumnKey(practice.code, "score"),
				);

				acc[practice.code] = {
					totalAssignments: assignmentIds.length,
					visibleAssignments: visibleAssignmentCount,
					summaryVisible: completionVisible && scoreVisible,
					isVisible:
						assignmentIds.length > 0 &&
						(visibleAssignmentCount > 0 || completionVisible || scoreVisible),
				};

				return acc;
			},
			{} as Record<
				string,
				{
					totalAssignments: number;
					visibleAssignments: number;
					summaryVisible: boolean;
					isVisible: boolean;
				}
			>,
		);
	}, [
		availablePracticeColumns,
		assignmentIdsByPractice,
		isAssignmentVisible,
		isSummaryColumnVisible,
	]);

	const areAllPracticeGroupsVisible = useMemo(
		() =>
			availablePracticeColumns.length > 0 &&
			availablePracticeColumns.every(
				(practice) => practiceGroupVisibility[practice.code]?.isVisible,
			),
		[availablePracticeColumns, practiceGroupVisibility],
	);

	const areAllPracticeGroupsHidden = useMemo(
		() =>
			availablePracticeColumns.length > 0 &&
			availablePracticeColumns.every(
				(practice) => !practiceGroupVisibility[practice.code]?.isVisible,
			),
		[availablePracticeColumns, practiceGroupVisibility],
	);

	const displayRows = useMemo<DisplayStudentRow[]>(() => {
		if (!isOpen) return [];

		return students.map((student) => {
			const middleName = (student.middleName || "").trim();
			const firstName = (student.firstName || "").trim();
			const notesMapValue = notesByStudentId[student.id];
			const notes =
				notesMapValue !== undefined
					? notesMapValue
					: (student.notes || "").trim();

			const practiceProjectScores: Record<
				string,
				Map<string, { hasScore: boolean; score: number }>
			> = {};
			for (const practice of availablePracticeColumns) {
				practiceProjectScores[practice.code] = new Map();
			}
			const calculatedScores: Record<string, number> = {};
			const errorsByAssignment: Record<string, string[]> = {};
			const issuesByAssignment: Record<string, NotifyIssue[]> = {};

			for (const assignment of assignments) {
				const key = `${student.id}::${assignment.id}`;
				const scoreObj = scoreLookup.get(key);
				const score =
					typeof scoreObj?.scoreValue === "number" ? scoreObj.scoreValue : 0;
				calculatedScores[assignment.id] = score;
				const assignmentPracticeCode =
					resolveAssignmentPracticeCode(assignment);

				const projectNumber = extractProjectNumberFromEndpoint(
					assignment.gradingApiEndpoint,
				);
				const isExamReview = assignmentPracticeCode === "exam_review";

				if (isExamReview) {
					if (!practiceProjectScores.exam_review) {
						practiceProjectScores.exam_review = new Map();
					}
					const reviewKey = projectNumber
						? `project-${projectNumber}`
						: `assignment-${assignment.id}`;
					const current = practiceProjectScores.exam_review.get(reviewKey) ?? {
						hasScore: false,
						score: 0,
					};

					if (typeof scoreObj?.scoreValue === "number") {
						current.hasScore = true;
						current.score = Math.max(current.score, scoreObj.scoreValue);
					}

					practiceProjectScores.exam_review.set(reviewKey, current);
				} else {
					const practiceCode =
						assignmentPracticeCode ??
						(projectNumber
							? resolvePracticeByProjectNumber(projectNumber)
							: null);
					if (practiceCode) {
						if (!practiceProjectScores[practiceCode]) {
							practiceProjectScores[practiceCode] = new Map();
						}
						const practiceKey = projectNumber
							? `project-${projectNumber}`
							: `assignment-${assignment.id}`;
						const current = practiceProjectScores[practiceCode].get(
							practiceKey,
						) ?? {
							hasScore: false,
							score: 0,
						};

						if (typeof scoreObj?.scoreValue === "number") {
							current.hasScore = true;
							current.score = Math.max(current.score, scoreObj.scoreValue);
						}

						practiceProjectScores[practiceCode].set(practiceKey, current);
					}
				}

				const taskResultIssues = getNotifyIssuesFromTaskResults(
					scoreObj?.autoGradingTaskResults,
				);
				const assignmentErrors = taskResultIssues.map((issue) =>
					normalizeIssueText(issue.message || ""),
				);

				errorsByAssignment[assignment.id] = assignmentErrors;
				issuesByAssignment[assignment.id] = taskResultIssues;
			}

			const mapValue = classificationByStudentId[student.id];
			const classification =
				mapValue !== undefined
					? mapValue
					: normalizeClassification(student.competencyLevel);
			const practiceSummaries = availablePracticeColumns.reduce(
				(acc, practice) => {
					const items = Array.from(
						(practiceProjectScores[practice.code] ?? new Map()).values(),
					);
					const completionTarget =
						practiceCompletionTargetByCode[practice.code] || 0;
					const completed = Math.min(
						completionTarget,
						items.filter((item) => item.hasScore).length,
					);
					const totalPracticeScore = items.reduce(
						(sum, item) => sum + (item.hasScore ? item.score : 0),
						0,
					);
					const practiceMaxScore = practiceMaxScoreByCode[practice.code] || 0;
					const normalizedPracticeScore =
						practiceMaxScore > 0
							? Math.max(0, Math.min(practiceMaxScore, totalPracticeScore))
							: Math.max(0, totalPracticeScore);

					acc[practice.code] = {
						completionText: `${completed}/${completionTarget}`,
						totalScore: normalizedPracticeScore,
					};

					return acc;
				},
				{} as Record<PracticeCode, PracticeSummary>,
			);
			const totalScore =
				(practiceSummaries.practice01?.totalScore ?? 0) +
				(practiceSummaries.practice02?.totalScore ?? 0) +
				(practiceSummaries.practice03?.totalScore ?? 0);
			const otthPercentage =
				maxScoreTotal > 0
					? Math.round((totalScore / maxScoreTotal) * 10000) / 100
					: 0;
			const examReviewScore = practiceSummaries.exam_review?.totalScore ?? 0;
			const examReviewPercentage =
				examReviewMaxScore > 0
					? Math.round((examReviewScore / examReviewMaxScore) * 10000) / 100
					: 0;

			return {
				id: student.id,
				middleName,
				firstName,
				notes,
				calculatedScores,
				errorsByAssignment,
				issuesByAssignment,
				totalScore,
				otthPercentage,
				examReviewPercentage,
				classification,
				practiceSummaries,
			};
		});
	}, [
		isOpen,
		students,
		assignments,
		scoreLookup,
		classificationByStudentId,
		notesByStudentId,
		availablePracticeColumns,
		maxScoreTotal,
		practiceMaxScoreByCode,
		practiceCompletionTargetByCode,
		examReviewMaxScore,
	]);

	const sortedDisplayRows = useMemo<DisplayStudentRow[]>(() => {
		const filteredRows = displayRows.filter((row) => {
			const sourceStudent = studentsById.get(row.id);
			if (showOnlyExamStudents && !isStudentTakingExam(sourceStudent)) {
				return false;
			}
			if (!searchTerm.trim()) {
				return true;
			}
			const searchLower = searchTerm.toLowerCase().trim();
			const firstName = (row.firstName || "").toLowerCase();
			const middleName = (row.middleName || "").toLowerCase();
			const fullName = `${middleName} ${firstName}`.toLowerCase();

			return (
				firstName.includes(searchLower) ||
				middleName.includes(searchLower) ||
				fullName.includes(searchLower)
			);
		});

		if (sortKey === "none") {
			return filteredRows;
		}

		const rows = [...filteredRows];
		rows.sort((left, right) => {
			const leftFirstName = (left.firstName || "").trim();
			const rightFirstName = (right.firstName || "").trim();
			const leftMiddleName = (left.middleName || "").trim();
			const rightMiddleName = (right.middleName || "").trim();
			const leftFullName = `${leftMiddleName} ${leftFirstName}`.trim();
			const rightFullName = `${rightMiddleName} ${rightFirstName}`.trim();

			if (sortKey === "name") {
				const byFirstName = vietnameseCollator.compare(
					leftFirstName,
					rightFirstName,
				);
				if (byFirstName !== 0) {
					return sortDirection === "asc" ? byFirstName : -byFirstName;
				}
				const byMiddleName = vietnameseCollator.compare(
					leftMiddleName,
					rightMiddleName,
				);
				return sortDirection === "asc" ? byMiddleName : -byMiddleName;
			}

			if (sortKey === "totalScore") {
				const byTotalScore = left.totalScore - right.totalScore;
				if (byTotalScore !== 0) {
					return sortDirection === "asc" ? byTotalScore : -byTotalScore;
				}
				const byFirstName = vietnameseCollator.compare(
					leftFirstName,
					rightFirstName,
				);
				if (byFirstName !== 0) {
					return byFirstName;
				}
				return vietnameseCollator.compare(leftMiddleName, rightMiddleName);
			}

			const leftOrder = classificationSortOrder[left.classification];
			const rightOrder = classificationSortOrder[right.classification];
			const byClassification = leftOrder - rightOrder;
			if (byClassification !== 0) {
				return sortDirection === "asc" ? byClassification : -byClassification;
			}

			return vietnameseCollator.compare(leftFullName, rightFullName);
		});

		return rows;
	}, [
		displayRows,
		sortKey,
		sortDirection,
		searchTerm,
		showOnlyExamStudents,
		studentsById,
	]);

	const excelHeaders = useMemo(
		() => [
			"STT",
			"Họ và tên đệm",
			"Tên",
			...assignments.map((assignment) =>
				getShortAssignmentName(assignment.name, assignment.gradingApiEndpoint),
			),
			"Xếp loại",
			...availablePracticeColumns.flatMap((practice) => [
				`${practice.title} - Số bài`,
				getPracticeExcelScoreHeaderLabel(practice),
			]),
			...(hasPracticeScoreColumns
				? ["Tổng điểm 3 Practice", "Tỷ lệ đạt OTTH"]
				: []),
			...(hasExamReviewScoreColumns ? ["Tỷ lệ đạt ôn thi"] : []),
			"Ghi chú",
		],
		[
			assignments,
			availablePracticeColumns,
			hasPracticeScoreColumns,
			hasExamReviewScoreColumns,
		],
	);

	const excelBody = useMemo(
		() =>
			sortedDisplayRows.map((row, index) => [
				index + 1,
				row.middleName,
				row.firstName,
				...assignments.map((assignment) =>
					formatScore(row.calculatedScores[assignment.id] ?? 0),
				),
				row.classification,
				...availablePracticeColumns.flatMap((practice) => [
					row.practiceSummaries[practice.code]?.completionText ?? "0/0",
					`${formatScore(row.practiceSummaries[practice.code]?.totalScore ?? 0)}/${formatScore(
						practiceMaxScoreByCode[practice.code] || 0,
					)}`,
				]),
				...(hasPracticeScoreColumns
					? [
							`${formatScore(row.totalScore)}/${formatScore(maxScoreTotal)}`,
							`${formatScore(row.otthPercentage)}%`,
						]
					: []),
				...(hasExamReviewScoreColumns
					? [`${formatScore(row.examReviewPercentage)}%`]
					: []),
				row.notes,
			]),
		[
			sortedDisplayRows,
			assignments,
			availablePracticeColumns,
			maxScoreTotal,
			practiceMaxScoreByCode,
			hasPracticeScoreColumns,
			hasExamReviewScoreColumns,
		],
	);

	const excelScoreComments = useMemo<ExcelCellComment[]>(() => {
		const comments: ExcelCellComment[] = [];
		const assignmentStartColumnIndex = 3;

		sortedDisplayRows.forEach((row, rowIndex) => {
			assignments.forEach((assignment, assignmentIndex) => {
				const errors = row.errorsByAssignment[assignment.id] || [];
				if (errors.length === 0) return;

				comments.push({
					row: rowIndex,
					col: assignmentStartColumnIndex + assignmentIndex,
					author: "MOS Grader",
					text: [
						`${assignment.name} - ${errors.length} lỗi`,
						...errors.map((e, i) => `${i + 1}. ${e}`),
					].join("\n"),
				});
			});
		});

		return comments;
	}, [sortedDisplayRows, assignments]);

	const excelErrorHeaders = useMemo(
		() => [
			"STT",
			"Họ và tên đệm",
			"Tên",
			"Bài tập",
			"Điểm",
			"Số lỗi",
			"Chi tiết lỗi",
		],
		[],
	);

	const excelClassificationStatsHeaders = useMemo(
		() => ["Xếp loại", "Số lượng", "Tỷ lệ (%)"],
		[],
	);

	const excelClassificationStatsBody = useMemo(() => {
		const totalStudents = sortedDisplayRows.length;
		const rows: (string | number)[][] = classificationLevels.map((level) => {
			const count = sortedDisplayRows.filter(
				(row) => row.classification === level,
			).length;
			const percentage =
				totalStudents > 0
					? Math.round((count / totalStudents) * 10000) / 100
					: 0;
			return [level, count, `${formatScore(percentage)}%`];
		});

		rows.push([
			"Tổng học sinh",
			totalStudents,
			totalStudents > 0 ? "100%" : "0%",
		]);

		return rows;
	}, [sortedDisplayRows]);

	const excelErrorBody = useMemo(() => {
		const rows: (string | number)[][] = [];
		let index = 1;
		for (const row of sortedDisplayRows) {
			for (const assignment of assignments) {
				const errors = row.errorsByAssignment[assignment.id] || [];
				if (errors.length === 0) continue;
				rows.push([
					index,
					row.middleName || "--",
					row.firstName || "--",
					assignment.name,
					formatScore(row.calculatedScores[assignment.id] ?? 0),
					errors.length,
					errors.map((e, i) => `${i + 1}. ${e}`).join("\n"),
				]);
				index += 1;
			}
		}
		return rows;
	}, [sortedDisplayRows, assignments]);

	const titleClassName = (classDisplayName || "").trim() || "Chưa đặt tên lớp";
	const headerTitle = (title || "").trim() || `Bảng điểm lớp ${titleClassName}`;
	const safeClassName = sanitizeFileNamePart(titleClassName);
	const exportExcelFileName = `Bảng điểm ${safeClassName}`;
	const exportPdfFileName = `Bảng điểm ${safeClassName}.pdf`;

	const handleExportExcel = useCallback(() => {
		const assignmentColumnWidths = assignments.map(() => 18);
		const practiceCompletionColumnWidths = availablePracticeColumns.map(
			() => 14,
		);
		const practiceScoreColumnWidths = availablePracticeColumns.map(() => 16);
		const colWidths = [
			6,
			24,
			14,
			...assignmentColumnWidths,
			12,
			...practiceCompletionColumnWidths,
			...practiceScoreColumnWidths,
			...(hasPracticeScoreColumns ? [16, 12] : []),
			...(hasExamReviewScoreColumns ? [12] : []),
			34,
		];
		const extraSheets = [
			{
				sheetName: "ThongKeXepLoai",
				header: excelClassificationStatsHeaders,
				body: excelClassificationStatsBody,
				title: `Thống kê xếp loại - ${titleClassName}`,
				colWidths: [18, 12, 14],
			},
			...(excelErrorBody.length > 0
				? [
						{
							sheetName: "ChiTietLoi",
							header: excelErrorHeaders,
							body: excelErrorBody,
							title: `Chi tiết lỗi - ${titleClassName}`,
							colWidths: [6, 24, 14, 24, 10, 8, 80],
						},
					]
				: []),
		];

		exportToExcel(exportExcelFileName, "BangDiem", excelHeaders, excelBody, {
			title: `Bảng điểm lớp ${titleClassName}`,
			colWidths,
			comments: excelScoreComments,
			extraSheets,
		});
	}, [
		assignments,
		availablePracticeColumns,
		hasPracticeScoreColumns,
		hasExamReviewScoreColumns,
		excelClassificationStatsHeaders,
		excelClassificationStatsBody,
		titleClassName,
		excelErrorBody,
		excelErrorHeaders,
		exportExcelFileName,
		excelHeaders,
		excelBody,
		excelScoreComments,
	]);

	const handleExportPdf = useCallback(() => {
		exportToPdf("score-table", exportPdfFileName);
	}, [exportPdfFileName]);

	const setPracticeGroupDisplayMode = useCallback(
		(practiceCode: PracticeCode, mode: AssignmentColumnDisplayMode) => {
			const visible = mode !== "hidden";
			const assignmentIds = assignmentIdsByPractice[practiceCode] || [];
			const completionKey = `summary:${getSummaryColumnKey(practiceCode, "completion")}`;
			const scoreKey = `summary:${getSummaryColumnKey(practiceCode, "score")}`;

			setColumnVisibility((prev) => {
				const next = { ...prev };
				for (const assignmentId of assignmentIds) {
					next[`assignment:${assignmentId}`] = visible;
				}
				next[completionKey] = visible;
				next[scoreKey] = visible;
				return next;
			});
		},
		[assignmentIdsByPractice],
	);

	const handleTogglePracticeGroupDisplay = useCallback(
		(practiceCode: PracticeCode) => {
			const nextMode = practiceGroupVisibility[practiceCode]?.isVisible
				? "hidden"
				: "full";
			setPracticeGroupDisplayMode(practiceCode, nextMode);
		},
		[practiceGroupVisibility, setPracticeGroupDisplayMode],
	);

	const handleApplyPracticeGroupDisplayForAll = useCallback(
		(mode: AssignmentColumnDisplayMode) => {
			for (const practice of availablePracticeColumns) {
				setPracticeGroupDisplayMode(practice.code, mode);
			}
		},
		[availablePracticeColumns, setPracticeGroupDisplayMode],
	);

	const handleClassificationChange = useCallback(
		async (studentId: string, nextLevel: CompetencyLevel) => {
			const previousLevel = classificationByStudentId[studentId] ?? "";
			setClassificationByStudentId((prev) => ({
				...prev,
				[studentId]: nextLevel,
			}));

			const student = studentsById.get(studentId);
			if (!student) return;

			if (student.id.startsWith("temp-")) {
				onStudentClassificationUpdated?.(studentId, nextLevel);
				return;
			}

			setSavingClassificationStudentId(studentId);
			try {
				const fallbackStatus = student.isActive ? "Active" : "Inactive";
				const status = (student.status || "").trim() || fallbackStatus;
				const notes = (
					notesByStudentId[studentId] ??
					(student.notes || "")
				).trim();

				await studentService.updateStudent(
					studentId,
					{
						middleName: (student.middleName || "").trim(),
						firstName: (student.firstName || "").trim(),
						status,
						competencyLevel: nextLevel,
						notes,
						classId: student.classId,
					},
					getAccessToken,
				);
				onStudentClassificationUpdated?.(studentId, nextLevel);
			} catch (error) {
				setClassificationByStudentId((prev) => ({
					...prev,
					[studentId]: previousLevel,
				}));
				void showAlert({
					title: "Lỗi cập nhật",
					message:
						error instanceof Error
							? error.message
							: "Không thể cập nhật xếp loại học sinh.",
					variant: "error",
				});
			} finally {
				setSavingClassificationStudentId(null);
			}
		},
		[
			classificationByStudentId,
			studentsById,
			onStudentClassificationUpdated,
			notesByStudentId,
			getAccessToken,
		],
	);

	const handleNotesChange = useCallback((studentId: string, value: string) => {
		setNotesByStudentId((prev) => ({ ...prev, [studentId]: value }));
	}, []);

	const handleNotesBlur = useCallback(
		async (studentId: string) => {
			const student = studentsById.get(studentId);
			if (!student) return;

			const rawDraftNotes = notesByStudentId[studentId] ?? "";
			const draftNotes = rawDraftNotes.trim();
			const persistedNotes = (student.notes || "").trim();

			if (draftNotes !== rawDraftNotes) {
				setNotesByStudentId((prev) => ({ ...prev, [studentId]: draftNotes }));
			}

			if (draftNotes === persistedNotes) return;

			if (student.id.startsWith("temp-")) {
				onStudentNotesUpdated?.(studentId, draftNotes);
				return;
			}

			const fallbackStatus = student.isActive ? "Active" : "Inactive";
			const status = (student.status || "").trim() || fallbackStatus;
			const competencyLevel =
				classificationByStudentId[studentId] ??
				normalizeClassification(student.competencyLevel);

			setSavingNotesStudentId(studentId);
			try {
				await studentService.updateStudent(
					studentId,
					{
						middleName: (student.middleName || "").trim(),
						firstName: (student.firstName || "").trim(),
						status,
						competencyLevel,
						notes: draftNotes,
						classId: student.classId,
					},
					getAccessToken,
				);
				onStudentNotesUpdated?.(studentId, draftNotes);
			} catch (error) {
				setNotesByStudentId((prev) => ({
					...prev,
					[studentId]: persistedNotes,
				}));
				void showAlert({
					title: "Lỗi cập nhật",
					message:
						error instanceof Error
							? error.message
							: "Không thể cập nhật ghi chú học sinh.",
					variant: "error",
				});
			} finally {
				setSavingNotesStudentId(null);
			}
		},
		[
			studentsById,
			notesByStudentId,
			onStudentNotesUpdated,
			classificationByStudentId,
			getAccessToken,
		],
	);

	const totalScoreColumnCount =
		assignments.length +
		availablePracticeColumns.length * 2 +
		(hasPracticeScoreColumns ? 2 : 0) +
		(hasExamReviewScoreColumns ? 1 : 0);

	const visibleScoreColumnCount =
		displayedAssignments.length +
		visibleSummaryColumnCount +
		(showTotalScoreColumn ? 1 : 0) +
		(showOtthPercentageColumn ? 1 : 0) +
		(showExamReviewPercentageColumn ? 1 : 0);

	const availablePracticeGroupCount = availablePracticeColumns.length;

	return {
		// State
		classificationByStudentId,
		notesByStudentId,
		savingClassificationStudentId,
		savingNotesStudentId,
		columnVisibility,
		setColumnVisibility,
		isTotalScoreColumnVisible,
		setIsTotalScoreColumnVisible,
		isOtthPercentageColumnVisible,
		setIsOtthPercentageColumnVisible,
		isClassificationColumnVisible,
		setIsClassificationColumnVisible,
		sortKey,
		setSortKey,
		sortDirection,
		setSortDirection,
		searchTerm,
		setSearchTerm,
		showOnlyExamStudents,
		setShowOnlyExamStudents,

		// Computed
		assignmentsById,
		availablePracticeColumns,
		displayedAssignments,
		practiceMetricsByCode,
		practiceMaxScoreByCode,
		practiceCompletionTargetByCode,
		maxScoreTotal,
		examReviewMaxScore,
		hasPracticeScoreColumns,
		hasExamReviewScoreColumns,
		showTotalScoreColumn,
		showOtthPercentageColumn,
		showExamReviewPercentageColumn,
		visibleSummaryColumnCount,
		staticColumnCount,
		practiceGroupVisibility,
		areAllPracticeGroupsVisible,
		areAllPracticeGroupsHidden,
		displayRows,
		sortedDisplayRows,
		filteredStudentCount,
		titleClassName,
		headerTitle,
		totalScoreColumnCount,
		visibleScoreColumnCount,
		availablePracticeGroupCount,

		// Handlers
		handleExportExcel,
		handleExportPdf,
		handleClassificationChange,
		handleNotesChange,
		handleNotesBlur,
		handleTogglePracticeGroupDisplay,
		handleApplyPracticeGroupDisplayForAll,
		setPracticeGroupDisplayMode,
		isAssignmentVisible,
		isSummaryColumnVisible,
	};
}

export type ScoreboardState = ReturnType<typeof useScoreboardState>;
