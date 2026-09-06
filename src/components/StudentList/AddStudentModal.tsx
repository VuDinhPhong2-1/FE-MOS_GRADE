import { useState, useEffect, type FormEvent } from 'react';
import { Icon, ProgressIndicator } from '@bug-on/m3-expressive';
import type { AddStudentForm, CompetencyLevel } from './types';
import { VALID_STATUSES, VALID_COMPETENCY_LEVELS } from './types';
import studentService from '../../services/student.service';

interface AddStudentModalProps {
  isOpen: boolean;
  classId: string;
  readOnly: boolean;
  getAccessToken: (forceRefresh?: boolean) => Promise<string | null>;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const initialForm: AddStudentForm = {
  middleName: '',
  firstName: '',
  status: 'Active',
  competencyLevel: '',
  notes: '',
  thi: false,
};

export const AddStudentModal = ({
  isOpen,
  classId,
  readOnly,
  getAccessToken,
  onClose,
  onSuccess,
}: AddStudentModalProps) => {
  const [form, setForm] = useState<AddStudentForm>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setForm(initialForm);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (readOnly) {
      setError('Bạn chỉ có quyền xem lớp này.');
      return;
    }

    const middleName = form.middleName.trim();
    const firstName = form.firstName.trim();
    if (!firstName) {
      setError('Vui lòng nhập tên.');
      return;
    }
    if (!VALID_STATUSES.includes(form.status as (typeof VALID_STATUSES)[number])) {
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
      await studentService.createStudent(
        {
          middleName,
          firstName,
          status: form.status,
          competencyLevel: form.competencyLevel,
          notes,
          thi: form.thi,
          classId,
        },
        getAccessToken
      );
      onSuccess('Thêm học sinh thành công.');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thêm học sinh.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Thêm học sinh</h2>
          <button
            type="button"
            onClick={onClose}
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
              value={form.middleName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, middleName: event.target.value }))
              }
              disabled={isSubmitting}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Nguyễn Văn"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên</label>
            <input
              value={form.firstName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, firstName: event.target.value }))
              }
              disabled={isSubmitting}
              className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="An"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái</label>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value }))
              }
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
                checked={form.thi}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, thi: event.target.checked }))
                }
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Student takes exam
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Đánh giá năng lực</label>
            <select
              value={form.competencyLevel}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  competencyLevel: event.target.value as CompetencyLevel,
                }))
              }
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
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
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
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <ProgressIndicator
                    variant="circular"
                    shape="wavy"
                    showTrack
                    size={15}
                    aria-label="Đang thêm..."
                  />
                  Đang thêm...
                </>
              ) : (
                'Thêm học sinh'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
