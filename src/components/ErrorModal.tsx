import { useEffect, useState } from 'react';
import { X, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { notifyEventName, type NotifyPayload } from '../utils/notify';

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

  const messageBlocks = (payload.message || '')
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  const guideBlocks = (payload.guide || '')
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);

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

            <div className="mt-3 text-sm">
              {messageBlocks.map((m, idx) => (
                <div key={idx} className="mb-3">
                  <div className="whitespace-pre-wrap text-rose-900">{m}</div>
                  {guideBlocks[idx] && (
                    <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 rounded-full bg-emerald-50 p-2 text-emerald-700">
                          <CheckCircle2 size={18} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-emerald-900">Hướng dẫn:</div>
                          <div className="mt-1 whitespace-pre-wrap text-emerald-900">{guideBlocks[idx]}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  const combined = messageBlocks
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
