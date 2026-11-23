import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const OLD_START = '/* ===== Threads 三栏布局 ===== */';

// 重写：关键布局属性全部 !important，压过 Tailwind 的 .sticky/.size-8 等类
const CSS = `/* ===== Threads 三栏布局 ===== */
@media (min-width: 1024px) {
  body { padding-left: 248px !important; }

  body > header {
    position: fixed !important; inset: 0 auto 0 0 !important;
    width: 248px !important; height: 100vh !important;
    display: flex !important; flex-direction: column !important;
    padding: 18px 12px 14px !important;
    border-right: 1px solid var(--border) !important;
    border-bottom: 0 !important;
    background: var(--background) !important;
    -webkit-backdrop-filter: none !important; backdrop-filter: none !important;
    overflow-y: auto !important; overflow-x: hidden !important;
    z-index: 40 !important;
  }
  body > header > div {
    display: flex !important; flex-direction: column !important;
    align-items: stretch !important; gap: 4px !important;
    height: 100% !important; max-width: none !important;
    margin: 0 !important; padding: 0 !important;
  }

  /* LOGO 放大 */
  body > header a[href="/"] { padding: 4px 8px !important; }
  body > header .uc-logo-mark {
    width: 48px !important; height: 48px !important; border-radius: 14px !important;
  }
  body > header .uc-logo-mark > svg { width: 28px !important; height: 28px !important; }
  body > header a[href="/"] > span.leading-none > span {
    font-size: 1.6rem !important; letter-spacing: .01em !important;
  }

  /* 主导航竖排 */
  body > header nav[aria-label="主导航"] {
    display: flex !important; flex-direction: column !important;
    align-items: stretch !important; width: 100% !important;
    margin-top: 18px !important; gap: 2px !important;
  }
  body > header nav[aria-label="主导航"] > a {
    display: flex !important; align-items: center !important;
    padding: 11px 14px !important; border-radius: 10px !important;
    font-size: .95rem !important; position: relative !important;
  }
  body > header nav[aria-label="主导航"] > a:hover { background: var(--secondary) !important; }
  /* 底部下划线 → 左侧竖条 */
  body > header nav[aria-label="主导航"] > a > span {
    left: 0 !important; right: auto !important;
    top: 50% !important; bottom: auto !important;
    width: 3px !important; height: 20px !important;
    transform: translateY(-50%) scaleY(0) !important;
    transform-origin: center !important;
    border-radius: 2px !important;
  }
  body > header nav[aria-label="主导航"] > a[data-status="active"] > span {
    transform: translateY(-50%) scaleY(1) !important;
  }

  /* 按钮组推到底部 */
  body > header > div > div[class*="ml-auto"] {
    margin: auto 0 0 0 !important;
    display: flex !important; flex-direction: column !important;
    align-items: stretch !important; gap: 8px !important; width: 100% !important;
  }
  body > header > div > div[class*="ml-auto"] > * { width: 100% !important; }
  body > header > div > div[class*="ml-auto"] button {
    width: 100% !important; justify-content: center !important;
  }
  body > header [aria-label="打开菜单"] { display: none !important; }

  /* 中间内容列 */
  body > main { max-width: 680px !important; margin: 0 auto 0 0 !important; }
  body > footer { max-width: 680px !important; margin-left: 0 !important; }
}

/* 右栏：足够宽才出现 */
@media (min-width: 1320px) {
  .uc-rail {
    position: fixed !important; top: 22px; right: 26px;
    width: 302px; max-height: calc(100vh - 44px);
    overflow-y: auto;
  }
}
@media (max-width: 1319px) { .uc-rail { display: none !important; } }
`;

for (const f of ['public/assets/index-CI3z2CFS.css', 'readable/index-CI3z2CFS.css']) {
  const fp = path.join(ROOT, f);
  let src = fs.readFileSync(fp, 'utf8');
  const idx = src.indexOf(OLD_START);
  if (idx < 0) {
    console.log('skip (no marker)', f);
    continue;
  }
  // 截掉旧布局块（从 marker 到 .uc-rail 样式结束），保留后面的 rail 样式
  const railStyleIdx = src.indexOf('/* 右栏样式 */', idx);
  const tail = railStyleIdx >= 0 ? src.slice(railStyleIdx) : '';
  src = src.slice(0, idx) + CSS + '\n' + tail;
  fs.writeFileSync(fp, src, 'utf8');
  console.log('rewrote', f);
}

// 给 CSS 引用加版本参数，绕过浏览器缓存
for (const rel of ['public/index.html', ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((x) => x.endsWith('.html')).map((x) => 'snapshots/' + x)]) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  const before = src;
  src = src.replace(/href="\/assets\/index-CI3z2CFS\.css"/g, 'href="/assets/index-CI3z2CFS.css?v=threads1"');
  if (src !== before) {
    fs.writeFileSync(fp, src, 'utf8');
    console.log('cache-bust', rel);
  }
}

console.log('\nDone.');
