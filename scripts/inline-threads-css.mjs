import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const STYLE = `<style id="uc-threads-layout">
@media (min-width: 768px) {
  body { padding-left: 224px !important; }
  body > header {
    position: fixed !important; inset: 0 auto 0 0 !important;
    width: 224px !important; height: 100vh !important;
    display: flex !important; flex-direction: column !important;
    padding: 18px 12px 14px !important;
    border-right: 1px solid var(--border) !important;
    border-bottom: 0 !important;
    background: var(--background) !important;
    backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
    overflow-y: auto !important; overflow-x: hidden !important;
    z-index: 40 !important;
  }
  body > header > div {
    display: flex !important; flex-direction: column !important;
    align-items: stretch !important; gap: 4px !important;
    flex: 1 1 auto !important; min-height: 0 !important;
    height: auto !important; max-height: none !important;
    max-width: none !important;
    margin: 0 !important; padding: 0 !important;
  }
  body > header a[href="/"] { padding: 4px 8px !important; }
  body > header .uc-logo-mark {
    width: 48px !important; height: 48px !important; border-radius: 14px !important;
  }
  body > header .uc-logo-mark > svg { width: 28px !important; height: 28px !important; }
  body > header a[href="/"] > span.leading-none > span {
    font-size: 1.6rem !important; letter-spacing: .01em !important;
  }
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
  body > header nav[aria-label="主导航"] > a > span {
    left: 0 !important; right: auto !important;
    top: 50% !important; bottom: auto !important;
    width: 3px !important; height: 20px !important;
    transform: translateY(-50%) scaleY(0) !important;
    transform-origin: center !important; border-radius: 2px !important;
  }
  body > header nav[aria-label="主导航"] > a[data-status="active"] > span {
    transform: translateY(-50%) scaleY(1) !important;
  }
  body > header > div > div[class*="ml-auto"] {
    margin: auto 0 0 0 !important;
    display: flex !important; flex-direction: column !important;
    align-items: stretch !important; gap: 6px !important; width: 100% !important; padding-bottom: 4px !important;
  }
  body > header > div > div[class*="ml-auto"] > * { width: 100% !important; display: flex !important; }
  body > header > div > div[class*="ml-auto"] > button { display: flex !important; }
  body > header > div > div[class*="ml-auto"] button {
    width: 100% !important; justify-content: center !important;
  }
  body > header [aria-label="打开菜单"] { display: none !important; }
  body > main { max-width: 640px !important; margin: 0 auto 0 0 !important; }
  body > footer { max-width: 680px !important; margin-left: 0 !important; }
}
@media (min-width: 1024px) {
  .uc-rail {
    display: flex !important; flex-direction: column !important;
    position: fixed !important; top: 22px; right: 26px;
    width: 302px; max-height: calc(100vh - 44px); overflow-y: auto;
    background: var(--background); border-radius: 14px;
    padding: 14px 12px; box-sizing: border-box;
  }
}
@media (max-width: 1023px) { .uc-rail { display: none !important; } }
</style>`;

for (const rel of ['public/index.html', ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((x) => x.endsWith('.html')).map((x) => 'snapshots/' + x)]) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('id="uc-threads-layout"')) {
    console.log('skip', rel);
    continue;
  }
  // 放到 </head> 前，保证在内联 style 中最后生效
  src = src.replace('</head>', STYLE + '</head>');
  fs.writeFileSync(fp, src, 'utf8');
  console.log('inlined', rel);
}
console.log('\nDone.');
