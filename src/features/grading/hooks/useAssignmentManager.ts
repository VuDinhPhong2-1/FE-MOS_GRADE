import { useEffect, useMemo, useState } from "react";
import { showAlert, showConfirm } from "../../../components/common";
import { useAuth } from "../../../context/AuthContext";
import { assignmentService } from "../../../services/assignment.service";
import type {
	Assignment,
	GradingEndpointInfo,
	UpdateAssignmentRequest,
} from "../../../types/assignment.types";
import {
	ASSIGNMENT_PRESET_OPTIONS,
	type AssignmentPresetCode,
	type BulkAssignmentDraft,
	type GradingMode,
	type SubjectCode,
} from "../types/gradingFeature.types";
import {
	buildBulkAssignmentDrafts,
	deriveExamTypeFromPractice,
	deriveProjectCodeFromEndpoint,
	getReadableErrorMessage,
	resolveEndpointsBySubjectAndPractice,
} from "../utils/gradingUtils";

interface UseAssignmentManagerProps {
	classId: string;
	gradingEndpoints: GradingEndpointInfo[];
	assignments: Assignment[];
	setAssignments: React.Dispatch<React.SetStateAction<Assignment[]>>;
	showInactiveAssignments: boolean;
	chooseMode: GradingMode;
	setChooseMode: (mode: GradingMode) => void;
	onAssignmentsUpdated?: (updatedIds: string[]) => void;
}

