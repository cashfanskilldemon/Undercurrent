import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/mock-data.json'), 'utf8'));

// ---- 右侧推荐栏（用真实音乐人数据）----
const topArtists = [...data.artists].sort((a, b) => b.followers - a.followers).slice(0, 5);
const fmt = (n) => (n >= 10000 ? (n / 10000).toFixed(1) + ' 万' : String(n));

const railRows = topArtists
  .map(
    (a) => `<a class="uc-rail-row" href="/tracks">
      <span class="uc-rail-avatar" style="--h:${a.hue}">${a.name.slice(0, 1)}</span>
      <span class="uc-rail-meta">
        <span class="uc-rail-name">${a.name}${a.verified ? '<svg class="uc-rail-badge" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>' : ''}</span>
        <span class="uc-rail-sub">@${a.handle} · ${fmt(a.followers)} 粉丝</span>
      </span>
      <span class="uc-rail-follow">关注</span>
    </a>`,
  )
  .join('\n');

const RAIL = `<aside class="uc-rail" aria-label="推荐关注">
  <label class="uc-rail-search">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
    <input type="search" placeholder="搜索" aria-label="搜索">
  </label>
  <h2 class="uc-rail-title">推荐关注</h2>
  <div class="uc-rail-list">
${railRows}
  </div>
  <p class="uc-rail-note">按粉丝数推荐 · 地下嘻哈 × 电子音乐</p>
</aside>`;

// ---- CSS ----
const CSS = `
/* ===== Threads 三栏布局 ===== */
@media (min-width: 1024px) {
  body { padding-left: 248px; }

  /* 顶部 header → 左侧固定栏 */
  body > header {
    position: fixed; inset: 0 auto 0 0;
    width: 248px; height: 100vh;
    display: flex; flex-direction: column;
    padding: 18px 12px 14px;
    border-right: 1px solid var(--border);
    border-bottom: 0;
    background: var(--background);
    -webkit-backdrop-filter: none; backdrop-filter: none;
    overflow-y: auto; overflow-x: hidden;
    z-index: 40;
  }
  body > header > div {
    display: flex; flex-direction: column;
    align-items: stretch; gap: 4px;
    height: 100%; max-width: none;
    margin: 0; padding: 0;
  }

  /* LOGO 放大 */
  body > header a[href="/"] { padding: 4px 8px; }
  body > header .uc-logo-mark { width: 46px; height: 46px; border-radius: 13px; }
  body > header .uc-logo-mark > svg { width: 27px; height: 27px; }
  body > header a[href="/"] > span.leading-none > span {
    font-size: 1.55rem; letter-spacing: .01em;
  }

  /* 主导航竖排 */
  body > header nav[aria-label="主导航"] {
    display: flex !important; flex-direction: column;
    align-items: stretch; width: 100%;
    margin-top: 18px; gap: 2px;
  }
  body > header nav[aria-label="主导航"] > a {
    display: flex; align-items: center;
    padding: 11px 14px; border-radius: 10px;
    font-size: .95rem; position: relative;
  }
  body > header nav[aria-label="主导航"] > a:hover { background: var(--secondary); }
  /* 底部下划线 → 左侧竖条 */
  body > header nav[aria-label="主导航"] > a > span {
    left: 0 !important; right: auto !important;
    top: 50% !important; bottom: auto !important;
    width: 3px !important; height: 20px !important;
    inset-inline: auto !important;
    transform: translateY(-50%) scaleY(0);
    transform-origin: center;
    border-radius: 2px;
  }
  body > header nav[aria-label="主导航"] > a[data-status="active"] > span {
    transform: translateY(-50%) scaleY(1);
  }

  /* 按钮组推到底部，竖排铺满 */
  body > header > div > div[class*="ml-auto"] {
    margin: auto 0 0 0 !important;
    display: flex; flex-direction: column;
    align-items: stretch; gap: 8px; width: 100%;
  }
  body > header > div > div[class*="ml-auto"] > * { width: 100%; }
  body > header > div > div[class*="ml-auto"] button { width: 100%; justify-content: center; }
  body > header [aria-label="打开菜单"] { display: none; }

  /* 中间内容列 */
  body > main { max-width: 680px; margin: 0 auto 0 0; }
  body > footer { max-width: 680px; margin-left: 0; }
}

/* 右栏只在足够宽时出现，避免和中间栏重叠 */
@media (min-width: 1320px) {
  .uc-rail {
    position: fixed; top: 22px; right: 26px;
    width: 302px; max-height: calc(100vh - 44px);
    overflow-y: auto;
  }
}
@media (max-width: 1319px) { .uc-rail { display: none !important; } }
@media (max-width: 1023px) { .uc-rail { display: none !important; } }

/* 右栏样式 */
.uc-rail { display: none; font-family: inherit; }
.uc-rail-search {
  display: flex; align-items: center; gap: 9px;
  padding: 10px 13px; border-radius: 12px;
  background: var(--secondary); border: 1px solid var(--border);
}
.uc-rail-search svg { width: 17px; height: 17px; color: var(--muted-foreground); flex: none; }
.uc-rail-search input {
  flex: 1; min-width: 0; background: none; border: 0; outline: 0;
  color: var(--foreground); font-size: .9rem;
}
.uc-rail-search input::placeholder { color: var(--muted-foreground); }
.uc-rail-title {
  margin: 22px 0 10px; font-size: .82rem; font-weight: 700;
  letter-spacing: .06em; text-transform: uppercase;
  color: var(--muted-foreground);
}
.uc-rail-list { display: flex; flex-direction: column; gap: 2px; }
.uc-rail-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: 10px;
  text-decoration: none; color: inherit;
  transition: background .15s;
}
.uc-rail-row:hover { background: var(--secondary); }
.uc-rail-avatar {
  flex: none; width: 38px; height: 38px; border-radius: 50%;
  display: grid; place-items: center;
  font-size: .95rem; font-weight: 700;
  background: oklch(0.62 0.12 var(--h) / .28);
  border: 1px solid oklch(0.62 0.12 var(--h) / .55);
  color: var(--foreground);
}
.uc-rail-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.uc-rail-name {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: .88rem; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.uc-rail-badge { width: 13px; height: 13px; color: var(--primary); flex: none; }
.uc-rail-sub {
  font-size: .74rem; color: var(--muted-foreground);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.uc-rail-follow {
  flex: none; font-size: .74rem; font-weight: 600;
  padding: 5px 12px; border-radius: 999px;
  border: 1px solid var(--border); color: var(--foreground);
  transition: border-color .15s, background .15s;
}
.uc-rail-row:hover .uc-rail-follow { border-color: var(--foreground); background: var(--accent); }
.uc-rail-note {
  margin: 18px 4px 0; font-size: .72rem;
  color: var(--muted-foreground); line-height: 1.5;
}
`;

// 写入 CSS
for (const f of ['public/assets/index-CI3z2CFS.css', 'readable/index-CI3z2CFS.css']) {
  const fp = path.join(ROOT, f);
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('Threads 三栏布局')) continue;
  fs.writeFileSync(fp, src + CSS, 'utf8');
  console.log('css updated', f);
}

// 注入右栏 HTML + 加载 CSS 兜底
for (const rel of [
  'public/index.html',
  ...fs.readdirSync(path.join(ROOT, 'snapshots'))
    .filter((x) => x.endsWith('.html'))
    .map((x) => 'snapshots/' + x),
]) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('class="uc-rail"')) continue;
  src = src.replace('</body>', RAIL + '\n</body>');
  fs.writeFileSync(fp, src, 'utf8');
  console.log('rail injected', rel);
}

console.log('\nDone.');
