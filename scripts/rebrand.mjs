import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 主名：所有品牌文本统一替换
const NAME_MAP = [
  ['SUBTERRA 地下频段', 'Undercurrent'],
  ['SUBTERRA', 'Undercurrent'],
];

// LOGO 图标：把 4 根声波柱换成 3 道下沉水流。
// 压缩产物（public/assets）与格式化副本（readable）两套写法都要覆盖。
const ICON_REPLACEMENTS = [
  // 压缩版：一个连续的字符串
  [
    'className:`grid size-8 place-items-center bg-primary text-primary-foreground`,children:(0,L.jsxs)(`svg`,{viewBox:`0 0 24 24`,className:`size-5`,fill:`currentColor`,children:[(0,L.jsx)(`rect`,{x:`2`,y:`13`,width:`3`,height:`9`}),(0,L.jsx)(`rect`,{x:`7`,y:`7`,width:`3`,height:`15`}),(0,L.jsx)(`rect`,{x:`12`,y:`2`,width:`3`,height:`20`}),(0,L.jsx)(`rect`,{x:`17`,y:`10`,width:`3`,height:`12`})]})',
    'className:`grid size-8 place-items-center bg-[var(--logo-bg)] text-primary-foreground`,children:(0,L.jsxs)(`svg`,{viewBox:`0 0 24 24`,className:`size-5`,fill:`none`,stroke:`currentColor`,strokeWidth:`2.2`,strokeLinecap:`round`,children:[(0,L.jsx)(`path`,{d:`M3 5 Q12 13 21 5`}),(0,L.jsx)(`path`,{d:`M3 10.5 Q12 18.5 21 10.5`}),(0,L.jsx)(`path`,{d:`M3 16 Q12 24 21 16`})]})',
  ],
  // 格式化版：跨多行，用正则
  [
    /className: `grid size-8 place-items-center bg-primary text-primary-foreground`,\s*children: \(0, L\.jsxs\)\(`svg`, \{\s*viewBox: `0 0 24 24`,\s*className: `size-5`,\s*fill: `currentColor`,\s*children: \[\s*\(0, L\.jsx\)\(`rect`, \{ x: `2`, y: `13`, width: `3`, height: `9` \}\),\s*\(0, L\.jsx\)\(`rect`, \{ x: `7`, y: `7`, width: `3`, height: `15` \}\),\s*\(0, L\.jsx\)\(`rect`, \{ x: `12`, y: `2`, width: `3`, height: `20` \}\),\s*\(0, L\.jsx\)\(`rect`, \{ x: `17`, y: `10`, width: `3`, height: `12` \}\),\s*\],\s*\}\)/,
    'className: `grid size-8 place-items-center bg-[var(--logo-bg)] text-primary-foreground`,\n        children: (0, L.jsxs)(`svg`, {\n          viewBox: `0 0 24 24`,\n          className: `size-5`,\n          fill: `none`,\n          stroke: `currentColor`,\n          strokeWidth: `2.2`,\n          strokeLinecap: `round`,\n          children: [\n            (0, L.jsx)(`path`, { d: `M3 5 Q12 13 21 5` }),\n            (0, L.jsx)(`path`, { d: `M3 10.5 Q12 18.5 21 10.5` }),\n            (0, L.jsx)(`path`, { d: `M3 16 Q12 24 21 16` }),\n          ],\n        })',
  ],
];

// 去掉中文副标 span。压缩版 / 格式化版各一条。
const SUBTITLE_REPLACEMENTS = [
  [
    'children:[(0,L.jsx)(`span`,{className:`block font-display text-xl font-black tracking-[0.12em]`,children:`SUBTERRA`}),(0,L.jsx)(`span`,{className:`block font-cn text-[11px] tracking-[0.5em] text-muted-foreground`,children:`地下频段`})]',
    'children:(0,L.jsx)(`span`,{className:`block font-display text-lg font-black tracking-[0.04em]`,children:`Undercurrent`})',
  ],
  [
    /children: \[\s*\(0, L\.jsx\)\(`span`, \{\s*className: `block font-display text-xl font-black tracking-\[0\.12em\]`,\s*children: `SUBTERRA`,\s*\}\),\s*\(0, L\.jsx\)\(`span`, \{\s*className: `block font-cn text-\[11px\] tracking-\[0\.5em\] text-muted-foreground`,\s*children: `地下频段`,\s*\}\),\s*\]/,
    'children: (0, L.jsx)(`span`, {\n            className: `block font-display text-lg font-black tracking-[0.04em]`,\n            children: `Undercurrent`,\n          })',
  ],
];

