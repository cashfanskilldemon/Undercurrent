import { Puzzle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../store/app-store';
import { formatCount, hueGradient } from '../../lib/format';

/** 帖子内嵌插件卡片，点击进入插件区详情 */
export function PluginEmbed({ pluginId }: { pluginId: string }) {
  const { pluginById, artistById } = useApp();
  const navigate = useNavigate();
  const plugin = pluginById(pluginId);
  if (!plugin) return null;
  const maker = artistById(plugin.makerId);

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        navigate(`/plugins?plugin=${plugin.id}`);
      }}
      className="mt-3 flex w-full items-center gap-3 rounded-xl border border-border bg-surface-2/70 p-3 text-left transition-colors hover:border-border-strong"
    >
      <span
        className="grid h-16 w-16 shrink-0 place-items-center rounded-lg text-fg/80"
        style={{ background: hueGradient(plugin.hue, 0.34, 0.16) }}
        aria-hidden="true"
      >
        <Puzzle size={22} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-bold">{plugin.name}</span>
          <span className="shrink-0 font-mono text-xs text-primary">{plugin.price === 0 ? '免费' : `¥${plugin.price}`}</span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">{plugin.tagline}</span>
        <span className="mt-1 block truncate text-[11px] text-muted">
          {maker?.name} · {plugin.category} · 下载 {formatCount(plugin.downloads)}
        </span>
      </span>
    </button>
  );
}
