import { Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../store/app-store';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../components/layout/PageHeader';
import { PostCard } from '../components/feed/PostCard';
import { ReplyItem } from '../components/feed/ReplyItem';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { formatCount } from '../lib/format';

/** 帖子详情：正文 + 回复列表 + 回复框 */
export function ThreadDetailPage() {
  const { threadId } = useParams();
  const { threads, artistById, addReply } = useApp();
  const thread = threads.find((t) => t.id === threadId);
  const me = artistById('me');
  const [draft, setDraft] = useState('');

  useDocumentTitle(thread ? `@${artistById(thread.authorId)?.handle} 的帖子` : '帖子不存在');

  if (!thread) {
    return (
      <>
        <PageHeader title="帖子" backTo="/threads" />
        <EmptyState
          title="这条帖子不在了"
          description="可能被作者删除，或者链接有误。"
          action={
            <Link to="/threads" className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-fg">
              回到讨论区
            </Link>
          }
        />
      </>
    );
  }

  const submitReply = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    addReply(thread.id, text);
    setDraft('');
  };

  return (
    <>
      <PageHeader title="帖子" subtitle={`${formatCount(thread.replies.length)} 条回复`} backTo="/threads" />

      <PostCard thread={thread} detail />

      <form onSubmit={submitReply} className="uc-line flex items-start gap-3 px-4 py-3 sm:px-6">
        <Avatar artist={me} size={36} linked={false} />
        <div className="min-w-0 flex-1">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={2}
            placeholder="说点有用的……"
            aria-label="回复内容"
            className="w-full resize-none rounded-xl border border-border bg-surface px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary/60"
          />
          <div className="mt-1.5 flex justify-end">
            <button
              type="submit"
              disabled={!draft.trim()}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-fg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send size={14} />
              回复
            </button>
          </div>
        </div>
      </form>

      <div>
        {thread.replies.length > 0 ? (
          thread.replies.map((reply) => <ReplyItem key={reply.id} reply={reply} />)
        ) : (
          <EmptyState title="还没有人回复" description="抢个首评，给作者一点反馈。" />
        )}
      </div>
    </>
  );
}
