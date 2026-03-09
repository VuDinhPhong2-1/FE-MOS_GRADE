import { useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, Info, OctagonAlert, X } from 'lucide-react';
import { notifyEventName, type NotifyPayload, type NotifyType } from '../utils/notify';

interface ToastItem {
  id: string;
  message: string;
  type: NotifyType;
  durationMs: number;
}

const defaultDurationByType: Record<NotifyType, number> = {
  success: 3200,
  error: 4200,
  warning: 3600,
  info: 3200,
};

const toastStyleByType: Record<NotifyType, string> = {
  success:
    'border-emerald-200 bg-emerald-50 text-emerald-800 shadow-[0_6px_24px_rgba(5,150,105,0.15)]',
  error: 'border-rose-200 bg-rose-50 text-rose-800 shadow-[0_6px_24px_rgba(225,29,72,0.16)]',
  warning:
    'border-amber-200 bg-amber-50 text-amber-800 shadow-[0_6px_24px_rgba(217,119,6,0.16)]',
  info: 'border-sky-200 bg-sky-50 text-sky-800 shadow-[0_6px_24px_rgba(2,132,199,0.16)]',
};

const ToastIcon = ({ type }: { type: NotifyType }) => {
  if (type === 'success') return <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />;
  if (type === 'error') return <OctagonAlert size={18} className="mt-0.5 flex-shrink-0" />;
  if (type === 'warning') return <CircleAlert size={18} className="mt-0.5 flex-shrink-0" />;
  return <Info size={18} className="mt-0.5 flex-shrink-0" />;
};

const ToastCenter = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onNotify = (event: Event) => {
      const customEvent = event as CustomEvent<NotifyPayload>;
      const detail = customEvent.detail;
      if (!detail?.message) return;

      const nextType: NotifyType = detail.type ?? 'info';
      const toast: ToastItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message: detail.message,
        type: nextType,
        durationMs: detail.durationMs ?? defaultDurationByType[nextType],
      };

      setToasts((prev) => [...prev, toast]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== toast.id));
      }, toast.durationMs);
    };

    window.addEventListener(notifyEventName, onNotify as EventListener);
    return () => {
      window.removeEventListener(notifyEventName, onNotify as EventListener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[10000] flex w-[min(92vw,420px)] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-xl border px-3 py-2 ${toastStyleByType[toast.type]}`}
        >
          <div className="flex items-start gap-2">
            <ToastIcon type={toast.type} />
            <div className="min-w-0 flex-1 whitespace-pre-line break-words text-sm font-medium leading-5">
              {toast.message}
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== toast.id))}
              className="rounded p-0.5 text-current/70 transition hover:bg-black/5 hover:text-current"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToastCenter;

