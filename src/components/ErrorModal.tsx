import { useEffect, useState } from 'react';
import { Icon } from '@bug-on/m3-expressive';
import { notifyEventName, type NotifyPayload } from '../utils/notify';

const ErrorModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<NotifyPayload | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<NotifyPayload>;
      const detail = customEvent.detail;
      if (!detail || detail.type !== 'error') return;

      setPayload(detail);
      setOpen(true);
    };

    window.addEventListener(notifyEventName, handler as EventListener);
    return () => window.removeEventListener(notifyEventName, handler as EventListener);
  }, []);

  if (!open || !payload) return null;

  const issues = (payload.issues || []).filter(
    (issue) => issue.heading.trim().length > 0 && issue.message.trim().length > 0
  );
  const message = (payload.message || '').trim();

  return (
    <div className="fixed inset-0 z-11000 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity" onClick={() => setOpen(false)} />

      <div className="relative w-[min(94vw,720px)] max-h-[86vh] overflow-auto rounded-4xl bg-m3-surface-container-high p-6 text-m3-on-surface shadow-2xl transition-all">
        <div className="flex items-start gap-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-m3-error-container text-m3-on-error-container">
            <Icon name="error" className="text-2xl" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-xl font-bold text-m3-error">{payload.title ?? 'Lỗi'}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full text-m3-on-surface-variant hover:bg-m3-surface-container-highest hover:text-m3-on-surface transition-colors"
                aria-label="Đóng"
              >
                <Icon name="close" className="text-lg" />
              </button>
            </div>

            <div className="mt-3.5 space-y-3 text-sm">
              {message && (
                <div className="whitespace-pre-wrap rounded-2xl bg-m3-error-container/50 p-3.5 font-medium text-m3-on-error-container shadow-2xs">
                  {message}
                </div>
              )}

              {issues.map((issue, idx) => (
                <div
                  key={`${idx}-${issue.heading}-${issue.message}`}
                  className="rounded-2xl bg-m3-surface-container p-3.5 shadow-2xs"
                >
                  <div className="flex items-start gap-2.5">
                    <Icon name="warning" className="mt-0.5 shrink-0 text-amber-500 text-lg" />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="whitespace-pre-wrap font-semibold text-m3-primary">
                        {issue.heading}
                      </div>
                      <div className="whitespace-pre-wrap font-medium text-amber-600 dark:text-amber-400">
                        {issue.message}
                      </div>

                      {issue.fixAction && (
                        <div className="flex items-start gap-2 pt-1 text-emerald-600 dark:text-emerald-400">
                          <Icon name="lightbulb" className="mt-0.5 shrink-0 text-base" />
                          <span className="whitespace-pre-wrap font-medium">
                            Hướng dẫn sửa: {issue.fixAction}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  const combined = issues
                    .map((issue) =>
                      `${issue.heading}\n${issue.message}${issue.fixAction ? `\n\nHướng dẫn:\n${issue.fixAction}` : ''}`
                    )
                    .join('\n\n');
                  navigator.clipboard?.writeText(
                    [payload.title ?? 'Lỗi', message, combined].filter(Boolean).join('\n\n')
                  );
                }}
                className="rounded-full bg-m3-surface-container px-4 py-2 text-xs font-semibold text-m3-on-surface transition-colors hover:bg-m3-surface-container-highest shadow-xs cursor-pointer"
              >
                Sao chép nội dung
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full bg-m3-error px-5 py-2 text-xs font-semibold text-m3-on-error shadow-xs transition-opacity hover:opacity-90 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
