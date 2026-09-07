import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { classService } from '../../services/class.service';
import { authService } from '../../services/auth.service';
import studentService from '../../services/student.service';
import type { School } from '../../types';
import type { Class, CreateClassRequest, UpdateClassRequest } from '../../types/class.types';
import type { TeacherSummary } from '../../types/auth.types';
import { notify } from '../../utils/notify';
import {
  getGradeOrderValue,
  mapClassApiError,
  normalizeSearchText,
  OBJECT_ID_REGEX,
} from './utils/classlist.utils';

export function useClassList(selectedSchool: School) {
  const { getAccessToken, logout, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Class data state
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters state
  const [showInactive, setShowInactive] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [classSearchActive, setClassSearchActive] = useState(false);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('');

  // Form modal state (Add / Edit)
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState<CreateClassRequest>({
    name: '',
    schoolId: selectedSchool.id,
    description: '',
    maxStudents: undefined,
    academicYear: '2024-2025',
    grade: '',
  });

  // Handover modal state
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [handoverClass, setHandoverClass] = useState<Class | null>(null);
  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [isLoadingTeachers, setIsLoadingTeachers] = useState(false);
  const [handoverError, setHandoverError] = useState('');
  const [handoverBusyTeacherId, setHandoverBusyTeacherId] = useState<string | null>(null);
  const [handoverSearch, setHandoverSearch] = useState('');

  // Delete modal state
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);
  const [isDeletingClass, setIsDeletingClass] = useState(false);

  const schoolIdForCreate = selectedSchool.id || formData.schoolId || '';
  const currentUserId = user?.userId || '';
  const isAdmin = user?.role === 'Admin';
  const isTeacher = user?.role === 'Teacher';
  const canCreateClass = isAdmin || isTeacher;

  const handleUnauthorized = useCallback(() => {
    logout();
    window.location.href = '/login';
  }, [logout]);

  const canManageClass = useCallback(
    (cls: Class): boolean =>
      isAdmin || cls.ownerId === currentUserId || Boolean(cls.managerTeacherIds?.includes(currentUserId)),
    [currentUserId, isAdmin]
  );

  const canHandoverClass = useCallback(
    (cls: Class): boolean => isAdmin || cls.ownerId === currentUserId,
    [currentUserId, isAdmin]
  );

  const createFormValidation = useMemo(() => {
    const name = (formData.name || '').trim();
    if (!name) return 'Tên lớp là bắt buộc.';

    if (!OBJECT_ID_REGEX.test(schoolIdForCreate)) {
      return 'Trường không hợp lệ.';
    }

    if (typeof formData.maxStudents === 'number') {
      if (!Number.isInteger(formData.maxStudents) || formData.maxStudents < 1 || formData.maxStudents > 200) {
        return 'Sĩ số tối đa phải từ 1 đến 200.';
      }
    }

    if (formData.academicYear && formData.academicYear.length > 20) {
      return 'Năm học không được quá 20 ký tự.';
    }

    if (formData.grade && formData.grade.length > 20) {
      return 'Khối không được quá 20 ký tự.';
    }

    if (formData.description && formData.description.length > 500) {
      return 'Mô tả không được quá 500 ký tự.';
    }

    return '';
  }, [formData, schoolIdForCreate]);

  const isSubmitDisabled = isSubmitting || (!editingClass && Boolean(createFormValidation));

  const visibleClasses = useMemo(() => {
    const searchKeyword = normalizeSearchText(classSearch);

    return [...classes]
      .filter((cls) => {
        const matchesSearch = !searchKeyword || normalizeSearchText(cls.name).includes(searchKeyword);
        const matchesGrade = !selectedGradeFilter || (cls.grade && cls.grade.includes(selectedGradeFilter));
        return matchesSearch && matchesGrade;
      })
      .sort((classA, classB) => {
        const gradeA = getGradeOrderValue(classA.grade);
        const gradeB = getGradeOrderValue(classB.grade);

        if (gradeA !== null && gradeB !== null && gradeA !== gradeB) {
          return gradeA - gradeB;
        }

        if (gradeA !== null && gradeB === null) {
          return -1;
        }

        if (gradeA === null && gradeB !== null) {
          return 1;
        }

        return classA.name.localeCompare(classB.name, 'vi', { numeric: true, sensitivity: 'base' });
      });
  }, [classes, classSearch, selectedGradeFilter]);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const data = await classService.getClassesBySchool(selectedSchool.id, getAccessToken, showInactive);
      const classListWithStudents = await Promise.all(
        data.map(async (cls) => {
          try {
            const students = await studentService.getStudentsByClassId(cls.id, getAccessToken);
            return { ...cls, currentStudents: students.length };
          } catch {
            return { ...cls, currentStudents: cls.studentIds?.length ?? cls.currentStudents ?? 0 };
          }
        })
      );

      setClasses(classListWithStudents);
    } catch (err) {
      setError('Không thể tải danh sách lớp học');
      console.error('Error fetching classes:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSchool.id, getAccessToken, showInactive]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Sync selectedClass from URL params
  useEffect(() => {
    const classId = searchParams.get('classId');
    if (!classId) {
      setSelectedClass(null);
      return;
    }

    const matchedClass = classes.find((cls) => cls.id === classId) || null;
    setSelectedClass(matchedClass);
  }, [classes, searchParams]);

  const handleSelectClass = useCallback(
    (cls: Class) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('schoolId', selectedSchool.id);
      nextParams.set('classId', cls.id);
      setSearchParams(nextParams);
      setSelectedClass(cls);
    },
    [searchParams, selectedSchool.id, setSearchParams]
  );

  const handleBackToClassList = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('schoolId', selectedSchool.id);
    nextParams.delete('classId');
    setSearchParams(nextParams);
    setSelectedClass(null);
  }, [searchParams, selectedSchool.id, setSearchParams]);

  const handleOpenAddModal = useCallback(() => {
    if (!canCreateClass) {
      alert('Bạn không có quyền tạo lớp trong trường này.');
      return;
    }

    setEditingClass(null);
    setIsActive(true);
    setFormData({
      name: '',
      schoolId: selectedSchool.id,
      description: '',
      maxStudents: undefined,
      academicYear: '2024-2025',
      grade: '',
    });
    setFormError('');
    setShowModal(true);
  }, [canCreateClass, selectedSchool.id]);

  const handleOpenEditModal = useCallback(
    (cls: Class) => {
      if (!canManageClass(cls)) {
        notify.warning('Bạn chỉ có quyền xem lớp này.');
        return;
      }

      setEditingClass(cls);
      setIsActive(cls.isActive);
      setFormData({
        name: cls.name,
        schoolId: cls.schoolId,
        description: cls.description || '',
        maxStudents: cls.maxStudents,
        academicYear: cls.academicYear || '2024-2025',
        grade: cls.grade || '',
      });
      setFormError('');
      setShowModal(true);
    },
    [canManageClass]
  );

  const handleCloseFormModal = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleSubmitForm = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      setError('');
      setFormError('');

      if (!editingClass && createFormValidation) {
        setFormError(createFormValidation);
        setIsSubmitting(false);
        return;
      }

      try {
        if (editingClass) {
          const updateData: UpdateClassRequest = {
            ...formData,
            isActive,
          };
          const updatedClass = await classService.updateClass(editingClass.id, updateData, getAccessToken);
          setClasses((prev) => prev.map((cls) => (cls.id === updatedClass.id ? { ...cls, ...updatedClass } : cls)));
        } else {
          const createdClass = await classService.createClass(
            {
              ...formData,
              schoolId: selectedSchool.id,
            },
            getAccessToken
          );
          setClasses((prev) => [createdClass, ...prev.filter((cls) => cls.id !== createdClass.id)]);
        }

        setShowModal(false);
        setEditingClass(null);
        setIsActive(true);

        await fetchClasses();
      } catch (err) {
        const mapped = mapClassApiError(err, handleUnauthorized);
        setFormError(mapped);
        setError(mapped);
      } finally {
        setIsSubmitting(false);
      }
    },
    [createFormValidation, editingClass, fetchClasses, formData, getAccessToken, handleUnauthorized, isActive, selectedSchool.id]
  );

  const openDeleteDialog = useCallback(
    (classOrId: Class | string, className?: string) => {
      let targetClass: Class | undefined;
      if (typeof classOrId === 'object' && classOrId !== null) {
        targetClass = classOrId;
      } else {
        targetClass = classes.find((item) => item.id === classOrId);
      }

      if (targetClass) {
        if (!canManageClass(targetClass)) {
          notify.warning('Bạn chỉ có quyền xem lớp này.');
          return;
        }
        setClassToDelete(targetClass);
      } else if (typeof classOrId === 'string') {
        setClassToDelete({ id: classOrId, name: className || 'Lớp học' } as Class);
      }
    },
    [canManageClass, classes]
  );

  const closeDeleteDialog = useCallback(() => {
    if (isDeletingClass) return;
    setClassToDelete(null);
  }, [isDeletingClass]);

  const handleConfirmDelete = useCallback(async () => {
    if (!classToDelete) return;

    try {
      setIsDeletingClass(true);
      await classService.deleteClass(classToDelete.id, getAccessToken);
      notify.success(`Đã xóa lớp "${classToDelete.name}" thành công`);
      setClassToDelete(null);
      await fetchClasses();
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Không thể xóa lớp học');
    } finally {
      setIsDeletingClass(false);
    }
  }, [classToDelete, fetchClasses, getAccessToken]);

  const handleDeleteClass = useCallback(
    (classIdOrCls: string | Class, className?: string) => {
      openDeleteDialog(classIdOrCls, className);
    },
    [openDeleteDialog]
  );

  const handleOpenHandoverModal = useCallback(
    async (cls: Class) => {
      if (!canHandoverClass(cls)) {
        notify.warning('Chỉ giáo viên chính hoặc Admin mới được bàn giao quyền lớp.');
        return;
      }

      setShowHandoverModal(true);
      setHandoverClass(cls);
      setHandoverError('');
      setHandoverSearch('');
      setIsLoadingTeachers(true);

      try {
        const teacherList = await authService.getTeachers(getAccessToken);
        setTeachers(teacherList);
      } catch (err) {
        setTeachers([]);
        setHandoverError(err instanceof Error ? err.message : 'Không thể tải danh sách giáo viên');
      } finally {
        setIsLoadingTeachers(false);
      }
    },
    [canHandoverClass, getAccessToken]
  );

  const handleCloseHandoverModal = useCallback(() => {
    setShowHandoverModal(false);
    setHandoverClass(null);
    setHandoverError('');
  }, []);

  const handleToggleHandover = useCallback(
    async (teacherId: string, granted: boolean) => {
      if (!handoverClass) {
        return;
      }

      setHandoverBusyTeacherId(teacherId);
      setHandoverError('');

      try {
        const updatedClass = granted
          ? await classService.revokeClassManagement(handoverClass.id, teacherId, getAccessToken)
          : await classService.grantClassManagement(handoverClass.id, teacherId, getAccessToken);

        setHandoverClass(updatedClass);
        setClasses((prev) => prev.map((cls) => (cls.id === updatedClass.id ? { ...cls, ...updatedClass } : cls)));
        setSelectedClass((prev) => (prev?.id === updatedClass.id ? { ...prev, ...updatedClass } : prev));
      } catch (err) {
        setHandoverError(err instanceof Error ? err.message : 'Không thể cập nhật bàn giao lớp');
      } finally {
        setHandoverBusyTeacherId(null);
      }
    },
    [getAccessToken, handoverClass]
  );

  const handleClearSearch = useCallback(() => {
    setClassSearch('');
  }, []);

  return {
    // Classes & Selected
    classes,
    visibleClasses,
    selectedClass,
    isLoading,
    error,
    // Permissions
    canCreateClass,
    canManageClass,
    canHandoverClass,
    // Filters
    showInactive,
    setShowInactive,
    classSearch,
    setClassSearch,
    classSearchActive,
    setClassSearchActive,
    selectedGradeFilter,
    setSelectedGradeFilter,
    handleClearSearch,
    // Navigation
    handleSelectClass,
    handleBackToClassList,
    // Form Modal
    showModal,
    editingClass,
    formData,
    setFormData,
    isActive,
    setIsActive,
    formError,
    setFormError,
    isSubmitting,
    isSubmitDisabled,
    handleOpenAddModal,
    handleOpenEditModal,
    handleCloseFormModal,
    handleSubmitForm,
    handleDeleteClass,
    // Delete Confirmation Dialog
    classToDelete,
    isDeletingClass,
    openDeleteDialog,
    closeDeleteDialog,
    handleConfirmDelete,
    // Handover Modal
    showHandoverModal,
    handoverClass,
    teachers,
    isLoadingTeachers,
    handoverError,
    handoverBusyTeacherId,
    handoverSearch,
    setHandoverSearch,
    handleOpenHandoverModal,
    handleCloseHandoverModal,
    handleToggleHandover,
  };
}
