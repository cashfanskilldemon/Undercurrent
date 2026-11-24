import { Download, Star } from 'lucide-react';
import type { Plugin } from '../../types';
import { useApp } from '../../store/app-store';
import { formatCount, hueGradient } from '../../lib/format';
import { Modal } from '../ui/Modal';
import { Verified } from '../ui/Verified';
import { FollowButton } from '../FollowButton';

interface PluginDialogProps {
  plugin: Plugin | null;
  onClose: () => void;
}

/** 插件详情弹层：规格、授权与下载入口（下载为演示反馈） */
export function PluginDialog({ plugin, onClose }: PluginDialogProps) {
  const { artistById, notify } = useApp();
  const maker = plugin ? artistById(plugin.makerId) : undefined;

  return (
    <Modal open={Boolean(plugin)} title={plugin?.name ?? '插件详情'} onClose={onClose}>
      {plugin ? (
        <div className="space-y-4">
          <div
            className="flex h-32 items-center justify-center gap-3 rounded-xl"
            style={{ background: hueGradient(plugin.hue, 0.36, 0.15) }}
            aria-hidden="true"
          >
            {Array.from({ length: Math.min(plugin.knobs, 8) }).map((_, index) => (
              <span key={index} className="h-7 w-7 rounded-full border border-white/25 bg-black/25 shadow-inner" />
            ))}
          </div>

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-cn text-2xl tracking-wide">{plugin.name}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm text-muted">
                {maker?.name}
                {maker?.verified ? <Verified size={13} /> : null}
                <span>·</span>
                {plugin.category}
                <span>·</span>v{plugin.version}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="font-mono text-lg font-bold text-primary">
                {plugin.price === 0 ? '免费' : `¥${plugin.price}`}
              </span>
              <FollowButton artistId={plugin.makerId} size="sm" />
            </div>
          </div>

          <p className="text-sm leading-relaxed text-muted">{plugin.description}</p>

          <dl className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-bg p-3 font-mono text-xs">
            <Spec label="评分" value={`${plugin.rating.toFixed(1)} / 5（${formatCount(plugin.reviews)} 评价）`} />
            <Spec label="下载" value={`${formatCount(plugin.downloads)} 次`} />
            <Spec label="格式" value={plugin.formats.join(' / ')} />
            <Spec label="系统" value={plugin.os.join(' / ')} />
            <Spec label="体积" value={plugin.size} />
            <Spec label="更新" value={plugin.updated} />
          </dl>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => notify('演示环境：下载通道未接入')}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-2.5 font-bold text-primary-fg"
            >
              <Download size={16} />
              {plugin.price === 0 ? '免费下载' : `购买 ¥${plugin.price}`}
            </button>
            <button
              type="button"
              onClick={() => notify('已加入收藏')}
              className="rounded-full border border-border px-4 py-2.5 text-sm text-fg hover:border-border-strong"
            >
              收藏
            </button>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Star size={12} className="text-primary" /> 插件由社区作者上传，下载前请确认授权协议
          </p>
        </div>
      ) : null}
    </Modal>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted">{label}</dt>
      <dd className="mt-0.5 text-fg">{value}</dd>
    </div>
  );
}
