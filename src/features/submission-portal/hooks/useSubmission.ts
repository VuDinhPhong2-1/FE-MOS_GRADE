import { useCallback, useEffect, useState } from "react";
import { submissionPortalService } from "../../../services/submission-portal.service";
import type {
	PublicPortalAssignment,
	PublicPortalSubmitResult,
} from "../../../types/submission-portal.types";

export interface UseSubmissionProps {
	token: string;
	classId: string;
	studentId: string;
	setMessage: (msg: string) => void;
	onSubmissionSuccess?: () => Promise<void>;
}

export interface UseSubmissionReturn {
	files: Record<string, File | undefined>;
	attachments: Record<string, File | undefined>;
	results: Record<string, PublicPortalSubmitResult>;
	savedResults: Record<string, PublicPortalSubmitResult>;
	loadingSubmissions: boolean;
	submittingAssignmentId: string | null;
	previewingAssignmentId: string | null;
	draggingAssignmentId: string | null;
	setDraggingAssignmentId: (id: string | null) => void;
	submit: (assignmentId: string) => Promise<void>;
	handleFileSelected: (
		assignment: PublicPortalAssignment,
		file?: File,
		attachmentFile?: File,
	) => Promise<void>;
	reloadSubmissions: () => Promise<void>;
}

export const useSubmission = ({
	token,
	classId,
	studentId,
	setMessage,
	onSubmissionSuccess,
}: UseSubmissionProps): UseSubmissionReturn => {
	const [files, setFiles] = useState<Record<string, File | undefined>>({});
	const [attachments, setAttachments] = useState<
		Record<string, File | undefined>
	>({});
	const [results, setResults] = useState<
		Record<string, PublicPortalSubmitResult>
	>({});
	const [savedResults, setSavedResults] = useState<
		Record<string, PublicPortalSubmitResult>
	>({});
	const [loadingSubmissions, setLoadingSubmissions] = useState(false);
	const [submittingAssignmentId, setSubmittingAssignmentId] = useState<
		string | null
	>(null);
	const [previewingAssignmentId, setPreviewingAssignmentId] = useState<
		string | null
	>(null);
	const [draggingAssignmentId, setDraggingAssignmentId] = useState<
		string | null
	>(null);

	const reloadSubmissions = useCallback(async () => {
		if (!token || !classId || !studentId) {
			setFiles({});
			setAttachments({});
			setResults({});
			setSavedResults({});
			return;
		}

		setLoadingSubmissions(true);
		try {
			const submissions = await submissionPortalService.getStudentSubmissions(
				token,
				classId,
				studentId,
			);
			const initialResults: Record<string, PublicPortalSubmitResult> = {};
			for (const sub of submissions) {
				initialResults[sub.assignmentId] = {
					scoreValue: sub.scoreValue,
					maxScore: sub.maxScore,
					feedback: sub.feedback,
					autoGradingErrors: sub.autoGradingErrors || [],
					autoGradingTaskResults: sub.autoGradingTaskResults || [],
					submittedAt: sub.submittedAt || new Date().toISOString(),
					rank: sub.rank,
					alerts: [],
					isPreview: false,
					submissionCount: sub.submissionCount,
				};
			}
			setSavedResults(initialResults);
			setResults(initialResults);
		} catch (err) {
			console.error("Failed to load student submissions:", err);
		} finally {
			setLoadingSubmissions(false);
		}
	}, [token, classId, studentId]);

	useEffect(() => {
		void reloadSubmissions();
	}, [reloadSubmissions]);

	const submit = useCallback(
		async (assignmentId: string) => {
			if (!assignmentId || !classId || !studentId) return;
			const file = files[assignmentId];
			if (!file) {
				setMessage("Vui lòng chọn file trước khi nộp.");
				return;
			}
			setSubmittingAssignmentId(assignmentId);
			setMessage("");
			try {
				const result = await submissionPortalService.submit(
					token,
					classId,
					studentId,
					assignmentId,
					file,
					attachments[assignmentId],
				);
				const prevCount = results[assignmentId]?.submissionCount ?? 0;
				const officialResult: PublicPortalSubmitResult = {
					...result,
					isPreview: false,
					submissionCount: prevCount + 1,
				};
				setResults((prev) => ({
					...prev,
					[assignmentId]: officialResult,
				}));
				setSavedResults((prev) => ({
					...prev,
					[assignmentId]: officialResult,
				}));
				setFiles((prev) => {
					const next = { ...prev };
					delete next[assignmentId];
					return next;
				});
				setAttachments((prev) => {
					const next = { ...prev };
					delete next[assignmentId];
					return next;
				});
				setMessage("Đã nộp và chấm bài thành công.");
				if (onSubmissionSuccess) {
					await onSubmissionSuccess();
				}
				try {
					const channel = new BroadcastChannel("mos_portal_realtime");
					channel.postMessage({
						type: "SUBMISSION_COMPLETED",
						studentId,
						classId,
						assignmentId,
						timestamp: Date.now(),
					});
					channel.close();
				} catch {}
			} catch (error) {
				if (savedResults[assignmentId]) {
					setResults((prev) => ({
						...prev,
						[assignmentId]: savedResults[assignmentId],
					}));
				}
				setMessage(
					error instanceof Error ? error.message : "Không thể nộp bài",
				);
			} finally {
				setSubmittingAssignmentId(null);
			}
		},
		[
			classId,
			studentId,
			files,
			attachments,
			results,
			savedResults,
			token,
			setMessage,
			onSubmissionSuccess,
		],
	);

	const handleFileSelected = useCallback(
		async (
			assignment: PublicPortalAssignment,
			file?: File,
			attachmentFile?: File,
		) => {
			setFiles((prev) => ({ ...prev, [assignment.id]: file }));
			setAttachments((prev) => ({
				...prev,
				[assignment.id]: attachmentFile,
			}));
			if (!file) {
				if (savedResults[assignment.id]) {
					setResults((prev) => ({
						...prev,
						[assignment.id]: savedResults[assignment.id],
					}));
				} else {
					setResults((prev) => {
						const next = { ...prev };
						delete next[assignment.id];
						return next;
					});
				}
				return;
			}
			if (!classId || !studentId) {
				setMessage("Vui lòng chọn lớp và học sinh trước khi chấm thử file.");
				return;
			}

			setPreviewingAssignmentId(assignment.id);
			setMessage("");
			try {
				const preview = await submissionPortalService.gradePreview(
					token,
					classId,
					studentId,
					assignment.id,
					file,
					attachmentFile,
				);
				setResults((prev) => ({
					...prev,
					[assignment.id]: {
						...preview,
						isPreview: true,
						submissionCount: savedResults[assignment.id]?.submissionCount,
					},
				}));
			} catch (error) {
				if (savedResults[assignment.id]) {
					setResults((prev) => ({
						...prev,
						[assignment.id]: savedResults[assignment.id],
					}));
				}
				setMessage(
					error instanceof Error ? error.message : "Không thể chấm thử bài",
				);
			} finally {
				setPreviewingAssignmentId(null);
			}
		},
		[classId, studentId, token, setMessage, savedResults],
	);

	return {
		files,
		attachments,
		results,
		savedResults,
		loadingSubmissions,
		submittingAssignmentId,
		previewingAssignmentId,
		draggingAssignmentId,
		setDraggingAssignmentId,
		submit,
		handleFileSelected,
		reloadSubmissions,
	};
};
