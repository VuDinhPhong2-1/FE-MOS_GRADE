// src/pages/SchoolList.tsx
import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button, Icon, ProgressIndicator, TextField } from '@bug-on/m3-expressive';
import ClassList from './Classlist';
import { schoolService } from '../services/school.service';
import type { School, CreateSchoolRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { usePageHeader } from '../context/PageActionsContext';

const SchoolList = () => {
  const { getAccessToken, user } = useAuth();
  const isAdmin = user?.role === 'Admin';
  const canEditAttendanceSpreadsheetId = isAdmin;
  const canDeleteSchool =
    user?.role === 'Admin' || Boolean(user?.permissions?.includes('schools.delete'));
  const [searchParams, setSearchParams] = useSearchParams();
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState<CreateSchoolRequest>({
    name: '',
    code: '',
    address: '',
    phoneNumber: '',
    email: '',
    website: '',
    description: '',
    attendanceSpreadsheetId: '',
  });

  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await schoolService.getSchools(getAccessToken);
      setSchools(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  }, [getAccessToken]);

  useEffect(() => {
    void fetchSchools();
  }, [fetchSchools]);

  useEffect(() => {
    const schoolId = searchParams.get('schoolId');
    if (!schoolId) {
      setSelectedSchool(null);
      return;
    }

    const matchedSchool = schools.find((school) => school.id === schoolId) || null;
    setSelectedSchool(matchedSchool);
  }, [schools, searchParams]);

  const handleSelectSchool = (school: School) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('schoolId', school.id);
    nextParams.delete('classId');
    setSearchParams(nextParams);
    setSelectedSchool(school);
  };

  const handleBackToSchools = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('schoolId');
    nextParams.delete('classId');
    setSearchParams(nextParams);
    setSelectedSchool(null);
  };

  const handleFieldValueChange = (field: keyof CreateSchoolRequest) => (value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenAddModal = () => {
    setEditingSchool(null);
    setFormData({
      name: '',
      code: '',
      address: '',
      phoneNumber: '',
      email: '',
      website: '',
      description: '',
      attendanceSpreadsheetId: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (school: School) => {
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
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const payload: CreateSchoolRequest = { ...formData };
      if (!canEditAttendanceSpreadsheetId) {
        delete payload.attendanceSpreadsheetId;
      }

      if (editingSchool) {
        await schoolService.updateSchool(editingSchool.id, payload, getAccessToken);
      } else {
        await schoolService.createSchool(payload, getAccessToken);
      }

      setFormData({
        name: '',
        code: '',
        address: '',
        phoneNumber: '',
        email: '',
        website: '',
        description: '',
        attendanceSpreadsheetId: '',
      });
      setEditingSchool(null);
      setShowModal(false);

      await fetchSchools();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!canDeleteSchool) {
      alert('Chỉ Admin mới có quyền xóa trường.');
      return;
    }

    if (!confirm(`Bạn có chắc muốn xóa trường "${name}"?`)) return;

    try {
      await schoolService.deleteSchool(id, getAccessToken);
      await fetchSchools();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa trường');
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
            onClick: fetchSchools,
          },
          {
            id: 'add-school',
            label: 'Thêm trường',
            icon: 'add',
            colorStyle: 'filled',
            onClick: handleOpenAddModal,
          },
        ],
  }, [selectedSchool, fetchSchools]);

  if (isLoading) {
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
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-m3-error bg-m3-error-container p-4 text-xs font-medium text-m3-on-error-container">
              <Icon name="warning" className="text-xl shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Table Container in M3 Style */}
          <div className="overflow-hidden rounded-3xl bg-m3-surface-container shadow-xs">
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
                          <Button colorStyle="filled" size="sm" onClick={handleOpenAddModal}>
                            <div className="flex items-center gap-1.5">
                              <Icon name="add" className="text-base" />
                              <span>Thêm trường mới</span>
                            </div>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    schools.map((sch, index) => (
                      <tr
                        key={sch.id}
                        className="group cursor-pointer transition-colors hover:bg-m3-surface-container-high/60 focus-within:bg-m3-primary/5"
                        onClick={() => handleSelectSchool(sch)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleSelectSchool(sch);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`Xem lớp học của trường ${sch.name}`}
                        title="Bấm để xem danh sách lớp"
                      >
                        <td className="px-6 py-4 font-semibold text-m3-on-surface-variant">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-full bg-m3-surface-container-high px-2.5 py-0.5 text-xs font-bold text-m3-primary shadow-xs">
                            {sch.code || '---'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-m3-on-surface group-hover:text-m3-primary transition-colors">
                              {sch.name}
                            </span>
                            {sch.address && (
                              <span className="text-xs text-m3-on-surface-variant line-clamp-1">
                                {sch.address}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div
                            className="flex items-center justify-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(sch)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-m3-on-surface-variant transition-colors hover:bg-m3-surface hover:text-m3-primary"
                              title="Chỉnh sửa trường"
                              aria-label="Chỉnh sửa"
                            >
                              <Icon name="edit" className="text-base" />
                            </button>
                            {canDeleteSchool && (
                              <button
                                type="button"
                                onClick={() => void handleDelete(sch.id, sch.name)}
                                className="flex h-8 w-8 items-center justify-center rounded-full text-m3-on-surface-variant transition-colors hover:bg-m3-error-container hover:text-m3-on-error-container"
                                title="Xóa trường"
                                aria-label="Xóa"
                              >
                                <Icon name="delete" className="text-base" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleSelectSchool(sch)}
                              className="flex h-8 w-8 items-center justify-center rounded-full text-m3-primary transition-colors hover:bg-m3-surface"
                              title="Xem danh sách lớp"
                              aria-label="Xem lớp"
                            >
                              <Icon name="chevron_right" className="text-base" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Dialog for Add / Edit School in M3 Style */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
              <div className="w-full max-w-xl overflow-hidden rounded-4xl bg-m3-surface-container-high p-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col text-m3-on-surface">
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-m3-primary/10 text-m3-primary">
                      <Icon name={editingSchool ? 'edit_square' : 'domain_add'} className="text-xl" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-m3-on-surface">
                        {editingSchool ? 'Chỉnh sửa trường học' : 'Thêm trường học mới'}
                      </h2>
                      <p className="text-xs text-m3-on-surface-variant">
                        Nhập các thông tin cơ sở đào tạo vào hệ thống
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-m3-on-surface-variant hover:bg-m3-surface-container-highest"
                    aria-label="Đóng"
                  >
                    <Icon name="close" className="text-xl" />
                  </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pt-2 space-y-4 pr-1">
                  {error && (
                    <div className="rounded-2xl bg-m3-error-container p-3 text-xs font-medium text-m3-on-error-container shadow-xs">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                      variant="outlined"
                      label="Tên trường *"
                      placeholder="VD: Trường THPT Chu Văn An"
                      required
                      fullWidth
                      leadingIcon={<Icon name="apartment" />}
                      value={formData.name}
                      onChange={handleFieldValueChange('name')}
                    />

                    <TextField
                      variant="outlined"
                      label="Mã trường *"
                      placeholder="VD: CVA-HN"
                      required
                      fullWidth
                      leadingIcon={<Icon name="tag" />}
                      value={formData.code}
                      onChange={handleFieldValueChange('code')}
                    />
                  </div>

                  <div>
                    <TextField
                      variant="outlined"
                      label="Spreadsheet ID Google Sheet (Điểm danh / Kết quả)"
                      placeholder="Dán Spreadsheet ID hoặc link Google Sheet"
                      disabled={!canEditAttendanceSpreadsheetId}
                      fullWidth
                      leadingIcon={<Icon name="table_chart" />}
                      value={formData.attendanceSpreadsheetId || ''}
                      onChange={handleFieldValueChange('attendanceSpreadsheetId')}
                      supportingText={
                        canEditAttendanceSpreadsheetId
                          ? 'Mỗi trường có 1 Google Sheet riêng. Lớp học mới tạo sẽ tự động kế thừa.'
                          : 'Chỉ tài khoản Admin mới có quyền cập nhật Spreadsheet ID.'
                      }
                    />
                  </div>

                  <TextField
                    variant="outlined"
                    label="Địa chỉ"
                    placeholder="VD: Số 10 Thụy Khuê, Tây Hồ, Hà Nội"
                    fullWidth
                    leadingIcon={<Icon name="location_on" />}
                    value={formData.address || ''}
                    onChange={handleFieldValueChange('address')}
                  />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <TextField
                      variant="outlined"
                      type="tel"
                      label="Số điện thoại"
                      placeholder="VD: 024-38234567"
                      fullWidth
                      leadingIcon={<Icon name="call" />}
                      value={formData.phoneNumber || ''}
                      onChange={handleFieldValueChange('phoneNumber')}
                    />
                    <TextField
                      variant="outlined"
                      type="email"
                      label="Email liên hệ"
                      placeholder="VD: lienhe@cva.edu.vn"
                      fullWidth
                      leadingIcon={<Icon name="mail" />}
                      value={formData.email || ''}
                      onChange={handleFieldValueChange('email')}
                    />
                  </div>

                  <TextField
                    variant="outlined"
                    type="url"
                    label="Website"
                    placeholder="VD: https://thptchuvanan.edu.vn"
                    fullWidth
                    leadingIcon={<Icon name="language" />}
                    value={formData.website || ''}
                    onChange={handleFieldValueChange('website')}
                  />

                  <TextField
                    variant="outlined"
                    label="Mô tả ghi chú"
                    placeholder="Thông tin ghi chú thêm về trường..."
                    fullWidth
                    leadingIcon={<Icon name="notes" />}
                    value={formData.description || ''}
                    onChange={handleFieldValueChange('description')}
                  />

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end gap-2.5 pt-4">
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
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleBackToSchools}
            className="inline-flex items-center gap-2 rounded-full bg-m3-surface-container px-4 py-2 text-xs font-bold text-m3-on-surface shadow-xs transition-all hover:bg-m3-surface-container-high hover:shadow-sm"
          >
            <Icon name="arrow_back" className="text-base" />
            <span>Quay lại danh sách trường</span>
          </button>
          <ClassList selectedSchool={selectedSchool} />
        </div>
      )}
    </div>
  );
};

export default SchoolList;
