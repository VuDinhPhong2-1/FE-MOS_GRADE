import { useEffect, useMemo, useState } from 'react';
import type { FC } from 'react';
import { X, FileDown, Eye, EyeOff } from 'lucide-react';
import type { Assignment } from '../types/assignment.types';
import type { Student } from '../types/student.types';
import { exportToExcel, exportToPdf } from '../utils/exportUtils';
import type { ExcelCellComment } from '../utils/exportUtils';
import { useAuth } from '../context/AuthContext';
import studentService from '../services/student.service';
import { notify, type NotifyIssue } from '../utils/notify';
import { extractGradingGuideSection, stripGradingGuideSection } from '../utils/gradingText';
import {
  getNotifyIssuesFromTaskResults,
  normalizeIssueText,
  toIssueDedupKey,
} from '../utils/gradingIssues';
import type { AutoGradingTaskResultRequest } from '../types/score.types';

type CompetencyLevel = '' | 'A' | 'B' | 'C' | 'D';
type AssignmentColumnDisplayMode = 'full' | 'hidden';
type ScoreTableSortKey = 'none' | 'name' | 'classification' | 'totalScore';
type ScoreTableSortDirection = 'asc' | 'desc';
type PracticeCode = 'practice01' | 'practice02' | 'practice03' | 'exam_review';
type SummaryColumnKind = 'completion' | 'score';

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
  issuesByAssignment: Record<string, NotifyIssue[]>;
  totalScore: number;
  otthPercentage: number;
  examReviewPercentage: number;
  classification: CompetencyLevel;
  practiceSummaries: Record<PracticeCode, PracticeSummary>;
}

interface ViewAllScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignments: Assignment[];
  students: Student[];
  classDisplayName?: string;
  displayMode?: 'modal' | 'page';
  title?: string;
  onStudentClassificationUpdated?: (studentId: string, classification: CompetencyLevel) => void;
  onStudentNotesUpdated?: (studentId: string, notes: string) => void;
  scores: {
    studentId: string;
    assignmentId: string;
    assignmentName?: string;
    scoreValue: number | null;
    autoGradingErrors?: string[];
    autoGradingTaskResults?: AutoGradingTaskResultRequest[];
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

const normalizeClassification = (value?: string): CompetencyLevel => {
  const normalized = (value || '').trim().toUpperCase();
  return normalized === 'A' || normalized === 'B' || normalized === 'C' || normalized === 'D'
    ? normalized
    : '';
};

const isStudentTakingExam = (student?: Student): boolean =>
  Boolean(student?.takesExam ?? student?.thi);

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
const EXAM_REVIEW_PROJECT_NUMBERS = [2, 4, 5, 6, 8, 9, 10, 12, 14, 16, 18, 20, 22];
const PRACTICE_COMPLETION_TARGETS: Record<PracticeCode, number> = {
  practice01: 8,
  practice02: 8,
  practice03: 8,
  exam_review: EXAM_REVIEW_PROJECT_NUMBERS.length,
};
const PRACTICE_COLUMNS: Array<{ code: PracticeCode; shortLabel: string; title: string }> = [
  { code: 'practice01', shortLabel: 'P01', title: 'Practice 01' },
  { code: 'practice02', shortLabel: 'P02', title: 'Practice 02' },
  { code: 'practice03', shortLabel: 'P03', title: 'Practice 03' },
  { code: 'exam_review', shortLabel: 'Ôn thi', title: 'Bài ôn thi' },
];

const getPracticeCompletionHeaderLabel = (
  practice: Pick<(typeof PRACTICE_COLUMNS)[number], 'code' | 'shortLabel'>
): string => (practice.code === 'exam_review' ? 'Ôn thi số bài' : `${practice.shortLabel} số bài`);

const getPracticeScoreHeaderLabel = (
  practice: Pick<(typeof PRACTICE_COLUMNS)[number], 'code' | 'shortLabel'>
): string => (practice.code === 'exam_review' ? 'Tổng điểm ôn thi' : `${practice.shortLabel} tổng điểm`);

const getPracticeExcelScoreHeaderLabel = (
  practice: Pick<(typeof PRACTICE_COLUMNS)[number], 'code' | 'title'>
): string => (practice.code === 'exam_review' ? 'Tổng điểm ôn thi' : `${practice.title} - Tổng điểm`);

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
  exam_review: {
    completionHeader: 'bg-amber-100 text-amber-900',
    completionCell: 'bg-amber-50 text-amber-900',
    scoreHeader: 'bg-amber-200 text-amber-900',
    scoreCell: 'bg-amber-100/70 text-amber-900',
  },
};

