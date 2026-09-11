import { useCallback, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { gradingService } from "../../../services/grading.service";
import { scoreService } from "../../../services/score.service";
import type { Assignment } from "../../../types/assignment.types";
import type { AutoGradingTaskResultRequest } from "../../../types/score.types";
import type { Student } from "../../../types/student.types";
import type {
	MultiAutoCellState,
	MultiScoreCellValue,
	MultiUndoSnapshot,
	PendingManualMultiFileMatch,
	PersistedScoreSnapshot,
	PracticeCode,
} from "../types/gradingFeature.types";
import { readWorkbookTitle } from "../utils/excelParser";
import {
	convertAutoScoreToAssignmentScale,
	extractAutoGradingErrors,
	extractProjectNumberFromEndpoint,
	extractProjectNumbersFromText,
	mapTaskResultsForScorePayload,
	rankProjectCandidates,
	resolveAssignmentPracticeCode,
	runLimitedConcurrency,
} from "../utils/gradingUtils";

const buildMultiUndoCellKey = (
	assignmentId: string,
	studentId: string,
): string => `${assignmentId}::${studentId}`;

interface UseMultiGradingProps {
	classId: string;
	gradingStudents: Student[];
	assignments: Assignment[];
	activeAutoAssignments: Assignment[];
	onSuccess?: () => void | Promise<void>;
}

export const useMultiGrading = ({
	classId,
	gradingStudents,
	assignments,
	activeAutoAssignments,
	onSuccess,
}: UseMultiGradingProps) => {
	const { getAccessToken } = useAuth();
	const [multiAssignmentIds, setMultiAssignmentIds] = useState<string[]>([]);
	const [multiAssignmentDraftIds, setMultiAssignmentDraftIds] = useState<
		string[]
	>([]);
	const [multiScores, setMultiScores] = useState<
		Map<string, Map<string, MultiScoreCellValue>>
	>(new Map());
	const [multiPersistedScores, setMultiPersistedScores] = useState<
		Map<string, Map<string, PersistedScoreSnapshot>>
	>(new Map());
	const [multiAutoStates, setMultiAutoStates] = useState<
		Map<string, Map<string, MultiAutoCellState>>
	>(new Map());
	const [multiUndoSnapshots, setMultiUndoSnapshots] = useState<
		Map<string, MultiUndoSnapshot>
	>(new Map());
	const [multiDragOverCellKey, setMultiDragOverCellKey] = useState<
		string | null
	>(null);
	const [multiAssignmentQuery, setMultiAssignmentQuery] = useState("");
	const [isSelectingAssignments, setIsSelectingAssignments] = useState(false);
	const [pendingManualMultiFileMatches, setPendingManualMultiFileMatches] =
		useState<PendingManualMultiFileMatch[]>([]);
	const [
		isApplyingManualMultiFileMatches,
		setIsApplyingManualMultiFileMatches,
	] = useState(false);
	const [loading, setLoading] = useState(false);
	const isSavingScoresRef = useRef(false);

	const activeAutoAssignmentIdsByPractice = useMemo<
		Record<PracticeCode, string[]>
	>(() => {
		const grouped: Record<PracticeCode, string[]> = {
			practice01: [],
			practice02: [],
			practice03: [],
			exam_review: [],
		};

		for (const assignment of activeAutoAssignments) {
			const practiceCode = resolveAssignmentPracticeCode(assignment);
			if (!practiceCode) continue;
			grouped[practiceCode].push(assignment.id);
		}

		return grouped;
	}, [activeAutoAssignments]);

	const hasPendingMultiAssignmentSelectionChanges = useMemo(() => {
		if (multiAssignmentDraftIds.length !== multiAssignmentIds.length) {
			return true;
		}
		return multiAssignmentDraftIds.some(
			(id, index) => id !== multiAssignmentIds[index],
		);
	}, [multiAssignmentDraftIds, multiAssignmentIds]);

	const filteredAutoAssignments = useMemo(() => {
		const query = multiAssignmentQuery.trim().toLowerCase();
		if (!query) return activeAutoAssignments;
		return activeAutoAssignments.filter(
			(a) =>
				a.name.toLowerCase().includes(query) ||
				(a.description || "").toLowerCase().includes(query) ||
				(a.gradingApiEndpoint || "").toLowerCase().includes(query),
		);
	}, [activeAutoAssignments, multiAssignmentQuery]);

	const normalizeMultiAssignmentIds = useCallback(
		(ids: string[]): string[] => {
			const uniqueIdsInSelectionOrder = Array.from(new Set(ids));
			const validIds = new Set(
				activeAutoAssignments.map((assignment) => assignment.id),
			);
			return uniqueIdsInSelectionOrder.filter((id) => validIds.has(id));
		},
		[activeAutoAssignments],
	);

	const initializeMultiAutoStates = useCallback(
		(assignmentIds: string[]) => {
			const autoAssignments = activeAutoAssignments.filter((assignment) =>
				assignmentIds.includes(assignment.id),
			);

			const autoMap = new Map<string, Map<string, MultiAutoCellState>>();
			for (const assignment of autoAssignments) {
				const perStudentMap = new Map<string, MultiAutoCellState>();
				for (const student of gradingStudents) {
					perStudentMap.set(student.id, {
						studentFile: null,
						isGrading: false,
						error: null,
						gradingResult: null,
					});
				}
				autoMap.set(assignment.id, perStudentMap);
			}

			setMultiAutoStates(autoMap);
		},
		[activeAutoAssignments, gradingStudents],
	);

	const loadScoresForMultipleAssignments = useCallback(
		async (assignmentIds: string[]) => {
			if (assignmentIds.length === 0) {
				setMultiScores(new Map());
				setMultiAutoStates(new Map());
				return;
			}

			try {
				initializeMultiAutoStates(assignmentIds);
				const scoreGroups = await Promise.all(
					assignmentIds.map(async (assignmentId) => {
						const data = await scoreService.getByAssignment(
							assignmentId,
							getAccessToken,
						);
						return { assignmentId, data };
					}),
				);

				const nextMap = new Map<string, Map<string, MultiScoreCellValue>>();
				const nextPersistedMap = new Map<
					string,
					Map<string, PersistedScoreSnapshot>
				>();

				for (const assignmentId of assignmentIds) {
					const rowMap = new Map<string, MultiScoreCellValue>();
					const persistedRowMap = new Map<string, PersistedScoreSnapshot>();
					for (const student of gradingStudents) {
						rowMap.set(student.id, {
							scoreValue: null,
							feedback: "",
							autoGradingErrors: [],
							autoGradingTaskResults: [],
						});
					}
					nextMap.set(assignmentId, rowMap);
					nextPersistedMap.set(assignmentId, persistedRowMap);
				}

				for (const { assignmentId, data } of scoreGroups) {
					const rowMap = nextMap.get(assignmentId);
					const persistedRowMap = nextPersistedMap.get(assignmentId);
					if (!rowMap || !persistedRowMap) continue;
					for (const item of data) {
						rowMap.set(item.studentId, {
							scoreValue:
								typeof item.scoreValue === "number" ? item.scoreValue : null,
							feedback: item.feedback || "",
							autoGradingErrors: item.autoGradingErrors || [],
							autoGradingTaskResults: item.autoGradingTaskResults || [],
						});
						persistedRowMap.set(item.studentId, {
							scoreId: item.id,
							scoreValue:
								typeof item.scoreValue === "number" ? item.scoreValue : null,
							feedback: item.feedback || "",
							autoGradingErrors: item.autoGradingErrors || [],
							autoGradingTaskResults: item.autoGradingTaskResults || [],
						});
					}
				}

				setMultiScores(nextMap);
				setMultiPersistedScores(nextPersistedMap);
			} catch (error) {
				console.error("Lỗi khi tải điểm của nhiều bài tập:", error);
				alert("Không thể tải điểm cho nhiều bài tập!");
			}
		},
		[getAccessToken, gradingStudents, initializeMultiAutoStates],
	);

	const handleToggleMultiAssignmentSelection = useCallback(
		(assignmentId: string) => {
			if (isSelectingAssignments) return;

			setMultiAssignmentDraftIds((prev) => {
				const nextIds = prev.includes(assignmentId)
					? prev.filter((id) => id !== assignmentId)
					: [...prev, assignmentId];
				return normalizeMultiAssignmentIds(nextIds);
			});
		},
		[isSelectingAssignments, normalizeMultiAssignmentIds],
	);

	const handleToggleQuickPracticeSelection = useCallback(
		(practiceCode: PracticeCode) => {
			if (isSelectingAssignments) return;

			const practiceAssignmentIds =
				activeAutoAssignmentIdsByPractice[practiceCode] || [];
			if (practiceAssignmentIds.length === 0) return;

			const isAllSelected = practiceAssignmentIds.every((id) =>
				multiAssignmentDraftIds.includes(id),
			);

			if (isAllSelected) {
				setMultiAssignmentDraftIds((prev) =>
					prev.filter((id) => !practiceAssignmentIds.includes(id)),
				);
				return;
			}

			setMultiAssignmentDraftIds((prev) => {
				const mergedSet = new Set(prev);
				for (const id of practiceAssignmentIds) {
					mergedSet.add(id);
				}

				const orderedIds = activeAutoAssignments
					.map((a) => a.id)
					.filter((id) => mergedSet.has(id));
				return normalizeMultiAssignmentIds(orderedIds);
			});
		},
		[
			isSelectingAssignments,
			activeAutoAssignmentIdsByPractice,
			multiAssignmentDraftIds,
			activeAutoAssignments,
			normalizeMultiAssignmentIds,
		],
	);

	const handleSelectAllAutoAssignments = useCallback(() => {
		if (isSelectingAssignments) return;
		setMultiAssignmentDraftIds(
			normalizeMultiAssignmentIds(activeAutoAssignments.map((a) => a.id)),
		);
	}, [
		isSelectingAssignments,
		normalizeMultiAssignmentIds,
		activeAutoAssignments,
	]);

	const handleClearAutoAssignments = useCallback(() => {
		if (isSelectingAssignments) return;
		setMultiAssignmentDraftIds([]);
	}, [isSelectingAssignments]);

	const handleCommitMultiAssignmentSelection = useCallback(async () => {
		if (isSelectingAssignments) return;
		setIsSelectingAssignments(true);
		try {
			const normalizedTargetIds = normalizeMultiAssignmentIds(
				multiAssignmentDraftIds,
			);
			setMultiAssignmentIds(normalizedTargetIds);
			await loadScoresForMultipleAssignments(normalizedTargetIds);
		} finally {
			setIsSelectingAssignments(false);
		}
	}, [
		isSelectingAssignments,
		normalizeMultiAssignmentIds,
		multiAssignmentDraftIds,
		loadScoresForMultipleAssignments,
	]);

	const handleMultiScoreChange = useCallback(
		(
			assignmentId: string,
			studentId: string,
			value: number | null,
			autoErrors?: string[],
			autoTaskResults?: AutoGradingTaskResultRequest[],
		) => {
			setMultiScores((prev) => {
				const next = new Map(prev);
				const rowMap = new Map(next.get(assignmentId) || new Map());
				const current = rowMap.get(studentId) || {
					scoreValue: null,
					feedback: "",
					autoGradingErrors: [],
					autoGradingTaskResults: [],
				};
				rowMap.set(studentId, {
					...current,
					scoreValue: value,
					autoGradingErrors: autoErrors ?? current.autoGradingErrors ?? [],
					autoGradingTaskResults:
						autoTaskResults ?? current.autoGradingTaskResults ?? [],
				});
				next.set(assignmentId, rowMap);
				return next;
			});
		},
		[],
	);

	const uploadMultiStudentFile = useCallback(
		async (
			assignmentId: string,
			studentId: string,
			file: File,
			_options?: { skipValidation?: boolean },
		) => {
			const currentAutoState = multiAutoStates
				.get(assignmentId)
				?.get(studentId);
			const currentScoreState = multiScores.get(assignmentId)?.get(studentId);
			const undoKey = buildMultiUndoCellKey(assignmentId, studentId);

			setMultiUndoSnapshots((prev) => {
				const next = new Map(prev);
				next.set(undoKey, {
					previousAutoState: {
						studentFile: currentAutoState?.studentFile || null,
						isGrading: Boolean(currentAutoState?.isGrading),
						error: currentAutoState?.error || null,
						gradingResult: currentAutoState?.gradingResult || null,
					},
					previousScoreState: {
						scoreValue: currentScoreState?.scoreValue ?? null,
						feedback: currentScoreState?.feedback || "",
						autoGradingErrors: [
							...(currentScoreState?.autoGradingErrors || []),
						],
						autoGradingTaskResults: [
							...(currentScoreState?.autoGradingTaskResults || []),
						],
					},
				});
				return next;
			});

			setMultiAutoStates((prev) => {
				const next = new Map(prev);
				const assignmentMap = new Map(next.get(assignmentId) || new Map());
				const current = assignmentMap.get(studentId);
				if (current) {
					assignmentMap.set(studentId, {
						...current,
						studentFile: file,
						isGrading: true,
						error: null,
						gradingResult: null,
					});
				}
				next.set(assignmentId, assignmentMap);
				return next;
			});

			const assignment = assignments.find((a) => a.id === assignmentId);
			const endpoint =
				assignment?.gradingApiEndpoint || "/grading/excel/project09";

			try {
				const result = await gradingService.gradeByEndpoint(
					endpoint,
					file,
					getAccessToken,
					{
						classId,
						assignmentId,
						studentId,
					},
				);
				const scaledAutoScore = convertAutoScoreToAssignmentScale(
					result,
					assignment?.maxScore,
				);

				setMultiAutoStates((prev) => {
					const next = new Map(prev);
					const assignmentMap = new Map(next.get(assignmentId) || new Map());
					const current = assignmentMap.get(studentId);
					if (current) {
						assignmentMap.set(studentId, {
							...current,
							isGrading: false,
							error: null,
							gradingResult: result,
						});
					}
					next.set(assignmentId, assignmentMap);
					return next;
				});

				const autoErrors = extractAutoGradingErrors(result);
				const autoTaskResults = mapTaskResultsForScorePayload(result);
				handleMultiScoreChange(
					assignmentId,
					studentId,
					scaledAutoScore,
					autoErrors,
					autoTaskResults,
				);
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : "Lỗi không xác định";
				setMultiAutoStates((prev) => {
					const next = new Map(prev);
					const assignmentMap = new Map(next.get(assignmentId) || new Map());
					const current = assignmentMap.get(studentId);
					if (current) {
						assignmentMap.set(studentId, {
							...current,
							isGrading: false,
							error: errorMessage,
						});
					}
					next.set(assignmentId, assignmentMap);
					return next;
				});
			}
		},
		[
			multiAutoStates,
			multiScores,
			assignments,
			getAccessToken,
			classId,
			handleMultiScoreChange,
		],
	);

	const handleMultiStudentFileChange = useCallback(
		async (
			assignmentId: string,
			studentId: string,
			e: React.ChangeEvent<HTMLInputElement>,
		) => {
			const file = e.target.files?.[0];
			if (!file) return;

			await uploadMultiStudentFile(assignmentId, studentId, file);
			e.target.value = "";
		},
		[uploadMultiStudentFile],
	);

	const handleMultiStudentFileDragOver = useCallback(
		(
			assignmentId: string,
			studentId: string,
			isDisabled: boolean,
			e: React.DragEvent<HTMLElement>,
		) => {
			e.preventDefault();
			if (isDisabled) return;

			const cellKey = `${assignmentId}:${studentId}`;
			e.dataTransfer.dropEffect = "copy";
			if (multiDragOverCellKey !== cellKey) {
				setMultiDragOverCellKey(cellKey);
			}
		},
		[multiDragOverCellKey],
	);

	const handleMultiStudentFileDragLeave = useCallback(
		(assignmentId: string, studentId: string) => {
			const cellKey = `${assignmentId}:${studentId}`;
			if (multiDragOverCellKey === cellKey) {
				setMultiDragOverCellKey(null);
			}
		},
		[multiDragOverCellKey],
	);

	const handleMultiStudentFileDrop = useCallback(
		async (
			assignmentId: string,
			studentId: string,
			isDisabled: boolean,
			e: React.DragEvent<HTMLElement>,
		) => {
			e.preventDefault();
			setMultiDragOverCellKey(null);
			if (isDisabled) return;

			const files = Array.from(e.dataTransfer?.files || []);
			if (files.length === 0) return;

			const startAssignmentIndex = multiAssignmentIds.indexOf(assignmentId);
			if (startAssignmentIndex === -1) return;

			const candidateAssignmentIds =
				multiAssignmentIds.slice(startAssignmentIndex);
			if (candidateAssignmentIds.length === 0) return;

			const assignmentIdsByProjectNumber = new Map<number, string[]>();
			for (const candidateId of candidateAssignmentIds) {
				const assignment = assignments.find((item) => item.id === candidateId);
				const projectNumber = extractProjectNumberFromEndpoint(
					assignment?.gradingApiEndpoint,
				);
				if (!projectNumber) continue;

				const existing = assignmentIdsByProjectNumber.get(projectNumber) || [];
				existing.push(candidateId);
				assignmentIdsByProjectNumber.set(projectNumber, existing);
			}

			const invalidFiles: string[] = [];
			const unresolvedFiles: Array<{
				file: File;
				reason: string;
				candidateAssignmentIds: string[];
				selectedAssignmentId: string;
			}> = [];
			const smartMatchedUploads: Array<{
				targetAssignmentId: string;
				file: File;
			}> = [];
			const usedAssignmentIds = new Set<string>();

			const resolveTargetAssignmentId = (
				rankedProjectNumbers: number[],
			): { targetAssignmentId: string | null; reason: string } => {
				if (rankedProjectNumbers.length === 0) {
					return {
						targetAssignmentId: null,
						reason: "Không tìm thấy mã project trong tên file hoặc Title.",
					};
				}

				let hasProjectInSelection = false;
				let hasOnlyUsedAssignments = false;
				for (const projectNumber of rankedProjectNumbers) {
					const assignmentIds =
						assignmentIdsByProjectNumber.get(projectNumber) || [];
					if (assignmentIds.length === 0) continue;

					hasProjectInSelection = true;
					const availableIds = assignmentIds.filter(
						(id) => !usedAssignmentIds.has(id),
					);
					if (availableIds.length === 1) {
						return { targetAssignmentId: availableIds[0], reason: "" };
					}
					if (availableIds.length > 1) {
						return {
							targetAssignmentId: null,
							reason: `Project ${projectNumber.toString().padStart(2, "0")} đang trùng nhiều cột bài tập.`,
						};
					}
					hasOnlyUsedAssignments = true;
				}

				if (hasProjectInSelection && hasOnlyUsedAssignments) {
					return {
						targetAssignmentId: null,
						reason: "Đã có file khác được gán vào project này trên cùng hàng.",
					};
				}
				if (hasProjectInSelection) {
					return {
						targetAssignmentId: null,
						reason: "Không còn cột bài tập phù hợp để tự động gán.",
					};
				}
				return {
					targetAssignmentId: null,
					reason: "Project trong file không nằm trong danh sách bài đã chọn.",
				};
			};

			for (const file of files) {
				const fileNameCandidates = extractProjectNumbersFromText(file.name);
				let workbookTitleCandidates: number[] = [];

				const initialResolution = resolveTargetAssignmentId(
					rankProjectCandidates(fileNameCandidates, workbookTitleCandidates),
				);
				if (!initialResolution.targetAssignmentId) {
					const workbookTitle = await readWorkbookTitle(file);
					if (workbookTitle) {
						workbookTitleCandidates =
							extractProjectNumbersFromText(workbookTitle);
					}
				}

				const rankedProjectNumbers = rankProjectCandidates(
					fileNameCandidates,
					workbookTitleCandidates,
				);
				const resolution = resolveTargetAssignmentId(rankedProjectNumbers);
				if (!resolution.targetAssignmentId) {
					const suggestedCandidateIds = rankedProjectNumbers
						.flatMap(
							(projectNumber) =>
								assignmentIdsByProjectNumber.get(projectNumber) || [],
						)
						.filter((id) => !usedAssignmentIds.has(id));
					const fallbackCandidateIds = candidateAssignmentIds.filter(
						(id) => !usedAssignmentIds.has(id),
					);
					const resolvedCandidateIds = Array.from(
						new Set(
							(suggestedCandidateIds.length > 0
								? suggestedCandidateIds
								: fallbackCandidateIds
							).length > 0
								? suggestedCandidateIds.length > 0
									? suggestedCandidateIds
									: fallbackCandidateIds
								: candidateAssignmentIds,
						),
					);

					unresolvedFiles.push({
						file,
						reason: resolution.reason,
						candidateAssignmentIds: resolvedCandidateIds,
						selectedAssignmentId:
							resolvedCandidateIds.length === 1 ? resolvedCandidateIds[0] : "",
					});
					continue;
				}

				usedAssignmentIds.add(resolution.targetAssignmentId);
				smartMatchedUploads.push({
					targetAssignmentId: resolution.targetAssignmentId,
					file,
				});
			}

			await runLimitedConcurrency(
				smartMatchedUploads.map(
					(upload) => () =>
						uploadMultiStudentFile(
							upload.targetAssignmentId,
							studentId,
							upload.file,
							{ skipValidation: true },
						),
				),
			);

			if (unresolvedFiles.length > 0) {
				setPendingManualMultiFileMatches((prev) => {
					const next = [...prev];
					unresolvedFiles.forEach((item, index) => {
						const fileKey = `${item.file.name}-${item.file.size}-${item.file.lastModified}`;
						const duplicateIndex = next.findIndex(
							(existing) =>
								existing.studentId === studentId &&
								existing.fileKey === fileKey,
						);
						const pendingItem: PendingManualMultiFileMatch = {
							id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
							fileKey,
							studentId,
							file: item.file,
							reason: item.reason,
							selectedAssignmentId: item.selectedAssignmentId,
							candidateAssignmentIds: item.candidateAssignmentIds,
						};

						if (duplicateIndex >= 0) {
							next[duplicateIndex] = pendingItem;
						} else {
							next.push(pendingItem);
						}
					});
					return next;
				});
			}

			if (
				smartMatchedUploads.length > 0 ||
				invalidFiles.length > 0 ||
				unresolvedFiles.length > 0
			) {
				const notes: string[] = [];
				if (smartMatchedUploads.length > 0) {
					notes.push(
						`Đã tự động nhận diện và gán ${smartMatchedUploads.length} file theo mã project.`,
					);
				}
				if (invalidFiles.length > 0) {
					notes.push(`Bỏ qua file sai định dạng: ${invalidFiles.join(", ")}`);
				}
				if (unresolvedFiles.length > 0) {
					notes.push(
						`Có ${unresolvedFiles.length} file cần chọn tay. Xử lý nhanh trong khung "File cần chọn tay" phía trên bảng.`,
					);
				}
				if (notes.length > 0) {
					alert(notes.join("\n"));
				}
			}
		},
		[multiAssignmentIds, assignments, uploadMultiStudentFile],
	);

	const handleUndoMultiStudentFile = useCallback(
		(assignmentId: string, studentId: string) => {
			const undoKey = buildMultiUndoCellKey(assignmentId, studentId);
			const snapshot = multiUndoSnapshots.get(undoKey);
			if (!snapshot) return;

			setMultiAutoStates((prev) => {
				const next = new Map(prev);
				const assignmentMap = new Map(next.get(assignmentId) || new Map());
				assignmentMap.set(studentId, {
					studentFile: snapshot.previousAutoState.studentFile,
					isGrading: false,
					error: snapshot.previousAutoState.error,
					gradingResult: snapshot.previousAutoState.gradingResult,
				});
				next.set(assignmentId, assignmentMap);
				return next;
			});

			setMultiScores((prev) => {
				const next = new Map(prev);
				const rowMap = new Map(next.get(assignmentId) || new Map());
				rowMap.set(studentId, {
					scoreValue: snapshot.previousScoreState.scoreValue,
					feedback: snapshot.previousScoreState.feedback,
					autoGradingErrors: [
						...(snapshot.previousScoreState.autoGradingErrors || []),
					],
					autoGradingTaskResults: [
						...(snapshot.previousScoreState.autoGradingTaskResults || []),
					],
				});
				next.set(assignmentId, rowMap);
				return next;
			});

			setMultiUndoSnapshots((prev) => {
				const next = new Map(prev);
				next.delete(undoKey);
				return next;
			});
		},
		[multiUndoSnapshots],
	);

	const applyPendingManualMultiFileMatches = useCallback(
		async (matches: PendingManualMultiFileMatch[]) => {
			if (isApplyingManualMultiFileMatches || matches.length === 0) return;

			setIsApplyingManualMultiFileMatches(true);
			try {
				const processedIds = new Set<string>();
				await runLimitedConcurrency(
					matches.map((item) => async () => {
						await uploadMultiStudentFile(
							item.selectedAssignmentId,
							item.studentId,
							item.file,
							{ skipValidation: true },
						);
						processedIds.add(item.id);
					}),
				);

				setPendingManualMultiFileMatches((prev) =>
					prev.filter((item) => !processedIds.has(item.id)),
				);
			} finally {
				setIsApplyingManualMultiFileMatches(false);
			}
		},
		[isApplyingManualMultiFileMatches, uploadMultiStudentFile],
	);

	const handleApplyPendingManualMultiFileMatch = useCallback(
		async (matchId: string) => {
			const target = pendingManualMultiFileMatches.find(
				(item) => item.id === matchId,
			);
			if (!target) return;
			if (!target.selectedAssignmentId) {
				alert("Vui lòng chọn cột bài tập trước khi gán file.");
				return;
			}
			await applyPendingManualMultiFileMatches([target]);
		},
		[pendingManualMultiFileMatches, applyPendingManualMultiFileMatches],
	);

	const handleApplyAllPendingManualMultiFileMatches = useCallback(async () => {
		const readyMatches = pendingManualMultiFileMatches.filter(
			(item) => item.selectedAssignmentId,
		);
		if (readyMatches.length === 0) {
			alert("Chưa có file nào được chọn cột bài tập để gán.");
			return;
		}

		const duplicateKey = new Set<string>();
		for (const match of readyMatches) {
			const key = `${match.studentId}::${match.selectedAssignmentId}`;
			if (duplicateKey.has(key)) {
				alert(
					"Có ít nhất 2 file đang chọn cùng một cột bài tập cho cùng 1 học sinh. Vui lòng chỉnh lại trước khi gán.",
				);
				return;
			}
			duplicateKey.add(key);
		}

		await applyPendingManualMultiFileMatches(readyMatches);
	}, [pendingManualMultiFileMatches, applyPendingManualMultiFileMatches]);

	const handleSaveMultipleAssignments = useCallback(async () => {
		if (multiAssignmentIds.length === 0) {
			alert("Vui lòng chọn ít nhất 1 bài tập!");
			return;
		}

		if (isSavingScoresRef.current) return;

		isSavingScoresRef.current = true;
		setLoading(true);
		try {
			const activeStudentIds = new Set(
				gradingStudents.map((student) => student.id),
			);
			const assignmentNameById = new Map(
				assignments.map((assignment) => [assignment.id, assignment.name]),
			);
			const failedAssignments: string[] = [];
			let savedAssignmentCount = 0;

			const hasScoreChanged = (
				current: MultiScoreCellValue | undefined,
				persisted: PersistedScoreSnapshot | undefined,
			): boolean => {
				if (!current) return false;
				if (!persisted) {
					return current.scoreValue !== null;
				}
				if (current.scoreValue !== persisted.scoreValue) return true;
				const currentErrors = current.autoGradingErrors || [];
				const persistedErrors = persisted.autoGradingErrors || [];
				if (currentErrors.length !== persistedErrors.length) return true;
				if (!currentErrors.every((err, idx) => err === persistedErrors[idx]))
					return true;

				const currentTaskResults = current.autoGradingTaskResults || [];
				const persistedTaskResults = persisted.autoGradingTaskResults || [];
				return (
					JSON.stringify(currentTaskResults) !==
					JSON.stringify(persistedTaskResults)
				);
			};

			for (const assignmentId of multiAssignmentIds) {
				const rowMap = multiScores.get(assignmentId);
				const persistedRowMap = multiPersistedScores.get(assignmentId);
				if (!rowMap) continue;

				const scores = Array.from(rowMap.entries())
					.filter(([studentId, item]) => {
						if (!activeStudentIds.has(studentId)) return false;
						const persistedItem = persistedRowMap?.get(studentId);
						return hasScoreChanged(item, persistedItem);
					})
					.map(([studentId, item]) => {
						const autoState = multiAutoStates.get(assignmentId)?.get(studentId);
						return {
							studentId,
							scoreValue: item.scoreValue ?? 0,
							feedback: item.feedback,
							autoGradingErrors: item.autoGradingErrors || [],
							autoGradingTaskResults: autoState?.gradingResult
								? mapTaskResultsForScorePayload(autoState.gradingResult)
								: item.autoGradingTaskResults || [],
						};
					});

				if (scores.length === 0) continue;

				try {
					await scoreService.bulkCreateOrUpdate(
						{
							assignmentId,
							classId,
							scores,
						},
						getAccessToken,
					);
					savedAssignmentCount += 1;

					setMultiPersistedScores((prev) => {
						const next = new Map(prev);
						const persisted = new Map(next.get(assignmentId) || new Map());
						for (const score of scores) {
							persisted.set(score.studentId, {
								scoreId: "",
								scoreValue: score.scoreValue,
								feedback: score.feedback,
								autoGradingErrors: score.autoGradingErrors,
								autoGradingTaskResults: score.autoGradingTaskResults,
							});
						}
						next.set(assignmentId, persisted);
						return next;
					});
				} catch (error) {
					const name = assignmentNameById.get(assignmentId) || assignmentId;
					const reason =
						error instanceof Error ? error.message : "Lỗi không xác định";
					failedAssignments.push(`${name}: ${reason}`);
				}
			}

			if (failedAssignments.length === 0) {
				alert(
					`Lưu điểm thành công cho ${savedAssignmentCount} bài tập có thay đổi!`,
				);
				if (onSuccess) await onSuccess();
				return;
			}

			if (savedAssignmentCount > 0) {
				alert(
					`Đã lưu điểm ${savedAssignmentCount} bài tập.\nMột số bài tập bị lỗi:\n${failedAssignments.join("\n")}`,
				);
				if (onSuccess) await onSuccess();
				return;
			}

			alert(`Lưu điểm thất bại:\n${failedAssignments.join("\n")}`);
		} catch (error) {
			console.error("Lỗi khi lưu điểm nhiều bài:", error);
			alert("Không thể lưu điểm các bài tập đã chọn!");
		} finally {
			isSavingScoresRef.current = false;
			setLoading(false);
		}
	}, [
		multiAssignmentIds,
		gradingStudents,
		assignments,
		multiScores,
		multiPersistedScores,
		multiAutoStates,
		classId,
		getAccessToken,
		onSuccess,
	]);

	const resetMultiGradingState = () => {
		setMultiAssignmentIds([]);
		setMultiAssignmentDraftIds([]);
		setMultiScores(new Map());
		setMultiPersistedScores(new Map());
		setMultiAutoStates(new Map());
		setMultiUndoSnapshots(new Map());
		setMultiDragOverCellKey(null);
		setMultiAssignmentQuery("");
		setIsSelectingAssignments(false);
		setPendingManualMultiFileMatches([]);
		setIsApplyingManualMultiFileMatches(false);
		setLoading(false);
		isSavingScoresRef.current = false;
	};

	return {
		multiAssignmentIds,
		setMultiAssignmentIds,
		multiAssignmentDraftIds,
		setMultiAssignmentDraftIds,
		multiScores,
		multiPersistedScores,
		multiAutoStates,
		multiUndoSnapshots,
		multiDragOverCellKey,
		multiAssignmentQuery,
		setMultiAssignmentQuery,
		isSelectingAssignments,
		pendingManualMultiFileMatches,
		setPendingManualMultiFileMatches,
		isApplyingManualMultiFileMatches,
		loading,
		activeAutoAssignmentIdsByPractice,
		hasPendingMultiAssignmentSelectionChanges,
		filteredAutoAssignments,
		loadScoresForMultipleAssignments,
		handleToggleMultiAssignmentSelection,
		handleToggleQuickPracticeSelection,
		handleSelectAllAutoAssignments,
		handleClearAutoAssignments,
		handleCommitMultiAssignmentSelection,
		handleMultiScoreChange,
		handleMultiStudentFileChange,
		handleMultiStudentFileDragOver,
		handleMultiStudentFileDragLeave,
		handleMultiStudentFileDrop,
		handleUndoMultiStudentFile,
		applyPendingManualMultiFileMatches,
		handleApplyPendingManualMultiFileMatch,
		handleApplyAllPendingManualMultiFileMatches,
		handleSaveMultipleAssignments,
		resetMultiGradingState,
	};
};
