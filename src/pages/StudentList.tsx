import { useState, useEffect, type ChangeEvent } from 'react';
import * as XLSX from 'xlsx';
import type { Class } from '../types/class.types';
import type { Assignment } from '../types/assignment.types';
import type { Student, StudentImportItem } from '../types/student.types';
import type { ScoreResponse } from '../types/score.types';
import studentService from '../services/student.service';
import { assignmentService } from '../services/assignment.service';
import { scoreService } from '../services/score.service';
import { useAuth } from '../context/AuthContext';
import GradingModal from '../components/GradingModal';
import ViewAllScoresModal from '../components/ViewAllScoresModal';
import ClassAnalyticsPanel from '../components/ClassAnalyticsPanel';
import { Upload, FileCheck2, Eye, Save, RefreshCw, Pencil, X, Loader2, CheckCircle2, XCircle } from 'lucide-react';

type EditStudentForm = {
  middleName: string;
  firstName: string;
  status: string;
  classId: string;
};

const VALID_STATUSES = ['Active', 'Inactive'];

const StudentList = ({ selectedClass }: { selectedClass: Class }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [scores, setScores] = useState<ScoreResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [isViewScoresModal, setIsViewScoresModal] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editError, setEditError] = useState('');
  const [flashMessage, setFlashMessage] = useState('');
  const [editForm, setEditForm] = useState<EditStudentForm>({
    middleName: '',
    firstName: '',
    status: 'Active',
    classId: '',
  });
  const [initialEditForm, setInitialEditForm] = useState<EditStudentForm>({
    middleName: '',
    firstName: '',
    status: 'Active',
    classId: '',
  });
  const { getAccessToken } = useAuth();

  useEffect(() => {
    if (selectedClass?.id) {
      loadStudents();
      loadAssignments();
      loadScores();
    }
    // eslint-disable-next-line
  }, [selectedClass?.id]);

  const handleOpenViewScoresModal = async () => {
    await loadScores();
    setIsViewScoresModal(true);
  };

  const studentNewList = students.filter((st) => st.id.startsWith('temp-'));

    const loadStudents = async () => {
      setIsLoading(true);
      try {
      const data = await studentService.getStudentsByClassId(selectedClass.id, getAccessToken);
      setStudents(data);
      } finally {
      setIsLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const data = await assignmentService.getByClass(selectedClass.id, getAccessToken);
      setAssignments(data);
    } catch {
      setAssignments([]);
    }
  };

  const loadScores = async () => {
    try {
      const data = await scoreService.getByClass(selectedClass.id, getAccessToken);
      setScores(data);
    } catch {
      setScores([]);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as (string | undefined)[][];

      const list: Student[] = [];
      data.slice(1).forEach((row, index) => {
        if (row[0] && row[1]) {
          list.push({
            id: `temp-${index + 1}`,
            middleName: row[0],
            firstName: row[1],
            gradingApiEndpoint: row[2] || '',
          });
        }
      });

      setStudents(list);
    };

    reader.readAsBinaryString(file);
  };

  const handleSaveStudents = async () => {
    const newStudents = students.filter((st) => st.id.startsWith('temp-'));
    if (newStudents.length === 0) {
      alert('Không có học sinh mới để lưu!');
      return;
    }

    setIsLoading(true);
    try {
      const importItems: StudentImportItem[] = newStudents.map((st) => ({
        MiddleName: st.middleName,
        FirstName: st.firstName,
      }));

      await studentService.bulkImportStudents({
        Students: importItems,
        ClassId: selectedClass.id,
      }, getAccessToken);

      await loadStudents();
    } catch {
      alert('Có lỗi xảy ra khi import học sinh!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrade = () => {
    if (students.length === 0) {
      alert('Chưa có học sinh nào để chấm điểm!');
      return;
    }

    const sel = window.getSelection && window.getSelection();
    if (sel && sel.rangeCount > 0) {
      sel.removeAllRanges();
    }

    setIsGradingModalOpen(true);
  };

  const handleGradingSuccess = () => {
    loadScores();
  };

  useEffect(() => {
    if (!flashMessage) return;
    const timer = window.setTimeout(() => setFlashMessage(''), 2500);
    return () => window.clearTimeout(timer);
  }, [flashMessage]);

  const handleOpenEditStudent = (student: Student) => {
    if (student.id.startsWith('temp-')) {
      alert('Hoc sinh chua duoc luu len he thong, khong the sua.');
      return;
    }

    const preset: EditStudentForm = {
      middleName: student.middleName || '',
      firstName: student.firstName || '',
      status: VALID_STATUSES.includes(student.status || '')
        ? (student.status as string)
        : (student.isActive ? 'Active' : 'Inactive'),
      classId: student.classId || selectedClass.id,
    };
    setEditingStudent(student);
    setEditForm(preset);
    setInitialEditForm(preset);
    setEditError('');
    setIsEditModalOpen(true);
  };

  const hasUnsavedEditChanges =
    editForm.middleName !== initialEditForm.middleName ||
    editForm.firstName !== initialEditForm.firstName ||
    editForm.status !== initialEditForm.status ||
    editForm.classId !== initialEditForm.classId;

  const handleCloseEditModal = () => {
    if (isEditSubmitting) return;
    if (hasUnsavedEditChanges && !confirm('Bạn có thay đổi chưa lưu. Bạn có chắc muốn đóng?')) {
      return;
    }
    setIsEditModalOpen(false);
    setEditingStudent(null);
    setEditError('');
  };

  useEffect(() => {
    if (!isEditModalOpen || !hasUnsavedEditChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isEditModalOpen, hasUnsavedEditChanges]);

  const handleEditFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setEditError('');
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitEditStudent = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingStudent) return;

    const middleName = editForm.middleName.trim();
    const firstName = editForm.firstName.trim();
    const status = editForm.status.trim();

    if (!middleName || !firstName) {
      setEditError('Vui lòng nhập đầy đủ họ tên đệm và tên.');
      return;
    }

    if (!VALID_STATUSES.includes(status)) {
      setEditError('Trạng thái không hợp lệ.');
      return;
    }

    setIsEditSubmitting(true);
    setEditError('');
    try {
      await studentService.updateStudent(
        editingStudent.id,
        {
          middleName,
          firstName,
          status,
          classId: editForm.classId || selectedClass.id,
        },
        getAccessToken
      );
      await loadStudents();
      setIsEditModalOpen(false);
      setEditingStudent(null);
      setFlashMessage('Cap nhat hoc sinh thanh cong.');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Cap nhat hoc sinh that bai.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-2 sm:p-4">
      {flashMessage && (
        <div className="mb-3 rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
          {flashMessage}
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
          Danh sách học sinh - {selectedClass.name}
        </h1>

        <div className="flex flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handleGrade}
            disabled={students.length === 0}
            className="w-1/2 sm:w-auto bg-purple-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-purple-700 disabled:bg-gray-400 text-base sm:text-lg font-semibold disabled:cursor-not-allowed"
            title="Chấm điểm cho cả lớp"
          >
            <FileCheck2 size={20} />
            Chấm điểm cho cả lớp
          </button>

          <button
            onClick={handleOpenViewScoresModal}
            className="w-1/2 sm:w-auto bg-gray-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-gray-700 text-base sm:text-lg ml-0"
          >
            <Eye size={18} />
            Xem bảng điểm lớp
          </button>
        </div>
      </div>

      <ClassAnalyticsPanel classId={selectedClass.id} assignments={assignments} />

      <div className="bg-white shadow rounded-lg overflow-x-auto w-full">
        <table className="min-w-[650px] w-full divide-y divide-gray-200 text-xs sm:text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase">STT</th>
              <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase">Họ và tên đệm</th>
              <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase">Tên</th>
              <th className="px-2 sm:px-6 py-3 text-center font-medium text-gray-500 uppercase">Trạng thái</th>
              <th className="px-2 sm:px-6 py-3 text-center font-medium text-gray-500 uppercase">Hành động</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-center text-gray-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-2 py-4 text-center text-gray-500">
                  Chưa có học sinh nào. Vui lòng import file Excel.
                </td>
              </tr>
            ) : (
              students.map((st, index) => (
                <tr key={st.id} className="hover:bg-gray-50">
                  {(() => {
                    const normalizedStatus = (st.status || '').trim().toLowerCase();
                    const isStudentActive =
                      normalizedStatus === 'active' ||
                      (normalizedStatus === '' && Boolean(st.isActive));

                    return (
                      <>
                  <td className="px-2 sm:px-6 py-4 text-gray-500">{index + 1}</td>
                  <td className="px-2 sm:px-6 py-4 font-medium text-gray-900">{st.middleName}</td>
                  <td className="px-2 sm:px-6 py-4 font-medium text-gray-900">{st.firstName}</td>
                  <td className="px-2 sm:px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isStudentActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {isStudentActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {isStudentActive ? 'Hoạt động' : 'Ngừng'}
                    </span>
                  </td>
                  <td className="px-2 sm:px-6 py-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleOpenEditStudent(st)}
                      disabled={st.id.startsWith('temp-')}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      <Pencil size={14} />
                      Sửa
                    </button>
                  </td>
                      </>
                    );
                  })()}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-4">
        <button
          onClick={loadStudents}
          disabled={isLoading}
          className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-gray-700 disabled:bg-gray-400"
          title="Tải lại danh sách"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Tải lại
        </button>

        <input
          type="file"
          onChange={handleFileUpload}
          accept=".xlsx, .xls"
          className="hidden"
          id="import-excel"
        />

        <label
          htmlFor="import-excel"
          className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md cursor-pointer flex items-center justify-center gap-2 hover:bg-green-700"
        >
          <Upload size={18} /> Import Excel
        </label>

        {studentNewList.length > 0 && (
          <button
            onClick={handleSaveStudents}
            disabled={isLoading}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-md flex items-center gap-2 hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Save size={18} />
            {isLoading ? 'Đang lưu...' : 'Lưu danh sách'}
          </button>
        )}
      </div>

      <GradingModal
        isOpen={isGradingModalOpen}
        onClose={() => setIsGradingModalOpen(false)}
        classId={selectedClass.id}
        students={students}
        onSuccess={handleGradingSuccess}
      />

      <ViewAllScoresModal
        isOpen={isViewScoresModal}
        onClose={() => setIsViewScoresModal(false)}
        assignments={assignments}
        students={students}
        scores={scores.map((s) => ({
          studentId: s.studentId,
          assignmentId: s.assignmentId,
          scoreValue: typeof s.scoreValue === 'number' ? s.scoreValue : 0,
        }))}
      />

      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Sửa học sinh</h2>
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                disabled={isEditSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitEditStudent} className="space-y-4 px-5 py-4">
              {editError && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {editError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Họ và tên đệm</label>
                <input
                  name="middleName"
                  value={editForm.middleName}
                  onChange={handleEditFieldChange}
                  disabled={isEditSubmitting}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Nguyen Van"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tên</label>
                <input
                  name="firstName"
                  value={editForm.firstName}
                  onChange={handleEditFieldChange}
                  disabled={isEditSubmitting}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="A"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái</label>
                <select
                  name="status"
                  value={editForm.status}
                  onChange={handleEditFieldChange}
                  disabled={isEditSubmitting}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={isEditSubmitting}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isEditSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
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
      )}
    </div>
  );
};

export default StudentList;
