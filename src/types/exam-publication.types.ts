export type ExamPublicationProjectRequest = {
  order: number;
  projectCode: string;
  subject: 'excel' | 'word';
  gradingApiEndpoint: string;
  templateFileName?: string;
  instructionsFileName?: string;
  instructionsText?: string;
  helpFileName?: string;
  helpText?: string;
  modeRules?: {
    mode?: 'Training' | 'Testing';
    showFeedback?: boolean;
    allowRestart?: boolean;
    allowNextProject?: boolean;
    allowHelp?: boolean;
  };
};

export type CreateExamPublicationRequest = {
  name: string;
  classId: string;
  studentIds: string[];
  assignmentIds?: string[];
  mode: 'Training' | 'Testing';
  projectSequence?: ExamPublicationProjectRequest[];
  modeRules?: {
    mode?: 'Training' | 'Testing';
    showFeedback?: boolean;
    allowRestart?: boolean;
    allowNextProject?: boolean;
    allowHelp?: boolean;
  };
};

export type ExamPublicationResponse = {
  id: string;
  name: string;
  classId?: string | null;
  studentIds: string[];
  mode?: string | null;
  publicationToken: string;
  createdAt: string;
};
