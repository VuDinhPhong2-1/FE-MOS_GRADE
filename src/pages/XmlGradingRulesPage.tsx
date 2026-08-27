import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileCode2,
  Plus,
  RefreshCw,
  Save,
  Trash2,
  Upload,
  XCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { xmlGradingRulesService } from '../services/xml-grading-rules.service';
import type {
  GradingRuleSet,
  ProjectXmlRule,
  TaskXmlRule,
  XmlCompareMode,
  XmlGradingCondition,
  XmlMatchPolicy,
  XmlRuleValidationResult
} from '../types/xml-grading-rules.types';
import { notify } from '../utils/notify';

const compareModes: XmlCompareMode[] = ['xmlContainsNormalized', 'xmlContains', 'xmlEquivalentWholeFile', 'exactStringContains'];
const matchPolicies: XmlMatchPolicy[] = ['all', 'any', 'ordered'];

const emptyRuleSet = (): GradingRuleSet => ({ id: '', subject: 'excel', version: 'v1', isActive: false, projects: [] });
const emptyProject = (): ProjectXmlRule => ({ projectCode: 'project22', projectName: '', maxScore: 125, tasks: [] });
const emptyTask = (): TaskXmlRule => ({ taskId: '', taskName: '', maxScore: 1, conditions: [] });
const emptyCondition = (): XmlGradingCondition => ({
  conditionId: '', score: 1, sourceFile: 'xl/worksheets/sheet1.xml', expectedValues: [''], compareMode: 'xmlContainsNormalized', matchPolicy: 'all',
  feedback: { successDetail: '', errorMessage: '', fixAction: '' }, stopTaskIfFailed: false,
});

const cx = (...items: Array<string | false | null | undefined>) => items.filter(Boolean).join(' ');

const expectedText = (condition: XmlGradingCondition) => {
  const arr = (condition.expectedValues ?? (Array.isArray((condition as any).expectedValue) ? (condition as any).expectedValue : (condition as any).expectedValue ? [(condition as any).expectedValue] : []));
  return Array.isArray(arr) ? arr.join('\n') : '';
};

const prepareCondition = (condition: XmlGradingCondition): XmlGradingCondition => ({
  ...condition,
  expectedValue: (condition.expectedValues ?? []).map((value) => value.trim()).filter(Boolean),
  expectedValues: undefined,
});

