import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bundle = fs.readFileSync(
  path.join(ROOT, 'public/assets/bits-CX_ZQ6ey.js'),
  'utf8',
);

const start = bundle.indexOf('no=[`Boom Bap`');
const end = bundle.indexOf('fo={id:`me`', start);
if (start < 0 || end < 0) {
  throw new Error('Cannot locate the mock-data section in the bundle');
}

// The slice ends right before `,fo=...`, so drop the dangling comma.
const source = ('var ' + bundle.slice(start, end)).replace(/,\s*$/, '');
const context = vm.createContext({});
const data = vm.runInContext(
  source +
    '\n;({genres:no,channels:ro,categories:io,artists:ao,tracks:so,plugins:co,threads:lo,tags:uo})',
  context,
);

const outDir = path.join(ROOT, 'data');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  path.join(outDir, 'mock-data.json'),
  JSON.stringify(data, null, 2) + '\n',
  'utf8',
);

const summary = Object.entries(data)
  .map(([key, value]) => `  ${key}: ${Array.isArray(value) ? value.length : typeof value}`)
  .join('\n');
console.log('Extracted data/mock-data.json\n' + summary);
