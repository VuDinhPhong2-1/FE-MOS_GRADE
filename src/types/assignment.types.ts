// src/types/assignment.types.ts
export interface Assignment {
  id: string;
  name: string;
  description?: string;
  classId: string;
  maxScore: number;
  createdAt: string;
  isActive: boolean;
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
  gradingType: 'auto' | 'manual';
  gradingApiEndpoint?: string;
}

export interface UpdateAssignmentRequest {
  name?: string;
  description?: string;
  maxScore?: number;
  isActive?: boolean;
  gradingType?: 'auto' | 'manual';
  gradingApiEndpoint?: string;
}

export interface GradingEndpointInfo {
  endpoint: string;
  displayName: string;
  description: string;
  maxScore: number;
}
