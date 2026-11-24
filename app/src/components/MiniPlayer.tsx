import { Pause, Play, SkipBack, SkipForward, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '../store/app-store';
import { formatDuration } from '../lib/format';

/** 底部迷你播放器（模拟试听，无音频文件） */
export function MiniPlayer() {
  const { currentTrack, player, artistById, togglePlay, nextTrack, prevTrack, closePlayer } = useApp();
  if (!currentTrack) return null;

  const artist = artistById(currentTrack.artistId);
  const percent = Math.min(100, (player.progress / currentTrack.duration) * 100);

  return (
    <div className="fixed inset-x-3 bottom-[70px] z-40 md:inset-x-auto md:bottom-4 md:left-[96px] md:w-[min(620px,calc(100vw-260px))] xl:left-[276px] xl:w-[600px]">
      <div className="uc-card overflow-hidden bg-surface/95 shadow-lift backdrop-blur">
        <div className="flex items-center gap-3 px-3 py-2.5">
          <Link to="/tracks" className="shrink-0" aria-label="打开作品库">
            <img
              src={`/img/${currentTrack.cover}`}
              alt={`《${currentTrack.title}》封面`}
              className="h-12 w-12 rounded-lg object-cover"
            />
          </Link>
          <div className="min-w-0 flex-1">
            <Link to="/tracks" className="block truncate text-sm font-bold hover:underline">
              {currentTrack.title}
            </Link>
            <p className="truncate text-xs text-muted">
              {artist?.name} · {currentTrack.genre} · 试听模拟
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" className="uc-icon-btn" onClick={prevTrack} aria-label="上一首">
              <SkipBack size={17} />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              aria-label={player.isPlaying ? '暂停' : '播放'}
              className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-fg"
            >
              {player.isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}
            </button>
            <button type="button" className="uc-icon-btn" onClick={nextTrack} aria-label="下一首">
              <SkipForward size={17} />
            </button>
            <button type="button" className="uc-icon-btn" onClick={closePlayer} aria-label="关闭播放器">
              <X size={16} />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 pb-2 font-mono text-[10px] text-muted">
          <span>{formatDuration(player.progress)}</span>
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: `${percent}%` }} />
          </div>
          <span>{formatDuration(currentTrack.duration)}</span>
        </div>
      </div>
    </div>
  );
}
