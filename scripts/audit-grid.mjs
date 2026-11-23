import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const pages = [
  ['public/index.html', '首页'],
  ...fs.readdirSync(path.join(ROOT, 'snapshots'))
    .filter((f) => f.endsWith('.html'))
    .map((f) => ['snapshots/' + f, f.replace('.html', '')]),
];

const DANGEROUS = [
  'lg:grid-cols-12',
  'lg:grid-cols-[',
  'md:grid-cols-[',
  'md:grid-cols-2',
  'lg:grid-cols-3',
  'xl:grid-cols-4',
];

let issues = 0;
for (const [rel, name] of pages) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const hasDowngrade = src.includes('[class*="lg:grid-cols-["]') && src.includes('[class*="md:grid-cols-["]');

  // 找出页面里实际使用的多列栅格类
  const used = DANGEROUS.filter((c) => src.includes(c));
  const uncovered = [];

  if (used.includes('lg:grid-cols-12') && !src.includes('[class*="lg:grid-cols-12"]')) uncovered.push('lg:grid-cols-12');
  if (used.includes('lg:grid-cols-3') && !src.includes('lg:grid-cols-3"]')) uncovered.push('lg:grid-cols-3');
  if (used.includes('xl:grid-cols-4') && !src.includes('xl:grid-cols-4"]')) uncovered.push('xl:grid-cols-4');
  if (used.includes('md:grid-cols-2') && !src.includes('[class*="md:grid-cols-2"]')) uncovered.push('md:grid-cols-2');

  const ok = hasDowngrade && uncovered.length === 0;
  console.log((ok ? 'PASS' : 'FAIL').padEnd(5), name.padEnd(16), used.length ? `用到的栅格: ${used.join(', ')}` : '无多列栅格');
  if (!ok) {
    issues++;
    if (!hasDowngrade) console.log('      缺少降级规则块');
    if (uncovered.length) console.log('      未覆盖:', uncovered.join(', '));
  }
}

console.log(issues === 0 ? '\n全部覆盖 OK' : `\n${issues} 个页面有问题`);
process.exit(issues === 0 ? 0 : 1);
