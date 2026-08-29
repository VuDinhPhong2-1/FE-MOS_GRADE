import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
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
  XmlRuleValidationResult,
  SpecialCondition,
  SpecialConditionType,
  PictureBulletConfig
} from '../types/xml-grading-rules.types';
import { notify } from '../utils/notify';
import PictureBulletEditor from '../components/PictureBulletEditor';

const compareModes: XmlCompareMode[] = ['xmlContainsNormalized', 'xmlContains', 'xmlEquivalentWholeFile', 'exactStringContains'];
const matchPolicies: XmlMatchPolicy[] = ['all', 'any', 'ordered'];

const compareModesLabels: Record<XmlCompareMode, string> = {
  'xmlContainsNormalized':
    'Tìm XML, bỏ qua khác biệt về khoảng trắng và format',

  'xmlContains':
    'Tìm đúng đoạn XML đã nhập, chỉ bỏ khoảng trắng đầu và cuối',

  'xmlEquivalentWholeFile':
    'Đọc XML và so sánh toàn bộ cấu trúc, không phụ thuộc format',

  'exactStringContains':
    'Tìm đúng chuỗi ký tự, không thay đổi hoặc chuẩn hóa nội dung'
};

const matchPoliciesLabels: Record<XmlMatchPolicy, string> = {
  'all': 'Tất cả điều kiện',
  'any': 'Bất kỳ điều kiện nào',
  'ordered': 'Theo thứ tự'
};

