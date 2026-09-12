import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { School } from "../../types";
import type {
	Class,
	CreateClassRequest,
	UpdateClassRequest,
} from "../../types/class.types";
import { notify } from "../../utils/notify";
import { useClassQueries } from "./hooks/useClassQueries";
import {
	getGradeOrderValue,
	mapClassApiError,
	normalizeSearchText,
	OBJECT_ID_REGEX,
} from "./utils/classlist.utils";

export function useClassList(selectedSchool: School) {
	const { getAccessToken, logout, user } = useAuth();
	const [searchParams, setSearchParams] = useSearchParams();

	// Handover modal state
	const [showHandoverModal, setShowHandoverModal] = useState(false);
	const [handoverClass, setHandoverClass] = useState<Class | null>(null);
	const [handoverError, setHandoverError] = useState("");
	const [handoverBusyTeacherId, setHandoverBusyTeacherId] = useState<
		string | null
	>(null);
	const [handoverSearch, setHandoverSearch] = useState("");

	// TanStack Query hooks for server state
	const {
		classes,
		isLoading,
		classesError,
		teachers,
		isLoadingTeachers,
		teachersError,
		createClassMutation,
		updateClassMutation,
		deleteClassMutation,
		toggleHandoverMutation,
	} = useClassQueries({
		schoolId: selectedSchool.id,
		getAccessToken,
		isHandoverModalOpen: showHandoverModal,
	});

	// UI state
	const [selectedClass, setSelectedClass] = useState<Class | null>(null);
	const [error, setError] = useState("");

	// Filters state
	const [classStatusFilter, setClassStatusFilter] = useState<
		"all" | "active" | "inactive"
	>("all");
	const [classSearch, setClassSearch] = useState("");
	const [classSearchActive, setClassSearchActive] = useState(false);
	const [selectedGradeFilter, setSelectedGradeFilter] = useState("");

	// Form modal state (Add / Edit)
	const [showModal, setShowModal] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingClass, setEditingClass] = useState<Class | null>(null);
	const [isActive, setIsActive] = useState(true);
	const [formError, setFormError] = useState("");
	const [formData, setFormData] = useState<CreateClassRequest>({
		name: "",
		schoolId: selectedSchool.id,
		description: "",
		maxStudents: undefined,
		academicYear: "2026 - 2027",
		grade: "",
	});

	// Delete modal state
	const [classToDelete, setClassToDelete] = useState<Class | null>(null);
	const [isDeletingClass, setIsDeletingClass] = useState(false);

	const schoolIdForCreate = selectedSchool.id || formData.schoolId || "";
	const currentUserId = user?.userId || "";
	const isAdmin = user?.role === "Admin";
	const isTeacher = user?.role === "Teacher";
	const canCreateClass = isAdmin || isTeacher;

	const handleUnauthorized = useCallback(() => {
		logout();
		window.location.href = "/login";
	}, [logout]);

	const canManageClass = useCallback(
		(cls: Class): boolean =>
			isAdmin ||
			cls.ownerId === currentUserId ||
			Boolean(cls.managerTeacherIds?.includes(currentUserId)),
		[currentUserId, isAdmin],
	);

	const canHandoverClass = useCallback(
		(cls: Class): boolean => isAdmin || cls.ownerId === currentUserId,
		[currentUserId, isAdmin],
	);

	const createFormValidation = useMemo(() => {
		const name = (formData.name || "").trim();
		if (!name) return "Tên lớp là bắt buộc.";

		if (!OBJECT_ID_REGEX.test(schoolIdForCreate)) {
			return "Trường không hợp lệ.";
		}

		if (typeof formData.maxStudents === "number") {
			if (
				!Number.isInteger(formData.maxStudents) ||
				formData.maxStudents < 1 ||
				formData.maxStudents > 200
			) {
				return "Sĩ số tối đa phải từ 1 đến 200.";
			}
		}

		if (formData.academicYear && formData.academicYear.length > 20) {
			return "Năm học không được quá 20 ký tự.";
		}

		if (formData.grade && formData.grade.length > 20) {
			return "Khối không được quá 20 ký tự.";
		}

		if (formData.description && formData.description.length > 500) {
			return "Mô tả không được quá 500 ký tự.";
		}

		return "";
	}, [formData, schoolIdForCreate]);

	const isSubmitDisabled =
		isSubmitting || (!editingClass && Boolean(createFormValidation));

	const visibleClasses = useMemo(() => {
		const searchKeyword = normalizeSearchText(classSearch);

		return [...classes]
			.filter((cls) => {
				const matchesSearch =
					!searchKeyword ||
					normalizeSearchText(cls.name).includes(searchKeyword);
				const matchesGrade =
					!selectedGradeFilter ||
					Boolean(cls.grade?.includes(selectedGradeFilter));
				const matchesStatus =
					classStatusFilter === "all" ||
					(classStatusFilter === "active" && cls.isActive) ||
					(classStatusFilter === "inactive" && !cls.isActive);
				return matchesSearch && matchesGrade && matchesStatus;
			})
			.sort((classA, classB) => {
				const gradeA = getGradeOrderValue(classA.grade);
				const gradeB = getGradeOrderValue(classB.grade);

				if (gradeA !== null && gradeB !== null && gradeA !== gradeB) {
					return gradeA - gradeB;
				}

				if (gradeA !== null && gradeB === null) {
					return -1;
				}

				if (gradeA === null && gradeB !== null) {
					return 1;
				}

				return classA.name.localeCompare(classB.name, "vi", {
					numeric: true,
					sensitivity: "base",
				});
			});
	}, [classes, classSearch, classStatusFilter, selectedGradeFilter]);

	// Sync selectedClass from URL params or updated classes
	useEffect(() => {
		const classId = searchParams.get("classId");
		if (!classId) {
			setSelectedClass(null);
			return;
		}

		const matchedClass = classes.find((cls) => cls.id === classId) || null;
		setSelectedClass(matchedClass);
	}, [classes, searchParams]);

	const handleSelectClass = useCallback(
		(cls: Class) => {
			const nextParams = new URLSearchParams(searchParams);
			nextParams.set("schoolId", selectedSchool.id);
			nextParams.set("classId", cls.id);
			setSearchParams(nextParams);
			setSelectedClass(cls);
		},
		[searchParams, selectedSchool.id, setSearchParams],
	);

	const handleBackToClassList = useCallback(() => {
		const nextParams = new URLSearchParams(searchParams);
		nextParams.set("schoolId", selectedSchool.id);
		nextParams.delete("classId");
		setSearchParams(nextParams);
		setSelectedClass(null);
	}, [searchParams, selectedSchool.id, setSearchParams]);

	const handleOpenAddModal = useCallback(() => {
		if (!canCreateClass) {
			alert("Bạn không có quyền tạo lớp trong trường này.");
			return;
		}

		setEditingClass(null);
		setIsActive(true);
		setFormData({
			name: "",
			schoolId: selectedSchool.id,
			description: "",
			maxStudents: undefined,
			academicYear: "2026 - 2027",
			grade: "",
		});
		setFormError("");
		setShowModal(true);
	}, [canCreateClass, selectedSchool.id]);

	const handleOpenEditModal = useCallback(
		(cls: Class) => {
			if (!canManageClass(cls)) {
				notify.warning("Bạn chỉ có quyền xem lớp này.");
				return;
			}

			setEditingClass(cls);
			setIsActive(cls.isActive);
			setFormData({
				name: cls.name,
				schoolId: cls.schoolId,
				description: cls.description || "",
				maxStudents: cls.maxStudents,
				academicYear: cls.academicYear || "2026 - 2027",
				grade: cls.grade || "",
			});
			setFormError("");
			setShowModal(true);
		},
		[canManageClass],
	);

	const handleCloseFormModal = useCallback(() => {
		setShowModal(false);
	}, []);

	const handleSubmitForm = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			setIsSubmitting(true);
			setError("");
			setFormError("");

			if (!editingClass && createFormValidation) {
				setFormError(createFormValidation);
				setIsSubmitting(false);
				return;
			}

			try {
				if (editingClass) {
					const updateData: UpdateClassRequest = {
						...formData,
						isActive,
					};
					await updateClassMutation.mutateAsync({
						classId: editingClass.id,
						payload: updateData,
					});
					notify.success("Cập nhật thông tin lớp học thành công");
				} else {
					await createClassMutation.mutateAsync({
						...formData,
						schoolId: selectedSchool.id,
					});
					notify.success("Tạo lớp học mới thành công");
				}

				setShowModal(false);
				setEditingClass(null);
				setIsActive(true);
			} catch (err) {
				const mapped = mapClassApiError(err, handleUnauthorized);
				setFormError(mapped);
				setError(mapped);
			} finally {
				setIsSubmitting(false);
			}
		},
		[
			createClassMutation,
			createFormValidation,
			editingClass,
			formData,
			handleUnauthorized,
			isActive,
			selectedSchool.id,
			updateClassMutation,
		],
	);

	const openDeleteDialog = useCallback(
		(classOrId: Class | string, className?: string) => {
			let targetClass: Class | undefined;
			if (typeof classOrId === "object" && classOrId !== null) {
				targetClass = classOrId;
			} else {
				targetClass = classes.find((item) => item.id === classOrId);
			}

			if (targetClass) {
				if (!canManageClass(targetClass)) {
					notify.warning("Bạn chỉ có quyền xem lớp này.");
					return;
				}
				setClassToDelete(targetClass);
			} else if (typeof classOrId === "string") {
				setClassToDelete({
					id: classOrId,
					name: className || "Lớp học",
				} as Class);
			}
		},
		[canManageClass, classes],
	);

	const closeDeleteDialog = useCallback(() => {
		if (isDeletingClass) return;
		setClassToDelete(null);
	}, [isDeletingClass]);

	const handleConfirmDelete = useCallback(async () => {
		if (!classToDelete) return;

		try {
			setIsDeletingClass(true);
			await deleteClassMutation.mutateAsync(classToDelete.id);
			notify.success(`Đã xóa lớp "${classToDelete.name}" thành công`);
			setClassToDelete(null);
		} catch (err) {
			notify.error(
				err instanceof Error ? err.message : "Không thể xóa lớp học",
			);
		} finally {
			setIsDeletingClass(false);
		}
	}, [classToDelete, deleteClassMutation]);

	const handleDeleteClass = useCallback(
		(classIdOrCls: string | Class, className?: string) => {
			openDeleteDialog(classIdOrCls, className);
		},
		[openDeleteDialog],
	);

	const handleOpenHandoverModal = useCallback(
		(cls: Class) => {
			if (!canHandoverClass(cls)) {
				notify.warning(
					"Chỉ giáo viên chính hoặc Admin mới được bàn giao quyền lớp.",
				);
				return;
			}

			setShowHandoverModal(true);
			setHandoverClass(cls);
			setHandoverError("");
			setHandoverSearch("");
		},
		[canHandoverClass],
	);

	const handleCloseHandoverModal = useCallback(() => {
		setShowHandoverModal(false);
		setHandoverClass(null);
		setHandoverError("");
	}, []);

	const handleToggleHandover = useCallback(
		async (teacherId: string, granted: boolean) => {
			if (!handoverClass) {
				return;
			}

			setHandoverBusyTeacherId(teacherId);
			setHandoverError("");

			try {
				const updatedClass = await toggleHandoverMutation.mutateAsync({
					classId: handoverClass.id,
					teacherId,
					granted,
				});

				setHandoverClass(updatedClass);
				setSelectedClass((prev) =>
					prev?.id === updatedClass.id ? { ...prev, ...updatedClass } : prev,
				);
			} catch (err) {
				setHandoverError(
					err instanceof Error
						? err.message
						: "Không thể cập nhật bàn giao lớp",
				);
			} finally {
				setHandoverBusyTeacherId(null);
			}
		},
		[handoverClass, toggleHandoverMutation],
	);

	const handleClearSearch = useCallback(() => {
		setClassSearch("");
	}, []);

	const openClassSearch = useCallback(() => {
		setClassSearchActive(true);
	}, []);

	const closeClassSearch = useCallback(() => {
		setClassSearchActive(false);
		setClassSearch("");
	}, []);

	return {
		// Classes & Selected
		classes,
		visibleClasses,
		selectedClass,
		isLoading,
		error: error || classesError,
		// Permissions
		canCreateClass,
		canManageClass,
		canHandoverClass,
		// Filters
		classStatusFilter,
		setClassStatusFilter,
		classSearch,
		setClassSearch,
		classSearchActive,
		setClassSearchActive,
		openClassSearch,
		closeClassSearch,
		selectedGradeFilter,
		setSelectedGradeFilter,
		handleClearSearch,
		// Navigation
		handleSelectClass,
		handleBackToClassList,
		// Form Modal
		showModal,
		editingClass,
		formData,
		setFormData,
		isActive,
		setIsActive,
		formError,
		setFormError,
		isSubmitting,
		isSubmitDisabled,
		handleOpenAddModal,
		handleOpenEditModal,
		handleCloseFormModal,
		handleSubmitForm,
		handleDeleteClass,
		// Delete Confirmation Dialog
		classToDelete,
		isDeletingClass,
		openDeleteDialog,
		closeDeleteDialog,
		handleConfirmDelete,
		// Handover Modal
		showHandoverModal,
		handoverClass,
		teachers,
		isLoadingTeachers,
		handoverError: handoverError || teachersError,
		handoverBusyTeacherId,
		handoverSearch,
		setHandoverSearch,
		handleOpenHandoverModal,
		handleCloseHandoverModal,
		handleToggleHandover,
	};
}
