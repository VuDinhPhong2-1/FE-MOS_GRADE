import { useEffect, useMemo, useState } from 'react';
import { Upload, FileSpreadsheet, RefreshCw, Bug, Copy, Trash2 } from 'lucide-react';
import { gradingService } from '../services/grading.service';
import type { GradingResult } from '../types';
import type { BugSeverity, CreateGradingTestBugNoteRequest, GradingTestBugNote } from '../types/grading-test-bug-note.types';
import type { Assignment } from '../types/assignment.types';
import type { Class } from '../types/class.types';
import type { StudentResponse } from '../types/student.types';
import ResultCard from '../components/ResultCard';
import { useAuth } from '../context/AuthContext';
import { assignmentService } from '../services/assignment.service';
import { classService } from '../services/class.service';
import studentService from '../services/student.service';
import { examPublicationService } from '../services/exam-publication.service';

interface TestProjectOption {
  code: string;
  displayName: string;
  fileType: 'excel' | 'word';
}

const buildStudentDisplayName = (student?: Pick<StudentResponse, 'middleName' | 'firstName' | 'fullName'> | null) =>
  student?.fullName?.trim() || `${student?.middleName || ''} ${student?.firstName || ''}`.trim();

const normalizeProjectOption = (project: {
  code: string;
  endpoint?: string;
  fileType?: string;
  displayName?: string;
}): TestProjectOption => {
  const rawCode = project.code.trim().toLowerCase();
  const endpoint = (project.endpoint || '').trim().toLowerCase();
  const displayName = (project.displayName || '').trim().toLowerCase();
  const normalizedFileType = (project.fileType || '').trim().toLowerCase();

  const directMatch = rawCode.match(/^project(\d{1,2})-(excel|word)$/);
  if (directMatch) {
    const fileType = directMatch[2] as 'excel' | 'word';
    return {
      code: `project${directMatch[1].padStart(2, '0')}-${fileType}`,
      displayName: project.displayName || `Project ${directMatch[1].padStart(2, '0')} ${fileType.toUpperCase()}`,
      fileType,
    };
  }

  const legacyCodeMatch = rawCode.match(/^project(\d{1,2})$/);
  const endpointMatch = endpoint.match(/project(\d{1,2})$/);
  const projectNumber = legacyCodeMatch?.[1] || endpointMatch?.[1];
  if (!projectNumber) {
    const fallbackFileType: 'excel' | 'word' = normalizedFileType === 'word' ? 'word' : 'excel';
    return {
      code: project.code,
      displayName: project.displayName || project.code,
      fileType: fallbackFileType,
    };
  }

  let fileType: 'excel' | 'word' | null = null;
  if (normalizedFileType === 'word' || normalizedFileType === 'excel') {
    fileType = normalizedFileType;
  } else if (rawCode.includes('word') || endpoint.includes('/word/') || displayName.includes('word')) {
    fileType = 'word';
  } else if (rawCode.includes('excel') || endpoint.includes('/excel/') || displayName.includes('excel')) {
    fileType = 'excel';
  }

  if (!fileType) {
    fileType = 'excel';
  }

  return {
    code: `project${projectNumber.padStart(2, '0')}-${fileType}`,
    displayName: project.displayName || `Project ${projectNumber.padStart(2, '0')} ${fileType.toUpperCase()}`,
    fileType,
  };
};

