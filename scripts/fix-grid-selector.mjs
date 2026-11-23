import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const START = '/* 三栏下内容列放不下原站的宽栅格，统一降级避免重叠 */';
const END = 'body > main img { max-width: 100% !important; }';

const NEW = `/* 三栏下内容列放不下原站的宽栅格，统一降级为单列（作品库卡片保留 2 列） */
  body > main [class*="lg:grid-cols"],
  body > main [class*="md:grid-cols"],
  body > main [class*="xl:grid-cols"] {
    grid-template-columns: 1fr !important;
  }
  body > main ul[class*="lg:grid-cols-3"],
  body > main ul[class*="xl:grid-cols-4"] {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  body > main .max-w-lg { max-width: 100% !important; }
  body > main img { max-width: 100% !important; }`;

for (const rel of ['public/index.html', ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((x) => x.endsWith('.html')).map((x) => 'snapshots/' + x)]) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  const a = src.indexOf(START);
  const b = src.indexOf(END, a);
  if (a < 0 || b < 0) {
    console.log('skip', rel, a, b);
    continue;
  }
  src = src.slice(0, a) + NEW + src.slice(b + END.length);
  fs.writeFileSync(fp, src, 'utf8');
  console.log('fixed', rel);
}

// 校验：不应再出现字符串内的方括号选择器
for (const rel of ['public/index.html']) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const bad = src.includes('grid-cols-["]');
  console.log('\n残留方括号选择器:', bad ? 'YES（仍有问题）' : 'NO（已清理）');
}
