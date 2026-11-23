import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(ROOT, 'public/assets/index-CI3z2CFS.css'), 'utf8');

const i = css.indexOf('Undercurrent logo');
console.log('=== LOGO CSS ===');
console.log(css.slice(i, i + 240));

const lightStart = css.indexOf('html:not(.dark)');
const darkFg = css.match(/--foreground:(oklch\([^)]*\))/);
const lightSeg = css.slice(lightStart, lightStart + 3000);
const lightFg = lightSeg.match(/--foreground:(oklch\([^)]*\))/);

console.log('\n=== 主题前景色 ===');
console.log('暗色 --foreground:', darkFg ? darkFg[1] : '?');
console.log('亮色 --foreground:', lightFg ? lightFg[1] : '?');

const checks = [
  ['LOGO 用 var(--foreground)', css.includes('--logo-ink: var(--foreground)')],
  ['LOGO 背景透明', /\.uc-logo-mark\s*\{[^}]*background:\s*transparent/.test(css)],
  ['去掉方块圆角', !/\.uc-logo-mark\s*\{[^}]*border-radius:\s*9px/.test(css)],
  ['无旧白底变量', !css.includes('--logo-bg: #f5f5f1')],
];
console.log('\n=== 判定 ===');
let ok = 0;
for (const [n, v] of checks) {
  console.log((v ? 'PASS' : 'FAIL').padEnd(5), n);
  if (v) ok++;
}
console.log(`\n${ok}/${checks.length}`);
