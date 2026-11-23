import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const from = 'e))})]}),A.length===0';
const span = ',(0,S.jsx)(`span`,{className:`ml-auto font-mono text-xs text-muted-foreground`,children:`${A.length} 首作品`})';
const to = 'e))})' + span + ']}),A.length===0';

for (const f of ['public/assets/tracks-CqMm_FIX.js', 'readable/tracks-CqMm_FIX.js']) {
  const fp = path.join(ROOT, f);
  let src = fs.readFileSync(fp, 'utf8');
  if (!src.includes(from)) {
    console.log('skip (no match)', f);
    continue;
  }
  src = src.split(from).join(to);
  src = src.replace('(0,S.jsxs)(`p`,{className:`flex items-center gap-2 text-lg font-semibold`', '(0,S.jsxs)(`h3`,{className:`flex items-center gap-2 text-lg font-semibold`');
  fs.writeFileSync(fp, src, 'utf8');
  console.log('updated', f);
}
