import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pixel = fs.readFileSync(path.join(ROOT, 'public/cursor/uc-pointer.svg'), 'utf8');

// Tabler hand-middle-finger（MIT）+ 白色衬底描边，深色背景上依然清晰
const TABLER_PATHS =
  '<path d="M8 13v-2.5a1.5 1.5 0 0 1 3 0v1.5" />' +
  '<path d="M14 10.5a1.5 1.5 0 0 1 3 0v1.5" />' +
  '<path d="M17 11.5a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1 -6 6h-2h.208a6 6 0 0 1 -5.012 -2.7c-.312 -.479 -1.407 -2.388 -3.286 -5.728a1.5 1.5 0 0 1 .536 -2.022a1.867 1.867 0 0 1 2.28 .28l1.47 1.47" />' +
  '<path d="M11 11.5v-8a1.5 1.5 0 1 1 3 0v8.5" />';
const tabler =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 28 28" width="120" height="120" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
  '<g stroke="#f5f5f1" stroke-width="4.2">' + TABLER_PATHS + '</g>' +
  '<g stroke="#0f0e0c" stroke-width="1.9">' + TABLER_PATHS + '</g>' +
  '</svg>';

const pixelScaled = pixel.replace('width="30" height="32"', 'width="120" height="128"');

const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>cursor compare</title>
<style>body{margin:0;background:#1a1a17;color:#eee;font-family:sans-serif;display:flex;gap:40px;padding:30px;align-items:flex-start}
div{text-align:center}svg{background:#2a2a25;border:1px solid #444} p{margin-top:10px;font-size:14px}</style></head><body>
<div>${pixelScaled}<p>A · 像素中指（当前）</p></div>
<div>${tabler}<p>B · Tabler 矢量（MIT）</p></div>
</body></html>`;

fs.writeFileSync(path.join(ROOT, 'public/cursor-compare.html'), html, 'utf8');
console.log('compare page generated');
