import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { X, FileDown, Eye, EyeOff } from 'lucide-react';
import type { Assignment } from '../types/assignment.types';
import type { Student } from '../types/student.types';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';
import type { ExcelCellComment } from '../utils/exportUtils';
import { useAuth } from '../context/AuthContext';
import studentService from '../services/student.service';

type CompetencyLevel = '' | 'A' | 'B' | 'C' | 'D';
type AssignmentColumnDisplayMode = 'full' | 'compact' | 'hidden';
type ScoreTableSortKey = 'none' | 'name' | 'classification';
type ScoreTableSortDirection = 'asc' | 'desc';
type PracticeCode = 'practice01' | 'practice02' | 'practice03';

interface PracticeSummary {
  completionText: string;
  totalScore: number;
}

interface DisplayStudentRow {
  id: string;
  middleName: string;
  firstName: string;
  notes: string;
  calculatedScores: Record<string, number>;
  errorsByAssignment: Record<string, string[]>;
  totalScore: number;
  totalPercentage: number;
  classification: CompetencyLevel;
  practiceSummaries: Record<PracticeCode, PracticeSummary>;
}

interface ViewAllScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignments: Assignment[];
  students: Student[];
  classDisplayName?: string;
  onStudentClassificationUpdated?: (studentId: string, classification: CompetencyLevel) => void;
  onStudentNotesUpdated?: (studentId: string, notes: string) => void;
  scores: {
    studentId: string;
    assignmentId: string;
    assignmentName?: string;
    scoreValue: number | null;
    autoGradingErrors?: string[];
  }[];
}

const formatScore = (value: number): string => {
  if (!Number.isFinite(value)) return '0';
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.00$/, '');
};

const getScorePillClass = (score: number, maxScore: number): string => {
  if (!Number.isFinite(maxScore) || maxScore <= 0) {
    return 'border-slate-200 bg-slate-100 text-slate-600';
  }
  const ratio = score / maxScore;
  if (ratio >= 0.85) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (ratio >= 0.65) return 'border-blue-200 bg-blue-50 text-blue-700';
  if (ratio > 0) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-100 text-slate-500';
};

const getPercentagePillClass = (percentage: number): string => {
  if (percentage >= 75) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (percentage >= 50) return 'border-blue-200 bg-blue-50 text-blue-700';
  if (percentage > 0) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-100 text-slate-500';
};

const normalizeErrorText = (value: string): string => value.replace(/\s+/g, ' ').trim();
const toDedupKey = (value: string): string =>
  normalizeErrorText(value)
    .toLowerCase()
    .replace(/[.:;!?]+$/g, '');

const normalizeClassification = (value?: string): CompetencyLevel => {
  const normalized = (value || '').trim().toUpperCase();
  return normalized === 'A' || normalized === 'B' || normalized === 'C' || normalized === 'D'
    ? normalized
    : '';
};

const classificationClassMap: Record<'A' | 'B' | 'C' | 'D', string> = {
  A: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  B: 'bg-blue-100 text-blue-700 border-blue-200',
  C: 'bg-amber-100 text-amber-700 border-amber-200',
  D: 'bg-rose-100 text-rose-700 border-rose-200',
};
const classificationLevels: Array<Exclude<CompetencyLevel, ''>> = ['A', 'B', 'C', 'D'];

const sanitizeFileNamePart = (value: string): string =>
  value.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim();

const vietnameseCollator = new Intl.Collator('vi', {
  sensitivity: 'base',
  numeric: true,
});

const classificationSortOrder: Record<CompetencyLevel, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  '': 4,
};

const PRACTICE_MAX_SCORE = 1000;
const PRACTICE_COMPLETION_TARGET = 8;
const PRACTICE_COLUMNS: Array<{ code: PracticeCode; shortLabel: string; title: string }> = [
  { code: 'practice01', shortLabel: 'P01', title: 'Practice 01' },
  { code: 'practice02', shortLabel: 'P02', title: 'Practice 02' },
  { code: 'practice03', shortLabel: 'P03', title: 'Practice 03' },
];

const PRACTICE_COLUMN_THEME: Record<
  PracticeCode,
  {
    completionHeader: string;
    completionCell: string;
    scoreHeader: string;
    scoreCell: string;
  }
> = {
  practice01: {
    completionHeader: 'bg-emerald-100 text-emerald-900',
    completionCell: 'bg-emerald-50 text-emerald-900',
    scoreHeader: 'bg-emerald-200 text-emerald-900',
    scoreCell: 'bg-emerald-100/70 text-emerald-900',
  },
  practice02: {
    completionHeader: 'bg-sky-100 text-sky-900',
    completionCell: 'bg-sky-50 text-sky-900',
    scoreHeader: 'bg-sky-200 text-sky-900',
    scoreCell: 'bg-sky-100/70 text-sky-900',
  },
  practice03: {
    completionHeader: 'bg-violet-100 text-violet-900',
    completionCell: 'bg-violet-50 text-violet-900',
    scoreHeader: 'bg-violet-200 text-violet-900',
    scoreCell: 'bg-violet-100/70 text-violet-900',
  },
};

