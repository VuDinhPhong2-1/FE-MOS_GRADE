// src/components/GradingModal.optimized.tsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Save, Loader2, ArrowLeft, XCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { Assignment, CreateAssignmentRequest, GradingEndpointInfo } from '../types/assignment.types';
import type { Student } from '../types/student.types';
import type { StudentGradingState } from '../types/grading.types';
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
    const [chooseMode, setChooseMode] = useState<null | 'new' | 'existing'>(null);
    const [loading, setLoading] = useState(false);

    // ✅ FILE ĐÁP ÁN CHUNG
    const [answerFile, setAnswerFile] = useState<File | null>(null);
    const answerFileInputRef = useRef<HTMLInputElement>(null);

    // ✅ STATE CHẤM ĐIỂM CHO TỪNG HỌC SINH (DUY NHẤT)
    const [studentGradingStates, setStudentGradingStates] = useState<Map<string, StudentGradingState>>(
        new Map()
    );

    // ✅ TẠO BÀI TẬP MỚI
    const [newAssignment, setNewAssignment] = useState<CreateAssignmentRequest>({
        name: '',
        classId: classId,
        maxScore: 10,
        gradingType: 'manual',
    });

    // ============ EFFECTS ============
    useEffect(() => {
        if (isOpen && classId) {
            loadAssignments();
            loadGradingEndpoints();
            resetModalState();
        }
    }, [isOpen, classId]);

    useEffect(() => {
        if (isOpen && students.length > 0) {
            initializeStudentStates();
        }
    }, [isOpen, students]);

    useEffect(() => {
        if (selectedAssignment) {
            loadExistingScores(selectedAssignment);
        }
    }, [selectedAssignment]);
    // Thêm effect, ngay sau hoặc gần useEffect loadGradingEndpoints
    useEffect(() => {
        // Nếu đang ở chấm AUTO và gradingApiEndpoint đã được chọn
        if (newAssignment.gradingType === 'auto' && newAssignment.gradingApiEndpoint) {
            const selectedProject = gradingEndpoints.find(
                ep => ep.endpoint === newAssignment.gradingApiEndpoint
            );
            // Nếu tìm thấy project, tự động set maxScore và KHÔNG cho user sửa
            if (selectedProject) {
                setNewAssignment(prev => ({
                    ...prev,
                    maxScore: selectedProject.maxScore
                }));
            }
        }
        // eslint-disable-next-line
    }, [newAssignment.gradingType, newAssignment.gradingApiEndpoint, gradingEndpoints]);

    // ============ HELPER FUNCTIONS ============
    const resetModalState = () => {
        setChooseMode(null);
        setSelectedAssignment('');
        setAnswerFile(null);
        setStudentGradingStates(new Map());
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
            });
        });
        setStudentGradingStates(initialStates);
    };

    const validateExcelFile = (file: File): boolean => {
        const validExtensions = ['.xls', '.xlsx', '.xlsm'];
        const fileName = file.name.toLowerCase();
        const isValid = validExtensions.some((ext) => fileName.endsWith(ext));
        if (!isValid) {
            alert('❌ File phải có định dạng .xls, .xlsx hoặc .xlsm');
        }
        return isValid;
    };

    // ============ API CALLS ============
    const loadAssignments = async () => {
        try {
            const data = await assignmentService.getByClass(classId, getAccessToken);
            setAssignments(data);
        } catch (error) {
            console.error('Error loading assignments:', error);
            alert('Không thể tải danh sách bài tập!');
        }
    };

    const loadGradingEndpoints = async () => {
        try {
            const data = await assignmentService.getGradingEndpoints(getAccessToken);
            console.log("HEHEHEHEHE", data)
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
                            manualScore: existingScore?.scoreValue || null,
                            manualComment: existingScore?.feedback || '',
                        });
                    }
                });
                return newMap;
            });
        } catch (error) {
            console.error('Error loading scores:', error);
        }
    };

    // ============ EVENT HANDLERS ============
    const handleAnswerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && validateExcelFile(file)) {
            setAnswerFile(file);
        } else {
            setAnswerFile(null);
            if (answerFileInputRef.current) {
                answerFileInputRef.current.value = '';
            }
        }
    };

    const handleStudentFileChange = async (
        studentId: string,
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!validateExcelFile(file)) {
            e.target.value = '';
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
                });
            }
            return newMap;
        });

        if (answerFile) {
            await handleAutoGrade(studentId, file, answerFile);
        }
    };

    const handleAutoGrade = async (studentId: string, studentFile: File, answerFile: File) => {
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
            const result = await gradingService.gradeProject09(
                studentFile,
                answerFile,
                getAccessToken
            );

            setStudentGradingStates((prev) => {
                const newMap = new Map(prev);
                const currentState = newMap.get(studentId);
                if (currentState) {
                    newMap.set(studentId, {
                        ...currentState,
                        isGrading: false,
                        gradingResult: result,
                        error: null,
                        // ✅ GHI ĐÈ ĐIỂM THỦ CÔNG
                        manualScore: result.totalScore,
                    });
                }
                return newMap;
            });

            if (selectedAssignment) {
                await saveScoreForStudent(studentId, result.totalScore);
            }
        } catch (error: any) {
            console.error('Lỗi chấm điểm:', error);
            setStudentGradingStates((prev) => {
                const newMap = new Map(prev);
                const currentState = newMap.get(studentId);
                if (currentState) {
                    newMap.set(studentId, {
                        ...currentState,
                        isGrading: false,
                        error: error.message || 'Lỗi không xác định',
                    });
                }
                return newMap;
            });
        }
    };

    const handleManualScoreChange = (studentId: string, value: number | null) => {
        setStudentGradingStates((prev) => {
            const newMap = new Map(prev);
            const currentState = newMap.get(studentId);
            if (currentState) {
                newMap.set(studentId, {
                    ...currentState,
                    manualScore: value,
                });
            }
            return newMap;
        });
    };

    const handleManualCommentChange = (studentId: string, value: string) => {
        setStudentGradingStates((prev) => {
            const newMap = new Map(prev);
            const currentState = newMap.get(studentId);
            if (currentState) {
                newMap.set(studentId, {
                    ...currentState,
                    manualComment: value,
                });
            }
            return newMap;
        });
    };

    const saveScoreForStudent = async (studentId: string, scoreValue: number) => {
        if (!selectedAssignment) return;
        try {
            await scoreService.bulkCreateOrUpdate(
                {
                    assignmentId: selectedAssignment,
                    classId: classId,
                    scores: [{ studentId, scoreValue }],
                },
                getAccessToken
            );
        } catch (error) {
            console.error('Lỗi lưu điểm:', error);
        }
    };

    const handleSaveAllScores = async () => {
        if (!selectedAssignment) {
            alert('Vui lòng chọn bài tập!');
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
                }));

            await scoreService.bulkCreateOrUpdate(
                {
                    assignmentId: selectedAssignment,
                    classId: classId,
                    scores,
                },
                getAccessToken
            );

            alert('✅ Lưu điểm thành công!');
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error) {
            console.error('Error saving scores:', error);
            alert('Không thể lưu điểm!');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async () => {
        if (!newAssignment.name.trim()) {
            alert('Vui lòng nhập tên bài tập!');
            return;
        }
        if (newAssignment.gradingType === 'auto' && !newAssignment.gradingApiEndpoint) {
            alert('Vui lòng chọn Project để chấm điểm tự động!');
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
                gradingType: 'manual',
            });
            alert('✅ Tạo bài tập thành công!');
        } catch (error) {
            console.error('Error creating assignment:', error);
            alert('Không thể tạo bài tập!');
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
                        onClick={() => setChooseMode('existing')}
                        className="bg-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-purple-700 flex items-center gap-3 shadow-md transition"
                    >
                        <Save size={24} />
                        Chấm lại bài đã tạo
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
                <h3 className="font-semibold mb-4 text-lg">📝 Tạo bài tập mới</h3>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tên bài tập *
                        </label>
                        <input
                            type="text"
                            value={newAssignment.name}
                            onChange={(e) => setNewAssignment({ ...newAssignment, name: e.target.value })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            placeholder="Ví dụ: Bài tập Excel Project 09"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Điểm tối đa
                        </label>
                        <input
                            type="number"
                            value={newAssignment.maxScore}
                            onChange={e => {
                                // Chỉ cho nhập tay khi là thủ công!
                                if (newAssignment.gradingType === 'manual') {
                                    setNewAssignment(prev => ({
                                        ...prev,
                                        maxScore: Number(e.target.value)
                                    }));
                                }
                            }}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                            min="0"
                            max="100"
                            disabled={newAssignment.gradingType === 'auto'} // KHÓA khi tự động
                            readOnly={newAssignment.gradingType === 'auto'} // Đề phòng thêm
                            style={{ backgroundColor: newAssignment.gradingType === 'auto' ? '#f1f5f9' : undefined }}
                        />
                        {newAssignment.gradingType === 'auto' && (
                            <span className="text-xs text-blue-600">Điểm tối đa được lấy tự động từ project, không thể thay đổi.</span>
                        )}
                    </div>

                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Loại chấm điểm
                        </label>
                        <select
                            value={newAssignment.gradingType}
                            onChange={(e) => setNewAssignment({
                                ...newAssignment,
                                gradingType: e.target.value as 'auto' | 'manual',
                                gradingApiEndpoint: e.target.value === 'manual' ? undefined : newAssignment.gradingApiEndpoint,
                            })}
                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                        >
                            <option value="manual">✍️ Chấm thủ công</option>
                            <option value="auto">🤖 Tự động chấm điểm</option>
                        </select>
                    </div>

                    {newAssignment.gradingType === 'auto' && (
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
                                        gradingApiEndpoint: e.target.value,
                                        maxScore: selectedEp ? selectedEp.maxScore : 10 // fallback nếu không tìm được project
                                    }));
                                }}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                            >
                                <option value="">-- Chọn Project --</option>
                                {gradingEndpoints.map(ep => (
                                    <option key={ep.endpoint} value={ep.endpoint}>
                                        {ep.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                </div>

                <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <textarea
                        value={newAssignment.description || ''}
                        onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        rows={2}
                        placeholder="Mô tả bài tập..."
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
                            Tạo bài tập
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
                {/* FILE ĐÁP ÁN CHUNG */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <label className="block text-sm font-semibold text-blue-900 mb-2">
                        📄 File Đáp Án Chung (dùng cho tất cả học sinh)
                    </label>
                    <input
                        type="file"
                        accept=".xls,.xlsx,.xlsm"
                        onChange={handleAnswerFileChange}
                        ref={answerFileInputRef}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none"
                    />
                    {answerFile && (
                        <p className="mt-2 text-sm text-green-600 flex items-center gap-2">
                            <CheckCircle size={16} />
                            Đã chọn: {answerFile.name}
                        </p>
                    )}
                </div>

                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">STT</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Họ và tên</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">File bài làm</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Điểm</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nhận xét</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((student, index) => {
                            const state = studentGradingStates.get(student.id);
                            return (
                                <tr key={student.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-500">{index + 1}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {student.middleName} {student.firstName}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="file"
                                            accept=".xls,.xlsx,.xlsm"
                                            onChange={(e) => handleStudentFileChange(student.id, e)}
                                            disabled={!answerFile || state?.isGrading}
                                            className="text-sm"
                                        />
                                        {state?.studentFile && (
                                            <p className="text-xs text-gray-600 mt-1">
                                                {state.studentFile.name}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {state?.isGrading ? (
                                            <Loader2 className="animate-spin mx-auto" size={20} />
                                        ) : (
                                            <input
                                                type="number"
                                                value={state?.manualScore ?? ''}
                                                onChange={(e) => handleManualScoreChange(
                                                    student.id,
                                                    e.target.value ? Number(e.target.value) : null
                                                )}
                                                className="w-20 border border-gray-300 rounded-md px-2 py-1 text-center"
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
                                    <td className="px-4 py-3">
                                        <input
                                            type="text"
                                            value={state?.manualComment || ''}
                                            onChange={(e) => handleManualCommentChange(student.id, e.target.value)}
                                            className="w-full border border-gray-300 rounded-md px-2 py-1"
                                            placeholder="Nhận xét..."
                                        />
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
                    {assignments.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name} ({a.gradingType === 'auto' ? '🤖 Tự động' : '✍️ Thủ công'})
                        </option>
                    ))}
                </select>
            </div>

            {selectedAssignment && renderGradingTable()}
        </div>
    );

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* HEADER */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h2 className="text-2xl font-bold text-gray-800">📝 Chấm điểm</h2>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto">
                    {chooseMode === null && renderModeSelector()}
                    {chooseMode === 'new' && renderNewAssignmentForm()}
                    {chooseMode === 'existing' && renderExistingMode()}
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
                </div>
            </div>
        </div>
    );
};

export default GradingModal;