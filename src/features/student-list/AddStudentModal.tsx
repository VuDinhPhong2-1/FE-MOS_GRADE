import { useState, useEffect, type FormEvent, memo } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  Icon,
  IconButton,
  Select,
  TextField,
  type SelectOption,
} from '@bug-on/m3-expressive';
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

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'Active', label: 'Hoạt động' },
  { value: 'Inactive', label: 'Ngừng hoạt động' },
];

const COMPETENCY_OPTIONS: SelectOption[] = [
  { value: '', label: 'Chưa đánh giá' },
  ...VALID_COMPETENCY_LEVELS.map((level) => ({ value: level, label: level })),
];

const AddStudentModalComponent = ({
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal open={isOpen}>
        <DialogOverlay />
        <DialogContent
          hideCloseButton
          className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl transform-gpu will-change-transform"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-m3-outline-variant/40 px-6 pt-5 pb-3">
            <DialogHeader className="mb-0 flex-row items-center gap-3 space-y-0 text-left">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-m3-primary text-m3-on-primary">
                <Icon name="person_add" size={20} />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-m3-on-surface">
                  Thêm học sinh
                </DialogTitle>
                <DialogDescription className="text-xs text-m3-on-surface-variant">
                  Nhập thông tin học sinh mới vào lớp học
                </DialogDescription>
              </div>
            </DialogHeader>
            <IconButton
              type="button"
              size="sm"
              colorStyle="standard"
              aria-label="Đóng"
              onClick={onClose}
              disabled={isSubmitting}
            >
              <Icon name="close" />
            </IconButton>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
              {error && (
                <div className="flex items-center gap-2 rounded-2xl bg-m3-error-container p-3 text-xs font-medium text-m3-on-error-container">
                  <Icon name="error" size={16} />
                  <span>{error}</span>
                </div>
              )}

              <TextField
                variant="outlined"
                label="Họ và tên đệm"
                placeholder="VD: Nguyễn Văn"
                value={form.middleName}
                onChange={(val) => {
                  if (error) setError('');
                  setForm((prev) => ({ ...prev, middleName: val }));
                }}
                disabled={isSubmitting}
                fullWidth
                className="pt-2"
              />

              <TextField
                required
                variant="outlined"
                label="Tên"
                placeholder="VD: An"
                value={form.firstName}
                onChange={(val) => {
                  if (error) setError('');
                  setForm((prev) => ({ ...prev, firstName: val }));
                }}
                disabled={isSubmitting}
                fullWidth
                className="pt-4"
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select
                  variant="outlined"
                  label="Trạng thái"
                  options={STATUS_OPTIONS}
                  value={form.status}
                  onChange={(val) => {
                    if (error) setError('');
                    setForm((prev) => ({ ...prev, status: val }));
                  }}
                  disabled={isSubmitting}
                  fullWidth
                  menuVariant="baseline"
                  colorVariant="standard"
                  className="pt-4"
                />

                <Select
                  variant="outlined"
                  label="Đánh giá năng lực"
                  options={COMPETENCY_OPTIONS}
                  value={form.competencyLevel}
                  onChange={(val) => {
                    if (error) setError('');
                    setForm((prev) => ({
                      ...prev,
                      competencyLevel: val as CompetencyLevel,
                    }));
                  }}
                  disabled={isSubmitting}
                  fullWidth
                  menuVariant="baseline"
                  colorVariant="standard"
                  className="pt-4"
                />
              </div>

              <Checkbox
                checked={form.thi}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, thi: checked }))
                }
                disabled={isSubmitting}
                label="Học sinh dự thi"
              />

              <TextField
                type="textarea"
                rows={3}
                variant="outlined"
                label="Ghi chú"
                placeholder="Nhận xét thêm về học sinh..."
                value={form.notes}
                onChange={(val) => {
                  if (error) setError('');
                  setForm((prev) => ({ ...prev, notes: val }));
                }}
                disabled={isSubmitting}
                maxLength={500}
                fullWidth
                className="pt-4"
              />
            </DialogBody>

            <DialogFooter className="flex justify-end gap-2 border-t border-m3-outline-variant/40 px-6 py-4">
              <Button
                type="button"
                colorStyle="text"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                colorStyle="filled"
                disabled={isSubmitting}
                loading={isSubmitting}
                icon={!isSubmitting ? <Icon name="person_add" size={18} /> : undefined}
              >
                {isSubmitting ? 'Đang thêm...' : 'Thêm học sinh'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};

export const AddStudentModal = memo(AddStudentModalComponent);

