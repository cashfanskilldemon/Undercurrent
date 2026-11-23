import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const OLD = `/* 三栏下内容列放不下原站的宽栅格，统一降级为单列（作品库卡片保留 2 列） */
  body > main [class*="lg:grid-cols"],
  body > main [class*="md:grid-cols"],
  body > main [class*="xl:grid-cols"] {
    grid-template-columns: 1fr !important;
  }
  body > main ul[class*="lg:grid-cols-3"],
  body > main ul[class*="xl:grid-cols-4"] {
    grid-template-columns: repeat(2, 1fr) !important;
  }`;

const NEW = `/* 三栏下内容列放不下原站的宽栅格：多列容器改为纵向堆叠（保留 gap），卡片网格保留 2 列 */
  body > main [class*="lg:grid-cols"],
  body > main [class*="md:grid-cols"],
  body > main [class*="xl:grid-cols"] {
    display: flex !important;
    flex-direction: column !important;
  }
  body > main ul[class*="lg:grid-cols-3"],
  body > main ul[class*="xl:grid-cols-4"] {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
  }`;

for (const rel of ['public/index.html', ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((x) => x.endsWith('.html')).map((x) => 'snapshots/' + x)]) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  if (!src.includes(OLD)) {
    console.log('skip (no match)', rel);
    continue;
  }
  src = src.split(OLD).join(NEW);
  fs.writeFileSync(fp, src, 'utf8');
  console.log('updated', rel);
}
console.log('\nDone.');
