export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface GradingTestBugNoteScoreSummary {
  totalScore: number;
  maxScore: number;
  percentage: number;
  status: string;
}

export interface GradingTestBugNote {
  id: string;
  projectCode: string;
  projectDisplayName: string;
  title: string;
  description: string;
  severity: BugSeverity;
  createdAt: string;
  scoreSummary?: GradingTestBugNoteScoreSummary;
  gradingError?: string;
}

export interface CreateGradingTestBugNoteRequest {
  projectCode: string;
  projectDisplayName?: string;
  title: string;
  description: string;
  severity: BugSeverity;
  scoreSummary?: GradingTestBugNoteScoreSummary;
  gradingError?: string;
}
