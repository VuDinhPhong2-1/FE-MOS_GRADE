export interface ClassAnalyticsOverviewResponse {
	classId: string;
	totalAttempts: number;
	totalStudents: number;
	averagePercentage: number;
	passRate: number;
	warningRate: number;
}

export interface WeakTaskResponse {
    assignmentId?: string | null;
	taskId: string;
	taskName: string;
	projectEndpoint?: string;
	projectId?: string;
	attemptCount: number;
	failedCount: number;
	failedRate: number;
}

export interface ProjectPerformanceResponse {
	projectEndpoint: string;
	attemptCount: number;
	averagePercentage: number;
	passRate: number;
}
