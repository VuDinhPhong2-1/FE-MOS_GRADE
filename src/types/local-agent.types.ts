export type ExamPublicationTaskSnapshotItem = {
  taskId?: string;
  taskName?: string;
  maxScore?: number;
  instructions?: string;
};

export type ExamPublicationModeRules = {
  mode?: string;
  showFeedback?: boolean;
  allowRestart?: boolean;
  allowNextProject?: boolean;
};

export type LocalAgentState = {
  publicationToken?: string;
  sessionId?: string;
  studentId?: string;
  studentName?: string;
  projectCode?: string;
  subject?: string;
  templateFileName?: string;
  instructionsFileName?: string;
  instructionsText?: string;
  helpFileName?: string;
  helpText?: string;
  gradingApiEndpoint?: string;
  workingFilePath?: string;
  workingFileExists?: boolean;
  hasRecoverableSession?: boolean;
  resumeMode?: string;

  currentProjectNumber: number;
  totalProjectCount: number;

  taskSnapshot?: ExamPublicationTaskSnapshotItem[];
  modeRules?: ExamPublicationModeRules;

  status: string;
  lastError?: string;

  isBusy: boolean;
  isCompleted: boolean;
  isCurrentProjectGraded: boolean;
};

export type StartExamAgentRequest = {
  publicationToken: string;
  studentId?: string;
  studentName: string;
};

export type LoadSavedStateAgentRequest = {
  publicationToken: string;
  studentId?: string;
  studentName?: string;
};

export type SubmitCurrentProjectRequest = {
  confirmSaved: boolean;
  forceSubmit?: boolean;
};