// Danh sách các loại điều kiện đặc biệt hỗ trợ theo từng Task.
// Thêm loại mới chỉ cần bổ sung thêm 1 phần tử vào mảng này.
const specialConditionOptions: Array<{
  value: SpecialConditionType;
  label: string;
  description: string;
}> = [
    {
      value: 'pictureBullet',
      label: 'Dấu đầu dòng bằng hình ảnh',
      description:
        'Kiểm tra paragraph có sử dụng đúng hình ảnh làm dấu đầu dòng hay không.',
    },
  ];

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
  expectedValues: (condition.expectedValues ?? []).map((value) => value.trim()).filter(Boolean),
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
  const [expandedProjects, setExpandedProjects] = useState<Record<number, boolean>>({});
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'editor' | 'validation' | 'test'>('editor');
  const [showAdvanced, setShowAdvanced] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState('');
  const selectedRef = useRef(selected);
  const saveScrollYRef = useRef(0);

  // Luôn giữ snapshot mới nhất để thao tác Save không dùng state cũ
  // trong trường hợp người dùng vừa nhập Condition rồi click Save ngay.
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const canUsePage = user?.role === 'Admin';

  const loadRuleSets = useCallback(async () => {
    setLoading(true);
    try {
      const data = await xmlGradingRulesService.list(getAccessToken, {
        subject: subjectFilter.trim() || undefined,
        isActive: activeFilter === 'all' ? undefined : activeFilter === 'true',
      });

      setRuleSets(data);

      // Dùng ref thay vì selected.id từ closure cũ.
      // Tránh việc request reload sau Save lấy lại state cũ và làm UI nhảy/ghi đè.
      const currentId = selectedRef.current.id;
      if (currentId) {
        const refreshed = data.find((item) => item.id === currentId);
        if (refreshed) {
          selectedRef.current = refreshed;
          setSelected(refreshed);
        }
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Không tải được danh sách XML rules.');
    } finally {
      setLoading(false);
    }
  }, [activeFilter, getAccessToken, subjectFilter]);

  useEffect(() => { void loadRuleSets(); }, [loadRuleSets]);

  const replaceSelected = (next: GradingRuleSet) => {
    selectedRef.current = next;
    setSelected(next);
    setValidation(null);
    setRuleSets((items) => {
      if (!next.id) return items;
      const exists = items.some((item) => item.id === next.id);
      return exists
        ? items.map((item) => item.id === next.id ? next : item)
        : [next, ...items];
    });
  };

  // Update state theo kiểu functional + cập nhật ref ngay lập tức.
  // Đây là phần quan trọng để tránh mất ký tự/field khi người dùng
  // vừa nhập Condition rồi bấm Save ngay.
  const updateSelected = (updater: (current: GradingRuleSet) => GradingRuleSet) => {
    const next = updater(selectedRef.current);
    selectedRef.current = next;
    setSelected(next);
    setValidation(null);
    setRuleSets((items) =>
      next.id ? items.map((item) => item.id === next.id ? next : item) : items
    );
  };

  const saveRuleSet = async () => {
    // Giữ nguyên vị trí scroll: Save không được kéo người dùng về input
    // hoặc nhảy đến Condition vừa sửa.
    saveScrollYRef.current = window.scrollY;
    setSaveError('');

    const current = selectedRef.current;

    // Không tự thêm validation HTML/required ở đây.
    // Backend/service hiện tại vẫn là nguồn xác thực chính.
    // Điều này tránh browser tự focus + scroll về một input Condition.

    setSaving(true);

    try {
      // Chuẩn hóa từ snapshot mới nhất, không lấy selected từ closure cũ.
      const payload = {
        ...current,
        projects: current.projects.map((project) => ({
          ...project,
          tasks: project.tasks.map((task) => ({
            ...task,
            conditions: task.conditions.map(prepareCondition),
          })),
        })),
      };

      const saved = current.id
        ? await xmlGradingRulesService.update(current.id, payload, getAccessToken)
        : await xmlGradingRulesService.create(payload, getAccessToken);

      replaceSelected(saved);
      selectedRef.current = saved;

      // Reload danh sách ở background; selectedRef đã trỏ tới saved
      // nên request reload không thể quay lại state cũ.
      await loadRuleSets();
      notify.success('Đã lưu ruleset XML.');

      // Sau khi save thành công vẫn giữ nguyên vị trí người dùng đang làm việc.
      requestAnimationFrame(() => {
        window.scrollTo({ top: saveScrollYRef.current, behavior: 'auto' });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lưu ruleset thất bại.';
      setSaveError(message);
      notify.error(message);

      // API lỗi không được làm UI nhảy xuống Condition.
      requestAnimationFrame(() => {
        window.scrollTo({ top: saveScrollYRef.current, behavior: 'auto' });
      });
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

  const mutateProject = (index: number, patch: Partial<ProjectXmlRule>) => {
    updateSelected((current) => ({
      ...current,
      projects: current.projects.map((project, i) =>
        i === index ? { ...project, ...patch } : project
      ),
    }));
  };

  const mutateTask = (pi: number, ti: number, patch: Partial<TaskXmlRule>) => {
    updateSelected((current) => ({
      ...current,
      projects: current.projects.map((project, projectIndex) =>
        projectIndex !== pi
          ? project
          : {
            ...project,
            tasks: project.tasks.map((task, taskIndex) =>
              taskIndex === ti ? { ...task, ...patch } : task
            ),
          }
      ),
    }));
  };

  const mutateCondition = (
    pi: number,
    ti: number,
    ci: number,
    patch: Partial<XmlGradingCondition>
  ) => {
    updateSelected((current) => ({
      ...current,
      projects: current.projects.map((project, projectIndex) =>
        projectIndex !== pi
          ? project
          : {
            ...project,
            tasks: project.tasks.map((task, taskIndex) =>
              taskIndex !== ti
                ? task
                : {
                  ...task,
                  conditions: task.conditions.map((condition, conditionIndex) =>
                    conditionIndex === ci
                      ? { ...condition, ...patch }
                      : condition
                  ),
                }
            ),
          }
      ),
    }));
  };

  // Cập nhật Special Condition của riêng 1 Task (không dùng chung toàn trang).
  const updateTaskSpecialCondition = (
    pi: number,
    ti: number,
    specialCondition?: SpecialCondition
  ) => {
    mutateTask(pi, ti, {
      specialCondition,
    });
  };

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
                            {Array.isArray(task.errors) && task.errors.length > 0 && (
                              <div className="mt-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 p-1 rounded">
                                {task.fixActions.join(', ')}
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


  const toggleProject = (index: number) =>
    setExpandedProjects((prev) => ({ ...prev, [index]: !(prev[index] ?? true) }));

  const toggleTask = (key: string) =>
    setExpandedTasks((prev) => ({ ...prev, [key]: !(prev[key] ?? false) }));

  const toggleAdvanced = (key: string) =>
    setShowAdvanced((prev) => ({ ...prev, [key]: !prev[key] }));

  const projectCount = selected.projects.length;
  const taskCount = selected.projects.reduce((sum, project) => sum + project.tasks.length, 0);
  const conditionCount = selected.projects.reduce(
    (sum, project) => sum + project.tasks.reduce((taskSum, task) => taskSum + task.conditions.length, 0),
    0
  );
  const selectedMaxScore = selected.projects.reduce((sum, project) => sum + Number(project.maxScore || 0), 0);

  const statusBadge = selected.isActive
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-slate-200 bg-slate-100 text-slate-600';

  const inputClass =
    'mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

  const iconButtonClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800';

  return (
    <div className="min-h-full space-y-5 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 pb-10">
      {/* Page header */}
      <header className="sticky top-0 z-20 -mx-4 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between gap-4">

          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileCode2 size={18} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-bold text-slate-900">
                  XML Grading Rules
                </h1>

                <span
                  className={cx(
                    "hidden rounded-full border px-2 py-0.5 text-[10px] font-bold sm:inline-flex",
                    statusBadge
                  )}
                >
                  {selected.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <p className="truncate text-xs text-slate-500">
                Quản lý ruleset · project · task · điều kiện chấm
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setSelected(emptyRuleSet())}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Tạo ruleset</span>
            </button>
          </div>

        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[292px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="h-fit rounded-2xl border border-slate-200/80 bg-white/95 p-3.5 shadow-xl shadow-slate-900/5 xl:sticky xl:top-24 mb-2 p-6">
          <div className="mb-3 flex items-center justify-between px-2">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Rulesets</p>
              <p className="text-sm font-semibold text-slate-800">{ruleSets.length} bộ luật</p>
            </div>
            <button onClick={loadRuleSets} className={iconButtonClass} title="Làm mới">
              <RefreshCw size={15} className={cx(loading && 'animate-spin')} />
            </button>
          </div>

          <div className="mb-3 space-y-2">
            <input
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              placeholder="Tìm theo môn..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as 'all' | 'true' | 'false')}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="true">Đang bật</option>
              <option value="false">Đang tắt</option>
            </select>
          </div>

          <div className="max-h-[calc(100vh-280px)] space-y-1 overflow-y-auto pr-1">
            {ruleSets.map((item) => {
              const isSelected = selected.id === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => replaceSelected(item)}
                  className={cx(
                    'w-full rounded-xl border p-3 text-left transition',
                    isSelected
                      ? 'border-blue-200 bg-blue-50 shadow-sm'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-slate-900">
                        {item.subject} · {item.version}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {item.projects.length} project · {item.projects.reduce((n, p) => n + p.tasks.length, 0)} task
                      </div>
                    </div>
                    <span
                      className={cx(
                        'mt-0.5 h-2 w-2 shrink-0 rounded-full',
                        item.isActive ? 'bg-emerald-500' : 'bg-slate-300'
                      )}
                    />
                  </div>
                </button>
              );
            })}

            {!loading && ruleSets.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                <FileCode2 className="mx-auto mb-2 text-slate-300" size={24} />
                <p className="text-sm font-medium text-slate-500">Chưa có ruleset</p>
                <p className="mt-1 text-xs text-slate-400">Tạo ruleset đầu tiên để bắt đầu.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 space-y-5">
          {/* Ruleset overview */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {selected.subject || 'Chưa đặt tên'} · {selected.version || 'v1'}
                  </h2>
                  <span className={cx('rounded-full border px-2.5 py-1 text-[11px] font-bold', statusBadge)}>
                    {selected.isActive ? 'Đang hoạt động' : 'Đang tắt'}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  {selected.id ? `ID: ${selected.id}` : 'Ruleset mới chưa được lưu'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selected.id && (
                  <button
                    onClick={() => deleteRuleSet(selected.id)}
                    title="Xóa ruleset"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                ['Projects', projectCount],
                ['Tasks', taskCount],
                ['Conditions', conditionCount],
                ['Max score', selectedMaxScore],
              ].map(([label, value]) => (
                <div key={label} className="group rounded-xl border border-slate-100 bg-gradient-to-br from-slate-50 to-white px-4 py-3 transition hover:-translate-y-0.5 hover:border-blue-100 hover:shadow-md">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
                  <p className="mt-1 text-xl font-black text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="mt-5 flex gap-1 overflow-x-auto border-b border-slate-200">
              {[
                ['editor', 'Rules editor'],
                ['validation', 'Validation'],
                ['test', 'Test XML'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={cx(
                    'border-b-2 px-3 py-2.5 text-sm font-semibold transition',
                    activeTab === key
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  )}
                >
                  {label}
                  {key === 'validation' && validation && (
                    <span className={cx('ml-2 rounded-full px-1.5 py-0.5 text-[10px]', validation.isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700')}>
                      {validation.isValid ? 'OK' : `${validation.errors?.length || 0}`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {activeTab === 'editor' && (
            <>
              {/* Ruleset settings */}
              <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/5">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-900">Thông tin ruleset</h3>
                  <p className="mt-1 text-xs text-slate-500">Các thiết lập chung cho toàn bộ bộ luật.</p>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                  <label className="text-xs font-semibold text-slate-600">
                    Môn / loại file
                    <input
                      value={selected.subject}
                      onChange={(e) => replaceSelected({ ...selected, subject: e.target.value })}
                      placeholder="excel"
                      className={inputClass}
                    />
                  </label>
                  <label className="text-xs font-semibold text-slate-600">
                    Phiên bản bộ luật
                    <input
                      value={selected.version}
                      onChange={(e) => replaceSelected({ ...selected, version: e.target.value })}
                      placeholder="v1"
                      className={inputClass}
                    />
                  </label>
                  <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 md:self-end">
                    <input
                      type="checkbox"
                      checked={selected.isActive}
                      onChange={(e) => replaceSelected({ ...selected, isActive: e.target.checked })}
                      className="h-4 w-4 accent-blue-600"
                    />
                    Kích hoạt
                  </label>
                </div>
              </section>

              {/* Projects */}
              <section className="rounded-2xl border border-slate-200/80 bg-slate-100/70 p-5 shadow-lg shadow-slate-900/5">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Projects</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Mỗi project chứa các Task và điều kiện chấm tương ứng.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = { ...selected, projects: [...selected.projects, emptyProject()] };
                      replaceSelected(next);
                      setExpandedProjects((prev) => ({ ...prev, [next.projects.length - 1]: true }));
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <Plus size={15} /> Thêm project
                  </button>
                </div>

                <div className="space-y-4">
                  {selected.projects.map((project, pi) => {
                    const projectExpanded = expandedProjects[pi] ?? true;
                    return (
                      <div key={pi} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md p-4">
                        {/* Project header */}
                        <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50 px-4 py-3.5">
                          <button
                            onClick={() => toggleProject(pi)}
                            className="flex min-w-0 flex-1 items-center gap-3 text-left p-2"
                          >
                            <span className="text-slate-400">{projectExpanded ? '▼' : '▶'}</span>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold text-slate-900">
                                {project.projectName || 'Project chưa đặt tên'}
                              </div>
                              <div className="mt-0.5 text-xs text-slate-500">
                                {project.projectCode || 'project22'} · {project.tasks.length} task · {project.maxScore} điểm
                              </div>
                            </div>
                          </button>
                          <button
                            onClick={() =>
                              replaceSelected({
                                ...selected,
                                projects: selected.projects.filter((_, i) => i !== pi),
                              })
                            }
                            title="Xóa project"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>

                        {projectExpanded && (
                          <div className="space-y-4 bg-white p-4">
                            {/* Project fields */}
                            <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_130px]">
                              <label className="text-xs font-semibold text-slate-600">
                                Mã project
                                <input
                                  value={project.projectCode}
                                  onChange={(e) => mutateProject(pi, { projectCode: e.target.value })}
                                  className={inputClass}
                                />
                              </label>
                              <label className="text-xs font-semibold text-slate-600">
                                Tên project
                                <input
                                  value={project.projectName}
                                  onChange={(e) => mutateProject(pi, { projectName: e.target.value })}
                                  className={inputClass}
                                />
                              </label>
                              <label className="text-xs font-semibold text-slate-600">
                                Điểm tối đa
                                <input
                                  type="number"
                                  value={project.maxScore}
                                  onChange={(e) => mutateProject(pi, { maxScore: Number(e.target.value) })}
                                  className={inputClass}
                                />
                              </label>
                            </div>

                            {/* Tasks */}
                            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5">
                              <div className="mb-3 flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-bold text-slate-800">Tasks</p>
                                  <p className="text-xs text-slate-500">{project.tasks.length} nhiệm vụ trong project</p>
                                </div>
                                <button
                                  onClick={() => mutateProject(pi, { tasks: [...project.tasks, emptyTask()] })}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                  <Plus size={14} /> Thêm Task
                                </button>
                              </div>

                              <div className="space-y-2">
                                {project.tasks.map((task, ti) => {
                                  const taskKey = `${pi}-${ti}`;
                                  const taskExpanded = expandedTasks[taskKey] ?? false;

                                  return (
                                    <div key={taskKey} className="overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-sm">
                                      <div className="flex items-center gap-2 border-b border-slate-100 px-3.5 py-3">
                                        <button
                                          onClick={() => toggleTask(taskKey)}
                                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                                        >
                                          <span className="text-xs text-slate-400">{taskExpanded ? '▼' : '▶'}</span>
                                          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[11px] font-bold text-slate-600">
                                            {task.taskId || `TASK-${ti + 1}`}
                                          </span>
                                          <span className="min-w-0 truncate text-sm font-semibold text-slate-800">
                                            {task.taskName || 'Task chưa đặt tên'}
                                          </span>
                                          <span className="ml-auto shrink-0 text-xs font-semibold text-slate-400">
                                            {task.conditions.length} điều kiện · {task.maxScore} điểm
                                          </span>
                                        </button>
                                        <button
                                          onClick={() =>
                                            mutateProject(pi, {
                                              tasks: project.tasks.filter((_, i) => i !== ti),
                                            })
                                          }
                                          title="Xóa Task"
                                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>

                                      {taskExpanded && (
                                        <div className="border-t border-slate-100 bg-slate-50/30 p-4">
                                          <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)_140px]">
                                            <label className="text-xs font-semibold text-slate-600">
                                              Mã Task
                                              <input
                                                value={task.taskId}
                                                onChange={(e) =>
                                                  mutateTask(pi, ti, { taskId: e.target.value })
                                                }
                                                className={inputClass}
                                                placeholder="TASK-01"
                                              />
                                            </label>

                                            <label className="text-xs font-semibold text-slate-600">
                                              Tên nhiệm vụ
                                              <input
                                                value={task.taskName}
                                                onChange={(e) =>
                                                  mutateTask(pi, ti, { taskName: e.target.value })
                                                }
                                                className={inputClass}
                                                placeholder="Nhập tên nhiệm vụ..."
                                              />
                                            </label>

                                            <label className="text-xs font-semibold text-slate-600">
                                              Điểm tối đa
                                              <input
                                                type="number"
                                                value={task.maxScore}
                                                onChange={(e) =>
                                                  mutateTask(pi, ti, {
                                                    maxScore: Number(e.target.value),
                                                  })
                                                }
                                                className={inputClass}
                                              />
                                            </label>
                                          </div>

                                          {/* =========================================================
                                              SPECIAL CONDITION (thuộc riêng Task này, không phải state global)
                                              ========================================================= */}
                                          <div className="mt-5 rounded-2xl border border-violet-200/80 bg-white p-4 shadow-sm">
                                            <div className="flex items-start gap-3">
                                              {/* Icon */}
                                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                                <span className="text-base">✦</span>
                                              </div>

                                              {/* Title */}
                                              <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2">
                                                  <p className="text-sm font-bold text-slate-800">
                                                    Điều kiện đặc biệt
                                                  </p>

                                                  {task.specialCondition && (
                                                    <span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                                                      ĐANG SỬ DỤNG
                                                    </span>
                                                  )}
                                                </div>

                                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                                  Chỉ sử dụng khi Task cần kiểm tra thành phần đặc biệt
                                                  trong file Word mà Condition XML thông thường không đủ
                                                  để xác định.
                                                </p>
                                              </div>
                                            </div>

                                            {/* Select */}
                                            <div className="mt-4">
                                              <label className="block text-xs font-semibold text-slate-600">
                                                Loại kiểm tra đặc biệt

                                                <div className="relative">
                                                  <select
                                                    value={task.specialCondition?.type ?? ''}
                                                    onChange={(e) => {
                                                      const value = e.target.value;

                                                      if (!value) {
                                                        updateTaskSpecialCondition(pi, ti, undefined);
                                                        return;
                                                      }

                                                      if (value === 'pictureBullet') {
                                                        updateTaskSpecialCondition(pi, ti, {
                                                          type: 'pictureBullet',
                                                          config: {
                                                            level: 0,
                                                          },
                                                        });
                                                      }
                                                    }}
                                                    className="mt-1 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 pr-10 text-sm font-medium text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
                                                  >
                                                    <option value="">Không sử dụng</option>

                                                    {specialConditionOptions.map((option) => (
                                                      <option key={option.value} value={option.value}>
                                                        {option.label}
                                                      </option>
                                                    ))}
                                                  </select>

                                                  <svg
                                                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                  >
                                                    <path
                                                      fillRule="evenodd"
                                                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                                                      clipRule="evenodd"
                                                    />
                                                  </svg>
                                                </div>
                                              </label>
                                            </div>

                                            {/* Description */}
                                            {task.specialCondition?.type && (
                                              <div className="mt-3 flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50/60 p-3">
                                                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                                                  💡
                                                </div>

                                                <div>
                                                  <p className="text-xs font-bold text-violet-900">
                                                    {
                                                      specialConditionOptions.find(
                                                        (option) => option.value === task.specialCondition?.type
                                                      )?.label
                                                    }
                                                  </p>

                                                  <p className="mt-0.5 text-xs leading-5 text-violet-700/80">
                                                    {
                                                      specialConditionOptions.find(
                                                        (option) => option.value === task.specialCondition?.type
                                                      )?.description
                                                    }
                                                  </p>
                                                </div>
                                              </div>
                                            )}

                                            {/* Picture Bullet configuration */}
                                            {task.specialCondition?.type === 'pictureBullet' && (
                                              <PictureBulletEditor
                                                config={task.specialCondition.config}
                                                getAccessToken={getAccessToken}
                                                onChange={(config: PictureBulletConfig) => {
                                                  updateTaskSpecialCondition(pi, ti, {
                                                    type: 'pictureBullet',
                                                    config,
                                                  });
                                                }}
                                              />
                                            )}
                                          </div>

                                          <div className="mt-5">
                                            <div className="mb-3 flex items-center justify-between gap-2">
                                              <div>
                                                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Conditions</p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                  {task.conditions.length} điều kiện chấm điểm
                                                </p>
                                              </div>
                                              <button
                                                onClick={() =>
                                                  mutateTask(pi, ti, {
                                                    conditions: [...task.conditions, emptyCondition()],
                                                  })
                                                }
                                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                                              >
                                                <Plus size={14} /> Thêm điều kiện
                                              </button>
                                            </div>

                                            <div className="space-y-3">
                                              {task.conditions.map((condition, ci) => {
                                                const conditionKey = `${pi}-${ti}-${ci}`;
                                                const advanced = showAdvanced[conditionKey] ?? false;

                                                return (
                                                  <div key={conditionKey} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                      <div className="flex min-w-0 items-center gap-2">
                                                        <span className="rounded-md bg-blue-50 px-2 py-1 font-mono text-[11px] font-bold text-blue-700">
                                                          {condition.conditionId || `C${String(ci + 1).padStart(2, '0')}`}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                          {condition.score} điểm
                                                        </span>
                                                      </div>
                                                      <button
                                                        onClick={() =>
                                                          mutateTask(pi, ti, {
                                                            conditions: task.conditions.filter((_, i) => i !== ci),
                                                          })
                                                        }
                                                        title="Xóa điều kiện"
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                                                      >
                                                        <Trash2 size={14} />
                                                      </button>
                                                    </div>

                                                    <div className="mt-3 grid gap-3 md:grid-cols-[1fr_120px]">
                                                      <label className="text-xs font-semibold text-slate-600">
                                                        Mã điều kiện
                                                        <input
                                                          value={condition.conditionId}
                                                          onChange={(e) => mutateCondition(pi, ti, ci, { conditionId: e.target.value })}
                                                          className={inputClass}
                                                        />
                                                      </label>
                                                      <label className="text-xs font-semibold text-slate-600">
                                                        Điểm
                                                        <input
                                                          type="number"
                                                          value={condition.score}
                                                          onChange={(e) => mutateCondition(pi, ti, ci, { score: Number(e.target.value) })}
                                                          className={inputClass}
                                                        />
                                                      </label>
                                                    </div>

                                                    <label className="mt-3 block text-xs font-semibold text-slate-600">
                                                      File XML cần kiểm tra
                                                      <input
                                                        value={condition.sourceFile}
                                                        onChange={(e) => mutateCondition(pi, ti, ci, { sourceFile: e.target.value })}
                                                        placeholder="xl/worksheets/sheet1.xml"
                                                        className={cx(inputClass, 'font-mono')}
                                                      />
                                                    </label>

                                                    <label className="mt-3 block text-xs font-semibold text-slate-600">
                                                      Giá trị cần tìm trong XML
                                                      <textarea
                                                        value={expectedText(condition)}
                                                        onChange={(e) =>
                                                          mutateCondition(pi, ti, ci, {
                                                            expectedValues: e.target.value.split('\n'),
                                                          })
                                                        }
                                                        rows={3}
                                                        placeholder="Mỗi giá trị một dòng..."
                                                        className={cx(inputClass, 'resize-y font-mono')}
                                                      />
                                                    </label>

                                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                      <label className="text-xs font-semibold text-slate-600">
                                                        Cách so khớp
                                                        <select
                                                          value={condition.compareMode}
                                                          onChange={(e) =>
                                                            mutateCondition(pi, ti, ci, {
                                                              compareMode: e.target.value as XmlCompareMode,
                                                            })
                                                          }
                                                          className={inputClass}
                                                        >
                                                          {compareModes.map((m) => (
                                                            <option key={m} value={m}>
                                                              {compareModesLabels[m]}
                                                            </option>
                                                          ))}
                                                        </select>
                                                      </label>
                                                      <label className="text-xs font-semibold text-slate-600">
                                                        Quy tắc nhiều giá trị
                                                        <select
                                                          value={condition.matchPolicy}
                                                          onChange={(e) =>
                                                            mutateCondition(pi, ti, ci, {
                                                              matchPolicy: e.target.value as XmlMatchPolicy,
                                                            })
                                                          }
                                                          className={inputClass}
                                                        >
                                                          {matchPolicies.map((m) => (
                                                            <option key={m} value={m}>
                                                              {matchPoliciesLabels[m]}
                                                            </option>
                                                          ))}
                                                        </select>
                                                      </label>
                                                    </div>

                                                    <button
                                                      onClick={() => toggleAdvanced(conditionKey)}
                                                      className="mt-4 text-xs font-semibold text-blue-600 hover:text-blue-700"
                                                    >
                                                      {advanced ? '▲ Ẩn cài đặt nâng cao' : '▼ Cài đặt nâng cao'}
                                                    </button>

                                                    {advanced && (
                                                      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                                                        <div className="grid gap-3 md:grid-cols-2">
                                                          <label className="text-xs font-semibold text-slate-600">
                                                            Thông báo khi đúng
                                                            <input
                                                              value={condition.feedback?.successDetail || ''}
                                                              onChange={(e) =>
                                                                mutateCondition(pi, ti, ci, {
                                                                  feedback: {
                                                                    ...(condition.feedback || {}),
                                                                    successDetail: e.target.value,
                                                                  },
                                                                })
                                                              }
                                                              placeholder="Thành công..."
                                                              className={inputClass}
                                                            />
                                                          </label>
                                                          <label className="text-xs font-semibold text-slate-600">
                                                            Thông báo khi sai
                                                            <input
                                                              value={condition.feedback?.errorMessage || ''}
                                                              onChange={(e) =>
                                                                mutateCondition(pi, ti, ci, {
                                                                  feedback: {
                                                                    ...(condition.feedback || {}),
                                                                    errorMessage: e.target.value,
                                                                  },
                                                                })
                                                              }
                                                              placeholder="Lỗi..."
                                                              className={inputClass}
                                                            />
                                                          </label>
                                                        </div>
                                                        <label className="mt-3 block text-xs font-semibold text-slate-600">
                                                          Gợi ý cách sửa
                                                          <input
                                                            value={condition.feedback?.fixAction || ''}
                                                            onChange={(e) =>
                                                              mutateCondition(pi, ti, ci, {
                                                                feedback: {
                                                                  ...(condition.feedback || {}),
                                                                  fixAction: e.target.value,
                                                                },
                                                              })
                                                            }
                                                            placeholder="Ví dụ: Kiểm tra lại định dạng ô..."
                                                            className={inputClass}
                                                          />
                                                        </label>
                                                        <label className="mt-3 flex items-center gap-2 text-xs font-medium text-slate-600">
                                                          <input
                                                            type="checkbox"
                                                            checked={condition.stopTaskIfFailed}
                                                            onChange={(e) =>
                                                              mutateCondition(pi, ti, ci, {
                                                                stopTaskIfFailed: e.target.checked,
                                                              })
                                                            }
                                                            className="h-4 w-4 accent-blue-600"
                                                          />
                                                          Dừng Task nếu điều kiện thất bại
                                                        </label>
                                                      </div>
                                                    )}
                                                  </div>
                                                );
                                              })}

                                              {task.conditions.length === 0 && (
                                                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center">
                                                  <p className="text-sm font-medium text-slate-500">Chưa có điều kiện</p>
                                                  <p className="mt-1 text-xs text-slate-400">
                                                    Thêm condition để ruleset có thể chấm Task này.
                                                  </p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {project.tasks.length === 0 && (
                                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
                                    <p className="text-sm font-medium text-slate-500">Project chưa có Task</p>
                                    <button
                                      onClick={() => mutateProject(pi, { tasks: [emptyTask()] })}
                                      className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
                                    >
                                      + Thêm Task đầu tiên
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {selected.projects.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center">
                      <FileCode2 className="mx-auto mb-3 text-slate-300" size={34} />
                      <p className="font-semibold text-slate-700">Chưa có Project</p>
                      <p className="mt-1 text-sm text-slate-400">Tạo project đầu tiên để xây ruleset.</p>
                      <button
                        onClick={() => replaceSelected({ ...selected, projects: [emptyProject()] })}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                      >
                        <Plus size={15} /> Thêm project
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Validation tab */}
          {activeTab === 'validation' && (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Validation</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Kiểm tra cấu trúc ruleset trước khi bật Active.
                  </p>
                </div>
                <button
                  onClick={validateRuleSet}
                  className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <CheckCircle2 size={16} /> Chạy Validate
                </button>
              </div>

              {!validation && (
                <div className="mt-5 rounded-xl border border-dashed border-slate-200 px-6 py-10 text-center">
                  <CheckCircle2 className="mx-auto mb-2 text-slate-300" size={30} />
                  <p className="text-sm font-medium text-slate-600">Chưa chạy validation</p>
                  <p className="mt-1 text-xs text-slate-400">Nên Validate trước khi bật Active.</p>
                </div>
              )}

              {validation && (
                <div className="mt-5 space-y-3">
                  <div
                    className={cx(
                      'flex items-center gap-3 rounded-xl border p-4',
                      validation.isValid
                        ? 'border-emerald-200 bg-emerald-50'
                        : 'border-red-200 bg-red-50'
                    )}
                  >
                    {validation.isValid ? (
                      <CheckCircle2 className="text-emerald-600" size={22} />
                    ) : (
                      <XCircle className="text-red-600" size={22} />
                    )}
                    <div>
                      <p className={cx('text-sm font-bold', validation.isValid ? 'text-emerald-800' : 'text-red-800')}>
                        {validation.isValid ? 'Ruleset hợp lệ' : 'Ruleset có lỗi'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {validation.errors?.length || 0} lỗi · {validation.warnings?.length || 0} cảnh báo
                      </p>
                    </div>
                  </div>

                  {(validation.errors || []).length > 0 && (
                    <div className="rounded-xl border border-red-100 bg-white">
                      <div className="border-b border-red-100 bg-red-50 px-4 py-3 text-xs font-bold text-red-800">
                        Lỗi cần sửa
                      </div>
                      <div className="divide-y divide-slate-100">
                        {(validation.errors || []).map((err, i) => (
                          <div key={i} className="flex gap-3 px-4 py-3 text-xs text-red-700">
                            <XCircle size={14} className="mt-0.5 shrink-0" />
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(validation.warnings || []).length > 0 && (
                    <div className="rounded-xl border border-amber-100 bg-white">
                      <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                        Cảnh báo
                      </div>
                      <div className="divide-y divide-slate-100">
                        {(validation.warnings || []).map((warning, i) => (
                          <div key={i} className="flex gap-3 px-4 py-3 text-xs text-amber-700">
                            <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                            <span>{warning}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Test tab */}
          {activeTab === 'test' && (
            <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-lg shadow-slate-900/5">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-slate-100 p-2 text-slate-700">
                      <FileCode2 size={18} />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">Test chấm XML</h3>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Chọn project và file Office để kiểm tra kết quả chấm trước khi đưa ruleset vào sử dụng.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
                <label className="text-xs font-semibold text-slate-600">
                  Project
                  <select
                    value={gradeProjectCode}
                    onChange={(e) => setGradeProjectCode(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Chọn project</option>
                    {selected.projects.map((p) => (
                      <option key={p.projectCode} value={p.projectCode}>
                        {p.projectName || p.projectCode}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-semibold text-slate-600">
                  File bài làm
                  <input
                    type="file"
                    accept=".xlsx,.xlsm,.docx"
                    onChange={(e) => setGradeFile(e.target.files?.[0] || null)}
                    className="mt-1 block w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-2 file:py-1 file:text-xs file:font-semibold"
                  />
                </label>

                <button
                  onClick={gradeWithXmlRules}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  <Upload size={16} /> Chấm thử
                </button>
              </div>

              {renderGradeResult()}
            </section>
          )}

          {saveError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 shadow-sm">
              <div className="flex items-start gap-2">
                <XCircle size={15} className="mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold">Không thể lưu ruleset</p>
                  <p className="mt-0.5">{saveError}</p>
                </div>
                <button
                  onClick={() => setSaveError('')}
                  className="ml-auto shrink-0 text-red-400 hover:text-red-700"
                  title="Đóng"
                >
                  <XCircle size={15} />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            <AlertTriangle size={15} className="shrink-0" />
            <span>
              Hãy chạy <strong>Validate</strong> đầy đủ trước khi bật <strong>Active</strong>.
            </span>
          </div>

          {/* Sticky action bar: Save ngay tại vị trí đang nhập, không cần cuộn về đầu trang. */}
          <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3.5 shadow-2xl shadow-slate-900/15 backdrop-blur-xl">
            <div className="flex min-w-0 items-center gap-2 text-xs text-slate-500">
              <span className={cx(
                'h-2 w-2 shrink-0 rounded-full',
                saving ? 'animate-pulse bg-blue-500' : saveError ? 'bg-red-500' : 'bg-emerald-500'
              )} />
              <span className="truncate">
                {saving
                  ? 'Đang lưu thay đổi...'
                  : saveError
                    ? 'Có lỗi cần kiểm tra'
                    : selected.id
                      ? 'Đã tải ruleset · sẵn sàng lưu'
                      : 'Ruleset mới · chưa lưu'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={validateRuleSet}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2.5 text-sm font-bold text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100 disabled:opacity-50"
              >
                <CheckCircle2 size={15} /> Validate
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={saveRuleSet}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-emerald-600/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={15} className={cx(saving && 'animate-pulse')} />
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default XmlGradingRulesPage;
