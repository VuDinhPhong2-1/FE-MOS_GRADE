import React from 'react';
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
} from '@bug-on/m3-expressive';
import type { Class, CreateClassRequest } from '../../../types/class.types';
import { GRADE_OPTIONS } from '../utils/classlist.utils';

interface ClassFormModalProps {
  open: boolean;
  onClose: () => void;
  editingClass: Class | null;
  formData: CreateClassRequest;
  setFormData: React.Dispatch<React.SetStateAction<CreateClassRequest>>;
  isActive: boolean;
  setIsActive: (value: boolean) => void;
  formError: string;
  setFormError: (err: string) => void;
  isSubmitting: boolean;
  onSubmit: (e: React.FormEvent) => void;
  attendanceSpreadsheetId?: string | null;
  isSubmitDisabled: boolean;
}

export const ClassFormModal: React.FC<ClassFormModalProps> = ({
  open,
  onClose,
  editingClass,
  formData,
  setFormData,
  isActive,
  setIsActive,
  formError,
  setFormError,
  isSubmitting,
  onSubmit,
  attendanceSpreadsheetId,
  isSubmitDisabled,
}) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogPortal open={open}>
        <DialogOverlay />
        <DialogContent
          hideCloseButton
          className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-lg flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <DialogHeader className="mb-0 flex-row items-center gap-3 space-y-0 text-left">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-m3-primary/10 text-m3-primary">
                <Icon name={editingClass ? 'edit_square' : 'add_circle'} className="text-xl" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-m3-on-surface">
                  {editingClass ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}
                </DialogTitle>
                <DialogDescription className="text-xs text-m3-on-surface-variant">
                  {editingClass
                    ? 'Cập nhật thông tin chi tiết của lớp học'
                    : 'Thiết lập lớp học mới cho trường'}
                </DialogDescription>
              </div>
            </DialogHeader>
            <IconButton
              type="button"
              size="sm"
              colorStyle="standard"
              aria-label="Đóng hộp thoại lớp"
              onClick={onClose}
            >
              <Icon name="close" className="text-lg" />
            </IconButton>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <DialogBody className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 pt-3 pb-6">
              {formError && (
                <div className="flex items-center gap-2 rounded-2xl bg-m3-error-container p-3 text-xs font-medium text-m3-on-error-container">
                  <Icon name="error" size={16} />
                  <span>{formError}</span>
                </div>
              )}

              <TextField
                variant="outlined"
                label="Tên lớp *"
                placeholder="VD: Lớp 10A1"
                value={formData.name}
                onChange={(val) => {
                  if (formError) setFormError('');
                  setFormData((prev) => ({ ...prev, name: val }));
                }}
                disabled={isSubmitting}
                leadingIcon={<Icon name="class" />}
                fullWidth
                className="pt-2"
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Select
                  variant="outlined"
                  label="Khối"
                  options={GRADE_OPTIONS}
                  value={formData.grade || ''}
                  onChange={(val) => {
                    if (formError) setFormError('');
                    setFormData((prev) => ({ ...prev, grade: val }));
                  }}
                  disabled={isSubmitting}
                  fullWidth
                  className="pt-2"
                />

                <TextField
                  variant="outlined"
                  label="Sĩ số tối đa"
                  placeholder="VD: 45"
                  type="number"
                  value={formData.maxStudents !== undefined ? String(formData.maxStudents) : ''}
                  onChange={(val) => {
                    if (formError) setFormError('');
                    setFormData((prev) => ({
                      ...prev,
                      maxStudents: val ? parseInt(val, 10) : undefined,
                    }));
                  }}
                  disabled={isSubmitting}
                  leadingIcon={<Icon name="group" />}
                  fullWidth
                  className="pt-2"
                />
              </div>

              <TextField
                variant="outlined"
                label="Năm học"
                placeholder="VD: 2024-2025"
                value={formData.academicYear || ''}
                onChange={(val) => {
                  if (formError) setFormError('');
                  setFormData((prev) => ({ ...prev, academicYear: val }));
                }}
                disabled={isSubmitting}
                leadingIcon={<Icon name="calendar_today" />}
                fullWidth
                className="pt-2"
              />

              <div className="flex items-start gap-2.5 rounded-2xl bg-m3-surface-container p-3 text-xs text-m3-on-surface-variant">
                <Icon name="info" className="mt-0.5 shrink-0 text-base text-m3-primary" />
                <span>
                  {attendanceSpreadsheetId
                    ? 'Google Sheet của lớp sẽ tự lấy theo cấu hình của Trường. Chỉ cần cấu hình tại màn hình Quản lý trường.'
                    : 'Trường chưa cấu hình Google Sheet. Vui lòng vào Quản lý trường để thêm Spreadsheet ID.'}
                </span>
              </div>

              <TextField
                variant="outlined"
                label="Mô tả"
                placeholder="Mô tả về lớp học..."
                value={formData.description || ''}
                onChange={(val) => {
                  if (formError) setFormError('');
                  setFormData((prev) => ({ ...prev, description: val }));
                }}
                disabled={isSubmitting}
                leadingIcon={<Icon name="notes" />}
                fullWidth
                className="pt-2"
              />

              {editingClass && (
                <div className="pt-1">
                  <Checkbox
                    id="editIsActiveClass"
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(checked)}
                    label="Lớp đang hoạt động"
                  />
                </div>
              )}
            </DialogBody>

            {/* Footer */}
            <DialogFooter className="border-t border-m3-outline-variant/30 px-6 py-4">
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
                disabled={isSubmitDisabled}
                loading={isSubmitting}
                icon={<Icon name={editingClass ? 'check' : 'add'} className="text-base" />}
              >
                {editingClass ? 'Lưu thay đổi' : 'Thêm lớp'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
