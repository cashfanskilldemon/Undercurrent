import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ANCHOR = `  /* 讨论区分类：竖排改为横排（可横向滚动） */
  body > main [class*="lg:flex-col"] {
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
  }`;

const NEW = `  /* 讨论区分类：竖排改为横排（可横向滚动） */
  body > main [class*="lg:flex-col"] {
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
  }
  /* 单列堆叠后，原来的粘性侧栏会浮在内容上方，必须回到正常流 */
  body > main [class*="lg:sticky"] {
    position: static !important;
  }
  body > main [class*="lg:self-start"] {
    align-self: auto !important;
  }`;

for (const rel of ['public/index.html', ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((x) => x.endsWith('.html')).map((x) => 'snapshots/' + x)]) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('lg:sticky"]')) {
    console.log('skip', rel);
    continue;
  }
  if (!src.includes(ANCHOR)) {
    console.log('anchor missing', rel);
    continue;
  }
  src = src.split(ANCHOR).join(NEW);
  fs.writeFileSync(fp, src, 'utf8');
  console.log('updated', rel);
}
console.log('\nDone.');
