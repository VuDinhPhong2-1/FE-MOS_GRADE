import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Archive,
  BookOpenCheck,
  ChevronDown,
  ClipboardList,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { assignmentService } from '../services/assignment.service';
import { classService } from '../services/class.service';
import { examPublicationService } from '../services/exam-publication.service';
import studentService from '../services/student.service';
import type {
  Assignment,
  CreateAssignmentRequest,
  GradingEndpointInfo,
  UpdateAssignmentRequest,
} from '../types/assignment.types';
import type { Class } from '../types/class.types';
import type { StudentResponse } from '../types/student.types';

type SubjectCode = 'excel' | 'word' | 'ppt';
type ExamTypeCode = 'otth' | 'onthi' | 'gmetrix';
type GradingTypeCode = 'auto' | 'manual';

interface AssignmentFormState {
  name: string;
  description: string;
  maxScore: string;
  subject: SubjectCode;
  examType: ExamTypeCode;
  projectCode: string;
  gradingType: GradingTypeCode;
  gradingApiEndpoint: string;
}

interface QuickAssignmentDraft {
  endpoint: string;
  displayName: string;
  maxScore: number;
  name: string;
  selected: boolean;
}

const emptyForm: AssignmentFormState = {
  name: '',
  description: '',
  maxScore: '100',
  subject: 'excel',
  examType: 'otth',
  projectCode: '',
  gradingType: 'auto',
  gradingApiEndpoint: '',
};

const subjectLabels: Record<SubjectCode, string> = {
  excel: 'Excel',
  word: 'Word',
  ppt: 'PowerPoint',
};

const examTypeLabels: Record<ExamTypeCode, string> = {
  otth: 'Ôn tập thực hành',
  onthi: 'Ôn thi',
  gmetrix: 'GMetrix',
};

const gradingTypeLabels: Record<GradingTypeCode, string> = {
  auto: 'Tự động',
  manual: 'Thủ công',
};

const quickPracticeOptions = [
  { code: 'practice01', label: 'Practice 01' },
  { code: 'practice02', label: 'Practice 02' },
  { code: 'practice03', label: 'Practice 03' },
  { code: 'exam_review', label: 'Tạo bài ôn thi' },
] as const;

type QuickPracticeCode = typeof quickPracticeOptions[number]['code'];
type QuickSubjectCode = Extract<SubjectCode, 'excel' | 'word'>;

const quickSubjectOptions: Array<{ code: QuickSubjectCode; label: string }> = [
  { code: 'excel', label: 'Excel' },
  { code: 'word', label: 'Word' },
];

const examReviewProjectNumbersExcel = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
const examReviewProjectNumbersWord = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 20, 22];

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const buildEndpointLabel = (endpoint: GradingEndpointInfo) => {
  const parts = [endpoint.displayName || endpoint.endpoint];

  if (endpoint.practiceName) {
    parts.push(endpoint.practiceName);
  }

  if (typeof endpoint.maxScore === 'number') {
    parts.push(`${endpoint.maxScore} điểm`);
  }

  return parts.join(' • ');
};

const getProjectCodeFromEndpoint = (endpoint?: string) => {
  const match = endpoint?.match(/project(\d{1,3})/i);
  return match ? `project${match[1].padStart(2, '0')}` : '';
};

const getProjectNumberFromEndpoint = (endpoint?: string) => {
  const match = endpoint?.trim().replace(/\\/g, '/').match(/project(\d{1,3})$/i);
  return match ? Number.parseInt(match[1], 10) : null;
};

