import { useSnackbar } from "@bug-on/m3-expressive";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { queryKeys } from "../../../lib/queryKeys";
import { submissionPortalService } from "../../../services/submission-portal.service";
import type {
	SubmissionAlert,
	SubmissionPortal,
} from "../../../types/submission-portal.types";

const LOG_PAGE_SIZE = 100;

const groupAlerts = (rawAlerts: SubmissionAlert[]): SubmissionAlert[] => {
	const groups: SubmissionAlert[] = [];
	const map = new Map<string, SubmissionAlert>();
	for (const alert of rawAlerts) {
		const key = `${alert.alertType}:${[...alert.involvedStudentIds].sort().join(",")}`;
		const existing = map.get(key);
		if (!existing) {
			const clone = {
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
			continue;
		}
		existing.occurrences =
			(existing.occurrences ?? 1) + (alert.occurrences ?? 1);
		if (
			new Date(alert.latestAt || alert.createdAt).getTime() >
			new Date(existing.latestAt || existing.createdAt).getTime()
		) {
			existing.latestAt = alert.latestAt || alert.createdAt;
			existing.message = alert.message;
			if (alert.involvedStudents?.length)
				existing.involvedStudents = alert.involvedStudents;
		}
		for (const logId of alert.involvedSubmissionLogIds) {
			if (!existing.involvedSubmissionLogIds.includes(logId))
				existing.involvedSubmissionLogIds.push(logId);
		}
	}
	return groups;
};

export const usePortalDetails = () => {
	const { user, getAccessToken } = useAuth();
	const { showSnackbar } = useSnackbar();
	const [selectedPortal, setSelectedPortal] = useState<SubmissionPortal | null>(
		null,
	);
	const userId = user?.userId ?? "anonymous";
	const portalId = selectedPortal?.id ?? "";
	const alertsQuery = useQuery({
		queryKey: queryKeys.submissionPortals.alerts(userId, portalId),
		queryFn: () => submissionPortalService.getAlerts(portalId, getAccessToken),
		enabled: Boolean(portalId),
		staleTime: 60_000,
	});
	const logsQuery = useInfiniteQuery({
		queryKey: queryKeys.submissionPortals.logs(userId, portalId),
		queryFn: ({ pageParam }) =>
			submissionPortalService.getLogsPage(
				portalId,
				pageParam,
				LOG_PAGE_SIZE,
				getAccessToken,
			),
		initialPageParam: 1,
		getNextPageParam: (lastPage) =>
			lastPage.hasNextPage ? lastPage.page + 1 : undefined,
		enabled: Boolean(portalId),
		staleTime: 60_000,
	});
	const alerts = useMemo(
		() => groupAlerts(alertsQuery.data ?? []),
		[alertsQuery.data],
	);
	const logs = useMemo(
		() => logsQuery.data?.pages.flatMap((page) => page.items) ?? [],
		[logsQuery.data],
	);
	const totalLogs = logsQuery.data?.pages[0]?.totalCount ?? 0;
	const notifyError = useCallback(
		(error: unknown, fallback: string) => {
			void showSnackbar({
				message: error instanceof Error ? error.message : fallback,
				withDismissAction: true,
			});
		},
		[showSnackbar],
	);
	const openDetails = useCallback(
		(portal: SubmissionPortal) => setSelectedPortal(portal),
		[],
	);
	const closeDetails = useCallback(() => setSelectedPortal(null), []);
	const loadMoreLogs = useCallback(async () => {
		try {
			await logsQuery.fetchNextPage();
		} catch (error) {
			notifyError(error, "Không thể tải thêm lịch sử nộp");
		}
	}, [logsQuery, notifyError]);
	const exportLogsCsv = useCallback(async () => {
		if (!selectedPortal) return;
		try {
			const blob = await submissionPortalService.exportLogsCsv(
				selectedPortal.id,
				getAccessToken,
			);
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = `submission-logs-${selectedPortal.publicToken}.csv`;
			anchor.click();
			URL.revokeObjectURL(url);
			void showSnackbar({
				message: "Đã xuất file CSV thành công.",
				withDismissAction: true,
			});
		} catch (error) {
			notifyError(error, "Không thể xuất lịch sử nộp");
		}
	}, [selectedPortal, getAccessToken, notifyError, showSnackbar]);

	return {
		selectedPortal,
		alerts,
		logs,
		totalLogs,
		loadingDetails: alertsQuery.isLoading || logsQuery.isLoading,
		hasNextLogsPage: logsQuery.hasNextPage,
		loadingMoreLogs: logsQuery.isFetchingNextPage,
		openDetails,
		closeDetails,
		loadMoreLogs,
		exportLogsCsv,
	};
};
