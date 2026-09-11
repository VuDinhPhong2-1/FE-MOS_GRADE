import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { gradingService } from "../../../services/grading.service";
import { scoreService } from "../../../services/score.service";
import type { Assignment } from "../../../types/assignment.types";
import type { StudentGradingState } from "../../../types/grading.types";
import type {
	AutoGradingTaskResultRequest,
	ScoreResponse,
} from "../../../types/score.types";
import type { Student } from "../../../types/student.types";
import type {
	PersistedScoreSnapshot,
	SingleUndoSnapshot,
} from "../types/gradingFeature.types";
import {
	convertAutoScoreToAssignmentScale,
	extractAutoGradingErrors,
	getAcceptedSubmissionFileTypes,
	getReadableErrorMessage,
	mapTaskResultsForScorePayload,
	runLimitedConcurrency,
} from "../utils/gradingUtils";

interface UseSingleGradingProps {
	classId: string;
	gradingStudents: Student[];
	selectedAssignment: string;
	assignments: Assignment[];
	isOpen?: boolean;
	onSuccess?: () => void | Promise<void>;
	onClose?: () => void;
}

export const useSingleGrading = ({
	classId,
	gradingStudents,
	selectedAssignment,
	assignments,
	isOpen = true,
	onSuccess,
	onClose,
}: UseSingleGradingProps) => {
	const { getAccessToken } = useAuth();
	const [studentGradingStates, setStudentGradingStates] = useState<
		Map<string, StudentGradingState>
	>(new Map());
	const [singlePersistedScores, setSinglePersistedScores] = useState<
		Map<string, PersistedScoreSnapshot>
	>(new Map());
	const [singleUndoSnapshots, setSingleUndoSnapshots] = useState<
		Map<string, SingleUndoSnapshot>
	>(new Map());
	const [undoingSingleStudentId, setUndoingSingleStudentId] = useState<
		string | null
	>(null);
	const [singleDragOverStudentId, setSingleDragOverStudentId] = useState<
		string | null
	>(null);
	const [isBulkUploading, setIsBulkUploading] = useState(false);
	const [loading, setLoading] = useState(false);
	const isSavingScoresRef = useRef(false);

	const selectedAssignmentData = assignments.find(
		(a) => a.id === selectedAssignment,
	);

	const initializeStudentStates = useCallback(() => {
		const initialStates = new Map<string, StudentGradingState>();
		for (const student of gradingStudents) {
			initialStates.set(student.id, {
				studentId: student.id,
				studentFile: null,
				isGrading: false,
				gradingResult: null,
				error: null,
				manualScore: null,
				manualComment: "",
				autoGradingErrors: [],
			});
		}
		setStudentGradingStates(initialStates);
	}, [gradingStudents]);

	const loadExistingScores = useCallback(
		async (assignmentId: string) => {
			try {
				const data = await scoreService.getByAssignment(
					assignmentId,
					getAccessToken,
				);
				const nextPersistedScores = new Map<string, PersistedScoreSnapshot>();
				for (const item of data) {
					nextPersistedScores.set(item.studentId, {
						scoreId: item.id,
						scoreValue:
							typeof item.scoreValue === "number" ? item.scoreValue : null,
						feedback: item.feedback || "",
						autoGradingErrors: item.autoGradingErrors || [],
						autoGradingTaskResults: item.autoGradingTaskResults || [],
					});
				}
				setSinglePersistedScores(nextPersistedScores);

				setStudentGradingStates((prev) => {
					const newMap = new Map(prev);
					for (const student of gradingStudents) {
						const existingScore = data.find((s) => s.studentId === student.id);
						const currentState = newMap.get(student.id);
						if (currentState) {
							newMap.set(student.id, {
								...currentState,
								manualScore:
									typeof existingScore?.scoreValue === "number"
										? existingScore.scoreValue
										: null,
								manualComment: existingScore?.feedback || "",
								autoGradingErrors: existingScore?.autoGradingErrors || [],
							});
						}
					}
					return newMap;
				});
			} catch (error) {
				console.error("Lỗi khi tải điểm:", error);
			}
		},
		[getAccessToken, gradingStudents],
	);

	useEffect(() => {
		if (isOpen && gradingStudents.length > 0) {
			initializeStudentStates();
		}
	}, [isOpen, gradingStudents, initializeStudentStates]);

	useEffect(() => {
		if (selectedAssignment) {
			setSinglePersistedScores(new Map());
			setSingleUndoSnapshots(new Map());
			setUndoingSingleStudentId(null);
			void loadExistingScores(selectedAssignment);
		}
	}, [selectedAssignment, loadExistingScores]);

	const isValidSubmissionFileName = useCallback(
		(fileName: string): boolean => {
			const normalized = fileName.toLowerCase();
			const acceptedList = getAcceptedSubmissionFileTypes(
				selectedAssignmentData?.gradingApiEndpoint || undefined,
			)
				.split(",")
				.map((s) => s.trim().toLowerCase())
				.filter(Boolean);

			if (acceptedList.length > 0) {
				return acceptedList.some((ext) => normalized.endsWith(ext));
			}

			return [".xls", ".xlsx", ".xlsm"].some((ext) => normalized.endsWith(ext));
		},
		[selectedAssignmentData?.gradingApiEndpoint],
	);

	const validateExcelFile = useCallback(
		(file: File, showAlert = true): boolean => {
			const isValid = isValidSubmissionFileName(file.name);
			if (!isValid && showAlert) {
				const accepted = getAcceptedSubmissionFileTypes(
					selectedAssignmentData?.gradingApiEndpoint || undefined,
				);
				alert(`File phải có định dạng: ${accepted}`);
			}
			return isValid;
		},
		[isValidSubmissionFileName, selectedAssignmentData?.gradingApiEndpoint],
	);

	const saveScoreForStudent = useCallback(
		async (
			studentId: string,
			scoreValue: number,
			autoGradingErrors: string[] = [],
			autoGradingTaskResults: AutoGradingTaskResultRequest[] = [],
		): Promise<ScoreResponse | null> => {
			if (!selectedAssignment) return null;
			try {
				const result = await scoreService.bulkCreateOrUpdate(
					{
						assignmentId: selectedAssignment,
						classId: classId,
						scores: [
							{
								studentId,
								scoreValue,
								autoGradingErrors,
								autoGradingTaskResults,
							},
						],
					},
					getAccessToken,
				);
				return result.scores[0] || null;
			} catch (error) {
				console.error("Lỗi lưu điểm:", error);
				return null;
			}
		},
		[selectedAssignment, classId, getAccessToken],
	);

	const handleAutoGrade = useCallback(
		async (studentId: string, studentFile: File) => {
			const student = gradingStudents.find((item) => item.id === studentId);
			if (!student) return;

			if (!selectedAssignment) {
				alert("Vui lòng chọn bài tập trước khi chấm điểm.");
				return;
			}
			const gradingEndpoint =
				selectedAssignmentData?.gradingApiEndpoint ||
				"/grading/excel/project09";

			setStudentGradingStates((prev) => {
				const newMap = new Map(prev);
				const currentState = newMap.get(studentId);
				if (currentState) {
					newMap.set(studentId, {
						...currentState,
						isGrading: true,
						error: null,
					});
				}
				return newMap;
			});

			try {
				const result = await gradingService.gradeByEndpoint(
					gradingEndpoint,
					studentFile,
					getAccessToken,
					{
						classId,
						assignmentId: selectedAssignment,
						studentId,
					},
				);
				const scaledAutoScore = convertAutoScoreToAssignmentScale(
					result,
					selectedAssignmentData?.maxScore,
				);

				setStudentGradingStates((prev) => {
					const newMap = new Map(prev);
					const currentState = newMap.get(studentId);
					const autoErrors = extractAutoGradingErrors(result);
					if (currentState) {
						newMap.set(studentId, {
							...currentState,
							isGrading: false,
							gradingResult: result,
							error: null,
							manualScore: scaledAutoScore,
							autoGradingErrors: autoErrors,
						});
					}
					return newMap;
				});

				const autoErrors = extractAutoGradingErrors(result);
				const autoTaskResults = mapTaskResultsForScorePayload(result);
				const savedScore = await saveScoreForStudent(
					studentId,
					scaledAutoScore,
					autoErrors,
					autoTaskResults,
				);
				if (savedScore) {
					setSinglePersistedScores((prev) => {
						const next = new Map(prev);
						next.set(studentId, {
							scoreId: savedScore.id,
							scoreValue:
								typeof savedScore.scoreValue === "number"
									? savedScore.scoreValue
									: null,
							feedback: savedScore.feedback || "",
							autoGradingErrors: savedScore.autoGradingErrors || [],
							autoGradingTaskResults: savedScore.autoGradingTaskResults || [],
						});
						return next;
					});
				}
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error ? error.message : "Lỗi không xác định";
				setStudentGradingStates((prev) => {
					const newMap = new Map(prev);
					const currentState = newMap.get(studentId);
					if (currentState) {
						newMap.set(studentId, {
							...currentState,
							isGrading: false,
							error: errorMessage,
						});
					}
					return newMap;
				});
			}
		},
		[
			gradingStudents,
			selectedAssignment,
			selectedAssignmentData?.gradingApiEndpoint,
			selectedAssignmentData?.maxScore,
			getAccessToken,
			classId,
			saveScoreForStudent,
		],
	);

	const uploadStudentFile = useCallback(
		async (
			studentId: string,
			file: File,
			options?: { skipValidation?: boolean },
		) => {
			const skipValidation = options?.skipValidation ?? false;
			if (!skipValidation && !validateExcelFile(file)) {
				return;
			}

			const previousState = studentGradingStates.get(studentId);
			const previousPersistedScore =
				singlePersistedScores.get(studentId) || null;
			setSingleUndoSnapshots((prev) => {
				const next = new Map(prev);
				next.set(studentId, {
					previousState: {
						studentFile: previousState?.studentFile || null,
						isGrading: Boolean(previousState?.isGrading),
						gradingResult: previousState?.gradingResult || null,
						error: previousState?.error || null,
						manualScore: previousState?.manualScore ?? null,
						manualComment: previousState?.manualComment || "",
						autoGradingErrors: [...(previousState?.autoGradingErrors || [])],
					},
					previousPersistedScore: previousPersistedScore
						? {
								scoreId: previousPersistedScore.scoreId,
								scoreValue: previousPersistedScore.scoreValue,
								feedback: previousPersistedScore.feedback,
								autoGradingErrors: [
									...(previousPersistedScore.autoGradingErrors || []),
								],
								autoGradingTaskResults: [
									...(previousPersistedScore.autoGradingTaskResults || []),
								],
							}
						: null,
				});
				return next;
			});

			setStudentGradingStates((prev) => {
				const newMap = new Map(prev);
				const currentState = newMap.get(studentId);
				if (currentState) {
					newMap.set(studentId, {
						...currentState,
						studentFile: file,
						error: null,
						gradingResult: null,
						autoGradingErrors: [],
					});
				}
				return newMap;
			});

			await handleAutoGrade(studentId, file);
		},
		[
			validateExcelFile,
			studentGradingStates,
			singlePersistedScores,
			handleAutoGrade,
		],
	);

	const handleStudentFileChange = useCallback(
		async (studentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
			const file = e.target.files?.[0];
			if (!file) return;

			await uploadStudentFile(studentId, file);
			e.target.value = "";
		},
		[uploadStudentFile],
	);

	const handleBulkStudentFilesChange = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files || []);
			e.target.value = "";

			if (files.length === 0) return;
			if (!selectedAssignment) {
				alert("Vui lòng chọn bài tập trước khi chọn nhiều file.");
				return;
			}
			if (isBulkUploading) return;

			setIsBulkUploading(true);
			try {
				const maxCount = Math.min(files.length, gradingStudents.length);
				const invalidFiles: string[] = [];
				const gradingTasks: Array<() => Promise<void>> = [];

				for (let i = 0; i < maxCount; i++) {
					const file = files[i];
					if (!validateExcelFile(file, false)) {
						invalidFiles.push(file.name);
						continue;
					}

					const student = gradingStudents[i];
					gradingTasks.push(() =>
						uploadStudentFile(student.id, file, { skipValidation: true }),
					);
				}

				await runLimitedConcurrency(gradingTasks);

				const extraFiles = files.length - maxCount;
				if (invalidFiles.length > 0 || extraFiles > 0) {
					const notes: string[] = [];
					if (invalidFiles.length > 0) {
						notes.push(`Bỏ qua file sai định dạng: ${invalidFiles.join(", ")}`);
					}
					if (extraFiles > 0) {
						notes.push(
							`Bỏ qua ${extraFiles} file do vượt số học sinh trong danh sách.`,
						);
					}
					alert(notes.join("\n"));
				}
			} finally {
				setIsBulkUploading(false);
			}
		},
		[
			selectedAssignment,
			isBulkUploading,
			gradingStudents,
			validateExcelFile,
			uploadStudentFile,
		],
	);

	const handleStudentFileDragOver = useCallback(
		(
			studentId: string,
			isDisabled: boolean,
			e: React.DragEvent<HTMLElement>,
		) => {
			e.preventDefault();
			if (isDisabled) return;
			e.dataTransfer.dropEffect = "copy";
			if (singleDragOverStudentId !== studentId) {
				setSingleDragOverStudentId(studentId);
			}
		},
		[singleDragOverStudentId],
	);

	const handleStudentFileDragLeave = useCallback(
		(studentId: string) => {
			if (singleDragOverStudentId === studentId) {
				setSingleDragOverStudentId(null);
			}
		},
		[singleDragOverStudentId],
	);

	const handleStudentFileDrop = useCallback(
		async (
			studentId: string,
			isDisabled: boolean,
			e: React.DragEvent<HTMLElement>,
		) => {
			e.preventDefault();
			setSingleDragOverStudentId(null);
			if (isDisabled) return;

			const files = Array.from(e.dataTransfer?.files || []);
			if (files.length === 0) return;

			const startIndex = gradingStudents.findIndex((s) => s.id === studentId);
			if (startIndex === -1) return;

			const maxCount = Math.min(
				files.length,
				gradingStudents.length - startIndex,
			);
			const invalidFiles: string[] = [];
			const gradingTasks: Array<() => Promise<void>> = [];

			for (let i = 0; i < maxCount; i++) {
				const file = files[i];
				if (!validateExcelFile(file, false)) {
					invalidFiles.push(file.name);
					continue;
				}
				const targetStudent = gradingStudents[startIndex + i];
				gradingTasks.push(() =>
					uploadStudentFile(targetStudent.id, file, { skipValidation: true }),
				);
			}

			await runLimitedConcurrency(gradingTasks);

			const extraFiles = files.length - maxCount;
			if (invalidFiles.length > 0 || extraFiles > 0) {
				const notes: string[] = [];
				if (invalidFiles.length > 0) {
					notes.push(`Bỏ qua file sai định dạng: ${invalidFiles.join(", ")}`);
				}
				if (extraFiles > 0) {
					notes.push(
						`Bỏ qua ${extraFiles} file do vượt số học sinh còn lại trong danh sách.`,
					);
				}
				alert(notes.join("\n"));
			}
		},
		[gradingStudents, validateExcelFile, uploadStudentFile],
	);

	const handleUndoSingleStudentFile = useCallback(
		async (studentId: string) => {
			const currentState = studentGradingStates.get(studentId);
			if (currentState?.isGrading || undoingSingleStudentId === studentId) {
				return;
			}

			const snapshot = singleUndoSnapshots.get(studentId);
			if (!snapshot) {
				setStudentGradingStates((prev) => {
					const next = new Map(prev);
					const existing = next.get(studentId);
					if (existing) {
						next.set(studentId, {
							...existing,
							studentFile: null,
							gradingResult: null,
							error: null,
							manualScore: null,
							autoGradingErrors: [],
						});
					}
					return next;
				});
				return;
			}

			setUndoingSingleStudentId(studentId);
			try {
				setStudentGradingStates((prev) => {
					const next = new Map(prev);
					const existing = next.get(studentId);
					if (existing) {
						next.set(studentId, {
							...existing,
							studentFile: snapshot.previousState.studentFile,
							isGrading: false,
							gradingResult: snapshot.previousState.gradingResult,
							error: snapshot.previousState.error,
							manualScore: snapshot.previousState.manualScore,
							manualComment: snapshot.previousState.manualComment,
							autoGradingErrors: [
								...(snapshot.previousState.autoGradingErrors || []),
							],
						});
					}
					return next;
				});

				if (selectedAssignment) {
					const previousPersisted = snapshot.previousPersistedScore;
					if (
						previousPersisted &&
						typeof previousPersisted.scoreValue === "number"
					) {
						const restored = await scoreService.bulkCreateOrUpdate(
							{
								assignmentId: selectedAssignment,
								classId: classId,
								scores: [
									{
										studentId,
										scoreValue: previousPersisted.scoreValue,
										feedback: previousPersisted.feedback,
										autoGradingErrors:
											previousPersisted.autoGradingErrors || [],
										autoGradingTaskResults:
											previousPersisted.autoGradingTaskResults || [],
									},
								],
							},
							getAccessToken,
						);

						const restoredScore = restored.scores[0];
						if (restoredScore) {
							setSinglePersistedScores((prev) => {
								const next = new Map(prev);
								next.set(studentId, {
									scoreId: restoredScore.id,
									scoreValue:
										typeof restoredScore.scoreValue === "number"
											? restoredScore.scoreValue
											: null,
									feedback: restoredScore.feedback || "",
									autoGradingErrors: restoredScore.autoGradingErrors || [],
									autoGradingTaskResults:
										restoredScore.autoGradingTaskResults || [],
								});
								return next;
							});
						}
					} else {
						let scoreIdToDelete =
							singlePersistedScores.get(studentId)?.scoreId || null;
						if (!scoreIdToDelete) {
							const scores = await scoreService.getByAssignment(
								selectedAssignment,
								getAccessToken,
							);
							scoreIdToDelete =
								scores.find((item) => item.studentId === studentId)?.id || null;
						}

						if (scoreIdToDelete) {
							await scoreService.delete(scoreIdToDelete, getAccessToken);
						}

						setSinglePersistedScores((prev) => {
							const next = new Map(prev);
							next.delete(studentId);
							return next;
						});
					}
				}

				setSingleUndoSnapshots((prev) => {
					const next = new Map(prev);
					next.delete(studentId);
					return next;
				});
			} catch (error) {
				alert(
					error instanceof Error
						? error.message
						: "Không thể hoàn tác file vừa chọn.",
				);
				if (selectedAssignment) {
					await loadExistingScores(selectedAssignment);
				}
			} finally {
				setUndoingSingleStudentId(null);
			}
		},
		[
			studentGradingStates,
			undoingSingleStudentId,
			singleUndoSnapshots,
			selectedAssignment,
			classId,
			getAccessToken,
			singlePersistedScores,
			loadExistingScores,
		],
	);

	const handleSaveAllScores = useCallback(async () => {
		if (!selectedAssignment) {
			alert("Vui lòng chọn bài tập!");
			return;
		}

		if (isSavingScoresRef.current) return;

		isSavingScoresRef.current = true;
		setLoading(true);
		try {
			const activeStudentIds = new Set(
				gradingStudents.map((student) => student.id),
			);
			const scores = Array.from(studentGradingStates.values())
				.filter(
					(s) => s.manualScore !== null && activeStudentIds.has(s.studentId),
				)
				.map((s) => ({
					studentId: s.studentId,
					scoreValue: s.manualScore ?? 0,
					feedback: s.manualComment,
					autoGradingErrors:
						s.autoGradingErrors || extractAutoGradingErrors(s.gradingResult),
					autoGradingTaskResults: mapTaskResultsForScorePayload(
						s.gradingResult,
					),
				}));

			await scoreService.bulkCreateOrUpdate(
				{
					assignmentId: selectedAssignment,
					classId,
					scores,
				},
				getAccessToken,
			);

			alert("Lưu điểm thành công!");
			if (onSuccess) await onSuccess();
			if (onClose) onClose();
		} catch (error) {
			console.error("Lỗi khi lưu điểm:", error);
			alert(getReadableErrorMessage(error, "Không thể lưu điểm!"));
		} finally {
			isSavingScoresRef.current = false;
			setLoading(false);
		}
	}, [
		selectedAssignment,
		gradingStudents,
		studentGradingStates,
		classId,
		getAccessToken,
		onSuccess,
		onClose,
	]);

	const resetSingleGradingState = () => {
		setStudentGradingStates(new Map());
		setSinglePersistedScores(new Map());
		setSingleUndoSnapshots(new Map());
		setUndoingSingleStudentId(null);
		setSingleDragOverStudentId(null);
		setIsBulkUploading(false);
		setLoading(false);
		isSavingScoresRef.current = false;
	};

	return {
		studentGradingStates,
		singlePersistedScores,
		singleUndoSnapshots,
		undoingSingleStudentId,
		singleDragOverStudentId,
		isBulkUploading,
		loading,
		selectedAssignmentData,
		loadExistingScores,
		handleStudentFileChange,
		handleBulkStudentFilesChange,
		handleStudentFileDragOver,
		handleStudentFileDragLeave,
		handleStudentFileDrop,
		handleUndoSingleStudentFile,
		handleSaveAllScores,
		resetSingleGradingState,
	};
};
