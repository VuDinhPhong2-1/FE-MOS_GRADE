import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Icon } from '@bug-on/m3-expressive';
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
  PictureBulletConfig,
  ImageInsertConfig
} from '../types/xml-grading-rules.types';
import { notify } from '../utils/notify';
import PictureBulletEditor from '../components/PictureBulletEditor';
import InsertedImageEditor from '../components/InsertedImageEditor';
import { hasPermission } from '../utils/permissions';

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
    {
      value: 'insertedImage',
      label: 'Chèn đúng hình ảnh vào tài liệu',
      description:
        'Kiểm tra tài liệu có chèn đúng file ảnh yêu cầu (so khớp theo nội dung ảnh) và đúng chế độ ngắt dòng văn bản (Tight/Square/Through/Top and Bottom/Inline...) hay không.',
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
  // Ẩn/hiện riêng khối "Điều kiện đặc biệt" của từng Task, độc lập với
  // việc Task đang expand/collapse. Mặc định mở (true) để giữ hành vi cũ.
  const [expandedSpecialConditions, setExpandedSpecialConditions] = useState<Record<string, boolean>>({});
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

  const canUsePage = hasPermission(user, 'xmlrules.view');

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

  // Ẩn/hiện riêng khối "Điều kiện đặc biệt" — mặc định mở (true) nếu
  // chưa từng bấm toggle, để không thay đổi hành vi hiển thị hiện tại.
  const toggleSpecialCondition = (key: string) =>
    setExpandedSpecialConditions((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));

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
            <button onClick={() => setViewRawJson(!viewRawJson)} className="rounded-lg border border-m3-outline-variant bg-m3-surface px-3 py-1 text-xs font-medium text-m3-on-surface hover:bg-m3-surface-container">
              {viewRawJson ? "Giao diện Bảng" : "Xem JSON"}
            </button>
            <button onClick={copyJsonToClipboard} title="Sao chép JSON" className="rounded-lg border border-m3-outline-variant bg-m3-surface p-1.5 text-m3-on-surface-variant hover:bg-m3-surface-container"><Icon name="content_copy" className="text-sm" /></button>
            <button onClick={() => downloadJson()} title="Tải xuống JSON" className="rounded-lg border border-m3-outline-variant bg-m3-surface p-1.5 text-m3-on-surface-variant hover:bg-m3-surface-container"><Icon name="download" className="text-sm" /></button>
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
                              {taskPassed ? <Icon name="check_circle" className="text-xs" /> : <Icon name="cancel" className="text-xs" />}
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
    setExpandedProjects((prev) => ({ ...prev, [index]: !(prev[index] ?? false) }));

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
    'inline-flex h-9 w-9 items-center justify-center rounded-full border border-m3-outline-variant bg-m3-surface text-m3-on-surface-variant transition-colors hover:bg-m3-surface-container-high hover:text-m3-on-surface';

  return (
    <div className="min-h-full space-y-5 bg-m3-surface pb-10">
      {/* Page header */}
      <header className="sticky top-0 z-20 -mx-4 border-b border-m3-outline-variant/60 bg-m3-surface/95 px-4 py-3.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center justify-between gap-4">

          {/* Left */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-m3-primary/10 text-m3-primary">
              <Icon name="code" className="text-2xl" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-base font-black text-m3-on-surface">
                  XML Grading Rules
                </h1>

                <span
                  className={cx(
                    "hidden rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide sm:inline-flex",
                    statusBadge
                  )}
                >
                  {selected.isActive ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>

              <p className="truncate text-xs text-m3-on-surface-variant">
                Quản lý ruleset · project · task · điều kiện chấm
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex shrink-0 items-center gap-2">
            <Button
              colorStyle="filled"
              size="sm"
              onClick={() => setSelected(emptyRuleSet())}
            >
              <div className="flex items-center gap-1.5">
                <Icon name="add" className="text-base" />
                <span className="hidden sm:inline">Tạo ruleset</span>
              </div>
            </Button>
          </div>

        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[292px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="h-fit rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-4 shadow-xs xl:sticky xl:top-24 mb-2">
          <div className="mb-3 flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-m3-on-surface-variant">Rulesets</p>
              <p className="text-sm font-bold text-m3-on-surface">{ruleSets.length} bộ luật</p>
            </div>
            <button onClick={loadRuleSets} className={iconButtonClass} title="Làm mới">
              <Icon name="refresh" className={cx('text-base', loading && 'animate-spin')} />
            </button>
          </div>

          <div className="mb-3 space-y-2">
            <input
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              placeholder="Tìm theo môn..."
              className="w-full rounded-2xl border border-m3-outline-variant bg-m3-surface px-3 py-2 text-xs text-m3-on-surface outline-none transition focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20"
            />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value as 'all' | 'true' | 'false')}
              className="w-full rounded-2xl border border-m3-outline-variant bg-m3-surface px-3 py-2 text-xs text-m3-on-surface outline-none transition focus:border-m3-primary focus:ring-2 focus:ring-m3-primary/20"
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
                    'w-full rounded-2xl border p-3 text-left transition',
                    isSelected
                      ? 'border-m3-primary/50 bg-m3-primary/10 shadow-xs'
                      : 'border-transparent hover:border-m3-outline-variant/60 hover:bg-m3-surface-container-high'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-m3-on-surface">
                        {item.subject} · {item.version}
                      </div>
                      <div className="mt-0.5 text-[11px] text-m3-on-surface-variant">
                        {item.projects.length} project · {item.projects.reduce((n, p) => n + p.tasks.length, 0)} task
                      </div>
                    </div>
                    <span
                      className={cx(
                        'mt-1 h-2 w-2 shrink-0 rounded-full',
                        item.isActive ? 'bg-emerald-500' : 'bg-m3-outline-variant'
                      )}
                    />
                  </div>
                </button>
              );
            })}

            {!loading && ruleSets.length === 0 && (
              <div className="rounded-2xl border border-dashed border-m3-outline-variant/60 px-4 py-8 text-center">
                <Icon name="code" className="mx-auto mb-2 text-m3-on-surface-variant text-2xl" />
                <p className="text-xs font-bold text-m3-on-surface">Chưa có ruleset</p>
                <p className="mt-1 text-[11px] text-m3-on-surface-variant">Tạo ruleset đầu tiên để bắt đầu.</p>
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 space-y-5">
          {/* Ruleset overview */}
          <section className="rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-5 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-m3-on-surface">
                    {selected.subject || 'Chưa đặt tên'} · {selected.version || 'v1'}
                  </h2>
                  <span className={cx('rounded-full border px-2.5 py-0.5 text-[11px] font-bold', statusBadge)}>
                    {selected.isActive ? 'Đang hoạt động' : 'Đang tắt'}
                  </span>
                </div>
                <p className="text-xs text-m3-on-surface-variant">
                  {selected.id ? `ID: ${selected.id}` : 'Ruleset mới chưa được lưu'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selected.id && (
                  <button
                    onClick={() => deleteRuleSet(selected.id)}
                    title="Xóa ruleset"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-m3-error transition-colors hover:bg-m3-error-container"
                  >
                    <Icon name="delete" className="text-base" />
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
                <div key={label} className="group rounded-2xl border border-m3-outline-variant/40 bg-m3-surface px-4 py-3 transition hover:-translate-y-0.5 hover:border-m3-primary/40 hover:shadow-xs">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-m3-on-surface-variant">{label}</p>
                  <p className="mt-1 text-xl font-black text-m3-on-surface">{value}</p>
                </div>
              ))}
            </div>

            {/* Tabs */}
            <div className="mt-5 flex gap-1 overflow-x-auto border-b border-m3-outline-variant/40">
              {[
                ['editor', 'Rules editor'],
                ['validation', 'Validation'],
                ['test', 'Test XML'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={cx(
                    'border-b-2 px-3.5 py-2.5 text-xs font-bold transition',
                    activeTab === key
                      ? 'border-m3-primary text-m3-primary'
                      : 'border-transparent text-m3-on-surface-variant hover:text-m3-on-surface'
                  )}
                >
                  {label}
                  {key === 'validation' && validation && (
                    <span className={cx('ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-bold', validation.isValid ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-m3-error-container text-m3-on-error-container')}>
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
                  <label className="flex items-center gap-3 rounded-xl border border-m3-outline-variant/60 px-4 py-3 text-sm font-semibold text-m3-on-surface md:self-end">
                    <input
                      type="checkbox"
                      checked={selected.isActive}
                      onChange={(e) => replaceSelected({ ...selected, isActive: e.target.checked })}
                      className="h-4 w-4 rounded-sm accent-m3-primary"
                    />
                    Kích hoạt
                  </label>
                </div>
              </section>

              {/* Projects */}
              <section className="rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-5 shadow-xs">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-m3-on-surface">Projects</h3>
                    <p className="mt-1 text-xs text-m3-on-surface-variant">
                      Mỗi project chứa các Task và điều kiện chấm tương ứng.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = { ...selected, projects: [...selected.projects, emptyProject()] };
                      replaceSelected(next);
                      setExpandedProjects((prev) => ({ ...prev, [next.projects.length - 1]: true }));
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-m3-outline-variant bg-m3-surface px-3 py-2 text-xs font-bold text-m3-primary transition hover:bg-m3-surface-container"
                  >
                    <Icon name="add" className="text-base" /> Thêm project
                  </button>
                </div>

                <div className="space-y-4">
                  {selected.projects.map((project, pi) => {
                    const projectExpanded = expandedProjects[pi] ?? false;
                    return (
                      <div key={pi} className="group overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md p-4">
                        {/* Project header */}
                        <div className="flex items-center gap-3 border-b border-slate-100 bg-linear-to-r from-white to-slate-50 px-4 py-3.5">
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
                            <Icon name="delete" className="text-base" />
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
                                  onChange={(e) => mutateProject(pi, { maxScore: Number(e.target.value) || 0 })}
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
                                  <Icon name="add" className="text-sm" /> Thêm Task
                                </button>
                              </div>

                              <div className="space-y-2">
                                {project.tasks.map((task, ti) => {
                                  const taskKey = `${pi}-${ti}`;
                                  const taskExpanded = expandedTasks[taskKey] ?? false;
                                  const specialConditionExpanded = expandedSpecialConditions[taskKey] ?? true;

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
                                          <Icon name="delete" className="text-sm" />
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
                                              Header có thể bấm để ẩn/hiện toàn bộ nội dung bên trong
                                              (select loại, điểm, mô tả, PictureBulletEditor), độc lập
                                              với việc Task đang mở hay đóng.
                                              ========================================================= */}
                                          <div className="mt-5 rounded-2xl border border-violet-200/80 bg-white p-4 shadow-sm">
                                            <div className="flex items-start gap-3">
                                              {/* Icon */}
                                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                                <span className="text-base">✦</span>
                                              </div>

                                              {/* Title — bấm để ẩn/hiện */}
                                              <button
                                                type="button"
                                                onClick={() => toggleSpecialCondition(taskKey)}
                                                className="flex min-w-0 flex-1 items-start gap-2 text-left"
                                              >
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
                                                    để xác định. Task có thể chỉ dùng riêng điều kiện đặc
                                                    biệt (không cần Condition XML nào khác), hoặc kết hợp
                                                    cả hai — miễn tổng điểm bằng Điểm tối đa của Task.
                                                  </p>
                                                </div>

                                                <span className="mt-1 shrink-0 text-xs text-slate-400">
                                                  {specialConditionExpanded ? '▼' : '▶'}
                                                </span>
                                              </button>
                                            </div>

                                            {specialConditionExpanded && (
                                              <>
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
                                                              // Giữ lại score nếu người dùng đã nhập trước đó
                                                              // (VD: đổi qua đổi lại giữa các loại), mặc định 0.
                                                              score: task.specialCondition?.score ?? 0,
                                                              config: task.specialCondition?.config ?? {
                                                                level: 0,
                                                              },
                                                            });
                                                          }
                                                          if (value === 'insertedImage') {
                                                            updateTaskSpecialCondition(pi, ti, {
                                                              type: 'insertedImage',
                                                              score: task.specialCondition?.score ?? 0,
                                                              imageInsertConfig: task.specialCondition?.imageInsertConfig ?? {
                                                                wrapType: 'tight',
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

                                                {/* Score input cho Special Condition */}
                                                {task.specialCondition?.type && (
                                                  <div className="mt-4 grid gap-3 md:grid-cols-[160px_1fr] md:items-end">
                                                    <label className="text-xs font-semibold text-slate-600">
                                                      Điểm điều kiện đặc biệt
                                                      <input
                                                        type="number"
                                                        min={0}
                                                        value={task.specialCondition.score ?? 0}
                                                        onChange={(e) =>
                                                          updateTaskSpecialCondition(pi, ti, {
                                                            ...task.specialCondition!,
                                                            score: Number(e.target.value),
                                                          })
                                                        }
                                                        className={inputClass}
                                                      />
                                                    </label>
                                                    <p className="text-[11px] leading-4 text-slate-400">
                                                      Tổng điểm (các Conditions XML + Điều kiện đặc biệt) phải
                                                      bằng Điểm tối đa của Task ({task.maxScore}). Có thể để 0
                                                      Condition XML nếu điều kiện đặc biệt chiếm trọn điểm Task.
                                                    </p>
                                                  </div>
                                                )}

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
                                                        ...task.specialCondition!,
                                                        type: 'pictureBullet',
                                                        config,
                                                      });
                                                    }}
                                                  />
                                                )}
                                              </>
                                            )}

                                            {task.specialCondition?.type === 'insertedImage' && (
                                              <InsertedImageEditor
                                                config={task.specialCondition.imageInsertConfig}
                                                getAccessToken={getAccessToken}
                                                onChange={(imageInsertConfig: ImageInsertConfig) => {
                                                  updateTaskSpecialCondition(pi, ti, {
                                                    ...task.specialCondition!,
                                                    type: 'insertedImage',
                                                    imageInsertConfig,
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
                                                className="inline-flex items-center gap-1.5 rounded-xl bg-m3-primary px-3 py-1.5 text-xs font-semibold text-m3-on-primary hover:bg-m3-primary/90"
                                              >
                                                <Icon name="add" className="text-sm" /> Thêm điều kiện
                                              </button>
                                            </div>

                                            <div className="space-y-3">
                                              {task.conditions.map((condition, ci) => {
                                                const conditionKey = `${pi}-${ti}-${ci}`;
                                                const advanced = showAdvanced[conditionKey] ?? false;

                                                return (
                                                  <div key={conditionKey} className="rounded-xl border border-m3-outline-variant/60 bg-m3-surface p-4">
                                                    <div className="flex items-start justify-between gap-3">
                                                      <div className="flex min-w-0 items-center gap-2">
                                                        <span className="rounded-md bg-m3-primary/10 px-2 py-1 font-mono text-[11px] font-bold text-m3-primary">
                                                          {condition.conditionId || `C${String(ci + 1).padStart(2, '0')}`}
                                                        </span>
                                                        <span className="text-xs text-m3-on-surface-variant">
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
                                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-m3-on-surface-variant/60 hover:bg-m3-error/10 hover:text-m3-error"
                                                      >
                                                        <Icon name="delete" className="text-sm" />
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
                                                  <p className="text-sm font-medium text-slate-500">
                                                    {task.specialCondition
                                                      ? 'Không có điều kiện XML — Task chỉ dùng điều kiện đặc biệt.'
                                                      : 'Chưa có điều kiện'}
                                                  </p>
                                                  <p className="mt-1 text-xs text-slate-400">
                                                    {task.specialCondition
                                                      ? 'Hợp lệ nếu điểm Điều kiện đặc biệt bằng Điểm tối đa của Task.'
                                                      : 'Thêm condition hoặc bật Điều kiện đặc biệt để ruleset có thể chấm Task này.'}
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
                    <div className="rounded-2xl border border-dashed border-m3-outline-variant/60 px-6 py-12 text-center bg-m3-surface">
                      <Icon name="code" className="mx-auto mb-3 text-4xl text-m3-on-surface-variant/40" />
                      <p className="font-semibold text-m3-on-surface">Chưa có Project</p>
                      <p className="mt-1 text-sm text-m3-on-surface-variant">Tạo project đầu tiên để xây ruleset.</p>
                      <button
                        onClick={() => replaceSelected({ ...selected, projects: [emptyProject()] })}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-m3-primary px-3.5 py-2 text-sm font-semibold text-m3-on-primary hover:bg-m3-primary/90"
                      >
                        <Icon name="add" className="text-base" /> Thêm project
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Validation tab */}
          {activeTab === 'validation' && (
            <section className="rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-5 shadow-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-m3-on-surface">Validation</h3>
                  <p className="mt-1 text-xs text-m3-on-surface-variant">
                    Kiểm tra cấu trúc ruleset trước khi bật Active.
                  </p>
                </div>
                <button
                  onClick={validateRuleSet}
                  className="inline-flex items-center gap-2 rounded-xl bg-m3-primary px-3.5 py-2 text-sm font-semibold text-m3-on-primary hover:bg-m3-primary/90"
                >
                  <Icon name="check_circle" className="text-base" /> Chạy Validate
                </button>
              </div>

              {!validation && (
                <div className="mt-5 rounded-2xl border border-dashed border-m3-outline-variant/60 bg-m3-surface px-6 py-10 text-center">
                  <Icon name="check_circle" className="mx-auto mb-2 text-3xl text-m3-on-surface-variant/40" />
                  <p className="text-sm font-medium text-m3-on-surface">Chưa chạy validation</p>
                  <p className="mt-1 text-xs text-m3-on-surface-variant">Nên Validate trước khi bật Active.</p>
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
                      <Icon name="check_circle" className="text-emerald-600 text-2xl" />
                    ) : (
                      <Icon name="cancel" className="text-m3-error text-2xl" />
                    )}
                    <div>
                      <p className={cx('text-sm font-bold', validation.isValid ? 'text-emerald-800' : 'text-m3-error')}>
                        {validation.isValid ? 'Ruleset hợp lệ' : 'Ruleset có lỗi'}
                      </p>
                      <p className="text-xs text-m3-on-surface-variant">
                        {validation.errors?.length || 0} lỗi · {validation.warnings?.length || 0} cảnh báo
                      </p>
                    </div>
                  </div>

                  {(validation.errors || []).length > 0 && (
                    <div className="rounded-2xl border border-m3-error/20 bg-m3-surface overflow-hidden">
                      <div className="border-b border-m3-error/10 bg-m3-error-container/40 px-4 py-3 text-xs font-bold text-m3-on-error-container">
                        Lỗi cần sửa
                      </div>
                      <div className="divide-y divide-m3-outline-variant/40">
                        {(validation.errors || []).map((err, i) => (
                          <div key={i} className="flex gap-3 px-4 py-3 text-xs text-m3-error">
                            <Icon name="cancel" className="text-sm mt-0.5 shrink-0" />
                            <span>{err}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(validation.warnings || []).length > 0 && (
                    <div className="rounded-2xl border border-amber-200/60 bg-m3-surface overflow-hidden">
                      <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                        Cảnh báo
                      </div>
                      <div className="divide-y divide-m3-outline-variant/40">
                        {(validation.warnings || []).map((warning, i) => (
                          <div key={i} className="flex gap-3 px-4 py-3 text-xs text-amber-700">
                            <Icon name="warning" className="text-sm mt-0.5 shrink-0" />
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
            <section className="rounded-3xl border border-m3-outline-variant/60 bg-m3-surface-container p-5 shadow-xs">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-m3-surface p-2 text-m3-on-surface">
                      <Icon name="code" className="text-lg" />
                    </div>
                    <h3 className="text-sm font-bold text-m3-on-surface">Test chấm XML</h3>
                  </div>
                  <p className="mt-1 text-xs text-m3-on-surface-variant">
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
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-m3-primary px-4 py-2 text-sm font-semibold text-m3-on-primary hover:bg-m3-primary/90"
                >
                  <Icon name="upload" className="text-base" /> Chấm thử
                </button>
              </div>

              {renderGradeResult()}
            </section>
          )}

          {saveError && (
            <div className="rounded-2xl border border-m3-error/20 bg-m3-error-container/20 px-4 py-3 text-xs text-m3-on-error-container shadow-xs">
              <div className="flex items-start gap-2">
                <Icon name="cancel" className="mt-0.5 shrink-0 text-base text-m3-error" />
                <div className="min-w-0">
                  <p className="font-bold">Không thể lưu ruleset</p>
                  <p className="mt-0.5">{saveError}</p>
                </div>
                <button
                  onClick={() => setSaveError('')}
                  className="ml-auto shrink-0 text-m3-on-error-container/60 hover:text-m3-error"
                  title="Đóng"
                >
                  <Icon name="close" className="text-base" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-2xl border border-amber-200/60 bg-amber-500/10 px-4 py-3 text-xs text-amber-900 dark:text-amber-200">
            <Icon name="warning" className="shrink-0 text-base text-amber-600" />
            <span>
              Hãy chạy <strong>Validate</strong> đầy đủ trước khi bật <strong>Active</strong>.
            </span>
          </div>

          {/* Sticky action bar: Save ngay tại vị trí đang nhập, không cần cuộn về đầu trang. */}
          <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-m3-outline-variant/60 bg-m3-surface/90 px-4 py-3.5 shadow-xl backdrop-blur-xl">
            <div className="flex min-w-0 items-center gap-2 text-xs text-m3-on-surface-variant">
              <span className={cx(
                'h-2 w-2 shrink-0 rounded-full',
                saving ? 'animate-pulse bg-m3-primary' : saveError ? 'bg-m3-error' : 'bg-emerald-500'
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
                className="inline-flex items-center gap-2 rounded-xl border border-m3-outline-variant bg-m3-surface-container px-3.5 py-2.5 text-sm font-bold text-m3-primary transition hover:bg-m3-surface-container-high disabled:opacity-50"
              >
                <Icon name="check_circle" className="text-base" /> Validate
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={saveRuleSet}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-m3-primary px-4 py-2.5 text-sm font-bold text-m3-on-primary shadow-sm transition hover:bg-m3-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Icon name="save" className={cx('text-base', saving && 'animate-pulse')} />
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