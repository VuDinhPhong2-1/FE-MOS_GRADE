import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Icon, ProgressIndicator } from '@bug-on/m3-expressive';
import type { Student } from '../../types/student.types';
import type { EditStudentForm, CompetencyLevel } from './types';
import { VALID_STATUSES, VALID_COMPETENCY_LEVELS } from './types';
import studentService from '../../services/student.service';

interface EditStudentModalProps {
  student: Student | null;
  isOpen: boolean;
  classId: string;
  readOnly: boolean;
  getAccessToken: (forceRefresh?: boolean) => Promise<string | null>;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const defaultForm: EditStudentForm = {
  middleName: '',
  firstName: '',
  status: 'Active',
  competencyLevel: '',
  notes: '',
  thi: false,
  classId: '',
};

export const EditStudentModal = ({
  student,
  isOpen,
  classId,
  readOnly,
  getAccessToken,
  onClose,
  onSuccess,
}: EditStudentModalProps) => {
  const [form, setForm] = useState<EditStudentForm>(defaultForm);
  const [initialForm, setInitialForm] = useState<EditStudentForm>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && student) {
      const preset: EditStudentForm = {
        middleName: student.middleName || '',
        firstName: student.firstName || '',
        status: VALID_STATUSES.includes((student.status || '') as (typeof VALID_STATUSES)[number])
          ? (student.status as string)
          : student.isActive
            ? 'Active'
            : 'Inactive',
        competencyLevel: (student.competencyLevel || '') as CompetencyLevel,
        notes: student.notes || '',
        thi: Boolean(student.thi),
        classId: student.classId || classId,
      };
      setForm(preset);
      setInitialForm(preset);
      setError('');
    }
  }, [isOpen, student, classId]);

  const hasUnsavedChanges =
    form.middleName !== initialForm.middleName ||
    form.firstName !== initialForm.firstName ||
    form.status !== initialForm.status ||
    form.competencyLevel !== initialForm.competencyLevel ||
    form.notes !== initialForm.notes ||
    form.thi !== initialForm.thi ||
    form.classId !== initialForm.classId;

  useEffect(() => {
    if (!isOpen || !hasUnsavedChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, hasUnsavedChanges]);

  if (!isOpen || !student) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    if (hasUnsavedChanges && !confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng?')) {
      return;
    }
    onClose();
  };

  const handleFieldChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name } = event.target;
    const value =
      event.target instanceof HTMLInputElement && event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value;
    setError('');
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (readOnly) {
      setError('Bạn chỉ có quyền xem lớp này.');
      return;
    }

    const middleName = form.middleName.trim();
    const firstName = form.firstName.trim();
    const status = form.status.trim();

    if (!firstName) {
      setError('Vui lòng nhập tên.');
      return;
    }

    if (!VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      setError('Trạng thái không hợp lệ.');
      return;
    }

    if (form.competencyLevel && !VALID_COMPETENCY_LEVELS.includes(form.competencyLevel)) {
      setError('Mức năng lực không hợp lệ.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const notes = form.notes.trim();
      await studentService.updateStudent(
        student.id,
        {
          middleName,
          firstName,
          status,
          competencyLevel: form.competencyLevel,
          notes,
          thi: form.thi,
          classId: form.classId || classId,
        },
        getAccessToken
      );
      onSuccess('Cập nhật học sinh thành công.');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật học sinh thất bại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Sửa học sinh</h2>
          <button
            type="button"
            onClick={handleClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100"
            disabled={isSubmitting}
          >
            <Icon name="close" variant="rounded" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Họ và tên đệm</label>
            <input
              name="middleName"
              value={form.middleName}
              onChange={handleFieldChange}
              disabled={isSubmitting}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Nguyễn Văn"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên</label>
            <input
              name="firstName"
              value={form.firstName}
              onChange={handleFieldChange}
              disabled={isSubmitting}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="A"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái</label>
            <select
              name="status"
              value={form.status}
              onChange={handleFieldChange}
              disabled={isSubmitting}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="Active">Hoạt động</option>
              <option value="Inactive">Ngừng hoạt động</option>
            </select>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                name="thi"
                checked={form.thi}
                onChange={handleFieldChange}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Student takes exam
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Đánh giá năng lực</label>
            <select
              name="competencyLevel"
              value={form.competencyLevel}
              onChange={handleFieldChange}
              disabled={isSubmitting}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Chưa đánh giá</option>
              {VALID_COMPETENCY_LEVELS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Ghi chú</label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleFieldChange}
              disabled={isSubmitting}
              rows={3}
              maxLength={500}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Nhận xét thêm về học sinh..."
            />
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <ProgressIndicator
                    variant="circular"
                    shape="wavy"
                    showTrack
                    size={15}
                    aria-label="Đang lưu..."
                  />
                  Đang lưu...
                </>
              ) : (
                'Lưu'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
