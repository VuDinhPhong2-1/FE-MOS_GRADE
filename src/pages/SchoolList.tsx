// src/pages/SchoolList.tsx
import React, { useState, useEffect, useCallback, useMemo, memo, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Button,
  Card,
  CardContent,
  Chip,
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
  ProgressIndicator,
  TextField,
} from '@bug-on/m3-expressive';
import ClassList from './Classlist';
import { schoolService } from '../services/school.service';
import type { School, CreateSchoolRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePageHeader } from '../context/PageActionsContext';
import { notify } from '../utils/notify';

const ADMIN_ROLE = 'Admin' as const;

const EMPTY_FORM: CreateSchoolRequest = {
  name: '',
  code: '',
  address: '',
  phoneNumber: '',
  email: '',
  website: '',
  description: '',
  attendanceSpreadsheetId: '',
};

interface SchoolRowProps {
  school: School;
  index: number;
  canDeleteSchool: boolean;
  isDeleting: boolean;
  isCurrentDeleting: boolean;
  onSelect: (school: School) => void;
  onEdit: (school: School) => void;
  onDelete: (school: School) => void;
}

const SchoolRow = memo(function SchoolRow({
  school,
  index,
  canDeleteSchool,
  isDeleting,
  isCurrentDeleting,
  onSelect,
  onEdit,
  onDelete,
}: SchoolRowProps) {
  const handleRowClick = () => {
    onSelect(school);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(school);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(school);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(school);
  };

  return (
    <tr
      className="group cursor-pointer transition-colors hover:bg-m3-surface-container-high/60 focus-within:bg-m3-primary/5"
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Xem lớp học của trường ${school.name}`}
      title="Bấm để xem danh sách lớp"
    >
      <td className="px-6 py-4 font-semibold text-m3-on-surface-variant">
        {index + 1}
      </td>
      <td className="px-6 py-4">
        <Chip
          variant="assist"
          label={school.code || '---'}
          className="h-6 px-2.5 text-xs font-bold text-m3-primary border-none bg-m3-surface-container-high pointer-events-none shadow-xs"
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-col">
          <span className="font-bold text-m3-on-surface group-hover:text-m3-primary transition-colors">
            {school.name}
          </span>
          {school.address && (
            <span className="text-xs text-m3-on-surface-variant line-clamp-1">
              {school.address}
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <div
          className="flex items-center justify-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <IconButton
            type="button"
            size="sm"
            colorStyle="standard"
            disabled={isDeleting}
            onClick={handleEdit}
            title="Chỉnh sửa trường"
            aria-label={`Chỉnh sửa trường ${school.name}`}
          >
            <Icon name="edit" className="text-base" />
          </IconButton>
          {canDeleteSchool && (
            <IconButton
              type="button"
              size="sm"
              colorStyle="standard"
              disabled={isDeleting}
              loading={isCurrentDeleting}
              onClick={handleDelete}
              className="text-m3-error hover:bg-m3-error-container hover:text-m3-on-error-container"
              title="Xóa trường"
              aria-label={`Xóa trường ${school.name}`}
            >
              <Icon name="delete" className="text-base" />
            </IconButton>
          )}
          <IconButton
            type="button"
            size="sm"
            colorStyle="standard"
            disabled={isDeleting}
            onClick={handleRowClick}
            className="text-m3-primary"
            title="Xem danh sách lớp"
            aria-label={`Xem danh sách lớp của ${school.name}`}
          >
            <Icon name="chevron_right" className="text-base" />
          </IconButton>
        </div>
      </td>
    </tr>
  );
});

const SchoolList = () => {
  const { getAccessToken, user } = useAuth();
  const isAdmin = user?.role === ADMIN_ROLE;
  const canDeleteSchool =
    isAdmin || Boolean(user?.permissions?.includes('schools.delete'));

  const [searchParams, setSearchParams] = useSearchParams();
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<School | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState<CreateSchoolRequest>(EMPTY_FORM);

  const schoolId = searchParams.get('schoolId');
  const selectedSchool = useMemo(
    () => (schoolId ? schools.find((school) => school.id === schoolId) ?? null : null),
    [schools, schoolId]
  );

  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await schoolService.getSchools(getAccessToken);
      setSchools(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setError(msg);
      notify.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    void fetchSchools();
  }, [fetchSchools]);

  const handleSelectSchool = useCallback((school: School) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('schoolId', school.id);
      next.delete('classId');
      return next;
    });
  }, [setSearchParams]);

  const handleBackToSchools = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('schoolId');
      next.delete('classId');
      return next;
    });
  }, [setSearchParams]);

  const handleFieldValueChange = useCallback(
    (field: keyof CreateSchoolRequest) => (value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleOpenAddModal = useCallback(() => {
    setEditingSchool(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  }, []);

  const handleOpenEditModal = useCallback((school: School) => {
    setEditingSchool(school);
    setFormData({
      name: school.name,
      code: school.code || '',
      address: school.address || '',
      phoneNumber: school.phoneNumber || '',
      email: school.email || '',
      website: school.website || '',
      description: school.description || '',
      attendanceSpreadsheetId: school.attendanceSpreadsheetId || '',
    });
    setShowModal(true);
  }, []);

  const buildPayload = useCallback((): CreateSchoolRequest => {
    const payload: CreateSchoolRequest = { ...formData };
    if (!isAdmin) {
      delete payload.attendanceSpreadsheetId;
    }
    return payload;
  }, [formData, isAdmin]);

  const resetForm = useCallback(() => {
    setFormData(EMPTY_FORM);
    setEditingSchool(null);
    setShowModal(false);
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload = buildPayload();

      if (editingSchool) {
        await schoolService.updateSchool(editingSchool.id, payload, getAccessToken);
        notify.success('Cập nhật thông tin trường thành công');
      } else {
        await schoolService.createSchool(payload, getAccessToken);
        notify.success('Thêm trường học mới thành công');
      }

      resetForm();
      await fetchSchools();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      notify.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = useCallback((school: School) => {
    if (!canDeleteSchool) {
      notify.warning('Chỉ Admin mới có quyền xóa trường.');
      return;
    }
    setSchoolToDelete(school);
  }, [canDeleteSchool]);

  const handleConfirmDelete = async () => {
    if (!schoolToDelete) return;

    try {
      setIsDeleting(true);
      await schoolService.deleteSchool(schoolToDelete.id, getAccessToken);
      notify.success(`Đã xóa trường "${schoolToDelete.name}" thành công`);
      setSchoolToDelete(null);
      await fetchSchools();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Không thể xóa trường');
    } finally {
      setIsDeleting(false);
    }
  };

  usePageHeader({
    title: selectedSchool ? selectedSchool.name : 'Quản lý trường học',
    subtitle: selectedSchool
      ? 'Danh sách lớp học trực thuộc'
      : 'Danh sách các trường và cơ sở đào tạo trong hệ thống MOS Grader',
    actions: selectedSchool
      ? [
        {
          id: 'back-to-schools',
          label: 'Quay lại danh sách',
          icon: 'arrow_back',
          colorStyle: 'outlined',
          onClick: handleBackToSchools,
        },
      ]
      : [
        {
          id: 'refresh-schools',
          label: 'Làm mới',
          icon: 'refresh',
          colorStyle: 'outlined',
          disabled: isLoading,
          onClick: fetchSchools,
        },
        {
          id: 'add-school',
          label: 'Thêm trường',
          icon: 'add',
          colorStyle: 'filled',
          disabled: isLoading,
          onClick: handleOpenAddModal,
        },
      ],
  }, [selectedSchool, handleBackToSchools, fetchSchools, handleOpenAddModal, isLoading]);

  if (isLoading && schools.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <ProgressIndicator variant="circular" shape="wavy" size={36} aria-label="Đang tải danh sách trường" />
        <span className="text-sm font-medium text-m3-on-surface-variant">Đang tải danh sách trường học...</span>
      </div>
    );
  }

  return (
    <div>
      {!selectedSchool ? (
        <>
          {error && (
            <Card variant="outlined" className="mb-6 border-m3-error bg-m3-error-container text-m3-on-error-container">
              <CardContent className="flex items-center gap-3 p-4 text-xs font-medium">
                <Icon name="warning" className="text-xl shrink-0" />
                <span>{error}</span>
              </CardContent>
            </Card>
          )}

          {/* Table Container in M3 Style */}
          <Card variant="filled" className="relative overflow-hidden rounded-3xl bg-m3-surface-container p-0 shadow-xs border-none">
            {isLoading && (
              <div className="absolute top-0 left-0 right-0 z-10">
                <ProgressIndicator variant="linear" shape="wavy" aria-label="Đang tải dữ liệu trường học" className="w-full" />
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="min-w-140 w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-m3-outline-variant/60 bg-m3-surface-container-high text-xs font-bold uppercase tracking-wider text-m3-on-surface-variant">
                    <th className="w-16 px-6 py-4">STT</th>
                    <th className="px-6 py-4">Mã trường</th>
                    <th className="px-6 py-4">Tên trường</th>
                    <th className="w-36 px-6 py-4 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-m3-outline-variant/40 text-sm">
                  {schools.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="mx-auto flex max-w-xs flex-col items-center justify-center gap-3 text-center">
                          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-m3-surface-container-high text-m3-on-surface-variant">
                            <Icon name="domain_disabled" className="text-3xl" />
                          </div>
                          <div>
                            <p className="font-bold text-m3-on-surface">Chưa có trường nào</p>
                            <p className="mt-1 text-xs text-m3-on-surface-variant">
                              Hãy bấm nút "Thêm trường" để bắt đầu thiết lập cơ sở đầu tiên.
                            </p>
                          </div>
                          <Button
                            colorStyle="filled"
                            size="sm"
                            icon={<Icon name="add" className="text-base" />}
                            onClick={handleOpenAddModal}
                          >
                            Thêm trường mới
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    schools.map((sch, index) => (
                      <SchoolRow
                        key={sch.id}
                        school={sch}
                        index={index}
                        canDeleteSchool={canDeleteSchool}
                        isDeleting={isDeleting}
                        isCurrentDeleting={isDeleting && schoolToDelete?.id === sch.id}
                        onSelect={handleSelectSchool}
                        onEdit={handleOpenEditModal}
                        onDelete={handleOpenDeleteDialog}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Modal Dialog for Add / Edit School in M3 Style */}
          <Dialog open={showModal} onOpenChange={(open) => !open && setShowModal(false)}>
            <DialogPortal open={showModal}>
              <DialogOverlay />
              <DialogContent
                hideCloseButton
                className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-xl flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-0 text-m3-on-surface shadow-2xl"
              >
                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                  {/* Modal Header */}
                  <div className="flex items-center justify-between px-6 pt-5 pb-3">
                    <DialogHeader className="mb-0 flex-row items-center gap-3 space-y-0 text-left">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-m3-primary/10 text-m3-primary">
                        <Icon name={editingSchool ? 'edit_square' : 'domain_add'} className="text-xl" />
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
                        onClick={() => setShowModal(false)}
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
                        onChange={handleFieldValueChange('name')}
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
                        onChange={handleFieldValueChange('code')}
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
                        onChange={handleFieldValueChange('attendanceSpreadsheetId')}
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
                      onChange={handleFieldValueChange('address')}
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
                        onChange={handleFieldValueChange('phoneNumber')}
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
                        onChange={handleFieldValueChange('email')}
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
                      onChange={handleFieldValueChange('website')}
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
                      onChange={handleFieldValueChange('description')}
                      className="pt-4"
                    />
                  </DialogBody>

                  {/* Modal Footer */}
                  <DialogFooter className="mt-0 flex shrink-0 items-center justify-end gap-2.5 border-t border-m3-outline-variant/30 px-6 py-4">
                    <Button
                      colorStyle="text"
                      type="button"
                      onClick={() => setShowModal(false)}
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
              </DialogContent>
            </DialogPortal>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <Dialog
            open={Boolean(schoolToDelete)}
            onOpenChange={(open) => {
              if (!open && !isDeleting) setSchoolToDelete(null);
            }}
          >
            <DialogPortal open={Boolean(schoolToDelete)}>
              <DialogOverlay />
              <DialogContent
                hideCloseButton
                className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-md flex-col overflow-hidden rounded-4xl bg-m3-surface-container-high p-6 text-m3-on-surface shadow-2xl"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-m3-error-container text-m3-error">
                      <Icon name="delete_forever" className="text-2xl" />
                    </div>
                    <div>
                      <DialogTitle className="text-lg font-bold text-m3-on-surface">
                        Xác nhận xóa trường học
                      </DialogTitle>
                      <DialogDescription className="text-xs text-m3-on-surface-variant">
                        Thao tác này không thể hoàn tác
                      </DialogDescription>
                    </div>
                  </div>

                  <p className="text-sm text-m3-on-surface-variant leading-relaxed">
                    Bạn có chắc chắn muốn xóa trường{' '}
                    <strong className="font-semibold text-m3-on-surface">
                      "{schoolToDelete?.name}"
                    </strong>
                    ? Tất cả các dữ liệu lớp học và thông tin liên quan trực thuộc trường này có thể bị ảnh hưởng.
                  </p>

                  <DialogFooter className="mt-2 flex shrink-0 items-center justify-end gap-2.5 border-t border-m3-outline-variant/30 pt-4">
                    <Button
                      colorStyle="text"
                      type="button"
                      onClick={() => setSchoolToDelete(null)}
                      disabled={isDeleting}
                    >
                      Hủy
                    </Button>
                    <Button
                      colorStyle="filled"
                      type="button"
                      onClick={() => void handleConfirmDelete()}
                      disabled={isDeleting}
                      loading={isDeleting}
                      className="bg-m3-error text-m3-on-error hover:bg-m3-error/90 shadow-xs"
                    >
                      Xác nhận xóa
                    </Button>
                  </DialogFooter>
                </div>
              </DialogContent>
            </DialogPortal>
          </Dialog>
        </>
      ) : (
        <div className="space-y-4">
          <Button
            type="button"
            colorStyle="tonal"
            onClick={handleBackToSchools}
            icon={<Icon name="arrow_back" className="text-base" />}
            className="rounded-full shadow-xs"
          >
            Quay lại danh sách trường
          </Button>
          <ClassList selectedSchool={selectedSchool} />
        </div>
      )}
    </div>
  );
};

export default SchoolList;

