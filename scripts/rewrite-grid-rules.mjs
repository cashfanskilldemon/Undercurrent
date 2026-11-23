import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 新规则：用不含内部方括号的属性选择器，匹配所有带断点的栅格类
const NEW = `  /* 三栏下内容列放不下原站的宽栅格，统一降级为单列（作品库卡片保留 2 列） */
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
  body > main img { max-width: 100% !important; }
`;

const OLD_PATTERNS = [
  /  \/\* 三栏下内容列放不下原站的宽栅格，统一降级避免重叠 \*\/[\s\S]*?body > main img \{ max-width: 100% !important; \}\n/,
];

for (const rel of ['public/index.html', ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((x) => x.endsWith('.html')).map((x) => 'snapshots/' + x)]) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  let replaced = false;
  for (const re of OLD_PATTERNS) {
    if (re.test(src)) {
      src = src.replace(re, NEW);
      replaced = true;
      break;
    }
  }
  if (!replaced) {
    console.log('no old block found:', rel);
    continue;
  }
  fs.writeFileSync(fp, src, 'utf8');
  console.log('rewrote', rel);
}
console.log('\nDone.');
