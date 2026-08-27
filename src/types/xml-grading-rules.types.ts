import type { GradingResult } from './grading.types';

export type XmlCompareMode = 'xmlContains' | 'xmlContainsNormalized' | 'xmlEquivalentWholeFile' | 'exactStringContains';
export type XmlMatchPolicy = 'all' | 'any' | 'ordered';

export interface XmlConditionFeedback {
  successDetail: string;
  errorMessage: string;
  fixAction: string;
}

export interface XmlGradingCondition {
  conditionId: string;
  score: number;
  sourceFile: string;
  expectedValue?: string | string[];
  expectedValues?: string[];
  compareMode: XmlCompareMode;
  matchPolicy: XmlMatchPolicy;
  feedback: XmlConditionFeedback;
  stopTaskIfFailed: boolean;
}

export interface TaskXmlRule {
  taskId: string;
  taskName: string;
  maxScore: number;
  conditions: XmlGradingCondition[];
}

export interface ProjectXmlRule {
  projectCode: string;
  projectName: string;
  maxScore: number;
  tasks: TaskXmlRule[];
}

export interface GradingRuleSet {
  id: string;
  subject: string;
  version: string;
  isActive: boolean;
  projects: ProjectXmlRule[];
}

export interface XmlRuleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export type XmlRuleGradeResult = GradingResult;