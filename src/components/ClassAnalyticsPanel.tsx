import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart3, TriangleAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { analyticsService } from '../services/analytics.service';
import type { Assignment } from '../types/assignment.types';
import type { ClassAnalyticsOverviewResponse, WeakTaskResponse } from '../types/analytics.types';
import { mapOverviewToGaugeData, mapWeakTasksToBarChart } from '../utils/analyticsMappers';

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
        const [overviewData, weakTaskData] = await Promise.all([
          analyticsService.getClassOverview(classId, getAccessToken),
          analyticsService.getWeakTasks(classId, getAccessToken, projectEndpoint || undefined, top),
        ]);

        setOverview(overviewData);
        setWeakTasks(weakTaskData);
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

  return (
    <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
          <BarChart3 size={20} className="text-blue-600" />
          Phân tích kết quả lớp học
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={projectEndpoint}
            onChange={(e) => setProjectEndpoint(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
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
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value={5}>Top 5 câu sai nhiều</option>
            <option value={10}>Top 10 câu sai nhiều</option>
            <option value={15}>Top 15 câu sai nhiều</option>
          </select>
        </div>
      </div>

      <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">
        Các chỉ số bên dưới được tính theo <strong>lượt chấm</strong> (mỗi lần nộp/chấm lại được tính là 1 lượt).
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-6 text-sm text-gray-500">Đang tải dữ liệu phân tích...</div>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-md border p-3" title="Trung bình % của tất cả lượt chấm trong lớp">
              <div className="text-xs text-gray-500">Điểm TB theo lượt chấm</div>
              <div className="text-xl font-bold text-blue-700">{pct(overview?.averagePercentage || 0)}</div>
              <div className="mt-1 text-[11px] text-gray-400">TB % của tất cả lượt chấm</div>
            </div>
            <div className="rounded-md border p-3" title="Tỷ lệ lượt chấm có điểm từ 60% trở lên">
              <div className="text-xs text-gray-500">Tỷ lệ đạt (&gt;= 60%)</div>
              <div className="text-xl font-bold text-green-700">{pct(overview?.passRate || 0)}</div>
              <div className="mt-1 text-[11px] text-gray-400">Số lượt đạt / tổng lượt</div>
            </div>
            <div className="rounded-md border p-3" title="Tỷ lệ lượt chấm dưới 40%">
              <div className="text-xs text-gray-500">Tỷ lệ cảnh báo (&lt; 40%)</div>
              <div className="text-xl font-bold text-amber-700">{pct(overview?.warningRate || 0)}</div>
              <div className="mt-1 text-[11px] text-gray-400">Số lượt dưới 40%</div>
            </div>
            <div className="rounded-md border p-3" title="Tổng số lượt chấm đã được lưu">
              <div className="text-xs text-gray-500">Tổng lượt chấm</div>
              <div className="text-xl font-bold text-gray-800">{overview?.totalAttempts || 0}</div>
              <div className="mt-1 text-[11px] text-gray-400">Không phải số học sinh</div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-md border p-3">
              <div className="mb-3 flex items-center gap-2 font-semibold text-gray-700">
                <TriangleAlert size={16} className="text-amber-600" />
                Các câu yếu nhất
              </div>
              <div className="space-y-2">
                {weakTaskChartRows.length === 0 && (
                  <div className="text-sm text-gray-500">Không có dữ liệu câu yếu.</div>
                )}
                {weakTaskChartRows.map((row) => (
                  <div key={row.x}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium">{row.x}</span>
                      <span className="text-gray-500">
                        {pct(row.y)} ({row.failed}/{row.attempts})
                      </span>
                    </div>
                    <div className="h-2 rounded bg-gray-100">
                      <div className="h-2 rounded bg-rose-500" style={{ width: barWidth(row.y) }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {gaugeData.length > 0 && (
            <div className="mt-4 text-xs text-gray-500">
              Chỉ số quy đổi (theo lượt chấm): {gaugeData.map((g) => `${g.label}: ${pct(g.value)}`).join(' | ')}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ClassAnalyticsPanel;
