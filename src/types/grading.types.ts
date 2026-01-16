// src/types/grading.types.ts

/**
 * Kết quả chi tiết của từng task trong bài chấm
 */
export interface TaskResult {
    taskId: string;
    taskName: string;
    score: number;
    maxScore: number;
    isPassed: boolean;
    details: string[];
    errors: string[];
}

/**
 * Kết quả chấm điểm tự động từ backend
 */
export interface GradingResult {
    projectId: string;
    projectName: string;
    totalScore: number;
    maxScore: number;
    percentage: number;
    taskResults: TaskResult[];
    gradedAt: string;
    status: string;
}

/**
 * Trạng thái chấm điểm cho từng học sinh
 * Bao gồm cả chấm tự động và thủ công
 */
export interface StudentGradingState {
    studentId: string;
    
    // ✅ FILE BÀI LÀM
    studentFile: File | null;
    
    // ✅ TRẠNG THÁI CHẤM ĐIỂM TỰ ĐỘNG
    isGrading: boolean;
    gradingResult: GradingResult | null;
    error: string | null;
    
    // ✅ ĐIỂM VÀ NHẬN XÉT THỦ CÔNG
    manualScore: number | null;
    manualComment: string;
    
    // ✅ LỊCH SỬ CHẤM LẠI (optional - nếu cần)
    regradeHistory?: RegradeHistoryItem[];
}

/**
 * Một mục trong lịch sử chấm lại
 */
export interface RegradeHistoryItem {
    submissionId: string;
    score: number;
    gradedAt: string;
    fileName: string;
    gradingResult: GradingResult;
}

/**
 * Request body khi gửi file lên backend để chấm điểm
 */
export interface GradeSubmissionRequest {
    studentId: string;
    assignmentId: string;
    studentFile: File;
    answerFile: File;
}

/**
 * Response từ backend sau khi chấm điểm
 */
export interface GradeSubmissionResponse {
    success: boolean;
    message: string;
    data: GradingResult;
}
