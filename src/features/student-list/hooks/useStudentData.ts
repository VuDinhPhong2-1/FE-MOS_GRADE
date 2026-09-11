import { useCallback, useEffect, useMemo, useState } from "react";
import { assignmentService } from "../../../services/assignment.service";
import studentService from "../../../services/student.service";
import type { Assignment } from "../../../types/assignment.types";
import type { Class } from "../../../types/class.types";
import type { Student, StudentImportItem } from "../../../types/student.types";
import type { CompetencyLevel } from "../types";
import { isStudentActive, VALID_STATUSES } from "../types";

interface UseStudentDataOptions {
	selectedClass: Class;
	readOnly: boolean;
	getAccessToken: (forceRefresh?: boolean) => Promise<string | null>;
}

export const useStudentData = ({
	selectedClass,
	readOnly,
	getAccessToken,
}: UseStudentDataOptions) => {
	const [students, setStudents] = useState<Student[]>([]);
	const [assignments, setAssignments] = useState<Assignment[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isStudentMetadataSyncing, setIsStudentMetadataSyncing] =
		useState(false);
	const [inlineSavingStudentId, setInlineSavingStudentId] = useState<
		string | null
	>(null);
	const [flashMessage, setFlashMessage] = useState("");

	const loadStudents = useCallback(async () => {
		if (!selectedClass?.id) return;
		setIsLoading(true);
		try {
			const data = await studentService.getStudentsByClassId(
				selectedClass.id,
				getAccessToken,
			);
			setStudents(data);
		} finally {
			setIsLoading(false);
		}
	}, [selectedClass?.id, getAccessToken]);

	const loadAssignments = useCallback(async () => {
		if (!selectedClass?.id) return;
		try {
			const data = await assignmentService.getByClass(
				selectedClass.id,
				getAccessToken,
			);
			setAssignments(data);
		} catch {
			setAssignments([]);
		}
	}, [selectedClass?.id, getAccessToken]);

	useEffect(() => {
		if (selectedClass?.id) {
			loadStudents();
			loadAssignments();
		}
	}, [selectedClass?.id, loadStudents, loadAssignments]);

	useEffect(() => {
		if (!flashMessage) return;
		const timer = window.setTimeout(() => setFlashMessage(""), 2500);
		return () => window.clearTimeout(timer);
	}, [flashMessage]);

	useEffect(() => {
		if (!inlineSavingStudentId) return;

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [inlineSavingStudentId]);

	const appendImportedStudents = useCallback((imported: Student[]) => {
		setStudents((prev) => {
			const persisted = prev.filter(
				(student) => !student.id.startsWith("temp-"),
			);
			return [...persisted, ...imported];
		});
	}, []);

	const handleSaveStudents = useCallback(async () => {
		if (readOnly) {
			alert("Bạn chỉ có quyền xem lớp này.");
			return;
		}

		const newStudents = students.filter((st) => st.id.startsWith("temp-"));
		if (newStudents.length === 0) {
			alert("Không có học sinh mới để lưu!");
			return;
		}

		setIsLoading(true);
		try {
			const importItems: StudentImportItem[] = newStudents.map((st) => ({
				MiddleName: st.middleName,
				FirstName: st.firstName,
			}));

			await studentService.bulkImportStudents(
				{
					Students: importItems,
					ClassId: selectedClass.id,
				},
				getAccessToken,
			);

			await loadStudents();
			setFlashMessage("Lưu danh sách học sinh thành công.");
		} catch {
			alert("Có lỗi xảy ra khi import học sinh!");
		} finally {
			setIsLoading(false);
		}
	}, [readOnly, students, selectedClass?.id, getAccessToken, loadStudents]);

	const handleDeleteStudent = useCallback(
		async (student: Student) => {
			if (readOnly) {
				alert("Bạn chỉ có quyền xem lớp này.");
				return;
			}

			if (student.id.startsWith("temp-")) {
				setStudents((prev) => prev.filter((st) => st.id !== student.id));
				setFlashMessage("Đã xóa học sinh tạm khỏi danh sách.");
				return;
			}

			setIsLoading(true);
			try {
				await studentService.deleteStudent(student.id, getAccessToken);
				await loadStudents();
				setFlashMessage("Xóa học sinh thành công.");
			} catch (err) {
				alert(err instanceof Error ? err.message : "Không thể xóa học sinh.");
			} finally {
				setIsLoading(false);
			}
		},
		[readOnly, getAccessToken, loadStudents],
	);

	const handleInlineCompetencyChange = useCallback(
		async (student: Student, level: CompetencyLevel) => {
			if (readOnly) {
				return;
			}

			if (student.id.startsWith("temp-")) {
				setStudents((prev) =>
					prev.map((item) =>
						item.id === student.id ? { ...item, competencyLevel: level } : item,
					),
				);
				return;
			}

			const status = VALID_STATUSES.includes(
				(student.status || "") as (typeof VALID_STATUSES)[number],
			)
				? (student.status as string)
				: isStudentActive(student)
					? "Active"
					: "Inactive";

			setInlineSavingStudentId(student.id);
			try {
				const updatedStudent = await studentService.updateStudent(
					student.id,
					{
						middleName: student.middleName?.trim() || "",
						firstName: student.firstName?.trim() || "",
						status,
						competencyLevel: level,
						notes: student.notes?.trim() || "",
						thi: Boolean(student.thi),
						classId: student.classId || selectedClass.id,
					},
					getAccessToken,
				);

				setStudents((prev) =>
					prev.map((item) =>
						item.id === student.id
							? {
									...item,
									competencyLevel: (updatedStudent.competencyLevel ??
										level) as CompetencyLevel,
									notes: updatedStudent.notes ?? item.notes,
									status: updatedStudent.status ?? item.status,
									thi: updatedStudent.thi ?? item.thi ?? false,
								}
							: item,
					),
				);
				setFlashMessage("Cập nhật năng lực thành công.");
			} catch (err) {
				alert(
					err instanceof Error
						? err.message
						: "Không thể cập nhật năng lực học sinh.",
				);
			} finally {
				setInlineSavingStudentId(null);
			}
		},
		[readOnly, selectedClass?.id, getAccessToken],
	);

	const handleInlineExamToggle = useCallback(
		async (student: Student) => {
			if (readOnly) {
				return;
			}

			const nextExamState = !(student.thi ?? false);

			if (student.id.startsWith("temp-")) {
				setStudents((prev) =>
					prev.map((item) =>
						item.id === student.id ? { ...item, thi: nextExamState } : item,
					),
				);
				return;
			}

			setInlineSavingStudentId(student.id);
			try {
				const updatedStudent = await studentService.updateStudent(
					student.id,
					{
						thi: nextExamState,
					},
					getAccessToken,
				);

				const resolvedExamState = updatedStudent.thi ?? nextExamState;
				setStudents((prev) =>
					prev.map((item) =>
						item.id === student.id
							? {
									...item,
									thi: resolvedExamState,
								}
							: item,
					),
				);
				setFlashMessage("Cập nhật trạng thái thi thành công.");
			} catch (err) {
				alert(
					err instanceof Error
						? err.message
						: "Không thể cập nhật trạng thái thi.",
				);
			} finally {
				setInlineSavingStudentId(null);
			}
		},
		[readOnly, getAccessToken],
	);

	const handleSyncStudentMetadataToGoogleSheet = useCallback(async () => {
		if (readOnly) {
			alert("Bạn chỉ có quyền xem lớp này.");
			return;
		}

		const hasNewTempStudents = students.some((st) => st.id.startsWith("temp-"));
		if (hasNewTempStudents) {
			alert("Vui lòng lưu danh sách học sinh trước khi đồng bộ Google Sheet.");
			return;
		}

		try {
			setIsStudentMetadataSyncing(true);
			const result = await studentService.syncStudentMetadataToGoogleSheet(
				selectedClass.id,
				getAccessToken,
			);
			setFlashMessage(
				result.message ||
					"Đã đồng bộ xếp loại và ghi chú học sinh lên Google Sheet.",
			);
		} catch (err) {
			alert(
				err instanceof Error
					? err.message
					: "Không thể đồng bộ xếp loại và ghi chú lên Google Sheet.",
			);
		} finally {
			setIsStudentMetadataSyncing(false);
		}
	}, [readOnly, students, selectedClass?.id, getAccessToken]);

	const studentNewList = useMemo(
		() => students.filter((st) => st.id.startsWith("temp-")),
		[students],
	);

	const activeStudents = useMemo(
		() => students.filter((student) => isStudentActive(student)),
		[students],
	);

	const inactiveStudentsCount = useMemo(
		() => students.filter((student) => !isStudentActive(student)).length,
		[students],
	);

	return {
		students,
		assignments,
		isLoading,
		isStudentMetadataSyncing,
		inlineSavingStudentId,
		flashMessage,
		setFlashMessage,
		studentNewList,
		activeStudents,
		inactiveStudentsCount,
		loadStudents,
		appendImportedStudents,
		handleSaveStudents,
		handleDeleteStudent,
		handleInlineCompetencyChange,
		handleInlineExamToggle,
		handleSyncStudentMetadataToGoogleSheet,
	};
};
