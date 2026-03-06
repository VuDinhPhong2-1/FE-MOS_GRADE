import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart3, TrendingUp, TriangleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analytics.service';
import type { Assignment } from '../types/assignment.types';
import type {
  ClassAnalyticsOverviewResponse,
  ProjectPerformanceResponse,
  WeakTaskResponse,
} from '../types/analytics.types';
import {
  mapOverviewToGaugeData,
  mapProjectPerformanceToCombo,
  mapWeakTasksToBarChart,
} from '../utils/analyticsMappers';

interface ClassAnalyticsPanelProps {
  classId: string;
  assignments: Assignment[];
}

const pct = (v: number) => `${Number.isFinite(v) ? v.toFixed(2) : '0.00'}%`;
const barWidth = (v: number) => `${Math.max(0, Math.min(100, v))}%`;

const ClassAnalyticsPanel = ({ classId, assignments }: ClassAnalyticsPanelProps) => {
  const { getAccessToken } = useAuth();

  const [overview, setOverview] = useState<ClassAnalyticsOverviewResponse | null>(null);
  const [weakTasks, setWeakTasks] = useState<WeakTaskResponse[]>([]);
  const [projectPerformance, setProjectPerformance] = useState<ProjectPerformanceResponse[]>([]);
  const [projectEndpoint, setProjectEndpoint] = useState<string>('');
  const [top, setTop] = useState<number>(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const endpointOptions = useMemo(() => {
    const values = assignments
      .map((a) => (a.gradingApiEndpoint || '').replace(/^\/?grading\/?/i, '').trim())
      .filter((x) => !!x);
    return Array.from(new Set(values));
  }, [assignments]);

  useEffect(() => {
    if (!classId) return;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [overviewData, weakTaskData, projectData] = await Promise.all([
          analyticsService.getClassOverview(classId, getAccessToken),
          analyticsService.getWeakTasks(classId, getAccessToken, projectEndpoint || undefined, top),
          analyticsService.getProjectPerformance(classId, getAccessToken),
        ]);

        setOverview(overviewData);
        setWeakTasks(weakTaskData);
        setProjectPerformance(projectData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải phân tích lớp học');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [classId, getAccessToken, projectEndpoint, top]);

  const gaugeData = useMemo(() => (overview ? mapOverviewToGaugeData(overview) : []), [overview]);
  const weakTaskChartRows = useMemo(() => mapWeakTasksToBarChart(weakTasks), [weakTasks]);
  const projectComboRows = useMemo(
    () => mapProjectPerformanceToCombo(projectPerformance),
    [projectPerformance]
  );

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 border border-gray-200">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 size={20} className="text-blue-600" />
          Phân tích kết quả lớp học
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={projectEndpoint}
            onChange={(e) => setProjectEndpoint(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Tất cả dự án</option>
            {endpointOptions.map((ep) => (
              <option key={ep} value={ep}>
                {ep}
              </option>
            ))}
          </select>
          <select
            value={top}
            onChange={(e) => setTop(Number(e.target.value))}
            className="px-3 py-2 border rounded-md text-sm"
          >
            <option value={5}>Top 5 câu sai nhiều</option>
            <option value={10}>Top 10 câu sai nhiều</option>
            <option value={15}>Top 15 câu sai nhiều</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500 py-6">Đang tải dữ liệu phân tích...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5">
            <div className="rounded-md border p-3">
              <div className="text-xs text-gray-500">Trung bình phần trăm</div>
              <div className="text-xl font-bold text-blue-700">{pct(overview?.averagePercentage || 0)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-gray-500">Tỷ lệ hoàn thành</div>
              <div className="text-xl font-bold text-green-700">{pct(overview?.passRate || 0)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-gray-500">Tỷ lệ cảnh báo</div>
              <div className="text-xl font-bold text-amber-700">{pct(overview?.warningRate || 0)}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-gray-500">Tổng lượt làm</div>
              <div className="text-xl font-bold text-gray-800">{overview?.totalAttempts || 0}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="border rounded-md p-3">
              <div className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TriangleAlert size={16} className="text-amber-600" />
                Các câu yếu nhất
              </div>
              <div className="space-y-2">
                {weakTaskChartRows.length === 0 && (
                  <div className="text-sm text-gray-500">Không có dữ liệu câu yếu.</div>
                )}
                {weakTaskChartRows.map((row) => (
                  <div key={row.x}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium">{row.x}</span>
                      <span className="text-gray-500">
                        {pct(row.y)} ({row.failed}/{row.attempts})
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded">
                      <div className="h-2 bg-rose-500 rounded" style={{ width: barWidth(row.y) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-md p-3">
              <div className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp size={16} className="text-blue-600" />
                Hiệu suất theo dự án
              </div>
              <div className="space-y-2">
                {projectComboRows.length === 0 && (
                  <div className="text-sm text-gray-500">Không có dữ liệu hiệu suất dự án.</div>
                )}
                {projectComboRows.map((row) => (
                  <div key={row.x} className="border rounded p-2">
                    <div className="text-sm font-medium">{row.x}</div>
                    <div className="text-xs text-gray-500 mb-1">Số lượt làm: {row.attempts}</div>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-600">Trung bình: {pct(row.avgLine)}</div>
                      <div className="h-2 bg-gray-100 rounded">
                        <div className="h-2 bg-blue-500 rounded" style={{ width: barWidth(row.avgLine) }} />
                      </div>
                      <div className="text-xs text-gray-600">Tỷ lệ đạt: {pct(row.passBar)}</div>
                      <div className="h-2 bg-gray-100 rounded">
                        <div className="h-2 bg-green-500 rounded" style={{ width: barWidth(row.passBar) }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {gaugeData.length > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              Quy đổi chỉ số: {gaugeData.map((g) => `${g.label}: ${pct(g.value)}`).join(' | ')}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClassAnalyticsPanel;
