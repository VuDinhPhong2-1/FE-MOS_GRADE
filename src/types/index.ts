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

export type School = {
  id: number;
  name: string;
};
export type Class = {
  id: number;
  name: string;
  schoolId: number;
};
export type Student = {
  id: number;
  hoDem: string;
  ten: string;
  lop: string;
  truong: string;
};