const severityMeta: Record<BugSeverity, { label: string; badgeClass: string }> = {
  low: {
    label: 'Low',
    badgeClass: 'bg-slate-100 text-slate-700',
  },
  medium: {
    label: 'Medium',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  high: {
    label: 'High',
    badgeClass: 'bg-amber-100 text-amber-800',
  },
  critical: {
    label: 'Critical',
    badgeClass: 'bg-rose-100 text-rose-800',
  },
};

const GradingView = () => {
  const { getAccessToken } = useAuth();
  const [projectCode, setProjectCode] = useState('project01');
  const [projectOptions, setProjectOptions] = useState<TestProjectOption[]>([]);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GradingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [bugNotes, setBugNotes] = useState<GradingTestBugNote[]>([]);
  const [isLoadingBugNotes, setIsLoadingBugNotes] = useState(false);
  const [isSavingBugNote, setIsSavingBugNote] = useState(false);
  const [deletingBugNoteId, setDeletingBugNoteId] = useState<string | null>(null);
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');
  const [bugSeverity, setBugSeverity] = useState<BugSeverity>('medium');
  const [bugActionMessage, setBugActionMessage] = useState<string | null>(null);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [isBugTitleDirty, setIsBugTitleDirty] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classLoadError, setClassLoadError] = useState<string | null>(null);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentLoadError, setStudentLoadError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [assignmentLoadError, setAssignmentLoadError] = useState<string | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectWholeClass, setSelectWholeClass] = useState(true);
  const [selectedAssignmentIds, setSelectedAssignmentIds] = useState<string[]>([]);
  const [examName, setExamName] = useState('Ca thi MOS');
  const [allowExamHelp, setAllowExamHelp] = useState(false);
  const [isCreatingExamPublication, setIsCreatingExamPublication] = useState(false);
  const [createExamPublicationMessage, setCreateExamPublicationMessage] = useState<string | null>(null);
  const [localAgentPublicationToken, setLocalAgentPublicationToken] = useState('');

  useEffect(() => {
    let active = true;

    const loadProjects = async () => {
      setLoadingProjects(true);
      setProjectLoadError(null);

      try {
        const projects = await gradingService.getTestingProjects(getAccessToken);
        if (!active) {
          return;
        }

        const mapped = projects.map((project) => normalizeProjectOption(project));
        const defaultProject = mapped.find((project) => project.fileType === 'excel') || mapped[0];

        setProjectOptions(mapped);
        if (defaultProject) {
          setProjectCode(defaultProject.code);
        }
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        const message = err instanceof Error ? err.message : 'Khong tai duoc danh sach project test.';
        setProjectLoadError(message);
      } finally {
        if (active) {
          setLoadingProjects(false);
        }
      }
    };

    void loadProjects();
    return () => {
      active = false;
    };
  }, [getAccessToken]);

  useEffect(() => {
    let active = true;

    const loadClasses = async () => {
      setLoadingClasses(true);
      setClassLoadError(null);

      try {
        const nextClasses = await classService.getAllClasses(getAccessToken);
        if (!active) {
          return;
        }

        setClasses(nextClasses);
        setSelectedClassId((currentValue) => {
          if (currentValue && nextClasses.some((item) => item.id === currentValue)) {
            return currentValue;
          }

          return nextClasses[0]?.id || '';
        });
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        setClasses([]);
        setSelectedClassId('');
        setClassLoadError(err instanceof Error ? err.message : 'Không tải được danh sách lớp.');
      } finally {
        if (active) {
          setLoadingClasses(false);
        }
      }
    };

    void loadClasses();
    return () => {
      active = false;
    };
  }, [getAccessToken]);

  useEffect(() => {
    let active = true;

    const loadStudentsByClass = async () => {
      if (!selectedClassId) {
        setStudents([]);
        setSelectedStudentIds([]);
        setStudentLoadError(null);
        return;
      }

      setLoadingStudents(true);
      setStudentLoadError(null);

      try {
        const nextStudents = await studentService.getStudentsByClassId(selectedClassId, getAccessToken);
        if (!active) {
          return;
        }

        setStudents(nextStudents);
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        setStudents([]);
        setSelectedStudentIds([]);
        setStudentLoadError(err instanceof Error ? err.message : 'Không tải được danh sách học sinh.');
      } finally {
        if (active) {
          setLoadingStudents(false);
        }
      }
    };

    void loadStudentsByClass();
    return () => {
      active = false;
    };
  }, [getAccessToken, selectedClassId]);

  useEffect(() => {
    let active = true;

    const loadAssignmentsByClass = async () => {
      if (!selectedClassId) {
        setAssignments([]);
        setSelectedAssignmentIds([]);
        setAssignmentLoadError(null);
        return;
      }

      setLoadingAssignments(true);
      setAssignmentLoadError(null);

      try {
        const nextAssignments = await assignmentService.getByClass(selectedClassId, getAccessToken);
        if (!active) {
          return;
        }

        setAssignments(nextAssignments);
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        setAssignments([]);
        setSelectedAssignmentIds([]);
        setAssignmentLoadError(err instanceof Error ? err.message : 'Không tải được danh sách bài tập.');
      } finally {
        if (active) {
          setLoadingAssignments(false);
        }
      }
    };

    void loadAssignmentsByClass();
    return () => {
      active = false;
    };
  }, [getAccessToken, selectedClassId]);

  useEffect(() => {
    if (selectWholeClass) {
      setSelectedStudentIds(students.map((student) => student.id));
      return;
    }

    setSelectedStudentIds((currentValue) =>
      currentValue.filter((studentId) => students.some((student) => student.id === studentId))
    );
  }, [students, selectWholeClass]);

  useEffect(() => {
    let active = true;

    const loadBugNotes = async () => {
      setIsLoadingBugNotes(true);
      try {
        const notes = await gradingService.getTestingBugNotes(getAccessToken);
        if (!active) {
          return;
        }

        setBugNotes(notes);
      } catch (err: unknown) {
        if (!active) {
          return;
        }

        setBugNotes([]);
        const message = err instanceof Error ? err.message : 'Khong tai duoc bug notes.';
        setBugActionMessage(message);
      } finally {
        if (active) {
          setIsLoadingBugNotes(false);
        }
      }
    };

    void loadBugNotes();
    return () => {
      active = false;
    };
  }, [getAccessToken]);

  const excelProjectOptions = useMemo(
    () => projectOptions.filter((project) => project.fileType === 'excel'),
    [projectOptions]
  );

  const wordProjectOptions = useMemo(
    () => projectOptions.filter((project) => project.fileType === 'word'),
    [projectOptions]
  );

  const selectedProjectDisplayName = useMemo(
    () => projectOptions.find((project) => project.code === projectCode)?.displayName || projectCode,
    [projectCode, projectOptions]
  );

  const currentProjectNotes = useMemo(
    () =>
      bugNotes
        .filter((note) => note.projectCode === projectCode)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [bugNotes, projectCode]
  );

  const autoBugTitle = useMemo(() => selectedProjectDisplayName, [selectedProjectDisplayName]);
  const publishableAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.isActive && assignment.isPublishable),
    [assignments]
  );

  const visiblePublicationAssignments = useMemo(
    () => assignments.filter((assignment) => assignment.isActive),
    [assignments]
  );

  const selectedPublicationAssignments = useMemo(
    () =>
      selectedAssignmentIds
        .map((assignmentId) => publishableAssignments.find((assignment) => assignment.id === assignmentId) || null)
        .filter((assignment): assignment is Assignment => assignment !== null),
    [publishableAssignments, selectedAssignmentIds]
  );

  useEffect(() => {
    setSelectedAssignmentIds((currentValue) =>
      currentValue.filter((assignmentId) => publishableAssignments.some((assignment) => assignment.id === assignmentId))
    );
  }, [publishableAssignments]);

  useEffect(() => {
    setIsBugTitleDirty(false);
    setBugDescription('');
  }, [projectCode]);

  useEffect(() => {
    if (!isBugTitleDirty) {
      setBugTitle(autoBugTitle);
    }
  }, [autoBugTitle, isBugTitleDirty]);

  useEffect(() => {
    setLocalAgentPublicationToken('');
    setCreateExamPublicationMessage(null);
  }, [examName, selectedClassId, selectedStudentIds, selectedAssignmentIds]);

  const isValidGradingFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    // Support both Excel and Word files
    return (
      fileName.endsWith('.xls') ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xlsm') ||
      fileName.endsWith('.docx') ||
      fileName.endsWith('.txt')
    );
  };

  const handleProjectChange = (nextProjectCode: string) => {
    setProjectCode(nextProjectCode);
    setError(null);
    setBugActionMessage(null);
    setResult(null);
  };

  const setSelectedFile = (file: File | null) => {
    if (!file) return;
    if (!isValidGradingFile(file)) {
      alert('File phai co dinh dang .xls, .xlsx, .xlsm, .docx hoac .txt');
      return;
    }
    setStudentFile(file);
    setError(null);
    setResult(null);
  };

  const handleTogglePublicationAssignment = (assignmentId: string) => {
    setSelectedAssignmentIds((currentValue) =>
      currentValue.includes(assignmentId)
        ? currentValue.filter((item) => item !== assignmentId)
        : [...currentValue, assignmentId]
    );
  };

  const handleToggleWholeClass = (checked: boolean) => {
    setSelectWholeClass(checked);
    if (checked) {
      setSelectedStudentIds(students.map((student) => student.id));
    }
  };

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((currentValue) => {
      const nextValue = currentValue.includes(studentId)
        ? currentValue.filter((item) => item !== studentId)
        : [...currentValue, studentId];

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

    if (selectedAssignmentIds.length === 0) {
      setCreateExamPublicationMessage('Vui lòng chọn ít nhất một assignment.');
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
          assignmentIds: selectedAssignmentIds,
          modeRules: {
            mode: 'Testing',
            allowHelp: allowExamHelp,
          },
        },
        getAccessToken
      );

      setLocalAgentPublicationToken(publication.publicationToken);
      setCreateExamPublicationMessage('Đã tạo ca thi thành công.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể tạo ca thi test.';
      setLocalAgentPublicationToken('');
      setCreateExamPublicationMessage(message);
    } finally {
      setIsCreatingExamPublication(false);
    }
  };

  const handleGrade = async () => {
    if (!studentFile) {
      alert('Vui long chon file bai lam hoc sinh!');
      return;
    }

    setLoading(true);
    setError(null);
    setBugActionMessage(null);

    try {
      const data = await gradingService.gradeForTesting(projectCode, studentFile, getAccessToken);
      setResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Co loi xay ra khi cham diem.';
      setError(message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const buildBugNoteClipboardText = (note: GradingTestBugNote): string => {
    const lines = [
      `[${note.severity.toUpperCase()}] ${note.title}`,
      `Project: ${note.projectDisplayName} (${note.projectCode})`,
      `Time: ${new Date(note.createdAt).toLocaleString('vi-VN')}`,
      note.scoreSummary
        ? `Score: ${note.scoreSummary.totalScore}/${note.scoreSummary.maxScore} (${note.scoreSummary.percentage}%) - ${note.scoreSummary.status}`
        : '',
      note.gradingError ? `Grading error: ${note.gradingError}` : '',
      'Description:',
      note.description,
    ].filter(Boolean);

    return lines.join('\n');
  };

  const handleSaveBugNote = async () => {
    const title = bugTitle.trim();
    const description = bugDescription.trim();

    if (!title) {
      setBugActionMessage('Vui long nhap tieu de bug.');
      return;
    }

    if (!description) {
      setBugActionMessage('Vui long nhap mo ta bug.');
      return;
    }

    const request: CreateGradingTestBugNoteRequest = {
      projectCode,
      projectDisplayName: selectedProjectDisplayName,
      title,
      description,
      severity: bugSeverity,
      scoreSummary: result
        ? {
            totalScore: result.totalScore,
            maxScore: result.maxScore,
            percentage: result.percentage,
            status: result.status,
          }
        : undefined,
      gradingError: error || undefined,
    };

    setIsSavingBugNote(true);
    try {
      const savedNote = await gradingService.createTestingBugNote(request, getAccessToken);
      setBugNotes((prev) => [savedNote, ...prev.filter((item) => item.id !== savedNote.id)]);
      setIsBugTitleDirty(false);
      setBugDescription('');
      setBugActionMessage('Da luu bug note.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Khong luu duoc bug note.';
      setBugActionMessage(message);
    } finally {
      setIsSavingBugNote(false);
    }
  };

  const handleDeleteBugNote = async (noteId: string) => {
    if (!window.confirm('Ban co chac chan muon xoa bug note nay?')) {
      return;
    }

    setDeletingBugNoteId(noteId);
    try {
      await gradingService.deleteTestingBugNote(noteId, getAccessToken);
      setBugNotes((prev) => prev.filter((item) => item.id !== noteId));
      setCopiedNoteId((prev) => (prev === noteId ? null : prev));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Khong xoa duoc bug note.';
      setBugActionMessage(message);
    } finally {
      setDeletingBugNoteId(null);
    }
  };

  const handleCopyBugNote = async (note: GradingTestBugNote) => {
    const text = buildBugNoteClipboardText(note);

    try {
      await navigator.clipboard.writeText(text);
      setCopiedNoteId(note.id);
      setTimeout(() => setCopiedNoteId((prev) => (prev === note.id ? null : prev)), 1500);
    } catch {
      setBugActionMessage('Khong copy duoc bug note. Hay copy thu cong tu danh sach.');
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-4">
      <h1 className="mb-2 text-2xl font-bold text-gray-800">Kiểm thử chấm điểm (Excel & Word)</h1>
      <p className="mb-6 text-sm text-slate-600">
        Trang này để test nhanh lượng chấm điểm Excel và Word. Bạn có thể lưu bug note theo từng project để theo dõi.
      </p>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
        <div className="mb-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Chọn bài Excel</label>
            <select
              value={excelProjectOptions.some((project) => project.code === projectCode) ? projectCode : ''}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-gray-50 p-2"
              disabled={loadingProjects || excelProjectOptions.length === 0}
            >
              <option value="" disabled>
                {excelProjectOptions.length === 0 ? 'Không có bài Excel' : 'Chọn bài Excel'}
              </option>
              {excelProjectOptions.map((project) => (
                <option key={project.code} value={project.code}>
                  {project.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Chọn bài Word</label>
            <select
              value={wordProjectOptions.some((project) => project.code === projectCode) ? projectCode : ''}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-gray-50 p-2"
              disabled={loadingProjects || wordProjectOptions.length === 0}
            >
              <option value="" disabled>
                {wordProjectOptions.length === 0 ? 'Không có bài Word' : 'Chọn bài Word'}
              </option>
              {wordProjectOptions.map((project) => (
                <option key={project.code} value={project.code}>
                  {project.displayName}
                </option>
              ))}
            </select>
          </div>

          {projectLoadError && <p className="text-xs text-red-600 md:col-span-2">{projectLoadError}</p>}
        </div>

        <div className="mb-6">
            <div
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition ${
                isDragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                const file = e.dataTransfer.files?.[0] || null;
                setSelectedFile(file);
              }}
            >
              <input
                type="file"
                accept=".xls,.xlsx,.xlsm,.docx,.dotx,.txt"
                onChange={(e) => {
                  setSelectedFile(e.target.files?.[0] || null);
                  e.target.value = '';
                }}
                className="hidden"
                id="student-upload"
              />
              <label htmlFor="student-upload" className="cursor-pointer text-center">
                <FileSpreadsheet className="mx-auto mb-2 h-12 w-12 text-green-600" />
                <span className="text-sm font-medium text-gray-700">File bai lam hoc sinh (Excel hoac Word)</span>
                <p className="mt-1 text-xs text-gray-500">Keo tha file .xlsx, .xls, .xlsm, .docx hoac .txt vao day</p>
                {studentFile && <p className="mt-1 text-xs font-semibold text-green-600">{studentFile.name}</p>}
              </label>
            </div>
          </div>

        {error && <div className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700">{error}</div>}

        <button
          onClick={handleGrade}
          disabled={loading || loadingProjects || projectOptions.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? <RefreshCw className="animate-spin" /> : <Upload size={20} />}
          {loading ? 'Đang chấm điểm...' : 'Bắt đầu chấm'}
        </button>
      </div>

      {result && (
        <div className="mt-6">
          <ResultCard result={result} />
        </div>
      )}

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-slate-800">Tạo ca thi</h2>
          <p className="mt-1 text-sm text-slate-600">
            Giáo viên tạo một publication cho cả lớp hoặc một nhóm học sinh, rồi gửi link thi cho học sinh tự mở.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Tên ca thi</label>
            <input
              type="text"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="Ví dụ: Ca thi MOS Excel"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Lớp thi</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              disabled={loadingClasses || classes.length === 0}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
            >
              <option value="" disabled>
                {loadingClasses ? 'Đang tải lớp...' : classes.length === 0 ? 'Chưa có lớp' : 'Chọn lớp'}
              </option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Danh sách học sinh trong lớp</label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <label className="mb-3 flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={selectWholeClass}
                  onChange={(event) => handleToggleWholeClass(event.target.checked)}
                  disabled={!selectedClassId || loadingStudents || students.length === 0}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600"
                />
                Chọn toàn bộ lớp
              </label>

              <div className="grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                {!selectedClassId && (
                  <p className="text-sm text-slate-500">Chọn lớp trước để tải danh sách học sinh.</p>
                )}
                {selectedClassId && loadingStudents && <p className="text-sm text-slate-500">Đang tải học sinh...</p>}
                {selectedClassId && !loadingStudents && students.length === 0 && (
                  <p className="text-sm text-slate-500">Chưa có học sinh trong lớp này.</p>
                )}
                {students.map((student) => {
                  const checked = selectedStudentIds.includes(student.id);

                  return (
                    <label
                      key={student.id}
                      className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                        checked ? 'border-sky-300 bg-sky-50 text-sky-900' : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleStudent(student.id)}
                        disabled={!selectedClassId || loadingStudents}
                        className="h-4 w-4 rounded border-slate-300 text-sky-600"
                      />
                      <span>{buildStudentDisplayName(student) || student.id}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">Assignment dùng để tạo lịch thi</label>
            <div className="grid gap-3 sm:grid-cols-3">
              {visiblePublicationAssignments.map((assignment) => {
                const checked = selectedAssignmentIds.includes(assignment.id);
                const isDisabled = !assignment.isPublishable;

                return (
                  <label
                    key={assignment.id}
                    className={`flex items-start gap-3 rounded-md border px-3 py-2 text-sm transition ${
                      isDisabled
                        ? 'cursor-not-allowed border-amber-200 bg-amber-50 text-amber-900'
                        : checked
                          ? 'cursor-pointer border-sky-300 bg-sky-50 text-sky-900'
                          : 'cursor-pointer border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleTogglePublicationAssignment(assignment.id)}
                      disabled={isDisabled}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 disabled:cursor-not-allowed"
                    />
                    <span>
                      {assignment.name}
                      <span className="block text-xs text-slate-500">
                        {assignment.examType.toUpperCase()} • {assignment.subject.toUpperCase()} •{' '}
                        {assignment.gradingApiEndpoint}
                      </span>
                      {assignment.isLockedForPublication && (
                        <span className="block text-xs text-slate-500">Đã dùng để tạo lịch thi trước đó.</span>
                      )}
                      {isDisabled && (
                        <span className="block text-xs text-amber-700">
                          {assignment.publishBlockReason || 'Assignment này chưa đủ điều kiện để tạo lịch thi.'}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
              {!loadingAssignments && visiblePublicationAssignments.length === 0 && (
                <p className="text-sm text-slate-500">Lớp này chưa có assignment đang hoạt động để tạo lịch thi.</p>
              )}
            </div>
          </div>

          <div className="md:col-span-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={allowExamHelp}
                onChange={(event) => setAllowExamHelp(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600"
              />
              <span>
                Cho phép học sinh mở Help trong lúc thi
                <span className="block text-xs text-slate-500">
                  Mặc định tắt cho chế độ Testing. Khi bật, Local Agent sẽ nhận modeRules.allowHelp=true cho ca thi này.
                </span>
              </span>
            </label>
          </div>

          <div className="md:col-span-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => void handleCreateLocalAgentExam()}
              disabled={
                isCreatingExamPublication ||
                loadingClasses ||
                loadingStudents ||
                loadingAssignments ||
                !selectedClassId ||
                selectedStudentIds.length === 0 ||
                selectedAssignmentIds.length === 0
              }
              className="inline-flex items-center justify-center gap-2 rounded-md bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isCreatingExamPublication ? <RefreshCw size={16} className="animate-spin" /> : null}
              {isCreatingExamPublication ? 'Đang tạo ca thi...' : 'Tạo ca thi'}
            </button>

            {classLoadError && <p className="text-xs text-rose-600">{classLoadError}</p>}
            {studentLoadError && <p className="text-xs text-rose-600">{studentLoadError}</p>}
            {assignmentLoadError && <p className="text-xs text-rose-600">{assignmentLoadError}</p>}
            {createExamPublicationMessage && <p className="text-xs text-slate-600">{createExamPublicationMessage}</p>}
            {localAgentPublicationToken && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <p className="font-semibold">Đã tạo ca thi</p>
                <p>
                  <strong>Publication token:</strong> {localAgentPublicationToken}
                </p>
                <p>
                  <strong>Link thi:</strong> <code>{`${window.location.origin}/exam/${localAgentPublicationToken}`}</code>
                </p>
                <p>
                  <strong>Số học sinh:</strong> {selectedStudentIds.length}
                </p>
                <p>
                  <strong>Số assignment:</strong> {selectedPublicationAssignments.length}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Bug size={18} className="text-amber-600" />
              Bug Notes
            </h2>
            <p className="text-xs text-slate-500">
              Dang xem: <span className="font-medium">{selectedProjectDisplayName}</span> ({currentProjectNotes.length}{' '}
              note)
            </p>
          </div>
          <p className="text-xs text-slate-500">Tong notes da luu: {bugNotes.length}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <label className="mb-1 block text-xs font-medium text-slate-700">Tieu de bug</label>
            <input
              type="text"
              value={bugTitle}
              onChange={(e) => {
                setBugTitle(e.target.value);
                setIsBugTitleDirty(true);
              }}
              placeholder="Vi du: Project 09 cham sai task T4"
              className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />

            <label className="mb-1 block text-xs font-medium text-slate-700">Muc do</label>
            <select
              value={bugSeverity}
              onChange={(e) => setBugSeverity(e.target.value as BugSeverity)}
              className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <label className="mb-1 block text-xs font-medium text-slate-700">Mo ta bug</label>
            <textarea
              value={bugDescription}
              onChange={(e) => {
                setBugDescription(e.target.value);
              }}
              placeholder="Mo ta buoc tai hien, ket qua mong doi, ket qua thuc te..."
              rows={5}
              className="mb-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />

            <button
              type="button"
              onClick={() => void handleSaveBugNote()}
              disabled={isSavingBugNote}
              className="w-full rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingBugNote ? 'Dang luu...' : 'Luu bug note'}
            </button>

            {bugActionMessage && <p className="mt-2 text-xs text-slate-600">{bugActionMessage}</p>}
          </div>

          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {isLoadingBugNotes && (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Dang tai bug notes...
              </div>
            )}

            {!isLoadingBugNotes && currentProjectNotes.length === 0 && (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Chua co bug note nao cho project nay.
              </div>
            )}

            {!isLoadingBugNotes &&
              currentProjectNotes.map((note) => (
                <article key={note.id} className="rounded-md border border-slate-200 p-3">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{note.title}</h3>
                      <p className="text-[11px] text-slate-500">{new Date(note.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        severityMeta[note.severity].badgeClass
                      }`}
                    >
                      {severityMeta[note.severity].label}
                    </span>
                  </div>

                  {note.scoreSummary && (
                    <p className="mb-2 text-xs text-slate-600">
                      Score: {note.scoreSummary.totalScore}/{note.scoreSummary.maxScore} ({note.scoreSummary.percentage}
                      %) - {note.scoreSummary.status}
                    </p>
                  )}

                  {note.gradingError && (
                    <p className="mb-2 rounded bg-rose-50 px-2 py-1 text-xs text-rose-700">{note.gradingError}</p>
                  )}

                  <p className="mb-3 whitespace-pre-wrap text-sm text-slate-700">{note.description}</p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopyBugNote(note)}
                      className="inline-flex items-center gap-1 rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 hover:bg-slate-100"
                    >
                      <Copy size={12} />
                      {copiedNoteId === note.id ? 'Da copy' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteBugNote(note.id)}
                      disabled={deletingBugNoteId === note.id}
                      className="inline-flex items-center gap-1 rounded border border-rose-200 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Trash2 size={12} />
                      {deletingBugNoteId === note.id ? 'Dang xoa...' : 'Xoa'}
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default GradingView;
