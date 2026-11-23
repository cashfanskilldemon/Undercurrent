import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// SSR 静态切换按钮：与 JSX 版本结构一致，避免 hydration 抖动
const SSR_BTN = '<button type="button" aria-label="切换明暗主题" title="切换明暗主题" onclick="var e=document.documentElement,n=e.classList.toggle(\'dark\');localStorage.setItem(\'uc-theme\',n?\'dark\':\'light\');document.querySelector(\'meta[name=theme-color]\')?.setAttribute(\'content\',n?\'#1a1a17\':\'#f5f5f1\')" class="inline-flex size-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"><svg class="size-4 theme-icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg><svg class="size-4 theme-icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"></path></svg></button>';

for (const rel of [
  'public/index.html',
  ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((f) => f.endsWith('.html')).map((f) => 'snapshots/' + f),
]) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('切换明暗主题')) {
    console.log('skip (already present)', rel);
    continue;
  }
  // 在登录 button 前插入（匹配 hidden sm:inline-flex...>登录</button>）
  const marker = 'hidden sm:inline-flex">登录</button>';
  if (!src.includes(marker)) {
    console.log('skip (no login marker)', rel);
    continue;
  }
  const idx = src.indexOf(marker);
  // 找到这个 button 的起始位置
  const btnStart = src.lastIndexOf('<button', idx);
  src = src.slice(0, btnStart) + SSR_BTN + src.slice(btnStart);
  fs.writeFileSync(fp, src, 'utf8');
  console.log('updated', rel);
}
