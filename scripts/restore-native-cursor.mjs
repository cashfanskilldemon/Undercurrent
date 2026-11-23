import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CLEAN_BLOCK = `
/* Undercurrent interaction feedback (no custom cursor — native pointer) */
@media (hover: hover) and (pointer: fine) {
  button:not(:disabled), [role="button"]:not([aria-disabled="true"]) {
    transition: transform 160ms cubic-bezier(.2,.7,.2,1),
                box-shadow 160ms cubic-bezier(.2,.7,.2,1);
  }
  button:not(:disabled):hover, [role="button"]:not([aria-disabled="true"]):hover {
    box-shadow: 0 0 0 1px color-mix(in oklch, var(--primary) 55%, transparent);
  }
  button:not(:disabled):not([class*="scale-"]):not([class*="translate"]):active,
  [role="button"]:not([aria-disabled="true"]):active {
    transform: scale(.96);
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--primary) 75%, transparent);
  }
  a:not([class*="scale-"]):not([class*="translate"]):active { transform: scale(.98); }
}
@media (prefers-reduced-motion: reduce) {
  button:not(:disabled):active, [role="button"]:not([aria-disabled="true"]):active,
  a:active { transform: none; }
}
`;

for (const f of ['public/assets/index-CI3z2CFS.css', 'readable/index-CI3z2CFS.css']) {
  const fp = path.join(ROOT, f);
  let src = fs.readFileSync(fp, 'utf8');

  const start = src.indexOf('/* Undercurrent cursor + interaction feedback */');
  const logoMark = src.indexOf('/* Undercurrent logo: monochrome, rounded */');
  if (start < 0 || logoMark < 0) {
    console.log('skip (markers missing)', f);
    continue;
  }

  // 把从 cursor 注释到 logo 注释之间的所有内容（含历史重复块）整体替换为干净版
  src = src.slice(0, start) + CLEAN_BLOCK.trim() + '\n\n' + src.slice(logoMark);
  fs.writeFileSync(fp, src, 'utf8');
  console.log('cleaned', f);
}

// HTML：移除 DOM 光标脚本与 SVG 模板
for (const rel of ['public/index.html', ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((x) => x.endsWith('.html')).map((x) => 'snapshots/' + x)]) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  const before = src;
  src = src.replace(/<template id="uc-pixel-body">[\s\S]*?<\/template>\s*/g, '');
  src = src.replace(/<template id="uc-arrow-body">[\s\S]*?<\/template>\s*/g, '');
  src = src.replace(/<script src="\/cursor\/uc-cursor\.js"><\/script>\s*/g, '');
  if (src !== before) {
    fs.writeFileSync(fp, src, 'utf8');
    console.log('cleaned', rel);
  }
}

console.log('\nDone. Native pointer restored.');
