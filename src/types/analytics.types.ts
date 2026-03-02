export interface ClassAnalyticsOverviewResponse {
  classId: string;
  totalAttempts: number;
  totalStudents: number;
  averagePercentage: number;
  passRate: number;
  warningRate: number;
}

export interface WeakTaskResponse {
  taskId: string;
  taskName: string;
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
