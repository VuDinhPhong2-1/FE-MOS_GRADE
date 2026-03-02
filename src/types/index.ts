export * from './school.types'
export * from './auth.types'
export * from './class.types'
export * from './student.types'
export interface TaskResult {
  taskId: string;
  taskName: string;
  score: number;
  maxScore: number;
  isPassed: boolean;
  details: string[];
  errors: string[];
}

export interface GradingResult {
  projectId: string;
  projectName: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  status: string;
  gradedAt: string;
  taskResults: TaskResult[];
}
// Định nghĩa kiểu cho một Bài tập
export interface Assignment {
  id: string; // ID duy nhất của bài tập
  name: string; // Tên bài tập (ví dụ: "Bài tập 1", "Kiểm tra giữa kỳ")
  maxScore: number; // Điểm tối đa của bài tập (ví dụ: 10)
}

// Định nghĩa kiểu cho Điểm của một Học sinh đối với một Bài tập cụ thể
export interface StudentAssignmentScore {
  assignmentId: string; // Tham chiếu đến ID của bài tập
  score: number | null; // Điểm số của học sinh. null nếu học sinh chưa làm bài
}

// Định nghĩa kiểu cho một Học sinh
export interface Student {
  id: string; // ID duy nhất của học sinh
  name: string; // Tên của học sinh
  assignmentScores: StudentAssignmentScore[]; // Mảng điểm số của học sinh cho các bài tập
}

// Kiểu dữ liệu bổ sung để hiển thị trên bảng, bao gồm các điểm đã xử lý
// (ví dụ: null thành 0) và điểm trung bình tổng thể của học sinh
export interface DisplayStudentRow extends Student {
  calculatedScores: {
    [assignmentId: string]: number; // Điểm đã được chuẩn hóa (null thành 0) của học sinh cho từng bài tập
  };
  averageOverallScore: number; // Điểm trung bình của học sinh dựa trên tất cả các bài tập
}

// Kiểu dữ liệu cho hàng thống kê của mỗi bài tập (Min, Max, Average)
export interface AssignmentStatistics {
  assignmentId: string; // ID của bài tập
  min: number; // Điểm thấp nhất cho bài tập này
  max: number; // Điểm cao nhất cho bài tập này
  average: number; // Điểm trung bình cho bài tập này
}