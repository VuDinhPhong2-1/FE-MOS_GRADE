import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileCode2, Plus, RefreshCw, Save, Trash2, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { xmlGradingRulesService } from '../services/xml-grading-rules.service';
import type { GradingRuleSet, ProjectXmlRule, TaskXmlRule, XmlCompareMode, XmlGradingCondition, XmlMatchPolicy, XmlRuleValidationResult } from '../types/xml-grading-rules.types';
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
const expectedText = (condition: XmlGradingCondition) => (condition.expectedValues ?? (Array.isArray(condition.expectedValue) ? condition.expectedValue : condition.expectedValue ? [condition.expectedValue] : [])).join('\n');
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

  const canUsePage = user?.role === 'Admin';
  const selectedProjectCodes = useMemo(() => selected.projects.map((project) => project.projectCode), [selected.projects]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-slate-900">Chấm điểm mới bằng XML Rules</h1><p className="text-sm text-slate-500">Quản lý ruleset → project → task → condition và test chấm file Office.</p></div>
        <button onClick={() => setSelected(emptyRuleSet())} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><Plus size={16} /> Ruleset mới</button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <aside className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex gap-2">
            <input value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} placeholder="subject" className="w-full rounded-lg border px-3 py-2 text-sm" />
            <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as 'all' | 'true' | 'false')} className="rounded-lg border px-2 text-sm"><option value="all">Tất cả</option><option value="true">Active</option><option value="false">Inactive</option></select>
            <button onClick={loadRuleSets} className="rounded-lg border px-3"><RefreshCw size={16} className={cx(loading && 'animate-spin')} /></button>
          </div>
          <div className="space-y-2">
            {ruleSets.map((item) => (
              <button key={item.id} onClick={() => replaceSelected(item)} className={cx('w-full rounded-lg border p-3 text-left text-sm hover:bg-slate-50', selected.id === item.id && 'border-blue-400 bg-blue-50')}>
                <div className="font-semibold text-slate-900">{item.subject} / {item.version}</div>
                <div className="text-xs text-slate-500">{item.projects.length} project • {item.isActive ? 'Active' : 'Inactive'}</div>
              </button>
            ))}
            {!loading && ruleSets.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Chưa có ruleset.</p>}
          </div>
        </aside>

        <main className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid gap-3 md:grid-cols-4">
              <label className="text-sm">Subject<input value={selected.subject} onChange={(e) => replaceSelected({ ...selected, subject: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
              <label className="text-sm">Version<input value={selected.version} onChange={(e) => replaceSelected({ ...selected, version: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
              <label className="flex items-center gap-2 pt-7 text-sm"><input type="checkbox" checked={selected.isActive} onChange={(e) => replaceSelected({ ...selected, isActive: e.target.checked })} /> Active</label>
              <div className="flex items-end gap-2">
                <button onClick={saveRuleSet} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"><Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu'}</button>
                {selected.id && <button onClick={() => deleteRuleSet(selected.id)} className="rounded-lg border border-red-200 px-3 py-2 text-red-600"><Trash2 size={16} /></button>}
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Projects</h2><button onClick={() => replaceSelected({ ...selected, projects: [...selected.projects, emptyProject()] })} className="rounded-lg border px-3 py-2 text-sm"><Plus size={14} className="inline" /> Thêm project</button></div>
            <div className="space-y-4">
              {selected.projects.map((project, pi) => (
                <div key={`${project.projectCode}-${pi}`} className="rounded-xl border border-slate-200 p-4">
                  <div className="grid gap-3 md:grid-cols-[1fr_1fr_120px_auto]">
                    <input value={project.projectCode} onChange={(e) => mutateProject(pi, { projectCode: e.target.value })} placeholder="projectCode" className="rounded-lg border px-3 py-2" />
                    <input value={project.projectName} onChange={(e) => mutateProject(pi, { projectName: e.target.value })} placeholder="projectName" className="rounded-lg border px-3 py-2" />
                    <input type="number" value={project.maxScore} onChange={(e) => mutateProject(pi, { maxScore: Number(e.target.value) })} className="rounded-lg border px-3 py-2" />
                    <button onClick={() => replaceSelected({ ...selected, projects: selected.projects.filter((_, i) => i !== pi) })} className="rounded-lg border border-red-200 px-3 text-red-600"><Trash2 size={16} /></button>
                  </div>
                  <div className="mt-3 space-y-3 pl-4">
                    <div className="flex justify-between"><h3 className="text-sm font-semibold text-slate-700">Tasks</h3><button onClick={() => mutateProject(pi, { tasks: [...project.tasks, emptyTask()] })} className="text-sm text-blue-600">+ Thêm task</button></div>
                    {project.tasks.map((task, ti) => (
                      <div key={`${task.taskId}-${ti}`} className="rounded-lg border bg-slate-50 p-3">
                        <div className="grid gap-2 md:grid-cols-[1fr_1fr_100px_auto]">
                          <input value={task.taskId} onChange={(e) => mutateTask(pi, ti, { taskId: e.target.value })} placeholder="taskId" className="rounded border px-2 py-1" />
                          <input value={task.taskName} onChange={(e) => mutateTask(pi, ti, { taskName: e.target.value })} placeholder="taskName" className="rounded border px-2 py-1" />
                          <input type="number" value={task.maxScore} onChange={(e) => mutateTask(pi, ti, { maxScore: Number(e.target.value) })} className="rounded border px-2 py-1" />
                          <button onClick={() => mutateProject(pi, { tasks: project.tasks.filter((_, i) => i !== ti) })} className="text-red-600"><Trash2 size={16} /></button>
                        </div>
                        <div className="mt-3 space-y-3 pl-3">
                          <div className="flex justify-between"><span className="text-sm font-medium">Conditions</span><button onClick={() => mutateTask(pi, ti, { conditions: [...task.conditions, emptyCondition()] })} className="text-sm text-blue-600">+ Thêm condition</button></div>
                          {task.conditions.map((condition, ci) => (
                            <div key={`${condition.conditionId}-${ci}`} className="rounded-lg border bg-white p-3">
                              <div className="grid gap-2 md:grid-cols-[1fr_90px_1fr_170px_120px_auto]">
                                <input value={condition.conditionId} onChange={(e) => mutateCondition(pi, ti, ci, { conditionId: e.target.value })} placeholder="conditionId" className="rounded border px-2 py-1" />
                                <input type="number" value={condition.score} onChange={(e) => mutateCondition(pi, ti, ci, { score: Number(e.target.value) })} className="rounded border px-2 py-1" />
                                <input value={condition.sourceFile} onChange={(e) => mutateCondition(pi, ti, ci, { sourceFile: e.target.value })} placeholder="xl/worksheets/sheet1.xml" className="rounded border px-2 py-1" />
                                <select value={condition.compareMode} onChange={(e) => mutateCondition(pi, ti, ci, { compareMode: e.target.value as XmlCompareMode })} className="rounded border px-2 py-1">{compareModes.map((m) => <option key={m}>{m}</option>)}</select>
                                <select value={condition.matchPolicy} onChange={(e) => mutateCondition(pi, ti, ci, { matchPolicy: e.target.value as XmlMatchPolicy })} className="rounded border px-2 py-1">{matchPolicies.map((m) => <option key={m}>{m}</option>)}</select>
                                <button onClick={() => mutateTask(pi, ti, { conditions: task.conditions.filter((_, i) => i !== ci) })} className="text-red-600"><Trash2 size={16} /></button>
                              </div>
                              <textarea value={expectedText(condition)} onChange={(e) => mutateCondition(pi, ti, ci, { expectedValues: e.target.value.split('\n') })} placeholder="expectedValue, mỗi dòng một fragment" className="mt-2 min-h-24 w-full rounded border px-2 py-1 font-mono text-xs" />
                              <div className="mt-2 grid gap-2 md:grid-cols-3">
                                <input value={condition.feedback?.successDetail || ''} onChange={(e) => mutateCondition(pi, ti, ci, { feedback: { ...condition.feedback, successDetail: e.target.value } })} placeholder="successDetail" className="rounded border px-2 py-1" />
                                <input value={condition.feedback?.errorMessage || ''} onChange={(e) => mutateCondition(pi, ti, ci, { feedback: { ...condition.feedback, errorMessage: e.target.value } })} placeholder="errorMessage" className="rounded border px-2 py-1" />
                                <input value={condition.feedback?.fixAction || ''} onChange={(e) => mutateCondition(pi, ti, ci, { feedback: { ...condition.feedback, fixAction: e.target.value } })} placeholder="fixAction" className="rounded border px-2 py-1" />
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
              <button onClick={validateRuleSet} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"><CheckCircle2 size={16} /> Validate trước khi active/chấm</button>
              {validation && <div className="mt-3 rounded-lg border p-3 text-sm"><div className={validation.isValid ? 'text-emerald-700' : 'text-red-700'}>{validation.isValid ? 'Hợp lệ' : 'Chưa hợp lệ'}</div>{validation.errors.map((e) => <p key={e} className="text-red-600">• {e}</p>)}{validation.warnings.map((w) => <p key={w} className="text-amber-600">• {w}</p>)}</div>}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center gap-2 font-semibold"><FileCode2 size={18} /> Test chấm XML</div>
              <select value={gradeProjectCode} onChange={(e) => setGradeProjectCode(e.target.value)} className="mb-2 w-full rounded-lg border px-3 py-2"><option value="">Chọn project</option>{selectedProjectCodes.map((code) => <option key={code}>{code}</option>)}</select>
              <input type="file" accept=".xlsx,.xlsm,.docx" onChange={(e) => setGradeFile(e.target.files?.[0] || null)} className="mb-2 w-full text-sm" />
              <button onClick={gradeWithXmlRules} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"><Upload size={16} /> Chấm thử</button>
              {gradeJson && <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{gradeJson}</pre>}
            </div>
          </section>
          <p className="flex items-center gap-2 text-xs text-slate-500"><AlertTriangle size={14} /> CRUD cho phép build từng phần; hãy chạy Validate đầy đủ trước khi bật Active hoặc dùng để chấm thật.</p>
        </main>
      </div>
    </div>
  );
};

export default XmlGradingRulesPage;