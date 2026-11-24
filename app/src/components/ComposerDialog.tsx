import { ImagePlus, Music, Tags } from 'lucide-react';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useApp } from '../store/app-store';
import { coverFiles } from '../data/site';
import { Modal } from './ui/Modal';
import { cn } from '../lib/format';

const MAX_BODY = 280;

/** 发帖 / 上传作品共用弹窗 */
export function ComposerDialog() {
  const { composer, closeComposer, openComposer, channels, genres, tagStats, addThread, addTrack } = useApp();
  const { isOpen, mode, preset } = composer;

  const [body, setBody] = useState('');
  const [channel, setChannel] = useState('闲聊');
  const [tags, setTags] = useState<string[]>([]);
  const [image, setImage] = useState<string>('');

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState(genres[0] ?? 'Boom Bap');
  const [bpm, setBpm] = useState('90');
  const [musicalKey, setMusicalKey] = useState('F 小调');
  const [blurb, setBlurb] = useState('');
  const [cover, setCover] = useState<string>(coverFiles[0]);

  // 每次打开重置表单，并按入口预设频道/话题
  useEffect(() => {
    if (!isOpen) return;
    setBody('');
    setChannel(preset.channel ?? '闲聊');
    setTags(preset.tag ? [preset.tag] : []);
    setImage('');
    setTitle('');
    setGenre(genres[0] ?? 'Boom Bap');
    setBpm('90');
    setMusicalKey('F 小调');
    setBlurb('');
    setCover(coverFiles[0]);
  }, [isOpen, preset.channel, preset.tag, genres]);

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length >= 3 ? prev : [...prev, tag]));
  };

  const submitPost = (event: FormEvent) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    addThread({ body: text, channel, tags, image: image || undefined });
    closeComposer();
  };

  const submitTrack = (event: FormEvent) => {
    event.preventDefault();
    const name = title.trim();
    const bpmValue = Number(bpm);
    if (!name || !Number.isFinite(bpmValue)) return;
    addTrack({
      title: name,
      genre,
      bpm: Math.round(bpmValue),
      musicalKey: musicalKey.trim() || '未标注',
      blurb: blurb.trim() || '还没写简介。',
      cover,
    });
    closeComposer();
  };

  return (
    <Modal
      open={isOpen}
      onClose={closeComposer}
      title={mode === 'post' ? '发一条' : '上传作品'}
      widthClass="max-w-lg"
    >
      <div className="mb-4 flex gap-1 rounded-full border border-border p-1 text-sm">
        <TabButton active={mode === 'post'} onClick={() => openComposer('post')}>
          讨论帖
        </TabButton>
        <TabButton active={mode === 'upload'} onClick={() => openComposer('upload')}>
          上传作品
        </TabButton>
      </div>

      {mode === 'post' ? (
        <form onSubmit={submitPost} className="space-y-4">
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value.slice(0, MAX_BODY))}
            rows={5}
            autoFocus
            placeholder="分享一段 beat、求个反馈，或者只是说点什么……"
            className="w-full resize-none rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted focus:border-primary/60"
          />
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="flex items-center gap-1">
              <Tags size={14} /> 最多选 3 个话题
            </span>
            <span className="font-mono">
              {body.length}/{MAX_BODY}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {tagStats.map((tag) => (
              <button
                key={tag.tag}
                type="button"
                onClick={() => toggleTag(tag.tag)}
                className={cn('uc-chip', tags.includes(tag.tag) && 'uc-chip-active')}
              >
                #{tag.tag}
              </button>
            ))}
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block text-muted">频道</span>
            <select
              value={channel}
              onChange={(event) => setChannel(event.target.value)}
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-primary/60"
            >
              {channels
                .filter((c) => c !== '全部')
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </label>

          <fieldset>
            <legend className="mb-1.5 flex items-center gap-1 text-sm text-muted">
              <ImagePlus size={15} /> 配图（可选）
            </legend>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setImage('')}
                className={cn(
                  'h-16 w-16 shrink-0 rounded-lg border text-xs text-muted',
                  image === '' ? 'border-primary text-fg' : 'border-border',
                )}
              >
                无图
              </button>
              {coverFiles.map((file) => (
                <button
                  key={file}
                  type="button"
                  onClick={() => setImage(file)}
                  aria-label={`选择 ${file} 作为配图`}
                  className={cn(
                    'h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-transform hover:scale-105',
                    image === file ? 'border-primary' : 'border-transparent',
                  )}
                >
                  <img src={`/img/${file}`} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={!body.trim()}
            className="w-full rounded-full bg-primary py-2.5 font-bold text-primary-fg transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            发布
          </button>
        </form>
      ) : (
        <form onSubmit={submitTrack} className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1.5 block text-muted">作品名</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              autoFocus
              placeholder="比如：雾里打桩"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary/60"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted">流派</span>
              <select
                value={genre}
                onChange={(event) => setGenre(event.target.value)}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary/60"
              >
                {genres.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted">BPM</span>
              <input
                type="number"
                min={40}
                max={220}
                value={bpm}
                onChange={(event) => setBpm(event.target.value)}
                className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 font-mono outline-none focus:border-primary/60"
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block text-muted">调性</span>
            <input
              value={musicalKey}
              onChange={(event) => setMusicalKey(event.target.value)}
              placeholder="比如：A 小调"
              className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary/60"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1.5 block text-muted">一句话简介</span>
            <textarea
              value={blurb}
              onChange={(event) => setBlurb(event.target.value)}
              rows={3}
              placeholder="录在哪、用了什么设备、想表达什么……"
              className="w-full resize-none rounded-xl border border-border bg-bg px-3 py-2.5 outline-none focus:border-primary/60"
            />
          </label>

          <fieldset>
            <legend className="mb-1.5 flex items-center gap-1 text-sm text-muted">
              <Music size={15} /> 封面
            </legend>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {coverFiles.map((file) => (
                <button
                  key={file}
                  type="button"
                  onClick={() => setCover(file)}
                  aria-label={`选择 ${file} 作为封面`}
                  className={cn(
                    'h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-transform hover:scale-105',
                    cover === file ? 'border-primary' : 'border-transparent',
                  )}
                >
                  <img src={`/img/${file}`} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full rounded-full bg-primary py-2.5 font-bold text-primary-fg transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            提交作品
          </button>
        </form>
      )}
    </Modal>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex-1 rounded-full px-3 py-1.5 transition-colors', active ? 'bg-primary font-bold text-primary-fg' : 'text-muted hover:text-fg')}
    >
      {children}
    </button>
  );
}
