// src/pages/SchoolList.tsx
import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react';
import { Plus, X, Building2, Loader2, RefreshCw, Trash2, Edit } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ClassList from './Classlist';
import { schoolService } from '../services/school.service';
import type { School } from '../types';
import type { CreateSchoolRequest } from '../types';
import { useAuth } from '../context/AuthContext';

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
    fetchSchools();
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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải...</span>
      </div>
    );
  }

  return (
    <div>
      {!selectedSchool ? (
        <>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="app-section-title flex items-center gap-2 text-xl sm:text-2xl">
              <Building2 className="text-blue-600" />
              Quản lý trường học
            </h1>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={fetchSchools}
                className="app-btn-secondary flex items-center justify-center gap-2 px-4 py-2"
              >
                <RefreshCw size={18} />
                Làm mới
              </button>
              <button
                onClick={handleOpenAddModal}
                className="app-btn-primary flex items-center justify-center gap-2 px-4 py-2"
              >
                <Plus size={18} />
                Thêm trường
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              ⚠️ {error}
            </div>
          )}

          <div className="app-card overflow-x-auto">
            <table className="min-w-[520px] w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên trường</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Chức năng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schools.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                      Chưa có trường nào. Hãy thêm trường mới!
                    </td>
                  </tr>
                ) : (
                  schools.map((sch, index) => (
                    <tr
                      key={sch.id}
                      className="cursor-pointer hover:bg-gray-50 focus-within:bg-blue-50"
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
                      title="Bấm để xem lớp học"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900">{index + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{sch.name}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenEditModal(sch);
                            }}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            title="Sửa trường"
                          >
                            <Edit size={18} />
                          </button>
                          {canDeleteSchool && (
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDelete(sch.id, sch.name);
                              }}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Xóa trường"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
              <div className="app-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b">
                  <h2 className="text-lg sm:text-xl font-semibold">
                    {editingSchool ? 'Chỉnh sửa trường' : 'Thêm trường mới'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                  {error && (
                    <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
                      ⚠️ {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên trường <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="VD: Trường THPT ABC"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mã trường <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="VD: THPT-ABC"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Spreadsheet ID Google Sheet
                    </label>
                    <input
                      type="text"
                      name="attendanceSpreadsheetId"
                      value={formData.attendanceSpreadsheetId || ''}
                      onChange={handleChange}
                      disabled={!canEditAttendanceSpreadsheetId}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        canEditAttendanceSpreadsheetId ? '' : 'cursor-not-allowed bg-gray-100 text-gray-500'
                      }`}
                      placeholder="Dán SpreadsheetId hoặc URL Google Sheet"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {canEditAttendanceSpreadsheetId
                        ? 'Mỗi trường có 1 Google Sheet riêng. Lớp mới sẽ tự kế thừa từ trường.'
                        : 'Chỉ Admin mới được thay đổi Spreadsheet ID Google Sheet.'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="VD: 123 Đường ABC, Quận XYZ"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="VD: 024-12345678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Thư điện tử</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="VD: info@school.edu.vn"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="VD: https://school.edu.vn"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mô tả ngắn về trường..."
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Đang lưu...
                        </>
                      ) : editingSchool ? (
                        <>
                          <Edit size={18} />
                          Cập nhật
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          Thêm trường
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </>
      ) : (
        <>
            <button className="app-btn-secondary mb-4 flex items-center gap-2 px-4 py-2" onClick={handleBackToSchools}>
            ← Quay lại danh sách trường
          </button>
          <ClassList selectedSchool={selectedSchool} />
        </>
      )}
    </div>
  );
};

export default SchoolList;
