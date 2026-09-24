import { useSnackbar } from "@bug-on/m3-expressive";
import { useCallback, useMemo, useRef, useState } from "react";
import { showConfirm } from "../../../components/common";
import { useAuth } from "../../../context/AuthContext";
import { submissionPortalService } from "../../../services/submission-portal.service";
import type { SubmissionPortal } from "../../../types/submission-portal.types";
import type { ScoringPolicy } from "../utils/portalFormatters";

export const usePortalManagement = () => {
	const { getAccessToken } = useAuth();
	const { showSnackbar } = useSnackbar();

	const hasLoadedOnceRef = useRef(false);
	const [portals, setPortals] = useState<SubmissionPortal[]>([]);
	const [loading, setLoading] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const [editingPortal, setEditingPortal] = useState<SubmissionPortal | null>(
		null,
	);

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

	const stats = useMemo(
		() => ({
			active: visiblePortals.length,
			totalAlerts: visiblePortals.reduce(
				(s, p) => s + (p.unreadAlertCount || 0),
				0,
			),
			scopedAssignments: visiblePortals.reduce(
				(s, p) => s + p.assignmentIds.length,
				0,
			),
		}),
		[visiblePortals],
	);

	const fetchPortals = useCallback(async () => {
		if (!hasLoadedOnceRef.current) {
			setLoading(true);
		} else {
			setIsRefreshing(true);
		}

		try {
			const portalList = await submissionPortalService.getAll(getAccessToken);
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
	}, [getAccessToken, showSnackbar]);

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
