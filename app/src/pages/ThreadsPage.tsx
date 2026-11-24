import { PenLine } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../store/app-store';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../components/layout/PageHeader';
import { InlineComposer } from '../components/feed/InlineComposer';
import { PostCard } from '../components/feed/PostCard';
import { cn, formatCount } from '../lib/format';

/** 讨论区：频道筛选 + 信息流 */
export function ThreadsPage() {
  useDocumentTitle('讨论区');
  const { threads, channels, openComposer, replyCount } = useApp();
  const [params, setParams] = useSearchParams();
  const activeChannel = params.get('channel') ?? '全部';

  const ordered = [...threads].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
  const visible = activeChannel === '全部' ? ordered : ordered.filter((t) => t.channel === activeChannel);
  const totalReplies = threads.reduce((sum, thread) => sum + replyCount(thread), 0);

  const selectChannel = (channel: string) => {
    if (channel === '全部') {
      setParams({});
    } else {
      setParams({ channel });
    }
  };

  return (
    <>
      <PageHeader
        title="讨论区"
        subtitle={`${formatCount(threads.length)} 条讨论 · ${formatCount(totalReplies)} 条回复`}
        actions={
          <button
            type="button"
            onClick={() => openComposer('post')}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-bold text-primary-fg"
          >
            <PenLine size={15} />
            发帖
          </button>
        }
        tabs={
          <div className="uc-scroll-x px-4 pb-2.5 pt-1 sm:px-6">
            {channels.map((channel) => (
              <button
                key={channel}
                type="button"
                onClick={() => selectChannel(channel)}
                aria-pressed={activeChannel === channel}
                className={cn('uc-chip shrink-0', activeChannel === channel && 'uc-chip-active')}
              >
                {channel}
              </button>
            ))}
          </div>
        }
      />

      <InlineComposer />

      <div>
        {visible.map((thread) => (
          <PostCard key={thread.id} thread={thread} />
        ))}
      </div>
    </>
  );
}
