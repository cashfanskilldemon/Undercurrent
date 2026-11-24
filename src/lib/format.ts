/** 展示层格式化工具 */

/** 后端返回 "2026-11-23 15:08:47"（Jackson 配置的格式），iOS/RN 的 Date 不认带空格的写法 */
export function parseTime(input?: string | null): Date | null {
  if (!input) return null;
  const normalized = input.includes('T') ? input : input.replace(' ', 'T');
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function relativeTime(input?: string | null): string {
  const d = parseTime(input);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min} 分钟前`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour} 小时前`;
  const day = Math.floor(hour / 24);
  if (day < 7) return `${day} 天前`;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  const md = `${d.getMonth() + 1}月${d.getDate()}日`;
  return sameYear ? md : `${d.getFullYear()}年${md}`;
}

/** 18432 → 1.8万，286 → 286 */
export function formatCount(n?: number | null): string {
  if (n === null || n === undefined) return '0';
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return `${(n / 10000).toFixed(1).replace(/\.0$/, '')}万`;
}

/** 207 → 3:27 */
export function formatDuration(sec?: number | null): string {
  if (!sec || sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatPrice(price?: number | null): string {
  if (!price) return '免费';
  return `¥${price.toFixed(0)}`;
}

/**
 * 后端只存封面文件名（如 cover-1.png），前端拼成可访问 URL。
 * Web 下走同源 /img/xxx（public/img 已放资源）；原生下用 API_BASE 拼（真机需可达）。
 */
export function assetUrl(file?: string | null): string | null {
  if (!file) return null;
  if (/^https?:\/\//i.test(file)) return file;
  return `/img/${file}`;
}

/** 作品列表的元信息：88 BPM · F 小调 · Boom Bap */
export function trackMeta(t: { bpm?: number | null; musicalKey?: string | null; genre?: string | null }) {
  return [t.bpm ? `${t.bpm} BPM` : null, t.musicalKey, t.genre].filter(Boolean).join(' · ');
}