const extractProjectNumberFromEndpoint = (endpoint?: string): number | null => {
  if (!endpoint) return null;

  let normalized = endpoint.trim().replace(/\\/g, '/').replace(/^\/+/, '');
  normalized = normalized.replace(/^api\/grading\//i, '').replace(/^grading\//i, '');

  const directProjectMatch = normalized.match(/^project(\d{1,2})$/i);
  if (directProjectMatch) {
    return Number.parseInt(directProjectMatch[1], 10);
  }

  const subjectProjectMatch = normalized.match(/^(excel|word|ppt|powerpoint)\/project(\d{1,2})$/i);
  if (subjectProjectMatch) {
    return Number.parseInt(subjectProjectMatch[2], 10);
  }

  return null;
};

const resolvePracticeByProjectNumber = (projectNumber: number): PracticeCode | null => {
  if (projectNumber >= 1 && projectNumber <= 8) return 'practice01';
  if (projectNumber >= 9 && projectNumber <= 16) return 'practice02';
  if (projectNumber >= 17 && projectNumber <= 24) return 'practice03';
  return null;
};

const ViewAllScoresModal: FC<ViewAllScoresModalProps> = ({
  isOpen,
  onClose,
  assignments,
  students,
  classDisplayName,
  onStudentClassificationUpdated,
  onStudentNotesUpdated,
  scores,
}) => {
  const { getAccessToken } = useAuth();

  const [classificationByStudentId, setClassificationByStudentId] = useState<
    Record<string, CompetencyLevel>
  >({});
  const [notesByStudentId, setNotesByStudentId] = useState<Record<string, string>>({});
  const [savingClassificationStudentId, setSavingClassificationStudentId] = useState<string | null>(
    null
  );
  const [savingNotesStudentId, setSavingNotesStudentId] = useState<string | null>(null);
  const [columnDisplayByAssignmentId, setColumnDisplayByAssignmentId] = useState<
    Record<string, AssignmentColumnDisplayMode>
  >({});
  const [isClassificationColumnVisible, setIsClassificationColumnVisible] = useState(true);
  const [sortKey, setSortKey] = useState<ScoreTableSortKey>('name');
  const [sortDirection, setSortDirection] = useState<ScoreTableSortDirection>('asc');

  useEffect(() => {
    if (!isOpen) return;

    const nextClassificationMap: Record<string, CompetencyLevel> = {};
    const nextNotesMap: Record<string, string> = {};
    students.forEach((student) => {
      nextClassificationMap[student.id] = normalizeClassification(student.competencyLevel);
      nextNotesMap[student.id] = (student.notes || '').trim();
    });
    setClassificationByStudentId(nextClassificationMap);
    setNotesByStudentId(nextNotesMap);
  }, [isOpen, students]);

  useEffect(() => {
    if (!isOpen) return;
    setColumnDisplayByAssignmentId((prev) => {
      const next: Record<string, AssignmentColumnDisplayMode> = {};
      assignments.forEach((assignment) => {
        next[assignment.id] = prev[assignment.id] ?? 'full';
      });
      return next;
    });
  }, [isOpen, assignments]);

  useEffect(() => {
    if (!isOpen) return;
    setSortKey('name');
    setSortDirection('asc');
  }, [isOpen]);

  const maxScoreTotal = useMemo(
    () => assignments.reduce((sum, assignment) => sum + (assignment.maxScore || 0), 0),
    [assignments]
  );

  const studentsById = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((student) => map.set(student.id, student));
    return map;
  }, [students]);

  const scoreLookup = useMemo(() => {
    const map = new Map<string, { scoreValue: number | null; autoGradingErrors?: string[] }>();
    scores.forEach((score) => {
      map.set(`${score.studentId}::${score.assignmentId}`, {
        scoreValue: score.scoreValue,
        autoGradingErrors: score.autoGradingErrors || [],
      });
    });
    return map;
  }, [scores]);

  const displayedAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) => (columnDisplayByAssignmentId[assignment.id] ?? 'full') !== 'hidden'
      ),
    [assignments, columnDisplayByAssignmentId]
  );

  const compactAssignmentsCount = useMemo(
    () =>
      displayedAssignments.filter(
        (assignment) => (columnDisplayByAssignmentId[assignment.id] ?? 'full') === 'compact'
      ).length,
    [displayedAssignments, columnDisplayByAssignmentId]
  );

  const staticColumnCount = isClassificationColumnVisible ? 13 : 12;

  const areAllAssignmentsVisible = useMemo(
    () =>
      assignments.length > 0 &&
      assignments.every((assignment) => (columnDisplayByAssignmentId[assignment.id] ?? 'full') === 'full'),
    [assignments, columnDisplayByAssignmentId]
  );

  const areAllAssignmentsCompact = useMemo(
    () =>
      assignments.length > 0 &&
      assignments.every(
        (assignment) => (columnDisplayByAssignmentId[assignment.id] ?? 'full') === 'compact'
      ),
    [assignments, columnDisplayByAssignmentId]
  );

  const areAllAssignmentsHidden = useMemo(
    () =>
      assignments.length > 0 &&
      assignments.every((assignment) => (columnDisplayByAssignmentId[assignment.id] ?? 'full') === 'hidden'),
    [assignments, columnDisplayByAssignmentId]
  );

  const displayRows = useMemo<DisplayStudentRow[]>(() => {
    if (!isOpen) return [];

    return students.map((student) => {
      const middleName = (student.middleName || '').trim();
      const firstName = (student.firstName || '').trim();
      const notesMapValue = notesByStudentId[student.id];
      const notes = notesMapValue !== undefined ? notesMapValue : (student.notes || '').trim();

      let totalScore = 0;
      const practiceProjectScores: Record<PracticeCode, Map<number, { hasScore: boolean; score: number }>> = {
        practice01: new Map(),
        practice02: new Map(),
        practice03: new Map(),
      };
      const calculatedScores: Record<string, number> = {};
      const errorsByAssignment: Record<string, string[]> = {};

      assignments.forEach((assignment) => {
        const key = `${student.id}::${assignment.id}`;
        const scoreObj = scoreLookup.get(key);
        const score = typeof scoreObj?.scoreValue === 'number' ? scoreObj.scoreValue : 0;
        calculatedScores[assignment.id] = score;
        totalScore += score;

        const projectNumber = extractProjectNumberFromEndpoint(assignment.gradingApiEndpoint);
        const practiceCode = projectNumber ? resolvePracticeByProjectNumber(projectNumber) : null;
        if (projectNumber && practiceCode) {
          const current = practiceProjectScores[practiceCode].get(projectNumber) ?? {
            hasScore: false,
            score: 0,
          };

          if (typeof scoreObj?.scoreValue === 'number') {
            current.hasScore = true;
            current.score = Math.max(current.score, scoreObj.scoreValue);
          }

          practiceProjectScores[practiceCode].set(projectNumber, current);
        }

        const assignmentErrors: string[] = [];
        const seenErrors = new Set<string>();
        (scoreObj?.autoGradingErrors || []).forEach((rawError) => {
          const errorText = normalizeErrorText(rawError || '');
          if (!errorText) return;
          const dedupKey = toDedupKey(errorText);
          if (seenErrors.has(dedupKey)) return;
          seenErrors.add(dedupKey);
          assignmentErrors.push(errorText);
        });
        errorsByAssignment[assignment.id] = assignmentErrors;
      });

      const mapValue = classificationByStudentId[student.id];
      const classification =
        mapValue !== undefined ? mapValue : normalizeClassification(student.competencyLevel);
      const totalPercentage =
        maxScoreTotal > 0 ? Math.round((totalScore / maxScoreTotal) * 10000) / 100 : 0;
      const practiceSummaries = PRACTICE_COLUMNS.reduce(
        (acc, practice) => {
          const items = Array.from(practiceProjectScores[practice.code].values());
          const completed = Math.min(
            PRACTICE_COMPLETION_TARGET,
            items.filter((item) => item.hasScore).length
          );
          const totalPracticeScore = items.reduce(
            (sum, item) => sum + (item.hasScore ? item.score : 0),
            0
          );
          const normalizedPracticeScore = Math.max(0, Math.min(PRACTICE_MAX_SCORE, totalPracticeScore));

          acc[practice.code] = {
            completionText: `${completed}/${PRACTICE_COMPLETION_TARGET}`,
            totalScore: normalizedPracticeScore,
          };

          return acc;
        },
        {} as Record<PracticeCode, PracticeSummary>
      );

      return {
        id: student.id,
        middleName,
        firstName,
        notes,
        calculatedScores,
        errorsByAssignment,
        totalScore,
        totalPercentage,
        classification,
        practiceSummaries,
      };
    });
  }, [isOpen, students, assignments, scoreLookup, classificationByStudentId, notesByStudentId, maxScoreTotal]);

  const sortedDisplayRows = useMemo<DisplayStudentRow[]>(() => {
    if (sortKey === 'none') return displayRows;

    const rows = [...displayRows];
    rows.sort((left, right) => {
      const leftFirstName = (left.firstName || '').trim();
      const rightFirstName = (right.firstName || '').trim();
      const leftMiddleName = (left.middleName || '').trim();
      const rightMiddleName = (right.middleName || '').trim();
      const leftFullName = `${leftMiddleName} ${leftFirstName}`.trim();
      const rightFullName = `${rightMiddleName} ${rightFirstName}`.trim();

      if (sortKey === 'name') {
        // Ưu tiên sắp theo cột "Tên" trước, nếu trùng thì mới so theo "Họ và tên đệm".
        const byFirstName = vietnameseCollator.compare(leftFirstName, rightFirstName);
        if (byFirstName !== 0) {
          return sortDirection === 'asc' ? byFirstName : -byFirstName;
        }
        const byMiddleName = vietnameseCollator.compare(leftMiddleName, rightMiddleName);
        return sortDirection === 'asc' ? byMiddleName : -byMiddleName;
      }

      const leftOrder = classificationSortOrder[left.classification];
      const rightOrder = classificationSortOrder[right.classification];
      const byClassification = leftOrder - rightOrder;
      if (byClassification !== 0) {
        return sortDirection === 'asc' ? byClassification : -byClassification;
      }

      return vietnameseCollator.compare(leftFullName, rightFullName);
    });

    return rows;
  }, [displayRows, sortKey, sortDirection]);

  const excelHeaders = useMemo(
    () => [
      'STT',
      'Họ và tên đệm',
      'Tên',
      ...assignments.map((assignment) => `${assignment.name} (tối đa ${assignment.maxScore})`),
      'Xếp loại',
      ...PRACTICE_COLUMNS.flatMap((practice) => [
        `${practice.title} - Số bài`,
        `${practice.title} - Tổng điểm`,
      ]),
      'Tổng điểm',
      'Tỷ lệ đạt',
      'Ghi chú',
    ],
    [assignments]
  );

  const excelBody = useMemo(
    () =>
      sortedDisplayRows.map((row, index) => [
        index + 1,
        row.middleName,
        row.firstName,
        ...assignments.map((assignment) => formatScore(row.calculatedScores[assignment.id] ?? 0)),
        row.classification,
        ...PRACTICE_COLUMNS.flatMap((practice) => [
          row.practiceSummaries[practice.code].completionText,
          `${formatScore(row.practiceSummaries[practice.code].totalScore)}/${formatScore(
            PRACTICE_MAX_SCORE
          )}`,
        ]),
        `${formatScore(row.totalScore)}/${formatScore(maxScoreTotal)}`,
        `${formatScore(row.totalPercentage)}%`,
        row.notes,
      ]),
    [sortedDisplayRows, assignments, maxScoreTotal]
  );

  const excelScoreComments = useMemo<ExcelCellComment[]>(() => {
    const comments: ExcelCellComment[] = [];
    const assignmentStartColumnIndex = 3; // STT, Họ và tên đệm, Tên

    sortedDisplayRows.forEach((row, rowIndex) => {
      assignments.forEach((assignment, assignmentIndex) => {
        const errors = row.errorsByAssignment[assignment.id] || [];
        if (errors.length === 0) return;

        comments.push({
          row: rowIndex,
          col: assignmentStartColumnIndex + assignmentIndex,
          author: 'MOS Grader',
          text: [`${assignment.name} - ${errors.length} lỗi`, ...errors.map((e, i) => `${i + 1}. ${e}`)].join(
            '\n'
          ),
        });
      });
    });

    return comments;
  }, [sortedDisplayRows, assignments]);

  const excelErrorHeaders = useMemo(
    () => ['STT', 'Họ và tên đệm', 'Tên', 'Bài tập', 'Điểm', 'Số lỗi', 'Chi tiết lỗi'],
    []
  );

  const excelClassificationStatsHeaders = useMemo(
    () => ['Xếp loại', 'Số lượng', 'Tỷ lệ (%)'],
    []
  );

  const excelClassificationStatsBody = useMemo(() => {
    const totalStudents = sortedDisplayRows.length;
    const rows: (string | number)[][] = classificationLevels.map((level) => {
      const count = sortedDisplayRows.filter((row) => row.classification === level).length;
      const percentage = totalStudents > 0 ? Math.round((count / totalStudents) * 10000) / 100 : 0;
      return [level, count, `${formatScore(percentage)}%`];
    });

    rows.push([
      'Tổng học sinh',
      totalStudents,
      totalStudents > 0 ? '100%' : '0%',
    ]);

    return rows;
  }, [sortedDisplayRows]);

  const excelErrorBody = useMemo(() => {
    const rows: (string | number)[][] = [];
    let index = 1;
    sortedDisplayRows.forEach((row) => {
      assignments.forEach((assignment) => {
        const errors = row.errorsByAssignment[assignment.id] || [];
        if (errors.length === 0) return;
        rows.push([
          index,
          row.middleName || '--',
          row.firstName || '--',
          assignment.name,
          formatScore(row.calculatedScores[assignment.id] ?? 0),
          errors.length,
          errors.map((e, i) => `${i + 1}. ${e}`).join('\n'),
        ]);
        index += 1;
      });
    });
    return rows;
  }, [sortedDisplayRows, assignments]);

  const titleClassName = (classDisplayName || '').trim() || 'Chưa đặt tên lớp';
  const safeClassName = sanitizeFileNamePart(titleClassName);
  const exportExcelFileName = `Bảng điểm ${safeClassName}`;
  const exportPdfFileName = `Bảng điểm ${safeClassName}.pdf`;

  const handleExportExcel = () => {
    const assignmentColumnWidths = assignments.map(() => 18);
    const practiceCompletionColumnWidths = PRACTICE_COLUMNS.map(() => 14);
    const practiceScoreColumnWidths = PRACTICE_COLUMNS.map(() => 16);
    const colWidths = [
      6,
      24,
      14,
      ...assignmentColumnWidths,
      12,
      ...practiceCompletionColumnWidths,
      ...practiceScoreColumnWidths,
      16,
      12,
      34,
    ];
    const extraSheets = [
      {
        sheetName: 'ThongKeXepLoai',
        header: excelClassificationStatsHeaders,
        body: excelClassificationStatsBody,
        title: `Thống kê xếp loại - ${titleClassName}`,
        colWidths: [18, 12, 14],
      },
      ...(excelErrorBody.length > 0
        ? [
            {
              sheetName: 'ChiTietLoi',
              header: excelErrorHeaders,
              body: excelErrorBody,
              title: `Chi tiết lỗi - ${titleClassName}`,
              colWidths: [6, 24, 14, 24, 10, 8, 80],
            },
          ]
        : []),
    ];

    exportToExcel(exportExcelFileName, 'BangDiem', excelHeaders, excelBody, {
      title: `Bảng điểm lớp ${titleClassName}`,
      colWidths,
      comments: excelScoreComments,
      extraSheets,
    });
  };

  const handleExportPdf = () => {
    exportToPdf('score-table', exportPdfFileName);
  };

  const handleAssignmentColumnDisplayChange = (
    assignmentId: string,
    mode: AssignmentColumnDisplayMode
  ) => {
    setColumnDisplayByAssignmentId((prev) => ({
      ...prev,
      [assignmentId]: mode,
    }));
  };

  const handleApplyColumnDisplayForAll = (mode: AssignmentColumnDisplayMode) => {
    const next: Record<string, AssignmentColumnDisplayMode> = {};
    assignments.forEach((assignment) => {
      next[assignment.id] = mode;
    });
    setColumnDisplayByAssignmentId(next);
  };

  const handleClassificationChange = async (studentId: string, nextLevel: CompetencyLevel) => {
    const previousLevel = classificationByStudentId[studentId] ?? '';
    setClassificationByStudentId((prev) => ({ ...prev, [studentId]: nextLevel }));

    const student = studentsById.get(studentId);
    if (!student) return;

    if (student.id.startsWith('temp-')) {
      onStudentClassificationUpdated?.(studentId, nextLevel);
      return;
    }

    setSavingClassificationStudentId(studentId);
    try {
      const fallbackStatus = student.isActive ? 'Active' : 'Inactive';
      const status = (student.status || '').trim() || fallbackStatus;
      const notes = (notesByStudentId[studentId] ?? (student.notes || '')).trim();

      await studentService.updateStudent(
        studentId,
        {
          middleName: (student.middleName || '').trim(),
          firstName: (student.firstName || '').trim(),
          status,
          competencyLevel: nextLevel,
          notes,
          classId: student.classId,
        },
        getAccessToken
      );
      onStudentClassificationUpdated?.(studentId, nextLevel);
    } catch (error) {
      setClassificationByStudentId((prev) => ({ ...prev, [studentId]: previousLevel }));
      alert(error instanceof Error ? error.message : 'Không thể cập nhật xếp loại học sinh.');
    } finally {
      setSavingClassificationStudentId(null);
    }
  };

  const handleNotesChange = (studentId: string, value: string) => {
    setNotesByStudentId((prev) => ({ ...prev, [studentId]: value }));
  };

  const handleNotesBlur = async (studentId: string) => {
    const student = studentsById.get(studentId);
    if (!student) return;

    const rawDraftNotes = notesByStudentId[studentId] ?? '';
    const draftNotes = rawDraftNotes.trim();
    const persistedNotes = (student.notes || '').trim();

    if (draftNotes !== rawDraftNotes) {
      setNotesByStudentId((prev) => ({ ...prev, [studentId]: draftNotes }));
    }

    if (draftNotes === persistedNotes) return;

    if (student.id.startsWith('temp-')) {
      onStudentNotesUpdated?.(studentId, draftNotes);
      return;
    }

    const fallbackStatus = student.isActive ? 'Active' : 'Inactive';
    const status = (student.status || '').trim() || fallbackStatus;
    const competencyLevel =
      classificationByStudentId[studentId] ?? normalizeClassification(student.competencyLevel);

    setSavingNotesStudentId(studentId);
    try {
      await studentService.updateStudent(
        studentId,
        {
          middleName: (student.middleName || '').trim(),
          firstName: (student.firstName || '').trim(),
          status,
          competencyLevel,
          notes: draftNotes,
          classId: student.classId,
        },
        getAccessToken
      );
      onStudentNotesUpdated?.(studentId, draftNotes);
    } catch (error) {
      setNotesByStudentId((prev) => ({ ...prev, [studentId]: persistedNotes }));
      alert(error instanceof Error ? error.message : 'Không thể cập nhật ghi chú học sinh.');
    } finally {
      setSavingNotesStudentId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[1px]">
      <div className="flex max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 font-bold text-white">
              BD
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Bảng điểm lớp {titleClassName}</h2>
              <p className="text-sm text-slate-500">
                {students.length} học sinh, {assignments.length} bài tập, hiện {displayedAssignments.length}/
                {assignments.length} cột điểm
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 pb-4 pt-4">
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-700">Tùy chỉnh cột điểm</div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleApplyColumnDisplayForAll('full')}
                    className={`px-3 py-1.5 text-xs font-semibold transition ${
                      areAllAssignmentsVisible
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Hiện tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyColumnDisplayForAll('compact')}
                    className={`border-l border-slate-200 px-3 py-1.5 text-xs font-semibold transition ${
                      areAllAssignmentsCompact
                        ? 'bg-amber-500 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Thu gọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyColumnDisplayForAll('hidden')}
                    className={`border-l border-slate-200 px-3 py-1.5 text-xs font-semibold transition ${
                      areAllAssignmentsHidden
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Ẩn tất cả
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsClassificationColumnVisible((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition ${
                    isClassificationColumnVisible
                      ? 'bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-700 hover:to-violet-700'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                  }`}
                >
                  {isClassificationColumnVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  {isClassificationColumnVisible ? 'Ẩn cột xếp loại' : 'Hiện cột xếp loại'}
                </button>

                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-2 py-1.5 shadow-sm">
                  <span className="text-xs font-semibold text-slate-600">Sắp xếp</span>
                  <select
                    value={sortKey}
                    onChange={(event) => {
                      const nextSortKey = event.target.value as ScoreTableSortKey;
                      setSortKey(nextSortKey);
                      if (nextSortKey === 'name') {
                        setSortDirection('asc');
                      }
                    }}
                    className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                    title="Chọn kiểu sắp xếp bảng điểm"
                  >
                    <option value="none">Mặc định</option>
                    <option value="name">Theo tên học sinh (A → Z)</option>
                    <option value="classification">Theo xếp loại</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
                    disabled={sortKey === 'none'}
                    className={`rounded-md px-2 py-1 text-xs font-semibold transition ${
                      sortKey === 'none'
                        ? 'cursor-not-allowed bg-slate-100 text-slate-400'
                        : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                    }`}
                    title="Đảo chiều sắp xếp"
                  >
                    {sortKey === 'name'
                      ? sortDirection === 'asc'
                        ? 'A → Z'
                        : 'Z → A'
                      : sortDirection === 'asc'
                      ? 'Tăng dần'
                      : 'Giảm dần'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {assignments.map((assignment) => {
                const mode = columnDisplayByAssignmentId[assignment.id] ?? 'full';
                return (
                  <label
                    key={`column-config-${assignment.id}`}
                    className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                    title={assignment.name}
                  >
                    <span className="max-w-[160px] truncate">{assignment.name}</span>
                    <select
                      value={mode}
                      onChange={(event) =>
                        handleAssignmentColumnDisplayChange(
                          assignment.id,
                          event.target.value as AssignmentColumnDisplayMode
                        )
                      }
                      className="rounded border border-slate-300 bg-white px-1 py-0.5 text-xs"
                    >
                      <option value="full">Hiện</option>
                      <option value="compact">Thu gọn</option>
                      <option value="hidden">Ẩn</option>
                    </select>
                  </label>
                );
              })}
            </div>
            {compactAssignmentsCount > 0 && (
              <div className="mt-2 text-[11px] text-slate-500">
                Cột thu gọn chỉ hiển thị điểm và số lỗi.
              </div>
            )}
          </div>

          <div id="score-table" className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-lg shadow-slate-900/5">
            <div className="flex items-center justify-between border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-2.5 text-sm font-semibold text-white">
              <span>Bảng điểm lớp {titleClassName}</span>
              <span className="text-xs font-medium text-slate-200">Nhấn badge lỗi để xem chi tiết</span>
            </div>
            <div className="max-h-[58vh] overflow-auto">
              <table className="w-full min-w-[1940px] border-separate border-spacing-0 text-sm text-slate-700">
                <thead className="z-20">
                  <tr className="border-b border-slate-700 bg-slate-800">
                    <th
                      className="sticky top-0 z-50 border-r border-slate-700 bg-slate-800 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-100 shadow-[1px_0_0_0_rgba(100,116,139,0.45)]"
                      style={{ left: 0, width: 70, minWidth: 70 }}
                    >
                      STT
                    </th>
                    <th
                      className="sticky top-0 z-50 border-r border-slate-700 bg-slate-800 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-100 shadow-[1px_0_0_0_rgba(100,116,139,0.45)]"
                      style={{ left: 70, width: 220, minWidth: 220 }}
                    >
                      Họ và tên đệm
                    </th>
                    <th
                      className="sticky top-0 z-50 border-r border-slate-700 bg-slate-800 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-100 shadow-[1px_0_0_0_rgba(100,116,139,0.45)]"
                      style={{ left: 290, width: 120, minWidth: 120 }}
                    >
                      Tên
                    </th>
                    {displayedAssignments.map((assignment) => {
                      const mode = columnDisplayByAssignmentId[assignment.id] ?? 'full';
                      const isCompact = mode === 'compact';
                      return (
                        <th
                          key={assignment.id}
                          className={`sticky top-0 z-40 ${isCompact ? 'w-[92px] min-w-[92px]' : 'min-w-[140px]'} border-r border-slate-700 bg-slate-800 px-3 py-3 text-center text-xs font-bold text-slate-100`}
                        >
                          <div className={isCompact ? 'truncate' : ''} title={assignment.name}>
                            {assignment.name}
                          </div>
                          {!isCompact && (
                            <div className="text-[11px] font-normal text-slate-300">(tối đa {assignment.maxScore})</div>
                          )}
                        </th>
                      );
                    })}
                    {isClassificationColumnVisible && (
                      <th className="sticky top-0 z-40 min-w-[130px] border-r border-slate-700 bg-slate-800 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-100">
                        Xếp loại
                      </th>
                    )}
                    {PRACTICE_COLUMNS.flatMap((practice) => {
                      const theme = PRACTICE_COLUMN_THEME[practice.code];
                      return [
                        <th
                          key={`${practice.code}-completion-sub`}
                          className={`sticky top-0 z-40 min-w-[112px] border-l border-slate-700 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide ${theme.completionHeader}`}
                        >
                          {practice.shortLabel} số bài
                        </th>,
                        <th
                          key={`${practice.code}-score-sub`}
                          className={`sticky top-0 z-40 min-w-[132px] border-r border-slate-700 px-3 py-3 text-right text-xs font-bold uppercase tracking-wide ${theme.scoreHeader}`}
                        >
                          {practice.shortLabel} tổng điểm
                        </th>,
                      ];
                    })}
                    <th className="sticky top-0 z-40 min-w-[140px] border-l border-slate-700 bg-blue-200 px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-blue-900">
                      Tổng điểm
                    </th>
                    <th className="sticky top-0 z-40 min-w-[110px] border-l border-slate-700 bg-cyan-200 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-cyan-900">
                      Tỷ lệ đạt
                    </th>
                    <th className="sticky top-0 z-40 min-w-[220px] border-l border-slate-700 bg-slate-800 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-100">
                      Ghi chú
                    </th>
                  </tr>
                </thead>

                <tbody>
                {sortedDisplayRows.map((row, index) => {
                  const stickyBgClass = index % 2 === 0 ? 'bg-white' : 'bg-slate-50';
                  return (
                    <tr
                      key={row.id}
                      className={
                        index % 2 === 0
                          ? 'bg-white transition-colors hover:bg-blue-50'
                          : 'bg-slate-50 transition-colors hover:bg-blue-50'
                      }
                    >
                      <td
                        className={`sticky z-30 border-r border-slate-200 px-3 py-3 text-center font-medium text-slate-500 shadow-[1px_0_0_0_rgba(148,163,184,0.35)] ${stickyBgClass}`}
                        style={{ left: 0, width: 70, minWidth: 70 }}
                      >
                        {index + 1}
                      </td>
                      <td
                        className={`sticky z-30 border-r border-slate-200 px-4 py-3 font-medium text-slate-900 shadow-[1px_0_0_0_rgba(148,163,184,0.35)] ${stickyBgClass}`}
                        style={{ left: 70, width: 220, minWidth: 220 }}
                      >
                        {row.middleName || '--'}
                      </td>
                      <td
                        className={`sticky z-30 border-r border-slate-200 px-4 py-3 font-semibold text-slate-900 shadow-[1px_0_0_0_rgba(148,163,184,0.35)] ${stickyBgClass}`}
                        style={{ left: 290, width: 120, minWidth: 120 }}
                      >
                        {row.firstName || '--'}
                      </td>

                      {displayedAssignments.map((assignment) => {
                        const assignmentErrors = row.errorsByAssignment[assignment.id] || [];
                        const score = row.calculatedScores[assignment.id] || 0;
                        const maxScore = assignment.maxScore || 0;
                        const mode = columnDisplayByAssignmentId[assignment.id] ?? 'full';
                        const isCompact = mode === 'compact';

                        return (
                          <td
                            key={`${row.id}-${assignment.id}`}
                            className={`${isCompact ? 'w-[92px] min-w-[92px]' : ''} border-r border-slate-100 px-3 py-3 text-center align-top`}
                          >
                            <div
                              className={`mx-auto inline-flex min-w-[62px] items-center justify-center rounded-full border px-2.5 py-1 text-xs font-bold ${getScorePillClass(score, maxScore)}`}
                            >
                              {formatScore(score)}
                            </div>
                            {assignmentErrors.length > 0 && !isCompact && (
                              <details className="mt-1 text-left text-xs text-amber-800">
                                <summary className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 hover:bg-amber-100">
                                  {assignmentErrors.length} lỗi
                                </summary>
                                <ul className="mt-1 max-h-24 list-inside list-disc overflow-auto rounded border border-amber-200 bg-amber-50 p-2 text-[11px]">
                                  {assignmentErrors.map((errorItem, errorIdx) => (
                                    <li key={`${row.id}-${assignment.id}-${errorIdx}`}>{errorItem}</li>
                                  ))}
                                </ul>
                              </details>
                            )}
                            {assignmentErrors.length > 0 && isCompact && (
                              <div
                                className="mt-1 inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                                title={assignmentErrors.join(' | ')}
                              >
                                {assignmentErrors.length} lỗi
                              </div>
                            )}
                          </td>
                        );
                      })}

                      {isClassificationColumnVisible && (
                        <td className="border-r border-slate-300 px-3 py-3 text-center">
                          <div className="inline-flex flex-col items-center gap-1">
                            <select
                              value={row.classification}
                              disabled={savingClassificationStudentId === row.id}
                              onChange={(event) =>
                                void handleClassificationChange(
                                  row.id,
                                  event.target.value as CompetencyLevel
                                )
                              }
                              className={`h-8 min-w-[86px] rounded-full border px-3 text-center text-xs font-bold outline-none ${
                                row.classification
                                  ? classificationClassMap[row.classification]
                                  : 'border-slate-300 bg-white text-slate-600'
                              } ${
                                savingClassificationStudentId === row.id
                                  ? 'cursor-not-allowed opacity-70'
                                  : 'hover:brightness-95'
                              }`}
                              title="Chỉnh sửa xếp loại học sinh"
                            >
                              <option value="">--</option>
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                            </select>
                            {savingClassificationStudentId === row.id && (
                              <span className="text-[11px] text-slate-500">Đang lưu...</span>
                            )}
                          </div>
                        </td>
                      )}

                      {PRACTICE_COLUMNS.flatMap((practice) => {
                        const theme = PRACTICE_COLUMN_THEME[practice.code];
                        return [
                          <td
                            key={`${row.id}-${practice.code}-completion`}
                            className={`border-l border-slate-300 px-4 py-3 text-center font-semibold ${theme.completionCell}`}
                            title={`${practice.title}: ${formatScore(row.practiceSummaries[practice.code].totalScore)}/${PRACTICE_MAX_SCORE} điểm`}
                          >
                            {row.practiceSummaries[practice.code].completionText}
                          </td>,
                          <td
                            key={`${row.id}-${practice.code}-total-score`}
                            className={`border-r border-slate-300 px-4 py-3 text-right font-semibold ${theme.scoreCell}`}
                            title={`${practice.title}: tổng điểm chuẩn hóa theo thang ${PRACTICE_MAX_SCORE}`}
                          >
                            {formatScore(row.practiceSummaries[practice.code].totalScore)}/
                            {formatScore(PRACTICE_MAX_SCORE)}
                          </td>,
                        ];
                      })}

                      <td className="border-l border-slate-300 bg-blue-50 px-4 py-3 text-right">
                        <span className="inline-flex rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
                          {formatScore(row.totalScore)}/{formatScore(maxScoreTotal)}
                        </span>
                      </td>

                      <td className="border-l border-slate-300 bg-cyan-50 px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getPercentagePillClass(
                            row.totalPercentage
                          )}`}
                        >
                          {formatScore(row.totalPercentage)}%
                        </span>
                      </td>

                      <td className="border-l border-slate-300 px-4 py-3 text-left text-slate-600">
                        <div className="max-w-[260px] space-y-1">
                          <textarea
                            value={row.notes}
                            onChange={(event) => handleNotesChange(row.id, event.target.value)}
                            onBlur={() => void handleNotesBlur(row.id)}
                            rows={2}
                            maxLength={500}
                            placeholder="Nhập ghi chú..."
                            disabled={savingNotesStudentId === row.id}
                            className={`w-full resize-y rounded-md border px-2 py-1 text-xs text-slate-700 outline-none transition ${
                              savingNotesStudentId === row.id
                                ? 'cursor-not-allowed border-slate-200 bg-slate-100'
                                : 'border-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-200'
                            }`}
                          />
                          {savingNotesStudentId === row.id && (
                            <span className="text-[11px] text-slate-500">Đang lưu...</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {sortedDisplayRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={displayedAssignments.length + staticColumnCount}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Chưa có dữ liệu điểm để hiển thị.
                    </td>
                  </tr>
                )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 p-5 sm:flex-row">
          <button
            onClick={handleExportExcel}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 sm:w-auto"
          >
            <FileDown size={18} /> Xuất Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 sm:w-auto"
          >
            <FileDown size={18} /> Xuất PDF
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-slate-200 px-4 py-2 text-slate-800 hover:bg-slate-300 sm:w-auto"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewAllScoresModal;
