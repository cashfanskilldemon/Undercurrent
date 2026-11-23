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
    else src = src.split(from).join(to);
  }
  if (src !== before) {
    fs.writeFileSync(fp, src, 'utf8');
    changed++;
    console.log(`  updated ${rel}`);
  }
}

// 同时改压缩版与格式化版
function editBoth(name, pairs) {
  edit(`public/assets/${name}`, pairs);
  edit(`readable/${name}`, pairs);
}

console.log('P1 — 错误边界：文案中文化 + 补讨论区入口');
const errPairs = [
  // 压缩版
  [
    'children:`This page couldn’t load`',
    'children:`页面没能加载`',
  ],
  [
    'children:`Please try again, or return to the home page.`',
    'children:`可能是链接失效或网络出了点问题，重试或换个入口继续。`',
  ],
  [
    'children:`Try again`',
    'children:`重新加载`',
  ],
  [
    '(0,L.jsx)(t,{variant:`outline`,asChild:!0,children:(0,L.jsx)(`a`,{href:`/`,children:`Go home`})})',
    '(0,L.jsxs)(`div`,{className:`flex flex-wrap justify-center gap-3`,children:[(0,L.jsx)(t,{variant:`outline`,asChild:!0,children:(0,L.jsx)(h,{to:`/`,children:`回首页`})}),(0,L.jsx)(t,{variant:`outline`,asChild:!0,children:(0,L.jsx)(h,{to:`/threads`,children:`去讨论区`})})]})',
  ],
  // 格式化版
  ['children: `This page couldn’t load`', 'children: `页面没能加载`'],
  [
    'children: `Please try again, or return to the home page.`',
    'children: `可能是链接失效或网络出了点问题，重试或换个入口继续。`',
  ],
  ['children: `Try again`', 'children: `重新加载`'],
  [
    '(0, L.jsx)(t, {\n                      variant: `outline`,\n                      asChild: !0,\n                      children: (0, L.jsx)(`a`, { href: `/`, children: `Go home` }),\n                    })',
    '(0, L.jsxs)(`div`, {\n                      className: `flex flex-wrap justify-center gap-3`,\n                      children: [\n                        (0, L.jsx)(t, {\n                          variant: `outline`,\n                          asChild: !0,\n                          children: (0, L.jsx)(h, { to: `/`, children: `回首页` }),\n                        }),\n                        (0, L.jsx)(t, {\n                          variant: `outline`,\n                          asChild: !0,\n                          children: (0, L.jsx)(h, { to: `/threads`, children: `去讨论区` }),\n                        }),\n                      ],\n                    })',
  ],
];
editBoth('index-D8H8Au6A.js', errPairs);

console.log('P1 — 发布按钮降级：主样式 → 次要样式（保留 toast 引导）');
const publishPairs = [
  // 压缩版：发布按钮去掉 font-bold，改 outline
  [
    '(0,L.jsxs)(t,{size:`sm`,className:`font-bold`,children:[(0,L.jsx)(os,{}),` 发布`]})',
    '(0,L.jsxs)(t,{size:`sm`,variant:`outline`,children:[(0,L.jsx)(os,{}),` 发布`]})',
  ],
  // 格式化版
  [
    '(0, L.jsxs)(t, { size: `sm`, className: `font-bold`, children: [(0, L.jsx)(os, {}), ` 发布`] })',
    '(0, L.jsxs)(t, {\n                          size: `sm`,\n                          variant: `outline`,\n                          children: [(0, L.jsx)(os, {}), ` 发布`],\n                        })',
  ],
];
editBoth('index-D8H8Au6A.js', publishPairs);

