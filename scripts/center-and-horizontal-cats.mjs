import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const rel of ['public/index.html', ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((x) => x.endsWith('.html')).map((x) => 'snapshots/' + x)]) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  const before = src;

  // 1) main / footer 改为水平居中（原来靠左）
  src = src.replace(
    'body > main { max-width: min(640px, calc(100vw - 580px)) !important; margin: 0 auto 0 0 !important; }',
    'body > main { max-width: min(640px, calc(100vw - 580px)) !important; margin: 0 auto !important; }',
  );
  src = src.replace(
    'body > footer { max-width: min(640px, calc(100vw - 580px)) !important; margin-left: 0 !important; }',
    'body > footer { max-width: min(640px, calc(100vw - 580px)) !important; margin-left: auto !important; margin-right: auto !important; }',
  );

  // 2) 讨论区分类列表：lg 下原本竖排，改成横排（保留横向滚动）
  if (!src.includes('body > main [class*="lg:flex-col"]')) {
    src = src.replace(
      '  body > main .max-w-lg { max-width: 100% !important; }',
      `  /* 讨论区分类：竖排改为横排（可横向滚动） */
  body > main [class*="lg:flex-col"] {
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
  }
  body > main .max-w-lg { max-width: 100% !important; }`,
    );
  }

  // 3) ≥1024 给右栏留出右侧空间，保证 main 在三栏中间真正居中
  if (!src.includes('/* 三栏：右侧给推荐栏留位 */')) {
    src = src.replace(
      '@media (min-width: 1024px) {\n  .uc-rail {',
      `/* 三栏：右侧给推荐栏留位，使中间列视觉居中 */
@media (min-width: 1024px) {
  body { padding-right: 328px !important; }
}
@media (min-width: 1024px) {
  .uc-rail {`,
    );
  }

  if (src !== before) {
    fs.writeFileSync(fp, src, 'utf8');
    console.log('updated', rel);
  } else {
    console.log('no change', rel);
  }
}
console.log('\nDone.');
