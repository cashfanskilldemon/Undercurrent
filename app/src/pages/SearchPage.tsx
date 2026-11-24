import { Search } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../store/app-store';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../components/layout/PageHeader';
import { PostCard } from '../components/feed/PostCard';
import { TrackCard } from '../components/track/TrackCard';
import { PluginCard } from '../components/plugin/PluginCard';
import { PluginDialog } from '../components/plugin/PluginDialog';
import { Avatar } from '../components/ui/Avatar';
import { Verified } from '../components/ui/Verified';
import { EmptyState } from '../components/ui/EmptyState';
import { FollowButton } from '../components/FollowButton';
import { cn, formatCount } from '../lib/format';
import type { Plugin } from '../types';

type SearchTab = 'all' | 'artists' | 'tracks' | 'threads' | 'plugins';

const TABS: Array<{ key: SearchTab; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'artists', label: '艺人' },
  { key: 'tracks', label: '作品' },
  { key: 'threads', label: '帖子' },
  { key: 'plugins', label: '插件' },
];

/** 发现页：跨艺人/作品/帖子/插件的统一搜索 */
export function SearchPage() {
  useDocumentTitle('发现');
  const { artists, tracks, threads, plugins, tagStats } = useApp();
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim();
  const tab = (params.get('tab') as SearchTab | null) ?? 'all';
  const [draft, setDraft] = useState(q);
  const [selectedPlugin, setSelectedPlugin] = useState<Plugin | null>(null);

  useEffect(() => {
    setDraft(q);
  }, [q]);

  const query = q.toLowerCase();
  const matches = (haystack: string[]) => !query || haystack.some((text) => text.toLowerCase().includes(query));

  const artistHits = useMemo(
    () =>
      artists.filter(
        (artist) => artist.id !== 'me' && matches([artist.name, artist.handle, artist.city, artist.role]),
      ),
    [artists, query],
  );
  const trackHits = useMemo(
    () => tracks.filter((track) => matches([track.title, track.genre, track.blurb, ...track.tags])),
    [tracks, query],
  );
  const threadHits = useMemo(
    () => threads.filter((thread) => matches([thread.body, thread.channel, ...thread.tags])),
    [threads, query],
  );
  const pluginHits = useMemo(
    () => plugins.filter((plugin) => matches([plugin.name, plugin.category, plugin.tagline, plugin.description])),
    [plugins, query],
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const next = new URLSearchParams(params);
    if (draft.trim()) {
      next.set('q', draft.trim());
    } else {
      next.delete('q');
    }
    setParams(next);
  };

  const switchTab = (next: SearchTab) => {
    const nextParams = new URLSearchParams(params);
    if (next === 'all') {
      nextParams.delete('tab');
    } else {
      nextParams.set('tab', next);
    }
    setParams(nextParams);
  };

  const total = artistHits.length + trackHits.length + threadHits.length + pluginHits.length;

  return (
    <>
      <PageHeader
        title="发现"
        subtitle={q ? `“${q}” · ${total} 条结果` : '搜索艺人、作品、帖子与插件'}
        actions={
          query ? (
            <button
              type="button"
              onClick={() => {
                const next = new URLSearchParams(params);
                next.delete('q');
                setParams(next);
              }}
              className="text-xs text-muted hover:text-fg"
            >
              清空
            </button>
          ) : null
        }
        tabs={
          <div className="flex" role="tablist" aria-label="搜索分类">
            {TABS.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                onClick={() => switchTab(item.key)}
                aria-selected={tab === item.key}
                className={cn('uc-tab text-xs sm:text-sm', tab === item.key && 'uc-tab-active')}
              >
                {item.label}
                {tab === item.key ? (
                  <span className="absolute inset-x-5 bottom-0 h-[2px] rounded-full bg-primary" aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
        }
      />

      <form onSubmit={submit} className="uc-line px-4 py-3 sm:px-6" role="search">
        <div className="relative">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="搜索艺人、作品、插件或话题"
            aria-label="搜索关键词"
            className="w-full rounded-full border border-border bg-surface py-2.5 pl-11 pr-24 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary/60"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-fg"
          >
            搜索
          </button>
        </div>
      </form>

      {!q ? (
        <section className="px-4 py-4 sm:px-6">
          <h2 className="font-cn text-lg tracking-wide">热门话题</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {tagStats.map((tag) => (
              <Link key={tag.tag} to={`/topics/${encodeURIComponent(tag.tag)}`} className="uc-chip">
                #{tag.tag}
                <span className="font-mono text-[10px] opacity-70">{formatCount(tag.posts)}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="pb-4">
        {(tab === 'all' || tab === 'artists') && artistHits.length > 0 ? (
          <Section title="艺人" count={artistHits.length} showAll={tab === 'all'} onAll={() => switchTab('artists')}>
            <ul>
              {(tab === 'all' ? artistHits.slice(0, 4) : artistHits).map((artist) => (
                <li key={artist.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface/60 sm:px-6">
                  <Avatar artist={artist} size={44} />
                  <div className="min-w-0 flex-1">
                    <Link to={`/u/${artist.handle}`} className="flex items-center gap-1 truncate text-sm font-bold hover:underline">
                      {artist.name}
                      {artist.verified ? <Verified /> : null}
                    </Link>
                    <p className="truncate text-xs text-muted">
                      @{artist.handle} · {artist.role} · {artist.city}
                    </p>
                  </div>
                  <FollowButton artistId={artist.id} size="sm" />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {(tab === 'all' || tab === 'tracks') && trackHits.length > 0 ? (
          <Section title="作品" count={trackHits.length} showAll={tab === 'all'} onAll={() => switchTab('tracks')}>
            <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4 py-2 sm:px-6">
              {(tab === 'all' ? trackHits.slice(0, 4) : trackHits).map((track) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          </Section>
        ) : null}

        {(tab === 'all' || tab === 'threads') && threadHits.length > 0 ? (
          <Section title="帖子" count={threadHits.length} showAll={tab === 'all'} onAll={() => switchTab('threads')}>
            <div>
              {(tab === 'all' ? threadHits.slice(0, 3) : threadHits).map((thread) => (
                <PostCard key={thread.id} thread={thread} />
              ))}
            </div>
          </Section>
        ) : null}

        {(tab === 'all' || tab === 'plugins') && pluginHits.length > 0 ? (
          <Section title="插件" count={pluginHits.length} showAll={tab === 'all'} onAll={() => switchTab('plugins')}>
            <div className="grid grid-cols-2 gap-3 px-4 py-2 sm:px-6">
              {(tab === 'all' ? pluginHits.slice(0, 2) : pluginHits).map((plugin) => (
                <PluginCard key={plugin.id} plugin={plugin} onOpen={setSelectedPlugin} />
              ))}
            </div>
          </Section>
        ) : null}

        {q && total === 0 ? (
          <EmptyState title="没有找到相关内容" description="换个关键词试试，或者去话题页逛逛。" />
        ) : null}
      </div>

      <PluginDialog plugin={selectedPlugin} onClose={() => setSelectedPlugin(null)} />
    </>
  );
}

function Section({
  title,
  count,
  showAll,
  onAll,
  children,
}: {
  title: string;
  count: number;
  showAll: boolean;
  onAll: () => void;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-border py-2 last:border-b-0">
      <div className="flex items-baseline justify-between px-4 pb-1 sm:px-6">
        <h2 className="font-cn text-lg tracking-wide">
          {title}
          <span className="ml-1.5 font-mono text-xs text-muted">{count}</span>
        </h2>
        {showAll && count > 0 ? (
          <button type="button" onClick={onAll} className="text-xs text-primary hover:underline">
            查看全部
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
