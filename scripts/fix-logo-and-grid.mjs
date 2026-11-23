import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 1) LOGO：去掉方块底色，只留三条波浪线，线色 = 主题前景色
for (const f of ['public/assets/index-CI3z2CFS.css', 'readable/index-CI3z2CFS.css']) {
  const fp = path.join(ROOT, f);
  let src = fs.readFileSync(fp, 'utf8');
  src = src.replace(
    /\/\* Undercurrent logo: monochrome, rounded \*\/[\s\S]*?\.uc-logo-mark \{[\s\S]*?\}/,
    `/* Undercurrent logo: bare waves, color follows theme foreground */
:root { --logo-bg: transparent; --logo-ink: var(--foreground); }
.uc-logo-mark {
  background: transparent;
  color: var(--logo-ink);
  border-radius: 0;
}`,
  );
  fs.writeFileSync(fp, src, 'utf8');
  console.log('logo css updated', f);
}

// 2) 布局：内容列 + 栅格降级（三栏下内容区只有约 680px，复杂栅格必须降为单/双列）
const EXTRA = `
  /* 三栏下内容列放不下原站的宽栅格，统一降级避免重叠 */
  body > main [class*="lg:grid-cols-12"],
  body > main [class*="lg:grid-cols-[22rem_1fr]"],
  body > main [class*="md:grid-cols-[1.2fr_1fr]"],
  body > main [class*="md:grid-cols-2"] {
    grid-template-columns: 1fr !important;
  }
  body > main [class*="md:grid-cols-[1.4fr_1fr_1fr_1fr]"] {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  body > main ul[class*="lg:grid-cols-3"],
  body > main ul[class*="xl:grid-cols-4"] {
    grid-template-columns: repeat(2, 1fr) !important;
  }
  body > main .max-w-lg { max-width: 100% !important; }
  body > main img { max-width: 100% !important; }
`;

for (const rel of ['public/index.html', ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((x) => x.endsWith('.html')).map((x) => 'snapshots/' + x)]) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('三栏下内容列放不下')) {
    console.log('skip', rel);
    continue;
  }
  // 插入到内联 style 的最后一个 } 之前（即 @media (min-width:768px) 块末尾）
  const anchor = /(@media \(min-width: 768px\) \{[\s\S]*?)(\n\})/;
  if (!anchor.test(src)) {
    console.log('skip (no anchor)', rel);
    continue;
  }
  src = src.replace(anchor, (m, body, close) => body + EXTRA + close);
  fs.writeFileSync(fp, src, 'utf8');
  console.log('grid rules added', rel);
}
console.log('\nDone.');