console.log('P1 — 排版：站名字重/字距、h1 leading');
const typePairs = [
  // 站名：font-black → font-bold, tracking 0.04 → 0.08
  ['block font-display text-lg font-black tracking-[0.04em]', 'block font-display text-lg font-bold tracking-[0.08em]'],
  ['block font-display text-lg font-black tracking-[0.04em]`', 'block font-display text-lg font-bold tracking-[0.08em]`'],
  // h1 leading 0.95 → 1（大屏防笔画碰撞）
  ['leading-[0.95]', 'leading-[1]'],
  ['leading: `[0.95]`', 'leading: `[1]`'],
  // 页脚手机 mock 字距统一
  ['font-display text-sm font-black tracking-[0.2em]', 'font-display text-sm font-bold tracking-[0.08em]'],
  ['font-display tracking-widest', 'font-display font-bold tracking-[0.08em]'],
];
editBoth('index-D8H8Au6A.js', typePairs);
editBoth('routes-BJTAbZMY.js', typePairs);
edit('public/index.html', typePairs);

console.log('P2 — 边框对比度：--border 提亮到 3:1 以上');
edit('public/assets/index-CI3z2CFS.css', [
  ['--border:oklch(31% .01 105)', '--border:oklch(48% .01 105)'],
]);
edit('readable/index-CI3z2CFS.css', [
  ['--border: oklch(31% .01 105)', '--border: oklch(48% .01 105)'],
]);

console.log('P2 — 结果计数：作品库/讨论区/插件区显示筛选结果数');
const countPairs = [
  // tracks: 在筛选行末尾插入结果计数
  [
    ']})]}),A.length===0?',
    ']})},(0,S.jsx)(`span`,{className:`ml-auto font-mono text-xs text-muted-foreground`,children:`${A.length} 首作品`})]}),A.length===0?',
  ],
  [
    ']})]}),A.length===0?',
    ']})},(0,S.jsx)(`span`,{className:`ml-auto font-mono text-xs text-muted-foreground`,children:`${A.length} 首作品`})]}),A.length===0?',
  ],
];
editBoth('tracks-CqMm_FIX.js', countPairs);

console.log('P2 — 标题层级：作品标题 p → h3');
const h3Pairs = [
  ['(0,S.jsxs)(`p`,{className:`flex items-center gap-2 text-lg font-semibold`', '(0,S.jsxs)(`h3`,{className:`flex items-center gap-2 text-lg font-semibold`'],
];
editBoth('tracks-CqMm_FIX.js', h3Pairs);

console.log('P3 — 图片本地化：Netlify 转换接口 → 本地 PNG');
const imgPairs = [
  // SSR HTML：把 /.netlify/images?url=%2Fimg%2Fxxx.png&w=NNN... 整体替换为 /img/xxx.png
  [/\/\.netlify\/images\?url=%2Fimg%2F([a-z0-9-]+\.png)&[^"'\s]*/g, '/img/$1'],
  // JS 里的 Oi() 图片 URL 构造函数：直接返回本地路径
  [
    'let r=new URLSearchParams({url:`/img/${e}`,w:String(t),fm:`webp`});return n&&(r.set(`h`,String(n)),r.set(`fit`,`cover`)),`/.netlify/images?${r.toString()}`',
    'return `/img/${e}`',
  ],
];
edit('public/index.html', imgPairs);
editBoth('bits-CX_ZQ6ey.js', [imgPairs[1]]);
for (const f of fs.readdirSync(path.join(ROOT, 'snapshots')).filter((f) => f.endsWith('.html'))) {
  edit(`snapshots/${f}`, imgPairs);
}

console.log('补 CSS — 新增任意值 class（Tailwind 预编译不生成）');
const cssExtra = `
/* Undercurrent review fixes: arbitrary-value utilities */
.tracking-\\[0\\.08em\\]{letter-spacing:.08em}
.leading-\\[1\\]{line-height:1}
`;
for (const f of ['public/assets/index-CI3z2CFS.css', 'readable/index-CI3z2CFS.css']) {
  const fp = path.join(ROOT, f);
  let src = fs.readFileSync(fp, 'utf8');
  if (!src.includes('.tracking-\\[0\\.08em\\]')) {
    fs.writeFileSync(fp, src + cssExtra, 'utf8');
    changed++;
    console.log(`  updated ${f}`);
  }
}

console.log(`\nDone. ${changed} files updated.`);
