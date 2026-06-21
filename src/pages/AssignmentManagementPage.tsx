import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Archive,
  BookOpenCheck,
  ClipboardList,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { assignmentService } from '../services/assignment.service';
import { classService } from '../services/class.service';
import type {
  Assignment,
  CreateAssignmentRequest,
  GradingEndpointInfo,
  UpdateAssignmentRequest,
} from '../types/assignment.types';
import type { Class } from '../types/class.types';

type SubjectCode = 'excel' | 'word' | 'ppt';
type ExamTypeCode = 'otth' | 'onthi' | 'gmetrix';
type GradingTypeCode = 'auto' | 'manual';

interface AssignmentFormState {
  name: string;
  description: string;
  maxScore: string;
  subject: SubjectCode;
  examType: ExamTypeCode;
  projectCode: string;
  gradingType: GradingTypeCode;
  gradingApiEndpoint: string;
}

const emptyForm: AssignmentFormState = {
  name: '',
  description: '',
  maxScore: '100',
  subject: 'excel',
  examType: 'otth',
  projectCode: '',
  gradingType: 'auto',
  gradingApiEndpoint: '',
};

const subjectLabels: Record<SubjectCode, string> = {
  excel: 'Excel',
  word: 'Word',
  ppt: 'PowerPoint',
};

const examTypeLabels: Record<ExamTypeCode, string> = {
  otth: 'Ôn tập thực hành',
  onthi: 'Ôn thi',
  gmetrix: 'GMetrix',
};

