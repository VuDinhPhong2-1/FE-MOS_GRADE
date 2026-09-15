import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogOverlay,
	DialogPortal,
	Icon,
	IconButton,
	Select,
	TextField,
} from "@bug-on/m3-expressive";
import type { FC } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { showAlert } from "../../components/common";
import { useAuth } from "../../context/AuthContext";
import studentService from "../../services/student.service";
import type { AutoGradingTaskResultRequest } from "../../types/score.types";
import type { Student } from "../../types/student.types";
import type { ExcelCellComment } from "../../utils/exportUtils";
import { exportToExcel, exportToPdf } from "../../utils/exportUtils";
import {
	getNotifyIssuesFromTaskResults,
	normalizeIssueText,
} from "../../utils/gradingIssues";
import { type NotifyIssue, notify } from "../../utils/notify";

import {
	type AssignmentColumnDisplayMode,
	type CompetencyLevel,
	classificationClassMap,
	classificationLevels,
	classificationSortOrder,
	type DisplayStudentRow,
	extractProjectNumberFromEndpoint,
	formatScore,
	getPercentagePillClass,
	getPracticeCompletionHeaderLabel,
	getPracticeExcelScoreHeaderLabel,
	getPracticeScoreHeaderLabel,
	getScorePillClass,
	getSummaryColumnKey,
	isStudentTakingExam,
	normalizeClassification,
	PRACTICE_COLUMN_THEME,
	PRACTICE_COLUMNS,
	PRACTICE_COMPLETION_TARGETS,
	PRACTICE_MAX_SCORE,
	type PracticeCode,
	type PracticeSummary,
	resolveAssignmentPracticeCode,
	resolvePracticeByProjectNumber,
	SCORE_SORT_KEY_OPTIONS,
	type ScoreTableSortDirection,
	type ScoreTableSortKey,
	sanitizeFileNamePart,
	type ViewAllScoresModalProps,
	vietnameseCollator,
} from "./utils/scoreboardUtils";

