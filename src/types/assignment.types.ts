// src/types/assignment.types.ts
export interface Assignment {
  id: string;
  name: string;
  description?: string;
  classId: string;
  maxScore: number;
  subject: 'excel' | 'word' | 'ppt';
  examType: 'otth' | 'onthi' | 'gmetrix';
  projectCode?: string;
  createdAt: string;
  isActive: boolean;
  isLockedForPublication?: boolean;
  gradingType: 'auto' | 'manual';
  gradingApiEndpoint?: string;
  createdBy?: string;
  createdByName?: string;
  updatedAt?: string;
}

export interface AssignmentWithStats extends Assignment {
  totalStudents: number;
  gradedStudents: number;
  averageScore: number;
  completionRate: number;
}

export interface CreateAssignmentRequest {
  name: string;
  description?: string;
  classId: string;
  maxScore: number;
  subject: 'excel' | 'word' | 'ppt';
  examType: 'otth' | 'onthi' | 'gmetrix';
  projectCode?: string;
  gradingType: 'auto' | 'manual';
  gradingApiEndpoint?: string;
}

export interface UpdateAssignmentRequest {
  name?: string;
  description?: string;
  maxScore?: number;
  isActive?: boolean;
  subject?: 'excel' | 'word' | 'ppt';
  examType?: 'otth' | 'onthi' | 'gmetrix';
  projectCode?: string;
  gradingType?: 'auto' | 'manual';
  gradingApiEndpoint?: string;
}

export interface GradingEndpointInfo {
  endpoint: string;
  displayName: string;
  description: string;
  maxScore: number;
  rawMaxScore?: number;
  subject?: string;
  practiceCode?: string;
  practiceName?: string;
  practiceTotalScore?: number;
  practiceProjectCount?: number;
  apiPath?: string;
}

export interface AssignmentTemplateResponse {
  suggestedName: string;
  description?: string;
  subject: 'excel' | 'word' | 'ppt';
  examType: 'otth' | 'onthi' | 'gmetrix';
  projectCode: string;
  gradingType: 'auto' | 'manual';
  gradingApiEndpoint?: string;
  maxScore: number;
  practiceCode: string;
  practiceName: string;
}
