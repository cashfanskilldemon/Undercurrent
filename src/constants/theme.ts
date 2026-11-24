/**
 * 主题令牌：数值全部来自 Web 版 oklch 变量换算成 sRGB（RN 不支持 oklch）
 * Web 源：Undercurrent-web/public/index.html + assets/index-*.css
 */

export const colors = {
  /** oklch(10% 0 0) 中性黑 */
  background: '#030303',
  /** oklch(94% .014 95) 暖调米白 */
  foreground: '#eeebe1',
  /** oklch(14% 0 0) */
  card: '#090909',
  /** oklch(18% 0 0) */
  elevated: '#121212',
  /** oklch(20% 0 0) */
  accent: '#161616',
  /** oklch(22% 0 0) 输入框/按钮底 */
  input: '#1b1b1b',
  /** oklch(70% .016 100) */
  mutedForeground: '#a09f94',

  /** 分隔线：比 Web 的 border(42%) 收敛，移动端 1px 太亮会显脏 */
  border: '#242424',
  /** 按钮/胶囊描边，对应 Web --border oklch(42%) */
  borderStrong: '#4d4d4d',

  /** oklch(88% .17 122) 酸性黄绿，全站强调色 */
  primary: '#c5e95c',
  primaryForeground: '#13150b',

  /** oklch(63% .17 36) 点赞红 */
  destructive: '#dc5b37',
  /** oklch(67% .15 42) 铁锈色，次要强调 */
  rust: '#e07144',
} as const;

/** Web 的 --radius 是 0.625rem = 10px */
export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 14,
  full: 999,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** 字号/行高，正文 14/21.5 与 Web 的 0.875rem 对齐 */
export const type = {
  display: { fontSize: 20, lineHeight: 24, letterSpacing: 1.6, fontWeight: '700' as const },
  title: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const },
  body: { fontSize: 14, lineHeight: 21.5, fontWeight: '400' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  small: { fontSize: 12.5, lineHeight: 18, fontWeight: '400' as const },
  caption: { fontSize: 11.5, lineHeight: 16, fontWeight: '400' as const },
  num: { fontSize: 12.5, lineHeight: 18, fontWeight: '400' as const, fontVariant: ['tabular-nums'] as const },
} as const;

/** 互动图标统一 18px / 1.7 描边，与 Web 视觉一致 */
export const icon = {
  size: 18,
  stroke: 1.7,
  tab: 22,
} as const;

/** hue(0-360) → hsl 色块，用于无头像图的用户占位 */
export function hueColor(hue: number, s = 38, l = 32) {
  return `hsl(${hue}, ${s}%, ${l}%)`;
}

export function hueText(hue: number) {
  return `hsl(${hue}, 55%, 88%)`;
}
