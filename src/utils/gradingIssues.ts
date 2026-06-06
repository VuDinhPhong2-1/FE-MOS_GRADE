import type { NotifyIssue } from './notify';

type TaskResultLike = {
  taskId?: string;
  taskName?: string;
  isPassed?: boolean;
  details?: string[];
  errors?: string[];
  fixActions?: string[];
};

export const normalizeIssueText = (value: string): string => value.replace(/\s+/g, ' ').trim();

export const toIssueDedupKey = (value: string): string =>
  normalizeIssueText(value)
    .toLowerCase()
    .replace(/[.:;!?]+$/g, '');

const getFixActionFallbacks = (task: TaskResultLike): string[] => {
  const explicitFixes = (task.fixActions || [])
    .map((item) => normalizeIssueText(item || ''))
    .filter((item) => item.length > 0);

  if (explicitFixes.length > 0) {
    return explicitFixes;
  }

  return (task.details || [])
    .map((item) => normalizeIssueText(item || ''))
    .map((item) => item.replace(/^[✓✔]\s*/u, '').trim())
    .filter((item) => item.length > 0)
    .filter((item) => !/^đúng\b/i.test(item))
    .filter((item) => !/^correct\b/i.test(item));
};

const getIssueLabel = (task: TaskResultLike, index: number): string => {
  const taskName = normalizeIssueText(task.taskName || '');
  const taskId = normalizeIssueText(task.taskId || '');
  const matchedQuestion =
    taskId.match(/(?:^|[^0-9])T(\d+)(?:[^0-9]|$)/i)?.[1]
    || taskId.match(/(\d+)/)?.[1]
    || '';
  const questionLabel = matchedQuestion
    ? `Câu ${Number.parseInt(matchedQuestion, 10)}`
    : `Câu ${index + 1}`;

  if (!taskName) return questionLabel;

  return taskName.toLowerCase().startsWith(questionLabel.toLowerCase())
    ? taskName
    : `${questionLabel} - ${taskName}`;
};

export const getNotifyIssuesFromTaskResults = (taskResults?: TaskResultLike[]): NotifyIssue[] => {
  if (!taskResults?.length) return [];

  const issues: NotifyIssue[] = [];
  const seen = new Set<string>();

  taskResults.forEach((task, index) => {
    const label = getIssueLabel(task, index);
    const errors = (task.errors || [])
      .map((item) => normalizeIssueText(item || ''))
      .filter((item) => item.length > 0);
    const fixes = getFixActionFallbacks(task);

    errors.forEach((error, errorIndex) => {
      const fullError = label ? `${label}: ${error}` : error;
      const key = toIssueDedupKey(fullError);
      if (seen.has(key)) return;
      seen.add(key);

      issues.push({
        taskId: task.taskId,
        taskName: task.taskName,
        error: fullError,
        fixAction: fixes[errorIndex] ?? fixes[0] ?? undefined,
      });
    });

    if (errors.length === 0 && task.isPassed === false) {
      const detailFallback = normalizeIssueText(task.details?.[0] || '');
      if (!detailFallback) return;

      const fullError = `${label}: ${detailFallback}`;
      const key = toIssueDedupKey(fullError);
      if (seen.has(key)) return;
      seen.add(key);

      issues.push({
        taskId: task.taskId,
        taskName: task.taskName,
        error: fullError,
        fixAction: fixes[0] ?? undefined,
      });
    }
  });

  return issues;
};

export const splitIssueHeadingAndError = (text: string): { question: string; error: string } => {
  const separatorIndex = text.indexOf(':');
  if (separatorIndex <= 0) {
    return {
      question: '',
      error: text.trim(),
    };
  }

  return {
    question: text.slice(0, separatorIndex).trim(),
    error: text.slice(separatorIndex + 1).trim(),
  };
};
