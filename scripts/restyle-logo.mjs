import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let changed = 0;
function edit(rel, pairs) {
  const fp = path.join(ROOT, rel);
  if (!fs.existsSync(fp)) return;
  let src = fs.readFileSync(fp, 'utf8');
  const before = src;
  for (const [from, to] of pairs) {
    if (from instanceof RegExp) src = src.replace(from, to);
    else if (src.includes(from)) src = src.split(from).join(to);
  }
  if (src !== before) {
    fs.writeFileSync(fp, src, 'utf8');
    changed++;
    console.log('  updated', rel);
  }
}

// 容器：荧光绿方块 → 黑白圆角方块。用自定义 class，SVG 的 currentColor 自动适配。
const classPairs = [
  ['grid size-8 place-items-center bg-[var(--logo-bg)] text-primary-foreground', 'grid size-8 place-items-center uc-logo-mark'],
];
edit('public/assets/index-D8H8Au6A.js', classPairs);
edit('readable/index-D8H8Au6A.js', classPairs);
edit('public/index.html', classPairs);
for (const f of fs.readdirSync(path.join(ROOT, 'snapshots')).filter((f) => f.endsWith('.html'))) {
  edit(`snapshots/${f}`, classPairs);
}

// CSS：黑白 token + 圆角。暗色主题白底黑图，亮色主题黑底白图，始终黑白。
const cssBlock = `
/* Undercurrent logo: monochrome, rounded */
:root { --logo-bg: #f5f5f1; --logo-ink: #0f0e0c; }
html:not(.dark) { --logo-bg: #0f0e0c; --logo-ink: #f5f5f1; }
.uc-logo-mark {
  background: var(--logo-bg);
  color: var(--logo-ink);
  border-radius: 9px;
}
`;
for (const f of ['public/assets/index-CI3z2CFS.css', 'readable/index-CI3z2CFS.css']) {
  const fp = path.join(ROOT, f);
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('Undercurrent logo: monochrome')) continue;
  // 旧 logo 规则留着无害，但清掉避免混淆
  src = src.replace(/\/\* Undercurrent brand: logo mark color[^\n]*\n:root\{--logo-bg:var\(--primary\)\}\n\.bg-\\\[var\\\(--logo-bg\\\)\\\]\{background-color:var\(--logo-bg\)\}\n?/, '');
  fs.writeFileSync(fp, src + cssBlock, 'utf8');
  changed++;
  console.log('  updated', f);
}

// 同步光标热点：中指尖更粗，热点右移
for (const f of ['public/assets/index-CI3z2CFS.css', 'readable/index-CI3z2CFS.css']) {
  const fp = path.join(ROOT, f);
  let src = fs.readFileSync(fp, 'utf8');
  src = src.replace(/url\('\/cursor\/uc-pointer\.svg'\) \d+ \d+/, "url('/cursor/uc-pointer.svg') 13 3");
  fs.writeFileSync(fp, src, 'utf8');
}

console.log(`\nDone. ${changed} files updated.`);
