import {
  Bell,
  Home,
  Moon,
  Music2,
  PenLine,
  Puzzle,
  Search,
  Sun,
  User,
  MessagesSquare,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useApp } from '../../store/app-store';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/format';

const NAV_ITEMS = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/search', label: '发现', icon: Search, end: false },
  { to: '/notifications', label: '通知', icon: Bell, end: false },
  { to: '/threads', label: '讨论区', icon: MessagesSquare, end: false },
  { to: '/tracks', label: '作品库', icon: Music2, end: false },
  { to: '/plugins', label: '插件区', icon: Puzzle, end: false },
] as const;

/** 桌面左侧固定导航：宽屏显示文字，768–1280 收成图标栏 */
export function LeftRail() {
  const { theme, toggleTheme, unreadCount, openComposer, artistById } = useApp();
  const me = artistById('me');

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[84px] flex-col border-r border-border bg-bg px-3 py-4 md:flex xl:w-[260px] xl:px-5">
      <NavLink to="/" className="mb-6 flex items-center gap-3 px-2" aria-label="Undercurrent 首页">
        <LogoMark />
        <span className="hidden font-display text-2xl font-bold tracking-[0.08em] xl:inline">Undercurrent</span>
      </NavLink>

      <nav className="flex flex-col gap-1" aria-label="主导航">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            className={({ isActive }) => cn('uc-nav-item', isActive && 'uc-nav-item-active')}
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'relative grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors',
                    isActive && 'bg-primary/15 text-primary',
                  )}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 1.8} />
                  {to === '/notifications' && unreadCount > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[10px] font-bold text-primary-fg">
                      {unreadCount}
                    </span>
                  ) : null}
                </span>
                <span className="hidden xl:inline">{label}</span>
              </>
            )}
          </NavLink>
        ))}
        <NavLink
          to="/u/tideline"
          title="我的主页"
          className={({ isActive }) => cn('uc-nav-item', isActive && 'uc-nav-item-active')}
        >
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors',
                  isActive && 'bg-primary/15 text-primary',
                )}
              >
                <User size={22} strokeWidth={isActive ? 2.4 : 1.8} />
              </span>
              <span className="hidden xl:inline">我的主页</span>
            </>
          )}
        </NavLink>
      </nav>

      <button
        type="button"
        onClick={() => openComposer('post')}
        className="mt-5 flex items-center justify-center gap-2 rounded-full bg-primary py-3 font-bold text-primary-fg transition-transform hover:brightness-105 active:scale-[0.98]"
      >
        <PenLine size={18} strokeWidth={2.6} />
        <span className="hidden xl:inline">发帖</span>
      </button>

      <div className="mt-auto flex flex-col gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          className="uc-nav-item justify-start"
          aria-label={theme === 'dark' ? '切换到亮色主题' : '切换到暗色主题'}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </span>
          <span className="hidden xl:inline">{theme === 'dark' ? '亮色模式' : '暗色模式'}</span>
        </button>

        <NavLink
          to="/u/tideline"
          className="flex items-center gap-3 rounded-full px-2 py-2 transition-colors hover:bg-surface-2"
        >
          <Avatar artist={me} size={36} linked={false} />
          <span className="hidden min-w-0 xl:block">
            <span className="block truncate text-sm font-bold">{me?.name}</span>
            <span className="block truncate font-mono text-xs text-muted">@{me?.handle}</span>
          </span>
        </NavLink>
      </div>
    </aside>
  );
}

function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" className="h-9 w-9 text-fg" fill="none" aria-hidden="true">
      <path d="M3 11c3.2 2.6 6.2 2.6 9.4 0 3.2-2.6 6.2-2.6 9.4 0 2.3 1.9 4.5 2.4 7.2 1.2" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M3 17c3.2 2.6 6.2 2.6 9.4 0 3.2-2.6 6.2-2.6 9.4 0 2.3 1.9 4.5 2.4 7.2 1.2" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.7" />
      <path d="M3 23c3.2 2.6 6.2 2.6 9.4 0 3.2-2.6 6.2-2.6 9.4 0 2.3 1.9 4.5 2.4 7.2 1.2" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}
