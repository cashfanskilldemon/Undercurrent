import { Pause, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Track } from '../../types';
import { useApp } from '../../store/app-store';
import { cn, formatCount, formatDuration } from '../../lib/format';

interface TrackCardProps {
  track: Track;
  variant?: 'grid' | 'list';
}

/** 作品卡片：网格态走 Ins 方形封面，列表态走信息流行 */
export function TrackCard({ track, variant = 'grid' }: TrackCardProps) {
  const { artistById, playTrack, player } = useApp();
  const artist = artistById(track.artistId);
  const isPlaying = player.trackId === track.id && player.isPlaying;

  if (variant === 'list') {
    return (
      <article className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-surface/60 sm:px-6">
        <button
          type="button"
          onClick={() => playTrack(track.id)}
          aria-label={`${isPlaying ? '暂停' : '播放'}《${track.title}》`}
          className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg"
        >
          <img src={`/img/${track.cover}`} alt={`《${track.title}》封面`} loading="lazy" className="h-full w-full object-cover" />
          <span className="absolute inset-0 grid place-items-center bg-black/35">
            {isPlaying ? <Pause size={15} className="text-white" fill="currentColor" /> : <Play size={15} className="text-white" fill="currentColor" />}
          </span>
        </button>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold">{track.title}</h3>
          <p className="truncate text-xs text-muted">
            {artist ? (
              <Link to={`/u/${artist.handle}`} className="hover:underline">
                {artist.name}
              </Link>
            ) : (
              '未知艺人'
            )}
            <span className="mx-1">·</span>
            {track.genre}
            <span className="mx-1">·</span>
            {track.bpm} BPM
          </p>
        </div>
        <span className="shrink-0 font-mono text-xs text-muted">{formatDuration(track.duration)}</span>
        <span className="hidden shrink-0 font-mono text-xs text-muted sm:inline">{formatCount(track.plays)} 播放</span>
      </article>
    );
  }

  return (
    <article className="group">
      <button
        type="button"
        onClick={() => playTrack(track.id)}
        aria-label={`${isPlaying ? '暂停' : '播放'}《${track.title}》`}
        className="relative block w-full overflow-hidden rounded-xl border border-border bg-surface-2"
      >
        <img
          src={`/img/${track.cover}`}
          alt={`《${track.title}》封面`}
          loading="lazy"
          className="uc-cover-img aspect-square w-full"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80" />
        <span className="absolute bottom-2 left-2 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[10px] text-white">
          {formatDuration(track.duration)}
        </span>
        <span
          className={cn(
            'absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-fg opacity-0 transition-all group-hover:opacity-100',
            isPlaying && 'opacity-100',
          )}
        >
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </span>
      </button>

      <div className="mt-2 px-0.5">
        <h3 className="truncate text-sm font-bold">{track.title}</h3>
        <p className="truncate text-xs text-muted">
          {artist ? (
            <Link to={`/u/${artist.handle}`} className="hover:underline">
              {artist.name}
            </Link>
          ) : (
            '未知艺人'
          )}
          <span className="mx-1">·</span>
          {track.genre}
        </p>
        <p className="mt-1 flex items-center gap-2 font-mono text-[10px] text-muted">
          <span>{track.bpm} BPM</span>
          <span>{track.musicalKey}</span>
          <span className="ml-auto">{formatCount(track.plays)}</span>
        </p>
      </div>
    </article>
  );
}
