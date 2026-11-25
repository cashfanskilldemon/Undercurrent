/**
 * 主题令牌。Web 端用 CSS 变量（global.css 按 data-theme 切深/浅），原生端吃暗色 fallback。
 * 数值来源：Web 版 oklch 变量换算成 sRGB（RN 不支持 oklch）。
 * Web 源：Undercurrent-web/public/index.html + assets/index-*.css
 */
import { Platform } from 'react-native';

const web = Platform.OS === 'web';
/** Web 拿 var(--x, 暗色兜底)，原生拿暗色兜底 */
const token = (name: string, fallback: string) =>
  web ? `var(--uc-${name}, ${fallback})` : fallback;

export const colors = {
  /** 中性黑 / 白 */
  background: token('bg', '#030303'),
  /** 暖调米白 / 近黑 */
  foreground: token('fg', '#eeebe1'),
  /** 强对比正文：深色纯白 / 浅色近黑 */
  strong: token('strong', '#ffffff'),
  /** 卡片底 */
  card: token('card', '#090909'),
  /** 抬升层 */
  elevated: token('elevated', '#121212'),
  /** 按钮/胶囊底 */
  accent: token('accent', '#161616'),
  /** 输入框底 */
  input: token('input', '#1b1b1b'),
  /** 次级文字 */
  mutedForeground: token('muted', '#a09f94'),

  /** 分隔线 */
  border: token('border', '#242424'),
  /** 按钮/胶囊描边 */
  borderStrong: token('border-strong', '#4d4d4d'),

  /** 酸性黄绿强调色 */
  primary: token('primary', '#c5e95c'),
  primaryForeground: token('primary-fg', '#13150b'),

  /** 点赞红 */
  destructive: token('destructive', '#dc5b37'),
  /** 铁锈色 */
  rust: token('rust', '#e07144'),

  /** 菜单弹层专用 */
  menuBg: token('menu-bg', '#242424'),
  menuBorder: token('menu-border', '#3a3a3a'),
  menuPressed: token('menu-pressed', '#333333'),
  menuDivider: token('menu-divider', '#3a3a3a'),
  menuSegment: token('menu-segment', '#1a1a1a'),
  menuSelected: token('menu-selected', '#3c3c3c'),
  switchTrack: token('switch-track', '#4a4a4a'),
  switchThumb: token('switch-thumb', '#ffffff'),

  /** 悬停卡片按钮：浅色=关注黑底/发消息白底，暗色=关注白底/发消息深底带描边 */
  hoverFollowBg: token('hover-follow-bg', '#ffffff'),
  hoverFollowFg: token('hover-follow-fg', '#0a0a0a'),
  hoverFollowOnBg: token('hover-follow-on-bg', '#242424'),
  hoverFollowOnFg: token('hover-follow-on-fg', '#ffffff'),
  hoverFollowOnBorder: token('hover-follow-on-border', '#4a4a4a'),
  hoverMessageBg: token('hover-message-bg', '#2a2a2a'),
  hoverMessageFg: token('hover-message-fg', '#ffffff'),
  hoverMessageBorder: token('hover-message-border', '#4a4a4a'),
} as const;

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

/** 互动图标统一 18px / 1.7 描边 */
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
