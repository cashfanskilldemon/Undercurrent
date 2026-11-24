import { useEffect } from 'react';
import { useApp } from '../store/app-store';

/** 轻提示：自动消失，用于发帖成功、复制链接等反馈 */
export function ToastViewport() {
  const { toasts, dismissToast } = useApp();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4 md:bottom-8">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} id={toast.id} message={toast.message} onDismiss={dismissToast} />
      ))}
    </div>
  );
}

function ToastItem({
  id,
  message,
  onDismiss,
}: {
  id: string;
  message: string;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(id), 2600);
    return () => window.clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <button
      type="button"
      onClick={() => onDismiss(id)}
      className="pointer-events-auto animate-toast-in rounded-full border border-primary/40 bg-surface px-4 py-2 text-sm text-fg shadow-lift"
    >
      {message}
    </button>
  );
}
