import { useState, useEffect, useMemo, useCallback, useRef, type ChangeEvent } from 'react';
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
import { Upload, FileCheck2, Eye, Save, RefreshCw, Pencil, X, Loader2, CheckCircle2, XCircle, Search, UserPlus, Trash2, ClipboardPaste } from 'lucide-react';

type EditStudentForm = {
  middleName: string;
  firstName: string;
  status: string;
  competencyLevel: '' | 'A' | 'B' | 'C' | 'D';
  notes: string;
  classId: string;
};

type AddStudentForm = {
  middleName: string;
  firstName: string;
  status: string;
  competencyLevel: '' | 'A' | 'B' | 'C' | 'D';
  notes: string;
};

const VALID_STATUSES = ['Active', 'Inactive'];
const VALID_COMPETENCY_LEVELS = ['A', 'B', 'C', 'D'] as const;
const vietnameseCollator = new Intl.Collator('vi', {
  sensitivity: 'variant',
  numeric: true,
});

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
    competencyLevel: '',
    notes: '',
    classId: '',
  });
  const [initialEditForm, setInitialEditForm] = useState<EditStudentForm>({
    middleName: '',
    firstName: '',
    status: 'Active',
    competencyLevel: '',
    notes: '',
    classId: '',
  });
  const [searchKeyword, setSearchKeyword] = useState('');
  const [nameSortDirection, setNameSortDirection] = useState<'none' | 'asc' | 'desc'>('none');
  const [statusSortDirection, setStatusSortDirection] = useState<'none' | 'active-first' | 'inactive-first'>('none');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddSubmitting, setIsAddSubmitting] = useState(false);
  const [addError, setAddError] = useState('');
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteInput, setPasteInput] = useState('');
  const [pasteError, setPasteError] = useState('');
  const [inlineSavingStudentId, setInlineSavingStudentId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<AddStudentForm>({
    middleName: '',
    firstName: '',
    status: 'Active',
    competencyLevel: '',
    notes: '',
  });
  const latestScoresRequestRef = useRef(0);
  const { getAccessToken } = useAuth();

  const normalizeText = (value?: string) =>
    (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();

  const isStudentActive = useCallback((student: Student): boolean => {
    const normalizedStatus = normalizeText(student.status);
    if (normalizedStatus) {
      return normalizedStatus === 'active';
    }
    return Boolean(student.isActive);
  }, []);

  const competencyBadgeClass = (level?: string) => {
    if (level === 'A') return 'bg-emerald-100 text-emerald-700';
    if (level === 'B') return 'bg-blue-100 text-blue-700';
    if (level === 'C') return 'bg-amber-100 text-amber-700';
    if (level === 'D') return 'bg-rose-100 text-rose-700';
    return 'bg-gray-100 text-gray-600';
  };

  const loadScores = useCallback(async () => {
    const requestId = ++latestScoresRequestRef.current;
    try {
      const data = await scoreService.getByClass(selectedClass.id, getAccessToken);
      if (requestId === latestScoresRequestRef.current) {
        setScores(data);
      }
      return data;
    } catch {
      if (requestId === latestScoresRequestRef.current) {
        setScores([]);
      }
      return [];
    }
  }, [selectedClass.id, getAccessToken]);

  useEffect(() => {
    if (selectedClass?.id) {
      loadStudents();
      loadAssignments();
      void loadScores();
    }
    // eslint-disable-next-line
  }, [selectedClass?.id, loadScores]);

  const handleOpenViewScoresModal = () => {
    setIsViewScoresModal(true);
    void loadScores();
  };

  const studentNewList = students.filter((st) => st.id.startsWith('temp-'));
  const displayedStudents = useMemo(() => {
    const keyword = normalizeText(searchKeyword);
    let list = [...students];

    if (keyword) {
      list = list.filter((st) => normalizeText(`${st.middleName} ${st.firstName}`).includes(keyword));
    }

    if (nameSortDirection === 'asc') {
      list.sort((a, b) => {
        const byFirstName = vietnameseCollator.compare(a.firstName || '', b.firstName || '');
        if (byFirstName !== 0) return byFirstName;
        return vietnameseCollator.compare(a.middleName || '', b.middleName || '');
      });
    } else if (nameSortDirection === 'desc') {
      list.sort((a, b) => {
        const byFirstName = vietnameseCollator.compare(b.firstName || '', a.firstName || '');
        if (byFirstName !== 0) return byFirstName;
        return vietnameseCollator.compare(b.middleName || '', a.middleName || '');
      });
    } else if (statusSortDirection === 'active-first') {
      list.sort((a, b) => Number(isStudentActive(b)) - Number(isStudentActive(a)));
    } else if (statusSortDirection === 'inactive-first') {
      list.sort((a, b) => Number(isStudentActive(a)) - Number(isStudentActive(b)));
    }

    return list;
  }, [students, searchKeyword, nameSortDirection, statusSortDirection, isStudentActive]);

  const activeStudents = useMemo(
    () => students.filter((student) => isStudentActive(student)),
    [students, isStudentActive]
  );

  const toggleNameSort = () => {
    setStatusSortDirection('none');
    setNameSortDirection((prev) => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  };

  const toggleStatusSort = () => {
    setNameSortDirection('none');
    setStatusSortDirection((prev) => {
      if (prev === 'none') return 'active-first';
      if (prev === 'active-first') return 'inactive-first';
      return 'none';
    });
  };

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

  const appendImportedStudents = (imported: Student[]) => {
    setStudents((prev) => {
      const persisted = prev.filter((student) => !student.id.startsWith('temp-'));
      return [...persisted, ...imported];
    });
  };

  const detectHeader = (rows: Array<Array<string | number | undefined>>): boolean => {
    if (rows.length === 0) return false;
    const normalize = (value: string | number | undefined): string =>
      String(value ?? '').trim().toLowerCase();
    const firstCol = normalize(rows[0]?.[0]);
    const secondCol = normalize(rows[0]?.[1]);
    return (
      (firstCol.includes('ho') || firstCol.includes('họ') || firstCol.includes('middle')) &&
      (secondCol.includes('ten') || secondCol.includes('tên') || secondCol.includes('first'))
    );
  };

  const mapRowsToTempStudents = (rows: Array<Array<string | number | undefined>>): Student[] => {
    const startRowIndex = detectHeader(rows) ? 1 : 0;
    return rows
      .slice(startRowIndex)
      .map((row, index) => {
        const middleName = String(row[0] ?? '').trim();
        const firstName = String(row[1] ?? '').trim();
        if (!firstName) return null;
        return {
          id: `temp-${Date.now()}-${index + 1}`,
          middleName,
          firstName,
          status: 'Active',
          isActive: true,
          gradingApiEndpoint: String(row[2] ?? '').trim(),
        } as Student;
      })
      .filter((student): student is Student => student !== null);
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
      const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as Array<Array<string | number>>;
      const list = mapRowsToTempStudents(data);

      if (list.length === 0) {
        setFlashMessage('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
        return;
      }

      appendImportedStudents(list);
      setFlashMessage(`Đã nhận ${list.length} học sinh từ file Excel. Bấm "Lưu danh sách" để lưu.`);
    };

    reader.readAsBinaryString(file);
  };

  const parsePastedRows = (rawText: string): string[][] =>
    rawText
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        if (line.includes('\t')) {
          return line.split('\t').map((cell) => cell.trim());
        }
        return line.trim().split(/\s{2,}/).map((cell) => cell.trim());
      });

  const handleOpenPasteModal = () => {
    setPasteInput('');
    setPasteError('');
    setIsPasteModalOpen(true);
  };

  const handleImportFromPaste = () => {
    if (!pasteInput.trim()) {
      setPasteError('Bạn chưa dán dữ liệu.');
      return;
    }

    const rows = parsePastedRows(pasteInput);
    const list = mapRowsToTempStudents(rows);

    if (list.length === 0) {
      setPasteError('Dữ liệu cần có tối thiểu 2 cột: Họ và tên đệm, Tên.');
      return;
    }

    appendImportedStudents(list);
    setIsPasteModalOpen(false);
    setPasteInput('');
    setPasteError('');
    setFlashMessage(`Đã nhận ${list.length} học sinh từ dữ liệu dán. Bấm "Lưu danh sách" để lưu.`);
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

  const handleOpenAddStudentModal = () => {
    setAddForm({
      middleName: '',
      firstName: '',
      status: 'Active',
      competencyLevel: '',
      notes: '',
    });
    setAddError('');
    setIsAddModalOpen(true);
  };

  const handleAddStudent = async (event: React.FormEvent) => {
    event.preventDefault();

    const middleName = addForm.middleName.trim();
    const firstName = addForm.firstName.trim();
    if (!firstName) {
      setAddError('Vui lòng nhập tên.');
      return;
    }
    if (!VALID_STATUSES.includes(addForm.status)) {
      setAddError('Trạng thái không hợp lệ.');
      return;
    }

    if (addForm.competencyLevel && !VALID_COMPETENCY_LEVELS.includes(addForm.competencyLevel)) {
      setAddError('Mức năng lực không hợp lệ.');
      return;
    }

    setIsAddSubmitting(true);
    setAddError('');
    try {
      const notes = addForm.notes.trim();
      await studentService.createStudent(
        {
          middleName,
          firstName,
          status: addForm.status,
          competencyLevel: addForm.competencyLevel,
          notes,
          classId: selectedClass.id,
        },
        getAccessToken
      );
      await loadStudents();
      setIsAddModalOpen(false);
      setFlashMessage('Thêm học sinh thành công.');
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Không thể thêm học sinh.');
    } finally {
      setIsAddSubmitting(false);
    }
  };

  const handleDeleteStudent = async (student: Student) => {
    const fullName = `${student.middleName} ${student.firstName}`.trim();
    if (!confirm(`Bạn có chắc muốn xóa học sinh "${fullName}"?`)) {
      return;
    }

    if (student.id.startsWith('temp-')) {
      setStudents((prev) => prev.filter((st) => st.id !== student.id));
      setFlashMessage('Đã xóa học sinh tạm khỏi danh sách.');
      return;
    }

    setIsLoading(true);
    try {
      await studentService.deleteStudent(student.id, getAccessToken);
      await loadStudents();
      setFlashMessage('Xóa học sinh thành công.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể xóa học sinh.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGrade = () => {
    if (activeStudents.length === 0) {
      alert('Không có học sinh đang hoạt động để chấm điểm!');
      return;
    }

    setIsGradingModalOpen(true);
  };

  const handleInlineCompetencyChange = async (student: Student, level: '' | 'A' | 'B' | 'C' | 'D') => {
    if (student.id.startsWith('temp-')) {
      setStudents((prev) =>
        prev.map((item) => (item.id === student.id ? { ...item, competencyLevel: level } : item))
      );
      return;
    }

    const status = VALID_STATUSES.includes(student.status || '')
      ? (student.status as string)
      : (isStudentActive(student) ? 'Active' : 'Inactive');

    setInlineSavingStudentId(student.id);
    try {
      const updatedStudent = await studentService.updateStudent(
        student.id,
        {
          middleName: student.middleName?.trim() || '',
          firstName: student.firstName?.trim() || '',
          status,
          competencyLevel: level,
          notes: student.notes?.trim() || '',
          classId: student.classId || selectedClass.id,
        },
        getAccessToken
      );

      setStudents((prev) =>
        prev.map((item) =>
          item.id === student.id
            ? {
                ...item,
                competencyLevel: (updatedStudent.competencyLevel ?? level) as '' | 'A' | 'B' | 'C' | 'D',
                notes: updatedStudent.notes ?? item.notes,
                status: updatedStudent.status ?? item.status,
              }
            : item
        )
      );
      setFlashMessage('Cập nhật năng lực thành công.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể cập nhật năng lực học sinh.');
    } finally {
      setInlineSavingStudentId(null);
    }
  };

  const handleGradingSuccess = async () => {
    await loadScores();
  };

  useEffect(() => {
    if (!flashMessage) return;
    const timer = window.setTimeout(() => setFlashMessage(''), 2500);
    return () => window.clearTimeout(timer);
  }, [flashMessage]);

  useEffect(() => {
    if (!inlineSavingStudentId) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [inlineSavingStudentId]);

  const handleOpenEditStudent = (student: Student) => {
    if (student.id.startsWith('temp-')) {
      alert('Học sinh chưa được lưu lên hệ thống, không thể sửa.');
      return;
    }

    const preset: EditStudentForm = {
      middleName: student.middleName || '',
      firstName: student.firstName || '',
      status: VALID_STATUSES.includes(student.status || '')
        ? (student.status as string)
        : (student.isActive ? 'Active' : 'Inactive'),
      competencyLevel: (student.competencyLevel || '') as '' | 'A' | 'B' | 'C' | 'D',
      notes: student.notes || '',
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
    editForm.competencyLevel !== initialEditForm.competencyLevel ||
    editForm.notes !== initialEditForm.notes ||
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

  const handleEditFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    if (!firstName) {
      setEditError('Vui lòng nhập tên.');
      return;
    }

    if (!VALID_STATUSES.includes(status)) {
      setEditError('Trạng thái không hợp lệ.');
      return;
    }

    if (editForm.competencyLevel && !VALID_COMPETENCY_LEVELS.includes(editForm.competencyLevel)) {
      setEditError('Mức năng lực không hợp lệ.');
      return;
    }

    setIsEditSubmitting(true);
    setEditError('');
    try {
      const notes = editForm.notes.trim();
      await studentService.updateStudent(
        editingStudent.id,
        {
          middleName,
          firstName,
          status,
          competencyLevel: editForm.competencyLevel,
          notes,
          classId: editForm.classId || selectedClass.id,
        },
        getAccessToken
      );
      await loadStudents();
      setIsEditModalOpen(false);
      setEditingStudent(null);
      setFlashMessage('Cập nhật học sinh thành công.');
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Cập nhật học sinh thất bại.');
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
          Bảng danh sách học sinh - {selectedClass.name}
        </h1>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={handleOpenAddStudentModal}
            className="w-full sm:w-auto bg-emerald-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-emerald-700"
          >
            <UserPlus size={18} />
            Thêm học sinh
          </button>
          <button
            onClick={handleGrade}
            disabled={activeStudents.length === 0}
            className="w-full sm:w-auto bg-purple-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-purple-700 disabled:bg-gray-400 text-base sm:text-lg font-semibold disabled:cursor-not-allowed"
            title="Chấm điểm cho học sinh đang hoạt động"
          >
            <FileCheck2 size={20} />
            Chấm điểm cho lớp
          </button>
          <button
            onClick={handleOpenViewScoresModal}
            className="w-full sm:w-auto bg-gray-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-gray-700 text-base sm:text-lg ml-0"
          >
            <Eye size={18} />
            Xem bảng điểm lớp
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="relative lg:col-span-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="Tìm kiếm theo tên học sinh..."
            className="w-full rounded-md border border-gray-300 bg-white pl-9 pr-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="lg:col-span-2 flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm">
          <span className="text-gray-600">
            Hiển thị {displayedStudents.length}/{students.length} học sinh
          </span>
          <span className="text-xs text-gray-500">
            Bấm vào tiêu đề cột <strong>Tên</strong> hoặc <strong>Trạng thái</strong> để sắp xếp
          </span>
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:gap-4">
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
          <Upload size={18} /> Nhập Excel
        </label>

        <button
          type="button"
          onClick={handleOpenPasteModal}
          className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center justify-center gap-2 hover:bg-indigo-700"
        >
          <ClipboardPaste size={18} /> Dán từ Excel
        </button>

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

      <ClassAnalyticsPanel classId={selectedClass.id} assignments={assignments} />

      <div className="bg-white shadow rounded-lg overflow-x-auto w-full">
        <table className="min-w-[980px] w-full divide-y divide-gray-200 text-xs sm:text-sm">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase">STT</th>
              <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase">Họ và tên đệm</th>
              <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase">
                <button
                  type="button"
                  onClick={toggleNameSort}
                  className="inline-flex items-center gap-1 hover:text-gray-700"
                  title="Sắp xếp theo tên"
                >
                  Tên
                  <span className="text-[10px] text-gray-400">
                    {nameSortDirection === 'asc' ? '▲' : nameSortDirection === 'desc' ? '▼' : '⇅'}
                  </span>
                </button>
              </th>
              <th className="px-2 sm:px-6 py-3 text-center font-medium text-gray-500 uppercase">Năng lực</th>
              <th className="px-2 sm:px-6 py-3 text-left font-medium text-gray-500 uppercase">Ghi chú</th>
              <th className="px-2 sm:px-6 py-3 text-center font-medium text-gray-500 uppercase">
                <button
                  type="button"
                  onClick={toggleStatusSort}
                  className="inline-flex items-center gap-1 hover:text-gray-700"
                  title="Sắp xếp theo trạng thái"
                >
                  Trạng thái
                  <span className="text-[10px] text-gray-400">
                    {statusSortDirection === 'active-first' ? '▲' : statusSortDirection === 'inactive-first' ? '▼' : '⇅'}
                  </span>
                </button>
              </th>
              <th className="px-2 sm:px-6 py-3 text-center font-medium text-gray-500 uppercase">Hành động</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-2 py-4 text-center text-gray-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : displayedStudents.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-2 py-4 text-center text-gray-500">
                  {students.length === 0
                    ? 'Chưa có học sinh nào. Vui lòng nhập file Excel.'
                    : 'Không có học sinh nào khớp từ khóa tìm kiếm.'}
                </td>
              </tr>
            ) : (
              displayedStudents.map((st, index) => {
                const isActive = isStudentActive(st);
                return (
                <tr
                  key={st.id}
                  className={`transition-colors ${
                    isActive ? 'hover:bg-gray-50' : 'bg-rose-50 hover:bg-rose-100/80'
                  }`}
                >
                  <td className="px-2 sm:px-6 py-4 text-gray-500">{index + 1}</td>
                  <td className="px-2 sm:px-6 py-4 font-medium text-gray-900">{st.middleName}</td>
                  <td className="px-2 sm:px-6 py-4 font-medium text-gray-900">{st.firstName}</td>
                  <td className="px-2 sm:px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <select
                        value={st.competencyLevel || ''}
                        disabled={inlineSavingStudentId === st.id}
                        onChange={(event) =>
                          handleInlineCompetencyChange(
                            st,
                            event.target.value as '' | 'A' | 'B' | 'C' | 'D'
                          )
                        }
                        className={`w-[72px] rounded-full border px-2 py-1 text-xs font-semibold text-center outline-none transition ${competencyBadgeClass(st.competencyLevel)} ${
                          inlineSavingStudentId === st.id ? 'cursor-not-allowed opacity-70' : 'hover:brightness-95'
                        }`}
                        title={st.id.startsWith('temp-') ? 'Học sinh tạm, sẽ lưu cùng danh sách học sinh.' : 'Cập nhật nhanh năng lực'}
                      >
                        <option value="">--</option>
                        {VALID_COMPETENCY_LEVELS.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                      {inlineSavingStudentId === st.id && (
                        <span className="text-[10px] text-gray-500">Đang lưu...</span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 sm:px-6 py-4 text-gray-700">
                    <div className="max-w-[260px] truncate" title={st.notes || ''}>
                      {st.notes?.trim() || '--'}
                    </div>
                  </td>
                  <td className="px-2 sm:px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {isActive ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                      {isActive ? 'Hoạt động' : 'Ngừng'}
                    </span>
                  </td>
                  <td className="px-2 sm:px-6 py-4 text-center">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditStudent(st)}
                        disabled={st.id.startsWith('temp-')}
                        className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <Pencil size={14} />
                        Sửa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStudent(st)}
                        className="inline-flex items-center gap-1 rounded-md bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
                      >
                        <Trash2 size={14} />
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              )})
            )}
          </tbody>
        </table>
      </div>

      <GradingModal
        isOpen={isGradingModalOpen}
        onClose={() => setIsGradingModalOpen(false)}
        classId={selectedClass.id}
        students={activeStudents}
        onSuccess={handleGradingSuccess}
      />

      <ViewAllScoresModal
        isOpen={isViewScoresModal}
        onClose={() => setIsViewScoresModal(false)}
        assignments={assignments}
        students={students}
        classDisplayName={selectedClass.name}
        onStudentClassificationUpdated={(studentId, classification) => {
          setStudents((prev) =>
            prev.map((student) =>
              student.id === studentId ? { ...student, competencyLevel: classification } : student
            )
          );
        }}
        onStudentNotesUpdated={(studentId, notes) => {
          setStudents((prev) =>
            prev.map((student) => (student.id === studentId ? { ...student, notes } : student))
          );
        }}
        scores={scores.map((s) => ({
          studentId: s.studentId,
          assignmentId: s.assignmentId,
          assignmentName: s.assignmentName,
          scoreValue: typeof s.scoreValue === 'number' ? s.scoreValue : 0,
          autoGradingErrors: s.autoGradingErrors || [],
        }))}
      />

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Thêm học sinh</h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                disabled={isAddSubmitting}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="space-y-4 px-5 py-4">
              {addError && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {addError}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Họ và tên đệm</label>
                <input
                  value={addForm.middleName}
                  onChange={(event) => setAddForm((prev) => ({ ...prev, middleName: event.target.value }))}
                  disabled={isAddSubmitting}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Nguyễn Văn"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Tên</label>
                <input
                  value={addForm.firstName}
                  onChange={(event) => setAddForm((prev) => ({ ...prev, firstName: event.target.value }))}
                  disabled={isAddSubmitting}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="An"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Trạng thái</label>
                <select
                  value={addForm.status}
                  onChange={(event) => setAddForm((prev) => ({ ...prev, status: event.target.value }))}
                  disabled={isAddSubmitting}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Ngừng hoạt động</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Đánh giá năng lực</label>
                <select
                  value={addForm.competencyLevel}
                  onChange={(event) =>
                    setAddForm((prev) => ({ ...prev, competencyLevel: event.target.value as '' | 'A' | 'B' | 'C' | 'D' }))
                  }
                  disabled={isAddSubmitting}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Chưa đánh giá</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea
                  value={addForm.notes}
                  onChange={(event) => setAddForm((prev) => ({ ...prev, notes: event.target.value }))}
                  disabled={isAddSubmitting}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Nhận xét thêm về học sinh..."
                />
              </div>

              <div className="flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={isAddSubmitting}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isAddSubmitting}
                  className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isAddSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
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
      )}

      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Dán danh sách học sinh</h2>
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 px-5 py-4">
              <p className="text-sm text-gray-600">
                Copy trực tiếp 2 cột từ Excel theo thứ tự: <strong>Họ và tên đệm</strong>, <strong>Tên</strong>, rồi dán vào ô bên dưới.
              </p>
              <textarea
                value={pasteInput}
                onChange={(event) => setPasteInput(event.target.value)}
                placeholder={'Ví dụ:\nNinh Hoàng\tAnh\nNguyễn Phan\tAnh'}
                className="h-64 w-full resize-y rounded-md border border-gray-300 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {pasteError && (
                <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {pasteError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
              <button
                type="button"
                onClick={() => setIsPasteModalOpen(false)}
                className="rounded-md border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleImportFromPaste}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                Dán và thêm vào danh sách
              </button>
            </div>
          </div>
        </div>
      )}

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
                  placeholder="Nguyễn Văn"
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
                  <option value="Active">Hoạt động</option>
                  <option value="Inactive">Ngừng hoạt động</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Đánh giá năng lực</label>
                <select
                  name="competencyLevel"
                  value={editForm.competencyLevel}
                  onChange={handleEditFieldChange}
                  disabled={isEditSubmitting}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Chưa đánh giá</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Ghi chú</label>
                <textarea
                  name="notes"
                  value={editForm.notes}
                  onChange={handleEditFieldChange}
                  disabled={isEditSubmitting}
                  rows={3}
                  maxLength={500}
                  className="w-full rounded-md border px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Nhận xét thêm về học sinh..."
                />
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



