import { Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../store/app-store';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { PageHeader } from '../components/layout/PageHeader';
import { PluginCard } from '../components/plugin/PluginCard';
import { PluginDialog } from '../components/plugin/PluginDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { cn, formatCount } from '../lib/format';
import type { Plugin } from '../types';

/** 插件区：分类筛选 + 网格 + 详情弹层 */
export function PluginsPage() {
  useDocumentTitle('插件区');
  const { plugins, categories, pluginById, notify } = useApp();
  const [params, setParams] = useSearchParams();
  const [category, setCategory] = useState('全部');
  const [selected, setSelected] = useState<Plugin | null>(null);

  // 深链 /plugins?plugin=p1 直接打开详情
  const pluginParam = params.get('plugin');
  useEffect(() => {
    if (!pluginParam) return;
    const found = pluginById(pluginParam);
    if (found) setSelected(found);
  }, [pluginParam, pluginById]);

  const closeDialog = () => {
    setSelected(null);
    if (pluginParam) setParams({}, { replace: true });
  };

  const visible = category === '全部' ? plugins : plugins.filter((p) => p.category === category);

  return (
    <>
      <PageHeader
        title="插件区"
        subtitle={`${formatCount(plugins.length)} 个插件与采样包 · 社区作者上传`}
        actions={
          <button
            type="button"
            onClick={() => notify('插件提交通道筹备中')}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-bold text-primary-fg"
          >
            <Upload size={15} />
            提交插件
          </button>
        }
        tabs={
          <div className="uc-scroll-x px-4 pb-2.5 pt-1 sm:px-6">
            {['全部', ...categories].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={category === c}
                className={cn('uc-chip shrink-0', category === c && 'uc-chip-active')}
              >
                {c}
              </button>
            ))}
          </div>
        }
      />

      {visible.length === 0 ? (
        <EmptyState title="这个分类还是空的" description="换个分类看看，或者提交你的插件。" />
      ) : (
        <div className="grid grid-cols-2 gap-3 px-4 py-4 sm:px-6">
          {visible.map((plugin) => (
            <PluginCard key={plugin.id} plugin={plugin} onOpen={setSelected} />
          ))}
        </div>
      )}

      <PluginDialog plugin={selected} onClose={closeDialog} />
    </>
  );
}
