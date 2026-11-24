import { Bell, Home, MessagesSquare, Music2, PenLine, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../store/app-store';
import { cn } from '../../lib/format';

const ITEMS = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/threads', label: '讨论', icon: MessagesSquare, end: false },
  { to: '/tracks', label: '作品', icon: Music2, end: false },
  { to: '/notifications', label: '通知', icon: Bell, end: false },
  { to: '/u/tideline', label: '我的', icon: User, end: false },
] as const;

/** 移动端底部导航 + 悬浮发帖按钮 */
export function MobileTabBar() {
  const { openComposer, unreadCount, currentTrack } = useApp();

  return (
    <>
      <nav
        aria-label="底部导航"
        className="uc-glass fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-border pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {ITEMS.map((item) => (
          <TabItem key={item.to} {...item} badge={item.to === '/notifications' ? unreadCount : 0} />
        ))}
      </nav>

      <button
        type="button"
        onClick={() => openComposer('post')}
        aria-label="发帖"
        className={cn(
          'fixed right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-fg shadow-lift transition-transform active:scale-95 md:hidden',
          currentTrack ? 'bottom-[136px]' : 'bottom-[76px]',
        )}
      >
        <PenLine size={21} strokeWidth={2.6} />
      </button>
    </>
  );
}

function TabItem({
  to,
  label,
  icon: Icon,
  end,
  badge = 0,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  end: boolean;
  badge?: number;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        cn('relative flex flex-col items-center gap-0.5 px-3 py-2 text-[10px]', isActive ? 'text-primary' : 'text-muted')
      }
    >
      <span className="relative">
        <Icon size={22} />
        {badge > 0 ? (
          <span className="absolute -right-2 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold text-primary-fg">
            {badge}
          </span>
        ) : null}
      </span>
      {label}
    </NavLink>
  );
}
