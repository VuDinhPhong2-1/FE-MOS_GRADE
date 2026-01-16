// src/pages/ClassList.tsx
import React, { useState, useEffect } from 'react';
import { Plus, BookOpen, Users, Calendar, User, Loader2, AlertCircle, Edit, Trash2, X, Filter } from 'lucide-react';
import StudentList from './StudentList';
import { useAuth } from '../context/AuthContext';
import { classService } from '../services/class.service';
import type { School } from '../types';
import type { Class, CreateClassRequest, UpdateClassRequest } from '../types/class.types';

interface ClassListProps {
  selectedSchool: School;
}

const ClassList: React.FC<ClassListProps> = ({ selectedSchool }) => {
  const { getAccessToken } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // ✅ Thêm state cho filter
  const [showInactive, setShowInactive] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [isActive, setIsActive] = useState(true);
  
  const [formData, setFormData] = useState<CreateClassRequest>({
    name: '',
    schoolId: selectedSchool.id,
    description: '',
    maxStudents: undefined,
    academicYear: '2024-2025',
    grade: '',
    teacherId: ''
  });

  useEffect(() => {
    fetchClasses();
  }, [selectedSchool.id, showInactive]); // ✅ Thêm showInactive vào dependency

  const fetchClasses = async () => {
    setIsLoading(true);
    setError('');

    try {
      // ✅ Truyền includeInactive vào API
      const data = await classService.getClassesBySchool(
        selectedSchool.id, 
        getAccessToken,
        showInactive
      );
      setClasses(data);
    } catch (err) {
      setError('Không thể tải danh sách lớp học');
      console.error('Error fetching classes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ... (giữ nguyên các hàm handleOpenAddModal, handleOpenEditModal, handleSubmit, handleDeleteClass, handleChange)

  const handleOpenAddModal = () => {
    setEditingClass(null);
    setIsActive(true);
    setFormData({
      name: '',
      schoolId: selectedSchool.id,
      description: '',
      maxStudents: undefined,
      academicYear: '2024-2025',
      grade: '',
      teacherId: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (cls: Class) => {
    setEditingClass(cls);
    setIsActive(cls.isActive);
    setFormData({
      name: cls.name,
      schoolId: cls.schoolId,
      description: cls.description || '',
      maxStudents: cls.maxStudents,
      academicYear: cls.academicYear || '2024-2025',
      grade: cls.grade || '',
      teacherId: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (editingClass) {
        const updateData: UpdateClassRequest = {
          ...formData,
          isActive: isActive
        };
        await classService.updateClass(editingClass.id, updateData, getAccessToken);
      } else {
        await classService.createClass(
          {
            ...formData,
            schoolId: selectedSchool.id
          },
          getAccessToken
        );
      }

      setFormData({
        name: '',
        schoolId: selectedSchool.id,
        description: '',
        maxStudents: undefined,
        academicYear: '2024-2025',
        grade: '',
        teacherId: ''
      });
      setEditingClass(null);
      setIsActive(true);
      setShowModal(false);

      await fetchClasses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`⚠️ BẠN CÓ CHẮC MUỐN XÓA VĨNH VIỄN LỚP "${className}"?\n\nHành động này KHÔNG THỂ HOÀN TÁC!`)) return;

    try {
      await classService.deleteClass(classId, getAccessToken);
      await fetchClasses();
    } catch (err) {
      alert('Không thể xóa lớp học');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'maxStudents' ? (value ? parseInt(value) : undefined) : value
    }));
  };

  if (selectedClass) {
    return (
      <>
        <button
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          onClick={() => setSelectedClass(null)}
        >
          ← Quay lại danh sách lớp
        </button>
        <StudentList selectedClass={selectedClass} />
      </>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải danh sách lớp...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <BookOpen className="text-blue-600" />
          Danh sách lớp học
        </h2>
        <p className="text-gray-600">Trường: <span className="font-semibold">{selectedSchool.name}</span></p>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tổng số lớp</p>
              <p className="text-2xl font-bold">{classes.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Đang hoạt động</p>
              <p className="text-2xl font-bold text-green-600">
                {classes.filter(c => c.isActive).length}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tổng học sinh</p>
              <p className="text-2xl font-bold">
                {classes.reduce((sum, cls) => sum + cls.currentStudents, 0)}
              </p>
            </div>
            <User className="w-8 h-8 text-purple-500 opacity-50" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Năm học</p>
              <p className="text-lg font-bold">2024-2025</p>
            </div>
            <Calendar className="w-8 h-8 text-orange-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* ✅ Filter & Add button */}
      <div className="flex justify-between items-center mb-4">
        {/* ✅ Toggle hiển thị lớp không hoạt động */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-600" />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">
              Hiển thị lớp không hoạt động
            </span>
          </label>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Plus size={18} />
          Thêm lớp mới
        </button>
      </div>

      {/* Classes Grid */}
      {classes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {classes.map(cls => (
            <div
              key={cls.id}
              className={`bg-white shadow-md rounded-lg overflow-hidden hover:shadow-lg transition-shadow ${
                !cls.isActive ? 'opacity-60' : '' // ✅ Làm mờ lớp không hoạt động
              }`}
            >
              {/* Card Header */}
              <div className={`bg-gradient-to-r ${
                cls.isActive 
                  ? 'from-blue-500 to-blue-600' 
                  : 'from-gray-400 to-gray-500' // ✅ Đổi màu nếu không hoạt động
              } text-white p-4`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold">{cls.name}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${cls.isActive
                    ? 'bg-green-400 bg-opacity-30 text-white'
                    : 'bg-red-400 bg-opacity-30 text-white' // ✅ Đổi màu badge
                    }`}>
                    {cls.isActive ? 'Hoạt động' : 'Ngừng'}
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Khối:</span>
                    <span className="font-medium">{cls.grade || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Sĩ số:</span>
                    <span className="font-medium">
                      {cls.currentStudents}/{cls.maxStudents || '∞'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Năm học:</span>
                    <span className="font-medium">{cls.academicYear || 'N/A'}</span>
                  </div>
                </div>

                {cls.description && (
                  <p className="text-xs text-gray-600 mt-3 italic line-clamp-2">
                    {cls.description}
                  </p>
                )}

                {/* Card Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setSelectedClass(cls)}
                    className="flex-1 bg-blue-100 text-blue-700 rounded px-3 py-2 hover:bg-blue-200 transition text-sm font-medium"
                  >
                    Xem học sinh
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(cls)}
                    className="p-2 text-green-600 hover:bg-green-100 rounded transition"
                    title="Sửa lớp"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteClass(cls.id, cls.name)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                    title="Xóa lớp"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 text-lg">Chưa có lớp học nào trong trường này</p>
          <button
            onClick={handleOpenAddModal}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="inline mr-2" size={18} />
            Tạo lớp đầu tiên
          </button>
        </div>
      )}

      {/* Modal - giữ nguyên code cũ */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-semibold">
                {editingClass ? '✏️ Chỉnh sửa lớp học' : '📚 Thêm lớp học mới'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
                  ⚠️ {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên lớp <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="VD: Lớp 10A1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Khối
                  </label>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Chọn khối --</option>
                    <option value="10">Khối 10</option>
                    <option value="11">Khối 11</option>
                    <option value="12">Khối 12</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sĩ số tối đa
                  </label>
                  <input
                    type="number"
                    name="maxStudents"
                    value={formData.maxStudents || ''}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="VD: 45"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Năm học
                </label>
                <input
                  type="text"
                  name="academicYear"
                  value={formData.academicYear}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="VD: 2024-2025"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mô tả về lớp học..."
                />
              </div>

              {editingClass && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Lớp đang hoạt động
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Đang lưu...
                    </>
                  ) : editingClass ? (
                    <>
                      <Edit size={18} />
                      Cập nhật
                    </>
                  ) : (
                    <>
                      <Plus size={18} />
                      Thêm lớp
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassList;
