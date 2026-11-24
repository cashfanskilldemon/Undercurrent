import { X } from 'lucide-react';
import { useEffect, type ReactNode } from 'react';
import { cn } from '../../lib/format';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClass?: string;
}

/** 通用弹层：点击遮罩或 Esc 关闭，打开时锁定页面滚动 */
export function Modal({ open, title, onClose, children, widthClass = 'max-w-xl' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-10 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'w-full animate-fade-up rounded-2xl border border-border bg-surface shadow-lift',
          widthClass,
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="font-cn text-xl tracking-wide">{title}</h2>
          <button type="button" className="uc-icon-btn" onClick={onClose} aria-label="关闭">
            <X size={18} />
          </button>
        </header>
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
