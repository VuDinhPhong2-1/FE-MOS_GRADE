import { useSnackbar } from "@bug-on/m3-expressive";
import { useCallback, useRef, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { submissionPortalService } from "../../../services/submission-portal.service";
import type {
	SubmissionAlert,
	SubmissionLog,
	SubmissionPortal,
} from "../../../types/submission-portal.types";
import { formatDateTime } from "../utils/portalFormatters";

export const usePortalDetails = () => {
	const { getAccessToken } = useAuth();
	const { showSnackbar } = useSnackbar();

	const cacheRef = useRef<
		Map<string, { alerts: SubmissionAlert[]; logs: SubmissionLog[] }>
	>(new Map());

	const [selectedPortal, setSelectedPortal] = useState<SubmissionPortal | null>(
		null,
	);
	const [alerts, setAlerts] = useState<SubmissionAlert[]>([]);
	const [logs, setLogs] = useState<SubmissionLog[]>([]);
	const [loadingDetails, setLoadingDetails] = useState(false);

	const openDetails = useCallback(
		async (portal: SubmissionPortal) => {
			setSelectedPortal(portal);

			const cached = cacheRef.current.get(portal.id);
			if (cached) {
				setAlerts(cached.alerts);
				setLogs(cached.logs);
				setLoadingDetails(false);
			} else {
				setLoadingDetails(true);
			}

			try {
				const [portalAlerts, portalLogs] = await Promise.all([
					submissionPortalService.getAlerts(portal.id, getAccessToken),
					submissionPortalService.getLogs(portal.id, getAccessToken),
				]);
				cacheRef.current.set(portal.id, {
					alerts: portalAlerts,
					logs: portalLogs,
				});
				setAlerts(portalAlerts);
				setLogs(portalLogs);
			} catch (error) {
				if (!cached) {
					void showSnackbar({
						message:
							error instanceof Error
								? error.message
								: "Không thể mở chi tiết cổng nộp bài",
						withDismissAction: true,
					});
				}
			} finally {
				setLoadingDetails(false);
			}
		},
		[getAccessToken, showSnackbar],
	);

	const closeDetails = useCallback(() => {
		setSelectedPortal(null);
		setAlerts([]);
		setLogs([]);
		// Cache remains in cacheRef for instant re-opening
	}, []);

	const exportLogsCsv = useCallback(() => {
		if (logs.length === 0) return;

		const header = [
			"Học sinh",
			"Lớp",
			"Bài tập",
			"Điểm",
			"IP",
			"Tệp",
			"Thời gian nộp",
		];
		const rows = logs.map((log) => [
			log.studentName,
			log.className,
			log.assignmentName,
			`${log.scoreValue ?? ""}/${log.maxScore}`,
			log.ipAddress || "",
			log.fileName || "",
			formatDateTime(log.submittedAt),
		]);
		const csv = [header, ...rows]
			.map((row) =>
				row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
			)
			.join("\n");
		const url = URL.createObjectURL(
			new Blob([csv], { type: "text/csv;charset=utf-8" }),
		);
		const a = document.createElement("a");
		a.href = url;
		a.download = `submission-logs-${selectedPortal?.publicToken || "portal"}.csv`;
		a.click();
		URL.revokeObjectURL(url);

		void showSnackbar({
			message: "Đã xuất file CSV thành công.",
			withDismissAction: true,
		});
	}, [logs, selectedPortal?.publicToken, showSnackbar]);

	return {
		selectedPortal,
		setSelectedPortal,
		alerts,
		logs,
		loadingDetails,
		openDetails,
		closeDetails,
		exportLogsCsv,
	};
};
