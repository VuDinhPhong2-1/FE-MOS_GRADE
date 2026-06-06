// src/components/GradingModal.optimized.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Plus, Save, Loader2, ArrowLeft, XCircle, CheckCircle, Upload, Search, Check, Pencil, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAuth } from '../context/AuthContext';
import type { Assignment, GradingEndpointInfo, UpdateAssignmentRequest } from '../types/assignment.types';
import type { Student } from '../types/student.types';
import type { GradingResult, StudentGradingState } from '../types/grading.types';
import type { AutoGradingTaskResultRequest, ScoreResponse } from '../types/score.types';
import { assignmentService } from '../services/assignment.service';
import { notify, type NotifyIssue } from '../utils/notify';
import { scoreService } from '../services/score.service';
import { gradingService } from '../services/grading.service';
import { stripGradingGuideSection } from '../utils/gradingText';
import { getNotifyIssuesFromTaskResults } from '../utils/gradingIssues';
import "./GradingModal.css";

interface GradingModalProps {
    isOpen: boolean;
    onClose: () => void;
    classId: string;
    students: Student[];
    onSuccess?: () => void | Promise<void>;
    displayMode?: 'modal' | 'page';
    title?: string;
}

interface MultiAutoCellState {
    studentFile: File | null;
    isGrading: boolean;
    error: string | null;
    gradingResult: GradingResult | null;
}

interface MultiScoreCellValue {
    scoreValue: number | null;
    feedback: string;
    autoGradingErrors: string[];
}

interface PersistedScoreSnapshot {
    scoreId: string;
    scoreValue: number | null;
    feedback: string;
    autoGradingErrors: string[];
}

interface SingleUndoSnapshot {
    previousState: {
        studentFile: File | null;
        isGrading: boolean;
        gradingResult: GradingResult | null;
        error: string | null;
        manualScore: number | null;
        manualComment: string;
        autoGradingErrors: string[];
    };
    previousPersistedScore: PersistedScoreSnapshot | null;
}

interface MultiUndoSnapshot {
    previousAutoState: MultiAutoCellState;
    previousScoreState: MultiScoreCellValue;
}

interface PendingManualMultiFileMatch {
    id: string;
    fileKey: string;
    studentId: string;
    file: File;
    reason: string;
    selectedAssignmentId: string;
    candidateAssignmentIds: string[];
}

interface BulkAssignmentDraft {
    endpoint: string;
    displayName: string;
    maxScore: number;
    name: string;
    selected: boolean;
}

const PRACTICE_OPTIONS = [
    { code: 'practice01', label: 'Practice 01' },
    { code: 'practice02', label: 'Practice 02' },
    { code: 'practice03', label: 'Practice 03' },
    { code: 'exam_review', label: 'Tạo bài ôn thi' },
] as const;

type PracticeCode = typeof PRACTICE_OPTIONS[number]['code'];
const SUBJECT_OPTIONS = [
    { code: 'excel', label: 'Excel' },
    { code: 'word', label: 'Word' },
] as const;
type SubjectCode = typeof SUBJECT_OPTIONS[number]['code'];
const QUICK_SELECT_PRACTICE_OPTIONS = [
    { code: 'practice01', label: 'Practice 01' },
    { code: 'practice02', label: 'Practice 02' },
    { code: 'practice03', label: 'Practice 03' },
    { code: 'exam_review', label: 'Ôn thi' },
] as const;

const EXAM_REVIEW_PROJECT_NUMBERS_EXCEL = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
const EXAM_REVIEW_PROJECT_NUMBERS_WORD  = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23];