// SSR HTML：LOGO 图标是静态 SVG，整体替换；副标 span 删除。
const HTML_ICON_RE = /<span aria-hidden="true" class="grid size-8 place-items-center bg-primary text-primary-foreground"><svg[^>]*viewBox="0 0 24 24"[^>]*><rect x="2" y="13" width="3" height="9"><\/rect><rect x="7" y="7" width="3" height="15"><\/rect><rect x="12" y="2" width="3" height="20"><\/rect><rect x="17" y="10" width="3" height="12"><\/rect><\/svg><\/span>/g;
const HTML_ICON_NEW = '<span aria-hidden="true" class="grid size-8 place-items-center bg-[var(--logo-bg)] text-primary-foreground"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="size-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M3 5 Q12 13 21 5"></path><path d="M3 10.5 Q12 18.5 21 10.5"></path><path d="M3 16 Q12 24 21 16"></path></svg></span>';
const HTML_SUBTITLE_RE = /<span class="block font-cn text-\[11px\] tracking-\[0\.5em\] text-muted-foreground">地下频段<\/span>/g;
const HTML_NAME_RE = /<span class="block font-display text-xl font-black tracking-\[0\.12em\]">SUBTERRA<\/span>/g;
const HTML_NAME_NEW = '<span class="block font-display text-lg font-black tracking-[0.04em]">Undercurrent</span>';

function apply(text, replacements, label) {
  let out = text;
  let hits = 0;
  for (const [from, to] of replacements) {
    if (from instanceof RegExp) {
      out = out.replace(from, () => {
        hits++;
        return to;
      });
    } else if (out.includes(from)) {
      const parts = out.split(from);
      hits += parts.length - 1;
      out = parts.join(to);
    }
  }
  return { out, hits };
}

let total = 0;

// 1) JS bundles：public/assets 与 readable
for (const dir of ['public/assets', 'readable']) {
  const files = fs
    .readdirSync(path.join(ROOT, dir))
    .filter((f) => f.endsWith('.js'));
  for (const file of files) {
    const fp = path.join(ROOT, dir, file);
    let src = fs.readFileSync(fp, 'utf8');
    const before = src;

    for (const [from, to] of ICON_REPLACEMENTS) {
      if (from instanceof RegExp) src = src.replace(from, to);
      else src = src.split(from).join(to);
    }
    for (const [from, to] of SUBTITLE_REPLACEMENTS) {
      if (from instanceof RegExp) src = src.replace(from, to);
      else src = src.split(from).join(to);
    }
    for (const [from, to] of NAME_MAP) src = src.split(from).join(to);

    if (src !== before) {
      fs.writeFileSync(fp, src, 'utf8');
      total++;
      console.log(`updated  ${dir}/${file}`);
    }
  }
}

// 2) SSR HTML：index.html + snapshots
const htmlFiles = [
  'public/index.html',
  ...fs
    .readdirSync(path.join(ROOT, 'snapshots'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => `snapshots/${f}`),
];
for (const rel of htmlFiles) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  const before = src;

  src = src.replace(HTML_ICON_RE, HTML_ICON_NEW);
  src = src.replace(HTML_SUBTITLE_RE, '');
  src = src.replace(HTML_NAME_RE, HTML_NAME_NEW);
  for (const [from, to] of NAME_MAP) src = src.split(from).join(to);

  if (src !== before) {
    fs.writeFileSync(fp, src, 'utf8');
    total++;
    console.log(`updated  ${rel}`);
  }
}

// 3) 注入 LOGO 底色变量到 index.html（放在 </head> 前）
const indexPath = path.join(ROOT, 'public/index.html');
let html = fs.readFileSync(indexPath, 'utf8');
if (!html.includes('--logo-bg')) {
  html = html.replace(
    '</head>',
    '<style id="undercurrent-brand">:root{--logo-bg:var(--primary)}</style></head>',
  );
  fs.writeFileSync(indexPath, html, 'utf8');
  console.log('updated  public/index.html (--logo-bg token)');
}

console.log(`\nDone. ${total} files changed.`);