const getProjectCodeForSubject = (endpoint: string) => {
  const projectNumber = getProjectNumberFromEndpoint(endpoint);
  const subjectMatch = endpoint.match(/^(excel|word|ppt|powerpoint)\//i);

  if (!projectNumber || !subjectMatch) {
    return getProjectCodeFromEndpoint(endpoint) || undefined;
  }

  const subject = subjectMatch[1].toLowerCase() === 'powerpoint' ? 'ppt' : subjectMatch[1].toLowerCase();
  return `${subject.toUpperCase()}_P${String(projectNumber).padStart(2, '0')}`;
};

const buildDefaultNameFromEndpoint = (endpoint?: GradingEndpointInfo) => {
  if (!endpoint) return '';
  return endpoint.displayName || endpoint.endpoint;
};

const resolveQuickExamType = (practiceCode: QuickPracticeCode): ExamTypeCode =>
  practiceCode === 'exam_review' ? 'onthi' : 'otth';

const resolveQuickEndpoints = (
  endpoints: GradingEndpointInfo[],
  subjectCode: QuickSubjectCode,
  practiceCode: QuickPracticeCode
) => {
  const subjectEndpoints = endpoints.filter((endpoint) => {
    const endpointSubject = (endpoint.subject || endpoint.endpoint.split('/')[0] || '').toLowerCase();

    if (subjectCode === 'excel') {
      return endpointSubject === 'excel' || !endpoint.subject;
    }

    return endpointSubject === subjectCode;
  });

  if (practiceCode === 'exam_review') {
    const projectNumbers = subjectCode === 'word' ? examReviewProjectNumbersWord : examReviewProjectNumbersExcel;
    return subjectEndpoints.filter((endpoint) => {
      const projectNumber = getProjectNumberFromEndpoint(endpoint.endpoint);
      return projectNumber !== null && projectNumbers.includes(projectNumber);
    });
  }

  return subjectEndpoints.filter((endpoint) => (endpoint.practiceCode || '').toLowerCase() === practiceCode);
};

const buildQuickAssignmentDrafts = (
  endpoints: GradingEndpointInfo[],
  previousDrafts: QuickAssignmentDraft[],
  practiceCode: QuickPracticeCode
): QuickAssignmentDraft[] => {
  const previousByEndpoint = new Map(previousDrafts.map((draft) => [draft.endpoint, draft]));

  return endpoints.map((endpoint) => {
    const previous = previousByEndpoint.get(endpoint.endpoint);
    const previousName = previous?.name.trim() || '';
    const defaultName =
      practiceCode === 'exam_review'
        ? `${endpoint.displayName} - Ôn thi`
        : endpoint.displayName;
    const legacyExamReviewPrefixName = `Ôn thi - ${endpoint.displayName}`;
    const shouldResetExamReviewName =
      practiceCode === 'exam_review' &&
      (
        previousName === '' ||
        previousName === endpoint.displayName ||
        previousName === legacyExamReviewPrefixName ||
        previousName === `On thi - ${endpoint.displayName}` ||
        previousName === `${endpoint.displayName} - On thi`
      );

    return {
      endpoint: endpoint.endpoint,
      displayName: endpoint.displayName || endpoint.endpoint,
      maxScore: endpoint.maxScore || 100,
      name: previous && !shouldResetExamReviewName ? previous.name : defaultName,
      selected: previous ? previous.selected : true,
    };
  });
};

const buildStudentDisplayName = (student?: Pick<StudentResponse, 'middleName' | 'firstName' | 'fullName'> | null) =>
  student?.fullName?.trim() || `${student?.middleName || ''} ${student?.firstName || ''}`.trim();

const isAssignmentPublishableForExam = (assignment: Assignment) =>
  assignment.isActive &&
  assignment.isPublishable &&
  Boolean(assignment.gradingApiEndpoint?.trim()) &&
  (assignment.subject === 'excel' || assignment.subject === 'word');

type AssignmentManagementSection = 'filters' | 'exam' | 'list' | 'form' | 'all';

interface AssignmentManagementPageProps {
  section?: AssignmentManagementSection;
}

const AssignmentManagementPage = ({ section = 'all' }: AssignmentManagementPageProps) => {
  const { getAccessToken } = useAuth();

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [gradingEndpoints, setGradingEndpoints] = useState<GradingEndpointInfo[]>([]);
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false);
  const [isLoadingEndpoints, setIsLoadingEndpoints] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingExamPublication, setIsCreatingExamPublication] = useState(false);
  const [actionAssignmentId, setActionAssignmentId] = useState<string | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [studentLoadError, setStudentLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [createExamPublicationMessage, setCreateExamPublicationMessage] = useState<string | null>(null);
  const [localAgentPublicationToken, setLocalAgentPublicationToken] = useState('');

  const [form, setForm] = useState<AssignmentFormState>(emptyForm);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [quickSubject, setQuickSubject] = useState<QuickSubjectCode>('excel');
  const [quickPracticeCode, setQuickPracticeCode] = useState<QuickPracticeCode>('practice01');
  const [quickAssignmentDrafts, setQuickAssignmentDrafts] = useState<QuickAssignmentDraft[]>([]);
  const [quickAssignmentDescription, setQuickAssignmentDescription] = useState('');
  const [isQuickCreatingAssignments, setIsQuickCreatingAssignments] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectWholeClass, setSelectWholeClass] = useState(true);
  const [selectedExamAssignmentIds, setSelectedExamAssignmentIds] = useState<string[]>([]);
  const [examName, setExamName] = useState('Ca thi MOS');
  const [allowExamHelp, setAllowExamHelp] = useState(false);

  const [isClassPanelOpen, setIsClassPanelOpen] = useState(true);
  const [isExamPanelOpen, setIsExamPanelOpen] = useState(false);
  const [isAssignmentListPanelOpen, setIsAssignmentListPanelOpen] = useState(true);
  const [isAssignmentFormPanelOpen, setIsAssignmentFormPanelOpen] = useState(false);

  // Derived state to determine if any loading state is active. This avoids
  // repeating the same boolean OR expression throughout the JSX. When any
  // of the individual loading flags are true, this value will be true.
  const isAnyLoading = isLoadingClasses || isLoadingAssignments || isLoadingEndpoints || isLoadingStudents;

  const showFiltersPanel = section === 'all' || section === 'filters';
  const showExamPanel = section === 'all' || section === 'exam';
  const showAssignmentListPanel = section === 'all' || section === 'list';
  const showAssignmentFormPanel = section === 'all' || section === 'form';

  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId) || null,
    [classes, selectedClassId]
  );

  const endpointOptions = useMemo(() => {
    const currentSubject = form.subject;
    return gradingEndpoints.filter((endpoint) => {
      const subject = (endpoint.subject || endpoint.endpoint.split('/')[0] || '').toLowerCase();
      return !subject || subject === currentSubject;
    });
  }, [form.subject, gradingEndpoints]);

  const quickPracticeEndpoints = useMemo(
    () => resolveQuickEndpoints(gradingEndpoints, quickSubject, quickPracticeCode),
    [gradingEndpoints, quickSubject, quickPracticeCode]
  );

  const selectedQuickAssignmentCount = useMemo(
    () => quickAssignmentDrafts.filter((draft) => draft.selected).length,
    [quickAssignmentDrafts]
  );

  const publishableExamAssignments = useMemo(() => assignments.filter(isAssignmentPublishableForExam), [assignments]);

  const selectedExamAssignments = useMemo(
    () =>
      selectedExamAssignmentIds
        .map((assignmentId) => publishableExamAssignments.find((assignment) => assignment.id === assignmentId) || null)
        .filter((assignment): assignment is Assignment => assignment !== null),
    [publishableExamAssignments, selectedExamAssignmentIds]
  );

  const filteredAssignments = useMemo(() => {
    const keyword = normalizeText(searchKeyword.trim());

    if (!keyword) {
      return assignments;
    }

    return assignments.filter((assignment) => {
      const haystack = normalizeText(
        [
          assignment.name,
          assignment.description || '',
          assignment.projectCode || '',
          assignment.gradingApiEndpoint || '',
          assignment.subject,
          assignment.examType,
        ].join(' ')
      );

      return haystack.includes(keyword);
    });
  }, [assignments, searchKeyword]);

  const activeCount = useMemo(
    () => assignments.filter((assignment) => assignment.isActive).length,
    [assignments]
  );

  const loadClasses = async () => {
    setIsLoadingClasses(true);
    setLoadError(null);

    try {
      const data = await classService.getAllClasses(getAccessToken);
      setClasses(data);
      setSelectedClassId((current) => {
        if (current && data.some((item) => item.id === current)) {
          return current;
        }

        return data[0]?.id || '';
      });
    } catch (error) {
      setClasses([]);
      setSelectedClassId('');
      setLoadError(error instanceof Error ? error.message : 'Không tải được danh sách lớp.');
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const loadStudents = async (classId: string) => {
    if (!classId) {
      setStudents([]);
      setSelectedStudentIds([]);
      return;
    }

    setIsLoadingStudents(true);
    setStudentLoadError(null);

    try {
      const data = await studentService.getStudentsByClassId(classId, getAccessToken);
      setStudents(data);
    } catch (error) {
      setStudents([]);
      setSelectedStudentIds([]);
      setStudentLoadError(error instanceof Error ? error.message : 'Không tải được danh sách học sinh.');
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const loadAssignments = async (classId: string) => {
    if (!classId) {
      setAssignments([]);
      return;
    }

    setIsLoadingAssignments(true);
    setLoadError(null);

    try {
      const data = await assignmentService.getByClass(classId, getAccessToken, {
        includeInactive,
      });
      setAssignments(data);
    } catch (error) {
      setAssignments([]);
      setLoadError(error instanceof Error ? error.message : 'Không tải được danh sách bài tập.');
    } finally {
      setIsLoadingAssignments(false);
    }
  };

  const loadGradingEndpoints = async () => {
    setIsLoadingEndpoints(true);

    try {
      const data = await assignmentService.getGradingEndpoints(getAccessToken);
      setGradingEndpoints(data);
    } catch {
      setGradingEndpoints([]);
    } finally {
      setIsLoadingEndpoints(false);
    }
  };

  /**
   * Load the class list, grading endpoints, assignments and students again.
   * This helper consolidates multiple refresh calls into a single function,
   * improving readability of the JSX and avoiding inline anonymous functions.
   */
  const handleReloadData = () => {
    void loadClasses();
    void loadGradingEndpoints();
    void loadAssignments(selectedClassId);
    void loadStudents(selectedClassId);
  };

  useEffect(() => {
    void loadClasses();
    void loadGradingEndpoints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAccessToken]);

  useEffect(() => {
    void loadAssignments(selectedClassId);
    void loadStudents(selectedClassId);
    setEditingAssignment(null);
    setForm(emptyForm);
    setActionMessage(null);
    setCreateExamPublicationMessage(null);
    setLocalAgentPublicationToken('');
    setSelectedExamAssignmentIds([]);
    setSelectWholeClass(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassId, includeInactive]);

  useEffect(() => {
    if (selectWholeClass) {
      setSelectedStudentIds(students.map((student) => student.id));
      return;
    }

    setSelectedStudentIds((current) => current.filter((studentId) => students.some((student) => student.id === studentId)));
  }, [selectWholeClass, students]);

  useEffect(() => {
    setSelectedExamAssignmentIds((current) =>
      current.filter((assignmentId) => publishableExamAssignments.some((assignment) => assignment.id === assignmentId))
    );
  }, [publishableExamAssignments]);

  useEffect(() => {
    setQuickAssignmentDrafts((previousDrafts) =>
      buildQuickAssignmentDrafts(quickPracticeEndpoints, previousDrafts, quickPracticeCode)
    );
  }, [quickPracticeEndpoints, quickPracticeCode]);

  useEffect(() => {
    setCreateExamPublicationMessage(null);
    setLocalAgentPublicationToken('');
  }, [examName, selectedClassId, selectedStudentIds, selectedExamAssignmentIds, allowExamHelp]);

  const updateForm = <K extends keyof AssignmentFormState>(key: K, value: AssignmentFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleEndpointChange = (endpointValue: string) => {
    const endpoint = gradingEndpoints.find((item) => item.endpoint === endpointValue);

    setForm((prev) => ({
      ...prev,
      gradingApiEndpoint: endpointValue,
      projectCode: getProjectCodeFromEndpoint(endpointValue) || prev.projectCode,
      maxScore: endpoint?.maxScore ? String(endpoint.maxScore) : prev.maxScore,
      name: prev.name.trim() ? prev.name : buildDefaultNameFromEndpoint(endpoint),
    }));
  };

  const resetForm = () => {
    setEditingAssignment(null);
    setForm(emptyForm);
    setActionMessage(null);
  };

  const handleToggleQuickAssignment = (endpoint: string) => {
    setQuickAssignmentDrafts((previousDrafts) =>
      previousDrafts.map((draft) =>
        draft.endpoint === endpoint ? { ...draft, selected: !draft.selected } : draft
      )
    );
  };

  const handleQuickAssignmentNameChange = (endpoint: string, name: string) => {
    setQuickAssignmentDrafts((previousDrafts) =>
      previousDrafts.map((draft) => (draft.endpoint === endpoint ? { ...draft, name } : draft))
    );
  };

  const selectAllQuickAssignments = () => {
    setQuickAssignmentDrafts((previousDrafts) => previousDrafts.map((draft) => ({ ...draft, selected: true })));
  };

  const clearQuickAssignments = () => {
    setQuickAssignmentDrafts((previousDrafts) => previousDrafts.map((draft) => ({ ...draft, selected: false })));
  };

  const resetQuickAssignmentNames = () => {
    setQuickAssignmentDrafts((previousDrafts) =>
      buildQuickAssignmentDrafts(quickPracticeEndpoints, previousDrafts.map((draft) => ({ ...draft, name: '' })), quickPracticeCode)
    );
  };

  const createAssignmentsFromQuickDrafts = async (drafts: QuickAssignmentDraft[], practiceCode: QuickPracticeCode) => {
    if (!selectedClassId) {
      setActionMessage('Vui long chon lop truoc khi tao nhanh bai tap.');
      return;
    }

    const selectedDrafts = drafts.filter((draft) => draft.selected);
    if (selectedDrafts.length === 0) {
      setActionMessage('Vui long chon it nhat 1 project de tao nhanh.');
      return;
    }

    const invalidDraft = selectedDrafts.find((draft) => !draft.name.trim());
    if (invalidDraft) {
      setActionMessage(`Ten bai tap cho ${invalidDraft.displayName} khong duoc de trong.`);
      return;
    }

    setIsQuickCreatingAssignments(true);
    setActionMessage(null);

    try {
      const failedAssignments: string[] = [];
      const examType = resolveQuickExamType(practiceCode);
      const sharedDescription = quickAssignmentDescription.trim();

      for (const draft of selectedDrafts) {
        try {
          await assignmentService.create(
            {
              name: draft.name.trim(),
              description: sharedDescription || undefined,
              classId: selectedClassId,
              maxScore: draft.maxScore,
              subject: quickSubject,
              examType,
              projectCode: getProjectCodeForSubject(draft.endpoint),
              gradingType: 'auto',
              gradingApiEndpoint: draft.endpoint,
            },
            getAccessToken
          );
        } catch (error) {
          failedAssignments.push(`${draft.displayName}: ${error instanceof Error ? error.message : 'Khong the tao bai tap.'}`);
        }
      }

      await loadAssignments(selectedClassId);

      const createdCount = selectedDrafts.length - failedAssignments.length;
      if (failedAssignments.length === 0) {
        setActionMessage(`Da tao nhanh ${createdCount} bai tap.`);
        return;
      }

      setActionMessage(
        createdCount > 0
          ? `Da tao ${createdCount}/${selectedDrafts.length} bai. Loi: ${failedAssignments.join(' | ')}`
          : `Khong the tao nhanh bai tap. ${failedAssignments.join(' | ')}`
      );
    } finally {
      setIsQuickCreatingAssignments(false);
    }
  };

  const handleCreateSelectedQuickAssignments = async () => {
    await createAssignmentsFromQuickDrafts(quickAssignmentDrafts, quickPracticeCode);
  };

  const handleQuickCreateByPractice = async (practiceCode: QuickPracticeCode) => {
    const endpoints = resolveQuickEndpoints(gradingEndpoints, quickSubject, practiceCode);
    const drafts = buildQuickAssignmentDrafts(endpoints, [], practiceCode).map((draft) => ({ ...draft, selected: true }));
    const practice = quickPracticeOptions.find((item) => item.code === practiceCode);

    if (drafts.length === 0) {
      setActionMessage(`Khong co project ${practice?.label || practiceCode} cho mon ${quickSubject.toUpperCase()}.`);
      return;
    }

    await createAssignmentsFromQuickDrafts(drafts, practiceCode);
  };

  const startEdit = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setActionMessage(null);
    setIsAssignmentFormPanelOpen(true);
    setForm({
      name: assignment.name || '',
      description: assignment.description || '',
      maxScore: String(assignment.maxScore ?? 100),
      subject: assignment.subject,
      examType: assignment.examType,
      projectCode: assignment.projectCode || getProjectCodeFromEndpoint(assignment.gradingApiEndpoint),
      gradingType: assignment.gradingType,
      gradingApiEndpoint: assignment.gradingApiEndpoint || '',
    });
  };

  const buildPayload = (): CreateAssignmentRequest => {
    const maxScore = Number(form.maxScore);

    if (!selectedClassId) {
      throw new Error('Vui lòng chọn lớp trước khi lưu bài tập.');
    }

    if (!form.name.trim()) {
      throw new Error('Vui lòng nhập tên bài tập.');
    }

    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      throw new Error('Điểm tối đa phải là số lớn hơn 0.');
    }

    if (form.gradingType === 'auto' && !form.gradingApiEndpoint.trim()) {
      throw new Error('Bài tập tự động cần chọn endpoint chấm điểm.');
    }

    return {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      classId: selectedClassId,
      maxScore,
      subject: form.subject,
      examType: form.examType,
      projectCode: form.projectCode.trim() || undefined,
      gradingType: form.gradingType,
      gradingApiEndpoint: form.gradingType === 'auto' ? form.gradingApiEndpoint.trim() : undefined,
    };
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setActionMessage(null);

    try {
      const payload = buildPayload();

      if (editingAssignment) {
        const updatePayload: UpdateAssignmentRequest = {
          name: payload.name,
          description: payload.description,
          maxScore: payload.maxScore,
          subject: payload.subject,
          examType: payload.examType,
          projectCode: payload.projectCode,
          gradingType: payload.gradingType,
          gradingApiEndpoint: payload.gradingApiEndpoint,
        };

        await assignmentService.update(editingAssignment.id, updatePayload, getAccessToken);
        setActionMessage('Đã cập nhật bài tập.');
      } else {
        await assignmentService.create(payload, getAccessToken);
        setActionMessage('Đã tạo bài tập mới.');
      }

      resetForm();
      await loadAssignments(selectedClassId);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Không thể lưu bài tập.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (assignment: Assignment) => {
    setActionAssignmentId(assignment.id);
    setActionMessage(null);

    try {
      await assignmentService.update(
        assignment.id,
        { isActive: !assignment.isActive },
        getAccessToken
      );
      setActionMessage(assignment.isActive ? 'Đã lưu trữ bài tập.' : 'Đã khôi phục bài tập.');
      await loadAssignments(selectedClassId);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Không thể cập nhật trạng thái bài tập.');
    } finally {
      setActionAssignmentId(null);
    }
  };

  const handleToggleExamAssignment = (assignmentId: string) => {
    setSelectedExamAssignmentIds((current) =>
      current.includes(assignmentId) ? current.filter((item) => item !== assignmentId) : [...current, assignmentId]
    );
  };

  const handleToggleWholeClass = (checked: boolean) => {
    setSelectWholeClass(checked);
    if (checked) {
      setSelectedStudentIds(students.map((student) => student.id));
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((current) => {
      const nextValue = current.includes(studentId)
        ? current.filter((item) => item !== studentId)
        : [...current, studentId];

      setSelectWholeClass(students.length > 0 && nextValue.length === students.length);
      return nextValue;
    });
  };

  const handleCreateLocalAgentExam = async () => {
    const trimmedExamName = examName.trim();

    if (!trimmedExamName) {
      setCreateExamPublicationMessage('Vui lòng nhập tên ca thi.');
      return;
    }

    if (!selectedClassId) {
      setCreateExamPublicationMessage('Vui lòng chọn lớp.');
      return;
    }

    if (selectedStudentIds.length === 0) {
      setCreateExamPublicationMessage('Vui lòng chọn ít nhất một học sinh.');
      return;
    }

    if (selectedExamAssignmentIds.length === 0) {
      setCreateExamPublicationMessage('Vui lòng chọn ít nhất một bài tập.');
      return;
    }

    setIsCreatingExamPublication(true);
    setCreateExamPublicationMessage(null);

    try {
      const publication = await examPublicationService.createExamPublication(
        {
          name: trimmedExamName,
          classId: selectedClassId,
          studentIds: selectedStudentIds,
          mode: 'Testing',
          assignmentIds: selectedExamAssignmentIds,
          modeRules: {
            mode: 'Testing',
            allowHelp: allowExamHelp,
          },
        },
        getAccessToken
      );

      setLocalAgentPublicationToken(publication.publicationToken);
      setCreateExamPublicationMessage('Đã tạo ca thi thành công.');
    } catch (error) {
      setLocalAgentPublicationToken('');
      setCreateExamPublicationMessage(error instanceof Error ? error.message : 'Không thể tạo ca thi test.');
    } finally {
      setIsCreatingExamPublication(false);
    }
  };

  const handleDelete = async (assignment: Assignment) => {
    const confirmed = window.confirm(
      `Xóa bài tập "${assignment.name}"? Thao tác này phụ thuộc vào chính sách xóa hiện tại của backend.`
    );

    if (!confirmed) {
      return;
    }

    setActionAssignmentId(assignment.id);
    setActionMessage(null);

    try {
      await assignmentService.delete(assignment.id, getAccessToken);
      setActionMessage('Đã xóa bài tập.');
      if (editingAssignment?.id === assignment.id) {
        resetForm();
      }
      await loadAssignments(selectedClassId);
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : 'Không thể xóa bài tập.');
    } finally {
      setActionAssignmentId(null);
    }
  };

  return (
    <div className="space-y-5">
      {showFiltersPanel && (
      <details
        open={section === 'filters' || isClassPanelOpen}
        onToggle={(event) => setIsClassPanelOpen(event.currentTarget.open)}
        className="group rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Lớp & bộ lọc</h2>
            <p className="mt-1 text-sm text-slate-500">
              Chọn lớp, tìm kiếm bài tập và bật/tắt bài đã lưu trữ.
            </p>
          </div>
          <ChevronDown className="h-5 w-5 text-slate-500 transition group-open:rotate-180" />
        </summary>

        <div className="border-t border-slate-100 px-6 pb-6 pt-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <ClipboardList className="h-4 w-4" />
              Quản lý bài tập
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-900">Bài tập theo lớp</h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              Tạo, chỉnh sửa, lưu trữ hoặc xóa bài tập cho từng lớp. Trang này dùng lại contract
              assignment hiện có và tự động chuẩn hóa endpoint chấm điểm giống màn hình chấm điểm.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReloadData}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isAnyLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isAnyLoading ? 'animate-spin' : ''}`}
            />
            Tải lại
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Lớp</span>
            <select
              value={selectedClassId}
              onChange={(event) => setSelectedClassId(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              disabled={isLoadingClasses}
            >
              {classes.length === 0 ? (
                <option value="">Không có lớp</option>
              ) : (
                classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))
              )}
            </select>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-slate-700">Tìm kiếm</span>
            <input
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              placeholder="Tìm theo tên, mô tả, project hoặc endpoint..."
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span>
            Lớp đang chọn:{' '}
            <strong className="text-slate-900">{selectedClass?.name || 'Chưa chọn lớp'}</strong>
          </span>
          <span className="hidden text-slate-300 sm:inline">•</span>
          <span>
            Đang hoạt động: <strong className="text-emerald-700">{activeCount}</strong>/
            {assignments.length}
          </span>
          <label className="ml-auto inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(event) => setIncludeInactive(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Hiện bài đã lưu trữ
          </label>
        </div>

        {loadError && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {loadError}
          </div>
        )}

        {studentLoadError && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {studentLoadError}
          </div>
        )}
        </div>
      </details>
      )}

      {showExamPanel && (
      <details
        open={section === 'exam' || isExamPanelOpen}
        onToggle={(event) => setIsExamPanelOpen(event.currentTarget.open)}
        className="group rounded-3xl border border-blue-100 bg-white shadow-sm"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Tạo ca thi</h2>
            <p className="mt-1 text-sm text-slate-500">
              Mở khi cần chọn học sinh, bài tập và tạo token thi cho lớp.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 sm:inline">
              {selectedStudentIds.length} học sinh • {selectedExamAssignments.length} bài tập
            </span>
            <ChevronDown className="h-5 w-5 text-slate-500 transition group-open:rotate-180" />
          </div>
        </summary>

        <div className="border-t border-blue-50 px-6 pb-6 pt-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              <BookOpenCheck className="h-4 w-4" />
              Tạo ca thi
            </div>
            <h2 className="mt-3 text-lg font-bold text-slate-900">Tạo ca thi từ bài tập của lớp</h2>
            <p className="mt-1 text-sm text-slate-500">
              Chọn học sinh và bài tập đã publish để tạo token cho Local Agent / trang thi.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Đã chọn <strong className="text-slate-900">{selectedStudentIds.length}</strong> học sinh •{' '}
            <strong className="text-slate-900">{selectedExamAssignments.length}</strong> bài tập
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Tên ca thi</span>
              <input
                value={examName}
                onChange={(event) => setExamName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Ví dụ: Ca thi MOS lớp A"
              />
            </label>

            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">Học sinh</span>
                <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={selectWholeClass}
                    onChange={(event) => handleToggleWholeClass(event.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    disabled={isLoadingStudents || students.length === 0}
                  />
                  Cả lớp
                </label>
              </div>

              <div className="mt-2 max-h-56 overflow-auto rounded-2xl border border-slate-200 p-3">
                {isLoadingStudents ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải học sinh...
                  </div>
                ) : students.length === 0 ? (
                  <p className="text-sm text-slate-500">Lớp này chưa có học sinh.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {students.map((student) => (
                      <label key={student.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => handleToggleStudent(student.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{buildStudentDisplayName(student) || student.id}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <span className="text-sm font-semibold text-slate-700">Bài tập đưa vào ca thi</span>
              <div className="mt-2 max-h-56 overflow-auto rounded-2xl border border-slate-200 p-3">
                {isLoadingAssignments ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải bài tập...
                  </div>
                ) : publishableExamAssignments.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Lớp này chưa có bài tập đang hoạt động, đã publish và có endpoint chấm điểm.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {publishableExamAssignments.map((assignment) => (
                      <label key={assignment.id} className="flex items-start gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-slate-50">
                        <input
                          type="checkbox"
                          checked={selectedExamAssignmentIds.includes(assignment.id)}
                          onChange={() => handleToggleExamAssignment(assignment.id)}
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span>
                          <span className="block font-semibold text-slate-800">{assignment.name}</span>
                          <span className="block text-xs text-slate-500">
                            {assignment.projectCode || getProjectCodeFromEndpoint(assignment.gradingApiEndpoint) || '—'} •{' '}
                            {assignment.gradingApiEndpoint}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={allowExamHelp}
                onChange={(event) => setAllowExamHelp(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Cho phép xem trợ giúp trong ca thi
            </label>

            <button
              type="button"
              onClick={() => void handleCreateLocalAgentExam()}
              disabled={
                isCreatingExamPublication ||
                !selectedClassId ||
                selectedStudentIds.length === 0 ||
                selectedExamAssignmentIds.length === 0
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreatingExamPublication ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
              Tạo ca thi
            </button>

            {createExamPublicationMessage && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {createExamPublicationMessage}
              </div>
            )}

            {localAgentPublicationToken && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <p>
                  <strong>Token:</strong> {localAgentPublicationToken}
                </p>
                <p className="mt-1">
                  <strong>Link thi:</strong>{' '}
                  <a className="font-semibold underline" href={`/exam/${localAgentPublicationToken}`} target="_blank" rel="noreferrer">
                    /exam/{localAgentPublicationToken}
                  </a>
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </details>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        {showAssignmentListPanel && (
        <details
          open={section === 'list' || isAssignmentListPanelOpen}
          onToggle={(event) => setIsAssignmentListPanelOpen(event.currentTarget.open)}
          className="group rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Danh sách bài tập</h2>
              <p className="mt-1 text-sm text-slate-500">
                Xem, sửa, lưu trữ hoặc xóa bài tập của lớp đang chọn.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700 sm:inline">
                {filteredAssignments.length} bài tập
              </span>
              <ChevronDown className="h-5 w-5 text-slate-500 transition group-open:rotate-180" />
            </div>
          </summary>

          <div className="border-t border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Danh sách bài tập</h2>
              <p className="text-sm text-slate-500">
                {filteredAssignments.length} bài tập phù hợp bộ lọc hiện tại
              </p>
            </div>
          </div>

          {isLoadingAssignments ? (
            <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Đang tải bài tập...
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <BookOpenCheck className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-base font-semibold text-slate-800">Chưa có bài tập</h3>
              <p className="mt-1 text-sm text-slate-500">
                Tạo bài tập mới bằng form bên phải để giáo viên có thể quản lý và chấm điểm.
              </p>
            </div>
          ) : (
            <div className="max-h-[440px] overflow-auto">
              <table className="min-w-full table-fixed divide-y divide-slate-100 text-sm">
                <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="w-[28%] px-4 py-3">Bài tập</th>
                    <th className="w-[11%] px-4 py-3">Môn</th>
                    <th className="w-[14%] px-4 py-3">Loại</th>
                    <th className="w-[10%] px-4 py-3">Điểm</th>
                    <th className="w-[16%] px-4 py-3">Project</th>
                    <th className="w-[11%] px-4 py-3">Trạng thái</th>
                    <th className="w-[10%] px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredAssignments.map((assignment) => (
                    <tr key={assignment.id} className="h-[56px] align-middle hover:bg-slate-50">
                      <td className="px-4 py-2">
                        <div className="truncate font-semibold text-slate-900" title={assignment.name}>
                          {assignment.name}
                        </div>
                        {assignment.description && (
                          <div className="truncate text-xs text-slate-500" title={assignment.description}>
                            {assignment.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 text-slate-700">{subjectLabels[assignment.subject]}</td>
                      <td className="px-4 py-2">
                        <div className="truncate text-slate-700" title={examTypeLabels[assignment.examType]}>
                          {examTypeLabels[assignment.examType]}
                        </div>
                        <div className="text-xs text-slate-500">{gradingTypeLabels[assignment.gradingType]}</div>
                      </td>
                      <td className="px-4 py-2 font-semibold text-slate-800">{assignment.maxScore}</td>
                      <td className="px-4 py-2">
                        <div
                          className="truncate font-medium text-slate-800"
                          title={assignment.projectCode || getProjectCodeFromEndpoint(assignment.gradingApiEndpoint) || '—'}
                        >
                          {assignment.projectCode || getProjectCodeFromEndpoint(assignment.gradingApiEndpoint) || '—'}
                        </div>
                        <div className="truncate text-xs text-slate-500" title={assignment.gradingApiEndpoint || 'Không dùng'}>
                          {assignment.gradingApiEndpoint || 'Không dùng'}
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            assignment.isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {assignment.isActive ? 'Hoạt động' : 'Lưu trữ'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => startEdit(assignment)}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100"
                            title="Sửa"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleToggleActive(assignment)}
                            disabled={actionAssignmentId === assignment.id}
                            className="rounded-lg border border-amber-200 p-2 text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-60"
                            title={assignment.isActive ? 'Lưu trữ' : 'Khôi phục'}
                          >
                            {assignment.isActive ? <Archive className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleDelete(assignment)}
                            disabled={actionAssignmentId === assignment.id}
                            className="rounded-lg border border-rose-200 p-2 text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
        </details>
        )}

        {showAssignmentFormPanel && (
        <details
          open={section === 'form' || isAssignmentFormPanelOpen}
          onToggle={(event) => setIsAssignmentFormPanelOpen(event.currentTarget.open)}
          className="group rounded-3xl border border-slate-200 bg-white shadow-sm"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingAssignment ? 'Chỉnh sửa bài tập' : 'Tạo / chỉnh sửa bài tập'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {editingAssignment ? 'Đang sửa bài tập đã chọn.' : 'Mở khi cần tạo bài tập mới cho lớp.'}
              </p>
            </div>
            <ChevronDown className="h-5 w-5 text-slate-500 transition group-open:rotate-180" />
          </summary>

          <form onSubmit={handleSubmit} className="border-t border-slate-100 p-6">
            <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editingAssignment ? 'Chỉnh sửa bài tập' : 'Tạo bài tập mới'}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {editingAssignment
                  ? 'Cập nhật thông tin bài tập đã chọn.'
                  : 'Tạo bài tập cho lớp đang chọn.'}
              </p>
            </div>

            {editingAssignment && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50"
                aria-label="Hủy chỉnh sửa"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <section className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_280px] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                  <ClipboardList className="h-4 w-4" />
                  Lớp nhận bài tập
                </div>
                <h3 className="mt-3 text-base font-bold text-slate-950">
                  {selectedClass ? selectedClass.name : 'Chưa chọn lớp'}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Tất cả bài tạo nhanh và bài tạo thủ công bên dưới sẽ được lưu vào lớp đang chọn ở đây.
                </p>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-blue-900">Chọn lớp</span>
                <select
                  value={selectedClassId}
                  onChange={(event) => setSelectedClassId(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  disabled={isLoadingClasses || isSubmitting || isQuickCreatingAssignments}
                >
                  {classes.length === 0 ? (
                    <option value="">Không có lớp</option>
                  ) : (
                    classes.map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
            </div>

            {!selectedClassId && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                Chọn lớp trước khi tạo bài tập.
              </div>
            )}
          </section>

          {!editingAssignment && (
            <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-base font-bold text-emerald-950">Tạo nhanh bài tập</h3>
                  <p className="mt-1 text-sm text-emerald-700">
                    Chọn môn và phần, hệ thống sẽ điền sẵn danh sách project để tạo hàng loạt.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
                  <label className="block">
                    <span className="text-xs font-semibold text-emerald-900">Môn</span>
                    <select
                      value={quickSubject}
                      onChange={(event) => setQuickSubject(event.target.value as QuickSubjectCode)}
                      className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      disabled={isQuickCreatingAssignments}
                    >
                      {quickSubjectOptions.map((subject) => (
                        <option key={subject.code} value={subject.code}>
                          {subject.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-semibold text-emerald-900">Phần</span>
                    <select
                      value={quickPracticeCode}
                      onChange={(event) => setQuickPracticeCode(event.target.value as QuickPracticeCode)}
                      className="mt-1 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      disabled={isQuickCreatingAssignments}
                    >
                      {quickPracticeOptions.map((practice) => (
                        <option key={practice.code} value={practice.code}>
                          {practice.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {quickPracticeCode === 'exam_review' && (
                <p className="mt-3 rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs text-indigo-700">
                  {quickSubject === 'excel'
                    ? 'Ôn thi Excel dùng project chẵn: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22.'
                    : 'Ôn thi Word dùng project lẻ: 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23 và thêm 20, 22.'}
                </p>
              )}

              <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">Tạo nhanh từng phần ({quickSubject.toUpperCase()})</p>
                    <p className="mt-1 text-xs text-slate-500">Bấm một phần để tạo ngay toàn bộ project trong phần đó.</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {quickPracticeOptions.map((practice) => {
                      const endpointCount = resolveQuickEndpoints(gradingEndpoints, quickSubject, practice.code).length;
                      const hasProjects = endpointCount > 0;

                      return (
                        <button
                          key={`quick-create-${practice.code}`}
                          type="button"
                          onClick={() => void handleQuickCreateByPractice(practice.code)}
                          disabled={isQuickCreatingAssignments || !selectedClassId || !hasProjects}
                          className="rounded-xl border border-emerald-200 px-3 py-2 text-left text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="block">{practice.label}</span>
                          <span className="mt-1 block text-[11px] font-medium text-emerald-600">
                            {hasProjects ? `${endpointCount} project` : 'Chưa có project'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <label className="mt-4 block">
                <span className="text-sm font-semibold text-emerald-900">Mô tả dùng chung</span>
                <textarea
                  value={quickAssignmentDescription}
                  onChange={(event) => setQuickAssignmentDescription(event.target.value)}
                  rows={2}
                  className="mt-2 w-full resize-none rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Nội dung này sẽ áp dụng cho tất cả bài được tạo nhanh."
                  disabled={isQuickCreatingAssignments}
                />
              </label>

              <div className="mt-4 rounded-xl border border-emerald-200 bg-white">
                <div className="flex flex-col gap-3 border-b border-emerald-100 p-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-950">Danh sách project sẽ tạo</p>
                    <p className="mt-1 text-xs text-slate-500">Có thể bỏ chọn project không cần tạo hoặc đổi tên từng bài.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={selectAllQuickAssignments}
                      disabled={isQuickCreatingAssignments || quickAssignmentDrafts.length === 0}
                      className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Chọn tất cả
                    </button>
                    <button
                      type="button"
                      onClick={clearQuickAssignments}
                      disabled={isQuickCreatingAssignments || quickAssignmentDrafts.length === 0}
                      className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Bỏ chọn
                    </button>
                    <button
                      type="button"
                      onClick={resetQuickAssignmentNames}
                      disabled={isQuickCreatingAssignments || quickAssignmentDrafts.length === 0}
                      className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                    >
                      Reset tên
                    </button>
                  </div>
                </div>

                {quickAssignmentDrafts.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-amber-700">
                    Phần này chưa có project khả dụng để tạo nhanh.
                  </div>
                ) : (
                  <div className="max-h-72 overflow-auto">
                    <table className="min-w-full divide-y divide-emerald-100">
                      <thead className="sticky top-0 bg-emerald-50">
                        <tr>
                          <th className="w-16 px-3 py-2 text-left text-xs font-semibold uppercase text-emerald-800">Chọn</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-emerald-800">Project</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-emerald-800">Tên bài tập</th>
                          <th className="w-28 px-3 py-2 text-right text-xs font-semibold uppercase text-emerald-800">Điểm</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-50">
                        {quickAssignmentDrafts.map((draft) => (
                          <tr key={draft.endpoint}>
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={draft.selected}
                                onChange={() => handleToggleQuickAssignment(draft.endpoint)}
                                disabled={isQuickCreatingAssignments}
                                className="h-4 w-4 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-slate-700">
                              <div className="font-semibold">{draft.displayName}</div>
                              <div className="text-xs text-slate-500">{draft.endpoint}</div>
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={draft.name}
                                onChange={(event) => handleQuickAssignmentNameChange(draft.endpoint, event.target.value)}
                                disabled={isQuickCreatingAssignments}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                                placeholder="Nhập tên bài tập"
                              />
                            </td>
                            <td className="px-3 py-2 text-right text-sm text-slate-700">{draft.maxScore}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="border-t border-emerald-100 p-3">
                  <button
                    type="button"
                    onClick={() => void handleCreateSelectedQuickAssignments()}
                    disabled={isQuickCreatingAssignments || !selectedClassId || selectedQuickAssignmentCount === 0}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isQuickCreatingAssignments ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    {isQuickCreatingAssignments ? 'Đang tạo nhanh...' : `Tạo nhanh ${selectedQuickAssignmentCount} bài đã chọn`}
                  </button>
                </div>
              </div>
            </section>
          )}

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Tên bài tập</span>
              <input
                value={form.name}
                onChange={(event) => updateForm('name', event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Ví dụ: Project 01 - Excel"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Mô tả</span>
              <textarea
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                placeholder="Ghi chú nội dung bài tập..."
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Môn</span>
                <select
                  value={form.subject}
                  onChange={(event) => updateForm('subject', event.target.value as SubjectCode)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {Object.entries(subjectLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Loại bài</span>
                <select
                  value={form.examType}
                  onChange={(event) => updateForm('examType', event.target.value as ExamTypeCode)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                >
                  {Object.entries(examTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Điểm tối đa</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxScore}
                  onChange={(event) => updateForm('maxScore', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Project code</span>
                <input
                  value={form.projectCode}
                  onChange={(event) => updateForm('projectCode', event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="project01"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Kiểu chấm</span>
              <select
                value={form.gradingType}
                onChange={(event) => updateForm('gradingType', event.target.value as GradingTypeCode)}
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              >
                {Object.entries(gradingTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            {form.gradingType === 'auto' && (
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Endpoint chấm điểm</span>
                <select
                  value={form.gradingApiEndpoint}
                  onChange={(event) => handleEndpointChange(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  disabled={isLoadingEndpoints}
                >
                  <option value="">Chọn endpoint</option>
                  {endpointOptions.map((endpoint) => (
                    <option key={endpoint.endpoint} value={endpoint.endpoint}>
                      {buildEndpointLabel(endpoint)}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {actionMessage && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {actionMessage}
              </div>
            )}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting || !selectedClassId}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingAssignment ? 'Lưu thay đổi' : 'Tạo bài tập'}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Plus className="h-4 w-4" />
                Form mới
              </button>
            </div>
          </div>
          </form>
        </details>
        )}
      </div>
    </div>
  );
};

export default AssignmentManagementPage;
