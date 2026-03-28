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
    <section className="app-card relative overflow-hidden p-4 sm:p-5">
      <div className="pointer-events-none absolute -left-12 -top-12 h-28 w-28 rounded-full bg-blue-200/70 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 right-1/4 h-24 w-24 rounded-full bg-cyan-200/70 blur-3xl" />

      <div className="relative">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <BarChart3 size={20} className="text-blue-600" />
              Phân tích kết quả lớp học
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Tổng hợp theo từng lượt chấm để xác định xu hướng học tập và câu hỏi cần củng cố.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={projectEndpoint}
              onChange={(e) => setProjectEndpoint(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
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
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
            >
              <option value={5}>Top 5 câu sai nhiều</option>
              <option value={10}>Top 10 câu sai nhiều</option>
              <option value={15}>Top 15 câu sai nhiều</option>
            </select>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2 text-xs text-sky-800">
          Các chỉ số bên dưới được tính theo <strong>lượt chấm</strong> (mỗi lần nộp/chấm lại được tính là 1 lượt).
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Đang tải dữ liệu phân tích...
          </div>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div
                className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-3 shadow-sm"
                title="Trung bình % của tất cả lượt chấm trong lớp"
              >
                <div className="text-xs font-medium text-slate-500">Điểm TB theo lượt chấm</div>
                <div className="text-2xl font-bold text-blue-700">{pct(overview?.averagePercentage || 0)}</div>
                <div className="mt-1 text-[11px] text-slate-400">TB % của tất cả lượt chấm</div>
              </div>
              <div
                className="rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-3 shadow-sm"
                title="Tỷ lệ lượt chấm có điểm từ 60% trở lên"
              >
                <div className="text-xs font-medium text-slate-500">Tỷ lệ đạt (&gt;= 60%)</div>
                <div className="text-2xl font-bold text-emerald-700">{pct(overview?.passRate || 0)}</div>
                <div className="mt-1 text-[11px] text-slate-400">Số lượt đạt / tổng lượt</div>
              </div>
              <div
                className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-3 shadow-sm"
                title="Tỷ lệ lượt chấm dưới 40%"
              >
                <div className="text-xs font-medium text-slate-500">Tỷ lệ cảnh báo (&lt; 40%)</div>
                <div className="text-2xl font-bold text-amber-700">{pct(overview?.warningRate || 0)}</div>
                <div className="mt-1 text-[11px] text-slate-400">Số lượt dưới 40%</div>
              </div>
              <div
                className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-100 to-white p-3 shadow-sm"
                title="Tổng số lượt chấm đã được lưu"
              >
                <div className="text-xs font-medium text-slate-500">Tổng lượt chấm</div>
                <div className="text-2xl font-bold text-slate-800">{overview?.totalAttempts || 0}</div>
                <div className="mt-1 text-[11px] text-slate-400">Không phải số học sinh</div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="mb-3 flex items-center gap-2 font-semibold text-slate-700">
                <TriangleAlert size={16} className="text-amber-600" />
                Các câu yếu nhất
              </div>
              <div className="space-y-2.5">
                {weakTaskChartRows.length === 0 && (
                  <div className="text-sm text-slate-500">Không có dữ liệu câu yếu.</div>
                )}
                {weakTaskChartRows.map((row) => (
                  <div key={row.x}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-semibold text-slate-700">{row.x}</span>
                      <span className="text-slate-500">
                        {pct(row.y)} ({row.failed}/{row.attempts})
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-rose-100">
                      <div
                        className="h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-500"
                        style={{ width: barWidth(row.y) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {gaugeData.length > 0 && (
              <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Chỉ số quy đổi (theo lượt chấm): {gaugeData.map((g) => `${g.label}: ${pct(g.value)}`).join(' | ')}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default ClassAnalyticsPanel;