export const useAssignmentManager = ({
	classId,
	gradingEndpoints,
	assignments,
	setAssignments,
	showInactiveAssignments,
	chooseMode,
	setChooseMode,
	onAssignmentsUpdated,
}: UseAssignmentManagerProps) => {
	const { getAccessToken } = useAuth();
	const [newAssignmentSubject, setNewAssignmentSubject] =
		useState<SubjectCode>("excel");
	const [newAssignmentPracticeCode, setNewAssignmentPracticeCode] =
		useState<AssignmentPresetCode>("practice01");
	const [bulkAssignmentDrafts, setBulkAssignmentDrafts] = useState<
		BulkAssignmentDraft[]
	>([]);
	const [bulkAssignmentDescription, setBulkAssignmentDescription] =
		useState("");
	const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);

	const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
		null,
	);
	const [assignmentSubmitLoading, setAssignmentSubmitLoading] = useState(false);
	const [manageSelectedAssignmentIds, setManageSelectedAssignmentIds] =
		useState<string[]>([]);
	const [assignmentEditForm, setAssignmentEditForm] =
		useState<UpdateAssignmentRequest>({
			name: "",
			description: "",
			maxScore: 10,
			subject: "excel",
			examType: "otth",
			projectCode: "",
			gradingType: "auto",
			gradingApiEndpoint: "",
			isActive: true,
		});

	const selectableAssignments = useMemo(
		() =>
			showInactiveAssignments
				? assignments
				: assignments.filter((assignment) => assignment.isActive),
		[assignments, showInactiveAssignments],
	);

	const manageableActiveAssignments = selectableAssignments;

	const isAllManageActiveSelected = useMemo(() => {
		if (selectableAssignments.length === 0) return false;
		return selectableAssignments.every((assignment) =>
			manageSelectedAssignmentIds.includes(assignment.id),
		);
	}, [selectableAssignments, manageSelectedAssignmentIds]);

	const newAssignmentPracticeEndpoints = useMemo(
		() =>
			resolveEndpointsBySubjectAndPractice(
				gradingEndpoints,
				newAssignmentSubject,
				newAssignmentPracticeCode,
			),
		[gradingEndpoints, newAssignmentSubject, newAssignmentPracticeCode],
	);

	const selectedBulkAssignmentCount = useMemo(
		() => bulkAssignmentDrafts.filter((draft) => draft.selected).length,
		[bulkAssignmentDrafts],
	);

	useEffect(() => {
		if (chooseMode !== "new") return;
		setBulkAssignmentDrafts((previousDrafts) =>
			buildBulkAssignmentDrafts(
				newAssignmentPracticeEndpoints,
				previousDrafts,
				newAssignmentPracticeCode,
				newAssignmentSubject,
			),
		);
	}, [
		chooseMode,
		newAssignmentPracticeEndpoints,
		newAssignmentPracticeCode,
		newAssignmentSubject,
	]);

	useEffect(() => {
		if (chooseMode !== "manage") {
			setManageSelectedAssignmentIds((prev) => (prev.length > 0 ? [] : prev));
		}
	}, [chooseMode]);

	useEffect(() => {
		const validAssignmentIds = new Set(
			selectableAssignments.map((assignment) => assignment.id),
		);
		setManageSelectedAssignmentIds((prev) =>
			prev.filter((id) => validAssignmentIds.has(id)),
		);
	}, [selectableAssignments]);

	const handleToggleBulkAssignmentSelection = (endpoint: string) => {
		setBulkAssignmentDrafts((previousDrafts) =>
			previousDrafts.map((draft) =>
				draft.endpoint === endpoint
					? { ...draft, selected: !draft.selected }
					: draft,
			),
		);
	};

	const handleBulkAssignmentNameChange = (endpoint: string, name: string) => {
		setBulkAssignmentDrafts((previousDrafts) =>
			previousDrafts.map((draft) =>
				draft.endpoint === endpoint ? { ...draft, name } : draft,
			),
		);
	};

	const handleSelectAllBulkAssignments = () => {
		setBulkAssignmentDrafts((previousDrafts) =>
			previousDrafts.map((draft) => ({ ...draft, selected: true })),
		);
	};

	const handleClearBulkAssignments = () => {
		setBulkAssignmentDrafts((previousDrafts) =>
			previousDrafts.map((draft) => ({ ...draft, selected: false })),
		);
	};

	const handleResetBulkAssignmentNames = () => {
		setBulkAssignmentDrafts((previousDrafts) =>
			buildBulkAssignmentDrafts(
				newAssignmentPracticeEndpoints,
				previousDrafts.map((draft) => ({ ...draft, name: "" })),
				newAssignmentPracticeCode,
				newAssignmentSubject,
			),
		);
	};

	const createBulkAssignmentsFromDrafts = async (
		drafts: BulkAssignmentDraft[],
		options?: {
			closeOnSuccess?: boolean;
			practiceLabel?: string;
			practiceCode?: AssignmentPresetCode;
		},
	) => {
		if (isCreatingAssignment) return;

		const selectedDrafts = drafts.filter((draft) => draft.selected);
		if (selectedDrafts.length === 0) {
			void showAlert({
				title: "Chưa chọn project",
				message: "Vui lòng chọn ít nhất 1 project để tạo bài tập.",
				variant: "warning",
			});
			return;
		}

		const invalidDraft = selectedDrafts.find((draft) => !draft.name.trim());
		if (invalidDraft) {
			void showAlert({
				title: "Tên bài tập trống",
				message: `Tên bài tập cho ${invalidDraft.displayName} không được để trống.`,
				variant: "warning",
			});
			return;
		}

		setIsCreatingAssignment(true);
		try {
			const createdAssignments: Assignment[] = [];
			const failedAssignments: string[] = [];
			const sharedDescription = bulkAssignmentDescription.trim();
			const examType = deriveExamTypeFromPractice(
				options?.practiceCode ?? newAssignmentPracticeCode,
			);

			for (const draft of selectedDrafts) {
				try {
					const created = await assignmentService.create(
						{
							name: draft.name.trim(),
							classId,
							maxScore: draft.maxScore,
							subject: newAssignmentSubject,
							examType,
							projectCode: deriveProjectCodeFromEndpoint(draft.endpoint),
							gradingType: "auto",
							gradingApiEndpoint: draft.endpoint,
							description: sharedDescription || undefined,
						},
						getAccessToken,
					);
					createdAssignments.push(created);
				} catch (error) {
					failedAssignments.push(
						`${draft.displayName}: ${getReadableErrorMessage(error, "Không thể tạo bài tập.")}`,
					);
				}
			}

			if (createdAssignments.length > 0) {
				setAssignments((prev) => [...createdAssignments, ...prev]);
			}

			const practiceSuffix = options?.practiceLabel
				? ` cho ${options.practiceLabel}`
				: "";
			if (failedAssignments.length === 0) {
				void showAlert({
					title: "Thành công",
					message: `Tạo thành công ${createdAssignments.length} bài tập${practiceSuffix}.`,
					variant: "success",
				});
				if (options?.closeOnSuccess) {
					setChooseMode(null);
				}
				return;
			}

			if (createdAssignments.length > 0) {
				void showAlert({
					title: "Tạo bài tập có lỗi",
					message: `Đã tạo ${createdAssignments.length}/${selectedDrafts.length} bài tập${practiceSuffix}.\n\nLỗi:\n${failedAssignments.join("\n")}`,
					variant: "warning",
				});
				return;
			}

			void showAlert({
				title: "Lỗi tạo bài tập",
				message: `Không thể tạo bài tập${practiceSuffix}.\n\n${failedAssignments.join("\n")}`,
				variant: "error",
			});
		} finally {
			setIsCreatingAssignment(false);
		}
	};

	const handleCreateBulkAssignments = async () => {
		await createBulkAssignmentsFromDrafts(bulkAssignmentDrafts, {
			closeOnSuccess: true,
			practiceCode: newAssignmentPracticeCode,
		});
	};

	const handleQuickCreateByPractice = async (
		practiceCode: AssignmentPresetCode,
	) => {
		const practice = ASSIGNMENT_PRESET_OPTIONS.find(
			(item) => item.code === practiceCode,
		);
		const practiceEndpoints = resolveEndpointsBySubjectAndPractice(
			gradingEndpoints,
			newAssignmentSubject,
			practiceCode,
		);
		const quickDrafts = buildBulkAssignmentDrafts(
			practiceEndpoints,
			[],
			practiceCode,
			newAssignmentSubject,
		).map((draft) => ({ ...draft, selected: true }));

		if (quickDrafts.length === 0) {
			void showAlert({
				title: "Không tìm thấy project",
				message: `Không có project ${practice?.label || practiceCode} cho môn ${newAssignmentSubject.toUpperCase()}.`,
				variant: "info",
			});
			return;
		}

		await createBulkAssignmentsFromDrafts(quickDrafts, {
			closeOnSuccess: true,
			practiceCode,
			practiceLabel: `${practice?.label || practiceCode} (${newAssignmentSubject.toUpperCase()})`,
		});
	};

	const handleToggleManageAssignmentSelection = (assignment: Assignment) => {
		if (
			assignmentSubmitLoading ||
			(!showInactiveAssignments && !assignment.isActive)
		) {
			return;
		}
		setManageSelectedAssignmentIds((prev) =>
			prev.includes(assignment.id)
				? prev.filter((id) => id !== assignment.id)
				: [...prev, assignment.id],
		);
	};

	const handleSelectAllManageAssignments = () => {
		if (assignmentSubmitLoading) return;
		setManageSelectedAssignmentIds(
			selectableAssignments.map((assignment) => assignment.id),
		);
	};

	const handleClearManageAssignments = () => {
		if (assignmentSubmitLoading) return;
		setManageSelectedAssignmentIds([]);
	};

	const handleDeactivateSelectedAssignments = async () => {
		if (assignmentSubmitLoading) return;

		const selectedActiveAssignments = assignments
			.filter((assignment) => assignment.isActive)
			.filter((assignment) =>
				manageSelectedAssignmentIds.includes(assignment.id),
			);

		if (selectedActiveAssignments.length === 0) {
			void showAlert({
				title: "Chưa chọn bài tập",
				message: "Vui lòng chọn ít nhất 1 bài tập đang dùng để bỏ hoạt động.",
				variant: "warning",
			});
			return;
		}

		const confirmed = await showConfirm({
			title: "Xác nhận bỏ hoạt động",
			message: `Bạn có chắc muốn bỏ hoạt động ${selectedActiveAssignments.length} bài tập đã chọn?`,
			confirmLabel: "Bỏ hoạt động",
			variant: "destructive",
		});
		if (!confirmed) return;

		setAssignmentSubmitLoading(true);
		try {
			const results = await Promise.allSettled(
				selectedActiveAssignments.map((assignment) =>
					assignmentService.update(
						assignment.id,
						{ isActive: false },
						getAccessToken,
					),
				),
			);

			const updatedAssignments: Assignment[] = [];
			const failedAssignments: string[] = [];

			results.forEach((result, index) => {
				const sourceAssignment = selectedActiveAssignments[index];
				if (result.status === "fulfilled") {
					updatedAssignments.push(result.value);
					return;
				}

				failedAssignments.push(
					`${sourceAssignment.name}: ${getReadableErrorMessage(result.reason, "Không thể bỏ hoạt động bài tập này.")}`,
				);
			});

			if (updatedAssignments.length > 0) {
				const updatedIds = new Set(
					updatedAssignments.map((assignment) => assignment.id),
				);
				const updatedById = new Map(
					updatedAssignments.map((assignment) => [assignment.id, assignment]),
				);

				setAssignments((prev) => {
					if (!showInactiveAssignments) {
						return prev.filter((item) => !updatedIds.has(item.id));
					}
					return prev.map((item) => updatedById.get(item.id) || item);
				});

				setManageSelectedAssignmentIds((prev) =>
					prev.filter((id) => !updatedIds.has(id)),
				);

				if (onAssignmentsUpdated) {
					onAssignmentsUpdated(Array.from(updatedIds));
				}
			}

			if (failedAssignments.length === 0) {
				void showAlert({
					title: "Thành công",
					message: `Đã bỏ hoạt động ${updatedAssignments.length} bài tập.`,
					variant: "success",
				});
				return;
			}

			if (updatedAssignments.length > 0) {
				void showAlert({
					title: "Bỏ hoạt động có lỗi",
					message: `Đã bỏ hoạt động ${updatedAssignments.length}/${selectedActiveAssignments.length} bài tập.\n\nLỗi:\n${failedAssignments.join("\n")}`,
					variant: "warning",
				});
				return;
			}

			void showAlert({
				title: "Lỗi bỏ hoạt động",
				message: `Không thể bỏ hoạt động các bài tập đã chọn.\n\n${failedAssignments.join("\n")}`,
				variant: "error",
			});
		} catch (error) {
			console.error("Lỗi khi bỏ hoạt động nhiều bài tập:", error);
			void showAlert({
				title: "Lỗi",
				message: getReadableErrorMessage(
					error,
					"Không thể bỏ hoạt động các bài tập đã chọn.",
				),
				variant: "error",
			});
		} finally {
			setAssignmentSubmitLoading(false);
		}
	};

	const handleOpenEditAssignment = (assignment: Assignment) => {
		setEditingAssignment(assignment);
		setAssignmentEditForm({
			name: assignment.name,
			description: assignment.description || "",
			maxScore: assignment.maxScore,
			subject: assignment.subject,
			examType: assignment.examType,
			projectCode: assignment.projectCode || "",
			gradingType: assignment.gradingType,
			gradingApiEndpoint: assignment.gradingApiEndpoint || "",
			isActive: assignment.isActive,
		});
	};

	const handleSaveAssignmentEdit = async () => {
		if (!editingAssignment) return;
		if (!assignmentEditForm.name?.trim()) {
			void showAlert({
				title: "Thiếu thông tin",
				message: "Vui lòng nhập tên bài tập.",
				variant: "warning",
			});
			return;
		}
		if (
			assignmentEditForm.gradingType === "auto" &&
			!assignmentEditForm.gradingApiEndpoint
		) {
			void showAlert({
				title: "Thiếu thông tin",
				message: "Bài tập auto phải có đầu chấm điểm.",
				variant: "warning",
			});
			return;
		}

		setAssignmentSubmitLoading(true);
		try {
			const payload: UpdateAssignmentRequest = {
				name: assignmentEditForm.name?.trim(),
				description: assignmentEditForm.description || "",
				maxScore: assignmentEditForm.maxScore,
				subject: assignmentEditForm.subject,
				examType: assignmentEditForm.examType,
				projectCode: assignmentEditForm.projectCode,
				gradingType: assignmentEditForm.gradingType,
				gradingApiEndpoint:
					assignmentEditForm.gradingType === "auto"
						? assignmentEditForm.gradingApiEndpoint || undefined
						: undefined,
				isActive: assignmentEditForm.isActive,
			};

			const updated = await assignmentService.update(
				editingAssignment.id,
				payload,
				getAccessToken,
			);
			setAssignments((prev) => {
				if (!showInactiveAssignments && !updated.isActive) {
					return prev.filter((item) => item.id !== updated.id);
				}
				return prev.map((item) => (item.id === updated.id ? updated : item));
			});
			setEditingAssignment(null);
			void showAlert({
				title: "Thành công",
				message: "Cập nhật bài tập thành công.",
				variant: "success",
			});
		} catch (error) {
			console.error("Lỗi khi cập nhật bài tập:", error);
			void showAlert({
				title: "Lỗi",
				message:
					error instanceof Error
						? error.message
						: "Không thể cập nhật bài tập.",
				variant: "error",
			});
		} finally {
			setAssignmentSubmitLoading(false);
		}
	};

	const handleDeleteAssignment = async (assignment: Assignment) => {
		const confirmed = await showConfirm({
			title: "Xác nhận xóa bài tập",
			message: `Bạn có chắc muốn xóa bài tập "${assignment.name}"?`,
			confirmLabel: "Xác nhận xóa",
			variant: "destructive",
		});
		if (!confirmed) return;
		setAssignmentSubmitLoading(true);
		try {
			await assignmentService.delete(assignment.id, getAccessToken);
			setAssignments((prev) => {
				if (!showInactiveAssignments || !assignment.isActive) {
					return prev.filter((item) => item.id !== assignment.id);
				}
				return prev.map((item) =>
					item.id === assignment.id ? { ...item, isActive: false } : item,
				);
			});
			setManageSelectedAssignmentIds((prev) =>
				prev.filter((id) => id !== assignment.id),
			);
			if (onAssignmentsUpdated) {
				onAssignmentsUpdated([assignment.id]);
			}
			void showAlert({
				title: "Thành công",
				message:
					showInactiveAssignments && assignment.isActive
						? "Bài tập đã được ẩn."
						: "Đã xóa bài tập.",
				variant: "success",
			});
		} catch (error) {
			console.error("Lỗi khi xóa bài tập:", error);
			void showAlert({
				title: "Lỗi",
				message:
					error instanceof Error ? error.message : "Không thể xóa bài tập.",
				variant: "error",
			});
		} finally {
			setAssignmentSubmitLoading(false);
		}
	};

	const handleDeleteSelectedAssignments = async () => {
		if (assignmentSubmitLoading) return;

		const selectedAssignments = assignments.filter((assignment) =>
			manageSelectedAssignmentIds.includes(assignment.id),
		);

		if (selectedAssignments.length === 0) {
			void showAlert({
				title: "Chưa chọn bài tập",
				message: "Vui lòng chọn ít nhất 1 bài tập để xóa.",
				variant: "warning",
			});
			return;
		}

		const confirmed = await showConfirm({
			title: "Xác nhận xóa bài tập",
			message: `Bạn có chắc muốn xóa ${selectedAssignments.length} bài tập đã chọn? Hành động này sẽ xóa dữ liệu và không thể hoàn tác.`,
			confirmLabel: "Xác nhận xóa",
			variant: "destructive",
		});
		if (!confirmed) return;

		setAssignmentSubmitLoading(true);
		try {
			const results = await Promise.allSettled(
				selectedAssignments.map((assignment) =>
					assignmentService.delete(assignment.id, getAccessToken),
				),
			);

			const deletedIds: string[] = [];
			const failedAssignments: string[] = [];

			results.forEach((result, index) => {
				const sourceAssignment = selectedAssignments[index];
				if (result.status === "fulfilled") {
					deletedIds.push(sourceAssignment.id);
					return;
				}

				failedAssignments.push(
					`${sourceAssignment.name}: ${getReadableErrorMessage(result.reason, "Không thể xóa bài tập này.")}`,
				);
			});

			if (deletedIds.length > 0) {
				const deletedSet = new Set(deletedIds);
				setAssignments((prev) => {
					if (!showInactiveAssignments) {
						return prev.filter((item) => !deletedSet.has(item.id));
					}
					return prev
						.map((item) => {
							if (deletedSet.has(item.id)) {
								return item.isActive ? { ...item, isActive: false } : null;
							}
							return item;
						})
						.filter((item): item is Assignment => item !== null);
				});

				setManageSelectedAssignmentIds((prev) =>
					prev.filter((id) => !deletedSet.has(id)),
				);

				if (onAssignmentsUpdated) {
					onAssignmentsUpdated(deletedIds);
				}
			}

			if (failedAssignments.length === 0) {
				void showAlert({
					title: "Thành công",
					message: `Đã xóa thành công ${deletedIds.length} bài tập.`,
					variant: "success",
				});
				return;
			}

			if (deletedIds.length > 0) {
				void showAlert({
					title: "Xóa bài tập có lỗi",
					message: `Đã xóa ${deletedIds.length}/${selectedAssignments.length} bài tập.\n\nLỗi:\n${failedAssignments.join("\n")}`,
					variant: "warning",
				});
				return;
			}

			void showAlert({
				title: "Lỗi xóa bài tập",
				message: `Không thể xóa các bài tập đã chọn.\n\n${failedAssignments.join("\n")}`,
				variant: "error",
			});
		} catch (error) {
			console.error("Lỗi khi xóa nhiều bài tập:", error);
			void showAlert({
				title: "Lỗi",
				message: getReadableErrorMessage(
					error,
					"Không thể xóa các bài tập đã chọn.",
				),
				variant: "error",
			});
		} finally {
			setAssignmentSubmitLoading(false);
		}
	};

	const resetAssignmentManagerState = () => {
		setBulkAssignmentDrafts([]);
		setBulkAssignmentDescription("");
		setIsCreatingAssignment(false);
		setEditingAssignment(null);
		setAssignmentSubmitLoading(false);
		setManageSelectedAssignmentIds([]);
		setNewAssignmentSubject("excel");
		setNewAssignmentPracticeCode("practice01");
		setAssignmentEditForm({
			name: "",
			description: "",
			maxScore: 10,
			subject: "excel",
			examType: "otth",
			projectCode: "",
			gradingType: "auto",
			gradingApiEndpoint: "",
			isActive: true,
		});
	};

	return {
		newAssignmentSubject,
		setNewAssignmentSubject,
		newAssignmentPracticeCode,
		setNewAssignmentPracticeCode,
		bulkAssignmentDrafts,
		bulkAssignmentDescription,
		setBulkAssignmentDescription,
		isCreatingAssignment,
		selectedBulkAssignmentCount,
		manageableActiveAssignments,
		isAllManageActiveSelected,
		manageSelectedAssignmentIds,
		editingAssignment,
		setEditingAssignment,
		assignmentSubmitLoading,
		assignmentEditForm,
		setAssignmentEditForm,
		handleToggleBulkAssignmentSelection,
		handleBulkAssignmentNameChange,
		handleSelectAllBulkAssignments,
		handleClearBulkAssignments,
		handleResetBulkAssignmentNames,
		handleCreateBulkAssignments,
		handleQuickCreateByPractice,
		handleToggleManageAssignmentSelection,
		handleSelectAllManageAssignments,
		handleClearManageAssignments,
		handleDeactivateSelectedAssignments,
		handleOpenEditAssignment,
		handleSaveAssignmentEdit,
		handleDeleteAssignment,
		handleDeleteSelectedAssignments,
		resetAssignmentManagerState,
	};
};
