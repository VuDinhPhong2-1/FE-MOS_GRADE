import { useEffect, useMemo, useState } from "react";
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

	const manageableActiveAssignments = useMemo(
		() => assignments.filter((assignment) => assignment.isActive),
		[assignments],
	);

	const isAllManageActiveSelected = useMemo(() => {
		if (manageableActiveAssignments.length === 0) return false;
		return manageableActiveAssignments.every((assignment) =>
			manageSelectedAssignmentIds.includes(assignment.id),
		);
	}, [manageableActiveAssignments, manageSelectedAssignmentIds]);

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
		const activeAssignmentIds = new Set(
			assignments
				.filter((assignment) => assignment.isActive)
				.map((assignment) => assignment.id),
		);
		setManageSelectedAssignmentIds((prev) =>
			prev.filter((id) => activeAssignmentIds.has(id)),
		);
	}, [assignments]);

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
			alert("Vui lòng chọn ít nhất 1 project để tạo bài tập.");
			return;
		}

		const invalidDraft = selectedDrafts.find((draft) => !draft.name.trim());
		if (invalidDraft) {
			alert(`Tên bài tập cho ${invalidDraft.displayName} không được để trống.`);
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
				alert(
					`Tạo thành công ${createdAssignments.length} bài tập${practiceSuffix}.`,
				);
				if (options?.closeOnSuccess) {
					setChooseMode(null);
				}
				return;
			}

			if (createdAssignments.length > 0) {
				alert(
					`Đã tạo ${createdAssignments.length}/${selectedDrafts.length} bài tập${practiceSuffix}.\nLỗi:\n${failedAssignments.join("\n")}`,
				);
				return;
			}

			alert(
				`Không thể tạo bài tập${practiceSuffix}.\n${failedAssignments.join("\n")}`,
			);
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
			alert(
				`Không có project ${practice?.label || practiceCode} cho môn ${newAssignmentSubject.toUpperCase()}.`,
			);
			return;
		}

		await createBulkAssignmentsFromDrafts(quickDrafts, {
			closeOnSuccess: true,
			practiceCode,
			practiceLabel: `${practice?.label || practiceCode} (${newAssignmentSubject.toUpperCase()})`,
		});
	};

	const handleToggleManageAssignmentSelection = (assignment: Assignment) => {
		if (assignmentSubmitLoading || !assignment.isActive) return;
		setManageSelectedAssignmentIds((prev) =>
			prev.includes(assignment.id)
				? prev.filter((id) => id !== assignment.id)
				: [...prev, assignment.id],
		);
	};

	const handleSelectAllManageAssignments = () => {
		if (assignmentSubmitLoading) return;
		setManageSelectedAssignmentIds(
			manageableActiveAssignments.map((assignment) => assignment.id),
		);
	};

	const handleClearManageAssignments = () => {
		if (assignmentSubmitLoading) return;
		setManageSelectedAssignmentIds([]);
	};

	const handleDeactivateSelectedAssignments = async () => {
		if (assignmentSubmitLoading) return;

		const selectedActiveAssignments = manageableActiveAssignments.filter(
			(assignment) => manageSelectedAssignmentIds.includes(assignment.id),
		);

		if (selectedActiveAssignments.length === 0) {
			alert("Vui lòng chọn ít nhất 1 bài tập đang dùng.");
			return;
		}

		const confirmed = confirm(
			`Bạn có chắc muốn bỏ hoạt động ${selectedActiveAssignments.length} bài tập đã chọn?`,
		);
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
				alert(`Đã bỏ hoạt động ${updatedAssignments.length} bài tập.`);
				return;
			}

			if (updatedAssignments.length > 0) {
				alert(
					`Đã bỏ hoạt động ${updatedAssignments.length}/${selectedActiveAssignments.length} bài tập.\nLỗi:\n${failedAssignments.join("\n")}`,
				);
				return;
			}

			alert(
				`Không thể bỏ hoạt động các bài tập đã chọn.\n${failedAssignments.join("\n")}`,
			);
		} catch (error) {
			console.error("Lỗi khi bỏ hoạt động nhiều bài tập:", error);
			alert(
				getReadableErrorMessage(
					error,
					"Không thể bỏ hoạt động các bài tập đã chọn.",
				),
			);
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
			alert("Vui lòng nhập tên bài tập.");
			return;
		}
		if (
			assignmentEditForm.gradingType === "auto" &&
			!assignmentEditForm.gradingApiEndpoint
		) {
			alert("Bài tập auto phải có đầu chấm điểm.");
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
			alert("Cập nhật bài tập thành công.");
		} catch (error) {
			console.error("Lỗi khi cập nhật bài tập:", error);
			alert(
				error instanceof Error ? error.message : "Không thể cập nhật bài tập.",
			);
		} finally {
			setAssignmentSubmitLoading(false);
		}
	};

	const handleDeleteAssignment = async (assignment: Assignment) => {
		if (!confirm(`Bạn có chắc muốn xóa bài tập "${assignment.name}"?`)) return;
		setAssignmentSubmitLoading(true);
		try {
			await assignmentService.delete(assignment.id, getAccessToken);
			setAssignments((prev) => {
				if (!showInactiveAssignments) {
					return prev.filter((item) => item.id !== assignment.id);
				}
				return prev.map((item) =>
					item.id === assignment.id ? { ...item, isActive: false } : item,
				);
			});
			if (onAssignmentsUpdated) {
				onAssignmentsUpdated([assignment.id]);
			}
			alert(
				showInactiveAssignments ? "Bài tập đã được ẩn." : "Đã xóa bài tập.",
			);
		} catch (error) {
			console.error("Lỗi khi xóa bài tập:", error);
			alert(error instanceof Error ? error.message : "Không thể xóa bài tập.");
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
		resetAssignmentManagerState,
	};
};
