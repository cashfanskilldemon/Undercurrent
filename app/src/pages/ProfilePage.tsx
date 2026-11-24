import { CalendarDays, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../store/app-store';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../components/layout/PageHeader';
import { PostCard } from '../components/feed/PostCard';
import { TrackCard } from '../components/track/TrackCard';
import { EmptyState } from '../components/ui/EmptyState';
import { Avatar } from '../components/ui/Avatar';
import { Verified } from '../components/ui/Verified';
import { FollowButton } from '../components/FollowButton';
import { cn, formatCount, hueGradient } from '../lib/format';

type ProfileTab = 'tracks' | 'threads' | 'likes';

/** 个人主页：资料头图 + 关注关系 + 作品/帖子/喜欢三个 tab */
export function ProfilePage() {
  const { handle } = useParams();
  const { artists, tracks, threads, state, notify, openComposer } = useApp();
  const artist = artists.find((item) => item.handle === handle);
  const [tab, setTab] = useState<ProfileTab>('tracks');

  useDocumentTitle(artist ? `${artist.name} (@${artist.handle})` : '用户不存在');

  if (!artist) {
    return (
      <>
        <PageHeader title="用户主页" backTo="/" />
        <EmptyState
          title="找不到这个用户"
          description="账号可能已注销，或者链接拼错了。"
          action={
            <Link to="/" className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-fg">
              回到首页
            </Link>
          }
        />
      </>
    );
  }

  const isMe = artist.id === 'me';
  const artistTracks = tracks.filter((track) => track.artistId === artist.id);
  const artistThreads = threads.filter((thread) => thread.authorId === artist.id);
  const likedThreads = threads.filter((thread) => state.likedPosts[thread.id]);
  const followingCount = Object.keys(state.followed).length;
  const followerCount = artist.followers + (isMe ? 0 : state.followed[artist.id] ? 1 : 0);

  const tabs: Array<{ key: ProfileTab; label: string; count: number }> = [
    { key: 'tracks', label: '作品', count: artistTracks.length },
    { key: 'threads', label: '帖子', count: artistThreads.length },
  ];
  if (isMe) tabs.push({ key: 'likes', label: '喜欢', count: likedThreads.length });

  return (
    <>
      <PageHeader title={artist.name} subtitle={`@${artist.handle}`} backTo="/" />

      <div className="h-32 sm:h-40" style={{ background: hueGradient(artist.hue, 0.4, 0.14) }} aria-hidden="true" />

      <section className="px-4 pb-3 sm:px-6">
        <div className="-mt-12 flex items-end justify-between gap-3">
          <Avatar artist={artist} size={88} linked={false} className="border-4 border-bg" />
          <div className="mb-1 flex items-center gap-2">
            {isMe ? (
              <>
                <button
                  type="button"
                  onClick={() => notify('资料编辑即将上线')}
                  className="rounded-full border border-border px-4 py-1.5 text-sm font-bold hover:border-border-strong"
                >
                  编辑资料
                </button>
                <button
                  type="button"
                  onClick={() => openComposer('upload')}
                  className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-fg"
                >
                  上传作品
                </button>
              </>
            ) : (
              <FollowButton artistId={artist.id} />
            )}
          </div>
        </div>

        <div className="mt-3">
          <h2 className="flex items-center gap-1.5 font-cn text-2xl tracking-wide">
            {artist.name}
            {artist.verified ? <Verified size={18} /> : null}
          </h2>
          <p className="font-mono text-xs text-muted">@{artist.handle}</p>
          <p className="mt-2 text-sm text-muted">
            {artist.role} · 在{artist.city}做声音，关注地下场景的流动与反馈。
          </p>
          <p className="mt-1.5 flex items-center gap-3 text-xs text-muted">
            <span className="flex items-center gap-1">
              <MapPin size={12} /> {artist.city}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays size={12} /> 2024 年加入
            </span>
          </p>

          <div className="mt-3 flex items-center gap-4 font-mono text-sm">
            <span>
              <span className="font-bold text-fg">{formatCount(artistTracks.length)}</span>
              <span className="ml-1 text-muted">作品</span>
            </span>
            <span>
              <span className="font-bold text-fg">{formatCount(followerCount)}</span>
              <span className="ml-1 text-muted">粉丝</span>
            </span>
            <span>
              <span className="font-bold text-fg">{formatCount(isMe ? followingCount : Math.round(artist.followers / 12))}</span>
              <span className="ml-1 text-muted">关注</span>
            </span>
          </div>
        </div>
      </section>

      <div className="flex border-y border-border" role="tablist" aria-label="个人内容">
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            onClick={() => setTab(item.key)}
            aria-selected={tab === item.key}
            className={cn('uc-tab', tab === item.key && 'uc-tab-active')}
          >
            {item.label}
            <span className="ml-1 font-mono text-[10px] text-muted">{item.count}</span>
            {tab === item.key ? (
              <span className="absolute inset-x-6 bottom-0 h-[2px] rounded-full bg-primary" aria-hidden="true" />
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'tracks' ? (
        artistTracks.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4 py-4 sm:px-6">
            {artistTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="还没有公开作品"
            description={isMe ? '上传第一首，让大家听到你的声音。' : '等 ta 发布新作品吧。'}
          />
        )
      ) : null}

      {tab === 'threads' ? (
        artistThreads.length > 0 ? (
          <div>
            {artistThreads.map((thread) => (
              <PostCard key={thread.id} thread={thread} />
            ))}
          </div>
        ) : (
          <EmptyState title="还没有发过帖子" description={isMe ? '去讨论区开个话题吧。' : '等 ta 发帖吧。'} />
        )
      ) : null}

      {tab === 'likes' ? (
        likedThreads.length > 0 ? (
          <div>
            {likedThreads.map((thread) => (
              <PostCard key={thread.id} thread={thread} />
            ))}
          </div>
        ) : (
          <EmptyState title="还没有喜欢的帖子" description="在信息流里点赞的帖子会出现在这里。" />
        )
      ) : null}
    </>
  );
}
