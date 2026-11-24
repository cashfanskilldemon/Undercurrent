import { Bookmark, Heart, MessageCircle, Pin, Repeat2, Share2 } from 'lucide-react';
import { type MouseEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Thread } from '../../types';
import { useApp } from '../../store/app-store';
import { cn, copyText, formatCount } from '../../lib/format';
import { Avatar } from '../ui/Avatar';
import { Verified } from '../ui/Verified';
import { TrackEmbed } from './TrackEmbed';
import { PluginEmbed } from './PluginEmbed';

interface PostCardProps {
  thread: Thread;
  /** 详情页使用更大的正文与字号 */
  detail?: boolean;
}

/** X 式帖子卡片：整卡可点进详情，内部按钮各自阻止冒泡 */
export function PostCard({ thread, detail = false }: PostCardProps) {
  const navigate = useNavigate();
  const {
    artistById,
    isLikedPost,
    isRepostedPost,
    isBookmarkedPost,
    likeCount,
    repostCount,
    replyCount,
    togglePostLike,
    togglePostRepost,
    togglePostBookmark,
    notify,
  } = useApp();

  const author = artistById(thread.authorId);
  const liked = isLikedPost(thread.id);
  const reposted = isRepostedPost(thread.id);
  const bookmarked = isBookmarkedPost(thread.id);
  const detailPath = `/threads/${thread.id}`;

  const openDetail = () => navigate(detailPath);

  const handleShare = async (event: MouseEvent) => {
    event.stopPropagation();
    const url = `${window.location.origin}${detailPath}`;
    const ok = await copyText(url);
    notify(ok ? '链接已复制' : '复制失败，请手动复制地址栏');
  };

  return (
    <article
      onClick={openDetail}
      className={cn(
        'uc-line cursor-pointer px-4 py-3.5 transition-colors hover:bg-surface/60 sm:px-6',
        detail && 'cursor-default hover:bg-transparent',
      )}
    >
      {thread.pinned ? (
        <p className="mb-2 flex items-center gap-1.5 pl-14 text-xs font-medium text-muted">
          <Pin size={12} /> 置顶
        </p>
      ) : null}

      <div className="flex gap-3">
        <Avatar artist={author} size={44} />

        <div className="min-w-0 flex-1">
          <header className="flex items-baseline gap-1.5">
            <Link
              to={author ? `/u/${author.handle}` : '#'}
              onClick={(event) => event.stopPropagation()}
              className="flex min-w-0 items-center gap-1 truncate text-[15px] font-bold hover:underline"
            >
              <span className="truncate">{author?.name ?? '未知用户'}</span>
              {author?.verified ? <Verified /> : null}
            </Link>
            <span className="truncate font-mono text-xs text-muted">@{author?.handle}</span>
            <span className="text-xs text-muted">·</span>
            <time className="shrink-0 text-xs text-muted">{thread.time}</time>
            <Link
              to={`/threads?channel=${encodeURIComponent(thread.channel)}`}
              onClick={(event) => event.stopPropagation()}
              className="ml-auto shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted transition-colors hover:border-primary/50 hover:text-fg"
            >
              {thread.channel}
            </Link>
          </header>

          <p
            className={cn(
              'mt-1 whitespace-pre-wrap break-words leading-relaxed',
              detail ? 'text-[1.05rem]' : 'text-[15px]',
            )}
          >
            {thread.body}
          </p>

          {thread.tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {thread.tags.map((tag) => (
                <Link
                  key={tag}
                  to={`/topics/${encodeURIComponent(tag)}`}
                  onClick={(event) => event.stopPropagation()}
                  className="text-xs text-primary/90 hover:underline"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          ) : null}

          {thread.image ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <img
                src={`/img/${thread.image}`}
                alt="帖子配图"
                loading="lazy"
                className="aspect-[16/10] w-full object-cover"
              />
            </div>
          ) : null}

          {thread.attachment?.kind === 'track' ? <TrackEmbed trackId={thread.attachment.trackId} /> : null}
          {thread.attachment?.kind === 'plugin' ? <PluginEmbed pluginId={thread.attachment.pluginId} /> : null}

          <div className="mt-3 flex items-center justify-between pr-2 text-muted">
            <ActionButton
              icon={<MessageCircle size={17} />}
              label="回复"
              count={replyCount(thread)}
              onClick={(event) => {
                event.stopPropagation();
                openDetail();
              }}
            />
            <ActionButton
              icon={<Repeat2 size={17} />}
              label={reposted ? '取消转发' : '转发'}
              count={repostCount(thread)}
              active={reposted}
              activeClass="text-primary"
              onClick={(event) => {
                event.stopPropagation();
                togglePostRepost(thread.id);
              }}
            />
            <ActionButton
              icon={<Heart size={17} fill={liked ? 'currentColor' : 'none'} />}
              label={liked ? '取消点赞' : '点赞'}
              count={likeCount(thread)}
              active={liked}
              activeClass="text-rust"
              onClick={(event) => {
                event.stopPropagation();
                togglePostLike(thread.id);
              }}
            />
            <ActionButton
              icon={<Bookmark size={17} fill={bookmarked ? 'currentColor' : 'none'} />}
              label={bookmarked ? '取消收藏' : '收藏'}
              active={bookmarked}
              activeClass="text-primary"
              onClick={(event) => {
                event.stopPropagation();
                togglePostBookmark(thread.id);
                notify(bookmarked ? '已取消收藏' : '已收藏');
              }}
            />
            <ActionButton icon={<Share2 size={17} />} label="分享" onClick={handleShare} />
          </div>
        </div>
      </div>
    </article>
  );
}

interface ActionButtonProps {
  icon: ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  activeClass?: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

function ActionButton({ icon, label, count, active, activeClass, onClick }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        'group/action flex items-center gap-1.5 rounded-full py-1 pr-2 text-xs transition-colors hover:text-primary',
        active && activeClass,
      )}
    >
      <span className="grid h-7 w-7 place-items-center rounded-full transition-colors group-hover/action:bg-primary/10">
        {icon}
      </span>
      {typeof count === 'number' ? <span className="font-mono">{count > 0 ? formatCount(count) : ''}</span> : null}
    </button>
  );
}
