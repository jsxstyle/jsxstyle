// Smoke test for the jsxstyle NAPI addon.
// Confirms the native binding loads and a real jsxstyle component both
// transforms (code out) and extracts CSS, using the current transform API.
const path = require('node:path');

const addon = require(path.resolve(__dirname));

const source = [
  "import { Block } from '@jsxstyle/react';",
  'const a = <Block color="red" padding={10} />;',
].join('\n');

const result = addon.transform(source, 'test.tsx', {
  classNameStrategy: 'hash',
  classNamePrefix: '_x',
});

if (!result.code) {
  throw new Error(`Transform produced no code: ${JSON.stringify(result)}`);
}
if (!result.css || !result.css.includes('red')) {
  throw new Error(
    `Transform produced no extracted CSS: ${JSON.stringify(result)}`
  );
}

console.log('NAPI binding test passed');
console.log(`  css: ${JSON.stringify(result.css)}`);
