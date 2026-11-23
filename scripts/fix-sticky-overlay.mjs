import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ANCHOR = `  /* 单列堆叠后，原来的粘性侧栏会浮在内容上方，必须回到正常流 */
  body > main [class*="lg:sticky"] {
    position: static !important;
  }`;

const NEW = `  /* 左栏布局下，原顶部导航的吸顶偏移(top-16)已失去参照：
     所有 main 内的 sticky 一律回到正常流，避免滚动时浮起覆盖内容 */
  body > main [class*="sticky"] {
    position: static !important;
  }
  /* 筛选条的负边距会让它横向溢出到左栏下方，收敛掉 */
  body > main [class*="-mx-4"] {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }`;

for (const rel of ['public/index.html', ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((x) => x.endsWith('.html')).map((x) => 'snapshots/' + x)]) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('body > main [class*="sticky"]')) {
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
