export interface TaskDisplayIssue {
  heading: string;
  message: string;
  fixAction: string;
}

export interface TaskResult {
  taskId: string;
  taskName: string;
  score: number;
  maxScore: number;
  isPassed: boolean;
  details: string[];
  errors: string[];
  fixActions?: string[];
  displayIssues: TaskDisplayIssue[];
}

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

export interface StudentGradingState {
  studentId: string;
  studentFile: File | null;
  isGrading: boolean;
  gradingResult: GradingResult | null;
  error: string | null;
  manualScore: number | null;
  manualComment: string;
  autoGradingErrors: string[];
  regradeHistory?: RegradeHistoryItem[];
}

export interface RegradeHistoryItem {
  submissionId: string;
  score: number;
  gradedAt: string;
  fileName: string;
  gradingResult: GradingResult;
}

export interface GradeSubmissionRequest {
  studentId: string;
  assignmentId: string;
  studentFile: File;
  answerFile: File;
}

export interface GradeSubmissionResponse {
  success: boolean;
  message: string;
  data: GradingResult;
}
