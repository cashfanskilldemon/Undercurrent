import { ImagePlus, Music2, Tags } from 'lucide-react';
import { useApp } from '../../store/app-store';
import { Avatar } from '../ui/Avatar';

/** 首页/讨论区顶部的快捷发帖入口 */
export function InlineComposer() {
  const { artistById, openComposer } = useApp();
  const me = artistById('me');

  return (
    <div className="uc-line flex items-start gap-3 px-4 py-3 sm:px-6">
      <Avatar artist={me} size={40} linked={false} />
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => openComposer('post')}
          className="w-full rounded-xl py-1 text-left text-[15px] text-muted transition-colors hover:text-fg"
        >
          地下发生了什么？
        </button>
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-0.5 text-primary">
            <button type="button" className="uc-icon-btn" onClick={() => openComposer('post')} aria-label="添加配图">
              <ImagePlus size={18} />
            </button>
            <button type="button" className="uc-icon-btn" onClick={() => openComposer('post')} aria-label="添加话题">
              <Tags size={18} />
            </button>
            <button type="button" className="uc-icon-btn" onClick={() => openComposer('upload')} aria-label="上传作品">
              <Music2 size={18} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => openComposer('post')}
            className="rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-primary-fg transition-opacity hover:opacity-90"
          >
            发帖
          </button>
        </div>
      </div>
    </div>
  );
}
