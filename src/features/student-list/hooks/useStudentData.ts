import { useCallback, useEffect, useMemo, useState } from "react";
import type { Class } from "../../../types/class.types";
import type { Student, StudentImportItem } from "../../../types/student.types";
import type { CompetencyLevel } from "../types";
import { isStudentActive, VALID_STATUSES } from "../types";
import { useStudentQueries } from "./useStudentQueries";

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
	// Quản lý client-side draft students được import từ file Excel / Paste clipboard
	const [tempStudents, setTempStudents] = useState<Student[]>([]);
	const [inlineSavingStudentId, setInlineSavingStudentId] = useState<
		string | null
	>(null);
	const [flashMessage, setFlashMessage] = useState("");

	const {
		students: serverStudents,
		isLoadingStudents,
		assignments,
		refetchStudents,
		bulkImportMutation,
		deleteStudentMutation,
		updateStudentMutation,
		syncMetadataMutation,
	} = useStudentQueries({
		classId: selectedClass.id,
		schoolId: selectedClass.schoolId,
		getAccessToken,
	});

	// Reset draft temp students khi chuyển lớp
	useEffect(() => {
		if (selectedClass.id) {
			setTempStudents([]);
		}
	}, [selectedClass.id]);

	// Tự động tắt flash message sau 2.5s
	useEffect(() => {
		if (!flashMessage) return;
		const timer = window.setTimeout(() => setFlashMessage(""), 2500);
		return () => window.clearTimeout(timer);
	}, [flashMessage]);

	// Cảnh báo người dùng khi đang lưu inline
	useEffect(() => {
		if (!inlineSavingStudentId) return;

		const handleBeforeUnload = (event: BeforeUnloadEvent) => {
			event.preventDefault();
			event.returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [inlineSavingStudentId]);

	// Ghép server students và client-only temp students
	const students = useMemo(
		() => [...serverStudents, ...tempStudents],
		[serverStudents, tempStudents],
	);

	const appendImportedStudents = useCallback((imported: Student[]) => {
		setTempStudents((prev) => [...prev, ...imported]);
	}, []);

	const handleSaveStudents = useCallback(async () => {
		if (readOnly) {
			alert("Bạn chỉ có quyền xem lớp này.");
			return;
		}

		if (tempStudents.length === 0) {
			alert("Không có học sinh mới để lưu!");
			return;
		}

		try {
			const importItems: StudentImportItem[] = tempStudents.map((st) => ({
				MiddleName: st.middleName,
				FirstName: st.firstName,
			}));

			await bulkImportMutation.mutateAsync({
				Students: importItems,
				ClassId: selectedClass.id,
			});

			setTempStudents([]);
			setFlashMessage("Lưu danh sách học sinh thành công.");
		} catch {
			alert("Có lỗi xảy ra khi import học sinh!");
		}
	}, [bulkImportMutation, readOnly, selectedClass.id, tempStudents]);

	const handleDeleteStudent = useCallback(
		async (student: Student) => {
			if (readOnly) {
				alert("Bạn chỉ có quyền xem lớp này.");
				return;
			}

			if (student.id.startsWith("temp-")) {
				setTempStudents((prev) => prev.filter((st) => st.id !== student.id));
				setFlashMessage("Đã xóa học sinh tạm khỏi danh sách.");
				return;
			}

			try {
				await deleteStudentMutation.mutateAsync(student.id);
				setFlashMessage("Xóa học sinh thành công.");
			} catch (err) {
				alert(err instanceof Error ? err.message : "Không thể xóa học sinh.");
			}
		},
		[deleteStudentMutation, readOnly],
	);

	const handleInlineCompetencyChange = useCallback(
		async (student: Student, level: CompetencyLevel) => {
			if (readOnly) return;

			if (student.id.startsWith("temp-")) {
				setTempStudents((prev) =>
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
				await updateStudentMutation.mutateAsync({
					studentId: student.id,
					payload: {
						middleName: student.middleName?.trim() || "",
						firstName: student.firstName?.trim() || "",
						status,
						competencyLevel: level,
						notes: student.notes?.trim() || "",
						thi: Boolean(student.thi),
						classId: student.classId || selectedClass.id,
					},
				});
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
		[readOnly, selectedClass.id, updateStudentMutation],
	);

	const handleInlineExamToggle = useCallback(
		async (student: Student) => {
			if (readOnly) return;

			const nextExamState = !(student.thi ?? false);

			if (student.id.startsWith("temp-")) {
				setTempStudents((prev) =>
					prev.map((item) =>
						item.id === student.id ? { ...item, thi: nextExamState } : item,
					),
				);
				return;
			}

			setInlineSavingStudentId(student.id);
			try {
				await updateStudentMutation.mutateAsync({
					studentId: student.id,
					payload: {
						thi: nextExamState,
					},
				});
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
		[readOnly, updateStudentMutation],
	);

	const handleSyncStudentMetadataToGoogleSheet = useCallback(async () => {
		if (readOnly) {
			alert("Bạn chỉ có quyền xem lớp này.");
			return;
		}

		if (tempStudents.length > 0) {
			alert("Vui lòng lưu danh sách học sinh trước khi đồng bộ Google Sheet.");
			return;
		}

		try {
			const result = await syncMetadataMutation.mutateAsync();
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
		}
	}, [readOnly, syncMetadataMutation, tempStudents.length]);

	const studentNewList = useMemo(() => tempStudents, [tempStudents]);

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
		isLoading:
			isLoadingStudents ||
			bulkImportMutation.isPending ||
			deleteStudentMutation.isPending,
		isStudentMetadataSyncing: syncMetadataMutation.isPending,
		inlineSavingStudentId,
		flashMessage,
		setFlashMessage,
		studentNewList,
		activeStudents,
		inactiveStudentsCount,
		loadStudents: refetchStudents,
		appendImportedStudents,
		handleSaveStudents,
		handleDeleteStudent,
		handleInlineCompetencyChange,
		handleInlineExamToggle,
		handleSyncStudentMetadataToGoogleSheet,
	};
};
