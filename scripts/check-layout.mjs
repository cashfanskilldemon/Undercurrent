import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const h = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');
const css = fs.readFileSync(path.join(ROOT, 'public/assets/index-CI3z2CFS.css'), 'utf8');

const checks = [
  ['内联布局块', h.includes('uc-threads-layout')],
  ['左栏断点 768', h.includes('min-width: 768px')],
  ['右栏断点 1024', h.includes('min-width: 1024px')],
  ['LOGO 48px', h.includes('width: 48px !important')],
  ['右栏 aside', h.includes('class="uc-rail"')],
  ['右栏推荐数据', h.includes('uc-rail-row')],
  ['CSS 无旧布局块', !css.includes('Threads 三栏布局')],
  ['CSS 括号平衡', (() => { let d = 0; for (const c of css) { if (c === '{') d++; else if (c === '}') d--; } return d === 0; })()],
  ['导航四项', ['首页', '讨论', '作品', '插件'].every((x) => h.includes(x))],
  ['主题切换保留', h.includes('切换明暗主题')],
];

let ok = 0;
for (const [n, v] of checks) {
  console.log((v ? 'PASS' : 'FAIL').padEnd(5), n);
  if (v) ok++;
}
console.log(`\n${ok}/${checks.length}`);
process.exit(ok === checks.length ? 0 : 1);
