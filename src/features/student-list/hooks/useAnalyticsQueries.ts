import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { queryKeys } from "../../../lib/queryKeys";
import { analyticsService } from "../../../services/analytics.service";
import type {
	ClassAnalyticsOverviewResponse,
	WeakTaskResponse,
} from "../../../types/analytics.types";

interface UseAnalyticsQueriesOptions {
	classId: string;
	projectEndpoint?: string;
	top?: number;
	getAccessToken: (forceRefresh?: boolean) => Promise<string | null>;
}

export const useAnalyticsQueries = ({
	classId,
	projectEndpoint,
	top = 10,
	getAccessToken,
}: UseAnalyticsQueriesOptions) => {
	const queryClient = useQueryClient();
	const getAccessTokenRef = useRef(getAccessToken);

	useEffect(() => {
		getAccessTokenRef.current = getAccessToken;
	});

	// Query: Class Overview (không phụ thuộc vào projectEndpoint hay top)
	const overviewQuery = useQuery({
		queryKey: queryKeys.analytics.classOverview(classId),
		queryFn: async (): Promise<ClassAnalyticsOverviewResponse> => {
			return analyticsService.getClassOverview(
				classId,
				getAccessTokenRef.current,
			);
		},
		enabled: Boolean(classId),
		staleTime: 60 * 1000, // 1 phút cache
		gcTime: 5 * 60 * 1000,
	});

	// Query: Weak Tasks (phụ thuộc vào filter projectEndpoint và top)
	const weakTasksQuery = useQuery({
		queryKey: queryKeys.analytics.weakTasks(classId, projectEndpoint, top),
		queryFn: async (): Promise<WeakTaskResponse[]> => {
			return analyticsService.getWeakTasks(
				classId,
				getAccessTokenRef.current,
				projectEndpoint || undefined,
				top,
			);
		},
		enabled: Boolean(classId),
		staleTime: 60 * 1000, // 1 phút cache
		gcTime: 5 * 60 * 1000,
	});

	const invalidateAnalytics = () => {
		void queryClient.invalidateQueries({
			queryKey: queryKeys.analytics.all,
		});
	};

	return {
		overview: overviewQuery.data ?? null,
		isOverviewLoading: overviewQuery.isLoading,
		isOverviewFetching: overviewQuery.isFetching,
		overviewError: overviewQuery.error
			? (overviewQuery.error as Error).message || "Không thể tải tổng quan lớp"
			: null,

		weakTasks: weakTasksQuery.data ?? [],
		isWeakTasksLoading: weakTasksQuery.isLoading,
		isWeakTasksFetching: weakTasksQuery.isFetching,
		weakTasksError: weakTasksQuery.error
			? (weakTasksQuery.error as Error).message ||
				"Không thể tải danh sách câu yếu"
			: null,

		refetchOverview: overviewQuery.refetch,
		refetchWeakTasks: weakTasksQuery.refetch,
		invalidateAnalytics,
	};
};
