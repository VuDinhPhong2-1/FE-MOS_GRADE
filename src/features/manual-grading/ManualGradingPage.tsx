// src/features/manual-grading/ManualGradingPage.tsx
import {
	Button,
	Card,
	Icon,
	LoadingIndicator,
	Text,
	useSnackbar,
} from "@bug-on/m3-expressive";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { assignmentService } from "../../services/assignment.service";
import { classService } from "../../services/class.service";
import { scoreService } from "../../services/score.service";
import studentService from "../../services/student.service";
import type { Assignment } from "../../types/assignment.types";
import type { Class } from "../../types/class.types";
import type { ScoreResponse } from "../../types/score.types";
import type { Student } from "../../types/student.types";
import { ManualGradingTable } from "./ManualGradingTable";
import { ManualGradingToolbar } from "./ManualGradingToolbar";

export const ManualGradingPage: React.FC = () => {
	const { classId, assignmentId } = useParams<{
		classId: string;
		assignmentId: string;
	}>();
	const navigate = useNavigate();
	const { getAccessToken } = useAuth();
	const { showSnackbar } = useSnackbar();

	const [classInfo, setClassInfo] = useState<Class | null>(null);
	const [assignment, setAssignment] = useState<Assignment | null>(null);
	const [students, setStudents] = useState<Student[]>([]);
	const [draftScores, setDraftScores] = useState<
		Record<string, { score: string; feedback: string }>
	>({});
	const [savedScores, setSavedScores] = useState<Record<string, number | null>>(
		{},
	);
	const [loading, setLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);
	const [isSavingAll, setIsSavingAll] = useState(false);
	const [savingStudentId, setSavingStudentId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	// Load initial data
	const loadData = useCallback(async () => {
		if (!classId || !assignmentId) {
			setErrorMessage("Thiếu mã lớp hoặc mã bài tập.");
			setLoading(false);
			return;
		}

		setLoading(true);
		setErrorMessage(null);

		try {
			const [classRes, assignRes, studentRes, scoreRes] = await Promise.all([
				classService.getClassById(classId, getAccessToken),
				assignmentService.getById(assignmentId, getAccessToken),
				studentService.getStudentsByClassId(classId, getAccessToken),
				scoreService.getByAssignment(assignmentId, getAccessToken),
			]);

			setClassInfo(classRes);
			setAssignment(assignRes);

			// Only active students
			const activeStudents = Array.isArray(studentRes)
				? studentRes.filter(
						(s: Student) =>
							s.isActive !== false &&
							(s.status || "").toLowerCase() !== "inactive",
					)
				: [];
			setStudents(activeStudents);

			// Map existing scores
			const initialSaved: Record<string, number | null> = {};
			const initialDraft: Record<string, { score: string; feedback: string }> =
				{};

			for (const s of scoreRes as ScoreResponse[]) {
				initialSaved[s.studentId] =
					s.scoreValue !== undefined && s.scoreValue !== null
						? s.scoreValue
						: null;
				initialDraft[s.studentId] = {
					score:
						s.scoreValue !== undefined && s.scoreValue !== null
							? String(s.scoreValue)
							: "",
					feedback: s.feedback || "",
				};
			}

			setSavedScores(initialSaved);
			setDraftScores(initialDraft);
		} catch (err: unknown) {
			const msg =
				err instanceof Error
					? err.message
					: "Không thể tải dữ liệu bài tập và học sinh.";
			setErrorMessage(msg);
		} finally {
			setLoading(false);
		}
	}, [classId, assignmentId, getAccessToken]);

	useEffect(() => {
		void loadData();
	}, [loadData]);

	// Handlers for score/feedback inputs
	const handleScoreChange = useCallback((studentId: string, score: string) => {
		setDraftScores((prev) => ({
			...prev,
			[studentId]: {
				score,
				feedback: prev[studentId]?.feedback ?? "",
			},
		}));
	}, []);

	const handleFeedbackChange = useCallback(
		(studentId: string, feedback: string) => {
			setDraftScores((prev) => ({
				...prev,
				[studentId]: {
					score: prev[studentId]?.score ?? "",
					feedback,
				},
			}));
		},
		[],
	);

	// Check for unsaved changes
	const hasUnsavedChanges = useMemo(() => {
		for (const student of students) {
			const draft = draftScores[student.id];
			const saved = savedScores[student.id];
			const hasDraftVal = draft && draft.score.trim() !== "";
			const parsed = hasDraftVal ? parseFloat(draft.score) : null;

			if (hasDraftVal && parsed !== saved) return true;
			if (!hasDraftVal && saved !== null && saved !== undefined) return true;
		}
		return false;
	}, [students, draftScores, savedScores]);

	// Save single student score
	const handleSaveSingleStudent = useCallback(
		async (studentId: string) => {
			if (!classId || !assignmentId || !assignment) return;

			const draft = draftScores[studentId];
			if (!draft) return;

			const hasVal = draft.score.trim() !== "";
			const parsed = hasVal ? parseFloat(draft.score) : undefined;

			if (
				hasVal &&
				(Number.isNaN(parsed!) || parsed! < 0 || parsed! > assignment.maxScore)
			) {
				showSnackbar({
					message: `Điểm phải từ 0 đến ${assignment.maxScore}`,
				});
				return;
			}

			setSavingStudentId(studentId);
			try {
				await scoreService.createOrUpdate(
					{
						classId,
						assignmentId,
						studentId,
						scoreValue: parsed,
						feedback: draft.feedback.trim() || undefined,
					},
					getAccessToken,
				);

				setSavedScores((prev) => ({
					...prev,
					[studentId]: parsed ?? null,
				}));

				showSnackbar({
					message: "Lưu điểm học sinh thành công",
				});
			} catch (err: unknown) {
				const msg = err instanceof Error ? err.message : "Lỗi khi lưu điểm";
				showSnackbar({
					message: msg,
				});
			} finally {
				setSavingStudentId(null);
			}
		},
		[
			classId,
			assignmentId,
			assignment,
			draftScores,
			getAccessToken,
			showSnackbar,
		],
	);

	// Save all draft scores
	const handleSaveAll = useCallback(async () => {
		if (!classId || !assignmentId || !assignment) return;

		// Validate all filled scores
		for (const student of students) {
			const draft = draftScores[student.id];
			if (draft && draft.score.trim() !== "") {
				const val = parseFloat(draft.score);
				if (Number.isNaN(val) || val < 0 || val > assignment.maxScore) {
					showSnackbar({
						message: `Điểm học sinh ${student.firstName} không hợp lệ (0 - ${assignment.maxScore})`,
					});
					return;
				}
			}
		}

		setIsSavingAll(true);
		try {
			const scoresToSave = students.map((s) => {
				const draft = draftScores[s.id];
				const hasVal = draft && draft.score.trim() !== "";
				const scoreValue = hasVal ? parseFloat(draft.score) : undefined;
				return {
					studentId: s.id,
					scoreValue,
					feedback: draft?.feedback?.trim() || undefined,
				};
			});

			await scoreService.bulkCreateOrUpdate(
				{
					classId,
					assignmentId,
					scores: scoresToSave,
				},
				getAccessToken,
			);

			// Update saved state
			const newSaved: Record<string, number | null> = {};
			for (const item of scoresToSave) {
				newSaved[item.studentId] = item.scoreValue ?? null;
			}
			setSavedScores(newSaved);

			showSnackbar({
				message: `Đã lưu điểm cho ${scoresToSave.filter((s) => s.scoreValue !== undefined).length} học sinh thành công!`,
			});
		} catch (err: unknown) {
			const msg =
				err instanceof Error ? err.message : "Không thể lưu danh sách điểm";
			showSnackbar({
				message: msg,
			});
		} finally {
			setIsSavingAll(false);
		}
	}, [
		classId,
		assignmentId,
		assignment,
		students,
		draftScores,
		getAccessToken,
		showSnackbar,
	]);

	// Filtered students by search
	const filteredStudents = useMemo(() => {
		if (!searchQuery.trim()) return students;
		const q = searchQuery.toLowerCase().trim();
		return students.filter((s) => {
			const name = `${s.middleName || ""} ${s.firstName || ""}`.toLowerCase();
			return name.includes(q);
		});
	}, [students, searchQuery]);

	// Graded count
	const gradedCount = useMemo(() => {
		return Object.values(savedScores).filter(
			(val) => val !== null && val !== undefined,
		).length;
	}, [savedScores]);

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center min-h-100 gap-3">
				<LoadingIndicator
					size={40}
					aria-label="Đang tải dữ liệu bài tập và học sinh"
				/>
				<Text
					variant="body-md"
					className="text-sm font-medium text-m3-on-surface-variant"
				>
					Đang tải danh sách bài tập và học sinh...
				</Text>
			</div>
		);
	}

	if (errorMessage || !assignment) {
		return (
			<Card
				variant="filled"
				className="p-8 text-center max-w-lg mx-auto mt-12 rounded-m3-xl bg-m3-error-container/20 border border-m3-error/30"
			>
				<Icon name="error" size={48} className="mx-auto text-m3-error mb-3" />
				<h2 className="text-lg font-bold text-m3-on-surface mb-2">
					Không thể tải trang chấm điểm
				</h2>
				<Text
					variant="body-md"
					className="text-sm text-m3-on-surface-variant mb-6"
				>
					{errorMessage || "Không tìm thấy bài tập hoặc lớp học."}
				</Text>
				<Button
					colorStyle="filled"
					onClick={() => navigate(`/classes/${classId}/grading`)}
				>
					Quay lại danh sách bài tập
				</Button>
			</Card>
		);
	}

	return (
		<div className="container mx-auto px-4 py-6 max-w-7xl animate-fadeIn">
			<ManualGradingToolbar
				assignmentName={assignment.name}
				className={classInfo?.name || "Lớp học"}
				maxScore={assignment.maxScore}
				totalStudents={students.length}
				gradedCount={gradedCount}
				hasUnsavedChanges={hasUnsavedChanges}
				isSaving={isSavingAll}
				onSaveAll={handleSaveAll}
				onBack={() => navigate(`/classes/${classId}/grading`)}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
			/>

			<ManualGradingTable
				students={filteredStudents}
				draftScores={draftScores}
				savedScores={savedScores}
				maxScore={assignment.maxScore}
				onScoreChange={handleScoreChange}
				onFeedbackChange={handleFeedbackChange}
				onSaveSingleStudent={handleSaveSingleStudent}
				savingStudentId={savingStudentId}
			/>
		</div>
	);
};
