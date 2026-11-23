import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(ROOT, 'snapshots/threads.html'), 'utf8');
const inline = html.match(/<style id="uc-threads-layout">([\s\S]*?)<\/style>/)[1];

// 内联规则是否就位
const rules = {
  'body .rounded-sm': /body \.rounded-sm\s*\{[^}]*border-radius:\s*6px !important/.test(inline),
  'body .rounded-md': /body \.rounded-md\s*\{[^}]*border-radius:\s*8px !important/.test(inline),
  'body .rounded-lg': /body \.rounded-lg\s*\{[^}]*border-radius:\s*10px !important/.test(inline),
  'body .rounded-xl': /body \.rounded-xl\s*\{[^}]*border-radius:\s*14px !important/.test(inline),
  '兜底(无rounded类)': /body button:not\(\[class\*="rounded"\]\)[\s\S]*?border-radius:\s*8px !important/.test(inline),
  '排除圆形': /not\(\[class\*="rounded"\]\)/.test(inline),
};

console.log('=== 规则就位 ===');
let ok = 0;
for (const [k, v] of Object.entries(rules)) {
  console.log((v ? 'PASS' : 'FAIL').padEnd(5), k);
  if (v) ok++;
}

// 逐个按钮预测最终圆角
console.log('\n=== 按钮最终圆角预测 ===');
const RADIUS = { 'rounded-xl': 14, 'rounded-lg': 10, 'rounded-md': 8, 'rounded-sm': 6 };
const els = [...html.matchAll(/<(button|select|textarea|a)\b[^>]*class="([^"]*)"[^>]*>/g)];
const seen = new Set();
let checked = 0;
for (const m of els) {
  const tag = m[1], cls = m[2];
  // 只看 main 内的交互控件（粗略：排除 nav 链接）
  if (tag === 'a') continue;
  const roundedClasses = (cls.match(/rounded-\w+/g) || []);
  const full = roundedClasses.includes('rounded-full');
  let value;
  if (full) value = '保持圆形(不受影响)';
  else if (roundedClasses.length) {
    // 取第一个命中的圆角类
    const hit = roundedClasses.find((c) => RADIUS[c]);
    value = hit ? RADIUS[hit] + 'px' : '自定义值';
  } else value = '兜底 8px';
  const key = tag + '|' + value;
  if (seen.has(key)) continue;
  seen.add(key);
  checked++;
  console.log(`  <${tag}> ${value.padEnd(14)} ${cls.slice(0, 46)}`);
}
console.log(`\n规则 ${ok}/${Object.keys(rules).length} 就位，覆盖 ${checked} 类控件`);
