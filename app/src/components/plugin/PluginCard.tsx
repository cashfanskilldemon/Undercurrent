import { Download, Star } from 'lucide-react';
import type { Plugin } from '../../types';
import { useApp } from '../../store/app-store';
import { formatCount, hueGradient } from '../../lib/format';

interface PluginCardProps {
  plugin: Plugin;
  onOpen: (plugin: Plugin) => void;
}

/** 插件卡片：渐变面板 + 旋钮意象，Ins 网格质感 */
export function PluginCard({ plugin, onOpen }: PluginCardProps) {
  const { artistById } = useApp();
  const maker = artistById(plugin.makerId);

  return (
    <article className="group overflow-hidden rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={() => onOpen(plugin)}
        className="block w-full text-left"
        aria-label={`查看插件 ${plugin.name}`}
      >
        <div
          className="relative flex h-28 items-center justify-center gap-2.5 overflow-hidden"
          style={{ background: hueGradient(plugin.hue, 0.36, 0.15) }}
        >
          {Array.from({ length: Math.min(plugin.knobs, 6) }).map((_, index) => (
            <span
              key={index}
              className="h-6 w-6 rounded-full border border-white/25 bg-black/25 shadow-inner transition-transform duration-500 group-hover:rotate-45"
            />
          ))}
          <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 font-mono text-[10px] text-white">
            {plugin.category}
          </span>
          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 font-mono text-[10px] font-bold text-primary-fg">
            {plugin.price === 0 ? '免费' : `¥${plugin.price}`}
          </span>
        </div>
        <div className="p-3">
          <h3 className="truncate font-cn text-base tracking-wide">{plugin.name}</h3>
          <p className="mt-0.5 truncate text-xs text-muted">
            {maker?.name} · v{plugin.version}
          </p>
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{plugin.tagline}</p>
          <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-muted">
            <span className="flex items-center gap-1">
              <Star size={11} className="text-primary" fill="currentColor" />
              {plugin.rating.toFixed(1)} · {plugin.reviews}
            </span>
            <span className="flex items-center gap-1">
              <Download size={11} />
              {formatCount(plugin.downloads)}
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}
