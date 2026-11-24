import { Bell, Heart, MessageCircle, Sparkles, UserPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { NoticeType } from '../types';
import { useApp } from '../store/app-store';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../components/layout/PageHeader';
import { Avatar } from '../components/ui/Avatar';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../lib/format';

const TYPE_ICON = {
  like: Heart,
  reply: MessageCircle,
  follow: UserPlus,
  system: Sparkles,
} as const;

const TYPE_COLOR: Record<NoticeType, string> = {
  like: 'text-rust',
  reply: 'text-primary',
  follow: 'text-primary',
  system: 'text-muted',
};

/** 通知中心：本地已读状态，点击条目即标记已读 */
export function NotificationsPage() {
  useDocumentTitle('通知');
  const { notices, state, unreadCount, markNoticeRead, markAllRead, artistById } = useApp();

  return (
    <>
      <PageHeader
        title="通知"
        subtitle={unreadCount > 0 ? `${unreadCount} 条未读` : '全部已读'}
        actions={
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="rounded-full border border-border px-3 py-1.5 text-xs text-fg transition-colors hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-40"
          >
            全部已读
          </button>
        }
      />

      {notices.length === 0 ? (
        <EmptyState title="还没有通知" description="有人回复、点赞或关注你时会出现在这里。" />
      ) : (
        <ul>
          {notices.map((notice) => {
            const unread = !state.readNotices[notice.id];
            const actor = notice.actorId ? artistById(notice.actorId) : undefined;
            const Icon = TYPE_ICON[notice.type];
            const content = (
              <>
                <span className="relative shrink-0">
                  {actor ? <Avatar artist={actor} size={40} linked={false} /> : null}
                  {!actor ? (
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2">
                      <Bell size={18} className="text-muted" />
                    </span>
                  ) : null}
                  <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border border-border bg-bg">
                    <Icon size={11} className={TYPE_COLOR[notice.type]} />
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm leading-relaxed">
                    {actor ? <span className="font-bold">{actor.name} </span> : null}
                    {notice.text}
                  </span>
                  <time className="mt-0.5 block text-xs text-muted">{notice.time}</time>
                </span>
                {unread ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="未读" /> : null}
              </>
            );

            const className = cn(
              'uc-line flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface/60 sm:px-6',
              unread && 'bg-primary/[0.04]',
            );

            return (
              <li key={notice.id}>
                {notice.href ? (
                  <Link to={notice.href} className={className} onClick={() => markNoticeRead(notice.id)}>
                    {content}
                  </Link>
                ) : (
                  <button type="button" className={cn(className, 'w-full text-left')} onClick={() => markNoticeRead(notice.id)}>
                    {content}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