const ViewAllScoresModal: FC<ViewAllScoresModalProps> = ({
	isOpen,
	onClose,
	assignments,
	students,
	classDisplayName,
	displayMode = "modal",
	title,
	onStudentClassificationUpdated,
	onStudentNotesUpdated,
	scores,
}) => {
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
			for (const practice of PRACTICE_COLUMNS) {
				const completionKey = `summary:${getSummaryColumnKey(practice.code, "completion")}`;
				const scoreKey = `summary:${getSummaryColumnKey(practice.code, "score")}`;
				if (next[completionKey] === undefined) next[completionKey] = true;
				if (next[scoreKey] === undefined) next[scoreKey] = true;
			}
			return next;
		});
	}, [isOpen, assignments]);

	useEffect(() => {
		if (!isOpen) return;
		setSortKey("name");
		setSortDirection("asc");
		setSearchTerm("");
		setShowOnlyExamStudents(false);
		setIsTotalScoreColumnVisible(true);
		setIsOtthPercentageColumnVisible(true);
	}, [isOpen]);

	const maxScoreTotal = useMemo(
		() =>
			assignments.reduce((sum, assignment) => {
				const practiceCode = resolveAssignmentPracticeCode(assignment);
				if (!practiceCode || practiceCode === "exam_review") {
					return sum;
				}
				return sum + (assignment.maxScore || 0);
			}, 0),
		[assignments],
	);

	const examReviewMaxScore = useMemo(() => {
		const maxScoreByReviewKey = new Map<string, number>();

		for (const assignment of assignments) {
			if (resolveAssignmentPracticeCode(assignment) !== "exam_review") {
				continue;
			}

			const projectNumber = extractProjectNumberFromEndpoint(
				assignment.gradingApiEndpoint,
			);
			const reviewKey = projectNumber
				? `project-${projectNumber}`
				: `assignment-${assignment.id}`;
			const currentMax = maxScoreByReviewKey.get(reviewKey) ?? 0;
			const assignmentMaxScore = assignment.maxScore || 0;
			maxScoreByReviewKey.set(
				reviewKey,
				Math.max(currentMax, assignmentMaxScore),
			);
		}

		return Array.from(maxScoreByReviewKey.values()).reduce(
			(sum, value) => sum + value,
			0,
		);
	}, [assignments]);

	const practiceMaxScoreByCode = useMemo<Record<PracticeCode, number>>(
		() => ({
			practice01: PRACTICE_MAX_SCORE,
			practice02: PRACTICE_MAX_SCORE,
			practice03: PRACTICE_MAX_SCORE,
			exam_review: examReviewMaxScore,
		}),
		[examReviewMaxScore],
	);

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

	const assignmentIdsByPractice = useMemo(() => {
		const next: Record<PracticeCode, string[]> = {
			practice01: [],
			practice02: [],
			practice03: [],
			exam_review: [],
		};

		for (const assignment of assignments) {
			const practiceCode = resolveAssignmentPracticeCode(assignment);
			if (!practiceCode) continue;
			next[practiceCode].push(assignment.id);
		}

		return next;
	}, [assignments]);

	const visibleSummaryColumnCount = useMemo(
		() =>
			PRACTICE_COLUMNS.reduce((count, practice) => {
				const completionVisible = isSummaryColumnVisible(
					getSummaryColumnKey(practice.code, "completion"),
				);
				const scoreVisible = isSummaryColumnVisible(
					getSummaryColumnKey(practice.code, "score"),
				);
				return count + (completionVisible ? 1 : 0) + (scoreVisible ? 1 : 0);
			}, 0),
		[isSummaryColumnVisible],
	);

	const staticColumnCount =
		3 +
		(isClassificationColumnVisible ? 1 : 0) +
		visibleSummaryColumnCount +
		(isTotalScoreColumnVisible ? 1 : 0) +
		(isOtthPercentageColumnVisible ? 1 : 0) +
		1 +
		1;

	const practiceGroupVisibility = useMemo(() => {
		return PRACTICE_COLUMNS.reduce(
			(acc, practice) => {
				const assignmentIds = assignmentIdsByPractice[practice.code];
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
						visibleAssignmentCount > 0 || completionVisible || scoreVisible,
				};

				return acc;
			},
			{} as Record<
				PracticeCode,
				{
					totalAssignments: number;
					visibleAssignments: number;
					summaryVisible: boolean;
					isVisible: boolean;
				}
			>,
		);
	}, [assignmentIdsByPractice, isAssignmentVisible, isSummaryColumnVisible]);

	const areAllPracticeGroupsVisible = useMemo(
		() =>
			PRACTICE_COLUMNS.every(
				(practice) => practiceGroupVisibility[practice.code].isVisible,
			),
		[practiceGroupVisibility],
	);

	const areAllPracticeGroupsHidden = useMemo(
		() =>
			PRACTICE_COLUMNS.every(
				(practice) => !practiceGroupVisibility[practice.code].isVisible,
			),
		[practiceGroupVisibility],
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

			let totalScore = 0;
			const practiceProjectScores: Record<
				PracticeCode,
				Map<string, { hasScore: boolean; score: number }>
			> = {
				practice01: new Map(),
				practice02: new Map(),
				practice03: new Map(),
				exam_review: new Map(),
			};
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
				if (
					assignmentPracticeCode &&
					assignmentPracticeCode !== "exam_review"
				) {
					totalScore += score;
				}

				const projectNumber = extractProjectNumberFromEndpoint(
					assignment.gradingApiEndpoint,
				);
				const isExamReview = assignmentPracticeCode === "exam_review";

				if (isExamReview) {
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
					const practiceCode = projectNumber
						? resolvePracticeByProjectNumber(projectNumber)
						: null;
					if (projectNumber && practiceCode) {
						const practiceKey = `project-${projectNumber}`;
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
			const practiceSummaries = PRACTICE_COLUMNS.reduce(
				(acc, practice) => {
					const items = Array.from(
						practiceProjectScores[practice.code].values(),
					);
					const completionTarget =
						PRACTICE_COMPLETION_TARGETS[practice.code] || 0;
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
			const otthPercentage =
				maxScoreTotal > 0
					? Math.round((totalScore / maxScoreTotal) * 10000) / 100
					: 0;
			const examReviewScore = practiceSummaries.exam_review.totalScore;
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
		maxScoreTotal,
		practiceMaxScoreByCode,
		examReviewMaxScore,
	]);

	const sortedDisplayRows = useMemo<DisplayStudentRow[]>(() => {
		// First, filter rows by search term
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
				// Ưu tiên sắp theo cột "Tên" trước, nếu trùng thì mới so theo "Họ và tên đệm".
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
				// If total scores are equal, sort by name
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
			...assignments.map(
				(assignment) => `${assignment.name} (tối đa ${assignment.maxScore})`,
			),
			"Xếp loại",
			...PRACTICE_COLUMNS.flatMap((practice) => [
				`${practice.title} - Số bài`,
				getPracticeExcelScoreHeaderLabel(practice),
			]),
			"Tổng điểm 3 Practice",
			"Tỷ lệ đạt OTTH",
			"Tỷ lệ đạt ôn thi",
			"Ghi chú",
		],
		[assignments],
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
				...PRACTICE_COLUMNS.flatMap((practice) => [
					row.practiceSummaries[practice.code].completionText,
					`${formatScore(row.practiceSummaries[practice.code].totalScore)}/${formatScore(
						practiceMaxScoreByCode[practice.code] || 0,
					)}`,
				]),
				`${formatScore(row.totalScore)}/${formatScore(maxScoreTotal)}`,
				`${formatScore(row.otthPercentage)}%`,
				`${formatScore(row.examReviewPercentage)}%`,
				row.notes,
			]),
		[sortedDisplayRows, assignments, maxScoreTotal, practiceMaxScoreByCode],
	);

	const excelScoreComments = useMemo<ExcelCellComment[]>(() => {
		const comments: ExcelCellComment[] = [];
		const assignmentStartColumnIndex = 3; // STT, Họ và tên đệm, Tên

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

	const handleExportExcel = () => {
		const assignmentColumnWidths = assignments.map(() => 18);
		const practiceCompletionColumnWidths = PRACTICE_COLUMNS.map(() => 14);
		const practiceScoreColumnWidths = PRACTICE_COLUMNS.map(() => 16);
		const colWidths = [
			6,
			24,
			14,
			...assignmentColumnWidths,
			12,
			...practiceCompletionColumnWidths,
			...practiceScoreColumnWidths,
			16,
			12,
			12,
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
	};

	const handleExportPdf = () => {
		exportToPdf("score-table", exportPdfFileName);
	};

	const setPracticeGroupDisplayMode = (
		practiceCode: PracticeCode,
		mode: AssignmentColumnDisplayMode,
	) => {
		const visible = mode !== "hidden";
		const assignmentIds = assignmentIdsByPractice[practiceCode];
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
	};

	const handleTogglePracticeGroupDisplay = (practiceCode: PracticeCode) => {
		const nextMode = practiceGroupVisibility[practiceCode].isVisible
			? "hidden"
			: "full";
		setPracticeGroupDisplayMode(practiceCode, nextMode);
	};

	const handleApplyPracticeGroupDisplayForAll = (
		mode: AssignmentColumnDisplayMode,
	) => {
		for (const practice of PRACTICE_COLUMNS) {
			setPracticeGroupDisplayMode(practice.code, mode);
		}
	};

	const handleClassificationChange = async (
		studentId: string,
		nextLevel: CompetencyLevel,
	) => {
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
	};

	const handleNotesChange = (studentId: string, value: string) => {
		setNotesByStudentId((prev) => ({ ...prev, [studentId]: value }));
	};

	const handleNotesBlur = async (studentId: string) => {
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
			setNotesByStudentId((prev) => ({ ...prev, [studentId]: persistedNotes }));
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
	};

	if (!isOpen) return null;
	const isPageMode = displayMode === "page";
	const totalScoreColumnCount =
		assignments.length + PRACTICE_COLUMNS.length * 2 + 2;
	const visibleScoreColumnCount =
		displayedAssignments.length +
		visibleSummaryColumnCount +
		(isTotalScoreColumnVisible ? 1 : 0) +
		(isOtthPercentageColumnVisible ? 1 : 0);
	const containerClassName = isPageMode
		? "flex w-full flex-col overflow-hidden rounded-4xl bg-m3-surface-container shadow-sm text-m3-on-surface"
		: "flex h-full w-full flex-col overflow-hidden bg-m3-surface-container-high text-m3-on-surface";
	const content = (
		<div className={containerClassName}>
			<div className="flex items-center justify-between border-b border-m3-outline-variant/30 bg-m3-surface-container-high px-4 py-4 sm:px-6 sm:py-5">
				<div className="flex items-center gap-3">
					<div className="grid h-10 w-10 place-items-center rounded-2xl bg-m3-primary font-bold text-m3-on-primary">
						BD
					</div>
					<div>
						<h2 className="text-xl font-extrabold text-m3-on-surface">
							{headerTitle}
						</h2>
						<p className="text-sm text-m3-on-surface-variant">
							{sortedDisplayRows.length}
							{searchTerm || showOnlyExamStudents
								? `/${filteredStudentCount}`
								: ""}{" "}
							học sinh hiển thị, tổng lớp {students.length},{" "}
							{assignments.length} bài tập, hiện {visibleScoreColumnCount}/
							{totalScoreColumnCount} cột điểm
						</p>
					</div>
				</div>
				<IconButton
					type="button"
					colorStyle="standard"
					aria-label="Đóng"
					onClick={onClose}
				>
					<Icon name="close" />
				</IconButton>
			</div>

			<div className="flex-1 overflow-auto px-2 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4 lg:px-5">
				<div className="mb-3 rounded-2xl border border-m3-outline-variant/30 bg-m3-surface-container p-4 shadow-2xs text-m3-on-surface">
					<div className="mb-3 flex flex-wrap items-center justify-between gap-3">
						<div className="text-sm font-semibold text-m3-on-surface">
							Tùy chỉnh cột điểm
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<div className="flex items-center gap-1.5">
								<Button
									type="button"
									size="sm"
									colorStyle={
										areAllPracticeGroupsVisible ? "filled" : "outlined"
									}
									onClick={() => handleApplyPracticeGroupDisplayForAll("full")}
								>
									Hiện 4 phần chính
								</Button>
								<Button
									type="button"
									size="sm"
									colorStyle={areAllPracticeGroupsHidden ? "tonal" : "outlined"}
									onClick={() =>
										handleApplyPracticeGroupDisplayForAll("hidden")
									}
								>
									Ẩn 4 phần chính
								</Button>
							</div>

							<Button
								type="button"
								size="sm"
								colorStyle={
									isClassificationColumnVisible ? "filled" : "outlined"
								}
								onClick={() =>
									setIsClassificationColumnVisible((prev) => !prev)
								}
							>
								<Icon
									name={
										isClassificationColumnVisible
											? "visibility_off"
											: "visibility"
									}
									className="text-sm mr-1.5"
								/>
								{isClassificationColumnVisible
									? "Ẩn cột xếp loại"
									: "Hiện cột xếp loại"}
							</Button>

							<Button
								type="button"
								size="sm"
								colorStyle={isTotalScoreColumnVisible ? "filled" : "outlined"}
								onClick={() => setIsTotalScoreColumnVisible((prev) => !prev)}
							>
								<Icon
									name={
										isTotalScoreColumnVisible ? "visibility_off" : "visibility"
									}
									className="text-sm mr-1.5"
								/>
								{isTotalScoreColumnVisible
									? "Ẩn cột tổng điểm 3 Practice"
									: "Hiện cột tổng điểm 3 Practice"}
							</Button>

							<Button
								type="button"
								size="sm"
								colorStyle={
									isOtthPercentageColumnVisible ? "filled" : "outlined"
								}
								onClick={() =>
									setIsOtthPercentageColumnVisible((prev) => !prev)
								}
							>
								<Icon
									name={
										isOtthPercentageColumnVisible
											? "visibility_off"
											: "visibility"
									}
									className="text-sm mr-1.5"
								/>
								{isOtthPercentageColumnVisible
									? "Ẩn cột tỷ lệ đạt OTTH"
									: "Hiện cột tỷ lệ đạt OTTH"}
							</Button>

							<div className="flex items-center gap-2 rounded-2xl border border-m3-outline-variant/30 bg-m3-surface-container px-2.5 py-1">
								<span className="text-xs font-semibold text-m3-on-surface-variant">
									Sắp xếp
								</span>
								<div className="w-44">
									<Select
										value={sortKey}
										onChange={(val) => {
											const nextSortKey = val as ScoreTableSortKey;
											setSortKey(nextSortKey);
											if (nextSortKey === "name") {
												setSortDirection("asc");
											}
										}}
										options={SCORE_SORT_KEY_OPTIONS}
									/>
								</div>
								<Button
									type="button"
									size="sm"
									colorStyle="tonal"
									disabled={sortKey === "none"}
									onClick={() =>
										setSortDirection((prev) =>
											prev === "asc" ? "desc" : "asc",
										)
									}
									title="Đảo chiều sắp xếp"
								>
									<Icon
										name={
											sortDirection === "asc"
												? "arrow_upward"
												: "arrow_downward"
										}
										className="text-xs mr-1"
									/>
									{sortKey === "name"
										? sortDirection === "asc"
											? "A → Z"
											: "Z → A"
										: sortDirection === "asc"
											? "Tăng dần"
											: "Giảm dần"}
								</Button>
							</div>
						</div>
					</div>

					<div className="mb-3 flex flex-wrap items-center gap-3">
						<div className="flex-1 min-w-50 max-w-100">
							<TextField
								value={searchTerm}
								onChange={(val) => setSearchTerm(val)}
								placeholder="Tìm kiếm tên học sinh..."
								leadingIcon={<Icon name="search" />}
								className="w-full"
							/>
						</div>
						<label
							htmlFor="filter-only-exam-students"
							className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-m3-outline-variant/40 bg-m3-surface-container px-3 py-2 text-sm text-m3-on-surface select-none"
						>
							<Checkbox
								id="filter-only-exam-students"
								checked={showOnlyExamStudents}
								onCheckedChange={(checked) =>
									setShowOnlyExamStudents(Boolean(checked))
								}
							/>
							<span>Chỉ học sinh đi thi</span>
						</label>
						<div className="text-sm text-m3-on-surface-variant">
							Kết quả:{" "}
							<span className="font-semibold text-m3-on-surface">
								{sortedDisplayRows.length}/{filteredStudentCount}
							</span>
						</div>
						{(searchTerm || showOnlyExamStudents) && (
							<Button
								type="button"
								size="sm"
								colorStyle="outlined"
								onClick={() => {
									setSearchTerm("");
									setShowOnlyExamStudents(false);
								}}
							>
								<Icon name="close" className="text-xs mr-1" />
								Xóa bộ lọc
							</Button>
						)}
					</div>

					<div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
						{PRACTICE_COLUMNS.map((practice) => {
							const visibility = practiceGroupVisibility[practice.code];
							const isVisible = visibility.isVisible;

							return (
								<div
									key={`practice-group-${practice.code}`}
									className="rounded-2xl border border-m3-outline-variant/30 bg-m3-surface-container p-3 text-xs text-m3-on-surface"
								>
									<div className="flex items-center justify-between gap-2">
										<div className="min-w-0">
											<div className="truncate font-semibold text-m3-on-surface">
												{practice.title}
											</div>
											<div className="text-[11px] text-m3-on-surface-variant">
												{visibility.visibleAssignments}/
												{visibility.totalAssignments} bài tập, cột tổng hợp{" "}
												{visibility.summaryVisible ? "đang hiện" : "đang ẩn"}.
											</div>
										</div>
										<Button
											type="button"
											size="sm"
											colorStyle={isVisible ? "tonal" : "outlined"}
											onClick={() =>
												handleTogglePracticeGroupDisplay(practice.code)
											}
										>
											<Icon
												name={isVisible ? "visibility_off" : "visibility"}
												className="text-xs mr-1"
											/>
											{isVisible ? "Ẩn" : "Hiện"}
										</Button>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div
					id="score-table"
					className="relative overflow-hidden rounded-2xl border border-m3-outline-variant/60 bg-m3-surface shadow-xs"
				>
					<div className="flex items-center justify-between border-b border-m3-outline-variant/40 bg-m3-surface-container-high px-4 py-2.5 text-sm font-semibold text-m3-on-surface">
						<span>Bảng điểm lớp {titleClassName}</span>
						<span className="text-xs font-medium text-m3-on-surface-variant">
							Nhấn badge lỗi để xem chi tiết
						</span>
					</div>
					<div className="min-h-72 max-h-[calc(100vh-20rem)] overflow-auto">
						<table className="w-full min-w-485 border-separate border-spacing-0 text-sm text-m3-on-surface">
							<thead className="z-20">
								<tr className="border-b border-m3-outline-variant/60 bg-m3-surface-container-high">
									<th
										className="sticky top-0 z-50 border-r border-m3-outline-variant/60 bg-m3-surface-container-high px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-m3-on-surface shadow-[1px_0_0_0_rgba(100,116,139,0.45)]"
										style={{ left: 0, width: 70, minWidth: 70 }}
									>
										STT
									</th>
									<th
										className="sticky top-0 z-50 border-r border-m3-outline-variant/60 bg-m3-surface-container-high px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-m3-on-surface shadow-[1px_0_0_0_rgba(100,116,139,0.45)]"
										style={{ left: 70, width: 220, minWidth: 220 }}
									>
										Họ và tên đệm
									</th>
									<th
										className="sticky top-0 z-50 border-r border-m3-outline-variant/60 bg-m3-surface-container-high px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-m3-on-surface shadow-[1px_0_0_0_rgba(100,116,139,0.45)]"
										style={{ left: 290, width: 120, minWidth: 120 }}
									>
										Tên
									</th>
									{displayedAssignments.map((assignment) => {
										return (
											<th
												key={assignment.id}
												className="sticky top-0 z-40 min-w-35 border-r border-m3-outline-variant/60 bg-m3-surface-container-high px-3 py-3 text-center text-xs font-bold text-m3-on-surface"
											>
												<div title={assignment.name}>{assignment.name}</div>
												<div className="text-[11px] font-normal text-m3-on-surface-variant">
													(tối đa {assignment.maxScore})
												</div>
											</th>
										);
									})}
									{isClassificationColumnVisible && (
										<th className="sticky top-0 z-40 min-w-32.5 border-r border-m3-outline-variant/60 bg-m3-surface-container-high px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-m3-on-surface">
											Xếp loại
										</th>
									)}
									{PRACTICE_COLUMNS.flatMap((practice) => {
										const theme = PRACTICE_COLUMN_THEME[practice.code];
										const completionVisible = isSummaryColumnVisible(
											getSummaryColumnKey(practice.code, "completion"),
										);
										const scoreVisible = isSummaryColumnVisible(
											getSummaryColumnKey(practice.code, "score"),
										);
										return [
											completionVisible ? (
												<th
													key={`${practice.code}-completion-sub`}
													className={`sticky top-0 z-40 min-w-28 border-l border-m3-outline-variant/60 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide ${theme.completionHeader}`}
												>
													{getPracticeCompletionHeaderLabel(practice)}
												</th>
											) : null,
											scoreVisible ? (
												<th
													key={`${practice.code}-score-sub`}
													className={`sticky top-0 z-40 min-w-33 border-r border-m3-outline-variant/60 px-3 py-3 text-right text-xs font-bold uppercase tracking-wide ${theme.scoreHeader}`}
												>
													{getPracticeScoreHeaderLabel(practice)}
												</th>
											) : null,
										];
									})}
									{isTotalScoreColumnVisible && (
										<th className="sticky top-0 z-40 min-w-35 border-l border-m3-outline-variant/60 bg-m3-secondary-container px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-m3-on-secondary-container">
											Tổng điểm 3 Practice
										</th>
									)}
									{isOtthPercentageColumnVisible && (
										<th className="sticky top-0 z-40 min-w-32.5 border-l border-m3-outline-variant/60 bg-m3-primary-container px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-m3-on-primary-container">
											Tỷ lệ đạt OTTH
										</th>
									)}
									<th className="sticky top-0 z-40 min-w-32.5 border-l border-m3-outline-variant/60 bg-m3-tertiary-container px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-m3-on-tertiary-container">
										Tỷ lệ đạt ôn thi
									</th>
									<th className="sticky top-0 z-40 min-w-55 border-l border-m3-outline-variant/60 bg-m3-surface-container-high px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-m3-on-surface">
										Ghi chú
									</th>
								</tr>
							</thead>

							<tbody>
								{sortedDisplayRows.map((row, index) => {
									const stickyBgClass =
										index % 2 === 0
											? "bg-m3-surface"
											: "bg-m3-surface-container-low";
									return (
										<tr
											key={row.id}
											className={`${
												index % 2 === 0
													? "bg-m3-surface"
													: "bg-m3-surface-container-low"
											} transition-colors hover:bg-m3-surface-container-high/60`}
										>
											<td
												className={`sticky z-30 border-r border-m3-outline-variant/40 px-3 py-3 text-center font-medium text-m3-on-surface-variant shadow-[1px_0_0_0_rgba(148,163,184,0.35)] ${stickyBgClass}`}
												style={{ left: 0, width: 70, minWidth: 70 }}
											>
												{index + 1}
											</td>
											<td
												className={`sticky z-30 border-r border-m3-outline-variant/40 px-4 py-3 font-medium text-m3-on-surface shadow-[1px_0_0_0_rgba(148,163,184,0.35)] ${stickyBgClass}`}
												style={{ left: 70, width: 220, minWidth: 220 }}
											>
												{row.middleName || "--"}
											</td>
											<td
												className={`sticky z-30 border-r border-m3-outline-variant/40 px-4 py-3 font-semibold text-m3-on-surface shadow-[1px_0_0_0_rgba(148,163,184,0.35)] ${stickyBgClass}`}
												style={{ left: 290, width: 120, minWidth: 120 }}
											>
												{row.firstName || "--"}
											</td>

											{displayedAssignments.map((assignment) => {
												const assignmentErrors =
													row.errorsByAssignment[assignment.id] || [];
												const assignmentIssues =
													row.issuesByAssignment[assignment.id] || [];
												const score = row.calculatedScores[assignment.id] || 0;
												const maxScore = assignment.maxScore || 0;

												return (
													<td
														key={`${row.id}-${assignment.id}`}
														className="border-r border-m3-outline-variant/30 px-3 py-3 text-center align-top"
													>
														<div
															className={`mx-auto inline-flex min-w-15.5 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-bold ${getScorePillClass(score, maxScore)}`}
														>
															{formatScore(score)}
														</div>
														{assignmentErrors.length > 0 && (
															<details
																className="mt-1 text-left text-xs text-m3-error"
																onToggle={(e) => {
																	if (
																		(e.currentTarget as HTMLDetailsElement).open
																	) {
																		try {
																			notify.custom({
																				message: "Lỗi chấm tự động",
																				type: "error",
																				issues: assignmentIssues,
																				title: "Lỗi chấm tự động",
																			});
																		} catch {
																			// ignore
																		}
																	}
																}}
															>
																<summary className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-m3-error-container px-2 py-0.5 font-semibold text-m3-on-error-container hover:bg-m3-error-container/80">
																	{assignmentErrors.length} lỗi
																</summary>
																<ul className="mt-1 max-h-24 list-inside list-disc overflow-auto rounded border border-m3-error/30 bg-m3-error-container/30 p-2 text-[11px] text-m3-on-error-container">
																	{Array.from(new Set(assignmentErrors)).map(
																		(errorItem) => (
																			<li
																				key={`${row.id}-${assignment.id}-${errorItem}`}
																			>
																				{errorItem}
																			</li>
																		),
																	)}
																</ul>
															</details>
														)}
													</td>
												);
											})}

											{isClassificationColumnVisible && (
												<td className="border-r border-m3-outline-variant/40 px-3 py-3 text-center">
													<div className="inline-flex flex-col items-center gap-1">
														<select
															value={row.classification}
															disabled={
																savingClassificationStudentId === row.id
															}
															onChange={(event) =>
																void handleClassificationChange(
																	row.id,
																	event.target.value as CompetencyLevel,
																)
															}
															className={`h-8 min-w-21.5 rounded-full border px-3 text-center text-xs font-bold outline-none transition focus:ring-2 focus:ring-m3-primary/30 ${
																row.classification
																	? classificationClassMap[row.classification]
																	: "border-m3-outline-variant/40 bg-m3-surface text-m3-on-surface hover:border-m3-outline"
															} ${
																savingClassificationStudentId === row.id
																	? "cursor-not-allowed opacity-70"
																	: "hover:brightness-95"
															}`}
															title="Chỉnh sửa xếp loại học sinh"
														>
															<option value="">--</option>
															<option value="A">A</option>
															<option value="B">B</option>
															<option value="C">C</option>
															<option value="D">D</option>
														</select>
														{savingClassificationStudentId === row.id && (
															<span className="text-[11px] text-m3-on-surface-variant">
																Đang lưu...
															</span>
														)}
													</div>
												</td>
											)}

											{PRACTICE_COLUMNS.flatMap((practice) => {
												const theme = PRACTICE_COLUMN_THEME[practice.code];
												const completionVisible = isSummaryColumnVisible(
													getSummaryColumnKey(practice.code, "completion"),
												);
												const scoreVisible = isSummaryColumnVisible(
													getSummaryColumnKey(practice.code, "score"),
												);
												return [
													completionVisible ? (
														<td
															key={`${row.id}-${practice.code}-completion`}
															className={`border-l border-m3-outline-variant/40 px-4 py-3 text-center font-semibold ${theme.completionCell}`}
															title={`${practice.title}: ${formatScore(row.practiceSummaries[practice.code].totalScore)}/${formatScore(practiceMaxScoreByCode[practice.code] || 0)} điểm`}
														>
															{
																row.practiceSummaries[practice.code]
																	.completionText
															}
														</td>
													) : null,
													scoreVisible ? (
														<td
															key={`${row.id}-${practice.code}-total-score`}
															className={`border-r border-m3-outline-variant/40 px-4 py-3 text-right font-semibold ${theme.scoreCell}`}
															title={`${practice.title}: tổng điểm chuẩn hóa theo thang ${formatScore(practiceMaxScoreByCode[practice.code] || 0)}`}
														>
															{formatScore(
																row.practiceSummaries[practice.code].totalScore,
															)}
															/
															{formatScore(
																practiceMaxScoreByCode[practice.code] || 0,
															)}
														</td>
													) : null,
												];
											})}

											{isTotalScoreColumnVisible && (
												<td className="border-l border-m3-outline-variant/40 bg-m3-secondary-container/20 px-4 py-3 text-right">
													<span className="inline-flex rounded-full border border-m3-secondary/30 bg-m3-secondary-container px-2.5 py-1 text-xs font-bold text-m3-on-secondary-container">
														{formatScore(row.totalScore)}/
														{formatScore(maxScoreTotal)}
													</span>
												</td>
											)}

											{isOtthPercentageColumnVisible && (
												<td className="border-l border-m3-outline-variant/40 bg-m3-primary-container/20 px-4 py-3 text-center">
													<span
														className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getPercentagePillClass(
															row.otthPercentage,
														)}`}
													>
														{formatScore(row.otthPercentage)}%
													</span>
												</td>
											)}

											<td className="border-l border-m3-outline-variant/40 bg-m3-tertiary-container/20 px-4 py-3 text-center">
												<span
													className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getPercentagePillClass(
														row.examReviewPercentage,
													)}`}
												>
													{formatScore(row.examReviewPercentage)}%
												</span>
											</td>

											<td className="border-l border-m3-outline-variant/40 px-4 py-3 text-left text-m3-on-surface-variant">
												<div className="max-w-65 space-y-1">
													<textarea
														value={row.notes}
														onChange={(event) =>
															handleNotesChange(row.id, event.target.value)
														}
														onBlur={() => void handleNotesBlur(row.id)}
														rows={2}
														maxLength={500}
														placeholder="Nhập ghi chú..."
														disabled={savingNotesStudentId === row.id}
														className={`w-full resize-y rounded-xl border border-m3-outline-variant/40 bg-m3-surface px-2.5 py-1.5 text-xs text-m3-on-surface outline-none transition focus:border-m3-primary focus:ring-1 focus:ring-m3-primary/40 ${
															savingNotesStudentId === row.id
																? "cursor-not-allowed border-m3-outline-variant/20 bg-m3-surface-container-highest opacity-70"
																: "hover:border-m3-outline"
														}`}
													/>
													{savingNotesStudentId === row.id && (
														<span className="text-[11px] text-m3-on-surface-variant">
															Đang lưu...
														</span>
													)}
												</div>
											</td>
										</tr>
									);
								})}

								{sortedDisplayRows.length === 0 && (
									<tr>
										<td
											colSpan={displayedAssignments.length + staticColumnCount}
											className="px-4 py-8 text-center text-m3-on-surface-variant"
										>
											Chưa có dữ liệu điểm để hiển thị.
										</td>
									</tr>
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<div className="flex flex-col items-center justify-end gap-2.5 border-t border-m3-outline-variant/30 bg-m3-surface-container-high p-3 sm:flex-row sm:p-4">
				<Button
					type="button"
					colorStyle="filled"
					onClick={handleExportExcel}
					className="w-full sm:w-auto"
				>
					<Icon name="download" className="text-lg mr-1.5" /> Xuất Excel
				</Button>
				<Button
					type="button"
					colorStyle="tonal"
					onClick={handleExportPdf}
					className="w-full sm:w-auto"
				>
					<Icon name="download" className="text-lg mr-1.5" /> Xuất PDF
				</Button>
				<Button
					type="button"
					colorStyle="tonal"
					onClick={onClose}
					className="w-full sm:w-auto"
				>
					{isPageMode ? "Quay lại" : "Đóng"}
				</Button>
			</div>
		</div>
	);

	if (isPageMode) {
		return <div className="w-full">{content}</div>;
	}

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogPortal>
				<DialogOverlay className="bg-black/60 backdrop-blur-xs" />
				<DialogContent
					hideCloseButton
					className="flex h-[96vh] w-[calc(100vw-0.5rem)] max-w-480 flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 shadow-2xl border border-m3-outline-variant/30 sm:h-[94vh] sm:w-[calc(100vw-1.5rem)] text-m3-on-surface"
				>
					{content}
				</DialogContent>
			</DialogPortal>
		</Dialog>
	);
};

export default ViewAllScoresModal;
