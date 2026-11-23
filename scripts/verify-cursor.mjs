import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(ROOT, 'public/index.html'), 'utf8');
const script = fs.readFileSync(path.join(ROOT, 'public/cursor/uc-cursor.js'), 'utf8');

const dom = new JSDOM(html, {
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  url: 'http://127.0.0.1:4173/',
});
const { window } = dom;

window.matchMedia = (q) => ({
  matches: q.includes('hover: hover') || q.includes('prefers-reduced-motion:no-preference'),
  addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {},
});

let rafCount = 0;
window.requestAnimationFrame = () => { rafCount++; return rafCount; };
window.cancelAnimationFrame = () => {};
window.eval(script);

const doc = window.document;
const results = [];
function check(name, pass, extra = '') {
  results.push([name, pass]);
  console.log((pass ? 'PASS' : 'FAIL').padEnd(5), name, extra);
}

check('全局控制 API 创建', !!window.__UC_CURSOR__);
check('默认样式 tabler', window.__UC_CURSOR__?.getStyle() === 'tabler');

const layers = [...doc.querySelectorAll('div[aria-hidden="true"]')];
const cursorLayer = layers.find((d) => d.style.position === 'fixed');
check('光标层 fixed 定位', !!cursorLayer);
check('光标层 pointer-events:none', cursorLayer?.style.pointerEvents === 'none');

const hideStyle = [...doc.querySelectorAll('style')].some((s) => s.textContent.includes('cursor:none !important'));
check('系统光标隐藏规则注入', hideStyle);

const dot = cursorLayer?.firstElementChild;
check('初始为箭头图形', !!dot && dot.innerHTML.length > 100);
check('箭头尺寸 28x32', dot?.style.width === '28px' && dot?.style.height === '32px');

const btn = doc.querySelector('button');
const mouseMove = new window.MouseEvent('mousemove', { bubbles: true, clientX: 100, clientY: 100 });
Object.defineProperty(mouseMove, 'target', { value: btn });
doc.dispatchEvent(mouseMove);
check('hover 按钮切到中指', dot?.innerHTML.includes('f5f5f1'));
check('中指尺寸放大', parseFloat(dot?.style.width) >= 40);

const s2 = window.__UC_CURSOR__.setStyle('tabler');
check('切换到 tabler 版', s2 === 'tabler' && dot?.innerHTML.includes('M8 13'));
const s3 = window.__UC_CURSOR__.setStyle('pixel');
check('切回 pixel 版', s3 === 'pixel' && dot?.innerHTML.includes('f5f5f1'));

check('rAF 按需启动', rafCount > 0);

window.__UC_CURSOR__.destroy();
check('destroy 移除光标层', !doc.querySelector('div[aria-hidden="true"][style*="fixed"]'));
check('destroy 移除 API', !window.__UC_CURSOR__);

const ok = results.filter((r) => r[1]).length;
console.log(`\n${ok}/${results.length} passed`);
process.exit(ok === results.length ? 0 : 1);
