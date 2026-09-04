import { useEffect, useMemo, useState } from 'react';
import { Icon, ProgressIndicator } from '@bug-on/m3-expressive';
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
    <section className="relative overflow-hidden rounded-4xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 sm:p-6 shadow-sm">
      <div className="pointer-events-none absolute -left-12 -top-12 h-28 w-28 rounded-full bg-m3-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 right-1/4 h-24 w-24 rounded-full bg-m3-tertiary/10 blur-3xl" />

      <div className="relative">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-m3-on-surface">
              <Icon name="bar_chart" className="text-m3-primary text-xl" />
              Phân tích kết quả lớp học
            </h2>
            <p className="mt-1 text-sm text-m3-on-surface-variant">
              Tổng hợp theo từng lượt chấm để xác định xu hướng học tập và câu hỏi cần củng cố.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              value={projectEndpoint}
              onChange={(e) => setProjectEndpoint(e.target.value)}
              className="rounded-xl border border-m3-outline-variant bg-m3-surface-container-high px-3 py-2 text-sm text-m3-on-surface shadow-xs outline-none"
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
              className="rounded-xl border border-m3-outline-variant bg-m3-surface-container-high px-3 py-2 text-sm text-m3-on-surface shadow-xs outline-none"
            >
              <option value={5}>Top 5 câu sai nhiều</option>
              <option value={10}>Top 10 câu sai nhiều</option>
              <option value={15}>Top 15 câu sai nhiều</option>
            </select>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-m3-primary/20 bg-m3-primary-container/30 px-3.5 py-2.5 text-xs text-m3-on-primary-container">
          Các chỉ số bên dưới được tính theo <strong>lượt chấm</strong> (mỗi lần nộp/chấm lại được tính là 1 lượt).
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-m3-error/30 bg-m3-error-container/40 p-3.5 text-sm text-m3-on-error-container">
            <Icon name="error" className="text-lg text-m3-error" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-m3-outline-variant/40 bg-m3-surface-container-low px-4 py-8 text-sm text-m3-on-surface-variant">
            <ProgressIndicator variant="circular" shape="wavy" size={28} aria-label="Đang tải dữ liệu phân tích..." />
            <span>Đang tải dữ liệu phân tích...</span>
          </div>
        ) : (
          <>
            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div
                className="rounded-2xl border border-m3-outline-variant/40 bg-linear-to-br from-m3-primary-container/30 to-m3-surface-container-high p-4 shadow-xs"
                title="Trung bình % của tất cả lượt chấm trong lớp"
              >
                <div className="text-xs font-medium text-m3-on-surface-variant">Điểm TB theo lượt chấm</div>
                <div className="text-2xl font-bold text-m3-primary">{pct(overview?.averagePercentage || 0)}</div>
                <div className="mt-1 text-[11px] text-m3-on-surface-variant/70">TB % của tất cả lượt chấm</div>
              </div>
              <div
                className="rounded-2xl border border-m3-outline-variant/40 bg-linear-to-br from-emerald-500/10 to-m3-surface-container-high p-4 shadow-xs"
                title="Tỷ lệ lượt chấm có điểm từ 60% trở lên"
              >
                <div className="text-xs font-medium text-m3-on-surface-variant">Tỷ lệ đạt (&gt;= 60%)</div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{pct(overview?.passRate || 0)}</div>
                <div className="mt-1 text-[11px] text-m3-on-surface-variant/70">Số lượt đạt / tổng lượt</div>
              </div>
              <div
                className="rounded-2xl border border-m3-outline-variant/40 bg-linear-to-br from-amber-500/10 to-m3-surface-container-high p-4 shadow-xs"
                title="Tỷ lệ lượt chấm dưới 40%"
              >
                <div className="text-xs font-medium text-m3-on-surface-variant">Tỷ lệ cảnh báo (&lt; 40%)</div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pct(overview?.warningRate || 0)}</div>
                <div className="mt-1 text-[11px] text-m3-on-surface-variant/70">Số lượt dưới 40%</div>
              </div>
              <div
                className="rounded-2xl border border-m3-outline-variant/40 bg-linear-to-br from-m3-surface-container-highest to-m3-surface-container-high p-4 shadow-xs"
                title="Tổng số lượt chấm đã được lưu"
              >
                <div className="text-xs font-medium text-m3-on-surface-variant">Tổng lượt chấm</div>
                <div className="text-2xl font-bold text-m3-on-surface">{overview?.totalAttempts || 0}</div>
                <div className="mt-1 text-[11px] text-m3-on-surface-variant/70">Không phải số học sinh</div>
              </div>
            </div>

            <div className="rounded-2xl border border-m3-outline-variant/50 bg-m3-surface-container-high p-4 shadow-xs">
              <div className="mb-3 flex items-center gap-2 font-semibold text-m3-on-surface">
                <Icon name="warning" className="text-amber-500 text-lg" />
                Các câu yếu nhất (lần chấm mới nhất mỗi học sinh)
              </div>
              <div className="mb-2 text-[11px] text-m3-on-surface-variant">
                Chỉ tính lỗi từ lần chấm gần nhất của từng học sinh trong bộ lọc hiện tại.
              </div>
              <div className="space-y-2.5">
                {weakTaskChartRows.length === 0 && (
                  <div className="text-sm text-m3-on-surface-variant">Không có dữ liệu câu yếu.</div>
                )}
                {weakTaskChartRows.map((row) => (
                  <div key={row.x}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-semibold text-m3-on-surface">{row.x}</span>
                      <span className="text-m3-on-surface-variant">
                        {pct(row.y)} ({row.failed}/{row.attempts})
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-rose-100 dark:bg-rose-950/40">
                      <div
                        className="h-2.5 rounded-full bg-linear-to-r from-rose-500 to-orange-500"
                        style={{ width: barWidth(row.y) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {gaugeData.length > 0 && (
              <div className="mt-4 rounded-xl bg-m3-surface-container-low px-3.5 py-2.5 text-xs text-m3-on-surface-variant">
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
