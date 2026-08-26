import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FileCheck2,
  FileCode2,
  History,
  Loader2,
  RefreshCw,
  RotateCcw,
  Save,
  UploadCloud,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { gradingConfigService } from '../services/grading-config.service';
import type {
  GradingConfigDetail,
  GradingConfigListItem,
  GradingConfigTask,
  GradingConfigTestRun,
  GradingConfigVersion,
} from '../types/grading-config.types';
import type { GradingResult } from '../types';

type StatusFilter = '' | 'Draft' | 'Active' | 'Archived';
type SubjectFilter = '' | 'Excel' | 'Word';

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
};

const getStatusBadgeClass = (status: string) => {
  if (status === 'Active') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'Draft') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
};

const cloneTasks = (tasks: GradingConfigTask[]) =>
  tasks
    .map((task) => ({ ...task }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.taskId.localeCompare(b.taskId));

const buildUpdatePayload = (config: GradingConfigDetail | null, tasks: GradingConfigTask[]) => ({
  displayName: config?.displayName || '',
  summary: config?.summary || '',
  tasks,
});

const GradingConfigAdminPage: React.FC = () => {
  const { user, getAccessToken } = useAuth();
  const canManage = user?.role === 'Admin' || Boolean(user?.permissions?.includes('grading.configs.manage'));

  const [configs, setConfigs] = useState<GradingConfigListItem[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<GradingConfigDetail | null>(null);
  const [editableTasks, setEditableTasks] = useState<GradingConfigTask[]>([]);
  const [versions, setVersions] = useState<GradingConfigVersion[]>([]);
  const [testRuns, setTestRuns] = useState<GradingConfigTestRun[]>([]);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testResult, setTestResult] = useState<GradingResult | null>(null);

  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [importEndpoint, setImportEndpoint] = useState('/api/grading/excel/project01');
  const [importDisplayName, setImportDisplayName] = useState('');
  const [importPublish, setImportPublish] = useState(false);
  const [summary, setSummary] = useState('');

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const activeConfigCount = useMemo(
    () => configs.filter((config) => config.status === 'Active').length,
    [configs]
  );

  const loadConfigs = useCallback(async () => {
    if (!canManage) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await gradingConfigService.getAll(getAccessToken, {
        subject: subjectFilter || undefined,
        status: statusFilter || undefined,
      });
      setConfigs(data);

      if (selectedConfig && !data.some((config) => config.id === selectedConfig.id)) {
        setSelectedConfig(null);
        setEditableTasks([]);
        setVersions([]);
        setTestRuns([]);
        setTestResult(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách grading config.');
    } finally {
      setLoading(false);
    }
  }, [canManage, getAccessToken, selectedConfig, statusFilter, subjectFilter]);

  const loadConfigDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true);
      setError('');
      setMessage('');

      try {
        const [detail, versionList, testRunList] = await Promise.all([
          gradingConfigService.getById(id, getAccessToken),
          gradingConfigService.getVersions(id, getAccessToken),
          gradingConfigService.getTestRuns(id, getAccessToken),
        ]);

        setSelectedConfig(detail);
        setEditableTasks(cloneTasks(detail.tasks || []));
        setSummary(detail.summary || '');
        setVersions(versionList);
        setTestRuns(testRunList);
        setTestResult(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải chi tiết grading config.');
      } finally {
        setDetailLoading(false);
      }
    },
    [getAccessToken]
  );

  useEffect(() => {
    void loadConfigs();
  }, [loadConfigs]);

  const importFromCode = async () => {
    if (!importEndpoint.trim()) {
      setError('Vui lòng nhập grading API endpoint.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const imported = await gradingConfigService.importFromCode(
        {
          gradingApiEndpoint: importEndpoint.trim(),
          displayName: importDisplayName.trim() || undefined,
          publish: importPublish,
          summary: summary.trim() || undefined,
        },
        getAccessToken
      );

      setMessage('Đã import grading config từ code.');
      await loadConfigs();
      await loadConfigDetail(imported.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể import grading config.');
    } finally {
      setSaving(false);
    }
  };

  const updateTask = (taskId: string, patch: Partial<GradingConfigTask>) => {
    setEditableTasks((prev) =>
      prev.map((task) => (task.taskId === taskId ? { ...task, ...patch } : task))
    );
  };

  const saveDraft = async () => {
    if (!selectedConfig) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const updated = await gradingConfigService.update(
        selectedConfig.id,
        buildUpdatePayload({ ...selectedConfig, summary }, editableTasks),
        getAccessToken
      );

      setSelectedConfig(updated);
      setEditableTasks(cloneTasks(updated.tasks || []));
      setSummary(updated.summary || '');
      setMessage('Đã lưu grading config draft.');
      await loadConfigs();
      setVersions(await gradingConfigService.getVersions(updated.id, getAccessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu grading config.');
    } finally {
      setSaving(false);
    }
  };

  const publishConfig = async () => {
    if (!selectedConfig) return;
    const confirmed = window.confirm('Publish config này làm bản active cho endpoint/project tương ứng?');
    if (!confirmed) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const published = await gradingConfigService.publish(
        selectedConfig.id,
        { summary: summary.trim() || undefined },
        getAccessToken
      );

      setSelectedConfig(published);
      setEditableTasks(cloneTasks(published.tasks || []));
      setSummary(published.summary || '');
      setMessage('Đã publish grading config.');
      await loadConfigs();
      setVersions(await gradingConfigService.getVersions(published.id, getAccessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể publish grading config.');
    } finally {
      setSaving(false);
    }
  };

  const testSelectedConfig = async () => {
    if (!selectedConfig || !testFile) {
      setError('Vui lòng chọn config và file bài làm để test.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    setTestResult(null);

    try {
      const result = await gradingConfigService.testConfig(selectedConfig.id, testFile, getAccessToken);
      setTestResult(result);
      setMessage('Đã test chấm bằng grading config qua legacy engine hiện tại.');
      setTestRuns(await gradingConfigService.getTestRuns(selectedConfig.id, getAccessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể test grading config.');
    } finally {
      setSaving(false);
    }
  };

  const restoreVersion = async (version: number) => {
    if (!selectedConfig) return;
    const confirmed = window.confirm(`Restore version ${version} thành draft mới?`);
    if (!confirmed) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const restored = await gradingConfigService.restoreVersion(
        selectedConfig.id,
        version,
        { summary: summary.trim() || `Restore version ${version}` },
        getAccessToken
      );

      setSelectedConfig(restored);
      setEditableTasks(cloneTasks(restored.tasks || []));
      setSummary(restored.summary || '');
      setMessage(`Đã restore version ${version} thành draft.`);
      await loadConfigs();
      setVersions(await gradingConfigService.getVersions(restored.id, getAccessToken));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể restore version.');
    } finally {
      setSaving(false);
    }
  };

  if (!canManage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        Bạn không có quyền quản lý grading config.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">Admin</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Cấu hình chấm điểm</h1>
            <p className="mt-2 text-sm text-slate-500">
              Quản lý config metadata/tasks theo endpoint legacy. V1 chưa thay dynamic evaluator và vẫn giữ hardcoded graders.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-slate-500">Tổng config</p>
              <p className="text-xl font-bold text-slate-900">{configs.length}</p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-emerald-700">Active</p>
              <p className="text-xl font-bold text-emerald-800">{activeConfigCount}</p>
            </div>
          </div>
        </div>

        {(error || message) && (
          <div
            className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {error || message}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <UploadCloud size={18} className="text-blue-600" />
              <h2 className="font-semibold text-slate-900">Import từ hardcoded grader</h2>
            </div>

            <div className="space-y-3">
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Endpoint</span>
                <input
                  value={importEndpoint}
                  onChange={(event) => setImportEndpoint(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="/api/grading/excel/project01"
                />
              </label>

              <label className="block text-sm">
                <span className="font-medium text-slate-700">Tên hiển thị</span>
                <input
                  value={importDisplayName}
                  onChange={(event) => setImportDisplayName(event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Để trống để backend tự đặt"
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={importPublish}
                  onChange={(event) => setImportPublish(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                Publish ngay sau import
              </label>

              <button
                type="button"
                onClick={importFromCode}
                disabled={saving}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <FileCode2 size={16} />}
                Import config
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold text-slate-900">Danh sách config</h2>
              <button
                type="button"
                onClick={() => void loadConfigs()}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                Tải lại
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <select
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value as SubjectFilter)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Tất cả môn</option>
                <option value="Excel">Excel</option>
                <option value="Word">Word</option>
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div className="max-h-[620px] space-y-2 overflow-auto pr-1">
              {configs.map((config) => (
                <button
                  type="button"
                  key={config.id}
                  onClick={() => void loadConfigDetail(config.id)}
                  className={`w-full rounded-xl border p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40 ${
                    selectedConfig?.id === config.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{config.displayName}</p>
                      <p className="truncate text-xs text-slate-500">{config.gradingApiEndpoint}</p>
                    </div>
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${getStatusBadgeClass(config.status)}`}>
                      {config.status}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>{config.subject}</span>
                    <span>Project {config.projectNumber}</span>
                    <span>v{config.version}</span>
                    <span>{config.enabledTaskCount}/{config.taskCount} tasks</span>
                  </div>
                </button>
              ))}

              {!loading && configs.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  Chưa có grading config phù hợp bộ lọc.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          {!selectedConfig ? (
            <div className="grid min-h-[420px] place-items-center rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
              <div>
                <ClipboardCheck className="mx-auto mb-3 text-slate-400" size={36} />
                Chọn một config để xem/chỉnh chi tiết.
              </div>
            </div>
          ) : detailLoading ? (
            <div className="grid min-h-[420px] place-items-center text-slate-500">
              <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900">{selectedConfig.displayName}</h2>
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${getStatusBadgeClass(selectedConfig.status)}`}>
                      {selectedConfig.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{selectedConfig.gradingApiEndpoint}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>Subject: {selectedConfig.subject}</span>
                    <span>Project code: {selectedConfig.projectCode}</span>
                    <span>Version: {selectedConfig.version}</span>
                    <span>Normalized max: {selectedConfig.normalizedMaxScore}</span>
                    <span>Raw max: {selectedConfig.rawMaxScore}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={saveDraft}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                  >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    Lưu draft
                  </button>
                  <button
                    type="button"
                    onClick={publishConfig}
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    <CheckCircle2 size={15} />
                    Publish
                  </button>
                </div>
              </div>

              <label className="block text-sm">
                <span className="font-medium text-slate-700">Summary / ghi chú version</span>
                <textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Ghi chú thay đổi..."
                />
              </label>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-900">
                  Tasks
                </div>
                <div className="overflow-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Bật</th>
                        <th className="px-3 py-2">Task</th>
                        <th className="px-3 py-2">Tên</th>
                        <th className="px-3 py-2">Điểm</th>
                        <th className="px-3 py-2">Rule type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editableTasks.map((task) => (
                        <tr key={task.taskId}>
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={task.enabled}
                              onChange={(event) => updateTask(task.taskId, { enabled: event.target.checked })}
                              className="h-4 w-4 rounded border-slate-300 text-blue-600"
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-600">{task.taskId}</td>
                          <td className="min-w-[220px] px-3 py-2">
                            <input
                              value={task.taskName}
                              onChange={(event) => updateTask(task.taskId, { taskName: event.target.value })}
                              className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={task.maxScore}
                              onChange={(event) =>
                                updateTask(task.taskId, { maxScore: Number.parseFloat(event.target.value) || 0 })
                              }
                              className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-sm"
                            />
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{task.ruleType || 'legacy'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-900">
                  <FileCheck2 size={16} />
                  Test chấm bằng config
                </div>
                <div className="space-y-4 p-4">
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
                    V1 dùng config để chọn endpoint/project và ghi lịch sử test, nhưng kết quả vẫn lấy từ legacy hardcoded grader để giữ nguyên response shape và scoring normalized 125.
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="file"
                      accept={selectedConfig.subject === 'Word' ? '.doc,.docx' : '.xlsx,.xlsm,.xls'}
                      onChange={(event) => setTestFile(event.target.files?.[0] || null)}
                      className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                    />
                    <button
                      type="button"
                      onClick={testSelectedConfig}
                      disabled={saving || !testFile}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? <Loader2 size={15} className="animate-spin" /> : <FileCheck2 size={15} />}
                      Test chấm
                    </button>
                  </div>

                  {testResult && (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                      <div className="font-semibold">{testResult.projectName || testResult.projectId}</div>
                      <div>
                        Điểm: {testResult.totalScore}/{testResult.maxScore} · {testResult.percentage.toFixed(2)}% · {testResult.status}
                      </div>
                      <div>Số task: {testResult.taskResults?.length || 0}</div>
                    </div>
                  )}

                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-800">Test runs gần đây</h3>
                    <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                      {testRuns.map((run) => (
                        <div key={run.id} className="flex flex-col gap-1 px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-medium text-slate-800">{run.fileName || 'Không rõ file'}</p>
                            <p className="text-xs text-slate-500">
                              {formatDateTime(run.createdAt)} · v{run.configVersion} · {run.usedOverride ? 'override' : 'published/draft config'}
                            </p>
                          </div>
                          <div className="text-xs text-slate-600">
                            {run.totalScore}/{run.maxScore} · {run.percentage.toFixed(2)}% · {run.status}
                          </div>
                        </div>
                      ))}

                      {testRuns.length === 0 && (
                        <div className="px-3 py-4 text-center text-sm text-slate-500">Chưa có test run cho config này.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-900">
                  <History size={16} />
                  Versions
                </div>
                <div className="divide-y divide-slate-100">
                  {versions.map((version) => (
                    <div key={version.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          v{version.version} · {version.action}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDateTime(version.createdAt)} · {version.summary || 'Không có ghi chú'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void gradingConfigService.getVersionSnapshot(selectedConfig.id, version.version, getAccessToken)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                          title="Endpoint snapshot đã sẵn sàng; V1 chỉ giữ nút xem nhanh không mở modal."
                        >
                          <Eye size={13} />
                          Snapshot
                        </button>
                        <button
                          type="button"
                          onClick={() => void restoreVersion(version.version)}
                          disabled={saving}
                          className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
                        >
                          <RotateCcw size={13} />
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}

                  {versions.length === 0 && (
                    <div className="px-4 py-6 text-center text-sm text-slate-500">Chưa có version history.</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default GradingConfigAdminPage;