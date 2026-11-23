import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARK = '/* Undercurrent cursor + interaction feedback */';

const BLOCK = `${MARK}
html { cursor: url('/cursor/uc-default.svg') 2 2, auto; }
a, button, [role="button"], [role="tab"], summary,
input[type="button"], input[type="submit"], label[for], select {
  cursor: url('/cursor/uc-pointer.svg') 10 3, pointer !important;
}
input[type="text"], input[type="search"], textarea { cursor: text; }
button:disabled, [aria-disabled="true"] { cursor: not-allowed !important; }
@media (hover: hover) and (pointer: fine) {
  button:not(:disabled), [role="button"]:not([aria-disabled="true"]) {
    transition: transform 160ms cubic-bezier(.2,.7,.2,1),
                box-shadow 160ms cubic-bezier(.2,.7,.2,1),
                filter 160ms cubic-bezier(.2,.7,.2,1);
  }
  button:not(:disabled):hover, [role="button"]:not([aria-disabled="true"]):hover {
    box-shadow: 0 0 0 1px color-mix(in oklch, var(--primary) 55%, transparent);
  }
  button:not(:disabled):not([class*="scale-"]):not([class*="translate"]):active,
  [role="button"]:not([aria-disabled="true"]):active {
    transform: scale(.96);
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--primary) 75%, transparent);
  }
  a {
    transition: color 160ms cubic-bezier(.2,.7,.2,1),
                transform 160ms cubic-bezier(.2,.7,.2,1);
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
  const start = src.indexOf(MARK);
  if (start < 0) {
    console.log('skip (no marker)', f);
    continue;
  }
  // 找最后一个 } 作为交互块结尾：从 marker 起第一个出现 \n} 的位置（media query 闭合）
  const tail = src.slice(start);
  const lines = tail.split('\n');
  let endLine = -1;
  let depth = 0;
  for (let i = 0; i < lines.length; i++) {
    for (const ch of lines[i]) {
      if (ch === '{') depth++;
      else if (ch === '}') depth--;
    }
    if (depth === 0 && i > 0) { endLine = i; break; }
  }
  if (endLine < 0) { console.log('skip (no end)', f); continue; }
  let consumed = 0;
  for (let i = 0; i <= endLine; i++) consumed += lines[i].length + 1;
  src = src.slice(0, start) + BLOCK + src.slice(start + consumed);
  fs.writeFileSync(fp, src, 'utf8');
  console.log('normalized', f);
}
