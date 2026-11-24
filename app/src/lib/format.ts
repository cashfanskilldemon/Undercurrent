/** 大小写无关的类名拼接，过滤空值 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** 播放量/点赞数等中文缩写：12000 -> 1.2万 */
export function formatCount(value: number): string {
  if (value >= 10000) {
    const wan = value / 10000;
    return `${wan >= 100 ? Math.round(wan) : wan.toFixed(1).replace(/\.0$/, '')}万`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(value);
}

/** 秒 -> m:ss */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** 用艺人色相生成头像/插件的渐变背景，避免全站同一块灰色 */
export function hueGradient(hue: number, light = 0.38, dark = 0.18): string {
  return `linear-gradient(135deg, oklch(${light} 0.09 ${hue}), oklch(${dark} 0.05 ${hue + 32}))`;
}

/** 复制文本，失败时回退到 execCommand */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** 生成稳定递增的本地 id */
export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