const normalizeVietnameseText = (value?: string): string =>
    (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

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

const getAcceptedSubmissionFileTypes = (endpoint?: string): string => {
    const normalized = (endpoint || '').trim().replace(/\\/g, '/').toLowerCase();

    // If endpoint explicitly targets Word grading, prefer Word-only files.
    if (normalized.includes('word/')) {
        return normalized.includes('project07') ? '.docx,.txt' : '.docx';
    }

    // If endpoint explicitly targets Excel grading, prefer Excel files.
    if (normalized.includes('excel/')) {
        return '.xls,.xlsx,.xlsm';
    }

    // Fallback: allow Excel, Word and plain-text so users can still
    // choose .docx or .txt when the endpoint/assignment metadata is missing
    // or not normalized correctly. Server-side validation still enforces
    // accepted types.
    return '.xls,.xlsx,.xlsm,.docx,.txt';
};

const resolvePracticeCodeByProjectNumber = (projectNumber: number): Exclude<PracticeCode, 'exam_review'> | null => {
    if (projectNumber >= 1 && projectNumber <= 8) return 'practice01';
    if (projectNumber >= 9 && projectNumber <= 16) return 'practice02';
    if (projectNumber >= 17 && projectNumber <= 24) return 'practice03';
    return null;
};

const isExamReviewAssignment = (assignment: Pick<Assignment, 'name' | 'description' | 'gradingApiEndpoint'>): boolean => {
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

const resolveAssignmentPracticeCode = (
    assignment: Pick<Assignment, 'name' | 'description' | 'gradingApiEndpoint'>
): PracticeCode | null => {
    if (isExamReviewAssignment(assignment)) {
        return 'exam_review';
    }

    const projectNumber = extractProjectNumberFromEndpoint(assignment.gradingApiEndpoint);
    if (!projectNumber) return null;
    return resolvePracticeCodeByProjectNumber(projectNumber);
};

const extractProjectNumbersFromText = (value?: string): number[] => {
    const normalized = normalizeVietnameseText(value)
        .replace(/[_-]+/g, ' ')
        // Tach ranh gioi chu-so de bat duoc ten file bi dinh lien (vi du: 02Project09).
        .replace(/([0-9])([a-z])/g, '$1 $2')
        .replace(/([a-z])([0-9])/g, '$1 $2');
    if (!normalized) return [];

    const patterns = [
        /project\s*0*(\d{1,2})\b/g,
        /proj\s*0*(\d{1,2})\b/g,
        /pro\s*0*(\d{1,2})\b/g,
        /pr\s*0*(\d{1,2})\b/g,
        /bai\s*0*(\d{1,2})\b/g,
        /\bp\s*0*(\d{1,2})\b/g,
    ];

    const numbers = new Set<number>();
    patterns.forEach((pattern) => {
        let match: RegExpExecArray | null;
        while ((match = pattern.exec(normalized)) !== null) {
            const parsed = Number.parseInt(match[1], 10);
            if (!Number.isFinite(parsed) || parsed < 1 || parsed > 24) continue;
            numbers.add(parsed);
        }
    });

    return Array.from(numbers);
};

const rankProjectCandidates = (fromFileName: number[], fromWorkbookTitle: number[]): number[] => {
    const scoreMap = new Map<number, number>();
    Array.from(new Set(fromFileName)).forEach((projectNumber) => {
        scoreMap.set(projectNumber, (scoreMap.get(projectNumber) || 0) + 2);
    });
    Array.from(new Set(fromWorkbookTitle)).forEach((projectNumber) => {
        scoreMap.set(projectNumber, (scoreMap.get(projectNumber) || 0) + 1);
    });

    return Array.from(scoreMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([projectNumber]) => projectNumber);
};

const isWorkbookTitleReadable = (fileName: string): boolean => {
    const normalized = fileName.toLowerCase();
    return normalized.endsWith('.xlsx') || normalized.endsWith('.xlsm');
};

const readWorkbookTitle = async (file: File): Promise<string> => {
    if (!isWorkbookTitleReadable(file.name)) return '';

    try {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, {
            type: 'array',
            bookProps: true,
            bookSheets: true,
        });
        const title = workbook.Props?.Title;
        return typeof title === 'string' ? title.trim() : '';
    } catch {
        return '';
    }
};

const buildBulkAssignmentDrafts = (
    endpoints: GradingEndpointInfo[],
    previousDrafts: BulkAssignmentDraft[],
    practiceCode: PracticeCode
): BulkAssignmentDraft[] => {
    const previousMap = new Map(previousDrafts.map((draft) => [draft.endpoint, draft]));

    return endpoints.map((endpoint) => {
        const previous = previousMap.get(endpoint.endpoint);
        const previousName = (previous?.name || '').trim();
        const legacyExamReviewPrefixName = `Ôn thi - ${endpoint.displayName}`;
        const defaultName =
            practiceCode === 'exam_review'
                ? `${endpoint.displayName} - Ôn thi`
                : endpoint.displayName;
        const shouldUseDefaultExamReviewName =
            practiceCode === 'exam_review'
            && (
                previousName === ''
                || previousName === endpoint.displayName
                || previousName === legacyExamReviewPrefixName
                || previousName === `On thi - ${endpoint.displayName}`
                || previousName === `${endpoint.displayName} - On thi`
            );
        const nextName = previous
            ? (
                shouldUseDefaultExamReviewName
                    ? defaultName
                    : previous.name
            )
            : defaultName;
        return {
            endpoint: endpoint.endpoint,
            displayName: endpoint.displayName,
            maxScore: endpoint.maxScore,
            name: nextName,
            selected: previous ? previous.selected : true,
        };
    });
};

const resolveEndpointsBySubjectAndPractice = (
    allEndpoints: GradingEndpointInfo[],
    subjectCode: SubjectCode,
    practiceCode: PracticeCode
): GradingEndpointInfo[] => {
    const subjectEndpoints = allEndpoints.filter((endpoint) => {
        const endpointSubject = (endpoint.subject || 'excel').toLowerCase();
        if (subjectCode === 'excel') {
            return endpointSubject === 'excel' || !endpoint.subject;
        }

        return endpointSubject === subjectCode;
    });

    if (practiceCode === 'exam_review') {
        // Chọn danh sách project theo môn: Excel = chẵn, Word = lẻ
        const examReviewNumbers =
            subjectCode === 'word'
                ? EXAM_REVIEW_PROJECT_NUMBERS_WORD
                : EXAM_REVIEW_PROJECT_NUMBERS_EXCEL;

        return subjectEndpoints.filter((endpoint) => {
            const match = endpoint.endpoint.match(/project(\d{1,2})$/i);
            if (!match) return false;

            const projectNumber = Number.parseInt(match[1], 10);
            return examReviewNumbers.includes(projectNumber);
        });
    }

    return subjectEndpoints.filter(
        (endpoint) => (endpoint.practiceCode || '').toLowerCase() === practiceCode
    );
};


const GradingModal: React.FC<GradingModalProps> = ({
    isOpen,
    onClose,
    classId,
    students,
    onSuccess,
    displayMode = 'modal',
    title = 'Chấm điểm',
}) => {
    const { getAccessToken } = useAuth();

    // ============ STATE MANAGEMENT ============
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<string>('');
    const [gradingEndpoints, setGradingEndpoints] = useState<GradingEndpointInfo[]>([]);
    const [chooseMode, setChooseMode] = useState<null | 'new' | 'existing' | 'existing-multi' | 'manage'>(null);
    const [loading, setLoading] = useState(false);
    const [isCreatingAssignment, setIsCreatingAssignment] = useState(false);
    const [showInactiveAssignments, setShowInactiveAssignments] = useState(false);
    const [manageSelectedAssignmentIds, setManageSelectedAssignmentIds] = useState<string[]>([]);

    // STATE CHAM DIEM CHO TUNG HOC SINH (DUY NHAT)
    const [studentGradingStates, setStudentGradingStates] = useState<Map<string, StudentGradingState>>(
        new Map()
    );
    const [singlePersistedScores, setSinglePersistedScores] = useState<Map<string, PersistedScoreSnapshot>>(new Map());
    const [singleUndoSnapshots, setSingleUndoSnapshots] = useState<Map<string, SingleUndoSnapshot>>(new Map());
    const [undoingSingleStudentId, setUndoingSingleStudentId] = useState<string | null>(null);
    const [multiAssignmentIds, setMultiAssignmentIds] = useState<string[]>([]);
    const [multiAssignmentDraftIds, setMultiAssignmentDraftIds] = useState<string[]>([]);
    const [multiScores, setMultiScores] = useState<Map<string, Map<string, MultiScoreCellValue>>>(
        new Map()
    );
    const [multiPersistedScores, setMultiPersistedScores] = useState<
        Map<string, Map<string, PersistedScoreSnapshot>>
    >(new Map());
    const [multiAutoStates, setMultiAutoStates] = useState<Map<string, Map<string, MultiAutoCellState>>>(
        new Map()
    );
    const [multiUndoSnapshots, setMultiUndoSnapshots] = useState<Map<string, MultiUndoSnapshot>>(new Map());
    const [singleDragOverStudentId, setSingleDragOverStudentId] = useState<string | null>(null);
    const [multiDragOverCellKey, setMultiDragOverCellKey] = useState<string | null>(null);
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const [multiAssignmentQuery, setMultiAssignmentQuery] = useState('');
    const [isSelectingAssignments, setIsSelectingAssignments] = useState(false);
    const [pendingManualMultiFileMatches, setPendingManualMultiFileMatches] = useState<
        PendingManualMultiFileMatch[]
    >([]);
    const [isApplyingManualMultiFileMatches, setIsApplyingManualMultiFileMatches] = useState(false);
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [studentSearchHint, setStudentSearchHint] = useState('');
    const [studentSearchMatchedIds, setStudentSearchMatchedIds] = useState<string[]>([]);
    const [studentSearchMatchIndex, setStudentSearchMatchIndex] = useState(-1);
    const [lastStudentSearchKeyword, setLastStudentSearchKeyword] = useState('');
    const rowRefs = useRef(new Map<string, HTMLTableRowElement>());
    const isSavingScoresRef = useRef(false);

    // TAO BAI TAP MOI
    const [newAssignmentSubject, setNewAssignmentSubject] = useState<SubjectCode>('excel');
    const [newAssignmentPracticeCode, setNewAssignmentPracticeCode] = useState<PracticeCode>('practice01');
    const [bulkAssignmentDrafts, setBulkAssignmentDrafts] = useState<BulkAssignmentDraft[]>([]);
    const [bulkAssignmentDescription, setBulkAssignmentDescription] = useState('');
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
    const [assignmentSubmitLoading, setAssignmentSubmitLoading] = useState(false);
    const [assignmentEditForm, setAssignmentEditForm] = useState<UpdateAssignmentRequest>({
        name: '',
        description: '',
        maxScore: 10,
        gradingType: 'auto',
        gradingApiEndpoint: '',
        isActive: true,
    });

    const normalizeText = (value?: string): string =>
        (value || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();

    const isStudentActive = (student: Student): boolean => {
        const normalizedStatus = normalizeText(student.status);
        if (normalizedStatus) {
            return normalizedStatus === 'active';
        }

        return Boolean(student.isActive);
    };

    // ============ EFFECTS ============
    useEffect(() => {
        if (isOpen && classId) {
            resetModalState();
            loadGradingEndpoints();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, classId]);

    useEffect(() => {
        if (isOpen && classId) {
            loadAssignments();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, classId, showInactiveAssignments]);

    const gradingStudents = useMemo(
        () => students.filter((student) => isStudentActive(student)),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [students]
    );
    const activeAssignments = useMemo(
        () => assignments.filter((assignment) => assignment.isActive),
        [assignments]
    );
    const activeAutoAssignments = useMemo(
        () => activeAssignments.filter((assignment) => assignment.gradingType === 'auto'),
        [activeAssignments]
    );
    const manageableActiveAssignments = useMemo(
        () => assignments.filter((assignment) => assignment.isActive),
        [assignments]
    );
    const isAllManageActiveSelected = useMemo(() => {
        if (manageableActiveAssignments.length === 0) {
            return false;
        }

        return manageableActiveAssignments.every((assignment) =>
            manageSelectedAssignmentIds.includes(assignment.id)
        );
    }, [manageableActiveAssignments, manageSelectedAssignmentIds]);
    const newAssignmentPracticeEndpoints = useMemo(
        () => resolveEndpointsBySubjectAndPractice(gradingEndpoints, newAssignmentSubject, newAssignmentPracticeCode),
        [gradingEndpoints, newAssignmentSubject, newAssignmentPracticeCode]
    );
    const selectedBulkAssignmentCount = useMemo(
        () => bulkAssignmentDrafts.filter((draft) => draft.selected).length,
        [bulkAssignmentDrafts]
    );
    const activeAutoAssignmentIdsByPractice = useMemo<Record<PracticeCode, string[]>>(
        () => {
            const grouped: Record<PracticeCode, string[]> = {
                practice01: [],
                practice02: [],
                practice03: [],
                exam_review: [],
            };

            activeAutoAssignments.forEach((assignment) => {
                const practiceCode = resolveAssignmentPracticeCode(assignment);
                if (!practiceCode) return;
                grouped[practiceCode].push(assignment.id);
            });

            return grouped;
        },
        [activeAutoAssignments]
    );
    const hasPendingMultiAssignmentSelectionChanges = useMemo(() => {
        if (multiAssignmentDraftIds.length !== multiAssignmentIds.length) {
            return true;
        }
        return multiAssignmentDraftIds.some((id, index) => id !== multiAssignmentIds[index]);
    }, [multiAssignmentDraftIds, multiAssignmentIds]);

    useEffect(() => {
        if (isOpen && gradingStudents.length > 0) {
            initializeStudentStates();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, gradingStudents]);

    useEffect(() => {
        if (selectedAssignment) {
            setSinglePersistedScores(new Map());
            setSingleUndoSnapshots(new Map());
            setUndoingSingleStudentId(null);
            loadExistingScores(selectedAssignment);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAssignment]);

    useEffect(() => {
        setMultiAssignmentIds((prev) =>
            prev.filter((id) => activeAutoAssignments.some((assignment) => assignment.id === id))
        );
        setMultiAssignmentDraftIds((prev) =>
            prev.filter((id) => activeAutoAssignments.some((assignment) => assignment.id === id))
        );

        if (selectedAssignment && !activeAutoAssignments.some((assignment) => assignment.id === selectedAssignment)) {
            setSelectedAssignment('');
        }
    }, [activeAutoAssignments, selectedAssignment]);
    useEffect(() => {
        const activeAssignmentIds = new Set(
            assignments
                .filter((assignment) => assignment.isActive)
                .map((assignment) => assignment.id)
        );

        setManageSelectedAssignmentIds((prev) =>
            prev.filter((id) => activeAssignmentIds.has(id))
        );
    }, [assignments]);
    useEffect(() => {
        if (chooseMode !== 'manage') {
            setManageSelectedAssignmentIds((prev) => (prev.length > 0 ? [] : prev));
        }
    }, [chooseMode]);
    useEffect(() => {
        if (chooseMode !== 'existing-multi') {
            setPendingManualMultiFileMatches((prev) => (prev.length > 0 ? [] : prev));
            setIsApplyingManualMultiFileMatches(false);
        }
    }, [chooseMode]);
    useEffect(() => {
        if (!isOpen || chooseMode !== 'new') {
            return;
        }

        setBulkAssignmentDrafts((previousDrafts) =>
            buildBulkAssignmentDrafts(
                newAssignmentPracticeEndpoints,
                previousDrafts,
                newAssignmentPracticeCode
            )
        );
    }, [isOpen, chooseMode, newAssignmentPracticeEndpoints, newAssignmentPracticeCode]);

    // ============ HELPER FUNCTIONS ============
    const resetModalState = () => {
        setChooseMode(null);
        setSelectedAssignment('');
        setShowInactiveAssignments(false);
        setManageSelectedAssignmentIds([]);
        setStudentGradingStates(new Map());
        setSinglePersistedScores(new Map());
        setSingleUndoSnapshots(new Map());
        setUndoingSingleStudentId(null);
        setMultiAssignmentIds([]);
        setMultiAssignmentDraftIds([]);
        setMultiScores(new Map());
        setMultiPersistedScores(new Map());
        setMultiAutoStates(new Map());
        setMultiUndoSnapshots(new Map());
        setSingleDragOverStudentId(null);
        setMultiDragOverCellKey(null);
        setIsBulkUploading(false);
        setMultiAssignmentQuery('');
        setIsSelectingAssignments(false);
        setPendingManualMultiFileMatches([]);
        setIsApplyingManualMultiFileMatches(false);
        setStudentSearchQuery('');
        setStudentSearchHint('');
        setStudentSearchMatchedIds([]);
        setStudentSearchMatchIndex(-1);
        setLastStudentSearchKeyword('');
        setBulkAssignmentDrafts([]);
        setBulkAssignmentDescription('');
        setLoading(false);
        setIsCreatingAssignment(false);
        isSavingScoresRef.current = false;
        rowRefs.current.clear();
        setEditingAssignment(null);
        setAssignmentSubmitLoading(false);
        setNewAssignmentSubject('excel');
        setNewAssignmentPracticeCode('practice01');
        setAssignmentEditForm({
            name: '',
            description: '',
            maxScore: 10,
            gradingType: 'auto',
            gradingApiEndpoint: '',
            isActive: true,
        });
    };

    const initializeStudentStates = () => {
        const initialStates = new Map<string, StudentGradingState>();
        gradingStudents.forEach((student) => {
            initialStates.set(student.id, {
                studentId: student.id,
                studentFile: null,
                isGrading: false,
                gradingResult: null,
                error: null,
                manualScore: null,
                manualComment: '',
                autoGradingErrors: [],
            });
        });
        setStudentGradingStates(initialStates);
    };

    const isValidSubmissionFileName = (fileName: string): boolean => {
        const normalized = fileName.toLowerCase();

        // Determine accepted types from selected assignment's grading endpoint
        const selectedAssignmentData = assignments.find((a) => a.id === selectedAssignment);
        const acceptedList = getAcceptedSubmissionFileTypes(selectedAssignmentData?.gradingApiEndpoint || undefined)
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean);

        if (acceptedList.length > 0) {
            return acceptedList.some((ext) => normalized.endsWith(ext));
        }

        // Fallback to Excel-only if something unexpected
        return ['.xls', '.xlsx', '.xlsm'].some((ext) => normalized.endsWith(ext));
    };

    const validateExcelFile = (file: File, showAlert = true): boolean => {
        const isValid = isValidSubmissionFileName(file.name);
        if (!isValid) {
            if (showAlert) {
                const selectedAssignmentData = assignments.find((a) => a.id === selectedAssignment);
                const accepted = getAcceptedSubmissionFileTypes(selectedAssignmentData?.gradingApiEndpoint || undefined);
                alert(`File phải có định dạng: ${accepted}`);
            }
        }
        return isValid;
    };

    const convertAutoScoreToAssignmentScale = (result: GradingResult, assignmentMaxScore?: number): number => {
        void assignmentMaxScore;
        // Backend quyết định hoàn toàn điểm tự động; frontend chỉ hiển thị/lưu lại.
        const backendMax = typeof result.maxScore === 'number' && Number.isFinite(result.maxScore) ? result.maxScore : 0;
        const backendScore = typeof result.totalScore === 'number' && Number.isFinite(result.totalScore) ? result.totalScore : 0;

        if (backendMax > 0) {
            return Number(Math.max(0, Math.min(backendMax, backendScore)).toFixed(2));
        }

        return Number(Math.max(0, backendScore).toFixed(2));
    };

    const getGradingIssues = (result: GradingResult | null): NotifyIssue[] => {
        return getNotifyIssuesFromTaskResults(result?.taskResults);
    };

    const extractAutoGradingErrors = (result: GradingResult | null): string[] => {
        return getGradingIssues(result).map((issue) => stripGradingGuideSection(issue.error));
    };

    const mapTaskResultsForScorePayload = (
        result: GradingResult | null
    ): AutoGradingTaskResultRequest[] => {
        if (!result?.taskResults?.length) {
            return [];
        }

        return result.taskResults.map((task, index) => {
            const fallbackTaskId = `TASK-${String(index + 1).padStart(2, '0')}`;
            const taskId = (task.taskId || '').trim() || fallbackTaskId;
            const taskName = (task.taskName || '').trim() || taskId;
            const score = Number.isFinite(task.score) ? task.score : 0;
            const maxScore = Number.isFinite(task.maxScore) && task.maxScore > 0 ? task.maxScore : 1;
            const details = (task.details || [])
                .map((item) => (item || '').trim())
                .filter((item) => item.length > 0);
            const errors = (task.errors || [])
                .map((item) => (item || '').trim())
                .filter((item) => item.length > 0);
            const fixActions = (task.fixActions || [])
                .map((item) => (item || '').trim())
                .filter((item) => item.length > 0);

            return {
                taskId,
                taskName,
                score,
                maxScore,
                isPassed: Boolean(task.isPassed),
                details,
                errors,
                fixActions,
            };
        });
    };

    const renderAutoErrorDropdown = (errors: string[] | undefined, gradingResult?: GradingResult | null) => {
        const safeErrors = (errors || []).filter((item) => item && item.trim().length > 0);
        const issues = getGradingIssues(gradingResult || null);
        const issueCount = issues.length || safeErrors.length;
        if (issueCount === 0) return null;

        return (
            <div className="mt-1 text-left">
                <button
                    type="button"
                    className="cursor-pointer text-[11px] text-amber-700 hover:text-amber-800"
                    onClick={() => {
                        try {
                            const messagePart = issues.length > 0
                                ? issues.map((issue) => issue.error).join('\n\n')
                                : safeErrors.join('\n\n');

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
                    Xem lỗi chấm ({issueCount})
                </button>
            </div>
        );
    };

    const initializeMultiAutoStates = (assignmentIds: string[]) => {
        const autoAssignments = activeAutoAssignments.filter(
            (assignment) => assignmentIds.includes(assignment.id)
        );

        const autoMap = new Map<string, Map<string, MultiAutoCellState>>();
        autoAssignments.forEach((assignment) => {
            const perStudentMap = new Map<string, MultiAutoCellState>();
            gradingStudents.forEach((student) => {
                perStudentMap.set(student.id, {
                    studentFile: null,
                    isGrading: false,
                    error: null,
                    gradingResult: null,
                });
            });
            autoMap.set(assignment.id, perStudentMap);
        });

        setMultiAutoStates(autoMap);
    };

    // ============ API CALLS ============
    const loadAssignments = async () => {
        try {
            const data = await assignmentService.getByClass(classId, getAccessToken, {
                includeInactive: showInactiveAssignments,
            });
            setAssignments(data);
        } catch (error) {
            console.error('Lỗi khi tải danh sách bài tập:', error);
            alert('Không thể tải danh sách bài tập!');
        }
    };

    const loadGradingEndpoints = async () => {
        try {
            const data = await assignmentService.getGradingEndpoints(getAccessToken);
            setGradingEndpoints(data);
        } catch (error) {
            console.error('Lỗi khi tải danh sách đầu chấm điểm:', error);
        }
    };

    const loadExistingScores = async (assignmentId: string) => {
        try {
            const data = await scoreService.getByAssignment(assignmentId, getAccessToken);
            const nextPersistedScores = new Map<string, PersistedScoreSnapshot>();
            data.forEach((item) => {
                nextPersistedScores.set(item.studentId, {
                    scoreId: item.id,
                    scoreValue: typeof item.scoreValue === 'number' ? item.scoreValue : null,
                    feedback: item.feedback || '',
                    autoGradingErrors: item.autoGradingErrors || [],
                });
            });
            setSinglePersistedScores(nextPersistedScores);

            setStudentGradingStates((prev) => {
                const newMap = new Map(prev);
                gradingStudents.forEach((student) => {
                    const existingScore = data.find((s) => s.studentId === student.id);
                    const currentState = newMap.get(student.id);
                    if (currentState) {
                        newMap.set(student.id, {
                            ...currentState,
                            manualScore:
                                typeof existingScore?.scoreValue === 'number' ? existingScore.scoreValue : null,
                            manualComment: existingScore?.feedback || '',
                            autoGradingErrors: existingScore?.autoGradingErrors || [],
                        });
                    }
                });
                return newMap;
            });
        } catch (error) {
            console.error('Lỗi khi tải điểm:', error);
        }
    };

    const loadScoresForMultipleAssignments = async (assignmentIds: string[]) => {
        if (assignmentIds.length === 0) {
            setMultiScores(new Map());
            setMultiAutoStates(new Map());
            return;
        }

        try {
            initializeMultiAutoStates(assignmentIds);
            const scoreGroups = await Promise.all(
                assignmentIds.map(async (assignmentId) => {
                    const data = await scoreService.getByAssignment(assignmentId, getAccessToken);
                    return { assignmentId, data };
                })
            );

            const nextMap = new Map<string, Map<string, MultiScoreCellValue>>();
            const nextPersistedMap = new Map<string, Map<string, PersistedScoreSnapshot>>();

            assignmentIds.forEach((assignmentId) => {
                const rowMap = new Map<string, MultiScoreCellValue>();
                const persistedRowMap = new Map<string, PersistedScoreSnapshot>();
                gradingStudents.forEach((student) => {
                    rowMap.set(student.id, { scoreValue: null, feedback: '', autoGradingErrors: [] });
                });
                nextMap.set(assignmentId, rowMap);
                nextPersistedMap.set(assignmentId, persistedRowMap);
            });

            scoreGroups.forEach(({ assignmentId, data }) => {
                const rowMap = nextMap.get(assignmentId);
                const persistedRowMap = nextPersistedMap.get(assignmentId);
                if (!rowMap || !persistedRowMap) return;
                data.forEach((item) => {
                    rowMap.set(item.studentId, {
                        scoreValue: typeof item.scoreValue === 'number' ? item.scoreValue : null,
                        feedback: item.feedback || '',
                        autoGradingErrors: item.autoGradingErrors || [],
                    });
                    persistedRowMap.set(item.studentId, {
                        scoreId: item.id,
                        scoreValue: typeof item.scoreValue === 'number' ? item.scoreValue : null,
                        feedback: item.feedback || '',
                        autoGradingErrors: item.autoGradingErrors || [],
                    });
                });
            });

            setMultiScores(nextMap);
            setMultiPersistedScores(nextPersistedMap);
        } catch (error) {
            console.error('Lỗi khi tải điểm của nhiều bài tập:', error);
            alert('Không thể tải điểm cho nhiều bài tập!');
        }
    };

    const normalizeMultiAssignmentIds = (ids: string[]) => {
        // Giữ nguyên thứ tự giáo viên chọn, chỉ loại trùng và loại các id không còn hợp lệ.
        const uniqueIdsInSelectionOrder = Array.from(new Set(ids));
        const validIds = new Set(activeAutoAssignments.map((assignment) => assignment.id));
        return uniqueIdsInSelectionOrder.filter((id) => validIds.has(id));
    };

    const buildMultiUndoCellKey = (assignmentId: string, studentId: string) =>
        `${assignmentId}::${studentId}`;

    const handleToggleMultiAssignmentSelection = (assignmentId: string) => {
        if (isSelectingAssignments) return;

        setMultiAssignmentDraftIds((prev) => {
            const nextIds = prev.includes(assignmentId)
                ? prev.filter((id) => id !== assignmentId)
                : [...prev, assignmentId];
            return normalizeMultiAssignmentIds(nextIds);
        });
    };

    const handleToggleQuickPracticeSelection = (practiceCode: PracticeCode) => {
        if (isSelectingAssignments) return;

        const practiceAssignmentIds = activeAutoAssignmentIdsByPractice[practiceCode] || [];
        if (practiceAssignmentIds.length === 0) return;

        setMultiAssignmentDraftIds((prev) => {
            const prevSet = new Set(prev);
            const isAllSelected = practiceAssignmentIds.every((id) => prevSet.has(id));

            if (isAllSelected) {
                const removeSet = new Set(practiceAssignmentIds);
                return normalizeMultiAssignmentIds(prev.filter((id) => !removeSet.has(id)));
            }

            const mergedSet = new Set(prev);
            practiceAssignmentIds.forEach((id) => mergedSet.add(id));

            const orderedIds = activeAutoAssignments
                .map((assignment) => assignment.id)
                .filter((id) => mergedSet.has(id));
            return normalizeMultiAssignmentIds(orderedIds);
        });
    };

    const handleSelectAllAutoAssignments = () => {
        if (isSelectingAssignments) return;
        setMultiAssignmentDraftIds(activeAutoAssignments.map((assignment) => assignment.id));
    };

    const handleClearAutoAssignments = () => {
        if (isSelectingAssignments) return;
        setMultiAssignmentDraftIds([]);
    };

    const handleCommitMultiAssignmentSelection = async () => {
        if (isSelectingAssignments) return;

        const normalizedDraftIds = normalizeMultiAssignmentIds(multiAssignmentDraftIds);
        setIsSelectingAssignments(true);
        try {
            setMultiAssignmentIds(normalizedDraftIds);
            setMultiUndoSnapshots(new Map());
            setPendingManualMultiFileMatches([]);
            await loadScoresForMultipleAssignments(normalizedDraftIds);
        } finally {
            setIsSelectingAssignments(false);
        }
    };

    const handlePendingManualMultiFileAssignmentChange = (matchId: string, assignmentId: string) => {
        setPendingManualMultiFileMatches((prev) =>
            prev.map((item) =>
                item.id === matchId
                    ? { ...item, selectedAssignmentId: assignmentId }
                    : item
            )
        );
    };

    const handleRemovePendingManualMultiFileMatch = (matchId: string) => {
        if (isApplyingManualMultiFileMatches) return;
        setPendingManualMultiFileMatches((prev) => prev.filter((item) => item.id !== matchId));
    };

    const applyPendingManualMultiFileMatches = async (matches: PendingManualMultiFileMatch[]) => {
        if (matches.length === 0) return;
        if (isApplyingManualMultiFileMatches) return;

        setIsApplyingManualMultiFileMatches(true);
        try {
            for (const match of matches) {
                if (!match.selectedAssignmentId) continue;
                await uploadMultiStudentFile(match.selectedAssignmentId, match.studentId, match.file, {
                    skipValidation: true,
                });
            }

            const processedIds = new Set(matches.map((item) => item.id));
            setPendingManualMultiFileMatches((prev) =>
                prev.filter((item) => !processedIds.has(item.id))
            );
        } finally {
            setIsApplyingManualMultiFileMatches(false);
        }
    };

    const handleApplyPendingManualMultiFileMatch = async (matchId: string) => {
        const target = pendingManualMultiFileMatches.find((item) => item.id === matchId);
        if (!target) return;
        if (!target.selectedAssignmentId) {
            alert('Vui lòng chọn cột bài tập trước khi gán file.');
            return;
        }
        await applyPendingManualMultiFileMatches([target]);
    };

    const handleApplyAllPendingManualMultiFileMatches = async () => {
        const readyMatches = pendingManualMultiFileMatches.filter((item) => item.selectedAssignmentId);
        if (readyMatches.length === 0) {
            alert('Chưa có file nào được chọn cột bài tập để gán.');
            return;
        }

        const duplicateKey = new Set<string>();
        for (const match of readyMatches) {
            const key = `${match.studentId}::${match.selectedAssignmentId}`;
            if (duplicateKey.has(key)) {
                alert('Có ít nhất 2 file đang chọn cùng một cột bài tập cho cùng 1 học sinh. Vui lòng chỉnh lại trước khi gán.');
                return;
            }
            duplicateKey.add(key);
        }

        await applyPendingManualMultiFileMatches(readyMatches);
    };

    // ============ EVENT HANDLERS ============
    const uploadStudentFile = async (
        studentId: string,
        file: File,
        options?: { skipValidation?: boolean }
    ) => {
        const skipValidation = options?.skipValidation ?? false;
        if (!skipValidation && !validateExcelFile(file)) {
            return;
        }

        const previousState = studentGradingStates.get(studentId);
        const previousPersistedScore = singlePersistedScores.get(studentId) || null;
        setSingleUndoSnapshots((prev) => {
            const next = new Map(prev);
            next.set(studentId, {
                previousState: {
                    studentFile: previousState?.studentFile || null,
                    isGrading: Boolean(previousState?.isGrading),
                    gradingResult: previousState?.gradingResult || null,
                    error: previousState?.error || null,
                    manualScore: previousState?.manualScore ?? null,
                    manualComment: previousState?.manualComment || '',
                    autoGradingErrors: [...(previousState?.autoGradingErrors || [])],
                },
                previousPersistedScore: previousPersistedScore
                    ? {
                        scoreId: previousPersistedScore.scoreId,
                        scoreValue: previousPersistedScore.scoreValue,
                        feedback: previousPersistedScore.feedback,
                        autoGradingErrors: [...(previousPersistedScore.autoGradingErrors || [])],
                    }
                    : null,
            });
            return next;
        });

        setStudentGradingStates((prev) => {
            const newMap = new Map(prev);
            const currentState = newMap.get(studentId);
            if (currentState) {
                newMap.set(studentId, {
                    ...currentState,
                    studentFile: file,
                    error: null,
                    gradingResult: null,
                    autoGradingErrors: [],
                });
            }
            return newMap;
        });

        await handleAutoGrade(studentId, file);
    };

    const handleStudentFileChange = async (
        studentId: string,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        await uploadStudentFile(studentId, file);
        e.target.value = '';
    };

    const handleBulkStudentFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        e.target.value = '';

        if (files.length === 0) return;
        if (!selectedAssignment) {
            alert('Vui lòng chọn bài tập trước khi chọn nhiều file.');
            return;
        }
        if (isBulkUploading) return;

        setIsBulkUploading(true);
        try {
            const maxCount = Math.min(files.length, gradingStudents.length);
            const invalidFiles: string[] = [];

            for (let i = 0; i < maxCount; i++) {
                const file = files[i];
                if (!validateExcelFile(file, false)) {
                    invalidFiles.push(file.name);
                    continue;
                }

                // Map theo thu tu danh sach hoc sinh tren bang.
                const student = gradingStudents[i];
                await uploadStudentFile(student.id, file, { skipValidation: true });
            }

            const extraFiles = files.length - maxCount;
            if (invalidFiles.length > 0 || extraFiles > 0) {
                const notes: string[] = [];
                if (invalidFiles.length > 0) {
                    notes.push(`Bo qua file sai dinh dang: ${invalidFiles.join(', ')}`);
                }
                if (extraFiles > 0) {
                    notes.push(`Bo qua ${extraFiles} file do vuot so hoc sinh trong danh sach.`);
                }
                alert(notes.join('\n'));
            }
        } finally {
            setIsBulkUploading(false);
        }
    };

    const handleStudentFileDragOver = (
        studentId: string,
        isDisabled: boolean,
        e: React.DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();
        if (isDisabled) return;
        e.dataTransfer.dropEffect = 'copy';
        if (singleDragOverStudentId !== studentId) {
            setSingleDragOverStudentId(studentId);
        }
    };

    const handleStudentFileDragLeave = (studentId: string) => {
        if (singleDragOverStudentId === studentId) {
            setSingleDragOverStudentId(null);
        }
    };

    const handleStudentFileDrop = async (
        studentId: string,
        isDisabled: boolean,
        e: React.DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();
        setSingleDragOverStudentId(null);
        if (isDisabled) return;

        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length === 0) return;

        const startIndex = gradingStudents.findIndex((s) => s.id === studentId);
        if (startIndex === -1) return;

        const maxCount = Math.min(files.length, gradingStudents.length - startIndex);
        const invalidFiles: string[] = [];

        for (let i = 0; i < maxCount; i++) {
            const file = files[i];
            if (!validateExcelFile(file, false)) {
                invalidFiles.push(file.name);
                continue;
            }
            const targetStudent = gradingStudents[startIndex + i];
            await uploadStudentFile(targetStudent.id, file, { skipValidation: true });
        }

        const extraFiles = files.length - maxCount;
        if (invalidFiles.length > 0 || extraFiles > 0) {
            const notes: string[] = [];
            if (invalidFiles.length > 0) {
                notes.push(`Bỏ qua file sai định dạng: ${invalidFiles.join(', ')}`);
            }
            if (extraFiles > 0) {
                notes.push(`Bỏ qua ${extraFiles} file do vượt số học sinh còn lại trong danh sách.`);
            }
            alert(notes.join('\n'));
        }
    };

    const handleUndoSingleStudentFile = async (studentId: string) => {
        const currentState = studentGradingStates.get(studentId);
        if (currentState?.isGrading || undoingSingleStudentId === studentId) {
            return;
        }

        const snapshot = singleUndoSnapshots.get(studentId);
        if (!snapshot) {
            setStudentGradingStates((prev) => {
                const next = new Map(prev);
                const existing = next.get(studentId);
                if (existing) {
                    next.set(studentId, {
                        ...existing,
                        studentFile: null,
                        gradingResult: null,
                        error: null,
                        manualScore: null,
                        autoGradingErrors: [],
                    });
                }
                return next;
            });
            return;
        }

        setUndoingSingleStudentId(studentId);
        try {
            setStudentGradingStates((prev) => {
                const next = new Map(prev);
                const existing = next.get(studentId);
                if (existing) {
                    next.set(studentId, {
                        ...existing,
                        studentFile: snapshot.previousState.studentFile,
                        isGrading: false,
                        gradingResult: snapshot.previousState.gradingResult,
                        error: snapshot.previousState.error,
                        manualScore: snapshot.previousState.manualScore,
                        manualComment: snapshot.previousState.manualComment,
                        autoGradingErrors: [...(snapshot.previousState.autoGradingErrors || [])],
                    });
                }
                return next;
            });

            if (selectedAssignment) {
                const previousPersisted = snapshot.previousPersistedScore;
                if (previousPersisted && typeof previousPersisted.scoreValue === 'number') {
                    const restored = await scoreService.bulkCreateOrUpdate(
                        {
                            assignmentId: selectedAssignment,
                            classId: classId,
                            scores: [
                                {
                                    studentId,
                                    scoreValue: previousPersisted.scoreValue,
                                    feedback: previousPersisted.feedback,
                                    autoGradingErrors: previousPersisted.autoGradingErrors || [],
                                },
                            ],
                        },
                        getAccessToken
                    );

                    const restoredScore = restored.scores[0];
                    if (restoredScore) {
                        setSinglePersistedScores((prev) => {
                            const next = new Map(prev);
                            next.set(studentId, {
                                scoreId: restoredScore.id,
                                scoreValue:
                                    typeof restoredScore.scoreValue === 'number'
                                        ? restoredScore.scoreValue
                                        : null,
                                feedback: restoredScore.feedback || '',
                                autoGradingErrors: restoredScore.autoGradingErrors || [],
                            });
                            return next;
                        });
                    }
                } else {
                    let scoreIdToDelete = singlePersistedScores.get(studentId)?.scoreId || null;
                    if (!scoreIdToDelete) {
                        const scores = await scoreService.getByAssignment(selectedAssignment, getAccessToken);
                        scoreIdToDelete = scores.find((item) => item.studentId === studentId)?.id || null;
                    }

                    if (scoreIdToDelete) {
                        await scoreService.delete(scoreIdToDelete, getAccessToken);
                    }

                    setSinglePersistedScores((prev) => {
                        const next = new Map(prev);
                        next.delete(studentId);
                        return next;
                    });
                }
            }

            setSingleUndoSnapshots((prev) => {
                const next = new Map(prev);
                next.delete(studentId);
                return next;
            });
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Không thể hoàn tác file vừa chọn.');
            if (selectedAssignment) {
                await loadExistingScores(selectedAssignment);
            }
        } finally {
            setUndoingSingleStudentId(null);
        }
    };

    const handleAutoGrade = async (studentId: string, studentFile: File) => {
        const student = students.find((item) => item.id === studentId);
        if (student && !isStudentActive(student)) {
            alert('Học sinh đang ở trạng thái ngừng, không thể chấm điểm.');
            return;
        }

        if (!selectedAssignment) {
            alert('Vui lòng chọn bài tập trước khi chấm điểm.');
            return;
        }
        const selectedAssignmentData = assignments.find((a) => a.id === selectedAssignment);
        const gradingEndpoint =
            selectedAssignmentData?.gradingApiEndpoint || '/grading/excel/project09';

        setStudentGradingStates((prev) => {
            const newMap = new Map(prev);
            const currentState = newMap.get(studentId);
            if (currentState) {
                newMap.set(studentId, {
                    ...currentState,
                    isGrading: true,
                    error: null,
                });
            }
            return newMap;
        });

        try {
            const result = await gradingService.gradeByEndpoint(
                gradingEndpoint,
                studentFile,
                getAccessToken,
                {
                    classId,
                    assignmentId: selectedAssignment,
                    studentId,
                }
            );
            const scaledAutoScore = convertAutoScoreToAssignmentScale(result, selectedAssignmentData?.maxScore);

            setStudentGradingStates((prev) => {
                const newMap = new Map(prev);
                const currentState = newMap.get(studentId);
                const autoErrors = extractAutoGradingErrors(result);
                if (currentState) {
                    newMap.set(studentId, {
                        ...currentState,
                        isGrading: false,
                        gradingResult: result,
                        error: null,
                        // GHI DE DIEM TU DONG VAO MANUAL SCORE
                        manualScore: scaledAutoScore,
                        autoGradingErrors: autoErrors,
                    });
                }
                return newMap;
            });

            if (selectedAssignment) {
                const autoErrors = extractAutoGradingErrors(result);
                const autoTaskResults = mapTaskResultsForScorePayload(result);
                const savedScore = await saveScoreForStudent(studentId, scaledAutoScore, autoErrors, autoTaskResults);
                if (savedScore) {
                    setSinglePersistedScores((prev) => {
                        const next = new Map(prev);
                        next.set(studentId, {
                            scoreId: savedScore.id,
                            scoreValue: typeof savedScore.scoreValue === 'number' ? savedScore.scoreValue : null,
                            feedback: savedScore.feedback || '',
                            autoGradingErrors: savedScore.autoGradingErrors || [],
                        });
                        return next;
                    });
                }
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            console.error('Lỗi cham diem:', error);
            setStudentGradingStates((prev) => {
                const newMap = new Map(prev);
                const currentState = newMap.get(studentId);
                if (currentState) {
                    newMap.set(studentId, {
                        ...currentState,
                        isGrading: false,
                        error: errorMessage,
                        autoGradingErrors: [],
                    });
                }
                return newMap;
            });
        }
    };

    const uploadMultiStudentFile = async (
        assignmentId: string,
        studentId: string,
        file: File,
        options?: { skipValidation?: boolean }
    ) => {
        const student = students.find((item) => item.id === studentId);
        if (student && !isStudentActive(student)) {
            alert('Học sinh đang ở trạng thái ngừng, không thể chấm điểm.');
            return;
        }

        const skipValidation = options?.skipValidation ?? false;
        if (!skipValidation && !validateExcelFile(file)) {
            return;
        }

        const currentAutoState = multiAutoStates.get(assignmentId)?.get(studentId);
        const currentScoreState = multiScores.get(assignmentId)?.get(studentId);
        const undoKey = buildMultiUndoCellKey(assignmentId, studentId);
        setMultiUndoSnapshots((prev) => {
            const next = new Map(prev);
            next.set(undoKey, {
                previousAutoState: {
                    studentFile: currentAutoState?.studentFile || null,
                    isGrading: Boolean(currentAutoState?.isGrading),
                    error: currentAutoState?.error || null,
                    gradingResult: currentAutoState?.gradingResult || null,
                },
                previousScoreState: {
                    scoreValue: currentScoreState?.scoreValue ?? null,
                    feedback: currentScoreState?.feedback || '',
                    autoGradingErrors: [...(currentScoreState?.autoGradingErrors || [])],
                },
            });
            return next;
        });

        setMultiAutoStates((prev) => {
            const next = new Map(prev);
            const assignmentMap = new Map(next.get(assignmentId) || new Map());
            const current = assignmentMap.get(studentId) || {
                studentFile: null,
                isGrading: false,
                error: null,
                gradingResult: null,
            };
            assignmentMap.set(studentId, {
                ...current,
                studentFile: file,
                isGrading: true,
                error: null,
                gradingResult: null,
            });
            next.set(assignmentId, assignmentMap);
            return next;
        });
        setMultiScores((prev) => {
            const next = new Map(prev);
            const rowMap = new Map(next.get(assignmentId) || new Map());
            const current = rowMap.get(studentId) || {
                scoreValue: null,
                feedback: '',
                autoGradingErrors: [],
            };
            rowMap.set(studentId, {
                ...current,
                autoGradingErrors: [],
            });
            next.set(assignmentId, rowMap);
            return next;
        });

        const assignment = assignments.find((a) => a.id === assignmentId);
        const gradingEndpoint = assignment?.gradingApiEndpoint;
        if (!gradingEndpoint) {
            setMultiAutoStates((prev) => {
                const next = new Map(prev);
                const assignmentMap = new Map(next.get(assignmentId) || new Map());
                const current = assignmentMap.get(studentId);
                if (current) {
                    assignmentMap.set(studentId, {
                        ...current,
                        isGrading: false,
                        error: 'Không tìm thấy gradingApiEndpoint cho bài tập.',
                    });
                }
                next.set(assignmentId, assignmentMap);
                return next;
            });
            return;
        }

        try {
            const result = await gradingService.gradeByEndpoint(
                gradingEndpoint,
                file,
                getAccessToken,
                {
                    classId,
                    assignmentId,
                    studentId,
                }
            );
            const scaledAutoScore = convertAutoScoreToAssignmentScale(result, assignment?.maxScore);

            setMultiAutoStates((prev) => {
                const next = new Map(prev);
                const assignmentMap = new Map(next.get(assignmentId) || new Map());
                const current = assignmentMap.get(studentId);
                if (current) {
                    assignmentMap.set(studentId, {
                        ...current,
                        isGrading: false,
                        error: null,
                        gradingResult: result,
                    });
                }
                next.set(assignmentId, assignmentMap);
                return next;
            });

            const autoErrors = extractAutoGradingErrors(result);
            handleMultiScoreChange(assignmentId, studentId, scaledAutoScore, autoErrors);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
            setMultiAutoStates((prev) => {
                const next = new Map(prev);
                const assignmentMap = new Map(next.get(assignmentId) || new Map());
                const current = assignmentMap.get(studentId);
                if (current) {
                    assignmentMap.set(studentId, {
                        ...current,
                        isGrading: false,
                        error: errorMessage,
                    });
                }
                next.set(assignmentId, assignmentMap);
                return next;
            });
        }
    };

    const handleMultiStudentFileChange = async (
        assignmentId: string,
        studentId: string,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        await uploadMultiStudentFile(assignmentId, studentId, file);
        e.target.value = '';
    };

    const handleMultiStudentFileDragOver = (
        assignmentId: string,
        studentId: string,
        isDisabled: boolean,
        e: React.DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();
        if (isDisabled) return;

        const cellKey = `${assignmentId}:${studentId}`;
        e.dataTransfer.dropEffect = 'copy';
        if (multiDragOverCellKey !== cellKey) {
            setMultiDragOverCellKey(cellKey);
        }
    };

    const handleMultiStudentFileDragLeave = (assignmentId: string, studentId: string) => {
        const cellKey = `${assignmentId}:${studentId}`;
        if (multiDragOverCellKey === cellKey) {
            setMultiDragOverCellKey(null);
        }
    };

    const handleMultiStudentFileDrop = async (
        assignmentId: string,
        studentId: string,
        isDisabled: boolean,
        e: React.DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();
        setMultiDragOverCellKey(null);
        if (isDisabled) return;

        const files = Array.from(e.dataTransfer?.files || []);
        if (files.length === 0) return;

        const startAssignmentIndex = multiAssignmentIds.findIndex((id) => id === assignmentId);
        if (startAssignmentIndex === -1) return;

        const candidateAssignmentIds = multiAssignmentIds.slice(startAssignmentIndex);
        if (candidateAssignmentIds.length === 0) return;

        const assignmentIdsByProjectNumber = new Map<number, string[]>();
        candidateAssignmentIds.forEach((candidateId) => {
            const assignment = assignments.find((item) => item.id === candidateId);
            const projectNumber = extractProjectNumberFromEndpoint(assignment?.gradingApiEndpoint);
            if (!projectNumber) return;

            const existing = assignmentIdsByProjectNumber.get(projectNumber) || [];
            existing.push(candidateId);
            assignmentIdsByProjectNumber.set(projectNumber, existing);
        });

        const invalidFiles: string[] = [];
        const unresolvedFiles: Array<{
            file: File;
            reason: string;
            candidateAssignmentIds: string[];
            selectedAssignmentId: string;
        }> = [];
        const smartMatchedUploads: Array<{ targetAssignmentId: string; file: File }> = [];
        const usedAssignmentIds = new Set<string>();

        const resolveTargetAssignmentId = (rankedProjectNumbers: number[]): { targetAssignmentId: string | null; reason: string } => {
            if (rankedProjectNumbers.length === 0) {
                return { targetAssignmentId: null, reason: 'Không tìm thấy mã project trong tên file hoặc Title.' };
            }

            let hasProjectInSelection = false;
            let hasOnlyUsedAssignments = false;
            for (const projectNumber of rankedProjectNumbers) {
                const assignmentIds = assignmentIdsByProjectNumber.get(projectNumber) || [];
                if (assignmentIds.length === 0) continue;

                hasProjectInSelection = true;
                const availableIds = assignmentIds.filter((id) => !usedAssignmentIds.has(id));
                if (availableIds.length === 1) {
                    return { targetAssignmentId: availableIds[0], reason: '' };
                }
                if (availableIds.length > 1) {
                    return {
                        targetAssignmentId: null,
                        reason: `Project ${projectNumber.toString().padStart(2, '0')} đang trùng nhiều cột bài tập.`,
                    };
                }
                hasOnlyUsedAssignments = true;
            }

            if (hasProjectInSelection && hasOnlyUsedAssignments) {
                return {
                    targetAssignmentId: null,
                    reason: 'Đã có file khác được gán vào project này trên cùng hàng.',
                };
            }
            if (hasProjectInSelection) {
                return {
                    targetAssignmentId: null,
                    reason: 'Không còn cột bài tập phù hợp để tự động gán.',
                };
            }
            return {
                targetAssignmentId: null,
                reason: 'Project trong file không nằm trong danh sách bài đã chọn.',
            };
        };

        for (const file of files) {
            if (!validateExcelFile(file, false)) {
                invalidFiles.push(file.name);
                continue;
            }

            const fileNameCandidates = extractProjectNumbersFromText(file.name);
            let workbookTitleCandidates: number[] = [];

            const initialResolution = resolveTargetAssignmentId(rankProjectCandidates(fileNameCandidates, workbookTitleCandidates));
            if (!initialResolution.targetAssignmentId) {
                const workbookTitle = await readWorkbookTitle(file);
                if (workbookTitle) {
                    workbookTitleCandidates = extractProjectNumbersFromText(workbookTitle);
                }
            }

            const rankedProjectNumbers = rankProjectCandidates(fileNameCandidates, workbookTitleCandidates);
            const resolution = resolveTargetAssignmentId(rankedProjectNumbers);
            if (!resolution.targetAssignmentId) {
                const suggestedCandidateIds = rankedProjectNumbers
                    .flatMap((projectNumber) => assignmentIdsByProjectNumber.get(projectNumber) || [])
                    .filter((id) => !usedAssignmentIds.has(id));
                const fallbackCandidateIds = candidateAssignmentIds.filter((id) => !usedAssignmentIds.has(id));
                const resolvedCandidateIds = Array.from(
                    new Set(
                        (suggestedCandidateIds.length > 0 ? suggestedCandidateIds : fallbackCandidateIds).length > 0
                            ? (suggestedCandidateIds.length > 0 ? suggestedCandidateIds : fallbackCandidateIds)
                            : candidateAssignmentIds
                    )
                );

                unresolvedFiles.push({
                    file,
                    reason: resolution.reason,
                    candidateAssignmentIds: resolvedCandidateIds,
                    selectedAssignmentId: resolvedCandidateIds.length === 1 ? resolvedCandidateIds[0] : '',
                });
                continue;
            }

            usedAssignmentIds.add(resolution.targetAssignmentId);
            smartMatchedUploads.push({
                targetAssignmentId: resolution.targetAssignmentId,
                file,
            });
        }

        for (const upload of smartMatchedUploads) {
            await uploadMultiStudentFile(upload.targetAssignmentId, studentId, upload.file, { skipValidation: true });
        }

        if (unresolvedFiles.length > 0) {
            setPendingManualMultiFileMatches((prev) => {
                const next = [...prev];
                unresolvedFiles.forEach((item, index) => {
                    const fileKey = `${item.file.name}-${item.file.size}-${item.file.lastModified}`;
                    const duplicateIndex = next.findIndex(
                        (existing) => existing.studentId === studentId && existing.fileKey === fileKey
                    );
                    const pendingItem: PendingManualMultiFileMatch = {
                        id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
                        fileKey,
                        studentId,
                        file: item.file,
                        reason: item.reason,
                        selectedAssignmentId: item.selectedAssignmentId,
                        candidateAssignmentIds: item.candidateAssignmentIds,
                    };

                    if (duplicateIndex >= 0) {
                        next[duplicateIndex] = pendingItem;
                    } else {
                        next.push(pendingItem);
                    }
                });
                return next;
            });
        }

        if (smartMatchedUploads.length > 0 || invalidFiles.length > 0 || unresolvedFiles.length > 0) {
            const notes: string[] = [];
            if (smartMatchedUploads.length > 0) {
                notes.push(`Đã tự động nhận diện và gán ${smartMatchedUploads.length} file theo mã project.`);
            }
            if (invalidFiles.length > 0) {
                notes.push(`Bỏ qua file sai định dạng: ${invalidFiles.join(', ')}`);
            }
            if (unresolvedFiles.length > 0) {
                notes.push(`Có ${unresolvedFiles.length} file cần chọn tay. Xử lý nhanh trong khung "File cần chọn tay" phía trên bảng.`);
            }
            if (notes.length > 0) {
                alert(notes.join('\n'));
            }
        }
    };

    const handleUndoMultiStudentFile = (assignmentId: string, studentId: string) => {
        const undoKey = buildMultiUndoCellKey(assignmentId, studentId);
        const snapshot = multiUndoSnapshots.get(undoKey);
        if (!snapshot) return;

        setMultiAutoStates((prev) => {
            const next = new Map(prev);
            const assignmentMap = new Map(next.get(assignmentId) || new Map());
            assignmentMap.set(studentId, {
                studentFile: snapshot.previousAutoState.studentFile,
                isGrading: false,
                error: snapshot.previousAutoState.error,
                gradingResult: snapshot.previousAutoState.gradingResult,
            });
            next.set(assignmentId, assignmentMap);
            return next;
        });

        setMultiScores((prev) => {
            const next = new Map(prev);
            const rowMap = new Map(next.get(assignmentId) || new Map());
            rowMap.set(studentId, {
                scoreValue: snapshot.previousScoreState.scoreValue,
                feedback: snapshot.previousScoreState.feedback,
                autoGradingErrors: [...(snapshot.previousScoreState.autoGradingErrors || [])],
            });
            next.set(assignmentId, rowMap);
            return next;
        });

        setMultiUndoSnapshots((prev) => {
            const next = new Map(prev);
            next.delete(undoKey);
            return next;
        });
    };

    const handleMultiScoreChange = (
        assignmentId: string,
        studentId: string,
        value: number | null,
        autoErrors?: string[]
    ) => {
        setMultiScores((prev) => {
            const next = new Map(prev);
            const rowMap = new Map(next.get(assignmentId) || new Map());
            const current = rowMap.get(studentId) || {
                scoreValue: null,
                feedback: '',
                autoGradingErrors: [],
            };
            rowMap.set(studentId, {
                ...current,
                scoreValue: value,
                autoGradingErrors: autoErrors ?? current.autoGradingErrors ?? [],
            });
            next.set(assignmentId, rowMap);
            return next;
        });
    };

    const saveScoreForStudent = async (
        studentId: string,
        scoreValue: number,
        autoGradingErrors: string[] = [],
        autoGradingTaskResults: AutoGradingTaskResultRequest[] = []
    ): Promise<ScoreResponse | null> => {
        if (!selectedAssignment) return null;
        try {
            const result = await scoreService.bulkCreateOrUpdate(
                {
                    assignmentId: selectedAssignment,
                    classId: classId,
                    scores: [{ studentId, scoreValue, autoGradingErrors, autoGradingTaskResults }],
                },
                getAccessToken
            );
            return result.scores[0] || null;
        } catch (error) {
            console.error('Lỗi luu diem:', error);
            return null;
        }
    };

    const getReadableErrorMessage = (error: unknown, fallback: string): string =>
        error instanceof Error && error.message ? error.message : fallback;

    const handleSaveAllScores = async () => {
        if (!selectedAssignment) {
            alert('Vui lòng chọn bài tập!');
            return;
        }

        if (isSavingScoresRef.current) {
            return;
        }

        isSavingScoresRef.current = true;
        setLoading(true);
        try {
            const activeStudentIds = new Set(gradingStudents.map((student) => student.id));
            const scores = Array.from(studentGradingStates.values())
                .filter(s => s.manualScore !== null && activeStudentIds.has(s.studentId))
                .map(s => ({
                    studentId: s.studentId,
                    scoreValue: s.manualScore!,
                    feedback: s.manualComment,
                    autoGradingErrors: s.autoGradingErrors || extractAutoGradingErrors(s.gradingResult),
                    autoGradingTaskResults: mapTaskResultsForScorePayload(s.gradingResult),
                }));

            await scoreService.bulkCreateOrUpdate(
                {
                    assignmentId: selectedAssignment,
                    classId: classId,
                    scores,
                },
                getAccessToken
            );

            alert('Luu diem thanh cong!');
            if (onSuccess) await onSuccess();
            handleClose();
        } catch (error) {
            console.error('Lỗi khi lưu điểm:', error);
            alert(getReadableErrorMessage(error, 'Không thể lưu điểm!'));
        } finally {
            isSavingScoresRef.current = false;
            setLoading(false);
        }
    };

    const handleSaveMultipleAssignments = async () => {
        if (multiAssignmentIds.length === 0) {
            alert('Vui lòng chọn ít nhất 1 bài tập!');
            return;
        }

        if (isSavingScoresRef.current) {
            return;
        }

        isSavingScoresRef.current = true;
        setLoading(true);
        try {
            const activeStudentIds = new Set(gradingStudents.map((student) => student.id));
            const assignmentNameById = new Map(assignments.map((assignment) => [assignment.id, assignment.name]));
            const failedAssignments: string[] = [];
            let savedAssignmentCount = 0;

            // Helper function để kiểm tra xem score có thay đổi không
            const hasScoreChanged = (
                current: MultiScoreCellValue | undefined,
                persisted: PersistedScoreSnapshot | undefined
            ): boolean => {
                if (!current) return false;
                if (!persisted) {
                    // Nếu không có persisted nhưng có current với scoreValue !== null => có thay đổi
                    return current.scoreValue !== null;
                }
                // So sánh scoreValue
                if (current.scoreValue !== persisted.scoreValue) return true;
                // So sánh autoGradingErrors
                const currentErrors = current.autoGradingErrors || [];
                const persistedErrors = persisted.autoGradingErrors || [];
                if (currentErrors.length !== persistedErrors.length) return true;
                return !currentErrors.every((err, idx) => err === persistedErrors[idx]);
            };

            for (const assignmentId of multiAssignmentIds) {
                const rowMap = multiScores.get(assignmentId);
                const persistedRowMap = multiPersistedScores.get(assignmentId);
                if (!rowMap) continue;

                // ✅ Chỉ lưu scores có thay đổi
                const scores = Array.from(rowMap.entries())
                    .filter(([studentId, item]) => {
                        if (!activeStudentIds.has(studentId)) return false;
                        const persistedItem = persistedRowMap?.get(studentId);
                        return hasScoreChanged(item, persistedItem);
                    })
                    .map(([studentId, item]) => {
                        const autoState = multiAutoStates.get(assignmentId)?.get(studentId);
                        return {
                            studentId,
                            scoreValue: item.scoreValue!,
                            feedback: item.feedback,
                            autoGradingErrors: item.autoGradingErrors || [],
                            autoGradingTaskResults: mapTaskResultsForScorePayload(autoState?.gradingResult || null),
                        };
                    });

                if (scores.length === 0) continue;

                try {
                    await scoreService.bulkCreateOrUpdate(
                        {
                            assignmentId,
                            classId,
                            scores,
                        },
                        getAccessToken
                    );
                    savedAssignmentCount += 1;
                } catch (error) {
                    const assignmentName = assignmentNameById.get(assignmentId) || assignmentId;
                    failedAssignments.push(
                        `${assignmentName}: ${getReadableErrorMessage(error, 'Không thể lưu điểm cho bài này.')}`
                    );
                }
            }

            if (failedAssignments.length > 0) {
                const message = failedAssignments.join('\n');
                if (savedAssignmentCount > 0) {
                    alert(`Đã lưu ${savedAssignmentCount} bài nhưng còn lỗi:\n${message}`);
                    if (onSuccess) await onSuccess();
                } else {
                    alert(`Không thể lưu điểm cho nhiều bài tập:\n${message}`);
                }
                return;
            }

            alert('Luu diem cho nhieu bai tap thanh cong!');
            if (onSuccess) await onSuccess();
            handleClose();
        } catch (error) {
            console.error('Lỗi khi lưu điểm nhiều bài tập:', error);
            alert(getReadableErrorMessage(error, 'Không thể lưu điểm cho nhiều bài tập!'));
        } finally {
            isSavingScoresRef.current = false;
            setLoading(false);
        }
    };

    const handleToggleBulkAssignmentSelection = (endpoint: string) => {
        setBulkAssignmentDrafts((previousDrafts) =>
            previousDrafts.map((draft) =>
                draft.endpoint === endpoint
                    ? { ...draft, selected: !draft.selected }
                    : draft
            )
        );
    };

    const handleBulkAssignmentNameChange = (endpoint: string, name: string) => {
        setBulkAssignmentDrafts((previousDrafts) =>
            previousDrafts.map((draft) =>
                draft.endpoint === endpoint
                    ? { ...draft, name }
                    : draft
            )
        );
    };

    const handleSelectAllBulkAssignments = () => {
        setBulkAssignmentDrafts((previousDrafts) =>
            previousDrafts.map((draft) => ({ ...draft, selected: true }))
        );
    };

    const handleClearBulkAssignments = () => {
        setBulkAssignmentDrafts((previousDrafts) =>
            previousDrafts.map((draft) => ({ ...draft, selected: false }))
        );
    };

    const handleResetBulkAssignmentNames = () => {
        setBulkAssignmentDrafts((previousDrafts) =>
            previousDrafts.map((draft) => ({ ...draft, name: draft.displayName }))
        );
    };

    const handleToggleManageAssignmentSelection = (assignment: Assignment) => {
        if (assignmentSubmitLoading || !assignment.isActive) return;

        setManageSelectedAssignmentIds((prev) =>
            prev.includes(assignment.id)
                ? prev.filter((id) => id !== assignment.id)
                : [...prev, assignment.id]
        );
    };

    const handleSelectAllManageAssignments = () => {
        if (assignmentSubmitLoading) return;
        setManageSelectedAssignmentIds(
            manageableActiveAssignments.map((assignment) => assignment.id)
        );
    };

    const handleClearManageAssignments = () => {
        if (assignmentSubmitLoading) return;
        setManageSelectedAssignmentIds([]);
    };

    const handleDeactivateSelectedAssignments = async () => {
        if (assignmentSubmitLoading) return;

        const selectedActiveAssignments = manageableActiveAssignments.filter((assignment) =>
            manageSelectedAssignmentIds.includes(assignment.id)
        );

        if (selectedActiveAssignments.length === 0) {
            alert('Vui lòng chọn ít nhất 1 bài tập đang dùng.');
            return;
        }

        const confirmed = confirm(
            `Bạn có chắc muốn bỏ hoạt động ${selectedActiveAssignments.length} bài tập đã chọn?`
        );
        if (!confirmed) return;

        setAssignmentSubmitLoading(true);
        try {
            const results = await Promise.allSettled(
                selectedActiveAssignments.map((assignment) =>
                    assignmentService.update(assignment.id, { isActive: false }, getAccessToken)
                )
            );

            const updatedAssignments: Assignment[] = [];
            const failedAssignments: string[] = [];

            results.forEach((result, index) => {
                const sourceAssignment = selectedActiveAssignments[index];
                if (result.status === 'fulfilled') {
                    updatedAssignments.push(result.value);
                    return;
                }

                failedAssignments.push(
                    `${sourceAssignment.name}: ${getReadableErrorMessage(result.reason, 'Không thể bỏ hoạt động bài tập này.')}`
                );
            });

            if (updatedAssignments.length > 0) {
                const updatedIds = new Set(updatedAssignments.map((assignment) => assignment.id));
                const updatedById = new Map(updatedAssignments.map((assignment) => [assignment.id, assignment]));

                setAssignments((prev) => {
                    if (!showInactiveAssignments) {
                        return prev.filter((item) => !updatedIds.has(item.id));
                    }

                    return prev.map((item) => updatedById.get(item.id) || item);
                });
                setMultiAssignmentIds((prev) => prev.filter((id) => !updatedIds.has(id)));
                setMultiAssignmentDraftIds((prev) => prev.filter((id) => !updatedIds.has(id)));
                setManageSelectedAssignmentIds((prev) => prev.filter((id) => !updatedIds.has(id)));
                if (selectedAssignment && updatedIds.has(selectedAssignment)) {
                    setSelectedAssignment('');
                }
            }

            if (failedAssignments.length === 0) {
                alert(`Đã bỏ hoạt động ${updatedAssignments.length} bài tập.`);
                return;
            }

            if (updatedAssignments.length > 0) {
                alert(
                    `Đã bỏ hoạt động ${updatedAssignments.length}/${selectedActiveAssignments.length} bài tập.\nLỗi:\n${failedAssignments.join('\n')}`
                );
                return;
            }

            alert(`Không thể bỏ hoạt động các bài tập đã chọn.\n${failedAssignments.join('\n')}`);
        } catch (error) {
            console.error('Lỗi khi bỏ hoạt động nhiều bài tập:', error);
            alert(getReadableErrorMessage(error, 'Không thể bỏ hoạt động các bài tập đã chọn.'));
        } finally {
            setAssignmentSubmitLoading(false);
        }
    };

    const createBulkAssignmentsFromDrafts = async (
        drafts: BulkAssignmentDraft[],
        options?: { closeOnSuccess?: boolean; practiceLabel?: string }
    ) => {
        if (isCreatingAssignment) {
            return;
        }

        const selectedDrafts = drafts.filter((draft) => draft.selected);
        if (selectedDrafts.length === 0) {
            alert('Vui lòng chọn ít nhất 1 project để tạo bài tập.');
            return;
        }

        const invalidDraft = selectedDrafts.find((draft) => !draft.name.trim());
        if (invalidDraft) {
            alert(`Tên bài tập cho ${invalidDraft.displayName} không được để trống.`);
            return;
        }

        setIsCreatingAssignment(true);
        try {
            const createdAssignments: Assignment[] = [];
            const failedAssignments: string[] = [];
            const sharedDescription = bulkAssignmentDescription.trim();

            for (const draft of selectedDrafts) {
                try {
                    const created = await assignmentService.create(
                        {
                            name: draft.name.trim(),
                            classId,
                            maxScore: draft.maxScore,
                            gradingType: 'auto',
                            gradingApiEndpoint: draft.endpoint,
                            description: sharedDescription || undefined,
                        },
                        getAccessToken
                    );
                    createdAssignments.push(created);
                } catch (error) {
                    failedAssignments.push(
                        `${draft.displayName}: ${getReadableErrorMessage(error, 'Không thể tạo bài tập.')}`
                    );
                }
            }

            if (createdAssignments.length > 0) {
                setAssignments((prev) => [...createdAssignments, ...prev]);
            }

            const practiceSuffix = options?.practiceLabel ? ` cho ${options.practiceLabel}` : '';
            if (failedAssignments.length === 0) {
                alert(`Tạo thành công ${createdAssignments.length} bài tập${practiceSuffix}.`);
                if (options?.closeOnSuccess) {
                    setChooseMode(null);
                }
                return;
            }

            if (createdAssignments.length > 0) {
                alert(
                    `Đã tạo ${createdAssignments.length}/${selectedDrafts.length} bài tập${practiceSuffix}.\nLỗi:\n${failedAssignments.join('\n')}`
                );
                return;
            }

            alert(`Không thể tạo bài tập${practiceSuffix}.\n${failedAssignments.join('\n')}`);
        } finally {
            setIsCreatingAssignment(false);
        }
    };

    const handleCreateBulkAssignments = async () => {
        await createBulkAssignmentsFromDrafts(bulkAssignmentDrafts, { closeOnSuccess: true });
    };

    const handleQuickCreateByPractice = async (practiceCode: PracticeCode) => {
        const practice = PRACTICE_OPTIONS.find((item) => item.code === practiceCode);
        const practiceEndpoints = resolveEndpointsBySubjectAndPractice(gradingEndpoints, newAssignmentSubject, practiceCode);
        const quickDrafts = buildBulkAssignmentDrafts(practiceEndpoints, [], practiceCode)
            .map((draft) => ({ ...draft, selected: true }));

        if (quickDrafts.length === 0) {
            alert(
                `Không có project ${practice?.label || practiceCode} cho môn ${newAssignmentSubject.toUpperCase()}.`
            );
            return;
        }

        await createBulkAssignmentsFromDrafts(quickDrafts, {
            closeOnSuccess: true,
            practiceLabel: `${practice?.label || practiceCode} (${newAssignmentSubject.toUpperCase()})`,
        });
    };

    const handleOpenEditAssignment = (assignment: Assignment) => {
        setEditingAssignment(assignment);
        setAssignmentEditForm({
            name: assignment.name,
            description: assignment.description || '',
            maxScore: assignment.maxScore,
            gradingType: assignment.gradingType,
            gradingApiEndpoint: assignment.gradingApiEndpoint || '',
            isActive: assignment.isActive,
        });
    };

    const handleSaveAssignmentEdit = async () => {
        if (!editingAssignment) return;
        if (!assignmentEditForm.name?.trim()) {
            alert('Vui lòng nhập tên bài tập.');
            return;
        }
        if (assignmentEditForm.gradingType === 'auto' && !assignmentEditForm.gradingApiEndpoint) {
            alert('Bài tập auto phải có đầu chấm điểm.');
            return;
        }

        setAssignmentSubmitLoading(true);
        try {
            const payload: UpdateAssignmentRequest = {
                name: assignmentEditForm.name?.trim(),
                description: assignmentEditForm.description || '',
                maxScore: assignmentEditForm.maxScore,
                gradingType: assignmentEditForm.gradingType,
                gradingApiEndpoint:
                    assignmentEditForm.gradingType === 'auto'
                        ? assignmentEditForm.gradingApiEndpoint || undefined
                        : undefined,
                isActive: assignmentEditForm.isActive,
            };

            const updated = await assignmentService.update(editingAssignment.id, payload, getAccessToken);
            setAssignments((prev) => {
                if (!showInactiveAssignments && !updated.isActive) {
                    return prev.filter((item) => item.id !== updated.id);
                }

                return prev.map((item) => (item.id === updated.id ? updated : item));
            });
            setEditingAssignment(null);
            alert('Cập nhật bài tập thành công.');
        } catch (error) {
            console.error('Lỗi khi cập nhật bài tập:', error);
            alert(error instanceof Error ? error.message : 'Không thể cập nhật bài tập.');
        } finally {
            setAssignmentSubmitLoading(false);
        }
    };

    const handleDeleteAssignment = async (assignment: Assignment) => {
        if (!confirm(`Bạn có chắc muốn xóa bài tập "${assignment.name}"?`)) return;
        setAssignmentSubmitLoading(true);
        try {
            await assignmentService.delete(assignment.id, getAccessToken);
            setAssignments((prev) => {
                if (!showInactiveAssignments) {
                    return prev.filter((item) => item.id !== assignment.id);
                }

                return prev.map((item) =>
                    item.id === assignment.id
                        ? { ...item, isActive: false }
                        : item
                );
            });
            setMultiAssignmentIds((prev) => prev.filter((id) => id !== assignment.id));
            if (selectedAssignment === assignment.id) {
                setSelectedAssignment('');
            }
            alert(showInactiveAssignments ? 'Bài tập đã được ẩn.' : 'Đã xóa bài tập.');
        } catch (error) {
            console.error('Lỗi khi xóa bài tập:', error);
            alert(error instanceof Error ? error.message : 'Không thể xóa bài tập.');
        } finally {
            setAssignmentSubmitLoading(false);
        }
    };

    const scrollRowIntoStudentTable = (row: HTMLTableRowElement) => {
        const scrollContainer = row.closest('[data-student-scroll-container="true"]') as HTMLElement | null;
        if (!scrollContainer) {
            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const stickyHeader = scrollContainer.querySelector('thead.sticky') as HTMLElement | null;
        const stickyHeaderHeight = stickyHeader?.getBoundingClientRect().height ?? 0;
        const padding = 12;

        const currentScrollTop = scrollContainer.scrollTop;
        const containerRect = scrollContainer.getBoundingClientRect();
        const rowRect = row.getBoundingClientRect();
        const rowTop = rowRect.top - containerRect.top + currentScrollTop;
        const rowBottom = rowTop + rowRect.height;

        const visibleTop = currentScrollTop + stickyHeaderHeight + padding;
        const visibleBottom = currentScrollTop + scrollContainer.clientHeight - padding;

        let nextScrollTop = currentScrollTop;
        if (rowTop < visibleTop) {
            nextScrollTop = rowTop - stickyHeaderHeight - padding;
        } else if (rowBottom > visibleBottom) {
            nextScrollTop = rowBottom - scrollContainer.clientHeight + padding;
        }

        scrollContainer.scrollTo({
            top: Math.max(0, nextScrollTop),
            behavior: 'smooth',
        });
    };

    const focusMatchedStudent = (matchedIds: string[], index: number) => {
        if (matchedIds.length === 0 || index < 0 || index >= matchedIds.length) return;
        const studentId = matchedIds[index];
        const student = gradingStudents.find((item) => item.id === studentId);
        const row = rowRefs.current.get(studentId);
        if (row) {
            scrollRowIntoStudentTable(row);
            row.classList.add('ring-2', 'ring-blue-300');
            window.setTimeout(() => row.classList.remove('ring-2', 'ring-blue-300'), 1200);
        }

        if (student) {
            setStudentSearchHint(
                `Đã cuộn tới kết quả ${index + 1}/${matchedIds.length}: ${student.middleName} ${student.firstName}`
            );
        }
    };

    const buildMatchedStudentIds = (keyword: string): string[] =>
        gradingStudents
            .filter((student) => {
                const fullName = normalizeText(`${student.middleName} ${student.firstName}`);
                const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const keywordPattern = new RegExp(`(^|\\s)${escapedKeyword}(\\s|$)`, 'i');
                return keywordPattern.test(fullName);
            })
            .map((student) => student.id);

    const scrollToStudentByKeyword = () => {
        const keyword = normalizeText(studentSearchQuery);
        if (!keyword) {
            setStudentSearchHint('Vui lòng nhập tên học sinh cần tìm.');
            setStudentSearchMatchedIds([]);
            setStudentSearchMatchIndex(-1);
            setLastStudentSearchKeyword('');
            return;
        }

        const isSameKeyword = keyword === lastStudentSearchKeyword && studentSearchMatchedIds.length > 0;
        if (isSameKeyword) {
            const nextIndex = (studentSearchMatchIndex + 1) % studentSearchMatchedIds.length;
            setStudentSearchMatchIndex(nextIndex);
            focusMatchedStudent(studentSearchMatchedIds, nextIndex);
            return;
        }

        const matchedIds = buildMatchedStudentIds(keyword);
        if (matchedIds.length === 0) {
            setStudentSearchHint(`Không tìm thấy học sinh phù hợp với từ khóa "${studentSearchQuery}".`);
            setStudentSearchMatchedIds([]);
            setStudentSearchMatchIndex(-1);
            setLastStudentSearchKeyword(keyword);
            return;
        }

        setStudentSearchMatchedIds(matchedIds);
        setStudentSearchMatchIndex(0);
        setLastStudentSearchKeyword(keyword);
        focusMatchedStudent(matchedIds, 0);
    };

    const moveToMatchedStudent = (direction: -1 | 1) => {
        if (studentSearchMatchedIds.length === 0) {
            scrollToStudentByKeyword();
            return;
        }

        const length = studentSearchMatchedIds.length;
        const current = studentSearchMatchIndex >= 0 ? studentSearchMatchIndex : 0;
        const nextIndex = (current + direction + length) % length;
        setStudentSearchMatchIndex(nextIndex);
        focusMatchedStudent(studentSearchMatchedIds, nextIndex);
    };

    const handleClose = () => {
        resetModalState();
        onClose();
    };

    // ============ RENDER FUNCTIONS ============
    const renderModeSelector = () => (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12">
            <h3 className="text-xl font-semibold text-gray-700">Bạn muốn làm gì?</h3>
            <div className="flex flex-col gap-4">
                <button
                    onClick={() => setChooseMode('new')}
                    className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 flex items-center gap-3 shadow-md transition"
                >
                    <Plus size={24} />
                    Tạo bài chấm mới
                </button>
                <button
                    onClick={() => {
                        setChooseMode('existing-multi');
                        setMultiAssignmentIds([]);
                        setMultiAssignmentDraftIds([]);
                        setMultiScores(new Map());
                        setMultiAutoStates(new Map());
                        setMultiUndoSnapshots(new Map());
                    }}
                    disabled={activeAutoAssignments.length === 0}
                    title={
                        activeAutoAssignments.length === 0
                            ? 'Chua co bai tap tu dong dang hoat dong. Hay vao Quan ly bai tap de kich hoat.'
                            : undefined
                    }
                    className="bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-700 flex items-center gap-3 shadow-md transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Save size={24} />
                    Chấm nhiều bài tự động
                </button>
                <button
                    onClick={() => setChooseMode('manage')}
                    className="bg-amber-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-amber-700 flex items-center gap-3 shadow-md transition"
                >
                    <Pencil size={24} />
                    Quản lý bài tập
                </button>
            </div>
        </div>
    );

    const renderNewAssignmentForm = () => (
        <div className="flex-1 overflow-y-auto p-6">
            <button
                onClick={() => setChooseMode(null)}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 mb-4"
            >
                <ArrowLeft size={16} /> Quay lại
            </button>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-semibold mb-4 text-lg">Tạo nhanh bài tập theo môn và phần</h3>

                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chọn môn *
                    </label>
                    <select
                        value={newAssignmentSubject}
                        onChange={(e) => setNewAssignmentSubject(e.target.value as SubjectCode)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                        {SUBJECT_OPTIONS.map((subject) => (
                            <option key={subject.code} value={subject.code}>
                                {subject.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chọn phần *
                    </label>
                    <select
                        value={newAssignmentPracticeCode}
                        onChange={(e) => setNewAssignmentPracticeCode(e.target.value as PracticeCode)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                        {PRACTICE_OPTIONS.map((practice) => (
                            <option key={practice.code} value={practice.code}>
                                {practice.label}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-600 mt-1">
                        Hệ thống sẽ lấy danh sách project của môn và phần đã chọn, rồi điền sẵn tên theo project.
                    </p>
                    {newAssignmentPracticeCode === 'exam_review' && (
                        <p className="text-xs text-indigo-700 mt-1">
                            Ôn thi dùng nhóm project: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24.
                        </p>
                    )}
                </div>

                <div className="mb-4 rounded-md border border-indigo-200 bg-indigo-50 p-3">
                    <p className="text-xs font-semibold text-indigo-900">
                        Tạo nhanh từng phần ({newAssignmentSubject.toUpperCase()})
                    </p>
                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {PRACTICE_OPTIONS.map((practice) => {
                            const practiceEndpoints = resolveEndpointsBySubjectAndPractice(
                                gradingEndpoints,
                                newAssignmentSubject,
                                practice.code
                            );
                            const hasProjects = practiceEndpoints.length > 0;

                            return (
                                <button
                                    key={`quick-create-${practice.code}`}
                                    type="button"
                                    onClick={() => void handleQuickCreateByPractice(practice.code)}
                                    disabled={isCreatingAssignment || !hasProjects}
                                    className="rounded-md border border-indigo-300 bg-white px-3 py-2 text-left text-xs font-medium text-indigo-800 hover:bg-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <div>{practice.label}</div>
                                    <div className="mt-1 text-[11px] text-indigo-600">
                                        {hasProjects ? `${practiceEndpoints.length} project` : 'Chưa có project'}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mô tả dùng chung (tuỳ chọn)
                    </label>
                    <textarea
                        value={bulkAssignmentDescription}
                        onChange={(e) => setBulkAssignmentDescription(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        rows={2}
                        placeholder="Nội dung này sẽ áp dụng cho tất cả bài được tạo nhanh."
                    />
                </div>

                <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h4 className="text-sm font-semibold text-emerald-800">Danh sách project sẽ tạo</h4>
                            <p className="text-xs text-emerald-700 mt-1">
                                Bạn có thể bỏ chọn project không cần tạo và đổi tên từng bài trước khi lưu.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handleSelectAllBulkAssignments}
                                disabled={isCreatingAssignment || bulkAssignmentDrafts.length === 0}
                                className="px-2.5 py-1 text-xs rounded-md border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                            >
                                Chọn tất cả
                            </button>
                            <button
                                type="button"
                                onClick={handleClearBulkAssignments}
                                disabled={isCreatingAssignment || bulkAssignmentDrafts.length === 0}
                                className="px-2.5 py-1 text-xs rounded-md border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                            >
                                Bỏ chọn
                            </button>
                            <button
                                type="button"
                                onClick={handleResetBulkAssignmentNames}
                                disabled={isCreatingAssignment || bulkAssignmentDrafts.length === 0}
                                className="px-2.5 py-1 text-xs rounded-md border border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                            >
                                Reset tên theo Project
                            </button>
                        </div>
                    </div>

                    {bulkAssignmentDrafts.length === 0 ? (
                        <p className="mt-3 text-xs text-amber-700">
                            Practice này chưa có project khả dụng để tạo nhanh.
                        </p>
                    ) : (
                        <div className="mt-3 overflow-x-auto rounded-md border border-emerald-100 bg-white">
                            <table className="min-w-full divide-y divide-emerald-100">
                                <thead className="bg-emerald-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-emerald-800">Chọn</th>
                                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-emerald-800">Project</th>
                                        <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase text-emerald-800">Tên bài tập</th>
                                        <th className="px-3 py-2 text-center text-[11px] font-semibold uppercase text-emerald-800">Điểm tối đa</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-50">
                                    {bulkAssignmentDrafts.map((draft) => (
                                        <tr key={draft.endpoint}>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="checkbox"
                                                    checked={draft.selected}
                                                    onChange={() => handleToggleBulkAssignmentSelection(draft.endpoint)}
                                                    disabled={isCreatingAssignment}
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-700">{draft.displayName}</td>
                                            <td className="px-3 py-2">
                                                <input
                                                    type="text"
                                                    value={draft.name}
                                                    onChange={(e) =>
                                                        handleBulkAssignmentNameChange(draft.endpoint, e.target.value)
                                                    }
                                                    disabled={isCreatingAssignment}
                                                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                                                    placeholder="Nhập tên bài tập"
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-center text-sm text-gray-700">{draft.maxScore}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="mt-3">
                        <button
                            type="button"
                            onClick={handleCreateBulkAssignments}
                            disabled={isCreatingAssignment || selectedBulkAssignmentCount === 0}
                            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isCreatingAssignment ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Đang tạo nhiều bài...
                                </>
                            ) : (
                                <>
                                    <Plus size={16} />
                                    Tạo nhanh {selectedBulkAssignmentCount} bài đã chọn
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderGradingTable = () => {
        if (!selectedAssignment) return null;

        const selectedAssignmentData = assignments.find((a) => a.id === selectedAssignment);

        return (
            <div
                data-student-scroll-container="true"
                className="max-h-[55vh] overflow-auto rounded-md border border-gray-200"
            >
                <table className="min-w-full divide-y divide-gray-200">
                    <caption className="caption-top pb-2 text-left text-sm font-semibold text-gray-700">
                        Bảng chấm điểm học sinh
                    </caption>
                    <thead className="sticky top-0 z-10 bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học sinh</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">File bài làm</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Điểm</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {gradingStudents.map((student, index) => {
                            const state = studentGradingStates.get(student.id);
                            const autoErrors = state?.autoGradingErrors || extractAutoGradingErrors(state?.gradingResult || null);
                            const canUndoSingle =
                                singleUndoSnapshots.has(student.id) ||
                                Boolean(
                                    state?.studentFile ||
                                    state?.gradingResult ||
                                    state?.error ||
                                    state?.manualScore !== null
                                );
                            return (
                                <tr
                                    key={student.id}
                                    ref={(node) => {
                                        if (node) rowRefs.current.set(student.id, node);
                                        else rowRefs.current.delete(student.id);
                                    }}
                                    className="hover:bg-gray-50"
                                >
                                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {student.middleName} {student.firstName}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div
                                            className={`rounded-md border border-dashed p-2 transition ${
                                                singleDragOverStudentId === student.id
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-300 bg-gray-50'
                                            } ${state?.isGrading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                            onDragOver={(e) =>
                                                handleStudentFileDragOver(student.id, Boolean(state?.isGrading), e)
                                            }
                                            onDragLeave={() => handleStudentFileDragLeave(student.id)}
                                            onDrop={(e) =>
                                                handleStudentFileDrop(student.id, Boolean(state?.isGrading), e)
                                            }
                                        >
                                            <input
                                                id={`single-file-${student.id}`}
                                                type="file"
                                                accept={getAcceptedSubmissionFileTypes(selectedAssignmentData?.gradingApiEndpoint)}
                                                onChange={(e) => handleStudentFileChange(student.id, e)}
                                                disabled={state?.isGrading}
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor={`single-file-${student.id}`}
                                                className={`inline-flex px-2 py-1 rounded text-xs border ${
                                                    state?.isGrading
                                                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                        : 'bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100'
                                                }`}
                                            >
                                                {state?.studentFile ? 'Đổi file bài làm' : 'Chọn file bài làm'}
                                            </label>
                                            <p className="mt-1 text-[11px] text-gray-500">
                                                Kéo thả file vào đây
                                            </p>
                                            {state?.studentFile && (
                                                <p className="text-xs text-gray-600 mt-1 truncate">
                                                    {state.studentFile.name}
                                                </p>
                                            )}
                                            {canUndoSingle && (
                                                <button
                                                    type="button"
                                                    onClick={() => void handleUndoSingleStudentFile(student.id)}
                                                    disabled={Boolean(state?.isGrading) || undoingSingleStudentId === student.id}
                                                    className="mt-2 inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {undoingSingleStudentId === student.id ? 'Đang hoàn tác...' : 'Hoàn tác file vừa chọn'}
                                                </button>
                                            )}
                                            {renderAutoErrorDropdown(autoErrors, state?.gradingResult || null)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {state?.isGrading ? (
                                            <Loader2 className="animate-spin mx-auto" size={20} />
                                        ) : (
                                            <input
                                                type="number"
                                                value={state?.manualScore ?? ''}
                                                readOnly
                                                className="w-20 border border-gray-300 rounded-md px-2 py-1 text-center bg-gray-50"
                                                min="0"
                                                max={selectedAssignmentData?.maxScore || 10}
                                                step="0.01"
                                                placeholder="0"
                                            />
                                        )}
                                        {state?.gradingResult && (
                                            <p className="text-xs text-green-600 mt-1">Đã chấm tự động</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {state?.isGrading ? (
                                            <span className="text-blue-600 text-sm">Đang chấm...</span>
                                        ) : state?.error ? (
                                            <span className="text-red-600 text-sm flex items-center gap-1 justify-center">
                                                <XCircle size={16} />
                                                Lỗi
                                            </span>
                                        ) : state?.gradingResult ? (
                                            <span className="text-green-600 text-sm flex items-center gap-1 justify-center">
                                                <CheckCircle size={16} />
                                                Hoàn thành
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">Chờ file</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderExistingMode = () => (
        <div className="flex-1 overflow-y-auto p-6">
            <button
                onClick={() => {
                    setChooseMode(null);
                    setSelectedAssignment('');
                }}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 mb-4"
            >
                <ArrowLeft size={16} /> Quay lại
            </button>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chọn bài tập
                </label>
                <select
                    value={selectedAssignment}
                    onChange={(e) => setSelectedAssignment(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                    <option value="">-- Chọn bài tập --</option>
                    {activeAutoAssignments.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name} (Tự động)
                        </option>
                    ))}
                </select>
            </div>

            <div className="sticky top-0 z-30 mb-4 rounded-md border border-gray-200 bg-gray-50 p-3 shadow-sm">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm học sinh và cuộn tới vị trí trong bảng
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={studentSearchQuery}
                            onChange={(e) => {
                                setStudentSearchQuery(e.target.value);
                                if (studentSearchHint) setStudentSearchHint('');
                                setStudentSearchMatchedIds([]);
                                setStudentSearchMatchIndex(-1);
                                setLastStudentSearchKeyword('');
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    scrollToStudentByKeyword();
                                }
                            }}
                            placeholder="Nhập tên học sinh..."
                            className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => moveToMatchedStudent(-1)}
                            className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                            Trước
                        </button>
                        <button
                            type="button"
                            onClick={scrollToStudentByKeyword}
                            className="inline-flex items-center justify-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            <Search size={14} />
                            Tìm / Kế tiếp
                        </button>
                        <button
                            type="button"
                            onClick={() => moveToMatchedStudent(1)}
                            className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                            Sau
                        </button>
                    </div>
                </div>
                {studentSearchHint && (
                    <p className="mt-2 text-xs text-blue-700">{studentSearchHint}</p>
                )}
            </div>

            {selectedAssignment && (
                <div className="mb-4 p-3 rounded-md border border-blue-100 bg-blue-50">
                    <input
                        id="bulk-single-assignment-upload"
                        type="file"
                        accept={getAcceptedSubmissionFileTypes(assignments.find((a) => a.id === selectedAssignment)?.gradingApiEndpoint)}
                        multiple
                        onChange={handleBulkStudentFilesChange}
                        className="hidden"
                        disabled={isBulkUploading}
                    />
                    <label
                        htmlFor="bulk-single-assignment-upload"
                        className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm border ${
                            isBulkUploading
                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                : 'bg-white text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100'
                        }`}
                    >
                        {isBulkUploading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Đang chấm nhiều file...
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                Chọn nhiều file 1 lần
                            </>
                        )}
                    </label>
                    <p className="mt-2 text-xs text-blue-700">
                        Hệ thống ghép file theo thứ tự danh sách học sinh trên bảng: file 1 -&gt; học sinh 1, file 2 -&gt; học sinh 2...
                    </p>
                </div>
            )}

            {selectedAssignment && renderGradingTable()}
        </div>
    );

    const renderExistingMultiMode = () => {
        const autoAssignments = activeAutoAssignments;
        const normalizedQuery = multiAssignmentQuery.trim().toLowerCase();
        const filteredAutoAssignments = autoAssignments.filter((assignment) => {
            if (!normalizedQuery) return true;

            const haystack = `${assignment.name} ${assignment.description || ''} ${assignment.gradingApiEndpoint || ''}`
                .toLowerCase();
            return haystack.includes(normalizedQuery);
        });
        const selectedAssignments = multiAssignmentIds
            .map((id) => autoAssignments.find((a) => a.id === id))
            .filter((a): a is Assignment => Boolean(a));
        const assignmentNameById = new Map(autoAssignments.map((assignment) => [assignment.id, assignment.name]));
        const studentNameById = new Map(
            gradingStudents.map((student) => [student.id, `${student.middleName} ${student.firstName}`.trim()])
        );

        return (
            <div className="flex-1 overflow-y-auto p-6">
                <button
                    onClick={() => {
                        setChooseMode(null);
                        setMultiAssignmentIds([]);
                        setMultiAssignmentDraftIds([]);
                        setMultiScores(new Map());
                        setMultiAutoStates(new Map());
                        setMultiUndoSnapshots(new Map());
                        setPendingManualMultiFileMatches([]);
                        setIsApplyingManualMultiFileMatches(false);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 mb-4"
                >
                    <ArrowLeft size={16} /> Quay lai
                </button>

                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <label className="block text-sm font-semibold text-gray-800">
                                Chọn các bài tập cần chấm
                            </label>
                            <p className="text-xs text-gray-600 mt-1">
                                Đang chọn {multiAssignmentDraftIds.length}/{autoAssignments.length} bài tự động
                            </p>
                            <p className="text-xs text-emerald-700 mt-1">
                                Đã chốt {multiAssignmentIds.length} bài để hiển thị trong bảng chấm điểm
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleSelectAllAutoAssignments}
                                disabled={isSelectingAssignments || autoAssignments.length === 0}
                                className="px-3 py-1.5 text-xs rounded-md border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50"
                            >
                                Chọn tất cả
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAutoAssignments}
                                disabled={isSelectingAssignments || multiAssignmentDraftIds.length === 0}
                                className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
                            >
                                Bỏ chọn
                            </button>
                            <button
                                type="button"
                                onClick={handleCommitMultiAssignmentSelection}
                                disabled={isSelectingAssignments || !hasPendingMultiAssignmentSelectionChanges}
                                className="px-3 py-1.5 text-xs rounded-md border border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50 disabled:opacity-50"
                            >
                                Chốt danh sách
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={multiAssignmentQuery}
                            onChange={(e) => setMultiAssignmentQuery(e.target.value)}
                            placeholder="Tìm theo tên bài tập, mô tả, đường dẫn API..."
                            className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        />
                    </div>

                    
                    <div className="mt-3">
                        <p className="mb-2 text-xs font-semibold text-gray-700">
                            Chọn nhanh theo phần
                        </p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                            {QUICK_SELECT_PRACTICE_OPTIONS.map((practice) => {
                                const practiceCode = practice.code as PracticeCode;
                                const practiceAssignmentIds = activeAutoAssignmentIdsByPractice[practiceCode] || [];
                                const selectedCount = practiceAssignmentIds.filter((id) =>
                                    multiAssignmentDraftIds.includes(id)
                                ).length;
                                const totalCount = practiceAssignmentIds.length;
                                const hasAssignments = totalCount > 0;
                                const isAllSelected = hasAssignments && selectedCount === totalCount;
                                const isPartiallySelected = selectedCount > 0 && !isAllSelected;

                                return (
                                    <button
                                        key={`quick-select-${practice.code}`}
                                        type="button"
                                        onClick={() => handleToggleQuickPracticeSelection(practiceCode)}
                                        disabled={isSelectingAssignments || !hasAssignments}
                                        className={`flex items-center justify-between rounded-md border px-3 py-2 text-left text-xs transition ${
                                            isAllSelected
                                                ? 'border-blue-300 bg-blue-50 text-blue-800'
                                                : isPartiallySelected
                                                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                                                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                        } ${isSelectingAssignments || !hasAssignments ? 'cursor-not-allowed opacity-60' : ''}`}
                                    >
                                        <span className="font-semibold">{practice.label}</span>
                                        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-medium">
                                            {selectedCount}/{totalCount}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {isSelectingAssignments && (
                        <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                            <Loader2 size={13} className="animate-spin" />
                            Đang chốt danh sách bài tập...
                        </div>
                    )}
                    {!isSelectingAssignments && hasPendingMultiAssignmentSelectionChanges && (
                        <div className="mt-2 text-xs text-amber-700">
                            Bạn vừa thay đổi danh sách chọn. Bấm <span className="font-semibold">Chốt danh sách</span> để áp dụng vào bảng chấm điểm.
                        </div>
                    )}

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {filteredAutoAssignments.map((assignment) => {
                            const isSelected = multiAssignmentDraftIds.includes(assignment.id);
                            return (
                                <button
                                    key={assignment.id}
                                    type="button"
                                    onClick={() => handleToggleMultiAssignmentSelection(assignment.id)}
                                    disabled={isSelectingAssignments}
                                    className={`text-left rounded-md border p-3 transition ${
                                        isSelected
                                            ? 'border-blue-400 bg-blue-50'
                                            : 'border-gray-200 bg-white hover:border-gray-300'
                                    } ${isSelectingAssignments ? 'opacity-60 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{assignment.name}</p>
                                            {assignment.description && (
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{assignment.description}</p>
                                            )}
                                            {assignment.gradingApiEndpoint && (
                                                <p className="text-[11px] text-gray-500 mt-1">{assignment.gradingApiEndpoint}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                                /{assignment.maxScore}
                                            </span>
                                            {isSelected && (
                                                <span className="inline-flex items-center gap-1 text-[11px] text-blue-700">
                                                    <Check size={12} />
                                                    Đã chọn
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {filteredAutoAssignments.length === 0 && (
                        <div className="mt-3 text-sm text-gray-500">
                            Không tìm thấy bài tập phù hợp với từ khóa "{multiAssignmentQuery}".
                        </div>
                    )}
                </div>

                {pendingManualMultiFileMatches.length > 0 && (
                    <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm font-semibold text-amber-900">File cần chọn tay</p>
                                <p className="text-xs text-amber-800">
                                    {pendingManualMultiFileMatches.length} file chưa xác định được cột bài tập.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleApplyAllPendingManualMultiFileMatches}
                                    disabled={isApplyingManualMultiFileMatches}
                                    className="rounded-md border border-emerald-300 bg-white px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
                                >
                                    {isApplyingManualMultiFileMatches ? 'Đang gán...' : 'Gán tất cả đã chọn'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPendingManualMultiFileMatches([])}
                                    disabled={isApplyingManualMultiFileMatches}
                                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Xóa danh sách
                                </button>
                            </div>
                        </div>

                        <div className="mt-3 space-y-2">
                            {pendingManualMultiFileMatches.map((item, index) => {
                                const studentName = studentNameById.get(item.studentId) || item.studentId;
                                return (
                                    <div
                                        key={item.id}
                                        className="rounded-md border border-amber-200 bg-white p-2"
                                    >
                                        <p className="text-xs font-medium text-gray-800">
                                            {index + 1}. {item.file.name} - {studentName}
                                        </p>
                                        <p className="mt-1 text-[11px] text-amber-800">{item.reason}</p>
                                        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                                            <select
                                                value={item.selectedAssignmentId}
                                                onChange={(event) =>
                                                    handlePendingManualMultiFileAssignmentChange(
                                                        item.id,
                                                        event.target.value
                                                    )
                                                }
                                                disabled={isApplyingManualMultiFileMatches}
                                                className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs sm:w-72"
                                            >
                                                <option value="">-- Chọn cột bài tập --</option>
                                                {item.candidateAssignmentIds.map((candidateId) => (
                                                    <option key={`${item.id}-${candidateId}`} value={candidateId}>
                                                        {assignmentNameById.get(candidateId) || candidateId}
                                                    </option>
                                                ))}
                                            </select>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleApplyPendingManualMultiFileMatch(item.id)}
                                                    disabled={
                                                        isApplyingManualMultiFileMatches
                                                        || !item.selectedAssignmentId
                                                    }
                                                    className="rounded-md border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                                                >
                                                    Gán file
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePendingManualMultiFileMatch(item.id)}
                                                    disabled={isApplyingManualMultiFileMatches}
                                                    className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                                >
                                                    Bỏ
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="sticky top-0 z-30 mb-4 rounded-md border border-gray-200 bg-gray-50 p-3 shadow-sm">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tìm học sinh và cuộn tới vị trí trong bảng
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={studentSearchQuery}
                                onChange={(e) => {
                                    setStudentSearchQuery(e.target.value);
                                    if (studentSearchHint) setStudentSearchHint('');
                                    setStudentSearchMatchedIds([]);
                                    setStudentSearchMatchIndex(-1);
                                    setLastStudentSearchKeyword('');
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        scrollToStudentByKeyword();
                                    }
                                }}
                                placeholder="Nhập tên học sinh..."
                                className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => moveToMatchedStudent(-1)}
                                className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                                Trước
                            </button>
                            <button
                                type="button"
                                onClick={scrollToStudentByKeyword}
                                className="inline-flex items-center justify-center gap-1 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                            >
                                <Search size={14} />
                                Tìm / Kế tiếp
                            </button>
                            <button
                                type="button"
                                onClick={() => moveToMatchedStudent(1)}
                                className="inline-flex items-center justify-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                    {studentSearchHint && (
                        <p className="mt-2 text-xs text-blue-700">{studentSearchHint}</p>
                    )}
                </div>

                {selectedAssignments.length > 0 ? (
                    <div
                        data-student-scroll-container="true"
                        className="max-h-[55vh] overflow-auto rounded-md border border-gray-200"
                    >
                        <table className="min-w-full divide-y divide-gray-200">
                            <caption className="caption-top pb-2 text-left text-sm font-semibold text-gray-700">
                                Bảng chấm điểm nhiều bài tập
                            </caption>
                            <thead className="sticky top-0 z-10 bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Học sinh</th>
                                    {selectedAssignments.map((assignment) => (
                                        <th
                                            key={assignment.id}
                                            className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase"
                                        >
                                            {assignment.name} (/{assignment.maxScore})
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {gradingStudents.map((student, index) => {
                                    return (
                                        <tr
                                            key={student.id}
                                            ref={(node) => {
                                                if (node) rowRefs.current.set(student.id, node);
                                                else rowRefs.current.delete(student.id);
                                            }}
                                            className="hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 align-top">
                                                <div>{student.middleName} {student.firstName}</div>
                                                <p className="mt-1 text-[11px] text-gray-500">
                                                    Kéo nhiều file để tự nhận diện theo mã project (tên file/Title); file không chắc chắn sẽ yêu cầu chọn tay.
                                                </p>
                                            </td>
                                            {selectedAssignments.map((assignment) => {
                                                const assignmentMap = multiScores.get(assignment.id);
                                                const current = assignmentMap?.get(student.id);
                                                const autoStateMap = multiAutoStates.get(assignment.id);
                                                const autoState = autoStateMap?.get(student.id);
                                                const cellErrors = current?.autoGradingErrors || extractAutoGradingErrors(autoState?.gradingResult || null);
                                                const undoKey = buildMultiUndoCellKey(assignment.id, student.id);
                                                const canUndoCell =
                                                    multiUndoSnapshots.has(undoKey) ||
                                                    Boolean(
                                                        autoState?.studentFile ||
                                                        autoState?.gradingResult ||
                                                        autoState?.error ||
                                                        current?.scoreValue !== null ||
                                                        (current?.autoGradingErrors?.length || 0) > 0
                                                    );

                                                return (
                                                    <td key={`${student.id}-${assignment.id}`} className="px-4 py-3 text-center align-top">
                                                        <input
                                                            type="number"
                                                            value={current?.scoreValue ?? ''}
                                                            readOnly
                                                            className="w-24 border border-gray-300 rounded-md px-2 py-1 text-center bg-gray-50"
                                                            min="0"
                                                            max={assignment.maxScore}
                                                            step="0.01"
                                                            placeholder="0"
                                                        />
                                                        {assignment.gradingType === 'auto' && (
                                                            <div
                                                                className={`mt-2 space-y-1 rounded-md border border-dashed p-2 transition ${
                                                                    multiDragOverCellKey === `${assignment.id}:${student.id}`
                                                                        ? 'border-blue-500 bg-blue-50'
                                                                        : 'border-gray-200'
                                                                } ${autoState?.isGrading ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                                onDragOver={(e) =>
                                                                    handleMultiStudentFileDragOver(
                                                                        assignment.id,
                                                                        student.id,
                                                                        Boolean(autoState?.isGrading),
                                                                        e
                                                                    )
                                                                }
                                                                onDragLeave={() =>
                                                                    handleMultiStudentFileDragLeave(assignment.id, student.id)
                                                                }
                                                                onDrop={(e) =>
                                                                    handleMultiStudentFileDrop(
                                                                        assignment.id,
                                                                        student.id,
                                                                        Boolean(autoState?.isGrading),
                                                                        e
                                                                    )
                                                                }
                                                            >
                                                                <input
                                                                    id={`multi-file-${assignment.id}-${student.id}`}
                                                                    type="file"
                                                                    accept={getAcceptedSubmissionFileTypes(assignment.gradingApiEndpoint)}
                                                                    onChange={(e) =>
                                                                        handleMultiStudentFileChange(assignment.id, student.id, e)
                                                                    }
                                                                    disabled={autoState?.isGrading}
                                                                    className="hidden"
                                                                />
                                                                <label
                                                                    htmlFor={`multi-file-${assignment.id}-${student.id}`}
                                                                    className={`inline-flex px-2 py-1 rounded text-xs border ${
                                                                        autoState?.isGrading
                                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                            : 'bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100'
                                                                    }`}
                                                                >
                                                                    {autoState?.studentFile ? 'Đổi file bài làm' : 'Chọn file bài làm'}
                                                                </label>
                                                                <p className="text-[11px] text-gray-500">Kéo thả file vào đây</p>
                                                                {autoState?.studentFile && (
                                                                    <p className="text-xs text-gray-600 truncate">
                                                                        {autoState.studentFile.name}
                                                                    </p>
                                                                )}
                                                                {autoState?.isGrading && (
                                                                    <p className="text-xs text-blue-600">Đang chấm...</p>
                                                                )}
                                                                {autoState?.gradingResult && (
                                                                    <p className="text-xs text-green-600">Đã chấm tự động</p>
                                                                )}
                                                                {autoState?.error && (
                                                                    <p className="text-xs text-red-600">Lỗi: {autoState.error}</p>
                                                                )}
                                                                {canUndoCell && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleUndoMultiStudentFile(assignment.id, student.id)}
                                                                        disabled={Boolean(autoState?.isGrading)}
                                                                        className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                    >
                                                                        Hoàn tác
                                                                    </button>
                                                                )}
                                                                {renderAutoErrorDropdown(cellErrors, autoState?.gradingResult || null)}
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-sm text-gray-500">Chưa chọn bài tập nào.</div>
                )}
            </div>
        );
    };

    const renderAssignmentManager = () => (
        <div className="flex-1 overflow-y-auto p-6">
            <button
                onClick={() => {
                    setChooseMode(null);
                    setEditingAssignment(null);
                }}
                className="text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1 mb-4"
            >
                <ArrowLeft size={16} /> Quay lại
            </button>

            <div className="mb-3 flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                    <input
                        type="checkbox"
                        checked={showInactiveAssignments}
                        onChange={(e) => setShowInactiveAssignments(e.target.checked)}
                    />
                    Hiển thị bài tập đã ẩn
                </label>
                <span className="text-xs text-slate-500">
                    Khi tắt, danh sách chỉ hiển thị bài tập đang dùng.
                </span>
            </div>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                <span className="text-sm text-slate-700">
                    Đã chọn {manageSelectedAssignmentIds.length}/{manageableActiveAssignments.length} bài đang dùng
                </span>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSelectAllManageAssignments}
                        disabled={
                            assignmentSubmitLoading ||
                            manageableActiveAssignments.length === 0 ||
                            isAllManageActiveSelected
                        }
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Chọn tất cả
                    </button>
                    <button
                        type="button"
                        onClick={handleClearManageAssignments}
                        disabled={assignmentSubmitLoading || manageSelectedAssignmentIds.length === 0}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Bỏ chọn
                    </button>
                    <button
                        type="button"
                        onClick={handleDeactivateSelectedAssignments}
                        disabled={assignmentSubmitLoading || manageSelectedAssignmentIds.length === 0}
                        className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {assignmentSubmitLoading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                        Bỏ hoạt động đã chọn
                    </button>
                </div>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">
                                <input
                                    type="checkbox"
                                    aria-label="Chọn tất cả bài tập đang dùng"
                                    checked={isAllManageActiveSelected}
                                    onChange={(e) =>
                                        e.target.checked ? handleSelectAllManageAssignments() : handleClearManageAssignments()
                                    }
                                    disabled={assignmentSubmitLoading || manageableActiveAssignments.length === 0}
                                    className="h-4 w-4 rounded border-gray-300 disabled:cursor-not-allowed"
                                />
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Tên bài tập</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Loại</th>
                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Endpoint</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Điểm tối đa</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Trạng thái</th>
                            <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600 uppercase">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                        {assignments.map((assignment) => (
                            <tr key={assignment.id}>
                                <td className="px-3 py-2 text-center">
                                    <input
                                        type="checkbox"
                                        aria-label={`Chọn bài tập ${assignment.name}`}
                                        checked={manageSelectedAssignmentIds.includes(assignment.id)}
                                        onChange={() => handleToggleManageAssignmentSelection(assignment)}
                                        disabled={assignmentSubmitLoading || !assignment.isActive}
                                        className="h-4 w-4 rounded border-gray-300 disabled:cursor-not-allowed"
                                        title={!assignment.isActive ? 'Bài tập đã ẩn' : undefined}
                                    />
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-800">
                                    <div className="font-medium">{assignment.name}</div>
                                    {assignment.description && (
                                        <div className="text-xs text-gray-500">{assignment.description}</div>
                                    )}
                                </td>
                                <td className="px-3 py-2 text-sm text-gray-700">{assignment.gradingType === 'auto' ? 'Tự động' : 'Thủ công'}</td>
                                <td className="px-3 py-2 text-xs text-gray-600">{assignment.gradingApiEndpoint || '-'}</td>
                                <td className="px-3 py-2 text-sm text-center text-gray-700">{assignment.maxScore}</td>
                                <td className="px-3 py-2 text-center">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${assignment.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {assignment.isActive ? 'Đang dùng' : 'Đã ẩn'}
                                    </span>
                                </td>
                                <td className="px-3 py-2 text-center">
                                    <div className="inline-flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEditAssignment(assignment)}
                                            className="inline-flex items-center gap-1 rounded-md bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                                        >
                                            <Pencil size={12} />
                                            Sửa
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteAssignment(assignment)}
                                            disabled={assignmentSubmitLoading}
                                            className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-200 disabled:opacity-60"
                                        >
                                            <Trash2 size={12} />
                                            Xóa
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {assignments.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-3 py-5 text-center text-sm text-gray-500">
                                    Chưa có bài tập nào trong lớp này.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editingAssignment && (
                <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
                    <h4 className="text-sm font-semibold text-blue-800">Chỉnh sửa bài tập</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                            value={assignmentEditForm.name || ''}
                            onChange={(e) => setAssignmentEditForm((prev) => ({ ...prev, name: e.target.value }))}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Tên bài tập"
                        />
                        <input
                            type="number"
                            value={assignmentEditForm.maxScore ?? 10}
                            onChange={(e) => setAssignmentEditForm((prev) => ({ ...prev, maxScore: Number(e.target.value) }))}
                            min={0}
                            max={1000}
                            step={0.01}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                            placeholder="Điểm tối đa"
                        />
                        <select
                            value={assignmentEditForm.gradingType || 'auto'}
                            onChange={(e) =>
                                setAssignmentEditForm((prev) => ({
                                    ...prev,
                                    gradingType: e.target.value as 'auto' | 'manual',
                                    gradingApiEndpoint:
                                        e.target.value === 'manual'
                                            ? ''
                                            : prev.gradingApiEndpoint,
                                }))
                            }
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                        >
                            <option value="auto">Tự động</option>
                            <option value="manual">Thủ công</option>
                        </select>
                        <select
                            value={assignmentEditForm.gradingApiEndpoint || ''}
                            onChange={(e) =>
                                setAssignmentEditForm((prev) => ({ ...prev, gradingApiEndpoint: e.target.value }))
                            }
                            disabled={assignmentEditForm.gradingType === 'manual'}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
                        >
                            <option value="">-- Chọn đầu chấm điểm --</option>
                            {gradingEndpoints.map((ep) => (
                                <option key={ep.endpoint} value={ep.endpoint}>
                                    {ep.displayName}
                                </option>
                            ))}
                        </select>
                        <textarea
                            value={assignmentEditForm.description || ''}
                            onChange={(e) => setAssignmentEditForm((prev) => ({ ...prev, description: e.target.value }))}
                            rows={2}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm md:col-span-2"
                            placeholder="Mô tả bài tập"
                        />
                        <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                            <input
                                type="checkbox"
                                checked={Boolean(assignmentEditForm.isActive)}
                                onChange={(e) =>
                                    setAssignmentEditForm((prev) => ({ ...prev, isActive: e.target.checked }))
                                }
                            />
                            Bài tập đang hoạt động
                        </label>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setEditingAssignment(null)}
                            className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleSaveAssignmentEdit}
                            disabled={assignmentSubmitLoading}
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {assignmentSubmitLoading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                            Lưu cập nhật
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
    if (!isOpen) return null;

    const isPageMode = displayMode === 'page';
    const containerClassName = isPageMode
        ? 'bg-white rounded-lg border border-slate-200 shadow-sm w-full flex flex-col'
        : 'bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col';
    const bodyClassName = isPageMode
        ? 'flex-1'
        : 'flex-1 overflow-y-auto';
    const content = (
        <div className={containerClassName}>
            {/* HEADER */}
            <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                </button>
            </div>

            {/* BODY */}
            <div className={bodyClassName}>
                {chooseMode === null && renderModeSelector()}
                {chooseMode === 'new' && renderNewAssignmentForm()}
                {chooseMode === 'existing' && renderExistingMode()}
                {chooseMode === 'existing-multi' && renderExistingMultiMode()}
                {chooseMode === 'manage' && renderAssignmentManager()}
            </div>

            {/* FOOTER */}
            <div className="flex justify-end gap-2 p-6 border-t">
                <button
                    onClick={handleClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                    {isPageMode ? 'Quay lại' : 'Hủy'}
                </button>
                {chooseMode === 'existing' && selectedAssignment && (
                    <button
                        onClick={handleSaveAllScores}
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Lưu điểm
                            </>
                        )}
                    </button>
                )}
                {chooseMode === 'existing-multi' && multiAssignmentIds.length > 0 && (
                    <button
                        onClick={handleSaveMultipleAssignments}
                        disabled={loading || isSelectingAssignments || hasPendingMultiAssignmentSelectionChanges}
                        title={hasPendingMultiAssignmentSelectionChanges ? 'Vui lòng chốt lại danh sách bài tập trước khi lưu.' : undefined}
                        className="bg-emerald-600 text-white px-4 py-2 rounded-md hover:bg-emerald-700 disabled:bg-gray-400 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Đang lưu...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Lưu nhiều bài
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );

    if (isPageMode) {
        return <div className="w-full">{content}</div>;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            {content}
        </div>
    );
};

export default GradingModal;



