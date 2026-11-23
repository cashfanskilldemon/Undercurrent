import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const block = `
/* Undercurrent cursor + interaction feedback */
@media (hover: hover) and (pointer: fine) {
  html { cursor: url('/cursor/uc-default.svg') 6 3, auto; }
  a, button, [role="button"], [role="tab"], summary,
  input[type="button"], input[type="submit"], label[for], select {
    cursor: url('/cursor/uc-pointer.svg') 14 14, pointer !important;
  }
  input[type="text"], input[type="search"], textarea { cursor: text; }
  button:disabled, [aria-disabled="true"] { cursor: not-allowed !important; }

  /* 按钮：hover 微浮 + 荧光描边，active 按压 */
  button:not(:disabled), [role="button"]:not([aria-disabled="true"]) {
    transition: transform 160ms cubic-bezier(.2,.7,.2,1),
                box-shadow 160ms cubic-bezier(.2,.7,.2,1),
                filter 160ms cubic-bezier(.2,.7,.2,1);
  }
  button:not(:disabled):hover, [role="button"]:not([aria-disabled="true"]):hover {
    box-shadow: 0 0 0 1px color-mix(in oklch, var(--primary) 55%, transparent);
  }
  button:not(:disabled):active, [role="button"]:not([aria-disabled="true"]):active {
    transform: scale(.96);
    box-shadow: 0 0 0 2px color-mix(in oklch, var(--primary) 75%, transparent);
  }
  a {
    transition: color 160ms cubic-bezier(.2,.7,.2,1),
                transform 160ms cubic-bezier(.2,.7,.2,1);
  }
  a:active { transform: scale(.98); }
}

/* 尊重减少动效偏好 */
@media (prefers-reduced-motion: reduce) {
  button:not(:disabled):active, [role="button"]:not([aria-disabled="true"]):active,
  a:active { transform: none; }
}
`;

for (const f of ['public/assets/index-CI3z2CFS.css', 'readable/index-CI3z2CFS.css']) {
  const fp = path.join(ROOT, f);
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('Undercurrent cursor + interaction feedback')) {
    console.log('skip (already applied)', f);
    continue;
  }
  fs.writeFileSync(fp, src + block, 'utf8');
  console.log('updated', f);
}
