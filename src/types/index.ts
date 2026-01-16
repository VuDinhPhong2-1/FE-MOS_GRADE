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
