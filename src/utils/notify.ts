export type NotifyType = 'success' | 'error' | 'warning' | 'info';

export interface NotifyIssue {
  heading: string;
  message: string;
  fixAction: string;
}

export interface NotifyPayload {
  message: string;
  type?: NotifyType;
  durationMs?: number;
  title?: string;
  guide?: string;
  issues?: NotifyIssue[];
}

const NOTIFY_EVENT_NAME = 'mos-grader:notify';

const normalizeMessage = (input: unknown): string => {
  if (typeof input === 'string') return input.trim();
  if (input instanceof Error) return input.message.trim();
  if (input == null) return '';
  try {
    return String(input).trim();
  } catch {
    return '';
  }
};

const resolveTypeFromMessage = (message: string): NotifyType => {
  const lower = message.toLowerCase();

  if (
    lower.includes('không thể') ||
    lower.includes('thất bại') ||
    lower.includes('lỗi') ||
    lower.includes('error')
  ) {
    return 'error';
  }

  if (
    lower.includes('vui lòng') ||
    lower.includes('cần ') ||
    lower.includes('không có') ||
    lower.includes('chưa')
  ) {
    return 'warning';
  }

  if (
    lower.includes('thành công') ||
    lower.includes('đã lưu') ||
    lower.includes('đã xóa') ||
    lower.includes('đã cập nhật')
  ) {
    return 'success';
  }

  return 'info';
};

const emitNotify = (payload: NotifyPayload) => {
  window.dispatchEvent(new CustomEvent<NotifyPayload>(NOTIFY_EVENT_NAME, { detail: payload }));
};

export const notify = {
  success: (message: string, durationMs = 3200) =>
    emitNotify({ message: normalizeMessage(message), type: 'success', durationMs }),
  error: (message: string, durationMs = 4200) =>
    emitNotify({ message: normalizeMessage(message), type: 'error', durationMs }),
  warning: (message: string, durationMs = 3600) =>
    emitNotify({ message: normalizeMessage(message), type: 'warning', durationMs }),
  info: (message: string, durationMs = 3200) =>
    emitNotify({ message: normalizeMessage(message), type: 'info', durationMs }),
  custom: (payload: NotifyPayload) =>
    emitNotify({
      ...payload,
      message: normalizeMessage(payload.message),
      type: payload.type ?? resolveTypeFromMessage(payload.message),
    }),
};

export const installAlertInterceptor = () => {
  const appWindow = window as Window & { __mosGraderAlertPatched?: boolean };
  if (appWindow.__mosGraderAlertPatched) return;

  appWindow.__mosGraderAlertPatched = true;
  window.alert = (message?: string) => {
    const text = normalizeMessage(message);
    if (!text) return;
    notify.custom({
      message: text,
      type: resolveTypeFromMessage(text),
    });
  };
};

export const notifyEventName = NOTIFY_EVENT_NAME;
