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

const groupAlerts = (rawAlerts: SubmissionAlert[]): SubmissionAlert[] => {
	const groups: SubmissionAlert[] = [];
	const map = new Map<string, SubmissionAlert>();

	for (const alert of rawAlerts) {
		const sortedStudentIds = [...alert.involvedStudentIds].sort().join(",");
		const key = `${alert.alertType}:${sortedStudentIds}`;

		const existing = map.get(key);
		if (!existing) {
			const clone: SubmissionAlert = {
				...alert,
				occurrences: alert.occurrences ?? 1,
				latestAt: alert.latestAt || alert.createdAt,
				involvedSubmissionLogIds: [...alert.involvedSubmissionLogIds],
				involvedStudents: alert.involvedStudents
					? [...alert.involvedStudents]
					: undefined,
			};
			map.set(key, clone);
			groups.push(clone);
		} else {
			existing.occurrences =
				(existing.occurrences ?? 1) + (alert.occurrences ?? 1);
			const alertTime = new Date(alert.latestAt || alert.createdAt).getTime();
			const existingTime = new Date(
				existing.latestAt || existing.createdAt,
			).getTime();
			if (alertTime > existingTime) {
				existing.latestAt = alert.latestAt || alert.createdAt;
				existing.message = alert.message;
				if (alert.involvedStudents && alert.involvedStudents.length > 0) {
					existing.involvedStudents = alert.involvedStudents;
				}
			}
			for (const logId of alert.involvedSubmissionLogIds) {
				if (!existing.involvedSubmissionLogIds.includes(logId)) {
					existing.involvedSubmissionLogIds.push(logId);
				}
			}
		}
	}

	return groups;
};

export const usePortalDetails = () => {
	const { getAccessToken } = useAuth();
	const { showSnackbar } = useSnackbar();

	const cacheRef = useRef<
		Map<string, { alerts: SubmissionAlert[]; logs: SubmissionLog[] }>
	>(new Map());

	const notify = useCallback(
		(message: string) => {
			void showSnackbar({ message, withDismissAction: true });
		},
		[showSnackbar],
	);

	const notifyError = useCallback(
		(error: unknown, fallback: string) => {
			notify(error instanceof Error ? error.message : fallback);
		},
		[notify],
	);

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
				const grouped = groupAlerts(portalAlerts);
				cacheRef.current.set(portal.id, {
					alerts: grouped,
					logs: portalLogs,
				});
				setAlerts(grouped);
				setLogs(portalLogs);
			} catch (error) {
				if (!cached) {
					notifyError(error, "Không thể mở chi tiết cổng nộp bài");
				}
			} finally {
				setLoadingDetails(false);
			}
		},
		[getAccessToken, notifyError],
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

		notify("Đã xuất file CSV thành công.");
	}, [logs, selectedPortal?.publicToken, notify]);

	return {
		selectedPortal,
		alerts,
		logs,
		loadingDetails,
		openDetails,
		closeDetails,
		exportLogsCsv,
	};
};
