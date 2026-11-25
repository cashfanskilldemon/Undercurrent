import { Platform } from 'react-native';

export type ThemeChoice = 'dark' | 'light' | 'auto';
export type ColorScheme = 'dark' | 'light';

const KEY = 'undercurrent.theme';

/** 设备的深浅色偏好：只有浏览器能读到，后端无法获知客户端系统主题 */
export function systemScheme(): ColorScheme {
  if (Platform.OS !== 'web' || typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function readThemeChoice(): ThemeChoice {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return 'dark';
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'auto' ? v : 'dark';
  } catch {
    return 'dark';
  }
}

/** 把选择落到 <html data-theme>，global.css 据此切换整套 CSS 变量 */
export function applyTheme(choice: ThemeChoice): void {
  const scheme = choice === 'auto' ? systemScheme() : choice;
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  document.documentElement.dataset.theme = scheme;
}

export function saveTheme(choice: ThemeChoice): void {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(KEY, choice);
  } catch {
    // 隐私模式忽略
  }
  applyTheme(choice);
}
