import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CURSOR_DIR = path.join(ROOT, 'public/cursor');

const GREEN = '#c5e95c';
const DARK = '#0f0e0c';
const WHITE = '#f5f5f1';

// 每套位图自己的配色：箭头沿用荧光绿，中指按参考图用白填充 + 粗黑描边
const PALETTE = {
  arrow: { '1': GREEN, '2': DARK, '3': WHITE },
  pointer: { '1': WHITE, '2': DARK, '3': WHITE },
};

// 位图 → SVG：先给每个主体像素的 3×3 邻域铺黑色描边，再铺主体色。
// 相邻主体之间留的 '.' 空隙会被描边填黑，自然形成指缝。
function render(grid, palette, { unit = 2, outline = 1 } = {}) {
  const h = grid.length;
  const w = Math.max(...grid.map((r) => r.length));
  const off = outline * unit;
  const W = w * unit + off * 2;
  const H = h * unit + off * 2;

  const edgeSet = new Set();
  let body = '';
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const c = grid[y][x];
      if (c === '.') continue;
      const px = off + x * unit;
      const py = off + y * unit;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          edgeSet.add(`${px + dx * unit},${py + dy * unit}`);
        }
      }
      body += `<rect x="${px}" y="${py}" width="${unit}" height="${unit}" fill="${palette[c]}"/>`;
    }
  }
  const edge = [...edgeSet]
    .map((c) => {
      const [x, y] = c.split(',');
      return `<rect x="${x}" y="${y}" width="${unit}" height="${unit}" fill="${DARK}"/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" shape-rendering="crispEdges">
${edge}${body}
</svg>
`;
}

// 经典箭头：荧光绿主体 + 米白高光
const arrow = [
  '1...........',
  '13..........',
  '133.........',
  '1333........',
  '13333.......',
  '133333......',
  '1333333.....',
  '13333333....',
  '133333333...',
  '1333333333..',
  '13333333333.',
  '133333333333',
  '13333222222.',
  '13322000000.',
];

// 像素中指：白色填充 + 粗黑描边，完整手掌；中指竖起，食指/无名指蜷曲，拇指横在左侧
const middle = [
  '.....111.....',
  '.....111.....',
  '.....111.....',
  '.....111.....',
  '.....111.....',
  '.....111.....',
  '.....111.....',
  '.....111.....',
  '...1.111.1...',
  '...1.111.1...',
  '..111111111..',
  '.11111111111.',
  '.11111111111.',
  '.11111111111.',
];

for (const [name, grid, palette] of [
  ['uc-default.svg', arrow, PALETTE.arrow],
  ['uc-pointer.svg', middle, PALETTE.pointer],
]) {
  const svg = render(grid, palette);
  fs.writeFileSync(path.join(CURSOR_DIR, name), svg, 'utf8');
  console.log('generated', name, `${svg.length}B`);
}

// CSS 中的光标规则与热点由 scripts/normalize-cursor-css.mjs 统一管理，这里只生成 SVG。
