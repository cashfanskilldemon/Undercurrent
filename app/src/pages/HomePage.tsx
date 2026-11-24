import { Bell, Search } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store/app-store';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../components/layout/PageHeader';
import { StoryStrip } from '../components/feed/StoryStrip';
import { InlineComposer } from '../components/feed/InlineComposer';
import { PostCard } from '../components/feed/PostCard';
import { EmptyState } from '../components/ui/EmptyState';
import { cn } from '../lib/format';

type FeedTab = 'for-you' | 'following';

/** 首页：推荐/关注双流，X 式信息流 + Ins 故事条 */
export function HomePage() {
  useDocumentTitle('首页');
  const { threads, state, unreadCount } = useApp();
  const [tab, setTab] = useState<FeedTab>('for-you');

  const ordered = [...threads].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
  const visible =
    tab === 'following'
      ? ordered.filter((thread) => thread.authorId === 'me' || Boolean(state.followed[thread.authorId]))
      : ordered;

  return (
    <>
      <PageHeader
        title="首页"
        subtitle="地下嘻哈 × 电子音乐"
        actions={
          <div className="flex items-center gap-0.5 md:hidden">
            <Link to="/search" className="uc-icon-btn" aria-label="搜索">
              <Search size={18} />
            </Link>
            <Link to="/notifications" className="uc-icon-btn relative" aria-label="通知">
              <Bell size={18} />
              {unreadCount > 0 ? (
                <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              ) : null}
            </Link>
          </div>
        }
        tabs={
          <div className="flex" role="tablist" aria-label="信息流">
            {(
              [
                { key: 'for-you', label: '推荐' },
                { key: 'following', label: '关注' },
              ] as const
            ).map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                onClick={() => setTab(item.key)}
                aria-selected={tab === item.key}
                className={cn('uc-tab', tab === item.key && 'uc-tab-active')}
              >
                {item.label}
                {tab === item.key ? (
                  <span className="absolute inset-x-6 bottom-0 h-[2px] rounded-full bg-primary" aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
        }
      />

      <InlineComposer />
      <StoryStrip />

      {visible.length > 0 ? (
        <div>
          {visible.map((thread) => (
            <PostCard key={thread.id} thread={thread} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="关注流还是空的"
          description="关注几位制作人或听众，他们的新帖会出现在这里。"
          action={
            <Link
              to="/search?tab=artists"
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-fg"
            >
              去找人关注
            </Link>
          }
        />
      )}
    </>
  );
}
