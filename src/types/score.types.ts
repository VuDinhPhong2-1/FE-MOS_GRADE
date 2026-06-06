// src/types/score.types.ts
export interface Score {
  id: string;
  studentId: string;
  assignmentId: string;
  classId: string;
  scoreValue?: number;
  feedback?: string;
  autoGradingErrors?: string[];
  autoGradingTaskResults?: AutoGradingTaskResultRequest[];
  gradedAt?: string;
  gradedBy?: string;
}

export interface ScoreResponse {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentMiddleName: string;
  studentFullName: string;
  assignmentId: string;
  assignmentName: string;
  scoreValue?: number;
  feedback?: string;
  autoGradingErrors?: string[];
  autoGradingTaskResults?: AutoGradingTaskResultRequest[];
  gradedAt?: string;
  gradedBy?: string;
  gradedByName?: string;
}

export interface AutoGradingTaskResultRequest {
  taskId: string;
  taskName: string;
  score: number;
  maxScore: number;
  isPassed: boolean;
  details?: string[];
  errors?: string[];
  fixActions?: string[];
}

export interface CreateScoreRequest {
  studentId: string;
  assignmentId: string;
  classId: string;
  scoreValue?: number;
  feedback?: string;
  autoGradingErrors?: string[];
  autoGradingTaskResults?: AutoGradingTaskResultRequest[];
}

export interface BulkScoreRequest {
  assignmentId: string;
  classId: string;
  scores: StudentScoreItem[];
}

export interface StudentScoreItem {
  studentId: string;
  scoreValue?: number;
  feedback?: string;
  autoGradingErrors?: string[];
  autoGradingTaskResults?: AutoGradingTaskResultRequest[];
}

export interface StudentScoreReportResponse {
  studentId: string;
  studentFullName: string;
  scores: ScoreDetailResponse[];
  averageScore: number;
  totalAssignments: number;
  completedAssignments: number;
}

export interface ScoreDetailResponse {
  assignmentName: string;
  scoreValue?: number;
  maxScore: number;
  feedback?: string;
  autoGradingErrors?: string[];
  autoGradingTaskResults?: AutoGradingTaskResultRequest[];
  gradedAt?: string;
}
