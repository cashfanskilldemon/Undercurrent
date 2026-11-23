import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CURSOR_DIR = path.join(ROOT, 'public/cursor');

function inner(svg) {
  return svg.replace(/^[\s\S]*?>/, '').replace(/<\/svg>\s*$/, '');
}

const pixel = inner(fs.readFileSync(path.join(CURSOR_DIR, 'uc-pointer.svg'), 'utf8'));
const arrow = inner(fs.readFileSync(path.join(CURSOR_DIR, 'uc-default.svg'), 'utf8'));

const template =
  '<template id="uc-pixel-body">' + pixel + '</template>\n' +
  '<template id="uc-arrow-body">' + arrow + '</template>\n' +
  '<script src="/cursor/uc-cursor.js"></script>\n';

for (const rel of ['public/index.html', ...fs.readdirSync(path.join(ROOT, 'snapshots')).filter((f) => f.endsWith('.html')).map((f) => 'snapshots/' + f)]) {
  const fp = path.join(ROOT, rel);
  let src = fs.readFileSync(fp, 'utf8');
  if (src.includes('uc-cursor.js')) continue;
  // 插到 </body> 前（Netlify 脚本之后，保证 DOM 就绪）
  src = src.replace('</body>', template + '</body>');
  fs.writeFileSync(fp, src, 'utf8');
  console.log('injected', rel);
}

// 保留系统 CSS cursor 作为 fallback（JS 加载失败时仍可用），无需改动 CSS。
console.log('\nDone. DOM cursor injected with 2 middle-finger variants.');
