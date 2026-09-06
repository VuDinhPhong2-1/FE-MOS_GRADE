import { useState, useMemo, useCallback, type ChangeEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx-js-style';
import { useAuth } from '../context/AuthContext';
import ClassAnalyticsPanel from '../components/ClassAnalyticsPanel';
import type { Student } from '../types/student.types';
import {
  type StudentListProps,
  type NameSortDirection,
  type StatusSortDirection,
  vietnameseCollator,
  normalizeText,
  isStudentActive,
  useStudentData,
  mapRowsToTempStudents,
  StudentHeader,
  StudentToolbar,
  StudentTable,
  AddStudentModal,
  EditStudentModal,
  PasteStudentModal,
} from '../components/StudentList';

const StudentList = ({ selectedClass, readOnly = false }: StudentListProps) => {
  const { getAccessToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [nameSortDirection, setNameSortDirection] = useState<NameSortDirection>('none');
  const [statusSortDirection, setStatusSortDirection] = useState<StatusSortDirection>('none');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);

  const {
    students,
    assignments,
    isLoading,
    isStudentMetadataSyncing,
    inlineSavingStudentId,
    flashMessage,
    setFlashMessage,
    studentNewList,
    activeStudents,
    inactiveStudentsCount,
    loadStudents,
    appendImportedStudents,
    handleSaveStudents,
    handleDeleteStudent,
    handleInlineCompetencyChange,
    handleInlineExamToggle,
    handleSyncStudentMetadataToGoogleSheet,
  } = useStudentData({ selectedClass, readOnly, getAccessToken });

  const displayedStudents = useMemo(() => {
    const keyword = normalizeText(searchKeyword);
    let list = [...students];

    if (keyword) {
      list = list.filter((st) =>
        normalizeText(`${st.middleName} ${st.firstName}`).includes(keyword)
      );
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
  }, [students, searchKeyword, nameSortDirection, statusSortDirection]);

  const toggleNameSort = useCallback(() => {
    setStatusSortDirection('none');
    setNameSortDirection((prev) => {
      if (prev === 'none') return 'asc';
      if (prev === 'asc') return 'desc';
      return 'none';
    });
  }, []);

  const toggleStatusSort = useCallback(() => {
    setNameSortDirection('none');
    setStatusSortDirection((prev) => {
      if (prev === 'none') return 'active-first';
      if (prev === 'active-first') return 'inactive-first';
      return 'none';
    });
  }, []);

  const selectedClassId = selectedClass?.id;
  const selectedClassName = selectedClass?.name;
  const returnPath = `${location.pathname}${location.search}`;

  const handleOpenViewScoresModal = useCallback(() => {
    if (!selectedClassId) return;
    navigate(`/scores/class/${selectedClassId}`, {
      state: {
        className: selectedClassName,
        returnPath,
      },
    });
  }, [selectedClassId, selectedClassName, returnPath, navigate]);

  const handleGrade = useCallback(() => {
    if (readOnly) {
      alert('Bạn chỉ có quyền xem lớp này.');
      return;
    }

    if (activeStudents.length === 0) {
      alert('Không có học sinh đang hoạt động để chấm điểm!');
      return;
    }

    if (!selectedClassId) return;

    navigate(`/grading/class/${selectedClassId}`, {
      state: {
        className: selectedClassName,
        returnPath,
      },
    });
  }, [readOnly, activeStudents.length, selectedClassId, selectedClassName, returnPath, navigate]);

  const handleFileUpload = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (readOnly) return;

      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: '',
        }) as Array<Array<string | number>>;
        const list = mapRowsToTempStudents(data);

        if (list.length === 0) {
          setFlashMessage('Không tìm thấy dữ liệu hợp lệ trong file Excel.');
          return;
        }

        appendImportedStudents(list);
        setFlashMessage(
          `Đã nhận ${list.length} học sinh từ file Excel. Bấm "Lưu danh sách" để lưu.`
        );
      };

      reader.readAsBinaryString(file);
    },
    [readOnly, appendImportedStudents, setFlashMessage]
  );

  const handleOpenEditStudent = useCallback(
    (student: Student) => {
      if (readOnly) {
        alert('Bạn chỉ có quyền xem lớp này.');
        return;
      }

      if (student.id.startsWith('temp-')) {
        alert('Học sinh chưa được lưu lên hệ thống, không thể sửa.');
        return;
      }

      setEditingStudent(student);
      setIsEditModalOpen(true);
    },
    [readOnly]
  );

  const handleCloseEditModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingStudent(null);
  }, []);

  const handleEditSuccess = useCallback(
    async (message: string) => {
      await loadStudents();
      setFlashMessage(message);
    },
    [loadStudents, setFlashMessage]
  );

  const handleAddSuccess = useCallback(
    async (message: string) => {
      await loadStudents();
      setFlashMessage(message);
    },
    [loadStudents, setFlashMessage]
  );

  const handleImportFromPaste = useCallback(
    (list: Student[]) => {
      appendImportedStudents(list);
      setFlashMessage(
        `Đã nhận ${list.length} học sinh từ dữ liệu dán. Bấm "Lưu danh sách" để lưu.`
      );
    },
    [appendImportedStudents, setFlashMessage]
  );

  return (
    <div className="mx-auto w-full space-y-4 px-2 pb-4 sm:px-4">
      {flashMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          {flashMessage}
        </div>
      )}
      {readOnly && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 shadow-sm">
          Bạn chỉ có quyền xem lớp này. Các chức năng chỉnh sửa đã bị khóa.
        </div>
      )}

      {/* Hero Header & Action Buttons */}
      <StudentHeader
        className={selectedClass.name}
        totalCount={students.length}
        activeCount={activeStudents.length}
        inactiveCount={inactiveStudentsCount}
        newCount={studentNewList.length}
        readOnly={readOnly}
        isStudentMetadataSyncing={isStudentMetadataSyncing}
        isLoading={isLoading}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onGrade={handleGrade}
        onSyncMetadata={handleSyncStudentMetadataToGoogleSheet}
        onOpenViewScores={handleOpenViewScoresModal}
      />

      {/* Class Analytics Panel */}
      <ClassAnalyticsPanel classId={selectedClass.id} assignments={assignments} />

      {/* Search, Filter & Toolbar Actions */}
      <StudentToolbar
        searchKeyword={searchKeyword}
        onSearchChange={setSearchKeyword}
        displayedCount={displayedStudents.length}
        totalCount={students.length}
        isLoading={isLoading}
        readOnly={readOnly}
        newCount={studentNewList.length}
        onReload={loadStudents}
        onFileUpload={handleFileUpload}
        onOpenPasteModal={() => setIsPasteModalOpen(true)}
        onSaveStudents={handleSaveStudents}
      />

      {/* Main Students Data Table */}
      <StudentTable
        displayedStudents={displayedStudents}
        totalStudentsCount={students.length}
        isLoading={isLoading}
        readOnly={readOnly}
        inlineSavingStudentId={inlineSavingStudentId}
        nameSortDirection={nameSortDirection}
        statusSortDirection={statusSortDirection}
        onToggleNameSort={toggleNameSort}
        onToggleStatusSort={toggleStatusSort}
        onCompetencyChange={handleInlineCompetencyChange}
        onExamToggle={handleInlineExamToggle}
        onEdit={handleOpenEditStudent}
        onDelete={handleDeleteStudent}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={isAddModalOpen}
        classId={selectedClass.id}
        readOnly={readOnly}
        getAccessToken={getAccessToken}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        student={editingStudent}
        isOpen={isEditModalOpen}
        classId={selectedClass.id}
        readOnly={readOnly}
        getAccessToken={getAccessToken}
        onClose={handleCloseEditModal}
        onSuccess={handleEditSuccess}
      />

      {/* Paste From Clipboard / Excel Modal */}
      <PasteStudentModal
        isOpen={isPasteModalOpen}
        readOnly={readOnly}
        onClose={() => setIsPasteModalOpen(false)}
        onImportStudents={handleImportFromPaste}
      />
    </div>
  );
};

export default StudentList;
