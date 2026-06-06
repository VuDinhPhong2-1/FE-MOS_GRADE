import { useEffect, useState } from 'react';
import { X, AlertOctagon, AlertTriangle, Lightbulb } from 'lucide-react';
import { notifyEventName, type NotifyPayload } from '../utils/notify';
import { splitIssueHeadingAndError } from '../utils/gradingIssues';
import { extractGradingGuideSection, stripGradingGuideSection } from '../utils/gradingText';

const ErrorModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<NotifyPayload | null>(null);

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<NotifyPayload>;
      const detail = customEvent.detail;
      if (!detail) return;
      if (detail.type !== 'error') return;

      setPayload(detail);
      setOpen(true);
    };

    window.addEventListener(notifyEventName, handler as EventListener);
    return () => window.removeEventListener(notifyEventName, handler as EventListener);
  }, []);

  if (!open || !payload) return null;

  const issues = (payload.issues || [])
    .map((issue) => ({
      ...issue,
      error: stripGradingGuideSection(issue.error || ''),
      fixAction: ((issue.fixAction || '').trim() || extractGradingGuideSection(issue.error || '')),
    }))
    .filter((issue) => issue.error.length > 0);

  const messageBlocks = (payload.message || '')
    .split(/\n\s*\n/)
    .map((s) => stripGradingGuideSection(s))
    .filter(Boolean);

  const explicitGuideBlocks = (payload.guide || '')
    .split(/\n\s*\n/)
    .map((s) => s.trim());

  const guideBlocks = ((payload.message || '')
    .split(/\n\s*\n/)
    .map((s, idx) => explicitGuideBlocks[idx] || extractGradingGuideSection(s)))
    .filter((_, idx) => Boolean(messageBlocks[idx]));

  return (
    <div className="fixed inset-0 z-[11000] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

      <div className="relative w-[min(92vw,720px)] max-h-[86vh] overflow-auto rounded-lg border bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-rose-50 p-2 text-rose-700">
            <AlertOctagon size={22} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-semibold text-rose-800">{payload.title ?? 'Lỗi'}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded p-1 text-current/70 transition hover:bg-black/5"
                aria-label="Đóng"
              >
                <X />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-sm">
              {issues.length > 0
                ? issues.map((issue, idx) => (
                  (() => {
                    const { question, error } = splitIssueHeadingAndError(issue.error);

                    return (
                      <div
                        key={`${issue.taskId || idx}-${issue.error}`}
                        className="rounded-lg border border-orange-100 bg-orange-50/40 p-3"
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-orange-600" />
                          <div className="min-w-0 flex-1 space-y-1">
                            {question && (
                              <div className="whitespace-pre-wrap font-semibold text-sky-700">
                                {question}
                              </div>
                            )}
                            <div className="whitespace-pre-wrap font-medium text-orange-600">
                              {error}
                            </div>

                            {issue.fixAction && (
                              <div className="flex items-start gap-2 pt-1 text-emerald-700">
                                <Lightbulb size={17} className="mt-0.5 shrink-0" />
                                <span className="whitespace-pre-wrap font-medium">
                                  Hướng dẫn sửa: {issue.fixAction}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ))
                : messageBlocks.map((m, idx) => (
                  (() => {
                    const { question, error } = splitIssueHeadingAndError(m);

                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-orange-100 bg-orange-50/40 p-3"
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-orange-600" />
                          <div className="min-w-0 flex-1 space-y-1">
                            {question && (
                              <div className="whitespace-pre-wrap font-semibold text-sky-700">
                                {question}
                              </div>
                            )}
                            <div className="whitespace-pre-wrap font-medium text-orange-600">
                              {error}
                            </div>

                            {guideBlocks[idx] && (
                              <div className="flex items-start gap-2 pt-1 text-emerald-700">
                                <Lightbulb size={17} className="mt-0.5 shrink-0" />
                                <span className="whitespace-pre-wrap font-medium">
                                  Hướng dẫn sửa: {guideBlocks[idx]}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ))}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const combined = issues.length > 0
                    ? issues
                      .map((issue) => issue.error + (issue.fixAction ? '\n\nHướng dẫn:\n' + issue.fixAction : ''))
                      .join('\n\n')
                    : messageBlocks
                      .map((m, i) => m + (guideBlocks[i] ? '\n\nHướng dẫn:\n' + guideBlocks[i] : ''))
                      .join('\n\n');
                  navigator.clipboard?.writeText(`${payload.title ?? 'Lỗi'}\n\n${combined}`);
                }}
                className="rounded bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
              >
                Sao chép nội dung
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded bg-rose-600 px-3 py-1 text-sm text-white hover:bg-rose-700"
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
