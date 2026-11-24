import { Pause, Play } from 'lucide-react';
import { useApp } from '../../store/app-store';
import { formatCount, formatDuration } from '../../lib/format';

/** 帖子内嵌作品卡片，点击即播放（模拟），不触发帖子跳转 */
export function TrackEmbed({ trackId }: { trackId: string }) {
  const { trackById, artistById, playTrack, player } = useApp();
  const track = trackById(trackId);
  if (!track) return null;
  const artist = artistById(track.artistId);
  const isPlaying = player.trackId === track.id && player.isPlaying;

  return (
    <div
      className="group/embed mt-3 flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface-2/70 p-3 transition-colors hover:border-border-strong"
      onClick={(event) => {
        event.stopPropagation();
        playTrack(track.id);
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          playTrack(track.id);
        }
      }}
      aria-label={`${isPlaying ? '暂停' : '播放'}《${track.title}》`}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
        <img src={`/img/${track.cover}`} alt={`《${track.title}》封面`} loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute inset-0 grid place-items-center bg-black/35 opacity-0 transition-opacity group-hover/embed:opacity-100">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-fg">
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </span>
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{track.title}</p>
        <p className="truncate text-xs text-muted">
          {artist?.name} · {formatCount(track.plays)} 次播放
        </p>
        <div className="mt-1 flex flex-wrap gap-1 font-mono text-[10px] text-muted">
          <span className="rounded bg-bg px-1.5 py-0.5">{track.genre}</span>
          <span className="rounded bg-bg px-1.5 py-0.5">{track.bpm} BPM</span>
          <span className="rounded bg-bg px-1.5 py-0.5">{track.musicalKey}</span>
          <span className="rounded bg-bg px-1.5 py-0.5">{formatDuration(track.duration)}</span>
        </div>
      </div>
      <div className="hidden h-10 items-end gap-[3px] sm:flex" aria-hidden="true">
        {[40, 70, 30, 90, 55, 75, 35, 60].map((height, index) => (
          <span
            key={index}
            className="w-[3px] rounded-full bg-primary/50"
            style={{ height: `${isPlaying ? height : height * 0.55}%` }}
          />
        ))}
      </div>
    </div>
  );
}
