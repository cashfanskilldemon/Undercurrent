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

// 主题切换按钮：原生 DOM 切换 html.dark + localStorage，内联太阳/月亮 SVG 按主题显隐
const TOGGLE_JS =
  '(0,L.jsx)(`button`,{type:`button`,"aria-label":`切换明暗主题`,title:`切换明暗主题`,onClick:()=>{let e=document.documentElement,n=e.classList.toggle(`dark`);localStorage.setItem(`uc-theme`,n?`dark`:`light`);document.querySelector(`meta[name="theme-color"]`)?.setAttribute(`content`,n?`#1a1a17`:`#f5f5f1`)},className:`inline-flex size-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`,children:[(0,L.jsx)(`svg`,{className:`size-4 theme-icon-moon`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,strokeLinejoin:`round`,children:(0,L.jsx)(`path`,{d:`M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z`})}),(0,L.jsx)(`svg`,{className:`size-4 theme-icon-sun`,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,strokeWidth:`2`,strokeLinecap:`round`,children:[(0,L.jsx)(`circle`,{cx:`12`,cy:`12`,r:`4`}),(0,L.jsx)(`path`,{d:`M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41`})]})]})';

const LOGIN_COMPRESSED = '(0,L.jsx)(t,{size:`sm`,variant:`outline`,className:`hidden sm:inline-flex`,onClick:c,children:`登录`})';
const LOGIN_FORMATTED =
  '(0, L.jsx)(t, {\n                    size: `sm`,\n                    variant: `outline`,\n                    className: `hidden sm:inline-flex`,\n                    onClick: c,\n                    children: `登录`,\n                  })';

const TOGGLE_FORMATTED = `(0, L.jsx)(\`button\`, {
                    type: \`button\`,
                    "aria-label": \`切换明暗主题\`,
                    title: \`切换明暗主题\`,
                    onClick: () => {
                      let e = document.documentElement, n = e.classList.toggle(\`dark\`);
                      localStorage.setItem(\`uc-theme\`, n ? \`dark\` : \`light\`);
                      document.querySelector(\`meta[name="theme-color"]\`)?.setAttribute(\`content\`, n ? \`#1a1a17\` : \`#f5f5f1\`);
                    },
                    className: \`inline-flex size-9 items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary\`,
                    children: [
                      (0, L.jsx)(\`svg\`, { className: \`size-4 theme-icon-moon\`, viewBox: \`0 0 24 24\`, fill: \`none\`, stroke: \`currentColor\`, strokeWidth: \`2\`, strokeLinecap: \`round\`, strokeLinejoin: \`round\`, children: (0, L.jsx)(\`path\`, { d: \`M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z\` }) }),
                      (0, L.jsx)(\`svg\`, { className: \`size-4 theme-icon-sun\`, viewBox: \`0 0 24 24\`, fill: \`none\`, stroke: \`currentColor\`, strokeWidth: \`2\`, strokeLinecap: \`round\`, children: [(0, L.jsx)(\`circle\`, { cx: \`12\`, cy: \`12\`, r: \`4\` }), (0, L.jsx)(\`path\`, { d: \`M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41\` })] })],
                  })`;

console.log('JS — 在登录按钮前插入主题切换');
edit('public/assets/index-D8H8Au6A.js', [[LOGIN_COMPRESSED, TOGGLE_JS + ',' + LOGIN_COMPRESSED]]);
edit('readable/index-D8H8Au6A.js', [[LOGIN_FORMATTED, TOGGLE_FORMATTED + ',\n                    ' + LOGIN_FORMATTED]]);

console.log('CSS — 亮色 token + 图标显隐规则');
const lightTokens = `
/* Undercurrent light theme */
html:not(.dark){
--background:oklch(97% .006 105);--foreground:oklch(20% .015 105);
--card:oklch(99% .004 105);--card-foreground:oklch(20% .015 105);
--popover:oklch(99% .004 105);--popover-foreground:oklch(20% .015 105);
--primary:oklch(78% .16 122);--primary-foreground:oklch(22% .02 120);
--secondary:oklch(93% .008 105);--secondary-foreground:oklch(25% .015 105);
--muted:oklch(94.5% .006 105);--muted-foreground:oklch(45% .015 105);
--accent:oklch(91% .012 105);--accent-foreground:oklch(22% .015 105);
--destructive:oklch(55% .18 36);--destructive-foreground:oklch(98% .01 95);
--rust:oklch(52% .15 42);--border:oklch(62% .008 105);--input:oklch(70% .008 105);
--ring:oklch(78% .16 122);
--chart-1:oklch(78% .16 122);--chart-2:oklch(52% .15 42);
--chart-3:oklch(62% .08 230);--chart-4:oklch(68% .12 85);--chart-5:oklch(50% .1 300);
--sidebar:oklch(96% .006 105);--sidebar-foreground:oklch(20% .015 105);
--sidebar-primary:oklch(78% .16 122);--sidebar-primary-foreground:oklch(22% .02 120);
--sidebar-accent:oklch(91% .012 105);--sidebar-accent-foreground:oklch(22% .015 105);
--sidebar-border:oklch(62% .008 105);--sidebar-ring:oklch(78% .16 122);
}
.theme-icon-sun{display:none}
.theme-icon-moon{display:block}
html:not(.dark) .theme-icon-sun{display:block}
html:not(.dark) .theme-icon-moon{display:none}
`;
for (const f of ['public/assets/index-CI3z2CFS.css', 'readable/index-CI3z2CFS.css']) {
  const fp = path.join(ROOT, f);
  let src = fs.readFileSync(fp, 'utf8');
  if (!src.includes('Undercurrent light theme')) {
    fs.writeFileSync(fp, src + lightTokens, 'utf8');
    changed++;
    console.log('  updated', f);
  }
}

console.log('HTML — 首屏防闪脚本 + SSR 按钮');
for (const rel of ['public/index.html', ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((f) => f.endsWith('.html')).map((f) => 'snapshots/' + f)]) {
  edit(rel, [
    ['<head>', '<head><script>(function(){try{var t=localStorage.getItem("uc-theme");if(t==="light"){document.documentElement.classList.remove("dark");document.querySelector(\'meta[name="theme-color"]\')?.setAttribute("content","#f5f5f1")}}catch(e){}})()</script>'],
  ]);
}

console.log(`\nDone. ${changed} files updated.`);
