import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { authService } from "../../../services/auth.service";
import type {
	TeacherApprovalRequest,
	TeacherSummary,
} from "../../../types/auth.types";
import type { ActiveTab, TeacherRequestStatusFilter } from "../types";

export const usePermissionData = () => {
	const { user, getAccessToken } = useAuth();
	const isAdmin = user?.role === "Admin";

	const [activeTab, setActiveTab] = useState<ActiveTab>("requests");
	const [loading, setLoading] = useState(false);
	const [requestLoading, setRequestLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [decidingUserId, setDecidingUserId] = useState("");
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
	const [teacherRequests, setTeacherRequests] = useState<
		TeacherApprovalRequest[]
	>([]);
	const [requestStatus, setRequestStatus] =
		useState<TeacherRequestStatusFilter>("pending");
	const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>(
		{},
	);
	const [permissionCatalog, setPermissionCatalog] = useState<string[]>([]);
	const [selectedTeacherId, setSelectedTeacherId] = useState("");
	const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
	const [teacherKeyword, setTeacherKeyword] = useState("");

	const selectedTeacher = useMemo(
		() =>
			teachers.find((teacher) => teacher.userId === selectedTeacherId) || null,
		[teachers, selectedTeacherId],
	);

	const filteredTeachers = useMemo(() => {
		const keyword = teacherKeyword.trim().toLowerCase();
		if (!keyword) return teachers;

		return teachers.filter((teacher) => {
			const fullName = (teacher.fullName || "").toLowerCase();
			const username = (teacher.username || "").toLowerCase();
			const email = (teacher.email || "").toLowerCase();
			return (
				fullName.includes(keyword) ||
				username.includes(keyword) ||
				email.includes(keyword)
			);
		});
	}, [teacherKeyword, teachers]);

	const selectTeacher = useCallback(
		(teacherId: string) => {
			setSelectedTeacherId(teacherId);
			const teacher = teachers.find((item) => item.userId === teacherId);
			setSelectedPermissions([...(teacher?.permissions || [])]);
		},
		[teachers],
	);

	const loadPermissionData = useCallback(
		async (preferredTeacherId?: string) => {
			if (!isAdmin) return;

			setLoading(true);
			setError("");
			setSuccess("");

			try {
				const [teacherList, catalog] = await Promise.all([
					authService.getTeachers(getAccessToken, true),
					authService.getPermissionCatalog(getAccessToken),
				]);

				setTeachers(teacherList);
				setPermissionCatalog(catalog.permissions || []);

				if (teacherList.length === 0) {
					setSelectedTeacherId("");
					setSelectedPermissions([]);
					return;
				}

				const targetTeacherId =
					preferredTeacherId &&
					teacherList.some((teacher) => teacher.userId === preferredTeacherId)
						? preferredTeacherId
						: teacherList[0].userId;
				setSelectedTeacherId(targetTeacherId);
				const targetTeacher = teacherList.find(
					(teacher) => teacher.userId === targetTeacherId,
				);
				setSelectedPermissions([...(targetTeacher?.permissions || [])]);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Không thể tải dữ liệu phân quyền",
				);
			} finally {
				setLoading(false);
			}
		},
		[getAccessToken, isAdmin],
	);

	const loadTeacherRequests = useCallback(async () => {
		if (!isAdmin) return;

		setRequestLoading(true);
		setError("");
		setSuccess("");

		try {
			const requests = await authService.getTeacherRequests(
				requestStatus,
				getAccessToken,
			);
			setTeacherRequests(requests);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Không thể tải yêu cầu giáo viên",
			);
		} finally {
			setRequestLoading(false);
		}
	}, [getAccessToken, isAdmin, requestStatus]);

	useEffect(() => {
		void loadPermissionData();
	}, [loadPermissionData]);

	useEffect(() => {
		void loadTeacherRequests();
	}, [loadTeacherRequests]);

	const togglePermission = useCallback((permission: string) => {
		setSelectedPermissions((prev) =>
			prev.includes(permission)
				? prev.filter((item) => item !== permission)
				: [...prev, permission],
		);
	}, []);

	const selectAllPermissions = useCallback(() => {
		setSelectedPermissions([...permissionCatalog]);
	}, [permissionCatalog]);

	const clearAllPermissions = useCallback(() => {
		setSelectedPermissions([]);
	}, []);

	const savePermissions = useCallback(async () => {
		if (!selectedTeacherId) {
			setError("Vui lòng chọn giáo viên.");
			return;
		}

		try {
			setSaving(true);
			setError("");
			setSuccess("");

			const updatedTeacher = await authService.updateTeacherPermissions(
				selectedTeacherId,
				{ permissions: selectedPermissions },
				getAccessToken,
			);

			setTeachers((prev) =>
				prev.map((teacher) =>
					teacher.userId === updatedTeacher.userId
						? { ...teacher, permissions: updatedTeacher.permissions || [] }
						: teacher,
				),
			);
			setSelectedPermissions([...(updatedTeacher.permissions || [])]);
			setSuccess("Đã lưu phân quyền giáo viên.");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Không thể lưu phân quyền");
		} finally {
			setSaving(false);
		}
	}, [getAccessToken, selectedPermissions, selectedTeacherId]);

	const handleNoteChange = useCallback((userId: string, note: string) => {
		setDecisionNotes((prev) => ({
			...prev,
			[userId]: note,
		}));
	}, []);

	const decideTeacherRequest = useCallback(
		async (request: TeacherApprovalRequest, decision: "approve" | "reject") => {
			if (decision === "reject" && !decisionNotes[request.userId]?.trim()) {
				setError("Vui lòng nhập ghi chú khi từ chối yêu cầu.");
				return;
			}

			try {
				setDecidingUserId(request.userId);
				setError("");
				setSuccess("");

				await authService.decideTeacherRequest(
					request.userId,
					{
						decision,
						note: decisionNotes[request.userId]?.trim() || undefined,
					},
					getAccessToken,
				);

				setSuccess(
					decision === "approve"
						? "Đã duyệt yêu cầu giáo viên."
						: "Đã từ chối yêu cầu giáo viên.",
				);
				setDecisionNotes((prev) => ({ ...prev, [request.userId]: "" }));
				await Promise.all([
					loadTeacherRequests(),
					loadPermissionData(selectedTeacherId),
				]);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Không thể xử lý yêu cầu giáo viên",
				);
			} finally {
				setDecidingUserId("");
			}
		},
		[
			decisionNotes,
			getAccessToken,
			loadPermissionData,
			loadTeacherRequests,
			selectedTeacherId,
		],
	);

	const handleRefresh = useCallback(() => {
		void loadTeacherRequests();
		void loadPermissionData(selectedTeacherId);
	}, [loadPermissionData, loadTeacherRequests, selectedTeacherId]);

	return {
		isAdmin,
		activeTab,
		setActiveTab,
		loading,
		requestLoading,
		saving,
		decidingUserId,
		error,
		setError,
		success,
		setSuccess,
		teachers,
		teacherRequests,
		requestStatus,
		setRequestStatus,
		decisionNotes,
		permissionCatalog,
		selectedTeacherId,
		selectedTeacher,
		filteredTeachers,
		selectedPermissions,
		teacherKeyword,
		setTeacherKeyword,
		selectTeacher,
		togglePermission,
		selectAllPermissions,
		clearAllPermissions,
		savePermissions,
		handleNoteChange,
		decideTeacherRequest,
		handleRefresh,
	};
};