const XmlGradingRulesPage = () => {
  const { getAccessToken, user } = useAuth();
  const [ruleSets, setRuleSets] = useState<GradingRuleSet[]>([]);
  const [selected, setSelected] = useState<GradingRuleSet>(emptyRuleSet());
  const [subjectFilter, setSubjectFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'true' | 'false'>('all');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState<XmlRuleValidationResult | null>(null);
  const [gradeProjectCode, setGradeProjectCode] = useState('');
  const [gradeFile, setGradeFile] = useState<File | null>(null);
  const [gradeJson, setGradeJson] = useState('');

  // State quản lý xem JSON thô hoặc Giao diện trực quan
  const [viewRawJson, setViewRawJson] = useState(false);
  // State đóng/mở danh sách project trong kết quả
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const canUsePage = user?.role === 'Admin';

  const loadRuleSets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await xmlGradingRulesService.list(getAccessToken, {
        subject: subjectFilter.trim() || undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'true',
      });
      setRuleSets(data);
      if (selected.id) {
        const refreshed = data.find((item) => item.id === selected.id);
        if (refreshed) setSelected(refreshed);
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không tải được danh sách XML rules.');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, getAccessToken, selected.id, subjectFilter]);

  useEffect(() => { void loadRuleSets(); }, [loadRuleSets]);

  const replaceSelected = (next: GradingRuleSet) => {
    setSelected(next);
    setValidation(null);
    setRuleSets((items) => next.id ? items.map((item) => item.id === next.id ? next : item) : items);
  };

  const saveRuleSet = async () => {
    setSaving(true);
    try {
      const payload = { ...selected, projects: selected.projects.map((p) => ({ ...p, tasks: p.tasks.map((t) => ({ ...t, conditions: t.conditions.map(prepareCondition) })) })) };
      const saved = selected.id
        ? await xmlGradingRulesService.update(selected.id, payload, getAccessToken)
        : await xmlGradingRulesService.create(payload, getAccessToken);
      replaceSelected(saved);
      await loadRuleSets();
      notify.success('Đã lưu ruleset XML.');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Lưu ruleset thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const deleteRuleSet = async (id: string) => {
    if (!window.confirm('Xóa ruleset này?')) return;
    await xmlGradingRulesService.delete(id, getAccessToken);
    setSelected(emptyRuleSet());
    await loadRuleSets();
    notify.success('Đã xóa ruleset.');
  };

  const validateRuleSet = async () => {
    try {
      const result = await xmlGradingRulesService.validate(selected, getAccessToken);
      setValidation(result);
      notify.success('Ruleset hợp lệ.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Validate thất bại.';
      setValidation({ isValid: false, errors: [message], warnings: [] });
      notify.error(message);
    }
  };

  const gradeWithXmlRules = async () => {
    if (!gradeFile) return notify.warning('Vui lòng chọn file Office cần test chấm.');
    const projectCode = gradeProjectCode || selected.projects[0]?.projectCode;
    if (!projectCode) return notify.warning('Vui lòng nhập/chọn projectCode.');
    if (!selected.isActive) return notify.warning('Ruleset hiện tại chưa bật Active. Backend chỉ dùng ruleset Active để chấm thử XML.');
    try {
      const result = await xmlGradingRulesService.grade(selected.subject, projectCode, gradeFile, getAccessToken);
      setGradeJson(JSON.stringify(result, null, 2));
      notify.success('Test chấm XML hoàn tất.');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Test chấm thất bại.');
    }
  };

  const mutateProject = (index: number, patch: Partial<ProjectXmlRule>) => replaceSelected({ ...selected, projects: selected.projects.map((p, i) => i === index ? { ...p, ...patch } : p) });
  const mutateTask = (pi: number, ti: number, patch: Partial<TaskXmlRule>) => mutateProject(pi, { tasks: selected.projects[pi].tasks.map((t, i) => i === ti ? { ...t, ...patch } : t) });
  const mutateCondition = (pi: number, ti: number, ci: number, patch: Partial<XmlGradingCondition>) => mutateTask(pi, ti, { conditions: selected.projects[pi].tasks[ti].conditions.map((c, i) => i === ci ? { ...c, ...patch } : c) });

  if (!canUsePage) {
    return <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">Chỉ tài khoản Admin được quản lý XML grading rules.</div>;
  }

  const copyJsonToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(gradeJson);
      notify.success('Đã sao chép JSON kết quả vào clipboard.');
    } catch (e) {
      notify.error('Sao chép thất bại.');
    }
  };

  const downloadJson = (filename = 'grade-result.json') => {
    const blob = new Blob([gradeJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleProjectExpand = (key: string) => {
    setExpandedProjects((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // --- GIAO DIỆN HIỂN THỊ KẾT QUẢ CHẤM ĐIỂM CHI TIẾT ---
  const renderGradeResult = () => {
    if (!gradeJson) return null;

    let parsed: any = null;
    try {
      parsed = JSON.parse(gradeJson);
    } catch (e) {
      parsed = null;
    }

    if (!parsed) {
      return (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-100">
          <pre className="max-h-96 overflow-auto font-mono text-slate-300">{gradeJson}</pre>
        </div>
      );
    }

    // Trích xuất dữ liệu tổng quan
    const totalScore = parsed.totalScore ?? 0;
    const maxScore = parsed.maxScore ?? 125;
    const percentage = parsed.percentage ?? (maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0);
    const isPassed = typeof parsed.isPassed === 'boolean' 
      ? parsed.isPassed 
      : (parsed.status === 'Excellent' || parsed.status === 'PASSED' || percentage >= 70);

    const tasksList = parsed.taskResults ?? [];

    return (
      <div className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 shadow-sm">
        {/* Thanh công cụ / Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800">Kết Quả Chấm Điểm</h3>
            <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-semibold", isPassed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800")}>
              {isPassed ? "ĐẠT (PASSED)" : "KHÔNG ĐẠT (FAILED)"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setViewRawJson(!viewRawJson)} className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50">
              {viewRawJson ? "Giao diện Bảng" : "Xem JSON"}
            </button>
            <button onClick={copyJsonToClipboard} title="Sao chép JSON" className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 shadow-sm hover:bg-slate-50"><Copy size={14} /></button>
            <button onClick={() => downloadJson()} title="Tải xuống JSON" className="rounded-lg border border-slate-300 bg-white p-1.5 text-slate-600 shadow-sm hover:bg-slate-50"><Download size={14} /></button>
          </div>
        </div>

        {viewRawJson ? (
          <div className="rounded-lg border border-slate-900 bg-slate-950 p-3 text-xs text-slate-100">
            <pre className="max-h-96 overflow-auto font-mono">{JSON.stringify(parsed, null, 2)}</pre>
          </div>
        ) : (
          <>
            {/* Các ô thẻ thông số tổng quan */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
                <div className="text-xs font-medium text-emerald-800">Tổng điểm</div>
                <div className="mt-1 text-2xl font-black text-emerald-700">
                  {totalScore} <span className="text-sm font-normal text-emerald-600">/ {maxScore}</span>
                </div>
              </div>

              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                <div className="text-xs font-medium text-blue-800">Tỷ lệ đạt</div>
                <div className="mt-1 text-2xl font-black text-blue-700">{percentage}%</div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-200">
                  <div className="h-full bg-blue-600 transition-all duration-500" style={{ width: `${Math.min(percentage, 100)}%` }} />
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="text-xs font-medium text-slate-500">Mã bài kiểm tra</div>
                <div className="mt-1 font-mono text-sm font-bold text-slate-800">{parsed.projectId || 'N/A'}</div>
                <div className="text-xs text-slate-500">{parsed.projectName}</div>
              </div>
            </div>

            {/* BẢNG KẾT QUẢ CHẤM ĐIỂM CHI TIẾT */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-100/80 font-semibold uppercase tracking-wider text-slate-700">
                  <tr>
                    <th className="px-3 py-2.5 w-12 text-center">STT</th>
                    <th className="px-3 py-2.5 w-32">Mã Task</th>
                    <th className="px-4 py-2.5">Nhiệm vụ (Task Name)</th>
                    <th className="px-3 py-2.5 w-24 text-center">Trạng thái</th>
                    <th className="px-3 py-2.5 w-28 text-right">Điểm số</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.isArray(tasksList) && tasksList.length > 0 ? (
                    tasksList.map((task: any, idx: number) => {
                      const taskPassed = task.isPassed ?? (task.score > 0);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-3 py-3 text-center font-medium text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-3 font-mono font-medium text-slate-800">{task.taskId}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-900 leading-snug">{task.taskName}</div>
                            
                            {/* Chi tiết điều kiện XML / Details */}
                            {Array.isArray(task.details) && task.details.length > 0 && (
                              <div className="mt-1.5 space-y-1">
                                {task.details.map((detail: string, dIdx: number) => (
                                  <div key={dIdx} className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-100 p-1 rounded">
                                    {detail}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Lỗi (nếu có) */}
                            {Array.isArray(task.errors) && task.errors.length > 0 && (
                              <div className="mt-1.5 text-[11px] text-rose-600 bg-rose-50 border border-rose-100 p-1 rounded">
                                {task.errors.join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={cx(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              taskPassed ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                            )}>
                              {taskPassed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                              {taskPassed ? "Đạt" : "Sai"}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-slate-800">
                            <span className={taskPassed ? "text-emerald-700" : "text-rose-600"}>{task.score ?? 0}</span>
                            <span className="text-slate-400 font-normal"> / {task.maxScore ?? 0}</span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">Không có dữ liệu task trong kết quả.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chấm điểm mới bằng XML Rules</h1>
          <p className="text-sm text-slate-500">Quản lý bộ luật → bài project → câu/task → điều kiện chấm</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSelected(emptyRuleSet())} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={16} /> Tạo mới</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex gap-2">
            <input value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} placeholder="Môn: excel/word" className="w-full rounded-lg border px-3 py-2 text-sm" />
            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as 'all' | 'true' | 'false')} className="rounded-lg border px-2 text-sm">
              <option value="all">Tất cả</option>
              <option value="true">Đang bật</option>
              <option value="false">Đang tắt</option>
            </select>
            <button onClick={loadRuleSets} className="rounded-lg border px-3"><RefreshCw size={16} className={cx(loading && 'animate-spin')} /></button>
          </div>
          <div className="space-y-2">
            {ruleSets.map((item) => (
              <button key={item.id} onClick={() => replaceSelected(item)} className={cx('w-full rounded-lg border p-3 text-left text-sm hover:bg-slate-50', selected.id === item.id && 'border-blue-500')}>
                <div className="font-semibold text-slate-900">{item.subject} / {item.version}</div>
                <div className="text-xs text-slate-500">{item.projects.length} project • {item.isActive ? 'Đang bật' : 'Đang tắt'}</div>
              </button>
            ))}
            {!loading && ruleSets.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Chưa có ruleset.</p>}
          </div>
        </aside>

        <main className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-4">
              <label className="text-sm">Môn / loại file (subject)
                <input value={selected.subject} onChange={(e) => replaceSelected({ ...selected, subject: e.target.value })} placeholder="excel" className="w-full rounded-lg border px-3 py-2 text-sm mt-1" />
              </label>
              <label className="text-sm">Phiên bản bộ luật (version)
                <input value={selected.version} onChange={(e) => replaceSelected({ ...selected, version: e.target.value })} placeholder="v1" className="w-full rounded-lg border px-3 py-2 text-sm mt-1" />
              </label>
              <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" checked={selected.isActive} onChange={(e) => replaceSelected({ ...selected, isActive: e.target.checked })} /> Active</label>
              <div className="flex items-end gap-2">
                <button onClick={saveRuleSet} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} /> Lưu</button>
                {selected.id && <button onClick={() => deleteRuleSet(selected.id)} className="rounded-lg border border-red-200 px-3 py-2 text-red-600"><Trash2 size={16} /></button>}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">Danh sách bài Project</h2>
              <button onClick={() => replaceSelected({ ...selected, projects: [...selected.projects, emptyProject()] })} className="rounded border px-3 py-1 text-sm">Thêm project</button>
            </div>
            <div className="space-y-4">
              {selected.projects.map((project, pi) => (
                <div key={pi} className="rounded-xl border border-slate-200 p-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]">
                    <label className="text-xs font-medium text-slate-600">Mã project (projectCode)
                      <input value={project.projectCode} onChange={(e) => mutateProject(pi, { projectCode: e.target.value })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1" />
                    </label>
                    <label className="text-xs font-medium text-slate-600">Tên project (projectName)
                      <input value={project.projectName} onChange={(e) => mutateProject(pi, { projectName: e.target.value })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1" />
                    </label>
                    <label className="text-xs font-medium text-slate-600">Điểm tối đa
                      <input type="number" value={project.maxScore} onChange={(e) => mutateProject(pi, { maxScore: Number(e.target.value) })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1" />
                    </label>
                    <button onClick={() => replaceSelected({ ...selected, projects: selected.projects.filter((_, i) => i !== pi) })} title="Xóa project" className="self-end rounded-lg border border-red-200 px-3 py-2 text-red-600">Xóa</button>
                  </div>

                  <div className="mt-3 space-y-3 pl-4">
                    <div className="flex justify-between">
                      <h3 className="text-sm font-semibold text-slate-700">Các câu / nhiệm vụ chấm (Tasks)</h3>
                      <button onClick={() => mutateProject(pi, { tasks: [...project.tasks, emptyTask()] })} className="rounded border px-3 py-1 text-sm">Thêm câu</button>
                    </div>
                    {project.tasks.map((task, ti) => (
                      <div key={ti} className="rounded-lg border bg-slate-50 p-3">
                        <div className="grid gap-2 md:grid-cols-[1fr_1fr_100px_auto]">
                          <label className="text-xs font-medium text-slate-600">Mã câu (taskId)
                            <input value={task.taskId} onChange={(e) => mutateTask(pi, ti, { taskId: e.target.value })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1" />
                          </label>
                          <label className="text-xs font-medium text-slate-600">Tên câu / nhiệm vụ (taskName)
                            <input value={task.taskName} onChange={(e) => mutateTask(pi, ti, { taskName: e.target.value })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1" />
                          </label>
                          <label className="text-xs font-medium text-slate-600">Điểm tối đa
                            <input type="number" value={task.maxScore} onChange={(e) => mutateTask(pi, ti, { maxScore: Number(e.target.value) })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1" />
                          </label>
                          <button onClick={() => mutateProject(pi, { tasks: project.tasks.filter((_, i) => i !== ti) })} title="Xóa câu/task" className="self-end pb-2 text-red-600">Xóa</button>
                        </div>

                        <div className="mt-3 space-y-3 pl-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Điều kiện chấm điểm (Conditions)</span>
                            <button onClick={() => mutateTask(pi, ti, { conditions: [...task.conditions, emptyCondition()] })} className="rounded border px-3 py-1 text-sm">Thêm điều kiện</button>
                          </div>
                          {task.conditions.map((condition, ci) => (
                            <div key={ci} className="rounded-lg border bg-white p-3">
                              <div className="grid gap-2 md:grid-cols-[1fr_90px_1fr_170px_140px_auto]">
                                <label className="text-xs font-medium text-slate-600">Mã điều kiện (conditionId)
                                  <input value={condition.conditionId} onChange={(e) => mutateCondition(pi, ti, ci, { conditionId: e.target.value })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1" />
                                </label>
                                <label className="text-xs font-medium text-slate-600">Điểm
                                  <input type="number" value={condition.score} onChange={(e) => mutateCondition(pi, ti, ci, { score: Number(e.target.value) })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1" />
                                </label>
                                <label className="text-xs font-medium text-slate-600">File XML cần kiểm tra (sourceFile)
                                  <input value={condition.sourceFile} onChange={(e) => mutateCondition(pi, ti, ci, { sourceFile: e.target.value })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1" />
                                </label>
                                <label className="text-xs font-medium text-slate-600">Cách so khớp (compareMode)
                                  <select value={condition.compareMode} onChange={(e) => mutateCondition(pi, ti, ci, { compareMode: e.target.value as XmlCompareMode })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1">
                                    {compareModes.map((m) => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                </label>
                                <label className="text-xs font-medium text-slate-600">Quy tắc nhiều giá trị
                                  <select value={condition.matchPolicy} onChange={(e) => mutateCondition(pi, ti, ci, { matchPolicy: e.target.value as XmlMatchPolicy })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1">
                                    {matchPolicies.map((m) => <option key={m} value={m}>{m}</option>)}
                                  </select>
                                </label>
                                <button onClick={() => mutateTask(pi, ti, { conditions: task.conditions.filter((_, i) => i !== ci) })} title="Xóa điều kiện" className="self-end pb-2 text-red-600">Xóa</button>
                              </div>
                              <label className="mt-2 block text-xs font-medium text-slate-600">Giá trị cần tìm trong XML (expectedValue / expectedValues)
                                <textarea value={expectedText(condition)} onChange={(e) => mutateCondition(pi, ti, ci, { expectedValues: e.target.value.split('\n') })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1 h-24" />
                              </label>
                              <div className="mt-2 grid gap-2 md:grid-cols-3">
                                <label className="text-xs font-medium text-slate-600">Thông báo khi đúng
                                  <input value={condition.feedback?.successDetail || ''} onChange={(e) => mutateCondition(pi, ti, ci, { feedback: { ...(condition.feedback || {}), successDetail: e.target.value } })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1" />
                                </label>
                                <label className="text-xs font-medium text-slate-600">Thông báo khi sai
                                  <input value={condition.feedback?.errorMessage || ''} onChange={(e) => mutateCondition(pi, ti, ci, { feedback: { ...(condition.feedback || {}), errorMessage: e.target.value } })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1" />
                                </label>
                                <label className="text-xs font-medium text-slate-600">Gợi ý cách sửa
                                  <input value={condition.feedback?.fixAction || ''} onChange={(e) => mutateCondition(pi, ti, ci, { feedback: { ...(condition.feedback || {}), fixAction: e.target.value } })} className="w-full rounded-lg border px-2 py-1 text-sm mt-1" />
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <button onClick={validateRuleSet} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"><CheckCircle2 size={16} /> Validate</button>
              {validation && <div className="mt-3 rounded-lg border p-3 text-sm"><div className={validation.isValid ? 'text-emerald-700' : 'text-red-700'}>{validation.isValid ? 'Hợp lệ' : 'Chưa hợp lệ'}</div>{validation.errors?.length > 0 && <ul className="mt-2 text-xs text-red-600">{validation.errors.map((e, i) => <li key={i}>{e}</li>)}</ul>}</div>}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 font-semibold"><FileCode2 size={18} /> Test chấm XML</div>
              <select value={gradeProjectCode} onChange={(e) => setGradeProjectCode(e.target.value)} className="mb-2 w-full rounded-lg border px-3 py-2 text-sm"><option value="">Chọn project</option>{selected.projects.map((p) => <option key={p.projectCode} value={p.projectCode}>{p.projectCode} - {p.projectName}</option>)}</select>
              <input type="file" accept=".xlsx,.xlsm,.docx" onChange={(e) => setGradeFile(e.target.files?.[0] || null)} className="mb-2 w-full text-sm" />
              <button onClick={gradeWithXmlRules} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"><Upload size={16} /> Chấm thử</button>

              {/* Component kết quả đã được nâng cấp */}
              {renderGradeResult()}
            </div>
          </section>

          <p className="flex items-center gap-2 text-xs text-slate-500"><AlertTriangle size={14} /> CRUD cho phép build từng phần; hãy chạy Validate đầy đủ trước khi bật Active để tránh chấm sai.</p>
        </main>
      </div>
    </div>
  );
};

export default XmlGradingRulesPage;