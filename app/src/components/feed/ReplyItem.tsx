import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Reply } from '../../types';
import { useApp } from '../../store/app-store';
import { cn, formatCount } from '../../lib/format';
import { Avatar } from '../ui/Avatar';
import { Verified } from '../ui/Verified';

/** 楼中楼回复：左侧竖线连成 X 式对话线 */
export function ReplyItem({ reply }: { reply: Reply }) {
  const { artistById, isLikedReply, toggleReplyLike } = useApp();
  const author = artistById(reply.authorId);
  const liked = isLikedReply(reply.id);

  return (
    <article className="flex gap-3 px-4 py-3 transition-colors hover:bg-surface/50 sm:px-6">
      <Avatar artist={author} size={36} />
      <div className="min-w-0 flex-1">
        <header className="flex items-center gap-1.5">
          <Link
            to={author ? `/u/${author.handle}` : '#'}
            className="flex min-w-0 items-center gap-1 truncate text-sm font-bold hover:underline"
          >
            <span className="truncate">{author?.name ?? '未知用户'}</span>
            {author?.verified ? <Verified size={13} /> : null}
          </Link>
          <span className="truncate font-mono text-xs text-muted">@{author?.handle}</span>
          <span className="text-xs text-muted">·</span>
          <time className="shrink-0 text-xs text-muted">{reply.time}</time>
        </header>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">{reply.body}</p>
        <button
          type="button"
          onClick={() => toggleReplyLike(reply.id)}
          aria-pressed={liked}
          aria-label={liked ? '取消点赞回复' : '点赞回复'}
          className={cn(
            'mt-1.5 flex items-center gap-1 rounded-full pr-2 text-xs transition-colors hover:text-rust',
            liked ? 'text-rust' : 'text-muted',
          )}
        >
          <span className="grid h-6 w-6 place-items-center rounded-full hover:bg-rust/10">
            <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
          </span>
          <span className="font-mono">{formatCount(reply.likes + (liked ? 1 : 0))}</span>
        </button>
      </div>
    </article>
  );
}
