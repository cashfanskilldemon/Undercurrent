import { LayoutGrid, List, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../store/app-store';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../components/layout/PageHeader';
import { TrackCard } from '../components/track/TrackCard';
import { EmptyState } from '../components/ui/EmptyState';
import { cn, formatCount } from '../lib/format';

type ViewMode = 'grid' | 'list';
type SortMode = 'latest' | 'plays';

/** 作品库：流派筛选 + 排序 + 网格/列表切换 */
export function TracksPage() {
  useDocumentTitle('作品库');
  const { tracks, genres, openComposer, playTrack } = useApp();
  const [params] = useSearchParams();
  const [genre, setGenre] = useState('全部');
  const [view, setView] = useState<ViewMode>('grid');
  const [sort, setSort] = useState<SortMode>('latest');

  // 支持从帖子内嵌卡片深链：/tracks?track=t1 直接播放
  const trackParam = params.get('track');
  useEffect(() => {
    if (trackParam) playTrack(trackParam);
  }, [trackParam, playTrack]);

  const visible = useMemo(() => {
    const filtered = genre === '全部' ? tracks : tracks.filter((t) => t.genre === genre);
    const sorted =
      sort === 'plays'
        ? [...filtered].sort((a, b) => b.plays - a.plays)
        : filtered;
    return sorted;
  }, [tracks, genre, sort]);

  const genreCount = (g: string) => (g === '全部' ? tracks.length : tracks.filter((t) => t.genre === g).length);

  return (
    <>
      <PageHeader
        title="作品库"
        subtitle={`${formatCount(tracks.length)} 首作品 · 试听模拟`}
        actions={
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              className="uc-icon-btn"
              aria-label={view === 'grid' ? '切换为列表视图' : '切换为网格视图'}
            >
              {view === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
            </button>
            <button
              type="button"
              onClick={() => openComposer('upload')}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-bold text-primary-fg"
            >
              <Upload size={15} />
              上传
            </button>
          </div>
        }
        tabs={
          <div className="uc-scroll-x px-4 pb-2.5 pt-1 sm:px-6">
            {['全部', ...genres].map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenre(g)}
                aria-pressed={genre === g}
                className={cn('uc-chip shrink-0', genre === g && 'uc-chip-active')}
              >
                {g}
                <span className="font-mono text-[10px] opacity-70">{genreCount(g)}</span>
              </button>
            ))}
          </div>
        }
      />

      <div className="flex items-center justify-between px-4 py-2.5 text-xs text-muted sm:px-6">
        <span>
          {genre === '全部' ? '全部作品' : genre} · <span className="font-mono">{visible.length}</span> 首
        </span>
        <label className="flex items-center gap-1.5">
          排序
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortMode)}
            className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-fg outline-none focus:border-primary/60"
          >
            <option value="latest">最新上传</option>
            <option value="plays">最多播放</option>
          </select>
        </label>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="这个流派还没有作品"
          description="换个流派看看，或者上传你的第一首。"
          action={
            <button
              type="button"
              onClick={() => openComposer('upload')}
              className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-fg"
            >
              上传作品
            </button>
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4 py-1 sm:px-6">
          {visible.map((track) => (
            <TrackCard key={track.id} track={track} />
          ))}
        </div>
      ) : (
        <div>
          {visible.map((track) => (
            <TrackCard key={track.id} track={track} variant="list" />
          ))}
        </div>
      )}
    </>
  );
}
