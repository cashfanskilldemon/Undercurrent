import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

for (const rel of ['public/index.html', ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((x) => x.endsWith('.html')).map((x) => 'snapshots/' + x)]) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('/* 全局圆角')) {
    console.log('skip', rel);
    continue;
  }
  const nl = src.includes('\r\n') ? '\r\n' : '\n';
  const block = [
    '/* 全局圆角：原站 --radius 只有 0.2rem(3.2px)，按钮/输入框看起来是直角 */',
    ':root { --radius: 0.625rem !important; }',
    '/* 没有圆角类的按钮/输入框补上圆角；rounded-full 的圆形元素（头像、播放键）保持不动 */',
    'body button:not([class*="rounded"]),',
    'body select:not([class*="rounded"]),',
    'body textarea:not([class*="rounded"]),',
    'body input:not([type="checkbox"]):not([type="radio"]):not([class*="rounded"]) {',
    '  border-radius: 8px !important;',
    '}',
  ].join(nl);

  // 放到内联 style 最前面，便于被后续规则覆盖
  src = src.replace('<style id="uc-threads-layout">' + nl, '<style id="uc-threads-layout">' + nl + block + nl);
  fs.writeFileSync(fp, src, 'utf8');
  console.log('added', rel);
}
console.log('\nDone.');
