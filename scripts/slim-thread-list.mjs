import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const files = ['public/index.html', ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((x) => x.endsWith('.html')).map((x) => 'snapshots/' + x)];

for (const rel of files) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  const before = src;
  const nl = src.includes('\r\n') ? '\r\n' : '\n';

  // 1) 中间列加宽：两栏时可用更宽
  src = src.replace(
    'body > main { max-width: min(640px, calc(100vw - 580px)) !important; margin: 0 auto !important; }',
    'body > main { max-width: min(760px, calc(100vw - 272px)) !important; margin: 0 auto !important; }',
  );
  src = src.replace(
    'body > footer { max-width: min(640px, calc(100vw - 580px)) !important; margin-left: auto !important; margin-right: auto !important; }',
    'body > footer { max-width: min(760px, calc(100vw - 272px)) !important; margin-left: auto !important; margin-right: auto !important; }',
  );

  // 2) 右栏断点 1024 → 1120，三栏时再把中间列收窄并给右栏让位
  src = src.replace(
    '@media (min-width: 1024px) {' + nl + '  body { padding-right: 328px !important; }' + nl + '}',
    '@media (min-width: 1120px) {' + nl +
      '  body { padding-right: 328px !important; }' + nl +
      '  body > main { max-width: min(760px, calc(100vw - 580px)) !important; }' + nl +
      '  body > footer { max-width: min(760px, calc(100vw - 580px)) !important; }' + nl +
      '}',
  );
  src = src.replace('@media (min-width: 1024px) {' + nl + '  .uc-rail {', '@media (min-width: 1120px) {' + nl + '  .uc-rail {');
  src = src.replace('@media (max-width: 1023px) { .uc-rail { display: none !important; } }', '@media (max-width: 1119px) { .uc-rail { display: none !important; } }');

  // 3) 讨论列表去掉左右外框，只保留帖子之间的横线
  const anchor = '  body > main .max-w-lg { max-width: 100% !important; }';
  if (!src.includes('讨论列表去掉外框')) {
    src = src.replace(anchor,
      '  /* 讨论列表去掉外框，只用帖子间的横线分隔 */' + nl +
      '  body > main section[class*="sm:border-x"] {' + nl +
      '    border-left-width: 0 !important;' + nl +
      '    border-right-width: 0 !important;' + nl +
      '  }' + nl +
      anchor);
  }

  if (src !== before) {
    fs.writeFileSync(fp, src, 'utf8');
    console.log('updated', rel);
  } else {
    console.log('no change', rel);
  }
}
console.log('\nDone.');
