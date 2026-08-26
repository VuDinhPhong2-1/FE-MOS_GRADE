export interface GradingConfigListItem {
  id: string;
  gradingApiEndpoint: string;
  subject: string;
  projectNumber: number;
  projectCode: string;
  displayName: string;
  status: string;
  version: number;
  normalizedMaxScore: number;
  taskCount: number;
  enabledTaskCount: number;
  rawMaxScore: number;
  createdAt: string;
  updatedAt?: string | null;
  publishedAt?: string | null;
  summary?: string | null;
}

export interface GradingConfigTask {
  taskId: string;
  taskName: string;
  maxScore: number;
  enabled: boolean;
  sortOrder: number;
  ruleType: string;
  rule?: unknown;
}

export interface GradingConfigDetail extends GradingConfigListItem {
  tasks: GradingConfigTask[];
}

export interface ImportGradingConfigFromCodeRequest {
  gradingApiEndpoint: string;
  displayName?: string;
  publish: boolean;
  summary?: string;
}

export interface UpdateGradingConfigRequest {
  displayName?: string;
  summary?: string;
  tasks: GradingConfigTask[];
}

export interface PublishGradingConfigRequest {
  summary?: string;
}

export interface RestoreGradingConfigVersionRequest {
  summary?: string;
}

export interface GradingConfigVersion {
  id: string;
  gradingConfigId: string;
  version: number;
  action: string;
  summary?: string | null;
  createdAt: string;
  createdBy?: string | null;
}

export interface GradingConfigTestRun {
  id: string;
  gradingConfigId: string;
  gradingApiEndpoint: string;
  configVersion: number;
  usedOverride: boolean;
  fileName: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  status: string;
  createdAt: string;
  createdBy?: string | null;
  error?: string | null;
}

export interface GradingRuleType {
  ruleType: string;
  displayName: string;
  description: string;
}
