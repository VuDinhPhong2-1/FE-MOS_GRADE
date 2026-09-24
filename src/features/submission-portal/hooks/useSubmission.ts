import { useCallback, useState } from "react";
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
	results: Record<string, PublicPortalSubmitResult>;
	submittingAssignmentId: string | null;
	previewingAssignmentId: string | null;
	draggingAssignmentId: string | null;
	setDraggingAssignmentId: (id: string | null) => void;
	submit: (assignmentId: string) => Promise<void>;
	handleFileSelected: (
		assignment: PublicPortalAssignment,
		file?: File,
	) => Promise<void>;
}

export const useSubmission = ({
	token,
	classId,
	studentId,
	setMessage,
	onSubmissionSuccess,
}: UseSubmissionProps): UseSubmissionReturn => {
	const [files, setFiles] = useState<Record<string, File | undefined>>({});
	const [results, setResults] = useState<
		Record<string, PublicPortalSubmitResult>
	>({});
	const [submittingAssignmentId, setSubmittingAssignmentId] = useState<
		string | null
	>(null);
	const [previewingAssignmentId, setPreviewingAssignmentId] = useState<
		string | null
	>(null);
	const [draggingAssignmentId, setDraggingAssignmentId] = useState<
		string | null
	>(null);

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
			setResults((prev) => {
				const next = { ...prev };
				delete next[assignmentId];
				return next;
			});
			try {
				const result = await submissionPortalService.submit(
					token,
					classId,
					studentId,
					assignmentId,
					file,
				);
				setResults((prev) => ({
					...prev,
					[assignmentId]: { ...result, isPreview: false },
				}));
				setMessage("Đã nộp và chấm bài thành công.");
				if (onSubmissionSuccess) {
					await onSubmissionSuccess();
				}
			} catch (error) {
				setMessage(
					error instanceof Error ? error.message : "Không thể nộp bài",
				);
			} finally {
				setSubmittingAssignmentId(null);
			}
		},
		[classId, studentId, files, token, setMessage, onSubmissionSuccess],
	);

	const handleFileSelected = useCallback(
		async (assignment: PublicPortalAssignment, file?: File) => {
			setFiles((prev) => ({ ...prev, [assignment.id]: file }));
			setResults((prev) => {
				const next = { ...prev };
				delete next[assignment.id];
				return next;
			});
			if (!file) return;
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
				);
				setResults((prev) => ({
					...prev,
					[assignment.id]: { ...preview, isPreview: true },
				}));
			} catch (error) {
				setMessage(
					error instanceof Error ? error.message : "Không thể chấm thử bài",
				);
			} finally {
				setPreviewingAssignmentId(null);
			}
		},
		[classId, studentId, token, setMessage],
	);

	return {
		files,
		results,
		submittingAssignmentId,
		previewingAssignmentId,
		draggingAssignmentId,
		setDraggingAssignmentId,
		submit,
		handleFileSelected,
	};
};
