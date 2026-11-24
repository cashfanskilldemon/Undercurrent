import { Hash, PenLine } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useApp } from '../store/app-store';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../components/layout/PageHeader';
import { PostCard } from '../components/feed/PostCard';
import { EmptyState } from '../components/ui/EmptyState';
import { formatCount } from '../lib/format';

/** 话题页：聚合带该标签的帖子 */
export function TopicPage() {
  const { tag: rawTag } = useParams();
  const tag = decodeURIComponent(rawTag ?? '');
  const { threads, tagStats, openComposer } = useApp();

  useDocumentTitle(tag ? `#${tag}` : '话题');

  const matched = threads.filter((thread) => thread.tags.includes(tag));
  const stat = tagStats.find((item) => item.tag === tag);

  return (
    <>
      <PageHeader
        title={`#${tag}`}
        subtitle={`${formatCount(stat?.posts ?? matched.length)} 条讨论`}
        backTo="/"
        actions={
          <button
            type="button"
            onClick={() => openComposer('post', { tag })}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-bold text-primary-fg"
          >
            <PenLine size={15} />
            参与
          </button>
        }
      />

      <div className="uc-line flex items-center gap-2 px-4 py-3 text-sm text-muted sm:px-6">
        <Hash size={15} className="text-primary" />
        关于「{tag}」的帖子都汇总在这里，发帖时带上这个话题即可被收录。
      </div>

      {matched.length > 0 ? (
        <div>
          {matched.map((thread) => (
            <PostCard key={thread.id} thread={thread} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="这个话题还没有帖子"
          description="做第一个发起讨论的人。"
          action={
            <button
              type="button"
              onClick={() => openComposer('post', { tag })}
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-fg"
            >
              发一条 #{tag}
            </button>
          }
        />
      )}
    </>
  );
}