const getSummaryColumnKey = (practiceCode: PracticeCode, kind: SummaryColumnKind): string =>
  `${practiceCode}:${kind}`;

const normalizeVietnameseText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const isExamReviewAssignment = (
  assignment: Pick<Assignment, 'name' | 'description' | 'gradingApiEndpoint'>
): boolean => {
  const candidates = [
    assignment.name || '',
    assignment.description || '',
    assignment.gradingApiEndpoint || '',
  ].map(normalizeVietnameseText);

  return candidates.some(
    (text) =>
      text.includes('on thi')
      || text.includes('exam review')
      || text.includes('exam_review')
      || text.includes('review exam')
  );
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

const resolvePracticeByProjectNumber = (
  projectNumber: number
): Exclude<PracticeCode, 'exam_review'> | null => {
  if (projectNumber >= 1 && projectNumber <= 8) return 'practice01';
  if (projectNumber >= 9 && projectNumber <= 16) return 'practice02';
  if (projectNumber >= 17 && projectNumber <= 24) return 'practice03';
  return null;
};

const resolveAssignmentPracticeCode = (
  assignment: Pick<Assignment, 'name' | 'description' | 'gradingApiEndpoint'>
): PracticeCode | null => {
  if (isExamReviewAssignment(assignment)) {
    return 'exam_review';
  }

  const projectNumber = extractProjectNumberFromEndpoint(assignment.gradingApiEndpoint);
  if (!projectNumber) {
    return null;
  }

  return resolvePracticeByProjectNumber(projectNumber);
};

const ViewAllScoresModal: FC<ViewAllScoresModalProps> = ({
  isOpen,
  onClose,
  assignments,
  students,
  classDisplayName,
  displayMode = 'modal',
  title,
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
  const [summaryColumnDisplayByKey, setSummaryColumnDisplayByKey] = useState<
    Record<string, AssignmentColumnDisplayMode>
  >({});
  const [isTotalScoreColumnVisible, setIsTotalScoreColumnVisible] = useState(true);
  const [isOtthPercentageColumnVisible, setIsOtthPercentageColumnVisible] = useState(true);
  const [isClassificationColumnVisible, setIsClassificationColumnVisible] = useState(true);
  const [sortKey, setSortKey] = useState<ScoreTableSortKey>('name');
  const [sortDirection, setSortDirection] = useState<ScoreTableSortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showOnlyExamStudents, setShowOnlyExamStudents] = useState(false);

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
        next[assignment.id] = prev[assignment.id] === 'hidden' ? 'hidden' : 'full';
      });
      return next;
    });
  }, [isOpen, assignments]);

  useEffect(() => {
    if (!isOpen) return;
    setSummaryColumnDisplayByKey((prev) => {
      const next: Record<string, AssignmentColumnDisplayMode> = {};
      PRACTICE_COLUMNS.forEach((practice) => {
        const completionKey = getSummaryColumnKey(practice.code, 'completion');
        const scoreKey = getSummaryColumnKey(practice.code, 'score');
        next[completionKey] = prev[completionKey] === 'hidden' ? 'hidden' : 'full';
        next[scoreKey] = prev[scoreKey] === 'hidden' ? 'hidden' : 'full';
      });
      return next;
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setSortKey('name');
    setSortDirection('asc');
    setSearchTerm('');
    setShowOnlyExamStudents(false);
    setIsTotalScoreColumnVisible(true);
    setIsOtthPercentageColumnVisible(true);
  }, [isOpen]);

  const maxScoreTotal = useMemo(
    () =>
      assignments.reduce((sum, assignment) => {
        const practiceCode = resolveAssignmentPracticeCode(assignment);
        if (!practiceCode || practiceCode === 'exam_review') {
          return sum;
        }
        return sum + (assignment.maxScore || 0);
      }, 0),
    [assignments]
  );

  const examReviewMaxScore = useMemo(() => {
    const maxScoreByReviewKey = new Map<string, number>();

    assignments.forEach((assignment) => {
      if (resolveAssignmentPracticeCode(assignment) !== 'exam_review') {
        return;
      }

      const projectNumber = extractProjectNumberFromEndpoint(assignment.gradingApiEndpoint);
      const reviewKey = projectNumber ? `project-${projectNumber}` : `assignment-${assignment.id}`;
      const currentMax = maxScoreByReviewKey.get(reviewKey) ?? 0;
      const assignmentMaxScore = assignment.maxScore || 0;
      maxScoreByReviewKey.set(reviewKey, Math.max(currentMax, assignmentMaxScore));
    });

    return Array.from(maxScoreByReviewKey.values()).reduce((sum, value) => sum + value, 0);
  }, [assignments]);

  const practiceMaxScoreByCode = useMemo<Record<PracticeCode, number>>(
    () => ({
      practice01: PRACTICE_MAX_SCORE,
      practice02: PRACTICE_MAX_SCORE,
      practice03: PRACTICE_MAX_SCORE,
      exam_review: examReviewMaxScore,
    }),
    [examReviewMaxScore]
  );

  const studentsById = useMemo(() => {
    const map = new Map<string, Student>();
    students.forEach((student) => map.set(student.id, student));
    return map;
  }, [students]);

  const filteredStudentCount = useMemo(
    () => students.filter((student) => !showOnlyExamStudents || isStudentTakingExam(student)).length,
    [students, showOnlyExamStudents]
  );

  const scoreLookup = useMemo(() => {
    const map = new Map<string, {
      scoreValue: number | null;
      autoGradingErrors?: string[];
      autoGradingTaskResults?: AutoGradingTaskResultRequest[];
    }>();
    scores.forEach((score) => {
      map.set(`${score.studentId}::${score.assignmentId}`, {
        scoreValue: score.scoreValue,
        autoGradingErrors: score.autoGradingErrors || [],
        autoGradingTaskResults: score.autoGradingTaskResults || [],
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

  const assignmentIdsByPractice = useMemo(() => {
    const next: Record<PracticeCode, string[]> = {
      practice01: [],
      practice02: [],
      practice03: [],
      exam_review: [],
    };

    assignments.forEach((assignment) => {
      const practiceCode = resolveAssignmentPracticeCode(assignment);
      if (!practiceCode) return;
      next[practiceCode].push(assignment.id);
    });

    return next;
  }, [assignments]);

  const visibleSummaryColumnCount = useMemo(
    () =>
      PRACTICE_COLUMNS.reduce((count, practice) => {
        const completionVisible =
          (summaryColumnDisplayByKey[getSummaryColumnKey(practice.code, 'completion')] ?? 'full') ===
          'full';
        const scoreVisible =
          (summaryColumnDisplayByKey[getSummaryColumnKey(practice.code, 'score')] ?? 'full') ===
          'full';
        return count + (completionVisible ? 1 : 0) + (scoreVisible ? 1 : 0);
      }, 0),
    [summaryColumnDisplayByKey]
  );

  const staticColumnCount =
    3
    + (isClassificationColumnVisible ? 1 : 0)
    + visibleSummaryColumnCount
    + (isTotalScoreColumnVisible ? 1 : 0)
    + (isOtthPercentageColumnVisible ? 1 : 0)
    + 1
    + 1;

  const practiceGroupVisibility = useMemo(() => {
    return PRACTICE_COLUMNS.reduce(
      (acc, practice) => {
        const assignmentIds = assignmentIdsByPractice[practice.code];
        const visibleAssignmentCount = assignmentIds.filter(
          (assignmentId) => (columnDisplayByAssignmentId[assignmentId] ?? 'full') === 'full'
        ).length;
        const completionVisible =
          (summaryColumnDisplayByKey[getSummaryColumnKey(practice.code, 'completion')] ?? 'full') ===
          'full';
        const scoreVisible =
          (summaryColumnDisplayByKey[getSummaryColumnKey(practice.code, 'score')] ?? 'full') === 'full';

        acc[practice.code] = {
          totalAssignments: assignmentIds.length,
          visibleAssignments: visibleAssignmentCount,
          summaryVisible: completionVisible && scoreVisible,
          isVisible: visibleAssignmentCount > 0 || completionVisible || scoreVisible,
        };

        return acc;
      },
      {} as Record<
        PracticeCode,
        {
          totalAssignments: number;
          visibleAssignments: number;
          summaryVisible: boolean;
          isVisible: boolean;
        }
      >
    );
  }, [assignmentIdsByPractice, columnDisplayByAssignmentId, summaryColumnDisplayByKey]);

  const areAllPracticeGroupsVisible = useMemo(
    () => PRACTICE_COLUMNS.every((practice) => practiceGroupVisibility[practice.code].isVisible),
    [practiceGroupVisibility]
  );

  const areAllPracticeGroupsHidden = useMemo(
    () => PRACTICE_COLUMNS.every((practice) => !practiceGroupVisibility[practice.code].isVisible),
    [practiceGroupVisibility]
  );

  const displayRows = useMemo<DisplayStudentRow[]>(() => {
    if (!isOpen) return [];

    return students.map((student) => {
      const middleName = (student.middleName || '').trim();
      const firstName = (student.firstName || '').trim();
      const notesMapValue = notesByStudentId[student.id];
      const notes = notesMapValue !== undefined ? notesMapValue : (student.notes || '').trim();

      let totalScore = 0;
      const practiceProjectScores: Record<PracticeCode, Map<string, { hasScore: boolean; score: number }>> = {
        practice01: new Map(),
        practice02: new Map(),
        practice03: new Map(),
        exam_review: new Map(),
      };
      const calculatedScores: Record<string, number> = {};
      const errorsByAssignment: Record<string, string[]> = {};
      const issuesByAssignment: Record<string, NotifyIssue[]> = {};

      assignments.forEach((assignment) => {
        const key = `${student.id}::${assignment.id}`;
        const scoreObj = scoreLookup.get(key);
        const score = typeof scoreObj?.scoreValue === 'number' ? scoreObj.scoreValue : 0;
        calculatedScores[assignment.id] = score;
        const assignmentPracticeCode = resolveAssignmentPracticeCode(assignment);
        if (assignmentPracticeCode && assignmentPracticeCode !== 'exam_review') {
          totalScore += score;
        }

        const projectNumber = extractProjectNumberFromEndpoint(assignment.gradingApiEndpoint);
        const isExamReview = assignmentPracticeCode === 'exam_review';

        if (isExamReview) {
          const reviewKey = projectNumber
            ? `project-${projectNumber}`
            : `assignment-${assignment.id}`;
          const current = practiceProjectScores.exam_review.get(reviewKey) ?? {
            hasScore: false,
            score: 0,
          };

          if (typeof scoreObj?.scoreValue === 'number') {
            current.hasScore = true;
            current.score = Math.max(current.score, scoreObj.scoreValue);
          }

          practiceProjectScores.exam_review.set(reviewKey, current);
        } else {
          const practiceCode = projectNumber ? resolvePracticeByProjectNumber(projectNumber) : null;
          if (projectNumber && practiceCode) {
            const practiceKey = `project-${projectNumber}`;
            const current = practiceProjectScores[practiceCode].get(practiceKey) ?? {
              hasScore: false,
              score: 0,
            };

            if (typeof scoreObj?.scoreValue === 'number') {
              current.hasScore = true;
              current.score = Math.max(current.score, scoreObj.scoreValue);
            }

            practiceProjectScores[practiceCode].set(practiceKey, current);
          }
        }

        const assignmentErrors: string[] = [];
        const seenErrors = new Set<string>();
        const taskResultIssues = getNotifyIssuesFromTaskResults(scoreObj?.autoGradingTaskResults);
        const legacyIssues: NotifyIssue[] = [];

        (scoreObj?.autoGradingErrors || []).forEach((rawError) => {
          const errorText = normalizeIssueText(stripGradingGuideSection(rawError || ''));
          if (!errorText) return;
          const dedupKey = toIssueDedupKey(errorText);
          if (seenErrors.has(dedupKey)) return;
          seenErrors.add(dedupKey);
          assignmentErrors.push(errorText);
          legacyIssues.push({
            error: errorText,
            fixAction: extractGradingGuideSection(rawError || '') || undefined,
          });
        });

        taskResultIssues.forEach((issue) => {
          const errorText = normalizeIssueText(stripGradingGuideSection(issue.error || ''));
          if (!errorText) return;
          const dedupKey = toIssueDedupKey(errorText);
          if (seenErrors.has(dedupKey)) return;
          seenErrors.add(dedupKey);
          assignmentErrors.push(errorText);
        });

        const assignmentIssues = taskResultIssues.length > 0 ? taskResultIssues : legacyIssues;

        errorsByAssignment[assignment.id] = assignmentErrors;
        issuesByAssignment[assignment.id] = assignmentIssues;
      });

      const mapValue = classificationByStudentId[student.id];
      const classification =
        mapValue !== undefined ? mapValue : normalizeClassification(student.competencyLevel);
      const practiceSummaries = PRACTICE_COLUMNS.reduce(
        (acc, practice) => {
          const items = Array.from(practiceProjectScores[practice.code].values());
          const completionTarget = PRACTICE_COMPLETION_TARGETS[practice.code] || 0;
          const completed = Math.min(
            completionTarget,
            items.filter((item) => item.hasScore).length
          );
          const totalPracticeScore = items.reduce(
            (sum, item) => sum + (item.hasScore ? item.score : 0),
            0
          );
          const practiceMaxScore = practiceMaxScoreByCode[practice.code] || 0;
          const normalizedPracticeScore =
            practiceMaxScore > 0
              ? Math.max(0, Math.min(practiceMaxScore, totalPracticeScore))
              : Math.max(0, totalPracticeScore);

          acc[practice.code] = {
            completionText: `${completed}/${completionTarget}`,
            totalScore: normalizedPracticeScore,
          };

          return acc;
        },
        {} as Record<PracticeCode, PracticeSummary>
      );
      const otthPercentage =
        maxScoreTotal > 0 ? Math.round((totalScore / maxScoreTotal) * 10000) / 100 : 0;
      const examReviewScore = practiceSummaries.exam_review.totalScore;
      const examReviewPercentage =
        examReviewMaxScore > 0
          ? Math.round((examReviewScore / examReviewMaxScore) * 10000) / 100
          : 0;

      return {
        id: student.id,
        middleName,
        firstName,
        notes,
        calculatedScores,
        errorsByAssignment,
        issuesByAssignment,
        totalScore,
        otthPercentage,
        examReviewPercentage,
        classification,
        practiceSummaries,
      };
    });
  }, [
    isOpen,
    students,
    assignments,
    scoreLookup,
    classificationByStudentId,
    notesByStudentId,
    maxScoreTotal,
    practiceMaxScoreByCode,
    examReviewMaxScore,
  ]);

  const sortedDisplayRows = useMemo<DisplayStudentRow[]>(() => {
    // First, filter rows by search term
    const filteredRows = displayRows.filter((row) => {
      const sourceStudent = studentsById.get(row.id);
      if (showOnlyExamStudents && !isStudentTakingExam(sourceStudent)) {
        return false;
      }
      if (!searchTerm.trim()) {
        return true;
      }
      const searchLower = searchTerm.toLowerCase().trim();
      const firstName = (row.firstName || '').toLowerCase();
      const middleName = (row.middleName || '').toLowerCase();
      const fullName = `${middleName} ${firstName}`.toLowerCase();
      
      return firstName.includes(searchLower) || middleName.includes(searchLower) || fullName.includes(searchLower);
    });

    if (sortKey === 'none') {
      return filteredRows;
    }

    const rows = [...filteredRows];
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

      if (sortKey === 'totalScore') {
        const byTotalScore = left.totalScore - right.totalScore;
        if (byTotalScore !== 0) {
          return sortDirection === 'asc' ? byTotalScore : -byTotalScore;
        }
        // If total scores are equal, sort by name
        const byFirstName = vietnameseCollator.compare(leftFirstName, rightFirstName);
        if (byFirstName !== 0) {
          return byFirstName;
        }
        return vietnameseCollator.compare(leftMiddleName, rightMiddleName);
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
  }, [displayRows, sortKey, sortDirection, searchTerm, showOnlyExamStudents, studentsById]);

  const excelHeaders = useMemo(
    () => [
      'STT',
      'Họ và tên đệm',
      'Tên',
      ...assignments.map((assignment) => `${assignment.name} (tối đa ${assignment.maxScore})`),
      'Xếp loại',
      ...PRACTICE_COLUMNS.flatMap((practice) => [
        `${practice.title} - Số bài`,
        getPracticeExcelScoreHeaderLabel(practice),
      ]),
      'Tổng điểm 3 Practice',
      'Tỷ lệ đạt OTTH',
      'Tỷ lệ đạt ôn thi',
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
            practiceMaxScoreByCode[practice.code] || 0
          )}`,
        ]),
        `${formatScore(row.totalScore)}/${formatScore(maxScoreTotal)}`,
        `${formatScore(row.otthPercentage)}%`,
        `${formatScore(row.examReviewPercentage)}%`,
        row.notes,
      ]),
    [sortedDisplayRows, assignments, maxScoreTotal, practiceMaxScoreByCode]
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
  const headerTitle = (title || '').trim() || `Bảng điểm lớp ${titleClassName}`;
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

  const setPracticeGroupDisplayMode = (practiceCode: PracticeCode, mode: AssignmentColumnDisplayMode) => {
    const assignmentIds = assignmentIdsByPractice[practiceCode];
    const completionKey = getSummaryColumnKey(practiceCode, 'completion');
    const scoreKey = getSummaryColumnKey(practiceCode, 'score');

    setColumnDisplayByAssignmentId((prev) => {
      const next = { ...prev };
      assignmentIds.forEach((assignmentId) => {
        next[assignmentId] = mode;
      });
      return next;
    });

    setSummaryColumnDisplayByKey((prev) => ({
      ...prev,
      [completionKey]: mode,
      [scoreKey]: mode,
    }));
  };

  const handleTogglePracticeGroupDisplay = (practiceCode: PracticeCode) => {
    const nextMode = practiceGroupVisibility[practiceCode].isVisible ? 'hidden' : 'full';
    setPracticeGroupDisplayMode(practiceCode, nextMode);
  };

  const handleApplyPracticeGroupDisplayForAll = (mode: AssignmentColumnDisplayMode) => {
    PRACTICE_COLUMNS.forEach((practice) => {
      setPracticeGroupDisplayMode(practice.code, mode);
    });
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
  const isPageMode = displayMode === 'page';
  const totalScoreColumnCount = assignments.length + PRACTICE_COLUMNS.length * 2 + 2;
  const visibleScoreColumnCount =
    displayedAssignments.length
    + visibleSummaryColumnCount
    + (isTotalScoreColumnVisible ? 1 : 0)
    + (isOtthPercentageColumnVisible ? 1 : 0);
  const containerClassName = isPageMode
    ? 'flex w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'
    : 'flex h-[96vh] w-[calc(100vw-0.5rem)] max-w-[1920px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:h-[94vh] sm:w-[calc(100vw-1.5rem)] sm:rounded-2xl';
  const content = (
      <div className={containerClassName}>
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 font-bold text-white">
              BD
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">{headerTitle}</h2>
              <p className="text-sm text-slate-500">
                {sortedDisplayRows.length}
                {(searchTerm || showOnlyExamStudents) ? `/${filteredStudentCount}` : ''}
                {' '}học sinh hiển thị, tổng lớp {students.length}, {assignments.length} bài tập, hiện {visibleScoreColumnCount}/
                {totalScoreColumnCount} cột điểm
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-2 pb-3 pt-3 sm:px-4 sm:pb-4 sm:pt-4 lg:px-5">
          <div className="mb-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-700">Tùy chỉnh cột điểm</div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm">
                  <button
                    type="button"
                    onClick={() => handleApplyPracticeGroupDisplayForAll('full')}
                    className={`px-3 py-1.5 text-xs font-semibold transition ${
                      areAllPracticeGroupsVisible
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Hiện 4 phần chính
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPracticeGroupDisplayForAll('hidden')}
                    className={`border-l border-slate-200 px-3 py-1.5 text-xs font-semibold transition ${
                      areAllPracticeGroupsHidden
                        ? 'bg-rose-600 text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Ẩn 4 phần chính
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

                <button
                  type="button"
                  onClick={() => setIsTotalScoreColumnVisible((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition ${
                    isTotalScoreColumnVisible
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                  }`}
                >
                  {isTotalScoreColumnVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  {isTotalScoreColumnVisible ? 'Ẩn cột tổng điểm 3 Practice' : 'Hiện cột tổng điểm 3 Practice'}
                </button>

                <button
                  type="button"
                  onClick={() => setIsOtthPercentageColumnVisible((prev) => !prev)}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition ${
                    isOtthPercentageColumnVisible
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                  }`}
                >
                  {isOtthPercentageColumnVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  {isOtthPercentageColumnVisible ? 'Ẩn cột tỷ lệ đạt OTTH' : 'Hiện cột tỷ lệ đạt OTTH'}
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
                    <option value="totalScore">Theo tổng điểm</option>
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

            <div className="mb-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] max-w-[400px]">
                <input
                  type="text"
                  placeholder="Tìm kiếm tên học sinh..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <label className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={showOnlyExamStudents}
                  onChange={(event) => setShowOnlyExamStudents(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Chỉ học sinh đi thi
              </label>
              <div className="text-sm text-slate-600">
                Kết quả: <span className="font-semibold text-slate-800">{sortedDisplayRows.length}/{filteredStudentCount}</span>
              </div>
              {(searchTerm || showOnlyExamStudents) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setShowOnlyExamStudents(false);
                  }}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {PRACTICE_COLUMNS.map((practice) => {
                const visibility = practiceGroupVisibility[practice.code];
                const isVisible = visibility.isVisible;

                return (
                  <div
                    key={`practice-group-${practice.code}`}
                    className="rounded-lg border border-slate-200 bg-white p-2 text-xs text-slate-700"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-800">{practice.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {visibility.visibleAssignments}/{visibility.totalAssignments} bài tập, cột tổng hợp{' '}
                          {visibility.summaryVisible ? 'đang hiện' : 'đang ẩn'}.
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTogglePracticeGroupDisplay(practice.code)}
                        className={`inline-flex min-w-[64px] items-center justify-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold transition ${
                          isVisible
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                        {isVisible ? 'Ẩn' : 'Hiện'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div id="score-table" className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-lg shadow-slate-900/5">
            <div className="flex items-center justify-between border-b border-slate-700 bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-2.5 text-sm font-semibold text-white">
              <span>Bảng điểm lớp {titleClassName}</span>
              <span className="text-xs font-medium text-slate-200">Nhấn badge lỗi để xem chi tiết</span>
            </div>
            <div className="min-h-[18rem] max-h-[calc(100vh-20rem)] overflow-auto">
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
                      return (
                        <th
                          key={assignment.id}
                          className="sticky top-0 z-40 min-w-[140px] border-r border-slate-700 bg-slate-800 px-3 py-3 text-center text-xs font-bold text-slate-100"
                        >
                          <div title={assignment.name}>{assignment.name}</div>
                          <div className="text-[11px] font-normal text-slate-300">(tối đa {assignment.maxScore})</div>
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
                      const completionVisible =
                        (summaryColumnDisplayByKey[getSummaryColumnKey(practice.code, 'completion')] ??
                          'full') === 'full';
                      const scoreVisible =
                        (summaryColumnDisplayByKey[getSummaryColumnKey(practice.code, 'score')] ?? 'full') ===
                        'full';
                      return [
                        completionVisible ? (
                        <th
                            key={`${practice.code}-completion-sub`}
                            className={`sticky top-0 z-40 min-w-[112px] border-l border-slate-700 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide ${theme.completionHeader}`}
                          >
                            {getPracticeCompletionHeaderLabel(practice)}
                          </th>
                        ) : null,
                        scoreVisible ? (
                          <th
                            key={`${practice.code}-score-sub`}
                            className={`sticky top-0 z-40 min-w-[132px] border-r border-slate-700 px-3 py-3 text-right text-xs font-bold uppercase tracking-wide ${theme.scoreHeader}`}
                          >
                            {getPracticeScoreHeaderLabel(practice)}
                          </th>
                        ) : null,
                      ];
                    })}
                    {isTotalScoreColumnVisible && (
                      <th className="sticky top-0 z-40 min-w-[140px] border-l border-slate-700 bg-blue-200 px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-blue-900">
                        Tổng điểm 3 Practice
                      </th>
                    )}
                    {isOtthPercentageColumnVisible && (
                      <th className="sticky top-0 z-40 min-w-[130px] border-l border-slate-700 bg-cyan-200 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-cyan-900">
                        Tỷ lệ đạt OTTH
                      </th>
                    )}
                    <th className="sticky top-0 z-40 min-w-[130px] border-l border-slate-700 bg-emerald-200 px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-emerald-900">
                      Tỷ lệ đạt ôn thi
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
                        const assignmentIssues = row.issuesByAssignment[assignment.id] || [];
                        const score = row.calculatedScores[assignment.id] || 0;
                        const maxScore = assignment.maxScore || 0;

                        return (
                          <td
                            key={`${row.id}-${assignment.id}`}
                            className="border-r border-slate-100 px-3 py-3 text-center align-top"
                          >
                            <div
                              className={`mx-auto inline-flex min-w-[62px] items-center justify-center rounded-full border px-2.5 py-1 text-xs font-bold ${getScorePillClass(score, maxScore)}`}
                            >
                              {formatScore(score)}
                            </div>
                            {assignmentErrors.length > 0 && (
                              <details className="mt-1 text-left text-xs text-amber-800">
                                <summary
                                  className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-semibold text-amber-700 hover:bg-amber-100"
                                  onClick={() => {
                                    try {
                                      const safeErrors = (assignmentErrors || []).map((s) => (s || '').trim()).filter(Boolean);
                                      const issues: NotifyIssue[] = assignmentIssues.length > 0
                                        ? assignmentIssues
                                        : safeErrors.map((err) => ({ error: err }));
                                      const messagePart = issues.length > 0 ? issues.map((issue) => issue.error).join('\n\n') : safeErrors.join('\n\n');

                                      notify.custom({
                                        message: messagePart || 'Lỗi chấm tự động',
                                        type: 'error',
                                        issues,
                                        title: 'Lỗi chấm tự động',
                                      });
                                    } catch (e) {
                                      // ignore
                                    }
                                  }}
                                >
                                  {assignmentErrors.length} lỗi
                                </summary>
                                <ul className="mt-1 max-h-24 list-inside list-disc overflow-auto rounded border border-amber-200 bg-amber-50 p-2 text-[11px]">
                                  {assignmentErrors.map((errorItem, errorIdx) => (
                                    <li key={`${row.id}-${assignment.id}-${errorIdx}`}>{errorItem}</li>
                                  ))}
                                </ul>
                              </details>
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
                        const completionVisible =
                          (summaryColumnDisplayByKey[getSummaryColumnKey(practice.code, 'completion')] ??
                            'full') === 'full';
                        const scoreVisible =
                          (summaryColumnDisplayByKey[getSummaryColumnKey(practice.code, 'score')] ??
                            'full') === 'full';
                        return [
                          completionVisible ? (
                            <td
                              key={`${row.id}-${practice.code}-completion`}
                              className={`border-l border-slate-300 px-4 py-3 text-center font-semibold ${theme.completionCell}`}
                              title={`${practice.title}: ${formatScore(row.practiceSummaries[practice.code].totalScore)}/${formatScore(practiceMaxScoreByCode[practice.code] || 0)} điểm`}
                            >
                              {row.practiceSummaries[practice.code].completionText}
                            </td>
                          ) : null,
                          scoreVisible ? (
                            <td
                              key={`${row.id}-${practice.code}-total-score`}
                              className={`border-r border-slate-300 px-4 py-3 text-right font-semibold ${theme.scoreCell}`}
                              title={`${practice.title}: tổng điểm chuẩn hóa theo thang ${formatScore(practiceMaxScoreByCode[practice.code] || 0)}`}
                            >
                              {formatScore(row.practiceSummaries[practice.code].totalScore)}/
                              {formatScore(practiceMaxScoreByCode[practice.code] || 0)}
                            </td>
                          ) : null,
                        ];
                      })}

                      {isTotalScoreColumnVisible && (
                        <td className="border-l border-slate-300 bg-blue-50 px-4 py-3 text-right">
                          <span className="inline-flex rounded-full border border-blue-200 bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800">
                            {formatScore(row.totalScore)}/{formatScore(maxScoreTotal)}
                          </span>
                        </td>
                      )}

                      {isOtthPercentageColumnVisible && (
                        <td className="border-l border-slate-300 bg-cyan-50 px-4 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getPercentagePillClass(
                              row.otthPercentage
                            )}`}
                          >
                            {formatScore(row.otthPercentage)}%
                          </span>
                        </td>
                      )}

                      <td className="border-l border-slate-300 bg-emerald-50 px-4 py-3 text-center">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${getPercentagePillClass(
                            row.examReviewPercentage
                          )}`}
                        >
                          {formatScore(row.examReviewPercentage)}%
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

        <div className="flex flex-col items-center justify-end gap-2 border-t border-slate-200 bg-slate-50 p-3 sm:flex-row sm:p-4">
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
            {isPageMode ? 'Quay lại' : 'Đóng'}
          </button>
        </div>
      </div>
  );

  if (isPageMode) {
    return <div className="w-full">{content}</div>;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-1 sm:p-3 backdrop-blur-[1px]">
      {content}
    </div>
  );
};

export default ViewAllScoresModal;