const gradingTypeLabels: Record<GradingTypeCode, string> = {
  auto: 'Tự động',
  manual: 'Thủ công',
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const buildEndpointLabel = (endpoint: GradingEndpointInfo) => {
  const parts = [endpoint.displayName || endpoint.endpoint];

  if (endpoint.practiceName) {
    parts.push(endpoint.practiceName);
  }

  if (typeof endpoint.maxScore === 'number') {
    parts.push(`${endpoint.maxScore} điểm`);
  }

  return parts.join(' • ');
};

const getProjectCodeFromEndpoint = (endpoint?: string) => {
  const match = endpoint?.match(/project(\d{1,3})/i);
  return match ? `project${match[1].padStart(2, '0')}` : '';
};

const buildDefaultNameFromEndpoint = (endpoint?: GradingEndpointInfo) => {
  if (!endpoint) return '';
  return endpoint.displayName || endpoint.endpoint;
};

const AssignmentManagementPage = () => {
  const { getAccessToken } = useAuth();

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [gradingEndpoints, setGradingEndpoints] = useState<GradingEndpointInfo[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isLoadingEndpoints, setIsLoadingEndpoints] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionAssignmentId, setActionAssignmentId] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const [form, setForm] = useState<AssignmentFormState>(emptyForm);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const endpointOptions = useMemo(() => {
    const currentSubject = form.subject;
    return gradingEndpoints.filter((endpoint) => {
      const subject = (endpoint.subject || endpoint.endpoint.split('/')[0] || '').toLowerCase();
      return !subject || subject === currentSubject;
    });
  }, [form.subject, gradingEndpoints]);

  const filteredAssignments = useMemo(() => {
    const keyword = normalizeText(searchKeyword.trim());

    if (!keyword) {
      return assignments;
    }

    return assignments.filter((assignment) => {
      const haystack = normalizeText(
        [
          assignment.name,
          assignment.description || '',
          assignment.projectCode || '',
          assignment.gradingApiEndpoint || '',
          assignment.subject,
          assignment.examType,
        ].join(' ')
      );

      return haystack.includes(keyword);
    });
  }, [assignments, searchKeyword]);

  const activeCount = useMemo(
    () => assignments.filter((assignment) => assignment.isActive).length,
    [assignments]
  );

  const loadClasses = async () => {
    setIsLoadingClasses(true);
    setLoadError(null);

    try {
      const data = await classService.getAllClasses(getAccessToken);
      setClasses(data);
      setSelectedClassId((current) => {
        if (current && data.some((item) => item.id === current)) {
          return current;
        }

        return data[0]?.id || '';
      });
    } catch (error) {
      setClasses([]);
      setSelectedClassId('');
      setLoadError(error instanceof Error ? error.message : 'Không tải được danh sách lớp.');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const loadAssignments = async (classId: string) => {
    if (!classId) {
      setAssignments([]);
      return;
    }

    setIsLoadingAssignments(true);
    setLoadError(null);

    try {
      const data = await assignmentService.getByClass(classId, getAccessToken, {
        includeInactive,
      });
      setAssignments(data);
    } catch (error) {
      setAssignments([]);
      setLoadError(error instanceof Error ? error.message : 'Không tải được danh sách bài tập.');
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const loadGradingEndpoints = async () => {
    setIsLoadingEndpoints(true);

    try {
      const data = await assignmentService.getGradingEndpoints(getAccessToken);
      setGradingEndpoints(data);
    } catch {
      setGradingEndpoints([]);
    } finally {
      setIsLoadingEndpoints(false);
    }
  };

  useEffect(() => {
    void loadClasses();
    void loadGradingEndpoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAccessToken]);

  useEffect(() => {
    void loadAssignments(selectedClassId);
    setEditingAssignment(null);
    setForm(emptyForm);
    setActionMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, includeInactive]);

  const updateForm = <K extends keyof AssignmentFormState>(key: K, value: AssignmentFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEndpointChange = (endpointValue: string) => {
    const endpoint = gradingEndpoints.find((item) => item.endpoint === endpointValue);

    setForm((prev) => ({
      ...prev,
      gradingApiEndpoint: endpointValue,
      projectCode: getProjectCodeFromEndpoint(endpointValue) || prev.projectCode,
      maxScore: endpoint?.maxScore ? String(endpoint.maxScore) : prev.maxScore,
      name: prev.name.trim() ? prev.name : buildDefaultNameFromEndpoint(endpoint),
    }));
  };

  const resetForm = () => {
    setEditingAssignment(null);
    setForm(emptyForm);
    setActionMessage(null);
  };

  const startEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setActionMessage(null);
    setForm({
      name: assignment.name || '',
      description: assignment.description || '',
      maxScore: String(assignment.maxScore ?? 100),
      subject: assignment.subject,
      examType: assignment.examType,
      projectCode: assignment.projectCode || getProjectCodeFromEndpoint(assignment.gradingApiEndpoint),
      gradingType: assignment.gradingType,
      gradingApiEndpoint: assignment.gradingApiEndpoint || '',
    });
  };

  const buildPayload = (): CreateAssignmentRequest => {
    const maxScore = Number(form.maxScore);

    if (!selectedClassId) {
      throw new Error('Vui lòng chọn lớp trước khi lưu bài tập.');
    }

    if (!form.name.trim()) {
      throw new Error('Vui lòng nhập tên bài tập.');
    }

    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      throw new Error('Điểm tối đa phải là số lớn hơn 0.');
    }

    if (form.gradingType === 'auto' && !form.gradingApiEndpoint.trim()) {
      throw new Error('Bài tập tự động cần chọn endpoint chấm điểm.');
    }

    return {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      classId: selectedClassId,
      maxScore,
      subject: form.subject,
      examType: form.examType,
      projectCode: form.projectCode.trim() || undefined,
      gradingType: form.gradingType,
      gradingApiEndpoint: form.gradingType === 'auto' ? form.gradingApiEndpoint.trim() : undefined,
    };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const payload = buildPayload();

      if (editingAssignment) {
        const updatePayload: UpdateAssignmentRequest = {
          name: payload.name,
          description: payload.description,
          maxScore: payload.maxScore,
          subject: payload.subject,
          examType: payload.examType,
          projectCode: payload.projectCode,
          gradingType: payload.gradingType,
          gradingApiEndpoint: payload.gradingApiEndpoint,
        };

        await assignmentService.update(editingAssignment.id, updatePayload, getAccessToken);
        setActionMessage('Đã cập nhật bài tập.');
      } else {
        await assignmentService.create(payload, getAccessToken);
        setActionMessage('Đã tạo bài tập mới.');
      }

      resetForm();
      await loadAssignments(selectedClassId);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Không thể lưu bài tập.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (assignment: Assignment) => {
    setActionAssignmentId(assignment.id);
    setActionMessage(null);

    try {
      await assignmentService.update(
        assignment.id,
        { isActive: !assignment.isActive },
        getAccessToken
      );
      setActionMessage(assignment.isActive ? 'Đã lưu trữ bài tập.' : 'Đã khôi phục bài tập.');
      await loadAssignments(selectedClassId);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái bài tập.');
    } finally {
      setActionAssignmentId(null);
    }
  };

  const handleDelete = async (assignment: Assignment) => {
    const confirmed = window.confirm(
      `Xóa bài tập "${assignment.name}"? Thao tác này phụ thuộc vào chính sách xóa hiện tại của backend.`
    );

    if (!confirmed) {
      return;
    }

    setActionAssignmentId(assignment.id);
    setActionMessage(null);

    try {
      await assignmentService.delete(assignment.id, getAccessToken);
      setActionMessage('Đã xóa bài tập.');
      if (editingAssignment?.id === assignment.id) {
        resetForm();
      }
      await loadAssignments(selectedClassId);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Không thể xóa bài tập.');
    } finally {
      setActionAssignmentId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <ClipboardList className="h-4 w-4" />
              Quản lý bài tập
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Bài tập theo lớp</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Tạo, chỉnh sửa, lưu trữ hoặc xóa bài tập cho từng lớp. Trang này dùng lại contract
              assignment hiện có và tự động chuẩn hóa endpoint chấm điểm giống màn hình chấm điểm.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void loadClasses();
              void loadGradingEndpoints();
              void loadAssignments(selectedClassId);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoadingClasses || isLoadingAssignments || isLoadingEndpoints}
          >
            <RefreshCw
              className={`h-4 w-4 ${
                isLoadingClasses || isLoadingAssignments || isLoadingEndpoints ? 'animate-spin' : ''
              }`}
            />
            Tải lại
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Lớp</span>
            <select
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              disabled={isLoadingClasses}
            >
              {classes.length === 0 ? (
                <option value="">Không có lớp</option>
              ) : (
                classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Tìm kiếm</span>
            <input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tìm theo tên, mô tả, project hoặc endpoint..."
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span>
            Lớp đang chọn:{' '}
            <strong className="text-slate-900">{selectedClass?.name || 'Chưa chọn lớp'}</strong>
          </span>
          <span className="hidden text-slate-300 sm:inline">•</span>
          <span>
            Đang hoạt động: <strong className="text-emerald-700">{activeCount}</strong>/
            {assignments.length}
          </span>
          <label className="ml-auto inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(event) => setIncludeInactive(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Hiện bài đã lưu trữ
          </label>
        </div>

        {loadError && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Danh sách bài tập</h2>
              <p className="text-sm text-slate-500">
                {filteredAssignments.length} bài tập phù hợp bộ lọc hiện tại
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoadingAssignments ? (
              <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang tải bài tập...
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <BookOpenCheck className="mx-auto h-12 w-12 text-slate-300" />
                <h3 className="mt-3 text-base font-semibold text-slate-800">Chưa có bài tập</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Tạo bài tập mới bằng form bên phải để giáo viên có thể quản lý và chấm điểm.
                </p>
              </div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-base font-bold text-slate-900">{assignment.name}</h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            assignment.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {assignment.isActive ? 'Đang hoạt động' : 'Đã lưu trữ'}
                        </span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {subjectLabels[assignment.subject]}
                        </span>
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
                          {gradingTypeLabels[assignment.gradingType]}
                        </span>
                      </div>

                      {assignment.description && (
                        <p className="mt-2 text-sm text-slate-600">{assignment.description}</p>
                      )}

                      <div className="mt-3 grid gap-2 text-sm text-slate-500 md:grid-cols-2">
                        <div>
                          Điểm tối đa: <strong className="text-slate-800">{assignment.maxScore}</strong>
                        </div>
                        <div>
                          Loại bài: <strong className="text-slate-800">{examTypeLabels[assignment.examType]}</strong>
                        </div>
                        <div>
                          Project:{' '}
                          <strong className="text-slate-800">
                            {assignment.projectCode || getProjectCodeFromEndpoint(assignment.gradingApiEndpoint) || '—'}
                          </strong>
                        </div>
                        <div className="truncate">
                          Endpoint:{' '}
                          <strong className="text-slate-800">
                            {assignment.gradingApiEndpoint || 'Không dùng'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(assignment)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Edit3 className="h-4 w-4" />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(assignment)}
                        disabled={actionAssignmentId === assignment.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {assignment.isActive ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                        {assignment.isActive ? 'Lưu trữ' : 'Khôi phục'}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(assignment)}
                        disabled={actionAssignmentId === assignment.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingAssignment ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {editingAssignment
                  ? 'Cập nhật thông tin bài tập đã chọn.'
                  : 'Tạo bài tập cho lớp đang chọn.'}
              </p>
            </div>

            {editingAssignment && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                aria-label="Hủy chỉnh sửa"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Tên bài tập</span>
              <input
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Ví dụ: Project 01 - Excel"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Mô tả</span>
              <textarea
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Ghi chú nội dung bài tập..."
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Môn</span>
                <select
                  value={form.subject}
                  onChange={(event) => updateForm('subject', event.target.value as SubjectCode)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {Object.entries(subjectLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Loại bài</span>
                <select
                  value={form.examType}
                  onChange={(event) => updateForm('examType', event.target.value as ExamTypeCode)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {Object.entries(examTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Điểm tối đa</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxScore}
                  onChange={(event) => updateForm('maxScore', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Project code</span>
                <input
                  value={form.projectCode}
                  onChange={(event) => updateForm('projectCode', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="project01"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Kiểu chấm</span>
              <select
                value={form.gradingType}
                onChange={(event) => updateForm('gradingType', event.target.value as GradingTypeCode)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {Object.entries(gradingTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {form.gradingType === 'auto' && (
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Endpoint chấm điểm</span>
                <select
                  value={form.gradingApiEndpoint}
                  onChange={(event) => handleEndpointChange(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  disabled={isLoadingEndpoints}
                >
                  <option value="">Chọn endpoint</option>
                  {endpointOptions.map((endpoint) => (
                    <option key={endpoint.endpoint} value={endpoint.endpoint}>
                      {buildEndpointLabel(endpoint)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {actionMessage && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {actionMessage}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting || !selectedClassId}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingAssignment ? 'Lưu thay đổi' : 'Tạo bài tập'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                Form mới
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AssignmentManagementPage;