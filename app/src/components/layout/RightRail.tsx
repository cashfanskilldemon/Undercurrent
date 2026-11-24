import { Search, TrendingUp } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../store/app-store';
import { formatCount } from '../../lib/format';
import { Avatar } from '../ui/Avatar';
import { Verified } from '../ui/Verified';
import { FollowButton } from '../FollowButton';

/** 桌面右栏：搜索、今日热议、推荐关注、正在热播 */
export function RightRail() {
  const { tagStats, artists, tracks, artistById, playTrack } = useApp();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const suggestions = [...artists]
    .filter((a) => a.id !== 'me')
    .sort((a, b) => b.followers - a.followers)
    .slice(0, 4);
  const hotTracks = [...tracks].sort((a, b) => b.plays - a.plays).slice(0, 3);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : '/search');
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-[340px] shrink-0 overflow-y-auto px-5 py-4 xl:block">
      <form onSubmit={handleSearch} className="relative">
        <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜索艺人、作品、插件"
          aria-label="搜索"
          className="w-full rounded-full border border-border bg-surface py-2.5 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary/60"
        />
      </form>

      <section className="uc-card mt-4 p-4">
        <h2 className="flex items-center gap-2 font-cn text-lg tracking-wide">
          <TrendingUp size={17} className="text-primary" />
          今日热议
        </h2>
        <ol className="mt-2">
          {tagStats.slice(0, 5).map((tag, index) => (
            <li key={tag.tag}>
              <Link
                to={`/topics/${encodeURIComponent(tag.tag)}`}
                className="flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-surface-2"
              >
                <span className="mt-0.5 font-mono text-xs text-muted">{String(index + 1).padStart(2, '0')}</span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">#{tag.tag}</span>
                  <span className="block text-xs text-muted">{formatCount(tag.posts)} 条讨论</span>
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="uc-card mt-4 p-4">
        <h2 className="font-cn text-lg tracking-wide">推荐关注</h2>
        <ul className="mt-2">
          {suggestions.map((artist) => (
            <li key={artist.id} className="flex items-center gap-3 py-2">
              <Avatar artist={artist} size={40} />
              <div className="min-w-0 flex-1">
                <Link to={`/u/${artist.handle}`} className="flex items-center gap-1 truncate text-sm font-bold hover:underline">
                  {artist.name}
                  {artist.verified ? <Verified /> : null}
                </Link>
                <p className="truncate font-mono text-xs text-muted">@{artist.handle}</p>
              </div>
              <FollowButton artistId={artist.id} size="sm" />
            </li>
          ))}
        </ul>
      </section>

      <section className="uc-card mt-4 p-4">
        <h2 className="font-cn text-lg tracking-wide">正在热播</h2>
        <ul className="mt-2 space-y-1">
          {hotTracks.map((track, index) => {
            const artist = artistById(track.artistId);
            return (
              <li key={track.id}>
                <button
                  type="button"
                  onClick={() => playTrack(track.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="font-mono text-xs text-muted">{String(index + 1).padStart(2, '0')}</span>
                  <img
                    src={`/img/${track.cover}`}
                    alt={`《${track.title}》封面`}
                    loading="lazy"
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{track.title}</span>
                    <span className="block truncate text-xs text-muted">{artist?.name}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <p className="mt-6 px-2 text-xs leading-relaxed text-muted">
        Undercurrent · 地下嘻哈 × 电子音乐
        <br />
        关于 · 社区规则 · 隐私 · © 2026
      </p>
    </aside>
  );
}
