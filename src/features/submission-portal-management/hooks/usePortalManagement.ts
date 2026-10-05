import type { SelectOption } from "@bug-on/m3-expressive";
import { useSnackbar } from "@bug-on/m3-expressive";
import { useCallback, useMemo, useRef, useState } from "react";
import { showConfirm } from "../../../components/common";
import { useAuth } from "../../../context/AuthContext";
import { classService } from "../../../services/class.service";
import { submissionPortalService } from "../../../services/submission-portal.service";
import type { Class } from "../../../types/class.types";
import type { SubmissionPortal } from "../../../types/submission-portal.types";
import type { ScoringPolicy } from "../utils/portalFormatters";

export const usePortalManagement = () => {
	const { user, getAccessToken } = useAuth();
	const { showSnackbar } = useSnackbar();

	const hasLoadedOnceRef = useRef(false);
	const [portals, setPortals] = useState<SubmissionPortal[]>([]);
	const [teacherClasses, setTeacherClasses] = useState<Class[]>([]);
	const [loading, setLoading] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingPortal, setEditingPortal] = useState<SubmissionPortal | null>(
		null,
	);

	// Filters
	const [scopeFilter, setScopeFilter] = useState<"all" | "teacher">("all");
	const [selectedClassId, setSelectedClassId] = useState("");

	// Form fields
	const [title, setTitle] = useState("Link nộp bài thực hành");
	const [description, setDescription] = useState("");
	const [maxSubmissions, setMaxSubmissions] = useState(0);
	const [scoringPolicy, setScoringPolicy] =
		useState<ScoringPolicy>("BestScore");
	const [showLeaderboard, setShowLeaderboard] = useState(true);
	const [showDetailedFeedback, setShowDetailedFeedback] = useState(true);

	const visiblePortals = useMemo(
		() => portals.filter((portal) => portal.isActive),
		[portals],
	);

	const teacherClassIdSet = useMemo(() => {
		const set = new Set<string>();
		const currentUserId = user?.userId;
		for (const cls of teacherClasses) {
			if (
				!currentUserId ||
				cls.ownerId === currentUserId ||
				cls.managerTeacherIds?.includes(currentUserId)
			) {
				set.add(cls.id);
			}
		}
		return set;
	}, [teacherClasses, user?.userId]);

	const isTeacherPortal = useCallback(
		(portal: SubmissionPortal) => {
			if (user?.userId && portal.createdBy === user.userId) return true;
			return portal.classIds.some((id) => teacherClassIdSet.has(id));
		},
		[teacherClassIdSet, user?.userId],
	);

	const classOptions = useMemo<SelectOption[]>(() => {
		const scopedPortals =
			scopeFilter === "teacher"
				? visiblePortals.filter(isTeacherPortal)
				: visiblePortals;

		const classMap = new Map<string, string>();

		for (const portal of scopedPortals) {
			if (portal.classes && portal.classes.length > 0) {
				for (const c of portal.classes) {
					classMap.set(c.id, c.name);
				}
			} else {
				for (const cId of portal.classIds) {
					const found = teacherClasses.find((tc) => tc.id === cId);
					if (found) {
						classMap.set(found.id, found.name);
					}
				}
			}
		}

		return [
			{ value: "", label: "Tất cả các lớp" },
			...Array.from(classMap.entries())
				.sort((a, b) => a[1].localeCompare(b[1], "vi"))
				.map(([id, name]) => ({
					value: id,
					label: name,
				})),
		];
	}, [scopeFilter, visiblePortals, isTeacherPortal, teacherClasses]);

	const handleScopeChange = useCallback((newScope: "all" | "teacher") => {
		setScopeFilter(newScope);
		// Reset class filter if not available in new scope
		setSelectedClassId("");
	}, []);

	const resetFilters = useCallback(() => {
		setScopeFilter("all");
		setSelectedClassId("");
	}, []);

	const filteredPortals = useMemo(() => {
		let list = visiblePortals;

		if (scopeFilter === "teacher") {
			list = list.filter(isTeacherPortal);
		}

		if (selectedClassId) {
			list = list.filter((p) => p.classIds.includes(selectedClassId));
		}

		return list;
	}, [visiblePortals, scopeFilter, isTeacherPortal, selectedClassId]);

	const stats = useMemo(
		() => ({
			active: filteredPortals.length,
			totalAlerts: filteredPortals.reduce(
				(s, p) => s + (p.unreadAlertCount || 0),
				0,
			),
			scopedAssignments: filteredPortals.reduce(
				(s, p) => s + p.assignmentIds.length,
				0,
			),
		}),
		[filteredPortals],
	);

	const fetchTeacherClasses = useCallback(async () => {
		try {
			const classList = await classService.getAllClasses(getAccessToken, true);
			setTeacherClasses(classList.filter((cls) => cls.isActive !== false));
		} catch {
			// Non-critical fallback
		}
	}, [getAccessToken]);

	const fetchPortals = useCallback(async () => {
		if (!hasLoadedOnceRef.current) {
			setLoading(true);
		} else {
			setIsRefreshing(true);
		}

		try {
			const [portalList] = await Promise.all([
				submissionPortalService.getAll(getAccessToken),
				fetchTeacherClasses(),
			]);
			setPortals(portalList);
			hasLoadedOnceRef.current = true;
		} catch (error) {
			void showSnackbar({
				message:
					error instanceof Error
						? error.message
						: "Không thể tải danh sách cổng nộp bài",
				withDismissAction: true,
			});
		} finally {
			setLoading(false);
			setIsRefreshing(false);
		}
	}, [getAccessToken, fetchTeacherClasses, showSnackbar]);

	const resetForm = useCallback(() => {
		setTitle("Link nộp bài thực hành");
		setDescription("");
		setMaxSubmissions(0);
		setScoringPolicy("BestScore");
		setShowLeaderboard(true);
		setShowDetailedFeedback(true);
	}, []);

	const openEdit = useCallback((portal: SubmissionPortal) => {
		setEditingPortal(portal);
		setTitle(portal.title);
		setDescription(portal.description || "");
		setMaxSubmissions(portal.maxSubmissionsPerStudent);
		setScoringPolicy(portal.scoringPolicy);
		setShowLeaderboard(portal.showLeaderboard);
		setShowDetailedFeedback(portal.showDetailedFeedback);
	}, []);

	const closeEdit = useCallback(() => {
		setEditingPortal(null);
		resetForm();
	}, [resetForm]);

	const closeCreate = useCallback(() => {
		setIsCreateOpen(false);
		resetForm();
	}, [resetForm]);

	const createPortal = useCallback(
		async (classIds: string[], assignmentIds: string[]) => {
			if (
				!title.trim() ||
				classIds.length === 0 ||
				assignmentIds.length === 0
			) {
				void showSnackbar({
					message:
						"Vui lòng nhập tiêu đề, chọn trường, ít nhất một lớp và một bài tập.",
					withDismissAction: true,
				});
				return false;
			}

			setLoading(true);
			try {
				await submissionPortalService.create(
					{
						title: title.trim(),
						description: description.trim(),
						classIds,
						assignmentIds,
						maxSubmissionsPerStudent: maxSubmissions,
						scoringPolicy,
						showLeaderboard,
						showDetailedFeedback,
					},
					getAccessToken,
				);
				closeCreate();
				void showSnackbar({
					message: "Đã tạo link nộp bài thành công.",
					withDismissAction: true,
				});
				await fetchPortals();
				return true;
			} catch (error) {
				void showSnackbar({
					message:
						error instanceof Error ? error.message : "Không thể tạo link",
					withDismissAction: true,
				});
				return false;
			} finally {
				setLoading(false);
			}
		},
		[
			title,
			description,
			maxSubmissions,
			scoringPolicy,
			showLeaderboard,
			showDetailedFeedback,
			getAccessToken,
			closeCreate,
			showSnackbar,
			fetchPortals,
		],
	);

	const updatePortal = useCallback(
		async (isActive: boolean) => {
			if (!editingPortal) return false;
			if (!title.trim()) {
				void showSnackbar({
					message: "Vui lòng nhập tiêu đề link nộp bài.",
					withDismissAction: true,
				});
				return false;
			}

			setLoading(true);
			try {
				await submissionPortalService.update(
					editingPortal.id,
					{
						title: title.trim(),
						description: description.trim(),
						classIds: editingPortal.classIds,
						assignmentIds: editingPortal.assignmentIds,
						startsAt: editingPortal.startsAt,
						endsAt: editingPortal.endsAt,
						maxSubmissionsPerStudent: maxSubmissions,
						scoringPolicy,
						showLeaderboard,
						showDetailedFeedback,
						isActive,
					},
					getAccessToken,
				);
				closeEdit();
				void showSnackbar({
					message: "Đã cập nhật link nộp bài.",
					withDismissAction: true,
				});
				await fetchPortals();
				return true;
			} catch (error) {
				void showSnackbar({
					message:
						error instanceof Error ? error.message : "Không thể cập nhật link",
					withDismissAction: true,
				});
				return false;
			} finally {
				setLoading(false);
			}
		},
		[
			editingPortal,
			title,
			description,
			maxSubmissions,
			scoringPolicy,
			showLeaderboard,
			showDetailedFeedback,
			getAccessToken,
			closeEdit,
			showSnackbar,
			fetchPortals,
		],
	);

	const deletePortal = useCallback(
		async (
			portal: SubmissionPortal,
			onDeleted?: (deletedId: string) => void,
		) => {
			const ok = await showConfirm({
				title: "Đóng link nộp bài?",
				message: `Đóng link "${portal.title}"? Học sinh sẽ không thể nộp bài qua link này nữa.`,
				description: "Dữ liệu lịch sử nộp và điểm đã lưu vẫn được giữ nguyên.",
				confirmLabel: "Đóng link",
				cancelLabel: "Hủy",
				variant: "destructive",
				icon: "link_off",
			});
			if (!ok) return;

			setLoading(true);
			try {
				await submissionPortalService.delete(portal.id, getAccessToken);
				void showSnackbar({
					message: "Đã đóng link nộp bài.",
					withDismissAction: true,
				});
				await fetchPortals();
				if (editingPortal?.id === portal.id) closeEdit();
				onDeleted?.(portal.id);
			} catch (error) {
				void showSnackbar({
					message:
						error instanceof Error ? error.message : "Không thể đóng link",
					withDismissAction: true,
				});
			} finally {
				setLoading(false);
			}
		},
		[getAccessToken, showSnackbar, fetchPortals, editingPortal?.id, closeEdit],
	);

	const copyText = useCallback(
		async (value: string) => {
			try {
				await navigator.clipboard.writeText(value);
				void showSnackbar({
					message: "Đã sao chép link vào bộ nhớ tạm.",
					withDismissAction: true,
				});
			} catch {
				void showSnackbar({
					message:
						"Trình duyệt không cho phép sao chép tự động. Hãy chọn link và sao chép thủ công.",
					withDismissAction: true,
				});
			}
		},
		[showSnackbar],
	);

	return {
		portals,
		setPortals,
		visiblePortals,
		filteredPortals,
		scopeFilter,
		setScopeFilter: handleScopeChange,
		selectedClassId,
		setSelectedClassId,
		classOptions,
		resetFilters,
		hasActiveFilters: scopeFilter !== "all" || Boolean(selectedClassId),
		userRole: user?.role,
		stats,
		loading,
		setLoading,
		isRefreshing,
		isCreateOpen,
		setIsCreateOpen,
		editingPortal,
		openEdit,
		closeEdit,
		closeCreate,
		title,
		setTitle,
		description,
		setDescription,
		maxSubmissions,
		setMaxSubmissions,
		scoringPolicy,
		setScoringPolicy,
		showLeaderboard,
		setShowLeaderboard,
		showDetailedFeedback,
		setShowDetailedFeedback,
		fetchPortals,
		createPortal,
		updatePortal,
		deletePortal,
		copyText,
	};
};
