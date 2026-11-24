import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { cn } from '../../lib/format';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  backTo?: string;
  actions?: ReactNode;
  tabs?: ReactNode;
  className?: string;
}

/** 中列吸顶头：标题 + 操作 + 可选 tab 行 */
export function PageHeader({ title, subtitle, backTo, actions, tabs, className }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={cn('uc-glass sticky top-0 z-30 border-b border-border', className)}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-1">
          {backTo ? (
            <button type="button" onClick={() => navigate(backTo)} aria-label="返回" className="uc-icon-btn -ml-2">
              <ArrowLeft size={19} />
            </button>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate font-cn text-xl leading-tight tracking-wide">{title}</h1>
            {subtitle ? <p className="mt-0.5 truncate text-xs text-muted">{subtitle}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {tabs}
    </div>
  );
}
