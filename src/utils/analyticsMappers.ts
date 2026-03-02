import type {
  ClassAnalyticsOverviewResponse,
  ProjectPerformanceResponse,
  WeakTaskResponse,
} from '../types/analytics.types';

export function mapOverviewToGaugeData(d: ClassAnalyticsOverviewResponse) {
  return [
    { label: 'Average', value: d.averagePercentage },
    { label: 'Pass Rate', value: d.passRate },
    { label: 'Warning Rate', value: d.warningRate },
  ];
}

export function mapWeakTasksToBarChart(rows: WeakTaskResponse[]) {
  return rows.map((r) => ({
    x: r.taskId,
    y: r.failedRate,
    label: r.taskName,
    attempts: r.attemptCount,
    failed: r.failedCount,
  }));
}

export function mapProjectPerformanceToCombo(rows: ProjectPerformanceResponse[]) {
  return rows.map((r) => ({
    x: r.projectEndpoint,
    avgLine: r.averagePercentage,
    passBar: r.passRate,
    attempts: r.attemptCount,
  }));
}
