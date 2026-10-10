import type { SelectOption } from "@bug-on/m3-expressive";
import { useSnackbar } from "@bug-on/m3-expressive";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { showConfirm } from "../../../components/common";
import { useAuth } from "../../../context/AuthContext";
import { queryKeys } from "../../../lib/queryKeys";
import { classService } from "../../../services/class.service";
import { submissionPortalService } from "../../../services/submission-portal.service";
import type { SubmissionPortal } from "../../../types/submission-portal.types";
import type { ScoringPolicy } from "../utils/portalFormatters";

const DEFAULT_PORTAL_TITLE = "Link nộp bài thực hành";
const DEFAULT_SCORING_POLICY: ScoringPolicy = "BestScore";

export const usePortalManagement = () => {
	const { user, getAccessToken } = useAuth();
	const { showSnackbar } = useSnackbar();
	const queryClient = useQueryClient();
	const userId = user?.userId ?? "anonymous";
	const portalListKey = queryKeys.submissionPortals.list(userId);
	const portalsQuery = useQuery({
		queryKey: portalListKey,
		queryFn: ({ signal }) =>
			submissionPortalService.getAll(getAccessToken, signal),
		enabled: Boolean(user?.userId),
		retry: false,
	});
	const teacherClassesQuery = useQuery({
		queryKey: queryKeys.submissionPortals.teacherClasses(userId),
		queryFn: async () => {
			const classes = await classService.getAllClasses(getAccessToken, true);
			return classes.filter((cls) => cls.isActive !== false);
		},
		enabled: Boolean(user?.userId),
	});
	const portals = portalsQuery.data ?? [];
	const teacherClasses = teacherClassesQuery.data ?? [];
	const [loading, setLoading] = useState(false);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingPortal, setEditingPortal] = useState<SubmissionPortal | null>(
		null,
	);
	const [scopeFilter, setScopeFilter] = useState<"all" | "teacher">("all");
	const [selectedClassId, setSelectedClassId] = useState("");
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearchActive, setIsSearchActive] = useState(false);
	const [title, setTitle] = useState(DEFAULT_PORTAL_TITLE);
	const [description, setDescription] = useState("");
	const [maxSubmissions, setMaxSubmissions] = useState(0);
	const [scoringPolicy, setScoringPolicy] = useState<ScoringPolicy>(
		DEFAULT_SCORING_POLICY,
	);
	const [showLeaderboard, setShowLeaderboard] = useState(true);
	const [showDetailedFeedback, setShowDetailedFeedback] = useState(true);

	const notify = useCallback(
		(message: string) => {
			void showSnackbar({ message, withDismissAction: true });
		},
		[showSnackbar],
	);
	const notifyError = useCallback(
		(error: unknown, fallback: string) =>
			notify(error instanceof Error ? error.message : fallback),
		[notify],
	);
	const refreshPortalsInBackground = useCallback(() => {
		void queryClient.invalidateQueries({ queryKey: portalListKey });
	}, [portalListKey, queryClient]);
	const retryPortals = useCallback(() => {
		void portalsQuery.refetch();
	}, [portalsQuery.refetch]);

	const visiblePortals = useMemo(
		() => portals.filter((portal) => portal.isActive),
		[portals],
	);
	const teacherClassIdSet = useMemo(() => {
		const set = new Set<string>();
		for (const cls of teacherClasses) {
			if (
				!user?.userId ||
				cls.ownerId === user.userId ||
				cls.managerTeacherIds?.includes(user.userId)
			)
				set.add(cls.id);
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
			if (portal.classes?.length) {
				for (const cls of portal.classes) classMap.set(cls.id, cls.name);
			} else {
				for (const classId of portal.classIds) {
					const found = teacherClasses.find((cls) => cls.id === classId);
					if (found) classMap.set(found.id, found.name);
				}
			}
		}
		return [
			{ value: "", label: "Tất cả các lớp" },
			...Array.from(classMap.entries())
				.sort((a, b) => a[1].localeCompare(b[1], "vi"))
				.map(([id, name]) => ({ value: id, label: name })),
		];
	}, [scopeFilter, visiblePortals, isTeacherPortal, teacherClasses]);
	const handleScopeChange = useCallback((newScope: "all" | "teacher") => {
		setScopeFilter(newScope);
		setSelectedClassId("");
	}, []);
	const openSearch = useCallback(() => setIsSearchActive(true), []);
	const closeSearch = useCallback(() => {
		setIsSearchActive(false);
		setSearchQuery("");
	}, []);
	const resetFilters = useCallback(() => {
		setScopeFilter("all");
		setSelectedClassId("");
		setSearchQuery("");
	}, []);
	const filteredPortals = useMemo(() => {
		let list = visiblePortals;
		if (scopeFilter === "teacher") list = list.filter(isTeacherPortal);
		if (selectedClassId)
			list = list.filter((portal) => portal.classIds.includes(selectedClassId));
		if (searchQuery.trim()) {
			const query = searchQuery.trim().toLowerCase();
			list = list.filter(
				(portal) =>
					portal.title.toLowerCase().includes(query) ||
					portal.description?.toLowerCase().includes(query) ||
					portal.publicToken.toLowerCase().includes(query) ||
					portal.classes?.some((cls) => cls.name.toLowerCase().includes(query)),
			);
		}
		return list;
	}, [
		visiblePortals,
		scopeFilter,
		isTeacherPortal,
		selectedClassId,
		searchQuery,
	]);
	const stats = useMemo(
		() => ({
			active: filteredPortals.length,
			totalAlerts: filteredPortals.reduce(
				(total, portal) => total + (portal.unreadAlertCount || 0),
				0,
			),
			scopedAssignments: filteredPortals.reduce(
				(total, portal) => total + portal.assignmentIds.length,
				0,
			),
		}),
		[filteredPortals],
	);
	const resetForm = useCallback(() => {
		setTitle(DEFAULT_PORTAL_TITLE);
		setDescription("");
		setMaxSubmissions(0);
		setScoringPolicy(DEFAULT_SCORING_POLICY);
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
				notify(
					"Vui lòng nhập tiêu đề, chọn trường, ít nhất một lớp và một bài tập.",
				);
				return false;
			}
			setLoading(true);
			try {
				const created = await submissionPortalService.create(
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
				queryClient.setQueryData<SubmissionPortal[]>(
					portalListKey,
					(old = []) => [created, ...old],
				);
				closeCreate();
				notify("Đã tạo link nộp bài thành công.");
				refreshPortalsInBackground();
				return true;
			} catch (error) {
				notifyError(error, "Không thể tạo link");
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
			queryClient,
			portalListKey,
			closeCreate,
			notify,
			notifyError,
			refreshPortalsInBackground,
		],
	);

	const updatePortal = useCallback(
		async (isActive: boolean) => {
			if (!editingPortal) return false;
			if (!title.trim()) {
				notify("Vui lòng nhập tiêu đề link nộp bài.");
				return false;
			}
			setLoading(true);
			try {
				const updated = await submissionPortalService.update(
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
				queryClient.setQueryData<SubmissionPortal[]>(
					portalListKey,
					(old = []) =>
						old.map((portal) => (portal.id === updated.id ? updated : portal)),
				);
				closeEdit();
				notify("Đã cập nhật link nộp bài.");
				refreshPortalsInBackground();
				return true;
			} catch (error) {
				notifyError(error, "Không thể cập nhật link");
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
			queryClient,
			portalListKey,
			closeEdit,
			notify,
			notifyError,
			refreshPortalsInBackground,
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
				queryClient.setQueryData<SubmissionPortal[]>(
					portalListKey,
					(old = []) =>
						old.map((current) =>
							current.id === portal.id
								? { ...current, isActive: false }
								: current,
						),
				);
				queryClient.removeQueries({
					queryKey: queryKeys.submissionPortals.alerts(userId, portal.id),
				});
				queryClient.removeQueries({
					queryKey: queryKeys.submissionPortals.logs(userId, portal.id),
				});
				notify("Đã đóng link nộp bài.");
				refreshPortalsInBackground();
				if (editingPortal?.id === portal.id) closeEdit();
				onDeleted?.(portal.id);
			} catch (error) {
				notifyError(error, "Không thể đóng link");
			} finally {
				setLoading(false);
			}
		},
		[
			getAccessToken,
			queryClient,
			portalListKey,
			userId,
			notify,
			notifyError,
			refreshPortalsInBackground,
			editingPortal?.id,
			closeEdit,
		],
	);
	const copyText = useCallback(
		async (value: string) => {
			try {
				await navigator.clipboard.writeText(value);
				notify("Đã sao chép link vào bộ nhớ tạm.");
			} catch {
				notify(
					"Trình duyệt không cho phép sao chép tự động. Hãy chọn link và sao chép thủ công.",
				);
			}
		},
		[notify],
	);

	return {
		visiblePortals,
		filteredPortals,
		scopeFilter,
		setScopeFilter: handleScopeChange,
		selectedClassId,
		setSelectedClassId,
		classOptions,
		searchQuery,
		setSearchQuery,
		isSearchActive,
		setIsSearchActive,
		openSearch,
		closeSearch,
		resetFilters,
		hasActiveFilters:
			scopeFilter !== "all" ||
			Boolean(selectedClassId) ||
			Boolean(searchQuery.trim()),
		stats,
		loading,
		isInitialLoading: portalsQuery.isLoading && !portalsQuery.data,
		isInitialLoadError: portalsQuery.isError && !portalsQuery.data,
		portalListError: portalsQuery.error,
		isBackgroundRefreshError:
			portalsQuery.isError && Boolean(portalsQuery.data),
		retryPortals,
		isRefreshing: portalsQuery.isFetching && Boolean(portalsQuery.data),
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
		createPortal,
		updatePortal,
		deletePortal,
		copyText,
	};
};
