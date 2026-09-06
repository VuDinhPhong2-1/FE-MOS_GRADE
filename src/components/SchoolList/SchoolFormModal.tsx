import { useState, useCallback, type FormEvent } from 'react';
import {
  Button,
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  Icon,
  IconButton,
  TextField,
} from '@bug-on/m3-expressive';
import type { CreateSchoolRequest, School } from '../../types';
import { EMPTY_FORM, type SchoolFormModalProps } from './types';

const getInitialFormData = (editingSchool: School | null): CreateSchoolRequest => {
  if (!editingSchool) return EMPTY_FORM;
  return {
    name: editingSchool.name,
    code: editingSchool.code || '',
    address: editingSchool.address || '',
    phoneNumber: editingSchool.phoneNumber || '',
    email: editingSchool.email || '',
    website: editingSchool.website || '',
    description: editingSchool.description || '',
    attendanceSpreadsheetId: editingSchool.attendanceSpreadsheetId || '',
  };
};

type SchoolFormContentProps = Omit<SchoolFormModalProps, 'open'>;

const SchoolFormContent = ({
  isSubmitting,
  isAdmin,
  editingSchool,
  onClose,
  onSubmit,
}: SchoolFormContentProps) => {
  const [formData, setFormData] = useState<CreateSchoolRequest>(() =>
    getInitialFormData(editingSchool)
  );

  const handleFieldChange = useCallback(
    (field: keyof CreateSchoolRequest) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: CreateSchoolRequest = { ...formData };
    if (!isAdmin) {
      delete payload.attendanceSpreadsheetId;
    }
    void onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <DialogHeader className="mb-0 flex-row items-center gap-3 space-y-0 text-left">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-m3-primary/10 text-m3-primary">
                  <Icon
                    name={editingSchool ? 'edit_square' : 'domain_add'}
                    className="text-xl"
                  />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-m3-on-surface">
                    {editingSchool ? 'Chỉnh sửa trường học' : 'Thêm trường học mới'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-m3-on-surface-variant">
                    Nhập các thông tin cơ sở đào tạo vào hệ thống
                  </DialogDescription>
                </div>
              </DialogHeader>
              <DialogClose asChild>
                <IconButton
                  type="button"
                  size="sm"
                  colorStyle="standard"
                  aria-label="Đóng"
                  disabled={isSubmitting}
                  onClick={onClose}
                >
                  <Icon name="close" className="text-xl" />
                </IconButton>
              </DialogClose>
            </div>

            {/* Modal Body */}
            <DialogBody className="flex flex-1 flex-col gap-6 overflow-y-auto px-6 pt-4 pb-6 pr-5">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <TextField
                  variant="outlined"
                  label="Tên trường *"
                  placeholder="VD: Trường THPT Chu Văn An"
                  required
                  disabled={isSubmitting}
                  fullWidth
                  leadingIcon={<Icon name="apartment" />}
                  value={formData.name}
                  onChange={handleFieldChange('name')}
                  className="pt-4"
                />

                <TextField
                  variant="outlined"
                  label="Mã trường *"
                  placeholder="VD: CVA-HN"
                  required
                  disabled={isSubmitting}
                  fullWidth
                  leadingIcon={<Icon name="tag" />}
                  value={formData.code}
                  onChange={handleFieldChange('code')}
                  className="pt-4"
                />
              </div>

              <div>
                <TextField
                  variant="outlined"
                  label="Spreadsheet ID Google Sheet (Điểm danh / Kết quả)"
                  placeholder="Dán Spreadsheet ID hoặc link Google Sheet"
                  disabled={isSubmitting || !isAdmin}
                  fullWidth
                  leadingIcon={<Icon name="table_chart" />}
                  value={formData.attendanceSpreadsheetId || ''}
                  onChange={handleFieldChange('attendanceSpreadsheetId')}
                  supportingText={
                    isAdmin
                      ? 'Mỗi trường có 1 Google Sheet riêng. Lớp học mới tạo sẽ tự động kế thừa.'
                      : 'Chỉ tài khoản Admin mới có quyền cập nhật Spreadsheet ID.'
                  }
                  className="pt-4"
                />
              </div>

              <TextField
                variant="outlined"
                label="Địa chỉ"
                placeholder="VD: Số 10 Thụy Khuê, Tây Hồ, Hà Nội"
                disabled={isSubmitting}
                fullWidth
                leadingIcon={<Icon name="location_on" />}
                value={formData.address || ''}
                onChange={handleFieldChange('address')}
                className="pt-4"
              />

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <TextField
                  variant="outlined"
                  type="tel"
                  label="Số điện thoại"
                  placeholder="VD: 024-38234567"
                  disabled={isSubmitting}
                  fullWidth
                  leadingIcon={<Icon name="call" />}
                  value={formData.phoneNumber || ''}
                  onChange={handleFieldChange('phoneNumber')}
                  className="pt-4"
                />
                <TextField
                  variant="outlined"
                  type="email"
                  label="Email liên hệ"
                  placeholder="VD: lienhe@cva.edu.vn"
                  disabled={isSubmitting}
                  fullWidth
                  leadingIcon={<Icon name="mail" />}
                  value={formData.email || ''}
                  onChange={handleFieldChange('email')}
                  className="pt-4"
                />
              </div>

              <TextField
                variant="outlined"
                type="url"
                label="Website"
                placeholder="VD: https://thptchuvanan.edu.vn"
                disabled={isSubmitting}
                fullWidth
                leadingIcon={<Icon name="language" />}
                value={formData.website || ''}
                onChange={handleFieldChange('website')}
                className="pt-4"
              />

              <TextField
                variant="outlined"
                label="Mô tả ghi chú"
                placeholder="Thông tin ghi chú thêm về trường..."
                disabled={isSubmitting}
                fullWidth
                leadingIcon={<Icon name="notes" />}
                value={formData.description || ''}
                onChange={handleFieldChange('description')}
                className="pt-4"
              />
            </DialogBody>

            {/* Modal Footer */}
            <DialogFooter className="mt-0 flex shrink-0 items-center justify-end gap-2.5 border-t border-m3-outline-variant/30 px-6 py-4">
              <Button
                colorStyle="text"
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                colorStyle="filled"
                type="submit"
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {editingSchool ? 'Lưu thay đổi' : 'Thêm trường'}
              </Button>
            </DialogFooter>
          </form>
  );
};

export const SchoolFormModal = ({
  open,
  editingSchool,
  ...rest
}: SchoolFormModalProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && rest.onClose()}>
      <DialogPortal open={open}>
        <DialogOverlay />
        <DialogContent
          hideCloseButton
          className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-xl flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl"
        >
          {open && (
            <SchoolFormContent
              key={editingSchool?.id ?? 'create-new-school'}
              editingSchool={editingSchool}
              {...rest}
            />
          )}
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
