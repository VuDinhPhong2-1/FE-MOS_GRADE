// src/components/GradingModal.optimized.tsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Loader2, ArrowLeft, XCircle, CheckCircle, Upload, Search, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Assignment, CreateAssignmentRequest, GradingEndpointInfo } from '../types/assignment.types';
import type { Student } from '../types/student.types';
import type { GradingResult, StudentGradingState } from '../types/grading.types';
import { assignmentService } from '../services/assignment.service';
import { scoreService } from '../services/score.service';
import { gradingService } from '../services/grading.service';
import "./GradingModal.css";

interface GradingModalProps {
    isOpen: boolean;
    onClose: () => void;
    classId: string;
    students: Student[];
    onSuccess?: () => void;
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

const GradingModal: React.FC<GradingModalProps> = ({
    isOpen,
    onClose,
    classId,
    students,
    onSuccess,
}) => {
    const { getAccessToken } = useAuth();

    // ============ STATE MANAGEMENT ============
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<string>('');
    const [gradingEndpoints, setGradingEndpoints] = useState<GradingEndpointInfo[]>([]);
    const [chooseMode, setChooseMode] = useState<null | 'new' | 'existing' | 'existing-multi'>(null);
    const [loading, setLoading] = useState(false);

    // STATE CHAM DIEM CHO TUNG HOC SINH (DUY NHAT)
    const [studentGradingStates, setStudentGradingStates] = useState<Map<string, StudentGradingState>>(
        new Map()
    );
    const [multiAssignmentIds, setMultiAssignmentIds] = useState<string[]>([]);
    const [multiScores, setMultiScores] = useState<Map<string, Map<string, MultiScoreCellValue>>>(
        new Map()
    );
    const [multiAutoStates, setMultiAutoStates] = useState<Map<string, Map<string, MultiAutoCellState>>>(
        new Map()
    );
    const [singleDragOverStudentId, setSingleDragOverStudentId] = useState<string | null>(null);
    const [multiDragOverCellKey, setMultiDragOverCellKey] = useState<string | null>(null);
    const [multiRowDragOverStudentId, setMultiRowDragOverStudentId] = useState<string | null>(null);
    const [isBulkUploading, setIsBulkUploading] = useState(false);
    const [multiAssignmentQuery, setMultiAssignmentQuery] = useState('');
    const [isSelectingAssignments, setIsSelectingAssignments] = useState(false);

    // TAO BAI TAP MOI
    const [newAssignment, setNewAssignment] = useState<CreateAssignmentRequest>({
        name: '',
        classId: classId,
        maxScore: 10,
        gradingType: 'auto',
    });

    // ============ EFFECTS ============
    useEffect(() => {
        if (isOpen && classId) {
            loadAssignments();
            loadGradingEndpoints();
            resetModalState();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, classId]);

    useEffect(() => {
        if (isOpen && students.length > 0) {
            initializeStudentStates();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, students]);

    useEffect(() => {
        if (selectedAssignment) {
            loadExistingScores(selectedAssignment);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedAssignment]);
    useEffect(() => {
        // Neu dang o che do AUTO va gradingApiEndpoint da duoc chon
        if (newAssignment.gradingApiEndpoint) {
            const selectedProject = gradingEndpoints.find(
                ep => ep.endpoint === newAssignment.gradingApiEndpoint
            );
            // Neu tim thay project, tu dong set maxScore va khong cho user sua
            if (selectedProject) {
                setNewAssignment(prev => ({
                    ...prev,
                    maxScore: selectedProject.maxScore
                }));
            }
        }
    }, [newAssignment.gradingApiEndpoint, gradingEndpoints]);

    // ============ HELPER FUNCTIONS ============
    const resetModalState = () => {
        setChooseMode(null);
        setSelectedAssignment('');
        setStudentGradingStates(new Map());
        setMultiAssignmentIds([]);
        setMultiScores(new Map());
        setMultiAutoStates(new Map());
        setSingleDragOverStudentId(null);
        setMultiDragOverCellKey(null);
        setMultiRowDragOverStudentId(null);
        setIsBulkUploading(false);
        setMultiAssignmentQuery('');
        setIsSelectingAssignments(false);
    };

    const initializeStudentStates = () => {
        const initialStates = new Map<string, StudentGradingState>();
        students.forEach((student) => {
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

    const isValidExcelFileName = (fileName: string): boolean => {
        const validExtensions = ['.xls', '.xlsx', '.xlsm'];
        const normalized = fileName.toLowerCase();
        return validExtensions.some((ext) => normalized.endsWith(ext));
    };

    const validateExcelFile = (file: File, showAlert = true): boolean => {
        const isValid = isValidExcelFileName(file.name);
        if (!isValid) {
            if (showAlert) {
                alert('File phai co dinh dang .xls, .xlsx hoac .xlsm');
            }
        }
        return isValid;
    };

    const getDroppedFile = (event: React.DragEvent<HTMLElement>): File | null => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return null;
        return files[0];
    };

    const normalizeErrorText = (value: string): string => value.replace(/\s+/g, ' ').trim();
    const toDedupKey = (value: string): string =>
        normalizeErrorText(value)
            .toLowerCase()
            .replace(/[.:;!?]+$/g, '');

    const extractAutoGradingErrors = (result: GradingResult | null): string[] => {
        if (!result?.taskResults?.length) return [];

        const messages: string[] = [];
        const seen = new Set<string>();
        result.taskResults.forEach((task, index) => {
            const taskName = normalizeErrorText(task.taskName || '');
            const taskId = normalizeErrorText(task.taskId || '');
            const matchedQuestion =
                taskId.match(/(?:^|[^0-9])T(\d+)(?:[^0-9]|$)/i)?.[1] ||
                taskId.match(/(\d+)/)?.[1] ||
                '';
            const questionLabel = matchedQuestion ? `Cau ${matchedQuestion}` : `Cau ${index + 1}`;
            const label = taskName ? `${questionLabel} - ${taskName}` : questionLabel;

            (task.errors || []).forEach((rawError) => {
                const message = normalizeErrorText(rawError || '');
                if (!message) return;
                const fullMessage = label ? `${label}: ${message}` : message;
                const key = toDedupKey(fullMessage);
                if (seen.has(key)) return;
                seen.add(key);
                messages.push(fullMessage);
            });

            // Fallback cho cac task fail nhung khong co errors[] tu backend.
            if ((!task.errors || task.errors.length === 0) && task.isPassed === false) {
                const detailFallback = normalizeErrorText(task.details?.[0] || '');
                if (detailFallback) {
                    const fullMessage = `${label}: ${detailFallback}`;
                    const key = toDedupKey(fullMessage);
                    if (!seen.has(key)) {
                        seen.add(key);
                        messages.push(fullMessage);
                    }
                }
            }
        });
        return messages;
    };

    const renderAutoErrorDropdown = (errors: string[] | undefined) => {
        const safeErrors = (errors || []).filter((item) => item && item.trim().length > 0);
        if (safeErrors.length === 0) return null;

        return (
            <details className="mt-1 text-left">
                <summary className="cursor-pointer text-[11px] text-amber-700 hover:text-amber-800">
                    Xem loi cham ({safeErrors.length})
                </summary>
                <ul className="mt-1 max-h-28 overflow-auto rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900 list-disc list-inside">
                    {safeErrors.map((item, idx) => (
                        <li key={`${idx}-${item}`}>{item}</li>
                    ))}
                </ul>
            </details>
        );
    };

    const initializeMultiAutoStates = (assignmentIds: string[]) => {
        const autoAssignments = assignments.filter(
            (assignment) => assignmentIds.includes(assignment.id) && assignment.gradingType === 'auto'
        );

        const autoMap = new Map<string, Map<string, MultiAutoCellState>>();
        autoAssignments.forEach((assignment) => {
            const perStudentMap = new Map<string, MultiAutoCellState>();
            students.forEach((student) => {
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
            const data = await assignmentService.getByClass(classId, getAccessToken);
            setAssignments(data);
        } catch (error) {
            console.error('Error loading assignments:', error);
            alert('Khong the tai danh sach bai tap!');
        }
    };

    const loadGradingEndpoints = async () => {
        try {
            const data = await assignmentService.getGradingEndpoints(getAccessToken);
            setGradingEndpoints(data);
        } catch (error) {
            console.error('Error loading grading endpoints:', error);
        }
    };

    const loadExistingScores = async (assignmentId: string) => {
        try {
            const data = await scoreService.getByAssignment(assignmentId, getAccessToken);

            setStudentGradingStates((prev) => {
                const newMap = new Map(prev);
                students.forEach((student) => {
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
            console.error('Error loading scores:', error);
        }
    };

    const loadScoresForMultipleAssignments = async (assignmentIds: string[]) => {
        try {
            initializeMultiAutoStates(assignmentIds);
            const scoreGroups = await Promise.all(
                assignmentIds.map(async (assignmentId) => {
                    const data = await scoreService.getByAssignment(assignmentId, getAccessToken);
                    return { assignmentId, data };
                })
            );

            const nextMap = new Map<string, Map<string, MultiScoreCellValue>>();

            assignmentIds.forEach((assignmentId) => {
                const rowMap = new Map<string, MultiScoreCellValue>();
                students.forEach((student) => {
                    rowMap.set(student.id, { scoreValue: null, feedback: '', autoGradingErrors: [] });
                });
                nextMap.set(assignmentId, rowMap);
            });

            scoreGroups.forEach(({ assignmentId, data }) => {
                const rowMap = nextMap.get(assignmentId);
                if (!rowMap) return;
                data.forEach((item) => {
                    rowMap.set(item.studentId, {
                        scoreValue: typeof item.scoreValue === 'number' ? item.scoreValue : null,
                        feedback: item.feedback || '',
                        autoGradingErrors: item.autoGradingErrors || [],
                    });
                });
            });

            setMultiScores(nextMap);
        } catch (error) {
            console.error('Error loading multiple assignment scores:', error);
            alert('Khong the tai diem cho nhieu bai tap!');
        }
    };

    const applyMultiAssignmentSelection = async (nextIds: string[]) => {
        setIsSelectingAssignments(true);
        try {
            setMultiAssignmentIds(nextIds);
            await loadScoresForMultipleAssignments(nextIds);
        } finally {
            setIsSelectingAssignments(false);
        }
    };

    const handleToggleMultiAssignmentSelection = async (assignmentId: string) => {
        if (isSelectingAssignments) return;

        const nextIds = multiAssignmentIds.includes(assignmentId)
            ? multiAssignmentIds.filter((id) => id !== assignmentId)
            : [...multiAssignmentIds, assignmentId];

        await applyMultiAssignmentSelection(nextIds);
    };

    const handleSelectAllAutoAssignments = async () => {
        if (isSelectingAssignments) return;
        const allAutoIds = assignments
            .filter((a) => a.gradingType === 'auto')
            .map((a) => a.id);

        await applyMultiAssignmentSelection(allAutoIds);
    };

    const handleClearAutoAssignments = async () => {
        if (isSelectingAssignments) return;
        await applyMultiAssignmentSelection([]);
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
            alert('Vui long chon bai tap truoc khi chon nhieu file.');
            return;
        }
        if (isBulkUploading) return;

        setIsBulkUploading(true);
        try {
            const maxCount = Math.min(files.length, students.length);
            const invalidFiles: string[] = [];

            for (let i = 0; i < maxCount; i++) {
                const file = files[i];
                if (!validateExcelFile(file, false)) {
                    invalidFiles.push(file.name);
                    continue;
                }

                // Map theo thu tu danh sach hoc sinh tren bang.
                const student = students[i];
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

        const file = getDroppedFile(e);
        if (!file) return;

        await uploadStudentFile(studentId, file);
    };

    const handleAutoGrade = async (studentId: string, studentFile: File) => {
        if (!selectedAssignment) {
            alert('Vui long chon bai tap truoc khi cham diem.');
            return;
        }
        const selectedAssignmentData = assignments.find((a) => a.id === selectedAssignment);
        const gradingEndpoint =
            selectedAssignmentData?.gradingApiEndpoint || '/grading/project09';

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
                        manualScore: result.totalScore,
                        autoGradingErrors: autoErrors,
                    });
                }
                return newMap;
            });

            if (selectedAssignment) {
                const autoErrors = extractAutoGradingErrors(result);
                await saveScoreForStudent(studentId, result.totalScore, autoErrors);
            }
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Loi khong xac dinh';
            console.error('Loi cham diem:', error);
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
        const skipValidation = options?.skipValidation ?? false;
        if (!skipValidation && !validateExcelFile(file)) {
            return;
        }

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
                        error: 'Khong tim thay gradingApiEndpoint cho bai tap.',
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
            handleMultiScoreChange(assignmentId, studentId, result.totalScore, autoErrors);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Loi khong xac dinh';
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

        const file = getDroppedFile(e);
        if (!file) return;

        await uploadMultiStudentFile(assignmentId, studentId, file);
    };

    const uploadMultipleFilesForOneStudent = async (studentId: string, filesInput: FileList | File[]) => {
        const files = Array.from(filesInput || []);
        if (files.length === 0) return;
        if (isBulkUploading) return;

        const autoAssignments = multiAssignmentIds
            .map((id) => assignments.find((a) => a.id === id))
            .filter((a): a is Assignment => Boolean(a && a.gradingType === 'auto'));

        if (autoAssignments.length === 0) {
            alert('Can chon it nhat 1 bai tap auto de cham nhieu file cho hoc sinh.');
            return;
        }

        setIsBulkUploading(true);
        try {
            const validFiles: File[] = [];
            const invalidFiles: string[] = [];

            files.forEach((file) => {
                if (validateExcelFile(file, false)) {
                    validFiles.push(file);
                } else {
                    invalidFiles.push(file.name);
                }
            });

            const maxCount = Math.min(validFiles.length, autoAssignments.length);
            for (let i = 0; i < maxCount; i++) {
                await uploadMultiStudentFile(autoAssignments[i].id, studentId, validFiles[i], {
                    skipValidation: true,
                });
            }

            const notes: string[] = [];
            if (invalidFiles.length > 0) {
                notes.push(`Bo qua file sai dinh dang: ${invalidFiles.join(', ')}`);
            }
            if (validFiles.length > autoAssignments.length) {
                notes.push(
                    `Bo qua ${validFiles.length - autoAssignments.length} file vi vuot so bai auto da chon.`
                );
            }
            if (validFiles.length < autoAssignments.length) {
                notes.push(
                    `Thieu ${autoAssignments.length - validFiles.length} file de map du cho tat ca bai auto.`
                );
            }

            if (notes.length > 0) {
                alert(notes.join('\n'));
            }
        } finally {
            setIsBulkUploading(false);
        }
    };

    const handleMultiStudentBulkFilesChange = async (
        studentId: string,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        await uploadMultipleFilesForOneStudent(studentId, e.target.files || []);
        e.target.value = '';
    };

    const handleMultiStudentBulkDragOver = (
        studentId: string,
        isDisabled: boolean,
        e: React.DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();
        if (isDisabled || isBulkUploading) return;
        e.dataTransfer.dropEffect = 'copy';
        if (multiRowDragOverStudentId !== studentId) {
            setMultiRowDragOverStudentId(studentId);
        }
    };

    const handleMultiStudentBulkDragLeave = (studentId: string) => {
        if (multiRowDragOverStudentId === studentId) {
            setMultiRowDragOverStudentId(null);
        }
    };

    const handleMultiStudentBulkDrop = async (
        studentId: string,
        isDisabled: boolean,
        e: React.DragEvent<HTMLDivElement>
    ) => {
        e.preventDefault();
        setMultiRowDragOverStudentId(null);
        if (isDisabled || isBulkUploading) return;

        await uploadMultipleFilesForOneStudent(studentId, e.dataTransfer.files || []);
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
        autoGradingErrors: string[] = []
    ) => {
        if (!selectedAssignment) return;
        try {
            await scoreService.bulkCreateOrUpdate(
                {
                    assignmentId: selectedAssignment,
                    classId: classId,
                    scores: [{ studentId, scoreValue, autoGradingErrors }],
                },
                getAccessToken
            );
        } catch (error) {
            console.error('Loi luu diem:', error);
        }
    };

    const handleSaveAllScores = async () => {
        if (!selectedAssignment) {
            alert('Vui long chon bai tap!');
            return;
        }

        setLoading(true);
        try {
            const scores = Array.from(studentGradingStates.values())
                .filter(s => s.manualScore !== null)
                .map(s => ({
                    studentId: s.studentId,
                    scoreValue: s.manualScore!,
                    feedback: s.manualComment,
                    autoGradingErrors: s.autoGradingErrors || extractAutoGradingErrors(s.gradingResult),
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
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error saving scores:', error);
            alert('Khong the luu diem!');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveMultipleAssignments = async () => {
        if (multiAssignmentIds.length === 0) {
            alert('Vui long chon it nhat 1 bai tap!');
            return;
        }

        setLoading(true);
        try {
            for (const assignmentId of multiAssignmentIds) {
                const rowMap = multiScores.get(assignmentId);
                if (!rowMap) continue;

                const scores = Array.from(rowMap.entries())
                    .filter(([, item]) => item.scoreValue !== null)
                    .map(([studentId, item]) => ({
                        studentId,
                        scoreValue: item.scoreValue!,
                        feedback: item.feedback,
                        autoGradingErrors: item.autoGradingErrors || [],
                    }));

                if (scores.length === 0) continue;

                await scoreService.bulkCreateOrUpdate(
                    {
                        assignmentId,
                        classId,
                        scores,
                    },
                    getAccessToken
                );
            }

            alert('Luu diem cho nhieu bai tap thanh cong!');
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error saving multiple assignment scores:', error);
            alert('Khong the luu diem cho nhieu bai tap!');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async () => {
        if (!newAssignment.name.trim()) {
            alert('Vui long nhap ten bai tap!');
            return;
        }
        if (!newAssignment.gradingApiEndpoint) {
            alert('Vui long chon Project de cham diem tu dong!');
            return;
        }

        setLoading(true);
        try {
            const created = await assignmentService.create(newAssignment, getAccessToken);
            setAssignments([created, ...assignments]);
            setChooseMode(null);
            setNewAssignment({
                name: '',
                classId: classId,
                maxScore: 10,
                gradingType: 'auto',
            });
            alert('Tao bai tap thanh cong!');
        } catch (error) {
            console.error('Error creating assignment:', error);
            alert('Khong the tao bai tap!');
        } finally {
            setLoading(false);
        }
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
                {assignments.length > 0 && (
                    <button
                        onClick={async () => {
                            const ids = assignments
                                .filter((a) => a.gradingType === 'auto')
                                .map((a) => a.id);
                            setChooseMode('existing-multi');
                            await applyMultiAssignmentSelection(ids);
                        }}
                        className="bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-700 flex items-center gap-3 shadow-md transition"
                    >
                        <Save size={24} />
                        Chấm nhiều bài tự động
                    </button>
                )}
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
                <h3 className="font-semibold mb-4 text-lg">Tạo bài chấm mới</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên bài tập *
                        </label>
                        <input
                            type="text"
                            value={newAssignment.name}
                            onChange={(e) => setNewAssignment({ ...newAssignment, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Vi du: Bai tap Excel Project 09"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Điểm tối đa
                        </label>
                        <input
                            type="number"
                            value={newAssignment.maxScore}
                            onChange={(e) =>
                                setNewAssignment((prev) => ({
                                    ...prev,
                                    maxScore: Number(e.target.value),
                                }))
                            }
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            min="0"
                            max="100"
                            disabled
                            readOnly
                            style={{ backgroundColor: '#f1f5f9' }}
                        />
                        <span className="text-xs text-blue-600">Diem toi da duoc lay tu dong tu project.</span>
                    </div>

                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Chọn Project *
                        </label>
                        <select
                            value={newAssignment.gradingApiEndpoint || ''}
                            onChange={e => {
                                const selectedEp = gradingEndpoints.find(ep => ep.endpoint === e.target.value);
                                setNewAssignment(prev => ({
                                    ...prev,
                                    gradingType: 'auto',
                                    gradingApiEndpoint: e.target.value,
                                    maxScore: selectedEp ? selectedEp.maxScore : 10
                                }));
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="">-- Chon Project --</option>
                            {gradingEndpoints.map(ep => (
                                <option key={ep.endpoint} value={ep.endpoint}>
                                    {ep.displayName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea
                        value={newAssignment.description || ''}
                        onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        rows={2}
                        placeholder="Mo ta bai tap..."
                    />
                </div>

                <button
                    onClick={handleCreateAssignment}
                    disabled={loading}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Đang tạo...
                        </>
                    ) : (
                        <>
                            <Plus size={18} />
                            Tao bai tap
                        </>
                    )}
                </button>
            </div>
        </div>
    );

    const renderGradingTable = () => {
        if (!selectedAssignment) return null;

        const selectedAssignmentData = assignments.find((a) => a.id === selectedAssignment);

        return (
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ho va ten</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">File bai lam</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Diem</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trang thai</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student, index) => {
                            const state = studentGradingStates.get(student.id);
                            const autoErrors = state?.autoGradingErrors || extractAutoGradingErrors(state?.gradingResult || null);
                            return (
                                <tr key={student.id} className="hover:bg-gray-50">
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
                                                accept=".xls,.xlsx,.xlsm"
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
                                                {state?.studentFile ? 'Doi file bai lam' : 'Chon file bai lam'}
                                            </label>
                                            <p className="mt-1 text-[11px] text-gray-500">
                                                Keo tha file vao day
                                            </p>
                                            {state?.studentFile && (
                                                <p className="text-xs text-gray-600 mt-1 truncate">
                                                    {state.studentFile.name}
                                                </p>
                                            )}
                                            {renderAutoErrorDropdown(autoErrors)}
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
                                                step="0.5"
                                                placeholder="0"
                                            />
                                        )}
                                        {state?.gradingResult && (
                                            <p className="text-xs text-green-600 mt-1">
                                                Auto: {state.gradingResult.totalScore}/{state.gradingResult.maxScore}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {state?.isGrading ? (
                                            <span className="text-blue-600 text-sm">Dang cham...</span>
                                        ) : state?.error ? (
                                            <span className="text-red-600 text-sm flex items-center gap-1 justify-center">
                                                <XCircle size={16} />
                                                Loi
                                            </span>
                                        ) : state?.gradingResult ? (
                                            <span className="text-green-600 text-sm flex items-center gap-1 justify-center">
                                                <CheckCircle size={16} />
                                                Hoan thanh
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">Cho file</span>
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
                    Chon bai tap
                </label>
                <select
                    value={selectedAssignment}
                    onChange={(e) => setSelectedAssignment(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                    <option value="">-- Chon bai tap --</option>
                    {assignments.filter((a) => a.gradingType === 'auto').map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name} (Auto)
                        </option>
                    ))}
                </select>
            </div>

            {selectedAssignment && (
                <div className="mb-4 p-3 rounded-md border border-blue-100 bg-blue-50">
                    <input
                        id="bulk-single-assignment-upload"
                        type="file"
                        accept=".xls,.xlsx,.xlsm"
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
                                Dang cham nhieu file...
                            </>
                        ) : (
                            <>
                                <Upload size={16} />
                                Chon nhieu file 1 lan
                            </>
                        )}
                    </label>
                    <p className="mt-2 text-xs text-blue-700">
                        He thong map file theo thu tu danh sach hoc sinh tren bang: file 1 -&gt; hoc sinh 1, file 2 -&gt; hoc sinh 2...
                    </p>
                </div>
            )}

            {selectedAssignment && renderGradingTable()}
        </div>
    );

    const renderExistingMultiMode = () => {
        const autoAssignments = assignments.filter((a) => a.gradingType === 'auto');
        const normalizedQuery = multiAssignmentQuery.trim().toLowerCase();
        const filteredAutoAssignments = autoAssignments.filter((assignment) => {
            if (!normalizedQuery) return true;

            const haystack = `${assignment.name} ${assignment.description || ''} ${assignment.gradingApiEndpoint || ''}`
                .toLowerCase();
            return haystack.includes(normalizedQuery);
        });
        const selectedAssignments = assignments.filter((a) => multiAssignmentIds.includes(a.id));

        return (
            <div className="flex-1 overflow-y-auto p-6">
                <button
                    onClick={() => {
                        setChooseMode(null);
                        setMultiAssignmentIds([]);
                        setMultiScores(new Map());
                        setMultiAutoStates(new Map());
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
                                Da chon {multiAssignmentIds.length}/{autoAssignments.length} bai auto
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={handleSelectAllAutoAssignments}
                                disabled={isSelectingAssignments || autoAssignments.length === 0}
                                className="px-3 py-1.5 text-xs rounded-md border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 disabled:opacity-50"
                            >
                                Chon tat ca
                            </button>
                            <button
                                type="button"
                                onClick={handleClearAutoAssignments}
                                disabled={isSelectingAssignments || multiAssignmentIds.length === 0}
                                className="px-3 py-1.5 text-xs rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 disabled:opacity-50"
                            >
                                Bo chon
                            </button>
                        </div>
                    </div>

                    <div className="mt-3 relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={multiAssignmentQuery}
                            onChange={(e) => setMultiAssignmentQuery(e.target.value)}
                            placeholder="Tim theo ten bai tap, mo ta, endpoint..."
                            className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                        />
                    </div>

                    {isSelectingAssignments && (
                        <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                            <Loader2 size={13} className="animate-spin" />
                            Dang cap nhat danh sach bai tap...
                        </div>
                    )}

                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                        {filteredAutoAssignments.map((assignment) => {
                            const isSelected = multiAssignmentIds.includes(assignment.id);
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
                                                    Da chon
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
                            Khong tim thay bai tap phu hop voi tu khoa "{multiAssignmentQuery}".
                        </div>
                    )}
                </div>

                {selectedAssignments.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ho va ten</th>
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
                                {students.map((student, index) => {
                                    const isStudentAutoGrading = selectedAssignments.some((assignment) =>
                                        Boolean(multiAutoStates.get(assignment.id)?.get(student.id)?.isGrading)
                                    );
                                    const isRowUploadDisabled = isStudentAutoGrading || isBulkUploading;

                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 align-top">
                                                <div>{student.middleName} {student.firstName}</div>
                                                <div
                                                    className={`mt-2 rounded-md border border-dashed p-2 transition ${
                                                        multiRowDragOverStudentId === student.id
                                                            ? 'border-blue-500 bg-blue-50'
                                                            : 'border-gray-200'
                                                    } ${isRowUploadDisabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                    onDragOver={(e) =>
                                                        handleMultiStudentBulkDragOver(student.id, isRowUploadDisabled, e)
                                                    }
                                                    onDragLeave={() => handleMultiStudentBulkDragLeave(student.id)}
                                                    onDrop={(e) =>
                                                        handleMultiStudentBulkDrop(student.id, isRowUploadDisabled, e)
                                                    }
                                                >
                                                    <input
                                                        id={`multi-row-files-${student.id}`}
                                                        type="file"
                                                        accept=".xls,.xlsx,.xlsm"
                                                        multiple
                                                        className="hidden"
                                                        onChange={(e) => handleMultiStudentBulkFilesChange(student.id, e)}
                                                        disabled={isRowUploadDisabled}
                                                    />
                                                    <label
                                                        htmlFor={`multi-row-files-${student.id}`}
                                                        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] border ${
                                                            isRowUploadDisabled
                                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                : 'bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100'
                                                        }`}
                                                    >
                                                        <Upload size={12} />
                                                        Nhieu file / 1 hoc sinh
                                                    </label>
                                                    <p className="mt-1 text-[11px] text-gray-500">
                                                        Keo-tha nhieu file vao day de map theo thu tu bai da chon.
                                                    </p>
                                                </div>
                                            </td>
                                            {selectedAssignments.map((assignment) => {
                                                const assignmentMap = multiScores.get(assignment.id);
                                                const current = assignmentMap?.get(student.id);
                                                const autoStateMap = multiAutoStates.get(assignment.id);
                                                const autoState = autoStateMap?.get(student.id);
                                                const cellErrors = current?.autoGradingErrors || extractAutoGradingErrors(autoState?.gradingResult || null);

                                                return (
                                                    <td key={`${student.id}-${assignment.id}`} className="px-4 py-3 text-center align-top">
                                                        <input
                                                            type="number"
                                                            value={current?.scoreValue ?? ''}
                                                            readOnly
                                                            className="w-24 border border-gray-300 rounded-md px-2 py-1 text-center bg-gray-50"
                                                            min="0"
                                                            max={assignment.maxScore}
                                                            step="0.5"
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
                                                                    accept=".xls,.xlsx,.xlsm"
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
                                                                    {autoState?.studentFile ? 'Doi file bai lam' : 'Chon file bai lam'}
                                                                </label>
                                                                <p className="text-[11px] text-gray-500">Keo tha file vao day</p>
                                                                {autoState?.studentFile && (
                                                                    <p className="text-xs text-gray-600 truncate">
                                                                        {autoState.studentFile.name}
                                                                    </p>
                                                                )}
                                                                {autoState?.isGrading && (
                                                                    <p className="text-xs text-blue-600">Dang cham...</p>
                                                                )}
                                                                {autoState?.gradingResult && (
                                                                    <p className="text-xs text-green-600">
                                                                        Auto: {autoState.gradingResult.totalScore}/{autoState.gradingResult.maxScore}
                                                                    </p>
                                                                )}
                                                                {autoState?.error && (
                                                                    <p className="text-xs text-red-600">Loi: {autoState.error}</p>
                                                                )}
                                                                {renderAutoErrorDropdown(cellErrors)}
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
                    <div className="text-sm text-gray-500">Chua chon bai tap nao.</div>
                )}
            </div>
        );
    };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* HEADER */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">Chấm điểm</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto">
                    {chooseMode === null && renderModeSelector()}
                    {chooseMode === 'new' && renderNewAssignmentForm()}
                    {chooseMode === 'existing' && renderExistingMode()}
                    {chooseMode === 'existing-multi' && renderExistingMultiMode()}
                </div>

                {/* FOOTER */}
                <div className="flex justify-end gap-2 p-6 border-t">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                        Hủy
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
                            disabled={loading}
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
        </div>
    );
};

export default GradingModal;




